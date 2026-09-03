import express from "express";
import OpenAI from "openai";
import {
  createPublicKey,
  randomUUID,
  verify as verifySignature,
} from "crypto";

const BRIDGE_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA7NOnG0MY29jS2V2ueXNsmh3wumny4Gk4w43xZfwdWWU=
-----END PUBLIC KEY-----`;

const publicKey = createPublicKey(BRIDGE_PUBLIC_KEY);
const seenNonces = new Map();
const rateBuckets = new Map();
const MAX_CLOCK_SKEW_MS = 60_000;
const NONCE_TTL_MS = 120_000;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 90;

function pruneState(now) {
  for (const [nonce, expiresAt] of seenNonces.entries()) {
    if (expiresAt <= now) seenNonces.delete(nonce);
  }

  for (const [key, bucket] of rateBuckets.entries()) {
    if (bucket.resetAt <= now) rateBuckets.delete(key);
  }
}

function allowRate(key, now) {
  const current = rateBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (current.count >= RATE_LIMIT) return false;
  current.count += 1;
  return true;
}

function authorize(req) {
  const now = Date.now();
  pruneState(now);

  const timestamp = req.get("x-forge-timestamp") || "";
  const nonce = req.get("x-forge-nonce") || "";
  const signature = req.get("x-forge-signature") || "";
  const timestampNumber = Number(timestamp);

  if (!timestamp || !nonce || !signature || !Number.isFinite(timestampNumber)) {
    return { ok: false, status: 401, reason: "Missing Forge bridge authentication headers." };
  }

  if (Math.abs(now - timestampNumber) > MAX_CLOCK_SKEW_MS) {
    return { ok: false, status: 401, reason: "Forge bridge request timestamp is outside the allowed window." };
  }

  if (seenNonces.has(nonce)) {
    return { ok: false, status: 409, reason: "Forge bridge request nonce was already used." };
  }

  const canonical = `${timestamp}.${nonce}.${JSON.stringify(req.body)}`;
  let valid = false;

  try {
    valid = verifySignature(
      null,
      Buffer.from(canonical, "utf8"),
      publicKey,
      Buffer.from(signature, "base64")
    );
  } catch {
    valid = false;
  }

  if (!valid) {
    return { ok: false, status: 401, reason: "Invalid Forge bridge signature." };
  }

  const rateKey = req.ip || req.socket?.remoteAddress || "unknown";
  if (!allowRate(rateKey, now)) {
    return { ok: false, status: 429, reason: "Forge bridge rate limit exceeded." };
  }

  seenNonces.set(nonce, now + NONCE_TTL_MS);
  return { ok: true };
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter(
      (message) =>
        message &&
        ["system", "user", "assistant"].includes(message.role) &&
        typeof message.content === "string"
    )
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 30_000),
    }));
}

const originalInit = express.application.init;

express.application.init = function forgeBridgeInit(...args) {
  originalInit.apply(this, args);

  this.post(
    "/api/forge-completion",
    express.json({ limit: "1mb" }),
    async (req, res) => {
      const authorization = authorize(req);
      if (!authorization.ok) {
        return res.status(authorization.status).json({
          success: false,
          error: authorization.reason,
        });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "PhantomSync AI provider is not configured.",
        });
      }

      const messages = normalizeMessages(req.body?.messages);
      if (!messages.length) {
        return res.status(400).json({
          success: false,
          error: "At least one Forge AI message is required.",
        });
      }

      const systemInstructions = messages
        .filter((message) => message.role === "system")
        .map((message) => message.content)
        .join("\n\n");

      const conversationInput = messages
        .filter((message) => message.role !== "system")
        .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
        .join("\n\n");

      const responseFormat = req.body?.responseFormat === "json" ? "json" : "text";
      const instructions = [
        systemInstructions,
        responseFormat === "json"
          ? "Return exactly one valid JSON object. Do not wrap it in Markdown or add commentary outside the JSON object."
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const requestedMaxTokens = Number(req.body?.maxTokens);
      const maxOutputTokens = Number.isFinite(requestedMaxTokens)
        ? Math.max(128, Math.min(8_000, Math.floor(requestedMaxTokens)))
        : 2_500;

      try {
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
        const response = await client.responses.create({
          model,
          instructions: instructions || "You are PhantomSync, serving Forge Command.",
          input: conversationInput || "USER: Continue.",
          max_output_tokens: maxOutputTokens,
        });

        const output = response.output_text?.trim();
        if (!output) {
          return res.status(502).json({
            success: false,
            error: "PhantomSync returned an empty AI response.",
          });
        }

        return res.json({
          success: true,
          requestId: randomUUID(),
          output,
          model,
          usage: response.usage
            ? {
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens,
                totalTokens: response.usage.total_tokens,
              }
            : undefined,
        });
      } catch (error) {
        console.error("Forge bridge AI error:", error);
        return res.status(502).json({
          success: false,
          error: error instanceof Error ? error.message : "PhantomSync AI request failed.",
        });
      }
    }
  );
};

await import("./index.js");

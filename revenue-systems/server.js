import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const root = dirname(fileURLToPath(import.meta.url));
const files = {
  '/': ['public/index.html','text/html; charset=utf-8'],
  '/privacy.html': ['public/privacy.html','text/html; charset=utf-8'],
  '/demo.html': ['public/demo.html','text/html; charset=utf-8']
};
const pages = {};
for (const [url,[path]] of Object.entries(files)) pages[url] = await readFile(join(root,path));
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
const volumes = new Set(['0-25','26-100','101-300','300+']);
const rateBuckets = new Map();
function allowApplication(req) {
  const now = Date.now();
  if (rateBuckets.size > 2500) rateBuckets.clear();
  const key = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim().slice(0,128);
  const hits = (rateBuckets.get(key) || []).filter(t => now - t < 3600000);
  if (hits.length >= 5) {rateBuckets.set(key,hits);return false;}
  hits.push(now);
  rateBuckets.set(key,hits);
  return true;
}
const send = (res,status,data,type='application/json; charset=utf-8') => {
  res.writeHead(status, {'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'strict-origin-when-cross-origin'});
  res.end(typeof data==='string'||Buffer.isBuffer(data) ? data : JSON.stringify(data));
};
function validate(a){
  if(!a||typeof a!=='object'||Array.isArray(a))return {error:'Invalid application.'};
  if(typeof a.website==='string'&&a.website.trim())return {honeypot:true};
  const val=(k,max)=>typeof a[k]==='string'?a[k].trim().slice(0,max+1):'';
  const name=val('name',100),business=val('business',120),email=val('email',150).toLowerCase(),volume=val('volume',20),challenge=val('challenge',1200);
  if(a.consent!==true)return {error:'Please consent to pilot contact.'};
  if(!name||name.length>100||!business||business.length>120)return {error:'Please provide a name and business name.'};
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>150)return {error:'Please enter a valid business email.'};
  if(!volumes.has(volume))return {error:'Select an inquiry volume.'};
  if(challenge.length>1200)return {error:'Please shorten the workflow description.'};
  return {data:{name,business,email,volume,challenge}};
}
const server=createServer(async(req,res)=>{
  const path=(req.url||'/').split('?')[0];
  if(req.method==='GET'&&files[path])return send(res,200,pages[path],files[path][1]);
  if(req.method==='GET'&&path==='/api/health')return send(res,200,{ok:true,service:'phantom-forge-revenue-systems',intakeConfigured:!!sql});
  if(path!=='/api/apply')return send(res,404,{ok:false,error:'Not found.'});
  if(req.method!=='POST')return send(res,405,{ok:false,error:'Method not allowed.'});
  if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return send(res,415,{ok:false,error:'JSON required.'});
  const origin=req.headers.origin;
  if(origin){try{if(new URL(origin).host!==req.headers.host)return send(res,403,{ok:false,error:'Origin rejected.'});}catch{return send(res,403,{ok:false,error:'Origin rejected.'});}}
  if(Number(req.headers['content-length']||0)>6000)return send(res,413,{ok:false,error:'Request too large.'});
  let raw='',a;
  try{
    for await(const chunk of req){raw+=chunk.toString();if(raw.length>6000)return send(res,413,{ok:false,error:'Request too large.'});}
    a=JSON.parse(raw);
  }catch{return send(res,400,{ok:false,error:'Invalid request.'});}
  const check=validate(a);
  if(check.error)return send(res,422,{ok:false,error:check.error});
  if(check.honeypot)return send(res,200,{ok:true});
  if(!allowApplication(req))return send(res,429,{ok:false,error:'Too many applications. Please try again later.'});
  if(!sql)return send(res,503,{ok:false,error:'Applications are temporarily unavailable.'});
  const {name,business,email,volume,challenge}=check.data;
  try{
    const query = "INSERT INTO pilot_applications(contact_name,business_name,email,inquiry_volume,bottleneck,consent_to_contact) SELECT $1,$2,$3,$4,$5,true WHERE NOT EXISTS(SELECT 1 FROM pilot_applications WHERE email=$3 AND created_at>now()-interval '1 hour')";
    await sql.query(query,[name,business,email,volume,challenge]);
    return send(res,201,{ok:true});
  }catch{
    return send(res,503,{ok:false,error:'Unable to save the request right now. Please try again later.'});
  }
});
server.listen(Number(process.env.PORT||10000),'0.0.0.0');
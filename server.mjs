import "dotenv/config";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {URL,fileURLToPath} from "node:url";
import crypto from "node:crypto";
import pg from "pg";
import {geminiConfig,generateQuestions} from "./gemini.mjs";

const PORT=Number(process.env.PORT||10000);
const HOST=process.env.HOST||"0.0.0.0";
const ROOT=path.dirname(fileURLToPath(import.meta.url));

const pool=process.env.DATABASE_URL
  ?new pg.Pool({
      connectionString:process.env.DATABASE_URL,
      ssl:process.env.DATABASE_URL.includes("render.com")?{rejectUnauthorized:false}:undefined,
      max:5,
      idleTimeoutMillis:30000,
      connectionTimeoutMillis:10000
    })
  :null;

let wallReady=false;
const wallClients=new Set();
if(pool) pool.on("error",e=>console.error("PG POOL:",e.message));

async function initWall(){
  if(!pool)return;
  await pool.query(`CREATE TABLE IF NOT EXISTS wall_items (
    id TEXT PRIMARY KEY,
    item JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  wallReady=true;
}

async function readWall(){
  const r=await pool.query("SELECT item FROM wall_items ORDER BY created_at DESC LIMIT 100");
  return r.rows.map(({item})=>{
    const copy={...item};
    delete copy.ownerToken;
    return copy;
  });
}

function publicWallItem(item){
  const copy={...item};
  delete copy.ownerToken;
  return copy;
}

function broadcastWall(type,item){
  const payload=JSON.stringify({type,item:item?publicWallItem(item):null});
  for(const client of wallClients){
    try{client.write(`event: wall\ndata: ${payload}\n\n`)}catch{wallClients.delete(client)}
  }
}

function isSafeImage(value){
  return /^data:image\/(?:jpeg|jpg|png|webp|gif);base64,/i.test(String(value||""));
}

async function writeWall(item){
  if(!pool||!wallReady)throw Error("Wall database is not ready");
  const id=String(item.id||"").trim();
  if(!id||id.length>100)throw Error("invalid id");

  const clean={
    id,
    category:String(item.category||"").slice(0,50),
    sub:String(item.sub||"").slice(0,200),
    question:String(item.question||"").slice(0,300),
    answer:String(item.answer||"").slice(0,120),
    image:isSafeImage(item.image)?String(item.image):"",
    filter:["normal","bw","warm"].includes(item.filter)?item.filter:"normal",
    createdAt:String(item.createdAt||""),
    posted:true,
    ownerToken:String(item.ownerToken||"").slice(0,200),
    x:Number.isFinite(Number(item.x))?Math.max(0,Math.min(100,Number(item.x))):null,
    y:Number.isFinite(Number(item.y))?Math.max(0,Math.min(100,Number(item.y))):null,
    rotation:Number.isFinite(Number(item.rotation))?Math.max(-12,Math.min(12,Number(item.rotation))):null
  };

  const exists=await pool.query("SELECT item FROM wall_items WHERE id=$1",[id]);
  if(exists.rowCount&&!clean.ownerToken){
    clean.ownerToken=String(exists.rows[0]?.item?.ownerToken||"").slice(0,200);
  }
  if(!exists.rowCount){
    const h=[...id].reduce((a,c)=>((a*31+c.charCodeAt(0))>>>0),0);
    clean.x=(h%76)+8;
    clean.y=((Math.floor(h/97)%66)+8);
    clean.rotation=[-3,2,-2,3,-1,2][h%6];
  }

  await pool.query(
    "INSERT INTO wall_items(id,item) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET item=EXCLUDED.item",
    [id,clean]
  );
}

const MIME={
  ".html":"text/html; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".js":"text/javascript; charset=utf-8"
};

function send(res,status,type,body){
  res.writeHead(status,{
    "Content-Type":type,
    "Cache-Control":"no-cache",
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Headers":"Content-Type",
    "Access-Control-Allow-Methods":"GET,POST,DELETE,OPTIONS"
  });
  res.end(body);
}
function json(res,status,obj){
  send(res,status,"application/json; charset=utf-8",JSON.stringify(obj));
}

async function readBody(req){
  let s="";
  for await(const c of req){
    s+=c;
    if(s.length>8_000_000)throw new Error("request too large");
  }
  try{return JSON.parse(s||"{}")}
  catch{throw Object.assign(new Error("invalid JSON"),{statusCode:400})}
}

function keysEqual(a,b){
  const aa=Buffer.from(String(a||""));
  const bb=Buffer.from(String(b||""));
  return aa.length>0&&aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);
}

const server=http.createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,`http://${req.headers.host||"localhost"}`);

  if(req.method==="OPTIONS")return send(res,204,"text/plain; charset=utf-8","");

  if(u.pathname==="/api/health"&&req.method==="GET"){
    return json(res,200,{
      ok:true,
      wall:{configured:Boolean(pool),ready:wallReady,adminConfigured:Boolean(String(process.env.ADMIN_KEY||"").trim())},
      gemini:geminiConfig()
    });
  }

  if(u.pathname==="/api/questions"&&req.method==="POST"){
    try{
      const body=await readBody(req);
      return json(res,200,await generateQuestions(body));
    }catch(e){
      console.error("QUESTION API:",e.message);
      return json(res,e.statusCode||502,{error:e.message});
    }
  }

  if(u.pathname==="/api/wall/events"&&req.method==="GET"){
    if(!pool)return json(res,503,{error:"Wall database is not configured"});
    if(!wallReady)return json(res,503,{error:"Wall database is not ready"});
    res.writeHead(200,{
      "Content-Type":"text/event-stream; charset=utf-8",
      "Cache-Control":"no-cache, no-transform",
      "Connection":"keep-alive",
      "Access-Control-Allow-Origin":"*"
    });
    res.write(": connected\n\n");
    wallClients.add(res);
    const heartbeat=setInterval(()=>{try{res.write(": ping\n\n")}catch{}},25000);
    req.on("close",()=>{clearInterval(heartbeat);wallClients.delete(res)});
    return;
  }

  if(u.pathname==="/api/wall"&&req.method==="GET"){
    if(!pool)return json(res,503,{error:"Wall database is not configured"});
    if(!wallReady)return json(res,503,{error:"Wall database is not ready"});
    return json(res,200,{items:await readWall()});
  }

  if(u.pathname==="/api/wall"&&req.method==="POST"){
    if(!pool)return json(res,503,{error:"Wall database is not configured"});
    if(!wallReady)return json(res,503,{error:"Wall database is not ready"});
    const item=await readBody(req);
    if(!item.id)return json(res,400,{error:"id required"});
    await writeWall(item);
    broadcastWall("upsert",item);
    return json(res,200,{ok:true});
  }

  if(u.pathname==="/api/wall"&&req.method==="DELETE"){
    if(!pool)return json(res,503,{error:"Wall database is not configured"});
    if(!wallReady)return json(res,503,{error:"Wall database is not ready"});

    const body=await readBody(req);
    const adminKey=String(body.adminKey||"").trim();
    const configuredAdminKey=String(process.env.ADMIN_KEY||"").trim();

    if(body.all===true||body.adminKey!==undefined){
      if(!configuredAdminKey)return json(res,503,{error:"admin key is not configured"});
      if(!keysEqual(adminKey,configuredAdminKey))return json(res,403,{error:"invalid admin key"});
      if(body.all===true){
        await pool.query("DELETE FROM wall_items");
        broadcastWall("clear",null);
        return json(res,200,{ok:true,all:true});
      }
      if(body.id){
        const result=await pool.query("DELETE FROM wall_items WHERE id=$1",[String(body.id)]);
        if(result.rowCount)broadcastWall("delete",{id:String(body.id)});
        return json(res,result.rowCount?200:404,{ok:Boolean(result.rowCount)});
      }
      return json(res,400,{error:"id or all required"});
    }

    if(!body.id||!body.ownerToken)return json(res,400,{error:"id and ownerToken required"});
    const result=await pool.query(
      "DELETE FROM wall_items WHERE id=$1 AND item->>'ownerToken'=$2",
      [String(body.id),String(body.ownerToken)]
    );
    if(!result.rowCount)return json(res,403,{error:"not owner"});
    broadcastWall("delete",{id:String(body.id)});
    return json(res,200,{ok:true});
  }

  if(req.method==="GET"){
    const p=u.pathname==="/"?"index.html":u.pathname.slice(1);
    const f=path.resolve(ROOT,p);
    if(f.startsWith(ROOT+path.sep)&&fs.existsSync(f)&&fs.statSync(f).isFile()){
      return send(res,200,MIME[path.extname(f)]||"application/octet-stream",fs.readFileSync(f));
    }
  }

  return send(res,404,"text/plain; charset=utf-8","Not found");
 }catch(e){
  console.error("SERVER:",e);
  return json(res,e.statusCode||500,{error:e.message||"server error"});
 }
});

async function boot(){
 try{
  await initWall();
  console.log(`Wall DB: ${wallReady?"ready":"not configured"}`);
 }catch(e){
  wallReady=false;
  console.error("WALL DB INIT:",e.message);
 }
 server.listen(PORT,HOST,()=>{
  const gc=geminiConfig();
  console.log(`청춘묶음: http://${HOST}:${PORT} · Gemini ${gc.configured?"configured":"not configured"} · model=${gc.model} · Wall ${wallReady?"ready":"not ready"}`);
 });
}
boot();

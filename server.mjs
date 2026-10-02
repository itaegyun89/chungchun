import "dotenv/config";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {URL} from "node:url";
import pg from "pg";
import {geminiConfig,generateQuestions} from "./gemini.mjs";
const PORT=Number(process.env.PORT||3000),HOST=process.env.HOST||"0.0.0.0";
const ROOT=path.resolve(new URL(".",import.meta.url).pathname);
const pool=process.env.DATABASE_URL?new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL.includes("render.com")?{rejectUnauthorized:false}:undefined}):null;
let wallReady=false;
async function initWall(){if(!pool)return;await pool.query(`CREATE TABLE IF NOT EXISTS wall_items (id TEXT PRIMARY KEY, item JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);wallReady=true;}
async function readWall(){if(!pool)return [];const r=await pool.query("SELECT item FROM wall_items ORDER BY created_at DESC LIMIT 100");return r.rows.map(x=>x.item)}
async function writeWall(item){if(!pool)throw Error("DATABASE_URL is not configured");await pool.query("INSERT INTO wall_items(id,item) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET item=EXCLUDED.item",[String(item.id),item])}
const MIME={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8"};
function send(res,status,type,body){res.writeHead(status,{"Content-Type":type,"Cache-Control":"no-cache","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"GET,POST,OPTIONS"});res.end(body)}
function json(res,status,obj){send(res,status,"application/json; charset=utf-8",JSON.stringify(obj))}
async function readBody(req){let s="";for await(const c of req){s+=c;if(s.length>200000)throw Error("request too large")}return JSON.parse(s||"{}")}
http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,`http://${req.headers.host||"localhost"}`);
 if(req.method==="OPTIONS")return send(res,204,"text/plain; charset=utf-8","");
 if(u.pathname==="/api/health"&&req.method==="GET")return json(res,200,{ok:true,gemini:geminiConfig()});
 if(u.pathname==="/api/questions"&&req.method==="POST"){try{return json(res,200,await generateQuestions(await readBody(req)))}catch(e){console.error("QUESTION API:",e.message);return json(res,502,{error:e.message})}}
 if(u.pathname==="/api/wall"&&req.method==="GET"){if(!pool)return json(res,503,{error:"Wall database is not configured"});return json(res,200,{items:await readWall()})}
 if(u.pathname==="/api/wall"&&req.method==="POST"){if(!pool)return json(res,503,{error:"Wall database is not configured"});const item=await readBody(req);if(!item.id)return json(res,400,{error:"id required"});await writeWall(item);return json(res,200,{ok:true})}
 if(req.method==="GET"){const p=u.pathname==="/"?"index.html":u.pathname.slice(1),f=path.join(ROOT,p);if(f.startsWith(ROOT)&&fs.existsSync(f)&&fs.statSync(f).isFile())return send(res,200,MIME[path.extname(f)]||"application/octet-stream",fs.readFileSync(f))}
 return send(res,404,"text/plain; charset=utf-8","Not found");
}catch(e){console.error(e);return json(res,500,{error:e.message||"server error"})}}).listen(PORT,HOST,async()=>{try{await initWall();console.log(`Wall DB: ${wallReady?"ready":"not configured"}`)}catch(e){console.error("WALL DB INIT:",e.message)}console.log(`청춘묶음: http://${HOST}:${PORT} · Gemini ${geminiConfig().configured?"configured":"not configured"} · model=${geminiConfig().model}`)});
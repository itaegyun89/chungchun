import "dotenv/config";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {URL} from "node:url";
import {geminiConfig,generateQuestions} from "./gemini.mjs";
const PORT=Number(process.env.PORT||3000),HOST=process.env.HOST||"0.0.0.0";
const ROOT=path.resolve(new URL(".",import.meta.url).pathname);
const MIME={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8"};
function send(res,status,type,body){res.writeHead(status,{"Content-Type":type,"Cache-Control":"no-cache","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"GET,POST,OPTIONS"});res.end(body)}
function json(res,status,obj){send(res,status,"application/json; charset=utf-8",JSON.stringify(obj))}
async function readBody(req){let s="";for await(const c of req){s+=c;if(s.length>200000)throw Error("request too large")}return JSON.parse(s||"{}")}
http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,`http://${req.headers.host||"localhost"}`);
 if(req.method==="OPTIONS")return send(res,204,"text/plain; charset=utf-8","");
 if(u.pathname==="/api/health"&&req.method==="GET")return json(res,200,{ok:true,gemini:geminiConfig()});
 if(u.pathname==="/api/questions"&&req.method==="POST"){try{return json(res,200,await generateQuestions(await readBody(req)))}catch(e){console.error("QUESTION API:",e.message);return json(res,502,{error:e.message})}}
 if(req.method==="GET"){const p=u.pathname==="/"?"index.html":u.pathname.slice(1),f=path.join(ROOT,p);if(f.startsWith(ROOT)&&fs.existsSync(f)&&fs.statSync(f).isFile())return send(res,200,MIME[path.extname(f)]||"application/octet-stream",fs.readFileSync(f))}
 return send(res,404,"text/plain; charset=utf-8","Not found");
}catch(e){console.error(e);return json(res,500,{error:e.message||"server error"})}}).listen(PORT,HOST,()=>console.log(`청춘묶음: http://${HOST}:${PORT} · Gemini ${geminiConfig().configured?"configured":"not configured"} · model=${geminiConfig().model}`));
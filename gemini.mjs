import "dotenv/config";
const API_KEY=process.env.GEMINI_API_KEY||"";
const MODEL=process.env.GEMINI_MODEL||"gemini-3.7-flash";
export function geminiConfig(){return{configured:Boolean(API_KEY),model:MODEL}}
export async function generateQuestions({category,subcategory="",existing=[],count=5}){
 if(!API_KEY)throw new Error("GEMINI_API_KEY is not configured");
 const n=Math.min(Math.max(Number(count)||5,1),8);
 const prompt=["청춘묶음 사진 기록 서비스의 질문을 만든다.",`카테고리: ${category}`,`세부 카테고리: ${subcategory||"없음"}`,`기존 질문: ${existing.join(" | ")}`,"",`한국어 질문 ${n}개만 JSON 배열로 반환한다.`,"서로 의미가 겹치지 않고 사진 한 장과 연결되며 한 문장으로 답할 수 있게 만든다.","설명이나 번호는 넣지 않는다."].join("\n");
 const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(API_KEY)}`;
 const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:"application/json",responseSchema:{type:"array",items:{type:"string"}}}})});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(data?.error?.message||`Gemini HTTP ${r.status}`);
 const text=data?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("")||"[]";
 const questions=JSON.parse(text);
 if(!Array.isArray(questions))throw new Error("Gemini response is not an array");
 return{questions:questions.map(String).map(x=>x.trim()).filter(Boolean)};
}
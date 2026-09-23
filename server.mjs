import 'dotenv/config';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
// Gemini API 키를 코드에 직접 넣고 싶다면 아래 문자열을 바꾸세요.
// 권장 방식은 환경변수(GEMINI_API_KEY)입니다.
const API_KEY = process.env.GEMINI_API_KEY || '여기에_GEMINI_API_KEY_입력';
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const ROOT = path.resolve(new URL('.', import.meta.url).pathname);
const INDEX = path.join(ROOT, 'index.html');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

function send(res, status, type, body) {
  res.writeHead(status, { 'Content-Type': type, ...headers });
  res.end(body);
}
function json(res, status, obj) { send(res, status, 'application/json; charset=utf-8', JSON.stringify(obj)); }

async function readBody(req) {
  let data = '';
  for await (const chunk of req) {
    data += chunk;
    if (data.length > 200_000) throw new Error('request too large');
  }
  return JSON.parse(data || '{}');
}

async function generateQuestions({ category, existing = [], count = 5, hint = '' }) {
  if (!API_KEY) throw new Error('GEMINI_API_KEY is not configured');
  const prompt = `
청춘묶음이라는 청소년용 사진 기록 서비스의 질문을 만들어라.
카테고리: ${category}
기존 질문: ${existing.join(' | ')}
추가 힌트: ${hint || '없음'}

조건:
- 한국어 질문 ${Math.min(Math.max(Number(count) || 5, 1), 8)}개
- 서로 의미가 겹치지 않게
- 사진 한 장과 연결해서 생각할 수 있게
- 한 문장으로 대답할 수 있을 정도로 명확하게
- 날짜/시간에 의존하는 표현은 피하기
- 학교 과제처럼 딱딱하지 않게
- 기존 질문과 사실상 같은 질문을 만들지 않기
- 설명이나 번호 없이 질문만 JSON 배열로 반환
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(API_KEY)}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
  responseMimeType: 'application/json',
  responseSchema: { type: 'array', items: { type: 'string' } }
}
  };
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `Gemini HTTP ${r.status}`);
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '[]';
  let questions;
  try { questions = JSON.parse(text); } catch { questions = []; }
  if (!Array.isArray(questions)) throw new Error('Gemini response is not an array');
  return { questions: questions.map(String).map(x => x.trim()).filter(Boolean) };
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (req.method === 'OPTIONS') return send(res, 204, 'text/plain; charset=utf-8', '');
    if (u.pathname === '/api/questions' && req.method === 'POST') {
      const body = await readBody(req);
      const result = await generateQuestions(body);
      return json(res, 200, result);
    }
    if (u.pathname === '/api/health' && req.method === 'GET') {
      return json(res, 200, { ok: true, geminiConfigured: Boolean(API_KEY), model: MODEL });
    }
    if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/index.html')) {
      return send(res, 200, 'text/html; charset=utf-8', fs.readFileSync(INDEX));
    }
    return send(res, 404, 'text/plain; charset=utf-8', 'Not found');
  } catch (err) {
    return json(res, 500, { error: err.message || 'server error' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`청춘묶음: http://${HOST}:${PORT}`);
  console.log(`Gemini: ${API_KEY && !API_KEY.includes('여기에_GEMINI_API_KEY_입력') ? 'configured' : 'not configured'} · model=${MODEL}`);
});

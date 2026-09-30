/*
 * 청춘묶음 API 연결부
 * Gemini/선생님 API를 바꾸고 싶을 때는 이 파일만 수정하면 됨.
 */
window.ChungChunAPI = (() => {
  const saved = localStorage.getItem("chungchun_api_base");
  const config = { base: saved || "/api" };

  function setBase(value){
    config.base = (value || "/api").trim().replace(/\/$/,"") || "/api";
    localStorage.setItem("chungchun_api_base", config.base);
  }

  async function generateQuestions(payload){
    const res = await fetch(config.base + "/questions", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if(!res.ok) throw new Error(data.error || "API " + res.status);
    return data;
  }

  return { config, setBase, generateQuestions };
})();

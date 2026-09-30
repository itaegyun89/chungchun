(() => {
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const categories={
 "음식":["맛","중식","일식","양식","기타"],"장소":["대구","부산","서울","일본","미국","기타"],
 "물건":["기기","문구","장난감","기타"],"자연":["하늘","식물","동물","풍경","기타"],
 "취미":["음악","운동","그림","코딩","기타"],"게임":["PC","모바일","콘솔","기타"],
 "일상":["집","등교","외출","주말","기타"],"학교":["교실","급식","운동장","기타"]
};
const questions=[
"가장 눈에 띄는 것은?","가장 마음에 드는 부분은?","가장 인상적인 점은?","이것에 별명을 붙인다면?",
"처음 접하게 된 계기는?","가장 기억에 남는 것은?","이것이 나에게 특별한 이유는?"
];
let records=JSON.parse(localStorage.getItem("chungchun_records")||"[]");
let selectedCategory="",selectedSub="",selectedQuestion="",photo="",filter="normal";

function save(){localStorage.setItem("chungchun_records",JSON.stringify(records))}
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1800)}
function page(id){$$(".page").forEach(x=>x.classList.toggle("active",x.id===id));window.scrollTo(0,0)}
$$("[data-page]").forEach(b=>b.onclick=()=>page(b.dataset.page));

function renderCategories(){
 $("#categoryGrid").innerHTML=Object.keys(categories).map((c,i)=>`<button class="cat" data-cat="${c}"><small>0${i+1}</small><strong>${c}</strong><span>${records.filter(r=>r.category===c).length}장</span></button>`).join("");
 $$(".cat").forEach(b=>b.onclick=()=>openCategory(b.dataset.cat));
}
function openCategory(cat){
 selectedCategory=cat;selectedSub="";
 $("#categoryView").classList.add("hidden");$("#questionView").classList.remove("hidden");
 $("#selectedCategory").textContent=cat;
 $("#subcats").innerHTML=categories[cat].map(x=>`<button data-sub="${x}">${x}</button>`).join("");
 $$("#subcats button").forEach(b=>b.onclick=()=>{selectedSub=b.dataset.sub; $$("#subcats button").forEach(x=>x.classList.toggle("active",x===b));renderQuestions()});
 renderQuestions();
}
function renderQuestions(){
 const qs=[...questions];
 const pos=[[8,8], [35,5], [63,13], [20,38], [52,42], [74,50], [5,67], [39,70]];
 $("#questionStage").innerHTML=qs.map((q,i)=>`<button class="film" style="left:${pos[i][0]}%;top:${pos[i][1]}%;--r:${[-4,3,-2,4,-3,2,-4,3][i]}deg" data-q="${q}"><div class="film-photo"></div><q>${q}</q><small>${String(i+1).padStart(2,"0")} / ${selectedSub||selectedCategory}</small></button>`).join("");
 $$(".film").forEach(b=>b.onclick=()=>openEditor(b.dataset.q));
}
function openEditor(q){
 selectedQuestion=q;photo="";filter="normal";$("#answerInput").value="";$("#previewQuestion").textContent=q;$("#previewAnswer").textContent="한 줄로 남겨봐.";$("#previewPhoto").innerHTML="<span>PHOTO</span>";$("#editor").classList.add("show");$("#editor").classList.remove("printing");
 $$(".filter-row button").forEach(x=>x.classList.toggle("active",x.dataset.filter==="normal"));
}
function setPreviewImage(src){
 const cls=filter==="bw"?"filter-bw":filter==="warm"?"filter-warm":"";
 $("#previewPhoto").innerHTML=`<img class="${cls}" src="${src}" alt="">`;
}
$("#answerInput").oninput=e=>$("#previewAnswer").textContent=e.target.value||"한 줄로 남겨봐.";
$("#photoInput").onchange=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{photo=r.result;setPreviewImage(photo)};r.readAsDataURL(f)};
$$("[data-filter]").forEach(b=>b.onclick=()=>{filter=b.dataset.filter;$$(".filter-row button").forEach(x=>x.classList.toggle("active",x===b));if(photo)setPreviewImage(photo)});
$$("[data-close]").forEach(b=>b.onclick=()=>$("#"+b.dataset.close).classList.remove("show"));
$("#backCategories").onclick=()=>{$("#questionView").classList.add("hidden");$("#categoryView").classList.remove("hidden");renderCategories()};

$("#printBtn").onclick=async()=>{
 const answer=$("#answerInput").value.trim();
 if(!photo){toast("사진을 먼저 골라줘");return}
 if(!answer){toast("한 줄 답변을 적어줘");return}
 const btn=$("#printBtn");btn.disabled=true;btn.textContent="인화 중...";
 const rec={id:Date.now(),category:selectedCategory,sub:selectedSub,question:selectedQuestion,answer,image:photo,filter,createdAt:new Date().toISOString()};
 records.push(rec);save();$("#editor").classList.add("printing");
 setTimeout(()=>{btn.disabled=false;btn.textContent="폴라로이드 완성하기";$("#editor").classList.remove("show","printing");renderCategories();renderBundle();renderWall();toast("기록이 묶음에 들어갔어")},1900);
};

function renderBundle(){
 $("#bundleTotal").textContent=records.length+"장";
 const groups={};records.forEach(r=>(groups[r.category]??=[]).push(r));
 const entries=Object.entries(groups);
 $("#folderGrid").innerHTML=entries.length?entries.map(([c,a])=>`<button class="folder" data-cat="${c}"><div class="folder-cover">${a.at(-1).image?`<img src="${a.at(-1).image}" alt="">`:""}</div><div class="folder-info"><strong>${c}</strong><small>${a.length} / 10장</small></div></button>`).join(""):"<div class='settings-card'>아직 기록이 없어.</div>";
 $$(".folder").forEach(b=>b.onclick=()=>openBundle(b.dataset.cat));
}
function openBundle(cat){
 const arr=records.filter(r=>r.category===cat);
 $("#editor").classList.add("show");
 $("#polaroidPreview").innerHTML=arr.length?`<div class="preview-photo"><img src="${arr.at(-1).image}" alt=""></div><div class="preview-copy"><small>${arr.at(-1).question}</small><strong>${arr.at(-1).answer}</strong></div>`:"";
}
function renderWall(){
 const demo=[
  {image:"",answer:"오늘 하늘이 유난히 맑았다."},{image:"",answer:"자주 쓰는 물건 하나."},
  {image:"",answer:"기억해두고 싶은 장소."},{image:"",answer:"좋아하는 게임의 한 장면."}
 ];
 const arr=[...records.slice(-6),...demo].slice(-8);
 $("#wallBoard").innerHTML=arr.map((r,i)=>`<article class="wall-film" data-i="${i}" style="left:${8+(i*17)%78}%;top:${8+(i*23)%76}%;transform:rotate(${[-3,2,-2,3,-1,2][i%6]}deg)"><span class="nail"></span><span class="hammer"></span>${r.image?`<img src="${r.image}" alt="">`:"<div class='wall-placeholder'></div>"}<p>${r.answer}</p></article>`).join("");
 $$(".wall-film").forEach(makeDraggable);
}
function makeDraggable(el){
 let sx=0,sy=0,ox=0,oy=0,drag=false;
 el.onpointerdown=e=>{drag=true;el.setPointerCapture(e.pointerId);sx=e.clientX;sy=e.clientY;const r=el.getBoundingClientRect(),b=$("#wallBoard").getBoundingClientRect();ox=r.left-b.left;oy=r.top-b.top;el.style.zIndex=30};
 el.onpointermove=e=>{if(!drag)return;const b=$("#wallBoard").getBoundingClientRect();el.style.left=Math.max(0,Math.min(b.width-el.offsetWidth,ox+e.clientX-sx))+"px";el.style.top=Math.max(0,Math.min(b.height-el.offsetHeight,oy+e.clientY-sy))+"px"};
 el.onpointerup=()=>{if(!drag)return;drag=false;el.classList.add("hammering","settling");setTimeout(()=>el.classList.remove("hammering","settling"),550)}
}
$("#resetWall").onclick=renderWall;

$("#saveSettings").onclick=()=>{ChungChunAPI.setBase($("#apiBase").value);toast("API 주소를 저장했어")};
$("#apiBase").value=ChungChunAPI.config.base;

// API 호출은 이 함수 하나만 담당. 실패해도 디자인/기록 기능과 분리되어 있음.
window.generateQuestionsFromAPI=async function(category,sub=""){
 try{
  const data=await ChungChunAPI.generateQuestions({category,subcategory:sub,count:5,existing:questions});
  return Array.isArray(data.questions)?data.questions:[];
 }catch(e){console.warn("question API:",e);toast("질문 API 연결을 확인해줘");return []}
};

renderCategories();renderBundle();renderWall();
$$(".topbar nav button,.bottom-nav button").forEach(b=>b.addEventListener("click",()=>page(b.dataset.page)));
})();
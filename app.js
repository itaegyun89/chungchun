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
let records=[];
try{
  const parsed=JSON.parse(localStorage.getItem("chungchun_records")||"[]");
  records=Array.isArray(parsed)?parsed:[];
}catch{
  localStorage.removeItem("chungchun_records");
}
const ownerToken=localStorage.getItem("chungchun_owner_token")||crypto.randomUUID();
localStorage.setItem("chungchun_owner_token",ownerToken);
let selectedWallItem=null;
let sharedWallLoaded=false,wallLoading=false;
let wallEvents=null;
let lastWallTap={id:"",time:0};
let selectedCategory="",selectedSub="",selectedSubs=[],selectedQuestion="",photo="",filter="normal";

function save(){localStorage.setItem("chungchun_records",JSON.stringify(records))}
function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));
}
function safeImageSrc(value){
  const s=String(value||"");
  return /^data:image\/(?:jpeg|jpg|png|webp|gif);base64,/i.test(s)?s:"";
}
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1800)}
function page(id){
  $$(".page").forEach(x=>x.classList.toggle("active",x.id===id));
  window.scrollTo(0,0);
  if(id==="wall"){
    if(!sharedWallLoaded&&!wallLoading)loadWall();
    connectWallEvents();
  }
}
$$("[data-page]").forEach(b=>b.onclick=()=>page(b.dataset.page));

function renderCategories(){
 $("#categoryGrid").innerHTML=Object.keys(categories).map((c,i)=>`<button class="cat" data-cat="${c}"><small>0${i+1}</small><strong>${c}</strong><span>${records.filter(r=>r.category===c).length}장</span></button>`).join("");
 $$(".cat").forEach(b=>b.onclick=()=>openCategory(b.dataset.cat));
}
function openCategory(cat){
 selectedCategory=cat;selectedSub="";selectedSubs=[];
 $("#categoryView").classList.add("hidden");$("#questionView").classList.remove("hidden");
 $("#selectedCategory").textContent=cat;
 $("#subcats").innerHTML=categories[cat].map(x=>`<button data-sub="${x}">#${x}</button>`).join("");
 $("#subcats").onclick=e=>{const b=e.target.closest("button[data-sub]");if(b)toggleSub(b)};
 renderTags(); renderQuestions();
}
function toggleSub(b){let sub=b.dataset.sub;if(sub==="기타"&&!selectedSubs.includes(sub)){const custom=prompt("나를 나타내는 세부 카테고리를 입력해주세요.");if(!custom?.trim())return;sub=custom.trim();b.dataset.sub=sub;b.textContent="#"+sub}if(selectedSubs.includes(sub)){selectedSubs=selectedSubs.filter(x=>x!==sub);b.classList.remove("active")}else if(selectedSubs.length<3){selectedSubs.push(sub);b.classList.add("active")}else{toast("세부 카테고리는 최대 3개까지 선택할 수 있습니다.");return}renderTags();renderQuestions()}
function renderTags(){$("#selectedTags").innerHTML=selectedSubs.map(x=>`<span>#${x}</span>`).join("")}
function renderQuestions(){
 const qs=[...questions];
 const pos=[[8,8],[35,5],[63,13],[20,38],[52,42],[74,50],[5,67],[39,70]];
 $("#questionStage").innerHTML=qs.map((q,i)=>`<button type="button" class="film" style="left:${pos[i][0]}%;top:${pos[i][1]}%;--r:${[-4,3,-2,4,-3,2,-4,3][i]}deg" data-q="${q}"><div class="film-photo"></div><q>${q}</q><small>${String(i+1).padStart(2,"0")} / ${selectedSubs.join(" · ")||selectedCategory}</small></button>`).join("");
 $$(".film").forEach(makeQuestionFilmDraggable);
}
function makeQuestionFilmDraggable(el){
 let dragging=false,moved=false,startX=0,startY=0,startLeft=0,startTop=0,pointerId=null;
 el.addEventListener("pointerdown",e=>{
  if(e.button!==undefined&&e.button!==0)return;
  e.preventDefault();
  e.stopPropagation();
  const stage=$("#questionStage");
  startX=e.clientX;startY=e.clientY;
  startLeft=el.offsetLeft;startTop=el.offsetTop;
  dragging=true;moved=false;pointerId=e.pointerId;
  el.setPointerCapture(e.pointerId);
  el.classList.add("dragging");
  el.style.zIndex=30;
  el.style.transition="none";
  el.style.left=startLeft+"px";
  el.style.top=startTop+"px";
 });
 el.addEventListener("pointermove",e=>{
  if(!dragging||e.pointerId!==pointerId)return;
  e.preventDefault();
  const stage=$("#questionStage").getBoundingClientRect();
  const dx=e.clientX-startX,dy=e.clientY-startY;
  if(Math.hypot(dx,dy)>5)moved=true;
  el.style.left=Math.max(0,Math.min(stage.width-el.offsetWidth,startLeft+dx))+"px";
  el.style.top=Math.max(0,Math.min(stage.height-el.offsetHeight,startTop+dy))+"px";
 });
 const end=e=>{
  if(!dragging||e.pointerId!==pointerId)return;
  e.preventDefault();
  dragging=false;
  try{el.releasePointerCapture(e.pointerId)}catch{}
  el.classList.remove("dragging");
  el.style.transition="";
  if(!moved)openEditor(el.dataset.q);
 };
 el.addEventListener("pointerup",end);
 el.addEventListener("pointercancel",end);
}
function openEditor(q){
 selectedQuestion=q;photo="";filter="normal";$("#answerInput").value="";
 $("#printBtn").style.display="block";$("#postToWallBtn").style.display="none";$("#previewQuestion").textContent=q;$("#previewAnswer").textContent="한 줄로 남겨봐.";$("#previewPhoto").innerHTML="<span>PHOTO</span>";$("#editor").classList.add("show");$("#editor").classList.remove("printing");
 $$(".filter-row button").forEach(x=>x.classList.toggle("active",x.dataset.filter==="normal"));
}
async function compressImage(file){
 const MAX=1600;
 const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
 const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src});
 const scale=Math.min(1,MAX/Math.max(img.naturalWidth,img.naturalHeight));
 const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
 const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
 canvas.getContext("2d").drawImage(img,0,0,w,h);
 return canvas.toDataURL("image/jpeg",0.82);
}
function setPreviewImage(src){
 const cls=filter==="bw"?"filter-bw":filter==="warm"?"filter-warm":"";
 $("#previewPhoto").innerHTML=`<img class="${cls}" src="${src}" alt="">`;
}
$("#answerInput").oninput=e=>$("#previewAnswer").textContent=e.target.value||"한 줄로 답변을 남겨보세요.";
$("#photoInput").onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{photo=await compressImage(f);setPreviewImage(photo)}catch{toast("사진을 불러오지 못했습니다.")}};
$$("[data-filter]").forEach(b=>b.onclick=()=>{filter=b.dataset.filter;$$(".filter-row button").forEach(x=>x.classList.toggle("active",x===b));if(photo)setPreviewImage(photo)});
$$("[data-close]").forEach(b=>b.onclick=()=>$("#"+b.dataset.close).classList.remove("show"));
$("#backCategories").onclick=()=>{$("#questionView").classList.add("hidden");$("#categoryView").classList.remove("hidden");renderCategories()};

$("#postToWallBtn").onclick=()=>{
 const latest=records.at(-1); if(!latest)return;
 postRecordToWall(latest.id,$("#postToWallBtn"));
};
$("#printBtn").onclick=async()=>{
 const answer=$("#answerInput").value.trim();
 if(!photo){toast("사진을 먼저 선택해주세요.");return}
 if(!answer){toast("한 줄 답변을 남겨주세요.");return}
 const btn=$("#printBtn");btn.disabled=true;btn.textContent="인화 중...";
 const rec={id:Date.now(),category:selectedCategory,sub:selectedSubs.join(", "),question:selectedQuestion,answer,image:photo,filter,createdAt:new Date().toISOString(),posted:false,ownerToken};
 records.push(rec);save();
 $("#editor").classList.add("printing");
 setTimeout(()=>{
  btn.disabled=false;btn.textContent="완성된 필름";
  $("#editor").classList.remove("printing");
  $("#printBtn").style.display="none";
  $("#postToWallBtn").style.display="block";
  renderCategories();renderBundle();toast("폴라로이드가 완성되었습니다.");
 },1700);
};

function renderBundle(){
 $("#bundleTotal").textContent=records.length+"장";
 const groups={};records.forEach(r=>(groups[r.category]??=[]).push(r));
 const entries=Object.entries(groups);
 $("#folderGrid").innerHTML=entries.length?entries.map(([c,a])=>`<button class="folder" data-cat="${c}"><div class="folder-cover">${safeImageSrc(a.at(-1).image)?`<img src="${safeImageSrc(a.at(-1).image)}" alt="">`:""}</div><div class="folder-info"><strong>${c}</strong><small>${a.length} / 10장</small></div></button>`).join(""):"<div class='settings-card'>아직 기록이 없어.</div>";
 $$(".folder").forEach(b=>b.onclick=()=>openBundle(b.dataset.cat));
}
async function openBundle(cat){
 // 새로고침 직후에는 localStorage의 posted 값이 예전 상태일 수 있다.
 // 묶음을 열 때 서버의 현재 벽 상태를 먼저 확인해서 버튼 상태를 결정한다.
 if(!sharedWallLoaded){
  await loadWall(true);
 }
 const arr=records.filter(r=>r.category===cat);
 const wallIds=new Set((window.sharedWall||[]).map(x=>String(x.id)));
 $("#bundleModalTitle").textContent=cat;
 $("#bundleModalCount").textContent=arr.length+" / 10장";
 $("#bundleCards").innerHTML=arr.map(r=>`<article class="bundle-card">
   <div class="bundle-photo"><img class="filter-${r.filter||"normal"}" src="${r.image}" alt=""></div>
   <div class="bundle-copy"><small>${r.question}</small><strong>${r.answer}</strong></div>
   <button class="post-one" data-id="${r.id}">${wallIds.has(String(r.id))?"게시됨":"게시판에 올리기"}</button>
 </article>`).join("");
 $("#bundleModal").classList.add("show");
 $(".post-one").forEach(b=>b.onclick=()=>postRecordToWall(b.dataset.id,b));
}
async function postRecordToWall(id,button){
 const rec=records.find(r=>String(r.id)===String(id)); if(!rec)return;
 if(rec.posted){toast("이미 게시된 필름이야.");return}
 button.disabled=true;button.textContent="게시 중...";
 const markPosted=()=>{rec.posted=true;save();if(button){button.disabled=false;button.textContent="게시됨";}};
 try{
  const r=await fetch("https://ceongcunmuggeum.onrender.com/api/wall",{
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify({...rec})
  });
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d.error||("wall "+r.status));

  // 서버 저장 성공을 확인했으므로, 이후 화면 갱신 오류 때문에
  // "게시 실패"로 오인하지 않도록 저장과 UI 갱신을 분리한다.
  markPosted();
  const postedItem={...rec};
  window.sharedWall=Array.isArray(window.sharedWall)?window.sharedWall:[];
  const idx=window.sharedWall.findIndex(x=>String(x.id)===String(rec.id));
  if(idx>=0)window.sharedWall[idx]=postedItem;else window.sharedWall.unshift(postedItem);
  sharedWallLoaded=true;

  try{renderWall();renderBundle();}catch(uiError){console.warn("wall UI refresh:",uiError)}
  toast("게시판에 올렸어.");
 }catch(e){
  // 네트워크가 응답 전에 끊겨도 서버에는 저장됐을 수 있으므로 한 번 확인한다.
  try{
   const check=await fetch("https://ceongcunmuggeum.onrender.com/api/wall",{cache:"no-store"});
   const data=await check.json().catch(()=>({}));
   if(check.ok&&Array.isArray(data.items)&&data.items.some(x=>String(x.id)===String(rec.id))){
    window.sharedWall=data.items;sharedWallLoaded=true;markPosted();
    try{renderWall();renderBundle();}catch(uiError){console.warn("wall UI refresh:",uiError)}
    toast("게시판에 올렸어.");
    return;
   }
  }catch(checkError){console.warn("wall save verification:",checkError)}
  button.disabled=false;button.textContent=rec.posted?"게시됨":"게시판에 올리기";
  toast("게시판 연결에 실패했어: "+e.message);
}
}
function connectWallEvents(){
 if(wallEvents||typeof EventSource==="undefined")return;
 wallEvents=new EventSource("https://ceongcunmuggeum.onrender.com/api/wall/events");
 wallEvents.addEventListener("wall",e=>{
  try{
   const msg=JSON.parse(e.data);
   if(msg.type==="upsert"&&msg.item){
    window.sharedWall=Array.isArray(window.sharedWall)?window.sharedWall:[];
    const idx=window.sharedWall.findIndex(x=>String(x.id)===String(msg.item.id));
    if(idx>=0)window.sharedWall[idx]=msg.item;else window.sharedWall.unshift(msg.item);
    const rec=records.find(x=>String(x.id)===String(msg.item.id));
    if(rec){rec.posted=true;save()}
   }else if(msg.type==="delete"&&msg.item?.id){
    window.sharedWall=(window.sharedWall||[]).filter(x=>String(x.id)!==String(msg.item.id));
    const rec=records.find(x=>String(x.id)===String(msg.item.id));
    if(rec){rec.posted=false;save()}
   }else if(msg.type==="clear"){
    window.sharedWall=[];
    records.forEach(r=>r.posted=false);save();
   }
   sharedWallLoaded=true;
   renderWall();renderBundle();
  }catch(err){console.warn("wall event:",err)}
 });
 wallEvents.onerror=()=>console.warn("wall realtime connection lost; browser will retry automatically");
}

async function loadWall(preserveOnError=false){
 wallLoading=true;renderWall();
 try{
  const r=await fetch("https://ceongcunmuggeum.onrender.com/api/wall",{cache:"no-store"});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d.error||("wall get "+r.status));
  if(!Array.isArray(d.items))throw new Error("invalid wall response");
  window.sharedWall=d.items;sharedWallLoaded=true;
  const ids=new Set(d.items.map(x=>String(x.id)));let changed=false;
  records.forEach(rec=>{const next=ids.has(String(rec.id));if(rec.posted!==next){rec.posted=next;changed=true;}});
  if(changed)save();
  renderWall();renderBundle();
 }catch(e){console.warn("wall sync failed:",e);if(!preserveOnError)toast("벽을 불러오지 못했어: "+e.message);}
}
function renderWall(){
 const arr=(window.sharedWall||[]);
 $("#wallBoard").innerHTML=arr.map((r,i)=>{
  const image=safeImageSrc(r.image);
  const id=escapeHtml(r.id);
  return `<article class="wall-film" data-id="${id}" style="left:${Number.isFinite(Number(r.x))?Number(r.x):8+(i*17)%78}%;top:${Number.isFinite(Number(r.y))?Number(r.y):8+(i*23)%76}%;transform:rotate(${Number.isFinite(Number(r.rotation))?Number(r.rotation):[-3,2,-2,3,-1,2][i%6]}deg)">
    <span class="nail"></span><span class="hammer"></span>
    ${image?`<img src="${image}" alt="">`:"<div class='wall-placeholder'></div>"}
    <p>${escapeHtml(r.answer)}</p>
  </article>`;
 }).join("");
 $(".wall-film").forEach(el=>makeDraggable(el));
}
function makeDraggable(el){
 let sx=0,sy=0,ox=0,oy=0,drag=false,moved=false;
 el.onpointerdown=e=>{drag=true;moved=false;el.setPointerCapture(e.pointerId);sx=e.clientX;sy=e.clientY;const r=el.getBoundingClientRect(),b=$("#wallBoard").getBoundingClientRect();ox=r.left-b.left;oy=r.top-b.top;el.style.zIndex=30};
 el.onpointermove=e=>{if(!drag)return;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.hypot(dx,dy)>6)moved=true;const b=$("#wallBoard").getBoundingClientRect();el.style.left=Math.max(0,Math.min(b.width-el.offsetWidth,ox+dx))+"px";el.style.top=Math.max(0,Math.min(b.height-el.offsetHeight,oy+dy))+"px"};
 el.onpointerup=async e=>{
  if(!drag)return;drag=false;try{el.releasePointerCapture(e.pointerId)}catch{}
  if(!moved){const now=Date.now(),id=String(el.dataset.id);if(lastWallTap.id===id&&now-lastWallTap.time<420){lastWallTap={id:"",time:0};openWallDetail(id)}else lastWallTap={id,time:now}}else lastWallTap={id:"",time:0};
  el.classList.add("hammering","settling");
  const item=(window.sharedWall||[]).find(x=>String(x.id)===String(el.dataset.id));
  if(item){const board=$("#wallBoard");item.x=(el.offsetLeft/Math.max(1,board.clientWidth))*100;item.y=(el.offsetTop/Math.max(1,board.clientHeight))*100;try{await fetch("https://ceongcunmuggeum.onrender.com/api/wall",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(item)})}catch{}}
  setTimeout(()=>el.classList.remove("hammering","settling"),550);
 };
}
async function openWallDetail(id){
 const item=(window.sharedWall||[]).find(x=>String(x.id)===String(id));if(!item)return;
 selectedWallItem=item;
 $("#wallDetailPhoto").innerHTML=safeImageSrc(item.image)?'<img src="'+safeImageSrc(item.image)+'" alt="">':'<div class="wall-detail-placeholder"></div>';
 $("#wallDetailQuestion").textContent=item.question||"";
 $("#wallDetailAnswer").textContent=item.answer||"";
 const mine=String(records.find(r=>String(r.id)===String(item.id))?.ownerToken||"")===ownerToken;
 $("#wallDeleteBtn").style.display=mine?"inline-flex":"none";
 $("#wallOwnerHint").textContent=mine?"내가 올린 필름":"게시자가 아닌 필름";
 $("#wallDetailModal").classList.add("show");
}
$("#wallDeleteBtn").onclick=async()=>{
 if(!selectedWallItem||String(records.find(r=>String(r.id)===String(selectedWallItem.id))?.ownerToken||"")!==ownerToken)return;
 try{
  const r=await fetch("https://ceongcunmuggeum.onrender.com/api/wall",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:selectedWallItem.id,ownerToken})});
  if(!r.ok)throw new Error("delete");
  window.sharedWall=(window.sharedWall||[]).filter(x=>String(x.id)!==String(selectedWallItem.id));
  const rec=records.find(x=>String(x.id)===String(selectedWallItem.id));if(rec){rec.posted=false;save();}
  $("#wallDetailModal").classList.remove("show");selectedWallItem=null;renderWall();toast("게시판에서 삭제했어.");
 }catch{toast("삭제에 실패했어.");}
};
$("#resetWall").onclick=loadWall;
let developerAdminKey=sessionStorage.getItem("chungchun_admin_key")||"";
async function developerDeleteAll(){
 const key=developerAdminKey||prompt("개발자 관리자 키를 입력해주세요.");
 if(!key)return;
 try{
  const r=await fetch("https://ceongcunmuggeum.onrender.com/api/wall",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({all:true,adminKey:String(key).trim()})});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d.error||("HTTP "+r.status));
  developerAdminKey=String(key).trim();sessionStorage.setItem("chungchun_admin_key",developerAdminKey);
  window.sharedWall=[];renderWall();toast("벽의 모든 게시물을 삭제했어.");
  }catch(e){
   if(/invalid admin key|admin key is not configured/i.test(e.message)){
     sessionStorage.removeItem("chungchun_admin_key");
     developerAdminKey="";
   }
   toast("개발자 작업 실패: "+e.message);
 }
}
$("#developerWallBtn").onclick=developerDeleteAll;

$("#saveSettings").onclick=()=>{ChungChunAPI.setBase($("#apiBase").value);toast("API 주소를 저장했어")};
$("#apiBase").value=ChungChunAPI.config.base;
async function generateAI(){$("#aiModal").classList.add("show");$("#aiQuestionList").innerHTML="";$("#aiStatus").textContent="추가 지시사항을 입력한 뒤 질문 만들기를 눌러주세요.";}
async function runAI(){$("#aiStatus").textContent="질문을 만들고 있습니다...";try{const qs=await window.generateQuestionsFromAPI(selectedCategory,selectedSubs.join(", "),$("#aiInstruction").value.trim());$("#aiQuestionList").innerHTML="";qs.forEach(q=>{const b=document.createElement("button");b.type="button";b.textContent=q;b.dataset.aiQ=q;$("#aiQuestionList").appendChild(b)});if(!qs.length)throw new Error("empty questions");$("#aiStatus").textContent="사용할 질문을 선택해주세요.";$("#aiQuestionList").querySelectorAll("button[data-ai-q]").forEach(b=>b.onclick=()=>{$("#aiModal").classList.remove("show");openEditor(b.dataset.aiQ)})}catch{$("#aiStatus").textContent="질문을 만들지 못했습니다. API 연결을 확인해주세요."}}
$("#aiQuestionsBtn").onclick=generateAI;$("#aiGenerateAgain").onclick=runAI;$("#directQuestionBtn").onclick=()=>{$("#directQuestionInput").value="";$("#directModal").classList.add("show")};$("#directQuestionSave").onclick=()=>{const q=$("#directQuestionInput").value.trim();if(!q){toast("질문을 입력해주세요.");return}$("#directModal").classList.remove("show");openEditor(q)};

// API 호출은 이 함수 하나만 담당. 실패해도 디자인/기록 기능과 분리되어 있음.
window.generateQuestionsFromAPI=async function(category,sub="",instruction=""){
 try{
  const data=await ChungChunAPI.generateQuestions({category,subcategory:sub,count:5,existing:questions,instruction});
  if(!Array.isArray(data.questions)||!data.questions.length)throw new Error("empty questions");return data.questions;
 }catch(e){console.warn("question API:",e);toast("질문 API 연결을 확인해줘");return []}
};

renderCategories();renderBundle();renderWall();
$$(".topbar nav button,.bottom-nav button").forEach(b=>b.addEventListener("click",()=>page(b.dataset.page)));
})();
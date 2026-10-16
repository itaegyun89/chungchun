(() => {
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const WALL_API="https://ceongcunmuggeum.onrender.com/api/wall";
const categories={
 "음식":["맛","중식","일식","양식","기타"],"장소":["대구","부산","서울","일본","미국","기타"],
 "물건":["기기","문구","장난감","기타"],"자연":["하늘","식물","동물","풍경","기타"],
 "취미":["음악","운동","그림","코딩","기타"],"게임":["PC","모바일","콘솔","기타"],
 "일상":["집","등교","외출","주말","기타"],"학교":["교실","급식","운동장","기타"]
};
const questions={
 "음식":[
  "가장 눈에 띄는 것은?","가장 마음에 드는 부분은?","가장 인상적인 점은?","이것에 별명을 붙인다면?",
  "처음 접했을 때, 나는 몇 살이었는가?","처음 접하게 된 계기는?","가장 기억에 남는 것은?","이것이 나에게 특별한 이유는?",
  "이 음식의 맛을 다른 음식에 비유한다면?","이 음식에서 가장 예상 밖이었던 점은?"
 ],
 "장소":[
  "가장 눈에 띄는 것은?","가장 마음에 드는 부분은?","가장 인상적인 점은?","이곳에 별명을 붙인다면?",
  "처음 이곳에 왔을 때, 나는 몇 살이었는가?","처음 오게 된 계기는?","가장 기억에 남는 것은?","이곳이 나에게 특별한 이유는?",
  "이 장소에서 가장 오래 머물고 싶은 곳은 어디인가?","이 장소에서 꼭 해보고 싶은 것은?"
 ],
 "물건":[
  "가장 눈에 띄는 것은?","가장 마음에 드는 부분은?","가장 인상적인 점은?","이것에 별명을 붙인다면?",
  "처음 접했을 때, 나는 몇 살이었는가?","처음 갖게 된 계기는?","가장 기억에 남는 것은?","이 물건이 나에게 특별한 이유는?",
  "이 물건이 없어진다면 가장 아쉬울 것은?","이 물건을 가장 오래 사용한 기간은 약 얼마인가?"
 ],
 "자연":[
  "가장 눈에 띄는 것은?","가장 마음에 드는 부분은?","가장 인상적인 점은?","이것에 별명을 붙인다면?",
  "처음 본 때, 나는 몇 살이었는가?","처음 보게 된 계기는?","가장 기억에 남는 것은?","이 자연이 나에게 특별한 이유는?",
  "이 자연에서 가장 독특한 모양은?","이 자연과 관련된 가장 기억에 남는 추억은?"
 ],
 "취미":[
  "가장 눈에 띄는 것은?","가장 마음에 드는 부분은?","가장 인상적인 점은?","이것에 별명을 붙인다면?",
  "처음 접했을 때, 나는 몇 살이었는가?","처음 알게 된 계기는?","이 취미를 하면서 가장 기억에 남는 것은?","이 취미가 나에게 특별한 이유는?",
  "이 취미를 하면서 가장 뿌듯했던 순간은?","이 취미를 하면서 생긴 습관은?"
 ],
 "게임":[
  "가장 인상적인 점은?","이 게임에서 가장 기억에 남는 장면은?","이 게임에서 가장 좋아하는 캐릭터는?",
  "이 게임을 처음 플레이했을 때, 나는 몇 살이었는가?","이 게임을 시작하게 된 계기는?","이 게임에서 가장 어려웠던 것은?",
  "이 게임에서 가장 자주 사용하는 것은?","이 게임을 하면서 가장 많이 배운 것은?","이 게임을 한 문장으로 소개한다면?",
  "이 게임을 그만두기 어려운 이유는?"
 ],
 "일상":[
  "일상에서 가장 익숙한 것은?","일상에서 가장 자주 하는 행동은?","일상에서 나도 모르게 생긴 습관은?",
  "일상에서 없으면 불편할 것 같은 것은?","일상에서 가장 사소하지만 좋아하는 것은?","일상에서 가장 편안함을 느끼는 순간은?",
  "일상에서 가장 자주 보는 것은?","일상에서 가장 자주 듣는 소리는?","일상에서 나를 웃게 만드는 것은?",
  "일상에 새롭게 생겼으면 하는 것은?"
 ],
 "학교":[
  "가장 눈에 띄는 것은?","가장 마음에 드는 부분은?","가장 인상적인 점은?","이곳에 별명을 붙인다면?",
  "처음 이 학교에 왔을 때, 나는 몇 살이었는가?","처음 기억에 남은 계기는?","가장 기억에 남는 것은?","이곳이 나에게 특별한 이유는?",
  "학교에서 가장 좋아하는 공간은?","학교에서 가장 기억에 남는 순간은?"
 ]
};
let records=[];
try{
  const parsed=JSON.parse(localStorage.getItem("chungchun_records")||"[]");
  records=Array.isArray(parsed)?parsed:[];
}catch{
  localStorage.removeItem("chungchun_records");
}
const ownerToken=localStorage.getItem("chungchun_owner_token")||crypto.randomUUID();
localStorage.setItem("chungchun_owner_token",ownerToken);
let currentUser=null;
let accountSyncTimer=null;
let accountSyncing=false;
let accountSyncPending=false;
let authMode="login";
let selectedWallItem=null;
let sharedWallLoaded=false,wallLoading=false;
let wallEvents=null;
let wallPollTimer=null;
let wallRequestController=null;
let lastWallTap={id:"",time:0};
let selectedCategory="",selectedSub="",selectedSubs=[],selectedQuestion="",photo="",filter="normal";

function save(syncAccount=true){
  localStorage.setItem("chungchun_records",JSON.stringify(records));
  if(syncAccount&&currentUser){
    clearTimeout(accountSyncTimer);
    accountSyncTimer=setTimeout(()=>pushAccountRecords().catch(e=>console.warn("account sync:",e)),650);
  }
}
async function accountFetch(url,options={}){
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  const response=await fetch(url,{credentials:"same-origin",...options,headers});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||("HTTP "+response.status));
  return data;
}
async function pushAccountRecords(){
  if(!currentUser)return;
  if(accountSyncing){accountSyncPending=true;return}
  accountSyncing=true;
  try{
    await accountFetch("/api/account/records",{method:"POST",body:JSON.stringify({records})});
  }finally{
    accountSyncing=false;
    if(accountSyncPending){
      accountSyncPending=false;
      clearTimeout(accountSyncTimer);
      accountSyncTimer=setTimeout(()=>pushAccountRecords().catch(e=>console.warn("account sync:",e)),150);
    }
  }
}
async function syncAccountRecords(mergeLocal=true){
  // Retry any deletions that could not reach the account server earlier.
  let tombstones=[];
  try{tombstones=JSON.parse(localStorage.getItem("chungchun_deleted_records")||"[]")}catch{}
  const pending=new Set(Array.isArray(tombstones)?tombstones.map(String):[]);
  for(const id of pending){
    try{
      await accountFetch("/api/account/records",{method:"DELETE",body:JSON.stringify({id})});
      pending.delete(id);
    }catch(e){console.warn("pending record deletion:",id,e.message)}
  }
  localStorage.setItem("chungchun_deleted_records",JSON.stringify([...pending]));
  const data=await accountFetch("/api/account/records");
  const remote=(Array.isArray(data.records)?data.records:[]).filter(r=>!pending.has(String(r.id))&&!tombstones.includes(String(r.id)));
  if(mergeLocal){
    const merged=new Map(remote.map(r=>[String(r.id),r]));
    records.filter(r=>!pending.has(String(r.id))&&!tombstones.includes(String(r.id))).forEach(r=>merged.set(String(r.id),r));
    records=[...merged.values()].sort((a,b)=>String(a.createdAt||"").localeCompare(String(b.createdAt||"")));
    await accountFetch("/api/account/records",{method:"POST",body:JSON.stringify({records})});
  }else{
    records=remote;
  }
  localStorage.setItem("chungchun_records",JSON.stringify(records));
  localStorage.setItem("chungchun_last_account",currentUser.username);
  renderCategories();renderBundle();
}
function renderAccountUI(){
  $("#accountStatus").textContent=currentUser?currentUser.username:"게스트";
  $("#accountBtn").textContent=currentUser?"계정":"로그인";
  $("#authTitle").textContent=currentUser?"계정":"로그인";
  $("#authDescription").textContent=currentUser?"로그인된 계정으로 묶음이 저장되고 있어.":"계정에 묶음을 저장하고 다른 기기에서도 이어서 기록해.";
  $("#authForm").style.display=currentUser?"none":"block";
  $("#authLogout").style.display=currentUser?"block":"none";
  $("#authLoginTab").style.display=currentUser?"none":"block";
  $("#authRegisterTab").style.display=currentUser?"none":"block";
  $("#authMessage").textContent=currentUser?"현재 계정에 기록을 동기화하고 있어.":"";
  $("#authMessage").className="auth-message";
}
function setAuthMode(mode){
  authMode=mode;
  $("#authLoginTab").classList.toggle("active",mode==="login");
  $("#authRegisterTab").classList.toggle("active",mode==="register");
  $("#authTitle").textContent=mode==="login"?"로그인":"회원가입";
  $("#authSubmit").textContent=mode==="login"?"로그인":"계정 만들기";
  $("#authPassword").autocomplete=mode==="login"?"current-password":"new-password";
  $("#authHint").textContent=mode==="login"?"비밀번호 찾기 기능은 제공하지 않아. 잊지 않도록 보관해줘.":"아이디 3~24자, 비밀번호 4자 이상. 숫자나 특수기호는 필수가 아니야.";
  $("#authMessage").textContent="";
  $("#authMessage").className="auth-message";
}
async function restoreAccountSession(){
  try{
    const data=await accountFetch("/api/auth/me");
    if(!data.user){renderAccountUI();return}
    currentUser=data.user;
    const previous=localStorage.getItem("chungchun_last_account");
    await syncAccountRecords(!previous||previous===currentUser.username);
    renderAccountUI();
  }catch(e){
    console.warn("account session restore:",e);
    renderAccountUI();
  }
}
$("#accountBtn").onclick=()=>{
  renderAccountUI();
  if(!currentUser)setAuthMode("login");
  $("#authModal").classList.add("show");
};
$("#authLoginTab").onclick=()=>setAuthMode("login");
$("#authRegisterTab").onclick=()=>setAuthMode("register");
$("#authForm").onsubmit=async e=>{
  e.preventDefault();
  const username=$("#authUsername").value.trim(),password=$("#authPassword").value;
  const submit=$("#authSubmit"),message=$("#authMessage");
  submit.disabled=true;submit.textContent="처리 중...";
  message.textContent="";message.className="auth-message";
  try{
    const endpoint=authMode==="login"?"/api/auth/login":"/api/auth/register";
    const data=await accountFetch(endpoint,{method:"POST",body:JSON.stringify({username,password})});
    currentUser=data.user;
    const previous=localStorage.getItem("chungchun_last_account");
    await syncAccountRecords(!previous||previous===currentUser.username);
    renderAccountUI();
    $("#authPassword").value="";
    $("#authModal").classList.remove("show");
    toast(authMode==="login"?"로그인했어. 묶음을 불러왔어.":"회원가입 완료! 기존 기록도 계정에 저장했어.");
  }catch(err){
    message.textContent=err.message||"요청을 처리하지 못했어.";
    message.className="auth-message error";
  }finally{
    submit.disabled=false;submit.textContent=authMode==="login"?"로그인":"계정 만들기";
  }
};
$("#authLogout").onclick=async()=>{
  try{
    await pushAccountRecords();
    await accountFetch("/api/auth/logout",{method:"POST",body:"{}"});
  }catch(e){
    console.warn("logout:",e);
    toast("계정 저장에 실패했어. 연결을 확인한 뒤 다시 시도해줘.");
    return;
  }
  clearTimeout(accountSyncTimer);
  currentUser=null;records=[];
  localStorage.setItem("chungchun_records","[]");
  localStorage.removeItem("chungchun_last_account");
  renderCategories();renderBundle();renderAccountUI();
  $("#authModal").classList.remove("show");
  toast("로그아웃했어.");
}
function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));
}
function safeImageSrc(value){
  const s=String(value||"");
  return /^data:image\/(?:jpeg|jpg|png|webp|gif);base64,/i.test(s)?s:"";
}
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");clearTimeout(e._timer);e._timer=setTimeout(()=>e.classList.remove("show"),2200)}
function appDialog(title,message,mode="confirm",placeholder="",okText="확인",danger=false){
 return new Promise(resolve=>{
  const modal=$("#appDialog"),input=$("#appDialogInput"),ok=$("#appDialogConfirm"),cancel=$("#appDialogCancel");
  $("#appDialogTitle").textContent=title;$("#appDialogMessage").textContent=message;input.value="";input.placeholder=placeholder;input.style.display=mode==="prompt"?"block":"none";ok.textContent=okText;ok.classList.toggle("app-dialog-danger",danger);modal.classList.add("show");
  let done=false;const close=value=>{if(done)return;done=true;modal.classList.remove("show");modal.onclick=null;document.removeEventListener("keydown",onKey);resolve(value)};
  const onKey=e=>{if(e.key==="Escape")close(mode==="prompt"?null:false);if(e.key==="Enter"&&mode==="prompt"&&document.activeElement===input)close(input.value.trim()||null)};
  modal.onclick=e=>{if(e.target===modal)close(mode==="prompt"?null:false)};document.addEventListener("keydown",onKey);
  cancel.onclick=()=>close(mode==="prompt"?null:false);ok.onclick=()=>close(mode==="prompt"?(input.value.trim()||null):true);(mode==="prompt"?input:ok).focus();
 });
}
function page(id,addHistory=true){
  const target=$("#"+id);
  if(!target||!target.classList.contains("page"))return;
  const current=$$(".page").find(x=>x.classList.contains("active"))?.id;
  if(addHistory&&current!==id){
    try{history.pushState({chungchunPage:id},"","#"+id)}catch{}
  }
  $$(".page").forEach(x=>x.classList.toggle("active",x.id===id));
  window.scrollTo(0,0);
}
const initialPage=$$(".page").find(x=>x.classList.contains("active"))?.id||"home";
try{history.replaceState({chungchunPage:initialPage},"","#"+initialPage)}catch{}
window.addEventListener("popstate",event=>{
  const id=event.state?.chungchunPage;
  if(id&&$("#"+id)?.classList.contains("page"))page(id,false);
  else page("home",false);
});
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
async function toggleSub(b){let sub=b.dataset.sub;if(sub==="기타"&&!selectedSubs.includes(sub)){const custom=await appDialog("세부 카테고리 추가","나를 나타내는 세부 카테고리를 입력해 줘.","prompt","예: 나만의 취향","추가하기");if(!custom)return;sub=custom;b.dataset.sub=sub;b.textContent="#"+sub}if(selectedSubs.includes(sub)){selectedSubs=selectedSubs.filter(x=>x!==sub);b.classList.remove("active")}else if(selectedSubs.length<3){selectedSubs.push(sub);b.classList.add("active")}else{toast("세부 카테고리는 최대 3개까지 선택할 수 있습니다.");return}renderTags();renderQuestions()}
function renderTags(){$("#selectedTags").innerHTML=selectedSubs.map(x=>`<span>#${escapeHtml(x)}</span>`).join("")}
function renderQuestions(){
 const qs=[...(questions[selectedCategory]||questions["일상"])];
 const pos=[[8,8],[35,5],[63,13],[20,38],[52,42],[74,50],[5,67],[39,70],[59,72],[22,18]];
 const rotations=[-4,3,-2,4,-3,2,-4,3,-1,2];
 $("#questionStage").innerHTML=qs.map((q,i)=>`<button type="button" class="film" style="left:${pos[i][0]}%;top:${pos[i][1]}%;--r:${rotations[i]}deg" data-q="${escapeHtml(q)}"><div class="film-photo"></div><q>${escapeHtml(q)}</q><small>${String(i+1).padStart(2,"0")} / ${escapeHtml(selectedSubs.join(" · ")||selectedCategory)}</small></button>`).join("");
 $$(".film").forEach(makeQuestionFilmDraggable);
}
function makeQuestionFilmDraggable(el){
 let dragging=false,moved=false,startX=0,startY=0,startLeft=0,startTop=0,pointerId=null;
 const stage=$("#questionStage");
 const onMove=e=>{
  if(!dragging||e.pointerId!==pointerId)return;
  e.preventDefault();
  const rect=stage.getBoundingClientRect();
  const dx=e.clientX-startX,dy=e.clientY-startY;
  if(Math.hypot(dx,dy)>5)moved=true;
  const maxLeft=Math.max(0,rect.width-el.offsetWidth);
  const maxTop=Math.max(0,rect.height-el.offsetHeight);
  el.style.left=Math.max(0,Math.min(maxLeft,startLeft+dx))+"px";
  el.style.top=Math.max(0,Math.min(maxTop,startTop+dy))+"px";
 };
 const onEnd=e=>{
  if(!dragging||e.pointerId!==pointerId)return;
  e.preventDefault();
  dragging=false;
  window.removeEventListener("pointermove",onMove);
  window.removeEventListener("pointerup",onEnd);
  window.removeEventListener("pointercancel",onEnd);
  el.classList.remove("dragging");
  el.style.transition="";
  if(!moved)openEditor(el.dataset.q);
 };
 el.addEventListener("pointerdown",e=>{
  if(e.button!==undefined&&e.button!==0)return;
  e.preventDefault();
  e.stopPropagation();
  startX=e.clientX;startY=e.clientY;
  startLeft=el.offsetLeft;startTop=el.offsetTop;
  dragging=true;moved=false;pointerId=e.pointerId;
  el.style.animation="none";
  el.classList.add("dragging");
  el.style.zIndex=50;
  el.style.transition="none";
  el.style.left=startLeft+"px";
  el.style.top=startTop+"px";
  window.addEventListener("pointermove",onMove,{passive:false});
  window.addEventListener("pointerup",onEnd,{passive:false});
  window.addEventListener("pointercancel",onEnd,{passive:false});
 });
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
 if(records.filter(r=>r.category===selectedCategory).length>=10){toast("이 묶음에는 최대 10장까지 저장할 수 있어.");return}
 const btn=$("#printBtn");btn.disabled=true;btn.textContent="인화 중...";
 const rec={id:Date.now(),category:selectedCategory,sub:selectedSubs.join(", "),question:selectedQuestion,answer,image:photo,filter,createdAt:new Date().toISOString(),posted:false,ownerToken};
 records.push(rec);
 try{save()}catch(e){
  records.pop();btn.disabled=false;btn.textContent="인화하기";
  toast("기록을 저장하지 못했어. 브라우저 저장 공간을 확인해줘.");
  console.error("record save failed:",e);
  return;
 }
 $("#editor").classList.add("printing");
 setTimeout(()=>{
  btn.disabled=false;btn.textContent="완성된 필름";
  $("#editor").classList.remove("printing");
  $("#printBtn").style.display="none";
  $("#postToWallBtn").style.display="block";
  renderCategories();renderBundle();toast("폴라로이드가 완성되었습니다.");
 },1700);
};


function renderMemory(draw=false){
 const host=$("#memoryContent");
 if(!records.length){
  host.innerHTML="<div class='memory-empty'><span class='tiny'>NO FILMS YET</span><h3>아직 꺼내 볼 추억이 없어.</h3><p>사진과 한 줄을 기록하면 여기서 랜덤으로 다시 만날 수 있어.</p><button class='black-btn' data-page='record'>첫 기록 남기기</button></div>";
  host.querySelector("[data-page]")?.addEventListener("click",()=>page("record"));
  return;
 }
 if(!draw&&host.dataset.recordId&&records.some(r=>String(r.id)===host.dataset.recordId))return;
 let choices=records;
 if(records.length>1&&host.dataset.recordId)choices=records.filter(r=>String(r.id)!==host.dataset.recordId);
 const rec=choices[Math.floor(Math.random()*choices.length)];
 host.dataset.recordId=String(rec.id);
 const image=safeImageSrc(rec.image);
 const date=rec.createdAt?new Date(rec.createdAt):null;
 const dateText=date&&!Number.isNaN(date.getTime())?date.toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric"}):"날짜 미상";
 host.innerHTML=`<article class="memory-card">
   <div class="memory-photo-wrap">${image?`<img class="filter-${["normal","bw","warm"].includes(rec.filter)?rec.filter:"normal"}" src="${escapeHtml(image)}" alt="">`:"<div class='memory-photo-placeholder'></div>"}</div>
   <div class="memory-card-copy"><span class="tiny">${escapeHtml(rec.category||"기록")} · ${escapeHtml(dateText)}</span><h3>${escapeHtml(rec.question||"질문 없음")}</h3><p>${escapeHtml(rec.answer||"")}</p><span class="memory-caption">우리의 청춘이 담긴 페이지</span></div>
 </article>`;
}
$("#drawMemoryBtn").onclick=()=>renderMemory(true);

function renderBundle(){
 $("#bundleTotal").textContent=records.length+"장";
 const groups={};records.forEach(r=>(groups[r.category]??=[]).push(r));
 const entries=Object.entries(groups);
 $("#folderGrid").innerHTML=entries.length?entries.map(([c,a])=>`<button class="folder" data-cat="${c}"><div class="folder-cover">${safeImageSrc(a.at(-1).image)?`<img class="filter-${["normal","bw","warm"].includes(a.at(-1).filter)?a.at(-1).filter:"normal"}" src="${safeImageSrc(a.at(-1).image)}" alt="">`:""}</div><div class="folder-info"><strong>${c}</strong><small>${a.length} / 10장</small></div></button>`).join(""):"<div class='settings-card'>아직 기록이 없어.</div>";
 $("#folderGrid").onclick=e=>{
  const b=e.target.closest(".folder[data-cat]");
  if(b)openBundle(b.dataset.cat);
 };
}
function renderBundleButtons(){
 const wallIds=new Set((window.sharedWall||[]).map(x=>String(x.id)));
 $$(".post-one").forEach(b=>{
  const posted=wallIds.has(String(b.dataset.id));
  b.disabled=false;
  b.textContent=posted?"게시됨":"게시판에 올리기";
 });
}

function openBundle(cat){
 const arr=records.filter(r=>r.category===cat);
 const wallIds=new Set((window.sharedWall||[]).map(x=>String(x.id)));
 $("#bundleModalTitle").textContent=cat;
 $("#bundleModalCount").textContent=arr.length+" / 10장";
 $("#bundleCards").innerHTML=arr.length?arr.map(r=>`<article class="bundle-card">
   <div class="bundle-photo"><img class="filter-${["normal","bw","warm"].includes(r.filter)?r.filter:"normal"}" src="${escapeHtml(safeImageSrc(r.image))}" alt=""></div>
   <div class="bundle-copy"><small>${escapeHtml(r.question)}</small><strong>${escapeHtml(r.answer)}</strong></div>
   <div class="bundle-actions">
    <button type="button" class="post-one" data-id="${escapeHtml(r.id)}">${wallIds.has(String(r.id))?"게시됨":"게시판에 올리기"}</button>
    <button type="button" class="delete-record" data-id="${escapeHtml(r.id)}">삭제</button>
   </div>
 </article>`).join(""):"<div class='bundle-empty'>이 묶음에는 사진이 없어.</div>";
 $("#bundleModal").classList.add("show");
 $("#bundleCards").onclick=e=>{
  const del=e.target.closest("button.delete-record[data-id]");
  if(del){deleteBundleRecord(del.dataset.id,cat,del);return}
  const post=e.target.closest("button.post-one[data-id]");
  if(post)postRecordToWall(post.dataset.id,post);
 };

 if(!sharedWallLoaded&&!wallLoading){
  loadWall(true).then(()=>renderBundleButtons()).catch(()=>{});
 }
}
async function deleteBundleRecord(id,cat,button){
 const rec=records.find(r=>String(r.id)===String(id));
 if(!rec){toast("삭제할 기록을 찾지 못했어.");return}
 if(!await appDialog("사진을 삭제할까?","이 사진을 묶음에서 삭제할까?\n게시판에 올린 사진은 게시판에 그대로 남아 있어.","confirm","","삭제하기",true))return;
 button.disabled=true;button.textContent="삭제 중...";
 let remoteDeleted=!currentUser;
 try{
  if(currentUser){
    await accountFetch("/api/account/records",{method:"DELETE",body:JSON.stringify({id:String(id)})});
    remoteDeleted=true;
  }
 }catch(e){
  console.warn("account delete failed; saving pending deletion:",e);
  remoteDeleted=false;
 }
 // Always remove it from this device immediately. If the account request failed,
 // keep a tombstone so a later login won't merge the deleted record back in.
 if(!remoteDeleted){
  let pending=[];
  try{pending=JSON.parse(localStorage.getItem("chungchun_deleted_records")||"[]")}catch{}
  const ids=new Set(Array.isArray(pending)?pending.map(String):[]);
  ids.add(String(id));
  localStorage.setItem("chungchun_deleted_records",JSON.stringify([...ids]));
 }
 records=records.filter(r=>String(r.id)!==String(id));
 save();
 renderCategories();renderBundle();openBundle(cat);
 toast(remoteDeleted?"묶음에서 사진을 삭제했어.": "이 기기에서는 삭제했어. 계정 동기화는 다음 로그인 때 다시 시도할게.");
}

async function postRecordToWall(id,button){
 const rec=records.find(r=>String(r.id)===String(id)); if(!rec){if(button){button.disabled=false;button.textContent="게시판에 올리기"}toast("이 기기의 묶음에서 기록을 찾지 못했어. 기록을 만든 기기에서 다시 확인해줘.");return;}
 const actuallyPosted=sharedWallLoaded && (window.sharedWall||[]).some(x=>String(x.id)===String(id));
 if(actuallyPosted){toast("이미 게시된 필름이야.");return}
 // localStorage의 오래된 posted 값은 신뢰하지 않는다.
 if(rec.posted){rec.posted=false;save()}
 button.disabled=true;button.textContent="게시 중...";
 const markPosted=()=>{rec.posted=true;save();if(button){button.disabled=false;button.textContent="게시됨";}};
 try{
  const r=await fetch(WALL_API+"?_="+Date.now(),{
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

  // 서버 저장 성공 후 실제 서버 목록을 다시 읽어 벽 상태를 확정한다.
  try{await loadWall(true)}catch{}
  try{renderWall();renderBundle();renderBundleButtons()}catch(uiError){console.warn("wall UI refresh:",uiError)}
  toast("게시판에 올렸어.");
 }catch(e){
  // 네트워크가 응답 전에 끊겨도 서버에는 저장됐을 수 있으므로 한 번 확인한다.
  try{
   const check=await fetch(WALL_API,{cache:"no-store"});
   const data=await check.json().catch(()=>({}));
   if(check.ok&&Array.isArray(data.items)&&data.items.some(x=>String(x.id)===String(rec.id))){
    window.sharedWall=data.items;sharedWallLoaded=true;markPosted();
    try{renderWall();renderBundle();renderBundleButtons()}catch(uiError){console.warn("wall UI refresh:",uiError)}
    toast("게시판에 올렸어.");
    return;
   }
  }catch(checkError){console.warn("wall save verification:",checkError)}
  button.disabled=false;button.textContent=rec.posted?"게시됨":"게시판에 올리기";
  toast("게시판 연결에 실패했어: "+e.message);
}
}
function startWallPolling(){
 if(wallPollTimer)return;
 wallPollTimer=setInterval(()=>{
  if(document.querySelector("#wall")?.classList.contains("active"))loadWall(true);
 },2000);
}
function stopWallPolling(){
 if(wallPollTimer){clearInterval(wallPollTimer);wallPollTimer=null}
}

function connectWallEvents(){
 if(wallEvents||typeof EventSource==="undefined")return;
 wallEvents=new EventSource(WALL_API+"/events");
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
   renderWall();renderBundle();renderBundleButtons();
  }catch(err){console.warn("wall event:",err)}
 });
 wallEvents.onerror=()=>console.warn("wall realtime connection lost; browser will retry automatically");
}

async function loadWall(preserveOnError=false){
 if(wallLoading)return;
 wallLoading=true;
 renderWall();
 if(wallRequestController)wallRequestController.abort();
 wallRequestController=new AbortController();
 const timeout=setTimeout(()=>wallRequestController.abort(),8000);
 try{
  const r=await fetch(WALL_API+"?_="+Date.now(),{cache:"no-store",signal:wallRequestController.signal});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d.error||("wall get "+r.status));
  if(!Array.isArray(d.items))throw new Error("invalid wall response");
  window.sharedWall=d.items;
  sharedWallLoaded=true;
  const ids=new Set(d.items.map(x=>String(x.id)));
  let changed=false;
  records.forEach(rec=>{
   const next=ids.has(String(rec.id));
   if(rec.posted!==next){rec.posted=next;changed=true;}
  });
  if(changed)save();
  renderWall();
  renderBundle();
  renderBundleButtons();
 }catch(e){
  console.warn("wall sync failed:",e);
  if(!preserveOnError)toast("벽을 불러오지 못했어: "+e.message);
 }finally{
  clearTimeout(timeout);
  wallLoading=false;
  wallRequestController=null;
 }
}
function renderWall(){
  const arr=(window.sharedWall||[]);
  $("#wallBoard").innerHTML=arr.map((r,i)=>{
   const image=safeImageSrc(r.image);
   const id=escapeHtml(r.id);
   const rotation=[-2,1.5,-1.5,2,-.5,1][i%6];
   return `<article class="wall-film" data-id="${id}" style="--film-rotation:${rotation}deg">
     <span class="nail"></span><span class="hammer"></span>
     ${image?`<img class="filter-${["normal","bw","warm"].includes(r.filter)?r.filter:"normal"}" src="${image}" alt="">`:"<div class='wall-placeholder'></div>"}
     <p class="wall-question">${escapeHtml(r.question||"질문 없음")}</p><p class="wall-answer">${escapeHtml(r.answer)}</p>
   </article>`;
  }).join("");
  $$(".wall-film").forEach(el=>{
   el.onclick=()=>openWallDetail(String(el.dataset.id));
  });
}
async function openWallDetail(id){
 const item=(window.sharedWall||[]).find(x=>String(x.id)===String(id));if(!item)return;
 selectedWallItem=item;
 $("#wallDetailPhoto").innerHTML=safeImageSrc(item.image)?'<img class="filter-'+(["normal","bw","warm"].includes(item.filter)?item.filter:"normal")+'" src="'+safeImageSrc(item.image)+'" alt="">':'<div class="wall-detail-placeholder"></div>';
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
  const r=await fetch(WALL_API,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:selectedWallItem.id,ownerToken})});
  if(!r.ok)throw new Error("delete");
  window.sharedWall=(window.sharedWall||[]).filter(x=>String(x.id)!==String(selectedWallItem.id));
  const rec=records.find(x=>String(x.id)===String(selectedWallItem.id));if(rec){rec.posted=false;save();}
  $("#wallDetailModal").classList.remove("show");selectedWallItem=null;renderWall();toast("게시판에서 삭제했어.");
 }catch{toast("삭제에 실패했어.");}
};
$("#resetWall").onclick=loadWall;
let developerAdminKey=sessionStorage.getItem("chungchun_admin_key")||"";
async function developerDeleteAll(){
 const key=developerAdminKey||await appDialog("관리자 인증","개발자 관리자 키를 입력해 줘.","prompt","관리자 키","인증하기");
 if(!key)return;
 try{
  const r=await fetch(WALL_API,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({all:true,adminKey:String(key).trim()})});
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
  const data=await ChungChunAPI.generateQuestions({category,subcategory:sub,count:5,existing:(questions[selectedCategory]||[]),instruction});
  if(!Array.isArray(data.questions)||!data.questions.length)throw new Error("empty questions");return data.questions;
 }catch(e){console.warn("question API:",e);toast("질문 API 연결을 확인해줘");return []}
};

renderCategories();renderBundle();renderWall();
renderAccountUI();
restoreAccountSession();
})();
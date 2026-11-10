/* ============================== 렌더와 이동 ============================== */
var toastT, toastFn = null;
function toast(m, label, fn){
  var t = $('toast'); toastFn = fn || null;
  t.innerHTML = '<span>'+m+'</span>' + (fn ? '<button type="button" data-act="toast-act">'+label+'</button>' : '');
  t.classList.toggle('lift', S.view === 'results'); t.classList.remove('hide'); clearTimeout(toastT); toastT = setTimeout(function(){ t.classList.add('hide'); toastFn = null; }, fn ? 7000 : 3600);
}
/* 시안이지만 새로고침해도 작업이 사라지지 않도록 이 브라우저에 저장한다 */
var saveT = null;
function persist(){ clearTimeout(saveT); saveT = setTimeout(function(){ try { var o = clone(S); o.sbOpen = false; o.chatOpen = false; o.pendingAct = null; localStorage.setItem(STORE_KEY, JSON.stringify(o)); } catch(x){} }, 200); }
/* 예전 버전에서 저장한 상태에 없는 칸을 채운다. 커뮤니티 데이터가 없으면 도구 화면이 깨지므로 반드시 채운다 */
function fillState(){
  var D = {works:clone(WORKS), toolRev:clone(TOOL_REV), voted:{}, toolT:null, toolCat:'', toolCls:'', toolCatF:'', wsort:'top', prio:'tools', intake:[], liked:{}, reported:{}, seen:{}, alertDone:{}, myTools:clone(INITIAL_TOOLS), toolCache:{}, assetOpen:'obj', tokens:30, unlocked:{}};
  Object.keys(D).forEach(function(k){ if(S[k] == null) S[k] = D[k]; });
  /* 예전 버전이 브라우저에 남긴 예시 게임과 예시 도구는 지운다 */
  S.quotes = (S.quotes || []).filter(function(q){ return !q.ex && !(!q.cloudId && (q.id === 'q1' || q.id === 'q2') && /별빛 플랫포머|퍼즐 프로토타입/.test(q.name)); });
  if(!S.cleanedDemo){ S.myTools = []; S.alertDone = {}; S.cleanedDemo = true; }
  if(S.activeQ && !S.quotes.some(function(q){ return q.id === S.activeQ; })){ S.activeQ = null; if(S.view === 'quote') S.view = 'home'; }
  if(!Array.isArray(S.works) || !S.works.length) S.works = clone(WORKS);
  if(!S.toolRev || typeof S.toolRev !== 'object') S.toolRev = clone(TOOL_REV);
  function fix(st){ if(!st) return; st.inv = st.inv || invFromGenres(st.genres && st.genres.length ? st.genres : ['platformer']); st.inv.custom = st.inv.custom || []; st.inv.feat = st.inv.feat || {}; st.genres = st.genres && st.genres.length ? st.genres : ['platformer']; syncSt(st); }
  try { fix(S.setup); (S.quotes || []).forEach(function(q){ fix(q.setup); }); if(S.draft) fix(S.draft.setup); } catch(x){}
}
function restore(){ try { var raw = localStorage.getItem(STORE_KEY); if(!raw) return false; var o = JSON.parse(raw); if(!o || !o.quotes || !o.setup) return false; S = o; fillState(); if(S.view === 'results' && !S.draft) S.view = 'home'; if(S.view === 'quote' && !getQ(S.activeQ)) S.view = 'home'; return true; } catch(x){ return false; } }
/* 입력칸을 벗어날 때 화면을 다시 그리면, 그 순간 누른 버튼이 사라져 클릭이 빠진다. 누르고 있는 동안은 미뤘다가 클릭이 끝난 뒤 다시 그린다 */
var renderSeq = 0, ptrDown = false, pendingRender = null;
document.addEventListener('pointerdown', function(){ ptrDown = true; }, true);
document.addEventListener('pointerup', function(){ setTimeout(function(){ ptrDown = false; if(pendingRender){ var f = pendingRender; pendingRender = null; f(); } }, 0); }, true);
function afterPointer(fn){ if(ptrDown) pendingRender = fn; else fn(); }
function laterRender(){
  var seq = renderSeq;
  function go(){
    if(renderSeq !== seq) return;
    var a = document.activeElement, sel = focusSel(a), y = window.scrollY, pick = a && a.tagName === 'INPUT' && /^(text|number|search)$/.test(a.type);
    render(); window.scrollTo(0, y);
    if(sel){ try { var f = document.querySelector(sel); if(f){ f.focus({preventScroll:true}); if(pick && f.select) f.select(); } } catch(x){} }
  }
  if(ptrDown) pendingRender = go; else setTimeout(go, 0);
}
function render(){
  CTX = null; renderSeq++;
  renderSidebar();
  if(S.view === 'home') renderHome(); else if(S.view === 'tools' || S.view === 'reviews') renderTools(); else if(S.view === 'tool') renderToolPage(); else if(S.view === 'setup') renderSetup(); else if(S.view === 'results') renderResults(); else if(S.view === 'quote') renderQuote();
  persist();
}
function go(v, opt){
  if(toastFn){ toastFn = null; clearTimeout(toastT); $('toast').classList.add('hide'); }
  if(v !== 'home') S.guide = false;
  S.view = v; closeSb(); S.chatOpen = false;
  if(opt && opt.q){ S.activeQ = opt.q; var q = getQ(opt.q); S.qStep = opt.step || gameInfo(q).step; }
  render(); window.scrollTo(0, 0); $('view').focus({preventScroll:true});
}
function openSb(){ S.sbOpen = true; $('sb').classList.add('open'); $('sbScrim').classList.remove('hide'); $('menuBtn').setAttribute('aria-expanded', 'true'); $('content').setAttribute('inert', ''); setTimeout(function(){ var f = $('sb').querySelector('button'); if(f) f.focus(); }, 30); }
function closeSb(){ if(!S.sbOpen) return; S.sbOpen = false; $('sb').classList.remove('open'); $('sbScrim').classList.add('hide'); $('menuBtn').setAttribute('aria-expanded', 'false'); $('content').removeAttribute('inert'); $('menuBtn').focus(); }
/* 클립보드 API가 막힌 환경(파일로 연 경우 등)에서는 예전 방식으로 복사하고, 그것도 안 되면 문구를 선택해 두고 직접 복사하면 복사한 것으로 처리한다 */
var copyWait = null;
function copy(txt, ok){
  function fallback(){
    var prev = document.activeElement, ta = document.createElement('textarea'), done = false;
    ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { done = document.execCommand('copy'); } catch(x){}
    ta.remove(); if(prev && prev.focus) prev.focus({preventScroll:true});
    if(done) return ok();
    var box = document.querySelector('.copybox');
    if(box){ var rg = document.createRange(); rg.selectNodeContents(box); var sl = window.getSelection(); sl.removeAllRanges(); sl.addRange(rg); copyWait = ok; }
    toast('자동 복사가 막혀 있어요. 문구를 선택해 뒀으니 Ctrl+C(맥은 ⌘+C)로 복사해 주세요.');
  }
  if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, fallback); else fallback();
}
document.addEventListener('copy', function(){
  if(!copyWait) return; var sl = window.getSelection(), box = document.querySelector('.copybox');
  if(box && sl && sl.anchorNode && box.contains(sl.anchorNode)){ var f = copyWait; copyWait = null; setTimeout(f, 0); }
});
function focusSel(el){
  if(!el || !el.attributes) return null;
  var parts = [];
  for(var i = 0; i < el.attributes.length; i++){ var a = el.attributes[i]; if(a.name.indexOf('data-') === 0 && a.name !== 'data-autofocus') parts.push('[' + a.name + '="' + a.value.replace(/"/g, '\\"') + '"]'); }
  if(el.id) parts.push('#' + el.id);
  return parts.length ? el.tagName.toLowerCase() + parts.join('') : null;
}
function saveDraftToQuote(Q, d){ Q.snap = clone(d); }
/* 저장하지 않은 작업이 있는지: 새 초안은 항상, 고치는 중이면 저장본과 다를 때 */
function draftDirty(){
  var d = S.draft; if(!d) return false; if(!S.editingQ) return true;
  var Q = getQ(S.editingQ); if(!Q) return false; var q = d.quotes[d.sel];
  return d.sel !== Q.n - 1 || JSON.stringify(q.picks) !== JSON.stringify(Q.picks) || JSON.stringify(d.qty) !== JSON.stringify(Q.qty) || JSON.stringify(d.buy) !== JSON.stringify(Q.buy || {}) || JSON.stringify(d.setup) !== JSON.stringify(Q.setup);
}
function startNew(){ S.wiz = 1; S.intake = []; S.condMode = false; S.setup = defaultSetup(); S.intake = []; return go('setup'); }
/* 저장한 견적서 고치기: 저장한 견적을 기준(base)으로 삼아 '몇 곳 고침'과 되돌리기가 저장본 기준이 되게 한다 */
function editQuote(qid){
  var Q1 = getQ(qid); if(!Q1) return; S.editingQ = Q1.id;
  if(Q1.snap){ S.draft = clone(Q1.snap); S.draft.setup = clone(Q1.setup); S.draft.chat.push({who:'bot', text:'저장할 때의 견적과 대화를 다시 불러왔어요. 고친 뒤 ‘고친 내용 저장’을 누르면 이 게임의 견적에 덮어써요. 작업 기록은 그대로 남아요.'}); }
  else { S.setup = clone(Q1.setup); makeDraft(); S.draft.buy = clone(Q1.buy || {}); S.draft.chat = [{who:'bot', text:'저장한 견적을 불러왔어요. 고친 뒤 ‘고친 내용 저장’을 누르면 이 게임의 견적에 덮어써요. 작업 기록은 그대로 남아요.'}]; }
  var d = S.draft; d.setup = syncSt(d.setup); setRows(d.setup); d.qty = qtyOf(d.setup); d.sel = Q1.n - 1; d.chg = {}; d.open = null; d.budget0 = Q1.setup.budget;
  var qs = d.quotes[d.sel]; qs.picks = clone(Q1.picks); qs.base = clone(Q1.picks); qs.savedBase = true;
  d.quotes.forEach(function(x){ x.locks = x.locks || {}; });
  d.name = Q1.name; return go('results');
}
var chatOpener = null;
function setChat(open, from){
  S.chatOpen = open; var ch = $('chat'); if(ch){ ch.classList.toggle('open', open); if(window.innerWidth <= 1340 && open){ ch.setAttribute('role', 'dialog'); ch.setAttribute('aria-modal', 'true'); } else { ch.removeAttribute('role'); ch.removeAttribute('aria-modal'); } }
  var sc = document.querySelector('.chatscrim'); if(sc) sc.classList.toggle('on', open);
  document.querySelectorAll('.chatbtn').forEach(function(b){ b.setAttribute('aria-expanded', open); });
  if(open){ chatOpener = from && from.classList && from.classList.contains('chatbtn') ? from : null; var ci = $('chatIn'); if(ci) ci.focus(); }
  else { var b = chatOpener && document.body.contains(chatOpener) && chatOpener.offsetParent ? chatOpener : document.querySelector('.rbar .chatbtn'); if(b && b.offsetParent) b.focus({preventScroll:true}); }
}


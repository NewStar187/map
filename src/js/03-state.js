/* ============================== 상태 ============================== */
/* 예시 사용자: 유니티 2D 도트 게임을 혼자 만들고, 코드는 Claude 유료 구독으로 짜고, 그림 도구는 아직 없다 */
var INITIAL_TOOLS = []; /* 처음에는 쓰는 도구가 없다. 사이드바의 '관리'에서 고른다 */
function myToolIds(){ return S.myTools.map(function(x){ return x.t; }); }
var objSeq = 0;
function objFrom(list){ return list.map(function(o){ objSeq++; return {id:'o' + objSeq, name:o[0], n:o[1], a:o[2]}; }); }
/* 고른 장르들의 틀을 합쳐 에셋 목록 초안을 만든다. 같은 이름의 묶음은 큰 쪽 수를 쓴다 */
function invFromGenres(gs){
  if(!gs.length) gs = ['plat'];
  var objs = {}, order = [], sys = {}, scene = GENRE[gs[0]].scene, ui = 0, illus = 0, bgm = 0, text = 0;
  gs.forEach(function(g){ var G = GENRE[g];
    G.obj.forEach(function(o){ if(!objs[o[0]]){ objs[o[0]] = o.slice(); order.push(o[0]); } else { objs[o[0]][1] = Math.max(objs[o[0]][1], o[1]); objs[o[0]][2] = Math.max(objs[o[0]][2], o[2]); } });
    G.sys.forEach(function(s){ sys[s] = true; }); ui = Math.max(ui, G.ui); illus = Math.max(illus, G.illus || 4); bgm = Math.max(bgm, G.bgm); text = Math.max(text, G.text || 0); });
  return {obj:objFrom(order.map(function(k){ return objs[k]; })), scene:{mode:scene[0], n:scene[1]}, ui:ui, illus:illus, sfx:null, bgm:bgm, text:text, sys:sys, sysx:[], custom:[], feat:{}};
}
function defaultSetup(){
  var st = {name:'', genres:['plat'], genreText:'', view:'side', style:'px32', engine:'Unity', inv:invFromGenres(['plat']),
    release:6, weekly:15, ms:[], checkAt:'before', platforms:['steam'], budget:30000, onceBudget:0,
    have:(S ? S.myTools : INITIAL_TOOLS).map(function(x){ return x.t; }), havePlan:{}, haveCustom:[], ai:{art:true, anim:true, sound:true, code:true, text:true}, vram:'unknown', draw:'avg', subOv:{}};
  (S ? S.myTools : INITIAL_TOOLS).forEach(function(x){ st.havePlan[x.t] = x.plan; });
  return syncSt(st);
}
/* 중간 일정을 고르지 않았을 때의 확인 시점: 출시 두 달 전. 출시가 1~2개월 뒤면 한 달 전이나 직전으로 줄인다 */
function beforeM(s){ return s.release >= 3 ? s.release - 2 : Math.max(0, s.release - 1); }
function beforeName(s){ return s.release >= 3 ? '출시 두 달 전' : s.release === 2 ? '출시 한 달 전' : '출시 직전'; }
function isRelName(n){ return /^출시/.test(n || ''); }
/* 이전 코드가 쓰는 개발 기간(months)과 확인 시점(vs)을 일정 입력에서 계산해 둔다 */
function syncSt(st){
  /* 그림체와 시점은 여러 개 고를 수 있다. 다른 코드(대화 해석 등)가 st.style/st.view를 바꾸면 그것을 주 그림체·주 시점으로 올린다 */
  if(!st.styles || !st.styles.length) st.styles = [st.style || 'px32'];
  if(!st.views || !st.views.length) st.views = [st.view || 'side'];
  if(st.style && st.style !== st.styles[0]){ var si = st.styles.indexOf(st.style); if(si >= 0) st.styles.splice(si, 1); st.styles.unshift(st.style); }
  if(st.view && st.view !== st.views[0]){ var vi = st.views.indexOf(st.view); if(vi >= 0) st.views.splice(vi, 1); st.views.unshift(st.view); }
  st.style = st.styles[0]; st.view = st.views[0];
  st.months = st.release;
  var m = (st.ms || []).filter(function(x){ return x.id === st.checkAt; })[0];
  st.vs = m ? m.m : beforeM(st);
  st.checkName = m ? m.name : beforeName(st);
  return st;
}
var S = null;
function initialState(){
  S = {
    view:'home', sbOpen:false, chatOpen:false, pendingAct:null, liked:{}, reported:{},
    myTools:clone(INITIAL_TOOLS), toolCache:{}, cleanedDemo:true,
    quotes:[], activeQ:null, qStep:1, newQ:null, guide:false,
    setup:null, wiz:1, draft:null, editingQ:null, condMode:false, moreOpen:false, intake:[],
    prio:'tools', hourVal:MIN_WAGE, detailOpen:false,
    feed:'all', toolFilter:null, search:'', sort:'new', rulesOpen:false, seen:{}, alertDone:{}, showSeen:false, openAlert:null, quietOpen:false,
    works:clone(WORKS), toolRev:clone(TOOL_REV), voted:{}, tokens:30, unlocked:{}, toolT:null, toolCat:'', toolCls:'', toolCatF:'', wsort:'top'
  };
  S.setup = defaultSetup();
  /* 예시 게임 1: 만드는 중. 기록이 일부 쌓여 있다 */
  var a = defaultSetup(); a.name = '별빛 플랫포머'; a.budget = 40000; syncSt(a);
  var ra = rowsOf(a), pa = {};
  ra.forEach(function(r){ pa[r.id] = ({obj:'pixellab', scene:'aseprite', ui:'aseprite', illus:'aseprite', sfx:'jsfxr', bgm:'suno', code:'claude'})[r.cat]; if(!optOf(r, pa[r.id])) pa[r.id] = r.opts[0].t; });
  var qa = newQuoteRecord('q1', '별빛 플랫포머', a, 2, '10월 2일', qtyOf(a), {}, pa, true);
  var ob = a.inv.obj;
  qa.storeAt = 3;
  qa.logs = [
    {id:'l1', row:ob[0].id, tool:'pixellab', n:1, how:'human', paid:true, date:'10월 20일'},
    {id:'l2', row:ob[1].id, tool:'pixellab', n:4, how:'as', paid:true, date:'10월 27일'},
    {id:'l3', row:ob[1].id, tool:'aseprite', n:2, how:'self', date:'10월 31일'},
    {id:'l4', row:'bgm', tool:'suno', n:1, how:'as', paid:true, date:'11월 1일'}
  ];
  S.quotes.push(qa);
  /* 예시 게임 2: 스토어 페이지를 열 때가 됐다. 공개 문구를 준비할 차례 */
  var b = defaultSetup(); b.genres = ['puzzle']; b.view = 'fixed'; b.inv = invFromGenres(['puzzle']); b.engine = 'Godot'; b.release = 4; b.name = '퍼즐 프로토타입'; b.platforms = ['steam', 'itch']; syncSt(b);
  var rb = rowsOf(b), pb = {};
  rb.forEach(function(r){ pb[r.id] = ({obj:'pixellab', scene:'aseprite', ui:'aseprite', illus:'aseprite', sfx:'cc0sound', bgm:'cc0music', code:'claude'})[r.cat]; if(!optOf(r, pb[r.id])) pb[r.id] = r.opts[0].t; });
  var qb = newQuoteRecord('q2', '퍼즐 프로토타입', b, 2, '9월 12일', qtyOf(b), {}, pb, true);
  qb.storeAt = 0; var lid = 0;
  rb.forEach(function(r){ var n = qb.qty[r.id]; if(!(n > 0)) return; lid++; var t = pb[r.id], e = {id:'k' + lid, row:r.id, tool:t, n:n, date:'10월 ' + (10 + lid) + '일'};
    if(TOOLS[t].ai) e.how = r.cat === 'code' ? 'as' : 'human'; else if(TOOLS[t].pack) e.how = 'pack'; else e.how = 'self';
    if(t === 'pixellab') e.paid = true; if(t === 'cc0music') e.mark = 'noai'; qb.logs.push(e); });
  S.quotes.push(qb);
  S.quotes = []; /* 예시 게임은 보여 주지 않는다(시연용 코드는 남겨 둔다) */
}
/* 저장한 게임: 견적과 함께 만드는 동안의 작업 기록(logs)과 공개 문구 상태(disc)를 둔다 */
function newQuoteRecord(id, name, st, n, saved, qty, buy, picks, remind){
  syncSt(st);
  return {id:id, name:name, setup:clone(st), n:n, saved:saved, qty:clone(qty), buy:clone(buy), picks:clone(picks),
    storeAt:Math.max(st.release >= 4 ? st.release - 3 : st.release - 1, 0), platforms:clone(st.platforms || ['steam']), ms:clone(st.ms || []),
    logs:[], disc:{live:null, ratio:{}, names:false, ack:false, copied:false, sig:''}, remind:remind !== false, email:false, snap:null, updated:null};
}


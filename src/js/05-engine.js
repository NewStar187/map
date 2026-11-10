/* ============================== 에셋 줄 ============================== */
/* 줄은 조건(에셋 목록·그림체·시점)에서 만들어진다. 움직이는 오브젝트는 묶음마다 한 줄이다 */
var CTX = null, ROWS = [], ROW = {};
function ctxSt(){ return CTX || (S.draft ? S.draft.setup : S.setup); }
function setRows(st){ ROWS = rowsOf(st); ROW = {}; ROWS.forEach(function(r){ ROW[r.id] = r; }); return ROWS; }
var SHOTS = {pixellab:{obj:[1,1,0,1], scene:[0,1,0,1], ui:[1,1,1,0]}, retro:{obj:[1,0,1,0], scene:[1,0,0,1]}, zimage:{obj:[0,1,0,0], scene:[0,0,1,0], ui:[1,1,0,1], illus:[1,0,1,0]}, midjourney:{obj:[1,0,1,1], scene:[1,1,0,1], ui:[1,0,1,0], illus:[1,1,1,0]}, meshy:{obj:[1,0,1,0], scene:[0,1,1,0]}, eleven:{sfx:[1,1,0,1]}, suno:{bgm:[1,1,0,1]}, claude:{code:[1,1,0,1], text:[1,1,1,0]}, copilot:{code:[1,0,1,0]}};
function rowsOf(st){
  syncSt(st); var inv = st.inv, rows = [], sk, sty, cls, D, SA;
  var aiAnim = st.ai.anim;
  function add(r){ r.shots = {}; r.opts.forEach(function(o){ var sh = SHOTS[o.t] && SHOTS[o.t][r.cat]; if(sh && o.m === 'ai') r.shots[o.t] = sh; }); rows.push(r); }
  /* 움직이는 오브젝트 묶음 */
  inv.obj.forEach(function(g){
    var sk = styleOfRow(st, g.style), vk = viewOfRow(st, g.view), sty = STYLES[sk] || STYLES.px32, cls = sty.cls, V = VIEWS[vk] || VIEWS.side, D = sty.dh, SA = sty.ai, vf = V.vf, a = g.a || 3, animDirect = a * D * 0.8 * vf, opts = [];
    if(cls === '3d'){
      opts.push({t:'blender', m:'direct', h:D * 1.5 + a * D * 0.5});
      opts.push({t:'quaternius', m:'free', h:0.5 + a * 0.1, noAuto:true, note:'그림체가 게임과 다를 수 있어요'}, {t:'kenney', m:'free', h:0.5 + a * 0.1, noAuto:true, note:'그림체가 게임과 다를 수 있어요'});
      opts.push({t:'meshy', m:'ai', h:1.2 * SA + 0.3 + a * 0.4, note:'애니메이션은 Mixamo(무료)로 붙여요'});
    } else {
      opts.push({t:cls === 'pixel' ? 'aseprite' : 'selfart', m:'direct', h:D + animDirect});
      if(cls === 'pixel' || sk === 'flat') opts.push({t:'kenney', m:'free', h:0.4 + a * 0.1, noAuto:true, note:'그림체가 게임과 다를 수 있어요'});
      var animOnly = !st.ai.art && aiAnim;
      if(cls === 'pixel'){
        if(animOnly) opts.push({t:'pixellab', m:'ai', animOnly:true, h:D + a * 0.6 * vf * SA, note:'대기 자세는 직접 그리고 동작만 AI로'});
        else opts.push({t:'pixellab', m:'ai', h:0.8 * SA + (aiAnim ? a * 0.6 * vf * SA : animDirect), note:aiAnim ? '' : '동작은 직접 그려요'});
        opts.push({t:'retro', m:'ai', h:0.9 * SA + animDirect, note:'동작은 직접 그려요'});
      } else opts.push({t:'midjourney', m:'ai', h:1.0 * SA + animDirect, note:'동작은 직접 그려요'});
      opts.push({t:'zimage', m:'ai', h:1.3 * SA + animDirect, note:'동작은 직접 그려요'});
      if(st.engine === 'Unity') opts.push({t:'unityai', m:'ai', h:1.0 * SA + animDirect, note:'스프라이트는 AI로, 동작은 직접 그려요'});
    }
    opts.push({t:'buyasset', m:'buy', h:0.3 + a * 0.1, noAuto:true});
    add({id:g.id, name:g.name, unit:cls === '3d' ? '개' : '종', kind:'game', cat:'obj', art:true, aiKey:'art', anims:a, obj:g,
      en:cls === '3d' ? '3D characters and animations' : 'character art and animations', ko:cls === '3d' ? '3D 캐릭터와 애니메이션' : '캐릭터 그림과 애니메이션',
      hint:sty.name + ' · ' + V.name, style:sk, view:vk, cls:cls, opts:opts});
  });
  /* 배경·맵 */
  sk = styleOfRow(st, inv.scene.style); sty = STYLES[sk] || STYLES.px32; cls = sty.cls; D = sty.dh; SA = sty.ai;
  var sm = cls === '3d' ? 'space' : (inv.scene.mode === 'space' ? 'tile' : inv.scene.mode), so = [];
  var GEN = '그림체가 게임과 다를 수 있어요';
  if(sm === 'space'){ so.push({t:'blender', m:'direct', h:D * 4}, {t:'quaternius', m:'free', h:2, noAuto:true, note:GEN}, {t:'kenney', m:'free', h:2, noAuto:true, note:GEN}, {t:'meshy', m:'ai', h:3 * SA}, {t:'buyasset', m:'buy', h:1, noAuto:true}); }
  else if(sm === 'tile'){ so.push({t:cls === 'pixel' ? 'aseprite' : 'selfart', m:'direct', h:D * 2.7}); if(cls === 'pixel' || sk === 'flat') so.push({t:'kenney', m:'free', h:1, noAuto:true, note:GEN}); if(cls === 'pixel'){ so.push({t:'pixellab', m:'ai', h:1.5 * SA}, {t:'retro', m:'ai', h:1.6 * SA}); } so.push({t:'zimage', m:'ai', h:2.2 * SA}); if(st.engine === 'Unity') so.push({t:'unityai', m:'ai', h:2.0 * SA}); so.push({t:'buyasset', m:'buy', h:0.5, noAuto:true}); }
  else { so.push({t:cls === 'pixel' ? 'aseprite' : 'selfart', m:'direct', h:D * 2.5}, {t:'midjourney', m:'ai', h:1.0 * SA}, {t:'zimage', m:'ai', h:1.3 * SA}, {t:'buyasset', m:'buy', h:0.4}); }
  add({id:'scene', name:'배경·맵', unit:SCENE_MODES[sm].unit, kind:'game', cat:'scene', art:true, aiKey:'art', mode:sm,
    en:sm === 'tile' ? 'tilesets' : sm === 'space' ? '3D environments' : 'background art', ko:sm === 'tile' ? '타일셋' : sm === 'space' ? '3D 공간' : '배경 그림', hint:sty.name + ' · ' + SCENE_MODES[sm].name, style:sk, cls:cls, opts:so});
  /* UI */
  sk = styleOfRow(st, inv.uiStyle); sty = STYLES[sk] || STYLES.px32; cls = sty.cls; D = sty.dh; SA = sty.ai;
  var uD = cls === '3d' ? 3 : D, uo = [{t:cls === 'pixel' ? 'aseprite' : 'selfart', m:'direct', h:uD * 0.17}, {t:'kenney', m:'free', h:0.1, noAuto:true, note:GEN}];
  if(cls === 'pixel') uo.push({t:'pixellab', m:'ai', h:0.2}); else uo.push({t:'midjourney', m:'ai', h:0.25 * SA});
  uo.push({t:'zimage', m:'ai', h:0.25 * SA}, {t:'buyasset', m:'buy', h:0.1, noAuto:true});
  add({id:'ui', name:'UI·아이콘', unit:'개', kind:'game', cat:'ui', art:true, aiKey:'art', en:'UI elements', ko:'UI 요소', hint:sty.name + ' · 버튼, 창, 아이콘을 각각', style:sk, cls:cls, opts:uo});
  sk = styleOfRow(st, inv.illusStyle); sty = STYLES[sk] || STYLES.px32; cls = sty.cls; D = sty.dh; SA = sty.ai;
  /* 일러스트·홍보 이미지 */
  add({id:'illus', name:'일러스트·홍보 이미지', unit:'장', kind:'game', cat:'illus', art:true, aiKey:'art', en:'illustrations', ko:'일러스트', where:' in this game and on its store page', hint:sty.name + ' · 컷신, 카드 그림, 스토어 대표 이미지까지', style:sk, cls:cls,
    opts:[{t:cls === '3d' ? 'blender' : cls === 'pixel' ? 'aseprite' : 'selfart', m:'direct', h:(cls === '3d' ? 4 : D * 2.5)}, {t:'midjourney', m:'ai', h:1.0 * SA}, {t:'zimage', m:'ai', h:1.3 * SA}]});
  /* 소리: 주 그림체가 도트면 8비트 효과음 도구를 쓴다 */
  cls = clsOf(st);
  add({id:'sfx', name:'효과음', unit:'개', kind:'game', cat:'sfx', aiKey:'sound', en:'sound effects', ko:'효과음', hint:'동작과 UI마다 1개 정도',
    opts:[cls === 'pixel' ? {t:'jsfxr', m:'direct', h:0.15} : {t:'selfsound', m:'direct', h:0.3}, {t:'cc0sound', m:'free', h:0.1}, {t:'eleven', m:'ai', h:0.1}].concat(st.engine === 'Unity' ? [{t:'unityai', m:'ai', h:0.12}] : [], [{t:'buyasset', m:'buy', h:0.05, noAuto:true}])});
  add({id:'bgm', name:'배경음악', unit:'곡', kind:'game', cat:'bgm', aiKey:'sound', en:'music', ko:'배경음악', hint:'장면과 메뉴마다 1곡',
    opts:[{t:'selfmusic', m:'direct', h:8}, {t:'cc0music', m:'free', h:0.3}, {t:'suno', m:'ai', h:0.5, note:'게임에 맞게 반복 구간을 잘라야 해요'}, {t:'buyasset', m:'buy', h:0.2, noAuto:true}]});
  /* 글·대사 */
  if(inv.text > 0 || (inv.feat || {}).tutorial) add({id:'text', name:'대사·글', unit:'장면', kind:'game', cat:'text', aiKey:'text', en:'dialogue and story text', ko:'대사와 글', hint:'대화 장면, 아이템 설명 묶음 기준',
    opts:[{t:'selftext', m:'direct', h:1}, {t:'claude', m:'ai', h:0.4, note:'말투와 설정은 직접 다듬어요'}]});
  /* 직접 추가한 에셋 */
  (inv.custom || []).forEach(function(c){
    var k = c.kind, o = k === 'sound' ? [{t:cls === 'pixel' ? 'jsfxr' : 'selfsound', m:'direct', h:0.3}, {t:'cc0sound', m:'free', h:0.1}, {t:'eleven', m:'ai', h:0.15}] : k === 'text' ? [{t:'selftext', m:'direct', h:1}, {t:'claude', m:'ai', h:0.4}] : [{t:cls === 'pixel' ? 'aseprite' : cls === '3d' ? 'blender' : 'selfart', m:'direct', h:(cls === '3d' ? D : D * 1.2)}, {t:cls === '3d' ? 'meshy' : 'midjourney', m:'ai', h:0.8 * SA}, {t:'zimage', m:'ai', h:1.1 * SA}, {t:'buyasset', m:'buy', h:0.3}];
    add({id:c.id, name:c.name, unit:c.unit || '개', kind:'game', cat:k === 'sound' ? 'sfx' : k === 'text' ? 'text' : 'illus', custom:true, art:k === 'art', aiKey:k === 'sound' ? 'sound' : k === 'text' ? 'text' : 'art', en:k === 'sound' ? 'sound effects' : k === 'text' ? 'dialogue and story text' : 'illustrations', ko:c.name, hint:'직접 추가한 에셋', opts:o});
  });
  /* 다국어: 번역할 언어 수만큼 */
  var F = inv.feat || {};
  if(F.i18n > 0) add({id:'loc', name:'번역', unit:'언어', kind:'game', cat:'text', aiKey:'text', en:'translations', ko:'번역', hint:'대사와 UI 글자를 언어마다',
    opts:[{t:'selftext', m:'direct', h:6}, {t:'claude', m:'ai', h:2, note:'원어민 검수는 따로 받길 권해요'}]});
  /* 코드: 게임 하나의 코드 전체를 한 줄로 본다(AI를 쓰는지가 공개 문구에 필요하다) */
  add({id:'code', name:'코드', unit:'게임분', kind:'code', cat:'code', aiKey:'code', en:'code', ko:'코드', hint:'게임 하나의 코드 전체',
    opts:[{t:'selfcode', m:'direct', h:40}, {t:'claude', m:'ai', h:16}, {t:'copilot', m:'ai', h:20}]});
  return rows;
}
function sysList(st){
  var inv = st.inv, ids = Object.keys(SYSTEMS).filter(function(k){ return inv.sys[k] != null; });
  return ids.map(function(k){ return {id:k, name:SYSTEMS[k][0], h:SYSTEMS[k][1], on:!!inv.sys[k]}; }).concat((inv.sysx || []).map(function(x){ return {id:x.id, name:x.name, h:x.h || 6, on:x.on !== false, custom:true}; }));
}
function autoSfx(st){ var a = st.inv.obj.reduce(function(s, g){ return s + g.a; }, 0); return Math.min(150, a * 2 + 10); }
function qtyOf(st){
  var inv = st.inv, q = {};
  inv.obj.forEach(function(g){ q[g.id] = g.n; });
  q.scene = inv.scene.n; q.ui = inv.ui; q.illus = inv.illus; q.sfx = inv.sfx == null ? autoSfx(st) : inv.sfx; q.bgm = inv.bgm;
  if(inv.text > 0) q.text = inv.text;
  (inv.custom || []).forEach(function(c){ q[c.id] = c.n; });
  var F = inv.feat || {};
  if(F.tutorial){ q.ui += 8; q.text = (q.text || 0) + 5; }
  if(F.mobile) q.ui += Math.ceil(q.ui * 0.3);
  if(F.i18n > 0) q.loc = F.i18n;
  q.code = 1;
  return q;
}
/* 줄 수량을 고치면 에셋 목록에 반영한다 */
function setQty(st, id, v){
  var inv = st.inv; v = Math.max(0, Math.min(999, v));
  var g = inv.obj.filter(function(x){ return x.id === id; })[0]; if(g){ g.n = v; return; }
  var c = (inv.custom || []).filter(function(x){ return x.id === id; })[0]; if(c){ c.n = v; return; }
  if(id === 'scene') inv.scene.n = v; else if(id === 'ui') inv.ui = v; else if(id === 'illus') inv.illus = v; else if(id === 'sfx') inv.sfx = v; else if(id === 'bgm') inv.bgm = v; else if(id === 'text') inv.text = v;
}
function RN(r){ return r.name; }
function RU(r){ return r.unit; }
function RH(r){ return r.hint; }
function REN(r){ return r.en; }
function RKO(r){ return r.ko; }

function optOf(row, t){ return row && row.opts.filter(function(o){ return o.t === t; })[0]; }
function whyNot(row, o, st){
  st = st || ctxSt(); var T = TOOLS[o.t];
  var k = o.animOnly ? 'anim' : row.aiKey;
  if(o.m === 'ai' && !st.ai[k]) return AIKEYS[k] + '에는 AI를 쓰지 않는 조건이에요';
  if(T.gpuMin && vramGB(st) != null && vramGB(st) < T.gpuMin) return '그래픽카드 메모리(VRAM)가 ' + T.gpuMin + 'GB 이상 필요해요';
  if((o.m === 'buy' || (T.once > 0 && !has(o.t, st))) && !(st.onceBudget > 0)) return '‘한 번 사는 것’을 고르지 않아서 후보에서 뺐어요. 조건에서 바꿀 수 있어요';
  return '';
}
function allowed(row, o, st){ return !whyNot(row, o, st); }
/* 견적 3개의 성격: 돈 안 드는(새 유료 도구 없이), 도구 하나로(새 유료 도구 하나까지), 가장 잘 만드는(예산 안에서 에셋별 별점이 가장 높게).
   품질의 근거는 도구 커뮤니티의 에셋별 별점이다. 평가가 없는 방법(직접 만들기 등)은 중간값 3점으로 친다.
   가격을 모르는 도구, 사양을 모르는 내 PC 실행 도구, 범용 팩, 구매가를 모르는 구매는 기본으로 고르지 않는다 */
var STRATS = ['free', 'one', 'best'];
var PRIO = {free:'Lite', one:'Balance', best:'Quality'};
var PRIO_D = {free:'새로 돈을 쓰지 않는 조합', one:'유료 도구를 하나까지만', best:'평가가 가장 좋은 조합'};
function QNi(i){ return PRIO[STRATS[i]] || ('견적 ' + (i + 1)); }
function QN(q){ return PRIO[q.strat] || PRIO[STRATS[(q.n || 1) - 1]] || ('견적 ' + q.n); }
var PRIO_SEL = {tools:'적은 도구로 좋은 품질', money:'돈이 덜 드는 것', quality:'평가가 가장 좋은 것'};
var NEUTRAL = 3;
var QCACHE = {};
function artCat(cat){ return ['obj', 'scene', 'ui', 'illus'].indexOf(cat) >= 0; }
function clsOf(st){ return (STYLES[st.style] || STYLES.px32).cls; }
/* 에셋별 별점: 그 도구로 그 에셋 종류를 만든 작업물에 작성자가 매긴 별점의 평균. 그림은 그림체 갈래(도트·2D·3D)가 맞는 것만 센다 */
function qualOf(t, cat, cls){
  var k = t + '|' + cat + '|' + cls; if(QCACHE[k]) return QCACHE[k];
  var ws = (S.works || []).filter(function(w){ return w.t === t && w.cat === cat && (!artCat(cat) || w.cls === cls || w.cls === 'any'); });
  var out = {n:ws.length, star:null, how:{as:0, aiedit:0, human:0}};
  if(ws.length){ out.star = ws.reduce(function(a, w){ return a + w.star; }, 0) / ws.length;
    ws.forEach(function(w){ if(w.how === 'both'){ out.how.aiedit += 0.5; out.how.human += 0.5; } else out.how[w.how] = (out.how[w.how] || 0) + 1; }); }
  return (QCACHE[k] = out);
}
function scoreOf(r, t, st){ var q = qualOf(t, r.cat, rowCls(r, st)); return q.n ? q.star : NEUTRAL; }
function zeroCost(t, st){ return toolCost(t, st) === 0 && onceCost(t, st) === 0 && t !== 'buyasset'; }
function cands(r, st){ return r.opts.filter(function(o){ return allowed(r, o, st) && TOOLS[o.t].price !== 'unknown' && !gpuUnsure(o.t, st) && !o.noAuto && o.m !== 'buy'; }); }
/* 정해 둔 유료 도구 묶음(set)으로 줄마다 가장 평가가 좋은 방법을 고른다. 같으면 돈 안 드는 쪽, 그다음 목록 순서 */
function planFor(set, rs, qty, st, keep){
  var picks = {}, score = 0, n = 0;
  rs.forEach(function(r){
    if(keep && keep[r.id]){ picks[r.id] = keep[r.id]; }
    else {
      var c = cands(r, st).filter(function(o){ return zeroCost(o.t, st) || set.indexOf(o.t) >= 0; }); if(!c.length) c = [r.opts[0]];
      var best = c.slice().sort(function(a, b){ return scoreOf(r, b.t, st) - scoreOf(r, a.t, st) || (zeroCost(b.t, st) ? 1 : 0) - (zeroCost(a.t, st) ? 1 : 0); })[0];
      picks[r.id] = best.t;
    }
    if(qty[r.id] > 0){ score += scoreOf(r, picks[r.id], st); n++; }
  });
  return {picks:picks, score:score, n:n};
}
function paidCands(rs, qty, st){
  var P = [];
  rs.forEach(function(r){ if(!(qty[r.id] > 0)) return; cands(r, st).forEach(function(o){ if(!zeroCost(o.t, st) && P.indexOf(o.t) < 0) P.push(o.t); }); });
  return P.slice(0, 9);
}
function subsetsOf(P, maxN){ var out = [[]]; P.forEach(function(t){ out.slice().forEach(function(s){ if(s.length < maxN) out.push(s.concat([t])); }); }); return out; }
/* 견적 하나 짜기: 가능한 유료 도구 묶음을 모두 따져 예산 안에서 평가 합이 가장 높은 것. 같으면 돈이 덜 드는 것 */
function stratPicks(strat, st, qty, buy, keep){
  var rs = rowsOf(st), P = paidCands(rs, qty, st), subs = strat === 'free' ? [[]] : subsetsOf(P, strat === 'one' ? 1 : 9), best = null;
  subs.forEach(function(set){
    var pl = planFor(set, rs, qty, st, keep), c = calc(pl.picks, qty, buy, st); if(!c.inBudget) return;
    if(strat === 'one' && c.paidN > 1 && !keep) return;
    var cost = c.monthly + c.once / 12;
    if(!best || pl.score > best.score + 1e-9 || (Math.abs(pl.score - best.score) < 1e-9 && cost < best.cost)) best = {picks:pl.picks, score:pl.score, cost:cost};
  });
  return best ? best.picks : planFor([], rs, qty, st, keep).picks;
}
/* 하위 호환: 예전 코드가 부르는 이름 */
function pickFor(r, strat, st){ var c = cands(r, st).filter(function(o){ return zeroCost(o.t, st); }); if(!c.length) return r.opts[0].t; return c.slice().sort(function(a, b){ return scoreOf(r, b.t, st) - scoreOf(r, a.t, st); })[0].t; }
function addTools(picks){ return picks; }
function addCandidate(){ return null; }
function paidSubs(picks, qty, st){ var u = {}; rowsOf(st).forEach(function(r){ var t = picks[r.id]; if(qty[r.id] > 0 && TOOLS[t] && TOOLS[t].ai && (toolCost(t, st) > 0 || onceCost(t, st) > 0)) u[t] = true; }); return Object.keys(u); }
function toolCost(t, st){ var T = TOOLS[t]; return (T.usd > 0 && !has(t, st)) ? usd(T.usd) : 0; }
function onceCost(t, st){ var T = TOOLS[t]; return (T.once > 0 && !has(t, st)) ? usd(T.once) : 0; }
function toolLabel(t, st){
  var T = TOOLS[t]; st = st || ctxSt();
  if(has(t, st) && T.ai) return T.name + ' (쓰는 중)';
  if(t === 'aseprite' && !has('aseprite', st)) return '직접 그리기';
  if(T.label) return T.label;
  return T.name + (T.plan ? ' ' + T.plan : '');
}
function priceText(t, st){
  var T = TOOLS[t]; st = st || ctxSt();
  if(has(t, st) && (T.usd > 0 || T.once > 0)) return T.ai ? '추가 0원' : '쓰는 중 · 추가 0원';
  if(T.price === 'unknown') return '가격 확인 중';
  if(T.once > 0) return '$' + T.once + ' · 한 번 ' + won(usd(T.once));
  if(T.usd > 0) return '$' + T.usd + ' · 월 ' + won(usd(T.usd)) + (freeOnly(t, st) ? ' · 무료 플랜은 상업 이용 불가' : '');
  if(t === 'buyasset') return '구매가 입력';
  return '0원';
}
function priceShort(t, st){ var T = TOOLS[t]; st = st || ctxSt(); if(has(t, st) && (T.usd > 0 || T.once > 0)) return '쓰는 중'; if(T.price === 'unknown') return '가격 확인 중'; if(T.once > 0) return '한 번 ' + won(usd(T.once)); if(T.usd > 0) return '월 ' + won(usd(T.usd)); return '0원'; }
/* 줄 작업 시간 = 1개당 시간 × 수량. 1개당 시간은 그림체·시점·직접 그리는 속도로 정해진다. 표시와 합계가 맞도록 줄마다 시간 단위로 반올림한다 */
function rowFactors(row, t, st){ var o = optOf(row, t); return {o:o, unit:o ? o.h : 0}; }
function rowH(row, t, q, st){ var o = optOf(row, t); if(!o || !(q > 0)) return 0; return Math.max(1, Math.round(o.h * q)); }
/* 돈은 두 가지로 따로 본다: 매달 내는 구독료(월 예산과 비교)와 한 번 내는 돈(구매 예산과 비교) */
function calc(picks, qty, buy, st){
  st = syncSt(st || ctxSt());
  var used = {}, onceT = {}, toolH = {}, setupT = {}, out = {hours:0, buy:0, buyMissing:0, once:0, setupH:0, unknown:{}, third:{}, tosT:{}, tos:false, gpu:false, ai:0, free:{}, qsum:0, qrows:0, qn:0};
  rowsOf(st).forEach(function(r){
    var t = picks[r.id], q = qty[r.id]; if(!(q > 0) || !optOf(r, t)) return;
    var h = rowH(r, t, q, st); out.hours += h; toolH[t] = (toolH[t] || 0) + h;
    var c = toolCost(t, st); if(c) used[t] = c;
    var oc = onceCost(t, st); if(oc) onceT[t] = oc;
    var T = TOOLS[t];
    if(t === 'buyasset'){ var b = buy && buy[r.id]; if(b > 0) out.buy += b; else out.buyMissing++; }
    if(T.price === 'unknown') out.unknown[t] = true;
    if(T.price === 'third' && !has(t, st)) out.third[t] = true;
    if(T.setupH && !setupT[t]){ setupT[t] = true; out.setupH += T.setupH; }
    if(freeOnly(t, st)) out.free[t] = true;
    if(gpuUnsure(t, st)) out.gpu = true;
    if(T.ai) out.ai++;
    var qv = qualOf(t, r.cat, rowCls(r, st)); out.qsum += qv.n ? qv.star : NEUTRAL; out.qrows++; if(qv.n) out.qn += qv.n;
  });
  out.hours += out.setupH;
  var perMonth = st.weekly * 4.33;
  out.used = used; out.onceT = onceT; out.toolH = toolH; out.subMonths = {}; out.subAuto = {};
  out.monthly = 0; out.subTotal = 0;
  Object.keys(used).forEach(function(t){
    var auto = st.months, m = auto;
    out.subAuto[t] = auto; out.subMonths[t] = m; out.monthly += used[t]; out.subTotal += used[t] * m;
  });
  out.once = out.buy + Object.keys(onceT).reduce(function(a, t){ return a + onceT[t]; }, 0);
  out.total = out.subTotal + out.once;
  out.qavg = out.qrows ? out.qsum / out.qrows : 0;
  out.paidN = Object.keys(used).concat(Object.keys(onceT)).filter(function(t, k, a){ return a.indexOf(t) === k; }).length;
  out.overMonthly = Math.max(0, out.monthly - st.budget);
  out.overOnce = Math.max(0, out.once - (st.onceBudget || 0));
  out.overTotal = out.overOnce;
  out.inBudget = !out.overMonthly && !out.overOnce;
  out.weeks = Math.max(1, Math.ceil(out.hours / st.weekly));
  out.availWeeks = Math.round(st.months * 4.33);
  out.share = out.hours / (out.availWeeks * st.weekly);
  /* 팀 가정값이라 범위로 보여 준다: 추정은 대개 낙관적이어서 아래로 25%, 위로 40% */
  out.lo = Math.max(1, Math.round(out.hours * 0.75)); out.hi = Math.round(out.hours * 1.4);
  return out;
}
function rangeTxt(c){ return '약 ' + c.lo + '~' + c.hi + '시간'; }
/* 예산 맞추기: 고정하지 않은 줄의 구독 도구를 어떤 조합으로 뺄지 모두 따져, 예산 안에 들어오면서 평가가 가장 덜 떨어지는 안을 고른다. */
function fitPlans(picks, qty, buy, target, locks, st){
  var rs = rowsOf(st), c0 = calc(picks, qty, buy, st), lockedT = {};
  rs.forEach(function(r){ if(locks && locks[r.id] && qty[r.id] > 0) lockedT[picks[r.id]] = true; });
  var paid = Object.keys(c0.used).concat(Object.keys(c0.onceT || {})).filter(function(t, i, a){ return !lockedT[t] && a.indexOf(t) === i; }), plans = [];
  for(var mask = 1; mask < (1 << paid.length); mask++){
    var drop = paid.filter(function(t, i){ return mask & (1 << i); }), p = clone(picks), changed = [], ok = true;
    rs.forEach(function(r){
      if(!ok || !(qty[r.id] > 0) || drop.indexOf(p[r.id]) < 0) return;
      var alt = r.opts.filter(function(o){ return allowed(r, o, st) && o.m !== 'buy' && !o.noAuto && TOOLS[o.t].price === 'ok' && toolCost(o.t, st) === 0 && onceCost(o.t, st) === 0 && !gpuUnsure(o.t, st); })
        .sort(function(a, b){ return scoreOf(r, b.t, st) - scoreOf(r, a.t, st); })[0];
      if(!alt){ ok = false; return; }
      p[r.id] = alt.t; changed.push(r.id);
    });
    if(!ok) continue;
    var c = calc(p, qty, buy, st);
    plans.push({picks:p, changed:changed, drop:drop, c:c, dh:Math.round((c0.qavg - c.qavg) * 10) / 10, fits:c.monthly <= target});
  }
  plans.sort(function(a, b){ return (a.fits === b.fits ? 0 : a.fits ? -1 : 1) || a.dh - b.dh || a.c.monthly - b.c.monthly; });
  return {plans:plans, c0:c0, lockedT:lockedT};
}
function fitBudget(picks, qty, buy, target, locks, st){
  var rs = rowsOf(st), c0 = calc(picks, qty, buy, st);
  if(c0.monthly <= target) return {changed:[], conflict:false, blockers:[], alts:[], dh:0};
  var r = fitPlans(picks, qty, buy, target, locks, st), fit = r.plans.filter(function(p){ return p.fits; });
  var best = fit[0] || r.plans.slice().sort(function(a, b){ return a.c.monthly - b.c.monthly || a.dh - b.dh; })[0];
  if(best) rs.forEach(function(x){ picks[x.id] = best.picks[x.id]; });
  var still = calc(picks, qty, buy, st).monthly > target;
  var blockers = still ? rs.filter(function(x){ return locks && locks[x.id] && qty[x.id] > 0 && toolCost(picks[x.id], st) > 0; }).map(function(x){ return x.id; }) : [];
  return {changed:best ? best.changed : [], conflict:still, blockers:blockers, alts:fit.slice(1, 3), dh:best ? best.dh : 0};
}
/* 에셋 목록이 바뀌면(묶음 추가, 배경 방식 변경) 견적마다 빠진 줄의 방법을 그 견적의 성격대로 채운다 */
function ensurePicks(d){
  var st = d.setup, rs = setRows(st); d.qty = qtyOf(st); QCACHE = {};
  d.quotes.forEach(function(q){ var set = paidSubs(q.picks, d.qty, st), pl = planFor(set, rs, d.qty, st, null);
    rs.forEach(function(r){ if(!optOf(r, q.picks[r.id])){ q.picks[r.id] = pl.picks[r.id]; if(q.base) q.base[r.id] = pl.picks[r.id]; } }); });
}
/* 줄마다 상태 표시는 문제가 있을 때만 하나 둔다. 정상 상태는 표시하지 않는다 */
function statusInfo(t, st){
  st = st || ctxSt(); var T = TOOLS[t], P = usePlan(t, st);
  if(T.price === 'unknown') return {cls:'c-warn', txt:'가격 확인 중', tip:'공식 가격을 아직 확인하지 못해 합계에 넣지 않았어요.'};
  if(T.price === 'third' && !has(t, st)) return {cls:'c-mute', txt:'가격 추정', tip:'공식 페이지에서 가격을 확인하지 못해 알려진 가격으로 계산했어요.'};
  if(freeOnly(t, st)) return {cls:'c-warn', txt:ownPlan(t, st).rights === 'attr' ? '무료 플랜은 출처 표기·내려받기 제한' : '무료 플랜은 상업 이용 불가', tip:'쓰고 계신 무료 플랜으로는 판매용 게임에 그대로 쓰기 어려워요. 유료 요금제 값으로 계산했어요.'};
  if(T.rightsCheck) return {cls:'c-mute', txt:'라이선스 확인', tip:'판매 페이지 본문에 상업 이용 조건이 없어 판매자 안내로만 확인했어요.'};
  if(T.beta) return {cls:'c-mute', txt:'오픈 베타', tip:'요금과 조건이 바뀔 수 있어요.'};
  if(gpuUnsure(t, st)) return {cls:'c-warn', txt:'PC 사양 확인', tip:'그래픽카드 메모리(VRAM)가 ' + T.gpuMin + 'GB 이상이어야 해요.'};
  if(P && P.pub) return {cls:'c-mute', txt:'결과물 공개됨', tip:T.name + ' ' + P.name + ' 요금제로 만든 그림은 공개 갤러리에 보여요. 비공개로 만들려면 Pro 이상이 필요해요.'};
  if(T.pack) return {cls:'c-mute', txt:T.rights === 'check' ? '라이선스·AI 표시 확인' : 'AI 표시 확인', tip:'받은 곳의 라이선스와, 판매 페이지에 AI로 만들었다는 표시가 있는지 확인해야 해요.'};
  return null;
}
function statusChips(t, st){ var i = statusInfo(t, st); return i ? '<span class="chip '+i.cls+'" title="'+esc(i.tip)+'">'+i.txt+'</span>' : ''; }
var PHRASE = {aseprite:'직접 그리는 걸로', selfart:'직접 그리는 걸로', blender:'Blender로 직접 만드는 걸로', jsfxr:'jsfxr로 직접 만드는 걸로', selfsound:'직접 녹음하는 걸로', selfmusic:'직접 작곡하는 걸로', selfcode:'직접 짜는 걸로', selftext:'직접 쓰는 걸로', kenney:'Kenney 무료 에셋으로', quaternius:'Quaternius 무료 3D 에셋으로', cc0sound:'무료 효과음 팩으로', cc0music:'무료 음원으로', buyasset:'유료 에셋을 사는 걸로'};
function toPhrase(t){ return PHRASE[t] || (TOOLS[t].name + ro(t)); }
function summary(picks, qty, st){
  st = st || ctxSt(); var groups = {}, order = [];
  rowsOf(st).forEach(function(r){ if(!(qty[r.id] > 0)) return; var t = picks[r.id]; if(!groups[t]){ groups[t] = []; order.push(t); } groups[t].push(RN(r)); });
  order.sort(function(a, b){ return (TOOLS[b].ai ? 1 : 0) - (TOOLS[a].ai ? 1 : 0); });
  return order.map(function(t){
    var names = groups[t], say = TOOLS[t].say;
    if(has(t, st) && TOOLS[t].ai) say = '쓰고 계신 ' + TOOLS[t].name + ro(t) + ' ' + (t === 'claude' || t === 'copilot' ? '만들어요' : '뽑아요');
    if(t === 'aseprite' && !has('aseprite', st)) say = '직접 그려요';
    return names.join(', ') + eun(names[names.length - 1]) + ' ' + say + '.';
  });
}
function cautions(c, st){
  st = st || ctxSt(); var a = [], used = Object.keys(c.used);
  a.push('평가는 도구 커뮤니티에 올라온 결과물에 작성자가 매긴 별점의 평균(에셋별 별점)이에요. 이 시안의 평가와 결과물은 예시예요.');
  a.push('평가가 없는 방법(직접 만들기 등)은 중간값 3점으로 쳤어요. 직접 만드는 품질은 사람마다 달라서 저희가 점수를 매기지 않아요.');
  if(used.length || Object.keys(c.onceT).length) a.push('해외 결제는 ' + FX_NOTE + '에 부가세 10%를 더해 계산했어요. 환율이 바뀌어도 알림은 보내지 않아요. 카드사 해외 결제 수수료는 넣지 않았어요.');
  if(used.length) a.push('구독은 출시까지 ' + st.months + '개월 동안 계속한다고 보고 총비용을 계산했어요. 구독을 끝낸 뒤 만들거나 내려받은 결과물은 무료 플랜 조건을 따르니, 쓸 결과물은 구독하는 동안 만들고 내려받아 두세요.');
  if(c.used.suno) a.push('Suno는 유료 플랜을 쓰는 동안 내려받은 곡만 상업적으로 쓸 수 있어요(9월 3일 약관). Pro는 한 달에 20곡까지 내려받을 수 있어요.');
  if(c.used.unityai) a.push('Unity AI는 월 구독에 크레딧이 들어 있고, 많이 쓰면 크레딧이 더 들어요. 남은 크레딧은 다음 달로 넘어가지 않아요.');
  if(used.some(function(t){ var P = usePlan(t, st); return P && P.pub; })) a.push('Midjourney Basic·Standard로 만든 그림은 다른 사용자에게 공개돼요. 출시 전에 공개되면 곤란한 그림이면 비공개로 만들 수 있는 Pro 이상이 필요해요.');
  Object.keys(c.free).forEach(function(t){ a.push('쓰고 계신 ' + TOOLS[t].name + ' 무료 플랜은 ' + (ownPlan(t, st).rights === 'attr' ? '출처를 밝혀야 해서' : '상업적으로 쓸 수 없어서') + ' 유료 요금제 값으로 계산했어요.'); });
  Object.keys(c.third).forEach(function(t){ a.push(TOOLS[t].name + ' 가격은 공식 페이지에서 확인하지 못해 알려진 값($' + TOOLS[t].usd + ')으로 계산했어요.'); });
  Object.keys(c.unknown).forEach(function(t){ a.push(TOOLS[t].name + ' 가격은 확인 중이라 합계에 넣지 않았어요.'); });
  if(used.length) a.push('요금제의 월 생성 한도는 반영하지 않았어요. 한 달에 많이 뽑으면 상위 요금제가 필요할 수 있어요.');
  if(c.gpu) a.push('Z-Image는 그래픽카드 메모리(VRAM)가 8GB 이상 필요해요. 작업 관리자 → 성능 → GPU의 ‘전용 GPU 메모리’에서 확인할 수 있어요.');
  if(c.buyMissing) a.push('유료 에셋 ' + c.buyMissing + '줄은 구매가를 넣어야 한 번 드는 돈과 예산 판정에 들어가요.');
  return a;
}
function subPlan(c){
  var ks = Object.keys(c.used); if(!ks.length) return '';
  return '<div class="subplan"><b>구독</b>' + ks.map(function(t){ var P = usePlan(t, ctxSt()); return '<span class="tchip">'+TOOLS[t].name+(P && P.name ? ' '+esc(P.name) : '')+' · '+won(c.used[t])+'</span>'; }).join('') + '<span>출시까지 '+ctxSt().months+'개월 동안 계속 구독한다고 봤어요.</span></div>';
}


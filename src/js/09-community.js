/* ============================== 도구 커뮤니티 ==============================
   도구 카드(이름, 가격, 도구 총 별점, 잘 만드는 에셋) → 도구 화면(에셋별 별점, 고친 방식 비율, 작업물 카드) → 작업물 자세히(작성자 영역 / 다른 사용자 영역 / 댓글) */
var CATS = [['obj', '캐릭터·애니메이션'], ['scene', '배경·맵'], ['ui', 'UI·아이콘'], ['illus', '일러스트'], ['sfx', '효과음'], ['bgm', '배경음악'], ['code', '코드'], ['text', '대사·글']];
function catName(c){ var x = CATS.filter(function(k){ return k[0] === c; })[0]; return x ? x[1] : ''; }
var CLSN = {pixel:'도트', '2d':'2D', '3d':'3D', any:''};
function toolIds(){ return Object.keys(TOOL_REV); }
function toolStar(t){ var L = (S.toolRev || {})[t] || []; return L.length ? {star:L.reduce(function(a, x){ return a + x.star; }, 0) / L.length, n:L.length} : {star:null, n:0}; }
function worksOf(t, cat, cls){ return S.works.filter(function(w){ return !S.reported[w.id] && w.t === t && (!cat || w.cat === cat) && (!cls || !artCat(w.cat) || w.cls === cls || w.cls === 'any'); }); }
function catStats(t, cls){
  var by = {}; worksOf(t, null, cls).forEach(function(w){ var b = (by[w.cat] = by[w.cat] || {cat:w.cat, n:0, sum:0, how:{as:0, aiedit:0, human:0}}); b.n++; b.sum += w.star; if(w.how === 'both'){ b.how.aiedit += 0.5; b.how.human += 0.5; } else b.how[w.how] = (b.how[w.how] || 0) + 1; });
  return CATS.map(function(c){ return by[c[0]]; }).filter(Boolean).map(function(b){ b.star = b.sum / b.n; return b; });
}
function billTxt(t){ var out = []; ((BILLING[t] || '') + ' · ' + priceRange(t)).split(' · ').forEach(function(x){ x = x.trim(); if(!x) return; var k = out.findIndex(function(y){ return x.indexOf(y) >= 0 || y.indexOf(x) >= 0; }); if(k >= 0){ if(x.length > out[k].length) out[k] = x; return; } out.push(x); }); return out.join(' · ').replace('한 번 구매 · 한 번 ', '한 번 구매 · '); }
function priceRange(t){
  var T = TOOLS[t]; if(!T.plans) return T.plan || '무료';
  var ps = T.plans, once = ps.filter(function(p){ return p.once; }), sub = ps.filter(function(p){ return p.usd > 0; }), free = ps.some(function(p){ return !p.usd && !p.once && p.id !== 'own'; });
  if(once.length) return '한 번 $' + Math.min.apply(null, once.map(function(p){ return p.once; })) + (once.length > 1 ? '~$' + Math.max.apply(null, once.map(function(p){ return p.once; })) : '');
  if(t === 'aseprite') return '한 번 구매';
  return (free ? '무료 · ' : '') + (sub.length ? '월 $' + Math.min.apply(null, sub.map(function(p){ return p.usd; })) + (sub.length > 1 ? '~$' + Math.max.apply(null, sub.map(function(p){ return p.usd; })) : '') : '');
}
function toolCard(t){
  var T = TOOLS[t], ts = toolStar(t), cs = catStats(t, S.toolCls).sort(function(a, b){ return b.star - a.star || b.n - a.n; }).slice(0, 2), n = worksOf(t, null, S.toolCls).length;
  return '<button type="button" class="tcard" data-toolpage="'+t+'"><span class="tc-h">'+av(t, 36)+'<span><b>'+T.name+'</b><small>'+esc(billTxt(t))+'</small></span></span>'
    + '<span class="tc-s"><span class="big">'+(ts.n ? starTxt(ts.star) : '평가 없음')+'</span><small>도구 총 별점 · '+ts.n+'명</small></span>'
    + '<span class="tc-c">'+(cs.length ? cs.map(function(b){ return '<span class="tchip">'+catName(b.cat)+' '+starTxt(b.star)+'</span>'; }).join('') : '<small class="t-dim">아직 결과물이 없어요</small>')+'</span>'
    + '<small class="tc-n">결과물 '+n+'개</small></button>';
}
function renderTools(){
  var cat = S.toolCatF || '', q = (S.search || '').trim().toLowerCase();
  $('view').innerHTML = '<div class="ph"><div><h1>커뮤니티</h1><p class="lead">써 본 사람들이 올린 결과물과 평가를 도구별로 모아 봐요. 이 시안의 평가와 결과물은 모두 예시예요.</p></div><div class="row-acts">'+tokChip()+'<button type="button" class="btn sec" data-act="upload">결과물 올리기</button></div></div>'
    + '<div class="toolbar"><label class="search"><span class="sr">도구 찾기</span><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.6"/></svg><input class="field" id="q" type="search" placeholder="도구 이름으로 찾기" value="'+esc(S.search || '')+'"></label>'
    + '<div class="seg" role="group" aria-label="그림체">' + [['', '모든 그림체'], ['pixel', '도트'], ['2d', '2D'], ['3d', '3D']].map(function(x){ return '<button type="button" data-tcls="'+x[0]+'" aria-pressed="'+((S.toolCls || '') === x[0])+'">'+x[1]+'</button>'; }).join('') + '</div></div>'
    + '<div class="toolbar"><div class="tabs" role="group" aria-label="에셋 종류"><button type="button" class="tab" data-tcat="" aria-pressed="'+!cat+'">전체</button>' + CATS.map(function(c){ return '<button type="button" class="tab" data-tcat="'+c[0]+'" aria-pressed="'+(cat === c[0])+'">'+c[1]+'</button>'; }).join('') + '</div></div>'
    + '<p class="sr" id="feedCount" aria-live="polite"></p><div id="feedArea">' + toolGridHTML() + '</div>';
}
function toolGridHTML(){
  var cat = S.toolCatF || '', q = (S.search || '').trim().toLowerCase();
  var ts = toolIds().filter(function(t){ return (!q || (TOOLS[t].name + (TOOLKO[t] || '') + (TOOLS[t].alias || '')).toLowerCase().indexOf(q) >= 0) && (!cat || worksOf(t, cat, S.toolCls).length); });
  ts.sort(function(a, b){ var sa = cat ? (catStats(a, S.toolCls).filter(function(x){ return x.cat === cat; })[0] || {}).star || 0 : toolStar(a).star || 0, sb = cat ? (catStats(b, S.toolCls).filter(function(x){ return x.cat === cat; })[0] || {}).star || 0 : toolStar(b).star || 0; return sb - sa; });
  toolGridHTML.n = ts.length;
  return ts.length ? '<div class="tgrid">' + ts.map(toolCard).join('') + '</div>' + (cat ? '<p class="note">‘'+catName(cat)+'’ 에셋별 별점이 높은 순서예요.</p>' : '<p class="note">도구 총 별점이 높은 순서예요.</p>') : '<div class="empty">조건에 맞는 도구가 없어요.<button type="button" class="btn sm sec" data-act="clear-all">검색과 필터 지우기</button></div>';
}
function renderFeed(){ var f = $('feedArea'); if(!f) return; f.innerHTML = toolGridHTML(); var c = $('feedCount'); if(c) c.textContent = '도구 ' + toolGridHTML.n + '개'; }
var TOOLKO = {pixellab:'픽셀랩', retro:'레트로 디퓨전', zimage:'지이미지', eleven:'일레븐랩스', claude:'클로드', copilot:'코파일럿 깃허브', kenney:'케니', aseprite:'에이스프라이트', jsfxr:'효과음 생성기', midjourney:'미드저니', meshy:'메시 3D', suno:'수노 음악', blender:'블렌더', quaternius:'쿼터니우스', unityai:'유니티 AI'};
function renderToolPage(){
  var t = S.toolT, T = TOOLS[t]; if(!T){ S.view = 'tools'; return renderTools(); }
  var ts = toolStar(t), cls = S.toolCls || '', cs = catStats(t, cls), cat = S.toolCat && cs.some(function(b){ return b.cat === S.toolCat; }) ? S.toolCat : '', mine = (S.toolRev[t] || []).filter(function(x){ return x.mine; })[0];
  var ws = worksOf(t, cat, cls).sort(function(a, b){ return S.wsort === 'new' ? a.ago - b.ago : (b.helpful + (S.voted[b.id] && S.voted[b.id].h ? 1 : 0)) - (a.helpful + (S.voted[a.id] && S.voted[a.id].h ? 1 : 0)); });
  var cur = cat ? cs.filter(function(b){ return b.cat === cat; })[0] : null;
  var plans = T.plans && T.plans.length ? '<table class="ptab"><caption class="sr">'+T.name+' 요금제</caption><thead><tr><th scope="col">요금제</th><th scope="col">가격</th><th scope="col">상업적 이용</th></tr></thead><tbody>' + T.plans.map(function(p){ return '<tr><td>'+esc(p.name)+'</td><td>'+(p.once ? '한 번 $'+p.once : p.usd ? '월 $'+p.usd : p.id === 'own' ? '한 번 구매' : '무료')+'</td><td>'+(p.rights === 'ok' ? '가능' : p.rights === 'attr' ? '출처 표시하면 가능' : '안 됨')+(p.pub ? ' · 만든 그림 공개' : '')+(p.dl ? ' · 한 달 '+p.dl+'곡 내려받기' : '')+'</td></tr>'; }).join('') + '</tbody></table>' : '';
  $('view').innerHTML = '<button type="button" class="crumb" data-go="tools">'+ui('left', 16)+'커뮤니티</button>'
    + '<div class="ph"><div class="tp-h">'+av(t, 48)+'<div><h1>'+T.name+'</h1><p class="lead">'+esc(billTxt(t))+'</p></div></div><div class="row-acts">'+tokChip()+'<button type="button" class="btn sec" data-trev="'+t+'">'+(mine ? '내 도구 평가 고치기' : '이 도구 평가하기')+'</button><button type="button" class="btn" data-uploadfor="'+t+'">결과물 올리기</button></div></div>'
    + '<div class="tp-grid"><section class="card stack"><div class="tp-star"><span class="big">'+(ts.n ? starTxt(ts.star) : '평가 없음')+'</span><span class="note">도구 총 별점 · '+ts.n+'명이 도구 자체에 남긴 종합 평가예요. 아래 에셋별 별점과는 따로 매겨요.</span></div>'
    + (ts.n ? (function(){ var h = '<ul class="revs">' + S.toolRev[t].map(function(x){ return '<li><b>'+starTxt(x.star)+'</b><span>'+esc(x.text)+'</span><small>'+esc(x.who)+(x.mine ? ' · 내 평가' : '')+'</small></li>'; }).join('') + '</ul>'; return (S.unlocked || {})['rev:' + t] || mine ? h : lockBox(h, '후기 글 '+ts.n+'개', TOK_REV, 'data-unlockrev="'+t+'"'); })() : '')
    + '</section><section class="card stack"><h2>가격과 상업적 이용</h2>'+plans+'<p class="note">'+esc(T.why || '')+'</p><button type="button" class="link sm" data-src="'+t+'">근거 보기</button></section></div>'
    + '<section class="card stack" aria-labelledby="ctT"><div class="sec-h"><h2 id="ctT">에셋별 별점</h2><div class="seg sm" role="group" aria-label="그림체">' + [['', '모든 그림체'], ['pixel', '도트'], ['2d', '2D'], ['3d', '3D']].map(function(x){ return '<button type="button" data-tcls="'+x[0]+'" aria-pressed="'+(cls === x[0])+'">'+x[1]+'</button>'; }).join('') + '</div></div>'
    + '<div class="ctabs" role="group" aria-label="에셋 종류"><button type="button" class="ctab" data-tpcat="" aria-pressed="'+!cat+'"><b>전체</b><small>결과물 '+worksOf(t, null, cls).length+'개</small></button>' + cs.map(function(b){ return '<button type="button" class="ctab" data-tpcat="'+b.cat+'" aria-pressed="'+(cat === b.cat)+'"><b>'+catName(b.cat)+'</b><span>'+starTxt(b.star)+'</span><small>결과물 '+b.n+'개</small></button>'; }).join('') + '</div>'
    + (cur ? '<div class="cdet"><span>‘'+catName(cat)+'’ 결과물을 고친 방식</span>'+howBars(cur)+'</div>' : '<p class="note">에셋 종류를 고르면 그 에셋을 만든 결과물만 보고, 그대로 썼는지 손봤는지 비율도 볼 수 있어요.</p>') + '</section>'
    + '<div class="sec-h wh"><h2>결과물 '+ws.length+'개</h2><div class="seg sm" role="group" aria-label="정렬"><button type="button" data-wsort="top" aria-pressed="'+(S.wsort !== 'new')+'">도움 많은 순</button><button type="button" data-wsort="new" aria-pressed="'+(S.wsort === 'new')+'">최신순</button></div></div>'
    + (ws.length ? '<div class="wgrid">' + ws.map(workCard).join('') + '</div>' : '<div class="empty">아직 이 조건의 결과물이 없어요.<button type="button" class="btn sm" data-uploadfor="'+t+'">첫 결과물 올리기</button></div>');
}

/* ============================== 한눈에 보기: 도구 보드 · 이점 · 예시 비교 · 토큰 ============================== */
var TCOL = ['#a99bff', '#5cd6c2', '#f2c46d', '#79b3ff', '#ff8089', '#63d297', '#f0a6ff', '#ffb37a', '#9fd0ff', '#d6e36b'];
function toolCol(t){ if(TOOLS[t] && TOOLS[t].av) return TOOLS[t].av; var ids = toolIds(), i = ids.indexOf(t); if(i < 0){ i = 0; for(var k = 0; k < t.length; k++) i += t.charCodeAt(k); } return TCOL[i % TCOL.length]; }
function usedTools(picks, qty, st){ var o = {}; rowsOf(st).forEach(function(r){ if(qty[r.id] > 0 && optOf(r, picks[r.id])) o[picks[r.id]] = true; }); return Object.keys(o); }
/* 기준선: 에셋마다 평가 1위 도구를 따로 쓸 때 */
function bestPicks(st, qty){ var p = {}; rowsOf(st).forEach(function(r){ var best = null, bs = -1; r.opts.forEach(function(o){ if(!allowed(r, o, st)) return; var qv = qualOf(o.t, r.cat, rowCls(r, st)), s = qv.n ? qv.star : NEUTRAL; if(s > bs + 1e-9){ bs = s; best = o.t; } }); p[r.id] = best || (r.opts[0] && r.opts[0].t); }); return p; }
function baseLine(d){ var st = d.setup; if(!d._base || d._baseSig !== JSON.stringify(d.qty) + st.budget){ var bp = bestPicks(st, d.qty), c = calc(bp, d.qty, d.buy, st); d._base = {picks:bp, c:c, tools:usedTools(bp, d.qty, st).length}; d._baseSig = JSON.stringify(d.qty) + st.budget; } return d._base; }
function beneHTML(q, c, d){
  var B = baseLine(d), bc = B.c, nT = usedTools(q.picks, d.qty, d.setup).length, save = Math.max(0, bc.monthly - c.monthly), fewer = Math.max(0, B.tools - nT), qr = bc.qavg ? Math.min(1.2, c.qavg / bc.qavg) : 1;
  var w1 = bc.monthly ? Math.max(4, Math.round(Math.min(1, c.monthly / Math.max(bc.monthly, c.monthly, 1)) * 100)) : (c.monthly ? 100 : 4);
  var dots = ''; for(var i = 0; i < Math.max(B.tools, nT); i++) dots += '<i class="'+(i < nT ? 'on' : '')+'"></i>';
  var big = save ? '월 <b>'+won(save)+'</b> 아껴요' : c.monthly ? '월 '+won(c.monthly - bc.monthly)+' 더 들어요' : '<b>새 구독 0원</b>';
  return '<span class="bene"><span class="bn-big">'+big+(fewer ? ' · 도구 <b>'+fewer+'개</b> 덜 써요' : '')+'</span>'
    + '<span class="bn-row"><span class="bn-k">돈</span><span class="bn-bars"><span class="bn-bar base" style="width:100%"><em>따로 쓰면 '+won(bc.monthly)+'</em></span><span class="bn-bar me" style="width:'+w1+'%"></span></span><span class="bn-v">'+won(c.monthly)+'</span></span>'
    + '<span class="bn-row"><span class="bn-k">도구</span><span class="bn-dots" aria-hidden="true">'+dots+'</span><span class="bn-v">'+nT+' / '+B.tools+'개</span></span>'
    + '<span class="bn-row"><span class="bn-k">품질</span><span class="bn-meter"><span style="width:'+Math.round(Math.min(1, qr) * 100)+'%"></span></span><span class="bn-v">'+Math.round(qr * 100)+'%</span></span>'
    + '<span class="sr">에셋마다 평가 1위 도구를 따로 쓸 때와 비교: 월 '+won(bc.monthly)+', 도구 '+B.tools+'개, 평가 평균 '+bc.qavg.toFixed(1)+'.</span></span>';
}
var BOARD_PREV = {};
function boardHTML(q, d){
  var st = d.setup, by = {}, order = [], moved = {}, prevKey = d.name + '|' + d.sel;
  rowsOf(st).forEach(function(r){ var t = q.picks[r.id]; if(!(d.qty[r.id] > 0) || !optOf(r, t)) return; if(!by[t]){ by[t] = []; order.push(t); } by[t].push(r); var pv = BOARD_PREV[r.id]; if(BOARD_PREV._k === prevKey && pv && pv !== t) moved[r.id] = true; });
  BOARD_PREV = {_k:prevKey}; order.forEach(function(t){ by[t].forEach(function(r){ BOARD_PREV[r.id] = t; }); });
  order.sort(function(a, b){ return by[b].length - by[a].length; });
  var B = baseLine(d);
  function price(t){ var m = toolCost(t, st), o = onceCost(t, st); return m ? '<span class="bd-p paid">월 '+won(m)+'</span>' : o ? '<span class="bd-p paid">한 번 '+won(o)+'</span>' : has(t, st) ? '<span class="bd-p own">이미 있음</span>' : '<span class="bd-p free">무료</span>'; }
  return '<section class="card board" aria-labelledby="bdT"><div class="tbl-h"><h2 id="bdT">도구 보드 <small>'+QN(q)+'</small></h2><span class="note">도구 '+order.length+'개가 에셋 '+rowsOf(st).filter(function(r){ return d.qty[r.id] > 0; }).length+'종을 나눠 맡아요. 따로 쓰면 '+B.tools+'개예요. 도우미에게 바꿔 달라고 하면 칸이 옮겨 가요.</span></div>'
    + '<div class="bd-grid">' + order.map(function(t){ var T = TOOLS[t], col = toolCol(t);
      return '<div class="bd-col" style="--tc:'+col+'"><div class="bd-h"><span class="bd-dot" aria-hidden="true"></span><b>'+T.name+'</b>'+price(t)+'</div><div class="bd-chips">' + by[t].map(function(r){ return '<button type="button" class="bd-chip'+(moved[r.id] ? ' moved' : '')+'" data-open="'+r.id+'">'+RN(r)+'<small>'+d.qty[r.id]+RU(r)+'</small></button>'; }).join('') + '</div></div>'; }).join('') + '</div></section>';
}
/* 예시 비교: 같은 프롬프트로 도구마다 뽑은 결과 */
var SHOW = [
  {id:'knight', label:'도트 기사 캐릭터', cat:'obj', prompt:'32x32 pixel art knight, idle pose, side view, transparent background', tools:[['pixellab', 'plat', 3], ['retro', 'plat', 11], ['zimage', 'top', 21]]},
  {id:'forest', label:'숲 배경 타일', cat:'scene', prompt:'16x16 pixel art forest tileset, grass, dirt, trees, top-down', tools:[['retro', 'top', 5], ['pixellab', 'top', 13], ['zimage', 'top', 27]]}
];
function showcaseHTML(){
  var cur = SHOW.filter(function(x){ return x.id === S.showId; })[0] || SHOW[0];
  return '<section class="card show" aria-labelledby="shT"><div class="tbl-h"><h2 id="shT">같은 프롬프트, 도구별 결과</h2><div class="seg sm" role="group" aria-label="예시 고르기">' + SHOW.map(function(x){ return '<button type="button" data-show="'+x.id+'" aria-pressed="'+(x === cur)+'">'+x.label+'</button>'; }).join('') + '</div></div>'
    + '<div class="prompt"><div><span class="mono">'+esc(cur.prompt)+'</span><small>MAP 팀이 같은 프롬프트로 도구마다 4번씩 뽑았어요</small></div><button type="button" class="btn sm sec" data-copyp="'+esc(cur.prompt)+'">복사</button></div>'
    + '<div class="sh-grid">' + cur.tools.map(function(x){ var t = x[0], T = TOOLS[t], qv = qualOf(t, cur.cat, 'pixel'), imgs = ''; for(var i = 0; i < 4; i++) imgs += '<span class="sh-img">'+sample(cur.cat, 72, i === 3 && t === 'zimage', x[2] + i * 2, null, x[1])+'</span>';
      return '<div class="sh-col" style="--tc:'+toolCol(t)+'"><div class="bd-h"><span class="bd-dot" aria-hidden="true"></span><b>'+T.name+'</b><span class="bd-p">'+(qv.n ? starTxt(qv.star) : '평가 없음')+'</span></div><div class="sh-imgs">'+imgs+'</div><button type="button" class="link sm" data-toolgo="'+t+'">'+T.name+' 결과물 더 보기</button></div>'; }).join('') + '</div>'
    + '<p class="note">이 시안의 그림은 화면 구성을 보여 드리는 예시예요. 실제 서비스에서는 팀이 각 도구로 직접 뽑은 결과로 채워요. 4장 중 마음에 드는 결과가 몇 장인지 보면 그 도구가 얼마나 고르게 나오는지 알 수 있어요.</p></section>';
}
/* 토큰: 다른 사람의 프롬프트·들어간 돈·후기·댓글은 토큰으로 열어요. 결과물이나 후기를 올리면 받아요 */
var TOK_WORK = 5, TOK_REV = 3, TOK_UP = 10, TOK_TREV = 5;
function isOpenW(w){ return w.mine || (S.unlocked || {})[w.id]; }
function tokChip(){ return '<button type="button" class="tkchip" data-act="tok-info" aria-label="토큰 '+(S.tokens || 0)+'개, 토큰 안내 열기">'+icon('coin', 14)+' 토큰 <b>'+(S.tokens || 0)+'</b></button>'; }
function tokSheet(){
  openLayer('<div class="modal sheet" role="dialog" aria-modal="true" aria-labelledby="tkT">'+mh('tkT', '토큰 '+(S.tokens || 0)+'개')
    + '<p class="note">토큰은 MAP 안에서만 쓰는 포인트예요. 다른 사람이 올린 프롬프트와 후기를 열 때 쓰고, 내 결과물을 나누면 받아요.</p>'
    + '<dl class="kv2 tk"><dt>받기</dt><dd>결과물 올리기 <b>+'+TOK_UP+'</b></dd><dt></dt><dd>도구 평가하기 <b>+'+TOK_TREV+'</b> <small>도구마다 한 번</small></dd><dt>쓰기</dt><dd>결과물의 프롬프트·들어간 돈·후기·댓글 열기 <b>−'+TOK_WORK+'</b></dd><dt></dt><dd>도구 후기 글 열기 <b>−'+TOK_REV+'</b></dd><dt>무료</dt><dd>결과물 그림, 작성자 별점, 도구 총 별점, 가격과 약관</dd></dl>'
    + '<div class="row-acts end"><button type="button" class="btn sec" data-act="close-layer">닫기</button><button type="button" class="btn" data-act="upload">결과물 올리고 '+TOK_UP+'개 받기</button></div></div>');
}
function lockBox(inner, what, cost, attr){
  return '<div class="lockbox"><div class="lk-blur" aria-hidden="true" inert>'+inner+'</div><div class="lk-ov"><span class="lk-ic" aria-hidden="true">'+ui('lock', 22)+'</span><b>'+what+'</b><button type="button" class="btn sm" '+attr+'>토큰 '+cost+'개로 열기</button><small>지금 '+(S.tokens || 0)+'개 · 결과물을 올리면 '+TOK_UP+'개, 도구를 평가하면 '+TOK_TREV+'개를 받아요</small></div></div>';
}
function spendTok(n, key, okMsg){ S.unlocked = S.unlocked || {}; if((S.tokens || 0) < n){ toast('토큰이 모자라요. 결과물을 올리거나 도구를 평가하면 토큰을 받아요.'); return false; } S.tokens -= n; S.unlocked[key] = true; toast(okMsg + ' 남은 토큰 ' + S.tokens + '개.'); persist(); return true; }
function workArt(w, size){
  if(ART_CAP[w.cat]){ var h = 0; for(var k = 0; k < w.id.length; k++) h += w.id.charCodeAt(k); return '<span class="wart'+(w.cat === 'obj' ? '' : ' wide')+'" style="width:'+size+'px">'+exArt(w.cat, w.t, h % 3, w.star)+'</span>'; }
  return sample(w.cat, size, false, w.id.charCodeAt(2), w.engine, w.cls === 'pixel' ? 'plat' : 'top');
}
function workCard(w){
  var v = S.voted[w.id] || {}, cm = (w.comments || []).reduce(function(a, c){ return a + 1 + (c.replies || []).length; }, 0);
  return '<button type="button" class="wcard" data-work="'+w.id+'"><span class="wimg">'+workArt(w, 120)+'</span>'
    + '<span class="wb"><span class="pmeta"><span class="tchip">'+catName(w.cat)+'</span>'+(CLSN[w.cls] ? '<span>'+CLSN[w.cls]+'</span>' : '')+(w.mine ? '<span class="chip c-mute">내 글</span>' : '<span class="chip c-mute">예시</span>')+(w.pending ? '<span class="chip c-warn">검토 중</span>' : '')+'</span>'
    + '<b>'+esc(w.title)+'</b><span class="wa">작성자 평가 <b>'+starTxt(w.star)+'</b> · '+SAT[w.sat]+'</span><span class="wh2">'+HOWW[w.how]+(w.tries ? ' · '+w.tries+'번 만에' : '')+'</span>'
    + '<span class="wo">도움돼요 '+(w.helpful + (v.h ? 1 : 0))+' · 댓글 '+cm+'</span>'+(isOpenW(w) ? '' : '<span class="wlock">'+ui('lock', 12)+' 프롬프트·후기는 토큰 '+TOK_WORK+'개</span>')+'<small>'+esc(w.who)+' · '+w.when+'</small></span></button>';
}
var REPLY_TO = null;
function openWork(id){
  var w = S.works.filter(function(x){ return x.id === id; })[0]; if(!w) return;
  var v = S.voted[w.id] || {}, T = TOOLS[w.t], om = $('layer').querySelector('.modal.work'), keepY = om && om.dataset.w === w.id ? om.scrollTop : 0;
  function cmt(c, parent){ return '<li class="cm'+(parent ? ' rp' : '')+'"><div><b>'+esc(c.who)+'</b><small>'+esc(c.when)+'</small></div><p>'+esc(c.text)+'</p>'
      + (!parent ? '<button type="button" class="link sm" data-replyto="'+c.id+'">답글</button>' + (c.replies && c.replies.length ? '<ul>' + c.replies.map(function(r){ return cmt(r, c); }).join('') + '</ul>' : '')
        + (REPLY_TO === c.id ? '<div class="cmin"><label class="sr" for="rIn">답글</label><input class="field" id="rIn" maxlength="200" placeholder="'+esc(c.who)+'님에게 답글" data-autofocus><button type="button" class="btn sm" data-replysend="'+w.id+'|'+c.id+'">답글 달기</button></div>' : '') : '') + '</li>'; }
  var cm = (w.comments || []).reduce(function(a, c){ return a + 1 + (c.replies || []).length; }, 0);
  openLayer('<div class="modal wide work" data-w="'+w.id+'" role="dialog" aria-modal="true" aria-labelledby="wkT"><div class="mh"><div class="pmeta"><span class="tchip">'+T.name+'</span><span>'+catName(w.cat)+(CLSN[w.cls] ? ' · '+CLSN[w.cls] : '')+(w.engine ? ' · '+w.engine : '')+'</span>'+(w.mine ? '' : '<span class="chip c-mute">예시</span>')+'</div>'+closeBtn()+'</div>'
    + '<h2 id="wkT">'+esc(w.title)+'</h2><div class="lb-img wide-img">'+workArt(w, 260)+'</div>'
    + '<section class="wsec" aria-labelledby="waT"><h3 id="waT">작성자 '+esc(w.who)+'의 평가 <small>'+w.when+'</small></h3><dl class="kv2"><dt>별점</dt><dd><b>'+starTxt(w.star)+'</b></dd><dt>만족감</dt><dd><small>들인 돈과 노력에 비해</small> '+SAT[w.sat]+'</dd><dt>고친 방식</dt><dd>'+HOWW[w.how]+'</dd>'+(w.tries ? '<dt>다시 뽑은 횟수</dt><dd>'+w.tries+'번 만에 마음에 들었어요</dd>' : '')+(w.cost && !isOpenW(w) ? '<dt>들어간 돈</dt><dd><span class="lk-t">'+ui('lock', 12)+' 열면 보여요</span></dd>' : '') + (w.cost && isOpenW(w) ? '<dt>들어간 돈</dt><dd>'+won(w.cost.krw)+(w.cost.note ? ' <small>'+esc(w.cost.note)+'</small>' : '')+'</dd>' : '')+'</dl>'
    + (function(){ var h = (w.prompt ? '<div class="prompt"><div><span class="mono">'+esc(w.prompt)+'</span><small>사용한 프롬프트</small></div><button type="button" class="btn sm sec" data-copyp="'+esc(w.prompt)+'">복사</button></div>' : '')
    + (w.note ? '<p class="body-l"><b>하고 싶은 말</b> '+esc(w.note)+'</p>' : ''); return !h ? '' : isOpenW(w) ? h : lockBox(h, '사용한 프롬프트와 작성자의 말', TOK_WORK, 'data-unlock="'+w.id+'"'); })() + '</section>'
    + (function(){ var h = '<section class="wsec other" aria-labelledby="woT"><h3 id="woT">다른 사용자의 평가</h3><div class="row-acts">'
    + (w.mine ? '<span class="likes">도움돼요 '+w.helpful+' · 나도 비슷했어요 '+w.same+' · 나는 달랐어요 '+w.diff+'</span>' : '<button type="button" class="helpful" data-whelp="'+w.id+'" aria-pressed="'+!!v.h+'">도움돼요 '+(w.helpful + (v.h ? 1 : 0))+'</button><button type="button" class="helpful" data-wvote="'+w.id+'|same" aria-pressed="'+(v.v === 'same')+'">나도 비슷했어요 '+(w.same + (v.v === 'same' ? 1 : 0))+'</button><button type="button" class="helpful" data-wvote="'+w.id+'|diff" aria-pressed="'+(v.v === 'diff')+'">나는 달랐어요 '+(w.diff + (v.v === 'diff' ? 1 : 0))+'</button>')
    + '</div><p class="note">‘나도 비슷했어요’가 많을수록 이 결과물이 그 도구의 보통 결과에 가깝다는 뜻이에요.</p></section>'
    + '<section class="wsec" aria-labelledby="wcT"><h3 id="wcT">댓글 '+cm+'</h3><ul class="cms">' + (w.comments || []).map(function(c){ return cmt(c, null); }).join('') + '</ul>'
    + '<div class="cmin"><label class="sr" for="cIn">댓글</label><input class="field" id="cIn" maxlength="200" placeholder="궁금한 점이나 써 본 경험을 남겨 주세요"><button type="button" class="btn sm" data-cmtsend="'+w.id+'">댓글 달기</button></div></section>'; return isOpenW(w) ? h : lockBox(h, '다른 사용자의 평가와 댓글 '+cm+'개', TOK_WORK, 'data-unlock="'+w.id+'"'); })()
    + '<div class="pfoot"><span>'+esc(w.who)+' · '+w.when+'</span>'+(w.mine ? '' : '<button type="button" class="btn sm quiet" data-report="'+w.id+'">'+ui('flag', 14)+'신고</button>')+'</div></div>');
  var nm = $('layer').querySelector('.modal.work'); if(nm && keepY) nm.scrollTop = keepY;
  if(WORK_FOCUS){ try { var wf = $('layer').querySelector(WORK_FOCUS); if(wf) wf.focus({preventScroll:true}); } catch(x){} WORK_FOCUS = null; }
}
var WORK_FOCUS = null;
function toolRevSheet(t){
  var mine = (S.toolRev[t] || []).filter(function(x){ return x.mine; })[0] || {}; TR = {t:t, star:mine.star || null};
  openLayer('<form class="modal sheet" id="trF" role="dialog" aria-modal="true" aria-labelledby="trT" novalidate>'+mh('trT', TOOLS[t].name+' 평가하기')
    + '<p class="note">결과물 하나가 아니라 도구 자체(가격 대비, 쓰기 편함, 전반적인 만족)를 평가해요. 도구 총 별점에 들어가고, 한 사람이 하나만 남겨요.</p>'
    + '<div class="fld">별점<div class="seg" role="group" aria-label="별점">'+[1,2,3,4,5].map(function(x){ return '<button type="button" data-trstar="'+x+'" aria-pressed="'+(TR.star === x)+'">'+x+'점</button>'; }).join('')+'</div><span class="err" id="trErr"></span></div>'
    + '<label class="fld">한 줄 평 <span class="opt-l">선택</span><input class="field" id="trText" maxlength="60" value="'+esc(mine.text || '')+'" placeholder="예: 도트 캐릭터는 이만한 게 없어요"></label>'
    + '<div class="row-acts end"><button type="button" class="btn sec" data-act="close-layer">취소</button><button type="submit" class="btn">남기기</button></div></form>');
}
var TR = null;
var UP = {file:false, tool:'pixellab', cat:'obj', cls:'pixel', star:null, sat:null, how:null};
function upCats(t){ var m = (TOOLCATS[t] || 'obj').split(' '); return CATS.filter(function(c){ return m.indexOf(c[0]) >= 0; }); }
function openUpload(forTool){
  var opts = toolIds();
  if(forTool && opts.indexOf(forTool) >= 0) UP.tool = forTool;
  var isAI = !!TOOLS[UP.tool].ai, cats = upCats(UP.tool); if(!cats.some(function(c){ return c[0] === UP.cat; })) UP.cat = cats[0][0];
  function err(id){ return '<span class="err" id="'+id+'Err"></span>'; }
  function seg(attr, list, cur, label){ return '<div class="seg" role="group" aria-label="'+label+'" aria-describedby="'+attr+'Err">' + list.map(function(x){ return '<button type="button" data-'+attr+'="'+x[0]+'" aria-pressed="'+(String(cur) === String(x[0]))+'">'+x[1]+'</button>'; }).join('') + '</div>'; }
  openLayer('<form class="modal" id="upF" role="dialog" aria-modal="true" aria-labelledby="upT" novalidate>'+mh('upT', '결과물 올리기')
    + '<p class="note">올린 결과물은 다른 개발자가 도구를 고를 때 근거가 되고, 그 도구의 에셋별 별점에 들어가요.</p>'
    + '<div class="fld">결과물 파일 <span class="opt-l">PNG, GIF, WAV, TXT · 10MB까지</span><button type="button" class="drop'+(UP.file ? ' has' : '')+'" id="upFile" data-act="pick-file" aria-describedby="upFileErr" data-autofocus><span class="th2">'+(UP.file ? sample('sprite', 44) : icon('store', 24, '#9098a6'))+'</span><span>'+(UP.file ? '<b>knight_idle_01.png</b><br><span class="note">다시 누르면 바꿀 수 있어요</span>' : '눌러서 파일을 고르세요')+'</span></button>'+err('upFile')+'</div>'
    + '<div class="fgrid"><label class="fld">어떤 도구로 만들었나요?<select class="field" id="upTool">'+opts.map(function(k){ return '<option value="'+k+'"'+(k === UP.tool ? ' selected' : '')+'>'+TOOLS[k].name+'</option>'; }).join('')+'</select></label>'
    + '<label class="fld">어떤 에셋인가요?<select class="field" id="upCat">'+cats.map(function(c){ return '<option value="'+c[0]+'"'+(UP.cat === c[0] ? ' selected' : '')+'>'+c[1]+'</option>'; }).join('')+'</select></label></div>'
    + (artCat(UP.cat) ? '<div class="fld">그림체 갈래'+seg('upcls', [['pixel', '도트'], ['2d', '2D'], ['3d', '3D']], UP.cls, '그림체 갈래')+'</div>' : '')
    + '<label class="fld">제목 <span class="opt-l">5자 이상</span><input class="field" id="upTitle" maxlength="40" placeholder="예: 32px 기사 대기·걷기·공격" value="'+esc(UP.title || '')+'" aria-describedby="upTitleErr">'+err('upTitle')+'</label>'
    + '<div class="fld">내 별점'+seg('upstar', [[1, '1점'], [2, '2점'], [3, '3점'], [4, '4점'], [5, '5점']], UP.star, '별점')+err('upstar')+'</div>'
    + '<div class="fld">들인 돈과 노력에 비해 어땠나요?'+seg('upsat', [['over', '기대 이상'], ['meet', '기대만큼'], ['under', '기대 이하']], UP.sat, '만족감')+err('upsat')+'</div>'
    + (isAI ? '<div class="fld">고친 방식'+seg('uphow', [['as', '그대로'], ['aiedit', 'AI에게 다시 고치게 함'], ['human', '직접 손봄'], ['both', '둘 다']], UP.how, '고친 방식')+err('uphow')+'</div>'
      + '<label class="fld">다시 뽑은 횟수 <span class="opt-l">선택</span><span class="ninp"><input class="field" id="upTries" type="number" min="1" max="99" placeholder="3">번 만에</span></label>'
      + '<label class="fld">사용한 프롬프트 <span class="opt-l">선택</span><input class="field" id="upPrompt" placeholder="예: 32x32 pixel art knight, idle pose"></label>' : '')
    + (METERED[UP.tool] ? '<label class="fld">들어간 돈 <span class="opt-l">선택 · 쓴 만큼 내는 도구라 있으면 좋아요</span><span class="ninp"><input class="field" id="upCost" type="number" min="0" placeholder="2400">원</span></label>' : '')
    + '<label class="fld">하고 싶은 말 <span class="opt-l">선택</span><textarea class="field" id="upNote" maxlength="300" placeholder="좋았던 점, 아쉬웠던 점, 다른 사람에게 줄 팁"></textarea></label>'
    + '<label class="ckl"><input type="checkbox" id="upOwn" aria-describedby="upOwnErr"><span>제가 직접 만든 결과물이에요. 다른 사람의 결과물이면 숨김 처리돼요.</span></label>'+err('upOwn')
    + '<button type="submit" class="btn lg">올리기</button></form>');
}
function uploadSubmit(){
  var title = $('upTitle').value.trim(), own = $('upOwn').checked, isAI = !!TOOLS[UP.tool].ai, first = null;
  function chk(ok, eid, msg, el){ setErr(eid, ok ? '' : msg, el); if(!ok && !first) first = el || $(eid); }
  chk(UP.file, 'upFile', '결과물 파일을 골라 주세요.');
  chk(title.length >= 5, 'upTitle', title ? '제목을 5자 이상 적어 주세요.' : '제목을 적어 주세요.');
  chk(!!UP.star, 'upstar', '별점을 골라 주세요.', document.querySelector('[aria-label="별점"]'));
  chk(!!UP.sat, 'upsat', '만족감을 골라 주세요.', document.querySelector('[aria-label="만족감"]'));
  if(isAI) chk(!!UP.how, 'uphow', '고친 방식을 골라 주세요.', document.querySelector('[aria-label="고친 방식"]'));
  chk(own, 'upOwn', '직접 만든 결과물인지 확인해 주세요.');
  if(first){ var ff = first.matches && first.matches('.seg') ? first.querySelector('button') : first; ff.focus(); ff.scrollIntoView({block:'center'}); return; }
  var tr = $('upTries'), pr = $('upPrompt'), co = $('upCost'), id = 'm' + Date.now().toString(36);
  var w = {id:id, t:UP.tool, cat:UP.cat, cls:artCat(UP.cat) ? UP.cls : 'any', engine:'', who:'나', when:'방금', ago:0, title:title, star:UP.star, sat:UP.sat, how:isAI ? UP.how : 'human', tries:tr && +tr.value || null, prompt:pr ? pr.value.trim() : '', cost:co && +co.value > 0 ? {krw:+co.value} : null, note:$('upNote').value.trim(), helpful:0, same:0, diff:0, comments:[], mine:true, pending:true};
  S.works.unshift(w); QCACHE = {};
  var t = UP.tool; UP = {file:false, tool:t, cat:UP.cat, cls:UP.cls, star:null, sat:null, how:null};
  closeLayer(); S.toolT = t; S.toolCat = w.cat; go('tool');
  S.tokens = (S.tokens || 0) + TOK_UP; toast('올렸어요. 토큰 ' + TOK_UP + '개를 받았어요(지금 ' + S.tokens + '개). 검토가 끝나면 에셋별 별점에 들어가요.');
  setTimeout(function(){ w.pending = false; if(S.view === 'tool' && !$('layer').innerHTML) renderToolPage(); persist(); }, reduceMotion ? 300 : 2500);
}


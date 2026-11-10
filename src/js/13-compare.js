/* ============================== 견적 비교표: 열은 견적, 행은 에셋 종류 ============================== */
var GRPN = {obj:'캐릭터·사물', scene:'배경·맵', ui:'UI·아이콘', illus:'일러스트', sfx:'효과음', bgm:'배경음악', text:'글·대사', code:'코드', loc:'번역'};
var BASEP = {
  obj:'32x32 pixel art knight, idle pose, side view, transparent background',
  scene:'16x16 pixel art forest tileset, grass, dirt, trees',
  ui:'pixel art game UI kit, health bar, inventory slots, buttons',
  illus:'key art of a small knight facing a giant dragon, dramatic light',
  sfx:'short 8-bit sword slash sound, 0.3 seconds',
  bgm:'calm 8-bit forest exploration loop, 90 seconds',
  text:'NPC 상인의 첫 인사 대사 3줄, 친근한 말투',
  code:'2D 플랫포머 점프와 충돌 처리'
};
var SMPC = {obj:'sprite', scene:'tile', ui:'store', illus:'store'};
function cmpGroups(st, qty){ var g = [], by = {}; rowsOf(st).forEach(function(r){ if(!(qty[r.id] > 0)) return; var k = GRPN[r.cat] ? r.cat : 'x_' + r.id; if(!by[k]){ by[k] = {k:k, cat:r.cat, name:GRPN[r.cat] || RN(r), rows:[]}; g.push(by[k]); } by[k].rows.push(r); }); return g; }
function cellTools(q, grp){ var seen = {}, out = []; grp.rows.forEach(function(r){ var t = q.picks[r.id]; if(!optOf(r, t) || seen[t]) return; seen[t] = r; out.push(t); }); return {list:out, by:seen}; }
function toolHash(t){ var h = 0; for(var k = 0; k < t.length; k++) h = (h * 31 + t.charCodeAt(k)) % 997; return h; }
function cmpCell(q, grp, st, qi, cont){
  var ct = cellTools(q, grp), out = ct.list;
  return out.map(function(t){
    var r = ct.by[t], T = TOOLS[t], qv = qualOf(t, r.cat, rowCls(r, st)), sc = SMPC[r.cat], vis = '', h = toolHash(t);
    if(sc){ var looks = ['sprite', 'anim', 'store', 'tile'], filt = 'hue-rotate('+((h % 7) * 47)+'deg) saturate('+(0.7 + (h % 5) * 0.2).toFixed(1)+')';
      for(var i = 0; i < 3; i++){ var c2 = r.cat === 'obj' ? (i === 1 && h % 2 ? 'anim' : 'sprite') : r.cat === 'scene' ? (i === 2 && h % 3 === 0 ? 'store' : 'tile') : looks[(h + i) % 4];
        vis += '<span class="cm-img" style="filter:'+filt+'">'+sample(c2, 56, qv.n && qv.star < 3.7 && i === 2, h * 3 + i * 5, null, (h + i) % 2 ? 'plat' : 'top')+'</span>'; }
      vis = '<span class="cm-imgs">'+vis+'</span>'; }
    else if(r.cat === 'sfx' || r.cat === 'bgm') vis = '<span class="cm-snd">'+ui('play', 14)+' 예시 듣기</span>';
    var names = grp.rows.length > 1 && out.length > 1 ? '<small class="cm-for">'+grp.rows.filter(function(x){ return q.picks[x.id] === t; }).map(function(x){ return RN(x); }).join(', ')+'</small>' : '';
    var st2 = '<span class="cm-st'+(qv.n ? '' : ' none')+'">'+(qv.n ? starTxt(qv.star) : '평가 없음')+'</span>';
    var head = cont ? '<span class="cm-nm cont"><small>같은 도구</small>'+st2+'</span>' : '<span class="cm-nm"><i class="bd-dot" aria-hidden="true"></i><b>'+T.name+'</b>'+st2+'</span>';
    return '<span class="cm-tool" style="--tc:'+toolCol(t)+'">'+head+names+vis+'</span>';
  }).join('');
}

/* ============================== 비교표 예시 그림: 에셋 종류마다 알아볼 수 있게 그린 도트·일러스트 ============================== */
/* 도구마다 팔레트와 마감 정도가 다르다. 평가가 낮은 도구는 세 번째 결과에 흔한 실수(형태 뭉개짐)를 넣어 고르게 나오지 않는다는 것을 보여 준다 */
var ART_PALS = [
  {o:'#1b1530', h:'#c9d3e6', H:'#8d9bb8', v:'#2a2140', p:'#e2475a', a:'#7f8fb3', d:'#55628a', s:'#e8eef7', g:'#f2c46d', b:'#5a3d2b', sky:'#7cc4f0', sky2:'#bfe6ff', gr:'#5fbf4a', gr2:'#3f8f37', dirt:'#9b6a43', dirt2:'#6e472b', st:'#8a8f9c', leaf:'#3fa34d', leaf2:'#2a7a3b', trunk:'#7a4f2e'},
  {o:'#20131a', h:'#e8c27a', H:'#b8893f', v:'#3a1d14', p:'#4f8fe6', a:'#b9534a', d:'#843630', s:'#f3efe6', g:'#ffd36b', b:'#3b2a22', sky:'#f4a774', sky2:'#ffd9a8', gr:'#8fbf3f', gr2:'#5f8f2a', dirt:'#a8744a', dirt2:'#73492c', st:'#9c8f86', leaf:'#6aa63f', leaf2:'#47782a', trunk:'#6b4428'},
  {o:'#0f1a1f', h:'#9fe0d0', H:'#5aa898', v:'#12332e', p:'#f2c46d', a:'#4f9a8c', d:'#2f6b60', s:'#e6fff8', g:'#f2c46d', b:'#2a3b3a', sky:'#6a7fd6', sky2:'#a9b8ff', gr:'#4fc59a', gr2:'#2f8f6b', dirt:'#6b5a8a', dirt2:'#463a63', st:'#7d86a8', leaf:'#3fb38a', leaf2:'#24805f', trunk:'#5a4466'}
];
function artPal(t){ return ART_PALS[toolHash(t) % ART_PALS.length]; }
function pxSvg(rows, pal, w, h, extra){
  var out = '', W = w || rows[0].length, H = h || rows.length;
  rows.forEach(function(r, y){ for(var x = 0; x < r.length; x++){ var c = r[x]; if(c === '.' || !pal[c]) continue; var run = 1; while(x + run < r.length && r[x + run] === c) run++; out += '<rect x="'+x+'" y="'+y+'" width="'+run+'" height="1" fill="'+pal[c]+'"/>'; x += run - 1; } });
  return '<svg viewBox="0 0 '+W+' '+H+'" shape-rendering="crispEdges" aria-hidden="true">'+(extra || '')+out+'</svg>';
}
function padRows(rows, w){ return rows.map(function(r){ while(r.length < w) r += '.'; return r.slice(0, w); }); }
/* 캐릭터: 대기 · 걷기 · 공격 세 프레임 */
var KN_TOP = [
  '.......pp...........',
  '......ppp...........',
  '.....oooooo.........',
  '....ohhhhhHo........',
  '....ohhvvvvo...s....',
  '....ohhhhhHo...s....',
  '.....oooooo....s....',
  '....oaaaaaao...s....',
  '...oaaddddaaoogo....',
  '...oaaaaaaaaoggg....',
  '...odaaaaaadoo......',
  '....oaaaaaao........'
];
var KN_ATK = [
  '.......pp...........',
  '......ppp...........',
  '.....oooooo.........',
  '....ohhhhhHo........',
  '....ohhvvvvo........',
  '....ohhhhhHo........',
  '.....oooooo.........',
  '....oaaaaaao........',
  '...oaaddddaaoog.....',
  '...oaaaaaaaaogsssss.',
  '...odaaaaaadoo......',
  '....oaaaaaao........'
];
var KN_LEG = {
  idle:['....oddoddo.........', '....oaao.oaao.......', '...obbo..obbo.......', '...oooo..oooo.......'],
  walk:['....oddoddo.........', '...oaao...oao.......', '..obbo....obbo......', '..oooo.....ooo......'],
  atk: ['....oddoddo.........', '...oaao..oaao.......', '..obbo....obbo......', '..oooo....oooo......']
};
function knight(pal, frame, flat, bad){
  var top = frame === 'atk' ? KN_ATK : KN_TOP, rows = padRows(top.concat(KN_LEG[frame]), 20);
  var P = {}; Object.keys(pal).forEach(function(k){ P[k] = pal[k]; }); if(flat){ P.H = P.h; P.d = P.a; }
  if(bad){ rows = rows.map(function(r, y){ return y === 4 ? r.replace('vvvv', 'vhvv') : y === 9 ? r.replace('aaaaaaaa', 'aadaaada') : r; }); rows[1] = '.....pppp...........'; rows[13] = '...oaaoo.oaao.......'; }
  return pxSvg(rows, P, 20, 16);
}
/* 배경·맵: 숲 · 동굴 · 마을 */
function scene(pal, kind, flat, bad){
  var r = [], W = 32, H = 18;
  function R(x, y, w, h, c){ r.push('<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+c+'"/>'); }
  var sky = kind === 'cave' ? '#2a2140' : pal.sky, sky2 = kind === 'cave' ? '#3b2f5c' : pal.sky2;
  R(0, 0, W, H, sky); if(!flat){ R(0, 0, W, 4, sky2); R(0, 4, W, 2, sky); }
  if(kind === 'forest'){
    R(24, 2, 3, 3, '#fff3b0'); R(4, 3, 6, 2, '#ffffff'); R(5, 2, 3, 1, '#ffffff'); R(15, 5, 5, 1, '#ffffff');
    R(3, 9, 2, 5, pal.trunk); R(0, 5, 8, 3, pal.leaf); R(1, 4, 6, 1, pal.leaf); if(!flat) R(1, 7, 6, 1, pal.leaf2);
    R(22, 10, 2, 4, pal.trunk); R(20, 7, 6, 3, pal.leaf); if(!flat) R(20, 9, 6, 1, pal.leaf2);
    R(12, 9, 7, 1, pal.gr); R(12, 10, 7, 1, pal.dirt2);
  } else if(kind === 'cave'){
    for(var i = 0; i < 8; i++){ R(i * 4 + 1, 0, 2, 2 + (i * 7) % 3, pal.st); R(i * 4 + 2, 2 + (i * 7) % 3, 1, 1, pal.st); }
    R(7, 8, 1, 1, pal.g); R(25, 6, 1, 1, pal.g); R(16, 4, 1, 1, '#9fe0ff'); R(12, 9, 8, 1, pal.st); R(12, 10, 8, 1, '#4a4466');
  } else {
    R(23, 2, 3, 3, '#fff3b0'); R(3, 8, 9, 6, '#d8c3a5'); R(2, 6, 11, 2, pal.p); R(4, 5, 7, 1, pal.p); R(6, 10, 2, 4, pal.b); R(9, 9, 2, 2, '#7cc4f0');
    R(17, 9, 7, 5, '#c9b28f'); R(16, 7, 9, 2, pal.a); R(18, 6, 5, 1, pal.a); R(20, 11, 2, 3, pal.b); R(26, 11, 1, 3, pal.trunk); R(25, 9, 3, 2, pal.leaf);
  }
  var top = kind === 'cave' ? pal.st : pal.gr, top2 = kind === 'cave' ? '#4a4466' : pal.gr2, dirt = kind === 'cave' ? '#3a3352' : pal.dirt, dirt2 = kind === 'cave' ? '#2a2540' : pal.dirt2;
  R(0, 14, W, 1, top); if(!flat){ for(var x = 0; x < W; x += 3) R(x, 13, 1, 1, top); R(0, 15, W, 1, top2); }
  R(0, flat ? 15 : 16, W, flat ? 3 : 2, dirt); if(!flat){ for(var x2 = 1; x2 < W; x2 += 5) R(x2, 17, 2, 1, dirt2); R(7, 16, 1, 1, pal.st); R(19, 17, 1, 1, pal.st); }
  if(bad){ R(10, 14, 4, 1, sky); R(27, 4, 3, 1, pal.gr); R(15, 15, 2, 2, sky2); }
  return '<svg viewBox="0 0 '+W+' '+H+'" shape-rendering="crispEdges" aria-hidden="true">'+r.join('')+'</svg>';
}
/* UI·아이콘: 체력바 · 버튼 · 가방 */
function uiArt(pal, kind, flat, bad){
  var r = [], W = 32, H = 18;
  function R(x, y, w, h, c){ r.push('<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+c+'"/>'); }
  R(0, 0, W, H, '#1a1d26');
  if(kind === 'hp'){
    var heart = ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'];
    [2, 10, 18].forEach(function(ox, k){ heart.forEach(function(row, y){ for(var x = 0; x < row.length; x++) if(row[x] === 'r') R(ox + x, 3 + y, 1, 1, k === 2 ? '#4a4d5c' : '#e2475a'); }); if(!flat && k < 2) R(ox + 1, 4, 1, 1, '#ffb3bd'); });
    R(2, 12, 26, 4, pal.o); R(3, 13, 24, 2, '#2c3040'); R(3, 13, bad ? 9 : 16, 2, '#4f8fe6'); if(!flat) R(3, 13, bad ? 9 : 16, 1, '#8fc0ff');
  } else if(kind === 'btn'){
    R(4, 4, 24, 10, pal.o); R(5, 5, 22, 8, pal.p); if(!flat){ R(5, 5, 22, 2, '#ffffff33'); R(5, 11, 22, 2, '#00000033'); }
    r.push('<text x="16" y="11.2" text-anchor="middle" font-family="monospace" font-weight="700" font-size="5" fill="#fff">'+(bad ? 'STRAT' : 'START')+'</text>');
  } else {
    for(var i = 0; i < 6; i++){ var x = 3 + (i % 3) * 9, y = 2 + Math.floor(i / 3) * 8; R(x, y, 8, 7, pal.o); R(x + 1, y + 1, 6, 5, flat ? '#2c3040' : '#343a4c'); }
    R(6, 4, 2, 1, '#9fe0ff'); R(5, 5, 4, 3, '#e2475a'); R(16, 3, 1, 4, pal.s); R(15, 6, 3, 1, pal.g); R(24, 4, 3, 3, pal.g); if(!flat) R(24, 4, 1, 1, '#fff3b0');
    R(6, 12, 3, 3, pal.leaf); R(15, 12, 3, 3, '#b07cff');
    if(bad){ R(23, 11, 5, 4, '#e2475a'); }
  }
  return '<svg viewBox="0 0 '+W+' '+H+'" shape-rendering="crispEdges" aria-hidden="true">'+r.join('')+'</svg>';
}
/* 일러스트: 표지 · 컷신 · 카드 (매끈한 그림) */
function illusArt(pal, kind, flat, bad, uid){
  var id = 'g' + uid, W = 64, H = 40, s = '';
  s += '<defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+(kind === 'card' ? pal.d : '#141836')+'"/><stop offset="1" stop-color="'+(kind === 'card' ? pal.a : pal.sky)+'"/></linearGradient></defs>';
  s += '<rect width="'+W+'" height="'+H+'" fill="'+(flat ? (kind === 'card' ? pal.a : '#23285a') : 'url(#'+id+')')+'"/>';
  if(kind === 'cover'){
    s += '<circle cx="48" cy="11" r="6" fill="#fff3b0" opacity=".9"/>';
    s += '<path d="M0 30 L12 18 L20 26 L32 12 L44 26 L52 20 L64 30 L64 40 L0 40Z" fill="'+pal.d+'"/>';
    s += '<path d="M30 16 C36 10 44 10 50 15 C46 14 44 16 46 19 C41 17 38 19 36 22 C34 19 31 18 30 16Z" fill="#1b1530"/>';
    s += '<path d="M14 40 L16 31 L18 31 L20 40Z" fill="#1b1530"/><circle cx="17" cy="30" r="1.6" fill="#1b1530"/><path d="M18.5 29 L23 22" stroke="'+pal.s+'" stroke-width=".8"/>';
    s += '<text x="32" y="37" text-anchor="middle" font-family="serif" font-weight="700" font-size="5" fill="'+pal.g+'">'+(bad ? 'DRAGN' : 'DRAGON')+'</text>';
  } else if(kind === 'cut'){
    s += '<rect x="0" y="26" width="64" height="14" fill="'+pal.dirt2+'"/><rect x="8" y="10" width="14" height="16" fill="'+pal.st+'"/><path d="M6 10 L15 3 L24 10Z" fill="'+pal.p+'"/>';
    s += '<circle cx="40" cy="20" r="3" fill="'+pal.h+'"/><rect x="37" y="23" width="6" height="7" rx="1" fill="'+pal.a+'"/>';
    s += '<circle cx="50" cy="21" r="3" fill="#f0c9a5"/><rect x="47" y="24" width="6" height="6" rx="1" fill="'+pal.leaf+'"/>';
    s += '<rect x="4" y="31" width="56" height="7" rx="1.5" fill="#000000aa" stroke="#ffffff55" stroke-width=".4"/><rect x="7" y="33.3" width="30" height="1" fill="#fff"/><rect x="7" y="35.3" width="22" height="1" fill="#ffffffaa"/>';
  } else {
    s += '<rect x="14" y="2" width="36" height="36" rx="3" fill="#1b1530" stroke="'+pal.g+'" stroke-width="1"/><rect x="17" y="5" width="30" height="20" rx="1.5" fill="'+pal.sky+'"/>';
    s += '<path d="M22 25 C24 16 30 12 32 9 C34 12 40 16 42 25Z" fill="'+pal.p+'"/><circle cx="32" cy="16" r="2.4" fill="#fff3b0"/>';
    s += '<rect x="17" y="28" width="30" height="2" fill="'+pal.g+'"/><rect x="17" y="32" width="22" height="1.2" fill="#ffffff88"/><circle cx="18" cy="5" r="3" fill="'+pal.g+'"/><text x="18" y="6.6" text-anchor="middle" font-family="monospace" font-size="4" font-weight="700" fill="#1b1530">3</text>';
    if(bad) s += '<path d="M40 8 L46 14" stroke="#ff8089" stroke-width="1.4"/>';
  }
  return '<svg viewBox="0 0 '+W+' '+H+'" aria-hidden="true">'+s+'</svg>';
}
var ART_CAP = {obj:['대기', '걷기', '공격'], scene:['숲', '동굴', '마을'], ui:['체력바', '버튼', '가방'], illus:['표지', '컷신', '카드']};
var ART_UID = 0;
function exArt(cat, t, i, star){
  var pal = artPal(t), T = TOOLS[t] || {}, flat = !T.ai, bad = star != null && star < 3.7 && i === 2;
  if(cat === 'obj') return knight(pal, ['idle', 'walk', 'atk'][i], flat, bad);
  if(cat === 'scene') return scene(pal, ['forest', 'cave', 'town'][i], flat, bad);
  if(cat === 'ui') return uiArt(pal, ['hp', 'btn', 'bag'][i], flat, bad);
  if(cat === 'illus') return illusArt(pal, ['cover', 'cut', 'card'][i], flat, bad, ++ART_UID);
  return '';
}
/* 한 칸(에셋 종류 하나)에 들어가는 내용: 그 에셋의 별점과 예시 세 장 */
function isSelfTool(t){ return t === 'aseprite' || t === 'blender' || t.indexOf('self') === 0; }
function cmpSec(q, g, st, t){
  var r = g.rows.filter(function(x){ return q.picks[x.id] === t; })[0] || g.rows[0], qv = qualOf(t, r.cat, rowCls(r, st)), cap = ART_CAP[r.cat], vis = '';
  var selfT = isSelfTool(t);
  if(selfT && (cap || r.cat === 'sfx' || r.cat === 'bgm')) vis = '<span class="cm-self">직접 만드는 에셋이라 예시가 없어요</span>';
  else if(cap){ vis = '<span class="cm-imgs'+(r.cat === 'illus' || r.cat === 'scene' || r.cat === 'ui' ? ' wide' : '')+'">' + cap.map(function(c, i){ return '<span class="cm-fig"><span class="cm-img">'+exArt(r.cat, t, i, qv.n ? qv.star : null)+'</span><small>'+c+'</small></span>'; }).join('') + '</span>'; }
  else if(r.cat === 'sfx' || r.cat === 'bgm') vis = '<span class="cm-snd" role="button" tabindex="0" data-play="'+r.cat+'|'+t+'">'+ui('play', 14)+' 예시 듣기<span class="wave" aria-hidden="true">'+[3,6,9,5,8,4,7,3,6,9,4,6].map(function(h){ return '<i style="height:'+h+'px"></i>'; }).join('')+'</span></span>';
  var star = '<span class="cm-st'+(qv.n ? '' : ' none')+'">'+(qv.n ? starTxt(qv.star) : '평가 없음')+'</span>';
  var part = g.rows.length > 1 && cellTools(q, g).list.length > 1 ? '<small class="cm-for">'+g.rows.filter(function(x){ return q.picks[x.id] === t; }).map(function(x){ return RN(x); }).join(', ')+'</small>' : '';
  return '<span class="cm-sh"><span class="cm-sk">'+esc(g.name)+' 별점</span>'+star+'</span>'+part+vis;
}
function toolPriceTag(t, st){ var m = toolCost(t, st), o = onceCost(t, st); return m ? '<span class="cm-pt paid">월 '+won(m)+'</span>' : o ? '<span class="cm-pt paid">한 번 '+won(o)+'</span>' : has(t, st) ? '<span class="cm-pt own">쓰는 중</span>' : '<span class="cm-pt free">무료</span>'; }
function cmpHTML(calcs){
  var d = S.draft, st = d.setup, rec = recommend(calcs, st), fi = foldInfo(calcs), vis = d.quotes.map(function(q, i){ return i; }).filter(function(i){ return visibleQ(i, fi); }), groups = cmpGroups(st, d.qty), n = vis.length, G = groups.length, items = [];
  function at(row, col, span){ return 'grid-row:'+row+(span > 1 ? ' / span '+span : '')+';grid-column:'+col; }
  /* 고른 견적 열 뒤에 깔리는 배경 */
  vis.forEach(function(i, k){ if(d.sel === i) items.push('<div class="cm-colbg sel" style="grid-row:1 / span '+(G + 2)+';grid-column:'+(k + 2)+'" aria-hidden="true"></div>'); });
  /* 머리: 견적마다 돈과 평균 별점 */
  items.push('<div class="cm-lab cm-hl" style="'+at(1, 1)+'"><small>에셋</small></div>');
  vis.forEach(function(i, k){ var q = d.quotes[i], c = calcs[i], iss = [], nT = usedTools(q.picks, d.qty, st).length;
    if(Object.keys(c.third).length) iss.push('<span title="공식 가격표가 없어 다른 곳에 올라온 가격으로 계산한 도구가 있어요">일부 가격은 추정값</span>'); if(c.overMonthly) iss.push('월 추가 예산 ' + won(c.overMonthly) + ' 넘음'); if(c.buyMissing) iss.push('구매가 빠짐'); if(Object.keys(c.free).length) iss.push('상업 이용 확인');
    items.push('<button type="button" class="cm-h'+(d.sel === i ? ' sel' : ' nsel')+'" style="'+at(1, k + 2)+'" data-q="'+i+'" aria-pressed="'+(d.sel === i)+'"><span class="cm-t"><span class="cm-name">'+PRIO[q.strat]+'</span>'+(rec === i ? '<span class="chip c-rec">추천</span>' : '')+'</span>'
      + '<span class="cm-desc">'+PRIO_D[q.strat]+'</span><span class="cm-cnt">도구 '+nT+'개 · 유료 '+c.paidN+'개</span>'
      + '<span class="cm-kv"><span><small>월 추가 비용</small><b class="cm-money'+(c.overMonthly ? ' t-red' : '')+'">'+won(c.monthly)+'</b></span><span><small>평균 별점</small><b class="cm-avg">'+starTxt(c.qavg)+'</b></span></span>'
      + (c.once ? '<span class="cm-once">한 번 드는 돈 '+won(c.once)+'</span>' : '') + (iss.length ? '<span class="cm-iss">'+iss.join(' · ')+'</span>' : '') + '</button>'); });
  /* 행 이름 */
  groups.forEach(function(g, gi){ var keys = vis.map(function(i){ return cellTools(d.quotes[i], g).list.join('+'); }), same = n > 1 && keys.every(function(k){ return k === keys[0]; }); items.push('<div class="cm-lab'+(same ? ' same' : '')+'" style="'+at(gi + 2, 1)+'"><b>'+esc(g.name)+'</b>'+(same ? '<span class="cm-same">모든 견적 같음</span>' : '')+'<small>'+g.rows.reduce(function(a, r){ return a + d.qty[r.id]; }, 0)+RU(g.rows[0])+'</small>'+(BASEP[g.cat] ? '<button type="button" class="link sm" data-basep="'+g.cat+'">기준 프롬프트</button>' : '')+'</div>'); });
  /* 견적 열: 같은 도구가 이어지는 행은 카드 하나로 묶는다 */
  vis.forEach(function(i, k){ var q = d.quotes[i], gi = 0, sc = d.sel === i ? ' sel' : ' nsel';
    while(gi < G){ var l = cellTools(q, groups[gi]).list, key = l.length === 1 ? l[0] : '', span = 1;
      if(key) while(gi + span < G){ var l2 = cellTools(q, groups[gi + span]).list; if(l2.length === 1 && l2[0] === key) span++; else break; }
      var tools = key ? [key] : l, T0 = TOOLS[tools[0]] || {};
      var secs = []; for(var j = 0; j < span; j++){ var g = groups[gi + j]; secs.push('<button type="button" class="cm-sec" data-cellq="'+i+'|'+g.rows[0].id+'" aria-label="'+QN(q)+' '+esc(g.name)+' 자세히">'+(j === 0 ? '<span class="cm-th">'+tools.map(function(t){ return '<span class="cm-tn">'+av(t, 26)+'<b>'+(isSelfTool(t) ? toolLabel(t, st) : TOOLS[t].name)+'</b>'+toolPriceTag(t, st)+'</span>'; }).join('')+(span > 1 ? '<span class="cm-span">에셋 '+span+'종을 맡아요</span>' : '')+'</span>' : '')+tools.map(function(t){ return cmpSec(q, g, st, t); }).join('<span class="cm-div"></span>')+'</button>'); }
      items.push('<div class="cm-card'+sc+(key ? '' : ' mix')+'" style="'+at(gi + 2, k + 2, span)+';--tc:'+(T0.av || '#7c8597')+'">'+secs.join('')+'</div>');
      gi += span; } });
  /* 아래: 고르기 */
  items.push('<div class="cm-lab" style="'+at(G + 2, 1)+'"></div>');
  vis.forEach(function(i, k){ items.push('<div class="cm-f'+(d.sel === i ? ' sel' : ' nsel')+'" style="'+at(G + 2, k + 2)+'">'+(d.sel === i ? '<span class="cm-picked">'+ui('check', 14)+' 고른 견적</span>' : '<button type="button" class="btn sm sec" data-q="'+i+'">이 견적 고르기</button>')+'</div>'); });
  var tabs = '<div class="cm-tabs" role="group" aria-label="견적 고르기">' + vis.map(function(i){ var q = d.quotes[i], c = calcs[i]; return '<button type="button" data-q="'+i+'" aria-pressed="'+(d.sel === i)+'"><b>'+QN(q)+(rec === i ? ' · 추천' : '')+'</b><small>'+won(c.monthly)+' · '+starTxt(c.qavg)+'</small></button>'; }).join('') + '</div>';
  return '<section class="card cmpwrap" aria-labelledby="cmT"><div class="tbl-h"><h2 id="cmT">견적 비교</h2><span class="note">그림은 에셋마다 정한 기준 프롬프트를 각 도구에 넣어 뽑은 예시예요. 같은 줄을 가로로 보면 도구별 결과가 비교되고, 한 카드로 묶인 칸은 같은 도구가 맡아요.</span></div>' + tabs
    + '<div class="cmp" style="--n:'+n+';--g:'+G+'">' + items.join('') + '</div></section>';
}
function condLine(){
  var st = S.draft.setup, it = condItems(st), show = S.condAll ? it : it.slice(0, 3), rest = it.length - 3;
  return '<div class="cline"><span class="cl-l">조건</span>' + show.map(function(x){ return '<button type="button" class="cl-c" data-cond="'+x[0]+'"><small>'+x[1]+(x[3] ? ' · 가정' : '')+'</small>'+esc(x[2])+'</button>'; }).join('') + '<button type="button" class="btn sm sec" data-act="cond-all" aria-expanded="'+!!S.condAll+'">'+(S.condAll ? '조건 접기' : '조건 '+rest+'개 더 보기')+'</button></div>';
}

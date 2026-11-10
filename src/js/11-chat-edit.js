/* ============================== 말로 고치기 ============================== */
/* 질문 화면 5단계와 견적 도우미가 함께 쓰는 규칙 기반 해석기. 에셋 목록, 일정, 출시하는 곳, 도구, AI 범위, VRAM, 그림체·시점을 고친다 */
var OBJ_SYN = [[/주인공|플레이어/, '주인공|플레이어'], [/^적|적$|몬스터|에너미|괴물/, '적|몬스터|괴물|에너미'], [/보스/, '보스'], [/NPC|npc|주민/, 'NPC|npc|엔피씨|주민'], [/사물|오브젝트|소품/, '사물|오브젝트|소품'], [/등장인물|캐릭터/, '등장인물']];
/* 이름이 직접 겹치는 묶음을 먼저, 없으면 같은 뜻의 말(몬스터 → 적)로 찾는다 */
function objMatch(inv, word){
  var w = word.replace(/\s/g, '');
  var direct = inv.obj.filter(function(g){ var n = g.name.replace(/\s/g, ''); return w && (n === w || (w.length >= 2 && n.indexOf(w) >= 0) || w.indexOf(n) >= 0); });
  if(direct.length) return direct;
  return inv.obj.filter(function(g){ return OBJ_SYN.some(function(p){ return p[0].test(g.name) && new RegExp(p[1]).test(w); }); });
}
function monthOff(mo){ var o = (mo - 11 + 12) % 12; return o === 0 ? 12 : o; }
/* 말로 기능을 끄고 켤 때 쓰는 다른 이름 */
var SYS_AL = {save:'세이브|저장', menu:'메뉴|설정 화면|옵션 화면', tutorial:'튜토리얼', multi:'멀티|온라인', local:'다국어|현지화|번역', achieve:'업적', touch:'터치', combat:'공격|전투 판정', procgen:'맵 생성|무작위 맵|랜덤 맵', items:'아이템|강화', dialog:'대화 표시|대화창', inventory:'인벤', quest:'퀘스트', score:'점수|랭킹', daynight:'낮과 밤|낮밤', craft:'제작|크래프팅', gather:'채집', build:'건설', economy:'경제|자원'};
var ENG_AL = [['Unity', '유니티|unity'], ['Godot', '고도|godot'], ['Unreal', '언리얼|unreal'], ['GameMaker', '게임 ?메이커|gamemaker'], ["Ren'Py", "렌파이|renpy|ren'py"], ['RPG Maker', '쯔꾸르|rpg ?maker|알피지 ?메이커']];
/* where: 'intake'(질문 화면 5단계) · 'results'(견적 도우미, 에셋 목록만) · 'setup'(견적 도우미에서 조건만) */
function applyEdits(text, s, where){
  var out = [], inv = s.inv, t = text.replace(/\s+/g, ' ').trim(), m, hit;
  function say(x){ out.push(x); }
  function nu(n, u){ return n + u + roStr(n + u); }
  function tailOf(i){ return t.slice(i, i + 10).replace(/^\s*(?:을|를|은|는|정도|만|씩)?\s*/, ''); }
  var ADD = /^(?:더|추가|늘려|늘리|늘릴|넣어)/, SUB = /^(?:빼|줄여|줄이|줄일|덜|없애)/;
  if(where !== 'setup'){
  /* 오브젝트 묶음: 추가·빼기·개수. 이름은 두 단어까지 본다("보스 몬스터 2마리") */
  var re = /((?:[가-힣A-Za-z]+\s)?[가-힣A-Za-z]+?)\s*(\d+)\s*(종|마리|명|개|체)(?:씩)?/g, lastG = null, marks = [];
  while((m = re.exec(t))){
    if(/원|시간|개월|GB|기가/.test(t.slice(m.index, m.index + m[0].length + 3)) || /^(이서|이 같이|이서 만)/.test(t.slice(re.lastIndex))) continue;
    var raw = m[1].trim().split(' '), lastW = raw[raw.length - 1].replace(/(은|는|이|가|도|을|를|랑|하고|과|와)$/, ''), first = raw.length > 1 ? raw[0] : '';
    if(/^(약|한|대략|거의|대충|총|얼추|한때)$/.test(lastW)){
      /* "약 5종 정도의 함정"처럼 이름이 숫자 뒤에 오는 말 */
      var la = t.slice(re.lastIndex).match(/^\s*(?:정도|가량|쯤)?\s*의\s*([가-힣A-Za-z]{1,12})/);
      if(la){ lastW = la[1].replace(/(은|는|이|가|도|을|를|랑|과|와)$/, ''); first = ''; raw = [lastW]; }
      else { if(!first) continue; lastW = first.replace(/(은|는|이|가|도|을|를)$/, ''); first = ''; raw = [lastW]; } }
    if(/^(동작|UI|ui|아이콘|버튼|효과음|배경음악|음악|곡|일러스트|배경|타일|장면|대사|코드|기능|주|월|만|천|VRAM|vram|하루|주말|일주일|매주|예산)$/.test(lastW)) continue;
    if(first && (/^(그리고|또|그럼|근데|추가로|그냥|일단|그러면|및|아|음|그|저|이|총|대략|약)$/.test(first) || /(고|며|서|면|데|요|다|지|게|도|해|줘|래|야|은|는|이|가)$/.test(first) || /^(동작|UI|아이콘|효과음|배경음악|일러스트|배경|대사|코드)$/.test(first))) first = '';
    var name = ((first ? first + ' ' : '') + lastW).trim(), n = +m[2], u = m[3], tl = tailOf(re.lastIndex), add = ADD.test(tl), sub = SUB.test(tl);
    if(!name) continue;
    hit = objMatch(inv, name);
    if(hit.length){
      var g = hit[0];
      if(add){ g.n += n; say(g.name + eul(g.name) + ' ' + n + u + ' 늘려 ' + nu(g.n, u) + ' 했어요.'); }
      else if(sub){ var left = Math.max(0, g.n - n);
        if(left === 0 && inv.obj.length > 1){ inv.obj = inv.obj.filter(function(x){ return x !== g; }); say('‘' + g.name + '’ 묶음을 모두 빼서 목록에서 지웠어요.'); }
        else { g.n = Math.max(1, left); say(g.name + eul(g.name) + ' ' + n + u + ' 줄여 ' + nu(g.n, u) + ' 했어요.'); } }
      else { g.n = n; say(g.name + eul(g.name) + ' ' + nu(n, u) + ' 했어요.'); }
      lastG = g; marks.push({g:g, at:m.index});
    } else if(!sub){
      /* 목록에 없는 이름은 잘못 알아들었을 수 있어서, 바로 만들지 않고 먼저 묻는다 */
      objSeq++; var gN = {id:'o' + Date.now().toString(36) + objSeq, name:name.slice(0, 20), n:n, a:3, u:u};
      s._pending = s._pending || []; s._pending.push(gN); marks.push({g:gN, at:m.index, made:out.length, pend:true});
      say('‘' + gN.name + '’' + iga(gN.name) + ' 목록에 없어요. 새 묶음으로 ' + n + u + '(1' + (has3d(s) ? '개' : '종') + '당 동작 3개)' + eul(u) + ' 만들까요?');
      continue;
    } else { say('‘' + name + '’ 묶음은 지금 목록에 없어요.'); continue; }
    s.invTouched = true;
  }
  /* 동작 수: "보스는 동작 6개", 쉼표 뒤 "동작은 2개씩"은 바로 앞에 말한 묶음에 적용한다 */
  var ar = /(?:([가-힣A-Za-z]+?)\s*(?:은|는|의)?\s*)?동작\s*(?:은|는|을|를|이|도)?\s*(\d+)\s*개(?:씩)?/g;
  while((m = ar.exec(t))){
    var nm0 = (m[1] || '').replace(/(은|는|의)$/, ''), tg = nm0 && nm0.length >= 1 ? objMatch(inv, nm0)[0] : null;
    if(!tg){ var pm = marks.filter(function(x){ return x.at < m.index && (x.pend || inv.obj.indexOf(x.g) >= 0); }); tg = pm.length ? pm[pm.length - 1].g : null; }
    var mk = marks.filter(function(x){ return x.g === tg && x.made != null; })[0];
    if(tg && mk){ tg.a = +m[2]; out[mk.made] = '‘' + tg.name + '’' + iga(tg.name) + ' 목록에 없어요. 새 묶음으로 ' + tg.n + tg.u + '(1' + (has3d(s) ? '개' : '종') + '당 동작 ' + m[2] + '개)' + eul(u) + ' 만들까요?'; }
    else if(tg){ tg.a = +m[2]; s.invTouched = true; say(tg.name + '의 동작을 1' + (has3d(s) ? '개' : '종') + '당 ' + m[2] + '개로 했어요.'); }
    else say('어느 묶음의 동작인지 알 수 없어요. “적은 동작 4개”처럼 묶음 이름과 함께 말해 주세요.');
  }
  /* 빼기: 묶음, 코드 기능 */
  var rm = /([가-힣A-Za-z]+?)\s*(?:은|는|을|를|도)?\s*(?:빼\s*줘|빼줘|빼 주세요|빼고|없어|필요\s*없|안\s*나와|안\s*넣)/g;
  while((m = rm.exec(t))){
    var w0 = m[1], before = t.slice(0, m.index);
    if(/\d\s*$/.test(before) || /^(종|마리|명|개|체|장|곡)$/.test(w0)) continue;
    hit = objMatch(inv, w0);
    var win = t.slice(Math.max(0, m.index - 12), m.index + w0.length);
    var sysHit = sysList(s).filter(function(x){ return x.on !== false && (x.name.replace(/\s|·/g, '').indexOf(w0.replace(/\s/g, '')) >= 0 && w0.length >= 2 || (SYS_AL[x.id] && new RegExp(SYS_AL[x.id]).test(win))); });
    if(hit.length && inv.obj.length > 1){ inv.obj = inv.obj.filter(function(g){ return g !== hit[0]; }); s.invTouched = true; say('‘' + hit[0].name + '’ 묶음을 뺐어요.'); }
    else if(sysHit.length){ sysHit.forEach(function(x){ if(x.custom) inv.sysx.forEach(function(y){ if(y.id === x.id) y.on = false; }); else inv.sys[x.id] = false; }); say(sysHit.map(function(x){ return x.name; }).join(', ') + ' 기능을 뺐어요.'); }
    else if(!hit.length && (OBJ_SYN.some(function(p){ return new RegExp(p[1]).test(w0); }) || /묶음/.test(t))) say('‘' + w0 + '’ 묶음은 지금 목록에 없어요.');
  }
  /* 코드 기능 추가 */
  var SYS2FEAT = {multi:'online', local:'i18n', tutorial:'tutorial', touch:'mobile'};
  Object.keys(SYSTEMS).forEach(function(k){
    var nm = SYSTEMS[k][0], key = SYS_AL[k] || nm.split('·')[0], fk = SYS2FEAT[k];
    if(fk){ /* 튜토리얼·다국어·모바일·온라인 멀티는 '큰 기능'으로 다룬다 */
      var fre = new RegExp('(' + key + (k === 'touch' ? '|모바일' : '') + ')'); if(!fre.test(t)) return;
      inv.feat = inv.feat || {}; var fon = fk === 'i18n' ? inv.feat.i18n > 0 : !!inv.feat[fk], fnm = FEATS[fk][0];
      if(/(빼|없어|안\s*넣|필요\s*없|안\s*해)/.test(t)){ if(fon){ if(fk === 'i18n') inv.feat.i18n = 0; else inv.feat[fk] = false; say(fnm + eul(fnm) + ' 큰 기능에서 뺐어요.'); } }
      else if(/(넣어|넣을|넣고|추가|있어|할 거|할래|도 해|필요|들어가|만들|낼 거|지원)/.test(t) && !fon){ if(fk === 'i18n') inv.feat.i18n = 2; else inv.feat[fk] = true; say(fnm + eul(fnm) + ' 큰 기능에 더했어요.'); }
      return;
    }
    if(new RegExp('(' + key + ')[^.,]*?(넣어|넣을|넣고|추가|있어|할 거|할래|도 해|필요해|들어가|만들)').test(t) && !/(빼|없어|안\s*넣|필요\s*없)/.test(t) && !inv.sys[k]){ inv.sys[k] = true; say(nm + ' 기능을 코드에 더했어요.'); }
  });
  /* 배경 방식·개수 */
  if(/배경(?!음악)/.test(t)){
    if(/한\s*장/.test(t) && inv.scene.mode !== 'paint'){ inv.scene.mode = 'paint'; say('배경을 한 장 그림 방식으로 바꿨어요.'); }
    else if(/타일/.test(t) && inv.scene.mode !== 'tile'){ inv.scene.mode = 'tile'; say('배경을 타일 조합 방식으로 바꿨어요.'); }
    else if(/3D\s*공간|공간\s*단위/.test(t) && inv.scene.mode !== 'space'){ inv.scene.mode = 'space'; say('배경을 3D 공간 방식으로 바꿨어요.'); }
    m = t.match(/배경(?!음악)[^\d]{0,14}(\d+)\s*(장|곳|세트|구역|개)/);
    if(m){ var su = SCENE_MODES[inv.scene.mode].unit, cur0 = inv.scene.n, v0 = +m[1], tl0 = tailOf(m.index + m[0].length);
      inv.scene.n = ADD.test(tl0) ? cur0 + v0 : SUB.test(tl0) ? Math.max(0, cur0 - v0) : v0; s.invTouched = true; say('배경을 ' + (ADD.test(tl0) ? v0 + su + ' 늘려 ' : SUB.test(tl0) ? v0 + su + ' 줄여 ' : '') + nu(inv.scene.n, su) + ' 했어요.'); }
  }
  /* 그 밖의 수량: "효과음 10개 더", "효과음 10개 줄여", "효과음 30개로" */
  [[/(?:UI|ui|아이콘)[^\d]{0,6}(\d+)\s*개/, 'ui', 'UI·아이콘', '개'], [/일러스트[^\d]{0,6}(\d+)\s*장/, 'illus', '일러스트', '장'], [/효과음[^\d]{0,6}(\d+)\s*개/, 'sfx', '효과음', '개'], [/(?:배경음악|BGM|bgm|음악)[^\d]{0,6}(\d+)\s*곡/, 'bgm', '배경음악', '곡'], [/(?:대사|스토리|글)[^\d]{0,6}(\d+)\s*장면/, 'text', '대사·글', '장면']].forEach(function(x){
    var mm = t.match(x[0]); if(!mm) return;
    var cur = x[1] === 'sfx' && inv.sfx == null ? autoSfx(s) : inv[x[1]], v = +mm[1], tl2 = tailOf(mm.index + mm[0].length);
    if(ADD.test(tl2)){ inv[x[1]] = cur + v; say(x[2] + eul(x[2]) + ' ' + v + x[3] + ' 늘려 ' + nu(cur + v, x[3]) + ' 했어요.'); }
    else if(SUB.test(tl2)){ inv[x[1]] = Math.max(0, cur - v); say(x[2] + eul(x[2]) + ' ' + v + x[3] + ' 줄여 ' + nu(inv[x[1]], x[3]) + ' 했어요.'); }
    else { inv[x[1]] = v; say(x[2] + eul(x[2]) + ' ' + nu(v, x[3]) + ' 했어요.'); }
    s.invTouched = true;
  });
  /* 목록에 없는 에셋: 단위(장·곡·장면)로 종류를 정해 기타에 더한다. 이미 있는 카테고리 이름이면 위에서 처리했으므로 건너뛴다 */
  var reC = /((?:[가-힣A-Za-z]+\s)?[가-힣A-Za-z]+?)\s*(\d+)\s*(장면|장|곡)(?:씩)?/g, mc;
  while((mc = reC.exec(t))){
    var tlc = tailOf(reC.lastIndex); if(!/^(?:더|추가|늘려|늘리|넣어|넣을|넣고|만들|필요|있어|있음|들어가)/.test(tlc)) continue;
    var wc = mc[1].trim().split(' ').map(function(x){ return x.replace(/(은|는|이|가|도|을|를|랑|하고|과|와)$/, ''); }).filter(function(x){ return x && !/^(그리고|또|그럼|근데|추가로|그냥|일단|및|총|대략|약|한|더)$/.test(x); });
    var nmC = wc.join(' ');
    if(!nmC || /일러스트|배경음악|BGM|bgm|음악|효과음|대사|스토리|^글$|배경|타일|UI|ui|아이콘|맵/.test(nmC)) continue;
    var unitC = mc[3], kindC = unitC === '곡' ? 'sound' : unitC === '장면' ? 'text' : 'art', nC = Math.min(300, +mc[2]);
    if(!nC) continue;
    inv.custom = inv.custom || [];
    var exC = inv.custom.filter(function(c){ return c.name === nmC; })[0];
    if(exC){ exC.n = /^(?:더|늘려|늘리)/.test(tlc) ? Math.min(300, exC.n + nC) : nC; say('‘' + esc(nmC) + '’' + eul(nmC) + ' ' + nu(exC.n, unitC) + ' 했어요.'); }
    else { inv.custom.push({id:'c' + Date.now().toString(36) + inv.custom.length, name:nmC.slice(0, 20), kind:kindC, n:nC, unit:unitC}); say('기타에 ‘' + esc(nmC) + '’ ' + nC + unitC + '을 ' + CUS_KIND[kindC] + roStr(CUS_KIND[kindC]) + ' 더했어요.'); }
    s.invTouched = true;
  }
  /* "배경음악은 없어"처럼 통째로 없다고 하면 0으로 둔다 */
  [[/(?:배경음악|BGM|bgm|음악)/, 'bgm', '배경음악'], [/효과음/, 'sfx', '효과음'], [/일러스트/, 'illus', '일러스트'], [/(?:대사|스토리)/, 'text', '대사·글'], [/(?:UI|ui|아이콘)/, 'ui', 'UI·아이콘']].forEach(function(x){
    var mm = t.match(new RegExp(x[0].source + '\\s*(?:은|는|도)?\\s*(?:없어|필요\\s*없|안\\s*넣|빼\\s*줘|빼줘|없이)'));
    if(mm && inv[x[1]] !== 0){ inv[x[1]] = 0; s.invTouched = true; say(x[2] + eul(x[2]) + ' 0으로 했어요. 견적에서 빠져요.'); }
  });
  }
  if(where === 'results') return out;
  /* 이하 조건: 일정, 출시하는 곳, 예산, 도구, AI 범위, VRAM, 엔진, 그림체·시점·장르 */
  function addMs(name, mo){
    s.ms = s.ms || []; var nm2 = name.trim().replace(/(에|을|를|은|는|이|가)$/, ''), ex = s.ms.filter(function(x){ return x.name.replace(/\s/g, '') === nm2.replace(/\s/g, ''); })[0], late = mo >= s.release ? ' 다만 출시 목표(' + shortMonth(msLabel(s.release)) + ')보다 늦어요. 시기를 앞당기거나 출시 목표를 늦춰 주세요.' : '';
    if(ex){ ex.m = mo; say('‘' + ex.name + '’ 일정을 ' + shortMonth(msLabel(mo)) + '(' + mo + '개월 뒤)로 옮겼어요.' + late); }
    else { s.ms.push({id:'m' + Date.now().toString(36) + out.length, name:nm2.slice(0, 20), m:mo}); say('‘' + nm2 + '’ 일정을 ' + shortMonth(msLabel(mo)) + '(' + mo + '개월 뒤)로 더했어요.' + late); }
  }
  /* 출시 목표 먼저: 같은 문장의 일정 경고가 바뀐 출시 목표를 기준으로 하도록 */
  m = t.match(/(?:출시|발매|런칭)[^\d]{0,10}(\d)\s*년\s*(반)?\s*(?:뒤|후)/) || t.match(/(\d)\s*년\s*(반)?\s*(?:뒤|후)[^\d.]{0,8}(?:출시|발매|런칭)/);
  if(m){ var rly = Math.min(60, +m[1] * 12 + (m[2] ? 6 : 0)); s.release = rly; say('출시 목표를 ' + msLabel(rly) + '(' + rly + '개월 뒤)로 했어요.'); }
  else { m = t.match(/(?:출시|발매|런칭)[^\d]{0,10}(\d{1,2})\s*(개월|월)/) || t.match(/(\d{1,2})\s*(개월|월)[^\d.]{0,8}(?:출시|발매|런칭)/);
    if(m){ var rel = m[2] === '월' ? monthOff(+m[1]) : +m[1]; s.release = rel; say('출시 목표를 ' + msLabel(rel) + '(' + rel + '개월 뒤)로 했어요.'); } }
  m = t.match(/(\d{1,2})\s*월(?:에|쯤|까지|말)?\s*([가-힣A-Za-z ]{2,12}?)\s*(?:이|가|을|를)?\s*(?:있어|해|할 거|예정|있음|나가|내|열|올려)/);
  if(m && !/출시|발매|런칭/.test(m[2])) addMs(m[2], monthOff(+m[1]));
  else { m = t.match(/([가-힣A-Za-z]{2,10}(?:\s[가-힣A-Za-z]{2,6})?)\s*(?:은|는|이|가)\s*(\d{1,2})\s*월/); if(m && !/출시|발매|런칭|예산|일정/.test(m[1])) addMs(m[1], monthOff(+m[2])); }
  m = t.match(/주말[^\d]{0,6}(\d{1,2})\s*시간/);
  if(m){ s.weekly = Math.max(1, Math.min(80, +m[1])); say('작업 시간은 사람과 환경마다 차이가 커서 견적에 쓰지 않아요. 대신 도구별 평가와 비용으로 비교해 드려요.'); }
  else if((m = t.match(/하루(?:에)?\s*(?:한\s*|대략\s*)?(\d{1,2})\s*시간/))){ s.weekly = Math.min(80, +m[1] * 7); say('작업 시간은 사람과 환경마다 차이가 커서 견적에 쓰지 않아요. 대신 도구별 평가와 비용으로 비교해 드려요.'); }
  else if((m = t.match(/(?:일주일|매주|주)\s*(?:에|당|마다)?\s*(?:한\s*|대략\s*|최대\s*)?(\d{1,2})\s*시간/))){ s.weekly = Math.max(1, Math.min(80, +m[1])); say('작업 시간은 사람과 환경마다 차이가 커서 견적에 쓰지 않아요. 대신 도구별 평가와 비용으로 비교해 드려요.'); }
  var amt = parseWon(t), zero = /(예산|돈)\s*(?:은|는|이)?\s*(?:없|0\s*원|안\s*(?:써|쓸|들)|못\s*써|못\s*쓰)|0\s*원\s*(?:으로|이야|만|이에요)|무료로만|공짜로만|돈\s*안\s*드는/.test(t);
  if(zero){ s.budget = 0; say('월 추가 예산을 0원으로 했어요. 비용이 드는 도구와 구매는 빼고 짜요.'); }
  else if(amt != null && (/예산|한 달|월|달에/.test(t) || /^\s*[\d.,]+\s*만?\s*\d?\s*천?\s*원?\s*(?:이야|요|으로|정도|까지)?\s*$/.test(t))){ s.budget = amt; say('월 추가 예산을 ' + manwon(amt) + roStr(manwon(amt)) + ' 했어요.'); }
  /* 출시하는 곳: 더하기, 빼기("스팀 말고", "itch.io는 빼줘"), 그것만("itch.io로만") */
  var PL = [[/모바일|폰|핸드폰/, ['gplay', 'appstore']], [/구글\s*플레이|안드로이드/, ['gplay']], [/앱\s*스토어|아이폰|iOS|ios/, ['appstore']], [/스팀|steam/i, ['steam']], [/itch|이치/i, ['itch']], [/웹|브라우저/, ['web']], [/콘솔|스위치|닌텐도|플스|플레이스테이션|엑스박스/, ['console']]];
  var plOnly = [], plOff = [];
  PL.forEach(function(p){
    if(new RegExp('(?:' + p[0].source + ')[^,]{0,6}?(?:로만|으로만|에만|만\\s*(?:낼|낸|출시|올릴))', p[0].flags).test(t)) plOnly = plOnly.concat(p[1]);
    else if(new RegExp('(?:' + p[0].source + ')[^,]{0,6}?(?:말고|빼|제외|안\\s*(?:낼|내|올릴|올려))', p[0].flags).test(t)) plOff = plOff.concat(p[1]);
  });
  if(plOnly.length){ s.platforms = plOnly.filter(function(k, i){ return plOnly.indexOf(k) === i; }); say('출시하는 곳을 ' + s.platforms.map(function(k){ return PLATFORMS[k]; }).join(', ') + '만으로 했어요.'); }
  else {
    if(plOff.length){ var gone = s.platforms.filter(function(k){ return plOff.indexOf(k) >= 0; }); s.platforms = s.platforms.filter(function(k){ return plOff.indexOf(k) < 0; }); if(!s.platforms.length) s.platforms = ['unknown']; if(gone.length) say(gone.map(function(k){ return PLATFORMS[k]; }).join(', ') + eul(PLATFORMS[gone[gone.length - 1]]) + ' 출시하는 곳에서 뺐어요.'); }
    var plAdd = [];
    if(/(낼|출시|올릴|팔|내고|나가|낸다)/.test(t)) PL.forEach(function(p){ if(p[0].test(t)){ p[1].forEach(function(k){ if(plOff.indexOf(k) < 0 && s.platforms.indexOf(k) < 0){ s.platforms.push(k); plAdd.push(k); } }); } });
    if(plAdd.length){ s.platforms = s.platforms.filter(function(x){ return x !== 'unknown'; }); var la = PLATFORMS[plAdd[plAdd.length - 1]]; say(plAdd.map(function(k){ return PLATFORMS[k]; }).join(', ') + eul(la) + ' 출시하는 곳에 더했어요.'); }
  }
  /* 엔진: "Unity 말고 Godot", "엔진은 고도" */
  var engHits = ENG_AL.filter(function(e){ return new RegExp(e[1], 'i').test(t); });
  if(engHits.length){
    var keepE = engHits.filter(function(e){ return !new RegExp('(?:' + e[1] + ')\\s*(?:은|는)?\\s*(?:말고|대신|아니고)', 'i').test(t); })[0];
    if(keepE && s.engine !== keepE[0] && /엔진|쓸래|써|으로|로|바꿔|할래|만들|쓰고|쓸 거/.test(t)){ s.engine = keepE[0]; say('엔진을 ' + keepE[0] + roStr(keepE[0]) + ' 바꿨어요.'); }
  }
  /* 도구: "X도 써", "X 쓰고 있어", "X 구독 중" */
  var tm = t.match(/(?:^|[,.]\s*)([A-Za-z가-힣0-9.+\-]{2,20}?(?:\s[A-Za-z0-9.+\-]{1,10})?)\s*(?:도|를|을|은|는)?\s*(?:써|쓰고 있어|쓰는 중|구독 중|구독중|샀어|구매했어)/);
  if(tm && !/AI|ai|에이아이/.test(tm[1]) && !ENG_AL.some(function(e){ return new RegExp('^(?:' + e[1] + ')$', 'i').test(tm[1].trim()); })){
    var nm3 = tm[1].trim(), key2 = Object.keys(TOOLS).filter(function(k){ var T = TOOLS[k]; return new RegExp('^(' + T.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + (T.alias ? '|' + T.alias : '') + ')$', 'i').test(nm3); })[0] || (TOOLKEY.filter(function(k){ return k[1].test(nm3); })[0] || [])[0];
    if(key2 && s.have.indexOf(key2) < 0){ s.have.push(key2); s.havePlan = s.havePlan || {}; if(TOOLS[key2].plans && !s.havePlan[key2]) s.havePlan[key2] = TOOLS[key2].def; var pk = ownPlan(key2, s); say(TOOLS[key2].name + eulT(key2) + ' 이미 쓰는 도구에 더했어요. ' + (pk && TOOLS[key2].plans && TOOLS[key2].plans.length > 1 ? pk.name + ' 요금제로 봤어요. 다르면 4단계에서 바꿔 주세요.' : '이 견적에서는 추가 비용 0원으로 계산해요.')); }
    else if(key2){ var pk2 = ownPlan(key2, s); say(TOOLS[key2].name + eun(TOOLS[key2].name) + ' 이미 쓰는 도구에 들어 있어요' + (pk2 && pk2.rights !== 'ok' ? '. ' + pk2.name + ' 플랜은 상업적으로 쓸 수 없어서 유료 요금제 값으로 계산해요.' : '.')); }
    else if(!key2 && (s.haveCustom || []).indexOf(nm3) < 0 && !objMatch(inv, nm3).length && nm3.length <= 20){ s.haveCustom = s.haveCustom || []; s.haveCustom.push(nm3); say('‘' + nm3 + '’' + eul(nm3) + ' 이미 쓰는 도구에 적어 뒀어요. 저희 목록에 없는 도구라 비용 계산에는 쓰지 않아요.'); }
  }
  /* AI를 쓸 곳: "그림은 AI 안 쓸래", "AI는 코드에만", "그림만 AI로 할래", "음악은 AI로 만들 거야" */
  var aiW = /(AI|ai|에이아이)/;
  var aiOff = /(AI|ai|에이아이)\s*(?:는|은|를|을|도)?\s*(?:안\s*(?:쓸|써|할)|쓰지\s*않|빼|말고|없이)/.test(t);
  var aiOn = !aiOff && aiW.test(t) && /(쓸래|써도|쓸게|맡길|맡겨|쓸\s*거|써|할래|해도|만들|돌릴|뽑을|쓰고\s*싶)/.test(t);
  if(aiOff || aiOn){
    var aiBefore = JSON.stringify(s.ai), aiAt = out.length; s._aiScope = true;
    var keys = Object.keys(AIKEYS).filter(function(k){ return new RegExp({art:'그림(?!체)', anim:'애니메이션(?!풍)|동작|모션', sound:'소리|음악|효과음', code:'코드', text:'글|대사|스토리'}[k]).test(t); });
    if(/(그림|애니메이션|동작|모션|소리|음악|효과음|코드|글|대사|스토리)\s*(?:에)?만|에만/.test(t) && keys.length){ Object.keys(AIKEYS).forEach(function(k){ s.ai[k] = aiOn ? keys.indexOf(k) >= 0 : keys.indexOf(k) < 0; }); say('AI는 ' + Object.keys(AIKEYS).filter(function(k){ return s.ai[k]; }).map(function(k){ return AIKEYS[k]; }).join(', ') + '에만 쓰기로 했어요.'); }
    else { if(!keys.length) keys = Object.keys(AIKEYS); keys.forEach(function(k){ s.ai[k] = aiOn; }); say(keys.map(function(k){ return AIKEYS[k]; }).join(', ') + (aiOn ? '에는 AI를 쓰기로 했어요.' : '에는 AI를 쓰지 않기로 했어요.')); }
    if(JSON.stringify(s.ai) === aiBefore && out.length > aiAt) out[out.length - 1] = out[out.length - 1].replace('쓰기로 했어요.', '쓰는 조건이에요. 이미 그렇게 되어 있어요.').replace('쓰지 않기로 했어요.', '쓰지 않는 조건이에요. 이미 그렇게 되어 있어요.');
  }
  /* 그래픽카드 메모리: 모델 번호가 섞여도 "8기가"를 찾는다. 시스템 램은 무시한다 */
  if(/(VRAM|vram|그래픽|브이램|GPU|gpu|RTX|GTX|rtx|gtx|라데온|RX\s*\d)/.test(t) || (/^\s*\d{1,2}\s*(?:GB|gb|기가)/.test(t) && !/램|RAM|ram/.test(t))){
    m = t.match(/(\d{1,2})\s*(?:GB|gb|기가)/);
    if(m){ var gb = +m[1]; s.vram = gb >= 16 ? 'g16' : gb >= 12 ? 'g12' : gb >= 8 ? 'g8' : 'le6'; say('그래픽카드 메모리(VRAM)를 ' + VRAM[s.vram].name + roStr(VRAM[s.vram].name) + ' 했어요.'); }
    else if(/모르|몰라|잘\s*모/.test(t)){ s.vram = 'unknown'; say('그래픽카드 메모리(VRAM)는 ‘잘 모르겠어요’로 두고, 내 PC에서 돌리는 도구는 기본 견적에서 뺄게요.'); }
  }
  var STY_AL = {px16:'16\\s*(?:px|픽셀)', px32:'32\\s*(?:px|픽셀)', px64:'64\\s*(?:px|픽셀)|하이비트', cartoon:'카툰(?!풍 ?3D| ?3D)|손그림', anime:'애니메이션풍|애니풍|애니 ?스타일|셀 ?채색', paint:'반실사|페인터리|실사풍|회화풍', flat:'플랫|벡터', lowpoly:'로우폴리|로폴', toon3d:'스타일라이즈드|카툰풍 ?3D|카툰 ?3D|툰 ?3D'};
  Object.keys(STYLES).forEach(function(k){ if(new RegExp('(' + STY_AL[k] + ')').test(t) && (/그림체|스타일|화풍|풍으로|(로|으로)\s*(?:할|바꿔|갈|그릴|만들)|(로|으로)$/.test(t)) && s.style !== k){ s.style = k; var n5 = syncStyleView(s, 'style'); say('그림체를 ' + STYLES[k].name + roStr(STYLES[k].name) + ' 바꿨어요.' + (n5 ? ' ' + n5 : '')); } });
  Object.keys(VIEWS).forEach(function(k){ if(t.indexOf(VIEWS[k].name) >= 0 && s.view !== k){ s.view = k; s.viewTouched = true; var n6 = syncStyleView(s, 'view'); say('화면 시점을 ' + VIEWS[k].name + roStr(VIEWS[k].name) + ' 바꿨어요.' + (n6 ? ' ' + n6 : '')); } });
  Object.keys(GENRE).forEach(function(k){ if(t.indexOf(GENRE[k].name.split('·')[0]) >= 0 && /(도|섞|추가|더해|넣어)/.test(t) && s.genres.indexOf(k) < 0){ s.genres.push(k); Object.keys(invFromGenres([k]).sys).forEach(function(x){ if(s.inv.sys[x] == null) s.inv.sys[x] = true; }); say(GENRE[k].name + ' 장르를 더하고 필요한 코드 기능을 채웠어요.'); } });
  return out;
}
function intakeSay(text){
  var s = S.setup; S.intake.push({who:'me', text:esc(text)});
  var snap0 = acatSnap(s.inv);
  var r = applyEdits(text, s, 'intake'), pend = s._pending; delete s._aiScope; delete s._pending; syncSt(s);
  var chg = acatDiff(snap0, acatSnap(s.inv)); if(chg.length){ s.aseen = s.aseen || {}; chg.forEach(function(k){ s.aseen[k] = true; }); if(S.wiz === 2){ S.assetOpen = chg[0]; S.aflash = chg; } }
  if(pend && S.wiz === 2){ S.assetOpen = 'obj'; }
  S.intake.push({who:'bot', text:r.length ? r.join(' ') : '아직 그 말은 이해하지 못했어요. “적 10종이야”, “12월에 데모 공개해”, “모바일로도 낼 거야”, “Krita도 써”처럼 말해 주세요.', pend:pend || null});
  render(); var ii = $('intakeIn'); if(ii) ii.focus(); announce('도우미: ' + S.intake[S.intake.length - 1].text);
}
/* 새 묶음 만들기 확인 */
function makeGroups(st, list){ list.forEach(function(g){ st.inv.obj.push({id:g.id, name:g.name, n:g.n, a:g.a}); }); st.invTouched = true; }



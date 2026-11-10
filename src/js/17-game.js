/* ============================== 저장한 견적서 ============================== */
function sameSet(a, b){ return JSON.stringify((a || []).slice().sort()) === JSON.stringify((b || []).slice().sort()); }
/* ============================== 저장한 게임 ==============================
   세 화면: 견적(저장한 계획) · 작업 기록(만들 때마다 남기는 기록) · 스토어 AI 고지문(기록으로 만드는 고지 문구와 권리 확인) */
function renderQuote(){
  var q = getQ(S.activeQ); if(!q){ S.view = 'home'; return render(); }
  var st = q.setup, c = calc(q.picks, q.qty, q.buy || {}, st), step = S.qStep || 1, P = logProg(q), D = discModel(q), due = storeDue(q); CTX = st;
  var steps = [
    {n:1, t:'견적', s:q.saved + ' 저장' + (q.updated ? ' · ' + q.updated + ' 고침' : '')},
    {n:2, t:'작업 기록', s:P.n ? '기록 ' + P.n + '건 · 에셋 ' + P.got + ' / ' + P.tot + '개' : '아직 기록이 없어요'},
    {n:3, t:'스토어 AI 고지문', d:'스팀에 낼 AI 사용 고지', s:D.ready ? '준비 끝' + (D.rightsDone ? '' : ' · 권리 확인 남음') : due ? '지금 준비할 때예요' : shortMonth(storeLabelOf(q)) + ' 스토어 페이지 열기 전'}
  ];
  var stepsH = '<nav class="steps" aria-label="게임 화면">' + steps.map(function(x){
    var done = x.n === 3 && D.ready;
    return '<button type="button" class="step'+(done ? ' done' : '')+'" data-qstep="'+x.n+'"'+(step === x.n ? ' aria-current="step"' : '')+'><span class="sn"><i>'+(done ? ui('check', 12) : x.n)+'</i>'+x.t+'</span><small>'+(x.d ? x.d + ' · ' : '')+x.s+'</small></button>';
  }).join('') + '</nav>';
  var al = activeAlerts().filter(function(a){ return !a.done && alertFor(a, q.id) && a.items; });
  var banners = al.map(function(a){ return '<div class="block soft" role="status"><b>'+esc(a.title)+'</b><span>'+a.todo+'</span>'+(step !== 2 ? '<button type="button" class="link" data-qstep="2">작업 기록 열기</button>' : '')+'</div>'; }).join('');
  var body = step === 1 ? quoteBody(q, c) : step === 2 ? logBody(q) : discBody(q, D);
  var plats = platsOf(q).map(function(p){ return PLATFORMS[p] || p; }).join(', ') || '아직 몰라요';
  var months = []; for(var i = 0; i <= Math.max(st.release, q.storeAt || 0); i++) months.push(i);
  $('view').innerHTML = '<div class="ph"><div><h1>'+esc(q.name)+'</h1><p class="lead">'+esc(genreName(st))+' · '+esc(stylesTxt(syncSt(st)))+' · '+esc(st.engine)+' · '+QN(q)+' 기준</p></div><div class="row-acts"><button type="button" class="btn sec" data-act="edit-quote">견적 고치기</button><button type="button" class="iconbtn" data-act="qmenu" aria-label="게임 관리">'+ui('more', 20)+'</button></div></div>'
    + (banners ? '<div class="banners">'+banners+'</div>' : '')
    + stepsH + '<div class="dgrid"><div>'+body+'</div>'
    + '<aside class="side"><div class="card sidecard"><h3>이 게임</h3><div class="kv"><span>월 추가 비용</span><span class="v">'+won(c.monthly)+'</span>'
    + (c.once ? '<span>한 번 드는 돈</span><span class="v">'+won(c.once)+'</span>' : '')
    + '<span>평가 평균</span><span class="v">'+starTxt(c.qavg)+'</span><span>출시까지 총</span><span class="v">'+won(c.total)+'</span><span>출시 플랫폼</span><span class="v">'+esc(plats)+'</span></div>'
    + '<div class="fld">중간 일정' + ((q.ms || []).length ? '<ul class="mslist">' + q.ms.map(function(m){ return '<li><span>'+esc(m.name)+'</span><span class="v">'+shortMonth(monthLabel(Math.max(0, m.m)))+'</span><button type="button" class="iconbtn sm" data-qmsdel="'+m.id+'" aria-label="'+esc(m.name)+' 일정 지우기">'+ui('close', 14)+'</button></li>'; }).join('') + '</ul>' : '<span class="note">아직 없어요.</span>')
    + '<span class="msadd"><select class="field sm" id="qmsName" aria-label="일정 이름">' + ['데모 공개', '알파 테스트', '펀딩 시작', '공모전 마감'].map(function(n){ return '<option>'+n+'</option>'; }).join('') + '</select><select class="field sm" id="qmsM" aria-label="일정 달">' + months.map(function(m){ return '<option value="'+m+'">'+shortMonth(monthLabel(m))+'</option>'; }).join('') + '</select><button type="button" class="btn sm sec" data-act="qms-add">추가</button></span></div>'
    + '<label class="fld">스토어 페이지 공개<select class="field" data-act="storeat">' + months.map(function(m){ return '<option value="'+m+'"'+(m === (q.storeAt || 0) ? ' selected' : '')+'>'+monthLabel(m)+(m === 0 ? ' (이번 달)' : '')+'</option>'; }).join('') + '</select></label>'
    + '<label class="ckl"><input type="checkbox" data-act="qremind"'+(q.remind ? ' checked' : '')+'><span>그달에 스토어 AI 고지문을 준비하라고 알려 주세요</span></label>'
    + '<label class="ckl"><input type="checkbox" data-act="qemail"'+(q.email ? ' checked' : '')+(q.remind ? '' : ' disabled')+'><span>이메일로도 받기</span></label>'
    + '<p class="note">견적 숫자는 요금제 가격과 '+FX_NOTE+' 기준이에요. 스팀은 스토어 페이지 검토를 요청하기 전에 콘텐츠 설문을 내야 해서, 스토어 AI 고지문은 그달에 준비해요.</p></div></aside></div>';
}
function quoteBody(q, c){
  var st = q.setup, first = {};
  return '<section class="card stack"><h2>저장한 견적</h2><ul class="qsum">'
    + summary(q.picks, q.qty, st).map(function(x){ return '<li>'+x+'</li>'; }).join('') + '</ul>' + subPlan(c, false)
    + '<div class="rlist">' + qRows(q).map(function(r){
        var t = q.picks[r.id], shared = first[t] && toolCost(t, st) > 0; if(!first[t]) first[t] = RN(r);
        return '<div class="rl">'+rowIcon(r)+'<span><b>'+RN(r)+' '+q.qty[r.id]+RU(r)+'</b><small>'+toolLabel(t, st)+' · '+(shared ? first[t]+gwa(first[t])+' 같은 구독 · 추가 0원' : priceText(t, st))+' '+statusChips(t, st)+'</small></span><span class="num">'+(qualOf(t, r.cat, rowCls(r, st)).n ? starTxt(qualOf(t, r.cat, rowCls(r, st)).star) : '')+'</span></div>';
      }).join('') + '</div>'
    + '<p class="note">'+totalLine(c, st)+' · 평가 평균 '+starTxt(c.qavg)+'. 실제로 만든 내용은 작업 기록에 남기면, 스토어 AI 고지문은 견적이 아니라 기록으로 만들어요.</p>'
    + '<div class="row-acts"><button type="button" class="btn sec" data-qstep="2">작업 기록으로 가기</button></div>'
    + '</section>';
}

/* ---------- 작업 기록 ---------- */
function logBody(q){
  var rows = qRows(q), P = logProg(q), all = (q.logs || []).slice().reverse();
  var table = rows.map(function(r){
    var ls = logsOf(q, r.id), n = sumN(ls), plan = q.qty[r.id], pct = Math.min(100, Math.round(n / plan * 100)), by = {};
    ls.forEach(function(l){ by[l.tool] = (by[l.tool] || 0) + (+l.n || 0); });
    var used = Object.keys(by).map(function(t){ var ai = ls.filter(function(l){ return l.tool === t; }).map(logAI); return '<span class="tchip'+(ai.indexOf(true) >= 0 ? ' ai' : '')+'">'+esc(tName(t, q.setup))+' '+by[t]+(ai.indexOf(null) >= 0 ? ' · AI 표시 모름' : '')+'</span>'; }).join('');
    var dropped = q.disc && q.disc.drop && q.disc.drop[r.id];
    return '<div class="lrow">'+rowIcon(r)+'<div class="lmain"><b>'+RN(r)+'</b><small>견적상 '+plan+RU(r)+' · '+esc(toolLabel(q.picks[r.id], q.setup))+'</small>'
      + (used ? '<div class="chips">'+used+'</div>' : '<small class="t-dim">'+(dropped ? '게임에서 뺐다고 표시했어요' : '아직 기록이 없어요')+'</small>') + '</div>'
      + '<div class="lprog"><span class="bar" aria-hidden="true"><i style="width:'+pct+'%"></i></span><span>'+n+' / '+plan+RU(r)+'</span></div>'
      + '<button type="button" class="btn sm sec" data-logadd="'+r.id+'">기록 추가</button></div>';
  }).join('');
  var list = all.length ? '<ul class="llist">' + all.map(function(l){
      var r = rowById(q, l.row); if(!r) return '';
      var extra = [];
      if(l.how === 'pack') extra.push(l.mark === 'ai' ? '팩에 AI 표시 있음' : l.mark === 'noai' ? '팩에 AI 표시 없음' : 'AI 표시 모름');
      if(paidMatters(l.tool)) extra.push(l.paid === true ? (l.tool === 'suno' ? '유료 플랜 중 내려받음' : '유료 구독 중') : l.paid === false ? (l.tool === 'suno' ? '유료 플랜 밖에서 받음' : '무료 플랜') : '구독 여부 미표시');
      return '<li><span class="ld">'+esc(l.date)+'</span><span><b>'+RN(r)+' '+l.n+RU(r)+'</b><small>'+esc(tName(l.tool, q.setup))+' · '+howLabel(l, r)+(extra.length ? ' · ' + extra.join(' · ') : '')+'</small></span><button type="button" class="btn sm quiet" data-logdel="'+l.id+'" aria-label="'+esc(l.date+' '+RN(r)+' 기록 지우기')+'">지우기</button></li>';
    }).join('') + '</ul>' : '<p class="note">아직 남긴 기록이 없어요. 에셋을 하나 만들 때마다 ‘기록 추가’로 남겨 주세요.</p>';
  return '<div class="why"><span class="qm">'+ui('info', 18)+'</span><div><b>왜 기록하나요?</b><p>몇 달 뒤에 어떤 에셋을 어떤 도구로 만들었는지 떠올리기는 어려워요. 만들 때마다 한 줄씩 남겨 두면 스토어 페이지를 열 때 스토어 AI 고지문과 상업적 이용 확인을 기억이 아니라 기록으로 만들어요. 한 줄에 10초 정도 걸려요.</p></div></div>'
    + '<section class="card stack"><div class="sec-h"><h2>에셋별 기록</h2><span class="note">'+P.got+' / '+P.tot+'개</span></div>' + table + '</section>'
    + '<section class="card stack"><div class="sec-h"><h2>남긴 기록 '+all.length+'건</h2><div class="row-acts"><button type="button" class="btn sm" data-logadd="">기록 추가</button><button type="button" class="btn sm sec" data-act="csv"'+(all.length ? '' : ' disabled')+'>CSV로 내려받기</button></div></div>' + list + '</section>';
}
/* 기록 추가 시트: 고른 도구에 따라 묻는 질문이 바뀐다. AI 도구는 그대로 썼는지/손봤는지, 코드는 그대로 들어갔는지/돕기만 했는지,
   받은 팩은 AI 표시가 있었는지, 요금제에 따라 권리가 달라지는 도구는 유료 구독 중이었는지 */
var LF = null;
function logOpen(qid, rid){
  var q = getQ(qid), rows = qRows(q), r = rid ? rowById(q, rid) : rows[0];
  var left = Math.max(1, q.qty[r.id] - loggedN(q, r.id));
  LF = {q:qid, row:r.id, tool:q.picks[r.id], n:left, how:null, paid:null, mark:null, cname:'', cai:null, err:''};
  logSheet();
}
function lfKind(){ var q = getQ(LF.q), r = rowById(q, LF.row), t = LF.tool;
  if(t === 'custom') return LF.cai === true ? (r.kind === 'code' ? 'aicode' : 'ai') : LF.cai === false ? 'self' : 'custom';
  var T = TOOLS[t]; if(T.pack) return 'pack'; if(T.ai) return r.kind === 'code' ? 'aicode' : 'ai'; return 'self'; }
function logSheet(){
  var q = getQ(LF.q), r = rowById(q, LF.row), rows = qRows(q), kind = lfKind(), tools = uniq(r.opts.map(function(o){ return o.t; }).concat([q.picks[r.id]]));
  function seg(attr, opts, cur, label){ return '<div class="seg" role="group" aria-label="'+label+'">' + opts.map(function(o){ return '<button type="button" data-'+attr+'="'+o[0]+'" aria-pressed="'+(String(cur) === String(o[0]))+'">'+o[1]+'</button>'; }).join('') + '</div>'; }
  var howQ = kind === 'ai' ? '<div class="fld">어떻게 썼나요?' + seg('lfhow', [['as', '그대로 썼어요'], ['aiedit', 'AI에게 다시 고치게 했어요'], ['human', '직접 손봤어요'], ['both', '둘 다 했어요']], LF.how, '만든 방식') + '<span class="note">스토어 AI 고지문에서 ‘개발자가 손봤다’는 직접 손본 경우에만 써요. AI에게 다시 고치게 한 것은 AI가 만든 콘텐츠예요.</span></div>'
    : kind === 'aicode' ? '<div class="fld">AI가 짠 코드가 게임에 들어갔나요?' + seg('lfhow', [['as', '그대로 들어갔어요'], ['help', '짜는 걸 돕기만 했어요']], LF.how, '코드에 AI를 쓴 방식') + '<span class="note">itch.io는 게임에 들어간 AI 코드도 공개 항목에 표시해요.</span></div>'
    : kind === 'pack' ? '<div class="fld">받은 팩에 ‘AI로 만들었다’는 표시가 있었나요?' + seg('lfmark', [['ai', '있었어요'], ['noai', '없었어요'], ['unknown', '모르겠어요']], LF.mark, '팩의 AI 표시') + '<span class="note">모르면 나중에 확인해도 돼요. 스토어 AI 고지문을 만들기 전에는 정해야 해요.</span></div>' : '';
  var paidQh = LF.tool !== 'custom' && paidMatters(LF.tool) ? '<div class="fld">' + paidQ(LF.tool) + seg('lfpaid', [['1', '네'], ['0', '아니요']], LF.paid == null ? '' : (LF.paid ? '1' : '0'), '유료 구독 여부') + '<span class="note">'+esc(TOOLS[LF.tool].why)+'</span></div>' : '';
  var custom = LF.tool === 'custom' ? '<div class="fgrid"><label class="fld">도구 이름<input class="field" id="lfName" maxlength="30" value="'+esc(LF.cname)+'" placeholder="예: Leonardo"></label><div class="fld">AI 도구인가요?' + seg('lfcai', [['1', '네'], ['0', '아니요']], LF.cai == null ? '' : (LF.cai ? '1' : '0'), 'AI 도구 여부') + '</div></div>' : '';
  openLayer('<form class="modal sheet" id="logF" role="dialog" aria-modal="true" aria-labelledby="lfT" novalidate>'+mh('lfT', '작업 기록 추가')
    + '<div class="fgrid"><label class="fld">어떤 에셋인가요?<select class="field" id="lfRow">' + rows.map(function(x){ return '<option value="'+x.id+'"'+(x.id === r.id ? ' selected' : '')+'>'+RN(x)+'</option>'; }).join('') + '</select></label>'
    + '<label class="fld">몇 '+RU(r)+'인가요?<span class="ninp"><input class="field" id="lfN" type="number" inputmode="numeric" min="1" max="500" value="'+LF.n+'"><span>'+RU(r)+'</span></span></label></div>'
    + '<div class="fld">무엇으로 만들었나요?<div class="choices" role="radiogroup" aria-label="만든 도구">' + tools.map(function(t){ return '<button type="button" class="choice" role="radio" data-lftool="'+t+'" aria-checked="'+(LF.tool === t)+'">'+esc(tName(t, q.setup))+'</button>'; }).join('')
    + '<button type="button" class="choice" role="radio" data-lftool="custom" aria-checked="'+(LF.tool === 'custom')+'">목록에 없는 도구</button></div></div>'
    + custom + howQ + paidQh
    + '<p class="err" id="lfErr" role="alert">'+esc(LF.err)+'</p>'
    + '<div class="row-acts end"><button type="button" class="btn sec" data-act="close-layer">취소</button><button type="submit" class="btn">기록하기</button></div></form>');
}
function logSubmit(){
  var q = getQ(LF.q), r = rowById(q, LF.row), kind = lfKind(), n = Math.max(0, parseInt(($('lfN') || {}).value, 10) || 0), miss = '';
  if(LF.tool === 'custom'){ LF.cname = ($('lfName').value || '').trim(); if(!LF.cname) miss = '도구 이름을 적어 주세요.'; else if(LF.cai == null) miss = 'AI 도구인지 골라 주세요.'; }
  if(!miss && !(n >= 1)) miss = '개수를 1 이상으로 적어 주세요.';
  if(!miss && (kind === 'ai' || kind === 'aicode') && !LF.how) miss = '어떻게 썼는지 골라 주세요.';
  if(!miss && kind === 'pack' && !LF.mark) miss = '팩에 AI 표시가 있었는지 골라 주세요. 모르면 ‘모르겠어요’를 고르면 돼요.';
  if(!miss && LF.tool !== 'custom' && paidMatters(LF.tool) && LF.paid == null) miss = paidQ(LF.tool).replace('나요?', '는지') + ' 골라 주세요.';
  if(miss){ LF.n = n || LF.n; LF.err = miss; logSheet(); var ef = $('lfErr'); if(ef) ef.focus && ef.setAttribute('tabindex', '-1'); return; }
  var e = {id:'l' + Date.now().toString(36), row:r.id, tool:LF.tool === 'custom' ? 'custom:' + LF.cname : LF.tool, n:n, date:TODAY,
    how:kind === 'pack' ? 'pack' : kind === 'self' ? 'self' : LF.how};
  if(LF.tool === 'custom') e.ai = !!LF.cai;
  if(kind === 'pack' && LF.mark !== 'unknown') e.mark = LF.mark;
  if(LF.tool !== 'custom' && paidMatters(LF.tool)) e.paid = !!LF.paid;
  q.logs = q.logs || []; q.logs.push(e); LF = null; closeLayer(); render();
  var left = q.qty[r.id] - loggedN(q, r.id);
  toast(RN(r) + ' ' + n + RU(r) + eul(RU(r)) + ' 기록했어요.' + (left > 0 ? ' 견적까지 ' + left + RU(r) + ' 남았어요.' : ''), '되돌리기', function(){ q.logs = q.logs.filter(function(x){ return x.id !== e.id; }); render(); });
}
/* CSV 내보내기: 엑셀에서 한글이 깨지지 않도록 BOM을 붙인다 */
function csvOf(q){
  var head = ['날짜', '에셋', '개수', '도구', 'AI 사용', '만든 방식', '유료 구독 중', '팩의 AI 표시'];
  var lines = (q.logs || []).map(function(l){ var r = rowById(q, l.row); if(!r) return null; var ai = logAI(l);
    return [l.date, RN(r), l.n, tName(l.tool, q.setup), ai === null ? '모름' : ai ? '예' : '아니요', howLabel(l, r), paidMatters(l.tool) ? (l.paid ? '예' : '아니요') : '', l.how === 'pack' ? (l.mark === 'ai' ? '있음' : l.mark === 'noai' ? '없음' : '모름') : '']; }).filter(Boolean);
  return '﻿' + [head].concat(lines).map(function(a){ return a.map(function(v){ v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\r\n');
}
function downloadCSV(q){
  try { var b = new Blob([csvOf(q)], {type:'text/csv;charset=utf-8'}), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = q.name.replace(/[\\/:*?"<>|]/g, '') + ' 작업 기록.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(u); }, 1000); toast('작업 기록 ' + (q.logs || []).length + '건을 CSV로 내려받았어요.'); }
  catch(x){ toast('이 브라우저에서는 파일을 내려받을 수 없어요.'); }
}

/* ---------- 공개 문구 ---------- */
function discBody(q, D){
  var st = q.setup, X = q.disc;
  var platH = '<section class="card stack"><h2>1. 어디에 올리나요?</h2><div class="choices" role="group" aria-label="출시 플랫폼">'
    + ['steam', 'itch', 'gplay', 'appstore', 'web', 'console'].map(function(p){ return '<button type="button" class="choice" data-dplat="'+p+'" aria-pressed="'+(platsOf(q).indexOf(p) >= 0)+'">'+PLATFORMS[p]+'</button>'; }).join('') + '</div>'
    + (D.others.length ? '<p class="note">'+D.others.map(function(p){ return PLATFORMS[p]; }).join(', ')+'의 AI 표기 규정은 저희가 아직 확인하지 못했어요. 게임 설명에 같은 문구를 넣어 두길 권해요.</p>' : '') + '</section>';
  /* 기록으로 본 실제 사용 도구 */
  var rowsH = qRows(q).map(function(r){
    var ls = logsOf(q, r.id), n = sumN(ls), plan = q.qty[r.id], by = {}, um = D.unknownMark.filter(function(u){ return u.r.id === r.id; }), drop = X.drop[r.id];
    ls.forEach(function(l){ by[l.tool] = (by[l.tool] || 0) + (+l.n || 0); });
    var used = Object.keys(by).map(function(t){ var ai = ls.filter(function(l){ return l.tool === t; }).map(logAI); return '<span class="tchip'+(ai.indexOf(true) >= 0 ? ' ai' : '')+'">'+esc(tName(t, q.setup))+' '+by[t]+(ai.indexOf(true) >= 0 ? ' · AI' : '')+'</span>'; }).join('');
    var stH;
    if(!ls.length) stH = drop ? '<span class="chip c-mute">게임에서 뺌</span><button type="button" class="link sm" data-ddrop="'+r.id+'">되돌리기</button>'
      : '<span class="chip c-risk">기록 없음</span><span class="row-acts"><button type="button" class="btn sm sec" data-logadd="'+r.id+'">기록 추가</button><button type="button" class="btn sm quiet" data-ddrop="'+r.id+'">게임에서 뺐어요</button></span>';
    else if(um.length) stH = um.map(function(u){ return '<span class="mk"><span>'+esc(tName(u.t))+'에 AI 표시가 있었나요?</span><span class="seg sm" role="group" aria-label="'+esc(tName(u.t))+' AI 표시"><button type="button" data-dmark="'+r.id+'|'+u.t+'|ai">있었어요</button><button type="button" data-dmark="'+r.id+'|'+u.t+'|noai">없었어요</button></span></span>'; }).join('');
    else if(n < plan && !drop) stH = '<span class="chip c-warn">견적상 '+plan+' 중 '+n+' 기록</span><span class="row-acts"><button type="button" class="btn sm sec" data-logadd="'+r.id+'">나머지 기록</button><button type="button" class="btn sm quiet" data-ddrop="'+r.id+'">나머지는 안 만들었어요</button></span>';
    else if(n < plan && drop) stH = '<span class="chip c-mute">'+n+RU(r)+'만 만듦</span><button type="button" class="link sm" data-ddrop="'+r.id+'">되돌리기</button>';
    else stH = '<span class="chip c-ok">'+n+RU(r)+' 기록</span>';
    return '<div class="lrow dl">'+rowIcon(r)+'<div class="lmain"><b>'+RN(r)+'</b>'+(used ? '<div class="chips">'+used+'</div>' : '')+'</div><div class="lst">'+stH+'</div></div>';
  }).join('');
  var useH = '<section class="card stack"><div class="sec-h"><h2>2. 기록으로 본 실제 사용 도구</h2><button type="button" class="link" data-qstep="2">작업 기록 열기</button></div>'
    + '<p class="note">스토어 AI 고지문은 견적이 아니라 이 기록으로 만들어요. 기록이 견적보다 적으면 기록한 만큼만 비율에 반영돼요.</p>' + rowsH + '</section>';
  var liveH = '<section class="card stack"><h2>3. 게임을 실행하는 동안 AI가 콘텐츠를 만드나요?</h2><div class="seg" role="group" aria-label="실행 중 AI 생성 여부"><button type="button" data-dlive="no" aria-pressed="'+(X.live === 'no')+'">아니요</button><button type="button" data-dlive="yes" aria-pressed="'+(X.live === 'yes')+'">네, 실행 중에 만들어요</button></div>'
    + (X.live === 'yes' ? '<p class="note">실행 중 생성은 부적절한 콘텐츠를 막는 장치를 직접 설명해야 해서 문구를 만들어 드리지 않아요. 스팀웍스 콘텐츠 설문의 안내를 따라 작성해 주세요.</p>' : '<p class="note">대화형 NPC처럼 게임 안에서 AI가 그때그때 그림, 소리, 글을 만들면 ‘네’예요.</p>') + '</section>';
  /* 문구 */
  var txt = D.sents.map(function(s){ return s.en; }).join('\n');
  var stale = X.copied && !D.fresh;
  var sentH = D.sents.map(function(s){
    if(s.live) return '<div class="sent"><span class="src">실행 중 생성 여부</span><span class="en">'+s.en+'</span><span class="ko">'+s.ko+'</span></div>';
    var rn = [].concat.apply([], s.g.rows.map(function(x){ return x.rows.map(RN); })).join(', ');
    return '<div class="sent"><span class="src">'+esc(rn)+(X.names ? ' · '+esc(s.g.tools.map(tName).join(', ')) : '')+'</span><span class="en">'+s.en+'</span><span class="ko">'+s.ko+'</span>'
      + s.g.rows.map(function(x){ var nm = x.rows.map(RN).join(', '), u0 = x.rows.length === 1 ? RU(x.rows[0]) : '개', under = {some:0, most:1, all:2}[x.sc] < {some:0, most:1, all:2}[x.auto];
          return '<div class="sentctl"><span class="k">'+esc(nm)+' 중 AI로 만든 비율</span><div class="seg sm" role="group" aria-label="'+esc(nm)+' 중 AI로 만든 비율">'+[['some','일부'],['most','대부분'],['all','전부']].map(function(o){ return '<button type="button" data-dratio="'+x.id+'|'+o[0]+'" aria-pressed="'+(x.sc === o[0])+'">'+o[1]+'</button>'; }).join('')+'</div>'
            + '<span class="note'+(under ? ' t-yellow' : '')+'">기록 기준 '+x.ai+' / '+x.tot+u0+(x.sc !== x.auto ? ' · 기록으로는 ‘'+{some:'일부',most:'대부분',all:'전부'}[x.auto]+'’'+ieyo({some:'일부',most:'대부분',all:'전부'}[x.auto]) + (under ? '. 기록보다 적게 밝히고 있어요' : '') : '')+'</span></div>'; }).join('')
      + '</div>';
  }).join('');
  var itchH = D.itch && X.live !== 'yes' ? '<div class="where">itch.io <span>프로젝트 편집</span>›<span>AI 공개</span><em>· '+(D.cats.length ? '‘생성형 AI 사용’을 고르고 분야는 ' + D.cats.join(', ') + eul(D.cats[D.cats.length - 1]) + ' 골라요.' : '‘생성형 AI 사용 안 함’을 골라요.')+'</em></div>' : '';
  var codeH = D.codeHelp.length || D.codeAs.length ? '<p class="note">'+(D.codeHelp.length ? 'AI가 짜는 걸 돕기만 한 코드는 개발 효율 도구 사용으로 보고 문구'+(D.itch ? '와 itch.io 코드 분야' : '')+'에서 뺐어요. ' : '')+(D.codeAs.length ? 'AI가 짠 코드가 그대로 들어간 부분은 문구'+(D.itch ? '와 itch.io 코드 분야' : '')+'에 넣었어요. ' : '')+(D.steam ? (D.codeAs.length ? '스팀은 개발 효율을 높이는 AI 도구 사용은 밝히는 대상이 아니라고 안내하지만(2026년 1월 개정), 게임에 그대로 들어간 AI 코드는 이 안내만으로 판단하기 어려워서 밝히는 쪽으로 정했어요.' : '스팀은 개발 효율을 높이는 AI 도구 사용은 밝히는 대상이 아니라고 안내해요(2026년 1월 개정).') : '')+'</p>' : '';
  var blockH = D.blocks.length ? '<div class="block"><b>먼저 정할 게 있어요</b>'+D.blocks.map(function(b){ return '<span>'+b+'</span>'; }).join('')+'</div>' : '';
  var dropH = D.dropped.length ? '<p class="note t-yellow">게임에서 뺐다고 표시한 '+D.dropped.map(RN).join(', ')+eun(RN(D.dropped[D.dropped.length - 1]))+' 문구에 반영하지 않았어요. 실제로 게임에 들어갔다면 기록을 남겨 주세요.</p>' : '';
  var staleH = stale ? '<div class="block" role="status"><b>기록이 바뀌어서 문구가 달라졌어요</b><span>이미 붙여 넣은 문구가 있다면 아래 새 문구로 바꿔 주세요.</span></div>' : '';
  var ackH = '<label class="ckl"><input type="checkbox" data-act="dack"'+(D.ackOk ? ' checked' : '')+(D.blocks.length || X.live !== 'no' ? ' disabled' : '')+'><span>기록과 실제로 만든 방식이 같아요.</span></label>';
  var discl = '<p class="note fine">이 문구는 작업 기록으로 만든 초안이에요. 법률 자문이 아니고, 플랫폼 규정은 바뀔 수 있으니 제출하기 전에 규정 원문을 확인해 주세요. 무엇을 밝힐지는 개발자가 정하고 책임져요.</p>';
  var sec4;
  if(D.aiN){
    sec4 = '<section class="card stack"><h2>4. 스토어 AI 고지문</h2>' + blockH + staleH + dropH + sentH
      + '<label class="ckl"><input type="checkbox" data-act="dnames"'+(X.names ? ' checked' : '')+'><span>도구 이름 넣기</span></label><p class="note">스팀은 도구 이름을 요구하지 않아요. 이름을 넣으면 도구를 바꿀 때마다 문구도 고쳐야 해요.</p>'
      + codeH + '<div class="copybox" aria-label="복사할 영어 문구">'+txt+'</div>' + (X.live == null ? '<p class="note">3번에서 ‘아니요’를 고르면 실행 중에는 AI로 만들지 않는다는 문장이 한 줄 더 붙어요.</p>' : '')
      + (D.steam ? '<div class="where">스팀에 붙여 넣는 곳 <span>스팀웍스</span>›<span>콘텐츠 설문</span>›<span>AI 생성 콘텐츠</span><em>· 상점 페이지에 공개돼요</em></div>' : '') + itchH
      + ackH + '<div class="row-acts"><button type="button" class="btn" data-act="dcopy"'+(D.canCopy ? '' : ' disabled')+'>'+(D.fresh ? '다시 복사하기' : stale ? '새 문구 복사하기' : '영어 문구 복사하기')+'</button><span class="note">'+(D.blocks.length ? '위에서 정할 게 남아 있어요.' : X.live === 'yes' ? '실행 중 생성은 직접 작성해 주세요.' : !D.ackOk ? '체크하면 복사할 수 있어요.' : D.fresh ? '복사했어요 · ' + (X.copiedAt || '') : '')+'</span></div>' + discl + '</section>';
  } else {
    sec4 = '<section class="card stack"><h2>4. 스토어 AI 고지문</h2>' + blockH + staleH + dropH
      + '<p>'+(X.live === 'yes' ? '게임을 실행하는 동안 AI가 콘텐츠를 만든다면 '+(D.steam ? '스팀웍스 콘텐츠 설문의 실행 중 생성 항목에 그 내용과 부적절한 결과를 막는 방법을 직접 적어야 해요. ' : '')+(D.itch ? 'itch.io AI 공개에서도 ‘생성형 AI 사용’을 골라 주세요. ' : '')+'문구는 만들어 드리지 않아요.' : D.blocks.length ? '위에서 정할 것을 마치면 AI로 만든 콘텐츠가 있는지 판단할 수 있어요.' : '기록에 AI로 만든 그림, 소리, 글이 없어요. ' + (D.steam ? '스팀웍스 콘텐츠 설문의 AI 항목에서 ‘아니요’를 고르면 돼요. 붙여 넣을 문구는 없어요.' : '붙여 넣을 문구는 없어요.'))+'</p>'
      + codeH + itchH + (X.live === 'yes' ? '' : ackH)
      + (X.live === 'yes' ? '' : '<div class="row-acts"><button type="button" class="btn" data-act="dcopy"'+(D.canCopy ? '' : ' disabled')+'>'+(D.fresh ? '안내대로 골랐어요 · 다시 표시' : '안내대로 골랐어요')+'</button></div>') + discl + '</section>';
  }
  /* 상업적 이용 */
  var rightsH = '<section class="card stack"><h2>5. 상업적으로 써도 될까요?</h2><p class="note">기록에 남은 도구와 구독 여부로 확인해요. ‘상업 이용 가능’은 저희가 '+CHECKED+'에 약관을 읽고 정리한 내용이에요.</p><div class="rlist">'
    + (D.rights.length ? D.rights.map(function(it){
        var stH;
        if(it.risk) stH = '<span class="chip c-risk">상업 이용 안 됨</span>';
        else if(it.ask) stH = '<span class="mk"><span>'+it.ask+'개의 구독 여부가 비어 있어요</span><span class="seg sm" role="group" aria-label="'+esc(it.name)+' 구독 여부"><button type="button" data-dpaid="'+it.t+'|1">모두 유료 중</button><button type="button" data-dpaid="'+it.t+'|0">아니요</button></span></span>';
        else if(it.need) stH = X.rchk[it.t] ? '<span class="chip c-mute">직접 읽음 · '+X.rchk[it.t]+'</span>' : '<span class="row-acts"><button type="button" class="btn sm quiet" data-src="'+esc(it.t)+'">근거</button><button type="button" class="btn sm sec" data-drchk="'+esc(it.t)+'">라이선스를 읽었어요</button></span>';
        else stH = '<span class="ev"><span class="chip c-ok">상업 이용 가능 · '+CHECKED+' 기준</span><button type="button" class="link sm" data-src="'+esc(it.t)+'">근거 보기</button></span>';
        return '<div class="rl'+(it.risk ? ' risk' : '')+'">'+(TOOLS[it.t] ? av(it.t) : '<span class="tool-av" aria-hidden="true" style="background:#a6adc8;width:28px;height:28px">'+esc(it.name.charAt(0).toUpperCase())+'</span>')+'<span><b>'+esc(it.name)+'</b><small>'+esc(it.rows)+' · '+esc(it.why)+(it.note ? ' '+esc(it.note) : '')+'</small></span>'+stH+'</div>';
      }).join('') : '<p class="note">따로 살펴볼 도구가 없어요. 기록에 직접 만든 에셋만 있어요.</p>') + '</div></section>';
  var due = storeDue(q);
  return '<div class="why"><span class="qm">'+ui('info', 18)+'</span><div><b>'+(due ? '스토어 페이지를 열 때예요' : storeLabelOf(q) + ' 스토어 페이지를 열기 전에 준비해요')+'</b><p>'+(D.steam ? '스팀은 스토어 페이지 검토를 요청하기 전에 콘텐츠 설문을 내야 하고, AI로 만든 콘텐츠는 설문의 AI 항목에 밝혀요. ' : '')+'작업 기록으로 스토어 AI 고지문과 상업적 이용 확인을 함께 준비해요. 기록이 바뀌면 문구도 바뀌고, 이미 복사한 문구는 다시 붙여 넣으라고 알려 드려요.</p></div></div>'
    + platH + useH + liveH + sec4 + rightsH;
}


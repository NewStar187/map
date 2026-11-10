/* ============================== 사이드바 ============================== */
function renderSidebar(){
  var al = activeAlerts().filter(function(a){ return !a.done; });
  var qs = S.quotes.map(function(q){
    var cur = S.view === 'quote' && S.activeQ === q.id, gi = gameInfo(q), todo = al.filter(function(a){ return alertFor(a, q.id); }), risk = todo.some(function(a){ return a.sev === 'risk'; });
    return '<li><button type="button" class="qi" data-quote="'+q.id+'"'+(cur ? ' aria-current="page"' : '')+'><b>'+esc(q.name)+'</b>'
      + (todo.length ? '<span class="todo'+(risk ? ' risk' : '')+'" aria-hidden="true"></span><span class="sr">'+(risk ? '확인할 소식 있음' : '할 일 있음')+'</span>' : '<span></span>')
      + '<small>'+esc(gi.label)+'</small></button></li>';
  }).join('');
  if(S.draft && S.view !== 'results') qs = '<li><button type="button" class="qi draftq" data-act="to-draft"><b>'+esc(S.draft.name)+'</b><span></span><small>'+(S.editingQ ? '견적 고치는 중 · 아직 저장 안 됨' : '견적 받는 중 · 아직 저장 안 됨')+'</small></button></li>' + qs;
  if(!qs) qs = '<li class="qempty">아직 저장한 게임이 없어요.</li>';
  var tools = S.myTools.map(function(x){
    return '<li><button type="button" class="tl" data-toolf="'+x.t+'" aria-pressed="'+(S.view === 'tool' && S.toolT === x.t)+'">'+av(x.t)+'<span><b>'+TOOLS[x.t].name+'</b><small>'+esc(ownedSt(x.t))+' · 결과물 보기</small></span></button></li>';
  }).join('');
  $('sb').innerHTML = '<button type="button" class="logo" data-go="home">'+icon('doc', 22)+'<span class="brand"><b>MAP</b><small>My Asset Preset</small></span></button>'
    + '<nav aria-label="주 메뉴"><button type="button" class="navbtn" data-go="home"'+(S.view === 'home' ? ' aria-current="page"' : '')+'>'+icon('home', 16)+'내 게임'+(al.length ? '<span class="cnt"><span class="sr">소식 </span>'+al.length+'<span class="sr">개</span></span>' : '')+'</button>'
    + '<button type="button" class="navbtn" data-go="tools"'+(S.view === 'tools' || S.view === 'tool' ? ' aria-current="page"' : '')+'>'+icon('doc', 16)+'커뮤니티<span class="cnt tokc"><span class="sr">토큰 </span>'+icon('coin', 12)+(S.tokens || 0)+'</span></button></nav>'
    + '<section aria-labelledby="sbQ"><div class="sb-h"><span id="sbQ">게임</span><button type="button" class="plus" data-go="setup" aria-label="새 게임 견적 받기"'+(S.view === 'setup' ? ' aria-current="page"' : '')+'>'+ui('plus', 16)+'</button></div><ul class="qlist">'+qs+'</ul></section>'
    + '<section aria-labelledby="sbT"><div class="sb-h"><span id="sbT">쓰는 도구</span><button type="button" class="link sm" data-act="tools">관리</button></div><ul class="tlist">'+(tools || '<li class="qempty">아직 고른 도구가 없어요.</li>')+'</ul></section>'
    + '<div class="sb-foot"></div>';
}
function placeGuide(){}

/* ============================== 홈: 내 게임 ============================== */
function alertRow(a){
  var open = S.openAlert === a.id, where;
  if(a.items) where = '<ul class="wl">' + a.items.map(function(i){
      var st = i.bad ? '<small class="t-red">유료 플랜 밖에서 받은 곡 '+i.bad+'개</small>' : i.unk ? '<small>표시 안 한 곡 '+i.unk+'개</small>' : i.n ? '<small>기록한 곡 '+i.n+'개 모두 표시함</small>' : '<small>아직 기록한 곡이 없어요</small>';
      return '<li><span><b>'+esc(i.name)+'</b> · '+esc(i.rows)+st+'</span><span class="row-acts"><button type="button" class="btn sm sec" data-quote="'+i.q+'" data-step="2">작업 기록 열기</button></span></li>';
    }).join('') + '</ul>';
  else where = esc(a.where);
  return '<li class="ar'+(open ? ' open' : '')+(a.done ? ' seen' : '')+'"><button type="button" class="arh" data-alert="'+a.id+'" aria-expanded="'+open+'"><span class="sev '+a.sev+'" aria-hidden="true"></span><span><b>'+esc(a.title)+'</b><small>'+a.tag+' · '+esc(a.sub)+(a.done ? ' · ' + a.doneTxt : '')+'</small></span><span class="when">'+a.date+'</span><span class="cv">'+ui(open ? 'chevUp' : 'chev', 16)+'</span></button>'
    + (open ? '<div class="ard"><dl class="anat"><dt>무엇이</dt><dd>'+a.what+'</dd><dt>내 게임</dt><dd>'+where+'</dd><dt>할 일</dt><dd>'+a.todo+'</dd><dt>근거</dt><dd>'+a.src+'</dd></dl><div class="row-acts">'+a.acts+'</div></div>' : '')
    + '</li>';
}
function gameCard(q, al){
  var gi = gameInfo(q), P = logProg(q), c = calc(q.picks, q.qty, q.buy || {}, q.setup), mine = al.filter(function(a){ return alertFor(a, q.id); }), pct = P.tot ? Math.round(P.got / P.tot * 100) : 0;
  return '<article class="gcard'+(gi.sev === 'todo' ? ' due' : '')+'"><div class="gh"><h3>'+esc(q.name)+'</h3><span class="chip '+(gi.sev === 'todo' ? 'c-warn' : gi.sev === 'ok' ? 'c-ok' : 'c-mute')+'">'+esc(gi.label)+'</span></div>'
    + '<p class="gmeta">'+esc(genreName(q.setup))+' · '+esc(q.setup.engine)+' · 월 추가 '+won(c.monthly)+(c.once ? ' · 한 번 '+won(c.once) : '')+'</p>'
    + '<div class="gprog"><span class="bar" aria-hidden="true"><i style="width:'+pct+'%"></i></span><span>작업 기록 '+P.got+' / '+P.tot+'개</span></div>'
    + (mine.length ? '<p class="gnews">'+ui('info', 14)+'<span>'+esc(mine[0].title)+'</span></p>' : '')
    + '<div class="row-acts"><button type="button" class="btn sm" data-quote="'+q.id+'" data-step="'+gi.step+'">'+gi.next+'</button><button type="button" class="btn sm quiet" data-quote="'+q.id+'" data-step="1">견적 보기</button></div></article>';
}
function renderHome(){
  var al = activeAlerts(), fresh = al.filter(function(a){ return !a.done; }), past = al.filter(function(a){ return a.done; });
  var g = S.guide && S.newQ ? getQ(S.newQ) : null;
  var mg = g ? '<div class="mguide" role="status"><h3>‘'+esc(g.name)+'’'+eul(g.name)+' 저장했어요</h3><p>이제 에셋을 만들 때마다 작업 기록에 한 줄씩 남겨 주세요. '+storeLabelOf(g)+'에 스토어 페이지를 열 때 그 기록으로 스토어 AI 고지문을 만들어요.</p><div class="row-acts"><button type="button" class="btn sm" data-act="guide-open">작업 기록 열기</button><button type="button" class="btn sm sec" data-act="guide-close">알겠어요</button></div></div>' : '';
  var games = S.quotes.length ? '<div class="games">' + S.quotes.map(function(q){ return gameCard(q, fresh); }).join('') + '</div>'
    : '<div class="startcard"><div><h2>아직 저장한 게임이 없어요</h2><p>장르와 그림체, 예산만 알려 주시면 내 게임에 맞는 도구 조합을 견적으로 짜 드려요.</p></div></div>';
  var news = '<section class="inbox" aria-labelledby="ibT"><div class="inbox-h"><h2 id="ibT">소식</h2><button type="button" class="link" data-act="rules" aria-expanded="'+!!S.rulesOpen+'">어떤 소식을 보내나요?</button></div>'
    + (S.rulesOpen ? '<ul class="rules"><li><b class="t-red">바로</b><span>내 게임에 쓰는 도구의 상업적 이용 조건이 실제로 바뀌었을 때 보내요. 약관 원문을 저희가 읽고 확인한 뒤에만 보내요.</span></li>'
      + '<li><b class="t-blue">일정</b><span>저장할 때 정한 스토어 페이지 공개 달과 중간 일정에 보내요.</span></li>'
      + '<li><b class="t-muted">안 보냄</b><span>조건이 그대로인 약관 개정, 요금제 이름 변경, 환율 변동, 내 게임에 쓰지 않는 도구 소식은 보내지 않아요.</span></li>'
      + '<li><b class="t-muted">이메일</b><span>게임을 저장할 때 게임마다 켤 수 있어요. 처음에는 꺼져 있어요.</span></li></ul>' : '')
    + (fresh.length || (S.showSeen && past.length) ? '<ul class="alist">' + fresh.concat(S.showSeen ? past : []).map(alertRow).join('') + '</ul>' : '<p class="note">지금 할 일이 있는 소식은 없어요.</p>')
    + (past.length ? '<button type="button" class="link" data-act="showseen">'+(S.showSeen ? '끝난 소식 숨기기' : '끝난 소식 '+past.length+'개 보기')+'</button>' : '')
    + (QUIET.length ? '' : '<!--') + '<details class="quiet"'+(S.quietOpen ? ' open' : '')+'><summary>살펴봤지만 알리지 않은 변화 '+QUIET.length+'건</summary><ul>' + QUIET.map(function(x){ return '<li><b>'+x.title+'</b><small>'+x.date+'</small><span>'+x.why+'</span></li>'; }).join('') + '</ul></details>' + (QUIET.length ? '' : '-->')
    + '</section>';
  $('view').innerHTML = mg
    + '<div class="ph"><div><h1>내 게임</h1><p class="lead">게임마다 견적, 작업 기록, 스토어 AI 고지문을 한곳에서 챙겨요.</p></div><button type="button" class="btn lg" data-go="setup">'+ui('plus', 18)+'새 게임 견적 받기</button></div>'
    + games + news;
}


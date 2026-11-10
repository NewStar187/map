/* ============================== 사이드바 ============================== */
function getQ(id){ return S.quotes.filter(function(q){ return q.id === id; })[0]; }
/* ============================== 내 게임: 기록과 공개 문구의 공통 계산 ============================== */
function qRows(q){ return rowsOf(q.setup).filter(function(r){ return q.qty[r.id] > 0; }); }
function rowById(q, id){ return rowsOf(q.setup).filter(function(r){ return r.id === id; })[0] || null; }
function logsOf(q, rid){ return (q.logs || []).filter(function(l){ return l.row === rid; }); }
function sumN(ls){ return ls.reduce(function(s, l){ return s + (+l.n || 0); }, 0); }
function loggedN(q, rid){ return sumN(logsOf(q, rid)); }
function isCustom(t){ return String(t || '').indexOf('custom:') === 0; }
function tName(t, st){ if(t === 'aseprite' && st && !has('aseprite', st)) return '직접 그리기'; return isCustom(t) ? t.slice(7) : (TOOLS[t] ? TOOLS[t].name : '도구 모름'); }
function uniq(a){ return a.filter(function(x, i){ return a.indexOf(x) === i; }); }
/* 기록 한 줄이 AI로 만든 것인가: 직접 만든 것은 아니고, 받은 팩은 받은 곳의 AI 표시를 따르며 모르면 null */
function logAI(l){
  if(l.how === 'self') return false;
  if(l.how === 'pack') return l.mark === 'ai' ? true : l.mark === 'noai' ? false : null;
  if(isCustom(l.tool)) return !!l.ai;
  return !!(TOOLS[l.tool] && TOOLS[l.tool].ai);
}
var HOW = {as:'AI 결과 그대로', aiedit:'AI에게 다시 고치게 함', human:'사람이 직접 손봄', both:'AI 수정 + 직접 손봄', touched:'사람이 직접 손봄', help:'AI는 돕기만 함', self:'직접 만듦', pack:'받은 팩'};
function howLabel(l, r){ if(r && r.kind === 'code' && l.how === 'as') return 'AI 코드가 그대로 들어감'; if(r && r.kind === 'code' && l.how === 'help') return '짜는 걸 AI가 도움'; return HOW[l.how] || ''; }
/* 유료 구독 여부를 물어야 하는 도구: 요금제에 따라 상업적 이용 권리가 달라지는 도구만 묻는다 */
function paidMatters(t){ var T = TOOLS[t]; return !!(T && T.plans && T.plans.some(function(p){ return p.rights !== 'ok'; })); }
function paidQ(t){ return t === 'suno' ? '유료 플랜을 쓰는 동안 내려받았나요?' : '유료 구독 중에 만들었나요?'; }
function storeLabelOf(q){ return monthLabel(Math.max(0, q.storeAt || 0)); }
function storeDue(q){ return (q.storeAt || 0) <= 0; }
function logProg(q){ var tot = 0, got = 0; qRows(q).forEach(function(r){ tot += q.qty[r.id]; got += Math.min(q.qty[r.id], loggedN(q, r.id)); }); return {tot:tot, got:got, n:(q.logs || []).length}; }
function platsOf(q){ return q.platforms || q.setup.platforms || []; }
function enList(a){ return a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0]; }

/* 공개 문구 모델: 견적이 아니라 작업 기록에서 만든다.
   - 기록이 없는 에셋, AI 표시를 모르는 팩, 실행 중 생성 여부가 정해지지 않으면 복사를 막는다
   - 비율(일부/대부분/전부)은 기록한 개수로 먼저 계산하고, 사용자가 바꿀 수 있다
   - 문구의 지문(sig)을 복사할 때 저장해 두고, 기록이 바뀌어 문구가 달라지면 다시 붙여 넣으라고 알린다 */
function discModel(q){
  var st = q.setup, D = q.disc = q.disc || {}, names = !!D.names, rows = qRows(q);
  D.ratio = D.ratio || {}; D.drop = D.drop || {}; D.rchk = D.rchk || {};
  var plats = platsOf(q), steam = plats.indexOf('steam') >= 0, itch = plats.indexOf('itch') >= 0;
  var others = plats.filter(function(p){ return p !== 'steam' && p !== 'itch' && p !== 'unknown'; });
  var rowAI = {}, groups = {}, order = [], noLog = [], dropped = [], partial = [], unknownMark = [], itchCats = {}, codeAs = [], codeHelp = [], tools = {}, torder = [];
  rows.forEach(function(r){
    var ls = logsOf(q, r.id), n = sumN(ls), plan = q.qty[r.id], um = {};
    if(!ls.length){ (D.drop[r.id] ? dropped : noLog).push(r); return; }
    if(n < plan && !D.drop[r.id]) partial.push({r:r, n:n, plan:plan});
    ls.forEach(function(l){
      if(!tools[l.tool]){ tools[l.tool] = {rows:[], logs:[]}; torder.push(l.tool); }
      tools[l.tool].logs.push(l); if(tools[l.tool].rows.indexOf(RN(r)) < 0) tools[l.tool].rows.push(RN(r));
      var ai = logAI(l);
      if(ai === null){ um[l.tool] = true; return; }
      if(!ai) return;
      if(r.kind === 'code' && l.how === 'help'){ if(codeHelp.indexOf(r) < 0) codeHelp.push(r); return; }
      if(r.kind === 'code' && codeAs.indexOf(r) < 0) codeAs.push(r);
      itchCats[r.kind === 'code' ? '코드' : r.cat === 'text' ? '글·대사' : (r.cat === 'sfx' || r.cat === 'bgm') ? '소리' : '그림'] = true;
      var ra = rowAI[r.id] = rowAI[r.id] || {r:r, ai:0, touched:0, tools:[]};
      ra.ai += +l.n || 0; if(l.how === 'human' || l.how === 'both' || l.how === 'touched') ra.touched += +l.n || 0; if(ra.tools.indexOf(l.tool) < 0) ra.tools.push(l.tool);
    });
    Object.keys(um).forEach(function(t){ unknownMark.push({r:r, t:t}); });
  });
  /* 비율은 에셋 줄마다 정한다(주인공은 전부, 배경은 일부일 수 있다). 다만 영어 문구에서 이름이 같은 줄(움직이는 오브젝트 묶음들)은
     문장에서 구별할 수 없어서 한 비율로 묶는다. 비율과 손본 정도가 같은 줄끼리 한 문장이 된다 */
  var enAI = {}, enOrder = [];
  rows.forEach(function(r){ var ra = rowAI[r.id]; if(!ra) return; var sc0 = r.where ? 'both' : 'game', k = REN(r) + '|' + sc0;
    if(!enAI[k]){ enAI[k] = {id:r.id, rows:[], ai:0, tot:0, touched:0, tools:[], scope:sc0}; enOrder.push(k); }
    var e = enAI[k]; e.rows.push(r); e.ai += ra.ai; e.tot += loggedN(q, r.id); e.touched += ra.touched; ra.tools.forEach(function(t){ if(e.tools.indexOf(t) < 0) e.tools.push(t); }); });
  enOrder.forEach(function(k){ var e = enAI[k];
    e.auto = e.ai >= e.tot ? 'all' : e.ai * 2 >= e.tot ? 'most' : 'some'; e.sc = D.ratio[e.id] || e.auto; e.edit = e.touched && e.touched >= e.ai ? 'all' : e.touched ? 'some' : 'none';
    var key = e.scope + '|' + e.sc + '|' + e.edit;
    if(!groups[key]){ groups[key] = {key:key, scope:e.scope, sc:e.sc, edit:e.edit, rows:[], tools:[]}; order.push(key); }
    groups[key].rows.push(e); e.tools.forEach(function(t){ if(groups[key].tools.indexOf(t) < 0) groups[key].tools.push(t); });
  });
  var sents = order.map(function(k){
    var g = groups[k], rs = [].concat.apply([], g.rows.map(function(x){ return x.rows; })), en = uniq(rs.map(REN)), ko = uniq(rs.map(RKO)), single = en.length === 1 && /^(music|background art|code|dialogue and story text)$/.test(en[0]);
    var tn = g.tools.map(tName), tool = names ? (tn.length === 1 ? 'an AI tool (' + tn[0] + ')' : 'AI tools (' + enList(tn) + ')') : 'generative AI tools', where = g.scope === 'both' ? ' in this game and on its store page' : ' in this game';
    var ENr = {some:'Some of the ', most:'Most of the ', all:'All of the '}[g.sc], KOr = {some:'일부', most:'대부분', all:'전부'}[g.sc];
    var enTxt = ENr + enList(en) + where + (single ? ' was' : ' were') + ' created with ' + tool
      + (g.edit === 'all' ? (single ? ', and it was then edited by the developer.' : ', and they were then edited by the developer.') : g.edit === 'some' ? (single ? ', and part of it was then edited by the developer.' : ', and some of them were then edited by the developer.') : '.');
    var koTxt = (g.scope === 'both' ? '이 게임과 상점 페이지의 ' : '이 게임의 ') + ko.join(', ') + (g.sc === 'all' ? eun(ko[ko.length - 1]) + ' 모두' : ' 중 ' + KOr + eun(KOr)) + ' ' + (names ? 'AI 도구(' + tn.join(', ') + ')' : '생성형 AI 도구') + '로 만들었' + (g.edit === 'all' ? '고, 그 뒤 개발자가 손봤어요.' : g.edit === 'some' ? '고, 그중 일부는 개발자가 손봤어요.' : '어요.');
    return {k:k, g:g, en:enTxt, ko:koTxt};
  });
  var aiN = sents.length;
  if(D.live === 'no' && aiN) sents.push({k:'live', live:true, en:'No content is generated by AI while the game is running.', ko:'게임을 실행하는 동안에는 AI로 콘텐츠를 만들지 않아요.'});
  var cats = ['그림', '소리', '글·대사', '코드'].filter(function(c){ return itchCats[c]; });
  var blocks = [];
  if(!rows.some(function(r){ return logsOf(q, r.id).length; })) blocks.push('작업 기록이 하나도 없어서 AI 사용 여부를 판단할 수 없어요. 만든 에셋을 먼저 기록해 주세요.');
  else if(noLog.length) blocks.push('기록이 없는 에셋이 ' + noLog.length + '종류 있어요. 기록을 남기거나 ‘게임에서 뺐어요’를 눌러 주세요.');
  if(partial.length) blocks.push('견적보다 기록이 적은 에셋이 ' + partial.length + '종류 있어요. 나머지를 기록하거나 ‘나머지는 안 만들었어요’를 눌러 주세요.');
  if(unknownMark.length) blocks.push('받은 팩에 AI 표시가 있었는지 정해 주세요.');
  var under = []; Object.keys(groups).forEach(function(k){ groups[k].rows.forEach(function(e){ if({some:0, most:1, all:2}[e.sc] < {some:0, most:1, all:2}[e.auto]) under.push(e.rows.map(RN).join(', ')); }); });
  if(under.length) blocks.push(under.join(', ') + '의 비율이 기록보다 낮아요. 기록이 틀렸다면 작업 기록을 고쳐 주세요.');
  if(D.live == null) blocks.push('게임을 실행하는 동안 AI가 콘텐츠를 만드는지 골라 주세요.');
  var sig = JSON.stringify([sents.map(function(s){ return s.en; }), steam ? cats.concat(['steam']) : [], itch ? cats : [], D.live, aiN]);
  var fresh = !!D.copied && D.sig === sig;
  /* 상업적 이용 확인: 기록에 남은 도구와 '유료 구독 중에 만들었는지'로 판단한다 */
  var rights = torder.map(function(t){
    var info = tools[t], T = TOOLS[t], it = {t:t, name:tName(t, q.setup), rows:info.rows.join(', ')};
    if(info.logs.every(function(l){ return l.how === 'self'; })) return null;
    if(isCustom(t)){ it.need = true; it.why = '목록에 없는 도구예요. 그 도구의 약관에서 상업적 이용 조건을 직접 확인해 주세요.'; return it; }
    var pm = paidMatters(t), unpaid = pm ? info.logs.filter(function(l){ return l.paid === false; }) : [], unk = pm ? info.logs.filter(function(l){ return l.paid == null; }) : [];
    if(unpaid.length){ var fp = T.plans.filter(function(p){ return p.rights !== 'ok'; })[0]; it.risk = true;
      it.why = fp.rights === 'attr' ? '무료 플랜으로 만든 ' + sumN(unpaid) + '개는 출처를 밝혀야 쓸 수 있어요. 출처 표시를 넣거나 유료 요금제로 다시 만들어 주세요.'
             : (t === 'suno' ? '유료 플랜 밖에서 받은 곡 ' : '구독 밖에서 만든 ') + sumN(unpaid) + '개는 상업적으로 쓸 수 없어요. 출시 전에 다시 만들거나 다른 에셋으로 바꿔 주세요.'; }
    if(unk.length){ it.ask = sumN(unk); }
    if(T.pack){ if(T.rights === 'ok') it.ok = true; else it.need = true; }
    else if(T.rightsCheck) it.need = true;
    else it.ok = !it.risk && !it.ask;
    it.why = it.why || T.why || '';
    if(T.beta) it.note = '오픈 베타라 조건이 바뀔 수 있어요. 출시 직전에 한 번 더 확인해 주세요.';
    if(t === 'suno') it.note = '구독을 끝내기 전에 쓸 곡을 모두 내려받아 두세요.';
    if(t === 'midjourney') it.note = 'Basic·Standard로 만든 그림은 다른 사용자에게 공개돼요.';
    return it;
  }).filter(Boolean);
  var rightsDone = rights.every(function(it){ return !it.risk && !it.ask && (!it.need || D.rchk[it.t]); });
  var ackOk = !!D.ack && D.ackSig === sig;
  var canCopy = !blocks.length && D.live === 'no' && ackOk;
  return {sents:sents, aiN:aiN, blocks:blocks, noLog:noLog, dropped:dropped, partial:partial, unknownMark:unknownMark, cats:cats, codeAs:codeAs, codeHelp:codeHelp,
    steam:steam, itch:itch, others:others, rights:rights, rightsDone:rightsDone, sig:sig, fresh:fresh, canCopy:canCopy, ackOk:ackOk, ready:fresh && !blocks.length, tools:tools};
}
/* 게임 하나의 지금 단계와 다음 할 일 */
function gameInfo(q){
  var D = discModel(q), due = storeDue(q);
  if(D.ready) return {k:'ready', label:'스토어 AI 고지문 준비 끝' + (D.rightsDone ? '' : ' · 권리 확인 남음'), next:'스토어 AI 고지문 보기', step:3, sev:D.rightsDone ? 'ok' : 'todo'};
  if(due) return {k:'store', label:'스토어 페이지를 열 달이에요', next:'스토어 AI 고지문 준비하기', step:3, sev:'todo'};
  return {k:'make', label:'만드는 중 · 스토어 페이지 ' + shortMonth(storeLabelOf(q)), next:'만든 에셋 기록하기', step:2, sev:''};
}
/* 견적과 기록에 들어 있는 도구(소식과 후기 필터에 쓴다) */
function quoteTools(q){
  var m = {}, RS = rowsOf(q.setup), by = {}; RS.forEach(function(r){ by[r.id] = r; });
  RS.forEach(function(r){ if(!(q.qty[r.id] > 0)) return; var t = q.picks[r.id]; if(TOOLS[t]) (m[t] = m[t] || []).push(RN(r)); });
  (q.logs || []).forEach(function(l){ var r = by[l.row]; if(!r || !TOOLS[l.tool]) return; var a = (m[l.tool] = m[l.tool] || []); if(a.indexOf(RN(r)) < 0) a.push(RN(r)); });
  return m;
}
function quoteUsesAI(q){ return (q.logs || []).some(function(l){ return logAI(l); }) || qRows(q).some(function(r){ return r.kind !== 'code' && TOOLS[q.picks[r.id]] && TOOLS[q.picks[r.id]].ai; }); }

/* ============================== 소식 ==============================
   내 게임에 쓰는 도구의 상업적 이용 조건이 실제로 바뀌었을 때와, 저장할 때 정한 일정만 알린다.
   조건이 그대로인 약관 개정, 요금제 이름 변경, 환율 변동은 알리지 않고 '알리지 않은 변화'에 기록만 남긴다. */
function activeAlerts(){
  var list = [], su = [];
  S.quotes.forEach(function(q){
    var m = quoteTools(q); if(!m.suno) return;
    var sl = (q.logs || []).filter(function(l){ return l.tool === 'suno'; }), unk = sumN(sl.filter(function(l){ return l.paid == null; })), bad = sumN(sl.filter(function(l){ return l.paid === false; }));
    su.push({q:q.id, name:q.name, rows:m.suno.join(', '), n:sumN(sl), unk:unk, bad:bad});
  });
  if(su.length){
    var open = su.filter(function(i){ return i.unk || i.bad; });
    list.push({id:'suno-dl', sev:'risk', tag:'상업적 이용 조건', date:'9월 3일', title:'Suno 곡은 유료 플랜 중에 내려받은 것만 상업적으로 쓸 수 있어요', items:su,
      done:!!S.alertDone['suno-dl'] && !open.length, doneTxt:'읽음 · ' + (S.alertDone['suno-dl'] || ''),
      sub:su.length === 1 ? su[0].name + ' · ' + su[0].rows : '게임 ' + su.length + '개',
      what:'Suno가 9월 3일 약관에서 유료 플랜을 쓰는 동안 내려받은 곡만 상업적으로 쓸 수 있게 바꿨어요. 내려받을 수 있는 곡 수도 한 달에 Pro 20곡, Premier 60곡으로 정해졌어요.',
      todo:open.length ? '작업 기록에서 Suno 곡마다 유료 플랜 중에 내려받았는지 표시해 주세요. 구독을 끝내기 전에 쓸 곡을 모두 내려받아 두세요.' : '기록한 곡은 모두 표시했어요. 구독을 끝내기 전에 쓸 곡을 모두 내려받아 두세요.',
      src:'Suno 이용약관(9월 3일 개정) · Suno 요금제 페이지 · 저희 확인 ' + CHECKED,
      acts:'<button type="button" class="btn sm sec" data-src="suno">근거 보기</button>' + (S.alertDone['suno-dl'] ? '' : '<button type="button" class="btn sm quiet" data-alertok="suno-dl">알겠어요</button>')});
  }
  S.quotes.forEach(function(q){
    if(!q.remind) return;
    (q.ms || []).forEach(function(m){ if(m.m > 0) return; var id = 'ms-' + q.id + '-' + m.id, ml = monthLabel(Math.max(0, m.m));
      list.push({id:id, q:q.id, sev:'todo', tag:'일정', date:shortMonth(ml), title:q.name + ', ‘' + m.name + '’ 달이에요', sub:q.name, done:!!S.alertDone[id], doneTxt:'읽음 · ' + (S.alertDone[id] || ''),
        what:'저장할 때 ' + ml + '에 ‘' + m.name + '’ 일정을 넣으셨어요.', where:q.name + ' · 작업 기록 ' + (q.logs || []).length + '건',
        todo:'이 일정까지 만든 에셋을 작업 기록에 남겨 두세요. 기록이 쌓여 있어야 스토어 페이지를 열 때 스토어 AI 고지문을 바로 만들 수 있어요.', src:'저장할 때 정한 일정',
        acts:'<button type="button" class="btn sm" data-quote="'+q.id+'" data-step="2">작업 기록 열기</button>' + (S.alertDone[id] ? '' : '<button type="button" class="btn sm quiet" data-alertok="'+id+'">알겠어요</button>')}); });
  });
  S.quotes.forEach(function(q){
    if(!storeDue(q)) return; var D = discModel(q); if(D.ready) return;
    var steam = platsOf(q).indexOf('steam') >= 0;
    list.push({id:'store-' + q.id, q:q.id, sev:'todo', tag:'일정', date:shortMonth(storeLabelOf(q)), title:q.name + ', 스토어 페이지를 열 달이에요', sub:q.name,
      what:'저장할 때 ' + storeLabelOf(q) + '에 스토어 페이지를 열기로 정하셨어요.', where:q.name + ' · 작업 기록 ' + (q.logs || []).length + '건',
      todo:(steam ? '스팀은 스토어 페이지 검토를 요청하기 전에 콘텐츠 설문(AI 항목 포함)을 내야 해요. ' : '') + '작업 기록으로 스토어 AI 고지문을 만들어 두세요. 5분 정도 걸려요.',
      src:'저장할 때 정한 일정' + (steam ? ' · 스팀웍스 콘텐츠 설문 안내' : ''),
      acts:'<button type="button" class="btn sm" data-quote="'+q.id+'" data-step="3">스토어 AI 고지문 준비하기</button>'});
  });
  return list;
}
function alertFor(a, qid){ return a.items ? a.items.some(function(i){ return i.q === qid; }) : a.q === qid; }
/* 살펴봤지만 알리지 않은 변화: 왜 알리지 않았는지 함께 남겨 알림이 조용한 이유를 보여 준다 */
var QUIET = [
  {date:'10월 30일', title:'PixelLab 이용약관 개정', why:'개정본을 읽어 봤어요. 요금제를 나누지 않고 상업적 이용을 허락하고 저작권이 사용자에게 있다는 조건이 그대로라서 알리지 않았어요.'},
  {date:'10월', title:'Claude 요금제 이름 변경', why:'Max 20x가 Ultra로 이름이 바뀌었고 월 200달러인 가격은 같아요. 견적 숫자에 영향이 없어서 알리지 않았어요.'},
  {date:'매일', title:'환율 변동', why:'환율이 움직여도 소식으로 보내지 않아요. 견적에는 기준 환율인 ' + FX_NOTE + '을 적고, 환율이 10% 오르면 예산을 넘는 견적은 따로 표시해요.'}
];


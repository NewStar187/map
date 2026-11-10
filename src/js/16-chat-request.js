function snapQ(q){ return JSON.stringify({picks:q.picks, locks:q.locks, cap:q.cap == null ? null : q.cap}); }
function restoreQ(q, snap){ var o = JSON.parse(snap); q.picks = o.picks; q.locks = o.locks || {}; q.cap = o.cap == null ? null : o.cap; }
function stateNote(o, q){
  var nl = ROWS.filter(function(r){ return q.locks[r.id] && !(o.locks || {})[r.id]; }).map(function(r){ return RN(r); });
  return nl.length ? joinNames(nl) + ' 고정' : '설정 바뀜';
}
/* 견적마다 가장 최근에 바꾼 메시지만 되돌릴 수 있다(되돌리면 그 앞 메시지가 다시 되돌릴 수 있는 상태가 됨) */
function undoableSet(){
  var d = S.draft, seen = {}, ok = {};
  for(var i = d.chat.length - 1; i >= 0; i--){ var m = d.chat[i]; if(!m.snap || m.undone || m.old) continue; var k = m.qi != null ? m.qi : -1; if(seen[k]) continue; seen[k] = true; ok[i] = true; }
  return ok;
}
function joinNames(a){ return a.join(', '); }
function lastEun(a){ return eun(a[a.length - 1]); }
function lastEul(a){ return eul(a[a.length - 1]); }

/* ----- 견적 도우미: 규칙 기반 해석 (서비스에서는 LLM이 같은 동작을 도구 호출로 고른다) ----- */
var TOOLKEY = [['midjourney',/midjourney|미드저니/i],['meshy',/meshy|메시/i],['suno',/suno|수노/i],['blender',/blender|블렌더/i],['quaternius',/quaternius|쿼터니우스/i],['pixellab',/pixellab|픽셀랩/i],['retro',/retro|레트로/i],['zimage',/z-?image|지이미지/i],['eleven',/eleven|일레븐/i],['claude',/claude|클로드/i],['copilot',/copilot|코파일럿/i],['kenney',/kenney|케니/i],['jsfxr',/jsfxr/i],['aseprite',/aseprite|에이스프라이트|애셋프라이트/i]];
var NEG_AI = /(AI|ai|에이아이)\s*(?:는|은|를|을|로|으로)?\s*(?:쓰지\s*말고|쓰지\s*않고|하지\s*말고|안\s*쓰고|안\s*하고|안\s*쓸래요?|안\s*쓸게요|안\s*할래요?|안\s*할게요|말고|빼고|대신|없이|아니고|말구)/g;
var NEG_WORD = /([A-Za-z0-9가-힣-]+?)(?:은|는|을|를|로|으로)?\s*(?:말고|빼고|대신|아니고|아니라|말구)(?=\s|$|[,.])/g;
/* 금액: 2만 원, 2.5만 원, 2만 5천 원, 25,000원, 만 원 */
function parseWon(tx){
  var m = tx.match(/(\d+(?:\.\d+)?)\s*만(?:\s*(\d)\s*천)?\s*원?/); if(m) return Math.round(parseFloat(m[1]) * 10000 + (m[2] ? +m[2] * 1000 : 0));
  m = tx.match(/(\d{1,3}(?:,\d{3})+|\d{4,})\s*원/); if(m) return +m[1].replace(/,/g, '');
  m = tx.match(/(\d)\s*천\s*원/); if(m) return +m[1] * 1000;
  if(/(?:^|\s)만\s*원/.test(tx)) return 10000;
  return null;
}
function eulT(t){ var n = TOOLS[t].name, c = n.charCodeAt(n.length - 1); if(c >= 0xAC00 && c <= 0xD7A3) return eul(n); return TOOLS[t].ro === '으로' ? '을' : '를'; }
function parseMethod(tx){
  if(/AI|ai|에이아이|뽑/.test(tx)) return 'ai';
  if(/사서|구매|살래|사 쓸|사다/.test(tx)) return 'buy';
  if(/무료|공짜/.test(tx)) return 'free';
  if(/직접|그릴|그려|손으로|작곡|짤게|짤래|짜요|짜 볼|만들게|만들래/.test(tx)) return 'direct';
  return null;
}
/* 부정 표현을 떼어 내고, 뗀 부분에서 빼고 싶은 방법·도구를 따로 모은다 */
/* 문장에서 찾을 에셋 줄 이름: 묶음 이름과 분류 이름. 하나의 말이 여러 줄을 가리킬 수 있다(캐릭터 → 모든 오브젝트 묶음) */
function rowKeys(){
  var objs = ROWS.filter(function(r){ return r.cat === 'obj'; }), keys = [];
  objs.forEach(function(r){ var syn = OBJ_SYN.filter(function(p){ return p[0].test(r.name); }).map(function(p){ return p[1]; }); keys.push([[r.id], new RegExp(r.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + (syn.length ? '|' + syn.join('|') : ''), 'g')]); });
  keys.push([objs.map(function(r){ return r.id; }), /캐릭터|스프라이트|애니메이션|애니|모션|동작|오브젝트|모델/g]);
  [['scene', /배경(?!음악)|맵|타일|지형/g], ['ui', /UI|ui|아이콘|버튼/g], ['illus', /일러스트|홍보|상점 이미지|스토어|캡슐|대표 이미지|컷신/g], ['sfx', /효과음|사운드 이펙트|SFX|sfx/g], ['bgm', /배경음악|BGM|bgm|음악/g], ['text', /대사|스토리|시나리오|텍스트/g], ['code', /코드|스크립트|프로그래밍/g]].forEach(function(k){ if(ROW[k[0]]) keys.push([[k[0]], k[1]]); });
  (ROWS.filter(function(r){ return r.custom; })).forEach(function(r){ keys.push([[r.id], new RegExp(r.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')]); });
  return keys;
}
function splitNeg(tx){
  var neg = [];
  tx = tx.replace(NEG_AI, function(){ neg.push('AI'); return ' '; });
  var rk = rowKeys(); tx = tx.replace(NEG_WORD, function(m, w){ if(rk.some(function(k){ k[1].lastIndex = 0; return k[1].test(w); })) return ' '; neg.push(w); return ' '; });
  var negMeth = {}, negTool = {};
  neg.forEach(function(w){ var m = parseMethod(w); if(m) negMeth[m] = true; TOOLKEY.forEach(function(k){ if(k[1].test(w)) negTool[k[0]] = true; }); });
  return {tx:tx, negMeth:negMeth, negTool:negTool};
}
/* 문장에서 에셋 줄을 찾는다. "캐릭터 애니메이션"처럼 꾸미는 말이 붙으면 뒤 명사가 중심, "캐릭터랑 타일"처럼 이어지면 둘 다 */
function rowHits(tx){
  var hits = [];
  rowKeys().forEach(function(k){ k[1].lastIndex = 0; var m; while((m = k[1].exec(tx))){ if(!m[0]) { k[1].lastIndex++; continue; } hits.push({ids:k[0], s:m.index, e:m.index + m[0].length}); } });
  hits.sort(function(a, b){ return a.s - b.s || (b.e - b.s) - (a.e - a.s); });
  var clean = []; hits.forEach(function(h){ if(!clean.some(function(c){ return h.s < c.e && h.e > c.s; })) clean.push(h); });
  var out = []; clean.forEach(function(h){ h.ids.forEach(function(id){ if(out.indexOf(id) < 0) out.push(id); }); });
  return out;
}
/* 한 메시지를 절 단위로 나눈다. 방법이 없는 절의 에셋은 다음 절의 방법을 따른다("캐릭터, 타일은 AI로") */
function parseRequest(text){
  var clauses = text.replace(/\s+/g, ' ').split(/[.;!?\n]|,\s*|\s(?:그리고|그다음|또)\s|(?:하고|이고|고)\s(?=\S+(?:은|는)\s)/);
  var ops = [], carryRows = [];
  clauses.forEach(function(raw){
    if(!raw || !raw.trim()) return;
    var gq = raw.match(/견적\s*([1-3])\s*(?:번)?\s*(?:으로|로|을|를|이|가)?\s*(?:바꿔|보여|볼래|볼게|고를|골라|선택|가\s|갈래|할래)/);
    if(gq){ ops.push({k:'goq', n:+gq[1]}); return; }
    var gn = raw.match(/(lite|라이트|balance|밸런스|발란스|quality|퀄리티)\s*(?:견적)?\s*(?:으로|로|을|를|이|가)?\s*(?:바꿔|보여|볼래|볼게|고를|골라|선택|갈래|할래)/i);
    if(gn){ var gk = gn[1].toLowerCase(); ops.push({k:'goq', n:/lite|라이트/.test(gk) ? 1 : /quality|퀄리티/.test(gk) ? 3 : 2}); return; }
    var sn = splitNeg(raw), tx = sn.tx, rows = rowHits(tx), meth = parseMethod(tx), tool = TOOLKEY.filter(function(k){ return k[1].test(tx); }).map(function(k){ return k[0]; })[0] || null;
    var amt = parseWon(raw), mB = amt != null, cost = /비용|돈|싸게|저렴|아껴|아끼|절약|구독료/.test(raw), time = /시간|빨리|빠르게|일정|서둘/.test(raw);
    if(!rows.length && !meth && !tool && !Object.keys(sn.negMeth).length && !Object.keys(sn.negTool).length && carryRows.length && !mB && !cost && !time) return;
    /* 줄 이름 없이 도구만 말하면: "PixelLab 말고"는 그 도구를 쓰는 줄, "미드저니 써볼래"는 그 도구를 쓸 수 있는 줄 */
    var cq = S.draft ? S.draft.quotes[S.draft.sel] : null;
    if(cq && /약관/.test(raw) && /(안\s*쓸|안\s*써|빼|말고|바꿔|피할|싫)/.test(raw)){ Object.keys(TOOLS).forEach(function(k){ if(TOOLS[k].tos) sn.negTool[k] = true; }); if(!ROWS.some(function(r){ return S.draft.qty[r.id] > 0 && TOOLS[cq.picks[r.id]].tos; })){ ops.push({k:'note', text:'약관이 바뀐 도구는 지금 견적에 없어요.'}); return; } }
    if(cq && !rows.length && !carryRows.length){
      var nk = Object.keys(sn.negTool);
      if(nk.length) rows = ROWS.filter(function(r){ return S.draft.qty[r.id] > 0 && sn.negTool[cq.picks[r.id]]; }).map(function(r){ return r.id; });
      else if(tool) rows = ROWS.filter(function(r){ return S.draft.qty[r.id] > 0 && optOf(r, tool) && cq.picks[r.id] !== tool; }).map(function(r){ return r.id; });
    }
    if(/돈\s*(?:이\s*)?안\s*드는|무료로만|공짜로|비용\s*없이/.test(raw) && !rows.length){ ops.push({k:'budget', target:0, cap:true}); return; }
    var allRows = carryRows.concat(rows.filter(function(r){ return carryRows.indexOf(r) < 0; }));
    if(allRows.length && (meth || tool || Object.keys(sn.negMeth).length || Object.keys(sn.negTool).length)){ ops.push({k:'row', rows:allRows, meth:meth, tool:tool, negMeth:sn.negMeth, negTool:sn.negTool}); carryRows = []; }
    else if(rows.length && !mB && !cost && !time) carryRows = allRows;
    if(mB || (/예산/.test(raw) && !rows.length)) ops.push({k:'budget', target:amt, cap:/안으로|안에서|안쪽|이하|아래|넘지|까지/.test(raw) && !/예산을?\s*\S*\s*(?:으로|로)\s*(?:바꿔|올려|늘려|정해|해\s)/.test(raw)});
    else if(cost && /줄|낮|아껴|아끼|싸게|저렴|절약|덜/.test(raw)) ops.push({k:'cost'});
    else if(time && /줄|빨리|빠르게|단축|서둘|덜/.test(raw)) ops.push({k:'time'});
    if(/품질|퀄리티/.test(raw)) ops.push({k:'quality'});
    if(/처음|초기화|원래대로/.test(raw) && !rows.length) ops.push({k:'reset'});
    else if(/되돌려|되돌리|취소|방금 (?:거|것)/.test(raw) && !rows.length) ops.push({k:'undo'});
  });
  if(carryRows.length) ops.push({k:'rowask', rows:carryRows});
  return ops;
}
function planAsk(alt, st){
  var names = alt.changed.map(function(id){ return RN(ROW[id]); });
  return {yes:'대신 ' + joinNames(names) + lastEul(names) + ' 바꾸기 (평가 평균 ' + (alt.dh > 0 ? '−' + alt.dh : '그대로') + ')', act:{picks:alt.picks}};
}
function assist(text){
  var ops0 = parseRequest(text), gq0 = ops0.filter(function(o){ return o.k === 'goq'; })[0], movedTo = 0;
  if(gq0 && ops0.length > 1 && S.draft.sel !== gq0.n - 1){ S.draft.sel = gq0.n - 1; movedTo = gq0.n; }
  var d = S.draft, st = d.setup, qi = d.sel, q = d.quotes[qi]; CTX = st;
  var before = calc(q.picks, d.qty, d.buy, st), snap = snapQ(q), changed = [], replies = [], notes = [], ask = null, focusRow = null;
  d.chat.push({who:'me', text:esc(text)});
  d.chg = {};
  function apply(id, t){ if(q.picks[id] === t) return false; q.picks[id] = t; d.chg[id] = true; if(changed.indexOf(RN(ROW[id])) < 0) changed.push(RN(ROW[id])); if(!focusRow) focusRow = id; return true; }
  function lockedNames(ids){ return ids.map(function(id){ return RN(ROW[id]) + '(' + TOOLS[q.picks[id]].name + ')'; }); }
  function markChanged(ids){ var names = []; ids.forEach(function(id){ d.chg[id] = true; var n = RN(ROW[id]); if(changed.indexOf(n) < 0) changed.push(n); names.push(n); if(!focusRow) focusRow = id; }); return names; }
  var invBefore = JSON.stringify(st.inv), invMsgs = applyEdits(text, st, 'results'), pendG = st._pending; delete st._pending; var invChanged = JSON.stringify(st.inv) !== invBefore;
  if(pendG && !ask) ask = {yes:'새 묶음 만들기', act:{newGroups:pendG}};
  if(invChanged){ ensurePicks(d); ops0 = parseRequest(text).filter(function(o){ return o.k !== 'rowask' && o.k !== 'row' || o.meth || o.tool; }); }
  /* 시점·그림체·AI를 쓸 곳·엔진·출시하는 곳·VRAM·도구·일정처럼 조건을 바꾸는 말은 조건을 고쳐 견적 3개를 다시 짠다 */
  if(!invChanged){
    delete st._aiScope; var sx = clone(st), sMsgs = applyEdits(text, sx, 'setup'), scopeTalk = !!sx._aiScope, haveTalk = /(쓰고 있어|쓰는 중|구독\s*중|샀어|구매했어|이미 써)/.test(text); delete sx._aiScope;
    var rowOps = ops0.filter(function(o){ return o.k !== 'rowask' && o.k !== 'goq'; });
    if(sMsgs.length && (scopeTalk || haveTalk || !rowOps.length) && !(scopeTalk && rowOps.length && JSON.stringify(sx) === JSON.stringify(st))){
      if(JSON.stringify(sx) === JSON.stringify(st)){ var same0 = sMsgs.join(' '); d.chat.push({who:'bot', text:same0 + (/이미/.test(same0) ? '' : ' 지금 조건과 같아서 견적은 그대로 뒀어요.')}); renderResults(); persist(); return; }
      S.setup = syncSt(sx); makeDraft(d);
      var lm = S.draft.chat[S.draft.chat.length - 1]; lm.text = sMsgs.join(' ') + ' ' + lm.text;
      renderResults(); persist(); var cx = $('chatIn'); if(cx) cx.focus({preventScroll:true}); return;
    }
  }
  var ops = ops0, buyRows = [], lockN = 0, rowEnd = 0, prevBudget = st.budget;
  var gqo = ops.filter(function(o){ return o.k === 'goq'; })[0];
  if(gqo && ops.length === 1){
    d.sel = gqo.n - 1; d.chg = {};
    d.chat.push({who:'bot', text:QN(gqo) + '를 보여 드릴게요. 이제부터 말씀하시는 내용은 ' + QN(gqo) + '에 적용해요.'});
    renderResults(); persist(); var gi = $('chatIn'); if(gi) gi.focus({preventScroll:true}); return;
  }
  if(gqo){ ops = ops.filter(function(o){ return o.k !== 'goq'; }); if(movedTo) replies.push(QNi(movedTo - 1) + '로 옮겼어요.'); }
  if(ops.length === 1 && ops[0].k === 'undo'){
    var us = undoableSet(), ui0 = -1; d.chat.forEach(function(m, i){ if(m.snap && !m.undone && us[i]) ui0 = i; });
    if(ui0 < 0){ d.chat.push({who:'bot', text:'되돌릴 변경이 없어요. 처음 견적으로 돌아가려면 “처음 견적으로 되돌려 주세요”라고 말해 주세요.'}); renderResults(); persist(); return; }
    undoMsg(ui0); d.chat.push({who:'bot', text:'방금 바꾼 내용을 되돌렸어요. 처음 견적으로 돌아가려면 “처음 견적으로 되돌려 주세요”라고 말해 주세요.'}); renderResults(); persist(); var ui1 = $('chatIn'); if(ui1) ui1.focus({preventScroll:true}); return;
  }
  var budgetOp = ops.filter(function(o){ return o.k === 'budget'; })[0];
  ops.forEach(function(op){
    if(op.k === 'reset'){
      var prevPicks = JSON.parse(snap).picks;
      restoreQ(q, JSON.stringify({picks:clone(q.base), locks:{}, cap:null}));
      ROWS.forEach(function(r){ if(prevPicks[r.id] !== q.picks[r.id]) markChanged([r.id]); });
      var b0 = d.budget0 != null ? d.budget0 : st.budget, bMsg = '';
      if(st.budget !== b0){ st.budget = b0; bMsg = ' 예산도 처음 정한 월 ' + manwon(b0) + roStr(manwon(b0)) + ' 되돌렸어요.'; }
      replies.push((q.savedBase ? '저장했던 견적으로 되돌렸어요.' : ''+QN(q)+'를'+' 처음 상태로 되돌렸어요.') + bMsg);
    }
    if(op.k === 'row'){
      var done = [], same = [], cannot = [], cond = false;
      op.rows.forEach(function(id){
        var r = ROW[id], o = null, nm = RN(r);
        if(op.tool && !op.negTool[op.tool]){
          o = optOf(r, op.tool);
          if(!o){ cannot.push(nm + eun(nm) + ' ' + TOOLS[op.tool].name + ro(op.tool) + ' 만들 수 없어요'); return; }
          if(!allowed(r, o, st)){ cannot.push(nm + eun(nm) + ' ' + TOOLS[op.tool].name + ro(op.tool) + ' 바꾸지 않았어요. ' + whyNot(r, o, st)); cond = true; return; }
        }
        if(!o){
          var cand = r.opts.filter(function(x){ return allowed(r, x, st) && !op.negTool[x.t] && !(op.negMeth[x.m]) && (!op.meth || x.m === op.meth); });
          var inQ = {}; ROWS.forEach(function(x){ if(x.id !== id && d.qty[x.id] > 0) inQ[q.picks[x.id]] = true; });
          var extra = function(t){ return inQ[t] ? 0 : toolCost(t, st); };
          cand.sort(function(a, b){ return (gpuUnsure(a.t, st) ? 1 : 0) - (gpuUnsure(b.t, st) ? 1 : 0) || (TOOLS[a.t].price === 'unknown' ? 1 : 0) - (TOOLS[b.t].price === 'unknown' ? 1 : 0) || extra(a.t) - extra(b.t) || (TOOLS[a.t].price === 'ok' ? 0 : 1) - (TOOLS[b.t].price === 'ok' ? 0 : 1); });
          if(op.meth && cand.some(function(x){ return x.t === q.picks[id]; })) cand = [optOf(r, q.picks[id])];
          else if(!op.meth && cand.some(function(x){ return x.t === q.picks[id]; }) && !op.negTool[q.picks[id]] && !op.negMeth[optOf(r, q.picks[id]).m]) cand = [optOf(r, q.picks[id])];
          o = cand[0];
        }
        if(!o){
          var any = op.meth ? r.opts.filter(function(x){ return x.m === op.meth; })[0] : null, wn = any ? whyNot(r, any, st) : '';
          var negT = Object.keys(op.negTool).filter(function(t){ return optOf(r, t); });
          if(wn){ cannot.push(nm + eun(nm) + ' 바꾸지 않았어요. ' + wn); cond = true; }
          else if(negT.length) cannot.push(nm + eun(nm) + ' ' + negT.map(function(t){ return TOOLS[t].name; }).join(', ') + eulT(negT[negT.length - 1]) + ' 빼면 고를 수 있는 ' + (op.meth === 'ai' ? 'AI 도구가' : op.meth ? MNAME[op.meth] + ' 방법이' : '방법이') + ' 아직 없어요');
          else cannot.push(nm + eun(nm) + ' ' + (op.meth ? MNAME[op.meth] + roStr(MNAME[op.meth]) : '그 방법으로') + ' 만들 수 없어요');
          return;
        }
        if(q.picks[id] === o.t){ q.locks[id] = true; same.push({id:id, t:o.t}); return; }
        if(!budgetOp){
          var trial = clone(q.picks); trial[id] = o.t;
          var af = calc(trial, d.qty, d.buy, st);
          if(q.cap != null && q.cap < st.budget && af.monthly > q.cap && af.monthly > before.monthly){ ask = {yes:'상한을 풀고 바꾸기', act:{row:id, t:o.t, uncap:true}}; replies.push(nm + eul(nm) + ' ' + toPhrase(o.t) + ' 바꾸면 월 추가 비용이 ' + won(af.monthly) + iga(won(af.monthly)) + ' 돼서 이 견적에 정해 두신 상한(월 ' + manwon(q.cap) + ')을 넘어요.'); return; }
          if(af.monthly > st.budget && af.monthly > before.monthly){ ask = {yes:'예산을 넘어도 바꾸기', act:{row:id, t:o.t}}; replies.push(nm + eul(nm) + ' ' + toPhrase(o.t) + ' 바꾸면 월 추가 비용이 ' + won(af.monthly) + iga(won(af.monthly)) + ' 돼서 예산 월 ' + manwon(st.budget) + eul(manwon(st.budget)) + ' 넘어요.'); return; }
        }
        apply(id, o.t); q.locks[id] = true; done.push({id:id, t:o.t});
        if(o.t === 'buyasset' && !(d.buy[id] > 0)) buyRows.push(id);
      });
      var byT = {}; done.forEach(function(x){ (byT[x.t] = byT[x.t] || []).push(RN(ROW[x.id])); });
      Object.keys(byT).forEach(function(t){ replies.push(joinNames(byT[t]) + lastEun(byT[t]) + ' ' + toPhrase(t) + ' 바꿨어요.'); });
      lockN += done.length; rowEnd = replies.length;
      var byS = {}; same.forEach(function(x){ (byS[x.t] = byS[x.t] || []).push(RN(ROW[x.id])); });
      Object.keys(byS).forEach(function(t){ replies.push(joinNames(byS[t]) + lastEun(byS[t]) + ' 이미 ' + toPhrase(t) + ' 되어 있어요. ‘직접 고름’으로 표시해 둘게요.'); });
      if(cannot.length) replies.push(cannot.join('. ') + '. ' + (cond ? '‘조건 바꾸기’에서 조건을 바꾸면 고를 수 있어요.' : '줄을 열면 고를 수 있는 방법을 볼 수 있어요.'));
    }
    if(op.k === 'note'){ replies.push(op.text); }
    if(op.k === 'rowask'){
      var rn = op.rows.map(function(id){ return RN(ROW[id]); });
      replies.push(joinNames(rn) + lastEul(rn) + ' 어떻게 바꿀까요? “직접”, “AI로”, “무료 에셋으로”, “사서”처럼 방법을 함께 말해 주세요.');
      focusRow = focusRow || op.rows[0];
    }
    if(op.k === 'budget'){
      var target = op.target != null ? op.target : st.budget;
      if(op.cap){
        var cm0 = calc(q.picks, d.qty, d.buy, st).monthly;
        q.cap = target;
        if(cm0 <= target){ replies.push('' + QN(q) + '는' + ' 지금 월 ' + won(cm0) + iga(won(cm0)) + '라 이미 월 ' + manwon(target) + ' 안에 들어와요.' + (target !== st.budget ? ' 정해 둔 예산(월 ' + manwon(st.budget) + ')은 그대로 뒀어요.' : '')); return; }
        var rc = fitBudget(q.picks, d.qty, d.buy, target, q.locks, st), mvc = markChanged(rc.changed), cm1 = calc(q.picks, d.qty, d.buy, st).monthly;
        if(mvc.length) replies.push(joinNames(mvc) + lastEul(mvc) + ' 돈이 들지 않는 방법으로 바꿔서 ' + QN(q) + '를' + ' 월 ' + manwon(target) + ' 안에 맞췄어요. 바꿀 수 있는 조합 중 평가가 가장 덜 떨어지는 안이에요' + (rc.dh > 0 ? '(평가 평균 −' + rc.dh + ').' : '.'));
        if(rc.conflict){ var lnc = lockedNames(rc.blockers); replies.push((lnc.length ? '직접 고르신 ' + joinNames(lnc) + ' 때문에' : '돈이 들지 않는 대안이 없어서') + ' 아직 월 ' + won(cm1) + '이에요.' + (lnc.length ? ' 그 줄을 열어 ‘도우미에게 맡기기’를 누르면 다시 맞춰 볼게요.' : '')); }
        if(target !== st.budget && mvc.length && !rc.conflict) notes.push('정해 둔 예산(월 ' + manwon(st.budget) + ')은 그대로 두고 이 견적만 맞췄어요. 예산 자체를 바꾸려면 “예산을 월 ' + manwon(target) + roStr(manwon(target)) + ' 바꿔 주세요”라고 말해 주세요.');
        if(rc.alts && rc.alts.length && !ask) ask = planAsk(rc.alts[0], st);
        return;
      }
      if(st.budget !== target){ st.budget = target; replies.push('예산을 월 ' + manwon(target) + roStr(manwon(target)) + ' 바꿨어요. 다른 견적이 예산을 넘으면 카드에 표시해 둘게요.'); }
      var res = fitBudget(q.picks, d.qty, d.buy, target, q.locks, st), moved = markChanged(res.changed);
      var nowM = calc(q.picks, d.qty, d.buy, st).monthly;
      if(moved.length) replies.push(joinNames(moved) + lastEul(moved) + ' 돈이 들지 않는 방법으로 바꿔서 월 ' + manwon(target) + ' 안에 맞췄어요. 바꿀 수 있는 조합 중 평가가 가장 덜 떨어지는 안이에요' + (res.dh > 0 ? '(평가 평균 −' + res.dh + ').' : '.'));
      else if(nowM <= target) replies.push('' + QN(q) + '는' + ' 이미 월 ' + manwon(target) + ' 안에 들어와 있어요.');
      if(res.alts && res.alts.length && !ask) ask = planAsk(res.alts[0], st);
      if(res.conflict){ var ln = lockedNames(res.blockers); replies.push((ln.length ? '직접 고르신 ' + joinNames(ln) + ' 때문에' : '돈이 들지 않는 대안이 없어서') + ' 아직 월 ' + won(nowM) + '이에요.' + (ln.length ? ' 그 줄을 열어 ‘도우미에게 맡기기’를 누르면 다시 맞춰 볼게요.' : '')); }
    }
    if(op.k === 'cost'){
      var cNow = calc(q.picks, d.qty, d.buy, st);
      if(!cNow.monthly){ replies.push('지금 견적은 매달 드는 돈이 없어요.' + (cNow.buy ? ' 사서 쓰는 줄을 열면 무료 에셋으로 바꿀 수 있어요.' : '')); return; }
      var r2 = fitBudget(q.picks, d.qty, d.buy, cNow.monthly - 1, q.locks, st), mv = markChanged(r2.changed);
      var cAfter = calc(q.picks, d.qty, d.buy, st);
      if(mv.length){ replies.push(joinNames(mv) + lastEul(mv) + ' 돈이 들지 않는 방법으로 바꿔서 월 ' + won(cNow.monthly) + '에서 ' + won(cAfter.monthly) + roStr(won(cAfter.monthly)) + ' 줄였어요. 평가가 가장 덜 떨어지는 쪽을 골랐어요' + (r2.dh > 0 ? '(평가 평균 −' + r2.dh + ').' : '.')); if(r2.alts && r2.alts.length && !ask) ask = planAsk(r2.alts[0], st); }
      else if(r2.blockers.length) replies.push('남은 구독은 직접 고르신 ' + joinNames(lockedNames(r2.blockers)) + '뿐이에요. 줄을 열어 ‘도우미에게 맡기기’를 누르면 더 줄여 볼게요.');
      else replies.push('지금보다 비용을 더 줄일 방법이 없어요.');
    }
    if(op.k === 'time'){
      var skipped = [], fast = [];
      var limit = function(){ return Math.max(st.budget, calc(q.picks, d.qty, d.buy, st).monthly); };
      ROWS.forEach(function(r){
        if(q.locks[r.id] || !(d.qty[r.id] > 0)) return;
        var curH = rowH(r, q.picks[r.id], d.qty[r.id], st);
        var faster = r.opts.filter(function(x){ return allowed(r, x, st) && x.t !== 'buyasset' && TOOLS[x.t].price !== 'unknown' && !gpuUnsure(x.t, st) && !x.noAuto && rowH(r, x.t, d.qty[r.id], st) < curH * 0.8; }).sort(function(a, b){ return rowH(r, a.t, d.qty[r.id], st) - rowH(r, b.t, d.qty[r.id], st); });
        for(var i = 0; i < faster.length; i++){ var tr = clone(q.picks); tr[r.id] = faster[i].t; if(calc(tr, d.qty, d.buy, st).monthly <= limit()){ apply(r.id, faster[i].t); fast.push(r.id); return; } }
        if(faster.length) skipped.push(RN(r));
      });
      if(fast.length){ var fb = {}; fast.forEach(function(id){ (fb[q.picks[id]] = fb[q.picks[id]] || []).push(RN(ROW[id])); });
        Object.keys(fb).forEach(function(t){ replies.push(joinNames(fb[t]) + lastEun(fb[t]) + ' ' + toPhrase(t) + ' 바꿨어요.'); }); }
      else replies.push('월 추가 예산 ' + manwon(st.budget) + ' 안에서는 지금보다 더 줄일 수 있는 부분이 없어요.');
      if(skipped.length) notes.push(joinNames(skipped) + lastEun(skipped) + ' 더 빠른 방법이 있지만 예산을 넘어서 그대로 뒀어요.');
      var locked = ROWS.filter(function(r){ return q.locks[r.id]; }).map(function(r){ return RN(r); });
      if(locked.length) notes.push(joinNames(locked) + lastEun(locked) + ' 직접 고르신 대로 뒀어요.');
    }
    if(op.k === 'quality'){
      var fo = firstObj(); if(!fo){ replies.push('품질은 커뮤니티에서 도구마다 에셋별 별점으로 비교할 수 있어요.'); return; }
      d.open = fo.id; focusRow = focusRow || fo.id;
      replies.push('품질은 도구 커뮤니티의 에셋별 별점으로 비교할 수 있어요. ' + fo.name + ' 줄을 열어 뒀어요. 방법마다 별점과 결과물 수, 그대로 쓴 비율을 보고 ‘결과물 보기’로 실제 결과물을 확인해 보세요.');
    }
  });
  if(lockN){ replies.splice(rowEnd, 0, d.lockExplained ? (lockN > 1 ? '직접 고르신 방법들이라 ‘직접 고름’으로 표시해 둘게요.' : '직접 고르신 방법이라 ‘직접 고름’으로 표시해 둘게요.') : '직접 고르신 방법은 ‘직접 고름’으로 표시해 둘게요. 이 줄은 예산을 맞출 때 바꾸지 않아요.'); d.lockExplained = true; }
  if(buyRows.length){ var bn = buyRows.map(function(id){ return RN(ROW[id]); }); d.open = buyRows[0]; d.tab[buyRows[0]] = 'opt'; focusRow = buyRows[0]; notes.push(joinNames(bn) + '의 구매 가격을 넣어야 총비용과 예산 판정에 들어가요. ' + (bn.length > 1 ? '먼저 ' + bn[0] + ' 줄을 열어 뒀어요.' : '줄을 열어 뒀어요.')); }
  if(ROWS.some(function(r){ return d.chg[r.id] && q.picks[r.id] === 'zimage'; }) && vramGB(st) == null) notes.push('Z-Image는 내 PC에서 돌려서 그래픽카드 메모리(VRAM)가 16GB 이상 필요해요.');
  var kn = ROWS.filter(function(r){ return d.chg[r.id] && r.art && q.picks[r.id] === 'kenney'; }).map(function(r){ return RN(r); });
  if(kn.length) notes.push('Kenney는 여러 게임에 두루 쓰는 무료 에셋이라 ' + joinNames(kn) + '의 그림체가 게임과 다를 수 있어요. 후기 탭에서 결과물을 먼저 확인해 보세요.');
  var unk = {}; ROWS.forEach(function(r){ if(d.chg[r.id] && TOOLS[q.picks[r.id]].price === 'unknown') unk[TOOLS[q.picks[r.id]].name] = true; });
  Object.keys(unk).forEach(function(n){ notes.push(n + ' 가격은 아직 확인하고 있어서 월 추가 비용과 총비용에 넣지 않았어요.'); });
  if(invMsgs.length) replies.unshift(invMsgs.join(' ') + ' 세 견적에 함께 반영했어요.');
  if(!replies.length) replies.push('아직 그 말은 이해하지 못했어요. “배경음악은 사서 쓸래요”처럼 어떤 에셋을 어떻게 바꿀지, 또는 “월 2만 원 안으로”처럼 말해 주세요.');
  var msg = {who:'bot', text:replies.join(' ') + (notes.length ? ' ' + notes.join(' ') : ''), qi:qi};
  if(invChanged){ msg.invSnap = invBefore; if(!msg.snap){ msg.snap = snap; } }
  if(snapQ(q) !== snap || st.budget !== prevBudget || invChanged){ msg.snap = snap; msg.chg = changed.length ? diffText(before, calc(q.picks, d.qty, d.buy, st)) : stateNote(JSON.parse(snap), q); }
  if(st.budget !== prevBudget){ msg.prevBudget = prevBudget; if(!changed.length) msg.chg = '월 추가 예산 ' + manwon(st.budget); }
  if(invChanged && !changed.length) msg.chg = '에셋 목록 바뀜 · ' + diffText(before, calc(q.picks, d.qty, d.buy, st));
  if(ask){ msg.ask = ask; msg.askBase = snapQ(q); }
  d.chat.push({who:'bot', typing:true, text:'견적을 살펴보는 중이에요…'});
  renderResults();
  setTimeout(function(){
    d.chat.pop(); d.chat.push(msg); persist(); announce('도우미: ' + msg.text.replace(/<[^>]+>/g, ''));
    var narrow = window.innerWidth <= 1340;
    /* 좁은 화면: 바뀐 게 있으면 시트를 닫고 바뀐 줄로 이동해 결과를 바로 보여 준다 */
    if(narrow && (changed.length || (focusRow && d.open === focusRow))) S.chatOpen = false;
    renderResults();
    var el = focusRow ? $('row-' + focusRow) : null;
    if(el && (changed.length || d.open === focusRow)) el.scrollIntoView({behavior:smooth(), block:narrow ? 'start' : 'center'});
    if(narrow && changed.length){ var mi = d.chat.length - 1; toast(changed.length === 1 && focusRow ? RN(ROW[focusRow]) + eun(RN(ROW[focusRow])) + ' ' + toPhrase(q.picks[focusRow]) + ' 바꿨어요. ' + msg.chg : '견적에서 ' + changed.length + '곳을 바꿨어요. ' + msg.chg, '되돌리기', function(){ undoMsg(mi); }); var cb = document.querySelector('.rbar .chatbtn'); if(cb) cb.focus({preventScroll:true}); }
    else { var inp = $('chatIn'); if(inp) inp.focus({preventScroll:true}); }
  }, 420);
}
/* 되돌리기는 메시지가 바꾼 견적에 적용하고, 그 견적으로 화면을 옮긴다 */
function undoMsg(i){
  var d = S.draft; if(!d) return; var m = d.chat[i]; if(!m || !m.snap || m.undone || !undoableSet()[i]) return;
  var qi = m.qi != null ? m.qi : d.sel, moved = qi !== d.sel;
  if(m.invSnap){ d.setup.inv = JSON.parse(m.invSnap); ensurePicks(d); }
  restoreQ(d.quotes[qi], m.snap); if(m.prevBudget != null) d.setup.budget = m.prevBudget; m.undone = true; if(m.ask) m.done = true; d.sel = qi; d.chg = {};
  renderResults(); toast(moved ? QNi(qi) + '를 되돌리고 그 견적으로 옮겼어요.' : '되돌렸어요.');
}
function announce(t){ var l = $('srlog'); if(l){ l.textContent = ''; setTimeout(function(){ l.textContent = t; }, 30); } }


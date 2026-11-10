/* ============================== 견적 결과 ============================== */
/* carry: 조건을 바꿔 다시 짤 때 이전 초안. 직접 고른(고정한) 줄과 고친 수량, 구매가, 구독 달 수, 대화를 이어받는다. */
/* 추천: 월 예산과 개발 기간 전체 예산 안, 구매가 미정 없음, 가격 확인 중 없음. 개발 기간 안에 드는 견적을 먼저 보고, 없으면 기간 조건을 뺀다. */
/* 추천은 사용자가 고른 우선순위로 정한다. 예산·기간 안이고 금액이 모두 정해진 견적만 후보다 */
/* ============================== 견적 만들기 ==============================
   처음에는 세 가지(장르, 그림체·시점, 월 추가 예산)만 묻고 바로 견적을 보여 준다.
   나머지는 '가정'으로 채워 두고, 견적을 바꿀 수 있는 질문만 도우미가 하나씩 묻는다. */
function makeDraft(carry, why){
  var st = syncSt(clone(S.setup)), buy = carry ? clone(carry.buy) : {}, rs = setRows(st), qty = qtyOf(st), kept = {}, dropped = {};
  QCACHE = {};
  var quotes = STRATS.map(function(sg, i){
    var keep = {}, locks = {}, oq = carry && carry.quotes[i];
    if(oq) Object.keys(oq.locks || {}).forEach(function(id){ var r = ROW[id]; if(!r) return; var t = oq.picks[id], o = optOf(r, t); if(o && allowed(r, o, st)){ keep[id] = t; locks[id] = true; kept[RN(r)] = true; } else dropped[RN(r)] = true; });
    var picks = stratPicks(sg, st, qty, buy, Object.keys(keep).length ? keep : null);
    return {n:i + 1, strat:sg, picks:picks, base:clone(picks), locks:locks};
  });
  var chat;
  if(carry) chat = carry.chat.filter(function(m){ return !m.typing; }).map(function(m){ var x = clone(m); delete x.snap; delete x.invSnap; x.old = !!x.chg; if(x.ask) x.done = true; return x; });
  else chat = (S.intake || []).map(function(m){ return {who:m.who, text:m.text}; });
  S.draft = {name:carry ? carry.name : (st.name.trim() || defaultName(st)), setup:st, qty:qty, buy:buy, sel:carry ? carry.sel : 0, open:carry ? carry.open : null, tab:{}, chat:chat, chg:{}, showFold:{},
    asked:carry ? clone(carry.asked || {}) : {}, nqSel:{}, aiBackup:carry ? carry.aiBackup : null, quotes:quotes};
  var d = S.draft, calcs = d.quotes.map(function(q){ return calc(q.picks, qty, buy, st); });
  if(!carry){ var rec = recommend(calcs, st); d.sel = rec >= 0 ? rec : 0; }
  hintsFor(d);
  if(carry){
    var kn = Object.keys(kept), dn = Object.keys(dropped), msg = why || '바뀐 조건으로 견적 3개를 다시 짰어요.';
    if(kn.length) msg += ' 직접 고르신 ' + kn.join(', ') + eun(kn[kn.length - 1]) + ' 그대로 뒀어요.';
    if(dn.length) msg += ' ' + dn.join(', ') + eun(dn[dn.length - 1]) + ' 바뀐 조건에서 쓸 수 없는 방법이라 다시 골랐어요.';
    d.chat.push({who:'bot', text:msg});
  } else d.chat.push({who:'bot', text:'견적 3개를 짰어요. 지금 조건에서는 ' + QNi(d.sel) + '를 추천해요. 위에 뜨는 질문에 답하거나 말로 고치면 바로 다시 계산해요.'});
}
/* 질문을 할지 정하는 데 쓰는 값: 한 번 사는 도구나 내 PC 도구가 견적을 더 좋게 만드는가 */
function hintsFor(d){
  var st = d.setup, best = d.quotes[2], bc = calc(best.picks, d.qty, d.buy, st);
  d.onceHelp = null; d.vramHelp = null;
  if(!(st.onceBudget > 0)){ var s2 = clone(st); s2.onceBudget = 100000; var p2 = stratPicks('best', s2, d.qty, d.buy), c2 = calc(p2, d.qty, d.buy, s2);
    if(c2.qavg > bc.qavg + 0.05 && c2.once > 0){ var ot = Object.keys(c2.onceT)[0]; d.onceHelp = {t:ot, won:c2.once, from:bc.qavg, to:c2.qavg}; } }
  if(VRAM[st.vram] && VRAM[st.vram].gb == null){ var s3 = clone(st); s3.vram = 'g16'; var p3 = stratPicks('best', s3, d.qty, d.buy), c3 = calc(p3, d.qty, d.buy, s3);
    if(ROWS.some(function(r){ return d.qty[r.id] > 0 && p3[r.id] === 'zimage'; }) && c3.qavg >= bc.qavg) d.vramHelp = true; }
}
function rebuild(why){
  var d = S.draft, old = d ? clone(curQ()) : null, oldQty = d ? clone(d.qty) : {}, oldC = old ? calc(old.picks, d.qty, d.buy, d.setup) : null;
  makeDraft(d, why);
  var nd = S.draft, nq = curQ(), nC = calc(nq.picks, nd.qty, nd.buy, nd.setup); S.flash = {};
  ROWS.forEach(function(r){ if(!old || old.picks[r.id] !== nq.picks[r.id] || oldQty[r.id] !== nd.qty[r.id]) S.flash[r.id] = true; });
  var n = Object.keys(S.flash).length, lm = nd.chat[nd.chat.length - 1];
  if(oldC) lm.chg = (n ? '바뀐 줄 ' + n + '개 · ' : '') + diffText(oldC, nC);
  renderResults(); persist();
}
function editSetup(fn, why){ var s = clone(S.draft.setup); fn(s); syncSt(s); S.setup = s; rebuild(why); }
function headline(i, calcs){
  var d = S.draft, q = d.quotes[i], c = calcs[i], paid = Object.keys(c.used).concat(Object.keys(c.onceT)).filter(function(t, k, a){ return a.indexOf(t) === k; });
  if(q.strat === 'free') return {t:'새 유료 도구 없이 짠 조합', who:'돈을 쓰지 않고 시작하고 싶은 분'};
  if(q.strat === 'one'){ if(!paid.length) return {t:'새 도구 없이도 충분한 조합', who:'구독은 하나만 하고 싶은 분'}; var T = TOOLS[paid[0]], nr = ROWS.filter(function(r){ return d.qty[r.id] > 0 && q.picks[r.id] === paid[0]; }).length; return {t:T.name + ' 하나로 ' + nr + '종을 맡기는 조합', who:'구독은 하나만 하고 싶은 분'}; }
  return {t:paid.length ? '에셋마다 평가가 가장 좋은 도구 ' + paid.length + '개' : '새 도구 없이도 가장 좋은 조합', who:'예산 안에서 결과물 품질이 가장 중요한 분'};
}
/* 같은 조합인 견적은 접는다. 지금 보고 있는 견적은 접지 않는다 */
function foldInfo(calcs){
  var d = S.draft, info = [], n = d.quotes.length, i, j;
  for(i = 0; i < n; i++) info[i] = null;
  for(i = 0; i < n; i++){
    if(i === d.sel) continue;
    for(j = 0; j < n; j++){
      if(i === j || info[j] || !(j < i || j === d.sel)) continue;
      var same = ROWS.every(function(r){ return !(d.qty[r.id] > 0) || d.quotes[i].picks[r.id] === d.quotes[j].picks[r.id]; });
      if(same){ info[i] = {into:j, same:true, diff:[]}; break; }
    }
  }
  info.forEach(function(f){ var k = 0; while(f && info[f.into] && k++ < n) f.into = info[f.into].into; });
  return info;
}
function visibleQ(i, fi){ return !fi[i] || S.draft.showFold[i]; }
function eligible(c){ return c.inBudget && !c.buyMissing && !Object.keys(c.unknown).length; }
/* 추천: 기본은 '적은 도구로 좋은 품질' — 평가 평균이 가장 좋은 견적과 0.2점 안이면 유료 도구가 적은 견적을 고른다 */
function recommend(calcs, st){
  var ok = calcs.map(function(c, i){ return eligible(c) ? i : -1; }).filter(function(i){ return i >= 0; }); if(!ok.length) return -1;
  var p = S.prio || 'tools', top = Math.max.apply(null, ok.map(function(i){ return calcs[i].qavg; })), best;
  function cost(c){ return c.monthly + c.once / 12; }
  if(p === 'money') best = ok.slice().sort(function(a, b){ return cost(calcs[a]) - cost(calcs[b]) || calcs[b].qavg - calcs[a].qavg; })[0];
  else if(p === 'quality') best = ok.slice().sort(function(a, b){ return calcs[b].qavg - calcs[a].qavg || cost(calcs[a]) - cost(calcs[b]); })[0];
  else best = ok.filter(function(i){ return calcs[i].qavg >= top - 0.2; }).sort(function(a, b){ return calcs[a].paidN - calcs[b].paidN || cost(calcs[a]) - cost(calcs[b]); })[0];
  if(S.draft){ var fi = foldInfo(calcs); if(fi[best]) best = fi[best].into; }
  return best;
}
function noRecReason(calcs){ return calcs.some(function(c){ return c.buyMissing; }) ? '구매가를 넣지 않은 유료 에셋이 있어서 추천하지 않았어요.' : '예산 안에 드는 견적이 없어서 추천하지 않았어요.'; }
function recShort(i, calcs){
  var c = calcs[i], p = S.prio || 'tools', q = S.draft.quotes[i];
  if(p === 'money') return c.monthly ? '예산 안에서 돈이 가장 덜 들어요' : '돈이 들지 않아요';
  if(p === 'quality') return '예산 안에서 평가 평균이 가장 높아요(★' + c.qavg.toFixed(1) + ')';
  return c.paidN ? '평가가 가장 좋은 조합과 거의 같으면서 유료 도구가 ' + c.paidN + '개뿐이에요' : '새 유료 도구 없이도 평가가 가장 좋은 조합과 거의 같아요';
}
function recReason(i, calcs){ return recShort(i, calcs) + '. 저희는 도구 판매사와 제휴하거나 수수료를 받지 않아요.'; }
function curQ(){ return S.draft.quotes[S.draft.sel]; }
function editCount(q){ return ROWS.filter(function(r){ return q.picks[r.id] !== q.base[r.id]; }).length; }
function starTxt(x){ return '★ ' + x.toFixed(1); }


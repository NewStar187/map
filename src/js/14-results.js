function cardsHTML(calcs){
  var d = S.draft, st = d.setup, rec = recommend(calcs, st), fi = foldInfo(calcs);
  return d.quotes.map(function(q, i){
    if(!visibleQ(i, fi)) return '';
    var c = calcs[i], h = headline(i, calcs), aiN = ROWS.filter(function(r){ return d.qty[r.id] > 0 && TOOLS[q.picks[r.id]] && TOOLS[q.picks[r.id]].ai; }).length, all = ROWS.filter(function(r){ return d.qty[r.id] > 0; }).length;
    var iss = []; if(Object.keys(c.third).length) iss.push('가격 추정 포함'); if(c.overMonthly) iss.push('월 예산 ' + won(c.overMonthly) + ' 넘음'); if(c.overOnce) iss.push('한 번 결제 예산 넘음'); if(c.buyMissing) iss.push('구매가 ' + c.buyMissing + '건 빠짐'); if(Object.keys(c.free).length) iss.push('무료 플랜 상업 이용 확인');
    return '<button type="button" class="qc v8" data-q="'+i+'" aria-pressed="'+(d.sel === i)+'"><span class="top">'+QN(q)+'<span class="chip c-mute">'+PRIO[q.strat]+'</span>'+(rec === i ? '<span class="chip c-rec">추천</span>' : '')+'</span>'
      + '<span class="hl">'+esc(h.t)+'</span><span class="for">'+h.who+'</span>'
      + '<span class="amt"><span class="k">월 추가 비용</span><span class="v">'+won(c.monthly)+'</span><span class="k bud">/ 예산 '+manwon(st.budget)+'</span></span>'
      + beneHTML(q, c, d)
      + '<span class="ln">한 번 드는 돈 '+won(c.once)+' · 평가 평균 <b>'+starTxt(c.qavg)+'</b> · 근거 '+c.qn+'개</span>'
      + '<span class="ln">AI로 만드는 에셋 '+aiN+' / '+all+'종</span>'
      + (iss.length ? '<span class="iss">'+iss.join(' · ')+'</span>' : '')
      + (rec === i ? '<span class="rec">'+recShort(i, calcs)+'</span>' : '') + '</button>';
  }).join('');
}
function foldNote(calcs){
  var d = S.draft, st = d.setup, fi = foldInfo(calcs), out = [];
  fi.forEach(function(f, i){ if(!f || d.showFold[i]) return; out.push('‘' + PRIO[d.quotes[i].strat] + '’ 견적은 ‘' + PRIO[d.quotes[f.into].strat] + '’ 견적과 같은 조합이라 합쳤어요. <button type="button" class="link sm" data-showfold="'+i+'">견적 '+(i + 1)+' 따로 보기</button>'); });
  /* 예산을 올리면 '가장 잘 만드는' 견적이 얼마나 좋아지는가 */
  var bq = d.quotes[2], bc = calcs[2], s2 = clone(st); s2.budget = Math.max(st.budget * 2, st.budget + 30000);
  var p2 = stratPicks('best', s2, d.qty, d.buy), c2 = calc(p2, d.qty, d.buy, s2);
  if(c2.qavg > bc.qavg + 0.05){ var add = Object.keys(c2.used).filter(function(t){ return !bc.used[t]; }), need = Math.ceil(c2.monthly / 1000) * 1000;
    if(add.length && need > st.budget) out.push('월 추가 예산을 ' + manwon(need) + roStr(manwon(need)) + ' 올리면 ' + add.map(function(t){ return TOOLS[t].name; }).join(', ') + eulT(add[add.length - 1]) + ' 더해 평가 평균이 ' + starTxt(bc.qavg) + '에서 ' + starTxt(c2.qavg) + roStr('점') + ' 올라가요.' + (add.some(function(t){ var P = defPlan(t); return P && P.pub; }) ? ' Midjourney Basic·Standard로 만든 그림은 다른 사용자에게 공개돼요.' : '')); }
  var edge = d.quotes.map(function(q, i){ var c = calcs[i]; return visibleQ(i, fi) && c.monthly > 0 && c.monthly <= st.budget && c.monthly * 1.1 > st.budget ? QNi(i) : ''; }).filter(Boolean);
  if(edge.length) out.push('환율이 10% 오르면 ' + edge.join(', ') + '가 월 추가 예산을 넘어요.');
  return out.length ? '<p class="note cardnote">' + out.join(' ') + '</p>' : '';
}
function budgetNote(calcs, st){ var over = calcs.filter(function(c){ return c.overMonthly; }).length; return (over ? '견적 ' + over + '개가 월 추가 예산을 넘어요. ' : '모든 견적이 월 추가 예산 ' + manwon(st.budget) + ' 안이에요. ') + '금액은 부가세 10% 포함, ' + FX_NOTE + ' 기준이에요.'; }
function prioHTML(){
  var p = S.prio || 'tools', note = p === 'money' ? '예산 안에서 돈이 가장 덜 드는 견적을 추천해요.' : p === 'quality' ? '예산 안에서 평가 평균이 가장 높은 견적을 추천해요.' : '평가 평균이 가장 좋은 견적과 0.2점 안이면, 유료 도구가 더 적은 견적을 추천해요.';
  return '<div class="prio"><span class="k">어떤 견적을 추천할까요?</span><div class="seg" role="group" aria-label="추천 기준">' + ['tools', 'money', 'quality'].map(function(k){ return '<button type="button" data-prio="'+k+'" aria-pressed="'+(p === k)+'">'+PRIO_SEL[k]+'</button>'; }).join('') + '</div><span class="note">'+note+'</span></div>';
}
/* ---------- 조건 칩 ---------- */
function featTxt(st){ var f = st.inv.feat || {}, on = Object.keys(FEATS).filter(function(k){ return k === 'i18n' ? f.i18n > 0 : f[k]; }); return on.length ? on.map(function(k){ return k === 'i18n' ? '다국어 ' + f.i18n + '개' : FEATS[k][0]; }).join(', ') : '없음'; }
function haveTxt(st){ var n = st.have.map(function(t){ return TOOLS[t] ? TOOLS[t].name : t; }).concat(st.haveCustom || []); return n.length ? n.join(', ') : '없음'; }
function aiTxt(st){ var off = Object.keys(AIKEYS).filter(function(k){ return !st.ai[k]; }); return !off.length ? '전부 써도 돼요' : off.length === Object.keys(AIKEYS).length ? '쓰지 않아요' : off.map(function(k){ return AIKEYS[k]; }).join(', ') + ' 빼고'; }
function condItems(st){
  var L = [['genre', '장르', genreName(st)], ['look', '그림체·시점', stylesTxt(st) + ' · ' + viewsTxt(st)], ['budget', '월 추가 예산', '월 ' + manwon(st.budget)],
    ['engine', '엔진', st.engine, !S.draft.asked.engine], ['months', '출시까지', st.release + '개월', !st.monthsSet], ['have', '쓰는 도구', haveTxt(st), !S.draft.asked.have],
    ['once', '한 번 사는 것', st.onceBudget > 0 ? manwon(st.onceBudget) + '까지 괜찮아요' : '구독만 봐요'], ['feat', '큰 기능', featTxt(st), !S.draft.asked.feat], ['ai', 'AI 쓸 곳', aiTxt(st)]];
  if(ROWS.some(function(r){ return r.opts.some(function(o){ return o.t === 'zimage'; }); })) L.push(['vram', '그래픽카드', VRAM[st.vram].name]);
  return L;
}
function condsHTML(){
  var st = S.draft.setup;
  return '<section class="conds card" aria-label="견적 조건"><div class="sec-h"><h2 class="ch">조건</h2><span class="note">눌러서 바로 고칠 수 있어요. ‘가정’은 아직 여쭤보지 않아 기본값으로 둔 것이에요.</span></div><div class="clist">' + condItems(st).map(function(x){
      return '<button type="button" class="cnd" data-cond="'+x[0]+'"><small>'+x[1]+(x[3] ? '<span class="chip c-mute">가정</span>' : '')+'</small><b>'+esc(x[2])+'</b></button>'; }).join('') + '</div>'
    + '<label class="ckl sw"><input type="checkbox" data-act="noai-view"'+(S.draft.aiBackup ? ' checked' : '')+'><span>AI 없이 보기</span></label></section>';
}
/* 조건 고치기 시트: 고치는 동안은 사본(CS)만 바꾸고, ‘적용’을 누르면 견적을 다시 짠다 */
var CS = null, CSK = null;
function condSheet(key){ CS = clone(S.draft.setup); CSK = key; csRender(); }
function csRender(focus){
  var s = CS, k = CSK, body = '', title = '';
  function chips(attr, list, cur){ return '<div class="choices" role="group">' + list.map(function(x){ return chip(attr, x[0], x[1], typeof cur === 'function' ? cur(x[0]) : String(cur) === String(x[0]), x[2]); }).join('') + '</div>'; }
  if(k === 'genre'){ title = '어떤 게임인가요?'; body = chips('data-csg', Object.keys(GENRE).map(function(g){ return [g, GENRE[g].name]; }), function(v){ return s.genres.indexOf(v) >= 0; }) + '<label class="fld">목록에 없으면 적어 주세요<input class="field" id="csGenreText" maxlength="30" value="'+esc(s.genreText || '')+'" placeholder="예: 낚시, 육성"></label>' + (s.invTouched ? '' : '<p class="note">장르를 바꾸면 에셋 개수도 그 장르 기본값으로 바뀌어요.</p>'); }
  else if(k === 'look'){ title = '어떻게 보이나요?'; body = '<p class="note">여러 개 골라도 돼요. 탐험은 사이드뷰, 마을은 탑다운처럼 장면마다 다르면 모두 고르세요. 그림체를 여러 개 고르면 에셋 줄마다 따로 정할 수 있어요.</p><div class="fld">그림체' + ['pixel', '2d', '3d'].map(function(cl){ return '<div class="choices sty" role="group"><span class="cg">'+({pixel:'도트', '2d':'2D', '3d':'3D'})[cl]+'</span>' + Object.keys(STYLES).filter(function(x){ return STYLES[x].cls === cl; }).map(function(x){ var i0 = s.styles.indexOf(x); return chip('data-csty', x, STYLES[x].name + (i0 === 0 && s.styles.length > 1 ? ' · 주' : ''), i0 >= 0); }).join('') + '</div>'; }).join('') + '</div><div class="fld">시점' + chips('data-csvw', Object.keys(VIEWS).map(function(v){ return [v, VIEWS[v].name + (s.views[0] === v && s.views.length > 1 ? ' · 주' : ''), VIEWS[v].d]; }), function(v){ return s.views.indexOf(v) >= 0; }) + '</div>'; }
  else if(k === 'engine'){ title = '엔진은 정했나요?'; body = chips('data-cs="engine" data-val', ENGINES.map(function(e){ return [e, e]; }), s.engine) + '<p class="note">Unity를 고르면 Unity 안에서 쓰는 AI 도구도 후보에 넣어요.</p>'; }
  else if(k === 'budget'){ title = '월 추가 예산'; body = chips('data-cs="budget" data-val', [[0, '0원'], [10000, '1만 원'], [30000, '3만 원'], [50000, '5만 원'], [100000, '10만 원']], s.budget) + '<label class="fld">직접 적기<span class="ninp"><input class="field" id="csBudget" type="number" inputmode="numeric" min="0" max="1000000" value="'+s.budget+'">원</span></label><p class="note">지금 쓰는 요금제 말고, 한 달에 더 쓸 수 있는 돈을 적어 주세요.</p>'; }
  else if(k === 'once'){ title = '구독 말고, 한 번 사서 계속 쓰는 것도 괜찮나요?'; body = '<p>매달 내는 구독과 달리 한 번만 결제하고 계속 쓰는 것들이 있어요. 예를 들면 도트 그림 프로그램, 그림 AI 확장 프로그램, 유료 에셋 팩이에요. 괜찮다고 하시면 이런 것도 견적 후보에 넣어요.</p>' + chips('data-cs="onceBudget" data-val', [[0, '구독만 볼게요'], [30000, '3만 원까지'], [100000, '10만 원까지']], s.onceBudget || 0) + '<label class="fld">직접 적기<span class="ninp"><input class="field" id="csOnce" type="number" inputmode="numeric" min="0" max="10000000" value="'+(s.onceBudget || 0)+'">원</span></label>'; }
  else if(k === 'months'){ title = '출시까지 얼마나 걸릴 것 같아요?'; body = chips('data-cs="release" data-val', [[3, '3개월'], [6, '6개월'], [12, '1년'], [18, '1년 반'], [24, '2년']], s.release) + '<label class="fld">직접 적기<span class="ninp"><input class="field" id="csMonths" type="number" inputmode="numeric" min="1" max="60" value="'+s.release+'">개월</span></label><p class="note">구독할 달 수와 총비용을 계산할 때 써요.</p>'; }
  else if(k === 'have'){ title = '지금 쓰고 있는 도구'; body = chips('data-csh', HAVE_CHIPS.concat(['retro', 'meshy', 'unityai']).filter(function(t, i, a){ return a.indexOf(t) === i && TOOLS[t]; }).map(function(t){ return [t, TOOLS[t].name]; }), function(v){ return s.have.indexOf(v) >= 0; })
      + s.have.filter(function(t){ return TOOLS[t] && TOOLS[t].plans && TOOLS[t].plans.length > 1; }).map(function(t){ var cur = (s.havePlan || {})[t] || TOOLS[t].def; return '<label class="planfld"><span>'+TOOLS[t].name+' 요금제</span><select class="field" data-csplan="'+t+'">'+TOOLS[t].plans.map(function(p){ return '<option value="'+p.id+'"'+(cur === p.id ? ' selected' : '')+'>'+esc(planOpt(p))+'</option>'; }).join('')+'</select></label>'; }).join('')
      + '<p class="note">상업적으로 쓸 수 있는 요금제일 때만 비용 0원으로 계산해요.</p>'; }
  else if(k === 'feat'){ title = '이런 것도 들어가나요?'; var f = s.inv.feat || {}; body = Object.keys(FEATS).map(function(x){ var on = x === 'i18n' ? f.i18n > 0 : !!f[x]; return '<div class="featrow">'+chip('data-csf', x, FEATS[x][0], on)+'<span class="note">'+FEATS[x][1]+'</span>'+(x === 'i18n' && on ? '<label class="ninp">추가 언어 <input class="field" id="csLang" type="number" min="1" max="10" value="'+f.i18n+'">개</label>' : '')+'</div>'; }).join(''); }
  else if(k === 'ai'){ title = 'AI를 쓰지 않을 곳'; body = chips('data-csai', Object.keys(AIKEYS).map(function(x){ return [x, AIKEYS[x] + ' 빼기']; }), function(v){ return !s.ai[v]; }) + '<p class="note">고른 곳은 직접 만들거나 무료 에셋으로 짜요.</p>'; }
  else if(k === 'vram'){ title = '그래픽카드 메모리(VRAM)'; body = chips('data-cs="vram" data-val', Object.keys(VRAM).map(function(v){ return [v, VRAM[v].name]; }), s.vram) + '<p class="note">내 PC에서 돌리는 무료 그림 AI(Z-Image)는 8GB 이상에서 돌아가요. 윈도우는 작업 관리자 → 성능 → GPU의 ‘전용 GPU 메모리’에서 볼 수 있어요.</p>'; }
  openLayer('<div class="modal sheet" role="dialog" aria-modal="true" aria-labelledby="csT">'+mh('csT', title) + '<div class="stack">' + body + '</div>'
    + '<div class="row-acts end"><button type="button" class="btn sec" data-act="close-layer">취소</button><button type="button" class="btn" data-act="cs-apply">적용하고 다시 짜기</button></div></div>');
  if(focus){ try { var el = $('layer').querySelector(focus); if(el) el.focus(); } catch(x){} }
}
function csGrab(){
  var s = CS, v;
  var g = $('csGenreText'); if(g) s.genreText = g.value.trim().slice(0, 30);
  var b = $('csBudget'); if(b && (v = parseInt(b.value, 10)) >= 0) s.budget = Math.min(1000000, v);
  var o = $('csOnce'); if(o && (v = parseInt(o.value, 10)) >= 0) s.onceBudget = Math.min(10000000, v);
  var m = $('csMonths'); if(m && (v = parseInt(m.value, 10)) >= 1) s.release = Math.min(60, v);
  var l = $('csLang'); if(l && (v = parseInt(l.value, 10)) >= 1) { s.inv.feat = s.inv.feat || {}; s.inv.feat.i18n = Math.min(10, v); }
  document.querySelectorAll('[data-csplan]').forEach(function(x){ s.havePlan = s.havePlan || {}; s.havePlan[x.dataset.csplan] = x.value; });
}
var CS_WHY = {genre:'장르', look:'그림체와 시점', engine:'엔진', budget:'월 추가 예산', once:'한 번 사는 것', months:'출시까지 기간', have:'쓰는 도구', feat:'큰 기능', ai:'AI 쓸 곳', vram:'그래픽카드'};
function csApply(){
  csGrab(); var s = CS, k = CSK;
  if(k === 'genre' && !s.invTouched){ var f = s.inv.feat; s.inv = invFromGenres(s.genres); s.inv.feat = f; }
  if(k === 'months') s.monthsSet = true;
  if(k === 'have' || k === 'engine' || k === 'feat') S.draft.asked[k] = true;
  if(k === 'months') S.draft.asked.months = true;
  closeLayer(); S.setup = syncSt(s); CS = null;
  var label = CS_WHY[k], val = (condItems(S.setup).filter(function(x){ return x[0] === k; })[0] || [])[2];
  rebuild(label + eul(label) + (val ? ' ‘' + val + '’' + roStr(val) : '') + ' 바꿔 견적을 다시 짰어요.');
}
/* ---------- 도우미가 하나씩 묻는 질문 ---------- */
function nqList(d){
  var st = d.setup, L = [];
  var hv0 = st.have.filter(function(t){ return TOOLS[t]; }).map(function(t){ return TOOLS[t].name; });
  L.push({k:'have', text:hv0.length ? hv0.join(', ') + ' 말고 쓰고 있는 AI 도구가 있나요?' : '지금 쓰고 있는 AI 도구가 있나요?', why:'이미 쓰는 도구는 비용 0원으로 계산해요.', multi:true, chips:HAVE_CHIPS.filter(function(t){ return TOOLS[t].ai && st.have.indexOf(t) < 0; }).map(function(t){ return [t, TOOLS[t].name]; }), done:'이게 다예요', none:'없어요'});
  st.have.filter(function(t){ return TOOLS[t] && TOOLS[t].plans && TOOLS[t].plans.length > 1; }).forEach(function(t){
    L.push({k:'plan:' + t, text:TOOLS[t].name + (ro(t) === '으로' ? '은' : '는') + ' 어떤 요금제예요?', why:'무료 플랜은 상업적으로 쓸 수 없는 도구가 있어서 요금제마다 다르게 계산해요.', chips:TOOLS[t].plans.map(function(p){ return [p.id, planOpt(p)]; })}); });
  L.push({k:'engine', text:'엔진은 정했나요?', why:'Unity를 쓰면 Unity 안에서 쓰는 AI 도구도 후보에 넣어요.', chips:ENGINES.map(function(e){ return [e, e]; })});
  L.push({k:'months', text:'출시까지 얼마나 걸릴 것 같아요?', why:'구독할 달 수와 총비용을 계산할 때 써요. 지금은 6개월로 잡았어요.', chips:[[3, '3개월'], [6, '6개월'], [12, '1년'], [18, '1년 반'], [24, '2년']]});
  if(!st.invSeen) L.push({k:'inv', text:'캐릭터와 에셋 개수는 ' + genreName(st) + ' 기본값으로 잡았어요. 이대로 볼까요?', why:'개수는 작업 기록과 스토어 AI 고지문의 기준이 돼요.', chips:[['ok', '이대로 볼게요'], ['edit', '직접 고칠게요']]});
  L.push({k:'feat', text:'이런 것도 들어가나요?', why:'들어가는 기능에 따라 필요한 에셋이 늘어나요.', multi:true, chips:Object.keys(FEATS).map(function(x){ return [x, FEATS[x][0]]; }), done:'이게 다예요', none:'없어요'});
  if(d.onceHelp) L.push({k:'once', text:'구독 말고, 한 번 사서 계속 쓰는 것도 괜찮나요?', why:TOOLS[d.onceHelp.t].name + '처럼 한 번 사는 도구를 넣으면 평가 평균이 ' + starTxt(d.onceHelp.from) + '에서 ' + starTxt(d.onceHelp.to) + roStr('점') + ' 올라가요. 한 번 ' + won(d.onceHelp.won) + '이에요.', chips:[[0, '구독만 볼게요'], [30000, '3만 원까지'], [100000, '10만 원까지']]});
  if(d.vramHelp) L.push({k:'vram', text:'그래픽카드 메모리(VRAM)를 알려 주시면 내 PC에서 돌리는 무료 AI도 후보에 넣어 볼게요.', why:'윈도우는 작업 관리자 → 성능 → GPU의 ‘전용 GPU 메모리’에서 볼 수 있어요.', chips:Object.keys(VRAM).filter(function(v){ return v !== 'unknown'; }).map(function(v){ return [v, VRAM[v].name]; })});
  L.push({k:'ai', text:'AI를 쓰고 싶지 않은 곳이 있나요?', why:'고른 곳은 직접 만들거나 무료 에셋으로 짜요.', multi:true, chips:Object.keys(AIKEYS).map(function(x){ return [x, AIKEYS[x]]; }), done:'이곳은 빼 주세요', none:'전부 써도 돼요'});
  return L;
}
function nextQ(d){ var L = nqList(d), open = L.filter(function(q){ return !d.asked[q.k]; }); return {q:open[0] || null, done:L.length - open.length, total:L.length}; }
function nqHTML(){
  var d = S.draft, N = nextQ(d), q = N.q;
  if(!q) return '<div class="nq done"><b>더 여쭤볼 건 없어요</b><span class="note">말로 더 고치거나 왼쪽 조건을 눌러 바꿀 수 있어요.</span></div>';
  var sel = d.nqSel[q.k] || [];
  return '<div class="nq" role="group" aria-labelledby="nqT"><div class="nqh"><span class="note">더 정확하게 '+(N.done + 1)+' / '+N.total+'</span><button type="button" class="link sm" data-nqskip="'+q.k+'">건너뛰기</button></div>'
    + '<b id="nqT">'+esc(q.text)+'</b><span class="note">'+esc(q.why)+'</span>'
    + '<div class="choices sm">' + q.chips.map(function(c){ return '<button type="button" class="choice" data-nq="'+esc(q.k)+'|'+esc(c[0])+'"'+(q.multi ? ' aria-pressed="'+(sel.indexOf(String(c[0])) >= 0)+'"' : '')+'>'+esc(c[1])+'</button>'; }).join('') + '</div>'
    + (q.multi ? '<div class="row-acts"><button type="button" class="btn sm" data-nqdone="'+q.k+'"'+(sel.length ? '' : ' disabled')+'>'+q.done+'</button><button type="button" class="btn sm sec" data-nqnone="'+q.k+'">'+q.none+'</button></div>' : '') + '</div>';
}
/* 질문에 답하면 조건을 고치고 다시 짠다 */
function nqAnswer(k, val, label){
  var d = S.draft; d.asked[k] = true; d.chat.push({who:'me', text:esc(label)});
  if(k === 'inv'){ if(val === 'edit'){ var fo = ROWS.filter(function(r){ return d.qty[r.id] > 0; })[0]; d.open = fo ? fo.id : null; d.chat.push({who:'bot', text:'에셋 목록에서 줄을 누르면 개수를 고칠 수 있어요. 맨 위 줄을 열어 뒀어요.'}); renderResults(); persist(); var rw = fo && $('row-' + fo.id); if(rw) rw.scrollIntoView({block:'center'}); return; }
    d.chat.push({who:'bot', text:'개수는 기본값으로 둘게요. 나중에 줄을 눌러 고칠 수 있어요.'}); renderResults(); persist(); return; }
  if(k.indexOf('plan:') === 0){ var t = k.slice(5), pn = (planOf(t, val) || {name:label}).name; return editSetup(function(s){ s.havePlan = s.havePlan || {}; s.havePlan[t] = val; }, TOOLS[t].name + ' 요금제를 ' + pn + roStr(pn) + ' 했어요.'); }
  if(k === 'engine') return editSetup(function(s){ s.engine = val; }, '엔진을 ' + val + roStr(val) + ' 했어요.');
  if(k === 'months') return editSetup(function(s){ s.release = +val; s.monthsSet = true; }, '출시까지 ' + label + roStr(label) + ' 잡았어요.');
  if(k === 'once') return editSetup(function(s){ s.onceBudget = +val; }, +val ? '한 번 사는 것도 ' + label + ' 후보에 넣었어요.' : '구독만 보고 짤게요.');
  if(k === 'vram') return editSetup(function(s){ s.vram = val; }, '그래픽카드 메모리를 ' + label + roStr(label) + ' 했어요.');
}
function nqMulti(k, list){
  var d = S.draft, labels = list.map(function(v){ var q = nqList(d).filter(function(x){ return x.k === k; })[0]; var c = q && q.chips.filter(function(c){ return String(c[0]) === v; })[0]; return c ? c[1] : v; });
  d.asked[k] = true; d.nqSel[k] = []; d.chat.push({who:'me', text:esc(labels.join(', '))});
  if(k === 'have') return editSetup(function(s){ list.forEach(function(t){ if(s.have.indexOf(t) < 0){ s.have.push(t); s.havePlan = s.havePlan || {}; if(TOOLS[t].plans && !s.havePlan[t]) s.havePlan[t] = TOOLS[t].def; } }); }, labels.join(', ') + eulT(list[list.length - 1]) + ' 쓰는 도구에 넣었어요.');
  if(k === 'feat') return editSetup(function(s){ s.inv.feat = s.inv.feat || {}; list.forEach(function(x){ if(x === 'i18n') s.inv.feat.i18n = s.inv.feat.i18n || 2; else s.inv.feat[x] = true; }); }, labels.join(', ') + eul(labels[labels.length - 1]) + ' 넣었어요.' + (list.indexOf('i18n') >= 0 ? ' 번역할 언어는 2개로 잡았어요.' : ''));
  if(k === 'ai') return editSetup(function(s){ list.forEach(function(x){ s.ai[x] = false; }); }, labels.join(', ') + '에는 AI를 쓰지 않는 걸로 짰어요.');
}
/* ---------- 견적 요약과 에셋 목록 ---------- */
function totalLine(c, st){ return '월 추가 비용 ' + won(c.monthly) + (c.once ? ' · 한 번 ' + won(c.once) : '') + ' · 출시까지 ' + st.release + '개월' + (st.monthsSet ? '' : '(가정)') + '이면 총 ' + won(c.total); }
function qsumHTML(q, c){
  var d = S.draft, st = d.setup, calcs = d.quotes.map(function(x){ return calc(x.picks, d.qty, d.buy, st); }), rec = recommend(calcs, st), i = d.sel, lines = summary(q.picks, d.qty, st);
  var recl = rec === i ? '<p class="recline"><b>추천</b> '+recShort(i, calcs)+'.</p>' : rec >= 0 ? '<p class="recline mute">추천은 견적 '+(rec + 1)+ieyo(rec + 1)+'. <button type="button" class="link" data-goq="'+rec+'">견적 '+(rec + 1)+' 보기</button></p>' : '<p class="recline mute">'+noRecReason(calcs)+'</p>';
  return '<div class="qsum-h"><h2 id="qsT">'+QN(q)+'는'+' 이런 조합이에요</h2>'+(editCount(q) ? '<button type="button" class="link sm" data-act="reset-q">처음 견적으로 되돌리기</button>' : '')+'</div>'
    + '<ul class="three">' + lines.map(function(l){ return '<li>'+l+'</li>'; }).join('') + '<li>'+totalLine(c, st)+'</li><li>평가 평균 '+starTxt(c.qavg)+' · 근거 결과물 '+c.qn+'개 <span class="chip c-mute">예시 데이터</span></li></ul>' + recl
    + '<details class="more"'+(S.cautOpen ? ' open' : '')+'><summary>꼭 알아 둘 점</summary><ul class="caut">' + cautions(c, st).map(function(x){ return '<li>'+x+'</li>'; }).join('') + '</ul>' + subPlan(c) + '</details>';
}
function evidHTML(r, t, st){
  var q = qualOf(t, r.cat, rowCls(r, st));
  if(!q.n) return '<span class="t-dim">'+(TOOLS[t].ai ? '평가 없음' : '직접 만들기 · 평가 없음')+'</span>';
  var tot = q.how.as + q.how.aiedit + q.how.human;
  return '<b>'+starTxt(q.star)+'</b> <small>결과물 '+q.n+'개 · 그대로 '+Math.round(q.how.as / tot * 100)+'%</small>';
}
function howBars(q){ var tot = q.how.as + q.how.aiedit + q.how.human; if(!tot) return ''; function p(x){ return Math.round(x / tot * 100); }
  return '<span class="hbar" role="img" aria-label="그대로 '+p(q.how.as)+'%, AI로 다시 고침 '+p(q.how.aiedit)+'%, 직접 손봄 '+p(q.how.human)+'%"><i class="h1" style="width:'+p(q.how.as)+'%"></i><i class="h2" style="width:'+p(q.how.aiedit)+'%"></i><i class="h3" style="width:'+p(q.how.human)+'%"></i></span><small class="hlg">그대로 '+p(q.how.as)+'% · AI로 다시 고침 '+p(q.how.aiedit)+'% · 직접 손봄 '+p(q.how.human)+'%</small>'; }
function sharedMap(q){ var first = {}, m = {}; ROWS.forEach(function(r){ if(!(S.draft.qty[r.id] > 0)) return; var t = q.picks[r.id]; if(first[t]) m[r.id] = first[t]; else first[t] = RN(r); }); return m; }
function mnyHTML(r, q, sharedWith){
  var d = S.draft, st = d.setup, t = q.picks[r.id], T = TOOLS[t], cost = toolCost(t, st);
  if(!(d.qty[r.id] > 0)) return '<span class="t-dim">—</span>';
  if(t === 'buyasset') return d.buy[r.id] > 0 ? won(d.buy[r.id]) + '<small>한 번</small>' : '<span class="t-yellow">구매가 필요</span>';
  if(onceCost(t, st)) return sharedWith ? '0원<small>'+sharedWith+gwa(sharedWith)+' 같은 구매</small>' : won(onceCost(t, st)) + '<small>한 번</small>';
  if(cost && sharedWith) return '0원<small>'+sharedWith+gwa(sharedWith)+' 같은 구독</small>';
  if(cost) return won(cost) + '<small>매달</small>';
  return has(t, st) && T.ai ? '0원<small>쓰는 중</small>' : '0원';
}
function rowsHTML(q){
  var d = S.draft, sm = sharedMap(q), SEC = {obj:'그림', scene:'그림', ui:'그림', illus:'그림', sfx:'소리', bgm:'소리', text:'글', code:'코드', loc:'글'}, last = '';
  return ROWS.map(function(r){ var sec = SEC[r.cat] || '그림', h = sec !== last ? '<div class="tsec" role="presentation">'+sec+'</div>' : ''; last = sec; return h + rowHTML(r, q, sm[r.id] || null); }).join('');
}
function rowHTML(r, q, sharedWith){
  var d = S.draft, st = d.setup, t = q.picks[r.id], open = d.open === r.id, fl = S.flash && S.flash[r.id];
  var html = '<div class="tr-wrap'+(open ? ' open' : '')+(fl ? ' flash' : '')+'" id="row-'+r.id+'"><button type="button" class="trw v8" data-open="'+r.id+'" aria-expanded="'+open+'" aria-controls="rd-'+r.id+'">'+rowIcon(r)
    + '<span class="nm"><b>'+RN(r)+'</b><small data-qtyl="'+r.id+'">'+d.qty[r.id]+RU(r)+(st.invTouched || r.custom ? '' : ' · 가정')+'</small></span>'
    + '<span class="how"><b>'+toolLabel(t, st)+'</b><small>'+(q.locks[r.id] ? '<span class="lockic">'+ui('lock', 12)+'직접 고름</span>' : MNAME[optOf(r, t) ? optOf(r, t).m : 'direct'])+' '+statusChips(t, st)+'</small></span>'
    + '<span class="ev">'+evidHTML(r, t, st)+'</span>'
    + '<span class="mny r" data-mny="'+r.id+'">'+mnyHTML(r, q, sharedWith)+'</span><span class="cv">'+ui(open ? 'chevUp' : 'chev', 18)+'</span></button>';
  if(open) html += rowDetail(r, q);
  return html + '</div>';
}
function rowDetail(r, q){
  var d = S.draft, st = d.setup, cur = q.picks[r.id], cls = rowCls(r, st);
  var opts = r.opts.slice().sort(function(a, b){ return scoreOf(r, b.t, st) - scoreOf(r, a.t, st); });
  var list = opts.map(function(o){
    var why = whyNot(r, o, st), qv = qualOf(o.t, r.cat, cls), on = o.t === cur;
    return '<div class="opt2'+(on ? ' on' : '')+(why ? ' no' : '')+'"><div class="o-h">'+(TOOLS[o.t].ai ? av(o.t) : rowIcon(r, 20))+'<span><b>'+toolLabel(o.t, st)+'</b><small>'+priceText(o.t, st)+(o.note ? ' · ' + esc(o.note) : '')+'</small></span>'
      + '<span class="o-ev">'+(qv.n ? '<b>'+starTxt(qv.star)+'</b><small>결과물 '+qv.n+'개</small>' : '<small class="t-dim">평가 없음</small>')+'</span></div>'
      + (qv.n ? howBars(qv) : '')
      + (why ? '<p class="note">'+why+'</p>' : '<div class="row-acts">'+(on ? '<span class="chip c-ok">지금 견적</span>' : '<button type="button" class="btn sm" data-swap="'+r.id+'" data-t="'+o.t+'">이걸로 바꾸기</button>')+(qv.n || TOOL_REV[o.t] ? '<button type="button" class="btn sm sec" data-toolgo="'+o.t+'|'+r.cat+'|'+(artCat(r.cat) ? cls : '')+'">결과물 보기</button>' : '')+'</div>')
      + '</div>';
  }).join('');
  return '<div class="rd" id="rd-'+r.id+'"><div class="rd-q"><label class="ninp">개수 <input class="field" type="number" inputmode="numeric" min="0" max="500" data-qty="'+r.id+'" value="'+d.qty[r.id]+'">'+RU(r)+'</label>'
    + (q.locks[r.id] ? '<span class="note">직접 고른 방법이라 다시 짤 때도 그대로 둬요. <button type="button" class="link sm" data-unlockrow="'+r.id+'">도우미에게 맡기기</button></span>' : '<span class="note">'+esc(RH(r) || '')+'</span>') + '</div>'
    + (artCat(r.cat) ? '<div class="rd-sv">' + (st.styles.length > 1 ? '<label class="ninp">그림체 <select class="field sm" data-rsty="'+r.id+'">' + st.styles.map(function(k){ return '<option value="'+k+'"'+(r.style === k ? ' selected' : '')+'>'+STYLES[k].name+'</option>'; }).join('') + '</select></label>' : '')
      + (r.cat === 'obj' && st.views.length > 1 ? '<label class="ninp">시점 <select class="field sm" data-rvw="'+r.id+'">' + st.views.map(function(k){ return '<option value="'+k+'"'+(r.view === k ? ' selected' : '')+'>'+VIEWS[k].name+'</option>'; }).join('') + '</select></label>' : '')
      + '<span class="note">평가는 '+({pixel:'도트', '2d':'2D', '3d':'3D'})[cls]+' 그림체 결과물만 셌어요.'+(r.view === 'top' || r.view === 'quarter' ? ' 탑다운·쿼터뷰는 방향마다 그려야 해서 손볼 일이 늘어나요.' : '')+'</span></div>' : '')
    + '<div class="opts2">' + list + '</div></div>';
}
function featsHTML(st){
  var f = st.inv.feat || {};
  return '<section class="card stack" aria-labelledby="ftT"><h2 id="ftT">이런 것도 들어가나요?</h2><div class="choices">' + Object.keys(FEATS).map(function(x){ return chip('data-feat', x, FEATS[x][0], x === 'i18n' ? f.i18n > 0 : !!f[x]); }).join('') + '</div>'
    + Object.keys(FEATS).filter(function(x){ return x === 'i18n' ? f.i18n > 0 : f[x]; }).map(function(x){ return '<p class="note"><b>'+FEATS[x][0]+'</b> · '+(x === 'i18n' ? '추가 언어 '+f.i18n+'개 번역 줄을 더했어요.' : x === 'mobile' ? FEATS[x][1] + '. 스토어 등록비(구글 플레이는 한 번 25달러, 앱스토어는 매년 99달러)는 견적에 넣지 않았어요.' : FEATS[x][1] + '.')+'</p>'; }).join('')
    + '</section>';
}
function renderResults(){
  var d = S.draft, st = d.setup; d.asked = d.asked || {}; d.nqSel = d.nqSel || {}; d.showFold = d.showFold || {};
  CTX = st; setRows(st); d.qty = qtyOf(st);
  var calcs = d.quotes.map(function(q){ return calc(q.picks, d.qty, d.buy, st); }), fi = foldInfo(calcs), q = curQ(), c = calcs[d.sel];
  var nVis = d.quotes.filter(function(x, i){ return visibleQ(i, fi); }).length;
  $('view').innerHTML = '<div class="qtop">'+(S.editingQ ? '<button type="button" class="crumb" data-quote="'+S.editingQ+'">'+ui('left', 16)+'게임으로 돌아가기</button>' : '<button type="button" class="crumb" data-go="home">'+ui('left', 16)+'내 게임</button>')
    + '<h1>'+(S.editingQ ? esc(d.name) + ' 견적 고치기' : nVis === 3 ? '견적 3개를 짰어요' : '이 조건에서 고를 견적은 ' + nVis + '개예요')+'</h1><p class="note" id="budgetNote">'+budgetNote(calcs, st)+'</p></div>'
    + '<div class="qlay">'
    + '<div class="qmain">' + condLine()
    + cmpHTML(calcs) + foldNote(calcs)
    + '<details class="card tbl alist"'+(S.listOpen || d.open ? ' open' : '')+'><summary><h2 id="tblT">에셋별로 자세히 고치기</h2><span class="note">줄마다 다른 도구로 바꾸거나 개수를 고칠 수 있어요. 지금 보는 것: '+QN(q)+'</span></summary>'
    + '<div class="th v8" aria-hidden="true"><span></span><span>에셋</span><span>만드는 방법</span><span>에셋별 평가</span><span class="r">돈</span><span></span></div>' + rowsHTML(q) + '</details>'
    + '</div>' + chatHTML() + '</div>'
    + '<div class="rbar" id="sumbar">'+sumbarHTML(c)+'</div>'
    + '<div class="chatscrim'+(S.chatOpen ? ' on' : '')+'" data-act="chat-toggle" aria-hidden="true"></div>';
  var m = $('msgs'); if(m) m.scrollTop = m.scrollHeight;
  if(S.flash){ setTimeout(function(){ S.flash = null; document.querySelectorAll('.tr-wrap.flash').forEach(function(x){ x.classList.remove('flash'); }); }, 2600); }
}
function sumbarHTML(c){
  var st = S.draft.setup, q = curQ();
  function k(full, short){ return '<span class="k"><span class="kl">'+full+'</span><span class="ks" aria-hidden="true">'+short+'</span></span>'; }
  return '<div class="rb-in"><div class="kv1">'+k(''+QN(q)+' · 월 추가 비용', '월 추가 비용')+'<span class="v'+(c.overMonthly ? ' t-red' : '')+'">'+won(c.monthly)+'</span></div>'
    + (c.once ? '<div class="kv1 sb-total">'+k('한 번 드는 돈', '한 번')+'<span class="v'+(c.overOnce ? ' t-red' : '')+'">'+won(c.once)+'</span></div>' : '')
    + '<div class="kv1">'+k('평균 별점', '별점')+'<span class="v">'+starTxt(c.qavg)+'</span></div>'
    + '<div class="acts">'+chatBtn()+(S.editingQ ? '<button type="button" class="btn sec cb-l2" data-act="save-new">새 게임으로 저장</button><button type="button" class="btn lg" data-act="save-over">고친 내용 저장</button>' : '<button type="button" class="btn lg" data-act="save">'+QN(q)+'로'+' 저장하기</button>')+'</div></div>';
}
function chatBtn(){ return '<button type="button" class="btn sec chatbtn" data-act="chat-toggle" aria-expanded="'+S.chatOpen+'" aria-controls="chat" aria-label="견적 도우미">'+icon('spark', 14)+'<span class="cb-l">견적 도우미</span></button>'; }
function updateRowCells(){
  var d = S.draft, q = curQ(), sm = sharedMap(q);
  ROWS.forEach(function(r){
    var m = document.querySelector('[data-mny="'+r.id+'"]'); if(m) m.innerHTML = mnyHTML(r, q, sm[r.id] || null);
    var ql = document.querySelector('[data-qtyl="'+r.id+'"]'); if(ql) ql.textContent = d.qty[r.id] + RU(r);
  });
  refreshTotals();
}
function refreshTotals(){
  var d = S.draft, q = curQ(), st = d.setup, calcs = d.quotes.map(function(x){ return calc(x.picks, d.qty, d.buy, st); }), c = calcs[d.sel];
  var sb = $('sumbar'); if(sb) sb.innerHTML = sumbarHTML(c);
  var box = document.querySelector('.cmpwrap'); if(box){ var tmp = document.createElement('div'); tmp.innerHTML = cmpHTML(calcs); box.innerHTML = tmp.firstChild.innerHTML; }
  var qs = $('qsumSec'); if(qs){ var dt = qs.querySelector('details'); S.cautOpen = !!(dt && dt.open); qs.innerHTML = qsumHTML(q, c); }
  var bn = $('budgetNote'); if(bn) bn.textContent = budgetNote(calcs, st);
}
function chatSuggestions(){
  var d = S.draft, st = d.setup, q = curQ(), c = calc(q.picks, d.qty, d.buy, st), s = [], sfx = ROW.sfx, fo = firstObj();
  if(sfx && optOf(sfx, 'eleven') && allowed(sfx, optOf(sfx, 'eleven'), st) && q.picks.sfx !== 'eleven') s.push('효과음은 AI로 뽑을래요');
  if(c.monthly > 10000) s.push('월 1만 원 안으로 맞춰 주세요'); else if(c.monthly > 0) s.push('비용을 더 줄여 주세요');
  if(fo && TOOLS[q.picks[fo.id]] && TOOLS[q.picks[fo.id]].ai) s.push(fo.name + eun(fo.name) + ' 직접 그릴래요');
  var en = st.inv.obj.filter(function(g){ return /적|몬스터/.test(g.name); })[0];
  s.push(en ? en.name + ' 3종 더 있어' : '보스 2마리 추가해 줘');
  s.push('로그라이크로 바꿀래');
  return s.slice(0, 4);
}
function firstObj(){ return ROWS.filter(function(r){ return r.cat === 'obj'; })[0]; }
function chatHTML(){
  var d = S.draft, q = curQ(), canUndo = undoableSet();
  return '<aside class="card chat'+(S.chatOpen ? ' open' : '')+'" id="chat" aria-labelledby="chatT"><div class="chat-h"><span class="av">'+icon('spark', 18)+'</span><div><b id="chatT">견적 도우미</b><small>지금 보는 견적: '+QN(q)+' · 월 추가 예산 '+manwon(d.setup.budget)+'</small></div><button type="button" class="iconbtn sm x" data-act="chat-toggle" aria-label="도우미 닫기">'+ui('close', 16)+'</button></div>'
    + nqHTML()
    + '<div class="msgs" id="msgs" aria-live="polite">' + d.chat.map(function(m, i){
        if(m.hide) return '';
        var ask = m.ask && !m.done ? '<span class="ask"><button type="button" class="p" data-askyes="'+i+'">'+m.ask.yes+'</button><button type="button" data-askno="'+i+'">그대로 두기</button></span>' : '';
        var other = m.qi != null && m.qi !== d.sel;
        var chg = m.chg ? '<span class="chg"><span>'+(other ? '<span class="qtag">'+QNi(m.qi)+'</span>' : '')+m.chg+'</span>'+(m.undone ? '<span>되돌렸어요</span>' : !canUndo[i] ? '' : '<button type="button" data-undo="'+i+'">되돌리기</button>')+'</span>' : '';
        return '<div class="msg '+m.who+(m.typing ? ' typing' : '')+'">'+(m.who === 'me' ? '<span class="sr">나: </span>' : '<span class="sr">도우미: </span>')+m.text+chg+ask+'</div>';
      }).join('') + '</div>'
    + '<div class="sugg" role="group" aria-label="이렇게 말해 보세요">' + chatSuggestions().map(function(x){ return '<button type="button" data-say="'+esc(x)+'">'+esc(x)+'</button>'; }).join('') + '</div>'
    + '<form class="chatf" id="chatF"><label class="sr" for="chatIn">견적 도우미에게 할 말</label><input class="field" id="chatIn" placeholder="예: 캐릭터는 직접 그릴래요" autocomplete="off"><button type="submit" class="iconbtn send" aria-label="보내기">'+ui('send', 18)+'</button></form>'
    + '<p class="note">도우미는 정해진 규칙으로 말을 알아들어요. 바뀐 줄을 꼭 확인해 주세요.</p></aside>';
}
function diffText(before, after){
  var dm = after.monthly - before.monthly, dq = after.qavg.toFixed(1) === before.qavg.toFixed(1) ? 0 : 1;
  return '월 추가 비용 ' + (dm === 0 ? '그대로' : (dm > 0 ? '+' : '−') + won(Math.abs(dm))) + ' · 평가 평균 ' + (dq === 0 ? '그대로' : starTxt(before.qavg) + ' → ' + starTxt(after.qavg));
}
/* ---------- 시작: 세 가지만 묻는다 ---------- */
/* 에셋 구성은 카테고리 8개로 나눠 한 번에 하나만 펼친다. 닫힌 카테고리는 한 줄 요약만 보인다 */
var ACATS = [
  ['obj', '오브젝트', '움직이는 캐릭터·사물'],
  ['scene', '배경·맵', '타일, 한 장 배경, 3D 공간'],
  ['ui', 'UI·아이콘', '버튼, 창, 아이템 아이콘'],
  ['illus', '일러스트', '컷신, 카드 그림, 홍보 이미지'],
  ['sound', '음향', '효과음, 배경음악'],
  ['text', '글·대사', '대화 장면, 아이템 설명'],
  ['feat', '큰 기능', '튜토리얼, 다국어, 모바일, 온라인 멀티'],
  ['etc', '기타', '목록에 없는 에셋']
];
function acatSum(s, k){
  var inv = s.inv, f = inv.feat || {};
  if(k === 'obj'){ var tot = inv.obj.reduce(function(a, g){ return a + (+g.n || 0); }, 0); return inv.obj.length + '묶음 · ' + tot + '종 · ' + inv.obj.slice(0, 2).map(function(g){ return esc(g.name); }).join(', ') + (inv.obj.length > 2 ? ' 외' : ''); }
  if(k === 'scene'){ var m = SCENE_MODES[STYLES[styleOfRow(s, inv.scene.style)].cls === '3d' ? 'space' : inv.scene.mode]; return inv.scene.n ? inv.scene.n + m.unit + ' · ' + m.name : '없음'; }
  if(k === 'ui') return inv.ui ? inv.ui + '개' : '없음';
  if(k === 'illus') return inv.illus ? inv.illus + '장' : '없음';
  if(k === 'sound'){ var sx = inv.sfx == null ? autoSfx(s) + '개(자동)' : inv.sfx + '개'; return '효과음 ' + sx + ' · 배경음악 ' + inv.bgm + '곡'; }
  if(k === 'text') return inv.text ? inv.text + '장면' : '없음';
  if(k === 'feat'){ var on = Object.keys(FEATS).filter(function(x){ return x === 'i18n' ? f.i18n > 0 : !!f[x]; }).map(function(x){ return FEATS[x][0]; }); return on.length ? on.join(', ') : '없음'; }
  if(k === 'etc'){ var cs = inv.custom || []; return cs.length ? cs.slice(0, 2).map(function(c){ return esc(c.name) + ' ' + c.n + (c.unit || '개'); }).join(', ') + (cs.length > 2 ? ' 외 ' + (cs.length - 2) + '개' : '') : '없음'; }
  return '';
}
function acatSnap(inv){ return {obj:JSON.stringify(inv.obj), scene:JSON.stringify(inv.scene), ui:inv.ui + '|' + inv.uiStyle, illus:inv.illus + '|' + inv.illusStyle, sound:inv.sfx + '|' + inv.bgm, text:String(inv.text), feat:JSON.stringify(inv.feat || {}), etc:JSON.stringify(inv.custom || [])}; }
function acatDiff(a, b){ return ACATS.map(function(c){ return c[0]; }).filter(function(k){ return a[k] !== b[k]; }); }
function updAssetSum(){ if(S.view !== 'setup' || S.wiz !== 2) return; var s = S.setup; document.querySelectorAll('[data-asum]').forEach(function(e){ e.innerHTML = acatSum(s, e.dataset.asum); }); }

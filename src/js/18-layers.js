/* ============================== 레이어 ============================== */
var lastFocus = null, lastFocusSel = null, reopenAfterUnlock = null;
function openLayer(html){
  if(!$('layer').innerHTML){ lastFocus = document.activeElement; lastFocusSel = focusSel(lastFocus); }
  $('layer').innerHTML = '<div class="scrim" data-act="close-layer"></div>' + html;
  $('app').setAttribute('inert', ''); document.body.classList.add('lyr'); placeGuide();
  toastFn = null; clearTimeout(toastT); $('toast').classList.add('hide');
  var f = $('layer').querySelector('[data-autofocus]') || $('layer').querySelector('.modal input, .modal button:not([data-act="close-layer"]), .drawer button:not([data-act="close-layer"])') || $('layer').querySelector('button');
  if(f) f.focus();
}
/* 레이어를 닫으면 연 버튼으로 포커스를 돌린다. 화면이 다시 그려져 버튼이 바뀌었으면 같은 속성의 새 버튼을 찾는다 */
function closeLayer(){
  $('layer').innerHTML = ''; $('app').removeAttribute('inert'); document.body.classList.remove('lyr');
  var t = (lastFocus && document.body.contains(lastFocus)) ? lastFocus : null;
  if(!t && lastFocusSel){ try { t = document.querySelector(lastFocusSel); } catch(x){} }
  if(t) t.focus({preventScroll:true}); else $('view').focus({preventScroll:true});
  placeGuide();
}
function trap(e){
  var L = $('layer'); if(!L.innerHTML || e.key !== 'Tab') return;
  var f = Array.prototype.filter.call(L.querySelectorAll('button:not([disabled]), input:not([disabled]), select, textarea'), function(x){ return x.offsetParent !== null; });
  if(!f.length) return; var a = f[0], b = f[f.length - 1];
  if(e.shiftKey && document.activeElement === a){ e.preventDefault(); b.focus(); }
  else if(!e.shiftKey && document.activeElement === b){ e.preventDefault(); a.focus(); }
}
function mh(id, title){ return '<div class="mh"><h2 id="'+id+'">'+title+'</h2>'+closeBtn()+'</div>'; }
function openReviews(t){ S.toolT = t; S.toolCat = ''; go('tool'); }
function openPost(id){ return openWork(id); }
var REPORT = ['다른 사람의 결과물 같아요', '도구와 결과물이 맞지 않아요', '내용이 없거나 성의가 없어요', '광고나 스팸이에요'];
function reportSheet(id){
  openLayer('<form class="modal sheet" id="repF" data-post="'+id+'" role="dialog" aria-modal="true" aria-labelledby="rpT">'+mh('rpT', '후기 신고')
    + '<fieldset class="radios"><legend class="sr">신고 이유</legend>' + REPORT.map(function(r, i){ return '<label class="ckl"><input type="radio" name="rep" value="'+i+'"'+(i === 0 ? ' checked data-autofocus' : '')+'><span>'+r+'</span></label>'; }).join('') + '</fieldset>'
    + '<p class="note">신고가 쌓이면 검토 뒤 숨김 처리해요.</p>'
    + '<div class="row-acts end"><button type="button" class="btn sec" data-act="close-layer">취소</button><button type="submit" class="btn">신고하기</button></div></form>');
}
function srcSheet(k){
  var custom = isCustom(k), T = custom ? {name:k.slice(7), src:'', why:'목록에 없는 도구예요. 저희가 확인하지 않은 도구라 약관에서 상업적 이용 조건을 직접 확인해 주세요.', rights:'check'} : (TOOLS[k] || {name:k, src:'', why:'', rights:'check'});
  var self = custom || T.rights === 'check' || T.rightsCheck, date = self ? '직접 확인이 필요해요' : CHECKED + '에 원문 확인';
  var plans = !custom && T.plans && T.plans.length > 1 ? '<table class="ptab"><caption class="sr">'+esc(T.name)+' 요금제별 상업적 이용</caption><thead><tr><th scope="col">요금제</th><th scope="col">가격</th><th scope="col">상업적 이용</th></tr></thead><tbody>'
    + T.plans.map(function(p){ return '<tr><td>'+esc(p.name)+'</td><td>'+(p.once ? '한 번 $'+p.once : p.usd ? '월 $'+p.usd : '무료')+'</td><td>'+(p.rights === 'ok' ? '가능' : p.rights === 'attr' ? '출처 표시하면 가능' : '안 됨')+(p.pub ? ' · 만든 그림 공개' : '')+(p.dl ? ' · 한 달 '+p.dl+'곡 내려받기' : '')+'</td></tr>'; }).join('') + '</tbody></table>' : '';
  openLayer('<div class="modal sheet" role="dialog" aria-modal="true" aria-labelledby="srT">'+mh('srT', esc(T.name)+' 상업적 이용 근거')
    + '<div class="kv"><span>근거 문서</span><span class="v">'+esc(T.src || (custom ? '그 도구의 이용약관' : '받은 곳의 라이선스'))+'</span><span>저희 확인</span><span class="v">'+date+'</span></div>'
    + '<p>'+esc(T.why)+'</p>' + plans
    + '<p class="note">약관은 바뀔 수 있어요. '+(custom ? '' : '상업적 이용 조건이 실제로 바뀌면 이 도구를 쓰는 게임에 소식으로 알려 드려요. ')+'원문은 새 탭에서 열려요(시안에서는 열리지 않아요).</p>'
    + '<div class="row-acts end"><button type="button" class="btn sec" data-act="close-layer">닫기</button></div></div>');
}
var LB = null;
function openLightbox(key){
  var k = key.split(':'), r = ROW[k[0]], t = k[1], i = +k[2], shots = r.shots[t], v = shots[i], st = S.draft ? S.draft.setup : S.setup;
  var tools = r.opts.filter(function(o){ return o.m === 'ai' && r.shots && r.shots[o.t]; }).map(function(o){ return o.t; });
  LB = {r:r.id, t:t, i:i};
  openLayer('<div class="modal wide" role="dialog" aria-modal="true" aria-labelledby="lbT">'+mh('lbT', TOOLS[t].name+' · '+(i + 1)+'번째 결과')
    + '<div class="lb"><button type="button" class="navarr" data-lbnav="-1" aria-label="이전 결과"'+(i === 0 ? ' disabled' : '')+'>'+ui('left', 20)+'</button><div class="lb-img">'+sample(r.cat, r.cat === 'sfx' ? 180 : r.cat === 'code' ? 120 : 260, !v, tools.indexOf(t), st.engine)+'</div><button type="button" class="navarr" data-lbnav="1" aria-label="다음 결과"'+(i === shots.length - 1 ? ' disabled' : '')+'>'+ui('right', 20)+'</button></div>'
    + '<div class="row-acts between"><span class="chip '+(v ? 'c-ok' : 'c-mute')+'">'+(v ? '쓸 만해요' : '그대로는 못 써요')+'</span><span class="note">크게 확대해서 보여 드려요 · 키보드 화살표로 넘겨요</span></div></div>');
}
var TOOLCATS = {aseprite:'obj scene ui illus', selfart:'obj scene ui illus', blender:'obj scene illus', kenney:'obj scene ui', quaternius:'obj scene', pixellab:'obj scene ui', retro:'obj scene', zimage:'obj scene ui illus', midjourney:'obj scene ui illus', meshy:'obj scene', jsfxr:'sfx', unityai:'obj ui sfx', selfsound:'sfx', cc0sound:'sfx', eleven:'sfx', cc0music:'bgm', selfmusic:'bgm', suno:'bgm', selfcode:'code', claude:'code text', copilot:'code', selftext:'text', buyasset:'obj scene ui sfx bgm'};
/* 입력 오류는 해당 칸 아래에 바로 보여 주고, 첫 번째 오류 칸으로 포커스를 옮긴다 */
function setErr(id, msg, focusEl){
  var e = $(id + 'Err'), f = focusEl || $(id); if(e) e.textContent = msg || '';
  if(f){ if(msg) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid'); }
}
/* 성의 없는 글 거르기: 같은 글자 반복이나 너무 짧은 글은 받지 않는다 */
function richEnough(s, n){ var t = s.replace(/\s/g, ''); if(t.length < n) return false; var u = {}; t.split('').forEach(function(c){ u[c] = 1; }); return Object.keys(u).length >= Math.min(10, Math.ceil(n / 3)); }
function planOpt(p){ return p.name + (p.once ? ' · 한 번 $' + p.once : p.usd ? ' · 월 $' + p.usd : p.name === '무료' || /free/i.test(p.name) || p.id === 'own' ? '' : ' · 무료') + (p.rights !== 'ok' ? ' · 상업적 이용 ' + (p.rights === 'attr' ? '출처 표시 필요' : '안 됨') : ''); }
function openTools(){
  var all = ['claude', 'copilot', 'aseprite', 'pixellab', 'retro', 'midjourney', 'zimage', 'eleven', 'suno', 'meshy', 'unityai', 'jsfxr', 'kenney'];
  openLayer('<div class="modal" role="dialog" aria-modal="true" aria-labelledby="tmT">'+mh('tmT', '쓰는 도구')
    + '<p class="note">여기서 고른 도구와 요금제는 새 견적에서 ‘이미 쓰는 도구’로 미리 골라 둬요. 무료 플랜처럼 상업적으로 쓸 수 없는 요금제는 비용 0원으로 치지 않아요. 저장한 게임의 견적 숫자는 바뀌지 않아요.</p><div>'
    + all.map(function(t){
        var T = TOOLS[t], on = owns(t), pid = myPlanId(t);
        var sub = on && T.plans && T.plans.length > 1 ? '<select class="field sm" data-toolplan="'+t+'" aria-label="'+T.name+' 요금제">' + T.plans.map(function(p){ return '<option value="'+p.id+'"'+(p.id === pid ? ' selected' : '')+'>'+esc(planOpt(p))+'</option>'; }).join('') + '</select>'
          : '<small>'+esc(on ? ownedSt(t) : T.plans ? T.plans.length > 1 ? '요금제 ' + T.plans.length + '가지' : planOpt(T.plans[0]) : (T.plan || '무료'))+'</small>';
        return '<div class="trow">'+av(t)+'<span><b>'+T.name+'</b>'+sub+'</span><button type="button" class="btn sm '+(on ? 'quiet' : 'sec')+'" data-tooltoggle="'+t+'" aria-label="'+T.name+(on ? ' 빼기' : ' 추가')+'">'+(on ? '빼기' : '추가')+'</button></div>';
      }).join('') + '</div></div>');
}
/* 저장 시트: 스토어 페이지 공개 달, 출시 플랫폼, 중간 일정, 알림을 여기서 정한다(견적을 받을 때는 묻지 않는다) */
var SV = null;
function storeDefault(st){ return Math.max(st.release >= 4 ? st.release - 3 : st.release - 1, 0); }
function saveSheet(asNew){
  var d = S.draft, st = d.setup;
  SV = {asNew:!!asNew, name:d.name + (asNew ? ' 복사본' : ''), store:storeDefault(st), plats:clone(st.platforms && st.platforms.length ? st.platforms : ['steam']), ms:clone(st.ms || []).map(function(m){ m.m = Math.max(0, Math.min(m.m, st.release)); return m; }), remind:true, email:false};
  svRender('#svName');
}
function svGrab(){
  var n = $('svName'); if(n) SV.name = n.value; var s = $('svStore'); if(s) SV.store = +s.value;
  var r = $('svRemind'); if(r) SV.remind = r.checked; var e = $('svEmail'); if(e) SV.email = e.checked;
  document.querySelectorAll('[data-svmsname]').forEach(function(x){ SV.ms.forEach(function(m){ if(m.id === x.dataset.svmsname) m.name = x.value.slice(0, 20) || '일정'; }); });
  document.querySelectorAll('[data-svmsm]').forEach(function(x){ SV.ms.forEach(function(m){ if(m.id === x.dataset.svmsm) m.m = +x.value; }); });
}
function svRender(focusSel){
  var d = S.draft, q = curQ(), c = calc(q.picks, d.qty, d.buy, d.setup), st = d.setup, months = [];
  for(var i = 0; i <= st.release; i++) months.push(i);
  function mopts(cur){ return months.map(function(m){ return '<option value="'+m+'"'+(m === cur ? ' selected' : '')+'>'+monthLabel(m)+(m === 0 ? ' (이번 달)' : m === st.release ? ' (출시)' : '')+'</option>'; }).join(''); }
  var msH = SV.ms.map(function(m){ return '<div class="msrow"><input class="field" data-svmsname="'+m.id+'" value="'+esc(m.name)+'" maxlength="20" aria-label="일정 이름"><select class="field" data-svmsm="'+m.id+'" aria-label="'+esc(m.name)+' 달">'+mopts(m.m)+'</select><button type="button" class="iconbtn sm" data-svmsdel="'+m.id+'" aria-label="'+esc(m.name)+' 일정 지우기">'+ui('close', 16)+'</button></div>'; }).join('');
  openLayer('<form class="modal sheet" id="saveF" role="dialog" aria-modal="true" aria-labelledby="svT">'+mh('svT', ''+QN(q)+'로'+' 게임을 저장할게요')
    + '<label class="fld">게임 이름<input class="field" id="svName" maxlength="30" value="'+esc(SV.name)+'"></label>'
    + '<div class="kv"><span>월 추가 비용</span><span class="v">'+won(c.monthly)+'</span>'+(c.once ? '<span>한 번 드는 돈</span><span class="v">'+won(c.once)+(c.buyMissing ? ' (구매가 '+c.buyMissing+'건 빠짐)' : '')+'</span>' : '')+'<span>평가 평균</span><span class="v">'+starTxt(c.qavg)+'</span><span>출시까지 '+st.release+'개월 동안 총</span><span class="v">'+won(c.total)+'</span></div>'
    + '<details class="svmore"'+(SV.more ? ' open' : '')+'><summary><b>일정과 알림</b><span class="opt-l">선택 · '+monthLabel(SV.store)+' 스토어 페이지 · '+SV.plats.map(function(x){ return PLATFORMS[x]; }).join(', ')+' · 알림 '+(SV.remind ? '켬' : '끔')+'</span></summary><div class="stack">'
    + '<label class="fld">스토어 페이지는 언제 열 예정인가요?<select class="field" id="svStore">'+mopts(SV.store)+'</select><span class="note">그달에 스토어 AI 고지문을 준비하라고 알려 드려요. 스팀은 스토어 페이지 검토를 요청하기 전에 콘텐츠 설문을 내야 해요.</span></label>'
    + '<div class="fld">어디에 출시하나요? <span class="opt-l">여러 개 골라도 돼요</span><div class="choices" role="group" aria-label="출시 플랫폼">'
    + ['steam', 'itch', 'gplay', 'appstore', 'web', 'console', 'unknown'].map(function(p){ return '<button type="button" class="choice" data-svplat="'+p+'" aria-pressed="'+(SV.plats.indexOf(p) >= 0)+'">'+PLATFORMS[p]+'</button>'; }).join('') + '</div></div>'
    + '<div class="fld">중간 일정 <span class="opt-l">선택 · 그달에 알려 드려요</span>'+msH+'<div class="choices sm" role="group" aria-label="일정 추가">'+['데모 공개', '알파 테스트', '펀딩 시작', '공모전 마감'].map(function(n){ return '<button type="button" class="choice" data-svms="'+n+'">+ '+n+'</button>'; }).join('')+'</div></div>'
    + '<label class="ckl"><input type="checkbox" id="svRemind"'+(SV.remind ? ' checked' : '')+'><span>스토어 페이지 공개 달과 중간 일정에 알려 주세요</span></label>'
    + '<label class="ckl"><input type="checkbox" id="svEmail"'+(SV.email ? ' checked' : '')+(SV.remind ? '' : ' disabled')+'><span>이메일로도 받기</span></label>'
    + '</div></details>'
    + '<p class="note">지금 가격과 이미 쓰는 도구 기준으로 저장해요. 함께 받은 견적과 도우미 대화도 보관해서 나중에 그대로 고칠 수 있어요.</p>'
    + '<div class="row-acts end"><button type="button" class="btn sec" data-act="close-layer">취소</button><button type="submit" class="btn">저장하고 내 게임으로</button></div></form>');
  if(focusSel){ try { var f = $('layer').querySelector(focusSel); if(f) f.focus(); } catch(x){} }
}
function qMenu(){
  var q = getQ(S.activeQ);
  openLayer('<form class="modal sheet" id="renF" role="dialog" aria-modal="true" aria-labelledby="qmT">'+mh('qmT', '게임 관리')
    + '<label class="fld">이름<input class="field" id="renName" maxlength="30" value="'+esc(q.name)+'" aria-describedby="renNameErr" data-autofocus><span class="err" id="renNameErr"></span></label>'
    + '<div class="row-acts between"><button type="button" class="btn sec danger-t" data-act="del-ask">게임 삭제</button><button type="submit" class="btn">이름 저장</button></div></form>');
}
function hourSheet(){
  var hv = hourV();
  openLayer('<form class="modal sheet" id="hvF" role="dialog" aria-modal="true" aria-labelledby="hvT" novalidate>'+mh('hvT', '시간 1시간을 얼마로 칠까요?')
    + '<p>균형 견적은 줄어드는 시간의 값이 더 드는 돈보다 클 때만 유료 도구를 넣어요. 이 값을 올리면 유료 도구가 더 쉽게 들어가요.</p>'
    + '<div class="choices" role="group" aria-label="시간 값">' + [[MIN_WAGE, '2026년 최저시급'], [15000, ''], [20000, '']].map(function(x){ return '<button type="button" class="choice'+(x[1] ? ' has-sub' : '')+'" data-hv="'+x[0]+'" aria-pressed="'+(hv === x[0])+'">'+won(x[0])+(x[1] ? '<small>'+x[1]+'</small>' : '')+'</button>'; }).join('') + '</div>'
    + '<label class="fld">직접 적기<span class="ninp"><input class="field" id="hvIn" type="number" inputmode="numeric" min="0" max="200000" step="500" value="'+hv+'" data-autofocus><span>원</span></span></label>'
    + '<p class="note">이 시간에 다른 일을 했다면 벌었을 돈으로 생각하면 돼요. 돈 우선과 시간 우선 견적은 이 값과 상관없이 짜요.</p>'
    + '<div class="row-acts end"><button type="button" class="btn sec" data-act="close-layer">취소</button><button type="submit" class="btn">이 값으로 다시 짜기</button></div></form>');
}
/* 한 견적만 다시 짠다(직접 고른 줄은 그대로 둔다) */
function rebuildStrat(i){
  var d = S.draft, st = d.setup, rs = rowsOf(st), q = d.quotes[i], picks = {};
  rs.forEach(function(r){ picks[r.id] = q.locks && q.locks[r.id] ? q.picks[r.id] : pickFor(r, q.strat, st); });
  if(q.strat !== 'money') addTools(picks, rs.filter(function(r){ return !(q.locks && q.locks[r.id]); }), d.qty, d.buy, st, q.strat);
  fitBudget(picks, d.qty, d.buy, st.budget, q.locks || {}, st);
  q.picks = picks; q.base = clone(picks);
}
function confirmSheet(title, body, yesLabel, yesAct, danger, noLabel){
  openLayer('<div class="modal sheet" role="alertdialog" aria-modal="true" aria-labelledby="cfT" aria-describedby="cfB"><h2 id="cfT">'+title+'</h2><p id="cfB">'+body+'</p><div class="row-acts end"><button type="button" class="btn sec" data-act="close-layer" data-autofocus>'+(noLabel || '취소')+'</button><button type="button" class="btn'+(danger ? ' danger' : '')+'" data-act="'+yesAct+'">'+yesLabel+'</button></div></div>');
}


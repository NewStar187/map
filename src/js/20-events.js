/* ============================== 이벤트 ============================== */
var AC = null;
function playDemo(kind, t){
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if(AC.state === 'suspended') AC.resume();
    var h = toolHash(t), now = AC.currentTime, wave = ['square', 'triangle', 'sawtooth'][h % 3];
    var notes = kind === 'sfx' ? [880 + (h % 5) * 60, 440 + (h % 7) * 30] : [[262, 330, 392, 523, 392, 330], [294, 349, 440, 587, 440, 349], [220, 277, 330, 440, 330, 277]][h % 3], dur = kind === 'sfx' ? 0.07 : 0.22;
    notes.forEach(function(f, i){ var o = AC.createOscillator(), g = AC.createGain(); o.type = wave; o.frequency.setValueAtTime(f, now + i * dur); if(kind === 'sfx') o.frequency.exponentialRampToValueAtTime(f / 2, now + (i + 1) * dur); g.gain.setValueAtTime(0.0001, now + i * dur); g.gain.exponentialRampToValueAtTime(0.08, now + i * dur + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + (i + 1) * dur); o.connect(g); g.connect(AC.destination); o.start(now + i * dur); o.stop(now + (i + 1) * dur + 0.02); });
    toast('시안용 예시 소리예요. 실제 서비스에서는 그 도구로 만든 소리가 나와요.');
  } catch(x){ toast('이 브라우저에서는 예시 소리를 낼 수 없어요.'); }
}
document.addEventListener('keydown', function(e){ var pl = e.target.closest && e.target.closest('[data-play]'); if(pl && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); e.stopPropagation(); var a = pl.dataset.play.split('|'); playDemo(a[0], a[1]); } }, true);
document.addEventListener('click', function(e){
  var pl0 = e.target.closest('[data-play]'); if(pl0){ e.preventDefault(); e.stopImmediatePropagation(); var pa = pl0.dataset.play.split('|'); return playDemo(pa[0], pa[1]); }
  var el = e.target.closest('button, [data-act]');
  if(!el || el.disabled) return;
  var sel = focusSel(el);
  handleClick(el, e);
  setTimeout(function(){
    if($('layer').innerHTML && $('layer').contains(document.activeElement)) return;
    if((document.activeElement === document.body || !document.contains(el)) && sel){ try { var n = document.querySelector(sel); if(n && !$('layer').innerHTML) n.focus({preventScroll:true}); } catch(x){} }
  }, 0);
});
function handleClick(el, e){
  var d = el.dataset;
  if(el.id === 'menuBtn') return S.sbOpen ? closeSb() : openSb();
  if(d.act === 'toast-act'){ var tf = toastFn; toastFn = null; $('toast').classList.add('hide'); clearTimeout(toastT); if(tf) tf(); return; }
  if(d.go){
    if(d.go === 'setup' && S.editingQ && S.draft && draftDirty()){ S.pendingAct = 'new'; return confirmSheet('고치던 견적이 있어요', '‘'+esc(S.draft.name)+'’ 견적을 고치던 중이에요. 저장하지 않고 새 견적을 받으면 고친 내용이 사라져요.', '버리고 새로 만들기', 'pend-yes', true, '계속 고치기'); }
    if(d.go === 'setup'){ if(S.editingQ){ S.editingQ = null; S.draft = null; } return startNew(); }
    if(d.go === 'home') S.toolFilter = null; return go(d.go); }
  if(d.act === 'pend-yes'){ var pa = S.pendingAct; S.pendingAct = null; closeLayer(); if(pa === 'new'){ S.editingQ = null; S.draft = null; return startNew(); } if(pa && pa.indexOf('edit:') === 0){ S.draft = null; S.editingQ = null; return editQuote(pa.slice(5)); } return; }
  if(d.act === 'reset-demo'){ return confirmSheet('예시 데이터로 되돌릴까요?', '이 브라우저에 저장한 게임, 작업 기록, 올린 결과물이 모두 지워지고 처음 상태로 돌아가요.', '되돌리기', 'reset-demo-yes', true); }
  if(d.act === 'reset-demo-yes'){ try { localStorage.removeItem(STORE_KEY); } catch(x){} initialState(); closeLayer(); go('home'); return toast('예시 데이터로 되돌렸어요.'); }
  if(d.quote){ if(S.newQ === d.quote) S.guide = false; return go('quote', {q:d.quote, step:+d.step || 0}); }
  if(d.act === 'to-draft'){ S.condMode = false; return go('results'); }
  if(d.toolf){ S.toolT = d.toolf; S.toolCat = ''; return go('tool'); }
  if(d.act === 'close-layer'){ return closeLayer(); }
  if(d.act === 'upload'){ return openUpload(); }
  if(d.uploadfor){ return openUpload(d.uploadfor); }
  if(d.act === 'tools'){ return openTools(); }
  if(d.tooltoggle){ var t0 = d.tooltoggle; if(owns(t0)){ S.toolCache[t0] = myPlanId(t0); S.myTools = S.myTools.filter(function(x){ return x.t !== t0; }); } else S.myTools.push({t:t0, plan:S.toolCache[t0] || TOOLS[t0].def || null}); render(); openTools(); var tb = $('layer').querySelector('[data-tooltoggle="'+t0+'"]'); if(tb) tb.focus(); return; }
  if(d.act === 'rules'){ S.rulesOpen = !S.rulesOpen; return render(); }
  if(d.alert){ S.openAlert = S.openAlert === d.alert ? null : d.alert; return render(); }
  if(d.act === 'showseen'){ S.showSeen = !S.showSeen; return render(); }
  if(d.alertok){ S.alertDone[d.alertok] = TODAY; var ao = activeAlerts().filter(function(a){ return a.id === d.alertok; })[0]; if(ao && ao.done) S.openAlert = null; render(); return toast(ao && !ao.done ? '알겠어요. 작업 기록에 구독 여부를 모두 표시하면 이 소식이 끝나요.' : '이 소식을 ‘끝난 소식’으로 옮겼어요.'); }
  if(d.tcat != null && S.view === 'tools'){ S.toolCatF = d.tcat; return render(); }
  if(d.tcls != null){ S.toolCls = d.tcls; return render(); }
  if(d.tpcat != null){ S.toolCat = d.tpcat; return render(); }
  if(d.wsort){ S.wsort = d.wsort; return render(); }
  if(d.toolpage){ S.toolT = d.toolpage; S.toolCat = S.toolCatF || ''; return go('tool'); }
  if(d.toolgo){ var tg = d.toolgo.split('|'); S.toolT = tg[0]; S.toolCat = tg[1]; S.toolCls = tg[2] || ''; return go('tool'); }
  if(d.work){ REPLY_TO = null; return openWork(d.work); }
  if(d.whelp){ var vh = S.voted[d.whelp] = S.voted[d.whelp] || {}; vh.h = !vh.h; persist(); WORK_FOCUS = '[data-whelp]'; return openWork(d.whelp); }
  if(d.wvote){ var wv = d.wvote.split('|'), vv = S.voted[wv[0]] = S.voted[wv[0]] || {}; vv.v = vv.v === wv[1] ? null : wv[1]; persist(); WORK_FOCUS = '[data-wvote="'+d.wvote+'"]'; return openWork(wv[0]); }
  if(d.replyto){ var wk0 = document.querySelector('[data-cmtsend]'); REPLY_TO = REPLY_TO === d.replyto ? null : d.replyto; WORK_FOCUS = REPLY_TO ? '#rIn' : '[data-replyto="'+d.replyto+'"]'; return openWork(wk0.dataset.cmtsend); }
  if(d.cmtsend){ var ci2 = $('cIn'), tx2 = ci2 ? ci2.value.trim() : ''; if(!tx2){ if(ci2) ci2.focus(); return; } var wk = S.works.filter(function(x){ return x.id === d.cmtsend; })[0]; wk.comments = wk.comments || []; wk.comments.push({id:'c' + Date.now().toString(36), who:'나', when:'방금', text:tx2, replies:[]}); persist(); WORK_FOCUS = '#cIn'; openWork(wk.id); var nm2 = $('layer').querySelector('.modal.work'); if(nm2) nm2.scrollTop = nm2.scrollHeight; return toast('댓글을 남겼어요.'); }
  if(d.replysend){ var rs2 = d.replysend.split('|'), ri2 = $('rIn'), tx3 = ri2 ? ri2.value.trim() : ''; if(!tx3){ if(ri2) ri2.focus(); return; } var wk2 = S.works.filter(function(x){ return x.id === rs2[0]; })[0], cm2 = wk2.comments.filter(function(c){ return c.id === rs2[1]; })[0]; cm2.replies = cm2.replies || []; cm2.replies.push({id:'r' + Date.now().toString(36), who:'나', when:'방금', text:tx3}); REPLY_TO = null; persist(); WORK_FOCUS = '[data-replyto="'+rs2[1]+'"]'; openWork(wk2.id); return toast('답글을 남겼어요.'); }
  if(d.trev){ return toolRevSheet(d.trev); }
  if(d.trstar && TR){ TR.star = +d.trstar; setErr('tr', ''); el.parentNode.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', b === el); }); return; }
  if(d.act === 'clear-all'){ S.toolCatF = ''; S.toolCls = ''; S.search = ''; render(); var qn = $('q'); if(qn) qn.focus(); return; }
  if(d.report){ return reportSheet(d.report); }
  if(d.src){ return srcSheet(d.src); }
  if(d.post){ return openPost(d.post); }
  if(d.act === 'pick-file'){ UP.file = true; setErr('upFile', ''); el.classList.add('has'); el.innerHTML = '<span class="th2">'+sample('sprite', 44)+'</span><span><b>knight_idle_01.png</b><br><span class="note">다시 누르면 바꿀 수 있어요</span></span>'; return; }
  if(d.upcls){ UP.cls = d.upcls; el.parentNode.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', b === el); }); return; }
  if(d.upsat){ UP.sat = d.upsat; setErr('upsat', '', el.parentNode); el.parentNode.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', b === el); }); return; }
  if(d.uphow){ UP.how = d.uphow; setErr('uphow', '', el.parentNode); el.parentNode.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', b === el); }); return; }
  if(d.upstar){ UP.star = +d.upstar; setErr('upstar', '', el.parentNode); el.parentNode.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', b === el); }); return; }
  if(d.copyp){ return copy(d.copyp, function(){ toast('프롬프트를 복사했어요.'); }); }
  if(d.act === 'guide-close'){ S.guide = false; return render(); }
  if(d.act === 'guide-open'){ var nq = S.newQ; S.guide = false; return go('quote', {q:nq, step:2}); }
  /* 새 견적서 */
  if(d.set){ var g = d.set, v = d.val, st0 = S.setup, note = '';
    if(g === 'budget'){ st0.budget = +v; var bi = $('inBudget'); if(bi) bi.value = v; }
    else if(g === 'onceBudget'){ st0.onceBudget = +v; var oi = $('inOnce'); if(oi) oi.value = v; }
    else { st0[g] = v; if(g === 'view'){ st0.viewTouched = true; note = syncStyleView(st0, 'view'); } if(g === 'style') note = syncStyleView(st0, 'style'); }
    if(g === 'view' || g === 'style' || g === 'draw'){ render(); if(note) toast(note); var fv = document.querySelector('[data-set="'+g+'"][data-val="'+v+'"]'); if(fv) fv.focus({preventScroll:true}); persist(); return; }
    el.parentNode.querySelectorAll('[data-set="'+g+'"]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.val) === String(st0[g])); });
    renderPreview(); persist(); return; }
  function reSetup(sel){ syncSt(S.setup); render(); if(sel){ var f = document.querySelector(sel); if(f) f.focus({preventScroll:true}); } persist(); }
  if(d.sty && S.view === 'setup'){ var st1 = S.setup, i1 = st1.styles.indexOf(d.sty); if(i1 >= 0){ if(st1.styles.length > 1) st1.styles.splice(i1, 1); } else st1.styles.push(d.sty); st1.style = st1.styles[0]; syncSt(st1); var m1 = st1.inv.scene.mode; if(has3d(st1) && m1 !== 'space') st1.inv.scene.mode = 'space'; if(!has3d(st1) && m1 === 'space') st1.inv.scene.mode = 'tile'; return reSetup('[data-sty="'+d.sty+'"]'); }
  if(d.vw && S.view === 'setup'){ var st2 = S.setup, i2 = st2.views.indexOf(d.vw); if(i2 >= 0){ if(st2.views.length > 1) st2.views.splice(i2, 1); } else st2.views.push(d.vw); st2.view = st2.views[0]; st2.viewTouched = true; return reSetup('[data-vw="'+d.vw+'"]'); }
  if(d.sfeat){ var f2 = S.setup.inv.feat = S.setup.inv.feat || {}; if(d.sfeat === 'i18n') f2.i18n = f2.i18n > 0 ? 0 : 2; else f2[d.sfeat] = !f2[d.sfeat]; return reSetup('[data-sfeat="'+d.sfeat+'"]'); }
  if(d.gen){ var gs = S.setup.genres, gi = gs.indexOf(d.gen); if(gi >= 0) gs.splice(gi, 1); else gs.push(d.gen); applyGenres(); return reSetup('[data-gen="'+d.gen+'"]'); }
  if(d.act === 'paste-inv'){ var ptx = ($('inPaste').value || ''); if(!ptx.trim()){ $('inPaste').focus(); return; } var inQ = S.view === 'results' && S.draft; if(inQ) S.setup = clone(S.draft.setup);
    var invP = clone(S.setup.inv), pr = parsePaste(ptx), FLD = {sfx:'효과음', bgm:'배경음악', ui:'UI·아이콘', illus:'일러스트', text:'대사·글', scene:'배경·맵'}, got = {};
    if(!pr.objs.length && !pr.other.length){ S.pasteMsg = '읽을 수 있는 줄이 없었어요. 한 줄에 ‘이름, 개수, 동작 수’ 순서로 붙여 넣어 주세요.'; S.pasteOpen = true; return reSetup('#inPaste'); }
    if(pr.objs.length) S.setup.inv.obj = objFrom(pr.objs);
    pr.other.forEach(function(o){ got[o.key] = (got[o.key] || 0) + o.n; });
    Object.keys(got).forEach(function(k){ if(k === 'scene') S.setup.inv.scene.n = got[k]; else S.setup.inv[k] = got[k]; });
    S.setup.invTouched = true; S.pasteOpen = true;
    S.pasteMsg = (pr.objs.length ? '움직이는 오브젝트를 붙여 넣은 묶음 ' + pr.objs.length + '개로 바꿨어요. ' : '') + Object.keys(got).map(function(k){ return FLD[k] + ' ' + got[k]; }).join(', ') + (Object.keys(got).length ? '도 채웠어요. ' : '') + (pr.skipped.length ? '개수가 없어서 못 읽은 줄 ' + pr.skipped.length + '개: ' + esc(pr.skipped.slice(0, 3).join(' / ')) : '');
    if(inQ){ syncSt(S.setup); rebuild('붙여 넣은 목록으로 에셋을 채웠어요.'); return toast('붙여 넣은 목록으로 채웠어요.', '되돌리기', function(){ S.pasteMsg = ''; editSetup(function(s){ s.inv = invP; }, '붙여 넣기 전으로 되돌렸어요.'); }); }
    reSetup('#inPaste'); return toast('붙여 넣은 목록으로 채웠어요.', '되돌리기', function(){ S.setup.inv = invP; S.pasteMsg = ''; render(); }); }
  if(d.act === 'inv-reset'){ S.setup.invTouched = false; applyGenres(); return reSetup('[data-gen]'); }
  if(d.act === 'obj-add'){ objSeq++; var nid = 'o' + Date.now().toString(36) + objSeq; S.setup.inv.obj.push({id:nid, name:'새 묶음', n:1, a:3}); S.setup.invTouched = true; return reSetup('[data-objname="'+nid+'"]'); }
  if(d.objdel){ if(S.setup.inv.obj.length > 1){ S.setup.inv.obj = S.setup.inv.obj.filter(function(g){ return g.id !== d.objdel; }); S.setup.invTouched = true; } return reSetup('[data-act="obj-add"]'); }
  if(d.scenemode){ S.setup.inv.scene.mode = d.scenemode; S.setup.invTouched = true; return reSetup('[data-scenemode="'+d.scenemode+'"]'); }
  if(d.sys){ var inv0 = S.setup.inv; if(inv0.sys[d.sys] != null) inv0.sys[d.sys] = !inv0.sys[d.sys]; else inv0.sysx.forEach(function(x){ if(x.id === d.sys) x.on = x.on === false; }); return reSetup('[data-sys="'+d.sys+'"]'); }
  if(d.sysadd){ S.setup.inv.sys[d.sysadd] = true; return reSetup('[data-sys="'+d.sysadd+'"]'); }
  if(d.act === 'sys-add'){ var sn = ($('inSysAdd').value || '').trim(); if(!sn){ $('inSysAdd').focus(); return; } S.setup.inv.sysx.push({id:'x' + Date.now().toString(36), name:sn.slice(0, 20), h:6, on:true}); return reSetup('#inSysAdd'); }
  if(d.act === 'cus-add'){ var cn = ($('inCusName').value || '').trim(); if(!cn){ $('inCusName').focus(); return; } var kind = $('inCusKind').value; S.setup.inv.custom.push({id:'c' + Date.now().toString(36), name:cn.slice(0, 20), kind:kind, n:Math.max(1, parseInt($('inCusN').value, 10) || 1), unit:kind === 'sound' ? '개' : kind === 'text' ? '장면' : '장'}); S.setup.invTouched = true; S.assetOpen = 'etc'; S.aflash = ['etc']; toast('‘' + cn.slice(0, 20) + '’을(를) 기타에 더했어요.'); return reSetup('#inCusName'); }
  if(d.cusdel){ S.setup.inv.custom = S.setup.inv.custom.filter(function(c){ return c.id !== d.cusdel; }); return reSetup('#inCusName'); }
  if(d.mspreset){ var mid = 'm' + Date.now().toString(36), mm = Math.max(0, Math.min(S.setup.release - 1, Math.round(S.setup.release / 2))); S.setup.ms.push({id:mid, name:d.mspreset, m:mm}); if(S.setup.ms.length === 1) S.setup.checkAt = mid; return reSetup('[data-msm="'+mid+'"]'); }
  if(d.msdel){ S.setup.ms = S.setup.ms.filter(function(m){ return m.id !== d.msdel; }); if(S.setup.checkAt === d.msdel) S.setup.checkAt = S.setup.ms[0] ? S.setup.ms[0].id : 'before'; return reSetup('[data-mspreset]'); }
  if(d.plat){ var ps = S.setup.platforms, pi = ps.indexOf(d.plat); if(pi >= 0) ps.splice(pi, 1); else { ps.push(d.plat); if(d.plat === 'unknown') S.setup.platforms = ['unknown']; else S.setup.platforms = ps.filter(function(x){ return x !== 'unknown'; }); } if(!S.setup.platforms.length) S.setup.platforms = ['unknown']; return reSetup('[data-plat="'+d.plat+'"]'); }
  if(d.have){ var hv = S.setup.have, hx = hv.indexOf(d.have); S.setup.havePlan = S.setup.havePlan || {}; if(hx >= 0) hv.splice(hx, 1); else { hv.push(d.have); if(!S.setup.havePlan[d.have] && TOOLS[d.have].plans) S.setup.havePlan[d.have] = TOOLS[d.have].def; } return reSetup('[data-have="'+d.have+'"]'); }
  if(d.ipend){ var ip = d.ipend.split(':'), im0 = S.intake[+ip[0]]; if(im0 && im0.pend && !im0.done){ im0.done = true; if(ip[1] === '1'){ makeGroups(S.setup, im0.pend); S.assetOpen = 'obj'; S.aflash = ['obj']; S.intake.push({who:'bot', text:im0.pend.map(function(g){ return '‘' + g.name + '’'; }).join(', ') + ' 묶음을 만들었어요.'}); } else S.intake.push({who:'bot', text:'만들지 않았어요. 이미 있는 묶음을 말씀하신 거라면 “적은 8종이야”처럼 묶음 이름과 함께 말해 주세요.'}); } return reSetup('#intakeIn'); }
  if(d.havedel){ S.setup.haveCustom = (S.setup.haveCustom || []).filter(function(n){ return n !== d.havedel; }); return reSetup('#inHave'); }
  if(d.act === 'have-add'){ var hn = ($('inHave').value || '').trim(); if(!hn){ $('inHave').focus(); return; } var r0 = applyEdits(hn + ' 써', S.setup, 'intake'); if(!r0.length) toast('이미 들어 있는 도구예요.'); return reSetup('#inHave'); }
  if(d.ai){ S.setup.ai[d.ai] = !S.setup.ai[d.ai]; return reSetup('[data-ai="'+d.ai+'"]'); }
  if(d.aipreset){ var ap = d.aipreset; Object.keys(AIKEYS).forEach(function(k){ S.setup.ai[k] = ap === 'all' ? true : ap === 'none' ? false : (k === 'code' || k === 'text'); }); return reSetup('[data-aipreset="'+ap+'"]'); }
  if(d.isay){ return intakeSay(d.isay); }
  if(d.acat && S.view === 'setup'){ var ak = d.acat, wasOpen = S.assetOpen == null ? 'obj' : S.assetOpen; S.setup.aseen = S.setup.aseen || {}; if(wasOpen) S.setup.aseen[wasOpen] = true; S.assetOpen = wasOpen === ak ? '' : ak; if(S.assetOpen) S.setup.aseen[ak] = true; render(); var ah = document.querySelector('[data-acat="'+ak+'"].ach'); if(ah){ ah.focus({preventScroll:true}); var sec = $('ac-' + ak); if(sec) sec.scrollIntoView({block:'nearest', behavior:reduceMotion ? 'auto' : 'smooth'}); } persist(); return; }
  if(d.ifill){ var ifi = $('intakeIn'); if(ifi){ ifi.value = d.ifill; ifi.focus(); ifi.scrollIntoView({block:'nearest'}); } return; }
  if(d.act === 'tok-info'){ return tokSheet(); }
  if(d.unlock){ var uw = d.unlock; if(spendTok(TOK_WORK, uw, '열었어요.')){ renderSidebar(); openWork(uw); if(S.view === 'tool') { var ly = $('layer').innerHTML; renderToolPage(); } } return; }
  if(d.unlockrev){ if(spendTok(TOK_REV, 'rev:' + d.unlockrev, '후기를 열었어요.')) render(); return; }
  if(d.show){ S.showId = d.show; renderResults(); var sb = document.querySelector('[data-show="'+d.show+'"]'); if(sb) sb.focus({preventScroll:true}); persist(); return; }
  if(d.wiz){ S.wiz = +d.wiz; if(S.wiz === 2){ S.setup.aseen = S.setup.aseen || {}; if(S.assetOpen == null || S.assetOpen === 'obj'){ S.assetOpen = 'obj'; S.setup.aseen.obj = true; } } if(S.wiz === 2) S.setup.invSeen = true; render(); var h = $('wzT'); if(h){ h.focus({preventScroll:true}); h.scrollIntoView({block:'nearest'}); } return; }
  if(d.act === 'make'){
    if(S.draft && !S.editingQ && !S.condMode){ return confirmSheet('작성 중인 견적이 있어요', '‘'+esc(S.draft.name)+'’ 견적을 아직 저장하지 않았어요. 새로 짜면 지금 견적과 도우미 대화가 사라져요.', '새로 짜기', 'make-force', true); }
    return makeNow();
  }
  if(d.act === 'make-force'){ closeLayer(); return makeNow(); }
  /* 결과 */
  if(d.cond && S.draft){ return condSheet(d.cond); }
  if(d.csg && CS){ csGrab(); var gi0 = CS.genres.indexOf(d.csg); if(gi0 >= 0){ if(CS.genres.length > 1) CS.genres.splice(gi0, 1); } else CS.genres.push(d.csg); return csRender('[data-csg="'+d.csg+'"]'); }
  if(d.csty && CS){ csGrab(); var ci0 = CS.styles.indexOf(d.csty); if(ci0 >= 0){ if(CS.styles.length > 1) CS.styles.splice(ci0, 1); } else CS.styles.push(d.csty); CS.style = CS.styles[0]; return csRender('[data-csty="'+d.csty+'"]'); }
  if(d.csvw && CS){ csGrab(); var cv0 = CS.views.indexOf(d.csvw); if(cv0 >= 0){ if(CS.views.length > 1) CS.views.splice(cv0, 1); } else CS.views.push(d.csvw); CS.view = CS.views[0]; CS.viewTouched = true; return csRender('[data-csvw="'+d.csvw+'"]'); }
  if(d.cs && CS){ csGrab(); var cv = d.val; if(['budget', 'onceBudget', 'release'].indexOf(d.cs) >= 0) cv = +cv; CS[d.cs] = cv; var cnote = ''; if(d.cs === 'style' || d.cs === 'view'){ if(d.cs === 'view') CS.viewTouched = true; cnote = syncStyleView(CS, d.cs); } csRender('[data-cs="'+d.cs+'"][data-val="'+d.val+'"]'); if(cnote) toast(cnote); return; }
  if(d.csh && CS){ csGrab(); var hi0 = CS.have.indexOf(d.csh); CS.havePlan = CS.havePlan || {}; if(hi0 >= 0) CS.have.splice(hi0, 1); else { CS.have.push(d.csh); if(TOOLS[d.csh].plans && !CS.havePlan[d.csh]) CS.havePlan[d.csh] = TOOLS[d.csh].def; } return csRender('[data-csh="'+d.csh+'"]'); }
  if(d.csf && CS){ csGrab(); CS.inv.feat = CS.inv.feat || {}; if(d.csf === 'i18n') CS.inv.feat.i18n = CS.inv.feat.i18n > 0 ? 0 : 2; else CS.inv.feat[d.csf] = !CS.inv.feat[d.csf]; return csRender('[data-csf="'+d.csf+'"]'); }
  if(d.csai && CS){ csGrab(); CS.ai[d.csai] = !CS.ai[d.csai]; return csRender('[data-csai="'+d.csai+'"]'); }
  if(d.act === 'cs-apply' && CS){ return csApply(); }
  if(d.nq && S.draft){ var nqp = d.nq.split('|'), nqk = nqp[0], nqv = nqp.slice(1).join('|'), nqq = nqList(S.draft).filter(function(x){ return x.k === nqk; })[0]; if(!nqq) return;
    if(nqq.multi){ var sl = S.draft.nqSel[nqk] = S.draft.nqSel[nqk] || [], si = sl.indexOf(nqv); if(si >= 0) sl.splice(si, 1); else sl.push(nqv); renderResults(); var fq = document.querySelector('[data-nq="'+d.nq+'"]'); if(fq) fq.focus({preventScroll:true}); return; }
    var lbl = (nqq.chips.filter(function(c){ return String(c[0]) === nqv; })[0] || [nqv, nqv])[1]; nqAnswer(nqk, nqv, lbl); var fn = document.querySelector('.nq button'); if(fn) fn.focus({preventScroll:true}); return; }
  if(d.nqdone && S.draft){ var ndk = d.nqdone; nqMulti(ndk, (S.draft.nqSel[ndk] || []).slice()); var fn2 = document.querySelector('.nq button'); if(fn2) fn2.focus({preventScroll:true}); return; }
  if(d.nqnone && S.draft){ var nnq = nqList(S.draft).filter(function(x){ return x.k === d.nqnone; })[0]; S.draft.asked[d.nqnone] = true; S.draft.nqSel[d.nqnone] = []; S.draft.chat.push({who:'me', text:esc(nnq ? nnq.none : '없어요')}); S.draft.chat.push({who:'bot', text:'알겠어요. 지금 견적 그대로 둘게요.'}); renderResults(); persist(); var fn3 = document.querySelector('.nq button'); if(fn3) fn3.focus({preventScroll:true}); return; }
  if(d.nqskip && S.draft){ S.draft.asked[d.nqskip] = true; renderResults(); persist(); var fn4 = document.querySelector('.nq button'); if(fn4) fn4.focus({preventScroll:true}); return; }
  if(d.feat && S.draft){ var fk = d.feat, fon; return editSetup(function(s){ s.inv.feat = s.inv.feat || {}; if(fk === 'i18n'){ s.inv.feat.i18n = s.inv.feat.i18n > 0 ? 0 : 2; fon = s.inv.feat.i18n > 0; } else { s.inv.feat[fk] = !s.inv.feat[fk]; fon = s.inv.feat[fk]; } S.draft.asked.feat = true; }, FEATS[fk][0] + (fon === false ? '을 뺐어요.' : '을 넣었어요.').replace(/^을/, eul(FEATS[fk][0]))); }
  if(d.prio && S.draft){ S.prio = d.prio; var cP = S.draft.quotes.map(function(x){ return calc(x.picks, S.draft.qty, S.draft.buy, S.draft.setup); }), rP = recommend(cP, S.draft.setup); if(rP >= 0) S.draft.sel = rP; S.draft.chg = {}; renderResults(); persist(); var fpr = document.querySelector('[data-prio="'+d.prio+'"]'); if(fpr) fpr.focus({preventScroll:true}); announce('‘' + PRIO_SEL[d.prio] + '’ 기준으로 ' + (rP >= 0 ? '견적 ' + (rP + 1) + NJ[rP + 1].eul + ' 추천해요.' : '추천할 견적이 없어요.')); return; }
  if(d.act === 'hourval' && S.draft){ return hourSheet(); }
  if(d.hv){ var hi = $('hvIn'); if(hi) hi.value = d.hv; el.parentNode.querySelectorAll('[data-hv]').forEach(function(b){ b.setAttribute('aria-pressed', b === el); }); return; }
  if(d.showfold != null && S.draft){ S.draft.showFold[+d.showfold] = true; renderResults(); persist(); var fsq = document.querySelector('.qc[data-q="'+d.showfold+'"]'); if(fsq) fsq.focus({preventScroll:true}); return; }
  if(d.act === 'detail' && S.draft){ S.detailOpen = !S.detailOpen; renderResults(); persist(); var fdt = document.querySelector('[data-act="detail"]'); if(fdt) fdt.focus({preventScroll:true}); return; }
  if(d.act === 'edit-cond'){ S.wiz = 1; S.condMode = true; S.setup = clone(S.draft.setup); return go('setup'); }
  if(d.goq != null && S.draft){ S.draft.sel = +d.goq; S.draft.chg = {}; renderResults(); persist(); var gc = document.querySelector('.qc[data-q="'+d.goq+'"]'); if(gc && window.innerWidth > 760){ gc.focus({preventScroll:true}); gc.scrollIntoView({block:'nearest', behavior:smooth()}); } return; }
  if(el.classList.contains('qc') || (d.q != null && S.view === 'results' && S.draft)){ var fq = d.q; S.draft.sel = +d.q; setTimeout(function(){ var b = document.querySelector('.cm-h[data-q="'+fq+'"], .cm-tabs [data-q="'+fq+'"]'); if(b && document.activeElement === document.body) b.focus({preventScroll:true}); }, 0); S.draft.chg = {}; renderResults(); persist(); return; }
  if(d.act === 'reset-q'){ var qq = curQ(), snap0 = snapQ(qq); restoreQ(qq, JSON.stringify({picks:clone(qq.base), locks:{}})); S.draft.chg = {}; renderResults(); persist(); return toast(qq.savedBase ? '저장한 견적으로 되돌렸어요.' : '처음 견적으로 되돌렸어요.', '취소', function(){ restoreQ(qq, snap0); renderResults(); persist(); }); }
  if(d.unlockrow){ var qu = curQ(); delete qu.locks[d.unlockrow]; renderResults(); persist(); var ub = document.querySelector('[data-open="'+d.unlockrow+'"]'); if(ub) ub.focus({preventScroll:true}); return toast(RN(ROW[d.unlockrow]) + ' 도우미에게 맡겼어요. 이제 도우미가 다시 짜거나 예산을 맞출 때 이 줄도 바꿀 수 있어요.'); }
  if(d.subm){ var sm = d.subm.split(':'), stS = S.draft.setup, cS = calc(curQ().picks, S.draft.qty, S.draft.buy, stS), cur = cS.subMonths[sm[0]] || 1, nv = Math.max(1, Math.min(stS.months, cur + (+sm[1]))); stS.subOv = stS.subOv || {}; if(nv === cS.subAuto[sm[0]]) delete stS.subOv[sm[0]]; else stS.subOv[sm[0]] = nv; refreshTotals(); persist(); return; }
  if(d.act === 'cond-all' && S.draft){ S.condAll = !S.condAll; renderResults(); var ca = document.querySelector('[data-act="cond-all"]'); if(ca) ca.focus({preventScroll:true}); persist(); return; }
  if(d.cellq && S.draft){ var cq = d.cellq.split('|'); S.draft.sel = +cq[0]; S.draft.open = cq[1]; S.listOpen = true; renderResults(); persist(); var cr = $('row-' + cq[1]); if(cr) cr.scrollIntoView({behavior:smooth(), block:'center'}); return; }
  if(d.basep){ var bk = d.basep; openLayer('<div class="modal sheet" role="dialog" aria-modal="true" aria-labelledby="bpT">'+mh('bpT', (GRPN[bk] || '') + ' 기준 프롬프트')+'<p class="note">이 줄의 예시 그림과 소리는 모든 도구에 이 프롬프트를 똑같이 넣어 만들어요. 그래서 같은 줄끼리 비교할 수 있어요.</p><div class="prompt"><div><span class="mono">'+esc(BASEP[bk])+'</span></div><button type="button" class="btn sm sec" data-copyp="'+esc(BASEP[bk])+'">복사</button></div><div class="row-acts end"><button type="button" class="btn" data-act="close-layer">닫기</button></div></div>'); return; }
  if(d.open){ S.listOpen = true; S.draft.open = S.draft.open === d.open ? null : d.open; renderResults(); persist(); var rw = $('row-' + d.open); if(rw && S.draft.open) rw.scrollIntoView({behavior:smooth(), block:'nearest'}); return; }
  if(d.rtab){ var rt = d.rtab.split(':'); S.draft.tab[rt[0]] = rt[1]; renderResults(); persist(); return; }
  if(d.swap){
    var qi = S.draft.sel, q = curQ(), stW = S.draft.setup, before = calc(q.picks, S.draft.qty, S.draft.buy, stW), rid = d.swap, prev = q.picks[rid];
    if(prev === d.t) return;
    var snap = snapQ(q);
    q.picks[rid] = d.t; q.locks[rid] = true; S.draft.chg = {}; S.draft.chg[rid] = true;
    var after = calc(q.picks, S.draft.qty, S.draft.buy, stW), dt = diffText(before, after), over = after.monthly > stW.budget && after.monthly > before.monthly ? ' 예산을 월 ' + won(after.monthly - stW.budget) + ' 넘어요.' : '';
    if(q.cap != null && after.monthly > q.cap){ over += ' 이 견적에 정해 두신 월 ' + manwon(q.cap) + ' 상한은 풀었어요.'; q.cap = null; }
    var nmS = RN(ROW[rid]);
    S.draft.chat.push({who:'bot', text:nmS + eun(nmS) + ' ' + toPhrase(d.t) + ' 바꿨어요. 직접 고르신 방법이라 ‘직접 고름’으로 표시해 둘게요.' + over, chg:dt, snap:snap, qi:qi});
    var mi = S.draft.chat.length - 1;
    renderResults(); persist();
    return toast(nmS + eun(nmS) + ' ' + toPhrase(d.t) + ' 바꿨어요. ' + dt + '.' + over, '되돌리기', function(){ undoMsg(mi); persist(); });
  }
  if(d.undo){ undoMsg(+d.undo); persist(); var ci1 = $('chatIn'); if(ci1 && S.chatOpen) ci1.focus({preventScroll:true}); return; }
  if(d.askyes){ var mm = S.draft.chat[+d.askyes]; if(mm && mm.ask){ var a = mm.ask.act, ai = mm.qi != null ? mm.qi : S.draft.sel, qx = S.draft.quotes[ai], stA = S.draft.setup, b0 = calc(qx.picks, S.draft.qty, S.draft.buy, stA), sn = snapQ(qx), txtA = '';
      S.draft.chg = {}; mm.done = true;
      if(a.newGroups){ var invB = JSON.stringify(stA.inv); makeGroups(stA, a.newGroups); ensurePicks(S.draft); S.draft.chat.push({who:'bot', text:a.newGroups.map(function(g){ return '‘' + g.name + '’'; }).join(', ') + ' 묶음을 만들고 세 견적에 함께 반영했어요.', chg:'에셋 목록 바뀜 · ' + diffText(b0, calc(qx.picks, S.draft.qty, S.draft.buy, stA)), snap:sn, invSnap:invB, qi:ai}); renderResults(); persist(); return; }
      if(a.picks){ ROWS.forEach(function(r){ if(qx.picks[r.id] !== a.picks[r.id] && !qx.locks[r.id]){ qx.picks[r.id] = a.picks[r.id]; S.draft.chg[r.id] = true; } }); txtA = '말씀하신 대로 다른 조합으로 바꿨어요.'; }
      else { qx.picks[a.row] = a.t; qx.locks[a.row] = true; S.draft.chg[a.row] = true; var nA = RN(ROW[a.row]); if(a.uncap){ txtA = '월 ' + manwon(qx.cap) + ' 상한을 풀고 ' + nA + eul(nA) + ' ' + toPhrase(a.t) + ' 바꿨어요.'; qx.cap = null; } else txtA = '예산을 넘지만 ' + nA + eul(nA) + ' ' + toPhrase(a.t) + ' 바꿨어요.'; }
      S.draft.sel = ai; S.draft.chat.push({who:'bot', text:txtA, chg:diffText(b0, calc(qx.picks, S.draft.qty, S.draft.buy, stA)), snap:sn, qi:ai}); renderResults(); persist(); } return; }
  if(d.askno){ var mn = S.draft.chat[+d.askno]; if(mn){ mn.done = true; S.draft.chat.push({who:'bot', text:'그대로 둘게요.'}); renderResults(); persist(); } return; }
  if(d.say){ return assist(d.say); }
  if(d.rsys && S.draft){ var inv1 = S.draft.setup.inv; if(inv1.sys[d.rsys] != null) inv1.sys[d.rsys] = !inv1.sys[d.rsys]; else inv1.sysx.forEach(function(x){ if(x.id === d.rsys) x.on = x.on === false; }); ensurePicks(S.draft); renderResults(); persist(); return; }
  if(d.rscene && S.draft){ S.draft.setup.inv.scene.mode = d.rscene; ensurePicks(S.draft); renderResults(); persist(); return; }
  if(d.cutqty && S.draft){ var cq = d.cutqty.split(':'), crow = cq[0], prevQ = S.draft.qty[crow]; S.draft.qty[crow] = +cq[1]; S.draft.chg = {}; S.draft.chg[crow] = true; renderResults(); persist(); var nmq = RN(ROW[crow], S.draft.setup); return toast(nmq + eul(nmq) + ' ' + cq[1] + RU(ROW[crow], S.draft.setup) + roStr(cq[1] + RU(ROW[crow], S.draft.setup)) + ' 줄였어요. 세 견적에 함께 적용했어요.', '되돌리기', function(){ S.draft.qty[crow] = prevQ; renderResults(); persist(); }); }
  if(d.reviews){ return openReviews(d.reviews); }
  if(d.lb){ return openLightbox(d.lb); }
  if(d.lbnav){ if(!LB) return; var r2 = ROW[LB.r], ni = LB.i + (+d.lbnav); if(ni < 0 || ni >= r2.shots[LB.t].length) return; return openLightbox(LB.r + ':' + LB.t + ':' + ni); }
  if(d.act === 'chat-toggle'){ return setChat(!S.chatOpen, el); }
  if(d.act === 'save'){ return saveSheet(false); }
  if(d.act === 'save-new'){ return saveSheet(true); }
  if(d.act === 'save-over'){
    var Qc = getQ(S.editingQ), cqc = curQ(), nRows = ROWS.filter(function(r){ return Qc.picks[r.id] !== cqc.picks[r.id] || Qc.qty[r.id] !== S.draft.qty[r.id]; }).length, cc = calc(cqc.picks, S.draft.qty, S.draft.buy, S.draft.setup);
    return confirmSheet('‘'+esc(Qc.name)+'’ 견적에 덮어쓸까요?', '바뀐 줄 '+nRows+'개 · 월 추가 비용 '+won(cc.monthly)+(cc.once ? ' · 한 번 드는 돈 '+won(cc.once) : '')+'. 작업 기록은 그대로 남고, 스토어 AI 고지문은 기록으로 다시 계산해요.', '덮어쓰기', 'save-over-yes');
  }
  if(d.act === 'save-over-yes'){
    closeLayer();
    var Q0 = getQ(S.editingQ), cq0 = curQ(), changedRows = 0;
    ROWS.forEach(function(r){ if(Q0.picks[r.id] !== cq0.picks[r.id] || Q0.qty[r.id] !== S.draft.qty[r.id]) changedRows++; });
    var stN = S.draft.setup, condChanged = JSON.stringify(Q0.setup) !== JSON.stringify(stN) || Q0.n !== cq0.n || JSON.stringify(Q0.buy || {}) !== JSON.stringify(S.draft.buy);
    Q0.picks = clone(cq0.picks); Q0.qty = clone(S.draft.qty); Q0.buy = clone(S.draft.buy); Q0.n = cq0.n; Q0.setup = clone(stN); Q0.setup.platforms = clone(Q0.platforms); saveDraftToQuote(Q0, S.draft);
    if(changedRows || condChanged) Q0.updated = TODAY;
    var orphan = (Q0.logs || []).filter(function(l){ return !rowById(Q0, l.row); }).length;
    var id0 = S.editingQ; S.editingQ = null; S.draft = null; go('quote', {q:id0, step:1});
    return toast(changedRows ? '고친 내용을 저장했어요. 바뀐 줄은 ' + changedRows + '개예요.' + (orphan ? ' 견적에서 빠진 에셋의 기록 ' + orphan + '건은 보관만 해요.' : '') : '고친 내용을 저장했어요.');
  }
  /* 저장한 견적서 */
  if(d.qstep){ S.qStep = +d.qstep; render(); window.scrollTo({top:0}); return; }
  if(d.act === 'edit-quote'){
    var qid = S.activeQ;
    if(S.draft && S.editingQ === qid) return go('results');
    if(S.draft && (!S.editingQ || draftDirty())){ S.pendingAct = 'edit:' + qid; return confirmSheet(S.editingQ ? '고치던 다른 게임 견적이 있어요' : '작성 중인 견적이 있어요', '‘'+esc(S.draft.name)+'’ '+(S.editingQ ? '견적을 고친 내용을' : '견적을')+' 아직 저장하지 않았어요. 이 게임의 견적을 고치면 그 내용이 사라져요.', '버리고 이 게임 견적 고치기', 'pend-yes', true, '그대로 두기'); }
    S.draft = null; S.editingQ = null; return editQuote(qid); }
  if(d.act === 'qmenu'){ return qMenu(); }
  if(d.act === 'del-ask'){ var qd = getQ(S.activeQ); return confirmSheet('‘'+esc(qd.name)+'’ 게임을 삭제할까요?', '작업 기록과 스토어 AI 고지문도 함께 지워져요. 삭제한 직후에는 화면 아래 안내에서 바로 되돌릴 수 있어요.', '삭제하기', 'del-yes', true); }
  if(d.act === 'del-yes'){
    var Qd = getQ(S.activeQ), idxD = S.quotes.indexOf(Qd), keepD = clone(Qd), wasNew = S.newQ === Qd.id;
    if(wasNew){ S.newQ = null; S.guide = false; } if(S.editingQ === Qd.id){ S.editingQ = null; S.draft = null; }
    S.quotes.splice(idxD, 1); closeLayer(); go('home');
    return toast('‘' + keepD.name + '’ 게임을 삭제했어요.', '되돌리기', function(){ S.quotes.splice(idxD, 0, keepD); go('quote', {q:keepD.id}); toast('삭제를 취소했어요.'); });
  }
  /* 저장 시트 */
  if(d.svplat && SV){ svGrab(); var sp0 = SV.plats, spi = sp0.indexOf(d.svplat); if(spi >= 0) sp0.splice(spi, 1); else { sp0.push(d.svplat); SV.plats = d.svplat === 'unknown' ? ['unknown'] : sp0.filter(function(x){ return x !== 'unknown'; }); } svRender('[data-svplat="'+d.svplat+'"]'); return; }
  if(d.svms && SV){ svGrab(); var smid = 'm' + Date.now().toString(36); SV.ms.push({id:smid, name:d.svms, m:Math.max(0, Math.min(S.draft.setup.release - 1, Math.round(S.draft.setup.release / 2)))}); svRender('[data-svmsname="'+smid+'"]'); return; }
  if(d.svmsdel && SV){ svGrab(); SV.ms = SV.ms.filter(function(m){ return m.id !== d.svmsdel; }); svRender('[data-svms]'); return; }
  /* 작업 기록 시트 */
  if(LF && $('logF')){
    function lfGrab(){ var n = $('lfN'); if(n) LF.n = Math.max(1, parseInt(n.value, 10) || 1); var nm = $('lfName'); if(nm) LF.cname = nm.value; LF.err = ''; }
    if(d.lftool){ lfGrab(); if(LF.tool !== d.lftool){ LF.tool = d.lftool; LF.how = null; LF.paid = null; LF.mark = null; LF.cai = null; } logSheet(); var ft = $('layer').querySelector('[data-lftool="'+d.lftool+'"]'); if(ft) ft.focus(); return; }
    if(d.lfhow){ lfGrab(); LF.how = d.lfhow; logSheet(); var fh = $('layer').querySelector('[data-lfhow="'+d.lfhow+'"]'); if(fh) fh.focus(); return; }
    if(d.lfmark){ lfGrab(); LF.mark = d.lfmark; logSheet(); var fm3 = $('layer').querySelector('[data-lfmark="'+d.lfmark+'"]'); if(fm3) fm3.focus(); return; }
    if(d.lfpaid){ lfGrab(); LF.paid = d.lfpaid === '1'; logSheet(); var fp = $('layer').querySelector('[data-lfpaid="'+d.lfpaid+'"]'); if(fp) fp.focus(); return; }
    if(d.lfcai){ lfGrab(); LF.cai = d.lfcai === '1'; LF.how = null; logSheet(); var fc = $('layer').querySelector('[data-lfcai="'+d.lfcai+'"]'); if(fc) fc.focus(); return; }
  }
  var Q = S.view === 'quote' ? getQ(S.activeQ) : null;
  if(Q){
    var X = Q.disc = Q.disc || {}; X.ratio = X.ratio || {}; X.drop = X.drop || {}; X.rchk = X.rchk || {};
    if(d.logadd != null){ return logOpen(Q.id, d.logadd || null); }
    if(d.logdel){ var li = Q.logs.map(function(l){ return l.id; }).indexOf(d.logdel); if(li < 0) return; var gone = Q.logs.splice(li, 1)[0], gr = rowById(Q, gone.row); render(); var nx = document.querySelector('[data-logdel]'); if(nx) nx.focus({preventScroll:true}); return toast((gr ? RN(gr) + ' ' : '') + gone.n + (gr ? RU(gr) : '개') + ' 기록을 지웠어요.', '되돌리기', function(){ Q.logs.splice(li, 0, gone); render(); }); }
    if(d.act === 'csv'){ return downloadCSV(Q); }
    if(d.act === 'qms-add'){ Q.ms = Q.ms || []; var nmid = 'm' + Date.now().toString(36); Q.ms.push({id:nmid, name:$('qmsName').value, m:+$('qmsM').value}); render(); var fa = document.querySelector('[data-act="qms-add"]'); if(fa) fa.focus({preventScroll:true}); return toast('‘' + Q.ms[Q.ms.length - 1].name + '’ 일정을 넣었어요. 그달에 알려 드려요.'); }
    if(d.qmsdel){ var mi0 = (Q.ms || []).map(function(m){ return m.id; }).indexOf(d.qmsdel); if(mi0 < 0) return; var gm = Q.ms.splice(mi0, 1)[0]; render(); return toast('‘' + gm.name + '’ 일정을 지웠어요.', '되돌리기', function(){ Q.ms.splice(mi0, 0, gm); render(); }); }
    if(d.dplat){ var pl = Q.platforms = Q.platforms || [], pj = pl.indexOf(d.dplat); if(pj >= 0) pl.splice(pj, 1); else { pl.push(d.dplat); Q.platforms = pl.filter(function(x){ return x !== 'unknown'; }); } Q.setup.platforms = clone(Q.platforms); return render(); }
    if(d.ddrop){ if(X.drop[d.ddrop]) delete X.drop[d.ddrop]; else X.drop[d.ddrop] = true; X.ack = false; render(); var fd = document.querySelector('[data-ddrop="'+d.ddrop+'"]') || document.querySelector('[data-logadd="'+d.ddrop+'"]'); if(fd) fd.focus({preventScroll:true}); return; }
    if(d.dmark){ var mk = d.dmark.split('|'); Q.logs.forEach(function(l){ if(l.row === mk[0] && l.tool === mk[1] && l.how === 'pack' && !l.mark) l.mark = mk[2]; }); X.ack = false; render(); return toast('기록에 팩의 AI 표시를 남겼어요.'); }
    if(d.dpaid){ var pp = d.dpaid.split('|'); Q.logs.forEach(function(l){ if(l.tool === pp[0] && l.paid == null) l.paid = pp[1] === '1'; }); render(); return; }
    if(d.dlive){ if(X.live !== d.dlive){ X.live = d.dlive; X.ack = false; } render(); var fl = document.querySelector('[data-dlive="'+d.dlive+'"]'); if(fl) fl.focus({preventScroll:true}); return; }
    if(d.dratio){ var rr = d.dratio.split('|'); X.ratio[rr[0]] = rr[1]; X.ack = false; render(); var fr = document.querySelector('[data-dratio="'+d.dratio+'"]'); if(fr) fr.focus({preventScroll:true}); return; }
    if(d.drchk){ X.rchk[d.drchk] = TODAY; render(); return toast(tName(d.drchk) + ' 라이선스를 읽었다고 남겼어요.'); }
    if(d.act === 'src'){ return toast('도구의 약관 원문 페이지를 새 탭에서 열어요. (시안에서는 열리지 않아요)'); }
    if(d.act === 'dcopy'){
      var DM = discModel(Q); if(!DM.canCopy) return;
      var done = function(){ X.copied = true; X.sig = DM.sig; X.copiedAt = TODAY; render(); toast(DM.aiN ? '영어 문구를 복사했어요. 스팀웍스 콘텐츠 설문에 붙여 넣어 주세요.' : '안내대로 골랐다고 남겼어요.'); };
      if(!DM.aiN) return done();
      return copy(DM.sents.map(function(x){ return x.en; }).join('\n'), done);
    }
  }
}
function makeNow(){
  var ld = document.createElement('div'); ld.className = 'loading'; ld.setAttribute('role', 'status');
  ld.innerHTML = '<div class="box"><div class="spin" aria-hidden="true"></div><b>견적을 짜고 있어요</b><div class="lsteps"><span class="done">에셋 '+rowsOf(syncSt(S.setup)).length+'줄 정리</span><span id="ls2">도구별 가격·약관·평가 확인</span><span id="ls3">예산 안에서 견적 3개 구성</span></div></div>';
  document.body.appendChild(ld);
  setTimeout(function(){ var a = $('ls2'); if(a) a.className = 'done'; }, reduceMotion ? 0 : 400);
  setTimeout(function(){ var a = $('ls3'); if(a) a.className = 'done'; }, reduceMotion ? 0 : 800);
  setTimeout(function(){ ld.remove(); var keepEdit = S.editingQ, carry = (S.condMode && S.draft) ? S.draft : null; makeDraft(carry); S.condMode = false; if(keepEdit){ S.draft.name = getQ(keepEdit).name; } go('results'); }, reduceMotion ? 150 : 1100);
}
document.addEventListener('toggle', function(e){ if(!e.target.matches) return; if(e.target.matches('details.alist')) S.listOpen = e.target.open; if(e.target.matches('details.svmore') && SV) SV.more = e.target.open; if(e.target.matches('details.more')) S.moreOpen = e.target.open; if(e.target.matches('details.quiet')){ S.quietOpen = e.target.open; persist(); } if(e.target.matches('details.paste')) S.pasteOpen = e.target.open; }, true);
/* 질문 화면의 숫자 입력: [최소, 최대, 저장 함수, 비우면 자동, 에셋 목록을 고친 것인지] */
var SETUP_NUM = {
  inRelease:[1, 60, function(s, v){ s.release = v; }], inWeekly:[1, 80, function(s, v){ s.weekly = v; }], inBudget:[0, 1000000, function(s, v){ s.budget = v; }], inOnce:[0, 10000000, function(s, v){ s.onceBudget = v; }],
  inScene:[0, 300, function(s, v){ s.inv.scene.n = v; }, false, true], inUI:[0, 500, function(s, v){ s.inv.ui = v; }, false, true], inIllus:[0, 300, function(s, v){ s.inv.illus = v; }, false, true],
  inSfx:[0, 500, function(s, v){ s.inv.sfx = v; }, true, true], inBgm:[0, 100, function(s, v){ s.inv.bgm = v; }, false, true], inText:[0, 500, function(s, v){ s.inv.text = v; }, false, true]
};
document.addEventListener('change', function(e){
  var t = e.target, d = t.dataset, Q = S.view === 'quote' ? getQ(S.activeQ) : null;
  if(d.haveplan){ S.setup.havePlan = S.setup.havePlan || {}; S.setup.havePlan[d.haveplan] = t.value; persist(); return; }
  if(d.checkat){ S.setup.checkAt = d.checkat; syncSt(S.setup); persist(); return; }
  if(S.view === 'setup' && (t.id in SETUP_NUM || d.objn || d.obja || d.msm || d.objname || d.msname)){ return laterRender(); }
  if(d.objsty || d.objvw){ S.setup.inv.obj.forEach(function(g){ if(g.id === (d.objsty || d.objvw)){ if(d.objsty) g.style = t.value; else g.view = t.value; } }); S.setup.invTouched = true; persist(); return laterRender(); }
  if(d.gsty){ var iv = S.setup.inv; if(d.gsty === 'scene') iv.scene.style = t.value; else iv[d.gsty + 'Style'] = t.value; persist(); return laterRender(); }
  if((d.rsty || d.rvw) && S.draft){ var rid = d.rsty || d.rvw, rr0 = ROW[rid], val = t.value; return editSetup(function(s){ var iv2 = s.inv; if(rr0.cat === 'obj') iv2.obj.forEach(function(g){ if(g.id === rid){ if(d.rsty) g.style = val; else g.view = val; } }); else if(rid === 'scene') iv2.scene.style = val; else if(rid === 'ui') iv2.uiStyle = val; else if(rid === 'illus') iv2.illusStyle = val; }, RN(rr0) + eul(RN(rr0)) + ' ' + (d.rsty ? STYLES[val].name : VIEWS[val].name) + roStr(d.rsty ? STYLES[val].name : VIEWS[val].name) + ' 바꿔 다시 짰어요.'); }
  if(t.id === 'lfRow' && LF){ var lq = getQ(LF.q); LF.row = t.value; LF.tool = lq.picks[t.value]; LF.n = Math.max(1, lq.qty[t.value] - loggedN(lq, t.value)); LF.how = null; LF.paid = null; LF.mark = null; LF.cai = null; LF.err = ''; logSheet(); var lr = $('lfRow'); if(lr) lr.focus(); return; }
  if(t.id === 'svRemind' && SV){ SV.remind = t.checked; var se = $('svEmail'); if(se){ se.disabled = !t.checked; if(!t.checked){ se.checked = false; SV.email = false; } } return; }
  if(t.id === 'svEmail' && SV){ SV.email = t.checked; return; }
  if(t.id === 'svStore' && SV){ SV.store = +t.value; return; }
  if(d.svmsm && SV){ SV.ms.forEach(function(m){ if(m.id === d.svmsm) m.m = +t.value; }); return; }
  if(Q && d.act === 'storeat'){ Q.storeAt = +t.value; render(); var sa = document.querySelector('[data-act="storeat"]'); if(sa) sa.focus({preventScroll:true}); return toast('스토어 페이지 공개를 ' + storeLabelOf(Q) + '로 바꿨어요.'); }
  if(Q && d.act === 'qremind'){ Q.remind = t.checked; if(!t.checked) Q.email = false; render(); var qr = document.querySelector('[data-act="qremind"]'); if(qr) qr.focus({preventScroll:true}); return; }
  if(Q && d.act === 'qemail'){ Q.email = t.checked; persist(); return; }
  if(Q && d.act === 'dnames'){ Q.disc.names = t.checked; Q.disc.ack = false; render(); var dn = document.querySelector('[data-act="dnames"]'); if(dn) dn.focus({preventScroll:true}); return; }
  if(Q && d.act === 'dack'){ Q.disc.ack = t.checked; Q.disc.ackSig = t.checked ? discModel(Q).sig : ''; render(); var da = document.querySelector('[data-act="dack"]'); if(da) da.focus({preventScroll:true}); return; }
  if(d.act === 'noai-view' && S.draft){ var dv = S.draft, stv = dv.setup, nmv = dv.name, on = t.checked;
    if(on){ dv.aiBackup = clone(stv.ai); Object.keys(stv.ai).forEach(function(k){ stv.ai[k] = false; }); } else { if(dv.aiBackup) stv.ai = clone(dv.aiBackup); dv.aiBackup = null; }
    S.setup = clone(stv); makeDraft(dv); S.draft.name = nmv; var lmv = S.draft.chat[S.draft.chat.length - 1]; lmv.text = lmv.text.replace('바뀐 조건으로', on ? 'AI를 쓰지 않는 조건으로' : '원래 AI 범위로') + (on ? ' 체크를 풀면 원래 AI 범위로 돌아가요.' : '');
    renderResults(); persist(); var nv = document.querySelector('[data-act="noai-view"]'); if(nv) nv.focus({preventScroll:true}); return toast(on ? 'AI를 쓰지 않을 때의 견적이에요. 돈과 평가가 얼마나 달라지는지 비교해 보세요.' : '원래 AI 범위로 돌아왔어요.'); }
  if(d.act === 'compare'){ S.draft.compare = t.checked; renderResults(); persist(); return; }
  if(t.id === 'upTool'){ var ut = $('upTitle'); UP.title = ut ? ut.value : ''; UP.tool = t.value; return openUpload(); }
  if(t.id === 'upCat'){ var ut2 = $('upTitle'); UP.title = ut2 ? ut2.value : ''; UP.cat = t.value; return openUpload(); }
  if(t.id === 'upOwn' && t.checked){ setErr('upOwn', ''); return; }
  if(d.toolplan){ S.myTools.forEach(function(x){ if(x.t === d.toolplan) x.plan = t.value; }); renderSidebar(); persist(); return; }
  if((d.qty || d.buy) && S.draft){ t.value = d.qty ? S.draft.qty[d.qty] : (S.draft.buy[d.buy] || ''); afterPointer(function(){ if(S.view === 'results') updateRowCells(); }); persist(); }
  if(d.anims && S.draft){ var ga = S.draft.setup.inv.obj.filter(function(g){ return g.id === d.anims; })[0]; if(ga) t.value = ga.a; persist(); }
});
document.addEventListener('input', function(e){
  var t = e.target, d = t.dataset, v = Math.max(0, parseInt(t.value, 10) || 0);
  if(t.id === 'q'){ clearTimeout(searchT); searchT = setTimeout(function(){ var qi = $('q'); if(!qi) return; S.search = qi.value; renderFeed(); persist(); }, 150); return; }
  if(t.id === 'inName'){ S.setup.name = t.value; return; }
  if(t.id === 'inGenreText'){ S.setup.genreText = t.value.trim().slice(0, 30); renderPreview(); return; }
  if(t.id in SETUP_NUM){ var L = SETUP_NUM[t.id], raw = t.value.trim(); if(L[3] && raw === ''){ L[2](S.setup, null); } else L[2](S.setup, Math.min(L[1], Math.max(L[0], v))); if(L[4]){ S.setup.invTouched = true; updAssetSum(); } syncSt(S.setup); if(t.id === 'inBudget') document.querySelectorAll('[data-set="budget"]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.val) === String(S.setup.budget)); }); if(t.id === 'inOnce') document.querySelectorAll('[data-set="onceBudget"]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.val) === String(S.setup.onceBudget)); }); if(t.id === 'inRelease'){ var rl = $('relLbl'); if(rl) rl.textContent = msLabel(S.setup.release) + ' 출시 목표'; } renderPreview(); return; }
  if(d.objname){ S.setup.inv.obj.forEach(function(g){ if(g.id === d.objname) g.name = t.value.slice(0, 20) || '이름 없는 묶음'; }); S.setup.invTouched = true; updAssetSum(); return; }
  if(d.objn || d.obja){ S.setup.inv.obj.forEach(function(g){ if(g.id === (d.objn || d.obja)){ if(d.objn) g.n = Math.min(300, v); else g.a = Math.min(40, v); } }); S.setup.invTouched = true; updAssetSum(); return; }
  if(d.msname){ S.setup.ms.forEach(function(m){ if(m.id === d.msname) m.name = t.value.slice(0, 20) || '일정'; }); syncSt(S.setup); return; }
  if(d.msm){ S.setup.ms.forEach(function(m){ if(m.id === d.msm) m.m = Math.min(60, v); }); syncSt(S.setup); return; }
  if(t.id === 'upBody'){ var n = t.value.trim().length, c = $('upCnt'); if(c){ c.textContent = n < 30 ? (30 - n) + '자 더 적어 주세요' : n + ' / 400'; c.classList.toggle('t-green', n >= 30); } if(n >= 30) setErr('upBody', ''); return; }
  if(t.id === 'upTitle' && t.value.trim().length >= 5){ setErr('upTitle', ''); return; }
  if(t.id === 'upSum' && t.value.trim().length >= 10){ setErr('upSum', ''); return; }
  if(d.qty && S.draft){ setQty(S.draft.setup, d.qty, v); S.draft.qty = qtyOf(S.draft.setup); updateRowCells(); return; }
  if(d.anims && S.draft){ S.draft.setup.inv.obj.forEach(function(g){ if(g.id === d.anims) g.a = Math.min(40, v); }); setRows(S.draft.setup); updateRowCells(); return; }
  if(d.buy && S.draft){ S.draft.buy[d.buy] = v; updateRowCells(); return; }
});
/* 미리보기처럼 폼 제출이 막힌 환경(sandbox에 allow-forms가 없는 iframe)에서는 submit 이벤트가 오지 않는다.
   그래서 제출 버튼 클릭과 입력칸의 Enter를 직접 받아 같은 처리로 보낸다 */
document.addEventListener('submit', function(e){ e.preventDefault(); doSubmit(e.target); });
document.addEventListener('click', function(e){
  var b = e.target.closest && e.target.closest('button[type="submit"]'); if(!b || b.disabled || !b.form) return;
  e.preventDefault(); e.stopPropagation(); doSubmit(b.form);
}, true);
document.addEventListener('keydown', function(e){
  if(e.key !== 'Enter' || e.isComposing || e.keyCode === 229) return;
  var t = e.target; if(!t || t.tagName !== 'INPUT' || !t.form || /^(checkbox|radio|button|submit)$/.test(t.type)) return;
  e.preventDefault(); e.stopPropagation(); doSubmit(t.form);
}, true);
function doSubmit(form){
  var e = {target:form};
  var id = form.id;
  if(id === 'chatF'){ var v = $('chatIn').value.trim(); if(v) assist(v); return; }
  if(id === 'intakeF'){ var iv0 = $('intakeIn').value.trim(); if(iv0) intakeSay(iv0); return; }
  if(id === 'renF'){ var Qr = getQ(S.activeQ), nn = $('renName').value.trim().slice(0, 30); if(!nn){ $('renName').setAttribute('aria-invalid', 'true'); $('renNameErr').textContent = '게임 이름을 적어 주세요.'; $('renName').focus(); return; } var changedN = nn !== Qr.name; Qr.name = nn; closeLayer(); if(changedN){ render(); toast('이름을 바꿨어요.'); } return; }
  if(id === 'hvF'){ var hvv = Math.max(0, Math.min(200000, parseInt($('hvIn').value, 10) || 0)), bi = S.draft.quotes.map(function(x){ return x.strat; }).indexOf('balance'), b0 = calc(S.draft.quotes[bi].picks, S.draft.qty, S.draft.buy, S.draft.setup);
    S.hourVal = hvv; rebuildStrat(bi); var b1 = calc(S.draft.quotes[bi].picks, S.draft.qty, S.draft.buy, S.draft.setup), cH = S.draft.quotes.map(function(x){ return calc(x.picks, S.draft.qty, S.draft.buy, S.draft.setup); }), rH = recommend(cH, S.draft.setup);
    if(S.prio === 'balance' && rH >= 0) S.draft.sel = rH; S.draft.chg = {}; closeLayer(); renderResults(); persist();
    return toast('시간 1시간을 ' + won(hvv) + '으로 쳐서 균형 견적을 다시 짰어요. ' + diffText(b0, b1) + '.'); }
  if(id === 'repF'){ var pid0 = e.target.dataset.post; S.reported[pid0] = true; closeLayer(); render(); return toast('신고를 접수했어요. 이 후기는 내 화면에서 숨겼어요.', '되돌리기', function(){ delete S.reported[pid0]; render(); }); }
  if(id === 'logF'){ return logSubmit(); }
  if(id === 'saveF'){
    svGrab();
    var cq = curQ(), nid = 'q' + (Date.now() % 100000), nm = (SV.name.trim() || S.draft.name).slice(0, 30), st = S.draft.setup;
    st.platforms = SV.plats.length ? clone(SV.plats) : ['unknown']; st.ms = clone(SV.ms); syncSt(st);
    var Qn = newQuoteRecord(nid, nm, st, cq.n, TODAY, S.draft.qty, S.draft.buy, cq.picks, SV.remind);
    Qn.storeAt = SV.store; Qn.email = SV.remind && SV.email;
    S.draft.name = nm; saveDraftToQuote(Qn, S.draft); S.quotes.push(Qn); SV = null;
    S.newQ = nid; S.guide = true; S.draft = null; S.editingQ = null; closeLayer(); go('home');
    announce('‘' + nm + '’' + eul(nm) + ' 저장했어요.');
    var gb = document.querySelector('.mguide [data-act="guide-open"]'); if(gb) gb.focus({preventScroll:true}); return;
  }
  if(id === 'upF'){ return uploadSubmit(); }
  if(id === 'trF'){ if(!TR.star){ setErr('tr', '별점을 골라 주세요.', document.querySelector('[data-trstar]').parentNode); document.querySelector('[data-trstar]').focus(); return; }
    var hadMine = (S.toolRev[TR.t] || []).some(function(x){ return x.mine; }); if(!hadMine){ S.tokens = (S.tokens || 0) + TOK_TREV; setTimeout(function(){ toast('도구를 평가해서 토큰 ' + TOK_TREV + '개를 받았어요. 지금 ' + S.tokens + '개예요.'); }, 900); } var L0 = S.toolRev[TR.t] = (S.toolRev[TR.t] || []).filter(function(x){ return !x.mine; }); L0.push({who:'나', star:TR.star, text:$('trText').value.trim() || '한 줄 평 없음', mine:true}); closeLayer(); render(); return toast(TOOLS[TR.t].name + ' 평가를 남겼어요. 도구 총 별점에 들어가요.'); }
}
/* 좁은 화면에서 도우미 시트가 열려 있으면 Tab이 시트 밖으로 나가지 않게 한다 */
function radioArrows(e){
  if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].indexOf(e.key) < 0) return;
  var el = e.target; if(!el.matches || !el.matches('[role="radio"]')) return;
  var g = el.closest('[role="radiogroup"]'); if(!g) return;
  var rs = Array.prototype.filter.call(g.querySelectorAll('[role="radio"]'), function(x){ return x.getAttribute('aria-disabled') !== 'true' && !x.disabled; });
  var i = rs.indexOf(el), n = rs[(i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : rs.length - 1)) % rs.length]; if(!n || n === el) return;
  e.preventDefault(); n.focus();
}
function trapSb(e){
  if(e.key !== 'Tab' || !S.sbOpen || window.innerWidth > 980 || $('layer').innerHTML) return;
  var f = Array.prototype.filter.call($('sb').querySelectorAll('button:not([disabled])'), function(x){ return x.offsetParent !== null; });
  if(!f.length) return; var a = f[0], b = f[f.length - 1];
  if(!$('sb').contains(document.activeElement)){ e.preventDefault(); a.focus(); return; }
  if(e.shiftKey && document.activeElement === a){ e.preventDefault(); b.focus(); }
  else if(!e.shiftKey && document.activeElement === b){ e.preventDefault(); a.focus(); }
}
function trapChat(e){
  if(e.key !== 'Tab' || !S.chatOpen || window.innerWidth > 1340 || $('layer').innerHTML) return;
  var ch = $('chat'); if(!ch) return;
  var f = Array.prototype.filter.call(ch.querySelectorAll('button:not([disabled]), input'), function(x){ return x.offsetParent !== null; });
  if(!f.length) return; var a = f[0], b = f[f.length - 1];
  if(!ch.contains(document.activeElement)){ e.preventDefault(); a.focus(); return; }
  if(e.shiftKey && document.activeElement === a){ e.preventDefault(); b.focus(); }
  else if(!e.shiftKey && document.activeElement === b){ e.preventDefault(); a.focus(); }
}
document.addEventListener('keydown', function(e){
  trap(e); trapChat(e); trapSb(e); radioArrows(e);
  if(e.key === 'Escape'){ if($('layer').innerHTML) return closeLayer(); if(S.chatOpen && window.innerWidth <= 1340){ return setChat(false); } if(S.guide && S.view === 'home'){ S.guide = false; render(); var gq = document.querySelector('[data-quote="'+S.newQ+'"]'); if(gq) gq.focus(); return; } if(S.sbOpen) return closeSb(); }
  if(LB && $('layer').querySelector('.lb') && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')){ var b = $('layer').querySelector('[data-lbnav="'+(e.key === 'ArrowLeft' ? -1 : 1)+'"]'); if(b && !b.disabled) b.click(); }
  if(e.key === 'Enter' && e.target.matches && e.target.matches('#inRelease, #inWeekly, #inBudget, #inOnce, #inName')){ e.preventDefault(); e.target.dispatchEvent(new Event('change', {bubbles:true})); var nx = document.querySelector('[data-wiz="'+(S.wiz + 1)+'"]') || document.querySelector('[data-act="make"]'); if(nx) nx.click(); }
});

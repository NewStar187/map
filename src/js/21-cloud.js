/* ============================== 서버 연결(Supabase) ==============================
   설정(MAP_CONFIG.supabaseUrl)이 있을 때만 켜진다. 없으면 이 파일은 아무 일도 하지 않고 시안처럼 동작한다.
   원칙
   - 기존 함수를 감싸서 붙인다. 견적 엔진과 화면 코드는 그대로 둔다.
   - 예시 데이터(예시 게임, '예시' 결과물과 후기)는 그대로 보여 주되 서버에 올리지 않고, 토큰 없이 열린다.
   - 토큰, 잠금, 공개 여부는 모두 서버가 정한다(schema.sql). 화면은 결과만 보여 준다. */
var CFG = (typeof window !== 'undefined' && window.MAP_CONFIG) || {};
var SB = null;
var CLOUD = {on:false, user:null, profile:null, toolStats:{}, examples:{}, synced:{}, loadingGames:false};
function cloudOn(){ return CLOUD.on; }
function signedIn(){ return !!(CLOUD.on && CLOUD.user); }
function cloudErr(e, what){ var m = (e && (e.message || e.error_description)) || String(e || ''); toast(what + ' 하지 못했어요. ' + (/NOT_ENOUGH_TOKENS/.test(m) ? '토큰이 모자라요.' : /LOGIN_REQUIRED|JWT|not authenticated/i.test(m) ? '다시 로그인해 주세요.' : '잠시 뒤 다시 해 주세요.')); if(typeof console !== 'undefined') console.warn('[MAP]', what, m); }
function needLogin(why){ if(signedIn()) return false; authSheet('in', why); return true; }
function uuid4(){ if(typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID(); return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){ var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }); }
function agoTxt(iso){ var d = (Date.now() - new Date(iso).getTime()) / 86400000; return d < 1 ? '오늘' : d < 7 ? Math.floor(d) + '일 전' : d < 30 ? Math.floor(d / 7) + '주 전' : Math.floor(d / 30) + '달 전'; }
function pubUrl(bucket, p){ return SB.storage.from(bucket).getPublicUrl(p).data.publicUrl; }

/* ---------- 시작: 도구 가격, 예시 결과물, 공개된 결과물, 도구 총 별점 ---------- */
function cloudBoot(){
  if(!CFG.supabaseUrl || !CFG.supabaseAnonKey || typeof window === 'undefined' || !window.supabase || !window.supabase.createClient) return;
  try { SB = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}}); } catch(x){ return; }
  CLOUD.on = true;
  /* 예전에 브라우저에 남은 서버 데이터는 지우고 새로 받는다 */
  S.works = S.works.filter(function(w){ return !w.cloud; });
  S.quotes = S.quotes.filter(function(q){ return !q.cloudId || q.localOnly; });
  if(AI_CFG && !AI_CFG.assistUrl && CFG.assistUrl) AI_CFG.assistUrl = CFG.assistUrl;
  Promise.all([loadCatalog(), loadExamples(), loadWorks()]).then(function(){ QCACHE = {}; render(); }).catch(function(e){ cloudErr(e, '서버에서 데이터를 받지'); });
  SB.auth.getSession().then(function(r){ onAuth(r.data && r.data.session); });
  SB.auth.onAuthStateChange(function(ev, session){ if(ev === 'INITIAL_SESSION') return; onAuth(session); });
}
function loadCatalog(){
  return Promise.all([SB.from('tool_plans').select('tool_id,plan_key,usd_month,usd_once,rights'), SB.from('tool_stats').select('tool_id,star,n')]).then(function(rs){
    if(rs[0].error) throw rs[0].error;
    rs[0].data.forEach(function(p){ var T = TOOLS[p.tool_id]; if(!T || !T.plans || !T.ai) return; /* 직접 만드는 도구(Aseprite 등)는 엔진이 '이미 가진 것'으로 다루므로 가격을 덮어쓰지 않는다 */ var mine = T.plans.filter(function(x){ return x.id === p.plan_key; })[0]; if(!mine) return; mine.usd = +p.usd_month || 0; mine.once = +p.usd_once || 0; mine.rights = p.rights; });
    Object.keys(TOOLS).forEach(function(t){ var T = TOOLS[t]; if(!T.plans) return; var d = T.plans.filter(function(x){ return x.id === T.def; })[0]; if(!d) return; T.usd = d.usd || 0; T.once = d.once || 0; T.rights = d.rights; });
    (rs[1].data || []).forEach(function(s){ CLOUD.toolStats[s.tool_id] = {star:+s.star, n:+s.n}; });
  });
}
function loadExamples(){
  return SB.from('examples').select('tool_id,cat,slot,file_path').then(function(r){ if(r.error) throw r.error; r.data.forEach(function(x){ CLOUD.examples[x.tool_id + '|' + x.cat + '|' + x.slot] = pubUrl('examples', x.file_path); }); });
}
function workFromRow(w, counts, nick){
  var c = counts[w.id] || {};
  return {id:w.id, cloud:true, uid:w.user_id, t:w.tool_id, cat:w.cat, cls:w.cls || 'any', engine:w.engine || '', who:nick[w.user_id] || '이름 없는 개발자', when:agoTxt(w.created_at), ago:(Date.now() - new Date(w.created_at).getTime()) / 86400000,
    title:w.title, star:+w.star, sat:w.sat, how:w.how || 'human', tries:w.tries, helpful:+(c.helpful || 0), same:+(c.same || 0), diff:+(c.diff || 0), cmN:+(c.comments || 0), file:pubUrl('works', w.file_path), filePath:w.file_path, pending:w.status === 'pending', mine:!!(CLOUD.user && w.user_id === CLOUD.user.id), comments:[]};
}
function loadWorks(){
  return SB.from('works').select('id,user_id,tool_id,cat,cls,engine,title,file_path,star,sat,how,tries,status,created_at').order('created_at', {ascending:false}).limit(300).then(function(r){
    if(r.error) throw r.error;
    var rows = r.data, ids = rows.map(function(w){ return w.id; }), uids = rows.map(function(w){ return w.user_id; }).filter(function(x, i, a){ return a.indexOf(x) === i; });
    return Promise.all([ids.length ? SB.from('work_counts').select('*').in('work_id', ids) : {data:[]}, uids.length ? SB.from('profiles').select('id,nickname').in('id', uids) : {data:[]}]).then(function(xs){
      var counts = {}, nick = {}; (xs[0].data || []).forEach(function(c){ counts[c.work_id] = c; }); (xs[1].data || []).forEach(function(p){ nick[p.id] = p.nickname; });
      S.works = rows.map(function(w){ return workFromRow(w, counts, nick); }).concat(S.works.filter(function(w){ return !w.cloud; }));
      /* 내가 누른 평가를 지금 화면의 '내가 누름' 표시로 옮기고, 서버 숫자에서는 빼 둔다(화면이 다시 더하므로) */
      if(CLOUD.user) return SB.from('work_votes').select('work_id,helpful,verdict').eq('user_id', CLOUD.user.id).then(function(v){
        (v.data || []).forEach(function(x){ var w = S.works.filter(function(y){ return y.id === x.work_id; })[0]; S.voted[x.work_id] = {h:x.helpful, v:x.verdict}; if(w){ if(x.helpful) w.helpful = Math.max(0, w.helpful - 1); if(x.verdict === 'same') w.same = Math.max(0, w.same - 1); if(x.verdict === 'diff') w.diff = Math.max(0, w.diff - 1); } });
      });
    });
  });
}

/* ---------- 로그인 ---------- */
function onAuth(session){
  var was = CLOUD.user && CLOUD.user.id, now = session && session.user ? session.user : null;
  CLOUD.user = now;
  if(!now){ CLOUD.profile = null; if(was){ S.quotes = S.quotes.filter(function(q){ return !q.cloudId; }); S.voted = {}; S.unlocked = {}; if(['quote'].indexOf(S.view) >= 0) S.view = 'home'; } render(); return; }
  if(was === now.id && CLOUD.profile) return;
  refreshProfile().then(function(){ return Promise.all([loadGames(), loadUnlocks(), loadWorks()]); }).then(function(){ QCACHE = {}; render(); }).catch(function(e){ cloudErr(e, '내 정보를 불러오지'); });
}
function refreshProfile(){
  if(!CLOUD.user) return Promise.resolve();
  return SB.from('profiles').select('nickname,tokens,is_admin').eq('id', CLOUD.user.id).single().then(function(r){ if(r.error) throw r.error; CLOUD.profile = r.data; S.tokens = r.data.tokens; renderSidebar(); });
}
function loadUnlocks(){
  return SB.from('unlocks').select('kind,target').eq('user_id', CLOUD.user.id).then(function(r){ S.unlocked = S.unlocked || {}; (r.data || []).forEach(function(u){ S.unlocked[u.kind === 'work' ? u.target : 'rev:' + u.target] = true; }); });
}
var AU = null;
function authSheet(mode, why){
  AU = {mode:mode || 'in', why:why || '', sent:false, err:''};
  auRender();
}
function auRender(focus){
  var up = AU.mode === 'up';
  if(AU.sent){ openLayer('<div class="modal sheet" role="dialog" aria-modal="true" aria-labelledby="auT">'+mh('auT', '메일을 확인해 주세요')+'<p class="note">'+esc(AU.email || '')+'(으)로 보낸 메일의 링크를 누르면 가입이 끝나요. 메일이 안 보이면 스팸함도 확인해 주세요.</p><div class="row-acts end"><button type="button" class="btn" data-act="close-layer">닫기</button></div></div>'); return; }
  openLayer('<form class="modal sheet" id="auF" role="dialog" aria-modal="true" aria-labelledby="auT" novalidate>'+mh('auT', up ? 'MAP 가입하기' : 'MAP 로그인')
    + (AU.why ? '<p class="note">'+esc(AU.why)+'</p>' : '')
    + '<div class="seg" role="group" aria-label="로그인 또는 가입"><button type="button" data-aumode="in" aria-pressed="'+!up+'">로그인</button><button type="button" data-aumode="up" aria-pressed="'+up+'">가입</button></div>'
    + (up ? '<label class="fld">닉네임<input class="field" id="auNick" maxlength="20" autocomplete="nickname" value="'+esc(AU.nick || '')+'" placeholder="커뮤니티에 보이는 이름"></label>' : '')
    + '<label class="fld">이메일<input class="field" id="auEmail" type="email" autocomplete="email" value="'+esc(AU.email || '')+'" data-autofocus></label>'
    + '<label class="fld">비밀번호 <span class="opt-l">'+(up ? '8자 이상' : '')+'</span><input class="field" id="auPw" type="password" autocomplete="'+(up ? 'new-password' : 'current-password')+'"></label>'
    + '<span class="err" id="auErr">'+esc(AU.err)+'</span>'
    + (up ? '<p class="note">가입하면 토큰 30개를 드려요. 내 게임은 나만 볼 수 있어요.</p>' : '')
    + '<div class="row-acts end"><button type="button" class="btn sec" data-act="close-layer">취소</button><button type="submit" class="btn">'+(up ? '가입하기' : '로그인')+'</button></div></form>');
  var f = focus ? $('layer').querySelector(focus) : null; if(f) f.focus();
}
function auSubmit(){
  var email = ($('auEmail').value || '').trim(), pw = $('auPw').value || '', nick = $('auNick') ? $('auNick').value.trim() : '';
  AU.email = email; AU.nick = nick;
  if(!/^\S+@\S+\.\S+$/.test(email)){ AU.err = '이메일을 확인해 주세요.'; return auRender('#auEmail'); }
  if(pw.length < (AU.mode === 'up' ? 8 : 1)){ AU.err = AU.mode === 'up' ? '비밀번호를 8자 이상 적어 주세요.' : '비밀번호를 적어 주세요.'; return auRender('#auPw'); }
  var btn = $('layer').querySelector('#auF button[type=submit]'); if(btn){ btn.disabled = true; btn.textContent = '잠시만요…'; }
  var p = AU.mode === 'up'
    ? SB.auth.signUp({email:email, password:pw, options:{data:{nickname:nick || email.split('@')[0]}, emailRedirectTo:location.origin + location.pathname}})
    : SB.auth.signInWithPassword({email:email, password:pw});
  p.then(function(r){
    if(r.error){ AU.err = /Invalid login/i.test(r.error.message) ? '이메일이나 비밀번호가 맞지 않아요.' : /already registered/i.test(r.error.message) ? '이미 가입한 이메일이에요. 로그인해 주세요.' : /confirm/i.test(r.error.message) ? '메일 인증을 먼저 끝내 주세요.' : r.error.message; return auRender('#auPw'); }
    if(AU.mode === 'up' && !r.data.session){ AU.sent = true; return auRender(); }
    closeLayer(); toast(AU.mode === 'up' ? '가입했어요. 토큰 30개를 드렸어요.' : '로그인했어요.');
  });
}
function signOut(){ SB.auth.signOut().then(function(){ toast('로그아웃했어요.'); }); }

/* ---------- 내 게임 ---------- */
function gameRow(q){
  return {id:q.cloudId, user_id:CLOUD.user.id, name:(q.name || '이름 없는 게임').slice(0, 30), quote_kind:STRATS[(q.n || 1) - 1] || 'one', setup:q.setup, picks:q.picks, qty:q.qty, buy:q.buy || {},
    platforms:q.platforms && q.platforms.length ? q.platforms : ['steam'], remind:q.remind !== false, email:!!q.email, data:q};
}
function loadGames(){
  CLOUD.loadingGames = true;
  return SB.from('games').select('id,data,updated_at').order('updated_at', {ascending:true}).then(function(r){
    CLOUD.loadingGames = false; if(r.error) throw r.error;
    var mine = r.data.map(function(g){ var q = g.data || {}; q.cloudId = g.id; if(!q.id || S.quotes.some(function(x){ return x.id === q.id && x.cloudId !== g.id; })) q.id = 'c' + g.id.slice(0, 8); CLOUD.synced[g.id] = JSON.stringify(q); return q; });
    var local = S.quotes.filter(function(q){ return !q.cloudId; });
    /* 로그인 전에 만든 게임(예시 제외)은 내 계정으로 옮긴다 */
    var move = local.filter(function(q){ return !q.ex; });
    S.quotes = local.filter(function(q){ return q.ex; }).concat(mine);
    move.forEach(function(q){ q.cloudId = uuid4(); S.quotes.push(q); });
    if(move.length){ syncGames(); toast('로그인 전에 저장한 게임 ' + move.length + '개를 내 계정으로 옮겼어요.'); }
  });
}
var syncT = null;
function syncGames(){
  if(!signedIn() || CLOUD.loadingGames) return;
  clearTimeout(syncT);
  syncT = setTimeout(function(){
    S.quotes.forEach(function(q){
      if(q.ex) return; if(!q.cloudId) q.cloudId = uuid4();
      var js = JSON.stringify(q); if(CLOUD.synced[q.cloudId] === js) return;
      CLOUD.synced[q.cloudId] = js;
      SB.from('games').upsert(gameRow(q)).then(function(r){ if(r.error){ delete CLOUD.synced[q.cloudId]; cloudErr(r.error, '게임을 서버에 저장'); } });
    });
  }, 800);
}
function deleteGame(q){ if(!signedIn() || !q || !q.cloudId) return; delete CLOUD.synced[q.cloudId]; SB.from('games').delete().eq('id', q.cloudId).then(function(r){ if(r.error) cloudErr(r.error, '서버에서 게임을 지우지'); }); }

/* ---------- 커뮤니티 ---------- */
function loadWorkDetail(w){
  if(!w.cloud) return Promise.resolve();
  var ps = [SB.from('work_details').select('prompt,cost_krw,note').eq('work_id', w.id).maybeSingle(), SB.from('comments').select('id,user_id,parent_id,body,created_at').eq('work_id', w.id).order('created_at', {ascending:true})];
  return Promise.all(ps).then(function(rs){
    var d = rs[0].data; if(d){ w.prompt = d.prompt || ''; w.cost = d.cost_krw ? {krw:d.cost_krw} : null; w.note = d.note || ''; }
    var cs = rs[1].data || [], uids = cs.map(function(c){ return c.user_id; }).filter(function(x, i, a){ return a.indexOf(x) === i; });
    return (uids.length ? SB.from('profiles').select('id,nickname').in('id', uids) : Promise.resolve({data:[]})).then(function(pr){
      var nick = {}; (pr.data || []).forEach(function(p){ nick[p.id] = p.nickname; });
      var top = cs.filter(function(c){ return !c.parent_id; }).map(function(c){ return {id:String(c.id), who:nick[c.user_id] || '이름 없는 개발자', when:agoTxt(c.created_at), text:c.body, replies:[]}; });
      cs.filter(function(c){ return c.parent_id; }).forEach(function(c){ var p = top.filter(function(t){ return t.id === String(c.parent_id); })[0]; if(p) p.replies.push({id:String(c.id), who:nick[c.user_id] || '이름 없는 개발자', when:agoTxt(c.created_at), text:c.body}); });
      w.comments = top; w.cmN = cs.length; w.detailLoaded = true;
    });
  });
}
function sendComment(w, text, parent){
  return SB.from('comments').insert({work_id:w.id, user_id:CLOUD.user.id, parent_id:parent ? +parent : null, body:text.slice(0, 200)}).then(function(r){ if(r.error) throw r.error; return loadWorkDetail(w); });
}
function sendVote(w){
  var v = S.voted[w.id] || {};
  SB.from('work_votes').upsert({work_id:w.id, user_id:CLOUD.user.id, helpful:!!v.h, verdict:v.v || null}).then(function(r){ if(r.error) cloudErr(r.error, '평가를 저장'); });
}
function unlockCloud(kind, target){
  return SB.rpc('unlock', {p_kind:kind, p_target:target}).then(function(r){ if(r.error) throw r.error; S.tokens = r.data; if(CLOUD.profile) CLOUD.profile.tokens = r.data; S.unlocked[kind === 'work' ? target : 'rev:' + target] = true; renderSidebar(); });
}
function loadToolReviews(t){
  return SB.from('tool_reviews').select('user_id,star,body').eq('tool_id', t).then(function(r){
    var rows = r.data || [], uids = rows.map(function(x){ return x.user_id; });
    return (uids.length ? SB.from('profiles').select('id,nickname').in('id', uids) : Promise.resolve({data:[]})).then(function(pr){
      var nick = {}; (pr.data || []).forEach(function(p){ nick[p.id] = p.nickname; });
      var keep = (S.toolRev[t] || []).filter(function(x){ return !x.cloud; });
      S.toolRev[t] = keep.filter(function(x){ return !x.mine; }).concat(rows.map(function(x){ return {who:nick[x.user_id] || '이름 없는 개발자', star:x.star, text:x.body || '한 줄 평 없음', cloud:true, mine:!!(CLOUD.user && x.user_id === CLOUD.user.id)}; }));
    });
  });
}
var UPFILE = null;
function pickFile(btn){
  var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/png,image/gif,image/webp,audio/wav,audio/mpeg,text/plain';
  inp.onchange = function(){
    var f = inp.files && inp.files[0]; if(!f) return;
    if(f.size > 10 * 1024 * 1024){ setErr('upFile', '10MB 이하 파일만 올릴 수 있어요.'); return; }
    UPFILE = f; UP.file = true; setErr('upFile', '');
    var prev = /^image\//.test(f.type) ? '<img src="'+URL.createObjectURL(f)+'" alt="" style="width:44px;height:44px;object-fit:contain;image-rendering:pixelated">' : icon('store', 24, '#9098a6');
    btn.classList.add('has'); btn.innerHTML = '<span class="th2">'+prev+'</span><span><b>'+esc(f.name)+'</b><br><span class="note">다시 누르면 바꿀 수 있어요</span></span>';
  };
  inp.click();
}
function uploadCloud(meta){
  var f = UPFILE, ext = (f.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5), id = uuid4(), path = CLOUD.user.id + '/' + id + '.' + ext;
  return SB.storage.from('works').upload(path, f, {contentType:f.type || undefined, upsert:false}).then(function(r){
    if(r.error) throw r.error;
    return SB.from('works').insert({id:id, user_id:CLOUD.user.id, tool_id:meta.t, cat:meta.cat, cls:meta.cls === 'any' ? null : meta.cls, engine:null, title:meta.title, file_path:path, star:meta.star, sat:meta.sat, how:meta.how, tries:meta.tries || null});
  }).then(function(r){
    if(r.error) throw r.error;
    return SB.from('work_details').insert({work_id:id, prompt:meta.prompt || null, cost_krw:meta.cost ? meta.cost.krw : null, note:meta.note || null});
  }).then(function(r){ if(r.error) throw r.error; UPFILE = null; return refreshProfile().then(loadWorks); });
}

/* ---------- 기존 함수 감싸기 ---------- */
var exArt0 = exArt;
exArt = function(cat, t, i, star){
  var u = CLOUD.examples[t + '|' + cat + '|' + (i + 1)];
  return u ? '<img src="'+esc(u)+'" alt="" loading="lazy" style="width:100%;height:100%;object-fit:contain;image-rendering:pixelated">' : exArt0(cat, t, i, star);
};
var workArt0 = workArt;
workArt = function(w, size){
  if(!w.cloud || !w.file) return workArt0(w, size);
  if(/\.(wav|mp3)$/i.test(w.filePath || '')) return '<audio controls preload="none" src="'+esc(w.file)+'" style="width:'+Math.max(size, 200)+'px"></audio>';
  if(/\.txt$/i.test(w.filePath || '')) return '<span class="wart wide" style="width:'+size+'px">'+icon('store', 32, '#9098a6')+'</span>';
  return '<img src="'+esc(w.file)+'" alt="'+esc(w.title)+'" loading="lazy" style="max-width:'+size+'px;max-height:'+size+'px;image-rendering:pixelated">';
};
var toolStar0 = toolStar;
toolStar = function(t){
  var a = toolStar0(t), c = CLOUD.toolStats[t];
  if(!c || !c.n) return a;
  var localN = (S.toolRev[t] || []).filter(function(x){ return !x.cloud; }).length, la = localN ? (S.toolRev[t] || []).filter(function(x){ return !x.cloud; }).reduce(function(s, x){ return s + x.star; }, 0) : 0;
  return {star:(la + c.star * c.n) / (localN + c.n), n:localN + c.n};
};
/* 예시 결과물은 서버를 켜면 토큰 없이 열린다 */
var isOpenW0 = isOpenW;
isOpenW = function(w){ return isOpenW0(w) || (cloudOn() && !w.cloud); };
var openWork0 = openWork;
openWork = function(id){
  var w = S.works.filter(function(x){ return x.id === id; })[0];
  openWork0(id);
  if(w && w.cloud && isOpenW0(w) && !w.detailLoaded){ loadWorkDetail(w).then(function(){ if($('layer').querySelector('.modal.work[data-w="'+id+'"]')) openWork0(id); }); }
};
var spendTok0 = spendTok;
spendTok = function(n, key, okMsg){
  if(!cloudOn()) return spendTok0(n, key, okMsg);
  var w = S.works.filter(function(x){ return x.id === key; })[0];
  if(w && !w.cloud) return true;
  if(needLogin('토큰으로 열려면 로그인이 필요해요.')) return false;
  var rev = /^rev:/.test(key), target = rev ? key.slice(4) : key;
  unlockCloud(rev ? 'reviews' : 'work', target).then(function(){
    toast(okMsg + ' 남은 토큰 ' + S.tokens + '개.');
    if(rev) loadToolReviews(target).then(function(){ render(); });
    else if(w) loadWorkDetail(w).then(function(){ openWork0(w.id); });
  }).catch(function(e){ cloudErr(e, '열지'); });
  return false;
};
var renderSidebar0 = renderSidebar;
renderSidebar = function(){
  renderSidebar0();
  if(!cloudOn()) return;
  var sb = $('sb'), old = sb.querySelector('.acct'); if(old) old.remove();
  var box = document.createElement('div'); box.className = 'acct';
  box.innerHTML = signedIn()
    ? '<span class="ac-me"><b>'+esc(CLOUD.profile ? CLOUD.profile.nickname : '로그인함')+'</b><small>토큰 '+(S.tokens || 0)+'개'+(CLOUD.profile && CLOUD.profile.is_admin ? ' · <a href="admin" target="_blank" rel="noopener">운영 화면</a>' : '')+'</small></span><button type="button" class="btn sm sec" data-act="sign-out">로그아웃</button>'
    : '<span class="ac-me"><b>로그인하지 않았어요</b><small>게임이 이 브라우저에만 저장돼요</small></span><button type="button" class="btn sm" data-act="auth-open">로그인</button>';
  var foot = sb.querySelector('.sb-foot'); if(foot) sb.insertBefore(box, foot); else sb.appendChild(box);
};
var persist0 = persist;
persist = function(){ persist0(); syncGames(); };

/* 클릭·제출: 기존 처리보다 먼저 가로챈다 */
document.addEventListener('click', function(e){
  if(!cloudOn()) return;
  var el = e.target.closest && e.target.closest('button, [data-act]'); if(!el) return;
  var d = el.dataset, stop = function(){ e.preventDefault(); e.stopImmediatePropagation(); };
  if(d.act === 'auth-open'){ stop(); return authSheet('in'); }
  if(d.act === 'sign-out'){ stop(); return signOut(); }
  if(d.aumode && AU){ stop(); AU.mode = d.aumode; AU.err = ''; return auRender('#auEmail'); }
  if(d.act === 'pick-file'){ stop(); return pickFile(el); }
  if(d.act === 'upload' || d.uploadfor){ if(needLogin('결과물을 올리려면 로그인이 필요해요.')){ stop(); return; } }
  if(d.trev){ if(needLogin('도구를 평가하려면 로그인이 필요해요.')){ stop(); return; } }
  var wk = function(id){ return S.works.filter(function(x){ return x.id === id; })[0]; };
  if(d.whelp || d.wvote){ var wid = d.whelp || d.wvote.split('|')[0], w0 = wk(wid); if(w0 && w0.cloud){ if(needLogin('평가하려면 로그인이 필요해요.')){ stop(); return; } setTimeout(function(){ sendVote(w0); }, 0); } return; }
  if(d.cmtsend || d.replysend){
    var parts = (d.cmtsend || d.replysend).split('|'), w1 = wk(parts[0]); if(!w1 || !w1.cloud) return;
    stop(); if(needLogin('댓글을 쓰려면 로그인이 필요해요.')) return;
    var inp = $(d.cmtsend ? 'cIn' : 'rIn'), tx = inp ? inp.value.trim() : ''; if(!tx){ if(inp) inp.focus(); return; }
    el.disabled = true; sendComment(w1, tx, d.replysend ? parts[1] : null).then(function(){ REPLY_TO = null; WORK_FOCUS = '#cIn'; openWork0(w1.id); }).catch(function(er){ el.disabled = false; cloudErr(er, '댓글을 올리지'); });
    return;
  }
  if(d.act === 'del-yes'){ var Qd = getQ(S.activeQ); if(Qd && Qd.cloudId){ var keepId = Qd.cloudId; setTimeout(function(){ if(!S.quotes.some(function(q){ return q.cloudId === keepId; })) deleteGame({cloudId:keepId}); }, 6000); } return; }
}, true);
/* 양식 제출: 기존 doSubmit 앞에서 서버로 보낼 것만 처리한다. 처리했으면 true */
var doSubmit0 = doSubmit;
doSubmit = function(form){ if(cloudOn() && cloudSubmit(form)) return; doSubmit0(form); };
function cloudSubmit(form){
  var e = {target:form}, id = form.id;
  if(id === 'auF'){ auSubmit(); return true; }
  if(id === 'upF' && UPFILE && signedIn()){
    var title = $('upTitle').value.trim(), own = $('upOwn').checked, isAI = !!TOOLS[UP.tool].ai;
    if(title.length < 5 || !UP.star || !UP.sat || (isAI && !UP.how) || !own){ return false; } /* 빠진 칸 안내는 기존 검사로 */
    var tr = $('upTries'), pr = $('upPrompt'), co = $('upCost');
    var meta = {t:UP.tool, cat:UP.cat, cls:artCat(UP.cat) ? UP.cls : 'any', title:title, star:UP.star, sat:UP.sat, how:isAI ? UP.how : 'human', tries:tr && +tr.value || null, prompt:pr ? pr.value.trim() : '', cost:co && +co.value > 0 ? {krw:+co.value} : null, note:$('upNote').value.trim()};
    var sbtn = e.target.querySelector('button[type=submit]'); if(sbtn){ sbtn.disabled = true; sbtn.textContent = '올리는 중…'; }
    uploadCloud(meta).then(function(){
      var t = UP.tool; UP = {file:false, tool:t, cat:meta.cat, cls:UP.cls, star:null, sat:null, how:null};
      closeLayer(); S.toolT = t; S.toolCat = meta.cat; QCACHE = {}; go('tool');
      toast('올렸어요. 토큰을 받았어요(지금 ' + S.tokens + '개). 운영자가 확인하면 다른 사람에게도 보이고 에셋별 별점에 들어가요.');
    }).catch(function(er){ if(sbtn){ sbtn.disabled = false; sbtn.textContent = '올리기'; } cloudErr(er, '올리지'); });
    return true;
  }
  if(id === 'upF' && !signedIn()){ needLogin('결과물을 올리려면 로그인이 필요해요.'); return true; }
  if(id === 'trF' && signedIn() && TR && TR.star){
    var t2 = TR.t, body = $('trText').value.trim().slice(0, 60) || null;
    SB.from('tool_reviews').upsert({tool_id:t2, user_id:CLOUD.user.id, star:TR.star, body:body}).then(function(r){
      if(r.error) throw r.error;
      return Promise.all([refreshProfile(), loadToolReviews(t2), SB.from('tool_stats').select('tool_id,star,n').eq('tool_id', t2)]);
    }).then(function(rs){ var s = rs[2].data && rs[2].data[0]; if(s) CLOUD.toolStats[t2] = {star:+s.star, n:+s.n}; S.unlocked['rev:' + t2] = true; closeLayer(); render(); toast('도구 평가를 남겼어요. 지금 토큰 ' + S.tokens + '개예요.'); })
      .catch(function(er){ cloudErr(er, '평가를 남기지'); });
    return true;
  }
  if(id === 'repF'){
    var w2 = S.works.filter(function(x){ return x.id === e.target.dataset.post; })[0];
    if(w2 && w2.cloud && signedIn()){ var rr = e.target.querySelector('input[name=rep]:checked'); SB.from('reports').insert({work_id:w2.id, user_id:CLOUD.user.id, reason:rr ? REPORT[+rr.value] : null}).then(function(){}); }
  }
  return false;
}

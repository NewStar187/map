/* ============================== AI 도우미 연결 ==============================
   규칙으로 알아듣지 못한 말만 AI에게 보낸다. AI는 견적을 직접 고치지 않고,
   규칙이 알아듣는 짧은 문장(명령)으로 바꿔 돌려주거나 질문에 답만 한다.
   실제 변경은 언제나 기존 규칙과 견적 엔진이 하므로 가격을 지어낼 수 없고, 되돌리기도 그대로 된다.
   설정(config.json 의 assistUrl)이 없으면 이 파일은 아무 일도 하지 않는다. */
var AI_CFG = (typeof window !== 'undefined' && window.MAP_CONFIG) || {};
var AI_MISS = '아직 그 말은 이해하지 못했어요';
var AI_BUSY = false;
function aiOn(){ return !!AI_CFG.assistUrl; }
/* AI에게 주는 지금 상황: 에셋 줄 이름, 쓰는 도구, 바꿀 수 있는 도구. 개인 정보는 보내지 않는다 */
function aiContext(mode){
  if(mode === 'setup'){ var s = S.setup; return {mode:'setup', genres:s.genres, styles:s.styles, budget:s.budget, groups:s.inv.obj.map(function(g){ return {name:g.name, n:g.n}; }), counts:{scene:s.inv.scene.n, ui:s.inv.ui, illus:s.inv.illus, sfx:s.inv.sfx, bgm:s.inv.bgm, text:s.inv.text}}; }
  var d = S.draft, q = d.quotes[d.sel];
  return {mode:'results', quote:QN(q), budget:d.setup.budget, rows:ROWS.filter(function(r){ return d.qty[r.id] > 0; }).map(function(r){ return {name:RN(r), n:d.qty[r.id], now:toolLabel(q.picks[r.id], d.setup), options:r.opts.filter(function(o){ return allowed(r, o, d.setup); }).map(function(o){ return toolLabel(o.t, d.setup); })}; })};
}
function aiCall(text, mode){
  var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, timer = setTimeout(function(){ if(ctl) ctl.abort(); }, 15000);
  var headers = {'content-type':'application/json'}; if(AI_CFG.supabaseAnonKey){ headers.apikey = AI_CFG.supabaseAnonKey; headers.authorization = 'Bearer ' + (AI_CFG.accessToken || AI_CFG.supabaseAnonKey); }
  return fetch(AI_CFG.assistUrl, {method:'POST', headers:headers, body:JSON.stringify({text:text.slice(0, 300), context:aiContext(mode)}), signal:ctl ? ctl.signal : undefined})
    .then(function(r){ clearTimeout(timer); if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function(j){ return {commands:Array.isArray(j.commands) ? j.commands.filter(function(c){ return typeof c === 'string' && c.trim(); }).slice(0, 4).map(function(c){ return c.slice(0, 80); }) : [], answer:typeof j.answer === 'string' ? j.answer.slice(0, 400) : ''}; });
}
function aiTag(t){ return '<span class="ai-read">' + t + '</span> '; }
/* 견적 화면 */
var assistRules = assist;
assist = function(text){
  assistRules(text);
  var d = S.draft; if(!aiOn() || AI_BUSY || !d) return;
  var last = d.chat[d.chat.length - 1]; if(!last || last.who !== 'bot' || String(last.text).indexOf(AI_MISS) !== 0) return;
  var missText = last.text; last.text = aiTag('AI') + '무슨 뜻인지 생각하고 있어요…'; last.wait = true; AI_BUSY = true; renderResults();
  aiCall(text, 'results').then(function(res){
    AI_BUSY = false; if(S.draft !== d){ return; }
    var i = d.chat.indexOf(last);
    if(!res.commands.length && !res.answer){ last.text = missText; last.wait = false; renderResults(); persist(); return; }
    if(res.commands.length){
      last.text = aiTag('AI가 이렇게 이해했어요') + res.commands.map(function(c){ return '“' + esc(c) + '”'; }).join(', '); last.wait = false;
      res.commands.forEach(function(c){ var n0 = d.chat.length; assistRules(c); var cur = S.draft; if(cur && cur.chat[n0] && cur.chat[n0].who === 'me') cur.chat[n0].hide = true; d = cur || d; });
    } else { last.text = aiTag('AI 답변') + esc(res.answer); last.wait = false; }
    if(res.commands.length && res.answer && S.draft) S.draft.chat.push({who:'bot', text:aiTag('AI') + esc(res.answer)});
    if(S.view === 'results') renderResults(); persist();
  }).catch(function(){ AI_BUSY = false; last.text = missText; last.wait = false; if(S.view === 'results') renderResults(); });
};
/* 새 견적 화면 */
var intakeRules = intakeSay;
intakeSay = function(text){
  intakeRules(text);
  if(!aiOn() || AI_BUSY) return;
  var last = S.intake[S.intake.length - 1]; if(!last || last.who !== 'bot' || String(last.text).indexOf(AI_MISS) !== 0) return;
  var missText = last.text; last.text = aiTag('AI') + '무슨 뜻인지 생각하고 있어요…'; AI_BUSY = true; render();
  aiCall(text, 'setup').then(function(res){
    AI_BUSY = false;
    if(!res.commands.length && !res.answer){ last.text = missText; if(S.view === 'setup') render(); return; }
    if(res.commands.length){
      last.text = aiTag('AI가 이렇게 이해했어요') + res.commands.map(function(c){ return '“' + esc(c) + '”'; }).join(', ');
      res.commands.forEach(function(c){ var n0 = S.intake.length; intakeRules(c); if(S.intake[n0] && S.intake[n0].who === 'me') S.intake[n0].hide = true; });
    } else last.text = aiTag('AI 답변') + esc(res.answer);
    if(S.view === 'setup') render(); persist();
  }).catch(function(){ AI_BUSY = false; last.text = missText; if(S.view === 'setup') render(); });
};

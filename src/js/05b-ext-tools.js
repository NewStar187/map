/* ============================== 서버에서 추가한 도구 ==============================
   코드에 적힌 기본 도구 말고, 운영 화면에서 추가한 도구를 견적에 끼워 넣는다.
   - registerExtTool: 도구와 요금제를 TOOLS 에 등록한다(이미 있는 기본 도구는 건드리지 않는다).
   - EXT_CAPS: 어느 도구가 어떤 에셋(cat)을 어떤 그림체 갈래(cls)로 어떻게(method) 만드는지.
   - '목록만'(listed) 도구는 줄을 펼치면 선택지로 나오지만 자동 추천에는 넣지 않는다. '검증됨'(verified)이 되면 추천 후보가 된다. */
var EXT_CAPS = [];
var EXT_IDS = [];
function registerExtTool(t, plans, caps){
  if(!t || !t.id) return false;
  var builtin = TOOLS[t.id] && !TOOLS[t.id].ext;
  if(!builtin){
    var ps = (plans || []).map(function(p){ var o = {id:p.plan_key, name:p.name, usd:+p.usd_month || 0, rights:p.rights || 'check'}; if(+p.usd_once > 0) o.once = +p.usd_once; if(p.note) o.memo = p.note; return o; });
    if(!ps.length) ps = [{id:'free', name:'무료', usd:0, rights:'check'}];
    var dp = (plans || []).filter(function(p){ return p.is_default; })[0], def = dp ? dp.plan_key : (ps.filter(function(p){ return p.usd > 0 || p.once > 0; })[0] || ps[0]).id;
    var nm = t.name, listed = t.status !== 'verified';
    TOOLS[t.id] = {name:nm, ext:true, listed:listed, price:(plans || []).some(function(p){ return p.price_estimated; }) ? 'third' : 'ok', ai:!!t.ai, av:t.color || '#a6adc8',
      say:nm + roStr(nm) + (t.ai ? ' 만들어요' : ' 해요'), ro:roStr(nm), src:nm + ' 공식 페이지' + (t.checked_on ? '(' + t.checked_on + ' 확인)' : ''), alias:t.alias || '', why:t.terms_note || '상업적 이용 조건을 약관에서 직접 확인해 주세요.',
      plans:ps, def:def, site:t.site_url || '', pricingUrl:t.pricing_url || '', termsUrl:t.terms_url || '', billing:t.billing || ''};
    if(+t.gpu_min_gb > 0) TOOLS[t.id].gpuMin = +t.gpu_min_gb;
    var d = ps.filter(function(x){ return x.id === def; })[0] || ps[0], T = TOOLS[t.id];
    T.usd = d.usd || 0; T.once = d.once || 0; T.plan = d.name; T.rights = d.rights;
    if(EXT_IDS.indexOf(t.id) < 0) EXT_IDS.push(t.id);
  }
  EXT_CAPS = EXT_CAPS.filter(function(c){ return c.tool_id !== t.id; });
  (caps || []).forEach(function(c){ if(['obj', 'scene', 'ui', 'illus', 'sfx', 'bgm', 'code', 'text'].indexOf(c.cat) < 0) return; EXT_CAPS.push({tool_id:t.id, cat:c.cat, cls:c.cls && c.cls.length ? c.cls : null, method:c.method === 'free' || c.method === 'direct' ? c.method : 'ai', note:c.note || ''}); });
  return !builtin;
}
/* 에셋 줄 하나에 서버 도구의 선택지를 붙인다. 걸리는 시간은 같은 방식의 기존 선택지에서 빌린다 */
function extOpts(r){
  if(!EXT_CAPS.length) return;
  var buyAt = -1; r.opts.forEach(function(o, i){ if(o.t === 'buyasset') buyAt = i; });
  EXT_CAPS.forEach(function(c){
    var T = TOOLS[c.tool_id]; if(!T || c.cat !== r.cat) return;
    if(c.cls && r.cls && c.cls.indexOf(r.cls) < 0) return;
    if(r.opts.some(function(o){ return o.t === c.tool_id; })) return;
    var like = r.opts.filter(function(o){ return o.m === c.method; })[0] || r.opts[0];
    var o = {t:c.tool_id, m:c.method, h:like ? like.h : 1, ext:true, note:c.note || ''};
    if(T.listed){ o.noAuto = true; o.note = (o.note ? o.note + ' · ' : '') + '평가가 쌓이기 전이라 자동 추천에는 넣지 않아요'; }
    if(buyAt >= 0){ r.opts.splice(buyAt, 0, o); buyAt++; } else r.opts.push(o);
  });
}
function extCatsOf(t){ return EXT_CAPS.filter(function(c){ return c.tool_id === t; }).map(function(c){ return c.cat; }).filter(function(x, i, a){ return a.indexOf(x) === i; }); }

/* ============================== 유틸 ============================== */
function $(id){ return document.getElementById(id); }
function won(n){ return Math.round(n).toLocaleString('ko-KR') + '원'; }
function manwon(n){ if(n >= 10000 && n % 1000 === 0) return (n / 10000) + '만 원'; return won(n); }
function hrs(h){ return Math.round(h) + '시간'; }
function hrsW(c){ return hrs(c.hours) + ' · 약 ' + c.weeks + '주'; }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function batchim(w){ w = String(w); var last = w.charAt(w.length - 1); if(/[0-9]/.test(last)) return '0136780'.indexOf(last) >= 0 && last !== '0' ? true : last === '0'; if(/[A-Za-z]/.test(last)) return /[lmnr]/i.test(last); var c = w.charCodeAt(w.length - 1); if(c < 0xAC00 || c > 0xD7A3) return false; return (c - 0xAC00) % 28 !== 0; }
function eun(w){ return batchim(w) ? '은' : '는'; }
function eul(w){ return batchim(w) ? '을' : '를'; }
function gwa(w){ return batchim(w) ? '과' : '와'; }
function ieyo(w){ return batchim(w) ? '이에요' : '예요'; }
function iga(w){ return batchim(w) ? '이' : '가'; }
function ro(t){ var T = TOOLS[t]; if(T.ro) return T.ro; var n = T.name, c = n.charCodeAt(n.length - 1); if(c < 0xAC00 || c > 0xD7A3) return '로'; var b = (c - 0xAC00) % 28; return (b === 0 || b === 8) ? '로' : '으로'; }
var NJ = {1:{eun:'은',eul:'을',ro:'로',i:'이'},2:{eun:'는',eul:'를',ro:'로',i:'가'},3:{eun:'은',eul:'을',ro:'으로',i:'이'}};
function monthLabel(off){ var m = 11 + off, y = 2026 + Math.floor((m - 1) / 12); m = ((m - 1) % 12) + 1; return y + '년 ' + m + '월'; }
function shortMonth(label){ return label.replace(/^\d+년 /, ''); }
var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function smooth(){ return reduceMotion ? 'auto' : 'smooth'; }
function owns(t){ return S.myTools.some(function(x){ return x.t === t; }); }
function planOf(t, id){ var T = TOOLS[t]; return (T && T.plans || []).filter(function(p){ return p.id === id; })[0] || null; }
function defPlan(t){ var T = TOOLS[t]; return planOf(t, T.def) || {id:'-', name:T.plan || '', usd:T.usd || 0, once:0, rights:'ok'}; }
function myPlanId(t){ var x = S.myTools.filter(function(m){ return m.t === t; })[0]; return x ? x.plan : null; }
function ownedSt(t){ var p = planOf(t, myPlanId(t)); return p ? p.name + (p.once ? '' : p.usd > 0 ? ' 구독 중' : p.id === 'own' ? '' : ' 플랜') : '쓰는 중'; }
/* 이 견적에서 쓰는 요금제: 가지고 있으면 그 요금제, 아니면 기본 요금제 */
function ownPlan(t, st){ if(!st || !st.have || st.have.indexOf(t) < 0) return null; return planOf(t, (st.havePlan || {})[t]) || defPlan(t); }
/* 비용 0원으로 칠 수 있는가: 가진 요금제가 상업 이용을 허락할 때만. 무료 플랜이면 유료 요금제 값으로 계산한다 */
function has(t, st){ var p = ownPlan(t, st); return !!(p && p.rights === 'ok'); }
function freeOnly(t, st){ var p = ownPlan(t, st); return !!(p && p.rights !== 'ok'); }
function usePlan(t, st){ return has(t, st) ? ownPlan(t, st) : defPlan(t); }
function genreName(st){ var n = (st.genres || []).map(function(g){ return GENRE[g].name; }); if(st.genreText) n.push(st.genreText); return n.join(' · ') || '장르 미정'; }
function g0(st){ return (st.genres && st.genres[0]) || 'plat'; }
function vramGB(st){ return (VRAM[st.vram] || VRAM.unknown).gb; }
function gpuUnsure(t, st){ return !!(TOOLS[t].gpuMin && vramGB(st) == null); }
function styleOfRow(st, k){ return k && st.styles && st.styles.indexOf(k) >= 0 ? k : st.style; }
function viewOfRow(st, k){ return k && st.views && st.views.indexOf(k) >= 0 ? k : st.view; }
function rowCls(r, st){ return r.cls || clsOf(st); }
function stylesTxt(st){ return (st.styles || [st.style]).map(function(k){ return STYLES[k].name; }).join(', '); }
function viewsTxt(st){ return (st.views || [st.view]).map(function(k){ return VIEWS[k].name; }).join(', '); }
function has3d(st){ return (STYLES[st.style] || STYLES.px32).cls === '3d'; }

function roStr(w){ var c = w.charCodeAt(w.length - 1); if(c < 0xAC00 || c > 0xD7A3) return '로'; var b = (c - 0xAC00) % 28; return (b === 0 || b === 8) ? '로' : '으로'; }

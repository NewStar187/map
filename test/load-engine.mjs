// 화면 없이 견적 엔진만 불러온다. 기준 데이터·상태·유틸·엔진·대화 해석·견적 만들기 파일만 묶는다.
import { bundle } from '../build.mjs';

const FILES = ['01-data.js', '02-sample-data.js', '03-state.js', '04-util.js', '05-engine.js', '05b-ext-tools.js', '07-game-calc.js', '11-chat-edit.js', '12-quote-build.js', '16-chat-request.js'];
const EXPORTS = ['TOOLS', 'STRATS', 'PRIO', 'WORKS', 'usd', 'defaultSetup', 'syncSt', 'rowsOf', 'setRows', 'qtyOf', 'calc', 'stratPicks', 'recommend', 'qualOf', 'allowed', 'optOf', 'applyEdits', 'makeDraft', 'initialState', 'invFromGenres', 'GENRE', 'STYLES', 'FEATS', 'registerExtTool'];

export function loadEngine() {
  const footer = '\nglobalThis.__engine = {' + EXPORTS.map((n) => n + ':' + n).join(',') + ', get S(){ return S; }, set S(v){ S = v; }, setQCache:function(){ QCACHE = {}; }};\n';
  const src = bundle(FILES, footer);
  const store = {};
  const stubs = {
    document: { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, getElementById() { return null; } },
    window: { addEventListener() {}, matchMedia() { return { matches: false }; } },
    localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } },
  };
  new Function(...Object.keys(stubs), src.replace(/^\(function\(\)\{/, '(function(){').replace(/\}\)\(\);\n$/, '})();'))(...Object.values(stubs));
  const e = globalThis.__engine; delete globalThis.__engine;
  return e;
}

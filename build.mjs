// MAP 빌드: src/js 의 파일을 이름 순서대로 하나의 스크립트로 묶어 dist/index.html 을 만든다.
// 파일들은 같은 함수 범위 안에서 이어 붙으므로, 다른 파일의 함수와 변수를 그대로 쓸 수 있다.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(path.join(root, p), 'utf8');
export const jsFiles = () => readdirSync(path.join(root, 'src/js')).filter((f) => f.endsWith('.js')).sort();
export function bundle(files = jsFiles(), footer = '') {
  return "(function(){\n'use strict';\n\n" + files.map((f) => read('src/js/' + f)).join('') + footer + '})();\n';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const js = bundle();
  new Function(js); // 문법 오류가 있으면 여기서 멈춘다
  const head = read('src/shell-head.html').replace('/*__STYLE__*/', read('src/style.css').trimEnd());
  // config.json 이 있으면 서버 주소 같은 설정을 화면에 넣는다(없으면 서버 없이 시안처럼 동작한다). 비밀 키는 여기에 넣지 않는다.
  // 설정은 Vercel 같은 배포 서비스의 환경 변수를 먼저 보고, 없으면 config.json 을 본다.
  const file = existsSync(path.join(root, 'config.json')) ? JSON.parse(read('config.json')) : {};
  const env = process.env;
  const cfg = {
    supabaseUrl: env.SUPABASE_URL || file.supabaseUrl || '',
    supabaseAnonKey: env.SUPABASE_ANON_KEY || file.supabaseAnonKey || '',
    assistUrl: env.ASSIST_URL || file.assistUrl || '',
  };
  for (const k of Object.keys(cfg)) if (!cfg[k]) delete cfg[k];
  if (/service_role|sb_secret_/.test(JSON.stringify(cfg))) throw new Error('비밀 키(service_role)가 설정에 들어 있어요. 공개용 anon 키만 넣어 주세요.');
  const sbLib = cfg.supabaseUrl ? '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.min.js"></script>\n' : '';
  const html = head + sbLib + '<script>window.MAP_CONFIG=' + JSON.stringify(cfg).replace(/</g, '\\u003c') + ';</script>\n<script>\n' + js + '</script>\n' + read('src/shell-tail.html');
  mkdirSync(path.join(root, 'dist'), { recursive: true });
  writeFileSync(path.join(root, 'dist/index.html'), html);
  // 자동 검사용 사본: 화면 상태를 밖에서 볼 수 있게 한다.
  // index.test.html 은 서버 없이(시안처럼), index.cloud.test.html 은 서버 설정을 넣은 채로 만든다.
  const hook = 'render();\n})();';
  if (!html.includes(hook)) throw new Error('검사용 연결 지점을 찾지 못했어요');
  const testHook = 'render();\nwindow.__t={get S(){return S;},go:go,ev:function(s){return eval(s);}};\n})();';
  const offline = head + '<script>window.MAP_CONFIG={};</script>\n<script>\n' + js + '</script>\n' + read('src/shell-tail.html');
  writeFileSync(path.join(root, 'dist/index.test.html'), offline.replace(hook, testHook));
  writeFileSync(path.join(root, 'dist/index.cloud.test.html'), html.replace(hook, testHook));
  // 운영 화면도 같은 설정으로 내보낸다
  writeFileSync(path.join(root, 'dist/admin.html'), read('admin/index.html').replace('/*__CONFIG__*/{}', JSON.stringify({ supabaseUrl: cfg.supabaseUrl || '', supabaseAnonKey: cfg.supabaseAnonKey || '' }).replace(/</g, '\\u003c')));
  console.log('built dist/index.html', html.length, 'bytes from', jsFiles().length, 'files', '· 서버 설정:', cfg.supabaseUrl ? '있음' : '없음(시안처럼 동작)');
}

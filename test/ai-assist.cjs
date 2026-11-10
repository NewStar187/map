// AI 도우미 연결 검사. 진짜 AI 대신 정해진 답을 주는 가짜 서버를 띄워 화면 쪽 동작을 본다.
// 1) 서버 안내문에 적힌 '명령 문장'을 규칙이 실제로 알아듣는지  2) 규칙이 모르는 말이 AI를 거쳐 반영되는지  3) 서버가 죽어도 화면이 멈추지 않는지
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const CANNED = {
  '몹이 한 열 마리쯤 더 나와': { commands: ['적 10종 더 있어'], answer: '' },
  '소리 쪽은 그냥 기계한테 맡길래': { commands: ['효과음은 AI로 뽑을래요'], answer: '' },
  'PixelLab은 상업적으로 써도 돼?': { commands: [], answer: '지금 견적의 약관 요약은 커뮤니티의 도구 화면에서 확인해 주세요.' },
  '오프닝 영상용 그림도 좀 필요해': { commands: [], answer: '몇 장 정도 필요하세요?' },
};
const COMMANDS_SETUP = ['적 10종이야', '보스 3마리 추가해 줘', '효과음 30개', '배경음악 5곡', '일러스트 6장', '컷신 그림 10장 추가해 줘', '엔딩곡 2곡 추가해 줘', '튜토리얼 넣을 거야', '다국어 지원도 해', '모바일로도 낼 거야', '온라인 멀티 넣을 거야'];
const COMMANDS_RESULTS = ['적 3종 더 있어', '효과음 30개', '월 1만 원 안으로 맞춰 주세요', 'Quality로 보여 줘', 'Lite로 보여 줘', 'Balance로 보여 줘', '주인공은 직접 그릴래요', '효과음은 AI로 뽑을래요', '배경음악은 사서 쓸래요', '방금 거 되돌려 줘'];
(async () => {
  let down = false, calls = 0;
  const srv = http.createServer((req, res) => {
    const h = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
    if (req.method === 'OPTIONS') { res.writeHead(200, h); return res.end(); }
    let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => {
      calls++; if (down) { res.writeHead(500, h); return res.end('{}'); }
      const j = JSON.parse(b || '{}'); res.writeHead(200, h); res.end(JSON.stringify(CANNED[j.text] || { commands: [], answer: '' }));
    });
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const url = 'http://127.0.0.1:' + srv.address().port + '/assistant';
  const html = fs.readFileSync(path.resolve(__dirname, '../dist/index.test.html'), 'utf8').replace('window.MAP_CONFIG={}', 'window.MAP_CONFIG=' + JSON.stringify({ assistUrl: url }));
  const tmp = path.resolve(__dirname, '../dist/index.ai-test.html'); fs.writeFileSync(tmp, html);
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); p.setDefaultTimeout(4000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
  const lastBot = (sel) => p.evaluate((s) => { const m = [...document.querySelectorAll(s + ' .msg.bot')]; return m.length ? m[m.length - 1].innerText.replace(/\s+/g, ' ') : ''; }, sel);
  const say = async (input, text, wait) => { await p.fill(input, text); await p.press(input, 'Enter'); await p.waitForTimeout(wait || 250); };

  await p.goto('file://' + tmp); await p.waitForTimeout(300);
  await p.evaluate(() => __t.go('setup')); await p.click('.row-acts [data-wiz="2"]');
  for (const c of COMMANDS_SETUP) { const n = calls; await say('#intakeIn', c); const r = await lastBot('#imsgs'); ok(!r.includes('이해하지 못했') && calls === n, '새 견적 화면이 알아듣는 명령: ' + c); }
  const yes = await p.$('[data-ipend$=":1"]'); if (yes) await yes.click();
  await say('#intakeIn', '몹이 한 열 마리쯤 더 나와', 700);
  ok((await p.evaluate(() => __t.S.setup.inv.obj.find((g) => g.name === '적').n)) === 20, '모르는 말 → AI → "적 10종 더 있어"로 반영(10 → 20종)');
  ok((await p.innerText('#imsgs')).includes('AI가 이렇게 이해했어요'), 'AI가 어떻게 이해했는지 대화창에 보인다');
  await say('#intakeIn', '오프닝 영상용 그림도 좀 필요해', 700);
  ok((await lastBot('#imsgs')).includes('몇 장 정도'), '숫자가 없으면 지어내지 않고 되묻는다');

  await p.click('.row-acts [data-act=make]'); await p.waitForTimeout(1600);
  for (const c of COMMANDS_RESULTS) { const n = calls; await say('#chatIn', c, 900); const r = await lastBot('#msgs'); ok(!r.includes('이해하지 못했') && calls === n, '견적 화면이 알아듣는 명령: ' + c); const y = await p.$('#msgs [data-askno]'); if (y) await y.click(); }
  const pick0 = await p.evaluate(() => { const d = __t.S.draft; return JSON.stringify(d.quotes[d.sel].picks); });
  await say('#chatIn', '소리 쪽은 그냥 기계한테 맡길래', 1200);
  const pick1 = await p.evaluate(() => { const d = __t.S.draft; return JSON.stringify(d.quotes[d.sel].picks); });
  ok((await p.innerText('#msgs')).includes('AI가 이렇게 이해했어요'), '견적 화면에서도 모르는 말이 AI를 거친다');
  ok(pick0 !== pick1 || (await lastBot('#msgs')).length > 0, 'AI가 돌려준 명령을 규칙이 실행한다');
  await say('#chatIn', 'PixelLab은 상업적으로 써도 돼?', 900);
  ok((await p.innerText('#msgs')).includes('AI 답변'), '질문에는 답만 하고 견적은 그대로 둔다');
  down = true; await say('#chatIn', '아무도 모를 이상한 말', 900);
  ok((await lastBot('#msgs')).includes('이해하지 못했'), '서버가 응답하지 않으면 원래 안내로 돌아간다');
  ok(errs.length === 0, '화면 오류 없음 ' + errs.join(' | '));
  await b.close(); srv.close(); fs.unlinkSync(tmp);
  console.log(fail ? fail + '개 실패' : '모두 통과'); process.exit(fail ? 1 : 0);
})();

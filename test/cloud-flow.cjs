// 로그인한 뒤의 흐름 검사. 가짜 Supabase(cloud-mock.js)를 넣어 화면 쪽 연결만 본다.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
(async () => {
  const mock = fs.readFileSync(path.resolve(__dirname, 'cloud-mock.js'), 'utf8');
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('**/supabase-js@*/**', (r) => r.fulfill({ contentType: 'text/javascript', body: mock }));
  const p = await ctx.newPage(); p.setDefaultTimeout(5000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (/\[MAP\]/.test(m.text())) errs.push(m.text()); });
  let fail = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
  const db = () => p.evaluate(() => window.__mockdb);
  const W1 = '33333333-3333-4333-8333-333333333333';
  await p.goto('file://' + path.resolve(__dirname, '../dist/index.cloud.test.html')); await p.waitForTimeout(800);

  // 로그인
  await p.click('.acct [data-act=auth-open]'); await p.fill('#auEmail', 'tester@example.com'); await p.fill('#auPw', 'wrong'); await p.click('#auF button[type=submit]'); await p.waitForTimeout(300);
  ok((await p.innerText('#auErr')).includes('맞지 않아요'), '틀린 비밀번호 안내');
  await p.fill('#auPw', 'right-password'); await p.click('#auF button[type=submit]'); await p.waitForTimeout(800);
  ok((await p.innerText('.acct')).includes('테스트유저') && (await p.innerText('.acct')).includes('토큰 30개'), '로그인하면 닉네임과 서버 토큰이 보임');

  // 견적 저장 → 서버에 게임 생김
  await p.evaluate(() => __t.go('setup')); await p.click('[data-act=make]'); await p.waitForTimeout(1500);
  await p.click('.rbar [data-act=save]'); await p.fill('#svName', '서버 저장 테스트'); await p.click('#saveF button[type=submit]'); await p.waitForTimeout(1500);
  let d = await db(); ok(d.games.length === 1 && d.games[0].name === '서버 저장 테스트' && d.games[0].data.picks, '저장한 게임이 서버에 올라감');
  ok(!d.games.some((g) => /별빛 플랫포머|퍼즐 프로토타입/.test(g.name)), '예시 게임은 서버에 올리지 않음');

  // 작업 기록 추가 → 같은 게임이 갱신됨
  const qid = await p.evaluate(() => __t.S.quotes.find((q) => q.name === '서버 저장 테스트').id);
  await p.evaluate((id) => __t.go('quote', { q: id, step: 2 }), qid); await p.click('.lrow [data-logadd]'); await p.click('[data-lfhow=aiedit]').catch(() => {}); await p.click('#logF button[type=submit]'); await p.waitForTimeout(1500);
  d = await db(); ok(d.games.length === 1 && (d.games[0].data.logs || []).length === 1, '작업 기록이 같은 게임에 저장됨(새 줄이 생기지 않음)');

  // 다시 열기(다른 기기 흉내): 브라우저 저장을 지우고 새로 불러와도 게임이 돌아옴
  await p.evaluate(() => { localStorage.clear(); });
  const keep = await db();
  await p.addInitScript((dbx) => { window.__seed = dbx; }, keep);
  // 가짜 서버의 데이터는 페이지를 새로 열면 사라지므로, 같은 페이지에서 상태만 초기화하고 서버에서 다시 불러온다
  await p.evaluate(() => __t.ev('S.quotes = S.quotes.filter(function(q){ return !q.cloudId; }); CLOUD.synced = {}; loadGames().then(function(){ render(); })'));
  await p.waitForTimeout(500);
  ok(await p.evaluate(() => __t.S.quotes.some((q) => q.name === '서버 저장 테스트' && (q.logs || []).length === 1)), '서버에서 내 게임과 작업 기록을 다시 불러옴');

  // 커뮤니티: 서버 결과물이 보이고, 잠겨 있고, 토큰으로 열림
  await p.evaluate(() => __t.go('tools')); await p.click('[data-toolpage=pixellab]'); await p.waitForTimeout(300);
  ok((await p.innerText('#view')).includes('서버에서 온 기사 스프라이트'), '서버의 공개 결과물이 커뮤니티에 보임');
  await p.click(`.wcard[data-work="${W1}"]`); await p.waitForTimeout(300);
  ok(await p.$('.modal.work .lockbox') !== null, '남의 서버 결과물은 잠겨 있음');
  await p.click('[data-unlock]'); await p.waitForTimeout(800);
  d = await db(); ok(d.profiles[0].tokens === 25 && d.unlocks.length === 1, '열면 서버 토큰이 5개 줄어듦');
  ok((await p.innerText('.modal.work')).includes('server knight prompt'), '연 뒤에 서버에서 프롬프트를 받아 보여 줌');
  ok((await p.innerText('.acct')).includes('토큰 25개'), '사이드바 토큰도 바뀜');

  // 도움돼요, 댓글
  await p.click('[data-whelp]'); await p.waitForTimeout(400);
  d = await db(); ok(d.work_votes.length === 1 && d.work_votes[0].helpful === true, '도움돼요가 서버에 저장됨');
  await p.fill('#cIn', '서버 댓글 테스트'); await p.click('[data-cmtsend]'); await p.waitForTimeout(600);
  d = await db(); ok(d.comments.length === 1 && (await p.innerText('.modal.work')).includes('서버 댓글 테스트'), '댓글이 서버에 올라가고 화면에 보임');
  await p.keyboard.press('Escape');

  // 도구 평가 → 토큰 +5
  await p.click('[data-trev]'); await p.click('[data-trstar="5"]'); await p.fill('#trText', '서버 평가'); await p.click('#trF button[type=submit]'); await p.waitForTimeout(800);
  d = await db(); ok(d.tool_reviews.length === 1 && d.profiles[0].tokens === 30, '도구 평가가 서버에 저장되고 토큰 5개를 받음');

  // 결과물 올리기(실제 파일)
  await p.click('.ph [data-uploadfor]');
  const [chooser] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-act=pick-file]')]);
  await chooser.setFiles({ name: 'knight.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a', 'hex') });
  await p.waitForTimeout(200);
  ok((await p.innerText('#upFile')).includes('knight.png'), '고른 파일 이름이 보임');
  await p.fill('#upTitle', '내가 올린 서버 결과물'); await p.click('[data-upstar="4"]'); await p.click('[data-upsat=meet]'); await p.click('[data-uphow=aiedit]'); await p.check('#upOwn');
  await p.click('#upF button[type=submit]'); await p.waitForTimeout(1200);
  d = await db(); ok(d.uploads.length === 1 && /^11111111-.*\.png$/.test(d.uploads[0].path), '파일이 내 폴더로 저장소에 올라감');
  ok(d.works.some((w) => w.title === '내가 올린 서버 결과물' && w.status === 'pending') && d.profiles[0].tokens === 40, '결과물이 검토 대기로 들어가고 토큰 10개를 받음');
  ok((await p.innerText('#view')).includes('내가 올린 서버 결과물'), '내가 올린 결과물은 검토 중에도 나에게 보임');

  // 게임 삭제 → 6초 뒤 서버에서도 지워짐
  const qid2 = await p.evaluate(() => __t.S.quotes.find((q) => q.name === '서버 저장 테스트').id);
  await p.evaluate((id) => __t.go('quote', { q: id, step: 1 }), qid2);
  await p.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'del-ask'; document.body.appendChild(b); b.click(); b.remove(); });
  await p.click('#layer [data-act=del-yes]');
  await p.waitForTimeout(6800);
  d = await db(); ok(d.games.length === 0, '삭제한 게임이 되돌리기 시간이 지나면 서버에서도 지워짐');

  // 로그아웃 → 내 게임이 화면에서 사라짐
  await p.click('.acct [data-act=sign-out]'); await p.waitForTimeout(600);
  ok((await p.innerText('.acct')).includes('로그인하지 않았어요') && !(await p.evaluate(() => __t.S.quotes.some((q) => q.cloudId))), '로그아웃하면 내 서버 게임이 화면에서 사라짐');
  ok(errs.length === 0, '화면 오류 없음 ' + errs.join(' | '));
  await b.close(); console.log(fail ? fail + '개 실패' : '모두 통과'); process.exit(fail ? 1 : 0);
})();

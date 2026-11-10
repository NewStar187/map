// 데이터베이스 구조와 토큰 규칙 검사. Supabase 없이 내장 Postgres(PGlite)로 schema.sql 을 그대로 실행한다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
// Supabase가 미리 만들어 두는 것들의 최소 흉내: auth.users, auth.uid(), 역할 anon/authenticated
await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role anon nologin; create role authenticated nologin;
  grant usage on schema public, auth to anon, authenticated;
  alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
`);
await db.exec(readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/seed.sql', import.meta.url), 'utf8'));

async function user(nick) { const r = await db.query(`insert into auth.users(raw_user_meta_data) values ($1) returning id`, [{ nickname: nick }]); return r.rows[0].id; }
// 그 사용자로 로그인한 것처럼 실행
async function as(uid, sql, params) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid || ''}', false); set role ${uid ? 'authenticated' : 'anon'};`);
  try { return await db.query(sql, params); } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`); }
}
const tokens = async (uid) => (await db.query(`select tokens from profiles where id = $1`, [uid])).rows[0].tokens;

const alice = await user('앨리스'), bob = await user('밥');
let workId;

test('가입하면 프로필과 토큰 30개가 생긴다', async () => {
  assert.equal(await tokens(alice), 30);
  assert.equal((await db.query(`select nickname from profiles where id = $1`, [alice])).rows[0].nickname, '앨리스');
});

test('사용자는 자기 토큰을 직접 고칠 수 없다', async () => {
  await assert.rejects(as(alice, `update profiles set tokens = 9999 where id = $1`, [alice]));
  await assert.rejects(as(alice, `insert into token_ledger(user_id, delta, reason) values ($1, 100, 'admin')`, [alice]));
  await assert.rejects(as(alice, `select add_tokens($1, 100, 'admin', null)`, [alice]));
  assert.equal(await tokens(alice), 30);
});

test('결과물을 올리면 토큰 10개를 받고, 하루 3번까지만 받는다', async () => {
  for (let i = 0; i < 4; i++) {
    const r = await as(alice, `insert into works(user_id, tool_id, cat, cls, title, file_path, star, sat, how) values ($1, 'pixellab', 'obj', 'pixel', $2, 'a.png', 4.5, 'over', 'human') returning id`, [alice, '기사 대기 걷기 ' + i]);
    if (i === 0) workId = r.rows[0].id;
  }
  assert.equal(await tokens(alice), 60);
  await as(alice, `insert into work_details(work_id, prompt, cost_krw, note) values ($1, '32x32 knight', 2400, '팔레트를 고정하면 좋아요')`, [workId]);
});

test('검토 중인 결과물은 남에게 안 보이고, 공개되면 보인다', async () => {
  assert.equal((await as(bob, `select id from works where id = $1`, [workId])).rows.length, 0);
  await db.query(`update works set status = 'visible' where id = $1`, [workId]);
  assert.equal((await as(bob, `select id from works where id = $1`, [workId])).rows.length, 1);
  assert.equal((await as(null, `select star from tool_cat_stats where tool_id = 'pixellab' and cat = 'obj'`)).rows[0].star, '4.50');
});

test('남이 올린 결과물은 상태를 바꿀 수 없다', async () => {
  const r = await as(bob, `update works set status = 'hidden' where id = $1 returning id`, [workId]);
  assert.equal(r.rows.length, 0);
});

test('프롬프트·들어간 돈·댓글은 토큰으로 열기 전에는 안 보인다', async () => {
  assert.equal((await as(bob, `select prompt from work_details where work_id = $1`, [workId])).rows.length, 0);
  await assert.rejects(as(bob, `insert into comments(work_id, user_id, body) values ($1, $2, '몰래 댓글')`, [workId, bob]));
});

test('열면 토큰 5개가 줄고, 두 번 열어도 한 번만 줄어든다', async () => {
  assert.equal((await as(bob, `select unlock('work', $1) as t`, [workId])).rows[0].t, 25);
  assert.equal((await as(bob, `select unlock('work', $1) as t`, [workId])).rows[0].t, 25);
  assert.equal((await as(bob, `select prompt from work_details where work_id = $1`, [workId])).rows[0].prompt, '32x32 knight');
  await as(bob, `insert into comments(work_id, user_id, body) values ($1, $2, '좋은 팁 고마워요')`, [workId, bob]);
  assert.equal(Number((await as(null, `select comments from work_counts where work_id = $1`, [workId])).rows[0].comments), 1);
});

test('내 결과물은 토큰 없이 열린다', async () => {
  const before = await tokens(alice);
  await as(alice, `select unlock('work', $1)`, [workId]);
  assert.equal(await tokens(alice), before);
});

test('토큰이 모자라면 열 수 없다', async () => {
  await db.query(`update profiles set tokens = 2 where id = $1`, [bob]);
  await assert.rejects(as(bob, `select unlock('reviews', 'pixellab')`), /NOT_ENOUGH_TOKENS/);
  assert.equal(await tokens(bob), 2);
});

test('도구를 평가하면 토큰 5개, 같은 도구는 한 번만', async () => {
  await as(bob, `insert into tool_reviews(tool_id, user_id, star, body) values ('pixellab', $1, 4, '도트 캐릭터에 좋아요')`, [bob]);
  assert.equal(await tokens(bob), 7);
  await assert.rejects(as(bob, `insert into tool_reviews(tool_id, user_id, star) values ('pixellab', $1, 5)`, [bob]));
  assert.equal(Number((await as(null, `select star, n from tool_stats where tool_id = 'pixellab'`)).rows[0].n), 1);
  assert.equal((await as(alice, `select body from tool_reviews where tool_id = 'pixellab'`)).rows.length, 0, '후기 글은 열기 전에는 안 보여야 함');
  await as(alice, `select unlock('reviews', 'pixellab')`);
  assert.equal((await as(alice, `select body from tool_reviews where tool_id = 'pixellab'`)).rows.length, 1);
});

test('자기 결과물에는 도움돼요를 누를 수 없다', async () => {
  await assert.rejects(as(alice, `insert into work_votes(work_id, user_id, helpful) values ($1, $2, true)`, [workId, alice]));
  await as(bob, `insert into work_votes(work_id, user_id, helpful, verdict) values ($1, $2, true, 'same')`, [workId, bob]);
});

test('내 게임은 나만 본다', async () => {
  await as(alice, `insert into games(user_id, name, quote_kind, setup, picks, qty) values ($1, '별빛 플랫포머', 'one', '{}', '{}', '{}')`, [alice]);
  assert.equal((await as(alice, `select name from games`)).rows.length, 1);
  assert.equal((await as(bob, `select name from games`)).rows.length, 0);
  await assert.rejects(as(bob, `insert into games(user_id, name, quote_kind, setup, picks, qty) values ($1, '남의 이름으로', 'one', '{}', '{}', '{}')`, [alice]));
});

test('기준 데이터는 운영자만 고친다', async () => {
  await assert.rejects(as(bob, `insert into notices(tool_id, title, body) values ('suno', '가짜 소식', '...')`));
  await db.query(`update profiles set is_admin = true where id = $1`, [alice]);
  await as(alice, `insert into notices(tool_id, severity, title, body) values ('suno', 'risk', '약관이 바뀌었어요', '내려받은 곡만 상업적으로 쓸 수 있어요')`);
  assert.equal((await as(null, `select title from notices`)).rows.length, 1);
});

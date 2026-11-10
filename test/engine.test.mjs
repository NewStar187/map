// 견적 엔진 자동 검사. 실행: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from './load-engine.mjs';

const e = loadEngine();
e.initialState();

function quotes(change) {
  const st = e.defaultSetup();
  if (change) change(st);
  e.syncSt(st); e.setRows(st); e.setQCache();
  const qty = e.qtyOf(st);
  const out = {};
  for (const s of e.STRATS) {
    const picks = e.stratPicks(s, st, qty, {}, null);
    out[s] = { picks, c: e.calc(picks, qty, {}, st) };
  }
  return { st, qty, out, rows: e.rowsOf(st) };
}

test('환율 계산: 달러 가격에 환율과 부가세 10%를 곱한다', () => {
  assert.equal(e.usd(10), Math.round(10 * 1341 * 1.1));
});

test('세 견적 모두, 개수가 있는 모든 에셋 줄에 쓸 수 있는 방법을 하나씩 고른다', () => {
  const { st, qty, out, rows } = quotes();
  for (const s of e.STRATS) {
    for (const r of rows) {
      if (!(qty[r.id] > 0)) continue;
      const o = e.optOf(r, out[s].picks[r.id]);
      assert.ok(o, `${s}: ${r.id} 줄에 고른 방법이 없음`);
      assert.ok(e.allowed(r, o, st), `${s}: ${r.id} 줄에 허용되지 않는 방법을 고름`);
    }
  }
});

test('Lite는 새로 돈을 쓰지 않고, Balance는 유료 도구를 하나까지만 쓴다', () => {
  const { out } = quotes();
  assert.equal(out.free.c.monthly, 0);
  assert.equal(out.free.c.paidN, 0);
  assert.ok(out.one.c.paidN <= 1);
});

test('어느 견적도 월 추가 예산을 넘지 않는다', () => {
  for (const budget of [0, 10000, 30000, 50000, 100000]) {
    const { out } = quotes((st) => { st.budget = budget; });
    for (const s of e.STRATS) assert.ok(out[s].c.monthly <= budget, `${s}: 예산 ${budget}원에 월 ${out[s].c.monthly}원`);
  }
});

test('Quality의 평균 별점은 Lite, Balance보다 낮지 않다', () => {
  const { out } = quotes((st) => { st.budget = 50000; });
  assert.ok(out.best.c.qavg >= out.one.c.qavg - 1e-9);
  assert.ok(out.best.c.qavg >= out.free.c.qavg - 1e-9);
});

test('예산을 올려도 Quality의 평균 별점이 내려가지 않는다', () => {
  let prev = -1;
  for (const budget of [0, 10000, 30000, 50000, 100000]) {
    const { out } = quotes((st) => { st.budget = budget; });
    assert.ok(out.best.c.qavg >= prev - 1e-9, `예산 ${budget}원에서 별점이 내려감`);
    prev = out.best.c.qavg;
  }
});

test('같은 조건이면 항상 같은 견적이 나온다', () => {
  const a = quotes(), b = quotes();
  // 묶음 id는 만들 때마다 달라지므로 줄 순서대로 고른 도구만 비교한다
  const seq = (x, s) => x.rows.map((r) => x.out[s].picks[r.id]);
  for (const s of e.STRATS) assert.deepEqual(seq(a, s), seq(b, s));
});

test('이미 쓰는 도구는 추가 비용이 0원이다', () => {
  const base = quotes((st) => { st.budget = 30000; });
  const owned = quotes((st) => { st.budget = 30000; st.have = st.have.concat(['pixellab']); st.havePlan = Object.assign({}, st.havePlan, { pixellab: 'apprentice' }); });
  const usesPixel = Object.values(owned.out.one.picks).includes('pixellab');
  if (usesPixel) assert.ok(!owned.out.one.c.used.pixellab, 'PixelLab을 쓰는 중인데 구독료가 잡힘');
  assert.ok(owned.out.one.c.monthly <= base.out.one.c.monthly);
});

test('모든 장르와 그림체에서 오류 없이 견적이 나온다', () => {
  for (const g of Object.keys(e.GENRE)) for (const sty of Object.keys(e.STYLES)) {
    const { out } = quotes((st) => { st.genres = [g]; st.inv = e.invFromGenres([g]); st.styles = [sty]; st.style = sty; });
    for (const s of e.STRATS) assert.ok(Number.isFinite(out[s].c.monthly), `${g}/${sty}/${s}`);
  }
});

test('말로 고치기: 묶음 개수, 기타 에셋, 큰 기능', () => {
  const st = e.syncSt(e.defaultSetup());
  const enemy = st.inv.obj.find((g) => g.name === '적');
  e.applyEdits('적은 10종쯤 있어', st, 'intake');
  assert.equal(enemy.n, 10);
  e.applyEdits('컷신 그림 10장 추가해 줘', st, 'intake');
  assert.deepEqual(st.inv.custom.map((c) => [c.name, c.n, c.kind]), [['컷신 그림', 10, 'art']]);
  e.applyEdits('배경음악 5곡', st, 'intake');
  assert.equal(st.inv.bgm, 5);
  e.applyEdits('튜토리얼도 넣을 거야', st, 'intake');
  assert.equal(st.inv.feat.tutorial, true);
  e.applyEdits('튜토리얼은 빼 줘', st, 'intake');
  assert.equal(st.inv.feat.tutorial, false);
});

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
  // 가진 도구는 공짜로 치므로 Lite도 쓸 수 있고, 그래도 Lite는 0원이다
  assert.equal(owned.out.free.c.monthly, 0);
  assert.ok(Object.values(owned.out.free.picks).includes('pixellab'), 'PixelLab을 쓰는 중인데 Lite가 활용하지 않음');
  for (const s of e.STRATS) assert.ok(!owned.out[s].c.used.pixellab, s + ': 쓰는 중인 PixelLab에 구독료가 잡힘');
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

test('서버에서 추가한 도구: 목록만이면 선택지에만 나오고, 검증됨이면 추천 후보가 된다', () => {
  const tool = { id: 'testgen', name: 'TestGen', ai: true, status: 'listed', terms_note: '유료 플랜은 상업적 이용 가능' };
  const plans = [{ plan_key: 'free', name: '무료', usd_month: 0, usd_once: 0, rights: 'none' }, { plan_key: 'pro', name: 'Pro', usd_month: 8, usd_once: 0, rights: 'ok', is_default: true }];
  const caps = [{ cat: 'illus', cls: ['pixel', '2d'], method: 'ai' }, { cat: 'bgm', cls: null, method: 'ai' }];
  assert.equal(e.registerExtTool(tool, plans, caps), true);
  assert.equal(e.TOOLS.testgen.usd, 8);
  let q = quotes((st) => { st.budget = 50000; });
  const illus = q.rows.find((r) => r.id === 'illus'), bgm = q.rows.find((r) => r.id === 'bgm'), ui = q.rows.find((r) => r.id === 'ui');
  assert.ok(illus.opts.some((o) => o.t === 'testgen' && o.noAuto), '일러스트 줄에 목록만 선택지로 나와야 함');
  assert.ok(bgm.opts.some((o) => o.t === 'testgen'), '배경음악 줄에도 나와야 함');
  assert.ok(!ui.opts.some((o) => o.t === 'testgen'), '맡지 않는 에셋 줄에는 나오면 안 됨');
  assert.ok(illus.opts.findIndex((o) => o.t === 'testgen') < illus.opts.length, '선택지 순서 유지');
  for (const s of e.STRATS) assert.ok(!Object.values(q.out[s].picks).includes('testgen'), s + ': 목록만 도구를 자동으로 고르면 안 됨');
  // 3D 그림체에서는 일러스트 선택지에 나오지 않는다(맡는 그림체가 도트·2D뿐)
  const q3 = quotes((st) => { const k = Object.keys(e.STYLES).find((x) => e.STYLES[x].cls === '3d'); st.styles = [k]; st.style = k; });
  assert.ok(!q3.rows.find((r) => r.id === 'illus').opts.some((o) => o.t === 'testgen'));
  // 검증됨으로 바꾸면 자동 추천 후보가 된다
  e.registerExtTool(Object.assign({}, tool, { status: 'verified' }), plans, caps);
  q = quotes((st) => { st.budget = 50000; });
  assert.ok(q.rows.find((r) => r.id === 'illus').opts.some((o) => o.t === 'testgen' && !o.noAuto));
  // 기본 도구는 서버 등록으로 덮어쓰지 않는다
  assert.equal(e.registerExtTool({ id: 'pixellab', name: '바뀐 이름', ai: true }, [], []), false);
  assert.equal(e.TOOLS.pixellab.name, 'PixelLab');
});

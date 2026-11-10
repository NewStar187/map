// 검사용 가짜 Supabase 라이브러리. 브라우저에서 window.supabase 를 흉내 낸다.
// 데이터는 메모리에 두고, 토큰·잠금 같은 핵심 규칙은 schema.sql 과 같게 흉내 낸다(실제 규칙 검사는 db.test.mjs 가 한다).
(function () {
  var ME = '11111111-1111-4111-8111-111111111111', OTHER = '22222222-2222-4222-8222-222222222222', W1 = '33333333-3333-4333-8333-333333333333';
  var db = window.__mockdb = {
    profiles: [{ id: ME, nickname: '테스트유저', tokens: 30, is_admin: false }, { id: OTHER, nickname: '도트장인', tokens: 30, is_admin: false }],
    tool_plans: [{ tool_id: 'pixellab', plan_key: 'apprentice', usd_month: 12, usd_once: 0, rights: 'ok' }],
    tool_stats: [], examples: [], games: [], work_votes: [], comments: [], tool_reviews: [], unlocks: [], reports: [],
    works: [{ id: W1, user_id: OTHER, tool_id: 'pixellab', cat: 'obj', cls: 'pixel', engine: 'Godot', title: '서버에서 온 기사 스프라이트', file_path: OTHER + '/w1.png', star: 4.5, sat: 'over', how: 'as', tries: 2, status: 'visible', created_at: new Date(Date.now() - 2 * 864e5).toISOString() }],
    work_details: [{ work_id: W1, prompt: 'server knight prompt', cost_krw: 1200, note: '서버 작성자의 말' }],
    uploads: [], calls: []
  };
  var session = null, listeners = [];
  function rows(t) { return db[t] || (db[t] = []); }
  function counts() { return db.works.filter(function (w) { return w.status === 'visible'; }).map(function (w) { var v = db.work_votes.filter(function (x) { return x.work_id === w.id; }); return { work_id: w.id, helpful: v.filter(function (x) { return x.helpful; }).length, same: v.filter(function (x) { return x.verdict === 'same'; }).length, diff: v.filter(function (x) { return x.verdict === 'diff'; }).length, comments: db.comments.filter(function (c) { return c.work_id === w.id; }).length }; }); }
  function uid() { return session && session.user.id; }
  function unlocked(kind, target) { return db.unlocks.some(function (u) { return u.user_id === uid() && u.kind === kind && u.target === target; }); }
  function visible(t, r) {
    if (t === 'games') return r.user_id === uid();
    if (t === 'works') return r.status === 'visible' || r.user_id === uid();
    if (t === 'work_details' || t === 'comments') { var w = db.works.filter(function (x) { return x.id === r.work_id; })[0]; return w && (w.user_id === uid() || unlocked('work', r.work_id)); }
    if (t === 'tool_reviews') return r.user_id === uid() || unlocked('reviews', r.tool_id);
    if (t === 'unlocks' || t === 'work_votes') return r.user_id === uid();
    return true;
  }
  function Q(t) { this.t = t; this.f = []; this.op = 'select'; this.one = 0; }
  Q.prototype.select = function () { return this; };
  Q.prototype.eq = function (k, v) { this.f.push(function (r) { return r[k] === v; }); return this; };
  Q.prototype.in = function (k, vs) { this.f.push(function (r) { return vs.indexOf(r[k]) >= 0; }); return this; };
  Q.prototype.order = function () { return this; };
  Q.prototype.limit = function () { return this; };
  Q.prototype.single = function () { this.one = 1; return this; };
  Q.prototype.maybeSingle = function () { this.one = 2; return this; };
  Q.prototype.insert = function (o) { this.op = 'insert'; this.val = o; return this; };
  Q.prototype.upsert = function (o) { this.op = 'upsert'; this.val = o; return this; };
  Q.prototype.update = function (o) { this.op = 'update'; this.val = o; return this; };
  Q.prototype.delete = function () { this.op = 'delete'; return this; };
  Q.prototype.then = function (res, rej) {
    var self = this, t = this.t; db.calls.push(this.op + ':' + t);
    var out = (function () {
      if (t === 'work_counts') return { data: counts(), error: null };
      var all = rows(t);
      if (self.op === 'insert' || self.op === 'upsert') {
        if (!uid() && t !== 'reports') return { data: null, error: { message: 'not authenticated' } };
        var o = Object.assign({}, self.val);
        if (t === 'works') { o.status = 'pending'; o.created_at = new Date().toISOString(); var p = db.profiles.filter(function (x) { return x.id === uid(); })[0]; p.tokens += 10; }
        if (t === 'comments') { o.id = db.comments.length + 100; o.created_at = new Date().toISOString(); }
        if (t === 'tool_reviews') { var had = all.some(function (x) { return x.tool_id === o.tool_id && x.user_id === o.user_id; }); if (!had) db.profiles.filter(function (x) { return x.id === uid(); })[0].tokens += 5; }
        var keyOf = { games: ['id'], work_votes: ['work_id', 'user_id'], tool_reviews: ['tool_id', 'user_id'] }[t];
        if (self.op === 'upsert' && keyOf) { var i = all.findIndex(function (x) { return keyOf.every(function (k) { return x[k] === o[k]; }); }); if (i >= 0) { all[i] = Object.assign(all[i], o); return { data: null, error: null }; } }
        if (t === 'games') o.updated_at = new Date().toISOString();
        all.push(o); return { data: null, error: null };
      }
      var hit = all.filter(function (r) { return visible(t, r) && self.f.every(function (f) { return f(r); }); });
      if (self.op === 'delete') { db[t] = all.filter(function (r) { return hit.indexOf(r) < 0; }); return { data: null, error: null }; }
      if (self.op === 'update') { hit.forEach(function (r) { Object.assign(r, self.val); }); return { data: null, error: null }; }
      var data = JSON.parse(JSON.stringify(hit));
      if (self.one === 1) return data.length ? { data: data[0], error: null } : { data: null, error: { message: 'no rows' } };
      if (self.one === 2) return { data: data[0] || null, error: null };
      return { data: data, error: null };
    })();
    return Promise.resolve(out).then(res, rej);
  };
  function emit(ev) { listeners.forEach(function (f) { f(ev, session); }); }
  window.supabase = {
    createClient: function () {
      return {
        from: function (t) { return new Q(t); },
        rpc: function (name, a) {
          db.calls.push('rpc:' + name);
          if (!uid()) return Promise.resolve({ data: null, error: { message: 'LOGIN_REQUIRED' } });
          var me = db.profiles.filter(function (x) { return x.id === uid(); })[0], cost = a.p_kind === 'work' ? 5 : 3;
          if (unlocked(a.p_kind, a.p_target)) return Promise.resolve({ data: me.tokens, error: null });
          if (me.tokens < cost) return Promise.resolve({ data: null, error: { message: 'NOT_ENOUGH_TOKENS' } });
          me.tokens -= cost; db.unlocks.push({ user_id: uid(), kind: a.p_kind, target: a.p_target }); return Promise.resolve({ data: me.tokens, error: null });
        },
        auth: {
          getSession: function () { return Promise.resolve({ data: { session: session } }); },
          onAuthStateChange: function (f) { listeners.push(f); return { data: { subscription: { unsubscribe: function () {} } } }; },
          signInWithPassword: function (c) { if (c.password !== 'right-password') return Promise.resolve({ data: {}, error: { message: 'Invalid login credentials' } }); session = { user: { id: ME, email: c.email } }; setTimeout(function () { emit('SIGNED_IN'); }, 0); return Promise.resolve({ data: { session: session }, error: null }); },
          signUp: function () { return Promise.resolve({ data: { session: null }, error: null }); },
          signOut: function () { session = null; setTimeout(function () { emit('SIGNED_OUT'); }, 0); return Promise.resolve({ error: null }); }
        },
        storage: { from: function (b) { return {
          upload: function (p, f) { db.uploads.push({ bucket: b, path: p, name: f && f.name }); return Promise.resolve({ data: { path: p }, error: null }); },
          getPublicUrl: function (p) { return { data: { publicUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' + '#' + b + '/' + p } }; }
        }; } }
      };
    }
  };
})();

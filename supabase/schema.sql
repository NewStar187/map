-- MAP (My Asset Preset) 데이터베이스 구조
-- Supabase 대시보드의 SQL Editor에 그대로 붙여 넣어 실행한다. 여러 번 실행해도 안전하지 않으므로 새 프로젝트에서 한 번만 실행한다.
-- 원칙
--   1) 토큰은 브라우저가 아니라 여기서만 계산한다(사용자가 숫자를 바꿀 수 없다).
--   2) 프롬프트·들어간 돈·작성자의 말·댓글·도구 후기 글은 토큰으로 연 사람만 읽을 수 있다.
--   3) 별점 평균은 누구나 볼 수 있다(견적 엔진이 쓴다).

-- ============================== 사용자 ==============================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nickname    text not null default '이름 없는 개발자' check (char_length(nickname) between 1 and 20),
  tokens      integer not null default 0 check (tokens >= 0),
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.token_ledger (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  delta       integer not null,
  reason      text not null check (reason in ('signup', 'upload', 'tool_review', 'unlock_work', 'unlock_reviews', 'admin')),
  ref         text,
  created_at  timestamptz not null default now()
);
create index token_ledger_user on public.token_ledger(user_id, created_at desc);

-- ============================== 도구 기준 데이터(운영자가 관리) ==============================
create table public.tools (
  id              text primary key,                      -- 예: pixellab
  name            text not null,
  ai              boolean not null default false,       -- 생성형 AI 도구인가
  self_made       boolean not null default false,       -- '직접 그리기'처럼 사람이 만드는 방법인가
  billing         text,                                  -- 예: 구독, 한 번 구매, 무료
  color           text,
  cats            text[] not null default '{}',          -- 만들 수 있는 에셋 종류: obj scene ui illus sfx bgm code text
  site_url        text,
  pricing_url     text,
  terms_url       text,
  terms_note      text,                                  -- 상업적 이용 조건을 한두 문장으로
  checked_on      date,                                  -- 운영자가 가격과 약관을 마지막으로 확인한 날
  status          text not null default 'listed' check (status in ('verified', 'listed')),  -- 검증됨(자동 추천) / 목록만(선택지로만)
  alias           text,                                  -- 도우미가 알아들을 다른 이름
  gpu_min_gb      integer,                               -- 내 PC에서 돌리는 도구의 최소 그래픽카드 메모리
  active          boolean not null default true
);

-- 어느 도구가 어떤 에셋을 어떤 그림체로 어떻게 만드는가(운영 화면에서 추가한 도구용)
create table public.tool_caps (
  tool_id  text not null references public.tools(id) on delete cascade,
  cat      text not null check (cat in ('obj', 'scene', 'ui', 'illus', 'sfx', 'bgm', 'code', 'text')),
  cls      text[],
  method   text not null default 'ai' check (method in ('ai', 'free', 'direct')),
  note     text,
  primary key (tool_id, cat)
);

create table public.tool_plans (
  id          bigint generated always as identity primary key,
  tool_id     text not null references public.tools(id) on delete cascade,
  plan_key    text not null,
  name        text not null,
  usd_month   numeric(8,2) not null default 0,
  usd_once    numeric(8,2) not null default 0,
  rights      text not null check (rights in ('ok', 'attr', 'none', 'check')), -- 가능 / 출처 표시하면 가능 / 안 됨 / 확인 필요
  price_estimated boolean not null default false,       -- 공식 가격표가 아닌 값으로 넣었는가
  note        text,
  is_default  boolean not null default false,
  unique (tool_id, plan_key)
);

-- 에셋 종류마다 하나씩 두는 기준 프롬프트와, 그 프롬프트로 팀이 직접 뽑은 예시 결과물
create table public.base_prompts (
  cat     text primary key check (cat in ('obj', 'scene', 'ui', 'illus', 'sfx', 'bgm', 'code', 'text')),
  prompt  text not null,
  note    text
);
create table public.examples (
  id          bigint generated always as identity primary key,
  tool_id     text not null references public.tools(id) on delete cascade,
  cat         text not null references public.base_prompts(cat),
  slot        smallint not null check (slot between 1 and 4),
  caption     text,
  file_path   text not null,                             -- storage 버킷 'examples' 안의 경로
  made_on     date not null default current_date,
  unique (tool_id, cat, slot)
);

-- 약관·가격 변경 소식(운영자가 등록)
create table public.notices (
  id            bigint generated always as identity primary key,
  tool_id       text not null references public.tools(id) on delete cascade,
  severity      text not null default 'info' check (severity in ('risk', 'todo', 'info')),
  title         text not null,
  body          text not null,
  action        text,                                    -- 사용자가 할 일
  source_url    text,
  effective_on  date,
  created_at    timestamptz not null default now()
);

-- ============================== 내 게임 ==============================
create table public.games (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 30),
  quote_kind  text not null check (quote_kind in ('free', 'one', 'best')),   -- Lite / Balance / Quality
  setup       jsonb not null,                            -- 장르, 그림체, 예산, 에셋 구성 등 조건
  picks       jsonb not null,                            -- 에셋 줄마다 고른 도구
  qty         jsonb not null,
  buy         jsonb not null default '{}',
  chat        jsonb not null default '[]',               -- 도우미 대화(나중에 그대로 고치기 위해)
  store_month date,
  platforms   text[] not null default '{steam}',
  remind      boolean not null default true,
  email       boolean not null default false,
  disclosure  jsonb not null default '{}',               -- 스토어 AI 고지문 진행 상태
  data        jsonb not null default '{}',               -- 화면이 쓰는 게임 기록 전체(견적, 작업 기록, 고지문 진행 상태)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index games_user on public.games(user_id, updated_at desc);

create table public.work_logs (
  id          bigint generated always as identity primary key,
  game_id     uuid not null references public.games(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  row_id      text not null,
  tool_id     text references public.tools(id),
  n           integer not null check (n > 0),
  how         text not null check (how in ('as', 'aiedit', 'human', 'both', 'self', 'pack', 'help')),
  paid        boolean,
  pack_mark   text check (pack_mark in ('ai', 'noai', 'unknown')),
  made_on     date not null default current_date,
  created_at  timestamptz not null default now()
);
create index work_logs_game on public.work_logs(game_id);

-- ============================== 커뮤니티 ==============================
-- 결과물의 공개 부분: 그림, 제목, 작성자 별점. 누구나 본다.
create table public.works (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  tool_id     text not null references public.tools(id),
  cat         text not null check (cat in ('obj', 'scene', 'ui', 'illus', 'sfx', 'bgm', 'code', 'text')),
  cls         text check (cls in ('pixel', '2d', '3d')),
  engine      text,
  title       text not null check (char_length(title) between 5 and 40),
  file_path   text not null,                             -- storage 버킷 'works' 안의 경로
  star        numeric(2,1) not null check (star between 1 and 5),
  sat         text not null check (sat in ('over', 'meet', 'under')),
  how         text check (how in ('as', 'aiedit', 'human', 'both')),
  tries       smallint check (tries between 1 and 99),
  status      text not null default 'pending' check (status in ('pending', 'visible', 'hidden')),
  created_at  timestamptz not null default now()
);
create index works_tool on public.works(tool_id, cat, status);

-- 결과물의 잠긴 부분: 토큰으로 연 사람과 작성자만 본다.
create table public.work_details (
  work_id   uuid primary key references public.works(id) on delete cascade,
  prompt    text,
  cost_krw  integer check (cost_krw >= 0),
  note      text check (char_length(note) <= 300)
);

create table public.work_votes (
  work_id   uuid not null references public.works(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  helpful   boolean not null default false,
  verdict   text check (verdict in ('same', 'diff')),
  primary key (work_id, user_id)
);

create table public.comments (
  id          bigint generated always as identity primary key,
  work_id     uuid not null references public.works(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  parent_id   bigint references public.comments(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 200),
  created_at  timestamptz not null default now()
);
create index comments_work on public.comments(work_id, created_at);

-- 도구 자체에 대한 평가(한 사람이 도구마다 하나)
create table public.tool_reviews (
  tool_id     text not null references public.tools(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  star        smallint not null check (star between 1 and 5),
  body        text check (char_length(body) <= 60),
  created_at  timestamptz not null default now(),
  primary key (tool_id, user_id)
);

create table public.unlocks (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('work', 'reviews')),
  target      text not null,                             -- work: 결과물 id / reviews: 도구 id
  created_at  timestamptz not null default now(),
  primary key (user_id, kind, target)
);

create table public.reports (
  id          bigint generated always as identity primary key,
  work_id     uuid not null references public.works(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  reason      text,
  created_at  timestamptz not null default now(),
  unique (work_id, user_id)
);

-- ============================== 도움 함수 ==============================
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create function public.has_unlock(p_kind text, p_target text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.unlocks where user_id = auth.uid() and kind = p_kind and target = p_target);
$$;

-- 토큰을 더하거나 뺀다. 화면에서 직접 부를 수 없고 아래 함수와 트리거만 쓴다.
create function public.add_tokens(p_user uuid, p_delta integer, p_reason text, p_ref text) returns integer
language plpgsql security definer set search_path = public as $$
declare v_new integer;
begin
  update public.profiles set tokens = tokens + p_delta where id = p_user and tokens + p_delta >= 0 returning tokens into v_new;
  if v_new is null then raise exception 'NOT_ENOUGH_TOKENS' using errcode = 'P0001'; end if;
  insert into public.token_ledger(user_id, delta, reason, ref) values (p_user, p_delta, p_reason, p_ref);
  return v_new;
end $$;
revoke all on function public.add_tokens(uuid, integer, text, text) from public;

-- 가입하면 프로필을 만들고 토큰 30개를 준다.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, nickname) values (new.id, coalesce(nullif(left(new.raw_user_meta_data->>'nickname', 20), ''), '이름 없는 개발자'));
  perform public.add_tokens(new.id, 30, 'signup', null);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- 토큰으로 열기. 화면은 select unlock('work', '<결과물 id>') 또는 unlock('reviews', '<도구 id>') 로 부른다. 남은 토큰을 돌려준다.
create function public.unlock(p_kind text, p_target text) returns integer
language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_cost integer; v_left integer;
begin
  if v_user is null then raise exception 'LOGIN_REQUIRED' using errcode = 'P0001'; end if;
  if p_kind = 'work' then
    v_cost := 5;
    if not exists (select 1 from public.works where id = p_target::uuid and status = 'visible') then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
    if exists (select 1 from public.works where id = p_target::uuid and user_id = v_user) then return (select tokens from public.profiles where id = v_user); end if;
  elsif p_kind = 'reviews' then
    v_cost := 3;
    if not exists (select 1 from public.tools where id = p_target) then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  else
    raise exception 'BAD_KIND' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.unlocks where user_id = v_user and kind = p_kind and target = p_target) then
    return (select tokens from public.profiles where id = v_user);            -- 이미 열었으면 다시 받지 않는다
  end if;
  v_left := public.add_tokens(v_user, -v_cost, 'unlock_' || p_kind, p_target);
  insert into public.unlocks(user_id, kind, target) values (v_user, p_kind, p_target);
  return v_left;
end $$;

-- 결과물을 올리면 토큰 10개. 하루에 3번까지만 준다(도배 방지).
create function public.reward_upload() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.token_ledger where user_id = new.user_id and reason = 'upload' and created_at > now() - interval '1 day') < 3 then
    perform public.add_tokens(new.user_id, 10, 'upload', new.id::text);
  end if;
  return new;
end $$;
create trigger works_reward after insert on public.works for each row execute function public.reward_upload();

-- 도구를 처음 평가하면 토큰 5개(도구마다 한 번: 기본 키가 막아 준다).
create function public.reward_tool_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.add_tokens(new.user_id, 5, 'tool_review', new.tool_id);
  return new;
end $$;
create trigger tool_reviews_reward after insert on public.tool_reviews for each row execute function public.reward_tool_review();

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger games_touch before update on public.games for each row execute function public.touch_updated_at();

-- ============================== 누구나 보는 집계 ==============================
-- 견적 엔진이 쓰는 에셋별 별점: 도구 × 에셋 종류 × 그림체 갈래. 공개된 결과물만 센다.
create view public.tool_cat_stats with (security_invoker = off) as
  select tool_id, cat, coalesce(cls, '') as cls,
         round(avg(star), 2) as star, count(*) as n,
         count(*) filter (where how = 'as') as n_as,
         count(*) filter (where how = 'aiedit') as n_aiedit,
         count(*) filter (where how in ('human', 'both')) as n_human
  from public.works where status = 'visible'
  group by tool_id, cat, coalesce(cls, '');

-- 도구 총 별점: 글 내용 없이 평균과 사람 수만.
create view public.tool_stats with (security_invoker = off) as
  select tool_id, round(avg(star), 2) as star, count(*) as n from public.tool_reviews group by tool_id;

-- 결과물 카드에 붙는 숫자(도움돼요, 비슷했어요, 달랐어요, 댓글 수)
create view public.work_counts with (security_invoker = off) as
  select w.id as work_id,
         (select count(*) from public.work_votes v where v.work_id = w.id and v.helpful) as helpful,
         (select count(*) from public.work_votes v where v.work_id = w.id and v.verdict = 'same') as same,
         (select count(*) from public.work_votes v where v.work_id = w.id and v.verdict = 'diff') as diff,
         (select count(*) from public.comments c where c.work_id = w.id) as comments
  from public.works w where w.status = 'visible';

-- ============================== 접근 규칙(RLS) ==============================
alter table public.profiles      enable row level security;
alter table public.token_ledger  enable row level security;
alter table public.tools         enable row level security;
alter table public.tool_plans    enable row level security;
alter table public.tool_caps     enable row level security;
alter table public.base_prompts  enable row level security;
alter table public.examples      enable row level security;
alter table public.notices       enable row level security;
alter table public.games         enable row level security;
alter table public.work_logs     enable row level security;
alter table public.works         enable row level security;
alter table public.work_details  enable row level security;
alter table public.work_votes    enable row level security;
alter table public.comments      enable row level security;
alter table public.tool_reviews  enable row level security;
alter table public.unlocks       enable row level security;
alter table public.reports       enable row level security;

-- 프로필: 닉네임은 누구나 보고, 고치는 것은 본인 닉네임만. 토큰과 관리자 여부는 화면에서 못 고친다.
create policy profiles_read on public.profiles for select using (true);
create policy profiles_update_own on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (nickname) on public.profiles to authenticated;

create policy ledger_read_own on public.token_ledger for select using (user_id = auth.uid());
revoke insert, update, delete on public.token_ledger from anon, authenticated;

-- 기준 데이터: 누구나 읽고 운영자만 고친다.
create policy tools_read on public.tools for select using (true);
create policy tools_admin on public.tools for all using (public.is_admin()) with check (public.is_admin());
create policy plans_read on public.tool_plans for select using (true);
create policy plans_admin on public.tool_plans for all using (public.is_admin()) with check (public.is_admin());
create policy caps_read on public.tool_caps for select using (true);
create policy caps_admin on public.tool_caps for all using (public.is_admin()) with check (public.is_admin());
create policy prompts_read on public.base_prompts for select using (true);
create policy prompts_admin on public.base_prompts for all using (public.is_admin()) with check (public.is_admin());
create policy examples_read on public.examples for select using (true);
create policy examples_admin on public.examples for all using (public.is_admin()) with check (public.is_admin());
create policy notices_read on public.notices for select using (true);
create policy notices_admin on public.notices for all using (public.is_admin()) with check (public.is_admin());

-- 내 게임과 작업 기록: 본인만.
create policy games_own on public.games for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy logs_own on public.work_logs for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 결과물: 공개된 것은 누구나, 검토 중인 것은 본인과 운영자만. 올린 뒤 상태는 운영자만 바꾼다.
create policy works_read on public.works for select using (status = 'visible' or user_id = auth.uid() or public.is_admin());
create policy works_insert on public.works for insert with check (user_id = auth.uid() and status = 'pending');
create policy works_delete_own on public.works for delete using (user_id = auth.uid() or public.is_admin());
create policy works_admin_update on public.works for update using (public.is_admin()) with check (public.is_admin());

-- 잠긴 부분: 작성자, 토큰으로 연 사람, 운영자.
create policy details_read on public.work_details for select using (
  exists (select 1 from public.works w where w.id = work_id and w.user_id = auth.uid())
  or public.has_unlock('work', work_id::text) or public.is_admin());
create policy details_insert on public.work_details for insert with check (
  exists (select 1 from public.works w where w.id = work_id and w.user_id = auth.uid()));

-- 평가(도움돼요 등): 누르는 것은 로그인한 사람 누구나, 자기 결과물에는 못 누른다. 개수는 work_counts 로 본다.
create policy votes_read_own on public.work_votes for select using (user_id = auth.uid());
create policy votes_write on public.work_votes for insert with check (
  user_id = auth.uid() and not exists (select 1 from public.works w where w.id = work_id and w.user_id = auth.uid()));
create policy votes_update on public.work_votes for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 댓글: 읽기와 쓰기 모두 그 결과물을 연 사람과 작성자.
create policy comments_read on public.comments for select using (
  exists (select 1 from public.works w where w.id = work_id and w.user_id = auth.uid())
  or public.has_unlock('work', work_id::text) or public.is_admin());
create policy comments_write on public.comments for insert with check (
  user_id = auth.uid() and (exists (select 1 from public.works w where w.id = work_id and w.user_id = auth.uid()) or public.has_unlock('work', work_id::text)));
create policy comments_delete on public.comments for delete using (user_id = auth.uid() or public.is_admin());

-- 도구 후기 글: 내 글, 또는 그 도구의 후기를 연 사람. 평균 별점은 tool_stats 로 누구나.
create policy reviews_read on public.tool_reviews for select using (user_id = auth.uid() or public.has_unlock('reviews', tool_id) or public.is_admin());
create policy reviews_write on public.tool_reviews for insert with check (user_id = auth.uid());
create policy reviews_update on public.tool_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy unlocks_read_own on public.unlocks for select using (user_id = auth.uid());
revoke insert, update, delete on public.unlocks from anon, authenticated;

create policy reports_write on public.reports for insert with check (user_id = auth.uid());
create policy reports_admin on public.reports for select using (public.is_admin());

grant select on public.tool_cat_stats, public.tool_stats, public.work_counts to anon, authenticated;
grant execute on function public.unlock(text, text) to authenticated;
grant execute on function public.is_admin(), public.has_unlock(text, text) to anon, authenticated;

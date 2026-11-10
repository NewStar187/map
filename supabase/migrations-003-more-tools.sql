-- 도구를 코드 수정 없이 늘리기 위한 변경. Supabase SQL Editor에서 한 번 실행한다(여러 번 실행해도 안전하다).
-- 1) 도구의 상태: verified(검증됨, 자동 추천에 들어감) / listed(목록만, 선택지로만 나옴)
alter table public.tools add column if not exists status text not null default 'listed' check (status in ('verified', 'listed'));
alter table public.tools add column if not exists alias text;              -- 도우미가 알아들을 다른 이름(예: 미드저니)
alter table public.tools add column if not exists gpu_min_gb integer;      -- 내 PC에서 돌리는 도구의 최소 그래픽카드 메모리
-- 지금까지 있던 15개는 화면 코드에 규칙이 들어 있는 기본 도구다.
update public.tools set status = 'verified' where id in ('pixellab','retro','zimage','unityai','midjourney','meshy','eleven','suno','claude','copilot','aseprite','jsfxr','kenney','blender','quaternius');

-- 2) 어느 도구가 어떤 에셋을 어떤 그림체로 어떻게 만드는가
create table if not exists public.tool_caps (
  tool_id  text not null references public.tools(id) on delete cascade,
  cat      text not null check (cat in ('obj', 'scene', 'ui', 'illus', 'sfx', 'bgm', 'code', 'text')),
  cls      text[],                                                         -- 맡는 그림체 갈래: pixel, 2d, 3d. 비우면 모두
  method   text not null default 'ai' check (method in ('ai', 'free', 'direct')),  -- AI로 만들기 / 무료 에셋 받기 / 직접 만들기
  note     text,
  primary key (tool_id, cat)
);
alter table public.tool_caps enable row level security;
drop policy if exists caps_read on public.tool_caps;
drop policy if exists caps_admin on public.tool_caps;
create policy caps_read on public.tool_caps for select using (true);
create policy caps_admin on public.tool_caps for all using (public.is_admin()) with check (public.is_admin());
grant select on public.tool_caps to anon, authenticated;
grant insert, update, delete on public.tool_caps to authenticated;

-- 3) 운영자가 예시 결과물 파일을 바꿔 올릴 수 있게
drop policy if exists examples_admin_update on storage.objects;
create policy examples_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'examples' and public.is_admin()) with check (bucket_id = 'examples' and public.is_admin());

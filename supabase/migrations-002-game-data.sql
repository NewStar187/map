-- 화면 연결용 추가 변경. schema.sql 을 이미 실행한 프로젝트에서 한 번 실행한다.
-- 저장한 게임의 전체 기록(견적, 작업 기록, 스토어 AI 고지문 진행 상태)을 한 칸에 담는다.
alter table public.games add column if not exists data jsonb not null default '{}';

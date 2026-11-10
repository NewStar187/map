-- 파일 저장소 설정. schema.sql 다음에 SQL Editor에서 실행한다.
-- works: 사용자가 올리는 결과물 파일. 누구나 볼 수 있고, 올리기는 로그인한 사람이 자기 폴더(자기 id)에만.
-- examples: 팀이 기준 프롬프트로 뽑은 예시. 누구나 보고 운영자만 올린다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('works', 'works', true, 10485760, array['image/png', 'image/gif', 'image/webp', 'audio/wav', 'audio/mpeg', 'text/plain']),
       ('examples', 'examples', true, 10485760, array['image/png', 'image/gif', 'image/webp', 'audio/wav', 'audio/mpeg', 'text/plain']);

create policy works_upload_own on storage.objects for insert to authenticated
  with check (bucket_id = 'works' and (storage.foldername(name))[1] = auth.uid()::text);
create policy works_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'works' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy examples_admin_write on storage.objects for insert to authenticated
  with check (bucket_id = 'examples' and public.is_admin());
create policy examples_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'examples' and public.is_admin());

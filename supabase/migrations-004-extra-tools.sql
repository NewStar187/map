-- 추가 도구 21개. migrations-003-more-tools.sql 을 실행한 뒤 SQL Editor에서 실행한다(여러 번 실행해도 안전하다).
-- 원본은 data/tools-extra.json. 모두 '목록만' 상태로 들어가며, 운영 화면에서 확인한 뒤 '검증됨'으로 바꾼다.
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('scenario', 'Scenario', true, false, '구독', '#7dd3fc', '{illus,obj,scene,ui}', 'https://www.scenario.com', 'https://www.scenario.com/pricing', 'https://www.scenario.com/terms-of-service', '유료 요금제는 모두 상업적 이용이 가능하고 결과물은 사용자 소유다. 무료 플랜은 개인·평가용으로만 쓸 수 있다.', '2026-11-10', 'listed', '시나리오', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'scenario';
delete from public.tool_caps where tool_id = 'scenario';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('scenario', 'free', '무료', 0, 0, 'none', false, '하루 50크레딧', false);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('scenario', 'starter', 'Starter', 15, 0, 'ok', false, '월 1,500크레딧', true);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('scenario', 'pro', 'Pro', 45, 0, 'ok', false, '월 5,000크레딧', false);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('scenario', 'max', 'Max', 75, 0, 'ok', false, '월 10,000크레딧', false);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('scenario', 'obj', '{2d}', 'ai', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('scenario', 'scene', '{2d}', 'ai', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('scenario', 'ui', '{2d}', 'ai', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('scenario', 'illus', '{2d}', 'ai', null);
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('leonardo', 'Leonardo.ai', true, false, '구독', '#c4b5fd', '{illus,obj,scene,ui}', 'https://leonardo.ai', 'https://leonardo.ai/pricing', 'https://intercom.help/leonardo-ai/en/articles/8044018-commercial-usage', '무료 플랜도 상업적 이용은 가능하지만 만든 그림이 모두 공개되고 다른 사람이 가져다 쓸 수 있다. 유료 플랜의 비공개 결과물은 사용자 소유다.', '2026-11-10', 'listed', '레오나르도', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'leonardo';
delete from public.tool_caps where tool_id = 'leonardo';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('leonardo', 'free', '무료', 0, 0, 'ok', false, '하루 150토큰, 만든 그림 공개', false);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('leonardo', 'essential', 'Essential', 12, 0, 'ok', true, '월 8,500토큰', true);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('leonardo', 'premium', 'Premium', 30, 0, 'ok', true, '월 25,000토큰', false);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('leonardo', 'ultimate', 'Ultimate', 60, 0, 'ok', true, '월 60,000토큰', false);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('leonardo', 'obj', '{2d}', 'ai', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('leonardo', 'scene', '{2d}', 'ai', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('leonardo', 'ui', '{2d}', 'ai', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('leonardo', 'illus', '{2d}', 'ai', null);
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('layer', 'Layer AI', true, false, '구독 + 크레딧', '#fda4af', '{illus,obj,scene,ui}', 'https://www.layer.ai', 'https://www.layer.ai/pricing', 'https://www.layer.ai/terms-of-service', '구독하면 모든 사용자에게 상업적 이용 권리가 있고 결과물은 고객 소유다. 결과물로 경쟁 생성 모델을 학습시키는 것은 금지.', '2026-11-10', 'listed', '레이어', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'layer';
delete from public.tool_caps where tool_id = 'layer';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('layer', 'base', '기본', 10, 0, 'ok', false, '300 크리에이티브 유닛, 1,000 유닛마다 $60 추가', true);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('layer', 'obj', '{2d}', 'ai', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('layer', 'scene', '{2d}', 'ai', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('layer', 'ui', '{2d}', 'ai', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('layer', 'illus', '{2d}', 'ai', null);
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('chatgpt', 'ChatGPT', true, false, '구독', '#86efac', '{code,illus,text,ui}', 'https://chatgpt.com', 'https://chatgpt.com/pricing/', 'https://openai.com/policies/terms-of-use/', '약관이 결과물에 대한 권리를 사용자에게 넘기고, 무료·유료 구분 없이 상업적 목적으로 쓸 수 있다고 적는다. 다른 사용자에게 비슷한 결과가 나올 수 있다.', '2026-11-10', 'listed', '챗GPT|챗지피티|GPT', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'chatgpt';
delete from public.tool_caps where tool_id = 'chatgpt';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('chatgpt', 'free', 'Free', 0, 0, 'ok', false, '이미지 생성 제한적', false);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('chatgpt', 'go', 'Go', 8, 0, 'ok', true, null, false);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('chatgpt', 'plus', 'Plus', 20, 0, 'ok', false, null, true);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('chatgpt', 'pro', 'Pro', 200, 0, 'ok', true, '$100짜리 단계도 있다고 함', false);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('chatgpt', 'illus', '{2d}', 'ai', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('chatgpt', 'ui', '{2d}', 'ai', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('chatgpt', 'code', null, 'ai', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('chatgpt', 'text', null, 'ai', '말투와 설정은 직접 다듬어요');
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('firefly', 'Adobe Firefly', true, false, '구독', '#fca5a5', '{illus,scene,ui}', 'https://www.adobe.com/products/firefly.html', 'https://www.adobe.com/products/firefly/plans.html', 'https://helpx.adobe.com/firefly/get-set-up/learn-the-basics/adobe-firefly-faq.html', 'Adobe 자체 Firefly 모델의 결과물은 상업적 목적으로 쓸 수 있다고 안내한다. 다른 회사 모델(파트너 모델)의 결과물은 사용자가 직접 판단해야 한다.', '2026-11-10', 'listed', '파이어플라이|어도비', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'firefly';
delete from public.tool_caps where tool_id = 'firefly';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('firefly', 'free', '무료', 0, 0, 'ok', false, '매일 무료 생성', false);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('firefly', 'standard', 'Standard', 9.99, 0, 'ok', false, '월 2,000크레딧', true);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('firefly', 'pro', 'Pro', 19.99, 0, 'ok', false, '월 4,000크레딧', false);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('firefly', 'proplus', 'Pro Plus', 49.99, 0, 'ok', false, '월 10,000크레딧', false);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('firefly', 'illus', '{2d}', 'ai', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('firefly', 'scene', '{2d}', 'ai', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('firefly', 'ui', '{2d}', 'ai', null);
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('flux', 'FLUX (내 PC 실행)', true, false, '무료 · 내 PC에서 실행', '#fde68a', '{illus,scene,ui}', 'https://bfl.ai', 'https://bfl.ai/licensing', 'https://huggingface.co/black-forest-labs/FLUX.1-schnell', 'FLUX.1 [schnell]과 FLUX.2 [klein] 4B는 Apache-2.0이라 상업적 이용에 제한이 없다. [dev] 계열은 비상업 라이선스라, 팔 게임의 에셋을 만들려면 유료 라이선스를 권한다.', '2026-11-10', 'listed', '플럭스|FLUX', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'flux';
delete from public.tool_caps where tool_id = 'flux';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('flux', 'local', '내 PC에서 실행', 0, 0, 'ok', false, 'schnell 또는 klein 4B 기준', true);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('flux', 'illus', '{2d}', 'ai', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('flux', 'scene', '{2d}', 'ai', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('flux', 'ui', '{2d}', 'ai', null);
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('ideogram', 'Ideogram', true, false, '구독', '#a5b4fc', '{illus,ui}', 'https://ideogram.ai', 'https://ideogram.ai/pricing', 'https://ideogram.ai/legal/tos', '모든 요금제에서 상업적 이용이 가능하고 Ideogram은 결과물의 소유권을 주장하지 않는다. 기본으로 그림이 공개되며 비공개 생성은 Plus 이상만 된다.', '2026-11-10', 'listed', '아이디오그램', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'ideogram';
delete from public.tool_caps where tool_id = 'ideogram';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('ideogram', 'free', '무료', 0, 0, 'ok', false, '만든 그림 공개', false);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('ideogram', 'plus', 'Plus', 15, 0, 'ok', false, '비공개 생성 가능', true);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('ideogram', 'pro', 'Pro', 42, 0, 'ok', false, '월 3,500크레딧', false);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('ideogram', 'illus', '{2d}', 'ai', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('ideogram', 'ui', '{2d}', 'ai', null);
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('recraft', 'Recraft', true, false, '구독', '#f9a8d4', '{illus,ui}', 'https://www.recraft.ai', 'https://www.recraft.ai/pricing', 'https://www.recraft.ai/docs/plans-and-billing/paid-plans.md', '무료 플랜의 그림은 Recraft 소유이고 공개되며 상업적으로 쓸 수 없다. 유료 구독 중에 만든 그림은 해지 뒤에도 사용자 것이다.', '2026-11-10', 'listed', '리크래프트', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'recraft';
delete from public.tool_caps where tool_id = 'recraft';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('recraft', 'free', '무료', 0, 0, 'none', false, null, false);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('recraft', 'basic', 'Basic', 12, 0, 'ok', false, '월 1,000크레딧. 연간 결제 시 월 $10', true);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('recraft', 'pro', 'Pro', 20, 0, 'ok', false, '월 2,000크레딧', false);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('recraft', 'illus', '{2d}', 'ai', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('recraft', 'ui', '{2d}', 'ai', '벡터 아이콘에 강해요');
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('tripo', 'Tripo', true, false, '구독', '#99f6e4', '{obj,scene}', 'https://www.tripo3d.ai', 'https://www.tripo3d.ai/pricing', 'https://www.tripo3d.ai', '공식 페이지가 열리지 않아 확인하지 못했다. 외부 자료는 유료 플랜에 상업적 이용이 포함되고 무료 플랜 결과물은 CC BY 4.0이라고 적는다.', '2026-11-10', 'listed', '트리포', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'tripo';
delete from public.tool_caps where tool_id = 'tripo';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('tripo', 'free', '무료', 0, 0, 'check', true, '월 200크레딧, 모델 공개', false);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('tripo', 'pro', 'Pro', 20, 0, 'check', true, '월 3,000크레딧', true);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('tripo', 'max', 'Max', 90, 0, 'check', true, null, false);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('tripo', 'obj', '{3d}', 'ai', '애니메이션은 따로 붙여야 해요');
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('tripo', 'scene', '{3d}', 'ai', null);
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('rodin', 'Rodin (Hyper3D)', true, false, '구독', '#bae6fd', '{obj}', 'https://hyper3d.ai', 'https://hyper3d.ai/subscribe', 'https://hyper3d.ai/legal/terms', '내보내기는 요금제에 따라 개인용 또는 상업용으로 허락된다. Creator 이상은 "무제한 내보내기와 모든 용도"가 포함된다. 약관은 소유권이 아니라 이용 허락을 준다.', '2026-11-10', 'listed', '로댕|Hyper3D|Rodin', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'rodin';
delete from public.tool_caps where tool_id = 'rodin';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('rodin', 'free', '무료', 0, 0, 'check', false, null, false);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('rodin', 'creator', 'Creator', 30, 0, 'ok', false, '월 약 60개 모델. 연간 결제 시 월 $24', true);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('rodin', 'business', 'Business', 120, 0, 'ok', false, null, false);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('rodin', 'obj', '{3d}', 'ai', '애니메이션은 따로 붙여야 해요');
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('stableaudio', 'Stable Audio', true, false, '구독', '#fdba74', '{bgm,sfx}', 'https://stableaudio.com', 'https://stableaudio.com/pricing', 'https://stability.ai/license', '공식 가격·약관 페이지가 열리지 않았다. 외부 자료는 무료 플랜이 비상업용이고 유료 플랜에 상업적 이용 허락이 포함된다고 적는다.', '2026-11-10', 'listed', '스테이블 오디오', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'stableaudio';
delete from public.tool_caps where tool_id = 'stableaudio';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('stableaudio', 'free', '무료', 0, 0, 'none', true, '가입 시 50크레딧', false);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('stableaudio', 'creator', 'Creator', 12, 0, 'check', true, '월 660크레딧', true);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('stableaudio', 'pro', 'Pro', 30, 0, 'check', true, null, false);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('stableaudio', 'bgm', null, 'ai', '반복 구간은 직접 잘라야 해요');
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('stableaudio', 'sfx', null, 'ai', null);
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('aiva', 'AIVA', true, false, '구독', '#d8b4fe', '{bgm}', 'https://www.aiva.ai', 'https://www.aiva.ai/pricing', 'https://www.aiva.ai/legal/1', 'Pro 요금제만 저작권이 사용자에게 있고 제한 없이 수익화할 수 있다. Standard는 유튜브·트위치 같은 곳에서만 수익화할 수 있어 판매하는 게임에는 맞지 않고, 무료 플랜은 수익화할 수 없다.', '2026-11-10', 'listed', '아이바', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'aiva';
delete from public.tool_caps where tool_id = 'aiva';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('aiva', 'free', '무료', 0, 0, 'none', false, '월 3회 내려받기', false);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('aiva', 'standard', 'Standard', 12, 0, 'none', true, '€11(연간 결제). 게임에 넣어 팔 수 없음', false);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('aiva', 'pro', 'Pro', 36, 0, 'ok', true, '€33(연간 결제). 월 300회 내려받기', true);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('aiva', 'bgm', null, 'ai', null);
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('chiptone', 'ChipTone', false, false, '무료', '#93c5fd', '{sfx}', 'https://sfbgames.itch.io/chiptone', 'https://sfbgames.itch.io/chiptone', 'https://sfbgames.itch.io/chiptone', 'CC0로, 상업적 목적을 포함해 어떤 용도로든 무료로 쓸 수 있고 출처 표시도 필요 없다.', '2026-11-10', 'listed', '칩톤', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'chiptone';
delete from public.tool_caps where tool_id = 'chiptone';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('chiptone', 'free', '무료', 0, 0, 'ok', false, null, true);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('chiptone', 'sfx', null, 'direct', '8비트풍 효과음을 직접 만들어요');
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('freesound', 'Freesound', false, false, '무료 음원', '#a7f3d0', '{bgm,sfx}', 'https://freesound.org', 'https://freesound.org', 'https://freesound.org/help/faq/', '소리마다 라이선스가 다르다. CC0는 자유롭게, CC BY는 출처를 표시하면 쓸 수 있고, CC BY-NC는 상업적으로 쓸 수 없다.', '2026-11-10', 'listed', '프리사운드', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'freesound';
delete from public.tool_caps where tool_id = 'freesound';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('freesound', 'free', '무료', 0, 0, 'check', false, null, true);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('freesound', 'sfx', null, 'free', '소리마다 라이선스를 확인해요');
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('freesound', 'bgm', null, 'free', '소리마다 라이선스를 확인해요');
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('gemini', 'Gemini', true, false, '구독', '#bfdbfe', '{code,text}', 'https://gemini.google', 'https://gemini.google/subscriptions/', 'https://policies.google.com/terms', 'Google 약관은 사용자가 만든 콘텐츠의 소유권을 주장하지 않는다고 적는다. 다만 결과물의 상업적 이용을 명시적으로 허락하는 문장은 찾지 못했다.', '2026-11-10', 'listed', '제미나이|제미니', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'gemini';
delete from public.tool_caps where tool_id = 'gemini';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('gemini', 'free', '무료', 0, 0, 'check', false, null, false);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('gemini', 'plus', 'Google AI Plus', 4.99, 0, 'check', false, null, false);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('gemini', 'pro', 'Google AI Pro', 19.99, 0, 'check', false, null, true);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('gemini', 'ultra', 'Google AI Ultra', 99.99, 0, 'check', false, null, false);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('gemini', 'code', null, 'ai', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('gemini', 'text', null, 'ai', '말투와 설정은 직접 다듬어요');
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('cursor', 'Cursor', true, false, '구독', '#e5e7eb', '{code}', 'https://cursor.com', 'https://cursor.com/pricing', 'https://cursor.com/terms-of-service', '약관이 제안된 코드에 대한 권리를 사용자에게 넘긴다. 무료·유료 구분은 없다. 제안된 코드로 경쟁 모델을 학습시키는 것은 금지.', '2026-11-10', 'listed', '커서', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'cursor';
delete from public.tool_caps where tool_id = 'cursor';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('cursor', 'free', 'Free', 0, 0, 'ok', false, null, false);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('cursor', 'plus', 'Plus', 8, 0, 'ok', false, null, true);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('cursor', 'premium', 'Premium', 30, 0, 'ok', false, null, false);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('cursor', 'super', 'Super', 100, 0, 'ok', false, null, false);
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('cursor', 'ultra', 'Ultra', 200, 0, 'ok', false, null, false);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('cursor', 'code', null, 'ai', null);
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('opengameart', 'OpenGameArt', false, false, '무료 에셋', '#bbf7d0', '{bgm,obj,scene,sfx,ui}', 'https://opengameart.org', 'https://opengameart.org', 'https://opengameart.org/content/faq', '올라온 에셋은 모두 상업 프로젝트에 쓸 수 있지만 라이선스마다 조건이 다르다. CC0는 조건 없음, CC BY는 출처 표시, CC BY-SA는 같은 라이선스로 공개, GPL은 따로 검토가 필요하다.', '2026-11-10', 'listed', '오픈게임아트', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'opengameart';
delete from public.tool_caps where tool_id = 'opengameart';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('opengameart', 'free', '무료', 0, 0, 'check', false, null, true);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('opengameart', 'obj', null, 'free', '그림체가 게임과 다를 수 있어요');
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('opengameart', 'scene', null, 'free', '그림체가 게임과 다를 수 있어요');
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('opengameart', 'ui', null, 'free', '그림체가 게임과 다를 수 있어요');
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('opengameart', 'sfx', null, 'free', '에셋마다 라이선스를 확인해요');
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('opengameart', 'bgm', null, 'free', '에셋마다 라이선스를 확인해요');
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('itchassets', 'itch.io 무료 에셋', false, false, '무료 에셋', '#fecaca', '{bgm,obj,scene,sfx,ui}', 'https://itch.io/game-assets/free', 'https://itch.io/game-assets/free', 'https://itch.io/docs/creators/quality-guidelines', '사이트 공통 라이선스가 없어 에셋마다 조건이 다르다. 에셋 페이지에 적힌 조건을 읽어야 한다. AI로 만든 에셋은 표시가 의무다.', '2026-11-10', 'listed', 'itch|잇치', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'itchassets';
delete from public.tool_caps where tool_id = 'itchassets';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('itchassets', 'free', '무료', 0, 0, 'check', false, null, true);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('itchassets', 'obj', null, 'free', '그림체가 게임과 다를 수 있어요');
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('itchassets', 'scene', null, 'free', '그림체가 게임과 다를 수 있어요');
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('itchassets', 'ui', null, 'free', '그림체가 게임과 다를 수 있어요');
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('itchassets', 'sfx', null, 'free', '에셋마다 조건을 확인해요');
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('itchassets', 'bgm', null, 'free', '에셋마다 조건을 확인해요');
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('krita', 'Krita', false, false, '무료', '#c7d2fe', '{illus,obj,scene,ui}', 'https://krita.org', 'https://krita.org/en/download/', 'https://krita.org/en/about/license/', 'Krita로 만든 것은 만든 사람의 것이다. 상업적 이용 가능, 출처 표시 불필요.', '2026-11-10', 'listed', '크리타', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'krita';
delete from public.tool_caps where tool_id = 'krita';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('krita', 'free', '무료', 0, 0, 'ok', false, null, true);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('krita', 'obj', '{2d}', 'direct', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('krita', 'scene', '{2d}', 'direct', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('krita', 'ui', '{2d}', 'direct', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('krita', 'illus', '{2d}', 'direct', null);
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('piskel', 'Piskel', false, false, '무료', '#fef08a', '{obj,scene,ui}', 'https://www.piskelapp.com', 'https://www.piskelapp.com', 'https://www.piskelapp.com/terms', '만든 그림의 모든 권리는 만든 사람에게 있다. Piskel 표시는 부탁일 뿐 의무가 아니다.', '2026-11-10', 'listed', '피스켈', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'piskel';
delete from public.tool_caps where tool_id = 'piskel';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('piskel', 'free', '무료', 0, 0, 'ok', false, null, true);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('piskel', 'obj', '{pixel}', 'direct', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('piskel', 'scene', '{pixel}', 'direct', null);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('piskel', 'ui', '{pixel}', 'direct', null);
insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status, alias, gpu_min_gb) values ('lmms', 'LMMS', false, false, '무료', '#bef264', '{bgm}', 'https://lmms.io', 'https://lmms.io', 'https://github.com/LMMS/lmms', '프로그램은 GPL-2.0이다. 만든 음악의 권리와 기본으로 들어 있는 샘플의 라이선스는 공식 페이지에서 확인하지 못했다.', '2026-11-10', 'listed', '엘엠엠에스', null)
  on conflict (id) do update set name = excluded.name, billing = excluded.billing, color = excluded.color, cats = excluded.cats, site_url = excluded.site_url, pricing_url = excluded.pricing_url, terms_url = excluded.terms_url, terms_note = excluded.terms_note, checked_on = excluded.checked_on, alias = excluded.alias;
delete from public.tool_plans where tool_id = 'lmms';
delete from public.tool_caps where tool_id = 'lmms';
insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values ('lmms', 'free', '무료', 0, 0, 'check', false, null, true);
insert into public.tool_caps(tool_id, cat, cls, method, note) values ('lmms', 'bgm', null, 'direct', null);

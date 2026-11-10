// data/tools.json 과 data/base-prompts.json 으로 supabase/seed.sql 을 만든다. 실행: node tools-seed.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const q = (v) => v == null ? 'null' : typeof v === 'number' ? String(v) : typeof v === 'boolean' ? String(v) : "'" + String(v).replace(/'/g, "''") + "'";
const arr = (a) => "'{" + a.join(',') + "}'";
const { tools } = JSON.parse(readFileSync(new URL('./data/tools.json', import.meta.url), 'utf8'));
const { prompts } = JSON.parse(readFileSync(new URL('./data/base-prompts.json', import.meta.url), 'utf8'));
let out = '-- 자동으로 만든 파일. 고치려면 data/tools.json, data/base-prompts.json 을 고치고 node tools-seed.mjs 를 다시 실행한다.\n';
for (const t of tools) {
  out += `insert into public.tools(id, name, ai, self_made, billing, color, cats, site_url, pricing_url, terms_url, terms_note, checked_on, status) values (${[t.id, t.name, t.ai, t.self_made, t.billing, t.color].map(q).join(', ')}, ${arr(t.cats)}, ${[t.site_url, t.pricing_url, t.terms_url, t.terms_note, t.checked_on].map(q).join(', ')}, 'verified');\n`;
  for (const p of t.plans) out += `insert into public.tool_plans(tool_id, plan_key, name, usd_month, usd_once, rights, price_estimated, note, is_default) values (${[t.id, p.key, p.name, p.usd_month, p.usd_once, p.rights, p.estimated, p.note, p.default].map(q).join(', ')});\n`;
}
for (const p of prompts) out += `insert into public.base_prompts(cat, prompt, note) values (${[p.cat, p.prompt, p.note].map(q).join(', ')});\n`;
writeFileSync(new URL('./supabase/seed.sql', import.meta.url), out);
console.log('supabase/seed.sql', tools.length, 'tools', prompts.length, 'prompts');

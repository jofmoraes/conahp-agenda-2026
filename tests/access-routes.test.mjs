import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Cloudflare Worker invokes code for Access entry and APIs but not public shell',()=>{
 const config=JSON.parse(file('wrangler.jsonc'));
 assert.equal(config.workers_dev,false);
 assert.equal(config.preview_urls,false);
 assert.deepEqual(config.assets.run_worker_first,['/api/*','/auth/login']);
 assert.ok(!config.assets.run_worker_first.includes('/*'));
});
test('public entry CTA navigates to route covered by single-AUD plan',()=>{
 const html=file('public/index.html'),js=file('public/app.js');
 assert.match(html,/id="loginButton"/);
 assert.match(js,/window\.location\.assign\('\/auth\/login'\)/);
 assert.match(file('docs/M3_ACCESS_LOGIN.md'),/uma única|Uma única/i);
});
test('Worker validates one AUD for login entry and private API',()=>{
 const worker=file('src/worker.js');
 assert.match(worker,/url\.pathname==='\/auth\/login'/);
 assert.match(worker,/\['\/api\/me','\/api\/preferences'\]/);
 assert.match(worker,/payload\.aud\.includes\(env\.ACCESS_AUD\)/);
 assert.ok(!worker.includes('ACCESS_AUD_ME'));
 assert.ok(!worker.includes('ACCESS_AUD_PREFERENCES'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/service-worker.js',import.meta.url),'utf8');
function harness(){
 const handlers={},writes=[],cache={addAll:async items=>writes.push(...items),put:async request=>writes.push(typeof request==='string'?request:new URL(request.url).pathname),match:async()=>null};
 const context={URL,Promise,fetch:async()=>new Response('{"ok":true,"data":{"sessions":[]}}',{status:200,headers:{'content-type':'application/json'}}),self:{location:{origin:'https://example.invalid'},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>cache,keys:async()=>[],match:async()=>null}};
 vm.runInNewContext(source,context);
 return {handlers,writes};
}
test('service worker never intercepts or caches private API requests',async()=>{
 const {handlers,writes}=harness();let intercepted=false;
 for(const path of ['/api/me','/api/preferences']){
  handlers.fetch({request:new Request('https://example.invalid'+path),respondWith:()=>intercepted=true});
 }
 assert.equal(intercepted,false);assert.deepEqual(writes,[]);
});
test('service worker only caches public schedule and public application shell',async()=>{
 const {handlers,writes}=harness();let reply;
 handlers.install({waitUntil:p=>reply=p});await reply;
 assert.ok(writes.includes('/app.js'));assert.ok(writes.includes('/schedule-utils.js'));assert.ok(writes.includes('/icon.svg'));
 assert.equal(writes.some(x=>x.includes('/api/me')||x.includes('/api/preferences')),false);
 handlers.fetch({request:new Request('https://example.invalid/api/schedule'),respondWith:p=>reply=p});
 assert.equal((await reply).status,200);await Promise.resolve();await Promise.resolve();
 assert.ok(writes.includes('/api/schedule'));
});

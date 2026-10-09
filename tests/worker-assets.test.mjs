import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../src/worker.js';
test('public schedule uses versioned ASSETS without calling private backend',async()=>{
 let hits=0;
 const app=createApp({identity:async()=>null,backend:async()=>{throw Error('private backend must not be used')}});
 const ASSETS={fetch:async request=>{hits++;assert.equal(new URL(request.url).pathname,'/schedule.json');return new Response(JSON.stringify({checkedAt:'2026-10-09',sessions:[{id:'public-test',source:'official'}]}),{status:200,headers:{'content-type':'application/json'}})}};
 const r=await app.fetch(new Request('https://example.invalid/api/schedule'),{ASSETS});
 assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/public/);
 assert.equal((await r.json()).data.sessions[0].id,'public-test');assert.equal(hits,1);
 const privateReply=await app.fetch(new Request('https://example.invalid/api/preferences'),{ASSETS});
 assert.equal(privateReply.status,401);assert.equal(privateReply.headers.get('cache-control'),'no-store');
});
test('malformed public schedule never returns success',async()=>{
 const app=createApp();
 const r=await app.fetch(new Request('https://example.invalid/api/schedule'),{ASSETS:{fetch:async()=>new Response('{}',{status:200})}});
 assert.equal(r.status,502);assert.equal((await r.json()).error.code,'SCHEDULE_UNAVAILABLE');
});

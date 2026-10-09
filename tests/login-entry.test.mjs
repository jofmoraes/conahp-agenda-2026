import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../src/worker.js';

const request=(path='/auth/login',method='GET')=>new Request('https://agenda.example.invalid'+path,{method});
test('verified Access identity on login route returns to public agenda without caching',async()=>{
 const app=createApp({identity:async()=>({email:'synthetic@example.invalid'})});
 const res=await app.fetch(request(),{});
 assert.equal(res.status,303);
 assert.equal(res.headers.get('location'),'/');
 assert.equal(res.headers.get('cache-control'),'no-store');
});
test('anonymous login route cannot claim successful login',async()=>{
 const app=createApp({identity:async()=>null});
 const res=await app.fetch(request(),{});
 assert.equal(res.status,401);assert.equal((await res.json()).error.code,'UNAUTHENTICATED');
});
test('login verifier failure is not accepted, or mistaken for anonymous',async()=>{
 const app=createApp({identity:async()=>{throw Error('fake certificate failure')}});
 const res=await app.fetch(request(),{});
 assert.equal(res.status,503);assert.equal((await res.json()).error.code,'IDENTITY_UNAVAILABLE');
});
test('login route only allows top-level GET',async()=>{
 const app=createApp({identity:async()=>({email:'synthetic@example.invalid'})});
 const res=await app.fetch(request('/auth/login','POST'),{});
 assert.equal(res.status,405);
});
test('public schedule remains available without private Access identity',async()=>{
 const app=createApp({identity:async()=>{throw Error('identity must not run for public endpoints')}});
 const env={ASSETS:{fetch:async req=>Response.json({sessions:[{id:'synthetic'}],updatedAt:'fake'})}};
 const res=await app.fetch(request('/api/schedule'),env);
 assert.equal(res.status,200);assert.equal((await res.json()).data.sessions.length,1);
});

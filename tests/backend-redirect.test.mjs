import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../src/worker.js';
const env={APPS_SCRIPT_URL:'https://script.google.com/macros/s/TEST_ID/exec',APPS_SCRIPT_SECRET:'synthetic-secret'};
const app=createApp({identity:async()=>({email:'allowed@test.invalid'})});
const request=()=>new Request('https://worker.example.invalid/api/me');
async function usingFetch(mock,fn){const original=globalThis.fetch;globalThis.fetch=mock;try{return await fn()}finally{globalThis.fetch=original}}
test('only authorized Google content redirect: secret never forwarded to second host',async()=>{
 const hits=[];
 const response=await usingFetch(async (url,options)=>{
  hits.push({url:String(url),options});
  if(hits.length===1){assert.equal(options.method,'POST');assert.equal(options.redirect,'manual');assert.match(options.body,/synthetic-secret/);return new Response(null,{status:302,headers:{Location:'https://script.googleusercontent.com/macros/echo?test=1'}})}
  assert.equal(options.method,'GET');assert.equal(options.redirect,'error');assert.ok(!options.body);return Response.json({ok:true,data:{id:'p1',label:'Perfil fictício'}});
 },()=>app.fetch(request(),env));
 assert.equal(response.status,200);assert.equal(hits.length,2);assert.equal((await response.json()).data.id,'p1');
});
test('redirect to untrusted origin denied before transmitting secret',async()=>{
 let calls=0;const response=await usingFetch(async()=>{calls++;return new Response(null,{status:302,headers:{Location:'https://example.invalid/collect'}})},()=>app.fetch(request(),env));
 assert.equal(response.status,502);assert.equal(calls,1);
});
test('307 or 308 redirect with POST body is never followed',async()=>{
 for(const status of [307,308]){let calls=0;const response=await usingFetch(async()=>{calls++;return new Response(null,{status,headers:{Location:'https://script.googleusercontent.com/macros/echo'}})},()=>app.fetch(request(),env));assert.equal(response.status,502);assert.equal(calls,1)}
});
test('malicious Apps Script endpoint rejected without network request',async()=>{
 let calls=0;const response=await usingFetch(async()=>{calls++;throw Error('unreachable')},()=>app.fetch(request(),{...env,APPS_SCRIPT_URL:'https://example.invalid/macros/s/TEST_ID/exec'}));
 assert.equal(response.status,502);assert.equal(calls,0);
});

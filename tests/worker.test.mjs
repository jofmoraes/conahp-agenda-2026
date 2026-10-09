import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../src/worker.js';
const sessions=[{id:'test-session-001',day:'2026-10-14',start:'09:00',end:'10:00'},{id:'test-session-002',day:'2026-10-14',start:'09:30',end:'10:30'}];
function setup(){
 const profiles={'flora@test.invalid':{id:'flora',label:'Flora'},'juliana@test.invalid':{id:'juliana',label:'Juliana'}};
 const storage=new Map();let failWrite=false;
 const identity=async request=>{const email=request.headers.get('x-test-identity');return email?{email}:null}; // injected only in test process
 const backend=async(_env,action,who,input)=>{
  if(action==='schedule')return {updatedAt:'synthetic',sessions};
  const profile=profiles[who.email];if(!profile)throw Object.assign(new Error('Acesso negado'),{status:403});
  if(action==='me')return profile;
  if(action==='preferences')return {profile,items:[...storage.values()].filter(x=>x.profileId===profile.id).map(({profileId,...x})=>x)};
  if(action==='savePreference'){
   if(failWrite)throw new Error('persistência falhou');
   if(!sessions.some(s=>s.id===input.sessionId))throw Object.assign(new Error('Sessão inexistente'),{status:404});
   const key=profile.id+':'+input.sessionId;
   const value={...storage.get(key),...input,profileId:profile.id};storage.set(key,value);
   const {profileId,...persisted}=value;return persisted;
  }
 };
 const app=createApp({identity,backend});
 async function req(path,method='GET',body=null,email=null){
  const headers={};if(email)headers['x-test-identity']=email;
  if(body!==null)headers['content-type']='application/json';
  const r=await app.fetch(new Request('https://example.invalid'+path,{method,headers,body:body===null?undefined:JSON.stringify(body)}));
  return {status:r.status,body:await r.json(),cache:r.headers.get('cache-control')};
 }
 return {req,setFail(v){failWrite=v}};
}
test('public schedule and health; private endpoints uncached and require auth',async()=>{
 const {req}=setup();
 assert.equal((await req('/api/health')).status,200);
 const s=await req('/api/schedule');assert.equal(s.status,200);assert.equal(s.body.data.sessions.length,2);assert.match(s.cache,/public/);
 for(const path of ['/api/me','/api/preferences']){
  const r=await req(path);assert.equal(r.status,401);assert.equal(r.cache,'no-store');
 }
 assert.equal((await req('/api/unknown')).status,404);
});
test('two identities persist preferences independently; client cannot choose profile',async()=>{
 const {req}=setup();
 const flora='flora@test.invalid',juliana='juliana@test.invalid';
 const changed=await req('/api/preferences','POST',{sessionId:'test-session-001',interest:'Quero ir',attending:true},flora);
 assert.equal(changed.status,200);
 assert.equal((await req('/api/preferences','POST',{sessionId:'test-session-001',interest:'Não vou',profileId:'juliana'},flora)).status,400);
 const own=(await req('/api/preferences','GET',null,flora)).body.data.items;
 const other=(await req('/api/preferences','GET',null,juliana)).body.data.items;
 assert.equal(own[0].interest,'Quero ir');assert.equal(other.length,0);
 await req('/api/preferences','POST',{sessionId:'test-session-001',interest:'Não vou'},juliana);
 assert.equal((await req('/api/preferences','GET',null,flora)).body.data.items[0].interest,'Quero ir');
 assert.equal((await req('/api/preferences','GET',null,juliana)).body.data.items[0].interest,'Não vou');
});
test('write failure does not return success or invent persisted value',async()=>{
 const x=setup();x.setFail(true);
 const res=await x.req('/api/preferences','POST',{sessionId:'test-session-001',comment:'Teste'},'flora@test.invalid');
 assert.equal(res.status,502);assert.equal(res.body.ok,false);
 assert.equal((await x.req('/api/preferences','GET',null,'flora@test.invalid')).body.data.items.length,0);
});
test('server authorization and invalid input',async()=>{
 const {req}=setup();
 assert.equal((await req('/api/me','GET',null,'unknown@test.invalid')).status,403);
 assert.equal((await req('/api/preferences','POST',{sessionId:'test-session-001',attending:'true'},'flora@test.invalid')).status,400);
 assert.equal((await req('/api/preferences','POST',{sessionId:'test-session-001',interest:'Interesse',email:'other@test.invalid'},'flora@test.invalid')).status,400);
 assert.equal((await req('/api/preferences','POST',{sessionId:'test-session-099',interest:'Interesse'},'flora@test.invalid')).status,404);
});
test('synthetic overlapping times conflict only for attended sessions',()=>{
 const overlap=(a,b)=>a.id!==b.id&&a.day===b.day&&a.start<b.end&&b.start<a.end;
 assert.equal(overlap(sessions[0],sessions[1]),true);
 const selected=[sessions[0]];
 assert.equal(selected.some(x=>overlap(sessions[1],x)),true);
 assert.equal([].some(x=>overlap(sessions[1],x)),false);
 assert.equal(overlap(sessions[0],{...sessions[1],start:'10:00',end:'11:00'}),false);
});

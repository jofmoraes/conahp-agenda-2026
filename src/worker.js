// CONAHP M1. Identity is verified at the edge; client-provided profiles are ignored.
const JSON_HEADERS = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const PUBLIC_HEADERS = {...JSON_HEADERS, 'Cache-Control':'public, max-age=300'};
const fail = (status, code, message) => new Response(JSON.stringify({ok:false,error:{code,message}}),{status,headers:JSON_HEADERS});
const success = (data, status=200, isPublic=false) => new Response(JSON.stringify({ok:true,data}),{status,headers:isPublic?PUBLIC_HEADERS:JSON_HEADERS});
const allowedInterest = new Set(['Não analisado','Interesse','Alto interesse','Talvez','Não vou','Quero ir']);
const allowedPriority = new Set(['','Baixa','Média','Alta','Essencial']);
const json = async req => { const content = req.headers.get('content-type')||''; if (!content.toLowerCase().includes('application/json')) throw Object.assign(new Error('Envie JSON.'),{status:415}); const raw=await req.text(); if(raw.length>8192)throw Object.assign(new Error('Corpo excede limite.'),{status:413}); try{return JSON.parse(raw)}catch{throw Object.assign(new Error('JSON inválido.'),{status:400})} };
function checkPreference(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw Object.assign(new Error('Objeto obrigatório.'),{status:400});
  const keys=Object.keys(body);
  if(keys.some(k=>!['sessionId','interest','priority','attending','comment','questions'].includes(k)))throw Object.assign(new Error('Campos não permitidos.'),{status:400});
  if(typeof body.sessionId!=='string'||!/^[a-z0-9][a-z0-9-]{2,79}$/.test(body.sessionId))throw Object.assign(new Error('sessionId inválido.'),{status:400});
  if(!keys.some(k=>k!=='sessionId'))throw Object.assign(new Error('Alteração vazia.'),{status:400});
  if('interest' in body&&!allowedInterest.has(body.interest))throw Object.assign(new Error('Interesse inválido.'),{status:400});
  if('priority' in body&&!allowedPriority.has(body.priority))throw Object.assign(new Error('Prioridade inválida.'),{status:400});
  if('attending' in body&&typeof body.attending!=='boolean')throw Object.assign(new Error('Presença inválida.'),{status:400});
  for(const k of ['comment','questions'])if(k in body&&(typeof body[k]!=='string'||body[k].length>2000))throw Object.assign(new Error(k+' inválido.'),{status:400});
  return Object.fromEntries(keys.map(k=>[k,body[k]]));
}
const decode64 = value => Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'=')),c=>c.charCodeAt(0));
export async function verifyAccess(request, env) {
  const token=request.headers.get('Cf-Access-Jwt-Assertion');
  if(!token||!env.ACCESS_AUD||!env.ACCESS_TEAM_DOMAIN) return null;
  const parts=token.split('.');if(parts.length!==3)return null;
  let header,payload;
  try{header=JSON.parse(new TextDecoder().decode(decode64(parts[0])));payload=JSON.parse(new TextDecoder().decode(decode64(parts[1])))}catch{return null}
  if(header.alg!=='RS256'||!header.kid||!payload.email||typeof payload.email!=='string')return null;
  const host=new URL(env.ACCESS_TEAM_DOMAIN);
  if(host.protocol!=='https:'||host.pathname!=='/'||host.search||host.hash)return null;
  const now=Math.floor(Date.now()/1000);
  if(payload.iss!==host.origin||!Array.isArray(payload.aud)||!payload.aud.includes(env.ACCESS_AUD)||!payload.aud.every(a=>typeof a==='string')||!Number.isFinite(payload.exp)||payload.exp<=now||!Number.isFinite(payload.iat)||payload.iat>now+60||('nbf' in payload&&(!Number.isFinite(payload.nbf)||payload.nbf>now)))return null;
  const keyResponse=await fetch(host.origin+'/cdn-cgi/access/certs',{redirect:'error'});
  if(!keyResponse.ok)throw new Error('Certificados Access indisponíveis');
  const keys=(await keyResponse.json()).keys||[];
  const jwk=keys.find(k=>k.kid===header.kid&&k.kty==='RSA'&&k.alg==='RS256');
  if(!jwk)return null;
  const cryptoKey=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const signed=new TextEncoder().encode(parts[0]+'.'+parts[1]);
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',cryptoKey,decode64(parts[2]),signed))return null;
  return {email:payload.email.toLowerCase()};
}
async function appsScript(env, action, identity, input) {
  if(!env.APPS_SCRIPT_URL||!env.APPS_SCRIPT_SECRET)throw new Error('Backend não configurado');
  const response=await fetch(env.APPS_SCRIPT_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,email:identity?.email||'',secret:env.APPS_SCRIPT_SECRET,input}),redirect:'follow'});
  const text=await response.text();let data;
  try{data=JSON.parse(text)}catch{throw new Error('Backend retornou resposta não JSON')}
  if(!response.ok||!data||data.ok!==true) {
    const err=new Error(data?.error?.message||'Falha de persistência');
    err.code=data?.error?.code||'BACKEND_ERROR';err.status=response.ok? (data?.status||502):502;
    throw err;
  }
  return data.data;
}
export function createApp({identity=verifyAccess,backend=appsScript}={}) {
  return {async fetch(request,env={}) {
    const url=new URL(request.url);
    if(!url.pathname.startsWith('/api/'))return env.ASSETS?env.ASSETS.fetch(request):fail(404,'NOT_FOUND','Recurso não encontrado.');
    if(url.pathname==='/api/health'&&request.method==='GET')return success({version:'m1',status:'ready'});
    if(url.pathname==='/api/schedule'&&request.method==='GET') {
      try{return success(await backend(env,'schedule',null,{}),200,true)}catch{return fail(502,'SCHEDULE_UNAVAILABLE','Programação temporariamente indisponível.')}
    }
    if(!['/api/me','/api/preferences'].includes(url.pathname))return fail(404,'NOT_FOUND','Rota desconhecida.');
    if(!['GET','POST'].includes(request.method)||request.method==='POST'&&url.pathname!=='/api/preferences')return fail(405,'METHOD_NOT_ALLOWED','Método não permitido.');
    let who;
    try{who=await identity(request,env)}catch{return fail(503,'IDENTITY_UNAVAILABLE','Não foi possível verificar a identidade.')}
    if(!who?.email)return fail(401,'UNAUTHENTICATED','Autenticação obrigatória.');
    try {
      const action=url.pathname==='/api/me'?'me':request.method==='GET'?'preferences':'savePreference';
      const input=request.method==='POST'?checkPreference(await json(request)):{};
      const data=await backend(env,action,who,input);
      return success(data);
    }catch(error){
      const status=Number.isInteger(error.status)&&[400,403,404,409,413,415,502,503].includes(error.status)?error.status:502;
      const code=status===502?'BACKEND_ERROR':status===503?'BACKEND_UNAVAILABLE':status===403?'FORBIDDEN':status===404?'NOT_FOUND':status===409?'CONFLICT':'INVALID_INPUT';
      return fail(status,code,status===502?'Operação não confirmada. Tente novamente.':error.message||'Erro.');
    }
  }};
}
export default createApp();

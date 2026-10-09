import {filterSessions,conflictIds,auditSchedule,minutes,layoutDay} from './schedule-utils.js';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeSource=value=>{try{const url=new URL(String(value));return url.protocol==='https:'?url.href:''}catch{return ''}};
const state={sessions:[],prefs:new Map(),profile:null,view:'list',auth:'loading'};
const deniedReturn=new URL(window.location.href).searchParams.get('access')==='denied';
function apiError(code,message){return Object.assign(new Error(message),{code});}
const requiresLogin=e=>['UNAUTHENTICATED','AUTH_REQUIRED'].includes(e.code);
const isAccessDenied=e=>e.code==='FORBIDDEN';
function setAuth(status,message){
  state.auth=status;
  if(status!=='authenticated'){state.profile=null;state.prefs.clear();}
  $('identity').textContent=message;
  $('loginButton').hidden=status==='authenticated'||status==='loading';
  $('loginButton').textContent=status==='denied'?'Tentar outra conta':status==='unavailable'?'Entrar ou tentar novamente':'Entrar para salvar preferências';
  render();
}
async function api(path,options={}){
  const privateRequest=path!=='schedule';
  let r;
  try{r=await fetch('/api/'+path,{credentials:'same-origin',cache:'no-store',...(privateRequest?{redirect:'manual'}:{}),...options})}
  catch{throw apiError('NETWORK','Não foi possível conectar. Confira sua conexão e tente novamente.')}
  if(privateRequest&&(r.type==='opaqueredirect'||r.redirected||r.status>=300&&r.status<400))
    throw apiError('AUTH_REQUIRED','Sessão expirada ou login necessário.');
  if(privateRequest&&r.status===403)throw apiError('FORBIDDEN','Acesso negado. Confirme se sua conta está autorizada.');
  if(privateRequest&&r.status===401)throw apiError('UNAUTHENTICATED','Entre novamente para acessar suas preferências.');
  const type=r.headers.get('content-type')||'';
  if(!type.toLowerCase().includes('application/json'))
    throw apiError(privateRequest?'AUTH_REQUIRED':'INVALID_RESPONSE',privateRequest?'Cloudflare Access solicita nova autenticação.':'A programação retornou uma resposta inválida.');
  let p;try{p=await r.json()}catch{throw apiError('INVALID_RESPONSE','Resposta JSON inválida.')}
  if(!r.ok||p?.ok!==true)throw apiError(p?.error?.code||'API_ERROR',p?.error?.message||'Falha do servidor.');
  return p.data;
}
const selections=(field,values,selected)=>'<select data-field="'+field+'">'+values.map(v=>'<option value="'+esc(v)+'" '+(v===selected?'selected':'')+'>'+esc(v||'Sem prioridade')+'</option>').join('')+'</select>';
function editor(s){const p=state.prefs.get(s.id)||{};return '<div class="editor"><label>Interesse '+selections('interest',['Não analisado','Interesse','Alto interesse','Talvez','Quero ir','Não vou'],p.interest||'Não analisado')+'</label><label>Prioridade '+selections('priority',['','Baixa','Média','Alta','Essencial'],p.priority||'')+'</label><label><input type="checkbox" data-field="attending" '+(p.attending?'checked':'')+'> Pretendo assistir</label><label>Comentários<textarea data-field="comment" maxlength="2000">'+esc(p.comment||'')+'</textarea></label><label>Perguntas<textarea data-field="questions" maxlength="2000">'+esc(p.questions||'')+'</textarea></label><button data-save="'+esc(s.id)+'">Salvar</button><p class="save-state" role="status"></p></div>'}
function card(s,conflicts){return '<article class="session '+(conflicts.has(s.id)?'conflict-border':'')+'" data-id="'+esc(s.id)+'"><strong>'+esc(s.start)+'–'+esc(s.end)+'</strong><h3>'+esc(s.title)+'</h3><p>'+esc(s.stage)+'</p>'+(conflicts.has(s.id)?'<p class="warning">Conflito entre sessões que você pretende assistir</p>':'')+'<details><summary>Participantes, fonte e preferências</summary><p>'+esc(s.participants?.map(p=>[p.name,p.role==='não informado'?'':p.role,p.institution==='não informada'?'':p.institution].filter(Boolean).join(' · ')).join('; ')||s.speakers||'Participantes não informados')+'</p><p><a href="'+esc(safeSource(s.source))+'" target="_blank" rel="noopener noreferrer">Fonte oficial</a> · '+esc(s.verifiedAt||'sem data de verificação')+'</p>'+(state.profile?editor(s):'<p>Faça login para salvar suas preferências.</p>')+'</details></article>'}
function grid(events,conflicts){const rows=['2026-10-14','2026-10-15'].filter(d=>!$('day').value||$('day').value===d);return rows.map(day=>'<section><h2>'+day.slice(-2)+'/10</h2><div class="grid-day"><div class="time-axis">'+Array.from({length:12},(_,i)=>'<span style="top:'+(i*90)+'px">'+String(8+i).padStart(2,'0')+':00</span>').join('')+'</div><div class="grid-events">'+events.filter(s=>s.day===day).map(s=>{const top=(minutes(s.start)-8*60)*1.5,h=(minutes(s.end)-minutes(s.start))*1.5;const placement=layoutDay(events.filter(x=>x.day===s.day)).find(x=>x.event.id===s.id);const index=placement.lane,count=placement.lanes;return '<button data-open="'+esc(s.id)+'" class="grid-event '+(conflicts.has(s.id)?'conflict-border':'')+'" style="top:'+top+'px;height:'+Math.max(24,h-3)+'px;left:calc('+(100*index/count)+'% + 2px);width:calc('+(100/count)+'% - 4px)"><small>'+esc(s.start)+'</small>'+esc(s.title)+'</button>'}).join('')+'</div></div><div class="grid-detail"></div></section>').join('')}
function render(){const params={search:$('search').value,day:$('day').value,track:$('track').value,priority:$('priorityFilter').value,attending:$('attendingOnly').checked,timeFrom:$('timeFrom').value,timeTo:$('timeTo').value},events=filterSessions(state.sessions,params,state.prefs),conflicts=conflictIds(state.sessions,state.prefs);$('summary').textContent=events.length+' sessões · '+events.filter(s=>conflicts.has(s.id)).length+' conflitos';$('sessions').innerHTML=state.view==='list'?events.map(s=>card(s,conflicts)).join('')||'<p>Nenhuma sessão encontrada.</p>':grid(events,conflicts);document.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>save(b));document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{const s=state.sessions.find(x=>x.id===b.dataset.open),box=b.closest('section').querySelector('.grid-detail');box.innerHTML=card(s,conflicts);box.querySelector('details').open=true;box.querySelector('[data-save]')?.addEventListener('click',e=>save(e.currentTarget));box.scrollIntoView({block:'nearest'})})}
async function save(btn){const container=btn.closest('article'),payload={sessionId:container.dataset.id};for(const el of container.querySelectorAll('[data-field]'))payload[el.dataset.field]=el.type==='checkbox'?el.checked:el.value;const msg=container.querySelector('.save-state');btn.disabled=true;msg.textContent='Salvando…';try{const persisted=await api('preferences',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});state.prefs.set(payload.sessionId,persisted);msg.textContent='Salvo e confirmado';setTimeout(render,800)}catch(e){
  if(requiresLogin(e)||isAccessDenied(e)){
    $('notice').textContent='Alteração não salva. '+e.message;
    setAuth(isAccessDenied(e)?'denied':'login',isAccessDenied(e)?'Acesso negado para esta conta.':'Sessão expirada. Entre novamente para salvar.');
  }else{
    msg.textContent='Falha: '+e.message+' (não confirmado)';
    btn.disabled=false;
  }
}}
async function init(){if(deniedReturn)$('notice').textContent='O Cloudflare Access negou o acesso a esta conta. A programação continua pública.';try{const schedule=await api('schedule'),audit=auditSchedule(schedule.sessions||[]);if(audit.errors.length)throw Error(audit.errors.join('; '));state.sessions=schedule.sessions;$('sourceNote').textContent='Fonte oficial · conferida em '+esc(schedule.checkedAt||'data não informada')+' · sujeita a atualização';$('track').innerHTML='<option value="">Todas</option>'+[...new Set(state.sessions.map(x=>x.track))].sort().map(v=>'<option>'+esc(v)+'</option>').join('');render()}catch(e){$('notice').textContent='Agenda indisponível: '+e.message}try{
    state.profile=await api('me');
    const prefs=await api('preferences');
    state.prefs=new Map(prefs.items.map(p=>[p.sessionId,p]));
    setAuth('authenticated','Perfil autorizado: '+state.profile.label);
  }catch(e){
    const denied=isAccessDenied(e)||deniedReturn,needsLogin=requiresLogin(e);
    setAuth(denied?'denied':needsLogin?'login':'unavailable',denied?'Acesso negado. Sua conta não está autorizada.':needsLogin?'Entre para salvar suas preferências.':'Não foi possível verificar sua sessão: '+e.message);
  }
}
for(const id of ['search','day','track','priorityFilter','attendingOnly','timeFrom','timeTo'])$(id).addEventListener(id==='search'?'input':'change',render);$('view').addEventListener('change',e=>{state.view=e.target.value;render()});$('loginButton').addEventListener('click',()=>{window.location.assign('/auth/login')});
if('serviceWorker'in navigator)navigator.serviceWorker.register('/service-worker.js').catch(()=>{});init();

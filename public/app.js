const state={sessions:[],preferences:new Map(),profile:null,view:'list'};
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(path,options={}){const response=await fetch('/api/'+path,{cache:'no-store',credentials:'same-origin',...options});let payload;try{payload=await response.json()}catch{throw new Error('Resposta inválida do servidor.')}if(!response.ok||payload.ok!==true)throw new Error(payload.error?.message||'Falha do servidor.');return payload.data;}
function overlap(a,b){return a.id!==b.id&&a.day===b.day&&a.start<b.end&&b.start<a.end;}
function conflicts(s){const choices=state.sessions.filter(item=>state.preferences.get(item.id)?.attending);return state.preferences.get(s.id)?.attending&&choices.some(item=>overlap(s,item));}
function input(s,p){
 return '<label>Interesse <select data-field="interest" data-id="'+esc(s.id)+'">'+['Não analisado','Interesse','Alto interesse','Talvez','Quero ir','Não vou'].map(v=>'<option '+(v===(p.interest||'Não analisado')?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label>'+
 '<label>Prioridade <select data-field="priority" data-id="'+esc(s.id)+'">'+['','Baixa','Média','Alta','Essencial'].map(v=>'<option '+(v===(p.priority||'')?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label>'+
 '<label>Vou assistir <input type="checkbox" data-field="attending" data-id="'+esc(s.id)+'" '+(p.attending?'checked':'')+'></label>'+
 '<label>Comentários <textarea data-field="comment" data-id="'+esc(s.id)+'">'+esc(p.comment||'')+'</textarea></label>'+
 '<button data-save="'+esc(s.id)+'">Salvar preferência</button>';
}
function render(){
 const term=$('search').value.toLocaleLowerCase('pt-BR'),day=$('day').value;
 const sessions=state.sessions.filter(s=>(!day||s.day===day)&&[s.title,s.track,s.stage].join(' ').toLocaleLowerCase('pt-BR').includes(term)).sort((a,b)=>a.day.localeCompare(b.day)||a.start.localeCompare(b.start));
 $('sessions').className=state.view==='grid'?'grid':'list';
 $('sessions').innerHTML=sessions.map(s=>{const p=state.preferences.get(s.id)||{};return '<article><div class="time">'+esc(s.day)+' · '+esc(s.start)+'-'+esc(s.end)+'</div><h2>'+esc(s.title)+'</h2><p>'+esc(s.track)+' · '+esc(s.stage)+'</p><p class="source">'+esc(s.verified?'Verificado':'Não verificado')+' · '+esc(s.source||'Sem fonte')+'</p>'+(conflicts(s)?'<p class="conflict">Conflito com outra sessão marcada para assistir</p>':'')+(state.profile?input(s,p):'<p>Faça login para salvar preferências.</p>')+'</article>';}).join('')||'<p>Nenhuma sessão disponível.</p>';
 for(const btn of document.querySelectorAll('[data-save]'))btn.addEventListener('click',()=>save(btn.dataset.save,btn));
}
async function save(id,button){
 const article=button.closest('article'),data={sessionId:id};for(const element of article.querySelectorAll('[data-field]'))data[element.dataset.field]=element.type==='checkbox'?element.checked:element.value;
 button.disabled=true;$('notice').textContent='Salvando…';
 try{const saved=await api('preferences',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});state.preferences.set(id,saved);$('notice').textContent='Preferência salva e confirmada.';render();}
 catch(e){$('notice').textContent='Falha de gravação: '+e.message+' Nada foi confirmado.';}
 finally{button.disabled=false;}
}
async function init(){
 try{const schedule=await api('schedule');state.sessions=schedule.sessions||[];render();}
 catch(e){$('notice').textContent='Falha ao carregar agenda: '+e.message;}
 try{state.profile=await api('me');$('identity').textContent='Perfil autorizado: '+state.profile.label;const pref=await api('preferences');state.preferences=new Map(pref.items.map(p=>[p.sessionId,p]));render();}
 catch(e){$('identity').textContent='Preferências privadas indisponíveis: '+e.message;state.profile=null;render();}
}
$('search').addEventListener('input',render);$('day').addEventListener('change',render);$('view').addEventListener('change',e=>{state.view=e.target.value;render()});
if('serviceWorker'in navigator)navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
init();

import {auditSchedule, conflictIds, layoutDay, minutes, normalize} from './schedule-utils.js';
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DAYS=['2026-10-14','2026-10-15'];
const STATES=['Não analisado','Alto interesse','Talvez','Não vou'];
const LEGACY={'Interesse':'Talvez','Quero ir':'Alto interesse'};
const PREF_KEY='conahp2026:flora:preferences:b18';
const UI_KEY='conahp2026:public-filters:v1'; // Respect the pre-existing B17 filter key.
const SNAPSHOT_KEY='conahp2026:b18:legacy-snapshot:v1';
const TZ='America/Sao_Paulo';
const TOPIC_TERMS=[['gestão hospitalar','hospital','hospitais','modelo hospitalar','gestao'],['Ciclo de receita','receita','remuneracao','sustentabilidade financeira'],['Faturamento e glosas','faturamento','glosa','auditoria de contas'],['Operadoras/planos de saúde','operadora','plano de saude','saude suplementar'],['Processos','processo','eficiencia','operacao','produtividade'],['Dados/Indicadores','dados','indicadores','analytics','inteligencia de negocios'],['IA em saúde','inteligencia artificial',' ia ','tecnologia digital','transformacao digital'],['Interoperabilidade','interoperabilidade','integracao','conectividade'],['Qualidade e segurança do paciente','qualidade','seguranca do paciente','assistencia segura'],['Risco','risco','governanca','compliance'],['Hemoterapia','hemoterapia','sangue','transfusao'],['Engenharia clínica','engenharia clinica','equipamentos'],['Gestão de ativos','ativos','infraestrutura','manutencao']];
const st={sessions:[],prefs:new Map(),drafts:new Map(),legacySources:[],day:DAYS[0],tab:'program',view:'grid',search:'',interest:'',track:'',priority:'',from:'',to:'',relative:'all',attend:false,conflict:false,importData:null,modalSession:null,storageOk:true};
const canonical = value => STATES.includes(value)?value:(LEGACY[value]||'Não analisado');
const statusClass = value => 'status-'+normalize(canonical(value)).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const pref = id => st.prefs.get(id)||{};
const isService = s => /^(boas[ -]vindas|intervalo|almoc[oç]|pausa|coffee ?break|abertura|cerimonia.*abertura)(\b|$)/i.test(normalize(s.title||'')) && !(s.participants||[]).length;
const saved = (s) => !!pref(s.id).attending;
const validId = id => /^c26-s\d{3}$/i.test(String(id||''));
function parseJson(raw){try{return JSON.parse(raw)}catch{return null}}
function collect(obj,out,depth=0){if(depth>5||!obj||typeof obj!=='object')return;if(Array.isArray(obj)){for(const entry of obj)collect(entry,out,depth+1);return;}
 if(validId(obj.sessionId)){out.set(obj.sessionId,{...obj,sessionId:obj.sessionId});return;}
 if(validId(obj.id)&&(obj.interest||obj.priority||obj.comment||obj.questions||'attending'in obj)){out.set(obj.id,{...obj,sessionId:obj.id});return;}
 for(const [key,val] of Object.entries(obj)){if(validId(key)&&val&&typeof val==='object'){out.set(key,{...val,sessionId:key})}else if(['items','preferences','prefs','records','data','state','sessions','values','flora'].includes(key))collect(val,out,depth+1)}
}
function getUi(){const raw=parseJson(localStorage.getItem(UI_KEY));if(!raw||typeof raw!=='object')return;
 st.day=DAYS.includes(raw.day)?raw.day:st.day;st.view=['grid','list'].includes(raw.b18ViewChoice)?raw.b18ViewChoice:'grid';st.track=raw.track||'';st.priority=raw.priority||'';st.from=raw.timeFrom||'';st.to=raw.timeTo||'';st.conflict=raw.conflictsOnly===true;
}
function persistUi(){try{const old=parseJson(localStorage.getItem(UI_KEY))||{};localStorage.setItem(UI_KEY,JSON.stringify({...old,day:st.day,view:st.view,b18ViewChoice:st.view,track:st.track,priority:st.priority,timeFrom:st.from,timeTo:st.to,conflictsOnly:st.conflict}))}catch{warnStorage()}}
function warnStorage() {st.storageOk=false;note('Armazenamento indisponível: alterações podem não persistir. Faça backup e libere espaço.');}
function note(text){$('notice').textContent=text||'';}
function loadPrefs(){const legacy=[],sources={},b18= parseJson(localStorage.getItem(PREF_KEY));for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key||!(/conahp/i.test(key))||[PREF_KEY,UI_KEY,SNAPSHOT_KEY].includes(key)||/filter|cache|draft|theme/i.test(key))continue;
 const raw=localStorage.getItem(key),parsed=parseJson(raw),found=new Map();collect(parsed,found);if(!found.size)continue;sources[key]=raw;legacy.push([key,found]);}
 const merged=new Map();for(const [key,records] of legacy){st.legacySources.push({key,count:records.size});for(const [id,item] of records)if(!merged.has(id))merged.set(id,item)}collect(b18,merged); // B18 values win only if present in the modern store.
 if(b18){const current=new Map();collect(b18,current);for(const [id,item] of current)merged.set(id,item)}st.prefs=merged;
 if(legacy.length&&!localStorage.getItem(SNAPSHOT_KEY))try{localStorage.setItem(SNAPSHOT_KEY,JSON.stringify({createdAt:new Date().toISOString(),sources}));}catch{warnStorage()}
}
function commitPrefs(id,updates){
 const previous=pref(id),next=new Map(st.prefs),newItem={...previous,...updates,sessionId:id};next.set(id,newItem);
 const data={version:18,items:[...next.values()]};
 try{
  localStorage.setItem(PREF_KEY,JSON.stringify(data));st.prefs=next;
  // Retain deliberately edited fields while refreshing any unchanged, older modal draft.
  if(st.drafts.has(id)){
   const draft={...st.drafts.get(id)};
   for(const [field,value] of Object.entries(updates)){
    const a=field==='interest'?canonical(previous[field]):previous[field],b=field==='interest'?canonical(draft[field]):draft[field];
    if(a===b||(!a&&!b))draft[field]=value;
   }
   st.drafts.set(id,draft);
  }
  return true;
 }catch{warnStorage();return false}
}
function validateImport(data){const out=new Map();collect(data,out);if(!out.size)return null;for(const [id,item] of out){if(!validId(id)||JSON.stringify(item).length>14000)return null;for(const f of ['comment','questions'])if(item[f]!==undefined&&typeof item[f]!=='string')return null;if(item.attending!==undefined&&typeof item.attending!=='boolean')return null}return out}
function dateInSaoPaulo(now=new Date()){const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));return {day:`${parts.year}-${parts.month}-${parts.day}`,time:`${parts.hour}:${parts.minute}`};}
function relativeMatch(s){if(st.relative==='all')return true;const now=dateInSaoPaulo();const before=s.day<now.day||(s.day===now.day&&s.end<=now.time),after=s.day>now.day||(s.day===now.day&&s.start>now.time),current=!before&&!after;return st.relative==='current'?current:st.relative==='next'?after:before}
function alignment(s){if(isService(s))return null;const title=normalize(s.title),track=normalize(s.track),text=title+' '+track;const hit=[];for(const [topic,...terms] of TOPIC_TERMS)if(terms.some(t=>text.includes(normalize(t))))hit.push(topic);const count=hit.length;
 const quality=(s.description||s.summary)?'Média':'Baixa';let value=count>=2?'Alta':count===1?'Possível':'Indeterminada';const why=count?`O título ou a trilha sugere ${hit.slice(0,3).join(', ')}. ${quality==='Baixa'?'Não há descrição suficiente para confirmar o conteúdo.':'Confira o conteúdo antes de decidir.'}`:'O título e a trilha não fornecem evidências suficientes para relacionar esta sessão aos temas de Flora.';
 return {value,quality,why};}
function matches(s,conflicts){if(s.day!==st.day)return false;if(st.tab==='mine'&&!saved(s))return false;if(st.attend&&!saved(s))return false;if(st.conflict&&!conflicts.has(s.id))return false;if(st.interest&&canonical(pref(s.id).interest)!==st.interest)return false;if(st.track&&s.track!==st.track)return false;if(st.priority&&pref(s.id).priority!==st.priority)return false;if(st.from&&s.end<=st.from||st.to&&s.start>=st.to)return false;if(!relativeMatch(s))return false;if(st.search&&!normalize([s.title,s.track,s.stage,s.speakers,...(s.participants||[]).flatMap(p=>[p.name,p.role,p.institution])].join(' ')).includes(normalize(st.search)))return false;return true}
function updateControls(){for(const b of document.querySelectorAll('[data-tab]')){const active=b.dataset.tab===st.tab;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active))}for(const b of document.querySelectorAll('[data-day]')){const active=b.dataset.day===st.day;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))}for(const b of document.querySelectorAll('[data-view]')){const active=b.dataset.view===st.view;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))}const fields={interestFilter:st.interest,trackFilter:st.track,priorityFilter:st.priority,startFilter:st.from,endFilter:st.to,nowFilter:st.relative};for(const [k,v] of Object.entries(fields))$(k).value=v;$('attendFilter').checked=st.attend;$('conflictFilter').checked=st.conflict;const n=[st.track,st.priority,st.from,st.to,st.relative==='all'?'':st.relative,st.attend,st.conflict].filter(Boolean).length;$('filterCount').textContent=n?'('+n+')':'';$('mineCount').textContent=String(st.prefs.size?[...st.prefs.values()].filter(x=>x.attending).length:'')}
function interestButtons(id,current,mode='list'){
 return STATES.filter(x=>x!=='Não analisado'||mode==='modal').map(value=>{
  const active=canonical(current)===value, cls=statusClass(value), action=mode==='modal'?'data-draft-interest':'data-quick-interest';
  return `<button type="button" class="interest-choice ${cls} ${active?'selected':''}" ${action}="${esc(value)}" ${mode==='list'?`data-session-id="${esc(id)}"`:''} aria-pressed="${active}" aria-label="${esc(value)}${active?' (selecionado)':''}"><span aria-hidden="true" class="check-mark">${active?'✓ ':''}</span>${esc(value)}</button>`;
 }).join('');
}
function listCard(s,conflicts){
 const p=pref(s.id),service=isService(s),status=service?'service':statusClass(p.interest),label=canonical(p.interest);
 const interest=service?'<span class="service-caption">Evento de serviço</span>':`<span class="pill ${status}">${esc(label)}</span>`;
 const actions=service?'':`<div class="list-actions"><button class="secondary" data-open="${esc(s.id)}" type="button">Detalhes</button><button class="${saved(s)?'secondary':'primary'}" data-toggle="${esc(s.id)}" aria-pressed="${saved(s)}" type="button">${saved(s)?'Retirar da minha agenda':'Incluir na minha agenda'}</button>${conflicts.has(s.id)?'<span class="pill conflict-key">Conflito</span>':''}</div><div class="list-interest" role="group" aria-label="Interesse por esta sessão">${interestButtons(s.id,p.interest)}</div>`;
 return `<article class="list-card ${status} ${conflicts.has(s.id)&&!service?'conflict':''}"><div class="list-head"><div><p class="list-meta"><strong>${esc(s.start)}–${esc(s.end)}</strong> · ${esc(s.stage||s.track||'')}</p><h3>${esc(s.title)}</h3><p class="muted">${esc(s.track||'')}</p></div>${interest}</div>${actions}</article>`;
}
function grid(events,conflicts){if(!events.length)return '<div class="empty">Não há sessões para estes filtros neste dia.</div>';
 const min=Math.floor(Math.min(...events.map(s=>minutes(s.start)))/60)*60,max=Math.ceil(Math.max(...events.map(s=>minutes(s.end)))/60)*60,hour=window.innerWidth<=680?76:86,height=(max-min)/60*hour;
 const labels=[];for(let t=Math.ceil(min/60)*60;t<max;t+=60)labels.push(`<div class="hour" style="top:${(t-min)/60*hour}px">${String(Math.floor(t/60)).padStart(2,'0')}:00</div>`);
 const eventHtml=layoutDay(events).map(e=>{
  const v=e.event,w=100/e.lanes,top=(e.start-min)/60*hour,h=(e.end-e.start)/60*hour-2,service=isService(v),status=service?'service':statusClass(pref(v.id).interest);
  const attr=service?'role="note"':`type="button" data-open="${esc(v.id)}"`;
  return `<${service?'div':'button'} ${attr} class="event ${status} ${!service&&saved(v)?'attending':''} ${!service&&conflicts.has(v.id)?'conflict':''}" style="top:${top}px;height:${Math.max(24,h)}px;left:calc(${e.lane*w}% + 1px);width:calc(${w}% - 2px)" aria-label="${esc(v.start+' '+v.title)}" title="${esc(v.start+'–'+v.end+' · '+v.title)}"><span class="event-time">${esc(v.start)}–${esc(v.end)}</span><strong>${esc(v.title)}</strong>${service?'':`<span class="event-track">${esc(v.stage||v.track||'')}</span>`}</${service?'div':'button'}>`;
 }).join('');
 return `<div class="calendar"><div class="calendar-main"><div class="hours" style="height:${height}px">${labels.join('')}</div><div class="day-track" style="--hour:${hour}px;height:${height}px">${eventHtml}</div></div><div class="calendar-hint">Toque em uma palestra para abrir detalhes. Eventos simultâneos ficam lado a lado; a borda vermelha sinaliza conflito entre escolhas.</div></div>`;
}
function render(){updateControls();const conflicts=conflictIds(st.sessions,st.prefs),events=st.sessions.filter(s=>matches(s,conflicts)).sort((a,b)=>a.start.localeCompare(b.start)||a.stage.localeCompare(b.stage));$('eventCount').textContent=`${events.length} ${events.length===1?'evento':'eventos'}`;$('conflictCount').textContent=events.some(s=>conflicts.has(s.id))?`${events.filter(s=>conflicts.has(s.id)).length} com conflito`:'';$('sessions').innerHTML=st.view==='grid'?grid(events,conflicts):`<div class="list">${events.length?events.map(s=>listCard(s,conflicts)).join(''):'<div class="empty">Não há sessões para estes filtros neste dia.</div>'}</div>`;persistUi()}
function detailsHtml(s){
 const people=(s.participants||[]).map(p=>[p.name,p.role,p.institution].filter(Boolean).join(' · '));
 const source=(()=>{try{const url=new URL(s.source);return url.protocol==='https:'?url.href:''}catch{return ''}})();
 return `<section class="session-info" aria-label="Informações da sessão"><dl><div><dt>Horário</dt><dd>${esc(s.day.slice(-2))}/10 · ${esc(s.start)}–${esc(s.end)}</dd></div><div><dt>Local / trilha</dt><dd>${esc(s.stage||'Não informado')} · ${esc(s.track||'')}</dd></div></dl>${s.description?`<p>${esc(s.description)}</p>`:''}${people.length?`<h3>Participantes</h3><ul class="detail-people">${people.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${source?`<a href="${esc(source)}" target="_blank" rel="noopener noreferrer">Programação oficial</a>`:''}</section>`;
}
function priorityButtons(current){return ['','Baixa','Média','Alta','Essencial'].map(value=>{
 const active=(current||'')===value;
 return `<button type="button" class="priority-choice ${active?'selected':''}" data-draft-priority="${esc(value)}" aria-pressed="${active}"><span class="check-mark" aria-hidden="true">${active?'✓ ':''}</span>${value||'Sem'}</button>`;
 }).join('');
}
function modalEditor(s){
 const original=pref(s.id),draft=st.drafts.get(s.id)||original,legacy=original.interest&&LEGACY[original.interest]?`<p class="legacy">Classificação anterior: “${esc(original.interest)}”. O valor original permanece armazenado até você salvar uma mudança.</p>`:'';
 const attending=!!draft.attending;
 return `<form id="editForm"><section class="decision-area" aria-label="Suas decisões"><fieldset class="choice-field"><legend>Interesse</legend><div class="choice-row" role="group" aria-label="Interesse">${interestButtons(s.id,draft.interest,'modal')}</div><input type="hidden" name="interest" value="${esc(canonical(draft.interest))}"></fieldset>${legacy}<div class="agenda-decision"><button type="button" class="modal-attend ${attending?'selected':''}" data-draft-attend aria-pressed="${attending}">${attending?'✓ Retirar da minha agenda':'＋ Incluir na minha agenda'}</button><input type="hidden" name="attending" value="${attending}"></div><fieldset class="choice-field"><legend>Prioridade</legend><div class="choice-row" role="group" aria-label="Prioridade">${priorityButtons(draft.priority)}</div><input type="hidden" name="priority" value="${esc(draft.priority||'')}"></fieldset></section>${detailsHtml(s)}<section class="text-decisions"><label>Comentários<textarea name="comment" maxlength="2000">${esc(draft.comment||'')}</textarea></label><label>Perguntas<textarea name="questions" maxlength="2000">${esc(draft.questions||'')}</textarea></label></section><div class="modal-actions"><button type="button" class="secondary" data-close="sessionModal">Fechar</button><button type="submit" class="primary">Salvar preferências</button></div><p class="save-message" id="saveMessage" role="status" aria-live="polite"></p></form>`;
}
function openSession(id){const s=st.sessions.find(x=>x.id===id);if(!s||isService(s))return;st.modalSession=id;$('modalTitle').textContent=s.title;$('modalContent').innerHTML=modalEditor(s);$('sessionModal').showModal();}
function storeDraft(){const form=$('editForm');if(!form||!st.modalSession)return;
 const base=pref(st.modalSession),changed={interest:form.elements.interest.value,priority:form.elements.priority.value,attending:form.elements.attending.value==='true',comment:form.elements.comment.value,questions:form.elements.questions.value};
 const differs=Object.entries(changed).some(([key,value])=>{
  const original=key==='interest'?canonical(base[key]):key==='attending'?!!base[key]:base[key]||'';
  return value!==original;
 });
 if(differs)st.drafts.set(st.modalSession,{...base,...changed});else st.drafts.delete(st.modalSession);
}
function setModalChoice(field,value){
 const form=$('editForm');if(!form)return;
 form.elements[field].value=value;
 const attr=field==='interest'?'data-draft-interest':'data-draft-priority';
 for(const button of form.querySelectorAll('['+attr+']')){
  const selected=button.getAttribute(attr)===value;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));
  button.querySelector('.check-mark').textContent=selected?'✓ ':'';
 }
 storeDraft();
}
function toggleModalAttend(){const form=$('editForm');if(!form)return;const current=form.elements.attending.value==='true',next=!current,b=form.querySelector('[data-draft-attend]');form.elements.attending.value=String(next);b.classList.toggle('selected',next);b.setAttribute('aria-pressed',String(next));b.textContent=next?'✓ Retirar da minha agenda':'＋ Incluir na minha agenda';storeDraft();}

function exportBackup(){const keys={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&/conahp/i.test(key)&&key!==SNAPSHOT_KEY)keys[key]=localStorage.getItem(key)}const data={kind:'CONAHP_FLORA_BACKUP',version:18,exportedAt:new Date().toISOString(),items:[...st.prefs.values()],legacyRaw:keys};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`conahp-flora-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function loadBackup(file){st.importData=null;$('importBackup').disabled=true;if(!file)return;try{if(file.size>2000000)throw Error('Arquivo maior que 2 MB');const data=JSON.parse(await file.text());const items=validateImport(data);if(!items)throw Error('Nenhum registro reconhecido.');st.importData=items;$('importInfo').textContent=`${items.size} registros encontrados, ${[...items.keys()].filter(id=>st.prefs.has(id)).length} já existentes. O padrão preserva os existentes.`;$('importBackup').disabled=false}catch(error){$('importInfo').textContent='Arquivo inválido: '+error.message}}
function importBackup(){if(!st.importData)return;const replace=$('replaceImport').checked,merged=new Map(st.prefs);let added=0,updated=0;for(const [id,val] of st.importData){if(merged.has(id)){if(replace){merged.set(id,val);updated++}}else{merged.set(id,val);added++}}if(replace&&updated&&!confirm(`Substituir ${updated} registros existentes pelos valores importados?`))return;try{localStorage.setItem(PREF_KEY,JSON.stringify({version:18,items:[...merged.values()]}));st.prefs=merged;$('importInfo').textContent=`Importação confirmada: ${added} adicionados, ${updated} substituídos. Nenhum registro removido.`;st.importData=null;$('importBackup').disabled=true;render()}catch{warnStorage()}}
function bind(){document.addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;
 if(b.dataset.tab){st.tab=b.dataset.tab;render()}
 else if(b.dataset.day){st.day=b.dataset.day;render()}
 else if(b.dataset.view){st.view=b.dataset.view;render()}
 else if(b.dataset.close){$(b.dataset.close).close()}
 else if(b.dataset.open){openSession(b.dataset.open)}
 else if(b.hasAttribute('data-quick-interest')){
  const id=b.dataset.sessionId,interest=b.dataset.quickInterest;
  if(!validId(id)||!STATES.includes(interest))return;
  if(commitPrefs(id,{interest})){note('Interesse salvo neste navegador.');render()}
  else note('Não foi possível salvar o interesse. Nenhuma decisão foi alterada.');
 }
 else if(b.dataset.toggle){const id=b.dataset.toggle;
  if(commitPrefs(id,{attending:!pref(id).attending})){note('Minha agenda atualizada neste navegador.');render()}
  else note('Não foi possível salvar a inclusão na agenda.');
 }
 });
 for(const id of ['sessionModal','filterModal','backupModal']){const dialog=$(id);dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()})}
 $('sessionModal').addEventListener('close',()=>{storeDraft();st.modalSession=null});
 $('search').addEventListener('input',event=>{st.search=event.target.value;render()});$('interestFilter').addEventListener('change',event=>{st.interest=event.target.value;render()});$('advancedBtn').onclick=()=>$('filterModal').showModal();$('backupBtn').onclick=()=>$('backupModal').showModal();
 const advanced={trackFilter:'track',priorityFilter:'priority',startFilter:'from',endFilter:'to',nowFilter:'relative',attendFilter:'attend',conflictFilter:'conflict'};
 for(const [id,key] of Object.entries(advanced))$(id).addEventListener('change',event=>{st[key]=event.target.type==='checkbox'?event.target.checked:event.target.value;render()});
 $('resetFilters').onclick=()=>{Object.assign(st,{search:'',interest:'',track:'',priority:'',from:'',to:'',relative:'all',attend:false,conflict:false});$('search').value='';render()};
 $('modalContent').addEventListener('click',event=>{const b=event.target.closest('button');if(!b||!$('editForm'))return;
  if(b.hasAttribute('data-draft-interest'))setModalChoice('interest',b.dataset.draftInterest);
  else if(b.hasAttribute('data-draft-priority'))setModalChoice('priority',b.dataset.draftPriority);
  else if(b.hasAttribute('data-draft-attend'))toggleModalAttend();
 });
 $('modalContent').addEventListener('input',storeDraft);$('modalContent').addEventListener('change',storeDraft);
 $('modalContent').addEventListener('submit',event=>{event.preventDefault();const form=$('editForm');if(!form)return;storeDraft();const payload=st.drafts.get(st.modalSession);
  if(commitPrefs(st.modalSession,payload)){st.drafts.delete(st.modalSession);$('saveMessage').textContent='Salvo neste navegador';render()}
  else $('saveMessage').textContent='Erro ao salvar, dados não confirmados.';
 });
 $('exportBackup').onclick=exportBackup;$('backupFile').onchange=event=>loadBackup(event.target.files[0]);$('importBackup').onclick=importBackup;let r;window.addEventListener('resize',()=>{clearTimeout(r);r=setTimeout(render,140)});
}
async function init(){bind();try{getUi();loadPrefs()}catch{warnStorage()}if(!DAYS.includes(st.day))st.day=DAYS[0];if(!localStorage.getItem(UI_KEY)&&dateInSaoPaulo().day==='2026-10-15')st.day=DAYS[1];
 try{const response=await fetch('/schedule.json',{cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);const data=await response.json(),audit=auditSchedule(data.sessions||[]);if(audit.errors.length||audit.count!==32)throw Error('Programação inválida: '+audit.errors.join('; '));st.sessions=data.sessions;const tracks=[...new Set(st.sessions.map(s=>s.track).filter(Boolean))].sort();$('trackFilter').innerHTML='<option value="">Todas as trilhas</option>'+tracks.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');$('sourceNote').textContent=`32 eventos oficiais · Fonte conferida em ${data.checkedAt||'data não informada'} · Horário de São Paulo`;render();if(st.legacySources.length)note(`Dados anteriores reconhecidos em ${st.legacySources.length} armazenamento(s). Chaves e backup pré-migração preservados.`)}catch(error){note('Falha ao carregar a programação: '+error.message)}
 if('serviceWorker'in navigator)navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
}
init();

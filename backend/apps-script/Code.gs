/* CONAHP M1 - standalone Apps Script, never deploy without explicit approval.
 Script Properties: CONAHP_SHARED_SECRET, CONAHP_SPREADSHEET_ID.
 Public Web App risk: URL is reachable; operations deny absent/wrong shared secret.
 Identity claim is accepted only from edge Worker holding secret.
*/
function reply(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
function error(code,message,status) { return reply({ok:false,error:{code:code,message:message},status:status}); }
// SpreadsheetApp.appendRow/setValues may interpret leading '=' as a formula.
function safeSheetText(value) {
  const text=String(value??'');
  return /^[\\s]*[=+@-]/.test(text) ? "'" + text : text;
}
function sheet(ss,name) { const tab=ss.getSheetByName(name); if(!tab)throw new Error('Aba ausente: '+name);return tab; }
function rows(tab) {
  const v=tab.getDataRange().getValues();if(!v.length)return [];
  const header=v.shift().map(String);
  return v.filter(row=>row.some(x=>String(x).trim())).map((values,i)=>({row:i+2,data:Object.fromEntries(header.map((h,j)=>[h,values[j]]))}));
}
function sessionRows(ss){return rows(sheet(ss,'Sessions'));}
function profileFor(ss,email) {
  const found=rows(sheet(ss,'Profiles')).find(x=>String(x.data.email).trim().toLowerCase()===email&&String(x.data.active).toLowerCase()==='true');
  if(!found)throw {code:'FORBIDDEN',message:'Perfil não autorizado.',status:403};
  return {id:String(found.data.profileId),label:String(found.data.label)};
}
function preferences(ss,profileId) {
 return rows(sheet(ss,'Preferences')).filter(x=>String(x.data.profileId)===profileId).map(x=>({
  sessionId:String(x.data.sessionId),interest:String(x.data.interest||'Não analisado'),priority:String(x.data.priority||''),attending:String(x.data.attending)==='true',comment:String(x.data.comment||''),questions:String(x.data.questions||''),updatedAt:String(x.data.updatedAt||'')
 }));
}
function publicSchedule(ss) {
 const sessions=sessionRows(ss).map(x=>x.data).filter(x=>String(x.id||'').trim()).map(x=>({
  id:String(x.id),day:String(x.day),start:String(x.start),end:String(x.end),
  title:String(x.title),track:String(x.track||''),stage:String(x.stage||''),source:String(x.source||''),verified:String(x.verified)==='true'
 }));
 return {updatedAt:new Date().toISOString(),sessions:sessions};
}
function doPost(e) {
 try{
  if(!e||!e.postData||e.postData.contents.length>10000)return error('INVALID_INPUT','Requisição inválida.',400);
  const req=JSON.parse(e.postData.contents);
  const props=PropertiesService.getScriptProperties();
  const expected=props.getProperty('CONAHP_SHARED_SECRET');
  if(!expected||typeof req.secret!=='string'||req.secret!==expected)return error('FORBIDDEN','Não autorizado.',403);
  const spreadsheetId=props.getProperty('CONAHP_SPREADSHEET_ID');
  if(!spreadsheetId)return error('NOT_CONFIGURED','Planilha não configurada.',503);
  const ss=SpreadsheetApp.openById(spreadsheetId);
  if(req.action==='schedule')return reply({ok:true,data:publicSchedule(ss)});
  const email=String(req.email||'').trim().toLowerCase();
  if(!email||email.length>254)return error('FORBIDDEN','Identidade não autorizada.',403);
  const profile=profileFor(ss,email);
  if(req.action==='me')return reply({ok:true,data:profile});
  if(req.action==='preferences')return reply({ok:true,data:{profile:profile,items:preferences(ss,profile.id)}});
  if(req.action!=='savePreference')return error('INVALID_ACTION','Ação não permitida.',400);
  const input=req.input||{};
  if(!/^[a-z0-9][a-z0-9-]{2,79}$/.test(String(input.sessionId||'')))return error('INVALID_INPUT','Sessão inválida.',400);
  if(!sessionRows(ss).some(x=>String(x.data.id)===input.sessionId))return error('NOT_FOUND','Sessão inexistente.',404);
  const keys=Object.keys(input);
  if(keys.some(k=>!['sessionId','interest','priority','attending','comment','questions'].includes(k)))return error('INVALID_INPUT','Campos inválidos.',400);
  if('interest' in input&&!['Não analisado','Interesse','Alto interesse','Talvez','Não vou','Quero ir'].includes(input.interest))return error('INVALID_INPUT','Interesse inválido.',400);
  if('priority' in input&&!['','Baixa','Média','Alta','Essencial'].includes(input.priority))return error('INVALID_INPUT','Prioridade inválida.',400);
  if('attending' in input&&typeof input.attending!=='boolean')return error('INVALID_INPUT','Presença inválida.',400);
  for(const key of ['comment','questions'])if(key in input&&(typeof input[key]!=='string'||input[key].length>2000))return error('INVALID_INPUT','Texto inválido.',400);
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(10000))return error('LOCK_TIMEOUT','Gravação ocupada.',503);
  try{
    const tab=sheet(ss,'Preferences');
    const values=tab.getDataRange().getValues();const headers=values[0].map(String);
    const index=values.findIndex((row,i)=>i>0&&String(row[headers.indexOf('profileId')])===profile.id&&String(row[headers.indexOf('sessionId')])===input.sessionId);
    const previous=index>0?Object.fromEntries(headers.map((h,i)=>[h,values[index][i]])):{};
    const next=Object.assign({},previous,{profileId:profile.id,sessionId:input.sessionId},input,{updatedAt:new Date().toISOString()});
    const write=headers.map(h=>h==='attending'?String(next[h]===true||next[h]==='true'):['comment','questions'].includes(h)?safeSheetText(next[h]):String(next[h]??''));
    if(index>0)tab.getRange(index+1,1,1,headers.length).setValues([write]);
    else tab.appendRow(write);
    SpreadsheetApp.flush();
    const persisted=preferences(ss,profile.id).find(p=>p.sessionId===input.sessionId);
    if(!persisted)throw new Error('Persistência não confirmada');
    for(const key of ['interest','priority','attending'])if(key in input&&persisted[key]!==input[key])throw new Error('Leitura pós-gravação divergente: '+key);
    return reply({ok:true,data:persisted});
  }finally{lock.releaseLock();}
 }catch(ex){
  const status=ex.status||502;
  return error(ex.code||'BACKEND_ERROR',status===502?'Falha no backend; operação não confirmada.':ex.message,status);
 }
}
function doGet(){return error('METHOD_NOT_ALLOWED','Use POST autenticado.',405);}

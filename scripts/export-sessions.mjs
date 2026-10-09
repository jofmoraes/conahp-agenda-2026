import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {auditSchedule} from '../public/schedule-utils.js';
const here=dirname(fileURLToPath(import.meta.url));
const schedule=JSON.parse(readFileSync(resolve(here,'../public/schedule.json'),'utf8'));
const sessions=schedule.sessions||[];
const audit=auditSchedule(sessions);
const errors=[...audit.errors];
if(sessions.length!==32||audit.byDay['2026-10-14']!==16||audit.byDay['2026-10-15']!==16)errors.push('Contagem divergente da fotografia oficial de 2026-10-09');
for(const s of sessions){
 if(!s.id?.startsWith('c26-s')||!s.verified||!s.verifiedAt)errors.push('Fonte ou ID incompleto: '+s.id);
 if(!Array.isArray(s.participants)||!Array.isArray(s.sourceHistory)||!s.sourceHistory.length)errors.push('Rastreabilidade incompleta: '+s.id);
}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else if(process.argv.includes('--check')){
 console.log(JSON.stringify({ok:true,verifiedAt:schedule.checkedAt,count:audit.count,byDay:audit.byDay,overlapPairs:audit.overlapPairs,participants:sessions.reduce((n,s)=>n+s.participants.length,0)},null,2));
}else{
 const columns=['id','day','start','end','title','track','stage','source','verified','speakers'];
 const safe=value=>{let v=String(value??'');if(/^[=+@\t\r]/.test(v)||/^-[^0-9]/.test(v))v="'"+v;return '"'+v.replaceAll('"','""')+'"';};
 console.log(columns.map(safe).join(','));
 for(const session of sessions)console.log(columns.map(k=>safe(session[k]??'')).join(','));
}

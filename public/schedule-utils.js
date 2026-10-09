export function minutes(value){const match=/^(\d{2}):(\d{2})$/.exec(value||'');if(!match)return null;const h=Number(match[1]),m=Number(match[2]);return h<24&&m<60?h*60+m:null;}
export function overlap(a,b){const x=minutes(a.start),y=minutes(a.end),u=minutes(b.start),v=minutes(b.end);return a.id!==b.id&&a.day===b.day&&[x,y,u,v].every(Number.isInteger)&&x<v&&u<y;}
export function conflictIds(sessions,prefs){const selected=sessions.filter(s=>prefs.get(s.id)?.attending);return new Set(selected.filter(s=>selected.some(other=>overlap(s,other))).map(s=>s.id));}
export function normalize(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
export function filterSessions(sessions,opts={},prefs=new Map()){const q=normalize(opts.search).trim();return sessions.filter(s=>(!opts.day||s.day===opts.day)&&(!opts.track||s.track===opts.track)&&(!opts.priority||prefs.get(s.id)?.priority===opts.priority)&&(!opts.attending||prefs.get(s.id)?.attending)&&(!q||normalize([s.title,s.track,s.stage,s.speakers].join(' ')).includes(q))).sort((a,b)=>a.day.localeCompare(b.day)||a.start.localeCompare(b.start)||a.stage.localeCompare(b.stage));}
export function auditSchedule(sessions){const ids=new Set(),errors=[];const counts={};for(const s of sessions){counts[s.day]=(counts[s.day]||0)+1;if(ids.has(s.id))errors.push('ID duplicado '+s.id);ids.add(s.id);if(!['2026-10-14','2026-10-15'].includes(s.day)||minutes(s.start)===null||minutes(s.end)===null||minutes(s.end)<=minutes(s.start))errors.push('Horário inválido '+s.id);if(!s.source)errors.push('Sem fonte '+s.id);}return {count:sessions.length,byDay:counts,errors,overlapPairs:sessions.reduce((n,s,i)=>n+sessions.slice(i+1).filter(t=>overlap(s,t)).length,0)};}

/** Allocate non-overlapping lanes; each connected interval group shares one width. */
export function layoutDay(events){
 const sorted=[...events].filter(s=>minutes(s.start)!==null&&minutes(s.end)!==null&&minutes(s.end)>minutes(s.start)).sort((a,b)=>minutes(a.start)-minutes(b.start)||minutes(a.end)-minutes(b.end));
 const output=[];let group=[],groupEnd=-1;
 const flush=()=>{if(!group.length)return;const lanes=Math.max(...group.map(x=>x.lane))+1;for(const entry of group){entry.lanes=lanes;output.push(entry)}group=[];groupEnd=-1};
 for(const event of sorted){
  const start=minutes(event.start),end=minutes(event.end);
  if(group.length&&start>=groupEnd)flush();
  const active=group.filter(x=>x.end>start),occupied=new Set(active.map(x=>x.lane));
  let lane=0;while(occupied.has(lane))lane++;
  group.push({event,start,end,lane});groupEnd=Math.max(groupEnd,end);
 }
 flush();return output;
}

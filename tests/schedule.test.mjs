import test from 'node:test';
import assert from 'node:assert/strict';
import {minutes,overlap,conflictIds,normalize,filterSessions,auditSchedule} from '../public/schedule-utils.js';
const rows=[
{id:'one',day:'2026-10-14',start:'09:00',end:'10:00',title:'Inteligência artificial',track:'Tecnologia',stage:'Palco A',speakers:'João | Hospital A',source:'https://example.invalid'},
{id:'two',day:'2026-10-14',start:'09:30',end:'10:30',title:'Financiamento',track:'Financeiro',stage:'Palco B',speakers:'Maria | Hospital B',source:'https://example.invalid'},
{id:'three',day:'2026-10-15',start:'10:00',end:'11:00',title:'Gestão',track:'Gestão',stage:'Palco C',speakers:'Carlos',source:'https://example.invalid'}];
test('time and public session schema checks',()=>{assert.equal(minutes('09:35'),575);assert.equal(minutes('25:00'),null);const audit=auditSchedule(rows);assert.equal(audit.count,3);assert.equal(audit.byDay['2026-10-14'],2);assert.equal(audit.overlapPairs,1);assert.deepEqual(audit.errors,[]);});
test('real conflicts require two attending choices',()=>{const prefs=new Map([['one',{interest:'Quero ir',attending:true}],['two',{interest:'Interesse',attending:false}]]);assert.equal(conflictIds(rows,prefs).size,0);prefs.set('two',{interest:'Interesse',attending:true});assert.deepEqual([...conflictIds(rows,prefs)].sort(),['one','two']);assert.equal(overlap(rows[0],rows[2]),false);});
test('search and filters include speaker/institution and retain private decisions',()=>{const prefs=new Map([['two',{priority:'Alta',attending:true}]]);assert.equal(normalize('Inteligência'),'inteligencia');assert.equal(filterSessions(rows,{search:'hospital b'},prefs)[0].id,'two');assert.equal(filterSessions(rows,{search:'inteligencia'},prefs)[0].id,'one');assert.equal(filterSessions(rows,{day:'2026-10-15'},prefs).length,1);assert.equal(filterSessions(rows,{priority:'Alta'},prefs)[0].id,'two');assert.equal(filterSessions(rows,{attending:true},prefs)[0].id,'two');});
test('schedule changes preserve IDs and detect malformed entries',()=>{const changed=[{...rows[0],start:'08:30'},rows[1],rows[2]];assert.equal(changed[0].id,rows[0].id);assert.equal(auditSchedule(changed).errors.length,0);assert.equal(auditSchedule([...rows,rows[0]]).errors.length,1);});

test('time range includes overlapping sessions without false boundary intersections',()=>{
 const prefs=new Map();
 assert.equal(filterSessions(rows,{day:'2026-10-14',timeFrom:'09:45',timeTo:'10:10'},prefs).length,2);
 assert.deepEqual(filterSessions(rows,{day:'2026-10-14',timeFrom:'10:00',timeTo:'10:30'},prefs).map(s=>s.id),['two']);
 assert.equal(filterSessions(rows,{timeFrom:'12:00',timeTo:'13:00'},prefs).length,0);
});

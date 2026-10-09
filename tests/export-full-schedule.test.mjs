import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const schedule=JSON.parse(readFileSync(new URL('public/schedule.json',root),'utf8'));
function exec(...args){
 const r=spawnSync(process.execPath,['scripts/export-sessions.mjs',...args],{cwd:new URL('.',root),encoding:'utf8'});
 assert.equal(r.status,0,r.stderr||r.stdout);return r.stdout;
}
function parseCsv(source){
 const rows=[],row=[];let quoted=false,field='';
 for(let i=0;i<source.length;i++){
  const char=source[i];
  if(quoted){if(char==='"'&&source[i+1]==='"'){field+='"';i++}else if(char==='"')quoted=false;else field+=char;}
  else if(char==='"')quoted=true;
  else if(char===','){row.push(field);field='';}
  else if(char==='\n'){row.push(field);rows.push([...row]);row.length=0;field='';}
  else if(char!=='\r')field+=char;
 }
 assert.equal(quoted,false);
 if(field||row.length){row.push(field);rows.push([...row])}
 return rows;
}
test('versioned full JSON validates under real Node schedule exporter',()=>{
 const result=JSON.parse(exec('--check'));
 assert.equal(result.ok,true);
 assert.equal(result.count,32);
 assert.deepEqual(result.byDay,{'2026-10-14':16,'2026-10-15':16});
 assert.equal(result.participants,schedule.sessions.reduce((n,x)=>n+x.participants.length,0));
 assert.equal(result.overlapPairs,21);
 assert.equal(new Set(schedule.sessions.map(s=>s.id)).size,32);
});
test('real exporter produces 32 spreadsheet-safe CSV records including multiline fields',()=>{
 const rows=parseCsv(exec());
 assert.equal(rows.length,33);
 assert.deepEqual(rows[0],['id','day','start','end','title','track','stage','source','verified','speakers']);
 assert.ok(rows.every(r=>r.length===10));
 assert.equal(rows[1][0],'c26-s001');
 assert.equal(rows[32][0],'c26-s032');
 assert.equal(rows[18][4],schedule.sessions[17].title);
});

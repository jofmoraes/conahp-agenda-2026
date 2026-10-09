import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutDay,overlap} from '../public/schedule-utils.js';
const records=[
{id:'a',day:'2026-10-14',start:'09:00',end:'10:00'},
{id:'b',day:'2026-10-14',start:'09:20',end:'09:50'},
{id:'c',day:'2026-10-14',start:'09:35',end:'10:15'},
{id:'d',day:'2026-10-14',start:'10:15',end:'11:00'},
{id:'e',day:'2026-10-14',start:'12:00',end:'13:00'}];
test('grid assigns distinct lanes to every overlapping pair',()=>{
 const laid=layoutDay(records);assert.equal(laid.length,records.length);
 for(const x of laid)for(const y of laid)if(overlap(x.event,y.event))assert.notEqual(x.lane,y.lane);
 assert.equal(laid.find(x=>x.event.id==='a').lanes,3);
 assert.equal(laid.find(x=>x.event.id==='d').lanes,1);
 assert.equal(laid.find(x=>x.event.id==='e').lanes,1);
});
test('adjacent time slots can reuse lanes without conflicts',()=>{
 const laid=layoutDay([{...records[0]},{...records[3],start:'10:00'}]);assert.equal(laid.length,2);assert.ok(laid.every(x=>x.lane===0));
});

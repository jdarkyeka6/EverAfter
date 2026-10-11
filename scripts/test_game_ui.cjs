#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('Everafter/Game/index.html','utf8');
const script=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
assert.ok(script.length>120000,'Full EverAfter game was not found');
new Function(script);
const begin=script.indexOf('const EVENTS=[')+'const EVENTS=['.length;
const finish=script.indexOf('\n];',begin);
assert.ok(begin>10&&finish>begin,'Event catalog not found');
const EVENTCODE='const EVENTS=['+script.slice(begin,finish)+']; EVENTS';
const events=vm.runInNewContext(EVENTCODE,{rand:(a,b)=>a});
const eligible=age=>events.filter(e=>(!e.min||age>=e.min)&&(!e.max||age<=e.max));
assert.ok(eligible(1).length>=10,'Ages 1+ need meaningful variety');
assert.ok(eligible(4).length>=20,'Ages 4+ need meaningful variety');
assert.equal(new Set(events.map(e=>e.title)).size,events.length,'Duplicate event title');
const start=script.indexOf('function selectUnseenLifeEvent(){');
const end=script.indexOf('\nfunction dialog(',start);
assert.ok(start>0&&end>start,'Seen-event selector missing');
const functionBody=script.slice(start,end)+'\nselectUnseenLifeEvent;';
function makeSelector(state){
  return vm.runInNewContext(functionBody,{EVENTS:events,s:state,pick:a=>a[0]});
}
let state={age:4,log:[],eventHistory:[]};
let select=makeSelector(state);
const seen=new Set();
for(let i=0;i<20;i++){
  const event=select();
  assert.ok(event,'Ran out of early-life events too soon');
  assert.ok(!seen.has(event.title),'Incident repeated within the same life');
  seen.add(event.title);
}
assert.equal(state.eventHistory.length,20,'History not saved');
const old={age:4,log:[
  {age:2,text:'✨ The Toy Incident: Share it'},
  {age:3,text:'✨ Cookie Jar Mystery: Save it for someone'}
]};
const oldSelector=makeSelector(old);
const next=oldSelector();
assert.ok(next&&!['The Toy Incident','Cookie Jar Mystery'].includes(next.title),'Existing save history was ignored');
assert.ok(old.eventHistory.includes('The Toy Incident')&&old.eventHistory.includes('Cookie Jar Mystery'),'Old saves were not migrated');
assert.ok(script.includes('s.log.slice(0,120).reverse()'),'Event feed should show oldest first');
const actions=script.indexOf('home-control actions-shortcut'),center=script.indexOf('home-control primary" data-act="age"'),stage=script.indexOf('home-control stage-shortcut');
assert.ok(actions>=0&&actions<center&&center<stage,'Age Up must be centered between Actions and Life Stage');
assert.ok(script.includes('relations-shortcut" data-tab="people"'),'Relationships shortcut missing');
assert.ok(script.includes('function birthdayScreen()')&&script.includes('function finishBirthday()'),'New birthday animation missing');
assert.ok(script.includes('prefers-reduced-motion'),'Birthday transition needs reduced-motion support');
console.log('PASS: '+events.length+' events, 20 consecutive non-repeating incidents, old saves, chronology, buttons, birthday animation.');

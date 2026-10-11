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
const functionBody=script.slice(script.indexOf('const STORY_ARCS='),end)+'\n({selectUnseenLifeEvent,rememberStoryChoice,STORY_ARCS});';
function makeSelector(state){
  return vm.runInNewContext(functionBody,{EVENTS:events,s:state,pick:a=>a[0]});
}
let state={age:4,log:[],eventHistory:[]};
let select=makeSelector(state).selectUnseenLifeEvent;
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
const oldSelector=makeSelector(old).selectUnseenLifeEvent;
const next=oldSelector();
assert.ok(next&&!['The Toy Incident','Cookie Jar Mystery'].includes(next.title),'Existing save history was ignored');
assert.ok(old.eventHistory.includes('The Toy Incident')&&old.eventHistory.includes('Cookie Jar Mystery'),'Old saves were not migrated');
assert.ok(script.includes('s.log.slice(0,120).reverse()'),'Event feed should show oldest first');
const actions=script.indexOf('home-control actions-shortcut'),center=script.indexOf('home-control primary" data-act="age"'),stage=script.indexOf('home-control stage-shortcut');
assert.ok(actions>=0&&actions<center&&center<stage,'Age Up must be centered between Actions and Life Stage');
assert.ok(script.includes('relations-shortcut" data-tab="people"'),'Relationships shortcut missing');
assert.ok(script.includes('function birthdayScreen()')&&script.includes('function finishBirthday()'),'New birthday animation missing');
assert.ok(script.includes('prefers-reduced-motion'),'Birthday transition needs reduced-motion support');
assert.ok(script.includes('birthday-summary'),'Cinematic recap panel missing');
assert.ok(script.includes('chapter-marker'),'Grouped chronological life journal missing');
assert.ok(script.includes('previousScroll.bottom>42'),'Timeline scroll should not reset while reading old entries');
assert.ok(script.includes("everafter_motion_v1"),'Birthday animation choice must persist across sessions');
assert.ok(script.includes("motionPreference==='fast'?1000:2700"),'Fast birthday motion option must be functional');
assert.ok(script.includes("motionPreference!=='off'"),'Off must skip the birthday overlay');
assert.ok(script.includes("data-motion"),'Animation options must appear in Settings');
assert.ok(script.includes("ageFxPending=false;clearTimeout(ageFxTimer);document.querySelector('.birthday-scene')"),'Death must not show a stale birthday overlay');
assert.ok(script.includes('kind:\'life-event\''),'Life event choices missing custom treatment');
assert.ok(script.includes('eventEffectDetails(before,s)'),'Event outcomes must describe consequences');
const recapStart=script.indexOf('function lifeChapterLabel('),recapEnd=script.indexOf('function birthdayScreen()',recapStart);
assert.ok(recapStart>0&&recapEnd>recapStart,'Year recap helpers missing');
const recap=vm.runInNewContext(script.slice(recapStart,recapEnd)+'\n({lifeChapterLabel,buildAgeRecap});',{});
const summary=recap.buildAgeRecap({cash:150,education:'Preschool',job:'',logLength:2,stats:{health:80,happy:65}},{cash:180,education:'Primary School',job:null,log:[{},{},{},{}],age:5,stats:{health:84,happy:65}});
assert.equal(summary.cashDelta,30,'Birthday recap should calculate actual cash changes');
assert.equal(summary.milestone,'Primary School','Birthday recap should highlight a life-stage milestone');
assert.equal(summary.memories,2,'Birthday recap should count newly logged memories');
const tState={age:7,eventHistory:['First Coding Challenge'],log:[],storyThreads:[]};
const storyline=makeSelector(tState);
assert.ok(Object.keys(storyline.STORY_ARCS).length>=10,'Too few choice-driven story arcs');
storyline.rememberStoryChoice({title:'First Coding Challenge'},0);
assert.equal(tState.storyThreads[0].dueAge,10,'Follow-up should occur three years after the first coding challenge');
tState.age=10;
const follow=storyline.selectUnseenLifeEvent();
assert.equal(follow.title,'Your First App Idea','Choice should lead to a relevant later-life story');
assert.ok(follow.desc.includes('maze game'),'Follow-up should reflect the earlier choice');
assert.equal(tState.storyThreads[0].seen,true,'A resolved story arc should be marked completed');
const nextStory=storyline.selectUnseenLifeEvent();
assert.notEqual(nextStory.title,follow.title,'No storyline follow-up should repeat');
const rState={age:5,eventHistory:[],log:[],storyThreads:[]};
const rSelector=makeSelector(rState);
rSelector.rememberStoryChoice({title:'The Toy Incident'},0);
rSelector.rememberStoryChoice({title:'The Toy Incident'},0);
assert.equal(rState.storyThreads.length,1,'An original incident must not queue the same arc twice');
console.log('PASS: '+events.length+' events, 20 unique incidents, old save migration, 10 choice-driven story arcs, birthday recaps, event consequence logging, UI and chronology.');

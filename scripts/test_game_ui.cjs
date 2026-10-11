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

const assetsRoot='Everafter/Game/assets';
const exists=(type,file)=>fs.existsSync(assetsRoot+'/'+type+'/'+file);
const svgData=(type,file)=>{
 const path=assetsRoot+'/'+type+'/'+file;
 assert.ok(exists(type,file),'Missing custom asset: '+path);
 const contents=fs.readFileSync(path,'utf8');
 assert.ok(contents.includes('<svg')&&contents.includes('</svg>'),'Invalid SVG asset: '+path);
 assert.ok(contents.length>300,'SVG asset unexpectedly empty: '+path);
 return contents;
};
const lifeStages=['baby','child','teen','adult','elder'];
for(const stage of lifeStages){
 svgData('stages',stage+'.svg');
 for(let i=1;i<=12;i++)svgData('avatars',stage+'-'+String(i).padStart(2,'0')+'.svg');
}
const requiredIcons=['menu','save','settings','health','happy','smart','looks','actions','age','relationships','school','employment','baby','unemployed','finance'];
for(const id of requiredIcons)svgData('icons',id+'.svg');
svgData('brand','everafter-logo.svg');
const slug=name=>String(name).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
for(const e of events)svgData('events',slug(e.title)+'.svg');
for(const key of Object.keys(storyline.STORY_ARCS))svgData('events',slug(storyline.STORY_ARCS[key].title)+'.svg');
assert.equal(fs.readdirSync(assetsRoot+'/events').filter(x=>x.endsWith('.svg')).length,events.length+Object.keys(storyline.STORY_ARCS).length,'Every event must have its own illustration');
assert.ok(script.includes('eventArtPath(m.title)'),'Event modal is not using real assets');
assert.ok(script.includes('avatarArt()'),'Life portrait is not using real assets');
assert.ok(script.includes("assetIcon('relationships')"),'Bottom navigation is not using custom icons');
assert.ok(script.includes('assets/stages/'),'Life stages must use their illustrated environments');
assert.ok(script.includes('avatar-preview'),'Character selection must preview the portrait');


/* Unlimited practice and no bottom-action notifications regression tests */
assert.ok(!/\\bs\\.ap\\b/.test(script),'AP counter must be absent from game logic');
assert.ok(!script.includes('No action points left'),'No action point gate must remain');
assert.ok(!script.includes('if(msg)showToast'),'Routine actions should not show toast popups');
assert.ok(script.includes('.toast-zone{position:fixed;top:'),'Any remaining error notice should be near the top, not bottom');
assert.ok(script.includes("function repeatHint("),'Show diminishing returns on repeatable action cards');
assert.ok(script.includes('withActionContext(key,()=>o.fn())'),'A modal selection must retain its original action key');
assert.ok(script.includes('s.actionReps={}'),'Age up must refresh the per-year repeat counters');
assert.ok(script.includes("x.actionReps??={}"),'Previously saved lives must acquire repetition tracking');
const practiceStart=script.indexOf("let activeActionKey=''");
const practiceEnd=script.indexOf('function yearlyOnce(key)',practiceStart);
assert.ok(practiceStart>=0&&practiceEnd>practiceStart,'Unlimited practice code missing');
const state={
 alive:true,age:18,actionReps:{},stats:{health:25,happy:45},skills:{music:15,coding:10},
 grades:40,cash:1000,followers:100,approval:40,
 job:{id:'singer',performance:30},relationships:[{id:1,bond:20}],pets:[],gameplayTurns:0
};
const log=[];
const context=vm.createContext({s:state,
 ensureExpansions(x){x.actionReps??={}},
 cap:(x)=>Math.max(0,Math.min(100,Math.round(x))),
 fail:m=>log.push('ERROR '+m),
 commit:m=>log.push(m),
});
const practice=vm.runInContext(script.slice(practiceStart,practiceEnd)+'\n({repeatMultiplier,actionKey,withActionContext,doAct,point});',context);
assert.equal(practice.repeatMultiplier(0),1);
assert.equal(practice.repeatMultiplier(2),1);
assert.ok(practice.repeatMultiplier(3)<1&&practice.repeatMultiplier(4)<practice.repeatMultiplier(3));
const key=practice.actionKey('gig','','');
function practiseOnce(){
 practice.withActionContext(key,()=>practice.doAct(1,()=>{
  state.cash+=100;state.stats.health+=10;state.skills.music+=10;state.grades+=8;
  state.relationships[0].bond+=10;
  return 'You practiced and earned some money';
 }));
}
for(let i=0;i<3;i++)practiseOnce();
assert.equal(state.cash,1300,'First three repeats should award full earned cash');
assert.equal(state.stats.health,55,'First three repeats should award full stats');
assert.equal(state.grades,64,'First three repeats should award full grades');
assert.equal(state.relationships[0].bond,50,'First three repeats should award full relationship gains');
practiseOnce();
assert.equal(state.cash,1372,'Fourth use pays 72% instead of 100%');
assert.equal(state.stats.health,62,'Fourth use scales stat gains');
assert.equal(state.skills.music,52,'Fourth use scales skill gains');
assert.equal(state.grades,70,'Fourth use scales grade gains');
assert.equal(state.relationships[0].bond,57,'Fourth use scales relationship gains');
practiseOnce();
assert.ok(state.cash>1372&&state.cash<1444,'Fifth use must yield even less');
assert.equal(state.actionReps[key],5,'Count each successfully completed activity');
assert.equal(state.gameplayTurns,5,'Activities still count as turns with no AP');
const past=state.actionReps[key],money=state.cash;
practice.withActionContext(key,()=>practice.doAct(1,()=>false));
assert.equal(state.actionReps[key],past,'Failed actions must not burn a repetition');
assert.equal(state.cash,money,'Failed actions must not create money');
practice.withActionContext(practice.actionKey('gym'),()=>practice.doAct(1,()=>{
 state.cash-=40;state.stats.health+=8;return 'A workout';
}));
assert.equal(state.cash,money-40,'Gym costs must be fully charged');
assert.equal(state.actionReps[practice.actionKey('gym')],1,'Separate activities have separate counters');
assert.equal(practice.repeatMultiplier(0),1,'New year begins with full benefits');
const extraStart=script.indexOf("function choose(title,icon,body,options){");
assert.ok(script.slice(extraStart,extraStart+260).includes('const key=activeActionKey'),'Modal action context should be captured');

console.log('PASS: '+events.length+' events, '+(events.length+Object.keys(storyline.STORY_ARCS).length)+' illustrated event assets, 60 avatars, 5 scenes, 15 icons, story arcs, saves and UI.');

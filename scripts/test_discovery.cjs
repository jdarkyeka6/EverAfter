#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('Everafter/Game/content/discover.js','utf8');
const env={window:{}};
vm.runInNewContext(source,env);
const data=env.window.EVERAFTER_DISCOVER;
assert.ok(data,'Discovery data was not loaded');
assert.equal(data.categories.length,22);
assert.equal(data.activities.length,308);
assert.equal(data.projects.length,24);
const ids=new Set(),titles=new Set();
for(const a of data.activities){
 assert.ok(!ids.has(a.id),'Duplicate activity ID: '+a.id);
 assert.ok(!titles.has(a.title),'Duplicate activity title: '+a.title);
 ids.add(a.id);titles.add(a.title);
 assert.ok(typeof a.desc==='string'&&a.desc.length>=20,'Activity needs a meaningful description: '+a.id);
 assert.ok(a.min>=0&&a.max<=100&&a.min<=a.max,'Invalid age: '+a.id);
 assert.ok(a.skill&&a.stat&&Number.isFinite(a.cost)&&a.cost>=0);
}
for(const c of data.categories){
 assert.equal(c.ids.length,14,'Category should contain 14 distinct choices: '+c.id);
 for(const id of c.ids)assert.ok(ids.has(id),'Broken category link: '+id);
}
const projects=new Set();
for(const p of data.projects){
 assert.ok(!projects.has(p.id),'Duplicate project ID');
 projects.add(p.id);
 assert.ok(p.steps>=5&&p.steps<=12);
 assert.ok(p.min>=0&&p.min<100);
 assert.ok(p.cost>=0&&p.reward>=0);
}
const html=fs.readFileSync('Everafter/Game/index.html','utf8');
assert.ok(html.includes('<script src="content/discover.js"></script>'),'Catalog must load before the game script');
assert.ok(html.includes("case'discover':return discoveryPage()"),'New discover tab must render');
assert.ok(html.includes("case 'discoveryActivity':doDiscoveryActivity(value)"),'Actions must be playable');
assert.ok(html.includes("case 'discoveryProject':doDiscoveryProject(value)"),'Multi-step projects must be playable');
assert.ok(html.includes("x.discoveryRecords??={};x.discoveryProjects??={}"),'Legacy saves must migrate without reset');
assert.ok(html.includes("discoveryRecords:{},discoveryProjects:{}"),'New lives need persistent discovery records');
assert.ok(html.includes("['discover','🧭','Explore 332+']"),'Explore must appear in main navigation and mobile actions');
assert.ok(html.includes("id='discovery-results'")||html.includes('id="discovery-results"'),'Search needs activity-result container');
const script=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new Function(script);
const start=script.indexOf("let discoveryFilter='recommended'");
const end=script.indexOf('function renderContent(){',start);
assert.ok(start>=0&&end>start,'Discovery gameplay source not found');
const state={
 age:14,alive:true,cash:25000,grades:63,stats:{happy:52,smart:57,reputation:58,discipline:55,karma:50,health:66,fame:5,fitness:50,looks:60},
 skills:{social:34,sport:25,music:19,art:22,coding:15,business:20,writing:16,acting:11,politics:8},
 discoveryRecords:{},discoveryProjects:{},relationships:[{id:1,alive:true,bond:54}],
 followers:0,volunteer:0,actionReps:{}
};
const messages=[];
const sim={
 s:state,DISCOVERY:data,
 cap:(x,a=0,b=100)=>Math.max(a,Math.min(b,Math.round(x))),
 rand:(a,b)=>b,
 cash:n=>'$'+Math.round(n),
 skill:(k,n)=>{state.skills[k]=Math.min(100,(state.skills[k]||0)+n)},
 stat:(k,n)=>{state.stats[k]=Math.min(100,(state.stats[k]||0)+n)},
 checkFree:()=>true,
 actionKey:(action,id)=>action+':'+id+':',
 repeatMultiplier:count=>count<3?1:Math.pow(.72,count-2),
 spend:n=>{if(state.cash<n)return false;state.cash-=n;return true},
 log:msg=>messages.push(msg),fail:msg=>messages.push('FAIL: '+msg),
 doAct:(_cost,callback)=>{const outcome=callback();if(outcome!==false)messages.push(outcome)},
 heading:()=>'',esc:x=>String(x)
};
const context=vm.createContext(sim);
const impl=vm.runInContext(script.slice(start,end)+'\n({discoveryPage,discoveryActivityList,doDiscoveryActivity,doDiscoveryProject,discoveryResults});',context);
const auto=impl.discoveryActivityList();
assert.ok(auto.every(a=>a.min<=14&&a.max>=14),'For-you activities should match player age');
assert.ok(auto.length>=35&&auto.length<=90,'For-you page should be a manageable selection');
impl.doDiscoveryActivity('technology-01');
assert.equal(state.discoveryRecords['technology-01'],1);
assert.ok(state.skills.coding>15&&state.stats.smart>57,'Real action must increase related traits');
assert.ok(state.grades>63,'Educational choices should affect grades');
const earlyCount=Object.keys(state.discoveryRecords).length;
impl.doDiscoveryActivity('tiny-01');
assert.equal(Object.keys(state.discoveryRecords).length,earlyCount,'Age-ineligible action must be rejected');
const moneyBefore=state.cash;
impl.doDiscoveryActivity('business-01');
assert.ok(state.cash>moneyBefore,'Business choices should allow legitimate income');
assert.equal(state.discoveryRecords['business-01'],1);
let project=state.discoveryProjects.firstapp;
assert.equal(project,undefined);
const beforeProject=state.cash;
for(let i=0;i<7;i++)impl.doDiscoveryProject('firstapp');
project=state.discoveryProjects.firstapp;
assert.equal(project.progress,7,'Multi-step work needs saved progress');
assert.equal(project.completed,true,'The project should finish on its final step');
assert.equal(state.cash,beforeProject-320+350,'Pay project costs once and award reward once');
const balance=state.cash;
impl.doDiscoveryProject('firstapp');
assert.equal(state.cash,balance,'Completed projects must not pay repeatedly');
assert.ok(messages.some(x=>String(x).includes('PROJECT COMPLETE')),'Project completion should be celebrated');
vm.runInContext("discoveryFilter='technology';discoverySearch='website';",context);
const filtered=impl.discoveryActivityList();
assert.equal(filtered.length,1);
assert.equal(filtered[0].title,'Build a personal website');
console.log('PASS: 308 original activities in 22 categories, 24 multi-step projects, playable actions, search/age gating, persistent progress, rewards and legacy saves.');

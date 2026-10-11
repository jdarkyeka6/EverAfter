#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const zlib=require('node:zlib');

const root=path.resolve(__dirname,'..');
const src=path.join(root,'Everafter','Game');
const out=path.join(root,'web-dist');
if(!fs.existsSync(path.join(src,'index.html')))throw Error('EverAfter game missing');
fs.rmSync(out,{recursive:true,force:true});
fs.cpSync(src,out,{recursive:true,force:true});

const files=[];
function walk(dir,prefix=''){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const rel=prefix?prefix+'/'+entry.name:entry.name;
  const p=path.join(dir,entry.name);
  if(entry.isDirectory())walk(p,rel);
  else files.push(rel);
 }
}
walk(out);
if(files.filter(f=>f.endsWith('.svg')).length!==187)throw Error('The web build must contain all 187 art assets.');

const gamePath=path.join(out,'index.html');
let html=fs.readFileSync(gamePath,'utf8');
const head='<head>';
if(!html.includes(head))throw Error('Unexpected HTML head');
const siteMeta=`
<meta name="description" content="Play EverAfter, the free choice-driven life simulator. Make decisions, grow up, build relationships, careers and businesses, and create your own story.">
<meta name="application-name" content="EverAfter">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="EverAfter">
<meta name="mobile-web-app-capable" content="yes">
<meta property="og:type" content="website">
<meta property="og:title" content="EverAfter | Your Life. Your Story.">
<meta property="og:description" content="The free illustrated life simulator. Every choice shapes your story.">
<meta property="og:image" content="/icons/everafter-512.png">
<meta name="color-scheme" content="dark">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/assets/icons/looks.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icons/everafter-192.png">
`;
html=html.replace(head,head+siteMeta);
html=html.replace(/<title>[^<]*<\/title>/,'<title>EverAfter | Play the Life Simulator Online</title>');
const closing='</body>';
const install=`
<script>
if('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')){
  addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
}
</script>
`;
if(!html.includes(closing))throw Error('Missing body closing tag');
html=html.replace(closing,install+closing);
fs.writeFileSync(gamePath,html);

const manifest={
 name:'EverAfter: Your Life. Your Story.',
 short_name:'EverAfter',
 description:'Free offline-ready life simulator with illustrated life stories and choices.',
 id:'/',
 start_url:'/',
 scope:'/',
 display:'standalone',
 background_color:'#0b0b19',
 theme_color:'#241638',
 orientation:'any',
 categories:['games','entertainment'],
 icons:[
  {src:'/icons/everafter-192.png',sizes:'192x192',type:'image/png',purpose:'any maskable'},
  {src:'/icons/everafter-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}
 ]
};
fs.writeFileSync(path.join(out,'manifest.webmanifest'),JSON.stringify(manifest,null,2));

function crc32(buf){
 let c=0xffffffff;
 for(const b of buf){c^=b;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1}
 return (c^0xffffffff)>>>0;
}
function chunk(type,data){const label=Buffer.from(type);const result=Buffer.alloc(12+data.length);result.writeUInt32BE(data.length,0);label.copy(result,4);data.copy(result,8);result.writeUInt32BE(crc32(Buffer.concat([label,data])),8+data.length);return result;}
function iconPNG(size){
 const raw=Buffer.alloc(size*(1+4*size));
 for(let y=0;y<size;y++){
  let i=y*(1+4*size);raw[i++]=0;
  for(let x=0;x<size;x++){
   const u=(x+0.5)/size, v=(y+0.5)/size;
   const radius=Math.hypot(u-.5,v-.5);
   const shine=Math.max(0,1-Math.hypot(u-.73,v-.22)*1.6);
   const color=[Math.round(51+42*(1-v)+48*shine),Math.round(27+15*(1-v)+18*shine),Math.round(96+64*(1-v)+25*shine),255];
   const E=(u>.26&&u<.355&&v>.24&&v<.77) || (u>.31&&u<.73&&v>.24&&v<.325) || (u>.31&&u<.67&&v>.45&&v<.54) || (u>.31&&u<.73&&v>.68&&v<.77);
   if(E){color[0]=242;color[1]=224;color[2]=255}
   const star=Math.abs(u-.79)<.010&&Math.abs(v-.19)<.065||Math.abs(v-.19)<.010&&Math.abs(u-.79)<.065;
   if(star){color[0]=255;color[1]=219;color[2]=155}
   if(radius>.69){color[3]=0}
   for(const c of color)raw[i++]=c;
  }
 }
 const header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
const icons=path.join(out,'icons');fs.mkdirSync(icons,{recursive:true});
for(const n of [192,512])fs.writeFileSync(path.join(icons,'everafter-'+n+'.png'),iconPNG(n));

const buildId=crypto.createHash('sha256').update(html).digest('hex').slice(0,12);
const cached=['/','/index.html','/manifest.webmanifest','/icons/everafter-192.png','/icons/everafter-512.png',
...files.filter(f=>f.startsWith('assets/')&&(f.endsWith('.svg')||f.endsWith('.png'))).map(f=>'/'+f)];
const sw=`
'use strict';
const CACHE='everafter-web-${buildId}';
const ASSETS=${JSON.stringify(cached)};
self.addEventListener('install',e=>{
 e.waitUntil(caches.open(CACHE).then(async cache=>{
  // Batch requests to avoid overloading slower connections.
  for(let i=0;i<ASSETS.length;i+=24)await cache.addAll(ASSETS.slice(i,i+24));
 }).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
 e.waitUntil(caches.keys().then(async names=>{
  await Promise.all(names.filter(n=>n.startsWith('everafter-web-')&&n!==CACHE).map(n=>caches.delete(n)));
  await self.clients.claim();
 }));
});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 if(e.request.mode==='navigate'){
  e.respondWith(fetch(e.request).then(r=>{
   if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put('/index.html',copy))}
   return r;
  }).catch(()=>caches.match('/index.html')));
  return;
 }
 e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(response=>{
  if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}
  return response;
 })));
});
`;
fs.writeFileSync(path.join(out,'sw.js'),sw);
console.log('EverAfter web ready: '+files.length+' source files and '+(cached.length)+' offline-cache assets in web-dist/');

'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const out=path.resolve(__dirname,'../web-dist');
const html=fs.readFileSync(path.join(out,'index.html'),'utf8');
const js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
assert.ok(js.length>120000,'The complete original game JavaScript must be included');
assert.ok(html.includes('EverAfter | Play the Life Simulator Online'));
assert.ok(html.includes('<link rel="manifest" href="/manifest.webmanifest">'));
assert.ok(html.includes("navigator.serviceWorker.register('/sw.js')"));
assert.ok(html.includes('eventArtPath(m.title)'),'Illustrated events must be present');
assert.ok(html.includes('localStorage'),'Browser saves must be supported');
assert.ok(html.includes('actionReps'),'Unlimited diminishing-returns actions must be included');
new Function(js.slice(0,js.lastIndexOf('</script>')<0?js.length:js.lastIndexOf('</script>')));
const assets=fs.readdirSync(path.join(out,'assets','events')).filter(x=>x.endsWith('.svg'));
assert.equal(assets.length,106);
const avatars=fs.readdirSync(path.join(out,'assets','avatars')).filter(x=>x.endsWith('.svg'));
assert.equal(avatars.length,60);
const manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.webmanifest'),'utf8'));
assert.equal(manifest.display,'standalone');
for(const f of ['index.html','sw.js','manifest.webmanifest','icons/everafter-192.png','icons/everafter-512.png','assets/events/the-toy-incident.svg']){
 assert.ok(fs.statSync(path.join(out,f)).size>50,'Missing web asset: '+f);
}
const sw=fs.readFileSync(path.join(out,'sw.js'),'utf8');
assert.ok(sw.includes('everafter-web-')&&sw.includes('caches.open'),'Service worker must support offline play');
assert.ok(sw.includes('/content/discover.js'),'Offline cache must include all expanded gameplay code');
assert.ok(sw.includes('/assets/events/the-toy-incident.svg'),'Offline cache must include illustrated events');
console.log('PASS: Browser game, artwork, local saves, installable manifest and offline cache are packaged.');

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const out = path.resolve(__dirname, '../build-resources/icon.ico');
fs.mkdirSync(path.dirname(out), { recursive: true });

function coverage(dist, feather=1.2) { return Math.max(0, Math.min(1, 0.5 - dist / feather)); }
function roundedDist(px, py, cx, cy, halfW, halfH, radius) {
  const x = Math.abs(px - cx) - (halfW - radius);
  const y = Math.abs(py - cy) - (halfH - radius);
  return Math.hypot(Math.max(x, 0), Math.max(y, 0)) + Math.min(Math.max(x,y),0) - radius;
}
function mix(a,b,p) { return a.map((v,i)=>v*(1-p)+b[i]*p); }
function pixel(x,y){
  const qx=x/256, qy=y/256;
  const d=roundedDist(x,y,128,128,122,122,47);
  let alpha=coverage(d,1.5);
  if(alpha<=0) return [0,0,0,0];
  let rgb=mix([100,58,178],[31,21,81],Math.min(1,.05+.89*qy));
  const halo=Math.max(0,1-Math.hypot(x-183,y-45)/178);
  rgb=mix(rgb,[192,115,214],halo*.33);
  const border=coverage(Math.abs(d+4)-1.2,1.5);
  rgb=mix(rgb,[223,172,255],border*.38);
  // Rounded monogram: three custom-cut horizontal bars and the tall vertical spine.
  const eSpine=coverage(roundedDist(x,y,96,128,16,73,7),1.7);
  const bars=[
    coverage(roundedDist(x,y,140,70,61,14,7),1.7),
    coverage(roundedDist(x,y,133,129,54,13,7),1.7),
    coverage(roundedDist(x,y,140,185,61,14,7),1.7)
  ];
  const e=Math.max(eSpine,...bars);
  rgb=mix(rgb,[247,227,255],e);
  // A small warm sparkle balances the purple monogram.
  const star=Math.max(
    coverage(roundedDist(x,y,211,47,2.6,20,2.2),1.2),
    coverage(roundedDist(x,y,211,47,20,2.6,2.2),1.2)
  );
  rgb=mix(rgb,[255,213,150],star);
  return [...rgb.map(v=>Math.max(0,Math.min(255,Math.round(v)))),Math.round(alpha*255)];
}
function bitmapIcon(size){
  const row=size*4;
  const bmp=Buffer.alloc(40+row*size+Math.ceil(size/32)*4*size);
  bmp.writeUInt32LE(40,0);
  bmp.writeInt32LE(size,4);
  bmp.writeInt32LE(size*2,8);
  bmp.writeUInt16LE(1,12);
  bmp.writeUInt16LE(32,14);
  bmp.writeUInt32LE(0,16);
  bmp.writeUInt32LE(row*size,20);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const rgba=pixel((x+.5)*256/size,(y+.5)*256/size);
    const offset=40+(size-1-y)*row+x*4;
    bmp[offset]=rgba[2];bmp[offset+1]=rgba[1];bmp[offset+2]=rgba[0];bmp[offset+3]=rgba[3];
  }
  // Set the 1-bit alpha mask for transparent corner pixels.
  const maskOffset=40+row*size,maskRow=Math.ceil(size/32)*4;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    if(pixel((x+.5)*256/size,(y+.5)*256/size)[3]>0)continue;
    bmp[maskOffset+(size-1-y)*maskRow+(x>>3)]|=1<<(7-(x%8));
  }
  return bmp;
}
const sizes=[32,48,64,128,256];
const bitmaps=sizes.map(bitmapIcon);
const ico=Buffer.alloc(6+16*sizes.length+bitmaps.reduce((n,b)=>n+b.length,0));
ico.writeUInt16LE(0,0);ico.writeUInt16LE(1,2);ico.writeUInt16LE(sizes.length,4);
let cursor=6+16*sizes.length;
sizes.forEach((sz,i)=>{
  const entry=6+i*16,icon=bitmaps[i];
  ico[entry]=sz===256?0:sz;ico[entry+1]=sz===256?0:sz;
  ico[entry+2]=0;ico[entry+3]=0;
  ico.writeUInt16LE(1,entry+4);ico.writeUInt16LE(32,entry+6);
  ico.writeUInt32LE(icon.length,entry+8);ico.writeUInt32LE(cursor,entry+12);
  icon.copy(ico,cursor);cursor+=icon.length;
});
fs.writeFileSync(out,ico);
console.log('Generated native Windows icon: '+out+' ('+ico.length+' bytes).');

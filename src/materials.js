import * as THREE from 'three';

export function random(seed = 69) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function makeMaterials(renderer) {
  const rng = random(420);
  const textures = [];
  function texture(size, meters, paint) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const ctx = c.getContext('2d'); paint(ctx, size);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    t.userData.meters = meters; textures.push(t); return t;
  }
  function grain(ctx, size, amount, alpha = .06) {
    for(let i = 0; i < amount; i++) { const v = rng() > .5 ? 255 : 0; ctx.fillStyle = `rgba(${v},${v},${v},${alpha * rng()})`; ctx.fillRect(rng()*size,rng()*size,1+rng()*3,1+rng()*3); }
  }
  const brick = texture(512, 1.44, (c,s) => {
    c.fillStyle='#918371';c.fillRect(0,0,s,s);
    for(let row=0;row<16;row++)for(let col=-1;col<8;col++){
      const x=col*85.33+(row%2)*42.67,y=row*32,v=rng()*18;
      c.fillStyle=`rgb(${132+v},${101+v},${79+v})`;c.fillRect(x+2,y+2,81,28);
      c.fillStyle='#ffffff0c';c.fillRect(x+3,y+2,79,2);c.fillStyle='#171c172a';c.fillRect(x+3,y+28,79,2);
      for(let j=0;j<12;j++){c.fillStyle=rng()>.5?'#392f251a':'#eed5ad16';c.fillRect(x+rng()*80,y+3+rng()*24,3+rng()*12,1+rng()*3);}
    }grain(c,s,16000,.075);
  });
  const plaster=texture(256,3.2,(c,s)=>{c.fillStyle='#d2ccb9';c.fillRect(0,0,s,s);grain(c,s,16000,.11);});
  const asphalt=texture(512,3.5,(c,s)=>{
    c.fillStyle='#505352';c.fillRect(0,0,s,s);grain(c,s,45000,.22);
    for(let i=0;i<6;i++){let x=rng()*s,y=rng()*s;c.strokeStyle='#252d2d66';c.lineWidth=.6+rng();c.beginPath();c.moveTo(x,y);for(let j=0;j<6;j++){x+=(rng()-.5)*38;y+=rng()*32;c.lineTo(x,y);}c.stroke();}
  });
  const concrete=texture(512,3,(c,s)=>{
    c.fillStyle='#aeafa3';c.fillRect(0,0,s,s);grain(c,s,34000,.12);
    c.strokeStyle='#676f6650';c.lineWidth=2;c.strokeRect(1,1,s-2,s-2);c.beginPath();c.moveTo(s/2,0);c.lineTo(s/2,s);c.moveTo(0,s/2);c.lineTo(s,s/2);c.stroke();
    for(let i=0;i<50;i++){c.fillStyle='#3e47340a';c.beginPath();c.ellipse(rng()*s,rng()*s,rng()*25+3,rng()*7+2,0,0,Math.PI*2);c.fill();}
  });
  const siding=texture(512,3.5,(c,s)=>{
    c.fillStyle='#dbd6bc';c.fillRect(0,0,s,s);
    for(let i=0;i<20;i++){c.fillStyle='#746e563f';c.fillRect(0,i*25.6,s,3);c.fillStyle='#ffffff50';c.fillRect(0,i*25.6+4,s,2);}
    grain(c,s,22000,.09);
  });
  const roof=texture(512,4,(c,s)=>{
    c.fillStyle='#484b45';c.fillRect(0,0,s,s);
    for(let y=0;y<16;y++)for(let x=-1;x<9;x++){const v=Math.floor(rng()*18);c.fillStyle=`rgb(${62+v},${65+v},${60+v})`;c.fillRect(x*64+(y%2)*32,y*32,62,29);}grain(c,s,18000,.14);
  });
  const soil=texture(512,6,(c,s)=>{
    c.fillStyle='#697157';c.fillRect(0,0,s,s);
    for(let i=0;i<50000;i++){c.fillStyle=['#a2a57544','#36493344','#b2a17433','#555b4344'][i%4];c.fillRect(rng()*s,rng()*s,1+rng()*4,1+rng()*6);}
  });
  const wood=texture(256,2.3,(c,s)=>{c.fillStyle='#918575';c.fillRect(0,0,s,s);for(let i=0;i<500;i++){c.fillStyle=rng()>.5?'#e5d1a725':'#2f30222e';c.fillRect(rng()*s,rng()*s,1+rng()*2,5+rng()*95);}for(let i=0;i<9;i++){c.fillStyle='#33382866';c.fillRect(i*s/8,0,2,s);}});
  const m={};
  const lam=(name,color,map=null)=>{const mat=new THREE.MeshLambertMaterial({color,map});mat.name=name;m[name]=mat;return mat;};
  lam('brick','#c3a99a',brick);lam('redBrick','#c58f76',brick);lam('darkBrick','#9a9385',brick);
  lam('plaster','#d4cfb8',plaster);lam('green','#879c85',plaster);lam('cream','#e1d5b5',plaster);lam('fadedBlue','#94a3a5',siding);lam('siding','#ded9bd',siding);lam('ochre','#b7a989',siding);
  lam('asphalt','#a6a9ab',asphalt);lam('concrete','#d4d3c4',concrete);lam('gravel','#bcb8a5',asphalt);lam('roof','#d3d2c6',roof);lam('soil','#c0c49a',soil);lam('wood','#b2b098',wood);
  lam('trim','#dbd8bf');lam('white','#ede9d5');lam('dark','#323d39');lam('metal','#596663');lam('rust','#897361');lam('red','#b84d35');lam('yellow','#e7b758');lam('paint','#c9c8a7');lam('leaf','#465e3d');lam('trunk','#756653');lam('bin','#486450');
  const glass=lam('glass','#4c6969');glass.emissive.set('#233632');glass.emissiveIntensity=.15;
  const glow=lam('glow','#ffd598');glow.emissive.set('#ffd18b');glow.emissiveIntensity=.8;
  const lit=lam('curtain','#b0a282');lit.emissive.set('#7c6745');lit.emissiveIntensity=.2;
  return {m,textures};
}

export class SignAtlas {
  constructor() {
    this.canvas=document.createElement('canvas');this.canvas.width=2048;this.canvas.height=2048;this.ctx=this.canvas.getContext('2d');this.count=0;
    this.texture=new THREE.CanvasTexture(this.canvas);this.texture.colorSpace=THREE.SRGBColorSpace;this.texture.anisotropy=4;
    this.material=new THREE.MeshLambertMaterial({map:this.texture,side:THREE.DoubleSide});this.material.name='neighbourhood-signs';
  }
  add(title,subtitle='',bg='#334c40',fg='#e9dcc0',style='sign') {
    const index=this.count++,col=index%4,row=Math.floor(index/4),x=col*512,y=row*256,c=this.ctx;
    if(style==='wide'){
      c.fillStyle=bg;c.fillRect(x,y,512,256);c.strokeStyle=fg;c.lineWidth=2;c.strokeRect(x+6,y+4,500,56);
      c.textAlign='center';c.textBaseline='middle';c.fillStyle=fg;c.font='700 38px Arial';c.fillText(title,x+256,y+33,474);
      this.texture.needsUpdate=true;return{u0:(x+1)/2048,v0:1-(y+63)/2048,u1:(x+511)/2048,v1:1-(y+1)/2048,aspect:8};
    }
    c.fillStyle=bg;c.fillRect(x,y,512,256);c.strokeStyle=fg;c.lineWidth=3;c.strokeRect(x+12,y+12,488,232);
    c.textAlign='center';c.textBaseline='middle';c.fillStyle=fg;
    if(style==='window'){
      c.fillStyle='#273b3a';c.fillRect(x,y,512,256);
      const gr=c.createLinearGradient(x,y,x+512,y+256);gr.addColorStop(0,'#83948a');gr.addColorStop(.4,'#5a7878');gr.addColorStop(.41,'#465f5b');gr.addColorStop(1,'#273b39');c.fillStyle=gr;c.fillRect(x,y,512,230);
      c.fillStyle='#162e2b';c.fillRect(x+40,y+80,150,160);c.fillRect(x+320,y+110,140,130);c.fillStyle='#bdaa823b';c.fillRect(x+32,y+242,470,14);
      c.fillStyle='#ede4c1';c.font='600 32px Arial';c.fillText(title,x+256,y+112,440);c.font='20px Arial';c.fillText(subtitle,x+256,y+153,440);
      c.fillStyle='#d7e1c710';c.beginPath();c.moveTo(x+20,y);c.lineTo(x+220,y);c.lineTo(x+480,y+256);c.lineTo(x+280,y+256);c.fill();
    }else{
      c.font=`800 ${title.length>17?40:60}px Arial`;c.fillText(title,x+256,y+(subtitle?103:129),454);
      if(subtitle){c.font='500 26px Arial';c.fillText(subtitle,x+256,y+176,455);}
    }
    this.texture.needsUpdate=true;
    return {u0:(x+1)/2048,v0:1-(y+255)/2048,u1:(x+511)/2048,v1:1-(y+1)/2048};
  }
}

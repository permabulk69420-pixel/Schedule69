import * as THREE from 'three';
import {random} from './materials.js';
import {COAST,beachHeight,beachRampHeight} from './surfaces.js';

// Cedar Street meets this north–south coastal road at its eastern end.
export function buildCoast(b,{atlas,sign,signs,bench,lamp,pine,fence}){
  const c=COAST,rng=random(6911),edge=c.promenadeEdge;
  signs.esplanade=atlas.add('ESPLANADE','','#486d70','#efe3c9','wide');
  signs.beach=atlas.add('CEDAR BEACH','ESPLANADE','#486d70','#efe3c9');
  signs.beachAccess=atlas.add('BEACH ACCESS','','#486d70','#efe3c9','wide');

  function patch(xs,zs,height,mat,tint=false){
    const positions=[],uvs=[],colors=[],indices=[];
    for(const z of zs)for(const x of xs){
      positions.push(x,height(x,z),z);uvs.push(x/(tint?5.5:3),z/(tint?5.5:3));
      if(tint){const wet=THREE.MathUtils.smoothstep(x,147,162),shade=new THREE.Color('#ffffff').lerp(new THREE.Color('#929d91'),wet);colors.push(shade.r,shade.g,shade.b);}
    }
    for(let row=0;row<zs.length-1;row++)for(let col=0;col<xs.length-1;col++){
      const a=row*xs.length+col,n=xs.length;indices.push(a,a+n,a+1,a+1,a+n,a+n+1);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
    if(tint)g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    g.setIndex(indices);g.computeVertexNormals();b.add(g,mat,0,0,0,0,0,0,false);
  }
  function rail(x1,z1,x2,z2,heightAt=()=>.14,solid=true){
    const distance=Math.hypot(x2-x1,z2-z1),count=Math.ceil(distance/2.5);
    for(let i=0;i<=count;i++){
      const t=i/count,x=THREE.MathUtils.lerp(x1,x2,t),z=THREE.MathUtils.lerp(z1,z2,t),y=heightAt(x,z);
      b.box(x,y+.54,z,.09,1.08,.09,'metal');b.box(x,y+.035,z,.18,.07,.18,'dark');
    }
    for(const offset of[.49,1.06])b.beam([x1,heightAt(x1,z1)+offset,z1],[x2,heightAt(x2,z2)+offset,z2],.035,'metal');
    if(solid)b.collision((x1+x2)/2,(z1+z2)/2,Math.abs(x2-x1)+.1,Math.abs(z2-z1)+.1);
  }
  function stone(x,z,size){
    const g=new THREE.DodecahedronGeometry(1,0);g.scale(size*(.85+rng()*.3),size*.7,size*(.8+rng()*.45));
    b.add(g,'coastalStone',x,beachHeight(x,z)+size*.24,z,rng()*.35,rng()*Math.PI,rng()*.22);
    b.collision(x,z,size*1.55,size*1.5);
  }

  // Meet the existing asphalt and sidewalks edge-to-edge. Grass stops at roads.
  b.box((89+108.75)/2,-.04,0,108.75-89,.08,10,'asphalt',0,false);
  b.box(c.roadX,-.035,(c.minZ+c.maxZ)/2,9.5,.08,c.maxZ-c.minZ,'asphalt',0,false);
  for(const [start,end]of[[-115,-5.15],[5.15,120]])
    b.box((91+99.14)/2,-.025,(start+end)/2,99.14-91,.29,end-start,'soil',0,false);
  for(const [start,end]of[[-50,-44],[46.5,51.5]])b.box(89.5,-.025,(start+end)/2,3,.29,end-start,'soil',0,false);
  for(const [start,end]of[[-115,c.minZ],[c.maxZ,120]])b.box((99.14+edge)/2,-.025,(start+end)/2,edge-99.14,.29,end-start,'soil',0,false);
  for(const [start,end]of[[c.minZ,-5.15],[5.15,c.maxZ]]){
    b.box((94.45+99.14)/2,.065,(start+end)/2,99.14-94.45,.17,end-start,'concrete',0,false);
    b.box(99.25,.08,(start+end)/2,.22,.24,end-start,'trim',0,false);
  }
  for(const z of[-6.8,6.8])b.box((87+94.45)/2,.065,z,94.45-87,.17,3.6,'concrete',0,false);
  for(const z of[-5.04,5.04])b.box((87+99.14)/2,.08,z,99.14-87,.24,.22,'trim',0,false);
  b.box((108.86+edge)/2,.04,(c.minZ+c.maxZ)/2,edge-108.86,.2,c.maxZ-c.minZ,'concrete',0,false);
  b.box(108.75,.08,(c.minZ+c.maxZ)/2,.22,.24,c.maxZ-c.minZ,'trim',0,false);
  // Warm paving bands make the long promenade read as one continuous walkway.
  for(const x of[114.35,120.8])b.box(x,.144,(c.minZ+c.maxZ)/2,.18,.008,c.maxZ-c.minZ,'trim',0,false);
  for(let z=c.minZ+4;z<c.maxZ-3;z+=5.2)if(Math.abs(z)>13)b.box(104,.017,z,.095,.008,2.5,'paint',0,false);
  for(const z of[-.13,.13])for(const x of[84.4,89.6])b.box(x,.012,z,2.5,.008,.085,'yellow',0,false);
  for(const z of[-10.5,10.5])for(let x=100.15;x<108;x+=1.08)b.box(x,.023,z,.55,.012,2.5,'paint',0,false);
  for(let z=-3.8;z<4;z+=1.08)b.box(94,.02,z,2.4,.011,.54,'paint',0,false);
  for(const z of[-53,-17,24,65]){b.box(108.45,.024,z,.28,.03,.9,'metal',0,false);for(let i=0;i<6;i++)b.box(108.45,.043,z-.32+i*.13,.23,.012,.035,'dark',0,false);}

  // Retaining wall and railing have open gaps exactly where the ramps begin.
  const spans=[[c.minZ,c.rampZs[0]-1.85],[c.rampZs[0]+1.85,c.rampZs[1]-1.85],[c.rampZs[1]+1.85,c.maxZ]];
  for(const [start,end]of spans){
    b.box(edge+.05,-.4,(start+end)/2,.4,1.08,end-start,'plaster');
    b.box(edge+.05,.18,(start+end)/2,.53,.08,end-start,'trim');
    rail(edge+.05,start,edge+.05,end,()=>.22);
    b.collision(edge+.05,(start+end)/2,.53,end-start);
  }
  const zs=[-600,-400,-250,-160,-110,-84,...Array.from({length:42},(_,i)=>-80+i*4),100,150,220,350,500,600];
  patch([edge,124,128,132,136,138,140,144,148,152,156,158,160,164,168,176,184,230],zs,beachHeight,'beach',true);
  // The bank continues beyond the promenade; the ocean never overlays grass.
  for(const [start,end]of[[-600,c.minZ],[c.maxZ,600]])b.box(edge-.1,-.3,(start+end)/2,.25,.84,end-start,'sand',0,false);

  for(const rz of c.rampZs){
    const rampY=x=>beachRampHeight(x,rz);
    patch([edge,125,129,133,c.rampEnd],[rz-c.rampHalfWidth,rz+c.rampHalfWidth],rampY,'concrete');
    for(const side of[-1,1]){
      const z=rz+side*1.77;
      rail(edge,z,c.rampEnd,z,rampY);
      // Low sidewalls fill the underside instead of leaving a floating slab.
      const g=new THREE.BufferGeometry(),floor=beachHeight(edge,rz)-.13;
      g.setAttribute('position',new THREE.Float32BufferAttribute([edge,floor,z,c.rampEnd,floor,z,edge,rampY(edge),z,c.rampEnd,rampY(c.rampEnd),z],3));
      g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,5,0,0,.4,5,.1],2));g.setIndex(side<0?[0,2,1,1,2,3]:[0,1,2,1,3,2]);g.computeVertexNormals();b.add(g,'concrete');
    }
    sign(119.2,1.58,rz-2.7,2,.35,'beachAccess',-Math.PI/2);b.box(119.3,.82,rz-2.7,.1,1.5,.12,'metal');b.collision(119.3,rz-2.7,.2,.2);
  }

  // Street furniture stays out of the central walking line and ramp approaches.
  for(const z of[-56,-18,20,65]){
    b.box(111.75,.19,z,3.05,.1,6.4,'trim');b.box(111.75,.244,z,2.83,.012,6.18,'soil',0,false);
    b.collision(111.75,z,3.05,6.4);pine(111.75,z,8.2+rng(),.8);
    bench(118.1,z,Math.PI/2);
    b.cylinder(115.05,.7,z+3.9,.25,.29,1.08,'metal',10);b.cylinder(115.05,1.26,z+3.9,.3,.3,.09,'dark',10);b.collision(115.05,z+3.9,.62,.62);
  }
  for(const z of[-61,-39,-12,15,47,72])lamp(109.8,z,-Math.PI/2);
  for(const [x,z,h]of[[90,-40,11],[91,32,10],[89,58,12]])pine(x,z,h,.95);
  b.area(97.5,7.8,-Math.PI/2,()=>{b.cylinder(0,1.8,0,.055,.065,3.4,'metal');sign(0,3.17,0,2.7,.43,'esplanade');sign(0,2.71,0,2.15,.4,'cedar',Math.PI/2);b.collision(0,0,.2,.2);});
  sign(113.7,1.75,-4,2.2,1,'beach',-Math.PI/2);
  for(const z of[-4.75,-3.25])b.box(113.8,.88,z,.1,1.75,.13,'wood');b.collision(113.8,-4,.2,1.65);

  for(const z of[c.minZ,c.maxZ]){
    for(const x of[100.3,107.7])b.box(x,.61,z,.14,.96,.16,'wood');
    b.box(104,.94,z,8.6,.22,.15,'cream');b.box(104,.61,z,8.6,.12,.15,'red');b.collision(104,z,8.7,.3);
    sign(104,1.24,z,2.1,.32,'roadEnd',z<0?0:Math.PI);
    rail(108.95,z,edge,z);
    fence(83,z,99.1,z,false);
    for(let i=0;i<11;i++)stone(123+i*4,z+(rng()-.5)*2,1.8+rng()*1.05);
  }
  for(const [x,z,s]of[[126,-53,1.2],[128,60,.9],[150,-62,.75],[148,70,.85]])stone(x,z,s);
  b.bounds.maxX=c.beachLimit;
  return {roadCenter:[104,0,0],promenade:[117,.14,0],north:[117,.14,-59],south:[117,.14,69],
    ramps:c.rampZs.map(z=>({top:[120,.14,z],bottom:[139,beachHeight(139,z),z]})),
    beach:[150,beachHeight(150,0),0],shore:[162,beachHeight(162,0),0]};
}

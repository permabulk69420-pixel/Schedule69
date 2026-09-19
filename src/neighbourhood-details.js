import * as THREE from 'three';
import { random } from './materials.js';

// Static dressing inside the existing district. Keep destinations and circulation
// explicit so later gameplay can use them without coupling props to game systems.
export function dressNeighbourhood(b,{atlas,sign,signs,bench,fence}) {
  const rng=random(69019),destinations=[];
  const label=(id,title,subtitle='',bg='#426c68',fg='#efe2bf',style='sign')=>{
    signs[id]=atlas.add(title,subtitle,bg,fg,style);
  };
  label('cedarSquare','CEDAR CORNER','A LITTLE ROOM FOR EVERYONE');
  label('garden','PINE PATCH','COMMUNITY GARDEN');
  label('gardenNotice','SATURDAY SWAP','SEEDS  /  CUTTINGS  /  STORIES','#d0bc91','#3e5145');
  label('busRoute','04  /  CEDAR BEACH','MARKET  >  PINE AVE  >  COAST');
  label('marketProduce','FRESH TODAY','LOCAL FRUIT & VEG','#d5c09a','#3b5747');
  label('dinerMenu','SUNSET SPECIAL','COFFEE & A SLICE  /  $4.50','#354c47','#edd4a0');
  label('laundryPoster','LOST SOCK CLUB','EVERY PAIR HAS A STORY','#b8c8bb','#3a5656');
  label('garageYard','RIVERSIDE AUTO','TYRES  /  REPAIRS  /  LOCAL SINCE 1986','#dbca9d','#554b3c');
  label('beachShelter','CEDAR BEACH PICNIC CLUB','','#426c68','#efe2bf','wide');
  label('tideBoard','TAKE THE SLOW WAY','CEDAR BEACH','#426c68','#efe2bf');
  label('muralCaption','GROW A LITTLE HERE','','#426c68','#efe2bf','wide');

  function destination(name,x,z){destinations.push({name,position:[x,.14,z]});}
  function paving(x,z,w,d,mat='concrete'){
    b.box(x,mat==='gravel'?.065:.075,z,w,.13,d,mat,0,false); // Gravel sits below inset concrete paths.
  }
  function shrub(x,z,r=.45,y=.7){
    const g=new THREE.IcosahedronGeometry(r,0);g.scale(1,.72,.88);
    b.add(g,'leaf',x,y,z,.1,rng()*6.28,.1);
  }
  function pot(x,z,r=.25,flowers=false,base=.14){
    b.cylinder(x,base+r*.7,z,r,r*.7,r*1.4,'rust',8);
    b.cylinder(x,base+r*1.4,z,r*.94,r*.94,.035,'dark',8);
    shrub(x,z,r*1.4,base+r*2.05);
    if(flowers)for(let i=0;i<5;i++){
      const a=i*2.4;b.add(new THREE.IcosahedronGeometry(.065,0),i%2?'yellow':'red',x+Math.cos(a)*r,base+.1+r*2.6,z+Math.sin(a)*r);
    }
    b.collision(x,z,r*2,r*2);
  }
  function planter(x,z,w,d,flowers=false){
    b.box(x,.35,z,w,.44,d,'wood');b.box(x,.58,z,w-.16,.035,d-.16,'dark',0,false);
    for(let i=0;i<Math.floor(w/.6);i++){
      const px=x-w/2+.35+i*.6;shrub(px,z,.39,.84);
      if(flowers)b.add(new THREE.IcosahedronGeometry(.09,0),'yellow',px,1.16,z+.06);
    }
    b.collision(x,z,w,d);
  }
  function picnic(x,z,yaw=0){b.area(x,z,yaw,()=>{
    for(let i=0;i<6;i++)b.box(0,.94,-.44+i*.176,2.3,.075,.15,'wood');
    for(const sx of[-1,1]){
      for(const side of[-1,1])b.beam([sx*.78,.18,side*.86],[sx*.78,.9,side*.26],.055,'metal');
      b.beam([sx*.78,.49,-1.04],[sx*.78,.49,1.04],.05,'metal');
    }
    for(const side of[-1,1])for(const offset of[-.1,.1])b.box(0,.59,side*.85+offset,2.4,.08,.18,'wood');
    b.collision(0,0,2.4,2.12);
  });}
  function pergola(x,z,w,d){b.area(x,z,0,()=>{
    for(const sx of[-1,1])for(const sz of[-1,1]){
      const px=sx*(w/2-.18),pz=sz*(d/2-.18);
      b.box(px,1.7,pz,.18,3.12,.18,'wood');b.box(px,.3,pz,.26,.32,.26,'metal');b.collision(px,pz,.27,.27);
      b.beam([px,2.4,pz],[px-sx*.62,3.12,pz],.065,'wood');
    }
    for(const z of[-d/2+.18,d/2-.18])b.box(0,3.15,z,w+.5,.23,.19,'wood');
    for(let x=-w/2;x<=w/2+.01;x+=.7)b.box(x,3.34,0,.13,.17,d+.6,'wood');
  });}
  function bikeRack(x,z,yaw=0){b.area(x,z,yaw,()=>{
    for(const x of[-.85,0,.85]){
      for(const z of[-.42,.42])b.cylinder(x,.57,z,.035,.035,.86,'metal',6);
      b.beam([x,1,-.42],[x,1,.42],.035,'metal');b.collision(x,0,.09,.91);
    }
  });}
  function bicycle(x,z,yaw=0){b.area(x,z,yaw,()=>{
    for(const wx of[-.62,.62]){
      b.add(new THREE.TorusGeometry(.32,.036,5,16),'dark',wx,.47,0);
      b.add(new THREE.TorusGeometry(.278,.012,3,16),'metal',wx,.47,0);
      for(let i=0;i<6;i++){
        const a=i*Math.PI/3;b.beam([wx,.47,0],[wx+Math.cos(a)*.27,.47+Math.sin(a)*.27,0],.006,'metal',3);
      }
    }
    const rear=[-.62,.47,0],crank=[-.08,.43,0],seat=[-.25,1.04,0],neck=[.38,1.02,0],front=[.62,.47,0];
    for(const [a,c]of[[rear,crank],[rear,seat],[seat,crank],[seat,neck],[neck,crank],[neck,front]])b.beam(a,c,.023,'red');
    b.box(-.25,1.1,0,.26,.055,.17,'dark');
    b.beam(neck,[.33,1.2,0],.022,'metal');b.beam([.33,1.2,-.22],[.33,1.2,.22],.023,'metal');
    b.beam([-.08,.43,-.16],[.03,.43,.16],.018,'metal');
    b.collision(0,0,1.92,.48);
  });}
  function board(x,z,id,yaw=0){b.area(x,z,yaw,()=>{
    for(const x of[-.43,.43]){
      b.beam([x,.15,-.35],[x,1.48,0],.035,'wood');b.beam([x,.15,.35],[x,1.48,0],.035,'wood');
    }
    sign(0,.99,.16,.85,.85,id);b.collision(0,0,1,.75);
  });}
  function crate(x,z,y=.14,produce=false){
    b.box(x,y+.06,z,.8,.12,.6,'wood');
    for(const sx of[-1,1])b.box(x+sx*.38,y+.24,z,.055,.36,.6,'wood');
    for(const sz of[-1,1])for(const dy of[.16,.3])b.box(x,y+dy,z+sz*.28,.76,.09,.04,'wood');
    if(produce)for(let i=0;i<8;i++)b.add(new THREE.IcosahedronGeometry(.105,0),i%3?'yellow':'red',x-.26+(i%4)*.17,y+.24,z-.13+Math.floor(i/4)*.24);
  }

  // The existing bench and stop become a recognizable arrival point. The open
  // front faces Cedar Street; the pavement still has an uninterrupted through lane.
  b.area(-35,8,Math.PI,()=>{
    paving(0,-.35,4.5,2.1);
    for(const x of[-2,2])for(const z of[-1.12,.36]){
      b.box(x,1.5,z,.075,2.72,.075,'metal');b.collision(x,z,.12,.12);
    }
    b.box(0,2.87,-.38,4.65,.15,2.1,'green');b.box(0,2.94,.69,4.65,.15,.09,'cream');
    for(let i=0;i<9;i++)b.box(0,.52+i*.13,-1.12,4,.065,.055,'wood');
    b.collision(0,-1.12,4,.1);
    for(const x of[-.65,1.55])b.box(x,2.18,-1.12,.055,1.26,.055,'metal');
    sign(.45,2.2,-1.04,2.7,.6,'busRoute');
  });
  destination('Cedar Street bus shelter',-35,6.9);

  // Cedar Corner occupies the small unused gap beside the original houses.
  paving(2,25.5,15,19,'gravel');paving(2,12.3,2.2,7.4);paving(2,25.5,2.2,19);
  for(const x of[-5.6,9.6]){
    b.box(x,.5,25.5,.35,.76,19,'darkBrick');b.box(x,.92,25.5,.5,.08,19.3,'trim');b.collision(x,25.5,.5,19.3);
  }
  b.box(2,.49,35,15.5,.74,.36,'darkBrick');b.box(2,.9,35,15.8,.08,.5,'trim');b.collision(2,35,15.8,.5);
  planter(-2.7,18,4.3,1.1,true);planter(6.3,18,4.3,1.1,true);
  picnic(5.7,29.7,Math.PI/2);bench(-3.8,27,Math.PI/2);bench(2,33.3);
  bikeRack(6.6,21.3,Math.PI/2);bicycle(6.6,22.3);
  sign(2,1.55,34.7,3.2,1.15,'cedarSquare',Math.PI);
  // Posts anchor the sign to the wall, facing people arriving from the street.
  for(const x of[.8,3.2])b.box(x,1.25,34.79,.075,.8,.1,'metal');
  // Faded hopscotch squares give the paving a history without loose litter.
  for(let i=0;i<5;i++){
    const z=20.6+i*.69,w=i%2?1.12:.56;
    for(const sx of[-1,1])b.box(-1.6+sx*w/2,.146,z,.025,.006,.58,'paint',0,false);
    for(const sz of[-1,1])b.box(-1.6,.146,z+sz*.29,w,.006,.025,'paint',0,false);
    if(i%2)b.box(-1.6,.146,z,.025,.006,.58,'paint',0,false);
  }
  destination('Cedar Corner entrance',2,17);destination('Cedar Corner square',2,27);

  // Pine Patch uses the vacant lot opposite the two existing shops. Two wide
  // paths link the entrance, beds and shaded tables, around the existing pines.
  paving(48,-82,31,2.4);paving(48,-89.6,2.4,12.8);paving(48,-72.4,2.4,16.8);
  for(const [a,c]of[[-99,-84],[-80,-60]])fence(32.5,a,32.5,c,false);
  fence(32.5,-99,64,-99,false);fence(64,-99,64,-60,false);fence(32.5,-60,64,-60,false);
  for(const x of[37.5,56])for(const z of[-66,-73]){
    b.box(x,.37,z,5,.5,3,'wood');b.box(x,.632,z,4.72,.024,2.72,'dark',0,false);b.collision(x,z,5,3);
    for(let i=0;i<12;i++)shrub(x-1.8+(i%4)*1.2,z-.85+Math.floor(i/4)*.85,.3,.86);
    for(const sx of[-1,1])b.box(x+sx*2.39,.48,z,.1,.71,3.1,'wood');
  }
  // One trellised bed has climbing vines and red fruit, visibly different to herbs.
  for(const x of[54.1,57.9])b.box(x,1.3,-73,.07,2.1,.07,'wood');
  for(const y of[1.1,1.5,1.9])b.beam([54.1,y,-73],[57.9,y,-73],.016,'wood');
  for(let i=0;i<7;i++){
    const x=54.3+i*.55;shrub(x,-73,.22,1.3+(i%2)*.4);
    b.add(new THREE.IcosahedronGeometry(.07,0),'red',x,1.3,-72.78);
  }
  paving(55,-91,10,8,'gravel');paving(51.85,-88.8,5.3,1.2);
  pergola(55,-91,9,7);picnic(52.5,-91,Math.PI/2);picnic(57.5,-91,Math.PI/2);
  planter(36.5,-94,4.5,1.4,true);bench(36.5,-88,Math.PI/2);
  sign(33,1.78,-78,3,1,'garden',-Math.PI/2);
  for(const z of[-79.15,-76.85])b.box(33.08,1,z,.11,1.75,.11,'wood');
  b.collision(33,-78,.2,2.4);
  board(35.2,-84.8,'gardenNotice',Math.PI/2);bikeRack(30.6,-75,Math.PI/2);bicycle(31,-76.5);
  // A hand-painted sun and coastal bands on a real rendered wall, using the
  // shared palette. No image downloads, extra texture, transparency or lights.
  b.box(55,1.7,-96.15,10,3.12,.23,'cream');b.collision(55,-96.15,10,.23);
  b.box(55,3.31,-96.15,10.2,.13,.38,'trim');
  b.add(new THREE.CircleGeometry(.7,24),'yellow',57.7,2.22,-96.022);
  for(let band=0;band<3;band++){
    const shape=new THREE.Shape();shape.moveTo(-4.85,0);
    for(let i=0;i<=24;i++){const x=-4.85+i*9.7/24;shape.lineTo(x,.34+Math.sin(x*.95+band)*.17);}
    shape.lineTo(4.85,0);shape.closePath();
    b.add(new THREE.ShapeGeometry(shape),['fadedBlue','green','metal'][band],55,.32+band*.36,-96.016+band*.002);
  }
  sign(54,2.5,-95.97,5,.55,'muralCaption');
  destination('Pine Patch entrance',33,-82);destination('Pine Patch path',48,-82);destination('Pine Patch pergola',55,-91);

  // Shopfront identity stays against the facades, clear of the walking strip.
  for(const x of[-1.8,-.9,0]){
    b.box(x,.62,-8.48,.85,.9,.62,'wood');crate(x,-8.48,1.07,true);b.collision(x,-8.48,.85,.7);
  }
  sign(-.9,1.73,-8.85,2.4,.48,'marketProduce');
  board(48,-8.05,'dinerMenu');pot(32.3,-8.35,.29,true);
  sign(-21.5,1.58,-8.84,1.08,1.12,'laundryPoster');
  // Discreet shop-side displays, away from both open front doors and rear exits.
  b.area(12.65,-60.4,Math.PI/2,()=>{
    b.box(0,.66,0,2.4,1.02,.55,'wood');b.collision(0,0,2.4,.65);
    for(const x of[-.8,0,.8])pot(x,0,.2,true,1.17);
  });
  for(const z of[-88.9,-87.95]){crate(12.6,z);crate(12.6,z,.54,true);b.collision(12.6,z,.85,.65);}

  // Riverside's back lot: tyre stacks, workbench, parts shelving and a roofed
  // repair bay. The service lane and dumpster approaches remain open.
  paving(41,36.1,13,11,'gravel');
  for(const x of[35,47]){
    b.box(x,1.77,40.4,.14,3.26,.14,'metal');b.collision(x,40.4,.2,.2);
    b.beam([x,2.9,29.65],[x,3.34,40.4],.065,'metal');
  }
  b.add(new THREE.BoxGeometry(12.7,.14,11.5),'roof',41,3.25,35.1,-.04);
  b.box(40,3.35,40.78,7,.28,.08,'red');
  sign(44.3,2.45,29.72,5,.8,'garageYard');
  b.box(38,.96,31,4,.14,.9,'wood');
  for(const x of[36.3,39.7])for(const z of[30.68,31.32])b.box(x,.52,z,.085,.82,.085,'metal');
  b.collision(38,31,4,.95);
  b.box(38.7,1.19,31,.55,.32,.35,'red');b.box(37,1.13,31,.28,.2,.36,'metal');
  for(const [x,z,n]of[[44,31.2,4],[45.4,31.4,3],[44.4,33,2]]){
    for(let i=0;i<n;i++)b.add(new THREE.TorusGeometry(.38,.125,6,14),'dark',x,.265+i*.25,z,Math.PI/2);
    b.collision(x,z,1.02,1.02);
  }
  for(const z of[36,38]){
    for(const x of[35.2,36.8])b.box(x,1.11,z,.07,1.94,.07,'metal');
    for(const y of[.3,1,1.8])b.box(36,y,z,1.8,.08,.8,'wood');
    crate(36,z,1.04);b.collision(36,z,1.85,.85);
  }
  destination('Riverside repair yard',41,36);

  // Household differences: a washing line, stacked firewood, pots and hose.
  for(const x of[-67,-61]){
    b.box(x,1.58,37.6,.08,2.92,.08,'metal');b.collision(x,37.6,.12,.12);
    b.beam([x,2.99,36.8],[x,2.99,38.4],.027,'metal');
  }
  for(const z of[37,37.6,38.2])b.beam([-67,2.99,z],[-61,2.99,z],.009,'dark',3);
  for(let i=0;i<5;i++){
    b.box(-66.2+i*.94,2.41,37+(i%2)*.6,.66,1.1,.015,i%2?'fadedBlue':'cream',0,false);
    for(const dx of[-.22,.22])b.box(-66.2+i*.94+dx,2.99,37+(i%2)*.6,.045,.09,.04,'wood',0,false);
  }
  for(let i=0;i<9;i++)b.beam([-46.8+(i%3)*.24,.28+Math.floor(i/3)*.2,35.5],[-46.8+(i%3)*.24,.28+Math.floor(i/3)*.2,36.5],.11,'trunk',7);
  b.collision(-46.56,36,.8,1.1);
  for(const [x,z]of[[-67,19.5],[-40,19.4],[-19,19.5],[67.8,21.7],[6.9,74.9],[36.6,84]])pot(x,z,.26,true);
  // Starter garden only gains edge dressing; its central future build area stays open.
  planter(59.5,89.8,3.5,.8,true);pot(60.6,74.7,.35);
  b.add(new THREE.TorusGeometry(.31,.038,5,18),'green',50.17,1.08,85.8,0,Math.PI/2);
  b.beam([50.15,.78,85.8],[50.45,.78,85.8],.024,'metal');
  b.box(59.6,.43,74.4,1.2,.58,.8,'wood');b.collision(59.6,74.4,1.2,.8);

  // A shaded picnic spot between the existing seafront furniture clusters.
  // All posts and tables sit west of the 114.8–117.2 m promenade through route.
  pergola(111.65,34,4.5,7);picnic(111.65,34,Math.PI/2);
  b.box(111.65,3.49,34,4.95,.12,7.5,'fadedBlue');
  b.area(111.65,30.12,Math.PI,()=>sign(0,3.02,0,4.1,.48,'beachShelter'));
  bikeRack(111.65,43.8,Math.PI/2);
  b.area(118.9,49.5,-Math.PI/2,()=>{
    sign(0,1.5,0,1.35,1.05,'tideBoard');b.box(0,.77,-.08,.12,1.26,.14,'wood');b.collision(0,0,1.5,.3);
    b.add(new THREE.TorusGeometry(.38,.085,6,20),'red',0,1.55,-.16);
  });
  destination('Cedar Beach picnic shelter',113.1,34);
  return {destinations};
}

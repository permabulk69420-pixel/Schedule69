import * as THREE from 'three';
import { CityBuilder } from './geometry.js';
import { SignAtlas, random } from './materials.js';
import { extendPineAvenue } from './pine-avenue.js';

// Metres, Y up. Building fronts point toward local +Z; each lot can be moved or rotated.
export function buildWorld(scene, m) {
  const b=new CityBuilder(scene,m),atlas=new SignAtlas(),rng=random(69),trees=[];let buildingCount=1; // Gas station below.
  const signs={
    market:atlas.add('CEDAR MARKET','','#334c40','#e9dcc0','wide'),
    marketGlass:atlas.add('YOUR LOCAL','OPEN DAILY',null,null,'window'),
    laundry:atlas.add('SPIN CYCLE','','#678788','#f2e8cc','wide'),
    laundryGlass:atlas.add('WASH  •  DRY','7 AM — 10 PM',null,null,'window'),
    diner:atlas.add('SUNSET DINER','','#9b533d','#f6ddac','wide'),
    dinerGlass:atlas.add('GOOD COFFEE','ALL DAY BREAKFAST',null,null,'window'),
    gas:atlas.add('SUNRISE','GAS & GO','#e6d7b6','#b9422c'),
    gasStore:atlas.add('SUNRISE GAS & GO','','#e6d7b6','#b9422c','wide'),
    gasPrice:atlas.add('REGULAR','3.49  /  GALLON','#293c37','#e3c988'),
    cedar:atlas.add('CEDAR ST','','#2e5649','#eee9d4'),
    pine:atlas.add('PINE AVE','','#2e5649','#eee9d4'),
    motel:atlas.add('CEDAR COURT','','#463f36','#e4d6b5','wide'),
    garage:atlas.add('RIVERSIDE AUTO','','#aaa488','#393e35','wide'),
    notice:atlas.add('NEIGHBOURHOOD','NOTICE BOARD','#8e8269','#f1e4c5'),
    cola:atlas.add('COLD','SODA  /  $1.50','#a83d2f','#efdec0'),
    bus:atlas.add('BUS STOP','CEDAR STREET  /  04','#4d7471','#e9e1c6'),
    speed:atlas.add('SPEED LIMIT','25','#dfd9bf','#3e4941'),
    open:atlas.add('OPEN','','#213c36','#ebba78'),
    noEntry:atlas.add('DELIVERIES','KEEP CLEAR','#cabfa3','#4a5044'),
  };
  const sign=(x,y,z,w,h,id,ry=0)=>{b.box(x,y,z,w+.12,h+.12,.12,'dark',ry);const pw=signs[id].aspect?Math.min(w,h*signs[id].aspect):w;b.plane(x+Math.sin(ry)*.071,y,z+Math.cos(ry)*.071,pw,h,atlas.material,ry,signs[id]);};
  function window(x,y,z,w=1.3,h=1.8,shutters=false){
    b.box(x,y,z,w+.24,h+.24,.19,'trim');b.box(x,y,z+.105,w,h,.04,rng()>.78?'curtain':'glass',0,false);
    b.box(x,y,z+.14,.055,h,.035,'trim',0,false);b.box(x,y+.12,z+.14,w,.05,.035,'trim',0,false);
    b.box(x,y-h/2-.12,z+.06,w+.4,.13,.36,'trim');b.box(x,y+h/2+.12,z+.02,w+.34,.09,.24,'trim');
    if(shutters)for(const sx of[-1,1]){b.box(x+sx*(w/2+.31),y,z-.02,.38,h+.13,.11,'green');for(let k=0;k<7;k++)b.box(x+sx*(w/2+.31),y-h/2+.16+k*h/7,z+.044,.32,.04,.03,'dark',0,false);}
  }
  function door(x,z,style='dark'){
    b.box(x,1.32,z,1.25,2.5,.18,'trim');b.box(x,1.31,z+.1,1.08,2.34,.06,style);b.box(x,1.77,z+.14,.77,1.01,.04,'glass',0,false);b.box(x+.38,1.18,z+.19,.045,.22,.06,'yellow');
    b.box(x,.22,z+.32,1.6,.16,.7,'concrete');
  }
  function ac(x,y,z){b.box(x,y,z,1,.58,.58,'metal');b.box(x,y,z+.3,.83,.42,.018,'dark',0,false);for(let k=0;k<5;k++)b.box(x,y-.15+k*.075,z+.32,.79,.02,.012,'metal',0,false);}
  function rooftop(w,d,h){b.box(0,h+.19,0,w+.5,.34,d+.5,'trim');b.box(0,h+.4,0,w-.4,.16,d-.4,'roof');for(const side of[-1,1]){b.box(0,h+.61,side*d/2,w+.35,.63,.22,'plaster');b.box(side*w/2,h+.61,0,.22,.63,d,'plaster');}b.box(-w*.2,h+1.04,-d*.18,2.3,1.15,1.8,'metal');for(let i=0;i<2;i++)b.cylinder(w*.26+i,h+1.1,-d*.3,.17,.22,1.6,'rust');}
  function building({x,z,w,d,h,mat='brick',yaw=0,shop=null,glass=null,awning=false}){
    buildingCount++;
    b.area(x,z,yaw,()=>{
      b.box(0,h/2+.14,0,w,h,d,mat);b.collision(0,0,w,d);
      b.box(0,.5,0,w+.1,.72,d+.1,'darkBrick');rooftop(w,d,h+.14);
      b.box(0,3.6,d/2+.13,w+.3,.22,.33,'trim');
      const floors=Math.floor((h-3)/3);
      for(let row=0;row<floors;row++)for(let col=0;col<Math.floor(w/3);col++)window(-w/2+1.7+col*(w-3.4)/Math.max(1,Math.floor(w/3)-1),5.35+row*3,d/2+.05,1.25,1.75);
      for(const side of[-1,1])b.area(side*w/2,0,side*Math.PI/2,()=>{for(let row=0;row<Math.floor(h/3)-1;row++)for(let col=0;col<Math.floor(d/3.7);col++)window(-d/2+2+col*3.5,3.8+row*3,0,1.15,1.6);});
      b.area(0,-d/2,Math.PI,()=>{door(w*.22,0);for(let row=0;row<floors;row++)for(let col=0;col<Math.floor(w/4);col++)window(-w/2+2.1+col*4,5.35+row*3,0,1.1,1.6);ac(-w*.2,2.5,.4);});
      for(const sx of[-1,1]){b.box(sx*(w/2-.18),h/2,d/2+.05,.36,h,.28,'trim');b.cylinder(sx*(w/2-.45),h/2,-d/2-.15,.055,.055,h,'rust',6);}
      if(shop){
        sign(0,3.12,d/2+.21,w-1.1,.72,shop);
        const sections=Math.floor((w-2.8)/3);let cursor=-w/2+1.8;
        for(let i=0;i<sections;i++){b.box(cursor,1.64,d/2+.08,2.48,2.19,.13,'dark');b.plane(cursor,1.64,d/2+.16,2.32,2,atlas.material,0,signs[glass]);b.box(cursor,1.64,d/2+.19,.045,2,.045,'metal',0,false);cursor+=2.9;}
        door(w/2-1.35,d/2+.08);sign(w/2-1.35,1.89,d/2+.29,.65,.28,'open');
        if(awning){
          const count=Math.round((w-.2)/.55);for(let i=0;i<count;i++){const xpos=-w/2+.28+i*(w-.4)/count;const g=new THREE.BoxGeometry((w-.4)/count+.01,.09,1.5);b.add(g,i%2===0?'cream':'red',xpos,2.82,d/2+.73,.22);b.box(xpos,2.59,d/2+1.46,(w-.4)/count+.01,.3,.05,i%2===0?'cream':'red');}
          for(const sx of[-1,1])b.beam([sx*(w/2-.2),2.4,d/2],[sx*(w/2-.2),2.68,d/2+1.5],.035,'metal');
        }
      }else{door(-w*.26,d/2+.05);for(let col=0;col<Math.floor(w/3.5)-1;col++)window(-w*.05+col*3.3,1.8,d/2+.05,1.5,1.9);}
      for(let i=0;i<Math.min(floors,2);i++)ac(w*.28,4.4+i*3,d/2+.46);
    });
  }
  function pitchedRoof(w,d,h,rise,mat='roof'){
    const run=w/2,overhang=.45,half=run+overhang,drop=rise*overhang/run,slope=Math.hypot(half,rise+drop),a=Math.atan2(rise,run);
    for(const side of[-1,1]){const g=new THREE.BoxGeometry(slope,.18,d+.85);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*slope/4,uv.getY(i)*d/4);b.add(g,mat,side*half/2,h+(rise-drop)/2,0,0,0,-side*a);b.box(side*half,h-drop-.06,0,.15,.17,d+.95,'trim');}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-w/2,h,d/2,w/2,h,d/2,0,h+rise,d/2,-w/2,h,-d/2,w/2,h,-d/2,0,h+rise,-d/2],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,.5,1,0,0,1,0,.5,1],2));g.setIndex([0,1,2,5,4,3]);g.computeVertexNormals();b.add(g,'siding');
  }
  function fence(x1,z1,x2,z2,picket=true){
    const len=Math.hypot(x2-x1,z2-z1),count=Math.max(1,Math.round(len/(picket?.32:2))),yaw=Math.atan2(z2-z1,x2-x1);
    for(let i=0;i<=count;i++){const t=i/count,x=x1+(x2-x1)*t,z=z1+(z2-z1)*t;b.box(x,.72,z,picket?.19:.13,picket?1.18:1.42,.12,picket?'wood':'metal',-yaw);}
    for(const y of[.4,.99])b.beam([x1,y,z1],[x2,y,z2],picket?.045:.034,picket?'wood':'metal');
    b.collision((x1+x2)/2,(z1+z2)/2,Math.abs(x2-x1)+.11,Math.abs(z2-z1)+.11);
  }
  function house(x,z,yaw,mat,w=12,d=11,two=false){
    buildingCount++;
    const h=two?6.5:3.55;
    b.area(x,z,yaw,()=>{
      b.box(0,h/2+.22,0,w,h,d,mat);b.box(0,.33,0,w+.1,.5,d+.1,'darkBrick');b.collision(0,0,w,d);pitchedRoof(w,d,h+.25,two?2.7:2.4);
      for(const sx of[-1,1]){b.box(sx*(w/2-.07),h/2+.2,d/2+.07,.19,h,.19,'trim');window(sx*w*.31,1.98,d/2+.07,1.5,1.8,true);if(two)window(sx*w*.31,5.1,d/2+.07,1.4,1.75,true);}
      door(0,d/2+.08,'green');
      b.box(0,.37,d/2+1.15,4.8,.35,2.3,'wood');
      b.box(0,2.99,d/2+1.25,5.3,.18,2.9,'roof');for(const sx of[-1,1]){b.box(sx*2.14,1.65,d/2+2.2,.12,2.7,.12,'trim');b.beam([sx*2.14,1.2,d/2+.2],[sx*2.14,1.2,d/2+2.2],.055,'trim');for(let i=0;i<5;i++)b.box(sx*2.14,.86,d/2+.2+i*.4,.06,.6,.06,'trim');}
      for(let i=0;i<3;i++)b.box(0,.15+i*.07,d/2+3.05-i*.27,1.9,.2+i*.07,.45,'concrete');
      b.box(0,.155,d/2+5.4,1.9,.05,4.9,'concrete');
      for(const side of[-1,1])b.area(side*w/2,0,side*Math.PI/2,()=>{window(-2,2,0,1.3,1.7);window(2,2,0,1.3,1.7);});
      b.area(0,-d/2,Math.PI,()=>{door(-2,0);window(2,2,0,1.4,1.8);});
      b.box(w*.27,h+2.1,-d*.22,.8,2.8,.85,'redBrick');b.box(w*.27,h+3.5,-d*.22,1,.16,1.05,'trim');
      fence(-w/2-2,-d/2-2,-w/2-2,d/2+7.4);fence(w/2+2,-d/2-2,w/2+2,d/2+7.4);fence(-w/2-2,d/2+7.4,-1.4,d/2+7.4);fence(1.4,d/2+7.4,w/2+2,d/2+7.4);
      b.cylinder(2.4,.65,d/2+6.9,.05,.06,1.25,'metal');b.box(2.4,1.3,d/2+6.9,.45,.32,.55,'dark');
      b.box(-w/2-.8,.56,-2,.59,.94,.65,'bin');b.box(-w/2-.8,1.04,-2,.65,.08,.71,'dark');
    });
  }
  function dumpster(x,z,yaw=0){b.area(x,z,yaw,()=>{b.box(0,.78,0,2.1,1.3,1.17,'bin');b.box(0,1.47,0,2.19,.12,1.24,'dark');for(const sx of[-1,1]){b.box(sx*.98,.79,.61,.06,1.18,.06,'metal');b.cylinder(sx*.77,.23,0,.13,.13,.14,'dark');}for(let i=0;i<7;i++)b.box(-.87+i*.29,.8,.6,.03,1.1,.06,'metal');b.collision(0,0,2.2,1.3);});}
  function bench(x,z,yaw=0){b.area(x,z,yaw,()=>{for(let j=0;j<4;j++){b.box(0,.64,-.24+j*.15,1.8,.085,.11,'wood');b.box(0,.96+j*.15,-.33,1.8,.105,.08,'wood');}for(const sx of[-1,1]){b.box(sx*.65,.35,0,.085,.6,.44,'metal');b.box(sx*.65,1.1,-.38,.065,1.2,.08,'metal');}b.collision(0,0,1.85,.66);});}
  function lamp(x,z,yaw=0){b.area(x,z,yaw,()=>{b.cylinder(0,3.7,0,.062,.13,7.2,'metal');b.cylinder(0,.37,0,.19,.26,.5,'dark');b.beam([0,7.25,0],[0,7.48,1.9],.075,'metal');b.box(0,7.45,2.02,.45,.16,.8,'metal');b.box(0,7.36,2.02,.34,.025,.65,'glow',0,false);b.collision(0,0,.32,.32);});}
  function utility(x,z){b.cylinder(x,5.5,z,.115,.18,10.8,'trunk');b.box(x,9.9,z,2.1,.15,.17,'wood');for(const sx of[-1,0,1]){b.cylinder(x+sx*.79,10.07,z,.07,.09,.2,'trim');}b.collision(x,z,.35,.35);}
  function wire(x1,z1,x2,z2){for(const ox of[-.8,0,.8]){const steps=12;for(let i=0;i<steps;i++){const t=i/steps,u=(i+1)/steps;b.beam([x1+(x2-x1)*t+ox,10.17-Math.sin(t*Math.PI)*1.05,z1+(z2-z1)*t],[x1+(x2-x1)*u+ox,10.17-Math.sin(u*Math.PI)*1.05,z1+(z2-z1)*u],.014,'dark',3);}}}
  function hydrant(x,z){b.cylinder(x,.56,z,.16,.2,.8,'red');b.cylinder(x,1,z,.08,.2,.15,'red');b.beam([x-.32,.71,z],[x+.32,.71,z],.1,'red');b.collision(x,z,.46,.35);}
  function pine(x,z,h=12,s=1){trees.push({x,z,h,s,rot:rng()*Math.PI*2});b.collision(x,z,.42,.42);}

  // Continuous streets, four sidewalk corners, and a service lane behind each block.
  b.box(0,-.35,0,1200,.55,1200,'soil',0,false);
  b.box(0,-.04,0,178,.08,10,'asphalt',0,false);
  b.box(22,-.035,3.5,9.5,.08,217,'asphalt',0,false);
  b.box(0,-.025,-47,176,.06,6,'asphalt',0,false);b.box(0,-.025,49,176,.06,5,'asphalt',0,false);
  for(const z of[-6.8,6.8]){b.box(-34,.065,z,102,.17,3.6,'concrete',0,false);b.box(57,.065,z,60,.17,3.6,'concrete',0,false);}
  for(const x of[15.4,28.6]){b.box(x,.065,-29,3.5,.17,40.8,'concrete',0,false);b.box(x,.065,28,3.5,.17,38.8,'concrete',0,false);}
  for(const z of[-5.04,5.04])for(const x of[-34,57])b.box(x,.08,z,x<0?102:60,.24,.22,'trim',0,false);
  for(const x of[17.25,26.75])for(const z of[-29,28])b.box(x,.08,z,.22,.24,Math.abs(z)*2-17,'trim',0,false);
  for(let x=-82;x<84;x+=5.2)if(x<13||x>31)for(const z of[-.13,.13])b.box(x,.012,z,2.5,.008,.085,'yellow',0,false);
  for(let z=-59;z<59;z+=5.2)if(Math.abs(z)>11&&Math.abs(z+47)>5&&Math.abs(z-49)>5)b.box(22,.016,z,.1,.008,2.5,'paint',0,false);
  for(const x of[12,32])for(let z=-3.8;z<4;z+=1.1)b.box(x,.019,z,2.6,.011,.53,'paint',0,false);
  for(const z of[-10,10])for(let x=18.4;x<26;x+=1.1)b.box(x,.019,z,.53,.011,2.6,'paint',0,false);
  for(const x of[-71,-28,42,71]){b.cylinder(x,.019,2.3,.45,.45,.026,'metal',16);for(let i=0;i<5;i++)b.box(x-.26+i*.13,.036,2.3,.022,.01,.6,'dark',0,false);}
  for(const x of[-58,-9,47,75])for(const z of[-4.8,4.8]){b.box(x,.023,z,1.02,.03,.29,'metal',0,false);for(let i=0;i<9;i++)b.box(x-.43+i*.105,.043,z,.045,.016,.25,'dark',0,false);}
  // A proper forecourt, visible from both approaches.
  b.area(-55,-24,0,()=>{
    b.box(0,.05,0,38,.12,37,'concrete',0,false);
    b.box(0,1.98,-12,28,3.7,9,'cream');b.collision(0,-12,28,9);b.box(0,3.99,-12,29,.28,10,'trim');b.box(0,4.13,-7.23,29,.34,.28,'red');b.box(0,3.85,-7.21,29,.12,.3,'yellow');
    for(const x of[-9,-5,2,6,10]){b.box(x,1.83,-7.43,3,2.15,.12,'dark');b.plane(x,1.83,-7.35,2.82,1.99,atlas.material,0,signs.marketGlass);}door(-1.5,-7.39);sign(0,3.35,-7.28,7,.6,'gasStore');
    b.box(0,5.12,3,27,.38,13,'white');b.box(0,5.21,9.57,27,.34,.12,'red');b.box(0,5.03,9.64,27,.09,.14,'yellow');b.box(0,5.2,-3.55,27,.34,.12,'red');
    for(const x of[-10,10])for(const z of[-1.1,7.1]){b.box(x,2.65,z,.3,5,.3,'white');b.collision(x,z,.4,.4);}
    for(const x of[-6,6]){
      b.box(x,.17,3,2.3,.25,5.3,'concrete');
      for(const z of[1.6,4.4]){b.box(x,.63,z,.73,.81,.61,'red');b.box(x,1.44,z,.91,.81,.67,'white');b.box(x,1.56,z+.35,.7,.38,.025,'dark');b.box(x,1.6,z+.368,.47,.15,.008,'curtain',0,false);b.box(x,1.16,z+.37,.61,.08,.03,'yellow');b.box(x,1.91,z,1.08,.15,.76,'red');b.collision(x,z,1.2,.9);
        for(let j=0;j<6;j++)b.beam([x+.51+Math.sin(j/6*Math.PI)*.24,1.72-j*.2,z],[x+.51+Math.sin((j+1)/6*Math.PI)*.24,1.72-(j+1)*.2,z],.035,'dark');
      }
      for(const z of[-.1,6.2]){b.cylinder(x,.68,z,.09,.09,1.1,'yellow');b.collision(x,z,.2,.2);}
    }
    b.box(12.6,1.1,-5.6,1.2,2,.85,'red');b.plane(12.6,1.15,-5.16,1.08,1.85,atlas.material,0,signs.cola);b.collision(12.6,-5.6,1.25,.9);
    for(const x of[-13,-8,-3,2,7]){b.box(x,.121,-4.8,.07,.009,3,'paint',0,false);}
    b.cylinder(17,3.5,11.79,.12,.19,7,'metal');sign(17,6.7,12,3.5,1.8,'gas');sign(17,4.85,12,3.1,1.35,'gasPrice');b.collision(17,12,.5,.5);
    b.box(-11,4.6,-12,2.6,1.1,1.6,'metal');
  });

  building({x:-18,z:-18,w:12,d:18,h:9.3,mat:'redBrick',shop:'laundry',glass:'laundryGlass'});
  building({x:2,z:-17,w:20,d:16,h:9.1,mat:'green',shop:'market',glass:'marketGlass',awning:true});
  building({x:42,z:-18,w:22,d:18,h:12.6,mat:'brick',shop:'diner',glass:'dinerGlass',awning:true});
  building({x:67,z:-21,w:19,d:24,h:15.4,mat:'darkBrick'});
  b.area(67,-21,0,()=>sign(0,3.12,12.18,8,.6,'motel'));
  building({x:46,z:20,w:26,d:19,h:6.6,mat:'cream',yaw:Math.PI,shop:'garage',glass:'marketGlass'});
  b.area(46,20,Math.PI,()=>{for(const x of[-5,2]){b.box(x,1.5,9.7,5.8,2.7,.08,'metal');for(let i=0;i<10;i++)b.box(x,.34+i*.245,9.76,5.72,.027,.02,'dark',0,false);}});
  house(-65,27,Math.PI,'siding',11,11,false);house(-42,27,Math.PI,'fadedBlue',13,11,true);house(-17,27,Math.PI,'ochre',12,11,false);
  house(70,31,Math.PI,'redBrick',11,13,true);
  // A modest rear courtyard and service details.
  b.box(-3,.10,-36.4,35,.09,12,'gravel',0,false);b.box(50,.09,-39,48,.07,9,'gravel',0,false);
  dumpster(-22,-31,Math.PI);dumpster(-9,-32,Math.PI);dumpster(6,-29,Math.PI);dumpster(49,-31,Math.PI);dumpster(51,32);dumpster(58,32);
  b.box(7,.6,-35,1.6,1.05,1.1,'wood');b.box(6.8,1.28,-35,.8,.3,.65,'wood');
  for(const z of[-32,-36]){b.box(-17,.35,z,1.4,.5,1.1,'wood');for(let i=0;i<4;i++)b.box(-17,.65+i*.12,z,1.35,.06,.99,'wood');}
  fence(-29,-41,12,-41,false);fence(31,-43,79,-43,false);fence(-80,43,10,43,false);fence(33,43,59,43,false);
  // External fire escape on the apartment's visible side.
  b.area(55,-18,Math.PI/2,()=>{
    for(const y of[4.7,7.7,10.7]){b.box(0,y,0,3,.1,1.2,'metal');for(const x of[-1.4,1.4]){b.box(x,y+.58,.5,.06,1.15,.06,'dark');}b.beam([-1.4,y+1.1,.5],[1.4,y+1.1,.5],.04,'dark');for(let i=0;i<9;i++)b.box(-1.25+i*.31,y+.55,.5,.025,1.05,.025,'metal');}
    for(const x of[-.35,.35])b.beam([x,1.8,.7],[x,11.6,.7],.037,'dark');for(let y=2;y<11.6;y+=.29)b.beam([-.35,y,.7],[.35,y,.7],.023,'metal');
  });
  for(const x of[-72,-30,9,36,74])lamp(x,-7.6,0);
  for(const x of[-55,-4,52])lamp(x,7.6,Math.PI);
  lamp(28.5,-38,-Math.PI/2);lamp(15.5,39,Math.PI/2);
  for(const x of[-79,-41,1,41,79])utility(x,8.35);
  for(const pair of[[-79,-41],[-41,1],[1,41],[41,79]])wire(pair[0],8.35,pair[1],8.35);
  utility(28.4,-38);wire(41,8.35,28.4,-38);
  b.area(29,7.8,0,()=>{b.cylinder(0,1.85,0,.06,.06,3.5,'metal');sign(0,3.35,0,2.3,.43,'cedar');sign(0,2.89,0,2.2,.43,'pine',Math.PI/2);b.collision(0,0,.16,.16);});
  sign(-27,1.85,-7.3,1.6,1.15,'notice');b.box(-27,1,-7.38,.12,2,.15,'wood');
  bench(-8,-7.3);bench(39,-7.5);bench(-35,8,Math.PI);
  b.cylinder(-33,1.9,7.7,.045,.045,3.5,'metal');sign(-33,3.05,7.7,.7,.95,'bus',Math.PI);
  sign(-77,2.7,-6.8,.7,1,'speed');b.cylinder(-77,1.4,-6.88,.035,.035,2.6,'metal');
  hydrant(13,7.5);hydrant(31,-7.6);hydrant(-60,-7.1);
  for(const [x,z]of[[-10,-7.6],[38,-7.6],[-34,8],[59,-7.6]]){b.cylinder(x,.68,z,.31,.29,1.06,'metal',10);b.cylinder(x,1.24,z,.34,.34,.09,'dark',10);b.collision(x,z,.65,.65);}
  // Pines give the district its scale and break up the boxy roofline.
  for(const [x,z,h]of[[-80,-28,15],[-79,-9,12],[-32,-20,14],[-29,-37,12],[-9,-39,14],[9,-37,12],[32,-35,15],[57,-37,13],[81,-34,16],[81,-10,13],[-79,17,13],[-54,17,11],[-29,17,13],[-4,16,15],[10,28,13],[-77,39,16],[-52,40,14],[-29,41,12],[-5,40,15],[59,38,11],[82,39,14],[82,14,13],[33,38,12]])pine(x,z,h,.9+rng()*.25);
  for(let i=0;i<34;i++){const x=-100+i*6+rng()*4;const northZ=-61-rng()*8,northH=12+rng()*10;const southZ=65+rng()*10,southH=11+rng()*8;if(x< -14||x>68){pine(x,northZ,northH,.95);if(i%2===0)pine(x,southZ,southH,1);}}
  const extension=extendPineAvenue(b,{m,atlas,sign,signs,house,rooftop,pitchedRoof,fence,lamp,utility,wire,pine,dumpster});
  buildingCount+=extension.additionalShops+1; // Shops plus the new enterable starter house.
  // Unwalkable perimeter is framed by real fences and vegetation.
  fence(-84,-56,-84,58,false);fence(83,-56,83,58,false);
  for(let i=0;i<20;i++){const x=-115+i*12,h=8+rng()*20,z=-146-rng()*35;b.box(x,h/2,z,8+rng()*11,h,9+rng()*14,i%3===0?'darkBrick':'plaster');b.box(x,h+.2,z,10,.5,12,'trim');}
  const triangles=b.finish();
  const treeStats=buildPines(scene,m,trees);
  addSky(scene);
  return {colliders:b.colliders,bounds:b.bounds,triangles:triangles+treeStats,treeCount:trees.length,buildingCount,places:extension.places,starterHouse:extension.home};
}

function buildPines(scene,m,trees){
  const rng=random(42069),vertices=[],colors=[],normals=[],uv=[],indices=[];
  const shade=[new THREE.Color('#405333'),new THREE.Color('#52643a'),new THREE.Color('#667446'),new THREE.Color('#354b32')];
  // Layered, irregular boughs instead of solid cones. One shared instanced geometry.
  for(let layer=0;layer<10;layer++){
    const y=.18+layer*.073,r=(1-y)*.225,segments=11;
    for(let branch=0;branch<segments;branch++){
      const a=branch/segments*Math.PI*2+layer*1.71,rr=r*(.78+rng()*.42),spread=.48,base=vertices.length/3;
      const pts=[[Math.cos(a)*rr,y-.025-rng()*.02,Math.sin(a)*rr],[Math.cos(a-spread)*rr*.45,y+.04,Math.sin(a-spread)*rr*.45],[0,y+.16,0],[Math.cos(a+spread)*rr*.45,y+.04,Math.sin(a+spread)*rr*.45],[Math.cos(a)*rr*.36,y-.037,Math.sin(a)*rr*.36]];
      for(let i=0;i<pts.length;i++){vertices.push(...pts[i]);const c=shade[(layer+branch+i)%shade.length];colors.push(c.r,c.g,c.b);uv.push(0,0);}indices.push(base,base+1,base+2,base,base+2,base+3,base,base+3,base+4,base,base+4,base+1);
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  const mat=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});mat.name='pine-boughs';
  // Four groups keep distant perimeter trees independently cullable.
  let total=0;for(let quadrant=0;quadrant<4;quadrant++){
    const group=trees.filter(t=>(t.x>0?1:0)+(t.z>0?2:0)===quadrant);if(!group.length)continue;
    const crown=new THREE.InstancedMesh(g,mat,group.length),trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.006,.015,.86,7),m.trunk,group.length),obj=new THREE.Object3D();
    group.forEach((t,i)=>{obj.position.set(t.x,0,t.z);obj.rotation.set(0,t.rot,0);obj.scale.set(t.h*t.s,t.h,t.h*t.s);obj.updateMatrix();crown.setMatrixAt(i,obj.matrix);obj.position.y=t.h*.43;obj.updateMatrix();trunk.setMatrixAt(i,obj.matrix);});
    for(const mesh of[crown,trunk]){mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();scene.add(mesh);}total+=group.length*(indices.length/3+28);
  }return total;
}

function addSky(scene){
  const sunDirection=new THREE.Vector3(-.68,.27,.42).normalize();
  const mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{sunDirection:{value:sunDirection}},vertexShader:`varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
    varying vec3 vDirection; uniform vec3 sunDirection;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    void main(){vec3 d=normalize(vDirection);float y=max(0.,d.y);vec3 horizon=vec3(.82,.38,.17),zenith=vec3(.13,.23,.32);vec3 c=mix(horizon,zenith,pow(y,.62));float sd=max(0.,dot(d,sunDirection));c+=vec3(.33,.19,.07)*pow(sd,12.);c=mix(c,vec3(1.,.87,.58),smoothstep(.9994,.99965,sd));vec2 p=d.xz/(y+.15)*vec2(2.5,13.);float n=noise(p)+.45*noise(p*2.3)+.2*noise(p*5.);float cloud=smoothstep(.98,1.4,n)*smoothstep(.04,.19,y)*(1.-smoothstep(.65,.95,y));c=mix(c,vec3(.79,.71,.60),cloud*.38);gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});
  const sky=new THREE.Mesh(new THREE.SphereGeometry(500,32,16),mat);sky.name='evening-sky';sky.renderOrder=-10;scene.add(sky);
}

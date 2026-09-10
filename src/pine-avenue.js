import * as THREE from 'three';

// New lots along Pine Avenue. All interiors are unfurnished architectural shells.
// Fronts face local +Z; the same shell can be placed on either side of a street.
export function extendPineAvenue(b, api) {
  const {m,atlas,sign,signs,house,rooftop,pitchedRoof,fence,lamp,utility,wire,pine,dumpster}=api;
  const floorY=.14,wallThickness=.24,places=[];
  signs.supply=atlas.add('PINE SUPPLY','','#4b6150','#eee4c5','wide');
  signs.supplyDetail=atlas.add('HARDWARE & GARDEN','PINE AVENUE','#d9d1b9','#384c3e');
  signs.corner=atlas.add('PINE GENERAL','','#944e39','#f1dfb9','wide');
  signs.cornerDetail=atlas.add('GENERAL STORE','DAILY ESSENTIALS','#d9d1b9','#6a3c2c');
  signs.homeNumber=atlas.add('18','','#e6dfc9','#33483b');
  signs.neighbourNumber=atlas.add('15','','#e6dfc9','#33483b');
  signs.roadEnd=atlas.add('ROAD ENDS','','#e0bc68','#394438','wide');

  const wallBlock=(x,bottom,z,w,h,d,mat='interior',solid=true)=>{
    if(w<.001||h<.001||d<.001)return;
    b.box(x,bottom+h/2,z,w,h,d,mat);
    if(solid)b.collision(x,z,w,d);
  };
  function frame(at,width,bottom,height,window=false){
    const edge=width/2+.035,face=wallThickness/2+.035;
    for(const side of[-1,1]){
      b.box(at+side*edge,bottom+height/2,face,.075,height+.14,.12,'trim');
      b.box(at+side*edge,bottom+height/2,-face,.075,height+.14,.08,'trim');
    }
    for(const z of[-face,face])b.box(at,bottom+height+.04,z,width+.14,.085,.1,'trim');
    if(window){
      b.box(at,bottom-.035,face,width+.3,.13,.38,'trim');
      b.box(at,bottom-.03,-face,width+.18,.08,.17,'trim');
      b.plane(at,bottom+height/2,.025,width-.05,height-.06,m.clearGlass);
      b.box(at,bottom+height/2,.05,.045,height,.07,'trim',0,false);
      b.box(at,bottom+height*.42,.05,width,.045,.07,'trim',0,false);
    }else{
      b.box(at,floorY-.015,0,width,.03,.48,'trim',0,false);
    }
  }
  function openLeaf(at,width,height,material='green',glazed=false){
    // The leaf is propped 90 degrees outward. Its collider follows the actual leaf.
    b.area(at-width/2+.035,wallThickness/2+.09,-Math.PI/2,()=>{
      const w=width-.09;
      if(glazed){
        for(const x of[.045,w-.045])b.box(x,floorY+height/2,0,.09,height,.07,'dark');
        for(const y of[floorY+.07,floorY+height-.055])b.box(w/2,y,0,w,.11,.07,'dark');
        b.box(w/2,floorY+.53,0,w,.95,.065,material);
        b.plane(w/2,floorY+(height+.99)/2,0,w-.18,height-1.12,m.clearGlass);
      }else{
        b.box(w/2,floorY+height/2,0,w,height,.065,material);
        for(const y of[.7,1.59])b.box(w/2,y, .036,w-.2,.61,.025,'siding');
      }
      b.box(w-.16,1.2,.068,.045,.19,.07,'metal');
      b.collision(w/2,0,w,.075);
    });
  }
  function wall(length,height,material,holes=[],lining='interior'){
    let cursor=-length/2;
    const segment=(left,right,bottom,top,solid=true)=>{
      const w=right-left;if(w<=0||top<=bottom)return;
      wallBlock((left+right)/2,bottom,0,w,top-bottom,wallThickness,material,solid);
      b.box((left+right)/2,(top+bottom)/2,-wallThickness/2-.006,w,top-bottom,.012,lining);
      if(bottom<=floorY+.01)b.box((left+right)/2,floorY+.045,-wallThickness/2-.03,w,.09,.045,'trim');
    };
    for(const hole of[...holes].sort((a,c)=>a.at-c.at)){
      const left=hole.at-hole.width/2,right=hole.at+hole.width/2;
      segment(cursor,left,floorY,floorY+height);
      segment(left,right,floorY,floorY+hole.bottom);
      // Headers over doors must not become floor-to-ceiling collision boxes.
      segment(left,right,floorY+hole.bottom+hole.height,floorY+height,false);
      frame(hole.at,hole.width,floorY+hole.bottom,hole.height,hole.bottom>0);
      if(hole.bottom===0&&hole.leaf)openLeaf(hole.at,hole.width,hole.height,hole.leaf,hole.glazed);
      cursor=right;
    }
    segment(cursor,length/2,floorY,floorY+height);
  }
  const doorway=(at=0,width=1.45,leaf=null)=>({at,width,bottom:0,height:2.35,leaf});
  const windowOpening=(at,width=1.8,bottom=.85,height=1.55)=>({at,width,bottom,height});
  function partition(x,z,length,yaw,openings,height){
    b.area(x,z,yaw,()=>wall(length,height,'interior',openings));
  }
  function marker(name,x,z,yaw,w,d,entranceDepth){
    const object=new THREE.Object3D();object.name=name;object.position.set(x,floorY,z);object.rotation.y=yaw;
    object.userData={kind:'unfurnished-interior',width:w,depth:d};b.scene.add(object);
    const transform=new THREE.Matrix4().compose(new THREE.Vector3(x,floorY,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),new THREE.Vector3(1,1,1));
    const point=(lx,lz)=>new THREE.Vector3(lx,0,lz).applyMatrix4(transform).toArray();
    const info={name,center:point(0,0),entrance:point(0,d/2+.6),approach:point(0,entranceDepth),inside:point(0,d/2-1.5),matrix:transform.toArray()};places.push(info);return info;
  }
  function shop(x,z,id,detail,material){
    const w=14,d=12,h=3.75,yaw=Math.PI/2;
    b.area(x,z,yaw,()=>{
      b.box(0,floorY-.09,0,w+.2,.18,d+.2,'shopFloor',0,false);
      b.area(0,d/2,0,()=>wall(w,h,material,[windowOpening(-4.22,4.9,.57,2.25),doorway(0,1.65,'dark'),windowOpening(4.22,4.9,.57,2.25)]));
      b.area(0,-d/2,Math.PI,()=>wall(w,h,material,[doorway(4.7,1.45,'metal')]));
      b.area(-w/2,0,-Math.PI/2,()=>wall(d,h,material));
      b.area(w/2,0,Math.PI/2,()=>wall(d,h,material,[windowOpening(-2.2,1.8,1.15,1.3)]));
      // Clear shop floor plus an empty stockroom at the back.
      partition(0,-2.5,w-.25,0,[doorway(-4.7,1.5)],h);
      b.box(0,floorY+h+.065,0,w+.2,.13,d+.2,'ceiling');
      rooftop(w,d,floorY+h+.15);
      sign(0,3.39,d/2+.2,w-.4,.73,id);
      b.box(0,2.87,d/2+.64,w+.35,.12,1.46,id==='supply'?'green':'red');
      b.box(0,2.78,d/2+1.35,w+.35,.15,.06,'cream');
      for(const sx of[-1,1])b.beam([sx*(w/2-.1),2.3,d/2],[sx*(w/2-.1),2.81,d/2+1.24],.025,'metal');
      sign(-4.2,1.72,d/2+.18,1.9,.95,detail);
      b.box(0,floorY-.055,d/2+.92,w+.3,.11,1.9,'concrete',0,false);
      for(const lx of[-3.9,3.9]){
        b.box(lx,3.65,.4,.36,.075,1.85,'metal');
        b.box(lx,3.605,.4,.27,.016,1.68,'glow',0,false);
      }
      b.box(0,3.65,-4.1,1.1,.08,.25,'metal');b.box(0,3.60,-4.1,.95,.016,.18,'glow',0,false);
    });
    const info=marker(id==='supply'?'PineSupply':'PineGeneralStore',x,z,yaw,w,d,8.6);
    info.stockroom=new THREE.Vector3(-4.7,0,-4.3).applyMatrix4(new THREE.Matrix4().fromArray(info.matrix)).toArray();
    return info;
  }

  // Two commercial units continue the existing west pavement north of Cedar St.
  shop(6,-64.5,'supply','supplyDetail','redBrick');
  shop(6,-84,'corner','cornerDetail','cream');
  b.box(-2,.065,-74.4,28,.13,4.5,'gravel',0,false);
  dumpster(-3,-73.5,Math.PI/2);dumpster(-3,-93,Math.PI/2);
  fence(-4,-57,-4,-69,false);fence(-4,-79,-4,-92,false);

  // A neighbour keeps the starter home from feeling isolated.
  house(.5,77,Math.PI/2,'fadedBlue',12,11,false);
  b.area(.5,77,Math.PI/2,()=>sign(1.08,1.8,5.67,.5,.27,'neighbourNumber'));

  // No. 18: living room, bedroom, utility room, bathroom, central hall and garden.
  const homeX=44,homeZ=82,w=12,d=12,h=3.02,yaw=-Math.PI/2;
  b.area(homeX,homeZ,yaw,()=>{
    b.box(0,floorY-.08,0,w+.18,.16,d+.18,'floorboards',0,false);
    b.area(0,d/2,0,()=>wall(w,h,'green',[windowOpening(-3.55,2.05,.88,1.5),doorway(0,1.4,'green'),windowOpening(3.55,2.05,.88,1.5)]));
    b.area(0,-d/2,Math.PI,()=>wall(w,h,'siding',[windowOpening(-3.4,1.4,1.2,1.1),doorway(0,1.4,'green'),windowOpening(3.4,2,.88,1.5)]));
    b.area(-w/2,0,-Math.PI/2,()=>wall(d,h,'siding',[windowOpening(-2.3,1.8),windowOpening(3,1.8)]));
    b.area(w/2,0,Math.PI/2,()=>wall(d,h,'siding',[windowOpening(-4.55,1.3,1.3,1.05),windowOpening(-.9,1.55),windowOpening(3.3,1.8)]));
    partition(0,.4,w-.24,0,[doorway(0,1.6)],h);
    partition(-1.05,-2.78,6.36,Math.PI/2,[doorway(-1.55,1.18)],h);
    partition(1.05,-2.78,6.36,-Math.PI/2,[doorway(-1.48,1.18),doorway(1.82,1.18)],h);
    partition(3.52,-3.18,4.84,0,[],h);
    b.box(3.5,floorY+.004,-4.62,4.7,.008,2.69,'shopFloor',0,false);
    b.box(0,floorY+h+.1,0,w+.2,.2,d+.2,'ceiling');
    pitchedRoof(w,d,floorY+h+.16,2.15);
    for(const side of[-1,1]){
      b.box(side*(w/2-.04),1.68,d/2+.12,.13,3.08,.13,'trim');
      b.cylinder(side*(w/2+.1),1.62,-d/2-.05,.035,.035,3,'metal',6);
    }
    // Level thresholds preserve the measured headset height without stairs.
    b.box(0,floorY-.06,d/2+1.34,5.4,.12,2.7,'floorboards',0,false);
    b.box(0,2.73,d/2+1.36,5.75,.14,3.06,'roof');
    for(const side of[-1,1]){
      b.box(side*2.48,1.42,d/2+2.53,.13,2.56,.13,'trim');b.collision(side*2.48,d/2+2.53,.17,.17);
      b.beam([side*2.48,1.1,d/2+.2],[side*2.48,1.1,d/2+2.48],.045,'trim');
      for(let i=0;i<6;i++)b.box(side*2.48,.68,d/2+.27+i*.39,.045,.72,.045,'trim');
      b.collision(side*2.48,d/2+1.34,.12,2.64);
    }
    b.box(0,floorY-.05,d/2+5.25,1.75,.1,5.2,'concrete',0,false);
    b.box(0,floorY-.055,-d/2-2.1,4,.11,4.2,'concrete',0,false);
    sign(1.02,1.89,d/2+.18,.5,.28,'homeNumber');
    b.box(-1.1,2.51,d/2+.22,.14,.22,.15,'metal');b.box(-1.1,2.5,d/2+.306,.1,.15,.024,'glow',0,false);
    for(const [lx,lz]of[[0,3.3],[-3.5,-2.5],[3.5,-1.3],[3.5,-4.5],[0,-2.5]]){
      b.cylinder(lx,3.12,lz,.19,.19,.06,'trim',12);b.cylinder(lx,3.082,lz,.145,.145,.025,'glow',12);
    }
    // A usable, empty garden behind the house; the back door opens onto its patio.
    fence(-9.4,-18,-9.4,13.1);fence(9.4,-18,9.4,13.1);fence(-9.4,-18,9.4,-18);
    fence(-9.4,13.1,-1.2,13.1);fence(1.2,13.1,9.4,13.1);
    b.cylinder(1.8,.75,12.8,.045,.055,1.3,'metal');b.box(1.8,1.42,12.8,.45,.3,.48,'green');
  });
  const home=marker('StarterHouse',homeX,homeZ,yaw,w,d,14.5),matrix=new THREE.Matrix4().fromArray(home.matrix);
  const homePoint=(x,z)=>new THREE.Vector3(x,0,z).applyMatrix4(matrix).toArray();
  home.rooms={living:homePoint(0,3.4),hall:homePoint(0,-2),bedroom:homePoint(-3.3,-2.5),utility:homePoint(3.3,-1.3),bathroom:homePoint(3.3,-4.6)};
  home.garden=homePoint(0,-12);home.rearDoor=homePoint(0,-6.7);

  // New paving and curb lengths stop short of the existing service-lane crossings.
  for(const x of[15.4,28.6]){
    b.box(x,.065,-77,3.5,.17,51,'concrete',0,false);
    b.box(x,.065,80.5,3.5,.17,58,'concrete',0,false);
  }
  for(const x of[17.25,26.75]){
    b.box(x,.08,-77,.22,.24,51,'trim',0,false);
    b.box(x,.08,80.5,.22,.24,58,'trim',0,false);
  }
  for(let z=-99;z<109;z+=5.2)if(z< -62||z>62)b.box(22,.016,z,.1,.008,2.5,'paint',0,false);
  for(const z of[-56,-76,-96,60,89,105]){
    lamp(z<0?28.5:15.5,z,z<0?-Math.PI/2:Math.PI/2);
    b.box(17.5,.024,z,.27,.03,.84,'metal',0,false);
  }
  for(const z of[-72,-101,70,101])utility(28.5,z);
  wire(28.4,-38,28.5,-72);wire(28.5,-72,28.5,-101);wire(41,8.35,28.5,70);wire(28.5,70,28.5,101);
  for(const [x,z,height]of[[-10,-55,13],[-10,-75,14],[-9,-97,12],[41,-59,12],[45,-79,15],[38,-98,13],[-10,64,14],[-9,96,13],[8,99,12],[64,68,14],[66,96,13],[46,107,12]])pine(x,z,height,.92);

  // Keep the original block boundary except where the avenue now continues.
  for(const z of[-57,58]){fence(-85,z,-14,z,false);fence(68,z,83,z,false);}
  for(const x of[-14,68]){fence(x,-105,x,-57,false);fence(x,58,x,112,false);}
  for(const z of[-105,112]){
    fence(-14,z,17,z,false);fence(27,z,68,z,false);
    for(const x of[18.2,25.8]){b.box(x,.55,z,.16,.9,.17,'wood');b.box(x,.18,z,.55,.22,.7,'concrete');}
    b.box(22,.88,z,9.3,.36,.12,'cream');b.box(22,.58,z,9.3,.14,.12,'red');b.collision(22,z,9.3,.5);
    sign(22,1.04,z+(z<0?.1:-.1),3.2,.4,'roadEnd',z<0?0:Math.PI);
  }
  b.bounds.minZ=-105;b.bounds.maxZ=112;
  return {additionalShops:2,places,home};
}

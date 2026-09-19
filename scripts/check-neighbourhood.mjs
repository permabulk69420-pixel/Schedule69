import * as THREE from 'three';
import assert from 'node:assert/strict';
import {makeMaterials} from '../src/materials.js';
import {buildWorld} from '../src/world.js';
import {moveWithCollision} from '../src/geometry.js';
import {COAST,groundHeight} from '../src/surfaces.js';

// Collision/layout checks need geometry only, so canvas paint calls are no-ops.
// This deliberately does not claim to test actual browser or texture rendering.
const paint={fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},ellipse(){},fill(){},fillText(){},createLinearGradient(){return{addColorStop(){}};}};
globalThis.document={createElement(){return{width:1,height:1,getContext(){return paint;}};}};
const scene=new THREE.Scene(),{m}=makeMaterials({capabilities:{getMaxAnisotropy:()=>1}}),world=buildWorld(scene,m);
assert.equal(world.buildingCount,14);
assert.equal(world.places.length,3);
assert.equal(scene.getObjectByName('StarterHouse').userData.kind,'unfurnished-interior');
scene.traverse(mesh=>{
  if(!mesh.isMesh)return;
  for(const value of mesh.geometry.attributes.position.array)assert(Number.isFinite(value),'Geometry must have finite positions.');
});

const radius=.28;
function free(x,z){
  if(x<world.bounds.minX+radius||x>world.bounds.maxX-radius||z<world.bounds.minZ+radius||z>world.bounds.maxZ-radius)return false;
  return !world.colliders.some(c=>{const nx=Math.max(c.minX,Math.min(x,c.maxX)),nz=Math.max(c.minZ,Math.min(z,c.maxZ));return(x-nx)**2+(z-nz)**2<radius*radius;});
}

// Flood-fill the walkable district once, then check all intended interior spaces.
// At 0.35 m the grid resolves the narrowest doorway after accounting for the body.
const step=.35,minX=world.bounds.minX,minZ=world.bounds.minZ;
const width=Math.ceil((world.bounds.maxX-minX)/step)+1,height=Math.ceil((world.bounds.maxZ-minZ)/step)+1;
const occupancy=new Uint8Array(width*height),seen=new Uint8Array(width*height),queue=new Int32Array(width*height);
const point=i=>[minX+(i%width)*step,minZ+Math.floor(i/width)*step];
const gridPoint=(x,z)=>Math.round((z-minZ)/step)*width+Math.round((x-minX)/step);
function isFree(i){if(i<0||i>=occupancy.length)return false;if(!occupancy[i]){const [x,z]=point(i);occupancy[i]=free(x,z)?1:2;}return occupancy[i]===1;}
const start=gridPoint(-28,7.12);assert(isFree(start));seen[start]=1;queue[0]=start;let head=0,tail=1;
while(head<tail){const i=queue[head++],column=i%width;for(const next of[i-width,i+width,...(column>0?[i-1]:[]),...(column<width-1?[i+1]:[])]){if(next<0||next>=seen.length||seen[next]||!isFree(next))continue;seen[next]=1;queue[tail++]=next;}}
const targets=[];
for(const place of world.details.destinations)targets.push([place.name,place.position]);
for(const place of world.places){targets.push([place.name+' approach',place.approach],[place.name+' entrance',place.entrance],[place.name+' interior',place.inside]);if(place.stockroom)targets.push([place.name+' stockroom',place.stockroom]);}
for(const [name,position]of Object.entries(world.starterHouse.rooms))targets.push(['Starter house '+name,position]);
targets.push(['Back garden',world.starterHouse.garden]);
for(const name of['roadCenter','promenade','north','south','beach','shore'])targets.push(['Coast '+name,world.coast[name]]);
for(const [index,ramp]of world.coast.ramps.entries())for(const end of['top','bottom'])targets.push([`Coast ramp ${index+1} ${end}`,ramp[end]]);
for(const [name,p]of targets){assert(free(p[0],p[2]),name+' must be clear of collision.');assert(seen[gridPoint(p[0],p[2])],name+' must connect to the original spawn.');}

// Check straight entry/exit travel with the actual locomotion solver, not just the grid.
for(const place of world.places){
  const p=new THREE.Vector3(...place.approach),target=new THREE.Vector3(...place.inside);
  moveWithCollision(p,target.x-p.x,target.z-p.z,world.colliders,world.bounds);
  assert(p.distanceTo(target)<.03,place.name+' doorway must admit the player.');
}
const home=world.starterHouse,matrix=new THREE.Matrix4().fromArray(home.matrix);
const local=(x,z)=>new THREE.Vector3(x,0,z).applyMatrix4(matrix);
const backStart=local(0,-4.8),garden=local(0,-12);
moveWithCollision(backStart,garden.x-backStart.x,garden.z-backStart.z,world.colliders,world.bounds);
assert(backStart.distanceTo(garden)<.03,'The back door must lead to the garden.');
const insideWall=local(4.8,3),throughWall=local(8,3);
moveWithCollision(insideWall,throughWall.x-insideWall.x,throughWall.z-insideWall.z,world.colliders,world.bounds);
assert(insideWall.distanceTo(throughWall)>1.5,'Solid exterior walls must stop the player.');

// Empty rooms must have a floor and ceiling, with nothing at head height in doorways.
scene.updateMatrixWorld(true);const meshes=[];scene.traverse(o=>{if(o.isMesh&&!o.material.isShaderMaterial)meshes.push(o);});
const ray=new THREE.Raycaster();
for(const place of world.places){
  const start=new THREE.Vector3(place.approach[0],1.75,place.approach[2]);
  const end=new THREE.Vector3(place.inside[0],1.75,place.inside[2]);
  ray.set(start,end.clone().sub(start).normalize());ray.far=start.distanceTo(end)-.05;
  assert.equal(ray.intersectObjects(meshes,false).filter(hit=>!hit.object.material.transparent).length,0,place.name+' entrance must also be visually open at head height.');
}
ray.far=Infinity;
for(const [name,p]of targets.filter(([name])=>name.includes('interior')||name.startsWith('Starter house'))){
  const eye=new THREE.Vector3(p[0],1.75,p[2]);ray.set(eye,new THREE.Vector3(0,1,0));const ceiling=ray.intersectObjects(meshes,false)[0];assert(ceiling&&ceiling.distance<2.5,name+' must have a closed ceiling.');
  ray.set(eye,new THREE.Vector3(0,-1,0));const floor=ray.intersectObjects(meshes,false)[0];assert(floor&&Math.abs(floor.point.y-.14)<.03,name+' floor must match the player ground height.');
}
// Regressions found in the visual pass: sunken lawns, unsupported foundations,
// incomplete front paths, a fire escape detached from its facade, and a window
// hanging beyond Cedar Court's corner. Probe rendered geometry at those sites.
function surfaceAt(x,z){ray.set(new THREE.Vector3(x,.9,z),new THREE.Vector3(0,-1,0));ray.far=1.2;return ray.intersectObjects(meshes,false)[0];}
for(const [x,z]of[[-68,18],[-45,18],[-20,18],[73,20],[9,73],[34,86],[57,85]]){
  const hit=surfaceAt(x,z);assert(hit&&Math.abs(hit.point.y-.12)<.002,'Residential lawns must meet the building foundations and paving.');
}
for(const [x,z]of[[-65,10],[-42,12],[-17,10],[70,13],[12.9,77]]){
  const hit=surfaceAt(x,z);assert(hit&&hit.object.material===m.concrete&&Math.abs(hit.point.y-.14)<.002,'Front paths must continue to the sidewalk.');
}
for(const [x,z]of[[15.4,-47],[28.6,49]]){
  const hit=surfaceAt(x,z);assert(hit&&hit.object.material===m.asphalt&&Math.abs(hit.point.y)<.002,'Service lanes must not be covered by raised sidewalks.');
}
assert(Math.abs(surfaceAt(15.4,-50.8).point.y-.15)<.002,'The extended sidewalk must reach the service-lane edge.');
ray.set(new THREE.Vector3(-68,0,21),new THREE.Vector3(0,0,1));ray.far=1;
assert(ray.intersectObjects(meshes,false).some(hit=>hit.object.material===m.darkBrick),'House foundations must extend below the lawn, with no open underside.');
for(const height of[4.3,7.3,10.3])for(let x=53.03;x<54.15;x+=.18){
  ray.set(new THREE.Vector3(x,height+.2,-18.5),new THREE.Vector3(0,-1,0));ray.far=.35;
  assert(ray.intersectObjects(meshes,false).some(hit=>hit.object.material===m.metal&&Math.abs(hit.point.y-height)<.002),'Fire escape decks must connect continuously to the facade.');
}
ray.set(new THREE.Vector3(76.65,1.8,-8),new THREE.Vector3(0,0,-1));ray.far=1.5;
assert.equal(ray.intersectObjects(meshes,false).length,0,'Ground-floor windows must stay within Cedar Court’s wall edges.');

const arrival=new THREE.Vector3(-28,0,0);
moveWithCollision(arrival,145,0,world.colliders,world.bounds);
assert(Math.abs(arrival.x-117)<.03,'Cedar Street must open directly onto the promenade.');
for(const ramp of world.coast.ramps){
  const position=new THREE.Vector3(...ramp.top),end=new THREE.Vector3(...ramp.bottom);
  moveWithCollision(position,end.x-position.x,end.z-position.z,world.colliders,world.bounds);
  assert(Math.abs(position.x-end.x)<.03,'Beach ramps must be traversable from top to bottom.');
  for(let x=120;x<140;x+=.1)assert(Math.abs(groundHeight(x+.1,position.z)-groundHeight(x,position.z))<.03,'Ramp entry and exit must have no height jumps.');
}
const wallStop=new THREE.Vector3(119,0,0);moveWithCollision(wallStop,5,0,world.colliders,world.bounds);
assert(wallStop.x<COAST.promenadeEdge-.25,'The railing must prevent walking off the seawall.');
for(const [x,z]of[[104,20],[117,0],[126,-31],[132,-31],[137,41],[150,0],[162,0]]){
  const expected=groundHeight(x,z);ray.set(new THREE.Vector3(x,expected+2,z),new THREE.Vector3(0,-1,0));ray.far=2.1;
  const hit=ray.intersectObjects(meshes,false)[0];assert(hit&&Math.abs(hit.point.y-expected)<.025,'Coastal terrain and player ground height must agree.');
}
const water=scene.getObjectByName('CedarOcean');assert(water?.material.isShaderMaterial);world.update(3.25);assert.equal(water.material.uniforms.uTime.value,3.25);
// New street dressing must leave a body-width through route and the garden gate
// open. Test the actual movement solver, including both walking directions.
for(const [name,a,c]of[
  ['Cedar shop pavement',[-24,-6.25],[12,-6.25]],
  ['Bus stop pavement',[-39,6.4],[-28,6.4]],
  ['Cedar Corner path',[2,9],[2,31]],
  ['Pine shop pavement',[15.4,-95],[15.4,-53]],
  ['Pine Patch entry',[28.6,-82],[61,-82]],
  ['Pine Patch spine',[48,-94],[48,-64]],
  ['Pine Patch pergola approach',[48,-88.8],[55,-88.8]],
  ['Promenade through route',[116,25],[116,53]],
])for(const [start,end]of[[a,c],[c,a]]){
  const p=new THREE.Vector3(start[0],0,start[1]);
  moveWithCollision(p,end[0]-p.x,end[1]-p.z,world.colliders,world.bounds);
  assert(Math.hypot(p.x-end[0],p.z-end[1])<.03,name+' must stay open in both directions.');
}
// All signs must remain inside the shared texture after packing the new boards.
for(const mesh of meshes)if(mesh.material.name==='neighbourhood-signs'){
  for(const uv of mesh.geometry.attributes.uv.array)assert(uv>=0&&uv<=1,'Sign UV must be inside the atlas.');
}
console.log(`Passed ${targets.length} connected destinations, entrances, rooms, lawns, foundations, front paths, fire escape attachment and facade edges.`);
console.log('Passed the coastal street connection, beach ramps, seawall collision, terrain heights and ocean update.');
console.log(JSON.stringify({buildings:world.buildingCount,triangles:world.triangles,trees:world.treeCount,colliders:world.colliders.length}));

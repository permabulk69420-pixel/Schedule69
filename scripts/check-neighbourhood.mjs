import * as THREE from 'three';
import assert from 'node:assert/strict';
import {makeMaterials} from '../src/materials.js';
import {buildWorld} from '../src/world.js';
import {moveWithCollision} from '../src/geometry.js';

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
for(const place of world.places){targets.push([place.name+' approach',place.approach],[place.name+' entrance',place.entrance],[place.name+' interior',place.inside]);if(place.stockroom)targets.push([place.name+' stockroom',place.stockroom]);}
for(const [name,position]of Object.entries(world.starterHouse.rooms))targets.push(['Starter house '+name,position]);
targets.push(['Back garden',world.starterHouse.garden]);
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
console.log(`Passed ${targets.length} connected destinations, entry/back doors, solid walls, closed ceilings and level floors.`);
console.log(JSON.stringify({buildings:world.buildingCount,triangles:world.triangles,trees:world.treeCount,colliders:world.colliders.length}));

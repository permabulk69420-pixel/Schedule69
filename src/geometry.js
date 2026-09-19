import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const UP=new THREE.Vector3(0,1,0);
export class CityBuilder {
  constructor(scene,materials) {this.scene=scene;this.m=materials;this.batches=new Map();this.colliders=[];this.transform=new THREE.Matrix4();this.temp=new THREE.Object3D();this.bounds={minX:-84,maxX:83,minZ:-57,maxZ:58};}
  area(x,z,yaw,fn){const prev=this.transform.clone();this.transform.multiply(new THREE.Matrix4().compose(new THREE.Vector3(x,0,z),new THREE.Quaternion().setFromAxisAngle(UP,yaw),new THREE.Vector3(1,1,1)));fn();this.transform.copy(prev);}
  add(g,mat,x=0,y=0,z=0,rx=0,ry=0,rz=0,shadow=true) {
    const material=typeof mat==='string'?this.m[mat]:mat;
    // Polyhedra are non-indexed; boxes and cylinders are indexed. Normalize the
    // former so organic props can share a material batch with architectural parts.
    if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));
    this.temp.position.set(x,y,z);this.temp.rotation.set(rx,ry,rz);this.temp.scale.set(1,1,1);this.temp.updateMatrix();g.applyMatrix4(this.temp.matrix);g.applyMatrix4(this.transform);
    const center=new THREE.Vector3(x,y,z).applyMatrix4(this.transform),key=`${material.uuid}:${Math.floor(center.x/40)}:${Math.floor(center.z/40)}:${shadow}`;
    if(!this.batches.has(key))this.batches.set(key,{material,geometries:[],shadow});this.batches.get(key).geometries.push(g);
  }
  box(x,y,z,w,h,d,mat,ry=0,shadow=true){
    const g=new THREE.BoxGeometry(w,h,d),material=typeof mat==='string'?this.m[mat]:mat;
    if(material.map?.userData.meters){const uv=g.attributes.uv,p=g.attributes.position,n=g.attributes.normal,k=material.map.userData.meters;
      for(let i=0;i<uv.count;i++){const axis=Math.abs(n.getY(i))>.5?'y':Math.abs(n.getX(i))>.5?'x':'z';uv.setXY(i,(axis==='x'?p.getZ(i):p.getX(i))/k,(axis==='y'?p.getZ(i):p.getY(i))/k);}}
    this.add(g,material,x,y,z,0,ry,0,shadow);
  }
  cylinder(x,y,z,rTop,rBot,h,mat,sides=8){this.add(new THREE.CylinderGeometry(rTop,rBot,h,sides),mat,x,y,z);}
  beam(a,b,r,mat,sides=6){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),dir=end.clone().sub(start),g=new THREE.CylinderGeometry(r,r,dir.length(),sides);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP,dir.normalize()));const mid=start.add(end).multiplyScalar(.5);this.add(g,mat,mid.x,mid.y,mid.z);}
  plane(x,y,z,w,h,mat,ry=0,uv=null,rx=0){const g=new THREE.PlaneGeometry(w,h);if(uv){const a=g.attributes.uv;for(let i=0;i<a.count;i++)a.setXY(i,THREE.MathUtils.lerp(uv.u0,uv.u1,a.getX(i)),THREE.MathUtils.lerp(uv.v0,uv.v1,a.getY(i)));}this.add(g,mat,x,y,z,rx,ry,0,false);}
  collision(x,z,w,d,padding=0){const points=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(p=>new THREE.Vector3(x+p[0],0,z+p[1]).applyMatrix4(this.transform));this.colliders.push({minX:Math.min(...points.map(p=>p.x))-padding,maxX:Math.max(...points.map(p=>p.x))+padding,minZ:Math.min(...points.map(p=>p.z))-padding,maxZ:Math.max(...points.map(p=>p.z))+padding});}
  finish(){let triangles=0;for(const [key,b]of this.batches){const g=mergeGeometries(b.geometries);g.computeBoundingSphere();const mesh=new THREE.Mesh(g,b.material);mesh.name=`city-${b.material.name}-${key.split(':').slice(1).join('-')}`;mesh.castShadow=b.shadow;mesh.receiveShadow=true;mesh.matrixAutoUpdate=false;mesh.updateMatrix();this.scene.add(mesh);triangles+=g.index?g.index.count/3:g.attributes.position.count/3;for(const part of b.geometries)part.dispose();}this.batches.clear();return triangles;}
}

export function moveWithCollision(position,dx,dz,colliders,bounds,radius=.28){
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.16));const sx=dx/steps,sz=dz/steps;
  const overlaps=(x,z,c)=>{const nearX=Math.max(c.minX,Math.min(x,c.maxX)),nearZ=Math.max(c.minZ,Math.min(z,c.maxZ));return (x-nearX)**2+(z-nearZ)**2<radius*radius;};
  for(let i=0;i<steps;i++){
    let x=THREE.MathUtils.clamp(position.x+sx,bounds.minX+radius,bounds.maxX-radius);
    if(!colliders.some(c=>overlaps(x,position.z,c)))position.x=x;
    let z=THREE.MathUtils.clamp(position.z+sz,bounds.minZ+radius,bounds.maxZ-radius);
    if(!colliders.some(c=>overlaps(position.x,z,c)))position.z=z;
  }
  return position;
}

const pivotBefore=new THREE.Vector3(),pivotAfter=new THREE.Vector3();
export function rotateAroundHead(rig,headCamera,angle){
  headCamera.getWorldPosition(pivotBefore);
  rig.rotation.y+=angle;rig.updateMatrixWorld(true);
  headCamera.getWorldPosition(pivotAfter);
  rig.position.x+=pivotBefore.x-pivotAfter.x;rig.position.z+=pivotBefore.z-pivotAfter.z;
  rig.updateMatrixWorld(true);
}

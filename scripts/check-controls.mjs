import * as THREE from 'three';
import assert from 'node:assert/strict';
import { moveWithCollision, rotateAroundHead } from '../src/geometry.js';

const bounds={minX:-100,maxX:100,minZ:-100,maxZ:100};
const walls=[{minX:2,maxX:5,minZ:-2,maxZ:2}];
const position=new THREE.Vector3();

moveWithCollision(position,20,0,walls,bounds);
assert(position.x<1.73&&position.x>1.5,'A large frame delta must not tunnel through a wall.');
position.set(0,0,0);
moveWithCollision(position,10,10,walls,bounds);
assert(position.x>7&&position.z>9,'Diagonal movement must slide along and clear the end of a wall.');
position.set(0,0,0);
moveWithCollision(position,200,0,[],bounds);
assert(position.x<=99.72,'The player radius must stay inside world bounds.');

const rig=new THREE.Group(),head=new THREE.PerspectiveCamera();
rig.add(head);head.position.set(.82,1.72,-.61);rig.position.set(20,.14,9);rig.rotation.y=.7;rig.updateMatrixWorld(true);
const before=head.getWorldPosition(new THREE.Vector3());
rotateAroundHead(rig,head,-1.8);
const after=head.getWorldPosition(new THREE.Vector3());
assert(before.distanceTo(after)<1e-10,'Turning must preserve the world position of an offset headset.');
assert(Math.abs(rig.rotation.y+1.1)<1e-10,'The full requested smooth-turn angle must be applied.');
console.log('Passed: wall tunnelling, diagonal sliding, world boundaries, offset headset pivot, and turn angle.');

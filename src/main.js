import * as THREE from 'three';
import './style.css';
import { makeMaterials } from './materials.js';
import { buildWorld } from './world.js';
import { moveWithCollision, rotateAroundHead } from './geometry.js';
import { groundHeight } from './surfaces.js';

const canvas=document.querySelector('#world'),vrButton=document.querySelector('#enter-vr'),walkButton=document.querySelector('#walk'),seatedButton=document.querySelector('#seated-mode'),help=document.querySelector('#control-help');
const coarse=matchMedia('(pointer: coarse)').matches;
if(coarse)help.textContent='Explore with touch · In VR: left stick moves, right stick turns · click right stick to run';
const fail=(message)=>{const el=document.querySelector('#error');el.hidden=false;el.textContent=message;document.querySelector('#loading').classList.add('done');};
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}catch(error){fail('This browser could not start the 3D scene. Try opening the page in Meta Quest Browser or a browser with WebGL enabled.');throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,coarse?1.25:1.6));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');renderer.xr.setFramebufferScaleFactor(1);renderer.xr.setFoveation(1);
const scene=new THREE.Scene();scene.background=new THREE.Color('#c3ab89');scene.fog=new THREE.Fog('#bdb59e',80,220);
const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.08,550);
const rig=new THREE.Group();rig.name='PlayerRig';scene.add(rig);rig.add(camera);
const spawn={x:-28,z:7.12,yaw:-.57};rig.position.set(spawn.x,.14,spawn.z);rig.rotation.y=spawn.yaw;camera.position.set(0,1.68,0);
scene.add(new THREE.HemisphereLight('#c8dadd','#69694a',2.1));
const sun=new THREE.DirectionalLight('#ffe0ac',2.7);sun.position.set(-68,72,45);sun.target.position.set(0,0,0);scene.add(sun,sun.target);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-145,right:170,top:135,bottom:-125,near:1,far:250});sun.shadow.bias=-.00015;sun.shadow.normalBias=.025;sun.shadow.camera.updateProjectionMatrix();
const {m}=makeMaterials(renderer);
let world;
try{world=buildWorld(scene,m);}catch(error){fail('The neighbourhood could not finish loading. Please refresh the page.');throw error;}
const sky=scene.getObjectByName('evening-sky');
renderer.shadowMap.needsUpdate=true;

// Controllers are deliberately simple, self-contained grips with no external assets.
for(let i=0;i<2;i++){
  const grip=renderer.xr.getControllerGrip(i);rig.add(grip);
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.029,.09,3,8),new THREE.MeshLambertMaterial({color:'#dedfca'}));body.rotation.x=-.27;body.position.set(0,-.028,.015);grip.add(body);
  const top=new THREE.Mesh(new THREE.CylinderGeometry(.045,.033,.025,12),m.dark);top.position.set(0,.029,-.015);grip.add(top);
  const stick=new THREE.Mesh(new THREE.SphereGeometry(.011,8,6),m.dark);stick.position.set(i===0?.015:-.015,.05,-.022);grip.add(stick);
}

const keys=new Set(),touchMove={x:0,y:0};let active=false,pitch=0,drag=null,lastTime=0,frameCount=0,sampleStart=0;
const head=new THREE.Vector3(),forward=new THREE.Vector3(),right=new THREE.Vector3(),destination=new THREE.Vector3();
const UP=new THREE.Vector3(0,1,0),STANDING_EYE_HEIGHT=1.68;
let seatedMode=false,seatedLift=0,seatedCalibrated=false;
const deadzone=(v)=>Math.abs(v)<.16?0:Math.sign(v)*(Math.abs(v)-.16)/.84;
function activate(){active=true;document.body.classList.add('exploring');}
seatedButton.addEventListener('click',()=>{seatedMode=!seatedMode;seatedButton.setAttribute('aria-pressed',String(seatedMode));seatedButton.textContent=seatedMode?'Seated: On':'Seated: Off';});
walkButton.addEventListener('click',async()=>{activate();if(!coarse){try{await canvas.requestPointerLock();}catch{ /* Drag look remains available when pointer lock is denied. */ }}});
document.querySelector('#help').addEventListener('click',()=>{document.body.classList.toggle('exploring');});
function look(dx,dy){rig.rotation.y-=dx*.003;pitch=THREE.MathUtils.clamp(pitch-dy*.0025,-1.35,1.35);camera.rotation.set(pitch,0,0,'YXZ');}
window.addEventListener('keydown',event=>{
  if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(event.code)){keys.add(event.code);activate();event.preventDefault();}
  if(event.code==='Escape'&&!renderer.xr.isPresenting){document.body.classList.remove('exploring');}
});
window.addEventListener('keyup',event=>keys.delete(event.code));
window.addEventListener('blur',()=>{keys.clear();touchMove.x=touchMove.y=0;drag=null;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();touchMove.x=touchMove.y=0;drag=null;}});
canvas.addEventListener('pointerdown',event=>{if(renderer.xr.isPresenting)return;activate();drag={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);});
canvas.addEventListener('pointermove',event=>{if(renderer.xr.isPresenting)return;if(document.pointerLockElement===canvas){look(event.movementX,event.movementY);return;}if(drag?.id===event.pointerId){look(event.clientX-drag.x,event.clientY-drag.y);drag.x=event.clientX;drag.y=event.clientY;}});
const clearDrag=event=>{if(drag?.id===event.pointerId)drag=null;};canvas.addEventListener('pointerup',clearDrag);canvas.addEventListener('pointercancel',clearDrag);
const pad=document.querySelector('#move-pad'),knob=document.querySelector('#move-knob');let padPointer=null;
function movePad(event){const r=pad.getBoundingClientRect(),dx=(event.clientX-r.left-r.width/2)/43,dy=(event.clientY-r.top-r.height/2)/43,len=Math.max(1,Math.hypot(dx,dy));touchMove.x=dx/len;touchMove.y=dy/len;knob.style.transform=`translate(${touchMove.x*35}px,${touchMove.y*35}px)`;}
pad.addEventListener('pointerdown',event=>{if(padPointer!==null)return;padPointer=event.pointerId;pad.setPointerCapture(event.pointerId);movePad(event);});
pad.addEventListener('pointermove',event=>{if(padPointer===event.pointerId)movePad(event);});
const endPad=event=>{if(padPointer!==event.pointerId)return;padPointer=null;touchMove.x=touchMove.y=0;knob.style.transform='';};pad.addEventListener('pointerup',endPad);pad.addEventListener('pointercancel',endPad);pad.addEventListener('lostpointercapture',endPad);

let currentSession=null;
async function checkVR(){
  if(!navigator.xr){vrButton.textContent='Open on Quest for VR';return;}
  try{if(await navigator.xr.isSessionSupported('immersive-vr')){vrButton.disabled=false;vrButton.textContent='Enter VR';}else{vrButton.textContent='Open on Quest for VR';}}catch{vrButton.textContent='VR unavailable';}
}
vrButton.addEventListener('click',async()=>{
  if(currentSession){await currentSession.end();return;}
  try{
    // local-floor keeps the floor stable; seated mode adds a one-time calibrated eye-height lift.
    const session=await navigator.xr.requestSession('immersive-vr',{requiredFeatures:['local-floor']});
    currentSession=session;seatedLift=0;seatedCalibrated=!seatedMode;camera.position.set(0,0,0);camera.rotation.set(0,0,0);pitch=0;
    session.addEventListener('end',()=>{currentSession=null;seatedLift=0;seatedCalibrated=false;camera.position.set(0,1.68,0);camera.rotation.set(0,0,0);camera.fov=72;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();document.body.classList.remove('xr');vrButton.textContent='Enter VR';keys.clear();renderer.shadowMap.needsUpdate=true;});
    await renderer.xr.setSession(session);renderer.xr.setFoveation(1);activate();document.body.classList.add('xr');document.querySelector('#error').hidden=true;vrButton.textContent='Exit VR';
    // Rebuild the static shadow once after the rendering target changes.
    renderer.shadowMap.needsUpdate=true;
  }catch(error){if(currentSession){await currentSession.end().catch(()=>{});currentSession=null;}seatedLift=0;seatedCalibrated=false;camera.position.set(0,1.68,0);vrButton.textContent='Try entering VR again';fail(error.name==='NotAllowedError'?'VR permission was declined. Select Enter VR and allow the session when you are ready.':'Could not enter VR. Open this page directly in Meta Quest Browser and try again.');}
});
checkVR();

function locomotion(dt,frame){
  const xr=renderer.xr.isPresenting;
  // The XR ArrayCamera is not parented to the rig. Synchronize the tracked pose
  // into the attached user camera before movement so pivots use today's pose.
  if(xr){
    rig.updateMatrixWorld(true);renderer.xr.updateCamera(camera);
    if(seatedMode&&!seatedCalibrated&&frame){
      const refSpace=renderer.xr.getReferenceSpace(),pose=refSpace?frame.getViewerPose(refSpace):null;
      if(pose){seatedLift=THREE.MathUtils.clamp(STANDING_EYE_HEIGHT-pose.transform.position.y,0,.9);seatedCalibrated=true;}
    }
  }
  const view=camera;
  let mx=touchMove.x,my=touchMove.y,turn=0,speed=2.4;
  if(xr){mx=my=0;for(const source of currentSession.inputSources){const gp=source.gamepad;if(!gp)continue;const offset=gp.axes.length>=4?2:0;if(source.handedness==='left'){mx=deadzone(gp.axes[offset]||0);my=deadzone(gp.axes[offset+1]||0);}if(source.handedness==='right'){turn=deadzone(gp.axes[offset]||0);if(gp.buttons[3]?.pressed)speed=3.8;}}}
  else{mx+=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0);my+=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);turn=(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0);if(keys.has('ShiftLeft')||keys.has('ShiftRight'))speed=4.2;}
  if(turn)rotateAroundHead(rig,view,-turn*1.35*dt);
  if(Math.abs(mx)+Math.abs(my)>.001){
    view.getWorldDirection(forward);forward.y=0;if(forward.lengthSq()<.01){forward.set(0,0,-1).applyQuaternion(rig.quaternion);}forward.normalize();right.crossVectors(forward,UP).normalize();
    const length=Math.max(1,Math.hypot(mx,my));mx/=length;my/=length;
    view.getWorldPosition(head);destination.copy(head);
    moveWithCollision(destination,(right.x*mx-forward.x*my)*speed*dt,(right.z*mx-forward.z*my)*speed*dt,world.colliders,world.bounds);
    rig.position.x+=destination.x-head.x;rig.position.z+=destination.z-head.z;
  }
  view.getWorldPosition(head);const heightOffset=xr&&seatedMode?seatedLift:0;rig.position.y=THREE.MathUtils.damp(rig.position.y,groundHeight(head.x,head.z)+heightOffset,14,dt);
}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();if(!renderer.xr.isPresenting)renderer.setSize(innerWidth,innerHeight);});
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fail('The browser paused the graphics session. Refresh this page to return to Cedar Street.');});

// Small debug surface for future environment work and repeatable validation.
window.cityDebug={renderer,scene,camera,rig,world,
  teleport(x,z,yaw=rig.rotation.y,y=1.68){if(renderer.xr.isPresenting)return false;rig.position.set(x,groundHeight(x,z),z);rig.rotation.y=yaw;camera.position.set(0,y,0);camera.rotation.set(0,0,0);pitch=0;return true;},
  info(){return{drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures,geometryCount:renderer.info.memory.geometries,trees:world.treeCount,buildings:world.buildingCount,colliders:world.colliders.length,position:rig.position.toArray(),xr:renderer.xr.isPresenting,seatedMode,seatedLift,fps:window.cityDebug.fps||0};}
};
renderer.setAnimationLoop((time,frame)=>{
  const dt=Math.min(Math.max((time-lastTime)/1000,0),.045);lastTime=time;
  if(active||renderer.xr.isPresenting)locomotion(dt,frame);
  world.update(time*.001);
  if(sky)sky.position.copy(rig.position);
  renderer.render(scene,camera);
  frameCount++;if(time-sampleStart>=1000){window.cityDebug.fps=Math.round(frameCount*1000/(time-sampleStart));frameCount=0;sampleStart=time;}
  if(!document.querySelector('#loading').classList.contains('done'))document.querySelector('#loading').classList.add('done');
});

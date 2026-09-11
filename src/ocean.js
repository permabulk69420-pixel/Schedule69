import * as THREE from 'three';
import {COAST} from './surfaces.js';

export function addOcean(scene){
  // One opaque draw call: low swell in the vertices, analytic ripples and wash
  // in the fragment shader. No reflection cameras or full-screen effects.
  const material=new THREE.ShaderMaterial({
    name:'coastal-water',uniforms:{uTime:{value:0},uHaze:{value:new THREE.Color('#bdb59e')}},
    vertexShader:`
      uniform float uTime;
      varying vec3 vWorld;
      void main(){
        vec3 p=position;
        float swell=smoothstep(153.,175.,p.x);
        p.y+=swell*(sin(p.x*.19+p.z*.12-uTime*.65)*.035+sin(p.z*.23+uTime*.48)*.018);
        vec4 world=modelMatrix*vec4(p,1.);
        vWorld=world.xyz;
        gl_Position=projectionMatrix*viewMatrix*world;
      }`,
    fragmentShader:`
      uniform float uTime;
      uniform vec3 uHaze;
      varying vec3 vWorld;
      void main(){
        float distanceToEye=length(cameraPosition-vWorld);
        float detail=1.-smoothstep(25.,150.,distanceToEye)*.78;
        float a=vWorld.x*.66+vWorld.z*.42-uTime*.9;
        float b=vWorld.z*.71-vWorld.x*.19+uTime*.65;
        vec3 normal=normalize(vec3((cos(a)*.065-cos(b)*.035)*detail,1.,(cos(a)*.04+cos(b)*.07)*detail));
        vec3 eye=normalize(cameraPosition-vWorld);
        float fresnel=pow(1.-clamp(dot(eye,normal),0.,1.),3.);
        vec3 c=mix(vec3(.065,.24,.205),vec3(.012,.068,.098),smoothstep(159.,212.,vWorld.x));
        c=mix(c,vec3(.27,.35,.36),fresnel*.38);
        c*=.94+.06*sin(a+b);
        vec3 sun=normalize(vec3(-68.,72.,45.));
        float highlight=pow(max(dot(normal,normalize(eye+sun)),0.),48.);
        c+=vec3(.6,.47,.28)*highlight*.3;
        float wash=sin((vWorld.x-155.)*.61+sin(vWorld.z*.1)*.7+sin(vWorld.z*.43)*.13+uTime*.65);
        float foam=smoothstep(.82,.98,wash)*(1.-smoothstep(161.,177.,vWorld.x))*smoothstep(154.,159.,vWorld.x);
        foam*=.62+.2*sin(vWorld.z*2.1+vWorld.x*.8-uTime);
        c=mix(c,vec3(.7,.74,.68),foam*.74);
        c=mix(c,uHaze,smoothstep(110.,440.,distanceToEye));
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const geometry=new THREE.PlaneGeometry(1000,1400,80,64);
  geometry.rotateX(-Math.PI/2);geometry.translate(650,COAST.waterY,0);
  geometry.computeBoundingSphere();geometry.boundingSphere.radius+=.06;
  const mesh=new THREE.Mesh(geometry,material);mesh.name='CedarOcean';mesh.frustumCulled=true;
  scene.add(mesh);
  return {triangles:geometry.index.count/3,update:seconds=>{material.uniforms.uTime.value=seconds;}};
}

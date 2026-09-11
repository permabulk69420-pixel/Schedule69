// Shared by the beach meshes and locomotion, so feet follow the built surfaces.
export const COAST = Object.freeze({
  roadX:104, roadHalf:4.75, minZ:-68, maxZ:78,
  promenadeEdge:121.25, waterY:-1.25, beachLimit:164,
  rampEnd:138, rampHalfWidth:1.7, rampZs:[-31,41],
});

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function beachHeight(x,z){
  const base=x<140?-.72-.08*clamp((x-COAST.promenadeEdge)/(140-COAST.promenadeEdge),0,1)
    :x<160?-.8-(x-140)*.025:-1.3-(x-160)*.08;
  const dune=Math.sin(clamp((x-COAST.promenadeEdge)/25,0,1)*Math.PI);
  return base+dune*(Math.sin(z*.09)*.055+Math.cos(z*.16)*.025);
}
export function beachRampHeight(x,zCenter){
  const t=clamp((x-COAST.promenadeEdge)/(COAST.rampEnd-COAST.promenadeEdge),0,1);
  return .14+(beachHeight(COAST.rampEnd,zCenter)+.012-.14)*t;
}
export function groundHeight(x,z){
  if(x>=COAST.promenadeEdge){
    const ramp=COAST.rampZs.find(rz=>Math.abs(z-rz)<=COAST.rampHalfWidth);
    if(ramp!==undefined&&x<=COAST.rampEnd)return beachRampHeight(x,ramp);
    return beachHeight(x,z);
  }
  if(x>88){
    if(Math.abs(x-COAST.roadX)<COAST.roadHalf&&z>=COAST.minZ&&z<=COAST.maxZ)return 0;
    if(x<COAST.roadX&&Math.abs(z)<5)return 0;
    return .14;
  }
  if(Math.abs(z)<5||Math.abs(x-22)<4.78||Math.abs(z+47)<3||Math.abs(z-49)<2.5)return 0;
  return .14;
}

import * as THREE from 'three';

// Fill every eligible green pocket on a jittered grid. Large canopies form
// groves; smaller trees also fit narrow coastal margins and courtyard gaps.
export function plantTaipeiForest(art,coast){const xs=coast.map(p=>p[0]),zs=coast.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs),start=art.treeSites.length;let candidates=0;
 for(let z=minZ+2;z<maxZ-2;z+=4.2)for(let x=minX+2;x<maxX-2;x+=4.2){const xx=x+art.between(-.8,.8),zz=z+art.between(-.8,.8);candidates++;let h=art.between(7.1,10.6);if(!art.clearAt(xx,zz,h*.28))h=art.between(4.5,6.2);art.tree(xx,zz,h,art.rand()<.1?1:0);}
 // Offset infill avoids rows and fills smaller holes left between broad crowns.
 for(let z=minZ+4;z<maxZ-3;z+=5.1)for(let x=minX+4;x<maxX-3;x+=5.1){const xx=x+art.between(-1,1),zz=z+art.between(-1,1);if(art.treeSites.some(t=>Math.hypot(t.x-xx,t.z-zz)<3))continue;art.tree(xx,zz,art.between(4.8,6.9),art.rand()<.08?1:0);}
 return {candidates,planted:art.treeSites.length-start};
}

// Clouds are part of the distant sky shader, never billboards floating in
// front of the city or translucent rectangles rendered into the AO buffer.
export function installTaipeiSkyClouds(sky){
 sky.userData.skipAmbientOcclusion=true;sky.material.uniforms.cityCloudColor={value:new THREE.Color('#fffaf0')};sky.material.uniforms.citySkyTint={value:new THREE.Color('#80b8e4')};
 const noise=`
 uniform vec3 cityCloudColor;
 uniform vec3 citySkyTint;
 float cityCloudHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float cityCloudNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(cityCloudHash(i),cityCloudHash(i+vec2(1.,0.)),f.x),mix(cityCloudHash(i+vec2(0.,1.)),cityCloudHash(i+vec2(1.,1.)),f.x),f.y);}
 float cityCloudFbm(vec2 p){float n=0.,a=.55;for(int k=0;k<5;k++){n+=cityCloudNoise(p)*a;p=mat2(.8,-.6,.6,.8)*p*2.02+vec2(4.3,2.7);a*=.48;}return n;}
 `;
 sky.material.fragmentShader=sky.material.fragmentShader.replace('void main() {',noise+'\nvoid main() {').replace('gl_FragColor = vec4( retColor, 1.0 );',`
 vec2 cityCloudUV=direction.xz/(.3+max(0.,direction.y))*1.5;
 float cityCloudShape=cityCloudFbm(cityCloudUV+vec2(13.4,7.2));
 float cityCloudCoverage=smoothstep(.52,.7,cityCloudShape)*smoothstep(.015,.15,direction.y)*(1.-smoothstep(.82,.98,direction.y));
 retColor=mix(retColor,citySkyTint,smoothstep(.025,.3,direction.y)*.45);
 retColor=mix(retColor,cityCloudColor*(1.1+cityCloudShape*.35),cityCloudCoverage*.92);
 gl_FragColor = vec4( retColor, 1.0 );`);
 sky.material.needsUpdate=true;
}
export function excludeSkyOverlaysFromAO(ao,scene){const original=ao.overrideVisibility.bind(ao);ao.overrideVisibility=function(){original();scene.traverse(o=>{const m=o.material;if(o.userData.skipAmbientOcclusion||o.isSprite||(m&&!Array.isArray(m)&&((m.transparent&&!m.depthWrite)||(m.alphaTest>0&&m.map))))o.visible=false;});};}

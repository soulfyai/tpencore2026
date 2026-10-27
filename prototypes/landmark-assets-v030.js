import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {LANDMARK_BUILD} from './taipei-landmarks.js?rev=1';

export async function installTaipei101Asset(scene,art,l,S,geometries){
 const sc=l.scale*S,old=new THREE.Group();old.name='taipei101-original';old.userData.keepDynamic=true;old.position.set(l.x,.1,l.z);old.scale.setScalar(sc);
 const part=(key,x,y,z,w,h,d,c,ry=0,rx=0,rz=0)=>{const m=new THREE.Mesh(geometries[key]||art.geo.box,art.mat(c,.8));m.position.set(x,y,z);m.scale.set(w,h,d);m.rotation.set(rx,ry,rz);m.castShadow=true;m.receiveShadow=true;old.add(m);};
 const height=LANDMARK_BUILD.t101(part)*sc;l.height=height;old.visible=false;scene.add(old);
 const gltf=await new GLTFLoader().loadAsync('./assets/art-v030/taipei101-v1.glb');
 const root=gltf.scene;root.name='taipei101-glb-v1';root.userData.keepDynamic=true;const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),scale=height/size.y;
 root.scale.setScalar(scale);root.position.set(l.x-(bounds.min.x+size.x/2)*scale,.1-bounds.min.y*scale,l.z-(bounds.min.z+size.z/2)*scale);
 let meshes=0,triangles=0;root.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;o.castShadow=true;o.receiveShadow=true;for(const m of [o.material].flat())m.envMapIntensity=.7;}});scene.add(root);
 root.updateMatrixWorld(true);old.updateMatrixWorld(true);const site=new THREE.Box3().setFromObject(root).union(new THREE.Box3().setFromObject(old)),siteSize=site.getSize(new THREE.Vector3()),siteCenter=site.getCenter(new THREE.Vector3()),footprint={x:siteCenter.x,z:siteCenter.z,w:siteSize.x,d:siteSize.z};art.reserve(footprint.x,footprint.z,footprint.w,footprint.d);
 return {root,old,height,meshes,triangles,scale,footprint,setOriginal(value){root.visible=!value;old.visible=value;},get original(){return old.visible;}};
}

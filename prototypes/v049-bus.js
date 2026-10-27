import * as THREE from 'three';
export function makeBus(coach=false){
 const g=new THREE.Group(),paint=new THREE.MeshStandardMaterial({color:coach?'#dfbe79':'#5caaad'}),glass=new THREE.MeshStandardMaterial({color:'#294a59',roughness:.25}),rubber=new THREE.MeshStandardMaterial({color:'#253039'}),white=new THREE.MeshStandardMaterial({color:'#ece9dd'});
 const box=(m,x,y,z,w,h,d)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);};
 box(paint,0,.85,0,1.35,1.05,3.7);box(white,0,1.44,0,1.34,.15,3.65);
 box(glass,0,1.12,1.86,1.17,.53,.03);box(glass,0,1.1,-1.86,1.15,.48,.03);
 for(const x of [-.68,.68])for(let i=0;i<5;i++)box(glass,x,1.15,-1.42+i*.64,.025,.43,.52);
 for(const x of [-.69,.69])for(const z of [-1.15,1.15]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.29,.29,.12,12),rubber);w.rotation.z=Math.PI/2;w.position.set(x,.29,z);g.add(w);}
 for(const x of [-.45,.45])box(white,x,.65,1.88,.22,.14,.04);
 if(coach)box(paint,0,1.57,-.2,.8,.16,1.8);else box(white,.69,.7,.9,.025,.85,.48);
 g.userData.vehicleType=coach?'coach':'bus';return g;
}

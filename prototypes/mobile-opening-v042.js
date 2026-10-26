// Camera-only refinement of the v0.4.1 scene; keep all world/UI geometry intact.
function mobileTaipeiOpening(city,base){
 const w=stage.clientWidth,h=stage.clientHeight;
 if(city!=='taipei'||w>600||w>=h)return base;
 const aspect=w/Math.max(1,h),referenceAspect=392/697;
 const factor=.56*THREE.MathUtils.clamp(referenceAspect/aspect,.85,1.25);
 const offset=base.pos.clone().sub(base.target).applyAxisAngle(new THREE.Vector3(0,1,0),THREE.MathUtils.degToRad(-25)).multiplyScalar(factor);
 const target=base.target.clone().setY(0).add(new THREE.Vector3(-5,0,-2));
 const probe=new THREE.PerspectiveCamera(camera.fov,aspect,camera.near,camera.far);
 const forward=new THREE.Vector3(-offset.x,0,-offset.z).normalize(),right=new THREE.Vector3(-forward.z,0,forward.x),pitch=Math.asin(offset.y/offset.length());
 const built=APPROVED_ART.cities.get('taipei'),landmark=built.landmarks.find(l=>l.id==='t101'),S=built.plan.scale;
 if(landmark){const focus=new THREE.Vector3(landmark.x/S+built.root.position.x,built.root.position.y,landmark.z/S+built.root.position.z),tangent=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
  // Place 101's base consistently in the lower middle on different phone ratios.
  // Translating the camera and target together keeps the chosen orbit/tilt intact.
  for(let i=0;i<4;i++){
   probe.position.copy(target).add(offset);probe.lookAt(target);probe.updateMatrixWorld(true);
   const projected=focus.clone().project(probe),view=focus.clone().applyMatrix4(probe.matrixWorldInverse),depth=-view.z;
   const dx=.60-(projected.x*.5+.5),dy=.68-(.5-projected.y*.5);
   target.addScaledVector(right,-dx*2*depth*tangent*aspect);
   target.addScaledVector(forward,dy*2*depth*tangent/Math.max(.2,Math.sin(pitch)));
  }
 }
 return {target,pos:target.clone().add(offset),dist:offset.length()};
}

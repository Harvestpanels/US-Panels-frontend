/* US Panels 3D viewer. Visitors pick a product, then drive it with its own controls.
   Needs three.js r128 + OrbitControls + GLTFLoader, panelmat.js (panel materials for the door walls) and acc_assets.js (trim models).
   Products: doors (Blender-built models in models/doors), trim (Blender-built models in acc_assets.js) and the wall & roof panel designer.
   The page provides: #sv (the stage; data-products="doors,trim,designer" limits and orders what it offers), #ctl, #stats, #ptitle, #pblurb, #pnote,
   optional .pick [data-id] product cards, [data-view] buttons and #rotb. Units: mm. */
(function(){
  const host=document.getElementById('sv'); if(!host||!window.THREE) return;
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)), ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;

  // ---------------- renderer / scene ----------------
  const lowGPU=(()=>{ try{ const c=document.createElement('canvas'), g=c.getContext('webgl')||c.getContext('experimental-webgl'); if(!g) return false; const d=g.getExtension('WEBGL_debug_renderer_info'), n=d?String(g.getParameter(d.UNMASKED_RENDERER_WEBGL)):''; const lose=g.getExtension('WEBGL_lose_context'); if(lose) lose.loseContext(); return /Intel|Mesa|llvmpipe|SwiftShader|Basic Render|Adreno \(?[0-4]|Mali-[T4]|PowerVR/i.test(n); }catch(e){ return false; } })();
  let renderer; try{ renderer=new THREE.WebGLRenderer({antialias:true,alpha:true}); }catch(e){ host.classList.add('no3d'); host.textContent='3D is not available in this browser. Call (405) 778-2808 and we will send pictures.'; return; }
  const baseRatio=Math.min(devicePixelRatio,lowGPU?1.25:1.75), moveRatio=Math.min(baseRatio,1);   // sharp when still, lighter while moving
  renderer.setPixelRatio(baseRatio);
  // render only while something moves or the visitor interacts (the GPU idles otherwise)
  let wakeUntil=performance.now()+4000, lastMove=0, lastBeat=0;
  const wake=(ms=3000,motion=false)=>{ const t=performance.now(); wakeUntil=Math.max(wakeUntil,t+ms); if(motion) lastMove=t; };
  const setRes=r=>{ if(renderer.getPixelRatio()!==r){ renderer.setPixelRatio(r); renderer.setSize(host.clientWidth,host.clientHeight,false); } };
  ['pointerdown','pointermove','wheel','keydown','click','input','change','touchstart'].forEach(ev=>addEventListener(ev,()=>wake(ev==='pointermove'?500:3000),{passive:true,capture:true}));
  renderer.outputEncoding=THREE.sRGBEncoding; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=.8;
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(30,1,20,60000);
  const controls=new THREE.OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true; controls.dampingFactor=.08; controls.autoRotate=false; controls.autoRotateSpeed=1.4;
  controls.maxPolarAngle=Math.PI*0.495;
  // The wheel zooms as soon as the pointer is over the model, no click needed (the page scrolls when the pointer is anywhere else).
  controls.enableZoom=true;
  // Zoom for every product. Zooming in goes toward the point under the cursor, so any part of a panel, door or trim piece can be reached; zooming out backs away
  // and drifts the view back to the middle of the model, so it never gets lost. Wheel ticks, trackpad pinch and mouse gliding are smoothed over a few frames.
  const zoomRay=new THREE.Raycaster(), zoomNdc=new THREE.Vector2(), zoomHit=new THREE.Vector3(), zoomBox=new THREE.Box3(), zoomMid=new THREE.Vector3();
  let zRemain=0, zX=0, zY=0, zBusy=false, zHitOk=false, zCx=-999, zCy=-999, zLast=0;
  function zoomStep(now){
    zBusy=false; if(!root||Math.abs(zRemain)<.0005){ zRemain=0; return; }
    const frac=zLast?1-Math.exp(-Math.min(now-zLast,600)/90):.17; zLast=now;   // the glide takes the same time on a fast or a slow computer
    const step=Math.abs(zRemain)<.01?zRemain:zRemain*frac; zRemain-=step;
    zoomBox.setFromObject(root); if(zoomBox.isEmpty()) return;
    const size=zoomBox.getSize(new THREE.Vector3()), R=Math.max(size.x,size.y,size.z); zoomBox.getCenter(zoomMid);
    const d0=camera.position.distanceTo(controls.target); let s=clamp(d0*Math.exp(step),controls.minDistance,controls.maxDistance)/d0, p=controls.target.clone();
    if(s<1){ // in: toward the surface under the cursor
      if(Math.hypot(zX-zCx,zY-zCy)>3){ const r=renderer.domElement.getBoundingClientRect(); zoomNdc.set(((zX-r.left)/r.width)*2-1,-((zY-r.top)/r.height)*2+1); zoomRay.setFromCamera(zoomNdc,camera);
        const hit=zoomRay.intersectObject(root,true)[0]; zHitOk=!!hit; if(hit) zoomHit.copy(hit.point); zCx=zX; zCy=zY; }
      if(zHitOk) p.copy(zoomHit);
      const near=(current&&current.detail)?24:Math.max(30,R*.02), dp=camera.position.distanceTo(p); if(dp*s<near) s=Math.min(1,near/dp);   // never go through the surface
    }
    camera.position.sub(p).multiplyScalar(s).add(p); controls.target.sub(p).multiplyScalar(s).add(p);
    if(s>1){ const dv=zoomMid.clone().sub(controls.target).multiplyScalar(1-1/s); controls.target.add(dv); camera.position.add(dv); }   // out: ease back toward the middle
    const pad=R*.05, t=controls.target, dv=new THREE.Vector3(clamp(t.x,zoomBox.min.x-pad,zoomBox.max.x+pad)-t.x,clamp(t.y,zoomBox.min.y-pad,zoomBox.max.y+pad)-t.y,clamp(t.z,zoomBox.min.z-pad,zoomBox.max.z+pad)-t.z);
    controls.target.add(dv); camera.position.add(dv);   // the view point stays on the model
    controls.update(); wake(400,true);
    if(Math.abs(zRemain)>=.0005){ zBusy=true; requestAnimationFrame(zoomStep); } else zLast=0;
  }
  renderer.domElement.addEventListener('wheel',e=>{
    if(!current) return; e.preventDefault(); e.stopImmediatePropagation();
    const k=e.ctrlKey?.012:.0012, dy=e.deltaMode===1?e.deltaY*33:e.deltaMode===2?e.deltaY*400:e.deltaY;
    zRemain=clamp(zRemain+clamp(dy*k,-.5,.5),-1.2,1.2); zX=e.clientX; zY=e.clientY; wake(600,true);
    if(!zBusy){ zCx=-999; zLast=0; zBusy=true; requestAnimationFrame(zoomStep); }   // a new burst of scrolling looks under the cursor again
  },{passive:false,capture:true});

  (function(){ // studio reflections
    const es=new THREE.Scene();
    es.add(new THREE.Mesh(new THREE.SphereGeometry(50,32,16),new THREE.MeshBasicMaterial({color:new THREE.Color(.58,.6,.64),side:THREE.BackSide})));
    const b=(w,h,x,y,z,i)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(i,i,i),side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);es.add(m);};
    b(30,18,-25,22,25,5); b(24,14,28,10,12,3); b(40,10,0,40,0,4); b(30,8,0,12,-40,3);
    const pm=new THREE.PMREMGenerator(renderer); scene.environment=pm.fromScene(es,.02).texture; pm.dispose();
  })();
  scene.add(new THREE.HemisphereLight(0xffffff,0xb4b9c2,.42)); { const fl=new THREE.DirectionalLight(0xffffff,.35); fl.position.set(-3200,2200,-2600); scene.add(fl); }
  const key=new THREE.DirectionalLight(0xffffff,1.2); key.position.set(2600,4200,3200); key.castShadow=true;
  key.shadow.mapSize.set(lowGPU?1024:2048,lowGPU?1024:2048); const sc=key.shadow.camera; sc.left=-3500;sc.right=3500;sc.top=3500;sc.bottom=-3500;sc.near=100;sc.far=12000;
  key.shadow.bias=-.0003; key.shadow.normalBias=2; key.shadow.radius=6; scene.add(key);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(40000,40000),new THREE.ShadowMaterial({opacity:.34})); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);

  // ---------------- shared materials / helpers ----------------
  const COLORS=[['Grey White','#E7EBDA'],['White','#F5F5F2'],['White Aluminum','#A8ABAA'],['Ivory','#E6D2B5'],['Light Blue','#6FA3D6'],
                ['Gentian Blue','#0E4C92'],['Signal Green','#237F52'],['Colza Yellow','#F3DA0B'],['Pure Orange','#E75B12'],['Flame Red','#AF2B1E']];
  const steelMat=hex=>new THREE.MeshPhysicalMaterial({color:hex,roughness:.4,metalness:0,clearcoat:.25,clearcoatRoughness:.3,envMapIntensity:.6});
  function noiseTex(base,speck,pores,tile){
    const c=document.createElement('canvas'); c.width=c.height=512; const g=c.getContext('2d'); g.fillStyle=base; g.fillRect(0,0,512,512);
    for(let i=0;i<pores;i++){ g.fillStyle=`rgba(120,95,40,${.07+Math.random()*.16})`; g.beginPath(); g.arc(Math.random()*512,Math.random()*512,.6+Math.random()*2.2,0,7); g.fill(); }
    for(let i=0;i<speck;i++){ g.fillStyle=`rgba(40,30,20,${.25+Math.random()*.4})`; g.fillRect(Math.random()*512,Math.random()*512,1+Math.random()*1.4,1+Math.random()*1.4); }
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.encoding=THREE.sRGBEncoding; t.anisotropy=8; t.repeat.set(1/tile,1/tile); return t;
  }
  const bumpNoise=(()=>{ const c=document.createElement('canvas'); c.width=c.height=256; const g=c.getContext('2d'); const d=g.createImageData(256,256);
    for(let i=0;i<d.data.length;i+=4){ const v=110+Math.random()*90; d.data[i]=d.data[i+1]=d.data[i+2]=v; d.data[i+3]=255; } g.putImageData(d,0,0);
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(1/30,1/30); return t; })();
  const foamMat=()=>new THREE.MeshStandardMaterial({map:noiseTex('#f1e4b4',0,0,90),roughness:.92});
  const sh=m=>{ m.castShadow=m.receiveShadow=true; return m; };
  const box=(w,h,d,mat,x=0,y=0,z=0)=>{ const m=sh(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat)); m.position.set(x,y,z); return m; };
  const poly=pts=>new THREE.Shape(pts.map(p=>new THREE.Vector2(p[0],p[1])));
  function extrude(pts,depth){ const g=new THREE.ExtrudeGeometry(poly(pts),{depth,bevelEnabled:false}); g.translate(0,0,-depth/2); return g; }

  // ---------------- UI ----------------
  const ui={ctl:$('#ctl'),stats:$('#stats'),title:$('#ptitle'),blurb:$('#pblurb'),note:$('#pnote')};
  function renderControls(list){
    if(!ui.ctl) return; ui.ctl.innerHTML='';
    list.forEach(c=>{
      const w=document.createElement('div'); w.className='cg'; const lab=document.createElement('span'); lab.className='cl mono'; lab.textContent=c.label||''; w.appendChild(lab);
      if(c.type==='chips'){ const row=document.createElement('div'); row.className='chips'; row.setAttribute('role','group'); row.setAttribute('aria-label',c.label);
        c.options.forEach(o=>{ const b=document.createElement('button'); b.type='button'; b.className='chip'+(o.v===c.value?' on':''); b.textContent=o.label; b.setAttribute('aria-pressed',String(o.v===c.value));
          b.onclick=()=>{ $$('.chip',row).forEach(x=>{ x.classList.toggle('on',x===b); x.setAttribute('aria-pressed',String(x===b)); }); c.value=o.v; c.onChange(o.v); }; row.appendChild(b); }); w.appendChild(row); }
      if(c.type==='swatches'){ const row=document.createElement('div'); row.className='sw';
        c.options.forEach(o=>{ const b=document.createElement('button'); b.type='button'; b.className=o.v===c.value?'on':''; b.style.background=o.v; b.title=o.label; b.setAttribute('aria-label',o.label);
          b.onclick=()=>{ $$('button',row).forEach(x=>x.classList.toggle('on',x===b)); c.value=o.v; lab.textContent=c.label+': '+o.label; c.onChange(o.v); }; row.appendChild(b); });
        w.appendChild(row); const cur=c.options.find(o=>o.v===c.value); if(cur) lab.textContent=c.label+': '+cur.label; }
      if(c.type==='slider'){ const row=document.createElement('div'); row.className='slrow'; const i=document.createElement('input'); i.type='range'; i.min=c.min; i.max=c.max; i.value=c.value; i.step=c.step||1; i.setAttribute('aria-label',c.label);
        const o=document.createElement('output'); o.textContent=c.fmt?c.fmt(+i.value):i.value; i.oninput=()=>{ c.value=+i.value; o.textContent=c.fmt?c.fmt(+i.value):i.value; c.onChange(+i.value); };
        c.setValue=v=>{ i.value=v; c.value=+v; o.textContent=c.fmt?c.fmt(+v):v; }; row.append(i,o); w.appendChild(row); }
      if(c.type==='toggle'){ const row=document.createElement('label'); row.className='tg'; const i=document.createElement('input'); i.type='checkbox'; i.checked=!!c.value; i.onchange=()=>{ c.value=i.checked; c.onChange(i.checked); };
        row.append(i,document.createTextNode(c.text)); w.appendChild(row); }
      if(c.type==='button'){ const b=document.createElement('button'); b.type='button'; b.className='btn line act'; b.textContent=c.text; b.onclick=()=>c.onClick(b); w.appendChild(b); lab.remove(); w.classList.add('cgb'); }
      ui.ctl.appendChild(w);
    });
  }
  function renderStats(rows){ if(ui.stats) ui.stats.innerHTML=rows.map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join(''); }
  function tween(from,to,ms,cb,done){ const t0=performance.now(); (function f(n){ wake(300,true); const k=clamp((n-t0)/ms,0,1); cb(from+(to-from)*ease(k)); if(k<1) requestAnimationFrame(f); else done&&done(); })(t0); }

  // ---------------- camera framing ----------------
  let root=null, current=null, currentId=null;
  // small "whole panel" picture in the corner, drawn by a second camera into a scissored square of the same canvas (used by the perforated section)
  let inset=null; const insetCam=new THREE.PerspectiveCamera(30,1,20,60000); insetCam.layers.enable(1);
  const insetEl=document.createElement('div'); insetEl.className='inset'; insetEl.hidden=true; insetEl.innerHTML='<span>Whole panel</span>'; host.appendChild(insetEl);
  const insetRect=()=>{ const w=host.clientWidth, h=host.clientHeight, s=Math.round(clamp(Math.min(w,h)*.36,118,230)); return {x:12,y:h-12-s,w:s,h:s,top:12}; };
  function frameInset(){
    if(!inset||!root) return; const bb=new THREE.Box3().setFromObject(root); if(bb.isEmpty()) return;
    const c=bb.getCenter(new THREE.Vector3()), s=bb.getSize(new THREE.Vector3()), r=Math.max(s.x,s.y,s.z), dist=r*.74/Math.tan(THREE.MathUtils.degToRad(insetCam.fov/2))*1.05;
    const az=inset.az*Math.PI/180, el=(typeof inset.el==='function'?inset.el():inset.el)*Math.PI/180;
    insetCam.position.set(c.x+Math.sin(az)*Math.cos(el)*dist,c.y+Math.sin(el)*dist,c.z+Math.cos(az)*Math.cos(el)*dist); insetCam.lookAt(c); insetCam.near=Math.max(20,dist*.02); insetCam.far=Math.max(60000,dist*40); insetCam.updateProjectionMatrix(); wake();
    const R=insetRect(); insetEl.style.width=insetEl.style.height=R.w+'px'; }
  function frame(view){
    if(!root) return;
    if(view==='34'&&current&&current.view34Under&&current.view34Under()) view='under';   // a ceiling is looked at from below
    if(view==='detail'&&current&&current.detail){ // close-up on the surface (perforated panels): the small picture in the corner keeps the whole panel in view
      const d=current.detail(); controls.target.copy(d.target); camera.position.copy(d.target).addScaledVector(d.dir,d.dist);
      controls.minDistance=40; controls.maxDistance=7000; camera.near=4; camera.far=30000; camera.updateProjectionMatrix(); controls.update(); wake(); return; }
    const bb=new THREE.Box3().setFromObject(root); if(bb.isEmpty()) return;
    const c=bb.getCenter(new THREE.Vector3()), s=bb.getSize(new THREE.Vector3()), r=Math.max(s.x,s.y,s.z);
    const aspect=host.clientWidth/Math.max(1,host.clientHeight), dist=(r*.74/Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))*Math.max(1,1.05/aspect);
    const V={'34':[38,20],front:[0,6],side:[90,6],top:[8,80],under:[38,-14]}[view||'34'];
    const az=V[0]*Math.PI/180, el=V[1]*Math.PI/180;
    controls.target.copy(c); camera.position.set(c.x+Math.sin(az)*Math.cos(el)*dist, c.y+Math.sin(el)*dist, c.z+Math.cos(az)*Math.cos(el)*dist);
    controls.minDistance=r*.18; controls.maxDistance=r*6; camera.near=Math.max(20,dist*.02); camera.far=Math.max(60000,dist*40); camera.updateProjectionMatrix(); controls.update(); wake();
  }

  // ================================================================= PRODUCT: wall & roof panel designer
  // Thickness, R-value (75°F mean) and weight (24/24 steel) are US Panels' own published engineering data (Specs page). Profile shapes are illustrative.
  const THICK=[['2″',50.8,14.08,2.48,2.85],['3″',76.2,21.13,3.72,3.04],['4″',101.6,28.17,4.96,3.22],['5″',127,35.21,6.20,3.41],['6″',152.4,42.25,7.44,3.60],['8″',203.2,56.34,9.92,3.97]];
  const PROFILES={
    flat:{n:'Flat',kind:'wall',d:'A smooth, unribbed face for the most minimal, monolithic appearance.',pts:()=>[[-500,0],[500,0]]},
    box:{n:'Box',kind:'wall',d:'Flat pans separated by narrow ribs, the cleanest, most contemporary look.',pts:()=>{ const p=[[-500,0]]; [-375,-125,125,375].forEach(c=>p.push([c-12,0],[c-8,8],[c+8,8],[c+12,0])); p.push([500,0]); return p; }},
    trap:{n:'Trapezoidal',kind:'wall',d:'Repeating angular ribs for a bold, structured profile with added rigidity.',pts:()=>{ const p=[[-500,0]]; [-375,-125,125,375].forEach(c=>p.push([c-35,0],[c-15,28],[c+15,28],[c+35,0])); p.push([500,0]); return p; }},
    emb:{n:'Embossed',kind:'wall',d:'A subtle textured stucco finish that hides minor surface imperfections.',pts:()=>[[-500,0],[500,0]],emboss:true},
    micro:{n:'Microrib',kind:'wall',d:'Fine, closely spaced ribs for a quiet, finely lined face.',pts:()=>{ const p=[[-500,0]]; for(let c=-500;c<500;c+=25) p.push([c+3,0],[c+7,2.5],[c+16,2.5],[c+20,0]); p.push([500,0]); return p; }},   // placeholder shape until the profile drawing arrives
    rib:{n:'Ribbed',kind:'wall',d:'Bold, evenly spaced ribs that give strong shadow lines and added stiffness.',pts:()=>{ const p=[[-500,0]]; for(let c=-450;c<=450;c+=100) p.push([c-22,0],[c-11,15],[c+11,15],[c+22,0]); p.push([500,0]); return p; }},   // placeholder shape until the profile drawing arrives
    cop:{n:'Cop Roof',kind:'roof',d:'A double-steel roof profile with standing ribs.',pts:()=>{ const p=[[-500,0]]; [-250,250].forEach(c=>{ p.push([c-45,0],[c-20,38],[c+20,38],[c+45,0]); }); p.push([500,0]); return p; }},
    grec:{n:'Grecata Roof',kind:'roof',d:'A corrugated roof profile with U-ribs, for long roof runs.',pts:()=>{ const p=[]; for(let x=-500;x<=500;x+=4){ const s=Math.sin(x/125*2*Math.PI); p.push([x,15*.5*(1+Math.tanh(2.6*s))]); } return p; }}
  };
  // keys = the profiles this section offers (Wall & Roof Panels: flat, embossed; Roof: Cop, Grecata)
  function buildDesigner(ctx,keys){
    keys=keys||Object.keys(PROFILES);
    const S={profile:keys[0],thick:2,color:'#E7EBDA'}; const rootG=new THREE.Group(); let inner=null;
    function make(){
      if(inner){ rootG.remove(inner); inner.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
      inner=new THREE.Group(); const P=PROFILES[S.profile], T=THICK[S.thick][1], y0=T/2, t=.8, LEN=P.kind==='roof'?2000:1800;
      const skin=steelMat(S.color); if(P.emboss){ skin.bumpMap=bumpNoise; skin.bumpScale=1.2; }
      const outer=P.pts().map(([x,o])=>[x,y0+o]), inn=outer.map(([x,y])=>[x,y-t]);
      const g=new THREE.Group();
      g.add(sh(new THREE.Mesh(extrude(outer.concat(inn.slice().reverse()),LEN),skin)));
      g.add(sh(new THREE.Mesh(extrude([[-500,-y0],[500,-y0],[500,-y0+t],[-500,-y0+t]],LEN),steelMat(S.color))));
      const core=inn.concat([[500,-y0+t],[-500,-y0+t]]); g.add(sh(new THREE.Mesh(extrude(core,LEN),foamMat())));
      if(P.kind==='wall'){ g.rotation.x=Math.PI/2; g.position.y=LEN/2; inner.add(g); }   // standing, face toward +Z
      else { // roof: panel on two purlins, tilted like a low-slope roof and lifted clear of the floor
        const holder=new THREE.Group(), pm=new THREE.MeshStandardMaterial({color:0x4b5058,roughness:.6,metalness:.4});
        holder.add(g); [-LEN*.3,LEN*.3].forEach(zz=>holder.add(box(1300,60,110,pm,0,-y0-30,zz)));
        holder.rotation.x=-.2618; inner.add(holder);
        const bb=new THREE.Box3().setFromObject(holder); holder.position.y=-bb.min.y+60; }
      rootG.add(inner); ctx.update(); wake(); }
    return { root:rootG, build:make,
      controls:[
        {type:'chips',label:'Profile',value:keys[0],options:keys.map(k=>({v:k,label:PROFILES[k].n})),onChange:v=>{S.profile=v;make();ctx.view('34');}},
        {type:'chips',label:'Thickness',value:2,options:THICK.map((t,i)=>({v:i,label:t[0]})),onChange:v=>{S.thick=v;make();}},
        {type:'swatches',label:'Color',value:'#E7EBDA',options:COLORS.map(c=>({v:c[1],label:c[0]})),onChange:v=>{S.color=v;make();}}],
      stats:()=>{ const T=THICK[S.thick]; return [['Profile',PROFILES[S.profile].n],['Thickness',T[0]+' ('+T[1].toFixed(0)+' mm)'],['Insulation at 75°F mean','R-'+T[2].toFixed(2)+' (RSI '+T[3].toFixed(2)+')'],['Weight, 24/24 steel',T[4].toFixed(2)+' psf ('+(T[4]*4.8824).toFixed(1)+' kg/m²)']]; },
      note:()=>PROFILES[S.profile].d+' Profile shapes are illustrative; R-value shown for reference, exact figures depend on core type and thickness.' };
  }

  // ================================================================= PRODUCT: doors (Blender-built models, models/doors/*.glb)
  // fam = the family the Doors page groups it under (Hinge Cooler, Sliding Cooler, Metal).
  const DOOR_TYPES=[
    {id:'hinged',fam:'hinge',label:'Hinge Cooler',blurb:'Insulated hinged door with a flush leaf, aluminum edge frame, gasketed rebate, heavy hinges and a key latch.',
     sizes:[['3×7','hinged-3x7','3′ × 7′','900 × 2,100 mm clear opening'],['4×7','hinged-4x7','4′ × 7′','1,200 × 2,100 mm clear opening'],['5×7','hinged-5x7','5′ × 7′','1,500 × 2,100 mm clear opening']],
     rows:[['Leaf','100 mm (3.94″) insulated, 0.5 mm steel faces'],['Frame','Aluminum edge frame, white door frame'],['Hardware','Hinges + key latch']]},
    {id:'double',fam:'hinge',label:'Double Hinge Cooler',blurb:'Two hinged leaves meeting at a gasketed center, with a key latch on the active leaf.',
     sizes:[['6×7','double-6x7','6′ × 7′','1,800 × 2,100 mm clear opening'],['8×7','double-8x7','8′ × 7′','2,400 × 2,100 mm clear opening'],['6×7 unequal','double-unequal-6x7','6′ × 7′, one-third / two-thirds leaves','1,800 × 2,100 mm clear opening']],
     rows:[['Leaf','100 mm (3.94″) insulated, 0.5 mm steel faces'],['Frame','Aluminum edge frame, white door frame'],['Hardware','Hinges + key latch on the active leaf']]},
    {id:'sliding',fam:'sliding',label:'Sliding Cooler',blurb:'Heavy-duty insulated sliding door hung from a top rail on roller hangers, in a gasketed U-shape frame, with a stainless pull handle and lock.',
     sizes:[['5×7','sliding-5x7','5′ × 7′','1,500 × 2,100 mm clear opening',1670],['6×7','sliding-6x7','6′ × 7′','1,800 × 2,100 mm clear opening',1970]],
     rows:[['Leaf','100 mm (3.94″) insulated, 0.5 mm steel faces'],['Frame','U-shape frame with gasket'],['Hardware','Top rail with roller hangers, floor guide, stainless pull handle + lock']]},
    {id:'office',fam:'metal',label:'Metal',blurb:'Flush insulated metal door in an aluminum frame with a lever handle and key cylinder.',
     sizes:[['2.5×7','office-25x7','2.5′ × 7′','762 × 2,100 mm clear opening'],['3×7','office-3x7','3′ × 7′','900 × 2,100 mm clear opening'],['4×7','office-4x7','4′ × 7′','1,200 × 2,100 mm clear opening']],
     rows:[['Leaf','0.5 mm steel faces, aluminum frame'],['Hardware','Lever handle + key cylinder, hinged, door closer']]},
    {id:'officed',fam:'metal',label:'Double Metal',blurb:'Two flush metal leaves in an aluminum frame.',
     sizes:[['6×7','office-double-6x7','6′ × 7′','1,800 × 2,100 mm clear opening']],
     rows:[['Leaf','0.5 mm steel faces, aluminum frame'],['Hardware','Lever handles, hinged, door closers']]},
    {id:'clean',fam:'metal',label:'Vision Window',blurb:'Flush metal door with a round vision window, aluminum frame and lever handle, for clean rooms and labs.',
     sizes:[['3×7','clean-3x7','3′ × 7′','900 × 2,100 mm clear opening']],
     rows:[['Leaf','50 mm (1.97″) polyurethane foam, 0.5 mm steel faces'],['Frame','Aluminum'],['Hardware','Lever handle, vision window, door closer']]},
    {id:'cleand',fam:'metal',label:'Double Vision Window',blurb:'Two flush metal leaves with round vision windows.',
     sizes:[['6×7','clean-double-6x7','6′ × 7′','1,800 × 2,100 mm clear opening']],
     rows:[['Leaf','50 mm (1.97″) polyurethane foam, 0.5 mm steel faces'],['Frame','Aluminum'],['Hardware','Lever handles, vision windows, door closers']]}];
  const DOOR_MATS={
    Door_steel_white:()=>new THREE.MeshPhysicalMaterial({color:0xe6e8e4,roughness:.42,metalness:.03,clearcoat:.15,clearcoatRoughness:.4,envMapIntensity:.55}),
    Frame_white:()=>new THREE.MeshStandardMaterial({color:0xe2e4e0,roughness:.5,envMapIntensity:.55}),
    Door_aluminum:()=>new THREE.MeshStandardMaterial({color:0xaeb2b6,roughness:.42,metalness:.6}),
    Frame_aluminum_light:()=>new THREE.MeshStandardMaterial({color:0xbfc2c5,roughness:.4,metalness:.6}),
    Hardware_dark:()=>new THREE.MeshStandardMaterial({color:0x2c2d30,roughness:.45,metalness:.1}),
    Hardware_light:()=>new THREE.MeshStandardMaterial({color:0x8d9298,roughness:.38,metalness:.5}),
    Stainless:()=>new THREE.MeshStandardMaterial({color:0xb7bbbf,roughness:.28,metalness:1}),
    Gasket_black:()=>new THREE.MeshStandardMaterial({color:0x111214,roughness:.7}),
    PIR_foam:()=>new THREE.MeshStandardMaterial({color:0xe9dcae,roughness:.9}),
    Release_green:()=>new THREE.MeshStandardMaterial({color:0x14a04a,roughness:.4}),
    Glass:()=>new THREE.MeshPhysicalMaterial({color:0xd8e9f2,roughness:.04,metalness:0,transparent:true,opacity:.22,depthWrite:false,envMapIntensity:1.6})};
  const doorCache={};
  function buildDoors(ctx){
    const S={type:'hinged',size:0,hand:'R',open:0,wall:true}; const rootG=new THREE.Group(); let model=null, pivots=[], walls=[], slideNode=null;
    const matc={}; const dm=n=>{ const k=(n||'').replace(/\.\d+$/,''); if(window.HPSP&&HPSP.has(k)) return HPSP.mat(k); return DOOR_MATS[k]?(matc[k]||(matc[k]=DOOR_MATS[k]())):null; };
    const T=()=>DOOR_TYPES.find(d=>d.id===S.type), Z=()=>T().sizes[Math.min(S.size,T().sizes.length-1)];
    function apply(){ pivots.forEach(p=>{ p.rotation.y=(p.position.x>0?1:-1)*S.open*Math.PI*.6; });
      if(slideNode) slideNode.position.x=-S.open*(Z()[4]||0)/1000;   // sliding doors: the leaf runs along the wall (travel in mm)
      walls.forEach(w=>{ w.visible=S.wall; }); if(model) model.scale.x=(S.hand==='L'?-1:1)*1000; wake(); }
    function place(gltf){
      if(model){ rootG.remove(model); }
      model=gltf.scene.clone(true); model.scale.setScalar(1000); pivots=[]; walls=[]; slideNode=null;
      model.traverse(o=>{ if(o.isMesh){ o.castShadow=o.receiveShadow=true; const m=o.material; if(window.HPSP&&!Array.isArray(m)) HPSP.prepare(o,m.name); o.material=Array.isArray(m)?m.map(x=>dm(x.name)||x):(dm(m.name)||m); }
        if(o.name==='pivotA'||o.name==='pivotB') pivots.push(o); if(o.name==='slideA') slideNode=o; if(/^Wall/.test(o.name)) walls.push(o); });
      rootG.add(model); apply(); ctx.update(); ctx.view('34');
      // start view for every door: from slightly left of the wall at eye level, the wall filling about two thirds of the width
      const bb=new THREE.Box3().setFromObject(model), size=bb.getSize(new THREE.Vector3()), cx=(bb.min.x+bb.max.x)/2;
      const az=-24*Math.PI/180, el=3*Math.PI/180, th=Math.tan(camera.fov*Math.PI/360), aspect=Math.max(.3,host.clientWidth/Math.max(1,host.clientHeight));
      const proj=size.x*Math.cos(az)+size.z*Math.abs(Math.sin(az));
      const dd=Math.max(proj/(.67*2*th*aspect), 2600/(.88*2*th));
      controls.target.set(cx,1250,0); camera.position.set(cx+Math.sin(az)*Math.cos(el)*dd,1250+Math.sin(el)*dd,Math.cos(az)*Math.cos(el)*dd);
      camera.near=Math.max(20,dd*.02); camera.far=Math.max(60000,dd*40); camera.updateProjectionMatrix(); controls.minDistance=1200; controls.maxDistance=dd*2.4; controls.update();
      host.classList.remove('loading'); wake();
    }
    function make(){
      const id=Z()[1], url='models/doors/'+id+'.glb';
      if(doorCache[id]) return place(doorCache[id]);
      host.classList.add('loading');
      new THREE.GLTFLoader().load(url,g=>{ doorCache[id]=g; if(Z()[1]===id) place(g); },undefined,()=>{ host.classList.remove('loading'); }); }
    function sizeOptions(){ return T().sizes.map((s,i)=>({v:i,label:s[0]})); }
    // sliding doors have no hinge: the same control says which way the leaf slides
    function syncHand(){ const sl=S.type==='sliding'; ctl.hand.label=sl?'Slides to':'Hinge side';
      ctl.hand.options=sl?[{v:'R',label:'Left'},{v:'L',label:'Right'}]:[{v:'R',label:'Right'},{v:'L',label:'Left'}]; S.hand='R'; ctl.hand.value='R'; }
    function setType(v,size){ if(!DOOR_TYPES.some(d=>d.id===v)) return; S.type=v; S.size=clamp(size|0,0,T().sizes.length-1); S.open=0; syncHand(); ctl.type.value=v; ctl.size.options=sizeOptions(); ctl.size.value=S.size; ctl.open.value=0; renderControls(ctlList); make(); ctx.update(); }
    const ctl={
      type:{type:'chips',label:'Door',value:'hinged',options:DOOR_TYPES.map(d=>({v:d.id,label:d.label})),onChange:v=>setType(v,0)},
      size:{type:'chips',label:'Size (ft)',value:0,options:sizeOptions(),onChange:v=>{ S.size=+v; make(); ctx.update(); }},
      hand:{type:'chips',label:'Hinge side',value:'R',options:[{v:'R',label:'Right'},{v:'L',label:'Left'}],onChange:v=>{ S.hand=v; apply(); }},
      open:{type:'slider',label:'Open',min:0,max:100,value:0,fmt:v=>v+'%',onChange:v=>{ S.open=v/100; apply(); }}};
    const ctlList=[ctl.type,ctl.size,ctl.hand,ctl.open,
      {type:'button',text:'Open / close',onClick:()=>{ const a=S.open>.5?0:1; tween(S.open,a,1800,v=>{ S.open=v; apply(); ctl.open.setValue&&ctl.open.setValue(Math.round(v*100)); }); }},
      {type:'toggle',label:'Wall',text:'Show the wall',value:true,onChange:v=>{ S.wall=v; apply(); }}];
    return { root:rootG, build:make, controls:ctlList, setType,
      title:()=>T().label+' Door', blurb:()=>T().blurb,
      stats:()=>{ const z=Z(); return [['Door',T().label],['Size',z[2]+' nominal ('+z[3]+')']].concat(T().rows); },
      note:()=>'Sizes shown are nominal. Full specifications are provided with every quote.' };
  }

  // ================================================================= PRODUCT: trim & hardware (Blender-built models from acc_assets.js)
  // Only the items US Panels lists: corner angles, T-bar and strut channel. fam = the family the Trim page groups it under.
  const TRIM=[
    {id:'al-l-40',label:'Corner Angle 40',fam:'corner'},{id:'al-l-50',label:'Corner Angle 50',fam:'corner'},{id:'al-outside-corner',label:'Outside Corner',fam:'corner'},
    {id:'al-inside-curved',label:'Inside Curved Angle',fam:'corner'},{id:'steel-corner-flashing',label:'Corner Flashing',fam:'corner'},
    {id:'al-t',label:'T-Bar',fam:'tbar'},{id:'strut-channel',label:'Strut Channel',fam:'hardware'}];
  function buildTrim(ctx){
    const META=(typeof ACC_META!=='undefined')?ACC_META:[], GLB=(typeof ACC_GLB!=='undefined')?ACC_GLB:{};
    const items=TRIM.filter(t=>GLB[t.id]); const rootG=new THREE.Group(); let inner=null, item=items.length?items[0].id:null; const cache={};
    // Inside curved angle (two pieces): the model shows the white cover lifted above the metal base; "Snap the cover" lowers it onto the fins (33.5 mm).
    const SNAP=.0335; let jn=0, cover=[];
    const applyJoint=()=>{ cover.forEach(o=>{ o.position.y=o.userData.baseY-SNAP*jn; }); wake(); };
    const jointCtl={type:'slider',label:'Cover',min:0,max:100,value:0,fmt:v=>v+'%',onChange:v=>{ jn=v/100; applyJoint(); }};
    const playCtl={type:'button',text:'Snap the cover on',onClick:()=>{ const a=jn>.5?0:1; tween(jn,a,2600,v=>{ jn=v; applyJoint(); jointCtl.setValue&&jointCtl.setValue(Math.round(v*100)); }); }};
    const itemCtl={type:'chips',label:'Item',value:item,options:items.map(a=>({v:a.id,label:a.label})),onChange:v=>setItem(v)};
    const ctlList=[itemCtl];
    function setItem(v){ if(!items.some(a=>a.id===v)) return; item=v; itemCtl.value=v; jn=0; jointCtl.value=0; ctlList.length=1; if(item==='al-inside-curved') ctlList.push(jointCtl,playCtl); renderControls(ctlList); make(); ctx.update(); }
    const mats={
      Alu:new THREE.MeshPhysicalMaterial({color:0xa9aeb0,metalness:.4,roughness:.3,clearcoat:.08}),
      Galv:new THREE.MeshStandardMaterial({color:0x9ea6af,metalness:.9,roughness:.34}),
      Mill:new THREE.MeshStandardMaterial({color:0xc2c7cb,metalness:.9,roughness:.34}),
      Cover:new THREE.MeshStandardMaterial({color:0xe6e8e6,metalness:.05,roughness:.42}),
      PVC:new THREE.MeshStandardMaterial({color:0xdfe1df,roughness:.38}),
      Steel:steelMat(0xe7ebda) };
    const b64=s=>{ const a=atob(s),u=new Uint8Array(a.length); for(let i=0;i<a.length;i++)u[i]=a.charCodeAt(i); return u.buffer; };
    function load(id,cb){
      if(cache[id]) return cb(cache[id].clone(true));
      new THREE.GLTFLoader().parse(b64(GLB[id]),'',g=>{ const m=g.scene; m.scale.setScalar(1000);
        m.traverse(o=>{ if(!o.isMesh) return; o.material=mats[o.name.replace(/\.?\d+$/,'')]||mats.Alu; o.castShadow=o.receiveShadow=true; });
        cache[id]=m; cb(m.clone(true)); }); }
    function make(){
      if(inner){ rootG.remove(inner); inner=null; }
      const id=item; if(!id) return;
      load(id,m=>{ if(id!==item) return; const g=new THREE.Group(); g.add(m);
        cover=[]; m.traverse(o=>{ if(o.isMesh&&/^Cover\d*$/.test(o.name)){ o.userData.baseY=o.position.y; cover.push(o); } }); applyJoint();
        const bb=new THREE.Box3().setFromObject(m), c=bb.getCenter(new THREE.Vector3()); m.position.set(-c.x,-bb.min.y,-c.z);   // stand on the floor, centred
        inner=g; rootG.add(g); ctx.update(); ctx.view('34');
        camera.position.lerpVectors(controls.target,camera.position,.62); controls.update(); wake(); });
    }
    const cur=()=>items.find(a=>a.id===item)||{label:''};
    return { root:rootG, build:()=>{ if(item==='al-inside-curved'&&ctlList.length===1){ ctlList.push(jointCtl,playCtl); renderControls(ctlList); } make(); }, controls:ctlList, setItem,
      title:()=>cur().label,
      stats:()=>{ const m=META.find(a=>a.id===item); return m?m.stats:[]; },
      note:()=>'Shown at a short display length. Custom sizes and colors are available.' };
  }

  // ================================================================= PRODUCT: Fireguard mineral wool panels (illustrative models)
  // Names, cores, joints, fastening and liners are the live product copy. The thickness, rib shape and perforation size are illustrative:
  // the perforation is drawn far larger than real so it can be seen. Replace with models from photos and data sheets when they arrive.
  const FG=[
    {id:'wall-exposed',label:'Wall: Exposed Fastening',kind:'wall',fast:true,joint:true,liner:false,
     blurb:'A self-supporting wall panel with a tongue-and-groove joint, insulated with mineral rockwool and secured with a visible through-fastened, saddle-washer system.',
     rows:[['Core','Mineral rockwool'],['Joint','Tongue-and-groove'],['Fastening','Visible, through-fastened with saddle washers']]},
    {id:'wall-hidden',label:'Wall: Hidden Fastening',kind:'wall',fast:false,joint:true,liner:false,
     blurb:'The same self-supporting mineral wool wall panel with a concealed fastening system on each side for a smooth, uninterrupted finish.',
     rows:[['Core','Mineral rockwool'],['Joint','Tongue-and-groove'],['Fastening','Concealed on each side']]},
    {id:'interior-acoustic',label:'Wall: Acoustic',kind:'wall',fast:true,joint:false,liner:true,
     blurb:'A mineral wool wall panel with a micro-perforated internal steel liner and visible fastening, tuned for sound absorption alongside fire resistance.',
     rows:[['Core','Mineral rockwool'],['Inside liner','Micro-perforated steel'],['Fastening','Visible']]},
    {id:'roof-fireguard',label:'Roof',kind:'roof',fast:false,joint:false,liner:false,
     blurb:'A self-supporting mineral wool roof panel rated for low-slope roofing, with an external ribbed steel sheet for added static and dynamic strength.',
     rows:[['Core','Mineral rockwool'],['Roof type','Self-supporting, rated for low slope'],['Outer face','External ribbed steel sheet']]},
    {id:'roof-acoustic',label:'Roof: Acoustic',kind:'roof',fast:false,joint:true,liner:true,
     blurb:'A self-supporting mineral wool roof panel with a micro-perforated interior liner and tongue-and-groove joint for added sound-dampening performance.',
     rows:[['Core','Mineral rockwool'],['Joint','Tongue-and-groove'],['Inside liner','Micro-perforated steel']]}];
  let woolTx=null, perfTx=null;
  function woolTexture(){ if(woolTx) return woolTx; const c=document.createElement('canvas'); c.width=c.height=512; const g=c.getContext('2d'); g.fillStyle='#b9ae7e'; g.fillRect(0,0,512,512);
    for(let i=0;i<2600;i++){ const x=Math.random()*512,y=Math.random()*512,l=10+Math.random()*34,a=(Math.random()-.5)*.7; g.strokeStyle=Math.random()<.5?'rgba(238,228,172,.3)':'rgba(92,80,48,.28)'; g.lineWidth=.6+Math.random()*1.2; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l); g.stroke(); }
    woolTx=new THREE.CanvasTexture(c); woolTx.wrapS=woolTx.wrapT=THREE.RepeatWrapping; woolTx.encoding=THREE.sRGBEncoding; woolTx.anisotropy=8; woolTx.repeat.set(1/110,1/110); return woolTx; }
  function perfTexture(){ if(perfTx) return perfTx; const c=document.createElement('canvas'); c.width=c.height=256; const g=c.getContext('2d'); g.fillStyle='#eef0ee'; g.fillRect(0,0,256,256);
    for(let y=16;y<256;y+=32) for(let x=16;x<256;x+=32){ g.fillStyle='#5d656c'; g.beginPath(); g.arc(x,y,7,0,7); g.fill(); g.fillStyle='rgba(255,255,255,.55)'; g.beginPath(); g.arc(x-1.5,y-2,2,0,7); g.fill(); }
    perfTx=new THREE.CanvasTexture(c); perfTx.wrapS=perfTx.wrapT=THREE.RepeatWrapping; perfTx.encoding=THREE.sRGBEncoding; perfTx.anisotropy=8; return perfTx; }
  function buildFireguard(ctx){
    const THK=100, SK=1.5, S={id:'wall-exposed',color:'#E7EBDA',layers:0,join:0}; const rootG=new THREE.Group(); let inner=null;
    const item=()=>FG.find(f=>f.id===S.id);
    function makePanel(P,LEN){
      const g=new THREE.Group(), y0=THK/2, yb=-y0+SK, skin=steelMat(S.color);
      const prof=P.kind==='roof'?(()=>{ const p=[[-500,0]]; [-375,-125,125,375].forEach(c=>p.push([c-45,0],[c-22,34],[c+22,34],[c+45,0])); p.push([500,0]); return p; })():[[-500,0],[500,0]];
      const outer=prof.map(([x,o])=>[x,y0+o]), inn=outer.map(([x,y])=>[x,y-SK]);
      const top=new THREE.Group(), mid=new THREE.Group(), low=new THREE.Group();
      top.add(sh(new THREE.Mesh(extrude(outer.concat(inn.slice().reverse()),LEN),skin)));
      if(P.fast){ const wm=new THREE.MeshStandardMaterial({color:0x9aa1a8,roughness:.35,metalness:.7}), hm=new THREE.MeshStandardMaterial({color:0x5b6269,roughness:.4,metalness:.6});
        for(let z=-LEN/2+250;z<LEN/2;z+=450) [-300,0,300].forEach(x=>{ const w=sh(new THREE.Mesh(new THREE.CylinderGeometry(15,15,3,20),wm)), h=sh(new THREE.Mesh(new THREE.CylinderGeometry(7,7,5,6),hm)); w.position.set(x,y0+1.5,z); h.position.set(x,y0+5,z); top.add(w,h); }); }
      // core: the tongue sticks out of the right edge and the groove cuts into the left edge (only on the panels whose copy names a joint)
      const tops=inn.map(p=>p.slice()), pts=[[-500,yb],[500,yb]];
      if(P.joint) pts.push([500,-15],[525,-15],[525,15],[500,15]);
      for(let i=tops.length-1;i>=0;i--) pts.push(tops[i]);
      if(P.joint) pts.push([-500,15],[-475,15],[-475,-15],[-500,-15]);
      const wool=new THREE.MeshStandardMaterial({map:woolTexture(),roughness:.95});
      mid.add(sh(new THREE.Mesh(extrude(pts,LEN),wool)));
      const side=steelMat(0xf2f3f0), face=P.liner?new THREE.MeshStandardMaterial({map:perfTexture(),roughness:.55,metalness:.25}):side;
      if(P.liner){ face.map=perfTexture().clone(); face.map.repeat.set(1000/96,LEN/96); face.map.needsUpdate=true; }
      low.add(sh(new THREE.Mesh(new THREE.BoxGeometry(1000,SK,LEN),[side,side,side,face,side,side])));
      low.children[0].position.y=-y0+SK/2;
      top.position.y=S.layers*120; low.position.y=-S.layers*120;
      g.add(top,mid,low); return g;
    }
    function make(){
      if(inner){ rootG.remove(inner); inner.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
      const P=item(), LEN=P.kind==='roof'?2000:1800; inner=new THREE.Group();
      const pair=new THREE.Group(), A=makePanel(P,LEN); pair.add(A);
      if(P.joint){ const B=makePanel(P,LEN); B.position.x=1000+S.join*300; pair.add(B); pair.position.x=-500; }
      if(P.kind==='wall'){ pair.rotation.x=Math.PI/2; pair.position.y=LEN/2; inner.add(pair); }
      else { const holder=new THREE.Group(), pm=new THREE.MeshStandardMaterial({color:0x4b5058,roughness:.6,metalness:.4});
        holder.add(pair); [-LEN*.3,LEN*.3].forEach(zz=>holder.add(box(P.joint?2500:1300,60,110,pm,0,-THK/2-30,zz)));
        holder.rotation.x=-.2618; inner.add(holder); const bb=new THREE.Box3().setFromObject(holder); holder.position.y=-bb.min.y+60; }
      rootG.add(inner); ctx.update(); wake();
    }
    const ctl={
      panel:{type:'chips',label:'Panel',value:S.id,options:FG.map(f=>({v:f.id,label:f.label})),onChange:v=>setPanel(v)},
      color:{type:'swatches',label:'Color',value:S.color,options:COLORS.map(c=>({v:c[1],label:c[0]})),onChange:v=>{ S.color=v; make(); }},
      layers:{type:'slider',label:'Pull the layers apart',min:0,max:100,value:0,fmt:v=>v+'%',onChange:v=>{ S.layers=v/100; make(); }},
      join:{type:'slider',label:'Join the panels',min:0,max:100,value:0,fmt:v=>(100-v)+'%',onChange:v=>{ S.join=v/100; make(); }}};
    const ctlList=[ctl.panel,ctl.color,ctl.layers,ctl.join];
    function setPanel(v){ if(!FG.some(f=>f.id===v)) return; S.id=v; S.layers=0; S.join=0; ctl.panel.value=v; ctl.layers.value=0; ctl.join.value=0;
      ctlList.length=0; ctlList.push(ctl.panel,ctl.color,ctl.layers); if(item().joint) ctlList.push(ctl.join); renderControls(ctlList); make(); ctx.update(); ctx.view('34'); }
    return { root:rootG, build:make, controls:ctlList, setPanel,
      title:()=>item().label, blurb:()=>item().blurb,
      stats:()=>[['Panel',item().label]].concat(item().rows,[['Color',(COLORS.find(c=>c[1]===S.color)||['',''])[0]]]),
      note:()=>item().blurb+' Shown at an illustrative thickness and profile, and the perforation is drawn far larger than real so you can see it. Thickness, weight and test data: call (405) 778-2808.' };
  }

  // ================================================================= PRODUCTS: Walls / Ceiling / Roof sections (panels built in Blender from the sample photos)
  // Cross sections come from js/panels-data.js, dumped from the same Blender models, drawn at true thickness (2 in mineral wool; PIR 2, 4, 6 or 8 in).
  // Each panel keeps its own core: mineral wool and PIR are separate items. The rib size on the exterior wall panel is read from a sample photo, and the hole size
  // on the interior panel is illustrative. Roof has no new panels yet: it points to the existing roof panels.
  let holeTx=null;
  function holeTexture(){ if(holeTx) return holeTx; const W=1024,H=887,c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,W,H); g.fillStyle='#3a4046';
    [[0,0],[512,0],[1024,0],[256,443.5],[768,443.5],[0,887],[512,887],[1024,887]].forEach(([x,y])=>{ g.beginPath(); g.arc(x,y,144,0,7); g.fill(); });
    holeTx=new THREE.CanvasTexture(c); holeTx.encoding=THREE.sRGBEncoding; holeTx.wrapS=holeTx.wrapT=THREE.RepeatWrapping; holeTx.repeat.set(1/6,1/5.196); holeTx.anisotropy=8; return holeTx; }   // one tile = 6 x 5.2 mm: holes 3 mm apart, 1.7 mm across (the size we model; confirm against the data sheet)
  const perfSteel=hex=>{ const m=steelMat(hex); m.map=holeTexture(); m.alphaMap=holeTexture(); m.alphaTest=.5; m.alphaToCoverage=true; m.side=THREE.DoubleSide; return m; };
  const NP={
    'mw-wall':{wall:'Exterior wall, mineral wool',t:'Exterior Wall Panel, Mineral Wool',color:'#6FA3D6',
     blurb:'An exterior wall panel with a mineral wool core, a painted steel outer face with two stepped ribs, a steel liner and a lapped joint.',
     rows:()=>[['Core','Mineral wool'],['Thickness','2 in (50.8 mm)'],['Cover width','1,000 mm (3.28 ft)'],['Faces','0.5 mm steel'],['Outer face','Two stepped ribs'],['Joint','Lapped']]},
    'mw-interior':{wall:'Interior wall, mineral wool',ceil:'Interior ceiling, mineral wool',t:'Interior Wall and Ceiling Panel, Mineral Wool',color:'#727375',
     blurb:'An interior wall and ceiling panel with a mineral wool core and micro-perforated steel, on one face or on both faces. The holes open the steel face to the mineral wool core.',
     rows:S=>[['Core','Mineral wool'],['Thickness','2 in (50.8 mm)'],['Cover width','1,000 mm (3.28 ft)'],['Steel','0.5 mm'],['Perforated',S.perf==='both'?'Both faces':'One face'],['Joint','Tongue-and-groove with gasket']]},
    'pir-imp':{wall:'PIR Insulated Metal Panel (IMP)',ceil:'PIR Insulated Metal Panel (IMP)',t:'PIR Insulated Metal Panel (IMP)',color:'#E7EBDA',
     blurb:'A rigid PIR foam core between 0.5 mm satin steel faces, with a locking tongue-and-groove joint, in ten colors and four thicknesses.',
     rows:S=>[['Core','PIR foam'],['Thickness',({'50.8':'2 in (50.8 mm)','101.6':'4 in (100 mm)','152.4':'6 in (150 mm)','203.2':'8 in (200 mm)'})[S.thick]],['Insulation value',S.thick==='101.6'?'R-30 (RSI 5.3)':'Call for this thickness'],['Cover width','1,000 mm (3.28 ft)'],['Faces','0.5 mm satin steel'],['Joint','Locking tongue-and-groove with gasket']]}};
  // Profile panels from the old Wall & Roof designer (same shapes and thickness table). They keep the designer's insulated build and R-value table; the
  // Microrib and Ribbed shapes are placeholders until the drawings arrive.
  const profRows=(key)=>S=>{ const T=THICK[S.pt]; return [['Profile',PROFILES[key].n],['Thickness',T[0]+' ('+T[1].toFixed(0)+' mm)'],['Insulation at 75°F mean','R-'+T[2].toFixed(2)+' (RSI '+T[3].toFixed(2)+')'],['Weight, 24/24 steel',T[4].toFixed(2)+' psf ('+(T[4]*4.8824).toFixed(1)+' kg/m²)']]; };
  [['trap','Trapezoidal','#E7EBDA'],['micro','Microrib','#E7EBDA'],['rib','Ribbed','#E7EBDA'],['box','Box','#E7EBDA']].forEach(([k,n,c])=>{ NP[k]={wall:n,t:n,color:c,prof:k,blurb:PROFILES[k].d,rows:profRows(k)}; });
  // Exterior Walls is one panel with two cores (PIR or mineral wool) and five profiles; the cores and profiles are chosen with chips, not listed as separate panels.
  const XCORE={pir:'PIR foam',mw:'Mineral wool'};
  const XPROF={flat:{n:'Flat',d:'A smooth, flat face for the most minimal, monolithic appearance.'},step:{n:'Stepped Rib',d:'A painted steel face with two stepped ribs.'},
    trap:{n:'Trapezoidal',d:PROFILES.trap.d},micro:{n:'Microrib',d:PROFILES.micro.d},rib:{n:'Ribbed',d:PROFILES.rib.d}};
  const THK_PIR={'50.8':'2 in (50.8 mm)','101.6':'4 in (100 mm)','152.4':'6 in (150 mm)','203.2':'8 in (200 mm)'};
  NP.xwall={wall:'Exterior wall',t:'Exterior Wall',color:'#6FA3D6',xw:true,blurb:'An insulated exterior wall panel.',
    rows:S=>{ const r=[['Core',XCORE[S.core]],['Profile',XPROF[S.wprof].n]];
      if(S.wprof==='step') return r.concat([['Thickness','2 in (50.8 mm)'],['Cover width','1,000 mm (3.28 ft)'],['Faces','0.5 mm steel'],['Joint','Lapped']]);
      // the other four profiles share the PIR IMP / interior panel build: same satin steel, tongue-and-groove joint with gasket, 100 mm PIR (2, 4, 6 or 8 in) or 2 in mineral wool
      return r.concat(S.core==='pir'?[['Thickness',THK_PIR[S.thick]],['Insulation value',S.thick==='101.6'?'R-30 (RSI 5.3)':'Call for this thickness'],['Cover width','1,000 mm (3.28 ft)'],['Faces','0.5 mm satin steel'],['Joint','Locking tongue-and-groove with gasket']]
        :[['Thickness','2 in (50.8 mm)'],['Cover width','1,000 mm (3.28 ft)'],['Faces','0.5 mm steel'],['Joint','Tongue-and-groove with gasket']]); }};
  const SECTIONS={walls:['xwall'],interior:['box'],ceiling:['pir-imp'],perf:['mw-interior']};
  const SECNAME={walls:'Exterior walls',interior:'Interior walls',ceiling:'Ceiling',perf:'Interior perforated'};
  const buildSection=kind=>function(ctx){
    const D=window.USPanelsData, ids=SECTIONS[kind], isPerf=kind==='perf', isWalls=kind==='walls'; let ceil=kind==='ceiling';
    const S={id:ids[0],color:NP[ids[0]].color,perf:isPerf?'one':'none',thick:'101.6',pt:2,core:'mw',wprof:'step',layers:0,join:0}, rootG=new THREE.Group(); let inner=null, pairRef=null;
    if(!D){ return {root:rootG,controls:[],stats:()=>[],title:()=>'',blurb:()=>'',note:()=>'The panel data did not load.'}; }
    const item=()=>NP[S.id], label=id=>(ceil&&NP[id].ceil)||NP[id].wall, mesh=(pts,LEN,mat)=>sh(new THREE.Mesh(extrude(pts,LEN),mat));
    // perforated section: a red ring on the small whole-panel picture marks where the close-up is looking (layer 1: only that picture draws it)
    const marker=isPerf?new THREE.Mesh(new THREE.RingGeometry(90,150,40),new THREE.MeshBasicMaterial({color:0xd8202f,side:THREE.DoubleSide,depthTest:false,transparent:true})):null;
    if(marker){ marker.layers.set(1); marker.renderOrder=10; rootG.add(marker); }
    function spot(){ // where the close-up looks: the perforated face, near the left edge of the first panel, with the edge in view
      const bb=new THREE.Box3(); if(pairRef){ pairRef.updateMatrixWorld(true); bb.setFromObject(pairRef.children[0]); } if(bb.isEmpty()) bb.set(new THREE.Vector3(-500,0,-30),new THREE.Vector3(500,1800,30));
      const sz=bb.getSize(new THREE.Vector3()), az=-35*Math.PI/180, el=(ceil?-58:14)*Math.PI/180;
      return { target:ceil?new THREE.Vector3(bb.min.x+60,bb.min.y,(bb.min.z+bb.max.z)/2):new THREE.Vector3(bb.min.x+60,bb.min.y+sz.y*.55,bb.max.z),
               normal:ceil?new THREE.Vector3(0,-1,0):new THREE.Vector3(0,0,1), dir:new THREE.Vector3(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)), dist:140 }; }
    function makePanel(LEN){
      const g=new THREE.Group(), top=new THREE.Group(), mid=new THREE.Group(), low=new THREE.Group(), wool=new THREE.MeshStandardMaterial({map:woolTexture(),roughness:.95});
      const gasket=()=>new THREE.MeshStandardMaterial({color:0x1b1b1e,roughness:.95});
      const profilePanel=(key,T,coreMat)=>{ // shaped steel skin, insulated core, flat liner (cover width 1,000 mm, x 0 to 1000 like the others)
        const P=PROFILES[key], y0=T/2, t=.8, outer=P.pts().map(([x,o])=>[x+500,y0+o]), inn=outer.map(([x,y])=>[x,y-t]);
        top.add(mesh(outer.concat(inn.slice().reverse()),LEN,steelMat(S.color)));
        low.add(mesh([[0,-y0],[1000,-y0],[1000,-y0+t],[0,-y0+t]],LEN,steelMat(S.color)));
        mid.add(mesh(inn.concat([[1000,-y0+t],[0,-y0+t]]),LEN,coreMat)); };
      if(isWalls){ const coreMat=S.core==='pir'?foamMat():wool;
        if(S.wprof==='step'){ const W=D.wall;
          top.add(mesh(W.skin,LEN,steelMat(S.color))); mid.add(mesh(W.wool,LEN,coreMat)); W.foam.forEach(f=>mid.add(mesh(f,LEN,foamMat()))); low.add(mesh(W.liner,LEN,steelMat('#C9CFD2')));
        } else { const th=S.core==='pir'?S.thick:'50.8', H=S.wprof==='flat'?D.hs[th]:D.prof[S.wprof][th];   // cross sections dumped from the Blender models
          top.add(mesh(H.top,LEN,steelMat(S.color))); low.add(mesh(H.bot,LEN,steelMat(S.color))); mid.add(mesh(H.core,LEN,coreMat)); mid.add(mesh(H.gasket,LEN,gasket()));
        }
      } else if(item().prof){ profilePanel(item().prof,THICK[S.pt][1],foamMat());
      } else { const H=D.hs[S.id==='pir-imp'?S.thick:'50.8'], interior=S.id==='mw-interior';
        // one perforated face = the face you see: the front of a wall, the underside of a ceiling
        const perfTop=interior&&(S.perf==='both'||(S.perf==='one'&&!ceil)), perfBot=interior&&(S.perf==='both'||(S.perf==='one'&&ceil));
        top.add(mesh(H.top,LEN,perfTop?perfSteel(S.color):steelMat(S.color))); low.add(mesh(H.bot,LEN,perfBot?perfSteel(S.color):steelMat(S.color)));
        mid.add(mesh(H.core,LEN,interior?wool:foamMat())); mid.add(mesh(H.gasket,LEN,new THREE.MeshStandardMaterial({color:0x1b1b1e,roughness:.95})));
      }
      top.position.y=S.layers*120; low.position.y=-S.layers*120; g.add(top,mid,low); return g;
    }
    function make(){
      if(inner){ rootG.remove(inner); inner.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
      const LEN=1800; inner=new THREE.Group(); const pair=new THREE.Group(); pair.add(makePanel(LEN));
      const B=makePanel(LEN); B.position.x=1000+S.join*300; pair.add(B); pair.position.x=-500;
      if(ceil){ pair.position.y=1500; }                                       // overhead, flat, outer face up, the inside face looks down at you
      else { pair.rotation.x=Math.PI/2; pair.position.y=LEN/2; }              // standing like a wall
      inner.add(pair); rootG.add(inner); pairRef=pair;
      if(marker){ pair.updateMatrixWorld(true); const sp=spot(); marker.position.copy(sp.target).addScaledVector(sp.normal,4); marker.rotation.set(ceil?Math.PI/2:0,0,0); }
      ctx.update(); wake();
    }
    const swatches=COLORS.map(c=>({v:c[1],label:c[0]})); if(!swatches.some(s=>s.v===NP['mw-wall'].color)) swatches.push({v:NP['mw-wall'].color,label:'Blue'});
    if(isPerf) swatches.unshift({v:NP['mw-interior'].color,label:'Silver'});   // draws as the silver of the panels in the 3D tour (about #BCBDC0 on screen; the viewer lights colors brighter than their hex)
    const ctl={
      item:{type:'chips',label:'Panel',value:S.id,options:ids.map(id=>({v:id,label:label(id)})),onChange:v=>setItem(v)},
      color:{type:'swatches',label:'Color',value:S.color,options:swatches,onChange:v=>{ S.color=v; make(); }},
      perf:{type:'chips',label:'Profile',value:S.perf,options:[{v:'one',label:'One face perforated'},{v:'both',label:'Both faces perforated'}],onChange:v=>{ S.perf=v; make(); }},
      use:{type:'chips',label:'Install as',value:'wall',options:[{v:'wall',label:'Interior wall'},{v:'ceiling',label:'Interior ceiling'}],onChange:v=>setUse(v)},
      thick:{type:'chips',label:'Thickness',value:S.thick,options:[{v:'50.8',label:'2″'},{v:'101.6',label:'4″'},{v:'152.4',label:'6″'},{v:'203.2',label:'8″'}],onChange:v=>{ S.thick=v; make(); }},
      pthick:{type:'chips',label:'Thickness',value:S.pt,options:THICK.map((t,i)=>({v:i,label:t[0]})),onChange:v=>{ S.pt=v; make(); }},
      core:{type:'chips',label:'Core',value:S.core,options:[{v:'pir',label:'PIR'},{v:'mw',label:'Mineral wool'}],onChange:v=>setCore(v)},
      wprof:{type:'chips',label:'Profile',value:S.wprof,options:Object.keys(XPROF).map(k=>({v:k,label:XPROF[k].n})),onChange:v=>setWProf(v)},
      layers:{type:'slider',label:'Pull the layers apart',min:0,max:100,value:0,fmt:v=>v+'%',onChange:v=>{ S.layers=v/100; make(); }},
      join:{type:'slider',label:'Join the panels',min:0,max:100,value:0,fmt:v=>(100-v)+'%',onChange:v=>{ S.join=v/100; make(); }}};
    const ctlList=[], list=()=>{ ctlList.length=0; if(ids.length>1) ctlList.push(ctl.item); if(isWalls) ctlList.push(ctl.core,ctl.wprof); if(isPerf) ctlList.push(ctl.perf,ctl.use); ctlList.push(ctl.color);
      if(isWalls){ if(S.wprof!=='step'&&S.core==='pir') ctlList.push(ctl.thick); }   // PIR comes in 2, 4, 6 and 8 in; mineral wool and the stepped rib panel are 2 in
      else { if(S.id==='pir-imp') ctlList.push(ctl.thick); if(item().prof) ctlList.push(ctl.pthick); }
      ctlList.push(ctl.layers,ctl.join); };
    function setCore(v){ if(!XCORE[v]) return; S.core=v; ctl.core.value=v; list(); renderControls(ctlList); make(); }
    function setWProf(v){ if(!XPROF[v]) return; S.wprof=v; ctl.wprof.value=v; list(); renderControls(ctlList); make(); ctx.view('34'); }
    const blurbNow=()=>isWalls?(S.core==='pir'?'A rigid PIR foam core between steel faces. ':'A mineral wool core between steel faces. ')+XPROF[S.wprof].d:item().blurb;
    function setItem(v){ if(ids.indexOf(v)<0) return; S.id=v; S.color=item().color; S.layers=0; S.join=0; ctl.item.value=v; ctl.color.value=S.color; ctl.layers.value=0; ctl.join.value=0;
      list(); renderControls(ctlList); make(); ctx.update(); ctx.view(ceil?'under':'34'); }
    function setUse(v){ ceil=v==='ceiling'; ctl.use.value=v; controls.maxPolarAngle=ceil?Math.PI*.8:Math.PI*.495; const ub=$('[data-view="under"]'); if(ub) ub.hidden=!ceil; make(); ctx.view('detail'); }
    function setFaces(v){ if(v!=='one'&&v!=='both') return; S.perf=v; ctl.perf.value=v; renderControls(ctlList); make(); }
    list();
    const secName=SECNAME[kind];
    return { root:rootG, build:make, controls:ctlList, setItem, setUse, setFaces, setCore, setWProf, defaultView:isPerf?'detail':(ceil?'under':'34'),
      detail:isPerf?spot:null, inset:isPerf?{az:22,el:()=>ceil?-30:9}:null, view34Under:isPerf?()=>ceil:null, below:()=>ceil,
      title:()=>isPerf?'Interior Perforated Walls and Ceilings (Sound Proof)':label(S.id), blurb:blurbNow,
      stats:()=>[['Panel',isPerf?'Interior perforated '+(ceil?'ceiling':'wall'):(isWalls?'Exterior wall, '+(S.core==='pir'?'PIR':'mineral wool')+', '+XPROF[S.wprof].n.toLowerCase():label(S.id))],['Section',secName]].concat(item().rows(S),[['Color',(swatches.find(c=>c.v===S.color)||{label:''}).label]]),
      note:()=>blurbNow()+(isPerf?' The big picture is a close-up, about 100 mm across, so you can see the holes. The small picture shows the whole panel, and the red ring marks where the close-up is looking. Hole size and pattern are drawn as we model them: call for the exact pattern.':' Drawn to scale from the Blender models.')+' Thickness, weight and test data: call (405) 778-2808.' };
  };

  // ================================================================= PRODUCT: architectural panels (single-skin, not insulated)
  // The four profiles are the same lines as js/arch.js (one 240 mm module, repeated). Sheet thickness, panel size and the three hole patterns are
  // placeholders until the specs are confirmed: the page says so and sends visitors to a quote for sizes, gauges and finishes.
  const AMOD=240, ADEG=Math.PI/180;
  const ARCH={
    wave:{n:'Soft Wave',dir:'v',d:'A smooth, continuous wave. Soft shadows that shift with the light across the day.',pts:()=>Array.from({length:49},(_,i)=>[i*5,14*(1-Math.cos(Math.PI*i*5/60))])},
    saw:{n:'Sawtooth',dir:'h',d:'Angled blades that catch the light on one side and shade the other. Hung horizontally it reads like layered louvers.',pts:()=>{ const p=[]; for(let b=0;b<3;b++) p.push([80*b,0],[80*b+62,26]); return p.concat([[240,0]]); }},
    flute:{n:'Flute',dir:'v',d:'Rounded half-round flutes in a steady rhythm. A rich, tactile surface with a crafted feel.',pts:()=>{ const p=[]; for(let b=0;b<4;b++){ const x=60*b; p.push([x,0],[x+7,0]); for(let a=8;a<173;a+=12) p.push([x+7+23*(1-Math.cos(a*ADEG)),19*Math.sin(a*ADEG)]); p.push([x+53,0]); } return p.concat([[240,0]]); }},
    pin:{n:'Pinstripe',dir:'h',d:'A flat face cut by fine, evenly spaced grooves. Quiet and modern, and it shows color and perforation best.',pts:()=>{ const p=[]; for(let b=0;b<6;b++){ const x=40*b; p.push([x,5],[x+34,5],[x+37,0]); } return p.concat([[240,5]]); }}};
  const APERF={solid:{n:'Solid'},fine:{n:'Fine',p:6,r:1.3},medium:{n:'Medium',p:9,r:2.3},bold:{n:'Bold',p:15,r:4.4}};   // hole pitch and radius, mm
  const aperfTx={};
  function archHoleTexture(k){ if(aperfTx[k]) return aperfTx[k]; const f=APERF[k], S=512, c=document.createElement('canvas'); c.width=c.height=S; const g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,S,S); g.fillStyle='#3a4046';
    const R=f.r/f.p*S; [[0,0],[S,0],[0,S],[S,S],[S/2,S/2]].forEach(([x,y])=>{ g.beginPath(); g.arc(x,y,R,0,7); g.fill(); });
    const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(1/f.p,1/f.p); t.anisotropy=8; return aperfTx[k]=t; }   // staggered holes, one tile = one pitch square
  function buildArch(ctx){
    const S={p:'wave',f:'solid',m:'steel',c:'#727375',d:'v'}, rootG=new THREE.Group(); let inner=null, panelRef=null;
    const T=1.5, MODS=4, LEN=1800;   // placeholder sheet thickness (mm), 4 modules wide (960 mm), 1.8 m long
    const marker=new THREE.Mesh(new THREE.RingGeometry(90,150,40),new THREE.MeshBasicMaterial({color:0xd8202f,side:THREE.DoubleSide,depthTest:false,transparent:true})); marker.layers.set(1); marker.renderOrder=10; rootG.add(marker);
    function spot(){ const bb=new THREE.Box3(); if(panelRef){ panelRef.updateMatrixWorld(true); bb.setFromObject(panelRef); } if(bb.isEmpty()) bb.set(new THREE.Vector3(-480,0,0),new THREE.Vector3(480,1800,30));
      const sz=bb.getSize(new THREE.Vector3()), az=-35*ADEG, el=14*ADEG;
      return { target:new THREE.Vector3(bb.min.x+130,bb.min.y+sz.y*.55,bb.max.z), normal:new THREE.Vector3(0,0,1), dir:new THREE.Vector3(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)), dist:300 }; }
    function sheetMat(){ const m=S.m==='alu'?new THREE.MeshPhysicalMaterial({color:S.c,roughness:.32,metalness:.28,clearcoat:.15,clearcoatRoughness:.3,envMapIntensity:.8}):steelMat(S.c);
      if(S.f!=='solid'){ m.map=archHoleTexture(S.f); m.alphaMap=archHoleTexture(S.f); m.alphaTest=.5; m.alphaToCoverage=true; m.side=THREE.DoubleSide; } return m; }
    function make(){
      if(inner){ rootG.remove(inner); inner.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
      inner=new THREE.Group(); const base=ARCH[S.p].pts(), pts=[];
      for(let m=0;m<MODS;m++) base.forEach(([x,h],i)=>{ if(m>0&&i===0) return; pts.push([x+m*AMOD-MODS*AMOD/2,h]); });
      const out=pts.map(([x,h])=>[x,h+T]), inn=pts.map(([x,h])=>[x,h]);
      const g=new THREE.Group(); g.add(sh(new THREE.Mesh(extrude(out.concat(inn.slice().reverse()),LEN),sheetMat())));
      g.rotation.x=Math.PI/2;                                  // standing, ribs run up and down, face toward +Z
      const holder=new THREE.Group(); holder.add(g); if(S.d==='h') holder.rotation.z=Math.PI/2;   // horizontal: ribs run left to right
      const bb=new THREE.Box3().setFromObject(holder); holder.position.set(-(bb.min.x+bb.max.x)/2,-bb.min.y,0);
      inner.add(holder); rootG.add(inner); panelRef=holder; holder.updateMatrixWorld(true);
      const sp=spot(); marker.position.copy(sp.target).addScaledVector(sp.normal,6);
      ctx.update(); wake();
    }
    const swatches=COLORS.map(c=>({v:c[1],label:c[0]})); swatches.unshift({v:'#727375',label:'Silver'});   // same silver as the 3D tour panels
    const ctl={
      p:{type:'chips',label:'Profile',value:S.p,options:Object.keys(ARCH).map(k=>({v:k,label:ARCH[k].n})),onChange:v=>setProfile(v)},
      f:{type:'chips',label:'Perforation',value:S.f,options:Object.keys(APERF).map(k=>({v:k,label:APERF[k].n})),onChange:v=>{ S.f=v; make(); }},
      m:{type:'chips',label:'Material',value:S.m,options:[{v:'steel',label:'Steel'},{v:'alu',label:'Aluminum'}],onChange:v=>{ S.m=v; make(); }},
      c:{type:'swatches',label:'Color',value:S.c,options:swatches,onChange:v=>{ S.c=v; make(); }},
      d:{type:'chips',label:'Direction',value:S.d,options:[{v:'v',label:'Vertical'},{v:'h',label:'Horizontal'}],onChange:v=>{ S.d=v; make(); ctx.view('detail'); }}};
    function setProfile(v){ if(!ARCH[v]) return; S.p=v; S.d=ARCH[v].dir; ctl.p.value=v; ctl.d.value=S.d; renderControls(list); make(); ctx.view('detail'); }
    const list=[ctl.p,ctl.f,ctl.m,ctl.c,ctl.d];
    return { root:rootG, build:make, controls:list, setProfile, defaultView:'detail', detail:spot, inset:{az:20,el:8},
      title:()=>'Architectural Panels', blurb:()=>ARCH[S.p].d,
      stats:()=>[['Panel','Architectural, '+ARCH[S.p].n],['Build','Single-skin metal sheet, not insulated'],['Material',S.m==='alu'?'Aluminum':'Steel'],['Perforation',S.f==='solid'?'Solid':APERF[S.f].n+' perforation'],['Direction',S.d==='v'?'Vertical':'Horizontal'],['Color',(swatches.find(c=>c.v===S.c)||{label:''}).label]],
      note:()=>'Single-skin architectural metal panels for interior and exterior walls, ceilings and facades. The big picture is a close-up of about one 240 mm module; the small picture shows the whole sample panel, and the red ring marks where the close-up is looking. Sheet thickness, sizes and hole patterns are drawn as placeholders: sizes, gauges and finishes are confirmed with your quote. Call (405) 778-2808.' };
  }

  // ---------------- registry + switching ----------------
  const reg={doors:buildDoors,trim:buildTrim,designer:ctx=>buildDesigner(ctx,['flat','emb']),fireguard:buildFireguard,walls:buildSection('walls'),ceiling:buildSection('ceiling'),perf:buildSection('perf'),interior:buildSection('interior'),arch:buildArch,roof:ctx=>buildDesigner(ctx,['cop','grec'])};
  const meta={
    doors:{t:'Doors',b:'Pick a door and a size, swing it open, and look at the hardware up close.'},
    trim:{t:'Trim & Hardware',b:'Pick an item and turn it around to see the profile up close.'},
    designer:{t:'Wall & Roof Panels',b:'Pick a profile, a thickness and a color. The insulation value and weight update with your choice.'},
    fireguard:{t:'Fire-Rated Panels',b:'Mineral wool panels for walls and roofs. Pick one, pull the layers apart, and join two panels edge to edge.'},
    walls:{t:'Exterior Walls',b:'Pick a core, PIR or mineral wool, then a profile and a color. Pull the layers apart and join two panels edge to edge.'},
    interior:{t:'Interior Walls',b:'Pick a color and a thickness, pull the layers apart, and join two panels edge to edge.'},
    ceiling:{t:'Ceiling',b:'Look up at a ceiling panel from below. Change the color or thickness, pull the layers apart and join two panels.'},
    arch:{t:'Architectural Panels',b:'Four profiles, solid or perforated, in steel or aluminum and ten colors.'},
    perf:{t:'Interior Perforated Walls & Ceilings (Sound Proof)',b:'Perforated on one face or on both. Start close to see the holes, then pick wall or ceiling and a color, pull the layers apart and join two panels.'},
    roof:{t:'Roof',b:'Pick a roof profile, a thickness and a color. The insulation value and weight update with your choice.'}
  };
  const offered=(host.dataset.products||'doors,trim,designer').split(',').map(s=>s.trim()).filter(k=>reg[k]);
  const multi=offered.length>1;
  function show(id){
    if(!reg[id]||offered.indexOf(id)<0) return;
    if(root){ scene.remove(root); root.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
    const ctx={update:()=>{ if(!current) return; frameInset(); renderStats(current.stats());
        if(ui.note) ui.note.textContent=current.note?current.note():'';
        if(ui.title) ui.title.textContent=(!multi&&current.title)?current.title():meta[currentId].t;
        if(ui.blurb) ui.blurb.textContent=(!multi&&current.blurb)?current.blurb():meta[currentId].b; },
      view:v=>frame(v)};
    zRemain=0; currentId=id; current=reg[id](ctx); root=current.root; scene.add(root); inset=current.inset||null; insetEl.hidden=!inset;
    const below=current.below?current.below():current.defaultView==='under';
    controls.maxPolarAngle=below?Math.PI*.8:Math.PI*.495; const ub=$('[data-view="under"]'); if(ub) ub.hidden=!below; const db=$('[data-view="detail"]'); if(db) db.hidden=!current.detail;
    renderControls(current.controls); if(current.build) current.build(); ctx.update(); frame(current.defaultView||'34');
    $$('.pick [data-id]').forEach(c=>{ const on=c.dataset.id===id; c.classList.toggle('on',on); c.setAttribute('aria-pressed',String(on)); });
    if(multi) history.replaceState(null,'','#'+id);
  }
  $$('.pick [data-id]').forEach(c=>c.addEventListener('click',e=>{ e.preventDefault(); show(c.dataset.id); }));
  $$('[data-view]').forEach(b=>b.addEventListener('click',()=>frame(b.dataset.view)));
  const rot=$('#rotb'); const setRot=on=>{ controls.autoRotate=on; if(rot){ rot.textContent=on?'Stop turning':'Turn it'; rot.classList.toggle('on',on); rot.setAttribute('aria-pressed',String(on)); } wake(); };
  if(rot){ setRot(false); rot.onclick=()=>setRot(!controls.autoRotate); }
  function resize(){ if(!host.clientWidth||!host.clientHeight) return; wake(1200); renderer.setSize(host.clientWidth,host.clientHeight,false); camera.aspect=host.clientWidth/host.clientHeight; camera.updateProjectionMatrix(); frameInset(); }
  if('ResizeObserver' in window) new ResizeObserver(()=>{ resize(); }).observe(host); else addEventListener('resize',resize);
  resize();
  // links can name a product and one item in it: showroom.html#doors/office, #trim/al-t, #fireguard/roof-acoustic
  const hashParts=()=>(location.hash||'').slice(1).split('/');
  function applySub(id,sub){ if(!sub||!current) return; if(id==='doors'&&current.setType) current.setType(sub,0); else if(id==='trim'&&current.setItem) current.setItem(sub); else if(id==='fireguard'&&current.setPanel) current.setPanel(sub); else if(id==='walls'&&current.setCore){ if(sub==='pir'||sub==='mw') current.setCore(sub); else current.setWProf(sub); } else if((id==='ceiling'||id==='interior')&&current.setItem) current.setItem(sub); else if(id==='perf'){ if(sub==='wall'||sub==='ceiling') current.setUse(sub); else current.setFaces(sub); } else if(id==='arch'&&current.setProfile) current.setProfile(sub); }
  const [start,startSub]=hashParts(); show(offered.indexOf(start)>=0?start:(offered.indexOf(host.dataset.start)>=0?host.dataset.start:offered[0])); if(offered.indexOf(start)>=0) applySub(currentId,startSub);
  addEventListener('hashchange',()=>{ const [h,sub]=hashParts(); if(multi&&offered.indexOf(h)>=0){ if(h!==currentId) show(h); applySub(h,sub); } });

  // what the pages can call: USP3D.door('sliding'), USP3D.trim('al-t'), USP3D.show('doors')
  window.USP3D={ show, types:DOOR_TYPES, trimItems:TRIM,    door:(type,size)=>{ if(currentId!=='doors') show('doors'); current.setType&&current.setType(type,size||0); },
    trim:id=>{ if(currentId!=='trim') show('trim'); current.setItem&&current.setItem(id); },
    fireguard:id=>{ if(currentId!=='fireguard') show('fireguard'); current.setPanel&&current.setPanel(id); },
    walls:id=>{ if(currentId!=='walls') show('walls'); current.setItem&&current.setItem(id); },
    ceiling:id=>{ if(currentId!=='ceiling') show('ceiling'); current.setItem&&current.setItem(id); },
    arch:profile=>{ if(currentId!=='arch') show('arch'); if(profile) current.setProfile(profile); },
    perf:(faces,use)=>{ if(currentId!=='perf') show('perf'); if(use) current.setUse(use); if(faces) current.setFaces(faces); } };
  document.dispatchEvent(new Event('usp3d-ready'));

  (function loop(now){ requestAnimationFrame(loop); if(document.hidden) return; if(controls.update()) wake(300,true); if(now>wakeUntil && now-lastBeat<600) return; lastBeat=now; setRes(now-lastMove<220?moveRatio:baseRatio);
    const W=host.clientWidth, H=host.clientHeight; renderer.setScissorTest(false); renderer.setViewport(0,0,W,H); renderer.render(scene,camera);
    if(inset){ const R=insetRect(); renderer.setScissorTest(true); renderer.setScissor(R.x,R.y,R.w,R.h); renderer.setViewport(R.x,R.y,R.w,R.h); renderer.setClearColor(0xcfd6dc,1);
      renderer.render(scene,insetCam); renderer.setClearColor(0x000000,0); renderer.setScissorTest(false); renderer.setViewport(0,0,W,H); } })();
})();

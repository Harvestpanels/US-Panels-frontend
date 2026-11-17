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
  // The wheel scrolls the page until the visitor clicks or touches the model; after that it zooms (and stops again when the pointer leaves).
  controls.enableZoom=false;
  renderer.domElement.addEventListener('pointerdown',()=>{ controls.enableZoom=true; host.classList.add('live'); });
  renderer.domElement.addEventListener('pointerleave',e=>{ if(e.pointerType==='mouse'){ controls.enableZoom=false; host.classList.remove('live'); } });

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
  function frame(view){
    if(!root) return; const bb=new THREE.Box3().setFromObject(root); if(bb.isEmpty()) return;
    const c=bb.getCenter(new THREE.Vector3()), s=bb.getSize(new THREE.Vector3()), r=Math.max(s.x,s.y,s.z);
    const aspect=host.clientWidth/Math.max(1,host.clientHeight), dist=(r*.74/Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))*Math.max(1,1.05/aspect);
    const V={'34':[38,20],front:[0,6],side:[90,6],top:[8,80]}[view||'34'];
    const az=V[0]*Math.PI/180, el=V[1]*Math.PI/180;
    controls.target.copy(c); camera.position.set(c.x+Math.sin(az)*Math.cos(el)*dist, c.y+Math.sin(el)*dist, c.z+Math.cos(az)*Math.cos(el)*dist);
    controls.minDistance=r*.35; controls.maxDistance=r*6; camera.near=Math.max(20,dist*.02); camera.far=Math.max(60000,dist*40); camera.updateProjectionMatrix(); controls.update(); wake();
  }

  // ================================================================= PRODUCT: wall & roof panel designer
  // Thickness, R-value (75°F mean) and weight (24/24 steel) are US Panels' own published engineering data (Specs page). Profile shapes are illustrative.
  const THICK=[['2″',50.8,14.08,2.48,2.85],['3″',76.2,21.13,3.72,3.04],['4″',101.6,28.17,4.96,3.22],['5″',127,35.21,6.20,3.41],['6″',152.4,42.25,7.44,3.60],['8″',203.2,56.34,9.92,3.97]];
  const PROFILES={
    flat:{n:'Flat',kind:'wall',d:'A smooth, unribbed face for the most minimal, monolithic appearance.',pts:()=>[[-500,0],[500,0]]},
    box:{n:'Box',kind:'wall',d:'Flat pans separated by narrow ribs, the cleanest, most contemporary look.',pts:()=>{ const p=[[-500,0]]; [-375,-125,125,375].forEach(c=>p.push([c-12,0],[c-8,8],[c+8,8],[c+12,0])); p.push([500,0]); return p; }},
    trap:{n:'Trapezoidal',kind:'wall',d:'Repeating angular ribs for a bold, structured profile with added rigidity.',pts:()=>{ const p=[[-500,0]]; [-375,-125,125,375].forEach(c=>p.push([c-35,0],[c-15,28],[c+15,28],[c+35,0])); p.push([500,0]); return p; }},
    emb:{n:'Embossed',kind:'wall',d:'A subtle textured stucco finish that hides minor surface imperfections.',pts:()=>[[-500,0],[500,0]],emboss:true},
    cop:{n:'Cop Roof',kind:'roof',d:'A double-steel roof profile with standing ribs.',pts:()=>{ const p=[[-500,0]]; [-250,250].forEach(c=>{ p.push([c-45,0],[c-20,38],[c+20,38],[c+45,0]); }); p.push([500,0]); return p; }},
    grec:{n:'Grecata Roof',kind:'roof',d:'A corrugated roof profile with U-ribs, for long roof runs.',pts:()=>{ const p=[]; for(let x=-500;x<=500;x+=4){ const s=Math.sin(x/125*2*Math.PI); p.push([x,15*.5*(1+Math.tanh(2.6*s))]); } return p; }}
  };
  function buildDesigner(ctx){
    const S={profile:'trap',thick:2,color:'#E7EBDA'}; const rootG=new THREE.Group(); let inner=null;
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
        {type:'chips',label:'Profile',value:'trap',options:Object.keys(PROFILES).map(k=>({v:k,label:PROFILES[k].n})),onChange:v=>{S.profile=v;make();ctx.view('34');}},
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

  // ---------------- registry + switching ----------------
  const reg={doors:buildDoors,trim:buildTrim,designer:buildDesigner,fireguard:buildFireguard};
  const meta={
    doors:{t:'Doors',b:'Pick a door and a size, swing it open, and look at the hardware up close.'},
    trim:{t:'Trim & Hardware',b:'Pick an item and turn it around to see the profile up close.'},
    designer:{t:'Wall & Roof Panels',b:'Pick a profile, a thickness and a color. The insulation value and weight update with your choice.'},
    fireguard:{t:'Fire-Rated Panels',b:'Mineral wool panels for walls and roofs. Pick one, pull the layers apart, and join two panels edge to edge.'}
  };
  const offered=(host.dataset.products||'doors,trim,designer').split(',').map(s=>s.trim()).filter(k=>reg[k]);
  const multi=offered.length>1;
  function show(id){
    if(!reg[id]||offered.indexOf(id)<0) return;
    if(root){ scene.remove(root); root.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
    const ctx={update:()=>{ if(!current) return; renderStats(current.stats());
        if(ui.note) ui.note.textContent=current.note?current.note():'';
        if(ui.title) ui.title.textContent=(!multi&&current.title)?current.title():meta[currentId].t;
        if(ui.blurb) ui.blurb.textContent=(!multi&&current.blurb)?current.blurb():meta[currentId].b; },
      view:v=>frame(v)};
    currentId=id; current=reg[id](ctx); root=current.root; scene.add(root);
    renderControls(current.controls); if(current.build) current.build(); ctx.update(); frame('34');
    $$('.pick [data-id]').forEach(c=>{ const on=c.dataset.id===id; c.classList.toggle('on',on); c.setAttribute('aria-pressed',String(on)); });
    if(multi) history.replaceState(null,'','#'+id);
  }
  $$('.pick [data-id]').forEach(c=>c.addEventListener('click',e=>{ e.preventDefault(); show(c.dataset.id); }));
  $$('[data-view]').forEach(b=>b.addEventListener('click',()=>frame(b.dataset.view)));
  const rot=$('#rotb'); const setRot=on=>{ controls.autoRotate=on; if(rot){ rot.textContent=on?'Stop turning':'Turn it'; rot.classList.toggle('on',on); rot.setAttribute('aria-pressed',String(on)); } wake(); };
  if(rot){ setRot(false); rot.onclick=()=>setRot(!controls.autoRotate); }
  function resize(){ if(!host.clientWidth||!host.clientHeight) return; wake(1200); renderer.setSize(host.clientWidth,host.clientHeight,false); camera.aspect=host.clientWidth/host.clientHeight; camera.updateProjectionMatrix(); }
  if('ResizeObserver' in window) new ResizeObserver(()=>{ resize(); }).observe(host); else addEventListener('resize',resize);
  resize();
  // links can name a product and one item in it: showroom.html#doors/office, #trim/al-t, #fireguard/roof-acoustic
  const hashParts=()=>(location.hash||'').slice(1).split('/');
  function applySub(id,sub){ if(!sub||!current) return; if(id==='doors'&&current.setType) current.setType(sub,0); else if(id==='trim'&&current.setItem) current.setItem(sub); else if(id==='fireguard'&&current.setPanel) current.setPanel(sub); }
  const [start,startSub]=hashParts(); show(offered.indexOf(start)>=0?start:(offered.indexOf(host.dataset.start)>=0?host.dataset.start:offered[0])); if(offered.indexOf(start)>=0) applySub(currentId,startSub);
  addEventListener('hashchange',()=>{ const [h,sub]=hashParts(); if(multi&&offered.indexOf(h)>=0){ if(h!==currentId) show(h); applySub(h,sub); } });

  // what the pages can call: USP3D.door('sliding'), USP3D.trim('al-t'), USP3D.show('doors')
  window.USP3D={ show, types:DOOR_TYPES, trimItems:TRIM,
    door:(type,size)=>{ if(currentId!=='doors') show('doors'); current.setType&&current.setType(type,size||0); },
    trim:id=>{ if(currentId!=='trim') show('trim'); current.setItem&&current.setItem(id); },
    fireguard:id=>{ if(currentId!=='fireguard') show('fireguard'); current.setPanel&&current.setPanel(id); } };
  document.dispatchEvent(new Event('usp3d-ready'));

  (function loop(now){ requestAnimationFrame(loop); if(document.hidden) return; if(controls.update()) wake(300,true); if(now>wakeUntil && now-lastBeat<600) return; lastBeat=now; setRes(now-lastMove<220?moveRatio:baseRatio); renderer.render(scene,camera); })();
})();

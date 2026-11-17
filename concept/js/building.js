/* US Panels walk-through building viewer.
   One page = one building (a "scene" file in js/scene-<name>.js). The visitor flips between Outside and Inside, spins the model,
   taps a numbered pin on any part, and the side sheet shows that product's info, its specs, "Add to my list" and a link to the 3D showroom.
   Everything except the 3D itself works without WebGL (the list in the sheet still opens every product).
   Page provides: #bview[data-scene] (canvas host, inside .bstage), #bpins, #bsheet, .bmode [data-mode] buttons, and the product cards
   (.opt[data-id][data-name] with .im img, .k, h3, p) that supply each product's title, picture and words.
   A scene file registers itself as USPB.scenes[name] = { modes, views, parts, info, build(H) } (see scene-data-center.js).
   three.js and OrbitControls are loaded only when the stage is about to scroll into view. Units in the scene: metres. */
(function(){
  const host=document.getElementById('bview'); if(!host) return;
  const stage=host.closest('.bstage'), pinsEl=document.getElementById('bpins'), sheet=document.getElementById('bsheet');
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)), ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  const NAME=host.dataset.scene||'data-center';
  const U=window.USPB=window.USPB||{scenes:{}};
  let S=null, mode='out', sel=null, td=null;     // scene definition, current view, selected part key, 3D api (once ready)
  const el=(tag,cls,txt)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; };
  const loadJS=src=>new Promise((ok,no)=>{ const s=document.createElement('script'); s.src=src; s.onload=ok; s.onerror=()=>no(new Error(src)); document.head.appendChild(s); });
  const card=pid=>document.querySelector('.opt[data-id="'+pid+'"]');
  const nameOf=pid=>{ const c=card(pid); return c?c.dataset.name:pid; };
  const partOf=key=>S.parts.find(p=>p.key===key);

  /* ---------------- the sheet (works without 3D) ---------------- */
  function renderList(){
    const m=S.modes[mode], w=el('div'); w.style.cssText='display:flex;flex-direction:column;gap:16px';
    w.append(el('p','mono bs-eye',m.label+' view'),el('h3',null,m.title),el('p','bs-lead',m.lead));
    const ol=el('ol','bs-parts');
    S.parts.filter(p=>p.mode===mode).forEach(p=>{
      const li=el('li'), b=el('button','bs-part'), t=el('span','t');
      b.type='button'; b.dataset.key=p.key; t.append(el('b',null,p.label),el('small',null,nameOf(p.pid)));
      b.append(el('i',null,String(p.n)),t); b.onclick=()=>select(p.key); li.append(b); ol.append(li);
    });
    w.append(ol); sheet.replaceChildren(w);
  }
  function renderDetail(p){
    const c=card(p.pid), info=S.info[p.pid]||{}, w=el('div'); w.style.cssText='display:flex;flex-direction:column;gap:16px';
    const back=el('button','bs-back','← All parts in this view'); back.type='button'; back.onclick=()=>select(null);
    w.append(back);
    const src=c&&$('.im img',c);
    if(src){ const im=el('div','bs-img'+(/\bdoor\b/.test($('.im',c).className)?' door':'')+(/\btrim\b/.test($('.im',c).className)?' trim':'')), i=new Image(); i.src=src.getAttribute('src'); i.alt=src.alt||''; im.append(i); w.append(im); }
    w.append(el('p','bs-k',p.n+' · '+p.label));
    w.append(el('h3',null,c?$('h3',c).textContent:p.pid));
    if(c&&$('p',c)) w.append(el('p','bs-desc',$('p',c).textContent));
    if(info.specs&&info.specs.length){ const dl=el('dl','bs-specs'); info.specs.forEach(([k,v])=>{ const r=el('div'); r.append(el('dt',null,k),el('dd',null,v)); dl.append(r); }); w.append(dl); }
    if(info.note) w.append(el('p','bs-note',info.note));
    const acts=el('div','bs-acts');
    if(info.showroom){ const a=el('a','btn red','View in 3D showroom'); a.href=info.showroom; acts.append(a); }
    if(window.USPList){ const b=el('button','add'); b.type='button'; b.innerHTML='<span class="ic" aria-hidden="true"></span><span class="lbl"></span>'; b.dataset.pid=p.pid; b.onclick=()=>{ USPList.toggle(p.pid); }; acts.append(b); }
    w.append(acts); sheet.replaceChildren(w); syncAdd();
  }
  function syncAdd(){ const b=$('.add[data-pid]',sheet); if(!b||!window.USPList) return; const on=USPList.has(b.dataset.pid); b.setAttribute('aria-pressed',String(on)); $('.lbl',b).textContent=on?'In my list':'Add to my list'; }
  document.addEventListener('usplist',syncAdd);

  function select(key,fly=true){
    const want=key&&partOf(key); if(want&&want.mode!==mode) setMode(want.mode,true);   // a part from the other view: switch views first
    sel=key; const p=want;
    if(p) renderDetail(p); else renderList();
    $$('.pin',pinsEl).forEach(b=>{ const on=b.dataset.key===key; b.classList.toggle('sel',on); b.setAttribute('aria-pressed',String(on)); });
    if(td){ td.highlight(p?p.pid:null); if(p&&fly) td.fly(p.view,p.mode); }
  }
  function setMode(m,instant){
    if(m===mode&&!instant) return;
    const apply=()=>{
      mode=m; sel=null;
      $$('.bmode [data-mode]').forEach(b=>{ const on=b.dataset.mode===m; b.classList.toggle('on',on); b.setAttribute('aria-pressed',String(on)); });
      $$('.pin',pinsEl).forEach(b=>{ b.hidden=partOf(b.dataset.key).mode!==m; b.classList.remove('sel'); });
      renderList(); if(td){ td.highlight(null); td.setMode(m); } stage.classList.remove('swap');
    };
    if(td&&!reduce&&!instant){ stage.classList.add('swap'); setTimeout(apply,220); } else apply();
  }
  function buildPins(){
    S.parts.forEach(p=>{
      const b=el('button','pin'); b.type='button'; b.dataset.key=p.key; b.dataset.label=p.label; b.hidden=p.mode!==mode;
      b.setAttribute('aria-label',p.label+': '+nameOf(p.pid)); b.setAttribute('aria-pressed','false'); b.append(el('span',null,String(p.n)));
      b.onclick=()=>select(sel===p.key?null:p.key); pinsEl.append(b);
    });
  }
  function fail(msg){ stage.classList.remove('loading'); stage.classList.add('no3d'); host.textContent=msg||'3D is not available in this browser. Pick a part from the list.'; pinsEl.hidden=true; $$('.bhint,.bcap',stage).forEach(e=>e.remove()); }

  /* ---------------- 3D ---------------- */
  function init3D(){
    const T=window.THREE;
    const lowGPU=(()=>{ try{ const c=document.createElement('canvas'), g=c.getContext('webgl')||c.getContext('experimental-webgl'); if(!g) return false; const d=g.getExtension('WEBGL_debug_renderer_info'), n=d?String(g.getParameter(d.UNMASKED_RENDERER_WEBGL)):''; const lose=g.getExtension('WEBGL_lose_context'); if(lose) lose.loseContext(); return /Intel|Mesa|llvmpipe|SwiftShader|Basic Render|Adreno \(?[0-4]|Mali-[T4]|PowerVR/i.test(n); }catch(e){ return false; } })();
    let renderer; try{ renderer=new T.WebGLRenderer({antialias:true}); }catch(e){ return fail(); }
    const baseRatio=Math.min(devicePixelRatio,lowGPU?1.25:1.75), moveRatio=Math.min(baseRatio,1);
    renderer.setPixelRatio(baseRatio); renderer.outputEncoding=T.sRGBEncoding; renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=.85;
    renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);
    const SKY=0xc9d7e3, scene=new T.Scene(), fogOut=new T.Fog(SKY,260,820); scene.background=new T.Color(SKY); scene.fog=fogOut;
    const camera=new T.PerspectiveCamera(32,1,.3,1500);
    const controls=new T.OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true; controls.dampingFactor=.08; controls.enablePan=false; controls.enableZoom=false;
    let zoomOK=false;   // the wheel scrolls the page until the visitor clicks or touches the model (outside view only)
    renderer.domElement.addEventListener('pointerdown',()=>{ zoomOK=true; if(mode==='out') controls.enableZoom=true; });
    renderer.domElement.addEventListener('pointerleave',e=>{ if(e.pointerType==='mouse'){ zoomOK=false; controls.enableZoom=false; } });

    // render only while something moves (the GPU idles otherwise); skip entirely while the stage is off screen
    let wakeUntil=performance.now()+4000, lastMove=0, lastBeat=0, onScreen=true;
    const wake=(ms=3000,motion=false)=>{ const t=performance.now(); wakeUntil=Math.max(wakeUntil,t+ms); if(motion) lastMove=t; };
    ['pointerdown','pointermove','wheel','keydown','click','touchstart'].forEach(ev=>stage.addEventListener(ev,()=>wake(ev==='pointermove'?500:3000),{passive:true,capture:true}));
    if('IntersectionObserver' in window) new IntersectionObserver(es=>{ onScreen=es[0].isIntersecting; if(onScreen) wake(); }).observe(stage);

    // lights and reflections
    const hemi=new T.HemisphereLight(0xeaf1f8,0x7d8478,.3); scene.add(hemi);
    const key=new T.DirectionalLight(0xfff4e4,1.75); key.position.set(-85,82,70); key.castShadow=true;
    key.shadow.mapSize.set(lowGPU?1024:2048,lowGPU?1024:2048); { const c=key.shadow.camera; c.left=-110;c.right=110;c.top=110;c.bottom=-110;c.near=20;c.far=320; }
    key.shadow.bias=-.0004; key.shadow.normalBias=.15; key.shadow.radius=3; scene.add(key);
    const fill=new T.DirectionalLight(0xdfe8ff,.35); fill.position.set(80,30,-20); scene.add(fill);
    const envTex=(()=>{ const es=new T.Scene();
      es.add(new T.Mesh(new T.SphereGeometry(50,32,16),new T.MeshBasicMaterial({color:new T.Color(.62,.65,.7),side:T.BackSide})));
      const b=(w,h,x,y,z,i)=>{ const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(i,i,i),side:T.DoubleSide})); m.position.set(x,y,z); m.lookAt(0,0,0); es.add(m); };
      b(30,18,-25,22,25,5); b(24,14,28,10,12,3); b(40,10,0,40,0,4);
      const pm=new T.PMREMGenerator(renderer), tx=pm.fromScene(es,.02).texture; pm.dispose(); return tx; })();
    scene.environment=envTex;

    // helpers the scene file builds with
    const mats={};   // product id -> materials that light up when its pin is selected
    const H={ T, renderer,
      reg:(pid,...ms)=>{ ms.forEach(m=>{ (mats[pid]=mats[pid]||[]).push(m); }); return ms[0]; },
      ct:(w,h,draw)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h);
        const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.encoding=T.sRGBEncoding; t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy()); return t; },
      rep:(t,u,v)=>{ const c=t.clone(); c.repeat.set(u,v); c.needsUpdate=true; return c; },
      lights:[] };
    let built;
    try{ built=S.build(H); }catch(e){ console.error(e); return fail('The 3D view could not start. Pick a part from the list.'); }
    scene.add(built.root); const inLights=H.lights; inLights.forEach(l=>{ built.inn.add(l); });

    // pins follow their spot on the building
    const v3=new T.Vector3(), tmp=new T.Vector3();
    const pinEls=$$('.pin',pinsEl).map(b=>{ const p=partOf(b.dataset.key); return {b,p,at:new T.Vector3(...p.at),face:p.face?new T.Vector3(...p.face):null}; });
    function updatePins(){
      const w=host.clientWidth, h=host.clientHeight;
      pinEls.forEach(({b,p,at,face})=>{
        if(p.mode!==mode) return;
        v3.copy(at).project(camera);
        let ok=v3.z<1&&Math.abs(v3.x)<1.04&&Math.abs(v3.y)<1.04;
        if(ok&&face){ tmp.copy(camera.position).sub(at); ok=tmp.dot(face)>0; }
        b.classList.toggle('back',!ok);
        b.style.transform='translate3d('+((v3.x*.5+.5)*w).toFixed(1)+'px,'+((-v3.y*.5+.5)*h).toFixed(1)+'px,0)';
      });
    }

    // camera
    const target=new T.Vector3(), pos=new T.Vector3(), dir=new T.Vector3();
    function lookTarget(view,m,out){ // inside the building the camera turns in place: the orbit target sits half a metre in front of it
      out.set(...view.look); if(m==='in'){ dir.set(...view.look).sub(pos.set(...view.pos)).normalize(); out.copy(pos).addScaledVector(dir,.5); } return out; }
    function configure(m){
      if(m==='in'){ camera.fov=64; camera.near=.08; controls.rotateSpeed=-.5; controls.minDistance=controls.maxDistance=.5; controls.minPolarAngle=.08; controls.maxPolarAngle=Math.PI-.08; controls.enableZoom=false; }
      else { camera.fov=32; camera.near=.5; controls.rotateSpeed=.8; controls.minDistance=24; controls.maxDistance=260; controls.minPolarAngle=.15; controls.maxPolarAngle=Math.PI*.485; controls.enableZoom=zoomOK; }
      camera.updateProjectionMatrix();
    }
    // on a tall, narrow stage (a phone) the outside camera backs off so the whole building still fits across
    function adj(view,m,close){ const p=new T.Vector3(...view.pos); if(m==='out'){ const l=new T.Vector3(...view.look), a=host.clientWidth/Math.max(1,host.clientHeight), k=a<1.35?Math.min(2,1.35/a):1;
        p.sub(l).multiplyScalar(close?1+(k-1)*.35:k).add(l); } return p; }
    function place(view,m){ lookTarget(view,m,target); pos.copy(adj(view,m)); camera.position.copy(pos); controls.target.copy(target); configure(m); controls.update(); wake(); }
    let flying=0;
    function fly(view,m){
      const p1=adj(view,m,true), t1=lookTarget(view,m,new T.Vector3()), p0=camera.position.clone(), t0=controls.target.clone();
      const d0=t0.clone().sub(p0).normalize(), d1=t1.clone().sub(p1).normalize();
      if(reduce){ camera.position.copy(p1); controls.target.copy(t1); controls.update(); wake(); return; }
      const id=++flying, t00=performance.now(), ms=950; controls.enabled=false;
      (function f(n){ if(id!==flying) return; wake(300,true); const k=ease(clamp((n-t00)/ms,0,1));
        camera.position.lerpVectors(p0,p1,k);
        if(m==='in'){ const d=d0.clone().lerp(d1,k).normalize(); controls.target.copy(camera.position).addScaledVector(d,.5); } else controls.target.lerpVectors(t0,t1,k);
        controls.update(); if(k<1) requestAnimationFrame(f); else controls.enabled=true; })(t00);
    }

    td={
      highlight:pid=>{ Object.keys(mats).forEach(k=>mats[k].forEach(m=>{ const on=k===pid; m.emissive.setHex(on?0x8a1a26:0); m.emissiveIntensity=on?.4:0; })); wake(); },
      setMode:m=>{
        flying++; controls.enabled=true;
        built.out.visible=m==='out'; built.inn.visible=m==='in';
        key.visible=fill.visible=(m==='out'); hemi.intensity=m==='out'?.3:.5;
        scene.environment=m==='out'?envTex:null; scene.fog=m==='out'?fogOut:null;
        place(S.views[m],m); updatePins();
      },
      fly:(v,m)=>{ fly(v,m); }
    };
    stage.classList.remove('loading');
    function resize(){ if(!host.clientWidth||!host.clientHeight) return; wake(1200); renderer.setSize(host.clientWidth,host.clientHeight,false); camera.aspect=host.clientWidth/host.clientHeight; camera.updateProjectionMatrix(); }
    if('ResizeObserver' in window) new ResizeObserver(resize).observe(host); else addEventListener('resize',resize);
    resize(); td.setMode(mode);
    const setRes=r=>{ if(renderer.getPixelRatio()!==r){ renderer.setPixelRatio(r); renderer.setSize(host.clientWidth,host.clientHeight,false); } };
    (function loop(now){ requestAnimationFrame(loop); if(document.hidden||!onScreen) return; if(controls.update()) wake(300,true);
      if(now>wakeUntil&&now-lastBeat<600) return; lastBeat=now; setRes(now-lastMove<220?moveRatio:baseRatio); renderer.render(scene,camera); updatePins(); })(performance.now());
    window.USPB.view={ select:k=>select(k), mode:m=>setMode(m), camera, controls, scene, wake, ready:true };   // for the pages and for testing
  }
  function boot3D(){
    stage.classList.add('loading');
    loadJS('vendor/three/three.min.js').then(()=>loadJS('vendor/three/OrbitControls.js')).then(init3D).catch(()=>fail('The 3D view could not load. Pick a part from the list.'));
  }

  /* ---------------- start ---------------- */
  loadJS('js/scene-'+NAME+'.js').then(()=>{
    S=U.scenes[NAME]; if(!S) throw new Error('scene');
    buildPins(); $$('.bmode [data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
    mode=$('.bmode .on')?$('.bmode .on').dataset.mode:'out'; setMode(mode,true);
    if('IntersectionObserver' in window){ const io=new IntersectionObserver(es=>{ if(es[0].isIntersecting){ io.disconnect(); boot3D(); } },{rootMargin:'500px 0px'}); io.observe(stage); } else boot3D();
  }).catch(()=>fail());
})();

/* 360-degree tour viewer: shows equirectangular panoramas (rendered in Blender) with drag-to-look, wheel / pinch zoom, and a fade when you step to the next spot.
   Plain WebGL, no libraries. World coordinates are Blender's (x east, y north, z up, metres); the centre of each panorama looks along +y and the right of centre is +x,
   which is how the Blender equirectangular camera is set up in scripts/uspanels_datacenter.py (--pano).
   USPTour.mount(host, {stations:{id:{src,pos:[x,y,z],yaw,pitch}}}) -> { goTo(id,{yaw,pitch,instant}), project([x,y,z]) -> {x,y,visible}, onFrame(fn), station, lookAt([x,y,z]) } or null without WebGL. */
(function(){
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)), rad=d=>d*Math.PI/180;
  const VS='attribute vec2 a;varying vec2 v;void main(){v=a;gl_Position=vec4(a,0.,1.);}';
  const FS='precision highp float;varying vec2 v;uniform sampler2D t0,t1;uniform float mx,tn,asp;uniform vec3 F,R,U;'
    +'vec4 look(sampler2D t,vec3 d){float lon=atan(d.x,d.y),lat=asin(clamp(d.z,-1.,1.));return texture2D(t,vec2(lon/6.2831853+.5,lat/3.1415927+.5));}'
    +'void main(){vec3 d=normalize(F+R*(v.x*asp*tn)+U*(v.y*tn));gl_FragColor=mix(look(t0,d),look(t1,d),mx);}';

  function mount(host,opts){
    const canvas=document.createElement('canvas'); canvas.className='btour';
    const gl=canvas.getContext('webgl',{antialias:false,alpha:false})||canvas.getContext('experimental-webgl');
    if(!gl) return null;
    function sh(type,src){ const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s); return gl.getShaderParameter(s,gl.COMPILE_STATUS)?s:null; }
    const vs=sh(gl.VERTEX_SHADER,VS), fs=sh(gl.FRAGMENT_SHADER,FS); if(!vs||!fs) return null;
    const pg=gl.createProgram(); gl.attachShader(pg,vs); gl.attachShader(pg,fs); gl.linkProgram(pg); if(!gl.getProgramParameter(pg,gl.LINK_STATUS)) return null;
    gl.useProgram(pg);
    const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(pg,'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const U={}; ['t0','t1','mx','tn','asp','F','R','U'].forEach(n=>{ U[n]=gl.getUniformLocation(pg,n); });
    gl.uniform1i(U.t0,0); gl.uniform1i(U.t1,1);
    host.appendChild(canvas);

    const maxTex=gl.getParameter(gl.MAX_TEXTURE_SIZE);
    function makeTex(unit){ const t=gl.createTexture(); gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D,t);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR); return t; }
    const tex=[makeTex(0),makeTex(1)];
    const cache={};          // id -> HTMLImageElement
    const S=opts.stations;
    let cur=null, curId=null, yaw=0, pitch=0, fov=72, mix=0, dirty=true, vel={y:0,p:0}, anim=null, dragging=false, frameCbs=[], loadingId=null;
    const api={ station:null, onFrame:fn=>{ frameCbs.push(fn); }, fovRange:[38,100] };

    function upload(unit,img){ gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D,tex[unit]);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img); }
    function load(id){ return new Promise((ok,no)=>{ if(cache[id]) return ok(cache[id]); const i=new Image(); i.crossOrigin='anonymous'; i.onload=()=>{ cache[id]=i; ok(i); }; i.onerror=()=>no(new Error(id)); i.src=S[id].src; }); }

    function basis(){ const cp=Math.cos(pitch), sp=Math.sin(pitch), sy=Math.sin(yaw), cy=Math.cos(yaw);
      return { F:[sy*cp,cy*cp,sp], R:[cy,-sy,0], U:[-sy*sp,-cy*sp,cp] }; }
    function resize(){ const w=host.clientWidth, h=host.clientHeight; if(!w||!h) return; const r=Math.min(devicePixelRatio||1,2);
      if(canvas.width!==Math.round(w*r)||canvas.height!==Math.round(h*r)){ canvas.width=Math.round(w*r); canvas.height=Math.round(h*r); gl.viewport(0,0,canvas.width,canvas.height); } dirty=true; }
    function draw(){
      const b=basis(), asp=canvas.width/Math.max(1,canvas.height);
      gl.uniform3fv(U.F,b.F); gl.uniform3fv(U.R,b.R); gl.uniform3fv(U.U,b.U);
      gl.uniform1f(U.tn,Math.tan(rad(fov)/2)); gl.uniform1f(U.asp,asp); gl.uniform1f(U.mx,mix);
      gl.drawArrays(gl.TRIANGLES,0,3);
      frameCbs.forEach(f=>f());
    }
    function loop(){ requestAnimationFrame(loop);
      if(anim){ const k=Math.min(1,(performance.now()-anim.t0)/anim.ms); anim.step(k); if(k>=1){ const d=anim.done; anim=null; d&&d(); } dirty=true; }
      if(!dragging&&(Math.abs(vel.y)>1e-5||Math.abs(vel.p)>1e-5)){ yaw+=vel.y; pitch=clamp(pitch+vel.p,-rad(85),rad(85)); vel.y*=.92; vel.p*=.92; dirty=true; }
      if(dirty&&!document.hidden){ dirty=false; draw(); } }

    // dragging and zooming
    const pts=new Map(); let lastD=0;
    canvas.addEventListener('pointerdown',e=>{ canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId,{x:e.clientX,y:e.clientY}); dragging=true; vel.y=vel.p=0; if(anim&&anim.keep) anim=null; if(pts.size===2){ const [a,b]=[...pts.values()]; lastD=Math.hypot(a.x-b.x,a.y-b.y); } });
    canvas.addEventListener('pointermove',e=>{ const p=pts.get(e.pointerId); if(!p) return;
      const dx=e.clientX-p.x, dy=e.clientY-p.y; p.x=e.clientX; p.y=e.clientY;
      if(pts.size===2){ const [a,b]=[...pts.values()], d=Math.hypot(a.x-b.x,a.y-b.y); fov=clamp(fov*(lastD/Math.max(1,d)),api.fovRange[0],api.fovRange[1]); lastD=d; dirty=true; return; }
      const k=rad(fov)/Math.max(1,canvas.clientHeight);                   // radians per pixel
      yaw-=dx*k; pitch=clamp(pitch+dy*k,-rad(85),rad(85)); vel.y=-dx*k*.45; vel.p=dy*k*.45; dirty=true; });
    const up=e=>{ pts.delete(e.pointerId); if(!pts.size) dragging=false; };
    canvas.addEventListener('pointerup',up); canvas.addEventListener('pointercancel',up);
    let wheelOK=false; canvas.addEventListener('pointerdown',()=>{ wheelOK=true; }); canvas.addEventListener('pointerleave',e=>{ if(e.pointerType==='mouse') wheelOK=false; });
    canvas.addEventListener('wheel',e=>{ if(!wheelOK) return; e.preventDefault(); fov=clamp(fov+e.deltaY*.04,api.fovRange[0],api.fovRange[1]); dirty=true; },{passive:false});
    canvas.addEventListener('keydown',e=>{ const k=rad(6); if(e.key==='ArrowLeft') yaw-=k; else if(e.key==='ArrowRight') yaw+=k; else if(e.key==='ArrowUp') pitch=clamp(pitch+k,-rad(85),rad(85)); else if(e.key==='ArrowDown') pitch=clamp(pitch-k,-rad(85),rad(85)); else return; e.preventDefault(); dirty=true; });
    canvas.tabIndex=0; canvas.setAttribute('aria-label','360 degree view. Drag to look around.');
    if('ResizeObserver' in window) new ResizeObserver(resize).observe(host); else addEventListener('resize',resize);

    api.project=function(pos){
      if(!cur) return {visible:false,x:0,y:0};
      const b=basis(), d=[pos[0]-cur.pos[0],pos[1]-cur.pos[1],pos[2]-cur.pos[2]];
      const dot=(a,c)=>a[0]*c[0]+a[1]*c[1]+a[2]*c[2], depth=dot(d,b.F); if(depth<.2) return {visible:false,x:0,y:0};
      const tn=Math.tan(rad(fov)/2), asp=host.clientWidth/Math.max(1,host.clientHeight);
      const px=dot(d,b.R)/depth/tn/asp, py=dot(d,b.U)/depth/tn;
      return {visible:Math.abs(px)<1.02&&Math.abs(py)<1.02, x:(px*.5+.5)*host.clientWidth, y:(-py*.5+.5)*host.clientHeight, depth};
    };
    api.look=()=>({yaw:yaw*180/Math.PI,pitch:pitch*180/Math.PI,fov});
    api.lookAt=function(pos,ms=700){ if(!cur) return; const d=[pos[0]-cur.pos[0],pos[1]-cur.pos[1],pos[2]-cur.pos[2]];
      const ty=Math.atan2(d[0],d[1]), tp=Math.atan2(d[2],Math.hypot(d[0],d[1])); let dy=((ty-yaw+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI; const y0=yaw, p0=pitch;
      anim={t0:performance.now(),ms,keep:true,step:k=>{ const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2; yaw=y0+dy*e; pitch=p0+(clamp(tp,-rad(60),rad(60))-p0)*e; }}; };
    api.goTo=function(id,o){ o=o||{}; const st=S[id]; if(!st) return Promise.resolve();
      loadingId=id; host.classList.add('loading');
      return load(id).then(img=>{ if(loadingId!==id) return; host.classList.remove('loading');
        const ny=rad(o.yaw!=null?o.yaw:(o.keepLook&&cur?yaw*180/Math.PI:(st.yaw||0))), np=rad(o.pitch!=null?o.pitch:(o.keepLook&&cur?pitch*180/Math.PI:(st.pitch||0)));
        if(!cur||o.instant){ upload(0,img); upload(1,img); mix=0; cur=st; curId=id; api.station=id; yaw=ny; pitch=np; dirty=true; return; }
        upload(1,img); const f0=fov, y0=yaw, p0=pitch, dy=((ny-yaw+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
        anim={t0:performance.now(),ms:650,step:k=>{ const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2; mix=e; fov=f0-10*Math.sin(Math.PI*k); yaw=y0+dy*e; pitch=p0+(np-p0)*e; },
          done:()=>{ upload(0,img); mix=0; fov=f0; cur=st; curId=id; api.station=id; dirty=true; }};
        cur=st; api.station=id;                       // overlay switches as the fade starts
      }).catch(()=>{ host.classList.remove('loading'); opts.onError&&opts.onError(id); }); };
    api.preload=ids=>ids.forEach(id=>{ if(S[id]&&!cache[id]) load(id).catch(()=>{}); });
    api.maxTexture=maxTex; api.canvas=canvas;
    resize(); loop();
    return api;
  }
  window.USPTour={ mount };
})();

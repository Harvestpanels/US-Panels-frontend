/* US Panels walk-through.
   One page = one building shown as a 360-degree tour (js/tour.js: drag to look around, step between spots) in two groups of spots, Outside and Inside,
   with numbered pins on the parts that are in view. Tapping a pin fades in a close-up render of that part and the side sheet shows the product's photo,
   words and specs, "Add to my list" and a link to the 3D showroom. Without WebGL it falls back to two still pictures with the same pins.
   A scene file (js/scene-<name>.js) registers USPB.scenes[name] = { modes, tour:{stations}, images, parts, info }.
   Page provides: #bview[data-scene] inside .bstage, .bmode [data-mode] buttons, #bsheet, and the product cards (.opt[data-id][data-name] with .im img, .k, h3, p)
   that supply each product's title, picture and words. */
(function(){
  const host=document.getElementById('bview'); if(!host) return;
  const stage=host.closest('.bstage'), sheet=document.getElementById('bsheet');
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const NAME=host.dataset.scene||'data-center';
  const U=window.USPB=window.USPB||{scenes:{}};
  let S=null, mode='out', sel=null, tour=null, station=null;
  let pan=null, imgEl=null, pinsEl=null, detEl=null, detLab=null, hotsEl=null, stnEl=null;
  const el=(tag,cls,txt)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; };
  const loadJS=src=>new Promise((ok,no)=>{ const s=document.createElement('script'); s.src=src; s.onload=ok; s.onerror=()=>no(new Error(src)); document.head.appendChild(s); });
  const card=pid=>document.querySelector('.opt[data-id="'+pid+'"]');
  const nameOf=pid=>{ const c=card(pid); return c?c.dataset.name:pid; };
  const partOf=key=>S.parts.find(p=>p.key===key);
  const stationsOf=m=>Object.keys(S.tour.stations).filter(k=>S.tour.stations[k].mode===m);

  /* ---------------- the sheet ---------------- */
  function renderList(){
    const m=S.modes[mode], w=el('div','bs-wrap');
    w.append(el('p','mono bs-eye',m.label+' view'),el('h3',null,m.title),el('p','bs-lead',m.lead));
    const ol=el('ol','bs-parts');
    S.parts.filter(p=>p.mode===mode).forEach(p=>{
      const li=el('li'), b=el('button','bs-part'), t=el('span','t');
      b.type='button'; b.dataset.key=p.key; t.append(el('b',null,nameOf(p.pid)),el('small',null,p.label));
      b.append(t); b.onclick=()=>select(p.key); li.append(b); ol.append(li);
    });
    w.append(ol); sheet.replaceChildren(w);
  }
  function renderDetail(p){
    const c=card(p.pid), info=S.info[p.pid]||{}, w=el('div','bs-wrap');
    const back=el('button','bs-back','← All parts in this view'); back.type='button'; back.onclick=()=>select(null); w.append(back);
    const src=c&&$('.im img',c);
    if(src){ const cl=$('.im',c).className, im=el('div','bs-img'+(/\bdoor\b/.test(cl)?' door':'')+(/\btrim\b/.test(cl)?' trim':'')), i=new Image(); i.src=src.getAttribute('src'); i.alt=src.alt||''; im.append(i); w.append(im); }
    w.append(el('p','bs-k',p.label));
    w.append(el('h3',null,c?$('h3',c).textContent:p.pid));
    if(c&&$('p',c)) w.append(el('p','bs-desc',$('p',c).textContent));
    if(p.look) w.append(el('p','bs-look','What to look for: '+p.look));
    if(info.specs&&info.specs.length){ const dl=el('dl','bs-specs'); info.specs.forEach(([k,v])=>{ const r=el('div'); r.append(el('dt',null,k),el('dd',null,v)); dl.append(r); }); w.append(dl); }
    if(info.note) w.append(el('p','bs-note',info.note));
    const acts=el('div','bs-acts');
    if(info.showroom){ const a=el('a','btn red','View in 3D showroom'); a.href=info.showroom; acts.append(a); }
    if(window.USPList){ const b=el('button','add'); b.type='button'; b.innerHTML='<span class="ic" aria-hidden="true"></span><span class="lbl"></span>'; b.dataset.pid=p.pid; b.onclick=()=>{ USPList.toggle(p.pid); }; acts.append(b); }
    w.append(acts); sheet.replaceChildren(w); syncAdd();
  }
  function syncAdd(){ const b=$('.add[data-pid]',sheet); if(!b||!window.USPList) return; const on=USPList.has(b.dataset.pid); b.setAttribute('aria-pressed',String(on)); $('.lbl',b).textContent=on?'In my list':'Add to my list'; }
  document.addEventListener('usplist',syncAdd);

  /* ---------------- selecting a part ---------------- */
  function zoomTo(p){   // still-picture fallback: zoom the overview to the pin
    const cw=stage.clientWidth, ch=stage.clientHeight; if(!cw||!ch||!pan) return;
    if(!p){ pan.style.setProperty('--inv',1); pan.style.transform='translate(0px,0px) scale(1)'; return; }
    const im=S.images[mode], iw=Math.max(cw,ch*im.w/im.h), ix=(cw-iw)/2, s=cw<600?2.7:2.3;
    let tx=cw/2-s*(ix+p.x/100*iw), ty=ch/2-s*(p.y/100*ch);
    tx=clamp(tx,cw-s*(ix+iw),-s*ix); ty=clamp(ty,ch-s*ch,0);
    pan.style.setProperty('--inv',(1/s).toFixed(4)); pan.style.transform='translate('+tx.toFixed(1)+'px,'+ty.toFixed(1)+'px) scale('+s+')';
  }
  function select(key){
    const p=key?partOf(key):null; if(p&&p.mode!==mode) setMode(p.mode,true);
    sel=key; if(p) renderDetail(p); else renderList();
    $$('.pin',pinsEl).forEach(b=>{ const on=b.dataset.key===key; b.classList.toggle('sel',on); b.setAttribute('aria-pressed',String(on)); });
    const det=p&&p.detail;
    if(det){ detEl.src=det; detEl.alt=p.look||p.label; detLab.textContent=nameOf(p.pid); }
    stage.classList.toggle('detail',!!det);
    if(!tour){ stage.classList.toggle('zoomed',!!p&&!det); zoomTo(p&&!det?p:null); }
    else if(p&&!det&&tour) tour.lookAt(p.at);
  }

  /* ---------------- moving: stations, hotspots, pins ---------------- */
  function goStation(id,o){
    const st=S.tour.stations[id]; if(!st) return;
    if(sel) select(null);
    if(st.mode!==mode) setMode(st.mode,true,true);
    station=id; tour.goTo(id,o||{keepLook:true}).then(()=>refresh());
    refresh();
  }
  function refresh(){
    const sid=tour&&tour.station||station; if(!sid) return;
    stnEl.textContent=S.tour.stations[sid].label;
    const links=S.tour.stations[sid].links||[];
    hotsEl.replaceChildren();
    links.forEach(l=>{ const b=el('button','hot'); b.type='button'; b.dataset.to=l.to; b.setAttribute('aria-label',l.label);
      b.append(el('span','ico'),el('span','lbl',l.label)); b.onclick=()=>goStation(l.to,l.look?{yaw:l.look[0],pitch:l.look[1]}:{keepLook:true}); b._at=l.at||floorOf(l.to); hotsEl.append(b); });
    tour.preload(links.map(l=>l.to));
    overlay();
  }
  const floorOf=id=>{ const p=S.tour.stations[id].pos; return [p[0],p[1],.15]; };
  function overlay(){
    const sid=tour.station||station; if(!sid) return;
    const placed=[], W=host.clientWidth, H=host.clientHeight;
    const hit=(a,b)=>Math.abs(a.x-b.x)<(a.w+b.w)/2+4&&Math.abs(a.y-b.y)<(a.h+b.h)/2+4;
    $$('.hot',hotsEl).forEach(b=>{ const q=tour.project(b._at); b.hidden=!q.visible;
      if(q.visible){ b.style.left=q.x.toFixed(1)+'px'; b.style.top=q.y.toFixed(1)+'px'; b.style.setProperty('--s',clamp(3.2/Math.max(.5,q.depth/10),.7,1.15).toFixed(2)); placed.push({x:q.x,y:q.y,w:54,h:54}); } });
    $$('.pin',pinsEl).forEach(b=>{ const p=partOf(b.dataset.key);
      const show=p.mode===mode&&p.st&&p.st.indexOf(sid)>=0; if(!show){ b.hidden=true; return; }
      const q=tour.project(p.at); b.hidden=!q.visible; if(!q.visible) return;
      const r={x:q.x,y:q.y,w:b.offsetWidth||130,h:b.offsetHeight||36};
      for(let i=0;i<8&&placed.some(o=>hit(r,o));i++) r.y=q.y+(i%2?-1:1)*(Math.floor(i/2)+1)*(r.h+5);   // names that would sit on top of each other step apart
      r.x=clamp(r.x,r.w/2+4,W-r.w/2-4); r.y=clamp(r.y,r.h/2+4,H-r.h/2-4);
      placed.push(r); b.style.left=r.x.toFixed(1)+'px'; b.style.top=r.y.toFixed(1)+'px'; });
  }
  function setMode(m,instant,fromStation){
    if(m===mode&&!instant) return;
    mode=m; sel=null;
    $$('.bmode [data-mode]').forEach(b=>{ const on=b.dataset.mode===m; b.classList.toggle('on',on); b.setAttribute('aria-pressed',String(on)); });
    $$('.pin',pinsEl).forEach(b=>{ b.classList.remove('sel'); if(!tour) b.hidden=partOf(b.dataset.key).mode!==m; });
    stage.classList.remove('zoomed','detail'); renderList();
    if(tour){ if(!fromStation) goStation(stationsOf(m)[0],{instant:false,yaw:undefined,keepLook:false}); }
    else { const im=S.images[m]; imgEl.src=im.src; imgEl.alt=im.alt; imgEl.width=im.w; imgEl.height=im.h; zoomTo(null); }
  }

  /* ---------------- build ---------------- */
  function build(){
    host.replaceChildren();
    detEl=new Image(); detEl.className='bdetail'; detEl.decoding='async'; detEl.draggable=false; detLab=el('div','bdlabel');
    pinsEl=el('div','bpins'); hotsEl=el('div','bhots'); stnEl=el('div','bstn');
    tour=(window.USPTour&&S.tour)?USPTour.mount(host,{stations:S.tour.stations,onError:()=>{ /* keep going with what loaded */ }}):null;
    if(!tour){   // still pictures: the overview with zoom-to-pin
      pan=el('div','bpan'); const inner=el('div','bimg'); imgEl=new Image(); imgEl.decoding='async'; imgEl.draggable=false; inner.append(imgEl,pinsEl); pan.append(inner); host.append(pan);
      stage.classList.add('still');
    } else { host.append(pinsEl,hotsEl); stage.classList.add('touring'); }
    host.append(detEl,detLab); if(tour) stage.append(stnEl);
    S.parts.forEach(p=>{
      const b=el('button','pin'); b.type='button'; b.dataset.key=p.key; b.dataset.label=p.label; b.hidden=true;
      if(!tour){ b.style.left=p.x+'%'; b.style.top=p.y+'%'; }
      b.setAttribute('aria-label',nameOf(p.pid)+' ('+p.label+')'); b.setAttribute('aria-pressed','false'); b.append(el('span',null,nameOf(p.pid)));
      b.onclick=()=>select(sel===p.key?null:p.key); pinsEl.append(b);
      if(p.detail){ const i=new Image(); i.src=p.detail; }          // warm the close-ups
    });
    $$('.bmode [data-mode]').forEach(b=>b.addEventListener('click',()=>{ if(sel) select(null); setMode(b.dataset.mode); }));
    // the close-up is only a peek: a button, a drag on the picture, or either mode button brings the tour back
    const back=el('button','bdback','← Back to the tour'); back.type='button'; back.onclick=()=>select(null); stage.append(back);
    host.addEventListener('pointerdown',e=>{ if(stage.classList.contains('detail')&&!e.target.closest('button')) select(null); },true);
    if(tour){
      tour.onFrame(overlay);
      stage.querySelector('.bhint').textContent='Drag to look around · tap an arrow to move';
      mode=$('.bmode .on')?$('.bmode .on').dataset.mode:'out';
      renderList(); goStation(stationsOf(mode)[0],{instant:true});
    } else {
      if('ResizeObserver' in window) new ResizeObserver(()=>{ if(sel) zoomTo(partOf(sel)); }).observe(stage);
      mode=$('.bmode .on')?$('.bmode .on').dataset.mode:'out'; setMode(mode,true);
      $$('.pin',pinsEl).forEach(b=>{ b.hidden=partOf(b.dataset.key).mode!==mode; });
    }
    window.USPB.view={ select:k=>select(k), mode:m=>setMode(m,true), go:id=>goStation(id,{instant:true}), tour, ready:true };
  }
  loadJS('js/scene-'+NAME+'.js').then(()=>{ S=U.scenes[NAME]; if(!S) throw new Error('scene'); build(); })
    .catch(()=>{ host.textContent='The pictures could not load.'; });
})();

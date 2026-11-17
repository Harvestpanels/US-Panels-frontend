/* US Panels walk-through (photo version).
   One page = one building shown as two pictures (Outside, Inside) with numbered pins on every part. Tapping a pin zooms the picture to that
   part and the side sheet shows the product's photo, words and specs, "Add to my list" and a link to the 3D showroom.
   A scene file (js/scene-<name>.js) registers USPB.scenes[name] = { modes, images, parts, info }.
   Page provides: #bview[data-scene] inside .bstage, .bmode [data-mode] buttons, #bsheet, and the product cards (.opt[data-id][data-name] with .im img, .k, h3, p)
   that supply each product's title, picture and words. No WebGL needed. */
(function(){
  const host=document.getElementById('bview'); if(!host) return;
  const stage=host.closest('.bstage'), sheet=document.getElementById('bsheet');
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const NAME=host.dataset.scene||'data-center';
  const U=window.USPB=window.USPB||{scenes:{}};
  let S=null, mode='out', sel=null, pan=null, imgEl=null, pinsEl=null;
  const el=(tag,cls,txt)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; };
  const loadJS=src=>new Promise((ok,no)=>{ const s=document.createElement('script'); s.src=src; s.onload=ok; s.onerror=()=>no(new Error(src)); document.head.appendChild(s); });
  const card=pid=>document.querySelector('.opt[data-id="'+pid+'"]');
  const nameOf=pid=>{ const c=card(pid); return c?c.dataset.name:pid; };
  const partOf=key=>S.parts.find(p=>p.key===key);

  /* ---------------- the sheet ---------------- */
  function renderList(){
    const m=S.modes[mode], w=el('div','bs-wrap');
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
    const c=card(p.pid), info=S.info[p.pid]||{}, w=el('div','bs-wrap');
    const back=el('button','bs-back','← All parts in this view'); back.type='button'; back.onclick=()=>select(null); w.append(back);
    const src=c&&$('.im img',c);
    if(src){ const cl=$('.im',c).className, im=el('div','bs-img'+(/\bdoor\b/.test(cl)?' door':'')+(/\btrim\b/.test(cl)?' trim':'')), i=new Image(); i.src=src.getAttribute('src'); i.alt=src.alt||''; im.append(i); w.append(im); }
    w.append(el('p','bs-k',p.n+' · '+p.label));
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

  /* ---------------- the picture: zoom to a part ---------------- */
  function zoomTo(p){
    const cw=stage.clientWidth, ch=stage.clientHeight; if(!cw||!ch) return;
    if(!p){ pan.style.setProperty('--inv',1); pan.style.transform='translate(0px,0px) scale(1)'; return; }
    const ih=ch, iw=Math.max(cw,ch*S.images[mode].w/S.images[mode].h), ix=(cw-iw)/2, s=cw<600?2.7:2.3;
    let tx=cw/2-s*(ix+p.x/100*iw), ty=ch/2-s*(p.y/100*ih);
    tx=clamp(tx,cw-s*(ix+iw),-s*ix); ty=clamp(ty,ch-s*ch,0);
    pan.style.setProperty('--inv',(1/s).toFixed(4)); pan.style.transform='translate('+tx.toFixed(1)+'px,'+ty.toFixed(1)+'px) scale('+s+')';
  }
  function select(key){
    const p=key?partOf(key):null; if(p&&p.mode!==mode) setMode(p.mode,true);
    sel=key; if(p) renderDetail(p); else renderList();
    $$('.pin',pinsEl).forEach(b=>{ const on=b.dataset.key===key; b.classList.toggle('sel',on); b.setAttribute('aria-pressed',String(on)); });
    stage.classList.toggle('zoomed',!!p); zoomTo(p);
  }
  function setMode(m,instant){
    if(m===mode&&!instant&&imgEl.getAttribute('src')===S.images[m].src) return;
    const apply=()=>{
      mode=m; sel=null; const im=S.images[m];
      imgEl.src=im.src; imgEl.alt=im.alt; imgEl.width=im.w; imgEl.height=im.h;
      $$('.bmode [data-mode]').forEach(b=>{ const on=b.dataset.mode===m; b.classList.toggle('on',on); b.setAttribute('aria-pressed',String(on)); });
      $$('.pin',pinsEl).forEach(b=>{ b.hidden=partOf(b.dataset.key).mode!==m; b.classList.remove('sel'); });
      stage.classList.remove('zoomed'); zoomTo(null); renderList();
      const shown=()=>stage.classList.remove('swap'); (imgEl.decode?imgEl.decode():Promise.resolve()).then(shown,shown);   // fade back in once the new picture is ready
    };
    if(!reduce&&!instant){ stage.classList.add('swap'); setTimeout(apply,200); } else apply();
  }
  function build(){
    host.replaceChildren(); pan=el('div','bpan'); const inner=el('div','bimg'); imgEl=new Image(); imgEl.decoding='async'; imgEl.draggable=false;
    pinsEl=el('div','bpins'); inner.append(imgEl,pinsEl); pan.append(inner); host.append(pan);
    S.parts.forEach(p=>{
      const b=el('button','pin'); b.type='button'; b.dataset.key=p.key; b.dataset.label=p.label; b.hidden=true; b.style.left=p.x+'%'; b.style.top=p.y+'%';
      b.setAttribute('aria-label',p.label+': '+nameOf(p.pid)); b.setAttribute('aria-pressed','false'); b.append(el('span',null,String(p.n)));
      b.onclick=()=>select(sel===p.key?null:p.key); pinsEl.append(b);
    });
    $$('.bmode [data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
    if('ResizeObserver' in window) new ResizeObserver(()=>{ if(sel) zoomTo(partOf(sel)); }).observe(stage);
    setMode(mode,true);
  }
  loadJS('js/scene-'+NAME+'.js').then(()=>{ S=U.scenes[NAME]; if(!S) throw new Error('scene'); build(); window.USPB.view={ select:k=>select(k), mode:m=>setMode(m,true), ready:true }; })
    .catch(()=>{ host.textContent='The pictures could not load.'; });
})();

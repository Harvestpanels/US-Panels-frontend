/* Industry pages: "Add to my list" on each product, a running list that becomes the text for the quote,
   and a floating "your list" pill. The list is kept in the address (#list=a,b,c) so it survives a reload and can be shared.
   Markup it expects:
     .opt[data-id][data-zone][data-name] each containing button.add (with span.lbl)
     #list-out (ul), #list-empty, #list-fieldwrap, #list-field (textarea), #listbar (a) with #list-count, and a #list section
     <body data-lead="Opening line for the copied text"> */
(function(){
  const opts=[...document.querySelectorAll('.opt[data-id]')];
  const out=document.getElementById('list-out');
  if(!opts.length||!out) return;
  const $=id=>document.getElementById(id);
  const empty=$('list-empty'), fw=$('list-fieldwrap'), field=$('list-field'), bar=$('listbar'), cnt=$('list-count'), sect=$('list');
  const lead=document.body.dataset.lead||'Products I am interested in:';
  const by={}; opts.forEach(o=>{ by[o.dataset.id]=o; });
  const sel=new Set();

  function render(write){
    const ids=opts.map(o=>o.dataset.id).filter(id=>sel.has(id));
    opts.forEach(o=>{
      const on=sel.has(o.dataset.id), b=o.querySelector('.add');
      o.classList.toggle('on',on);
      b.setAttribute('aria-pressed',String(on));
      b.querySelector('.lbl').textContent=on?'In my list':'Add to my list';
      b.setAttribute('aria-label',(on?'Remove ':'Add ')+o.dataset.name+(on?' from':' to')+' my list');
    });
    out.replaceChildren(...ids.map(id=>{
      const o=by[id], li=document.createElement('li'), t=document.createElement('div'), z=document.createElement('i'), n=document.createElement('b'), x=document.createElement('button');
      t.className='t'; z.textContent=o.dataset.zone; n.textContent=o.dataset.name; t.append(z,n);
      x.type='button'; x.textContent='×'; x.setAttribute('aria-label','Remove '+o.dataset.name); x.onclick=()=>toggle(id);
      li.append(t,x); return li;
    }));
    const zones=[...new Set(ids.map(id=>by[id].dataset.zone))];
    const lines=zones.map(z=>z+': '+ids.filter(id=>by[id].dataset.zone===z).map(id=>by[id].dataset.name).join('; '));
    field.value=ids.length?lead+'\n'+lines.join('\n'):'';
    field.rows=Math.max(3,lines.length+2);
    empty.hidden=ids.length>0; fw.hidden=ids.length===0;
    cnt.textContent=ids.length; bar.hidden=ids.length===0;
    if(write){ try{ history.replaceState(null,'',ids.length?'#list='+ids.join(','):location.pathname+location.search); }catch(e){} }
  }
  function toggle(id){ if(sel.has(id)) sel.delete(id); else sel.add(id); render(true); }

  opts.forEach(o=>o.querySelector('.add').addEventListener('click',()=>toggle(o.dataset.id)));

  const m=/^#list=([\w,-]+)$/.exec(location.hash);
  if(m) m[1].split(',').forEach(id=>{ if(by[id]) sel.add(id); });
  render(false);

  /* hide the floating pill while the list itself (or the footer it would cover) is on screen */
  if('IntersectionObserver' in window){
    const seen=new Set();
    const io=new IntersectionObserver(es=>{
      es.forEach(e=>{ if(e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
      bar.classList.toggle('away',seen.size>0);
    },{threshold:.15});
    [sect,document.querySelector('footer')].forEach(el=>{ if(el) io.observe(el); });
  }
})();

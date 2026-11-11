/* Shared behaviour for every page: the floating menu, the phone drawer and scroll-in reveals. */
(function(){
  const nav=document.getElementById('nav'), drawer=document.getElementById('drawer'), burger=document.getElementById('burger');
  if(nav){ const onScroll=()=>nav.classList.toggle('solid',scrollY>40); addEventListener('scroll',onScroll,{passive:true}); onScroll(); }
  if(nav&&drawer&&burger){
    const setMenu=o=>{ nav.classList.toggle('open',o); drawer.classList.toggle('open',o); document.body.classList.toggle('lock',o); burger.setAttribute('aria-expanded',String(o)); };
    burger.onclick=()=>setMenu(!drawer.classList.contains('open'));
    drawer.addEventListener('click',e=>{ if(e.target.closest('a')) setMenu(false); });
    addEventListener('keydown',e=>{ if(e.key==='Escape') setMenu(false); });
    addEventListener('resize',()=>{ if(innerWidth>980) setMenu(false); });
  }
  const rv=[...document.querySelectorAll('.rv')];
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }),{threshold:.08});
    rv.forEach(el=>io.observe(el));
  } else rv.forEach(el=>el.classList.add('in'));
  document.querySelectorAll('[data-year]').forEach(el=>{ el.textContent=new Date().getFullYear(); });

  /* Quote form: US Panels' own Pipedrive web form (the same one the live site uses), so a request becomes a lead directly.
     It is only fetched once the visitor scrolls near it. Put <div class="pd-form"></div> where the form should appear. */
  const PD_FORM='https://webforms.pipedrive.com/f/1yqFSPEZugCXq5jxNGMgPU6RBDUrKZAiiwWux3zmkp8agODu7sabUolZpIQIRrp0n';
  document.querySelectorAll('.pd-form').forEach(host=>{
    const load=()=>{ if(host.dataset.loaded) return; host.dataset.loaded='1';
      const c=document.createElement('div'); c.className='pipedriveWebForms'; c.dataset.pdWebforms=PD_FORM;
      const s=document.createElement('script'); s.src='https://webforms.pipedrive.com/f/loader'; s.async=true; c.appendChild(s); host.appendChild(c); };
    if('IntersectionObserver' in window){ const o=new IntersectionObserver(es=>{ if(es.some(e=>e.isIntersecting)){ o.disconnect(); load(); } },{rootMargin:'600px'}); o.observe(host); } else load();
  });
  /* "Copy" buttons: <button data-copy="#some-input"> copies that field's value (or the element's text) */
  document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',()=>{ const el=document.querySelector(b.dataset.copy); if(!el) return; const t=b.textContent, v=(b.dataset.prefix||'')+(el.value||el.textContent||'');
    (navigator.clipboard?navigator.clipboard.writeText(v):Promise.reject()).then(()=>{ b.textContent='Copied'; },()=>{ b.textContent='Select and copy it'; }).finally(()=>setTimeout(()=>{ b.textContent=t; },1800)); }));
})();

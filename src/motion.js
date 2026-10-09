/* Progressive entrances, shared by the website, templates and catalog. */
(()=>{
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 if(!('IntersectionObserver' in window))return;
 let observer;
 const selector='.av-service-card,.av-work-item,.site-gallery figure,.site-review,.site-story-grid article,.site-video-stills figure,.site-targa-steps>li,.ds-scene,.ds-specimen,.av-section-heading';
 function start(){
  observer?.disconnect();
  document.querySelectorAll('.av-motion-enter').forEach(el=>el.classList.remove('av-motion-enter'));
  if(preference.matches)return;
  observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;entry.target.classList.add('av-motion-enter');observer.unobserve(entry.target);}},{threshold:0,rootMargin:'0px 0px -24px 0px'});
  document.querySelectorAll(selector).forEach(el=>observer.observe(el));
 }
 preference.addEventListener('change',start);start();
})();
/* Catalog/template image inspection; the full site supplies its own viewer. */
(()=>{
 if(document.getElementById('photo-viewer'))return;
 const links=[...document.querySelectorAll('[data-lightbox]')];if(!links.length||!('HTMLDialogElement' in window))return;
 const dialog=document.createElement('dialog');dialog.className='av-media-viewer';dialog.setAttribute('aria-label','Enlarged photograph');
 const close=document.createElement('button');close.type='button';close.textContent='Close photograph';const image=document.createElement('img');image.alt='';dialog.append(close,image);document.body.append(dialog);let trigger;
 links.forEach(a=>a.addEventListener('click',ev=>{ev.preventDefault();trigger=a;image.src=a.href;image.alt=a.querySelector('img')?.alt||'Selected photograph';dialog.showModal();}));
 close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{image.removeAttribute('src');trigger?.focus();});dialog.addEventListener('keydown',ev=>{if(ev.key==='Tab'){ev.preventDefault();close.focus();}});
})();

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

(() => {
 document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.av-mobile-menu[open]').forEach(menu=>{menu.open=false;if(menu.contains(document.activeElement))menu.querySelector('summary').focus();});});
 const hover=matchMedia('(hover:hover) and (pointer:fine)');
 document.querySelectorAll('.av-mobile-menu').forEach(menu=>{
  menu.addEventListener('mouseenter',()=>{if(hover.matches)menu.open=true;});
  menu.addEventListener('mouseleave',()=>{if(hover.matches&&!menu.contains(document.activeElement))menu.open=false;});
  menu.addEventListener('focusout',()=>setTimeout(()=>{if(hover.matches&&!menu.matches(':hover')&&!menu.contains(document.activeElement))menu.open=false;},0));
 });
 document.querySelectorAll('.site-review-carousel').forEach(scroller=>{
  const controls=scroller.nextElementSibling;if(!controls?.classList.contains('site-review-controls'))return;
  controls.hidden=false;const prev=controls.querySelector('[data-review-prev]'),next=controls.querySelector('[data-review-next]'),status=controls.querySelector('[data-review-position]');
  const cards=[...scroller.querySelectorAll('.site-review')];
  function update(){const width=cards[0].getBoundingClientRect().width+24,start=Math.round(scroller.scrollLeft/width),count=Math.round((scroller.clientWidth+24)/width);prev.disabled=scroller.scrollLeft<2;next.disabled=scroller.scrollLeft+scroller.clientWidth>=scroller.scrollWidth-2;status.textContent=`${start+1}–${Math.min(cards.length,start+count)} of ${cards.length}`;}
  function move(direction){scroller.scrollBy({left:direction*(cards[0].getBoundingClientRect().width+24),behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}
  prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
  scroller.addEventListener('keydown',e=>{if(e.target!==scroller)return;if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();move(e.key==='ArrowLeft'?-1:1);}});
  scroller.addEventListener('scroll',update,{passive:true});new ResizeObserver(update).observe(scroller);update();
 });
})();

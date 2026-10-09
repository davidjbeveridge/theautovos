/* Progressive interaction layer. No customer data leaves this prototype. */
(() => {
 const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
 const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
 const unitPrice=Number(document.body.dataset.demoPrice)||0;
 const storageKey='autovos-demo-bag-v1';
 let memoryBag=null;
 function getBag(){try{const x=JSON.parse(sessionStorage.getItem(storageKey));return x&&['S','M','L','XL'].includes(x.size)&&Number.isInteger(x.quantity)&&x.quantity>=1&&x.quantity<=5?x:null;}catch{return memoryBag;}}
 function setBag(bag){memoryBag=bag;try{bag?sessionStorage.setItem(storageKey,JSON.stringify(bag)):sessionStorage.removeItem(storageKey);}catch{}renderBag();}
 function renderBag(){const bag=getBag();$$('[data-bag-count]').forEach(n=>n.textContent=String(bag?.quantity||0));if($('[data-cart]')){$('[data-cart-empty]').hidden=!!bag;$('[data-cart-filled]').hidden=!bag;if(bag){$('[data-cart-size]').textContent='Size '+bag.size+' · Demo item';$('#cart-quantity').value=String(bag.quantity);$('[data-line-total]').textContent=money(bag.quantity*unitPrice);$('[data-subtotal]').textContent=money(bag.quantity*unitPrice);}}if($('[data-checkout-summary]')){const n=$('[data-checkout-summary]');n.replaceChildren();const p=document.createElement('p');p.textContent=bag?`Lunar GT3RS Tee · Size ${bag.size} · Quantity ${bag.quantity}`:'Your demo bag is empty.';n.append(p);const total=document.createElement('p');total.textContent=bag?`${money(bag.quantity*unitPrice)} subtotal · demo prices; tax/shipping not configured.`:'Return to the shop to add a sample item.';n.append(total);}}
 renderBag();
 $('[data-product-form]')?.addEventListener('submit',event=>{event.preventDefault();const data=new FormData(event.currentTarget);setBag({size:String(data.get('size')),quantity:Number(data.get('quantity'))});$('[data-product-status]').textContent='Added to your demo bag. No purchase has been made.';});
 $('#cart-quantity')?.addEventListener('change',event=>{const bag=getBag();if(bag){setBag({...bag,quantity:Number(event.target.value)});$('[data-cart-status]').textContent='Demo bag updated.';}});
 $('[data-remove-item]')?.addEventListener('click',()=>{setBag(null);$('[data-cart-status]').textContent='Item removed. Your bag is empty.';$('[data-cart-empty] a').focus();});
 $('[data-fill-cart]')?.addEventListener('click',()=>setBag({size:'M',quantity:1}));
 function filterGallery(category){$$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)));const items=$$('[data-gallery-grid] [data-category]');items.forEach(i=>i.hidden=category!=='All'&&i.dataset.category!==category);const count=items.filter(i=>!i.hidden).length;if($('[data-result-count]'))$('[data-result-count]').textContent=`${count} ${count===1?'story':'stories'}`;if($('[data-gallery-empty]'))$('[data-gallery-empty]').hidden=count!==0;}
 $$('[data-filter]').forEach(b=>b.addEventListener('click',()=>filterGallery(b.dataset.filter)));
 $('[data-reset-gallery]')?.addEventListener('click',()=>{filterGallery('All');$('[data-filter="All"]').focus();});
 const params=new URLSearchParams(location.search);
 const serviceNames={ppf:'Paint protection film',ceramic:'Ceramic coating',tint:'Window tint'};
 if($('#service')&&serviceNames[params.get('service')])$('#service').value=serviceNames[params.get('service')];
 if($('#subject')&&params.get('subject')==='art')$('#subject').value='Automotive art';
 $$('[data-inquiry]').forEach(form=>{
  const submit=$('[type=submit]',form);submit.disabled=false;
  const summary=$('[data-error-summary]',form),status=$('[data-form-status]',form),success=$('[data-form-success]',form);
  const showErrors=errors=>{summary.replaceChildren();const heading=document.createElement('h2');heading.textContent='Check your details.';summary.append(heading);const ul=document.createElement('ul');errors.forEach(({field,message})=>{const li=document.createElement('li'),a=document.createElement('a');a.href='#'+field.id;a.textContent=message;a.addEventListener('click',event=>{event.preventDefault();field.focus();});li.append(a);ul.append(li);});summary.append(ul);summary.hidden=false;summary.focus();};
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(submit.disabled)return;
   summary.hidden=true;success.hidden=true;status.textContent='';const errors=[];
   $$('[aria-invalid]',form).forEach(f=>f.removeAttribute('aria-invalid'));$$('.av-field-error',form).forEach(n=>{n.hidden=true;n.textContent='';});
   $$('[required]',form).forEach(f=>{let message='';if(f.type==='checkbox'&&!f.checked){message='Confirm that this is a local preview.';f.id='acknowledge';}else if(!f.value.trim())message=`Enter ${$('label[for="'+f.id+'"]',form)?.textContent.replace('*','').trim().toLowerCase()||'a value'}.`;else if(f.type==='email'&&!f.validity.valid)message='Enter a valid email address.';else if(f.id==='year'&&!/^\d{4}$/.test(f.value.trim()))message='Enter a four-digit vehicle year.';if(message){f.setAttribute('aria-invalid','true');const error=$('#'+f.name+'-error',form);if(error){error.textContent=message;error.hidden=false;}errors.push({field:f,message});}});
   if(errors.length){showErrors(errors);return;}
   submit.disabled=true;form.setAttribute('aria-busy','true');status.textContent='Checking the sample request…';
   await new Promise(resolve=>setTimeout(resolve,450));
   submit.disabled=false;form.removeAttribute('aria-busy');
   if($('[data-simulate-error]')?.checked){summary.replaceChildren();const h=document.createElement('h2');h.textContent='The sample request could not be delivered.';const p=document.createElement('p');p.textContent='Your details are still here. Turn off “Simulate delivery error” in the preview bar and retry. Nothing was sent.';summary.append(h,p);summary.hidden=false;summary.focus();status.textContent='Preview delivery failed. Your entries have been kept.';return;}
   status.textContent='Local preview complete. Nothing was sent.';success.hidden=false;success.focus();
  });
  $('[data-edit-request]',form)?.addEventListener('click',()=>{success.hidden=true;$('input',form).focus();});
 });
 const player=$('#av-film'),videoButton=$('[data-video-toggle]');
 videoButton?.addEventListener('click',async()=>{if(player.paused){if(!player.src)player.src=matchMedia('(max-width:600px)').matches?'../assets/shop-film-mobile-v2.mp4':'../assets/shop-film-v2.mp4';try{await player.play();videoButton.setAttribute('aria-pressed','true');$('span',videoButton).textContent='Pause background film';}catch{$('span',videoButton).textContent='Film unavailable — retry';}}else{player.pause();videoButton.setAttribute('aria-pressed','false');$('span',videoButton).textContent='Play background film';}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&player&&!player.paused){player.pause();videoButton.setAttribute('aria-pressed','false');$('span',videoButton).textContent='Play background film';}});
 const storyMap={yellow:['Porsche, in the studio','porsche-yellow.webp','Yellow Porsche in the Auto Vos studio','A frame from the Auto Vos shop film.'],film:['The fit comes first','precision-install.webp','Technicians fitting protective film','An inside look at paint protection film installation.'],silver:['Every line, considered','porsche-silver.webp','Silver Porsche in the studio','A frame from the Auto Vos shop film.'],coating:['The finishing layer','ceramic-application.webp','Coating applied to blue paint','Coating application in the studio.'],audi:['Blue, in detail','audi-glass.webp','Blue Audi glass and bodywork','A frame from the Auto Vos shop film.']};
 const story=storyMap[params.get('image')];if(story&&$('[data-story-title]')){$('[data-story-title]').textContent=story[0].toUpperCase();const img=$('.av-story-cover img');img.src='../assets/'+story[1];img.alt=story[2];$('[data-story-credit]').textContent='From the Auto Vos shop film';$('[data-story-caption]').textContent=story[3];$('[data-story-heading]').textContent='Inside the studio.';$('[data-story-description]').textContent=story[3];document.title=story[0]+' | Auto Vos';}
 if(params.get('kind')==='order'&&$('[data-confirm-title]')){$('[data-confirm-title]').textContent='ORDER CONFIRMATION.';$('[data-confirm-copy]').textContent='Example only. No payment was collected and no order was placed. Production must show the actual order reference, items and receipt after verified payment.';}
 // Component specimen feedback lives only in the design catalog.
 $$('[data-demo-action]').forEach(b=>b.addEventListener('click',()=>{const out=$('[data-demo-output]');if(out)out.textContent='Action activated. This is a demonstration.';}));
})();

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

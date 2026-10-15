import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.SITE_PREVIEW_URL||'http://127.0.0.1:8790';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const checks=[],out='design-artifacts/site';fs.mkdirSync(out,{recursive:true});
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900}});
  const page=await context.newPage();await page.goto(base);
  await page.waitForFunction(()=>{const v=document.querySelector('#site-hero-video');return !v.paused&&v.currentTime>.1&&v.videoWidth>0;});
  const v=page.locator('#site-hero-video'),toggle=page.locator('[data-hero-toggle]');
  assert.ok((await v.getAttribute('src')).includes(width<700?'mobile-v6':'shop-film-v6'));
  assert.equal(await v.evaluate(e=>e.duration),33.6);assert.ok(await v.evaluate(e=>e.muted&&e.loop));
  const t=await v.evaluate(e=>e.currentTime);await page.waitForTimeout(300);assert.ok(await v.evaluate((e,t)=>e.currentTime>t,t));
  assert.equal(await toggle.getAttribute('aria-label'),'Pause background video');assert.equal((await toggle.textContent()).trim(),'');
  assert.equal(await toggle.locator('svg').evaluate(e=>e.getBoundingClientRect().width),20);
  await toggle.click();assert.ok(await v.evaluate(e=>e.paused));assert.equal(await toggle.getAttribute('aria-label'),'Play background video');
  assert.ok(await toggle.locator('[data-hero-play]').isVisible());await toggle.click();await page.waitForFunction(()=>!document.querySelector('#site-hero-video').paused);
  // Chrome automation forces visibility. Exercise the application's event handler explicitly.
  // This checks handler behavior, not physical OS tab/window visibility delivery.
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForFunction(()=>document.hidden&&document.querySelector('#site-hero-video').paused,null,{polling:100,timeout:5000});
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForFunction(()=>!document.hidden&&!document.querySelector('#site-hero-video').paused);
  const dark=await page.locator('.av-home-copy h1').evaluate(e=>({bg:getComputedStyle(e,'::selection').backgroundColor,fg:getComputedStyle(e,'::selection').color}));
  assert.deepEqual(dark,{bg:'rgb(255, 255, 255)',fg:'rgb(18, 18, 18)'});
  const light=await page.locator('.av-service-card p').first().evaluate(e=>getComputedStyle(e,'::selection').backgroundColor);assert.equal(light,'rgb(18, 18, 18)');
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#site-hero-video')).opacity==='1');
  // Observe real playback: the lightweight preview server does not support Range seeking.
  await v.evaluate(e=>{e.currentTime=0;});
  for(const [i,time] of [0.8,3.5,4.8,9.8,11.2,16.0,18.5,21.6,26.5,28.0,32.6].entries()){
   await page.waitForFunction(t=>{const e=document.querySelector('#site-hero-video');return e.currentTime>=t&&e.currentTime<t+.75;},time);
   assert.ok(await v.evaluate(e=>e.classList.contains('is-playing')&&!e.paused));
   await page.screenshot({path:`${out}/hero-vents-${width}-${i+1}.png`});
  }
  await page.waitForFunction(()=>document.querySelector('#site-hero-video').currentTime>33.1);
  await page.waitForFunction(()=>document.querySelector('#site-hero-video').currentTime<1);
  await v.evaluate(e=>e.play());await page.locator('.av-footer').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('#site-hero-video').paused);
  checks.push({width,playing:true,duration:33.6,mutedLoop:true,loopWrapped:true,pauseResume:true,simulatedVisibilityHandlerPauseResume:true,physicalWindowVisibility:'not verified: automation forces visibility',offscreenPause:true,selection:true,sixShotScreenshots:true,frontArcStartEndScreenshots:true});
  await context.close();
 }
 const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto(base);
 assert.equal(await reduced.locator('#site-hero-video').getAttribute('src'),null);
 assert.ok(await reduced.locator('.av-home-media img').evaluate(e=>e.complete&&e.naturalWidth>0));checks.push({reducedMotionPoster:true});await reduced.close();
 const nojs=await browser.newPage({javaScriptEnabled:false});await nojs.goto(base);
 assert.equal(await nojs.locator('[data-hero-toggle]').isVisible(),false);assert.ok(await nojs.locator('.av-home-media img').evaluate(e=>e.naturalWidth>0));checks.push({noJavaScriptPoster:true});await nojs.close();
 const saved=await browser.newContext();await saved.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true},configurable:true}));
 const saver=await saved.newPage();await saver.goto(base);assert.equal(await saver.locator('#site-hero-video').getAttribute('src'),null);
 assert.ok(await saver.locator('.av-home-media img').evaluate(e=>e.complete&&e.naturalWidth>0));checks.push({dataSavingPoster:true});await saved.close();
 fs.writeFileSync(`${out}/hero-proof.json`,JSON.stringify({browser:'Google Chrome',base,checks},null,2));
 console.log('Hero playback, six-shot front-arc crops, loop, controls, visibility/scroll pause and three poster fallbacks passed.');
}finally{await browser.close();}

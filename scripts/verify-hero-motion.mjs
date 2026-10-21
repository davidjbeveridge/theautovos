import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

// Run after editing the hero media. Container frame rate alone does not catch
// slow motion made by repeating frames. Requires the local ffmpeg CLI.
const supplied=process.argv.slice(2);
const files=supplied.length?supplied:JSON.parse(fs.readFileSync('design/assets.json','utf8')).filter(a=>a.path.endsWith('.mp4')).map(a=>a.path);
assert(files.length,'No hero media selected');
const checks=[];
for(const file of files){
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
 assert.equal(probe.streams.length,1,'Hero must remain silent');
 assert.equal(probe.streams[0].r_frame_rate,'30/1');
 assert.equal(Number(probe.format.duration),36);
 // Interior windows exclude all crossfades in the approved six-shot timeline.
 for(const [shot,start,duration] of [['Raptor',17.4,5.3],['Dakar',30.3,5.1]]){
  const raw=execFileSync('ffmpeg',['-v','error','-ss',String(start),'-i',file,'-t',String(duration),'-vf','scale=320:180,format=gray','-f','rawvideo','-'],{maxBuffer:16*1024*1024});
  const pixels=320*180,frames=raw.length/pixels;
  assert.equal(frames,Math.round(duration*30));
  const deltas=[];
  for(let frame=1;frame<frames;frame++){
   let delta=0;
   for(let pixel=0;pixel<pixels;pixel++)delta+=Math.abs(raw[frame*pixels+pixel]-raw[(frame-1)*pixels+pixel]);
   deltas.push(delta/pixels);
  }
  // Lossy compression makes exact duplicate hashes unreliable. A quarter-level
  // mean luma change catches the observed repeated-frame holds in these shots.
  const repeated=deltas.filter(d=>d<.25).length;
  const repeatFraction=repeated/deltas.length;
  checks.push({file,shot,frames,nearRepeatedFrames:repeated,repeatFraction,medianDelta:[...deltas].sort((a,b)=>a-b)[Math.floor(deltas.length/2)]});
  assert(repeatFraction<.05,`${file} ${shot}: ${(100*repeatFraction).toFixed(1)}% near-repeated frames; motion stutters`);
 }
}
if(process.env.HERO_MOTION_REPORT)fs.writeFileSync(process.env.HERO_MOTION_REPORT,JSON.stringify(checks,null,2)+'\n');
console.log(JSON.stringify(checks,null,2));
console.log('Hero motion cadence passed. This does not replace visual geometry review.');

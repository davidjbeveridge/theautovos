// Worker-compatible handler. No persistence, logging, client-controlled recipient or retries.
export const RECIPIENT='theautovos@gmail.com';
export const SERVICE_IDS=['tint','ppf','ceramic','windshield','choose','general'];
const json=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const clean=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
export function validate(data){
 const errors={};const limits={name:100,email:254,phone:40,message:2000,vehicle:120,timing:100};
 for(const [key,max] of Object.entries(limits))if(data[key]!==undefined&&(typeof data[key]!=='string'||data[key].length>max))errors[key]='Please shorten this field and use plain text.';
 if(!clean(data.name,100))errors.name='Enter your name.';
 if(!SERVICE_IDS.includes(data.service))errors.service='Choose a service or help me choose.';
 if(!['email','phone'].includes(data.reply))errors.reply='Choose email or phone.';
 if(!clean(data.message,2000))errors.message='Tell us what you would like help with.';
 const email=clean(data.email,254),phone=clean(data.phone,40);
 if((data.reply==='email'||email)&&(!/^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/.test(email)||/[\r\n]/.test(data.email)))errors.email='Enter a valid email address.';
 if((data.reply==='phone'||phone)&&(!/^[+\d() .-]{7,40}$/.test(phone)||phone.replace(/\D/g,'').length<7))errors.phone='Enter a valid phone number.';
 if(data.consent!==true)errors.consent='Please allow us to reply to this inquiry.';
 return errors;
}
function context(value){const raw=value&&typeof value==='object'&&!Array.isArray(value)?value:{};const safe={};
 // Campaign IDs must be bounded slugs. Never accept arbitrary query strings or free text.
 for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'])if(typeof raw[key]==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(raw[key]))safe[key]=raw[key];
 if(typeof raw.landing==='string'&&/^\/[a-zA-Z0-9/_-]{0,180}$/.test(raw.landing))safe.landing=raw.landing;
 if(typeof raw.referrer==='string'&&/^(?:[a-z0-9-]+\.)+[a-z]{2,24}$/i.test(raw.referrer))safe.referrer=raw.referrer;
 return safe;
}
async function readBounded(request){const reader=request.body?.getReader();if(!reader)throw Error('empty');let size=0,parts=[];try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>12288){await reader.cancel();throw Error('large');}parts.push(value);}}finally{reader.releaseLock();}const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}return JSON.parse(new TextDecoder().decode(bytes));}
export async function handleInquiry(request,{origin,verifySpam,limit,deliver,available=true,demo=false}={}){
 if(request.method!=='POST')return json(405,{state:'rejected',message:'Use the inquiry form to submit a request.'});
 if(request.headers.get('origin')!==origin)return json(403,{state:'rejected',message:'Open the form on this website and try again.'});
 if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))return json(415,{state:'rejected',message:'Unsupported request format.'});
 if(Number(request.headers.get('content-length'))>12288)return json(413,{state:'rejected',message:'The inquiry is too large.'});
 let data;try{data=await readBounded(request);}catch(err){return json(err.message==='large'?413:400,{state:'rejected',message:'The inquiry could not be read.'});}
 if(!data||typeof data!=='object'||Array.isArray(data))return json(400,{state:'rejected',message:'Invalid inquiry.'});
 if(data.website)return json(400,{state:'rejected',message:'The spam check did not pass.'});
 const errors=validate(data);if(Object.keys(errors).length)return json(422,{state:'invalid',errors});
 if(!available||!verifySpam||!limit||!deliver)return json(503,{state:'unavailable',message:'Online inquiries are unavailable. Please call or email the studio.'});
 try{if(!await limit(request))return json(429,{state:'rejected',message:'Too many attempts. Wait a little or contact the studio directly.'});}catch{return json(503,{state:'unavailable',message:'Online inquiries are temporarily unavailable. Please call or email.'});}
 if(typeof data.token!=='string'||data.token.length>2048)return json(400,{state:'rejected',message:'Complete the spam check and try again.'});
 try{if(!await verifySpam(data.token,request))return json(400,{state:'rejected',message:'The spam check expired or did not pass. Please try again.'});}catch{return json(503,{state:'unavailable',message:'We could not verify the spam check. Please try again or call.'});}
 const id=crypto.randomUUID(),source=context(data.context);
 const lead={id,createdAt:new Date().toISOString(),to:RECIPIENT,service:data.service,reply:data.reply,consent:true,source};
 for(const [key,max]of Object.entries({name:100,email:254,phone:40,message:2000,vehicle:120,timing:100}))lead[key]=clean(data[key],max);
 try{const result=await deliver(lead);if(result?.accepted!==true)return json(502,{state:'failed',message:'The email provider did not accept the inquiry. Your details are still here. Please call or email.'});return json(200,{state:demo?'simulated':'accepted',id,message:demo?'Demo complete. No email was sent and no inquiry was saved.':'Your inquiry was accepted for delivery. This is not a booking. If you do not hear back, contact the studio with this reference.'});}
 catch{return json(504,{state:'uncertain',id,message:'We could not confirm delivery. It may have gone through. Please call or email with this reference before sending again.'});}
}
export function productionDependencies(env,fetcher=fetch){let host;try{host=new URL(env.SITE_ORIGIN).hostname;}catch{}
 const available=!!(host&&env.TURNSTILE_SECRET&&env.RESEND_API_KEY&&env.MAIL_FROM&&env.INQUIRY_RATE_LIMITER?.limit);
 return {origin:env.SITE_ORIGIN,available,
 limit:async request=>{const ip=request.headers.get('cf-connecting-ip');if(!ip)return false;return (await env.INQUIRY_RATE_LIMITER.limit({key:ip})).success;},
 verifySpam:async(token,request)=>{const response=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:env.TURNSTILE_SECRET,response:token,remoteip:request.headers.get('cf-connecting-ip')||''}),signal:AbortSignal.timeout(8000)});if(!response.ok)return false;const value=await response.json();return value.success===true&&value.hostname===host&&value.action==='inquiry';},
 deliver:async lead=>{const body={from:env.MAIL_FROM,to:[RECIPIENT],subject:'Auto Vos inquiry: '+lead.service,text:`Inquiry reference: ${lead.id}\nReceived: ${lead.createdAt}\nName: ${lead.name}\nPreferred reply: ${lead.reply}\nEmail: ${lead.email}\nPhone: ${lead.phone}\nService: ${lead.service}\nVehicle: ${lead.vehicle}\nTiming: ${lead.timing}\nPermission to reply: yes\nSource: ${JSON.stringify(lead.source)}\n\n${lead.message}`,...(lead.email?{reply_to:lead.email}:{})};const response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json','idempotency-key':lead.id},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});if(!response.ok){if(response.status>=500)throw Error('uncertain provider result');return {accepted:false};}const value=await response.json();if(typeof value.id!=='string'||!value.id)throw Error('unconfirmed provider receipt');return {accepted:true};}
 };
}

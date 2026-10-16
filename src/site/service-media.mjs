import {readFileSync} from 'node:fs';
const approved=JSON.parse(readFileSync(new URL('./approved-media.json',import.meta.url)));
import {escape as e} from '../components.mjs';
import {mediaExplanation} from '../editorial.mjs';
const photos={
 tint:{src:'/assets/services/cabin-side-glass.jpg',alt:'View from inside a car through the front side window',caption:'The view through a car\u2019s side window. Choose a tint shade that keeps your view comfortable in daylight and after dark. Photo: Auto Vos.'},
 ppf:approved.ppfExplanation,
 ceramic:{src:'/assets/services/fusion-plus-kit.jpg',alt:'XPEL FUSION PLUS Paint and PPF ceramic coating bottle and application kit at Auto Vos',caption:'XPEL FUSION PLUS for paint and PPF. The liquid coating cures on a prepared surface to make washing easier. Photo: Auto Vos.'},
 windshield:approved.windshieldExplanation
};
export function educationPhoto(id,path=''){
 let photo=photos[id];
 if(id==='ppf'&&path.includes('/porsche/'))photo={src:'/assets/reviews/christopher-jones-md-6.jpg',alt:'Christopher Jones’s silver Porsche GT3 Touring outside the studio',caption:'Christopher\u2019s GT3 Touring after its full protective wrap. Customer photo: Christopher Jones, MD.'};
 if(id==='ppf'&&path.includes('/tesla/'))photo={src:'/assets/services/tesla-ppf.jpg',alt:'Gray Tesla outside the Auto Vos studio',caption:'A gray Tesla outside Auto Vos. Clear PPF lets the paint color show through; coverage is chosen panel by panel. Photo: Auto Vos.'};
 if(id==='tint'&&path.includes('/bmw/'))photo={src:'/assets/services/bmw-side-glass.jpg',alt:'Side view of a blue BMW showing its front and rear window glass',caption:'Front and rear side windows on a BMW. We\u2019ll help you choose a shade that works with your existing glass and your view after dark. Photo: Auto Vos.'};
 if(id==='tint'&&path.includes('/porsche/'))photo={src:'/assets/video-stills/targa-finished-glass-23m49.jpg',alt:'Curved Porsche Targa rear glass during the Auto Vos tint installation walkthrough',caption:'Fitting tint to the Targa’s curved rear window, 23:49 into our installation video.',small:true,href:'/resources/porsche-targa-rear-window-tint-installation/'};
 return photo;
}
export function photoFigure(photo){return `<figure class="site-service-photo${photo.small?' site-service-photo--small':''}"><a data-lightbox href="${e(photo.src)}" aria-label="Enlarge: ${e(photo.alt)}"><img class="av-image" src="${e(photo.src)}" alt="${e(photo.alt)}" title="${e(photo.alt)}" width="${photo.small?320:2500}" height="${photo.small?180:1875}" loading="lazy" decoding="async"></a><figcaption class="av-caption">${e(photo.caption)}${photo.href?` <a href="${photo.href}">Watch the installation.</a>`:''}</figcaption></figure>`;}
export const diagrams={
 windshield:{file:'windshield-protection-914-v3',title:'Protection film goes on the outside of the windshield',alt:'Photo-based diagram of the green Porsche 914: exterior protection film and adhesive are shown separated above the installed windshield glass.',caption:'Film bonds to the outside of the Porsche 914 windshield with an adhesive layer. This AI-assisted illustration separates and enlarges the layers to show how they fit; installed layers have no air gaps. Film cannot prevent every chip or crack.'},
 tint:{file:'tint-layers',title:'How window tint sits against the glass',alt:'Cross-section: sunlight reaches the glass; an adhesive layer holds ceramic tint film to the cabin side.',caption:'Window tint is fitted to the inside of the glass. The film changes how much light, UV and solar heat pass through. Illustrative cross-section: thickness and light rays are not measurements; performance depends on the glass and selected film.'},
 ppf:{file:'ppf-layers',title:'The layers between road debris and your paint',alt:'Exploded PPF illustration, top to bottom: road debris, self-healing topcoat, polyurethane film, adhesive, clear coat, color coat, primer and body panel.',caption:'PPF sits over the paint and clear coat. Some films have a topcoat that recovers from light surface marks when warmed; deep cuts and punctures do not heal. The layers are separated and enlarged here so you can see how they fit together.'},
 ceramic:{file:'ceramic-layers',title:'How ceramic coating covers a prepared surface',alt:'Exploded illustration of water droplets and dirt above ceramic coating, prepared paint or compatible film, and a metal body panel.',caption:'A liquid-applied coating cures into a thin layer on prepared paint or compatible film. Layers are separated and greatly exaggerated here for clarity: coating is not a peelable sheet or a cushion against stone impacts.'},
 combination:{file:'ceramic-over-ppf',title:'Ceramic coating goes over compatible PPF',alt:'Exploded diagram showing ceramic coating over polyurethane PPF, followed by adhesive, clear coat, color coat, primer and the body panel.',caption:'Ceramic coating goes on top of compatible PPF. The film’s adhesive holds it over the car’s clear coat and paint. The film protects against some physical wear; the coating helps with cleaning. Illustration, not to scale. The coating is liquid-applied; the separated layers do not represent air gaps.'}
};
const diagramExplanations={
 windshield:'Clear protection film adheres to the outside of the windshield as a replaceable layer. It can help with road wear, but it cannot prevent every chip or crack.',
 tint:'Window tint is applied to the cabin side of the glass. The selected film and the vehicle’s existing glass affect light, UV and solar-heat performance.',
 ppf:'Paint protection film sits over the paint and clear coat. Some light surface marks can recover with warmth; deep cuts and punctures do not heal.',
 ceramic:'Ceramic coating is liquid-applied to prepared paint or compatible film. It helps with cleaning; it is not a peelable sheet or a barrier against stone impacts.',
 combination:'PPF provides a physical layer against some road wear. A compatible ceramic coating goes over the film to help with cleaning; the two products serve different purposes.'
};
export function serviceDiagram(id){
 const d=diagrams[id];if(!d)return '';
 const html=mediaExplanation({title:d.title,text:diagramExplanations[id],image:{src:`/assets/diagrams/${d.file}.png`,alt:d.alt,width:1448,height:1086},caption:d.caption,lightboxLabel:`Enlarge diagram: ${d.title}`,className:'site-service-diagram'});
 return html.replace('class="site-media-explanation site-service-diagram"','class="site-media-explanation site-service-diagram" data-diagram="'+e(id)+'"');
}
export const combinationQuestions=[
  [
    "Can I use PPF and ceramic coating together?",
    "Yes. Paint protection film helps protect against small stone chips and scuffs; ceramic coating makes the surface easier to wash. Install the PPF first, then apply a coating made for that film. The coating can also go on prepared paint on panels without PPF."
  ],
  [
    "Is ceramic coating over PPF worth it?",
    "It can be if easier cleaning is your goal. Some PPF already sheds water well, so the benefit depends on the film you have and how you care for the car. Adding coating will not make the film chip-proof or remove the need to wash it."
  ],
  [
    "Which goes on first: PPF or ceramic coating?",
    "PPF goes on the prepared paint first. A compatible ceramic coating goes over the film after the required preparation and drying time. We’ll explain the timing for the products used on your car."
  ],
  [
    "Can you install PPF over an existing ceramic coating?",
    "Tell us about the coating before booking. The film needs a surface its adhesive can bond to, so the existing coating may need removing from the panels receiving PPF. That preparation needs to be included in your quote."
  ],
  [
    "Can I get full-front PPF and ceramic coating on the rest of the car?",
    "Yes. That lets you protect the front panels from small chips and make the rest of the paint easier to clean. A compatible coating can also go over the PPF. Your quote will list which panels get film, coating or both."
  ],
  [
    "How much do PPF and ceramic coating cost together?",
    "The price depends on your car, the amount of film, the coating and the paint preparation. Full-body PPF covers more of the car and takes more work than full-front PPF. Send us your year, make and model and the areas you want protected for a combined quote from our Colorado Springs studio."
  ],
  [
    "Will ceramic coating over PPF stop rock chips?",
    "The PPF provides the physical barrier against small stone impacts. Ceramic coating helps with cleaning; it does not add another thick layer of chip protection. A hard or sharp impact can still damage the film and the paint underneath."
  ],
  [
    "Can you ceramic coat satin or matte PPF?",
    "Yes, with a coating made for that film and finish. XPEL STEALTH is the matte-finish PPF. A suitable coating helps with cleaning while preserving that appearance. Tell us the film you have so we can check compatibility before applying anything."
  ],
  [
    "How do I wash a car with PPF and ceramic coating?",
    "Wait until the installer says both products are ready for washing. Use a gentle wash method and approved cleaners, keep pressure-washer jets away from film edges, and dry the car to reduce water spots. Neither PPF nor coating makes the car self-cleaning."
  ],
  [
    "How long does ceramic coating last on PPF?",
    "That depends on the coating, the film, exposure and maintenance. The film and coating have their own service lives and warranty terms; adding one does not reset the warranty on the other. Ask us for the care instructions and written coverage for both products."
  ]
];
export function combinationSection(id,path=''){const make=path.includes('/porsche/')?'Porsche':path.includes('/bmw/')?'BMW':path.includes('/tesla/')?'Tesla':'';if(!['ppf','ceramic'].includes(id))return '';return `<section class="site-combination site-spaced" aria-labelledby="ppf-coating-heading"><p class="av-eyebrow">Using both</p><h2 class="av-title" id="ppf-coating-heading">Can I use PPF and ceramic coating together?</h2><p class="av-lead site-spaced">Yes. Put film on the panels you want protected from chips and everyday contact, then use a compatible ceramic coating to make those surfaces easier to wash. You can also coat the paint on panels that do not have film.</p>${serviceDiagram('combination')}<ol class="site-education-steps"><li><h4>Prepare the paint.</h4><p>Clean and assess the finish. Tell us about repairs, existing film or coating so the surface can be prepared for adhesion.</p></li><li><h4>Install the PPF.</h4><p>Fit the film to the selected panels, then let it settle and prepare it for coating according to the product instructions.</p></li><li><h4>Coat the compatible surfaces.</h4><p>Apply the compatible coating over the film and any exposed paint you want coated, then allow it to cure. We’ll explain when to wash the car and how to care for both products.</p></li></ol><p class="site-spaced">XPEL makes FUSION PLUS coatings for use with compatible PPF, including options for satin finishes. <a target="_blank" rel="noopener noreferrer" href="https://www.xpel.com/blog/choosing-right-ceramic-coating-your-vehicle-xpel-fusion-plus">Read XPEL’s product guidance.</a></p><p>The quote should name the film, coating, covered panels and preparation for each. <a href="/get-a-quote/?service=${id}${make?'&amp;make='+make:''}">Get a quote for PPF and coating.</a></p></section>`;}

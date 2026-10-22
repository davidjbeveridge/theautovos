// Reviewed page-specific search/share copy. Business facts stay in content.mjs.
const descriptions={
 '/work/':'See Auto Vos window tint, paint protection film and windshield protection installations in Colorado Springs. Browse project videos and customer-car galleries.',
 '/gallery/':'Explore window tint, paint protection film, windshield protection and XPEL STEALTH matte PPF galleries from Auto Vos in Colorado Springs.',
 '/gallery/window-tint/':'Explore window tint installations at Auto Vos in Colorado Springs, with close-ups of side glass, rear windows and finished customer cars.',
 '/gallery/windshield-protection-film/':'Browse windshield protection film work at Auto Vos in Colorado Springs, from fitting exterior film around glass edges to finished customer vehicles.',
 '/gallery/paint-protection-film/':'See paint protection film installations at Auto Vos in Colorado Springs. Browse clear PPF fitting details, panel edges and finished customer vehicles.',
 '/gallery/stealth-matte-ppf/':'See XPEL STEALTH matte paint protection film on customer vehicles at Auto Vos in Colorado Springs, with installation details and finished matte surfaces.',
 '/reviews/':'Read five customer reviews of Auto Vos in Colorado Springs, see their vehicle photos and open the original Google reviews. Get to know our work.',
 '/resources/':'Read Auto Vos guides to window tint, paint protection film and ceramic coating. Watch real Porsche installations and get answers before requesting a quote.',
 '/work/ineos-grenadier-tint-ppf/':'Watch a walkaround of a 2024 INEOS Grenadier with window tint and paint protection film by Auto Vos in Colorado Springs. See the finished vehicle up close.'
};
const sharingImages={
 '/about/':{src:'/assets/work/oct15/corvette-outside-auto-vos.jpg',alt:'Red Corvette outside the Auto Vos vehicle protection shop in Colorado Springs'},
 '/services/window-tint/porsche/':{src:'/assets/targa-guide/step-03-graded.jpg',alt:'Installer cleaning the curved rear glass of a Porsche 911 Targa at Auto Vos'},
 '/services/window-tint/porsche/911-targa/':{src:'/assets/targa-guide/step-03-graded.jpg',alt:'Installer cleaning the curved rear glass of a Porsche 911 Targa at Auto Vos'},
 '/services/paint-protection-film/bmw/':{src:'/assets/reviews/jonathan-1.jpg',alt:'BMW M8 with a satin matte finish at the Auto Vos shop'},
 '/work/ineos-grenadier-tint-ppf/':{src:'/assets/video-previews/ineos-grenadier-tint-ppf.jpg',alt:'Dark INEOS Grenadier outside Auto Vos after window tint and paint protection film work'}
};
export function searchMetadata(page){
 const result={...page};
 if(/^\/services\/(window-tint|paint-protection-film|ceramic-coating)\/(porsche|bmw|tesla)\/$/.test(page.path))result.title=page.title+' in Colorado Springs';
 if(page.path==='/gallery/')result.title='Vehicle protection galleries in Colorado Springs | Auto Vos';
 if(descriptions[page.path])result.description=descriptions[page.path];
 if(/^\/work\/(porsche|bmw|tesla)\/$/.test(page.path)){
  const brand={porsche:'Porsche',bmw:'BMW',tesla:'Tesla'}[page.path.split('/')[2]];
  result.description=`Explore ${brand} vehicle protection work at Auto Vos in Colorado Springs. Browse customer-car photos and find service options for your next installation.`;
 }
 if(sharingImages[page.path])result.sharingImage=sharingImages[page.path];
 return result;
}

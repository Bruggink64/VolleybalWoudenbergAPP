// Terugknop binnen de app (november 2026).
// De app is één pagina; zonder dit bestand bracht de terugknop van de browser of de telefoon je meteen uit de hele app.
// Nu krijgt elke schermwissel een eigen stap in de geschiedenis van de browser:
// - een ander tabblad (Home, Mini's, Jeugd & Senioren, 5-1 rotaties, Verdediging)
// - een venster dat opengaat: oefening kiezen, suggestie, beheer, proefversie, het instellingenpaneel op de telefoon en de zaalmodus
// Terug sluit eerst het bovenste venster en gaat daarna naar het vorige tabblad. Op het beginscherm verlaat terug de app.
// Het adres in de balk blijft gelijk (#beheer en de deel-links blijven werken).
(function(){
if(window.top!==window||!history.pushState)return; // niet in de proefversie (die draait in een venster binnen de app)
const qa=s=>Array.from(document.querySelectorAll(s));
const VIEWS=['home','gen','sen','rot','def','aanval'];
const view=()=>VIEWS.find(k=>{const e=document.getElementById('v_'+k);return e&&e.style.display!=='none';})||'home';

// welke vensters zijn open, in de volgorde waarin ze opengingen
let order=[];
function openNow(){
 const l=qa('dialog[open]').concat(qa('aside.sheet'));
 const h=document.getElementById('hall');if(h&&h.style.display&&h.style.display!=='none')l.push(h);
 return l;
}
function shut(el){
 if(el.tagName==='DIALOG'){el.close();return;}
 if(el.id==='hall'){if(typeof hallClose==='function')hallClose();return;}
 const bk=document.querySelector('.owback');if(bk)bk.click();else el.classList.remove('sheet');
}

let ov=0,skip=0,restoring=false;
const st=(v,o)=>({app:1,v,ov:o});
const push=(v,o)=>{history.pushState(st(v,o),'');ov=o;};

// als een venster opengaat: een stap erbij; sluit je het zelf (knop, Esc, buiten tikken): die stap weer weg
function sync(){
 const now=openNow();
 order=order.filter(e=>now.includes(e)).concat(now.filter(e=>!order.includes(e)));
 const n=order.length;
 if(restoring)return;
 if(n>ov){for(let i=ov+1;i<=n;i++)push(view(),i);}
 else if(n<ov){const d=ov-n;ov=n;skip++;history.go(-d);}
}
new MutationObserver(()=>sync()).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','class','style']});

// een ander tabblad: een stap erbij
const orig=window.setView;
if(typeof orig==='function')window.setView=function(v){
 const was=view();orig.apply(this,arguments);
 if(!restoring&&v!==was&&VIEWS.includes(v))push(v,order.length);
};

// terug (of vooruit)
window.addEventListener('popstate',e=>{
 if(skip){skip--;return;}
 const s=e.state&&e.state.app?e.state:null;
 restoring=true;
 try{
  const want=s?s.ov:0;
  // vensters die op deze stap niet open waren: sluiten, bovenste eerst
  while(order.length>want){const el=order.pop();shut(el);}
  if(s&&s.v&&s.v!==view()){orig(s.v);window.scrollTo(0,0);}
  ov=order.length;
 }finally{setTimeout(()=>{restoring=false;sync();},0);}
});

// beginstand: deze stap is het beginscherm (terug gaat dan de app uit)
// direct geopend met #beheer: het beheer is dan al aan het openen; haal #beheer uit het adres,
// zodat terug of Sluiten de lijst niet opnieuw opent
history.replaceState(st(view(),0),'',location.hash==='#beheer'?location.pathname+location.search:location.href);
sync();
})();

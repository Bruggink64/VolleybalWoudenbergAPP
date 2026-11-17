// Suggestieknop: bij elke oefening een knop "Suggestie" die het Google Formulier van de vereniging opent,
// vooringevuld met de naam van de oefening. Geen account of opslag in de app nodig.
// Instellen: plak hieronder de vooringevulde link van het formulier, met OEFENING op de plek van de oefening.
(function(){
const FORM='https://docs.google.com/forms/d/e/1FAIpQLSfW4r07un-M1WLEXwtFc9mlvhTlo5_dnSGVkD_UVD9D4X4hRA/viewform?usp=pp_url&entry.534773472=OEFENING';
if(!FORM)return;
const css=document.createElement('style');
css.textContent='.sug{font-size:12.5px;padding:5px 9px;background:none}.sugg{margin-left:auto;align-self:center;font-size:13px;padding:6px 12px;margin-bottom:10px;background:#fff}';
document.head.appendChild(css);
const link=t=>FORM.replace('OEFENING',encodeURIComponent(t));
const open=t=>window.open(link(t),'_blank','noopener');
// welke oefening: naam uit de kop, deel uit het tabblad
function label(dr){
 const h=dr.querySelector('h3');
 const deel=dr.closest('#v_sen')?'Jeugd & Senioren':'Mini’s';
 return deel+': '+(h?h.textContent.trim():'onbekend');
}
function add(root){
 root.querySelectorAll('.dr .tools').forEach(tl=>{
  if(tl.querySelector('.sug'))return;
  const b=document.createElement('button');b.className='sug';b.type='button';b.textContent='Suggestie';
  b.title='Stuur een verbetering of idee voor deze oefening';
  b.onclick=()=>open(label(tl.closest('.dr')));
  tl.appendChild(b);
 });
}
// algemene knop in de kop, voor een nieuwe oefening of ander idee
const hd=document.querySelector('header');
if(hd){const g=document.createElement('button');g.className='sugg noprint';g.type='button';g.textContent='Idee of suggestie';
 g.title='Stuur een idee voor de app of een nieuwe oefening';g.onclick=()=>open('Algemeen');hd.appendChild(g);}
// de app tekent oefeningen telkens opnieuw: knoppen toevoegen zodra er iets verandert
add(document);
new MutationObserver(()=>add(document)).observe(document.body,{childList:true,subtree:true});
})();

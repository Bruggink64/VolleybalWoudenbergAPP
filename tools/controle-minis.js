// tools/controle-minis.js – controleert de animatie-opzet van alle mini-oefeningen (VolleyWijzer + eigen m1-m44) tegen de tekst.
// Vraagt de opzet (window.sceneSpec) op in de app zelf. Gebruik (app moet draaien op localhost:8765):
//   node tools/controle-minis.js [--alles]
// Melding F = de tekening spreekt de tekst tegen, ? = twijfel (kijk naar het plaatje met tools/overzicht-minis.js).
'use strict';
const {chromium}=require('playwright');
const lc=s=>String(s||'').toLowerCase();
const NUM={een:1,twee:2,drie:3,vier:4,vijf:5,zes:6};
const num=s=>NUM[s]!=null?NUM[s]:+s;
function check(x){
 const F=[],Q=[],sp=x.spec;
 const u=lc(x.u.join(' ')),t=lc(x.t),all=lc([x.t,x.i,x.u.join(' ')].join(' '));
 const form=sp.form;
 // vorm tegen tekst
 const rules=[
  ['relay',/estafette/],['tag',/tikkertje|\btikkers?\b|jager|tikspel/],['wall',/tegen de muur|smash tegen de muur|muur\b/],
  ['circle',/\bkring\b|\bcirkel\b/],['circuit',/circuit|\bstations?\b|parcours/]];
 for(const [f,re] of rules){
  if(re.test(all)&&form!==f){
   // alleen als het in de oefening zelf (titel of uitvoering) staat
   if(re.test(t)||re.test(u))Q.push('tekst wijst op "'+f+'", tekening is "'+form+'"');
  }
 }
 if(form==='relay'&&!/estafette|rij|achter elkaar|ploeg|team|wedstrijd/.test(all))Q.push('tekening is estafette, tekst niet');
 if(form==='tag'&&!/tik|jager|vang|pak/.test(all))Q.push('tekening is tikspel, tekst niet');
 if(form==='wall'&&!/muur|wand/.test(all))F.push('tekening is muur, tekst noemt geen muur');
 if(form==='circle'&&!/kring|cirkel|rond/.test(all))Q.push('tekening is kring, tekst niet');
 if(form==='serve'&&!/serv|opslag|service/.test(all))F.push('tekening is serveren, tekst niet');
 if(sp.net===false&&/over het net|over de lijn van het net|net\b.*(over|heen)/.test(u)&&!/zonder net|geen net/.test(u))Q.push('tekst noemt het net, tekening toont geen net');
 if(sp.net&&sp.form!=='vs'&&!/net|over de lijn|netpaal/.test(all)&&x.c!=='blokkeren')Q.push('tekening toont een net, tekst noemt het niet');
 // N tegen M
 const vs=u.match(/\b(\d+|twee|drie|vier|vijf|zes)\s*(?:tegen|vs\.?|teg\.)\s*(\d+|twee|drie|vier|vijf|zes)\b/);
 if(vs){const a=num(vs[1]),b=num(vs[2]);
  if(form==='vs'&&Array.isArray(sp.teams)){if(sp.teams[0]!==a||sp.teams[1]!==b)F.push(vs[0]+' in tekst, tekening '+sp.teams.join(' tegen '));}
  else if(form!=='vs')Q.push(vs[0]+' in tekst, tekening is "'+form+'"');}
 // groepsgrootte
 const gr=u.match(/\b(twee|drie|vier|vijf)tallen?\b|groepjes? van (\d|twee|drie|vier|vijf)|in groepen van (\d|twee|drie|vier|vijf)|\b(twee|drie|vier)\s+teams\b/);
 if(gr){const m=gr[0];
  if(/tweetal|paren|groepjes van 2|groepjes van twee/.test(m)&&!['pairs','netpairs','cross','feed','sideline','vs','relay','queue','tag','circuit','serve','wall','scatter'].includes(form))Q.push('"'+m+'" in tekst, tekening is "'+form+'"');
  if(/drietal|groepjes van 3|groepjes van drie/.test(m)&&!['triples','vs','queue','relay','tag','circuit','cross','feed','scatter','wall','serve'].includes(form))Q.push('"'+m+'" in tekst, tekening is "'+form+'"');}
 // materiaal
 const kinds={hoepel:/hoepel/,pylon:/pylon|pion|hoedje|dopje|kegel/,mat:/\bmat(ten|je|jes)?\b/,kast:/kast|\bbok\b/,korf:/korf|korv|basket/,bank:/\bbank/,kar:/ballenkar|emmer|\bbak\b/,muur:/wandrek|muur|wand\b/,doel:/\bdoel(tje|en)?\b/,stoel:/stoel/,koord:/\blint|elastiek|touw/};
 const have=new Set((sp.objs||[]).map(o=>o.t));
 for(const [k,re] of Object.entries(kinds)){
  const inB=(x.b||[]).some(b=>re.test(lc(Array.isArray(b)?b[0]:b)));
  const inU=re.test(u);
  if(inB&&!have.has(k)&&!(k==='muur'&&form==='wall')&&!(k==='hoepel'&&form==='hoopcatch'))Q.push('benodigd: '+k+', niet getekend');
  if(!inB&&inU&&!have.has(k)&&k!=='doel')Q.push('tekst noemt '+k+', niet in benodigdheden en niet getekend');
  if(have.has(k)&&!inB&&!inU)F.push('tekening heeft '+k+', tekst en benodigdheden niet');
 }
 // trainer
 if(/\btrainer\b|\bcoach\b/.test(u)&&!sp.trainer&&!['queue','feed','sideline'].includes(form))Q.push('tekst noemt de trainer, tekening toont geen trainer');
 if(sp.trainer&&!/\btrainer\b|\bcoach\b|\bleiding\b/.test(all))F.push('tekening toont trainer, tekst niet');
 // actie
 if(sp.action==='smash'&&!/sla|smash|aanval|swing|slaan/.test(all))Q.push('actie smash, tekst noemt geen slaan');
 if(sp.action==='serve'&&!/serv|service|opslag/.test(all))Q.push('actie serveren, tekst niet');
 if(sp.action==='block'&&!/blok/.test(all))Q.push('actie blok, tekst niet');
 if(sp.action==='dive'&&!/duik|val|rol|zweef|liggen|grond/.test(all))Q.push('actie duik, tekst noemt geen duik');
 if(sp.action==='overhead'&&!/bovenhands|set|opzet/.test(all))Q.push('actie bovenhands, tekst niet');
 if(sp.action==='forearm'&&!/onderarm|pass|onderhands/.test(all))Q.push('actie onderarms, tekst niet');
 if(sp.action==='roll'&&!/rol/.test(all))Q.push('actie rollen, tekst niet');
 if(['throw','smash','overhead','forearm','bounce','roll','dive','block'].includes(sp.action)&&/zonder bal|geen bal/.test(u)&&form!=='tag')Q.push('tekst zegt zonder bal, tekening toont bal');
 return {F,Q};
}
(async()=>{
 const alles=process.argv.includes('--alles');
 const br=await chromium.launch();const pg=await br.newPage();
 await pg.goto('http://localhost:8765/index.html');await pg.waitForTimeout(800);
 const res=await pg.evaluate(()=>D.map(d=>{const x=window.VWX[d[3]];return {id:d[3],lvl:d[0],t:d[1],c:x.c,i:x.i,b:x.b,u:x.u.map(s=>Array.isArray(s)?s.join(' '):s),a:x.a,spec:window.sceneSpec(d)};}));
 let nF=0,nQ=0,nOk=0;const bad=[];
 for(const x of res){const r=check(x);
  if(!r.F.length&&!r.Q.length)nOk++;else if(r.F.length){nF++;bad.push(x.id);}else{nQ++;bad.push(x.id);}
  if(alles||r.F.length||r.Q.length){console.log('L'+x.lvl+' '+x.t+' ['+x.id.slice(-6)+', '+x.spec.form+(Array.isArray(x.spec.teams)?' '+x.spec.teams.join('-'):'')+']');r.F.forEach(m=>console.log('  F '+m));r.Q.forEach(m=>console.log('  ? '+m));}}
 console.log('\n'+res.length+' mini-oefeningen: '+nOk+' zonder melding, '+nF+' met fout, '+nQ+' alleen twijfel');
 require('fs').writeFileSync(process.env.MINIS_BAD||'/dev/null',JSON.stringify(bad));
 await br.close();
})();

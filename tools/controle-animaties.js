// tools/controle-animaties.js – controleert elke Jeugd & Senioren-animatie tegen de tekst.
// Gebruik: node tools/controle-animaties.js [--alles] [id ...]
// Toont per oefening de punten die niet kloppen (F = fout, ? = twijfel). Zonder --alles alleen oefeningen met een melding.
// Regels: zie tools/lessen-oefeningen.md ("Controle animaties").
'use strict';
const path=require('path');
global.window={};
require(path.join(__dirname,'..','senioren.js'));
const SEN=window.SEN;
// zelfde indeling als senioren-app.js / 3d.js
const SO=require(path.join(__dirname,'..','senioren-obj.js'));
const kt=[0,0.15,0.3,0.45,0.6,0.82,0.96,1];
const TRAINER='#2dd4bf';
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const lc=s=>String(s).toLowerCase();

// positie van een speler op tijdstap i (zelfde regels als anim() in senioren-app.js; doordraaien niet meegerekend)
function posAt(p,i){const q=p[2];if(q.length===7)return q[Math.min(i,6)];return q[Math.min(i,3)];}

const NUM={een:1,twee:2,drie:3,vier:4,vijf:5,zes:6,zeven:7,acht:8,negen:9,tien:10,elf:11,twaalf:12};
const num=s=>NUM[s]!=null?NUM[s]:+s;

function check(d){
 const F=[],Q=[];
 const txt=lc([d.t,d.opzet,...d.stappen].join(' '));
 const all=lc([d.t,d.opzet,...d.stappen,d.variatie||'',...(d.aandacht||[])].join(' '));
 const kinds=d.p.map(p=>SO.kind(d,p));
 const people=d.p.filter((p,i)=>!kinds[i]);
 const objs=d.p.filter((p,i)=>kinds[i]);
 const trainers=people.filter(p=>p[1]===TRAINER);
 const spelers=people.filter(p=>p[1]!==TRAINER);
 const own=spelers.filter(p=>p[2][0][1]>340),opp=spelers.filter(p=>p[2][0][1]<340);
 const kindCount={};objs.forEach(p=>{const k=SO.kind(d,p);kindCount[k]=(kindCount[k]||0)+1;});
 // 1. dubbele namen
 const nm={};d.p.forEach(p=>nm[p[0]]=(nm[p[0]]||0)+1);
 Object.entries(nm).forEach(([k,c])=>{if(c>1&&!SO.kind(d,[k]))F.push('naam '+k+' komt '+c+'x voor');});
 // 2. materiaal in de tekst moet in de tekening staan (en andersom)
 const MAT=[['pion',/pion|kegel|hoedje|dopje/],['mat',/\bmat(ten)?\b|doelmat/],['hoepel',/hoepel/],['korf',/korf|basket/],['kar',/ballenkar|ballenbak|\bkar\b/],['box',/\bbox\b|\bbank(je)?\b|kast|verhoging|stoel|coachblok/],['ladder',/ladder/],['lint',/\blint|elastiek|touw/],['zone',/doelzone|doelvak|vak(ken)? (aan|op|in)|goudzone|zone (aan|wijst)|vakje|in het doel|passdoel|het doel (bij|op)|doelmat|doelwit|\bde zone\b|raak de zone/]];
 MAT.forEach(([k,re])=>{
  const inT=re.test(txt),inA=!!kindCount[k];
  if(inT&&!inA)Q.push('tekst noemt '+k+', tekening niet');
  if(inA&&!re.test(all))F.push('tekening heeft '+k+' ('+kindCount[k]+'x), tekst niet');
 });
 // 3. trainer
 const trT=/\btrainer\b|\bcoach\b/.test(txt);
 if(trT&&!trainers.length&&!/trainer (noemt|wijst|roept|fluit|geeft het signaal|telt)/.test(txt))Q.push('tekst noemt trainer, geen trainer getekend');
 if(trainers.length&&!/trainer|coach|aangever|aangooier|slagman|serveerder|gooit|trainer/.test(all))Q.push('trainer getekend, tekst noemt geen trainer');
 // 4. aantallen "N tegen M"
 const vs=txt.match(/\b(\d+|twee|drie|vier|vijf|zes)\s+tegen\s+(\d+|twee|drie|vier|vijf|zes)\b/);
 if(vs&&!d.baan&&!/\brij\b|plus|wisselende/.test(txt)){const a=num(vs[1]),b=num(vs[2]);const sides=[own.length,opp.length].sort((x,y)=>y-x),want=[a,b].sort((x,y)=>y-x);
  if(!(opp.length===0&&own.length===a+b)&&(sides[0]!==want[0]||sides[1]!==want[1]))(d.vs||d.allen?Q:F).push(vs[0]+' in tekst, getekend '+own.length+' (eigen) tegen '+opp.length+' (overkant)');}
 // 5. groepsgrootte (tweetallen/drietallen)
 const grp=txt.match(/\b(twee|drie|vier)tal(len)?\b/);
 if(grp&&!vs){const g=num(grp[1]);if(spelers.length%g!==0&&spelers.length<g*2)Q.push(grp[0]+' in tekst, '+spelers.length+' spelers getekend');}
 // 6. need vs getekende spelers
 if(spelers.length+trainers.length<d.need-0&&!d.baan)Q.push('need='+d.need+', getekend '+(spelers.length+trainers.length));
 // 7. bal: elk balpunt (behalve het laatste) bij een speler op dat moment
 const b=d.bal;const still=b.every(x=>dist(x,b[0])<1);
 if(!still){
  const last=b.length-1;
  for(let i=0;i<last;i++){
   if(i>0&&dist(b[i],b[i-1])<8)continue; // bal blijft liggen
   let best=1e9,who='';people.forEach(p=>{const q=posAt(p,i),e=dist(q,b[i]);if(e<best){best=e;who=p[0];}});
   const near=objs.some(p=>dist(p[2][0],b[i])<34);
   if(best>34&&!near)(i===0?F:Q).push('balpunt '+i+' ('+b[i]+') ligt '+Math.round(best)+'px van de dichtstbijzijnde speler ('+who+')');
  }
  // stap van de bal en de tekst: ballen over het net
  const crosses=b.slice(1).some((v,i)=>(v[1]-340)*(b[i][1]-340)<0);
  if(/over het net|naar de overkant|aan de overkant (in|op)|serveer/.test(txt)&&!crosses&&!d.zb)Q.push('tekst: bal over het net, balbaan blijft aan één kant');
  // bal buiten de zaal
  b.forEach((v,i)=>{if(v[0]<20||v[0]>540||v[1]<0||v[1]>680)F.push('balpunt '+i+' buiten beeld');});
 }else if(!d.zb&&/\bbal\b/.test(txt)&&!/zonder bal/.test(txt))Q.push('bal beweegt niet');
 // 8. serveerder achter de achterlijn (regel Yannick 17-11)
 if(!still&&/^(de |een )?(overkant )?serve|serveert|service/.test(lc(d.stappen[0]))&&!/vanaf|halverwege|3-meter|driemeter|in het veld/.test(lc(d.stappen[0]+' '+d.opzet))){
  const s=people.find(p=>dist(p[2][0],b[0])<34);
  if(s&&s[2][0][1]>40&&s[2][0][1]<640)Q.push('eerste stap is een service, serveerder '+s[0]+' staat in het veld (y='+s[2][0][1]+')');
 }
 // 9. spelers die op elkaar staan
 for(let i=0;i<4;i++){for(let a=0;a<people.length;a++)for(let c=a+1;c<people.length;c++){if(dist(posAt(people[a],i),posAt(people[c],i))<14){Q.push('stap '+i+': '+people[a][0]+' en '+people[c][0]+' staan op elkaar');a=c=1e9;}}}
 // 10. spelers ver buiten het veld (geen serveerder/rij)
 people.forEach(p=>p[2].forEach(v=>{if(v[0]<30||v[0]>530||v[1]<5||v[1]>675){F.push(p[0]+' buiten beeld ('+v+')');}}));
 // 11. tekst noemt "overkant" maar niemand staat daar (en andersom)
 if(/overkant|over het net|aan beide kanten/.test(txt)&&!opp.length&&!objs.some(p=>p[2][0][1]<340)&&!trainers.some(p=>p[2][0][1]<340)&&!/bal|serv/.test('x'))Q.push('tekst noemt de overkant, daar staat niemand');
 // 13. stap k (tekst) hoort bij de balbeweging b[k-1] -> b[k]
 alignment(d,people,F,Q);
 // 12. object-namen die als speler getekend worden maar op een object lijken
 people.forEach(p=>{if(/^(K|Z|GZ|BOX|M\d?)$/.test(p[0]))F.push(p[0]+' wordt als speler getekend (lijkt een object)');});
 return {F,Q,info:{eigen:own.length,overkant:opp.length,trainers:trainers.length,obj:kindCount}};
}
const VERB=/gooit|gooien|speel|speelt|spelen|passt|pass\b|zet\b|zet op|zetten|slaat|slag|serveert|serveren|service|toetst|tipt|verdedigt|smasht|plaatst|brengt|rolt|stoot|werpt|mikt|vangt|aanval|valt aan|stuit|over het net|terug|redt|blokt|blok|scoort|haalt/;
function who(d,people,i,pt){let best=1e9,w=null;people.forEach(p=>{const e=dist(posAt(p,i),pt);if(e<best){best=e;w=p;}});return best<40?w:null;}
function alignment(d,people,F,Q){
 const b=d.bal;if(b.every(x=>dist(x,b[0])<1))return;
 const st=d.stappen.slice(0,4).concat(b.length===6?[d.stappen[d.stappen.length-1]]:[]);
 st.forEach((t,j)=>{const k=j+1;if(k>=b.length)return;const tl=lc(t),mv=dist(b[k-1],b[k])>12;
  const verb=VERB.test(tl);
  if(mv&&!verb)Q.push('stap '+k+': bal beweegt ('+(who(d,people,k-1,b[k-1])||['?'])[0]+' -> '+(who(d,people,k,b[k])||['grond'])[0]+'), tekst noemt geen balactie: "'+t.slice(0,60)+'"');
  if(!mv&&/gooit|speelt|passt|zet op|slaat|serveert|toetst|werpt/.test(tl)&&!/niet|zonder bal|loopt|aanloop|sprint|schuift|springt/.test(tl))Q.push('stap '+k+': tekst noemt balactie, bal ligt stil: "'+t.slice(0,60)+'"');
  if(mv){const a=who(d,people,k-1,b[k-1]),r=who(d,people,k,b[k]);
   const named=people.filter(p=>p[0].length>0&&new RegExp('(^|[^A-Za-z0-9])'+p[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^A-Za-z0-9]|$)').test(t));
   const roles=[];if(/trainer|coach/.test(tl))roles.push(p=>p[1]===TRAINER);if(/spelverdeler/.test(tl))roles.push(p=>/^O?SV|SET/.test(p[0])||p[1]==='#c084fc');if(/libero/.test(tl))roles.push(p=>/^(L|LIB)$/.test(p[0]));
   const hit=p=>p&&(named.includes(p)||roles.some(f=>f(p)));
   if((named.length||roles.length)&&!hit(a)&&!hit(r))Q.push('stap '+k+': tekst noemt '+[...named.map(p=>p[0]),...(roles.length?['rol']:[])].join('/')+', bal gaat '+(a?a[0]:'?')+' -> '+(r?r[0]:'grond')+': "'+t.slice(0,60)+'"');
  }
 });
}
if(require.main===module){
 const args=process.argv.slice(2),alles=args.includes('--alles'),ids=args.filter(a=>!a.startsWith('--'));
 let nF=0,nQ=0,nOk=0;
 for(const d of SEN){if(ids.length&&!ids.includes(d.id))continue;const r=check(d);
  if(!r.F.length&&!r.Q.length)nOk++;nF+=r.F.length?1:0;nQ+=!r.F.length&&r.Q.length?1:0;
  if(alles||r.F.length||r.Q.length){console.log(d.id+' '+d.t+'  ['+r.info.eigen+' eigen, '+r.info.overkant+' overkant'+(r.info.trainers?', '+r.info.trainers+' trainer':'')+(Object.keys(r.info.obj).length?', '+JSON.stringify(r.info.obj):'')+']');
   r.F.forEach(x=>console.log('  F '+x));r.Q.forEach(x=>console.log('  ? '+x));}}
 console.log('\n'+(ids.length||SEN.length)+' oefeningen: '+nOk+' zonder melding, '+nF+' met fout, '+nQ+' alleen twijfel');
}
module.exports={check};

// Nieuw ontwerp (november 2026). Werkt bovenop de bestaande app, zonder de trainingslogica te veranderen:
// - tabbladen met iconen (op de telefoon een onderbalk)
// - op de telefoon de instellingen ingeklapt tot één regel, die een paneel opent
// - per oefening één hoofdknop "Andere oefening", vastzetten als icoon en de rest in een menu
// - oefeningen ingeklapt (telefoon) of open (pc), met een klein veldje als voorbeeld
// - tijdbalk met de opbouw van de training en een voortgangsbalk in de zaalmodus
// De app tekent de training telkens opnieuw; een MutationObserver past het ontwerp daarna weer toe.
(function(){
const q=(s,r)=>(r||document).querySelector(s), qa=(s,r)=>Array.from((r||document).querySelectorAll(s));
const ic=d=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="'+d+'"/></svg>';
const I={
 home:'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
 mini:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3.5 10c5 0 9 3 10 10M20.5 10c-5 0-9 3-10 10M7 4.5c3 3 5 4 10 4',
 sen:'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M17 11a3 3 0 1 0 0-6M22 21v-1a5 5 0 0 0-4-4.9',
 rot:'M21 12a9 9 0 1 1-3-6.7M21 4v5h-5',
 def:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
 swap:'M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
 pin:'M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3z',
 more:'M5 12h.01M12 12h.01M19 12h.01',
 edit:'M4 20h4L19 9l-4-4L4 16z',
 x:'M6 6l12 12M18 6 6 18',
 down:'M6 9l6 6 6-6'
};
const phone=()=>window.matchMedia('(max-width:700px)').matches;
let busy=false;

// ---------- tabbladen ----------
function tabs(){
 const set=[['t_home','home','Home','Home'],['t_gen','mini','Mini’s','Mini’s'],['t_sen','sen','Jeugd & Senioren','Jeugd/Sen.'],['t_rot','rot','5-1 rotaties','5-1'],['t_def','def','Verdediging','Verdediging']];
 set.forEach(([id,k,l,s])=>{const b=document.getElementById(id);if(!b||b.dataset.ow)return;b.dataset.ow=1;
  b.innerHTML='<span class="ic">'+ic(I[k])+'</span><span class="long">'+l+'</span><span class="short">'+s+'</span>';
  b.setAttribute('aria-label',l);});
}

// ---------- instellingen: samenvatting en paneel (telefoon) ----------
function txt(s){const e=q(s);return e?e.textContent.trim():'';}
function selTxt(s){const e=q(s);return e&&e.selectedOptions&&e.selectedOptions[0]?e.selectedOptions[0].textContent.replace(/\s*\(\d+\)$/,''):'';}
function summary(view){
 if(view==='v_gen')return ['Level '+(txt('#lv .on')||'1'),(txt('#nv')||'8')+' spelers · '+(txt('#cv .on')||'')+' · '+selTxt('#ll').toLowerCase()];
 return ['90 min',(txt('#s_nv')||'12')+' spelers · thema: '+(selTxt('#s_th')||'gemengd').toLowerCase()];
}
function sheets(){
 ['v_gen','v_sen'].forEach(v=>{const w=document.getElementById(v);if(!w)return;
  const aside=q('aside.card',w),main=q('main',w);if(!aside||!main)return;
  let s=q(':scope>.setsum',main);
  if(!s){s=document.createElement('button');s.type='button';s.className='setsum noprint';s.setAttribute('aria-label','Training instellen');
   s.onclick=()=>openSheet(aside);main.insertBefore(s,main.firstChild);}
  const [a,b]=summary(v),h='<b>'+a+'</b><span>'+b+'</span>'+ic(I.edit);
  if(s._h!==h){s._h=h;s.innerHTML=h;}
  if(!q(':scope>.sheetx',aside)){const x=document.createElement('div');x.className='sheetx';
   x.innerHTML='<b>Training instellen</b><button type="button" aria-label="Sluiten">'+ic(I.x)+'</button>';
   q('button',x).onclick=closeSheet;aside.insertBefore(x,aside.firstChild);
   qa('.go',aside).forEach(g=>g.addEventListener('click',()=>setTimeout(closeSheet,50)));}
 });
}
function openSheet(a){closeSheet();a.classList.add('sheet');const bk=document.createElement('div');bk.className='owback';bk.onclick=closeSheet;document.body.appendChild(bk);
 const f=q('.sheetx button',a);if(f)f.focus();}
function closeSheet(){qa('aside.sheet').forEach(a=>a.classList.remove('sheet'));qa('.owback').forEach(b=>b.remove());}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&q('aside.sheet'))closeSheet();});

// ---------- oefeningen ----------
const OPEN=new Map(); // per oefening (naam) ingeklapt of open, zolang de pagina open is
let allOpen=null;     // null = standaard: telefoon dicht, pc open
function keyOf(dr){const h=q('h3',dr);return h?h.textContent.trim():'';}
function isOpen(dr){const k=keyOf(dr);if(OPEN.has(k))return OPEN.get(k);return allOpen!==null?allOpen:!phone();}
function setOpen(dr,o){dr.classList.toggle('open',o);dr.classList.toggle('closed',!o);const b=q('.owexp',dr);
 if(b){b.setAttribute('aria-expanded',o);q('span',b).textContent=o?'Minder tonen':'Uitleg en animatie';}}
function card(dr){
 if(dr.dataset.ow)return;dr.dataset.ow=1;
 const tl=q('.tools',dr),sv=q('.body svg',dr);
 if(sv&&!q(':scope>.thumb',dr)){const t=document.createElement('div');t.className='thumb';t.setAttribute('aria-hidden','true');
  const c=sv.cloneNode(true);c.removeAttribute('id');qa('[id]',c).forEach(e=>e.removeAttribute('id'));t.appendChild(c);dr.insertBefore(t,dr.firstChild);}
 if(tl&&!q('.owsw',tl)){
  const bs=qa(':scope>button',tl),on=b=>b.getAttribute('onclick')||'';
  const pin=bs.find(b=>/pin\(/i.test(on(b))),sw=bs.find(b=>/swap\(/i.test(on(b)));
  const menu=document.createElement('details');menu.className='owmenu';
  menu.innerHTML='<summary class="owb" aria-label="Meer: zelf kiezen, verplaatsen, verwijderen">'+ic(I.more)+'</summary><div class="owlist"></div>';
  const list=q('.owlist',menu);
  if(sw){sw.classList.add('owsw');sw.title='Willekeurige andere oefening';sw.innerHTML=ic(I.swap)+'<span>Andere oefening</span>';sw.setAttribute('aria-label','Andere oefening');tl.appendChild(sw);}
  if(pin){const p=pin.classList.contains('on');pin.classList.add('owb');pin.title=p?'Vastgezet: blijft staan bij een nieuwe training':'Vastzetten: blijft staan bij een nieuwe training';
   pin.setAttribute('aria-label',p?'Vastgezet':'Vastzetten');pin.innerHTML=ic(I.pin);tl.appendChild(pin);}
  bs.filter(b=>b!==pin&&b!==sw).forEach(b=>{const o=on(b);
   if(/mv\(.*-1\)/.test(o))b.textContent='Eerder in de training';else if(/mv\(/.test(o))b.textContent='Later in de training';
   else if(/del\(/i.test(o)){b.textContent='Verwijderen';b.classList.add('owdel');}
   list.appendChild(b);});
  tl.appendChild(menu);
 }
 if(!q(':scope>.owexp',dr)){const e=document.createElement('button');e.type='button';e.className='owexp noprint';e.innerHTML='<span></span>'+ic(I.down);
  e.onclick=ev=>{ev.stopPropagation();const o=!dr.classList.contains('open');OPEN.set(keyOf(dr),o);setOpen(dr,o);};dr.appendChild(e);}
 dr.addEventListener('click',ev=>{if(!dr.classList.contains('closed'))return;if(ev.target.closest('button,a,select,input,details,summary'))return;OPEN.set(keyOf(dr),true);setOpen(dr,true);});
 setOpen(dr,isOpen(dr));
}
// de Suggestie-knop (suggestie.js) komt later bij; verplaats hem naar het menu
function late(){qa('.dr .tools').forEach(tl=>{const list=q('.owlist',tl);if(!list)return;
 qa(':scope>button',tl).forEach(b=>{if(!b.classList.contains('owsw')&&!b.classList.contains('owb'))list.insertBefore(b,list.querySelector('.owdel'));});});}
// sluit een open menu als je ergens anders tikt
document.addEventListener('click',e=>{qa('details.owmenu[open]').forEach(d=>{if(!d.contains(e.target))d.removeAttribute('open');});});

// ---------- tijdbalk ----------
const COL=['#1d1d1b','#0089fe','#5fb0ff','#ffd100','#8fc3ad','#c084fc'];
function timebar(outId){
 const out=document.getElementById(outId);if(!out)return;
 const blks=qa(':scope>.blk',out);let tb=out.previousElementSibling;
 if(!tb||!tb.classList.contains('timebar')){tb=document.createElement('div');tb.className='timebar noprint';out.parentNode.insertBefore(tb,out);}
 if(!blks.length){tb.innerHTML='';return;}
 let tot=0;const segs=blks.map((b,i)=>{const len=parseInt((q('.bh span',b)||{}).textContent,10)||10;tot+=len;
  if(!b.id)b.id=outId+'_blk'+i;return {id:b.id,len,name:(q('.bh h2',b)||{}).textContent||''};});
 const h='<div class="tbh"><span>Opbouw van de training</span><span>'+tot+' min · <button type="button" class="owall">'+(isAllOpen(out)?'Alles inklappen':'Alles uitklappen')+'</button></span></div><div class="tbs">'
  +segs.map((s,i)=>'<a href="#'+s.id+'" style="flex:'+s.len+'" title="'+s.name+', '+s.len+' minuten"><i style="background:'+COL[i%COL.length]+'"></i><span>'+s.name+'</span></a>').join('')+'</div>';
 if(tb._h!==h){tb._h=h;tb.innerHTML=h;q('.owall',tb).onclick=()=>{allOpen=!isAllOpen(out);OPEN.clear();qa('.dr',out).forEach(d=>setOpen(d,allOpen));timebar(outId);};}
}
function isAllOpen(out){const d=qa('.dr',out);return d.length>0&&d.every(x=>x.classList.contains('open'));}

// ---------- zaalmodus ----------
function hall(){const top=document.getElementById('hallTop'),bar=q('#hall .hbar');if(!top||!bar)return;
 const m=/(\d+) van (\d+)/.exec(top.textContent);let p=q('.hprog',bar);
 if(!p){p=document.createElement('div');p.className='hprog';p.setAttribute('aria-hidden','true');bar.appendChild(p);}
 const h=m?Array.from({length:+m[2]},(_,i)=>'<i'+(i<+m[1]?' class="on"':'')+'></i>').join(''):'';if(p._h!==h){p._h=h;p.innerHTML=h;}}

function apply(){if(busy)return;busy=true;
 try{tabs();sheets();qa('.dr').forEach(card);late();timebar('out');timebar('s_out');hall();}
 finally{busy=false;}
}
apply();
let t;new MutationObserver(()=>{if(busy)return;clearTimeout(t);t=setTimeout(apply,0);}).observe(document.body,{childList:true,subtree:true,characterData:true});
document.addEventListener('input',()=>setTimeout(sheets,0));
document.addEventListener('change',()=>setTimeout(sheets,0));
})();

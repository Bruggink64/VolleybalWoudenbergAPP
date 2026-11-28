// Houdt het puntenverloop van live wedstrijden bij, ook als niemand de app open heeft.
// Draait via .github/workflows/live-verloop.yml (elk uur, max ~65 minuten). Haalt elke 10 seconden de live stand
// op bij de Nevobo en zet elke nieuwe stand in Firestore (verzameling liveverloop), net als de homepagina doet.
// Zelfde document-id als de app, dus dubbele standen worden door Firestore geweigerd (409) en dat is prima.
const API = 'https://api.nevobo.nl';
const CLUB = 'ckl8z3k';
const EXTRA = ['/competitie/teams/ckl7s2r/heren/1'];   // gevolgde teams van andere clubs (zie EXTRA in home.js)
const FS = 'https://firestore.googleapis.com/v1/projects/vv-woudenberg-trainersapp/databases/(default)/documents';
const KEY = 'AIzaSyCrzJ9_EqRrELhFap4Aumte7a4P_Z_eVDY';
const DUUR = (+process.env.DUUR_MIN || 65) * 60e3, START = Date.now();
const slaap = ms => new Promise(r => setTimeout(r, ms));
const dag = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' });

async function allePaginas(pad) {
  const uit = []; let url = API + pad;
  for (let i = 0; url && i < 30; i++) {
    const r = await fetch(url, { headers: { Accept: 'application/ld+json' } }); if (!r.ok) throw new Error(r.status + ' ' + url);
    const d = await r.json(); uit.push(...(d['hydra:member'] || []));
    const nx = d['hydra:view'] && d['hydra:view']['hydra:next']; url = nx ? API + nx : null;
  }
  return uit;
}
async function vandaag() {
  const dt = '&datum[after]=' + dag() + '&datum[before]=' + dag() + 'T23:59:59';
  const l = (await allePaginas('/competitie/wedstrijden?vereniging=/relatiebeheer/verenigingen/' + CLUB + dt))
    .concat(...await Promise.all(EXTRA.map(t => allePaginas('/competitie/wedstrijden?team=' + t + dt).catch(() => []))));
  // alleen wedstrijden met een digitaal wedstrijdformulier (mini's hebben dat niet)
  return l.filter(m => m.urlDwf && m.tijdstip).map(m => ({ id: m['@id'], t: Date.parse(m.tijdstip), klaar: m.status && m.status.waarde === 'gespeeld' }));
}
// zelfde bepaling van de lopende set als bewaarVerloop in home.js
function lopendeSet(d) {
  const raw = (d.sets || []).map(x => [+(x && x[0]) || 0, +(x && x[1]) || 0]);
  let i = -1; raw.forEach((x, j) => { if (x[0] || x[1]) i = j; });
  const gew = (+d.stand[0] || 0) + (+d.stand[1] || 0);
  if (i < 0 || gew > i) i = Math.max(0, Math.min(gew, raw.length ? raw.length - 1 : gew));
  return [i, raw[i] || [0, 0]];
}
async function deel(id, s, a, b) {
  const docId = id.replace(/\//g, '_') + '_' + s + '_' + a + '_' + b, iv = n => ({ integerValue: String(n) });
  const r = await fetch(FS + '/liveverloop?key=' + KEY + '&documentId=' + encodeURIComponent(docId), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { w: { stringValue: id }, s: iv(s), a: iv(a), b: iv(b), t: { timestampValue: new Date().toISOString() } } })
  }).catch(e => ({ status: 'fout ' + e.message }));
  console.log(new Date().toISOString().slice(11, 19), id.split('/').slice(-4).join('/'), 'set', s + 1, a + '-' + b, r.status);
}

let lijst = [], lijstBij = 0;
const laatst = {};
while (Date.now() - START < DUUR) {
  if (Date.now() - lijstBij > 5 * 60e3) {
    try { lijst = await vandaag(); lijstBij = Date.now(); } catch (e) { console.log('lijst mislukt', e.message); }
    const nu = Date.now(), eind = START + DUUR;
    // niets bezig en niets dat begint voordat deze run stopt: klaar
    if (!lijst.some(m => !m.klaar && m.t <= eind && m.t >= nu - 3 * 3600e3)) { console.log('geen wedstrijden in dit tijdvak'); break; }
  }
  const nu = Date.now();
  const bezig = lijst.filter(m => !m.klaar && m.t <= nu + 5 * 60e3 && m.t >= nu - 3 * 3600e3);
  await Promise.all(bezig.map(async m => {
    const r = await fetch(API + m.id + '/live', { headers: { Accept: 'application/ld+json' } }).catch(() => null);
    if (!r || r.status !== 200) return;
    const d = await r.json().catch(() => null); if (!d || !d.stand) return;
    const [s, [a, b]] = lopendeSet(d), sleutel = s + '_' + a + '_' + b;
    if (laatst[m.id] === sleutel) return;
    laatst[m.id] = sleutel;
    await deel(m.id, s, a, b);
  }));
  await slaap(10e3);
}
console.log('klaar');

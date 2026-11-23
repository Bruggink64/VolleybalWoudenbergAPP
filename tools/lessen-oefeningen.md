# Lessen voor het maken van oefeningen en animaties

Geleerd van de aanpassingen van Yannick (n34, n84, n104, n105). Toepassen bij elk nieuw voorstel.

1. **Aantallen kloppen**: teken precies zoveel spelers als titel en tekst zeggen (6 tegen 6 = 12, 6 tegen 4 = 10, 3 tegen 3 = 6) en laat de infotekst ("12 spelers: ...") hiermee overeenkomen. Gebruik `d.vs` / `d.allen` waar nodig.
2. **Regel letterlijk uitbeelden**: wat de trainer schrijft ("iedereen die de bal raakt rent naar de muur") moet voor elke speler en voor beide teams zichtbaar zijn, niet maar voor één.
3. **Niet doordraaien**: spelers gaan weg en komen terug op hun eigen plek. Geen automatische rotatie (`allen` / `vast`), tenzij de oefening dat zegt.
4. **Nieuwe oefening zonder [id]**: zet `<!-- oefening: nXX -->` in de PR zodat de preview alleen die oefening toont.
5. **Naamkeuze**: gebruik geen gereserveerde spelernamen (K, M, M1 t/m M6, Z, GZ, BOX, P1, P2, L, LIB, P). **Pionnen** heten PN1, PN2, ... (kegels KG1, KG2, ...): die worden automatisch als pion getekend in 2D en 3D, niet als speler. Matten heten M of M1-M6.
6. **Testen**: controleer dat de animatie echt beweegt (meerdere screenshots verschillen) en dat de preview alleen de oefeningkaart toont. Verplaats nooit de kaart-node (animatie stopt).
7. **Werkwijze**: `senioren.js` alleen genereren met `python3 tools/senioren-bron.py`; één PR per suggestie met markers; commit voor je van branch wisselt; bij conflicten op dezelfde regels main eerst mergen.
8. **Opmerkingen letterlijk lezen**: is een aanpassing van de trainer dubbelzinnig (bijv. "de bal gaat niet terug"), zeg dan in de melding hoe je het gelezen hebt en vraag kort of dat klopt, in plaats van stil te kiezen.
9. **Elke aanraking zichtbaar maken**: laat alle aanrakingen tonen (3 tegen 3 = 6) en laat een speler pas naar de muur lopen NA zijn aanraking; de animatie eindigt na de laatste muurloop. Controleer met `svg.pauseAnimations(); setCurrentTime(t)` waar iedereen staat. Senioren-animaties mogen 7 posities per speler en 6 bal-punten hebben (naast 4/5).

## Foutmeldingen (bugs)
Een suggestie die een fout in de app meldt behandel ik als fix: eerst reproduceren (bij de spelersaantal-bug: 200 trainingen genereren per aantal en tellen hoeveel "Vraagt N spelers" tonen), dan de oorzaak zoeken, verbeteren, dezelfde test opnieuw laten slagen, en als voorstel-PR met `<!-- suggestie: id -->` laten zien. Live pas na akkoord van Yannick.
10. **Meerdere groepjes naast elkaar**: wil de trainer zien dat een oefening met 6, 9 of 12 spelers in één veld kan, gebruik dan `d.baan` (één groepje tekenen, de app herhaalt het in banen naast elkaar, tot 4). Houd de bewegingen binnen een baan (±35 px van het midden).

## Animatie ↔ omschrijving (systematische controle 23-11-2026)
11. **Controlescripts draaien voor elke PR**: `node tools/controle-animaties.js` (Jeugd & Senioren) en `node tools/controle-minis.js` (mini's, app op localhost:8765). F = tekening spreekt tekst tegen, ? = twijfel (kijk naar het plaatje).
12. **Materiaal bij naam**: pionnen PN/KG, matten M, hoepels HP, korven KO, box BX, loopladder LAD, lint LINT, doelzone ZN, ballenkar KAR, kaarten KT (zie `senioren-obj.js`). Wat de tekst noemt moet getekend zijn, wat getekend is moet in de tekst staan.
13. **Oude oefeningen corrigeren** in `tools/fix-animaties.py` (fill/add/rename), nooit met de hand in `senioren.js`.
14. **Stap ↔ balbeweging**: stap k van de tekst hoort bij beweging k-1→k; de bal mag niet bewegen in een stap die er niets over zegt.
15. **N tegen M**: beide kanten tekenen (ook "4 tegen 4 waarvan 3 in het veld" = 4-4 getekend).

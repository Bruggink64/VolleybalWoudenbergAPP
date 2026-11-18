# Lessen voor het maken van oefeningen en animaties

Geleerd van de aanpassingen van Yannick (n34, n84, n104, n105). Toepassen bij elk nieuw voorstel.

1. **Aantallen kloppen**: teken precies zoveel spelers als titel en tekst zeggen (6 tegen 6 = 12, 6 tegen 4 = 10, 3 tegen 3 = 6) en laat de infotekst ("12 spelers: ...") hiermee overeenkomen. Gebruik `d.vs` / `d.allen` waar nodig.
2. **Regel letterlijk uitbeelden**: wat de trainer schrijft ("iedereen die de bal raakt rent naar de muur") moet voor elke speler en voor beide teams zichtbaar zijn, niet maar voor één.
3. **Niet doordraaien**: spelers gaan weg en komen terug op hun eigen plek. Geen automatische rotatie (`allen` / `vast`), tenzij de oefening dat zegt.
4. **Nieuwe oefening zonder [id]**: zet `<!-- oefening: nXX -->` in de PR zodat de preview alleen die oefening toont.
5. **Naamkeuze**: gebruik geen gereserveerde spelernamen (K, M, M1, M2, M5, M6, Z, GZ, BOX, P1, P2, L, LIB, P).
6. **Testen**: controleer dat de animatie echt beweegt (meerdere screenshots verschillen) en dat de preview alleen de oefeningkaart toont. Verplaats nooit de kaart-node (animatie stopt).
7. **Werkwijze**: `senioren.js` alleen genereren met `python3 tools/senioren-bron.py`; één PR per suggestie met markers; commit voor je van branch wisselt; bij conflicten op dezelfde regels main eerst mergen.
8. **Opmerkingen letterlijk lezen**: is een aanpassing van de trainer dubbelzinnig (bijv. "de bal gaat niet terug"), zeg dan in de melding hoe je het gelezen hebt en vraag kort of dat klopt, in plaats van stil te kiezen.

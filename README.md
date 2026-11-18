# Volleybal Woudenberg trainingsapp

Trainingsgenerator voor de trainers van VV Woudenberg: mini's level 1 t/m 5 (60 min), jeugd en senioren 2e klasse t/m 2e divisie (90 min op 1 veld), 5-1 rotaties en verdediging.
Open de app: https://bruggink64.github.io/VolleybalWoudenbergAPP/

- `index.html`, `data.js`, `scenes.js`: app en mini-oefeningen (VolleyWijzer, Nevobo).
- `senioren.js`: oefeningen jeugd/senioren (eigen teksten), `senioren-app.js`: het tabblad Jeugd & Senioren.
- `ontwerp.css`, `ontwerp.js`: het ontwerp (onderbalk op de telefoon, ingeklapte instellingen en oefeningen, tijdbalk, donkere zaalmodus, en op breed scherm drie kolommen). Werkt bovenop de app; de trainingslogica blijft in de andere bestanden.
- `home.js`, `home.css`: de homepagina met welkomstbericht en het programma en de uitslagen van VV Woudenberg, live uit de Nevobo-RSS (verenigingscode CKL8Z3K). De welkomsttekst staat bovenin `home.js`.
- `tools/senioren-bron.py`: bron van de nieuwe jeugd/senioren-oefeningen; draai het script na een wijziging om `senioren.js` bij te werken.
- `suggestie.js`: de knoppen "Suggestie" en "Idee of suggestie" met een formulier in de app. Inzendingen gaan naar Firebase (Firestore); de beheerder opent de lijst via "Beheer" onderaan het formulier of met `#beheer` achter de link, logt in met Google en keurt daar goed of af. De Firebase-gegevens staan bovenin `suggestie.js`, de beveiligingsregels in `tools/firestore.rules`. Zonder Firebase-gegevens opent de knop het oude Google Formulier.
- `aanpassingen.json`: per verwerkte suggestie (document-id uit Firebase) wat er is aangepast. De beheerpagina toont dit in een kader "Aanpassing" en zet zo'n goedgekeurde suggestie vanzelf op Verwerkt.

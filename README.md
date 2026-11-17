# Volleybal Woudenberg trainingsapp

Trainingsgenerator voor de trainers van VV Woudenberg: mini's level 1 t/m 5 (60 min), jeugd en senioren 2e klasse t/m 2e divisie (90 min op 1 veld), 5-1 rotaties en verdediging.
Open de app: https://bruggink64.github.io/VolleybalWoudenbergAPP/

- `index.html`, `data.js`, `scenes.js`: app en mini-oefeningen (VolleyWijzer, Nevobo).
- `senioren.js`: oefeningen jeugd/senioren (eigen teksten), `senioren-app.js`: het tabblad Jeugd & Senioren.
- `ontwerp.css`, `ontwerp.js`: het ontwerp (onderbalk op de telefoon, ingeklapte instellingen en oefeningen, tijdbalk, donkere zaalmodus, en op breed scherm drie kolommen). Werkt bovenop de app; de trainingslogica blijft in de andere bestanden.
- `home.js`, `home.css`: de homepagina met welkomstbericht en het programma en de uitslagen van VV Woudenberg, live uit de Nevobo-RSS (verenigingscode CKL8Z3K). De welkomsttekst staat bovenin `home.js`.
- `tools/senioren-bron.py`: bron van de nieuwe jeugd/senioren-oefeningen; draai het script na een wijziging om `senioren.js` bij te werken.

# VV Woudenberg trainingsapp

Live site: https://bruggink64.github.io/VolleybalWoudenbergAPP/ (GitHub Pages, publiek).
Zie README.md voor de bestandsindeling.

## Veiligheidsregels (altijd)
- Nooit direct naar de hoofdbranch pushen zonder expliciet akkoord van Yannick.
- Werk op een aparte branch en maak een pull request. Niet zelf mergen.
- Zet nooit API-keys, wachtwoorden of tokens in bestanden. De repo is publiek.
- `senioren.js` wordt gegenereerd door `tools/senioren-bron.py`: pas de bron aan en draai het script, bewerk `senioren.js` niet met de hand.

## Werkverdeling Claude en Gemini (tokens besparen)
Gemini CLI is geïnstalleerd en ingelogd (Google AI Pro). Aanroepen met:
`gemini -p "<opdracht>"` (vanuit de projectmap).

Naar Gemini sturen:
- Grote bestanden doorlezen of samenvatten (`data.js`, `senioren.js`, `index.html`, `scenes.js`).
- Bulkwerk: oefeningen indelen op niveau of leerlijn, teksten of metadata in bulk maken, controleren of oefeningen ontbreken.

Bij Claude houden:
- App-logica, SVG-animaties, ontwerp en alle code-wijzigingen.
- Controle van wat Gemini oplevert, vóór het in een bestand komt.

## Regels voor Gemini-uitvoer
- Gemini levert alleen een voorstel of een apart uitvoerbestand (bijvoorbeeld in `tmp/`, niet committen).
- Claude controleert de uitvoer steekproefsgewijs en voert daarna zelf de wijziging door.
- Gemini bewerkt nooit zelf bestanden in de repo.

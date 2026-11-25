# 25-11-2026: 3 oefeningen uit de nieuwsbrief van yoursportplanner (exe_id 106936, 106966, 106942), eigen woorden. Wordt ingelezen door senioren-bron.py.
NIEUW_2511 = []
E = NIEUW_2511.append

E(ex(203, 'Aanval op positie 4 tegen drie verdedigers', 'tech', ['aanval', 'verdediging'], V,
 'Eigen kant: twee aanvallers in een rij naast het veld bij positie 4, een passer in het achterveld en een spelverdeler aan het net. Overkant: drie verdedigers in het achterveld, met de libero op de diagonaal (achter rechts, vanaf de overkant gezien positie 5). De trainer staat aan de overkant bij het net met de ballen.',
 'Aanvallen vanaf positie 4 tegen een echte verdediging: de aanvaller zoekt de open plek, de verdedigers lezen de aanvaller en verdedigen hoog naar het midden.',
 ['De trainer gooit de bal over het net naar de passer.', 'De passer speelt de bal naar de spelverdeler.', 'De spelverdeler zet op naar positie 4; de eerste aanvaller loopt aan en de verdedigers schuiven naar hun verdedigingsplek.', 'De aanvaller slaat diagonaal en de libero verdedigt de bal hoog. Na elke aanval draaien de spelers door: de aanvaller wordt verdediger, een verdediger sluit aan in de rij. De libero blijft op zijn plek. Wissel na 10 aanvallen de libero.'],
 ['Aanvaller: kijk tijdens de aanloop waar de verdedigers staan en sla naar de open plek.', 'Verdedigers: sta stil en laag op het moment dat de aanvaller de bal raakt.'],
 'Moeilijker: een blokkeerder erbij aan de overkant, of de verdedigers spelen de verdedigde bal uit tot een aanval. Makkelijker: de trainer gooit de bal direct naar de spelverdeler.',
 [['T', TR, (425, 270)], ['PS', Y, (250, 560)], ['SV', SV, (335, 375)],
  ['A1', Y, (100, 450), (125, 425), (145, 390), (150, 362)], ['A2', Y, (100, 485), (100, 485), (100, 470), (100, 455)],
  ['V1', OPP, (135, 210), (135, 170), (140, 110), (140, 110)], ['V6', OPP, (270, 60), (285, 75), (300, 90), (300, 90)], ['LB', LIB, (415, 205), (405, 180), (395, 150), (392, 145)]],
 [(425, 275), (250, 555), (335, 372), (150, 358), (392, 142)], need=7))

E(ex(204, 'Ladder door alle rotaties', 'zes', ['sideout', 'transitie'], V,
 'Aan de ene kant een systeemteam van zes in het eigen systeem (5-1, of 6-2 als je dat speelt). Aan de andere kant de uitdagers: de overige spelers, minstens vier; de trainer kan bij hen spelverdeler zijn. De uitdagers serveren elke bal. Wissel om de 6 minuten twee spelers tussen de teams, zodat iedereen in het systeem speelt.',
 'In elke rotatie onder wedstrijddruk punten maken uit de side-out en de omschakeling. Het systeemteam klimt rotatie voor rotatie de ladder op.',
 ['Een uitdager serveert op het systeemteam.', 'Het systeemteam passt naar de spelverdeler en zet op: een gewonnen side-out is 1 punt.', 'Een aanvalspunt in de omschakeling (na een verdedigde bal of een freeball) is 2 punten; de uitdagers krijgen 1 punt per gewonnen rally.', 'Haalt het systeemteam 4 punten, dan draait het een rotatie door (een trede hoger). Halen de uitdagers eerst 4 punten, dan gaat het systeemteam een rotatie terug. Na alle zes rotaties is de ladder klaar.'],
 ['Na de side-out direct terug naar je verdedigingsplek: de uitdagers spelen de bal terug.', 'Na een trede terug: kort bespreken wat er in die rotatie misging.'],
 'Makkelijker: geen trede terug en 3 punten per trede, of de uitdagers serveren vanuit het veld. Moeilijker: 5 punten per trede, of bij een ace tegen het systeemteam meteen een trede terug. Met veel spelers: twee ladders naast elkaar als wedstrijd, wie eerst klaar is wint. Doel: ladder binnen 20 minuten klaar.',
 [['SV', SV, (420, 520), (380, 430), (335, 378), (335, 378)], ['MID', Y, (280, 420), (280, 405), (285, 375), (285, 365)],
  ['A4', Y, (160, 450), (160, 430), (150, 390), (150, 362)], ['DIA', Y, (420, 420), (425, 420), (420, 400), (420, 380)],
  ['P5', Y, (165, 560), (165, 560), (175, 540), (180, 500)], ['LB', LIB, (280, 570), (280, 570), (275, 545), (270, 510)],
  ['OS', OPP, (165, 20), (165, 60), (190, 110), (190, 110)], ['O3', OPP, (280, 310), (280, 315), (280, 325), (280, 300)],
  ['O4', OPP, (395, 140), (395, 140), (390, 135), (385, 130)], ['O2', OPP, (165, 200), (165, 200), (170, 180), (170, 180)],
  ['T', TR, (330, 300)]],
 [(165, 25), (165, 555), (335, 372), (150, 358), (382, 132)]))
NIEUW_2511[-1]['vs'] = [6, 4]

E(ex(205, 'Help! De spelverdeler speelt de eerste bal', 'spel', ['transitie', 'verdediging'], V,
 'Een team van zes op de speelposities na het wisselen: de spelverdeler achter rechts, de diagonaal rechtsvoor, een buitenaanvaller linksvoor, een middenaanvaller, een passer en de libero. De trainer staat met ballen aan de overkant; wachtende spelers rapen ballen en wisselen elke ronde in.',
 'Beslissen wie de tweede bal speelt als de spelverdeler zelf de eerste bal moet nemen: de spelverdeler roept "Help!", de diagonaal of de libero roept "Ik!" en zet hoog op naar buiten.',
 ['De trainer speelt een freeball of slaat uit stand, ongeveer de helft naar de spelverdeler.', 'De spelverdeler roept "Help!" en speelt de bal hoog naar het midden van het veld.', 'De diagonaal (of de libero) roept "Ik!" en zet hoog op naar de buitenaanvaller. Gaat de bal naar een ander, dan loopt de spelverdeler gewoon in en zet zelf op.', 'De buitenaanvaller slaat. 1 punt voor een aanvalbare tweede bal, 2 punten voor een winnende aanval na "Help!"; eerst tot 10 punten. Na 5 ballen doordraaien zodat iedereen aan de beurt komt.'],
 ['Wie het dichtst bij de tweede bal staat, roept "Ik!"; nooit twee spelers op dezelfde bal.', 'Spelverdeler: verdedig hoog naar het midden, zodat een ander makkelijk kan opzetten.', 'Doel: bij 7 van de 10 "Help!"-ballen een aanvalbare tweede bal.'],
 'Makkelijker: alleen freeballs, de tweede bal mag gevangen en opgegooid worden, of de trainer roept "spelverdeler" voordat hij speelt. Moeilijker: de trainer valt echt aan en er staat een blok, of twee ballen achter elkaar naar de spelverdeler. Variatie: alleen de libero zet op, van achter de 3-meterlijn.',
 [['T', TR, (280, 250)], ['SV', SV, (395, 560), (395, 560), (395, 555), (375, 520)],
  ['DIA', Y, (395, 395), (370, 410), (300, 430), (310, 420)], ['A4', Y, (165, 420), (150, 450), (150, 400), (150, 362)],
  ['MID', Y, (280, 390), (280, 400), (280, 385), (280, 370)], ['P5', Y, (165, 570)], ['LB', LIB, (280, 585)]],
 [(280, 255), (395, 552), (300, 425), (150, 358), (380, 130)], need=6))

for _d in NIEUW_2511:
    _d['vast'] = True  # geen automatisch doordraaien in de animatie

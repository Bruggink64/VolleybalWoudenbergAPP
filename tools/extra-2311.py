# 23-11-2026: 8 oefeningen uit de wekelijkse zoektocht (volleytools.nl en getthepancake.com), eigen woorden. Wordt ingelezen door senioren-bron.py.
import math
NIEUW_2311 = []
E = NIEUW_2311.append

# 8 spelers in een kring: de bal gaat rechtsom, de spelers lopen linksom
_c = (280, 490); _r = 100
def _slot(k):
    a = math.radians(-90 + 45 * (k % 8))
    return (round(_c[0] + _r * math.cos(a)), round(_c[1] + _r * math.sin(a)))
_ring = [[chr(65 + i), Y] + [_slot(i - s) for s in range(4)] for i in range(8)]
_ringbal = [_slot(k) for k in range(6)]

E(ex(195, 'Aanval en dan de korte bal verdedigen', 'tech', ['aanval', 'verdediging'], V,
 'Een passer, een spelverdeler en een aanvaller aan de eigen kant, aan de overkant twee blokkeerders. De trainer staat bij de 3-meterlijn met een kar ballen en gooit eerst naar de passer.',
 'Na de aanval direct omschakelen: de aanvaller verdedigt zelf een korte bal van de trainer en sluit daarna weer achter in de rij aan.',
 ['De trainer gooit de bal naar de passer, die hoog naar de spelverdeler speelt.', 'De spelverdeler zet op naar positie 4 en de aanvaller slaat tegen het blok.', 'Direct na de slag speelt de trainer een korte bal naar de 3-meterlijn.', 'De aanvaller verdedigt die bal terug naar de trainer en sluit achteraan aan; de passer wordt aanvaller.'],
 ['Na het slaan meteen landen en de bal volgen, niet kijken naar je eigen slag.', 'Verdedig de korte bal hoog en naar het midden van het net.'],
 'Moeilijker: de trainer kiest per bal of hij kort of diep speelt. Makkelijker: alleen de korte bal, zonder blok.',
 [['T', TR, (110, 470)], ['PS', Y, (165, 580), (165, 570), (190, 550), (200, 520)], ['SV', SV, (335, 375)], ['AA', Y, (190, 470), (160, 425), (150, 364), (150, 450)], ['OB1', OPP, (165, 328)], ['OB2', OPP, (280, 328)]],
 [(115, 470), (165, 565), (335, 372), (150, 358), (150, 452), (115, 470)], need=6))
E(ex(196, 'Alleen de pijp scoort', 'spel', ['aanval', 'service'], V,
 'Vier tegen vier op een heel veld. Een team mag alleen scoren met een aanval vanuit het achterveld (de pijp). De trainer gooit om en om een bal in. Een aanval die niet vanuit de pijp komt, telt niet.',
 'Een goede pass en een hoge bal naar het achterveld afdwingen, en de pijpaanvaller laten leren aanlopen en afzetten achter de 3-meterlijn.',
 ['De trainer gooit de bal in bij het team dat aan de beurt is.', 'De passer speelt naar de spelverdeler.', 'De spelverdeler zet hoog op naar het achterveld.', 'De pijpaanvaller slaat achter de 3-meterlijn af; alleen zo scoort het team.'],
 ['Pijpaanvaller: zet af achter de 3-meterlijn; landen ervoor mag.', 'Verdediger: schuif met de bal mee, de pijp komt uit het midden.'],
 'Moeilijker: het andere team mag alleen scoren met een tip. Makkelijker: ook de buitenaanval telt, maar de pijp 2 punten.',
 [['T', TR, (110, 470)], ['PA', Y, (280, 600), (280, 590), (250, 560), (250, 570)], ['SV', SV, (335, 378)], ['PJ', Y, (400, 570), (350, 520), (300, 470), (285, 440)], ['BK', Y, (150, 430), (150, 430), (150, 440), (150, 450)], ['D1', OPP, (165, 100)], ['D2', OPP, (395, 100)], ['D3', OPP, (280, 240)], ['D4', OPP, (280, 150)]],
 [(115, 470), (280, 585), (335, 372), (285, 450), (285, 180)], need=8))
E(ex(197, 'Tegengesteld rondspelen', 'insp', ['inspelen', 'transitie'], V,
 'Acht spelers staan in een kring van ongeveer vier meter, één bal. De bal gaat rechtsom (naar de speler rechts), maar de spelers zelf lopen na hun pass linksom door.',
 'Twee dingen tegelijk doen: een nauwkeurige pass en de goede looprichting, zodat de kring heel blijft en de pass op een bewegend doel komt.',
 ['Speler 1 speelt de bal naar rechts, naar de speler die daar staat.', 'Direct na de pass loopt hij één plek linksom door.', 'De ontvanger speelt de bal weer naar rechts en loopt zelf linksom door.', 'Na een minuut een andere looprichting of een tweede bal erbij.'],
 ['Speel de bal vooruit naar de plek waar je teamgenoot straks staat.', 'Praat: roep de naam van wie de bal neemt.'],
 'Bij meer dan 8 spelers een extra plek aan de zijlijn of achterlijn. Moeilijker: bovenhands en onderhands afwisselen, of twee ballen.',
 _ring, _ringbal, need=8))
E(ex(198, 'Smash uit stand in vier teams', 'wu', ['warming', 'aanval'], A,
 'Op beide veldhelften (A en B) een team van drie, de overige spelers staan als reserve naast het veld. De trainer brengt een bal in op helft A.',
 'Een team speelt de bal in drie aanrakingen en slaat hem uit stand over het net. Daarna wisselen de reserves en gaat de bal naar de andere helft.',
 ['De trainer brengt een bal in bij het team op helft A.', 'Het team speelt de bal in drie aanrakingen (pass, set, slag) naar het net.', 'De derde speler slaat de bal uit stand over het net.', 'Helft A wisselt van spelers, het team op helft B speelt dezelfde reeks terug.'],
 ['Gebruik geen aanloop: uit stand slaan gaat om armzwaai en romp.', 'Wissel snel, zodat het tempo hoog blijft.'],
 'Moeilijker: de slag moet in een aangewezen zone vallen. Makkelijker: de eerste twee aanrakingen mogen een vangbal zijn.',
 [['A1', Y, (200, 530), (210, 520), (210, 500), (210, 480)], ['A2', Y, (300, 530), (300, 520), (300, 450), (300, 430)], ['A3', Y, (400, 530), (390, 510), (390, 440), (360, 400)], ['R1', Y, (80, 560)], ['R2', Y, (80, 600)], ['B1', OPP, (200, 150)], ['B2', OPP, (300, 150)], ['B3', OPP, (400, 150)]],
 [(205, 525), (300, 440), (360, 400), (250, 200), (200, 160)], need=8))
E(ex(199, 'Voorsprong verdedigen en terugvechten', 'zes', ['sideout', 'transitie'], A,
 'Zes tegen zes. Het ene team begint met een voorsprong van vier punten (bijvoorbeeld 18-14), dat team serveert steeds en het andere team ontvangt. Ze spelen tot 25 en wisselen dan van rol.',
 'Het team met de voorsprong leert doorspelen in plaats van op safe te spelen, het team met achterstand leert terugvechten en de service ontvangen onder druk.',
 ['Het team met de voorsprong serveert, het andere team ontvangt.', 'De ontvangers passen, zetten op en zoeken de beste aanvaller.', 'De rally wordt gespeeld; de score loopt gewoon door.', 'Haalt het team met de achterstand de voorsprong in, dan krijgt het de service; bij 25 wisselen de rollen.'],
 ['Voorsprong: blijf aanvallen, zet je service onder druk.', 'Achterstand: houd je plan, speel niet harder dan je kunt.'],
 'Moeilijker: de voorsprong wordt kleiner als het team een fout maakt. Makkelijker: begin met twee punten verschil.',
 [['SV', SV, (335, 378)], ['MID', Y, (280, 440), (280, 410), (285, 380), (285, 370)], ['A4', Y, (160, 450), (160, 420), (150, 380), (150, 364)], ['DIA', Y, (420, 450), (420, 430), (420, 390), (420, 365)], ['V5', Y, (165, 560)], ['V6', Y, (280, 590)],
  ['OS', OPP, (165, 20)], ['OA', OPP, (165, 120), (165, 140), (170, 160), (165, 150)], ['OB', OPP, (280, 300), (280, 310), (285, 320), (285, 325)], ['OD', OPP, (395, 280)], ['OV', OPP, (280, 130)], ['OL', OPP, (395, 120)]],
 [(165, 25), (395, 570), (335, 372), (150, 360), (165, 150)]))
E(ex(200, 'Gevangenenspel', 'eind', ['transitie', 'verdediging'], A,
 'Twee teams op een eigen helft. Wie een bal laat vallen, gaat als gevangene achter de achterlijn van de tegenstander. Daar blijft hij staan tot een teamgenoot hem bevrijdt.',
 'Een leuke afsluiter waarin passen, onder druk spelen en teamgeest samenkomen: je wilt je eigen gevangenen terugkrijgen.',
 ['Het ene team speelt de bal over het net naar de overkant.', 'Lukt het de ontvangers niet de bal in het veld te houden, dan gaat de speler die hem liet vallen als gevangene naar achter.', 'Een goed gespeelde pass van een teamgenoot naar de gevangene bevrijdt hem weer.', 'Is een team zonder spelers, dan wint de ander; start dan opnieuw.'],
 ['Roep wie de bal neemt.', 'Maak een bal makkelijk voor de gevangene: hoog en rustig.'],
 'Moeilijker: de gevangene mag alleen met één aanraking bevrijden. Makkelijker: één speler zonder gevangenschap.',
 [['A', Y, (200, 520), (210, 500), (210, 480), (200, 500)], ['B', Y, (330, 500), (330, 480), (330, 460), (330, 480)], ['C', Y, (200, 600), (210, 580), (210, 560), (210, 580)], ['D', Y, (330, 600), (320, 580), (320, 560), (320, 580)], ['G1', Y, (165, 20), (165, 20), (165, 20), (165, 20)],
  ['E', OPP, (200, 150), (210, 180), (210, 200), (200, 180)], ['F', OPP, (330, 130), (330, 170), (340, 190), (340, 160)], ['G', OPP, (200, 90), (210, 100), (210, 110), (210, 100)], ['H', OPP, (330, 80), (330, 100), (340, 110), (340, 100)]],
 [(205, 500), (260, 335), (280, 200), (330, 130), (330, 150)], need=8))
E(ex(201, 'Passen uit het net', 'tech', ['verdediging', 'sideout'], V,
 'De trainer staat aan de overkant en gooit ballen tegen de bovenkant van het net. Aan de eigen kant staat een passer, met een spelverdeler aan het net en een aanvaller in het achterveld.',
 'Leren aflezen waar de bal heen valt als hij het net raakt, hem hoog uit het net passen en direct daarna aanvallen.',
 ['De trainer gooit een bal hard in de bovenkant van het net.', 'De passer leest de hoek en snelheid en loopt onder de vallende bal.', 'Hij passt hem hoog naar de spelverdeler.', 'De spelverdeler zet op en de achterspeler valt aan achter de 3-meterlijn.'],
 ['Na een harde bal in de bovenkant van het net valt hij bijna recht omlaag: ga eerst naar de plek, dan pas passen.', 'Pass hoog en weg van het net.'],
 'Moeilijker: de trainer gooit ook diagonaal in het net. Makkelijker: de passer mag eerst vangen en daarna passen.',
 [['T', TR, (280, 250)], ['PS', Y, (230, 450), (245, 410), (255, 375), (255, 385)], ['SV', SV, (335, 380)], ['AV', Y, (280, 600), (290, 560), (285, 500), (280, 450)]],
 [(280, 255), (268, 340), (260, 372), (335, 380), (285, 460), (285, 300)]))
E(ex(202, 'Beweeg en speel', 'insp', ['inspelen', 'verdediging'], A,
 'Tweetallen of een speler met een aangever. De aangever speelt de bal rustig op ongeveer een meter van de speler: voor, achter, links, rechts of schuin.',
 'Snel verplaatsen naar de bal en terugkomen op de uitgangspositie, in rustig tempo met goede techniek.',
 ['De aangever speelt de bal een meter voor de speler.', 'De speler verplaatst, speelt de bal terug en keert terug naar de uitgangspositie.', 'Dan een bal achter, links, rechts of schuin.', 'Na twintig ballen wisselen de rollen.'],
 ['Het gaat om voetenwerk, niet om harde ballen.', 'Altijd eerst terug naar de uitgangspositie.'],
 'Moeilijker: de aangever kiest willekeurig de plek en het tempo gaat omhoog. Bij voor/achter kan de bal eventueel doorgespeeld worden.',
 [['AG', TR, (280, 425)], ['SP', Y, (280, 520), (280, 470), (280, 545), (240, 510)]],
 [(280, 430), (280, 466), (280, 430), (280, 540), (280, 430), (238, 508)], need=2))

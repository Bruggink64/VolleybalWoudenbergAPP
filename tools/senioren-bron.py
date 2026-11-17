# Bron voor de nieuwe jeugd/senioren-oefeningen. Draai: python3 tools/senioren-bron.py
# Leest senioren.js, vervangt alle oefeningen met id 'n..' door de lijst hieronder en schrijft het bestand terug.
# Veld 560x680: overkant boven (achterlijn y=40), net y=340, eigen veld onder (achterlijn y=640). x van 110 (links) tot 450 (rechts).
import json, re, pathlib

# Vaste plekken op het eigen veld (onder het net) en aan de overkant (boven het net)
P = {
 '1': (395, 580), '2': (395, 390), '3': (280, 390), '4': (165, 390), '5': (165, 580), '6': (280, 585),
 'sv': (335, 375), 'svj': (335, 355),            # spelverdeler-doel en spelverdeler in sprong
 'a4': (150, 360), 'a3': (290, 355), 'a2': (420, 360), 'a1': (395, 470),  # aanvalspunten
 'b4': (165, 352), 'b3': (280, 352), 'b2': (395, 352),                   # blokplekken eigen kant
 'srv': (395, 660), 'srv5': (165, 660),
 'o1': (165, 100), 'o2': (165, 290), 'o3': (280, 290), 'o4': (395, 290), 'o5': (395, 100), 'o6': (280, 95),
 'ob4': (395, 328), 'ob3': (280, 328), 'ob2': (165, 328),                # blok aan de overkant
 'osrv': (165, 20), 'osrv1': (165, 20), 'osrv5': (395, 20),
 'box4': (395, 300), 'box2': (165, 300), 'box3': (280, 300),            # trainer op de box aan de overkant
 'kar': (480, 360), 'paal': (465, 340), 'paalL': (95, 340),
}
def pt(v):
    if isinstance(v, str):
        return list(P[v])
    return list(v)

Y, SV, LIB, OPP, TR, BL, W = '#ffcc00', '#c084fc', '#34d399', '#f87171', '#2dd4bf', '#fb923c', '#fbbf24'

def ex(i, t, blok, thema, niv, opzet, doel, stappen, aandacht, variatie, spelers, bal, mn=None, door=None):
    assert len(stappen) == 4 and len(bal) == 5, t
    ps = []
    for s in spelers:
        naam, kleur, pos = s[0], s[1], s[2:]
        if len(pos) == 1: pos = pos * 4
        assert len(pos) == 4, (t, naam)
        ps.append([naam, kleur, [pt(p) for p in pos]])
    return {'id': 'n%d' % i, 't': t, 'blok': blok, 'thema': thema, 'niv': niv,
            'min': mn or {'wu': 10, 'insp': 10, 'tech': 20, 'spel': 20, 'zes': 20, 'eind': 10}[blok],
            'opzet': opzet, 'doel': doel, 'stappen': stappen, 'aandacht': aandacht, 'variatie': variatie,
            'p': ps, 'bal': [pt(b) for b in bal], **({'door': door} if door else {})}

A = [1, 2, 3, 4, 5]; V = [2, 3, 4, 5]; H = [3, 4, 5]; TOP = [4, 5]
N = []
# ------------------------------------------------------------ WARMING-UP (15 min)
N.append(ex(1, 'Inspelen in tweetallen: van toetsen naar slaan', 'wu', ['aanval', 'verdediging'], A,
 'Tweetallen met één bal, ieder aan een kant van het net op ongeveer 4 meter. Elke 3 minuten komt er een techniek bij: eerst bovenhands, dan onderarms, dan slaan uit stand en verdedigen.',
 'Rustig opbouwen van balgevoel en schouders warm maken voordat er hard geslagen wordt.',
 ['A speelt de bal bovenhands over het net naar B.', 'B speelt onderarms hoog voor zichzelf.', 'B zet de bal op voor zichzelf en slaat uit stand naar A.', 'A verdedigt hoog en het tweetal gaat door.'],
 ['Eerst controle, dan kracht: de laatste 3 minuten pas echt slaan.', 'Na elke slag direct terug in de verdedigende houding.'],
 'Hoger niveau: B slaat gericht op de linker- of rechterschouder van A, zodat A moet verplaatsen.',
 [['A', Y, (220, 260), (220, 260), (220, 260), (230, 270)], ['B', SV, (340, 430), (340, 440), (340, 430), (340, 430)]],
 [(220, 255), (340, 425), (340, 395), (220, 265), (220, 230)]))
N.append(ex(2, 'Balcirculatie met spelverdeler', 'wu', ['sideout', 'verdediging'], A,
 'Per veldhelft één spelverdeler aan het net en drie of vier spelers in het achterveld. Alle achterspelers op één na hebben een bal in de handen.',
 'Ogen van bal naar bal, kort verplaatsen en een nauwkeurige eerste bal naar de spelverdeler.',
 ['De spelverdeler speelt een bal naar de speler zonder bal.', 'Die speler passt terug naar de spelverdeler.', 'Ondertussen gooit een andere speler zijn bal naar een vrije teamgenoot.', 'De spelverdeler kiest direct de volgende speler; het tempo loopt op.'],
 ['Roep je naam voordat je de bal speelt.', 'Pass hoog en net vóór de spelverdeler, niet tegen het net.'],
 'Na elke 10 passes wordt een andere speler spelverdeler. Moeilijker: de spelverdeler speelt ook korte en diepe ballen.',
 [['SV', SV, 'sv'], ['A', Y, '5', '5', (175, 560), '5'], ['B', Y, '6', '6', '6', (290, 560)], ['C', Y, '1', '1', '1', '1']],
 ['sv', (165, 575), 'sv', (280, 575), 'sv']))
N.append(ex(3, 'Over het net en om de paal', 'wu', ['sideout', 'transitie'], A,
 'Twee rijen tegenover elkaar op de 3-meterlijn aan beide kanten van het net. Wie de bal over het net speelt, loopt om de netpaal naar de rij aan de overkant.',
 'Warmlopen met bal, communiceren en blijven bewegen na het spelen van de bal.',
 ['De eerste speler speelt de bal hoog over het net.', 'Hij sprint om de netpaal naar de andere kant.', 'Aan de overkant speelt de voorste speler de bal terug.', 'Ook die speler loopt om de paal en sluit achteraan aan.'],
 ['De bal mag niet op de grond: tel hardop hoeveel keer het lukt.', 'Roep "ik" voordat je de bal speelt.'],
 'Wissel elke 2 minuten van techniek: bovenhands, onderarms, eerst voor jezelf en dan over. Moeilijker: na de bal een bloksprong of aanvalspas bij de paal.',
 [['A', Y, (280, 470), (380, 400), (465, 340), (420, 240)], ['B', OPP, (280, 210), (280, 210), (280, 215), (220, 270)], ['C', Y, (280, 500)], ['D', OPP, (280, 180)]],
 [(280, 465), (280, 210), (280, 205), (280, 470), (280, 465)]))
N.append(ex(4, 'Drietallen: wie neemt welke bal?', 'wu', ['transitie', 'verdediging'], A,
 'Drietallen verzamelen zich bij de trainer en leggen allemaal een hand op de bal. De trainer gooit de bal ergens in het achterveld.',
 'Snel beslissen en praten: wie speelt de eerste, tweede en derde bal.',
 ['Iedereen heeft een hand op de bal bij de trainer.', 'De trainer gooit de bal plotseling in het achterveld.', 'De dichtstbijzijnde speler passt hoog, een tweede zet op.', 'De derde speler speelt of slaat de bal over het net.'],
 ['Wie de bal niet speelt, roept naar wie hem wel speelt.', 'De pass gaat altijd naar het midden aan het net.'],
 'Moeilijker: de derde bal moet in een zone die de trainer pas roept als de bal in de lucht is.',
 [['T', TR, (280, 470)], ['A', Y, (265, 465), (190, 570), (190, 570), (190, 560)], ['B', Y, (280, 455), (290, 420), (300, 380), (300, 390)], ['C', Y, (295, 465), (330, 430), (190, 380), (170, 360)]],
 [(280, 470), (190, 570), (300, 380), (170, 355), (330, 120)]))
N.append(ex(5, 'Pionnen-service: maak je veld zo klein mogelijk', 'wu', ['service'], A,
 'Tweetallen met één bal, een serveerder en een balhaler. De trainer zet per tweetal een gekleurde pion aan de overkant en roept waar je op mikt: links, rechts, kort of diep van de pion.',
 'Een vaste service-routine en gericht serveren onder lichte druk.',
 ['De serveerder kiest zijn routine en serveert naar de genoemde kant van de pion.', 'Lukt het, dan schuift de pion een meter naar de lijn.', 'Mislukt het, dan gaat de pion een halve meter terug.', 'Na 5 minuten wint het tweetal met het kleinste doelvak.'],
 ['Toss altijd op dezelfde plek, ook bij spanning.', 'Kijk eerst naar het doel, dan naar de bal.'],
 'Hoger niveau: sprongservice of float vanaf 2 meter achter de lijn.',
 [['S', Y, 'srv'], ['H', W, (430, 120), (430, 120), (400, 110), (400, 110)], ['P', BL, (300, 150)]],
 ['srv', (330, 140), (400, 110), 'srv', (300, 75)]))
N.append(ex(6, 'Blokvoetenwerk met schaduwblok', 'wu', ['blok'], A,
 'Drie blokkeerders aan het net en aan de overkant drie spelers die als aanvaller op een bank of op de grond staan. De aanvaller wijst aan waar hij "aanvalt"; het blok verschuift en springt.',
 'Snelle zijwaartse pas, twee handen boven het net en samen sluiten.',
 ['De middenblokkeerder staat klaar in het midden, de buitenkanten op 4 en 2.', 'De aanvaller aan de overkant wijst naar links.', 'De middenblokkeerder sluit met een zijpas aan bij de buitenkant.', 'Samen springen ze en drukken de handen over het net.'],
 ['Handen voor je gezicht houden tijdens het verplaatsen.', 'Duimen omhoog en vingers gespreid boven het net.'],
 'Moeilijker: de aanvaller wijst pas op het laatste moment, of houdt een bal boven het net die het blok moet "pakken".',
 [['MB', BL, 'b3', (230, 352), (190, 352), (190, 345)], ['BL4', BL, 'b4', 'b4', 'b4', 'b4'], ['BL2', BL, 'b2'], ['AV', OPP, (280, 300), (220, 300), (180, 300), (180, 300)]],
 [(280, 300), (220, 300), (180, 300), (180, 300), (180, 300)]))
N.append(ex(7, 'Verdedigen in tweetallen vanaf de box', 'wu', ['verdediging'], V,
 'Twee trainers of spelers staan op een box (of bank) aan de overkant en slaan om de beurt rustig naar een rij verdedigers op positie 5 en 1. Na elke bal schuift de rij door.',
 'Lage startpositie, armen vroeg klaar en de bal hoog in het midden van het veld houden.',
 ['De slagman op positie 4 slaat rustig naar de verdediger op positie 1.', 'De verdediger speelt de bal hoog naar het midden.', 'Een vanger op de spelverdelerplek vangt en legt de bal in de kar.', 'De verdediger sluit achteraan aan en de volgende is aan de beurt.'],
 ['Gewicht op de voorvoeten, schouders voor de knieën.', 'Niet zwaaien: laat de bal op de armen afketsen.'],
 'Hoger niveau: de slagman slaat afwisselend lijn en diagonaal, en de verdediger moet eerst een bloksprong-signaal afwachten.',
 [['SL', TR, 'box4'], ['V1', LIB, '1', (390, 560), (390, 560), (395, 600)], ['V2', Y, (395, 620)], ['VA', SV, 'sv']],
 ['box4', (390, 555), 'sv', 'kar', 'box4']))

# ------------------------------------------------------------ TECHNIEK (20 min)
N.append(ex(8, 'Service-pass met drie passers en afvanger', 'tech', ['service', 'sideout'], A,
 'Drie passers op positie 5, 6 en 1 en één afvanger op de spelverdelerplek. De rest serveert vanaf de overkant en wisselt na elke service van rij.',
 'Een stabiele pass naar de spelverdeler onder echte service.',
 ['De serveerder slaat een service naar een van de drie passers.', 'De passer speelt de bal hoog naar de afvanger op positie 2/3.', 'De afvanger vangt en verzamelt de bal.', 'Na 10 goede passes wisselen passers en serveerders.'],
 ['Serveer nooit twee keer achter elkaar op dezelfde passer.', 'Passer: voeten eerst, armen pas laat strekken.'],
 'Tel alleen passes die de afvanger kan vangen zonder te lopen. Hoger niveau: de afvanger is een echte spelverdeler die opzet naar een aanvaller.',
 [['SRV', OPP, 'osrv1'], ['P5', Y, '5', (190, 560), (190, 560), '5'], ['P6', LIB, '6'], ['P1', Y, '1'], ['AF', SV, 'sv']],
 ['osrv1', (190, 555), 'sv', 'sv', 'osrv1']))
N.append(ex(9, 'Pass per zone: verantwoordelijkheid in de ontvangst', 'tech', ['service', 'sideout'], V,
 'Een ontvangstlinie van drie (libero en twee buitenspelers) en serveerders aan de overkant in twee rijen, op zone 1 en zone 5. De trainer begint met een harde service uit de box.',
 'Afspreken wie welke bal neemt bij een service uit verschillende hoeken.',
 ['Een service uit zone 1 aan de overkant komt schuin binnen.', 'De passer wiens zone het is, roept en passt naar het doel op 2/3.', 'Daarna volgt een service uit zone 5.', 'Na 9 services schuift de linie een plek door.'],
 ['Bal tussen twee passers: de passer die de bal voor zich heeft, neemt hem.', 'Na de pass meteen klaar voor aanloop of dekking.'],
 'Zet een spelverdeler op het doel die naar 4 of 2 opzet, zodat de oefening doorloopt naar aanval.',
 [['SR1', OPP, 'osrv1', 'osrv1', 'osrv5', 'osrv5'], ['P5', Y, '5', (190, 560), '5', '5'], ['L', LIB, '6', '6', '6', (330, 560)], ['P1', Y, '1'], ['SV', SV, 'sv']],
 ['osrv1', (190, 555), 'sv', 'osrv5', (330, 555)]))
N.append(ex(10, 'Spelverdeler loopt in vanaf positie 1', 'tech', ['sideout'], A,
 'De spelverdeler start op positie 1 in de ontvangst. De trainer of een serveerder brengt de bal in op een passer; de spelverdeler loopt in en zet op naar positie 4.',
 'Vroeg inlopen, met de rechterschouder naar het net en de voeten stil onder de bal.',
 ['Op het moment van de service loopt de spelverdeler van positie 1 naar het net.', 'De passer speelt de bal hoog naar de spelverdelerplek.', 'De spelverdeler staat stil en zet de bal hoog op naar 4.', 'De aanvaller op 4 slaat of vangt de bal.'],
 ['Eerst naar de plek, dan naar de bal kijken.', 'Rechterheup en -schouder naar het net, ook bij een slechte pass.'],
 'Hoger niveau: start op positie 6 of 5 (zie rotaties). Wissel de passer zodat de pass van verschillende kanten komt.',
 [['SV', SV, '1', (360, 450), 'sv', 'sv'], ['P5', Y, '5', (190, 560), '5', '5'], ['A4', Y, (130, 470), (130, 470), (140, 420), 'a4'], ['SRV', OPP, 'osrv5']],
 ['osrv5', (190, 555), 'sv', 'a4', (330, 120)]))
N.append(ex(11, 'Set-up naar 4 of 2 in de korf', 'tech', ['sideout', 'aanval'], A,
 'Drie- of viertallen. Een speler gooit de bal vanaf positie 2 naar positie 6, de passer speelt naar 3 en de spelverdeler zet op in een korf (of een stoel met een mat) op positie 4 of 2.',
 'Een constante set-up: dezelfde hoogte en afstand tot het net, voor of achter.',
 ['De aangever gooit een ruime bal naar positie 6.', 'De passer speelt de bal onderarms naar positie 3.', 'De spelverdeler zet op naar de korf op positie 4 of 2.', 'Na tien goede ballen draaien de spelers door.'],
 ['Set-up op ongeveer een meter van het net, niet te strak.', 'Bij een set naar achteren: heupen naar voren duwen en niet achterover leunen.'],
 'De aangever kiest de richting pas op het laatste moment door "voor" of "achter" te roepen.',
 [['AG', TR, '2'], ['P6', Y, '6', (280, 560), '6', '6'], ['SV', SV, 'sv'], ['K', W, (150, 380), (150, 380), (150, 380), (150, 380)]],
 ['2', (280, 555), 'sv', (150, 370), '2']))
N.append(ex(12, 'Aanvalslijn op positie 4 met aanloop', 'tech', ['aanval'], A,
 'Een rij aanvallers op positie 4 buiten de 3-meterlijn, een spelverdeler (of trainer) op positie 2/3. Aan de overkant staan twee spelers die de bal ophalen.',
 'Een ritmische aanloop (links-rechts-links voor rechtshandigen) en hoog raken voor je lichaam.',
 ['De aanvaller gooit of speelt de bal naar de spelverdeler.', 'De spelverdeler zet hoog op naar positie 4.', 'De aanvaller doet de aanloop en springt af met beide voeten.', 'Slag diagonaal of langs de lijn; daarna haalt hij de bal op.'],
 ['Laatste twee stappen snel en lang, armen ver naar achteren.', 'Raak de bal op het hoogste punt, een beetje voor je slagschouder.'],
 'Leg twee matten aan de overkant: lijn en diep diagonaal. Hoger niveau: een blokkeerder op een box stelt het blok.',
 [['A4', Y, (130, 480), (140, 440), (155, 390), 'a4'], ['SV', SV, 'sv'], ['H', W, (420, 120)], ['A', Y, (120, 520)]],
 [(140, 470), 'sv', (160, 340), 'a4', (390, 130)]))
N.append(ex(13, 'Eerste tempo in het midden', 'tech', ['aanval', 'sideout'], H,
 'Middenaanvallers in een rij bij positie 3, een vaste spelverdeler en een trainer die de pass ingooit. De middenaanvaller springt al terwijl de bal naar de spelverdeler gaat.',
 'Timing tussen spelverdeler en middenaanvaller: de aanvaller is in de lucht als de spelverdeler de bal raakt.',
 ['De trainer gooit een pass naar de spelverdeler.', 'De middenaanvaller start zijn aanloop als de pass halverwege is.', 'Hij springt vlak voor de spelverdeler, met de arm al hoog.', 'De spelverdeler legt de bal kort in de slaghand; slag naar de grond.'],
 ['Aanvaller: kort, snel en eerder springen dan je denkt.', 'Spelverdeler: de bal naar de hand brengen, niet naar de speler.'],
 'Wissel tussen een 1 (voor de spelverdeler) en een korte bal achter de spelverdeler.',
 [['TR', TR, (300, 560)], ['SV', SV, 'sv'], ['MA', Y, (260, 480), (270, 440), (300, 380), (310, 360)], ['H', W, (280, 130)]],
 [(300, 555), 'sv', (315, 345), (315, 345), (270, 160)]))
N.append(ex(14, 'Swingblok in het midden: lees links of rechts', 'tech', ['blok'], H,
 'Aan de overkant staan drie spelers op een box of bank op positie 4, 3 en 2, met een spelverdeler. Eigen kant: middenblokkeerder plus twee buitenkanten. De middelste slaat afwisselend naar zone 1 en 5.',
 'Lezen waar de bal heen gaat en met een swingblok (aanloop langs het net) op tijd bij de buitenkant zijn.',
 ['De spelverdeler aan de overkant kiest links of rechts.', 'De middenblokkeerder leest de set en zet een swingblok in.', 'Hij sluit aan bij de buitenblokkeerder; samen een dubbelblok.', 'Daarna terug naar het midden en de volgende bal.'],
 ['Eerst de bal, dan de spelverdeler, dan de aanvaller.', 'Laatste stap draait de heup terug naar het net.'],
 'Begin met een vaste richting; daarna kiest de spelverdeler vrij. Topniveau: voeg een snelle middenbal toe.',
 [['MB', BL, 'b3', (230, 352), (175, 352), (175, 345)], ['BL4', BL, 'b4'], ['BL2', BL, 'b2'], ['OSV', OPP, (300, 320)], ['AV', OPP, 'box4', 'box4', 'box4', 'box4']],
 [(300, 320), (395, 285), (395, 285), (180, 340), (300, 320)]))
N.append(ex(15, 'Dubbelblok sluiten op de buitenkant', 'tech', ['blok'], V,
 'Trainer op een box aan de overkant op positie 4 (onze positie 2). Middenblokkeerder en blokkeerder op positie 2 blokkeren samen; een verdediger op positie 1 en 5.',
 'Geen gat tussen de blokkeerders en de buitenste hand draait de bal naar binnen.',
 ['De trainer gooit de bal op en slaat diagonaal.', 'De buitenblokkeerder zet het blok op de lijn en de middenblokkeerder sluit aan.', 'Twee handen boven het net, duimen tegen elkaar.', 'De verdedigers vangen wat langs het blok komt.'],
 ['Buitenblokkeerder bepaalt de plek, middenblokkeerder sluit aan.', 'Buitenste hand een beetje naar binnen draaien.'],
 'Laat de trainer ook af en toe tippen: de verdediger op 1 of 5 schuift dan naar voren.',
 [['TR', TR, 'box4'], ['B2', BL, 'b2', 'b2', (400, 345), (400, 345)], ['MB', BL, 'b3', (330, 352), (360, 345), (360, 345)], ['V5', LIB, '5', '5', (190, 520), (190, 520)], ['V1', Y, '1']],
 ['box4', (395, 280), (380, 335), (190, 515), (280, 360)]))
N.append(ex(16, 'Verdedigen vanaf de box: lijn en diagonaal', 'tech', ['verdediging'], V,
 'Trainer op een box aan de overkant op positie 4. Verdedigers op positie 1 (lijn), 6 (diep) en 5 (diagonaal). Een vanger op de spelverdelerplek.',
 'Op de juiste plek staan, laag zijn bij de slag en hoog naar het midden verdedigen.',
 ['De trainer slaat afwisselend langs de lijn en diagonaal.', 'De verdediger in die zone staat stil en laag op het moment van de slag.', 'Hij verdedigt hoog naar de vanger op 2/3.', 'Na 5 ballen schuift iedereen een plek door.'],
 ['Stil staan als de trainer de bal raakt.', 'Een bal net naast je: schouder naar binnen draaien zodat de bal naar het midden gaat.'],
 'Moeilijker: de trainer slaat ook tussen twee verdedigers in; de spelers moeten roepen wie hem neemt.',
 [['TR', TR, 'box4'], ['V1', LIB, '1', (400, 560), (400, 560), '1'], ['V6', Y, '6'], ['V5', Y, '5'], ['VG', SV, 'sv']],
 ['box4', (400, 555), 'sv', 'box4', (175, 560)]))
N.append(ex(17, 'Verdedigen, opstaan en de volgende bal', 'tech', ['verdediging', 'transitie'], V,
 'Eén verdediger in het veld, de trainer aan de overkant met een kar ballen. Drie ballen snel achter elkaar: hard, kort en ver. Een spelverdeler vangt.',
 'Na een verdediging meteen weer opstaan en klaar zijn: nooit op de grond blijven liggen.',
 ['De trainer slaat een harde bal recht op de verdediger.', 'Direct daarna een korte bal vóór de 3-meterlijn.', 'De verdediger sprint naar voren en speelt hem hoog.', 'De laatste bal gaat diep in de hoek.'],
 ['Kort en snel verplaatsen, laatste stap groot.', 'Na het spelen direct terug naar de basisplek.'],
 'Hoger niveau: na drie ballen moet de verdediger ook nog een aanval uit het achterveld spelen.',
 [['TR', TR, 'o3'], ['V', LIB, '6', '6', (300, 460), (210, 590)], ['SV', SV, 'sv']],
 ['o3', (280, 575), (300, 455), 'sv', (210, 595)]))
N.append(ex(18, 'Serveren op matten', 'tech', ['service'], A,
 'Drie matten aan de overkant: in zone 1, 6 en 5. Een volle ballenkar bij de serveerders, een lege bij de matten. Wie een mat raakt, scoort een punt.',
 'Gericht serveren met een vaste routine, ook in een rij met tijdsdruk.',
 ['Iedereen serveert om de beurt op een mat naar keuze.', 'Mat geraakt is 1 punt, de mat die de trainer kiest 2 punten.', 'Is de kar leeg, dan haalt iedereen de ballen en wisselt de kant.', 'Houd de score per speler bij.'],
 ['Na elke service even terug naar je routine: stuiter, adem, toss.', 'Mik op de mat, niet op de lijn.'],
 'Hoger niveau: sprong- of floatservice en de mat kleiner maken (een handdoek).',
 [['S1', Y, 'srv5', 'srv5', 'srv5', 'srv'], ['S2', Y, 'srv', 'srv', 'srv', 'srv5'], ['M1', W, (165, 100)], ['M6', W, (280, 90)], ['M5', W, (395, 100)]],
 ['srv5', (395, 100), 'srv', (165, 100), (280, 90)]))
N.append(ex(19, 'Tactisch serveren: float en sprongservice', 'tech', ['service'], H,
 'Serveerders verdeeld over twee zones (1 en 5). Aan de overkant een ontvangstlinie van drie. De trainer roept per service een doel: een speler, een naad tussen twee spelers of de korte zone.',
 'Service als eerste aanval: druk zetten op een zwakke passer of op de naad tussen spelers.',
 ['De trainer roept het doel, bijvoorbeeld "naad 5-6".', 'De serveerder slaat een float of sprongservice op dat doel.', 'De passers spelen de bal naar het doel op 2/3.', 'Een pass die de spelverdeler niet kan opzetten is een punt voor de serveerder.'],
 ['Float: korte slag zonder doorzwaaien, pols vast.', 'Sprong: toss voor je slaghand en een volle aanloop.'],
 'Laat de serveerders zelf een doel kiezen en het na de service zeggen: klopte het?',
 [['S', Y, 'srv'], ['P1', OPP, 'o1', (175, 110), 'o1', 'o1'], ['P6', OPP, 'o6'], ['P5', OPP, 'o5'], ['OSV', OPP, (230, 300)]],
 ['srv', (175, 115), (230, 300), 'srv5', (220, 100)]))
N.append(ex(20, 'Van blok naar aanval', 'tech', ['blok', 'transitie'], V,
 'Blokkeerder op positie 4, trainer op een box aan de overkant. Na de bloksprong valt de blokkeerder af naar buiten en wordt hij aanvaller. Een spelverdeler zet op.',
 'Snel afvallen na het blok en een volledige aanloop maken voor de transitie-aanval.',
 ['De blokkeerder springt bij de trainer op de box.', 'Hij landt, draait en valt af tot buiten de 3-meterlijn.', 'De trainer gooit een vrije bal naar de spelverdeler.', 'De spelverdeler zet op naar 4 en de blokkeerder valt aan.'],
 ['Afvallen met je gezicht naar de bal, niet met je rug.', 'Bij het afvallen al tellen: 1-2-3 en aanlopen.'],
 'Hoger niveau: de trainer slaat soms over het blok, dan moet de blokkeerder eerst nog verdedigen.',
 [['B4', BL, 'b4', (140, 470), (130, 470), 'a4'], ['SV', SV, 'sv'], ['TR', TR, 'box2']],
 ['box2', (165, 330), 'sv', 'a4', (360, 120)]))

# ------------------------------------------------------------ SPELSITUATIE (20 min)
N.append(ex(21, '3 tegen 3 in de lengte van het veld', 'spel', ['aanval', 'sideout'], A,
 'Het veld in de lengte in tweeën verdeeld met een lint of pionnen. Per helft 3 tegen 3; een vaste spelverdeler aan het net en twee achterspelers. Wachters halen ballen en wisselen na 5 punten.',
 'Drie keer spelen en afmaken met een aanval, ook als de pass niet perfect is.',
 ['Team A serveert onderhands of uit stand.', 'Team B passt naar de spelverdeler.', 'De spelverdeler zet op voor een van de achterspelers die aanloopt.', 'Na de aanval verdedigt team A en speelt het de rally uit.'],
 ['De spelverdeler moet de tweede bal altijd spelen.', 'Een aanval die uit stand wordt gespeeld telt ook.'],
 'Punt telt dubbel bij een smash. Hoger niveau: de spelverdeler mag een tweede bal zelf aanvallen.',
 [['SV', SV, (240, 370)], ['A', Y, (165, 560), (170, 545), (165, 420), (170, 360)], ['B', Y, (230, 560)], ['OS', OPP, (165, 20)], ['OA', OPP, (165, 120), (165, 120), (170, 150), (170, 150)]],
 [(165, 20), (170, 540), (240, 370), (170, 355), (170, 150)]))
N.append(ex(22, 'Pass, set en aanval tegen een blok', 'spel', ['aanval', 'blok'], V,
 'Eigen kant: passer, spelverdeler en aanvaller op 4. Overkant: twee blokkeerders en een verdediger. De trainer brengt de bal in met een service.',
 'Als aanvaller kiezen tegen een echt blok: langs het blok, over het blok of tegen de handen naar buiten.',
 ['De trainer serveert op de passer.', 'De passer speelt naar de spelverdeler.', 'De spelverdeler zet op naar 4 en het blok aan de overkant schuift mee.', 'De aanvaller kiest: lijn, diagonaal of tegen de handen naar buiten.'],
 ['Aanvaller: kijk tijdens de aanloop waar het blok staat.', 'Blok: buitenste blokkeerder zet de lijn dicht.'],
 'Wissel na 6 aanvallen de rollen. Punten: aanval scoort 1, blok scoort 2.',
 [['TR', TR, 'osrv1'], ['P', Y, '6', (270, 560), '6', '6'], ['SV', SV, 'sv'], ['A4', Y, (130, 470), (130, 470), (145, 400), 'a4'], ['OB2', OPP, (165, 300), (165, 300), (165, 328), (160, 325)], ['OB3', OPP, (280, 300), (280, 300), (215, 328), (205, 325)]],
 ['osrv1', (270, 555), 'sv', 'a4', (170, 120)]))
N.append(ex(23, 'Blok en veldverdediging tegen de box', 'spel', ['blok', 'verdediging'], V,
 'Trainer op de box aan de overkant op positie 4. Eigen kant: blok op positie 2 en 3, verdedigers op 1, 6, 5 en een speler op 4 die afvalt. Daarna wordt de verdedigde bal uitgespeeld naar een aanval.',
 'Blok en verdedigers vormen samen één plan: het blok sluit de lijn, de verdediging staat om het blok heen.',
 ['De trainer gooit een set naar zichzelf op de box.', 'Het dubbelblok sluit op positie 2; positie 4 valt af naar de 3-meterlijn.', 'De verdedigers op 1, 6 en 5 staan naast en achter de schaduw van het blok.', 'De verdedigde bal gaat via de spelverdeler naar een aanval op 4.'],
 ['Verdedigers staan waar het blok niet is.', 'Bij een tip: positie 1 of de afvallende speler op 4 neemt hem.'],
 'Laat de trainer na 5 ballen ook vanaf positie 2 aan de overkant slaan (box op onze positie 4): alles spiegelt.',
 [['TR', TR, 'box4'], ['B2', BL, 'b2', (395, 345), (395, 345), 'b2'], ['B3', BL, 'b3', (355, 345), (355, 345), 'b3'], ['V4', Y, '4', (160, 460), (160, 460), 'a4'], ['V5', Y, '5', (175, 560), (175, 560), '5'], ['V6', LIB, '6', (300, 600), (300, 600), '6'], ['V1', Y, '1', (420, 510), (420, 510), '1']],
 ['box4', (395, 280), (175, 555), 'sv', 'a4']))
N.append(ex(24, 'Side-out met drie passers en twee aanvallers', 'spel', ['sideout'], A,
 'Eigen kant: drie passers (5, 6, 1), een spelverdeler die inloopt en aanvallers op 4 en 2 (of 3). Serveerders aan de overkant; een verdediger aan de overkant speelt de aanval uit.',
 'Een complete side-out: pass, inlopende spelverdeler en een aanval met keuze.',
 ['Service vanaf de overkant.', 'De passers ontvangen en de spelverdeler loopt in vanaf positie 1.', 'De aanvallers op 4 en 2 lopen allebei aan.', 'De spelverdeler kiest; de andere aanvaller dekt.'],
 ['Elke aanvaller vraagt om de bal, ook als hij hem niet krijgt.', 'Passers zakken na de pass in voor de dekking.'],
 'Score: side-out in één keer is 1 punt, mislukt is een punt voor de serveerders. Speel naar 10.',
 [['SRV', OPP, 'osrv5'], ['P5', Y, '5', (180, 560), '5', (200, 470)], ['P6', LIB, '6'], ['SV', SV, '1', (360, 440), 'sv', 'sv'], ['A4', Y, (130, 470), (130, 470), (140, 410), 'a4'], ['A2', Y, (440, 470), (440, 470), (430, 410), (420, 380)]],
 ['osrv5', (180, 555), 'sv', 'a4', (360, 130)]))
N.append(ex(25, 'Vrije bal: omschakelen naar aanval', 'spel', ['transitie'], A,
 'Zes spelers in de verdedigende opstelling. De trainer staat aan de overkant en speelt een makkelijke (vrije) bal over het net. Het team roept "vrij!" en schakelt om.',
 'Snel herkennen van een vrije bal en in één beweging naar de aanvalsopstelling.',
 ['Het team staat in de basisverdediging, blokkeerders aan het net.', 'De trainer speelt een makkelijke bal: iemand roept "vrij!".', 'De netspelers vallen af en de spelverdeler loopt naar zijn plek.', 'Pass, set en aanval; daarna de volgende bal.'],
 ['Afvallen tot buiten de 3-meterlijn, zodat je kunt aanlopen.', 'De achterste speler neemt de vrije bal, niet de netspeler.'],
 'Hoger niveau: na de aanval meteen een tweede bal van de trainer (transitie op transitie).',
 [['TR', TR, 'o3'], ['N4', Y, 'b4', (150, 460), (150, 460), 'a4'], ['N3', Y, 'b3', (280, 450), (280, 450), (290, 360)], ['SV', SV, (395, 520), (370, 450), 'sv', 'sv'], ['L', LIB, '6', (280, 560), (280, 560), '6'], ['B5', Y, '5']],
 ['o3', (280, 555), 'sv', 'a4', (350, 120)]))
N.append(ex(26, 'Serveerders tegen ontvangers', 'spel', ['service', 'sideout'], A,
 'Twee groepen: serveerders aan de ene kant, de ontvangst (drie passers, spelverdeler, twee aanvallers) aan de andere. Wie het eerst 15 punten heeft, wint; daarna wisselen.',
 'Service-ontvangst onder wedstrijddruk: beide groepen spelen om punten.',
 ['De serveerder slaat een service.', 'Een directe fout of een ace is een punt voor de serveerders.', 'Een goede pass die de spelverdeler kan opzetten is een punt voor de ontvangers.', 'Een gescoorde aanval na de pass is twee punten.'],
 ['Serveerders: een foute service kost een punt, dus kies je risico.', 'Ontvangers: praat over de naad tussen twee passers.'],
 'Laat de ontvangers in een vaste rotatie staan (bijvoorbeeld rotatie 1) en wissel van rotatie na elke ronde.',
 [['SRV', OPP, 'osrv5'], ['P5', Y, '5', (185, 560), '5', '5'], ['L', LIB, '6'], ['P1', Y, '1'], ['SV', SV, 'sv'], ['A4', Y, (130, 470), (130, 470), (140, 410), 'a4']],
 ['osrv5', (185, 555), 'sv', 'a4', (330, 130)]))
N.append(ex(27, '4 tegen 4 met vaste spelverdeler', 'spel', ['aanval', 'transitie'], A,
 'Smaller veld (zijlijnen 1 meter naar binnen). Per kant een vaste spelverdeler aan het net en drie spelers die passen, verdedigen en aanvallen. Wissels draaien in na elk punt.',
 'Veel balcontacten en veel omschakelingen tussen verdedigen en aanvallen.',
 ['Een team brengt de bal in met een service.', 'De ontvangst gaat naar de spelverdeler.', 'De spelverdeler zet op naar een van de drie spelers.', 'Het andere team verdedigt en valt meteen weer aan.'],
 ['Wie niet aanvalt, dekt de aanvaller.', 'Altijd drie keer spelen: geen bal direct terug.'],
 'Hoger niveau: alleen punten met een aanval uit sprong. Lager niveau: de trainer gooit de bal in plaats van een service.',
 [['SV', SV, 'sv'], ['A', Y, '5', (180, 560), (150, 410), 'a4'], ['B', Y, '6'], ['C', Y, '1', '1', (380, 470), (370, 470)], ['OSV', OPP, (225, 305)], ['OA', OPP, (300, 120), (300, 120), (300, 110), (300, 110)], ['OS', OPP, (280, 20)]],
 [(280, 20), (180, 555), 'sv', 'a4', (300, 115)]))
N.append(ex(28, 'Diagonaalaanval vanaf positie 2', 'spel', ['aanval'], H,
 'De diagonaalspeler valt aan vanaf positie 2 (voor) en positie 1 (achter, buiten de 3-meterlijn). Spelverdeler, passer en aan de overkant een blok van twee met verdedigers.',
 'De diagonaal als vaste afmaker leren gebruiken, ook in het achterveld.',
 ['De trainer serveert op de passer.', 'De passer speelt naar de spelverdeler.', 'De spelverdeler zet naar achteren op naar positie 2 of hoog naar positie 1.', 'De diagonaal slaat langs het blok; de verdedigers spelen de bal uit.'],
 ['Set naar achteren: ruim van het net af, zodat de aanvaller kan zien.', 'Achteraanval: afzetten achter de 3-meterlijn.'],
 'Topniveau: combineer met een middenaanval, zodat het blok aan de overkant moet kiezen.',
 [['TR', TR, 'osrv1'], ['P', LIB, '6', (270, 560), '6', '6'], ['SV', SV, 'sv'], ['DIA', Y, '1', (420, 480), (420, 420), 'a2'], ['OB', OPP, 'ob4', 'ob4', (395, 320), (390, 325)], ['OV', OPP, (300, 100)]],
 ['osrv1', (270, 555), 'sv', 'a2', (150, 120)]))
N.append(ex(29, 'Blokdekking bij de eigen aanval', 'spel', ['aanval', 'blok'], V,
 'Eigen team in een aanvalssituatie op positie 4. Aan de overkant staat de trainer op een box met een bal in de hand of een plank als "blok". Elke aanval wordt teruggekaatst.',
 'Dekking rond de aanvaller (2-3 cup): wie dicht bij de aanvaller staat en wie daarachter.',
 ['De spelverdeler zet op naar 4.', 'Drie spelers zakken laag in een halve cirkel dichtbij de aanvaller.', 'Twee spelers dekken de lange ballen daarachter.', 'Het teruggekaatste blok wordt opgevangen en opnieuw aangevallen.'],
 ['Laag zitten met de handen voor je, ogen op de handen van het blok.', 'Na een dekbal meteen een nieuwe aanval opbouwen.'],
 'De trainer kaatst niet elke bal terug: soms verdedigt de overkant en speelt de rally uit.',
 [['SV', SV, 'sv'], ['A4', Y, (130, 470), (150, 410), 'a4', 'a4'], ['D1', Y, '3', (230, 430), (230, 430), (230, 430)], ['D2', LIB, '5', (180, 470), (180, 470), (180, 470)], ['D3', Y, '6', (280, 520), (260, 470), (260, 470)], ['D4', Y, '1', (380, 560), (330, 560), (330, 560)], ['BOX', TR, (180, 315)]],
 [(300, 560), 'sv', 'a4', (175, 335), (230, 425)]))

# ------------------------------------------------------------ 6 TEGEN 6 (25 min)
N.append(ex(30, '6 tegen 6: drie side-outs per rotatie', 'zes', ['sideout'], A,
 'Twee teams in hun eigen 5-1 opstelling. Team A ontvangt in rotatie 1 tot het drie side-outs heeft gehaald; dan draait het door naar de volgende rotatie. Team B serveert steeds.',
 'Elke rotatie van het 5-1 systeem onder wedstrijddruk doorlopen (zie ook het tabblad 5-1 rotaties).',
 ['Team B serveert op team A.', 'Team A haalt de side-out: pass, inlopende spelverdeler, aanval.', 'Na een side-out een nieuwe service; na drie side-outs draait team A door.', 'Na zes rotaties wisselen de rollen.'],
 ['Voor elke service: weet iedereen zijn plek en zijn looplijn?', 'Spelverdeler roept de aanvallen af voor de service.'],
 'Houd bij in welke rotatie het langst duurt: die rotatie oefen je volgende training apart.',
 [['SV', SV, '1', (360, 440), 'sv', 'sv'], ['P5', Y, '5', (180, 560), '5', '5'], ['L', LIB, '6'], ['A4', Y, (130, 450), (130, 470), (140, 410), 'a4'], ['M3', Y, '3', (280, 450), (290, 410), 'a3'], ['DIA', Y, '2', (440, 470), (430, 410), 'a2'], ['OS', OPP, 'osrv5']],
 ['osrv5', (180, 555), 'sv', 'a4', (330, 130)]))
N.append(ex(31, 'Wie de side-out haalt, mag serveren', 'zes', ['service', 'sideout'], A,
 'Gewone wedstrijd 6 tegen 6, maar een punt telt alleen als het ontvangende team de side-out haalt en daarna met de eigen service ook nog een punt wint ("break").',
 'Side-out én break-point: in de wedstrijd gaat het om beide.',
 ['Team A serveert; team B haalt de side-out.', 'Team B mag nu serveren.', 'Wint team B ook die rally (break), dan krijgt het een punt.', 'Mislukt de break, dan begint het opnieuw bij de andere ploeg.'],
 ['Na een side-out: kalm en gericht serveren.', 'Blok en verdediging zijn bij de break het belangrijkst.'],
 'Speel tot 10 punten. Hoger niveau: een break met een blokpunt telt dubbel.',
 [['OS', OPP, 'osrv5', 'osrv5', 'osrv5', 'osrv5'], ['SV', SV, 'sv'], ['P5', Y, '5', (180, 560), '5', '5'], ['A4', Y, (130, 470), (130, 470), (140, 410), 'a4'], ['L', LIB, '6'], ['S', Y, '1', '1', '1', 'srv']],
 ['osrv5', (180, 555), 'sv', 'a4', 'srv']))
N.append(ex(32, '6 tegen 6 met verdedigingsopdracht', 'zes', ['verdediging', 'blok'], V,
 'Wedstrijdvorm waarin één team een vaste verdedigingsopstelling oefent tegen aanvallen over buiten. De trainer gooit de bal in bij het aanvallende team, zodat er veel buitenaanvallen komen.',
 'De opstelling uit het tabblad Verdediging in het spel toepassen: blok sluit de lijn, verdedigers rond het blok.',
 ['De trainer gooit een vrije bal naar het aanvallende team.', 'Dat team speelt een aanval over buiten.', 'Het verdedigende team zet een dubbelblok en verdedigt in de afgesproken plekken.', 'Een verdedigde bal moet worden afgemaakt: dan is het een punt.'],
 ['Na elke rally: stonden de verdedigers in de juiste vakken?', 'Libero is de baas in het achterveld.'],
 'Wissel na 8 punten. Hoger niveau: het aanvallende team mag ook de middenaanval gebruiken.',
 [['TR', TR, (480, 200)], ['OA', OPP, 'o2', 'o2', (170, 300), (170, 300)], ['B2', BL, 'b2', 'b2', (395, 345), (395, 345)], ['B3', BL, 'b3', 'b3', (355, 345), (355, 345)], ['V1', Y, '1', '1', (420, 510), (420, 510)], ['L', LIB, '6', '6', (300, 600), (300, 600)], ['V5', Y, '5', '5', (175, 555), (175, 555)], ['V4', Y, '4', '4', (160, 460), (160, 460)]],
 [(480, 200), (230, 300), (170, 285), (175, 550), 'sv']))
N.append(ex(33, 'Punt telt pas na transitie', 'zes', ['transitie'], V,
 'Gewone 6 tegen 6, maar een punt uit de side-out (eerste aanval na de service) telt niet. Alleen punten na een verdediging of vrije bal tellen.',
 'Bewust trainen op het verdedigen en weer aanvallen, het deel dat in wedstrijden vaak beslist.',
 ['Team A serveert, team B haalt de side-out.', 'Wordt die aanval verdedigd, dan begint de transitie.', 'Het team dat in de transitie scoort, krijgt het punt.', 'Scoort de side-out direct, dan wordt de rally overgedaan zonder punt.'],
 ['Na je aanval direct terug naar je verdedigingsplek.', 'De spelverdeler roept wie de transitiebal krijgt.'],
 'Laat de trainer bij een directe side-out meteen een vrije bal geven, zodat het tempo hoog blijft.',
 [['A4', Y, 'a4', (160, 450), (150, 460), 'a4'], ['SV', SV, 'sv', (380, 470), 'sv', 'sv'], ['L', LIB, '6', (280, 560), (280, 560), '6'], ['OA', OPP, (380, 310), (380, 310), (380, 310), (380, 310)], ['OL', OPP, 'o6', 'o6', 'o6', (300, 140)]],
 ['a4', (300, 140), (380, 300), (280, 555), 'sv']))
N.append(ex(34, 'Blokpunten tellen dubbel', 'zes', ['blok'], A,
 'Gewone 6 tegen 6 in de 5-1 opstelling. Een punt met een blok is 2 punten, een aanval die tegen het blok uit gaat is ook 2 punten voor de aanvallers.',
 'Blokkeerders én aanvallers bewust laten kiezen: dichtzetten of slim langs het blok spelen.',
 ['Speel een normale rally.', 'Scoort het blok direct, dan krijgt dat team 2 punten.', 'Slaat de aanvaller via het blok uit, dan krijgt de aanvaller 2 punten.', 'Alle andere punten tellen gewoon.'],
 ['Blok: handen over het net en naar binnen.', 'Aanvaller: kijk naar de buitenste hand van het blok.'],
 'Speel sets naar 15. Hoger niveau: ook een "soft block" (bal hoog in eigen veld) levert een bonuspunt op als de rally gewonnen wordt.',
 [['OSV', OPP, (230, 305)], ['OA', OPP, (400, 200), (400, 250), (400, 300), (400, 300)], ['B2', BL, 'b2', (395, 345), (395, 340), (395, 340)], ['B3', BL, 'b3', (350, 345), (355, 340), (355, 340)], ['L', LIB, '6'], ['V5', Y, '5']],
 [(230, 305), (395, 290), (395, 330), (395, 330), (380, 200)]))
N.append(ex(35, 'Aanvallen op zones', 'zes', ['aanval'], V,
 'Gewone 6 tegen 6. De trainer wijst voor elke rally een "goudzone" aan (bijvoorbeeld diep in de hoek bij 1 of kort bij 4). Een aanval die daar scoort is 3 punten.',
 'Aanvallers leren plaatsen in plaats van alleen hard slaan.',
 ['De trainer zegt de goudzone voor de service.', 'Speel de rally normaal uit.', 'Een aanval die in de goudzone scoort, is 3 punten.', 'Na elke 5 rally\'s kiest de trainer een andere zone.'],
 ['Kijk bij de aanloop al naar de zone en naar het blok.', 'Plaatsen kan ook met een tip of een zachte bal.'],
 'Lager niveau: matten als zone gebruiken. Hoger niveau: de goudzone wordt pas na de pass genoemd.',
 [['SV', SV, 'sv'], ['A4', Y, (130, 470), (140, 410), 'a4', 'a4'], ['L', LIB, '6'], ['GZ', W, (395, 90)], ['OV', OPP, 'o6', 'o6', (300, 110), (330, 100)]],
 [(280, 560), 'sv', 'a4', (395, 95), (395, 95)]))
N.append(ex(36, 'Rotatiewedstrijd: elke rotatie tot 3', 'zes', ['sideout', 'service'], A,
 'Twee teams in 5-1 opstelling. Beide teams starten in rotatie 1. Een team draait pas door als het in die rotatie 3 punten heeft gemaakt. Wie het eerst alle zes rotaties rond is, wint.',
 'Het team leert in elke rotatie punten te maken, niet alleen in de "makkelijke".',
 ['Speel normale rally\'s met service en side-out.', 'Elk punt telt voor de rotatie waarin het team staat.', 'Bij 3 punten draait het team één rotatie door.', 'Het eerste team dat rotatie 6 afmaakt, wint.'],
 ['Gebruik het tabblad 5-1 rotaties om de opstellingen samen te bekijken.', 'Spelverdeler: noem voor de service de rotatie en de aanvallen.'],
 'Laag niveau: 2 punten per rotatie. Hoger niveau: het andere team mag bepalen in welke rotatie je verder gaat.',
 [['SV', SV, '1', (360, 440), 'sv', 'sv'], ['P5', Y, '5', (180, 560), '5', '5'], ['L', LIB, '6'], ['A4', Y, (130, 450), (130, 470), (140, 410), 'a4'], ['M3', Y, '3', (280, 450), (290, 410), 'a3'], ['DIA', Y, '2', (440, 470), (430, 410), 'a2'], ['OS', OPP, 'osrv1']],
 ['osrv1', (180, 555), 'sv', 'a3', (250, 120)]))

# ------------------------------------------------------------ EINDSPEL (10 min)
N.append(ex(37, 'Setje vanaf 15-15', 'eind', ['sideout', 'service', 'aanval', 'transitie'], A,
 'Een korte wedstrijdset 6 tegen 6 die begint op 15-15 en gaat tot 25. Wissels draaien in volgens de gewone regels.',
 'Afsluiten met wedstrijdspanning en alles uit de training samen toepassen.',
 ['Beide teams staan in rotatie 1; team A serveert.', 'Speel gewone rally\'s met wedstrijdregels.', 'De trainer let alleen op het thema van vandaag en roept het na een rally.', 'De set gaat tot 25 met twee punten verschil.'],
 ['Na elk punt even samen: wat doen we in de volgende rally?', 'Juich voor goede acties van het thema, niet alleen voor punten.'],
 'Hoger niveau: start op 20-22 achter, zodat één team onder druk moet terugkomen.',
 [['SV', SV, 'sv'], ['A4', Y, (130, 470), (140, 410), 'a4', 'a4'], ['L', LIB, '6'], ['OS', OPP, 'osrv5', 'osrv5', 'osrv5', 'osrv5'], ['OV', OPP, 'o6']],
 ['osrv5', (280, 555), 'sv', 'a4', (280, 100)]))
N.append(ex(38, 'Serveerwedstrijd: raak de zone', 'eind', ['service'], A,
 'Twee teams achter de twee achterlijnen. De trainer noemt een zone (1 t/m 6). Elke service in die zone is een punt. Een fout kost een punt.',
 'Rustig en gericht serveren aan het eind van een training, met vermoeide benen.',
 ['De trainer roept een zone.', 'Om de beurt serveren de spelers van beide teams.', 'De trainer telt de punten; elke 3 services een nieuwe zone.', 'Het eerste team met 15 punten wint.'],
 ['Ook als je moe bent: je eigen routine.', 'Kies je service: veilig of met risico.'],
 'Hoger niveau: alleen de korte zones (2, 3, 4) of de achterste hoeken.',
 [['S1', Y, 'srv', 'srv', 'srv5', 'srv5'], ['S2', OPP, 'osrv1', 'osrv1', 'osrv5', 'osrv5'], ['Z', W, (165, 100)]],
 ['srv', (165, 100), 'osrv1', (395, 580), 'srv5']))
N.append(ex(39, 'Blokkoning: aanvaller tegen blokkeerder', 'eind', ['blok', 'aanval'], V,
 'Aan beide kanten van het net een rij. Een speler valt aan op een set van de trainer, aan de overkant blokkeert een speler. Wie wint (aanval of blok), blijft staan.',
 'Explosief afsluiten met duels aan het net: aanval tegen blok.',
 ['De trainer zet op voor de aanvaller.', 'De blokkeerder aan de overkant probeert de bal te stoppen.', 'Scoort de aanvaller, dan blijft hij; anders blijft de blokkeerder.', 'Wie het langst blijft staan, is de koning.'],
 ['Blok: wacht op de aanvaller en spring een fractie later.', 'Aanvaller: kies je slag op tijd, het blok kijkt naar je schouder.'],
 'Speel op positie 4 en daarna op positie 2. Lager niveau: aanvallen uit stand.',
 [['TR', TR, 'sv'], ['AV', Y, (130, 470), (140, 420), 'a4', 'a4'], ['BL', OPP, (165, 310), (165, 310), (165, 325), (165, 325)], ['R', OPP, (130, 230)]],
 ['sv', 'sv', 'a4', (165, 330), (165, 120)]))
N.append(ex(40, 'Niet laten vallen: verdedigingsspel', 'eind', ['verdediging'], A,
 'Twee teams van zes aan beide kanten. De trainer staat aan de zijkant met een kar en gooit of slaat steeds een bal in een veld. Het team moet hem in drie keer terugspelen.',
 'Verdedigen met inzet en communicatie, met een lach als afsluiting.',
 ['De trainer brengt een bal in, waar hij maar wil.', 'Het team verdedigt en speelt in drie keer over het net.', 'De overkant speelt de bal ook in drie keer terug.', 'Valt de bal, dan is het een punt voor de andere ploeg; meteen de volgende bal.'],
 ['Elke bal is speelbaar tot hij op de grond ligt.', 'Roep altijd: "ik!"'],
 'Tempo omhoog: de trainer gooit al een nieuwe bal in zodra de vorige over het net is.',
 [['TR', TR, (490, 450)], ['V1', LIB, '5', (190, 560), '5', '5'], ['SV', SV, '3', 'sv', 'sv', '3'], ['A', Y, '4', '4', 'a4', '4'], ['O', OPP, 'o6', 'o6', 'o6', (300, 130)]],
 [(490, 450), (190, 555), 'sv', 'a4', (300, 130)]))
N.append(ex(41, 'Drie ballen achter elkaar', 'eind', ['transitie', 'verdediging'], V,
 'Wedstrijd 6 tegen 6 waarin een team pas een punt krijgt als het drie rally\'s achter elkaar wint. Na elke rally gooit de trainer direct een nieuwe bal in bij het team dat verloor.',
 'Hoog tempo en blijven presteren als je moe bent.',
 ['Speel een rally uit.', 'De trainer gooit meteen een bal in bij het team dat verloor.', 'Ook die rally wordt uitgespeeld; daarna nog een derde.', 'Wint één team alle drie, dan krijgt het een punt. Speel tot 3 punten.'],
 ['Na een rally niet stilstaan: direct terug naar de basisplek.', 'Coach elkaar: wie neemt de volgende bal?'],
 'Lager niveau: twee ballen achter elkaar in plaats van drie.',
 [['TR', TR, (490, 300)], ['SV', SV, 'sv'], ['A4', Y, (150, 470), (140, 420), 'a4', (160, 460)], ['L', LIB, '6'], ['OV', OPP, 'o5', 'o5', (380, 110), (380, 110)]],
 [(490, 300), (280, 555), 'sv', 'a4', (380, 110)]))

# ------------------------------------------------------------ WARMING-UP (fysiek, met bal) en INSPELEN (na de warming-up)
N.append(ex(42, 'Loopscholing langs het net met bal', 'wu', ['warming'], A,
 'Twee rijen op de achterlijn, ieder met een bal. Om de beurt loop je naar het net en terug met een loopvorm, en speel je bij het net de bal hoog voor jezelf.',
 'Lichaam rustig opwarmen: hartslag omhoog, heupen en enkels los, en al balgevoel.',
 ['De eerste van elke rij loopt met knieheffen naar de 3-meterlijn.', 'Bij het net: bal hoog voor jezelf en een bloksprong.', 'Terug met zijwaartse pas of kruispas.', 'Aansluiten achter in de rij; de volgende vertrekt.'],
 ['Elke ronde een andere loopvorm: hakken-billen, zijwaarts, kruispas, achteruit.', 'Rustig beginnen en per ronde het tempo opvoeren.'],
 'Voeg na 5 minuten een sprint van 3 meter toe na de bloksprong.',
 [['A', Y, (200, 640), (200, 470), (200, 365), (240, 560)], ['B', Y, (360, 640), (360, 470), (360, 365), (320, 560)], ['C', Y, (200, 665)], ['D', Y, (360, 665)]],
 [(200, 630), (200, 465), (200, 345), (200, 360), (240, 550)], door=['A', 'C'], mn=10))
N.append(ex(43, 'Tikkertje met overgooien', 'wu', ['warming'], A,
 'Speel op een veldhelft. Twee tikkers hebben samen één bal en mogen alleen tikken met de bal in de hand. Met de bal mag je niet lopen; de tikkers gooien de bal naar elkaar over.',
 'Opwarmen met spel: snel van richting veranderen en om je heen kijken.',
 ['De tikkers gooien de bal naar elkaar om dichter bij een speler te komen.', 'Wie getikt wordt, wordt ook tikker.', 'Een speler die gehurkt zit, mag niet getikt worden (maximaal 3 seconden).', 'Laatste vrije speler wint; nieuwe ronde.'],
 ['Kleine passen en laag zakken bij het wegdraaien.', 'Tikkers: praat met elkaar en werk samen.'],
 'Variatie: de tikkers spelen de bal bovenhands over in plaats van gooien.',
 [['T1', OPP, (200, 520), (250, 480), (330, 520), (330, 520)], ['T2', OPP, (360, 600), (330, 560), (360, 470), (360, 470)], ['A', Y, (300, 450), (380, 420), (420, 420), (420, 420)], ['B', Y, (180, 420), (150, 470), (150, 600), (150, 600)]],
 [(200, 515), (330, 560), (330, 515), (360, 465), (360, 465)], mn=10))
N.append(ex(44, 'Schaduwen in tweetallen', 'wu', ['warming', 'verdediging'], A,
 'Tweetallen tegenover elkaar, ieder aan een kant van het net. A is de leider en beweegt; B doet het zo snel mogelijk na. Na 45 seconden wisselen.',
 'Reactiesnelheid, voetenwerk en de lage verdedigende houding opwarmen.',
 ['A schuift zijwaarts langs het net; B volgt.', 'A doet een bloksprong; B springt mee.', 'A zakt naar achteren in de verdedigingshouding; B ook.', 'Na 45 seconden is B de leider.'],
 ['Blijf laag, voeten op schouderbreedte.', 'Kijk naar de heupen van je partner, niet naar zijn hoofd.'],
 'Moeilijker: A gooit af en toe een bal naar B, die hem hoog moet verdedigen.',
 [['A', Y, (250, 390), (340, 390), (340, 360), (340, 470)], ['B', OPP, (250, 290), (340, 290), (340, 320), (340, 210)]],
 [(250, 340), (250, 340), (250, 340), (250, 340), (250, 340)], door=['A', 'B'], mn=10))
N.append(ex(45, 'Schouders los: werpen in tweetallen', 'wu', ['warming', 'aanval', 'service'], A,
 'Tweetallen met één bal op ongeveer 6 meter, over het net. Werp de bal met een gestrekte arm en een swing zoals bij de aanval. De afstand wordt per minuut groter.',
 'Schouder en romp warm maken voordat er hard geslagen of geserveerd wordt.',
 ['A werpt de bal met een hoge armzwaai naar B.', 'B vangt boven het hoofd.', 'B werpt terug met de andere voet voor.', 'Elke minuut een stap verder naar achteren.'],
 ['Elleboog hoog, hand achter het hoofd voor de worp.', 'Draai in met de romp, niet alleen met de arm.'],
 'Laatste minuut: werp met een sprongetje, als een sprongservice.',
 [['A', Y, (280, 470), (280, 470), (280, 520), (280, 540)], ['B', OPP, (280, 210), (280, 210), (280, 160), (280, 140)]],
 [(280, 460), (280, 210), (280, 210), (280, 520), (280, 140)], door=['A', 'B'], mn=10))
N.append(ex(46, 'Estafette: verplaatsen en spelen', 'wu', ['warming', 'verdediging'], A,
 'Twee rijen op de achterlijn. Voor elke rij drie pionnen op het veld. Op de laatste pion speelt de trainer een bal toe die je terugspeelt.',
 'Wedstrijdje om de spieren warm te maken en tegelijk het verplaatsen naar de bal te oefenen.',
 ['De eerste speler sprint naar pion 1 en shuffelt naar pion 2.', 'Bij pion 3 gooit de trainer een bal.', 'De speler speelt hem onderarms terug naar de trainer.', 'Terug sprinten en de volgende aantikken.'],
 ['Bij de bal: stilstaan, dan pas spelen.', 'Moedig je teamgenoten aan.'],
 'Welke rij is het eerst klaar? Verliezers doen 5 bloksprongen.',
 [['TR', TR, (280, 370)], ['A', Y, (200, 640), (180, 520), (220, 440), (200, 640)], ['C', Y, (200, 665)], ['B', OPP, (360, 640), (380, 520), (340, 440), (360, 640)], ['D', OPP, (360, 665)]],
 [(280, 370), (280, 370), (220, 435), (280, 370), (340, 435)], door=['A', 'C'], mn=10))

N.append(ex(47, 'Tweetallen bovenhands: van stil naar verplaatsen', 'insp', ['inspelen', 'sideout'], A,
 'Tweetallen met één bal, ieder aan een kant van het net op 3 meter. Elke 2 minuten een nieuwe opdracht.',
 'Bovenhands inspelen: eerst zuiver contact, daarna met verplaatsen en draaien.',
 ['A en B spelen bovenhands over het net.', 'Na elke bal tikt de speler de 3-meterlijn aan.', 'Daarna: speel voor jezelf, draai een kwartslag en speel over.', 'Laatste opdracht: A speelt kort en lang, B verplaatst.'],
 ['Handen vroeg boven het voorhoofd, voeten stil op het moment van contact.', 'Strek door richting je partner.'],
 'Laat de spelers tellen: hoeveel keer lukt het zonder fout?',
 [['A', Y, (280, 440), (280, 450), (280, 470), (260, 430)], ['B', OPP, (280, 240), (280, 230), (300, 260), (300, 280)]],
 [(280, 430), (280, 245), (280, 440), (300, 255), (260, 425)], door=['A', 'B']))
N.append(ex(48, 'Tweetallen onderarms: hoog voor jezelf en dan over', 'insp', ['inspelen', 'service', 'verdediging'], A,
 'Tweetallen met één bal op 5 meter, aan dezelfde kant van het net. A speelt onderarms naar B; B speelt eerst hoog voor zichzelf en dan terug.',
 'Onderarms inspelen met controle: de bal laten stilvallen voordat je hem doorspeelt.',
 ['A speelt de bal onderarms naar B.', 'B speelt de bal hoog voor zichzelf.', 'B speelt hem onderarms terug naar A.', 'A doet hetzelfde.'],
 ['Plank vroeg vormen, armen gestrekt en schouders naar voren.', 'Speel vanuit de benen, niet vanuit de armen.'],
 'Moeilijker: A gooit of speelt steeds iets naast B, zodat B moet verplaatsen.',
 [['A', Y, (200, 470), (200, 470), (200, 470), (210, 470)], ['B', SV, (360, 520), (360, 520), (350, 510), (360, 520)]],
 [(200, 465), (360, 515), (360, 470), (360, 515), (200, 465)], door=['A', 'B']))
N.append(ex(49, 'Tweetallen over het net op doelen', 'insp', ['inspelen', 'service'], A,
 'Tweetallen over het net. Leg aan beide kanten een hoepel of mat in het achterveld. Elke bal die op het doel valt is een punt.',
 'Nauwkeurig inspelen over een grotere afstand, bovenhands en onderarms.',
 ['A speelt de bal hoog naar de mat aan de overkant.', 'B speelt de bal eerst voor zichzelf.', 'B mikt terug op de mat aan de andere kant.', 'Na 10 ballen wisselen van techniek.'],
 ['Een hoge boog geeft je partner tijd.', 'Draai je heupen naar het doel.'],
 'Moeilijker: alleen in één keer terugspelen.',
 [['A', Y, (200, 520), (200, 520), (210, 560), (200, 520)], ['B', OPP, (360, 160), (360, 160), (360, 150), (360, 160)], ['M', W, (360, 130)], ['M2', W, (200, 570)]],
 [(200, 515), (360, 135), (360, 120), (200, 565), (200, 515)], door=['A', 'B']))
N.append(ex(50, 'Drietallen in een lijn: de middelste draait', 'insp', ['inspelen', 'sideout'], A,
 'Drie spelers in een lijn op 3 meter afstand van elkaar. De middelste speler speelt de bal terug, draait zich om en speelt naar de andere kant.',
 'Snel draaien, je opnieuw opstellen en een zuivere bal geven: zoals een spelverdeler.',
 ['A speelt de bal naar de middelste, B.', 'B speelt terug naar A.', 'B draait om; A speelt nu over B heen naar C.', 'C speelt naar B en het begint opnieuw. Na 1 minuut wisselt B met A.'],
 ['Na het draaien: eerst je voeten stil, dan spelen.', 'Middelste speler: bal hoog en recht terug.'],
 'Moeilijker: B speelt de bal niet terug maar door naar C (achterwaarts).',
 [['A', Y, (280, 600), (280, 600), (280, 600), (280, 600)], ['B', SV, (280, 500), (280, 500), (280, 495), (280, 500)], ['C', Y, (280, 400)]],
 [(280, 595), (280, 495), (280, 595), (280, 405), (280, 495)], door=['A', 'B', 'C']))
N.append(ex(51, 'Tweetallen: inslaan en verdedigen over het net', 'insp', ['inspelen', 'aanval', 'verdediging'], A,
 'Tweetallen over het net. A gooit de bal op en slaat uit stand naar B; B verdedigt hoog voor zichzelf, zet op voor zichzelf en slaat terug.',
 'Inslaan met een rustige armzwaai en verdedigen met een stabiele plank.',
 ['A gooit de bal op en slaat gecontroleerd naar B.', 'B verdedigt hoog voor zichzelf.', 'B zet op voor zichzelf en slaat terug.', 'A verdedigt; zo gaat de rally door.'],
 ['Slaan: hand open, door het midden van de bal.', 'Verdedigen: niet zwaaien, alleen de plank richten.'],
 'Hoger niveau: met een sprongetje slaan en de bal steeds iets verder wegslaan.',
 [['A', Y, (220, 450), (220, 450), (220, 450), (225, 460)], ['B', OPP, (340, 210), (340, 210), (340, 220), (340, 210)]],
 [(220, 440), (340, 215), (340, 170), (220, 455), (220, 430)], door=['A', 'B']))
N.append(ex(52, 'Inserveren in tweetallen op korte afstand', 'insp', ['inspelen', 'service'], A,
 'Tweetallen over het net. De serveerder staat eerst op de 6-meterlijn (halverwege het achterveld) en serveert naar de partner, die passt en vangt. Elke 5 services een stap naar achteren.',
 'Rustig inserveren: de toss en het raakpunt vinden voordat je vanaf de achterlijn serveert.',
 ['A serveert vanaf halverwege het achterveld.', 'B passt de bal hoog voor zichzelf en vangt.', 'B serveert terug vanaf dezelfde afstand.', 'Na 5 services allebei een stap naar achteren, tot op de achterlijn.'],
 ['Toss laag en recht voor je slaghand.', 'Kijk naar het doel, sla door het midden van de bal.'],
 'Laatste ronde: serveer op een doel dat je partner aanwijst.',
 [['A', Y, (200, 520), (200, 520), (200, 560), (200, 600)], ['B', OPP, (360, 160), (360, 160), (360, 120), (360, 80)]],
 [(200, 510), (360, 165), (360, 130), (200, 560), (360, 80)], door=['A', 'B']))
N.append(ex(53, 'Vierkant: bal rond en doorlopen', 'insp', ['inspelen', 'transitie'], A,
 'Vier spelers in een vierkant (ongeveer 4 bij 4 meter) met één bal. Speel de bal kruislings rond; wie de bal speelt, loopt naar de plek waar hij de bal heen speelde.',
 'Spelen en meteen bewegen: na elke balaanraking een nieuwe plek innemen.',
 ['Speler A speelt diagonaal naar C en loopt achter de bal aan naar die hoek.', 'C speelt naar B en loopt naar de hoek van B.', 'B speelt naar D en loopt mee.', 'Zo blijft de bal en de hele groep in beweging.'],
 ['Roep de naam van wie je de bal geeft.', 'Lopen na het spelen, nooit tijdens het spelen.'],
 'Met 5 spelers: de vijfde wacht in een hoek en sluit aan als de bal komt.',
 [['A', Y, (220, 420), (300, 500), (300, 500), (300, 500)], ['B', Y, (340, 420), (340, 420), (340, 420), (220, 500)], ['C', Y, (340, 500), (340, 500), (220, 420), (220, 420)], ['D', Y, (220, 500), (220, 500), (220, 500), (220, 500)]],
 [(220, 415), (340, 495), (340, 415), (220, 495), (220, 415)], door=['A', 'C', 'B', 'D']))
N.append(ex(54, 'Smashen in tweetallen tegen de grond', 'insp', ['inspelen', 'aanval'], V,
 'Tweetallen op 6 meter, aan dezelfde kant van het net. A slaat de bal hard voor B op de grond, zodat hij hoog opstuit; B vangt of speelt hem. Daarna wisselen.',
 'Schouder warm maken voor de aanval met veel herhalingen en een volle armzwaai.',
 ['A gooit de bal op en slaat hem op de grond, halverwege.', 'De bal stuit hoog naar B.', 'B vangt of verdedigt de bal en slaat terug.', 'Na 10 slagen een stap verder uit elkaar.'],
 ['Volle armzwaai: elleboog hoog, pols los.', 'Raak de bal voor je lichaam.'],
 'Hoger niveau: met een aanloop van drie passen en afzet.',
 [['A', Y, (200, 470), (200, 470), (200, 470), (205, 470)], ['B', SV, (360, 520), (360, 520), (355, 525), (360, 520)]],
 [(200, 445), (280, 500), (360, 450), (360, 515), (200, 465)], door=['A', 'B']))

# ------------------------------------------------------------ WARMING-UP ZONDER BAL
NB = [(560, 690)] * 5   # geen bal: de bal staat stil buiten beeld en wordt niet getekend
N.append(ex(55, 'Dynamische warming-up zonder bal', 'wu', ['warming'], A,
 'Iedereen op de achterlijn, verspreid over de breedte. De trainer roept steeds een loopvorm; de groep loopt naar het net en wandelt langs de zijlijn terug.',
 'Spieren en gewrichten in 10 minuten wedstrijdklaar maken, zonder materiaal.',
 ['Rustig inlopen en armen zwaaien (voor, achter, kruislings).', 'Knieheffen, hakken-billen en zijwaarts kruispassen naar het net.', 'Uitvalspassen met romprotatie en heupopeners.', 'Afsluiten met 3 korte sprints en 3 bloksprongen bij het net.'],
 ['Elke ronde een beetje sneller, de laatste ronde op wedstrijdtempo.', 'Lang uitademen bij de rekoefeningen, niet veren.'],
 'Laat elke ronde een andere speler de loopvorm kiezen en voordoen.',
 [['A', Y, (170, 630), (170, 470), (170, 370), (130, 500)], ['B', Y, (250, 630), (250, 470), (250, 370), (130, 560)], ['C', Y, (330, 630), (330, 470), (330, 370), (440, 500)], ['D', Y, (410, 630), (410, 470), (410, 370), (440, 560)]],
 NB, mn=10, door=['A', 'B', 'C', 'D']))
N.append(ex(56, 'Reactiespel op signaal', 'wu', ['warming', 'verdediging'], A,
 'Spelers in tweetallen tegenover elkaar op de 3-meterlijnen aan beide kanten van het net. De trainer roept een kleur of steekt een arm omhoog; iedereen reageert zo snel mogelijk.',
 'Reactiesnelheid en een explosieve eerste stap, zonder bal.',
 ['Trainer roept "links": iedereen sprint naar de zijlijn links.', 'Trainer roept "net": bloksprong bij het net.', 'Trainer roept "achter": achteruit naar de achterlijn en laag zakken.', 'Wie het laatst is, doet 3 squats.'],
 ['Klein en laag staan, gewicht op de voorvoeten.', 'Eerst kijken, dan bewegen: niet raden.'],
 'Moeilijker: de trainer wijst in plaats van roept, of doet het omgekeerde van wat hij roept.',
 [['TR', TR, (500, 340)], ['A', Y, (230, 450), (130, 450), (230, 360), (230, 620)], ['B', Y, (330, 450), (130, 470), (330, 360), (330, 620)], ['C', OPP, (230, 230), (130, 230), (230, 320), (230, 60)], ['D', OPP, (330, 230), (130, 210), (330, 320), (330, 60)]],
 NB, mn=10))
N.append(ex(57, 'Voetenwerkcircuit: blok, verdediging en aanloop', 'wu', ['warming', 'blok', 'aanval'], A,
 'Drie stations zonder bal. Station 1 aan het net: zijwaartse blokpas en bloksprong. Station 2 in het achterveld: verdedigingshouding en uitstappen. Station 3 bij de 3-meterlijn: aanlooppas en afzet. Elke minuut wisselen.',
 'Volleybalspecifieke bewegingen opwarmen voordat de bal erbij komt.',
 ['Station 1: blokpas van 4 naar 3, bloksprong, terug en weer springen.', 'Station 2: laag zakken, uitstappen links en rechts, opstaan.', 'Station 3: aanloop links-rechts-links en afzet met armzwaai.', 'Op het fluitsignaal schuift elke groep een station door.'],
 ['Kwaliteit boven snelheid: rustig maar zuiver.', 'Bij de bloksprong de handen voor je gezicht houden.'],
 'Met 12 spelers: 4 per station. Laatste ronde: alles op volle snelheid.',
 [['B1', BL, 'b4', 'b3', 'b3', 'b4'], ['V1', LIB, '5', (165, 560), (200, 580), '5'], ['A1', Y, (420, 500), (410, 450), (400, 400), (420, 500)]],
 NB, mn=10, door=['B1', 'V1', 'A1']))
N.append(ex(58, 'Spiegeltikkertje op een veldhelft', 'wu', ['warming'], A,
 'Speel op één veldhelft. Tweetallen: een tikker en een loper, die tegenover elkaar aan weerszijden van de middenlijn (het net) staan en alleen langs de netlijn mogen bewegen.',
 'Snel zijwaarts verplaatsen en wegdraaien, als opwarming voor het blokwerk.',
 ['De loper probeert langs de netlijn een pion aan de zijlijn te bereiken.', 'De tikker spiegelt aan de andere kant en probeert er eerder te zijn.', 'Is de tikker eerst, dan krijgt hij een punt.', 'Na 5 pogingen wisselen van rol.'],
 ['Zijwaartse pas, voeten niet kruisen bij korte afstanden.', 'Blijf laag om snel te kunnen keren.'],
 'Moeilijker: na het bereiken van de pion meteen een bloksprong.',
 [['A', Y, (280, 380), (200, 380), (360, 380), (140, 380)], ['B', OPP, (280, 300), (210, 300), (350, 300), (150, 300)], ['P1', W, (120, 380)], ['P2', W, (440, 380)]],
 NB, mn=10, door=['A', 'B']))

# Titels en niveaus van de oude oefeningen opschonen
OUD = {
 's1': ('Vlinder: service, pass en doorlopen', None), 's2': ('Driehoeks-pepper over het net', None),
 's3': ('Side-out passlijn met keuze buiten of eerste tempo', [2, 3, 4, 5]),
 's4': ('Verdedigen op buitenaanval en omschakelen naar de diagonaal', [2, 3, 4, 5]),
 's5': ('6 tegen 6 met bonusbal van de trainer', None), 's6': ('Wedstrijdsituatie: 21-21 met een rotatie-opdracht', None),
 's18': (None, [3, 4, 5]),
}

f = pathlib.Path(__file__).resolve().parent.parent / 'senioren.js'
txt = f.read_text()
head, data = txt.split('window.SEN=', 1)
sen = json.loads(data.strip().rstrip(';'))
sen = [d for d in sen if not d['id'].startswith('n')]
for d in sen:
    if d['id'] in OUD:
        t, n = OUD[d['id']]
        if t: d['t'] = t
        if n: d['niv'] = n
sen += N
for d in sen:
    d.pop('zb', None)
    if len(set(map(tuple, d['bal']))) == 1:
        d['zb'] = True
# Inspelen is een eigen blok na de warming-up. Warming-up en Inspelen zijn ook thema's.
LEN = {'wu': 10, 'insp': 10, 'tech': 20, 'spel': 20, 'zes': 20, 'eind': 10}
NAAR_INSP = {'s2', 's7', 's11', 'n1'}
for d in sen:
    if d['id'] in NAAR_INSP:
        d['blok'] = 'insp'
    if d['blok'] == 'wu' and 'warming' not in d['thema']:
        d['thema'] = ['warming'] + d['thema']
    if d['blok'] == 'insp' and 'inspelen' not in d['thema']:
        d['thema'] = ['inspelen'] + d['thema']
    d['min'] = LEN[d['blok']]
    # trainer altijd in trainerkleur, en een aangooier tekenen als niemand op de startplek van de bal staat
    for q in d['p']:
        if q[0] in ('TRN', 'TR', 'T', 'SL', 'AG') and not (d['id'] == 's14'):
            q[1] = TR
    if d['id'] == 's14':
        for q in d['p']:
            if q[0] == 'TR':
                q[0], q[1] = 'PAS', OPP
    b0 = d['bal'][0]
    if len(set(map(tuple, d['bal']))) > 1 and not any(abs(q[2][0][0] - b0[0]) < 30 and abs(q[2][0][1] - b0[1]) < 30 for q in d['p']):
        d['p'].append(['TR', TR, [list(b0)] * 4])
        print('aangooier toegevoegd:', d['id'], d['t'])
# Aantal spelers dat een oefening tegelijk nodig heeft (trainer en materiaal tellen niet mee)
OBJ = {'K', 'M', 'M2', 'M1', 'M5', 'M6', 'Z', 'GZ', 'BOX', 'P1', 'P2'}
for d in sen:
    k = sum(1 for nm, kl, _ in d['p'] if kl != TR and nm not in OBJ and not (nm == 'P' and kl == BL))
    d['need'] = 4 if d['blok'] in ('zes', 'eind') else max(2, min(k, 12))
    d.pop('niv', None)
f.write_text(head + 'window.SEN=' + json.dumps(sen, ensure_ascii=False, separators=(',', ':')).replace('},{"id"', '},\n{"id"') + ';\n')
import collections
c = collections.Counter(d['blok'] for d in sen)
print(len(sen), dict(c))
for th in ['warming', 'inspelen', 'sideout', 'service', 'aanval', 'blok', 'verdediging', 'transitie']:
    print(th, {b: sum(1 for d in sen if d['blok'] == b and th in d['thema']) for b in ['wu', 'insp', 'tech', 'spel', 'zes', 'eind']})

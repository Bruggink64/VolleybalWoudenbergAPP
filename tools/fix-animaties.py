# 23-11-2026: systematische controle van alle Jeugd & Senioren-animaties tegen de omschrijving.
# Wordt door senioren-bron.py uitgevoerd na de oude correcties (exec). Hier staat per oefening wat in de tekening
# niet klopte met opzet of verloop. Gebruikt: sen (lijst met oefeningen), Y, SV, LIB, OPP, TR, BL, W, re.
# Materiaalnamen: PN/KG = pion, M of M1-M6 = mat, HP = hoepel, KO = korf, BX = box of bank, LAD = loopladder,
# LINT = lint aan het net, ZN = doelzone, KAR = ballenkar, KT = speelkaarten (zie senioren-obj.js).

OWN_SPOTS = [(165, 390), (395, 390), (280, 390), (165, 580), (395, 580), (280, 585)]
OPP_SPOTS = [(165, 290), (395, 290), (280, 290), (165, 100), (395, 100), (280, 95)]
OBJRE = re.compile(r'^(PN|KG|KE|HP|KO|BX|BOX|LAD|LINT|ZN|KAR|KT)\d*$|^M\d?$|^(Z|GZ)$')

def _byid(i):
    return next(d for d in sen if d['id'] == i)

def _people(d, side):
    out = []
    for nm, kl, pos in d['p']:
        if kl == TR or OBJRE.match(nm) or nm in ('P', 'K') and kl == W:
            continue
        if (pos[0][1] > 340) == (side == 'own'):
            out.append((nm, pos[0]))
    return out

def _free(d, pre):
    k = 1
    names = {p[0] for p in d['p']}
    while pre + str(k) in names:
        k += 1
    return pre + str(k)

def fill(i, own=None, opp=None):
    """Teken zoveel spelers per kant als de tekst zegt (op de vrije plekken van het standaardveld)."""
    d = _byid(i)
    for side, n, spots, kl, pre in (('own', own, OWN_SPOTS, Y, 'E'), ('opp', opp, OPP_SPOTS, OPP, 'O')):
        if not n:
            continue
        have = _people(d, side)
        while len(have) < n:
            best = max(spots, key=lambda s: min([((s[0] - q[0]) ** 2 + (s[1] - q[1]) ** 2) ** .5 for _, q in have] or [999]))
            nm = _free(d, pre)
            d['p'].append([nm, kl, [list(best)] * 4])
            have.append((nm, best))

def add(i, nm, kl, pos):
    d = _byid(i)
    if any(p[0] == nm for p in d['p']):
        return
    pos = [list(pos)] * 4 if isinstance(pos[0], (int, float)) else [list(p) for p in pos]
    d['p'].append([nm, kl, pos])

def rename(i, old, new, kl=None):
    for p in _byid(i)['p']:
        if p[0] == old:
            p[0] = new
            if kl: p[1] = kl

def start(i, nm):
    return next(p[2][0] for p in _byid(i)['p'] if p[0] == nm)

# ---------------------------------------------------------------- oude oefeningen (s1-s21)
add('s1', 'M', W, (390, 140))                      # de doelmat waar de bal op getikt wordt
add('s5', 'TR', TR, (490, 330)); fill('s5', opp=6)  # trainer gooit de bonusbal; 6 tegen 6
fill('s6', opp=6)
rename('s9', 'M1', 'ZN1'); rename('s9', 'M6', 'ZN2'); rename('s9', 'M5', 'ZN3')  # doelzones, geen matten
add('s9', 'BK', Y, (470, 560))                     # het balkind
add('s13', 'BK', Y, (480, 90))                     # balkind dat de bal terugbrengt
add('s16', 'TR', TR, (165, 318)); add('s16', 'BX1', W, (165, 318))  # coachblok op een box
fill('s17', opp=3); add('s17', 'M', W, (190, 120))
fill('s19', opp=3); add('s19', 'M', W, (405, 125))
# ---------------------------------------------------------------- n-oefeningen
fill('n6', opp=3)
add('n7', 'KAR1', W, (470, 400))
add('n12', 'H2', W, (440, 120))
rename('n11', 'K', 'KO1')
fill('n14', opp=3)
add('n18', 'KAR1', W, (470, 650)); add('n18', 'KAR2', W, (470, 60))
fill('n21', opp=3)
for y in (140, 240, 440, 540):
    add('n21', 'PN%d' % (y // 100), W, (280, y))
add('n22', 'OV', OPP, (280, 190))
add('n24', 'OV', OPP, (280, 190))
fill('n25', own=6)
fill('n26', own=6)
fill('n27', opp=4)
add('n28', 'OB2', OPP, (355, 328))
add('n29', 'TR', TR, (180, 315))
fill('n30', own=6, opp=6)
fill('n31', own=6, opp=6)
fill('n32', own=6, opp=6)
fill('n33', own=6, opp=6)
fill('n35', own=6, opp=6)
fill('n36', own=6, opp=6)
fill('n40', own=6, opp=6)
fill('n41', own=6, opp=6)
rename('n59', 'K', 'KT1')
fill('n61', own=3, opp=3)
add('n62', 'HP1', W, (200, 470)); add('n62', 'HP2', W, (230, 400))
add('n75', 'SRV2', OPP, (165, 20))
fill('n82', own=6, opp=6)
fill('n83', opp=6)
# n85: elf pionnen per helft als kegels
_pos = [(165, 420), (225, 420), (280, 420), (335, 420), (395, 420), (190, 480), (250, 480), (310, 480), (370, 480), (225, 540), (335, 540)]
for k, (x, y) in enumerate(_pos[:9]):
    add('n85', 'PN%d' % (k + 1), W, (x, y))
    add('n85', 'PN%d' % (k + 11), W, (x, 680 - y))
add('n93', 'PN1', W, (200, 55)); add('n93', 'PN2', W, (360, 55)); add('n93', 'PN3', W, (200, 625)); add('n93', 'PN4', W, (360, 625))
add('n107', 'PN1', W, (305, 372)); add('n107', 'PN2', W, (365, 372)); add('n107', 'KAR1', W, (430, 400))
rename('n110', 'Z', 'HP1'); rename('n110', 'GZ', 'HP2')
rename('n113', 'Z', 'LAD1')
add('n147', 'LINT1', W, (335, 337))

# ---------------------------------------------------------------- algemeen: box en kar bij de trainer
BOXRE = re.compile(r'trainer[^.]{0,70}\b(box|bank|verhoging)\b|\b(box|bank|verhoging)\b[^.]{0,50}trainer')
KARRE = re.compile(r'trainer[^.]{0,90}\bkar\b|\bkar\b[^.]{0,50}trainer|ballenkar[^.]{0,50}trainer')
for d in sen:
    if not d['id'].startswith('n'):
        continue
    txt = ' '.join([d['opzet']] + d['stappen']).lower()
    trs = [p for p in d['p'] if p[1] == TR and not OBJRE.match(p[0])]
    if not trs:
        continue
    if BOXRE.search(txt) and not any(re.match(r'^(BX|BOX)\d*$', p[0]) for p in d['p']):
        add(d['id'], 'BX1', W, trs[0][2][0]); print('box onder trainer:', d['id'])
    if KARRE.search(txt) and not any(re.match(r'^KAR\d*$', p[0]) for p in d['p']):
        x, y = trs[0][2][0]
        add(d['id'], 'KAR1', W, (min(x + 32, 520), y + 22 if y < 600 else y - 22)); print('kar bij trainer:', d['id'])

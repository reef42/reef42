# Tengeri Akvarisztikai Fajadatbázis / Marine Aquarium Species Database

Kétnyelvű (magyar/angol) tengeri akvarisztikai adatbázis: halak, korallok, gerinctelenek és betegségek részletes tartási útmutatóival, licencbiztos képekkel és ellenőrzött forrásokkal.

**Verzió:** 1.0 · 2026-11-12

## Lefedettség

| Csoport | Bejegyzések |
| --- | --- |
| Halak | 75 faj, 8 alkategória |
| Korallok | 40 nemzetség/faj, 12 alkategória |
| Gerinctelenek | 41 faj, 10 alkategória |
| Betegségek és kártevők | 13 bejegyzés |

- Minden élőlény-bejegyzésnél szerepel: magyar és angol név, tudományos név, méret, élettartam (természetes/akváriumi, ha ismert), minimum és ideális akváriumméret, nehézség, hasznosság (utility), reef-safe besorolás, viselkedés, táplálkozás, származás, egyéb tudnivalók, betegség-hivatkozások, források és kép.
- A korall-bejegyzéseknél: növekedési forma, nehézség, fényigény, áramlás, elhelyezés, növekedés, agresszió, etetés, származás.
- A betegség-bejegyzéseknél: kórokozó, érintett csoportok, tünetek, okok/terjedés, megelőzés, tömör kezelési útmutató és figyelmeztetések (pl. korallok érzékenysége a rézkezelésre).
- Ahol nincs megbízható adat, a mező „Nem ismert / Unknown” — soha nem becslünk.
- A szín- és kereskedelmi morfok NEM külön fajok (pl. designer zoa, bounce gomba, arany fáklyás) — faj- ill. nemzetségszinten szerepelnek.

## Struktúra

```
marine-db/
├── data/                    # strukturált adatforrások (JSON)
│   ├── taxonomy.json         # kategóriák + enum-fordítások (HU/EN)
│   ├── fish/                # halak, alkategóriánként egy fájl
│   ├── corals/              # korallok
│   ├── invertebrates/       # gerinctelenek
│   └── diseases/            # betegségek
├── scripts/
│   └── enrich.py            # WoRMS/FishBase-link és Wikimedia-kép ellenőrző-gyűjtő
└── site/                    # statikus webes felület (deploy)
    ├── index.html
    ├── css/style.css
    └── js/  (data.js = generált, app.js)
```

Az adatbázis „forrás igazsága” a `data/` mappa; a `site/js/data.js` belőle van generálva (a gyökérben futtatható regeneráló szkript a `scripts/build_data.py`-ban lévő logika szerint — lásd alul).

## Adatmezők (JSON séma)

Közös mezők: `id`, `group`, `category`, `scientific_name`, `name_en`, `name_hu`, `difficulty`, `diseases` (id-lista), `sources`, `image`.

Halak/gerinctelenek: `size_cm`, `lifespan_wild_years`, `lifespan_captivity_years`, `tank_min_l`, `tank_ideal_l`, `utility` (lista), `reef_safety`, `behavior`, `feeding`, `origin`, `notes`.

Korallok: `type`, `light`, `flow`, `growth`, `placement`, `aggression`, `feeding`, `origin`, `notes`.

Betegségek: `pathogen`, `affected`, `symptoms`, `causes`, `prevention`, `treatment`, `warnings`.

A leíró szöveges mezők kétnyelvű objektumok: `{"hu": "...", "en": "..."}`. Az enum-mezők (difficulty, reef_safety, light, flow, growth, utility) angol kanonikus értéket tárolnak, a fordítást a `taxonomy.json` `enums` blokkja adja.

## Képek és licencek

- Minden kép a **Wikimedia Commons**-ról származik, külső URL-lel betöltve (nem tároljuk saját szerveren).
- Csak CC BY, CC BY-SA, CC0 vagy Public Domain licencű képek kerültek be.
- Minden bejegyzés `image` mezőjében szerepel: a kép URL-e, a forrásoldal, a szerző és a licenc — ez a weboldalon is megjelenik.
- Ha egy fajhoz nem volt megfelelő licencű kép, az `image` mező hiányzik („Nincs elérhető licenc-kép”).

## Források

Fajonkénti forráslisták adatai:
- **WoRMS** (World Register of Marine Species) — rendszertani név ellenőrzés, Aphia-azonosító (minden tényleges élőlény-bejegyzésnél).
- **FishBase** — halaknál fajlap-link.
- **Wikimedia Commons** — képek és licencadatok.

Általános referenciák (a tartalmi adatok összeállításánál felhasznált tipikus szakmai források): LiveAquaria, Tidal Gardens, World Wide Corals, Reef App, WoRMS, FishBase, SeaLifeBase, IUCN Red List. A kereskedelmi oldalak képeit a licenc miatt nem használtuk fel.

## Bővítés

1. Új bejegyzést a megfelelő `data/<csoport>/<kategória>.json` fájlba szúrjuk be a fenti séma szerint (új `id`-val, pl. `genus-species`).
2. A betegséghivatkozások (`diseases` lista) a `diseases/diseases.json`-ban szereplő `id`-kra mutassanak.
3. Regenerálás: a `data/` mappából készüljön el újra a `site/js/data.js`:
   ```bash
   python3 - <<'EOF'
   import json, os
   out = {"taxonomy": json.load(open("data/taxonomy.json", encoding="utf-8"))}
   groups = {"fish": [], "coral": [], "invertebrate": [], "disease": []}
   for sub, gk in (("fish","fish"),("corals","coral"),("invertebrates","invertebrate"),("diseases","disease")):
       d = os.path.join("data", sub)
       for fn in sorted(os.listdir(d)):
           if fn.endswith(".json"):
               groups[gk].extend(json.load(open(os.path.join(d, fn), encoding="utf-8")))
   out["entries"] = groups
   open("site/js/data.js", "w", encoding="utf-8").write("window.DB = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";")
   EOF
   ```
4. Kép hozzáadásához futtatható a `scripts/enrich.py` logikája (Wikimedia Commons API, licencszűréssel), vagy kézzel kell kitölteni az `image` mezőt (url, source, source_page, author, license).

## Módszertan és minőség

- A méret- és tartási adatok a szakma standard referenciáinak (LiveAquaria, FishBase, WoRMS, tenyésztői tapasztalatok) általánosan elfogadott tartományát tükrözik; a tudományos nevek a WoRMS szerint ellenőrzött, elfogadott nevek.
- A félreírtható vagy egyedülálló adatokat ismeretlenként jelöltük, nem találtunk ki értékeket.
- A kezelési útmutatók tömörek és gyakorlatiasak; a beavatkozás előtt állatorvossal/gyógyszertárral egyeztetendők.
- Az adatok strukturált JSON-ban tárolódnak, így adatbázisba (SQL/NoSQL) vagy bármilyen frontendbe könnyen átemelhetők.

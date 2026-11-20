# Adatséma

Ez a leírás a `databases/data/` mappa JSON-fájljainak mezőit sorolja fel. Új faj felvételekor vagy meglévő
bővítésekor minden mezőt e szerint kell kitölteni. Az ellenőrzést és az oldal adatfájljának előállítását a
`node species/tools/build.mjs` végzi: hibánál nem ír semmit, figyelmeztetésnél igen.

Általános szabályok:

- Szöveges leíró mező mindig kétnyelvű objektum: `{ "hu": "…", "en": "…" }`.
- Felsorolás (enum) mezőben csak a `taxonomy.json` `enums` blokkjában szereplő angol kulcs állhat.
- Ahol nincs megbízható adat, a mező maradjon ki (vagy `null`). Nem becslünk, nem találunk ki értéket.
- A fájlok formázása: 1 szóközös behúzás, UTF-8.

## Fájlok

| Fájl | Tartalom |
| --- | --- |
| `taxonomy.json` | Csoportok, kategóriák (sorrendjük a megjelenítés sorrendje) és az enumok fordításai |
| `fish/<kategória>.json` | Halak, kategóriánként egy fájl |
| `corals/*.json` | Korallok és makroalgák |
| `invertebrates/*.json` | Gerinctelenek |
| `diseases/diseases.json` | Betegségek és kártevők |

## Közös mezők (élőlények)

| Mező | Típus | Leírás |
| --- | --- | --- |
| `id` | szöveg | Egyedi azonosító, kisbetűs `nemzetség-faj` (pl. `amphiprion-ocellaris`); nemzetségnél `nemzetség-spp` |
| `group` | enum | `fish`, `coral`, `invertebrate` |
| `category` | szöveg | Kategória a `taxonomy.json` `categories` blokkjából |
| `scientific_name` | szöveg | Elfogadott tudományos név (WoRMS szerint) |
| `name_en`, `name_hu` | szöveg | Angol és magyar név; magyar név hiányában az angol jelenik meg |
| `difficulty` | enum | `easy`, `moderate`, `difficult`, `expert` |
| `diseases` | lista | A `diseases.json` azonosítói: a fajnál előforduló, a hasonló halakra általában jellemző betegségek (nem jelent külön hajlamot) |
| `disease_risk` | lista | Csak ott, ahol a faj az átlagosnál fogékonyabb: `{ "id", "level", "reason" }`. `id` a `diseases.json` azonosítója (a `diseases` listában is szerepel), `level` a `taxonomy.json` `enums.disease_risk` kulcsa: `elevated` (hajlamosabb, pl. minden doktorhal az ich-re a vékony nyálkaréteg miatt), `high` (kiemelten érzékeny, pl. az „ich-mágnes” doktorhalak); `reason` kétnyelvű indoklás |
| `sources` | lista | `{ "name", "url" }` források |
| `image` | objektum | `url`, `source_page`, `author`, `license` – csak CC BY, CC BY-SA, CC0 vagy public domain |
| `image_juvenile` | objektum | Mint az `image`, a fiatal példányról; csak ott, ahol a fiatal kinézete jelentősen eltér a felnőttétől |
| `feeding`, `origin`, `notes` | szöveg (hu/en) | Táplálkozás, származás, fontos tudnivalók |

## Halak és gerinctelenek

| Mező | Típus | Leírás |
| --- | --- | --- |
| `size_cm` | `{min, max}` | Felnőttkori méret cm-ben |
| `lifespan_wild_years`, `lifespan_captivity_years` | `{min, max}` | Élettartam években |
| `tank_min_l`, `tank_ideal_l` | szám | Legkisebb és ideális akváriumméret literben (nettó víztérfogat) |
| `utility` | enum-lista | Szerepe az akváriumban (`algae-eater`, `sand-sifter` …) |
| `reef_safety` | enum | Csak a korallokra és a gerinctelenekre jelentett veszély: `reef-safe` (nem bántja őket), `with-caution` (egyes példányok csipegetik a korallokat, vagy bizonyos gerincteleneket megesznek), `not-reef-safe` (rendszeresen korallt eszik, vagy a gerinctelen lakók nagy részét elpusztítja). A más halakkal szembeni viselkedés **nem** számít bele: az a `compat.temperament`, a `max_same` és a `rivals` mezőben van. A makroalgák fogyasztása sem számít bele. |
| `compat` | objektum | Együtt tarthatóság, lásd lent |
| `behavior` | szöveg (hu/en) | Viselkedés |

## Korallok

| Mező | Típus | Leírás |
| --- | --- | --- |
| `type` | szöveg (hu/en) | Növekedési forma |
| `light`, `flow`, `growth` | enum | Fényigény, áramlás, növekedés |
| `placement`, `aggression` | szöveg (hu/en) | Elhelyezés, csalánzás / agresszió |
| `compat` | objektum | Együtt tarthatóság, lásd lent |

## `compat` – együtt tarthatóság

Ebből számolja az oldal, hogy egy faj illik-e a felhasználó akváriumához (méret, fajta, életkor és a meglévő
lakók alapján). A szabálymotor a `shared/compat.js`. Korallos tanknál a `compat` korallokra vonatkozó
`eats` / `may_eat` értékei döntenek; a `reef_safety` csak akkor számít, ha a fajnak nincs `compat` mezője.
A tankméretnél a `tank_min_l` alatt legfeljebb 20%-kal csak figyelmeztetés, ennél kisebb tank nem ajánlott;
`tank_min_l` és `tank_ideal_l` között a faj ajánlott, megjegyzéssel. Minden mező opcionális: ami nem igaz az adott fajra,
az maradjon ki (ne `false`, ne üres lista). A szöveges viselkedésleírás (`behavior`) és a `compat` ne
mondjon ellent egymásnak.

| Mező | Típus | Jelentés | Hatás a becslésre |
| --- | --- | --- | --- |
| `temperament` | enum | `peaceful`, `semi-aggressive`, `aggressive` – a más fajú halakkal szembeni viselkedés. A csak fajtársak vagy közeli rokonok elleni agresszió (pl. doktorhalak egymás közt) nem ide tartozik, hanem a `max_same` és a `rivals` mezőbe | Agresszív + félénk: nem ajánlott; agresszív + békés vagy félénk + mérsékelten agresszív: óvatosan |
| `shy` | `true` | Félénk vagy lassú evő, a gyors, rámenős társak mellett éhezik | Lásd `temperament` |
| `eats` | prey-lista | Biztosan megeszi vagy tönkreteszi | A tankban lévő ilyen lakóval: nem ajánlott; korall-prey (`sps`, `lps`, `soft-corals`, `zoanthids`) esetén korallos tankba sem ajánlott |
| `may_eat` | prey-lista | Egyes példányok megeszik, csipegetik | Óvatosan; korall-prey esetén korallos tankban is |
| `avoid` | prey-lista | Ezek ártanak neki (pl. a csikóhalnak az anemóna csalánzása) | Óvatosan |
| `max_same` | egész | Ugyanebből a fajból legfeljebb ennyi lehet egy tankban (`1` = egyedül, `2` = pár) | Túllépve: nem ajánlott |
| `rivals` | lista | `{ "key": "zebrasoma", "ok_from_l": 800 }`: más fajok, amelyeknek ugyanilyen `key`-ük van, rivális fajok; `ok_from_l` liter felett megférnek, `null` = sosem | Kisebb tankban vagy `null` esetén: nem ajánlott |
| `group_min` | egész | Csoportban tartandó, legalább ennyi példány | Tanácsként jelenik meg |
| `min_age_months` | egész | Ennyi hónapos, beállt akvárium kell neki | Fiatalabb tankban: óvatosan, a fele alatt nem ajánlott |
| `jumper` | `true` | Jellemzően kiugrik, fedő vagy háló kell (pl. ajakoshalak, tűzgébek, őrgébek) – csak ott, ahol ez tényleg tipikus | Tanácsként jelenik meg |
| `neighbours` | enum | `sting` (csalánoz), `chemical` (vegyi hadviselés), `spreads` (terjed) – korallokra, anemónákra | Más korallok mellett: óvatosan |
| `wanders` | `true` | Helyét változtatja (anemónák) | Korallok mellett: óvatosan |
| `partners` | id-lista | Fajok, amelyekkel természetes szimbiózisban él (pl. bohóchal és gazdaanemóna) | Pozitív megjegyzésként jelenik meg |

### Prey-csoportok (`eats`, `may_eat`, `avoid`)

A lehetséges értékek a `taxonomy.json` `enums.prey` blokkjában vannak; mindegyik megmondja, mely kategóriák
tartoznak hozzá (`categories`). Új kategória felvételekor a megfelelő prey-csoporthoz is hozzá kell adni.

| Érték | Kire vonatkozik |
| --- | --- |
| `small-fish` | Halak, amelyek legfeljebb fele akkorák (felnőtt méret alapján), mint az adott faj; 70%-ig óvatosan |
| `shrimps`, `crabs`, `snails`, `starfish`, `urchins`, `bivalves`, `worms`, `sea-cucumbers` | A megfelelő gerinctelen kategóriák |
| `sps`, `lps`, `soft-corals`, `zoanthids` | Korallcsoportok (`lps` = minden `lps-*` és `nps`; `soft-corals` = lágy- és gombakorallok) |
| `anemones`, `macroalgae` | Anemónák, makroalgák |

### Kitöltési útmutató

- Ha a fajnak nincs külön ismert jellemzője, a kategória szokásos értékei érvényesek. Egy kategórián belül
  az eltéréseket fajonként kell jelölni (pl. a törpesügér `Centropyge` nem nagy sügér, a `Meiacanthus`
  nyálkáshal békés).
- `eats` csak az legyen, amit a faj a legtöbb akváriumban rendszeresen megtesz. Ami példányfüggő, az
  `may_eat`.
- `rivals.key` egy szabadon választott, kisbetűs csoportnév. Ugyanazt a kulcsot kell használni minden
  fajnál, amelyek rivalizálnak (pl. minden `Zebrasoma` → `zebrasoma`, minden doktorhal → `tang`).
- `min_age_months` csak akkor kell, ha a faj kifejezetten érett akváriumot igényel (pl. podokból élő
  mandarinhalak 12, a legtöbb SPS 6–12).
- A `partners` mindkét félnél szerepelhet, de elég az egyiknél.

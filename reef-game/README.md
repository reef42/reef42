# Reef game

A virtual saltwater aquarium where new reef keepers can practise: set up a tank, cycle it, stock it, feed, measure and
react to water quality and events. It is not meant to be 100% accurate; the goal is to show how a reef tank works as a whole.
Static, serverless, bilingual (Hungarian / English); the game is saved in the browser, with JSON import and export.

## Game design

**Start.** One game is saved at a time. A new game chooses:

- **Mode:** free play, or tutorial mode (the missions; the first one starts with a ready-made starter pack).
- **Time:** turn-based (*Next day* button), accelerated (pause / 1× = 1 minute per day / 5× / 20× / 50×) or real time (time also passes
  while the page is closed and is caught up on return).
- **Difficulty:** *easy* – an advisor warns and explains; *hard* – only the symptoms are shown. On both, animals can die.

**Death.** Dead animals go to the **Great Aquarium in the Sky**: a memorial gallery with their name, lifespan in the game and
cause of death, linked to their species card and to Fishy Doctor.

**Economy.** A starting budget in a game currency (🐚 shells). Tanks (60 / 120 / 250 / 500 L), equipment, salt, additives,
test kits and livestock have prices. A small tank is cheap but unstable. Equipment can be sold for half its price, the tank too while nobody lives in it.

**Shop** (2–4 unbranded products per kind, with estimated performance). A category sidebar (chips on phones) and a grid of
products with small pictures (drawn icons; species photos from the species database, with credits):

- Starter packs: the listed items at 10% off (`packs` in `data/equipment.json`); equipment the player already owns is left
  out and not charged. After buying, a step-by-step dialog shows what was in the pack and what each item is for.
- Equipment: tanks; filtration (protein skimmer by size, filter sock, refugium, UV); rock; lighting (LED in 4 strengths);
  flow (pumps, wavemaker); heating and cooling (heater, fan, chiller); automation (ATO, dosing pump, auto feeder, controller
  with alarms); quarantine tank, refractometer, lid.
- Supplies: salt and food, test kits (limited uses), additives and treatments.
- Livestock: fish, corals, invertebrates, with search.

Every category and product has its own address (`#/shop/<category>/<id>`; livestock filters `c:<category>`,
`u:<utility>`, `k:<class>`), so mission steps and advisor tips link straight to what they talk about.

**Simulation** (daily steps, several sub-steps per day):

- Water: nitrogen cycle with growing bacteria, phosphate, evaporation and salinity, temperature, pH, oxygen.
- Corals: KH, Ca and Mg used up as corals grow; dosing; light, flow and stability drive coral health.
- Algae: diatoms, cyano and hair algae from nutrients, photoperiod and tank age; the clean-up crew keeps them down.
- Disease: ich / velvet brought in by fish that skipped quarantine; treatment in quarantine; copper in the display kills invertebrates.
- Every animal has health and stress, hurt by parameters outside its range, hunger, a tank that is too small, fighting and disease.
- Measuring: the player only sees what a test kit measured (with a small error); the rest shows as symptoms
  (gasping fish, colour loss, cloudy water).
- Species: all species of the species database (`databases/reef42_species.json`), game values (bioload, sensitivity, price)
  estimated from their fields, with per-species overrides in `data/species-overrides.json`. Species Reef42 does not recommend
  can be bought, with a warning.

**Cycle tracker:** while the tank is filled but has no residents, a card leads through a fishless cycle in six stages
(ammonia source → measurable ammonia → nitrite → both zero → a dose gone within a day → a big water change). The stages are
read from the player's own measurements, and the card always shows today's task with buttons and small charts of NH3, NO2
and NO3. Ghost feeding works too, more slowly.

**Residents:** a list with photos and the player's own names; clicking an animal (in the list or in the tank) opens its
profile with the species card data, its current symptoms and a rename field. Knowledge per species is kept across games
(`reef42-reefgame-know`): a point for every week the species lives with you (max 4) and 2 for a passed 3-question quiz
built from the species card (max 2 quizzes, one try per species per game day). Level 1 shows how well fed it is, level 2
what bothers it, level 3 its exact condition.

**Random events:** equipment failure (stuck heater, pump stop, power cut), environment (summer heat, holiday), animals
(fighting, jumping fish, coral stinging), pests (aiptasia, pyramid snails).

**Missions:** 1. First tank (cycling) · 2. First fish · 3. First corals · 4. Trouble (ich, algae bloom, aiptasia, heater failure).

**Missions** can be played one after another in the same game: when one is done, the game asks whether to go on with the next one in the same tank or to play freely. Trouble missions then cause their trouble in the current tank (`continue` in `data/missions.json`: what is needed, an ich infection, nutrients and algae, aiptasia, a heatwave scaled to the season). A death restarts the "keep it for N days" count.

**Help:** an explanation of the nitrogen cycle and a short highlighted tour on the first game (again from the menu), a
confirmation before skipping 7 days when fish have no auto feeder, a weekly water change reminder (with a calendar file for
real life), an offer of an ATO after repeated manual top-offs, a hint to measure stable values less often, a pop-up of
recommended beginner species where a step asks for animals, and a "What is it?" link from every test to the Tank Log guide.

**Look:** a game bar that always stays on top (day, money, tank size, temperature, time controls, menu with save, load,
restart and exit) and an animated 2D (SVG) tank: swimming fish, corals, visible algae and cloudy water, a thermometer on the
glass (the value itself is shown in the game bar), sinking food that the fish chase and the critters crawl to (leftovers stay on the sand until they rot), drifting particles and swaying corals
when pumps run, snails, crabs and shrimps that wander around, and a short night when the day changes. The Great Aquarium in the Sky is a
bright, happy tank among clouds where the departed float with halos.

**Views:** *simple* (the default on easy) shows one "what's next" card with the current mission step or advisor tip and
buttons that take you there, plus large quick-care buttons; *full* (the default on hard) shows every panel. Both only offer
what the player owns: tests in stock, supplements in stock, the sock change only with a sock.

## Files

| File | Content |
| --- | --- |
| `assets/sim.js` | The simulation, independent of the page (also runs in Node for tests) |
| `assets/app.js` | Page, drawing, saving |
| `data/equipment.json` | Shop: tanks, equipment, consumables, with prices and performance |
| `data/missions.json` | Missions: goals and starting conditions |
| `data/species-overrides.json` | Per-species game values that override the estimates |

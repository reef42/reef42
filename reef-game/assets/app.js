// Reef game page: start screen, tank view (SVG scene + dashboard), shop, log, memorial, saving. The rules live in sim.js.
(() => {
  'use strict';

  const Sim = window.ReefSim;
  const SAVE_KEY = 'reef42-reefgame-v1';
  const LANG_KEY = 'reef42-lang';
  const DATA = { species: '../databases/reef42_species.json', equipment: 'data/equipment.json', missions: 'data/missions.json', overrides: 'data/species-overrides.json' };
  const FD = { ich: 'marine-ich', velvet: 'marine-velvet' };
  const PARAMS = ['nh3', 'no2', 'no3', 'po4', 'ph', 'kh', 'ca', 'mg', 'cu', 'sal'];
  const UNIT = { nh3: 'ppm', no2: 'ppm', no3: 'ppm', po4: 'ppm', ph: '', kh: 'dKH', ca: 'ppm', mg: 'ppm', cu: 'ppm', sal: 'ppt' };
  const PNAME = { nh3: 'NH3', no2: 'NO2', no3: 'NO3', po4: 'PO4', ph: 'pH', kh: 'KH', ca: 'Ca', mg: 'Mg', cu: 'Cu' };
  // Shop sidebar: [category, group]; equipment categories list their kinds.
  const SHOP_CATS = [['packs', 'start'], ['tanks', 'gear'], ['filtration', 'gear'], ['rock', 'gear'], ['light', 'gear'], ['flow', 'gear'], ['heating', 'gear'], ['auto', 'gear'], ['other', 'gear'],
    ['basics', 'cons'], ['tests', 'cons'], ['additives', 'cons'], ['fish', 'live'], ['coral', 'live'], ['invertebrate', 'live']];
  const EQ_GROUPS = { filtration: ['skimmer', 'sock', 'refugium', 'uv'], rock: ['rock'], light: ['light'], flow: ['pump'], heating: ['heater', 'fan', 'chiller'], auto: ['ato', 'doser', 'feeder', 'controller'], other: ['qt', 'refractometer', 'lid'] };
  const KIND_CAT = {};
  Object.keys(EQ_GROUPS).forEach((c) => EQ_GROUPS[c].forEach((k) => { KIND_CAT[k] = c; }));
  const LIVE = ['fish', 'coral', 'invertebrate'];
  const consCat = (c) => (['salt', 'food', 'coralfood'].includes(c.item) ? 'basics' : c.item.startsWith('test:') ? 'tests' : 'additives');

  // [hu, en]
  const T = {
    app: ['Reef game', 'Reef game'], tank: ['Akvárium', 'Tank'], shop: ['Bolt', 'Shop'], log: ['Napló', 'Log'], sky: ['Égi akvárium', 'Sky aquarium'], game: ['Játék', 'Game'],
    lead: ['Virtuális tengeri akvárium kezdőknek: állítsd be, ciklizáld, népesítsd be, és tartsd életben a lakóit – közben megtanulod, hogyan működik egy zátonyakvárium.', 'A virtual saltwater tank for beginners: set it up, cycle it, stock it and keep its residents alive – and learn how a reef tank works along the way.'],
    newGame: ['Új játék', 'New game'], mode: ['Játékmód', 'Mode'], free: ['Szabad játék', 'Free play'], freeText: ['2500 🐚 induló kerettel, heti 100 🐚 zsebpénzzel, üres szobából indulsz.', 'Start from an empty room with 2500 🐚 and 100 🐚 pocket money a week.'],
    missions: ['Küldetések', 'Missions'], time: ['Időkezelés', 'Time'],
    'time.turn': ['Körökre osztott', 'Turn-based'], 'time.turnText': ['Te léptetsz napot. Nyugodt tempó.', 'You advance the days. A calm pace.'],
    'time.fast': ['Gyorsított', 'Accelerated'], 'time.fastText': ['1 perc = 1 nap, megállítható, 5× gyorsítás.', '1 minute = 1 day, can be paused, 5× speed.'],
    'time.real': ['Valós idő', 'Real time'], 'time.realText': ['1 nap = 1 nap, akkor is telik, ha az oldal zárva van. Csak bátraknak.', '1 day = 1 day, time passes even while the page is closed. For the brave.'],
    difficulty: ['Nehézség', 'Difficulty'], 'diff.easy': ['Könnyű', 'Easy'], 'diff.easyText': ['Tanácsadó figyelmeztet, látod az élőlények állapotát.', 'An advisor warns you, and you see how the animals are doing.'],
    'diff.hard': ['Nehéz', 'Hard'], 'diff.hardText': ['Csak azt látod, amit egy valódi akvarista: tüneteket.', 'You only see what a real aquarist sees: symptoms.'],
    start: ['Indulás', 'Start'], importSave: ['Mentés betöltése…', 'Load a save…'], exportSave: ['Mentés letöltése (JSON)', 'Download save (JSON)'],
    confirmNew: ['Új játékot indítasz? A mostani akvárium elvész (előtte letöltheted a mentést).', 'Start a new game? The current tank will be lost (you can download the save first).'],
    badSave: ['Ez nem érvényes Reef game mentés.', 'This is not a valid Reef game save.'], loaded: ['Mentés betöltve.', 'Save loaded.'],
    storageFail: ['A böngésző nem enged menteni – a játék a lap bezárásakor elveszik. Töltsd le a mentést!', 'The browser does not allow saving – the game is lost when the page closes. Download the save!'],
    day: ['{n}. nap', 'Day {n}'], money: ['Pénz', 'Money'], nextDay: ['Következő nap →', 'Next day →'], week: ['+7 nap', '+7 days'], pause: ['Szünet', 'Pause'], play: ['Indítás', 'Play'],
    realNote: ['Valós idő', 'Real time'], thermo: ['Hőmérő', 'Thermometer'],
    noTank: ['Még nincs akváriumod. Vegyél egyet a boltban.', "You don't have a tank yet. Buy one in the shop."], toShop: ['Irány a bolt →', 'Go to the shop →'],
    empty: ['Üres akvárium – keverj sós vizet és töltsd fel.', 'Empty tank – mix saltwater and fill it.'], fill: ['Feltöltés sós vízzel', 'Fill with saltwater'],
    actions: ['Teendők', 'Care'], feed: ['Etetés', 'Feed'], 'feed.small': ['Kevés', 'Little'], 'feed.normal': ['Normál', 'Normal'], 'feed.large': ['Sok', 'A lot'],
    coralFeed: ['Korallok etetése', 'Feed corals'], measure: ['Mérés', 'Measure'], display: ['Fő akvárium', 'Display'], qt: ['Karantén', 'Quarantine'],
    waterChange: ['Vízcsere', 'Water change'], topOff: ['Párolgás pótlása édesvízzel', 'Top off with fresh water'], dose: ['Adagolás', 'Dose'], ml: ['ml', 'ml'],
    use: ['Használat', 'Use'], sockChange: ['Szűrőzokni csere', 'Change filter sock'], doIt: ['Mehet', 'Go'],
    'item.bacteria': ['Élő baktérium', 'Bottled bacteria'], 'item.ammonia': ['Ammónia-forrás', 'Ammonia source'], 'item.carbon': ['Új aktív szén', 'Fresh carbon'], 'item.gfo': ['Új foszfátmegkötő', 'Fresh phosphate remover'],
    'item.copper': ['Réz gyógyszer', 'Copper medication'], 'item.aiptasiax': ['Aiptasia-irtó', 'Aiptasia killer'], 'item.dip': ['Korallfürdető', 'Coral dip'],
    'add.kh': ['KH-pótló', 'KH supplement'], 'add.ca': ['Ca-pótló', 'Ca supplement'], 'add.mg': ['Mg-pótló', 'Mg supplement'],
    stock: ['Készlet', 'Stock'], measurements: ['Utolsó mérések', 'Last measurements'], never: ['még nem mérted', 'not measured yet'], ago: ['{n} napja', '{n} days ago'], today: ['ma', 'today'],
    animals: ['Lakók', 'Residents'], noAnimals: ['Még nincs lakó.', 'No residents yet.'], health: ['Állapot', 'Condition'], looksFine: ['Jól néz ki.', 'Looks fine.'],
    hungry: ['Éhes', 'Hungry'], toQt: ['Karanténba', 'To quarantine'], allToQt: ['Minden hal karanténba', 'All fish to quarantine'], allToDisplay: ['Minden hal vissza a fő akváriumba', 'All fish back to the display'], toDisplay: ['Vissza a fő akváriumba', 'Back to the display'], rehome: ['Elajándékozás', 'Give away'],
    confirmRehome: ['Elajándékozod: {name}?', 'Give away {name}?'], dipIt: ['Fürdetés', 'Dip'],
    equipment: ['Felszerelés', 'Equipment'], noEq: ['Nincs felszerelés.', 'No equipment.'], 'st.broken': ['nem működik', 'not working'], repair: ['Javítás ({n} 🐚)', 'Repair ({n} 🐚)'], check: ['Ellenőrzés', 'Check'],
    nothingWrong: ['Nem találtál hibát.', 'You found nothing wrong.'], rock: ['Kő: {n} kg', 'Rock: {n} kg'], media: ['Szűrőközeg', 'Media'],
    carbonLeft: ['Aktív szén: {n} nap', 'Carbon: {n} days'], gfoLeft: ['Foszfátmegkötő: {n} nap', 'Phosphate remover: {n} days'], sockAge: ['Szűrőzokni: {n} napos', 'Filter sock: {n} days old'],
    settings: ['Beállítások', 'Settings'], heaterSet: ['Fűtő beállítása (°C)', 'Heater setting (°C)'], lightHours: ['Világítás (óra/nap)', 'Light (hours/day)'], doser: ['Adagolópumpa (ml/nap)', 'Dosing pump (ml/day)'], save: ['Mentés', 'Save'],
    advisor: ['Tanácsadó', 'Advisor'], allGood: ['Most nincs teendő – figyeld a vizet, és mérj rendszeresen.', 'Nothing urgent – keep an eye on the water and measure regularly.'],
    mission: ['Küldetés', 'Mission'], step: ['{n}/{m}. lépés', 'Step {n}/{m}'], missionDone: ['Küldetés teljesítve! Szabadon folytathatod ezzel az akváriummal.', 'Mission complete! You can carry on freely with this tank.'],
    holidayTitle: ['Szabadság', 'Holiday'], holidayText: ['Egy hétre elutazol. Ki eteti a halakat?', "You're away for a week. Who feeds the fish?"],
    'hol.feeder': ['Etetőautomata', 'Auto feeder'], 'hol.neighbor': ['A szomszéd (40 🐚)', 'The neighbour (40 🐚)'], 'hol.none': ['Senki – kibírják', 'Nobody – they will manage'], back: ['Hazaértél. Nézd meg, mi történt!', "You're back. See what happened!"],
    deaths: ['Elpusztult', 'Died'], toSky: ['Az égi nagy akváriumba került →', 'Went to the great aquarium in the sky →'],
    skyLead: ['Ide kerül mindenki, aki az akváriumodban elpusztult. Tanulj belőle – mindegyiknél ott a halál oka.', 'Everyone who died in your tank ends up here. Learn from it – each has its cause of death.'],
    skyEmpty: ['Még üres – és reméljük, az is marad.', "Still empty – let's hope it stays that way."], lived: ['{a}–{b}. nap', 'day {a}–{b}'], speciesCard: ['fajlap', 'species card'], fishyDoctor: ['Fishy Doctor', 'Fishy Doctor'],
    'shop.tanks': ['Akváriumok', 'Tanks'], 'shop.filtration': ['Szűrés', 'Filtration'], 'shop.auto': ['Automatika', 'Automation'], 'shop.other': ['Karantén és eszközök', 'Quarantine and tools'],
    'shop.basics': ['Só és táp', 'Salt and food'], 'shop.tests': ['Tesztek', 'Tests'], 'shop.additives': ['Adalékok és szerek', 'Additives and treatments'],
    fish: ['Halak', 'Fish'], coral: ['Korallok', 'Corals'], invertebrate: ['Gerinctelenek', 'Inverts'], buy: ['Vétel', 'Buy'], owned: ['megvan', 'owned'], have: ['Készleten: {n}', 'In stock: {n}'],
    search: ['Keresés…', 'Search…'], minTank: ['min. {n} l', 'min. {n} L'], tooSmall: ['Túl kicsi neked az akvárium', 'Your tank is too small for it'], notRec: ['Reef42: nem ajánlott', 'Reef42: not recommended'],
    notReef: ['Nem reef safe', 'Not reef safe'], caution: ['Csak óvatosan', 'With caution'], place: ['Hely', 'Placement'], 'place.top': ['fent', 'top'], 'place.middle': ['középen', 'middle'], 'place.bottom': ['lent', 'bottom'],
    to: ['Ide', 'Into'], 'diff.moderate': ['Közepes', 'Moderate'], 'diff.difficult': ['Nehéz', 'Difficult'], 'diff.expert': ['Szakértői', 'Expert'],
    chart: ['Mérések grafikonon', 'Measurements chart'], events: ['Események', 'Events'], noEvents: ['Még nem történt semmi.', 'Nothing has happened yet.'], noMeas: ['Ebből még nincs mérésed.', 'No measurements of this yet.'],
    summary: ['{mode} · {time} · {diff} · {n}. nap', '{mode} · {time} · {diff} · day {n}'], loadError: ['Nem sikerült betölteni a játék adatait.', 'Could not load the game data.'],
    feedback: ['javítás, ötlet:', 'corrections and ideas:'], footer: ['A játék egyszerűsít: nem 100%-os pontosságú, a cél, hogy lásd, hogyan működik egy akvárium.', 'The game simplifies: it is not 100% accurate; the goal is to show how a tank works.'],
    // results of actions
    'ok.bought': ['Megvetted.', 'Bought.'], 'ok.filled': ['Feltöltve 35 ppt sótartalmú vízzel.', 'Filled with 35 ppt saltwater.'], 'ok.filledGuess': ['Feltöltve – refraktométer nélkül csak tippelted a sót.', 'Filled – without a refractometer you guessed the salt.'],
    'ok.added': ['Bekerült az akváriumba.', 'In the tank.'], 'ok.addedQt': ['Bekerült a karanténba.', 'In quarantine.'], 'ok.dipped': ['Behelyezés előtt megfürdetted.', 'Dipped before it went in.'],
    'ok.fed': ['Etetve.', 'Fed.'], 'ok.leftover': ['Etetve – sok étel lesüllyedt, és ott rohad.', 'Fed – a lot of food sank and is rotting.'], 'ok.coralFed': ['A korallok kaptak enni.', 'The corals were fed.'],
    'ok.changed': ['{l} liter víz kicserélve.', '{l} L of water changed.'], 'ok.toppedOff': ['{l} liter édesvíz pótolva.', '{l} L of fresh water added.'], 'ok.dosed': ['Beadagolva.', 'Dosed.'], 'ok.used': ['Kész.', 'Done.'],
    'ok.sockChanged': ['Tiszta zokni.', 'Clean sock.'], 'ok.moved': ['Áttéve.', 'Moved.'], 'ok.rehomed': ['Új gazdihoz került.', 'Went to a new home.'], 'ok.repaired': ['Megjavítva ({cost} 🐚).', 'Repaired ({cost} 🐚).'],
    'err.money': ['Nincs rá elég pénzed.', "You can't afford it."], 'err.have': ['Ebből már van.', 'You already have one.'], 'err.haveTank': ['Már van akváriumod.', 'You already have a tank.'],
    'err.noTank': ['Előbb akvárium kell.', 'You need a tank first.'], 'err.filled': ['Már fel van töltve.', 'Already filled.'], 'err.salt': ['Nincs elég sód: {g} g kell.', 'Not enough salt: {g} g needed.'],
    'err.noWater': ['Előbb töltsd fel az akváriumot.', 'Fill the tank first.'], 'err.noQt': ['Ehhez karanténakvárium kell (és csak halat tehetsz bele).', 'This needs a quarantine tank (and only fish go in).'],
    'err.noFood': ['Elfogyott a haltáp.', 'Out of fish food.'], 'err.noCoralFood': ['Nincs korallkaja.', 'No coral food.'], 'err.noTest': ['Nincs ilyen teszted.', "You don't have this test."],
    'err.noRefracto': ['Sótartalom méréséhez refraktométer kell.', 'Measuring salinity needs a refractometer.'], 'err.full': ['Tele van.', "It's full."], 'err.noStock': ['Nincs belőle készleten.', 'None in stock.'],
    'err.noSock': ['Nincs szűrőzoknid.', "You don't have a filter sock."], 'err.unknown': ['Ez most nem megy.', "That doesn't work now."], 'err.same': ['Már ott van.', "It's already there."], 'err.noFeeder': ['Nincs működő etetőautomatád.', "You don't have a working auto feeder."],
    'warn.qtCopper': ['Réz a fő akváriumba? Megöli a gerincteleneket és a korallokat!', 'Copper in the display? It kills invertebrates and corals!'], confirmCopper: ['Biztosan a fő akváriumba adagolod a rezet?', 'Really dose copper into the display?'],
    'warn.notRec': ['A Reef42 ezt a fajt nem ajánlja. Biztosan megveszed?', 'Reef42 does not recommend this species. Buy it anyway?'],
    'warn.small': ['Ennek a fajnak legalább {n} literes akvárium kell. Biztosan megveszed?', 'This species needs at least {n} L. Buy it anyway?'],
    // log
    'log.income': ['Zsebpénz: +{n} 🐚', 'Pocket money: +{n} 🐚'], 'log.death': ['Elpusztult: {name}.', 'Died: {name}.'], 'log.nipped': ['{by} megcsipkedte: {name}.', '{by} nipped {name}.'],
    'log.stung': ['{by} megcsalánozta: {name}.', '{by} stung {name}.'], 'log.power': ['Áramszünet ({h} óra) – minden leállt.', 'Power cut ({h} hours) – everything stopped.'],
    'log.heaterCut': ['Riasztás: a kontroller lekapcsolta a beragadt fűtőt.', 'Alarm: the controller switched off a stuck heater.'], 'log.heaterStuck': ['A fűtő beragadt, és folyamatosan fűt.', 'The heater is stuck on and keeps heating.'],
    'log.pumpFail': ['Leállt egy áramláspumpa.', 'A flow pump stopped.'], 'log.atoCut': ['Riasztás: a kontroller leállította a túltöltő ATO-t.', 'Alarm: the controller stopped an overfilling ATO.'],
    'log.atoStuck': ['Az utántöltő beragadt, és túltölt – csökken a sótartalom.', 'The top-off is stuck and overfills – salinity is dropping.'], 'log.heatwave': ['Hőhullám: {days} napig nagy meleg lesz.', 'Heatwave: hot weather for {days} days.'],
    'log.holiday': ['Szabadságra mész.', "You're going on holiday."], 'log.bought': ['Vásárlás: {name}', 'Bought: {name}'], 'log.added': ['Új lakó: {name}', 'New resident: {name}'],
    'log.stepDone': ['Küldetés: {n}. lépés kész.', 'Mission: step {n} done.'], 'log.missionDone': ['Küldetés teljesítve!', 'Mission complete!'],
    // symptoms
    'sym.nh3': ['bágyadt, gyorsan lélegzik, a polipok zárva', 'lethargic, breathing fast, polyps closed'], 'sym.no2': ['nyugtalan, bágyadt', 'restless, lethargic'],
    'sym.no3': ['fakuló színek, lassú növekedés', 'fading colours, slow growth'], 'sym.no3Low': ['kifakult, „éhező” színek', 'pale, "starving" colours'],
    'sym.po4': ['barnul, alig nő', 'browning, barely growing'], 'sym.po4Low': ['kifakult színek', 'pale colours'],
    'sym.tempHigh': ['szapora légzés, kifehéredés', 'fast breathing, bleaching'], 'sym.tempLow': ['lassú, étvágytalan', 'sluggish, off its food'],
    'sym.sal': ['nyugtalan, zárt polipok', 'restless, polyps closed'], 'sym.ph': ['bágyadt, színvesztés', 'lethargic, losing colour'], 'sym.o2': ['a felszínen kapkod levegőért', 'gasping at the surface'],
    'sym.cu': ['elernyedt, alig mozdul', 'limp, barely moving'], 'sym.hunger': ['beesett has, mindenre rácsap', 'pinched belly, snaps at everything'],
    'sym.kh': ['fehér, nem növő ágvégek, zárt polipok', 'white, non-growing tips, polyps closed'], 'sym.ca': ['lassú növekedés', 'slow growth'], 'sym.mg': ['lassú növekedés', 'slow growth'],
    'sym.khSwing': ['hirtelen színvesztés', 'sudden colour loss'], 'sym.lightLow': ['barnul, a fény felé nyúlik', 'browning, stretching towards the light'], 'sym.lightHigh': ['kifehéredik', 'bleaching'],
    'sym.flowLow': ['törmelék ül rajta, nyálkás', 'debris settles on it, slimy'], 'sym.flowHigh': ['zárt polipok, visszahúzódó szövet', 'polyps closed, tissue receding'],
    'sym.smother': ['algák nőnek rá', 'algae growing over it'], 'sym.aiptasia': ['csalánzásnyomok a szöveten', 'sting marks on the tissue'], 'sym.zoaPest': ['zárt polipok, apró kártevők rajta', 'polyps closed, tiny pests on it'],
    'sym.pyramid': ['nem nyílik ki teljesen', "doesn't fully open"], 'sym.ich': ['fehér, sószemcse-szerű pöttyök', 'white, salt-grain spots'], 'sym.velvet': ['porszerű bevonat, szapora légzés', 'dusty coating, fast breathing'],
    'sym.fight': ['tépett úszók, bujkál', 'torn fins, hiding'], 'sym.small': ['fel-alá úszkál az üveg mentén', 'pacing up and down the glass'], 'sym.nipped': ['sérült szövet', 'damaged tissue'], 'sym.stung': ['sérült szövet', 'damaged tissue'],
    'sym.org': ['sárgás víz, kevesebb fény', 'yellowish water, less light'],
    // causes of death
    'cause.nh3': ['Ammóniamérgezés. A baktériumok nem győzték lebontani az ürüléket és az ételmaradékot – új akvárium, túl sok hal egyszerre vagy túletetés.', 'Ammonia poisoning. The bacteria could not keep up with waste and leftover food – a new tank, too many fish at once or overfeeding.'],
    'cause.no2': ['Nitritmérgezés – a ciklus még nem ért véget.', 'Nitrite poisoning – the cycle had not finished.'], 'cause.no3': ['Tartósan rossz nitrátszint.', 'Nitrate out of range for too long.'],
    'cause.po4': ['Tartósan rossz foszfátszint.', 'Phosphate out of range for too long.'], 'cause.temp': ['Rossz hőmérséklet – túl meleg vagy túl hideg víz.', 'Wrong temperature – the water was too warm or too cold.'],
    'cause.sal': ['Rossz sótartalom – pótold a párolgást édesvízzel, és mérj refraktométerrel.', 'Wrong salinity – top off evaporation with fresh water and measure with a refractometer.'],
    'cause.ph': ['Rossz pH.', 'Wrong pH.'], 'cause.o2': ['Oxigénhiány – kevés áramlás, áramszünet vagy túl sok hal.', 'Lack of oxygen – too little flow, a power cut or too many fish.'],
    'cause.cu': ['Rézmérgezés.', 'Copper poisoning.'], 'cause.hunger': ['Éhezés.', 'Starvation.'], 'cause.kh': ['Rossz KH – a korallok elfogyasztották, és nem pótoltad.', 'Wrong KH – the corals used it up and it was not replaced.'],
    'cause.ca': ['Rossz kalciumszint.', 'Wrong calcium level.'], 'cause.mg': ['Rossz magnéziumszint.', 'Wrong magnesium level.'], 'cause.khSwing': ['Ingadozó KH.', 'Swinging KH.'],
    'cause.lightLow': ['Kevés fény.', 'Too little light.'], 'cause.lightHigh': ['Túl erős fény.', 'Too much light.'], 'cause.flowLow': ['Kevés áramlás.', 'Too little flow.'], 'cause.flowHigh': ['Túl erős áramlás.', 'Too much flow.'],
    'cause.smother': ['Az alga benőtte.', 'Smothered by algae.'], 'cause.aiptasia': ['Az aiptasiák csalánzása.', 'Stung by aiptasia.'], 'cause.zoaPest': ['Zoa-kártevők.', 'Zoa pests.'], 'cause.pyramid': ['Piramiscsigák.', 'Pyramid snails.'],
    'cause.ich': ['Ich (fehérpötty-betegség). Karanténban, rézzel kezelhető.', 'Ich (white spot disease). Treatable with copper in quarantine.'], 'cause.velvet': ['Velvet – gyors lefolyású, halálos élősködő.', 'Velvet – a fast, deadly parasite.'],
    'cause.fight': ['Verekedés – összeférhetetlen társak.', 'Fighting – incompatible tank mates.'], 'cause.small': ['Túl kicsi akvárium – tartós stressz.', 'Tank too small – constant stress.'],
    'cause.nipped': ['Egy hal megcsipkedte.', 'Nipped by a fish.'], 'cause.stung': ['Egy szomszéd korall megcsalánozta.', 'Stung by a neighbouring coral.'], 'cause.org': ['Szerves anyagokkal terhelt víz.', 'Water loaded with organics.'],
    'cause.eaten': ['Megette: {by}. Nem reef safe társ.', 'Eaten by {by}. Not a reef-safe tank mate.'], 'cause.jumped': ['Kiugrott az akváriumból – fedőháló kellett volna.', 'Jumped out of the tank – it needed a mesh lid.'],
    'cause.unknown': ['Ismeretlen ok.', 'Unknown cause.'],
    // advisor
    'adv.buyTank': ['Kezdd egy akváriummal a boltban.', 'Start with a tank from the shop.'], 'adv.buySalt': ['Só kell a feltöltéshez: 35 g literenként.', 'You need salt to fill it: 35 g per litre.'],
    'adv.buyRefracto': ['Refraktométer nélkül csak tippelni tudod a sótartalmat.', 'Without a refractometer you can only guess the salinity.'], 'adv.fill': ['Töltsd fel az akváriumot sós vízzel.', 'Fill the tank with saltwater.'],
    'adv.noHeater': ['Nincs fűtő: a víz a szobahőmérsékletet követi.', 'No heater: the water follows room temperature.'], 'adv.noFlow': ['Nincs áramlás: kevés az oxigén, a törmelék leül.', 'No flow: little oxygen, debris settles.'],
    'adv.noRock': ['Kevés a kő – a baktériumoknak felület kell.', 'Not enough rock – bacteria need surface.'],
    'adv.cycle': ['Még nincs elég baktérium. Adj ammónia-forrást, és mérj, amíg az NH3 és az NO2 nullára nem esik.', 'Not enough bacteria yet. Add an ammonia source and measure until NH3 and NO2 drop to zero.'],
    'adv.notCycled': ['Az akvárium nincs beciklizálva, mégis vannak lakók – mérj ammóniát és nitritet, és etess keveset.', 'The tank is not cycled but has residents – measure ammonia and nitrite and feed lightly.'],
    'adv.topOff': ['Párolog a víz, és nő a sótartalom – pótold édesvízzel.', 'Water is evaporating and salinity is rising – top off with fresh water.'], 'adv.sock': ['A szűrőzokni koszos – cseréld, különben nitrátgyár lesz.', 'The filter sock is dirty – change it or it becomes a nitrate factory.'],
    'adv.algae': ['Sok az alga: túl sok a tápanyag (NO3, PO4) vagy a fény.', 'Lots of algae: too many nutrients (NO3, PO4) or too much light.'], 'adv.aiptasia': ['Szaporodik az aiptasia – borsmentás garnéla vagy aiptasia-irtó segít.', 'Aiptasia are spreading – a peppermint shrimp or an aiptasia killer helps.'],
    'adv.broken': ['Valami nem működik a felszerelésben – nézd meg a listát.', 'Something in the equipment is not working – check the list.'], 'adv.power': ['Áramszünet van!', 'There is a power cut!'],
    'adv.food': ['Fogy a haltáp.', 'Fish food is running out.'], 'adv.noLight': ['Korallaid vannak, de nincs világítás.', 'You have corals but no light.'],
    'adv.s.nh3': ['Valaki ammóniától szenved: kevesebb etetés, vízcsere, mérd az NH3-at.', 'Someone suffers from ammonia: feed less, change water, measure NH3.'], 'adv.s.no2': ['Nitrit gyűlik: a ciklus nem ért véget. Vízcsere, kevés etetés.', 'Nitrite is building up: the cycle is not over. Change water, feed lightly.'],
    'adv.s.o2': ['Oxigénhiány: több áramlás, fehérjefölöző, kevesebb hal.', 'Low oxygen: more flow, a skimmer, fewer fish.'], 'adv.s.temp': ['Rossz a hőmérséklet – nézd a hőmérőt és a fűtőt/hűtést.', 'The temperature is wrong – check the thermometer and heating/cooling.'],
    'adv.s.sal': ['Rossz a sótartalom (cél: 35 ppt, azaz 1,026). Mérd meg, és igazítsd – naponta legfeljebb 1 ppt-vel.', 'Salinity is off (target: 35 ppt, i.e. 1.026). Measure it and correct it – by at most 1 ppt a day.'], 'adv.s.cu': ['Réz van a vízben – vízcsere és aktív szén.', 'There is copper in the water – water changes and activated carbon.'],
    'adv.s.hunger': ['Valaki éhezik – etess többször, vagy nézd meg, eszi-e, amit kap.', 'Someone is starving – feed more often, or check whether it eats what it gets.'], 'adv.s.no3': ['A nitrát nincs rendben. Ha magas (30 ppm felett): 20–30%-os vízcsere és kevesebb etetés, hosszabb távon fölöző, szűrőzokni, refúgium. Ha nulla, a korallok éheznek.', 'Nitrate is off. If high (over 30 ppm): a 20–30% water change and less food; in the long run a skimmer, filter sock, refugium. If zero, corals starve.'],
    'adv.s.po4': ['A foszfát nincs rendben – mérd meg.', 'Phosphate is off – measure it.'], 'adv.s.kh': ['A KH nincs rendben – mérd, és pótold.', 'KH is off – measure and dose.'], 'adv.s.ca': ['A kalcium nincs rendben.', 'Calcium is off.'], 'adv.s.mg': ['A magnézium nincs rendben.', 'Magnesium is off.'],
    'adv.s.ph': ['A pH nincs rendben – gyakran oxigénhiány vagy alacsony KH okozza.', 'pH is off – often low oxygen or low KH.'], 'adv.s.lightLow': ['Egy korallnak kevés a fény – tedd feljebb, vagy erősebb LED kell.', 'A coral gets too little light – move it up or get a stronger LED.'],
    'adv.s.lightHigh': ['Egy korallnak túl erős a fény – tedd lejjebb.', 'A coral gets too much light – move it down.'], 'adv.s.flowLow': ['A korallnak kevés az áramlás.', 'A coral gets too little flow.'], 'adv.s.flowHigh': ['A korallnak túl erős az áramlás.', 'A coral gets too much flow.'],
    'adv.s.ich': ['Ich! Halak karanténba, rézkezelés – a fő akvárium pihenjen.', 'Ich! Fish to quarantine, copper treatment – let the display rest.'], 'adv.s.velvet': ['Velvet! Azonnal karantén és réz, gyorsan öl.', 'Velvet! Quarantine and copper right away, it kills fast.'],
    'adv.s.fight': ['Verekedés: összeférhetetlen halak. Valakit el kell ajándékozni.', 'Fighting: incompatible fish. Someone has to go.'], 'adv.s.small': ['Valakinek túl kicsi az akvárium.', 'The tank is too small for someone.'],
    'adv.s.smother': ['Az alga benövi a korallokat.', 'Algae are overgrowing the corals.'], 'adv.s.aiptasia': ['Az aiptasiák csalánozzák a korallokat.', 'Aiptasia are stinging the corals.'], 'adv.s.zoaPest': ['Kártevők a zoákon – fürdesd meg őket.', 'Pests on the zoas – dip them.'],
    'adv.s.pyramid': ['Piramiscsigák a kagylón – egy ajaksügér segít.', 'Pyramid snails on the clam – a wrasse helps.'], 'adv.s.khSwing': ['Ingadozik a KH – adagolj egyenletesen.', 'KH is swinging – dose evenly.'],
    // top bar, menu, views
    tankSize: ['Akvárium', 'Tank'], water: ['{n} l víz', '{n} L water'], liters: ['{n} l', '{n} L'], noTankYet: ['még nincs', 'none yet'], menu: ['Menü', 'Menu'],
    'view.simple': ['Egyszerű', 'Simple'], 'view.full': ['Teljes', 'Full'], viewLabel: ['Nézet', 'View'],
    restart: ['Újrakezdés ugyanígy', 'Restart the same way'], confirmRestart: ['Elölről kezded ugyanezzel a móddal és beállításokkal? A mostani akvárium elvész.', 'Start over with the same mode and settings? The current tank will be lost.'],
    exitGame: ['Kilépés a főoldalra', 'Exit to the reef42 hub'], close: ['Bezárás', 'Close'], cancel: ['Mégse', 'Cancel'], dayPass: ['{n}. nap', 'Day {n}'],
    // shop
    'shop.packs': ['Kezdőcsomagok', 'Starter packs'], 'shop.rock': ['Kő', 'Rock'], 'shop.light': ['Világítás', 'Lighting'], 'shop.flow': ['Áramlás', 'Flow'], 'shop.heating': ['Fűtés és hűtés', 'Heating and cooling'],
    'shop.fish': ['Halak', 'Fish'], 'shop.coral': ['Korallok', 'Corals'], 'shop.invertebrate': ['Gerinctelenek', 'Inverts'],
    'grp.start': ['Kezdés', 'Start'], 'grp.gear': ['Felszerelés', 'Equipment'], 'grp.cons': ['Fogyóanyag', 'Supplies'], 'grp.live': ['Élőlények', 'Livestock'],
    packContents: ['Tartalom', 'Contents'], packSkip: ['A már meglévő eszközöket nem kapod meg újra, és nem is fizetsz értük.', "Equipment you already own is left out and not charged."],
    packSave: ['{n}% kedvezmény', '{n}% off'], bought: ['Ezt vetted', 'What you bought'], prev: ['← Előző', '← Back'], next: ['Következő →', 'Next →'], done: ['Kész', 'Done'], of: ['{a}/{b}', '{a} of {b}'],
    'ok.packBought': ['Megvetted a csomagot.', 'Pack bought.'], filter: ['Szűrő', 'Filter'], clearFilter: ['összes', 'show all'], photo: ['Fotó', 'Photo'],
    'test.nh3': ['Ammónia: a ciklus elején és új lakók után fontos – már kis mennyiségben is mérgező.', 'Ammonia: important early in the cycle and after new arrivals – toxic even in small amounts.'],
    'test.no2': ['Nitrit: a ciklus második fele. Ha az ammónia és a nitrit is nulla, kész a ciklus.', 'Nitrite: the second half of the cycle. When ammonia and nitrite are both zero, the cycle is done.'],
    'test.no3': ['Nitrát: a nitrogénciklus végterméke, vízcserével és algával fogy.', 'Nitrate: the end product of the nitrogen cycle, removed by water changes and algae.'],
    'test.po4': ['Foszfát: az algák fő tápláléka; a korallok kevés, de nem nulla foszfátot szeretnek.', 'Phosphate: the main algae food; corals like a little, but not zero.'],
    'test.ph': ['pH: sok mindent elárul – alacsony oxigénre vagy KH-ra figyelmeztet.', 'pH: tells a lot – it warns of low oxygen or low KH.'],
    'test.kh': ['KH: a meszet építő korallok fogyasztják, a legfontosabb korallos érték.', 'KH: used up by skeleton-building corals, the key value for a reef tank.'],
    'test.ca': ['Kalcium: a korallvázak építőanyaga.', 'Calcium: the building block of coral skeletons.'], 'test.mg': ['Magnézium: stabilan tartja a KH-t és a kalciumot.', 'Magnesium: keeps KH and calcium stable.'],
    'test.cu': ['Réz: rézkezelésnél kötelező, a dózis szűk sávban hat és nem öl.', 'Copper: a must during copper treatment – the dose only works in a narrow band.'],
    // simple view
    nextStep: ['Mi a következő lépés?', "What's next?"], quick: ['Gyors teendők', 'Quick care'], feedNow: ['Etetés', 'Feed'], wcQuick: ['Vízcsere {n}%', 'Change {n}% water'],
    measureP: ['Mérés: {p}', 'Measure {p}'], lastV: ['utoljára {v}, {ago}', 'last {v}, {ago}'], salinity: ['Sótartalom', 'Salinity'],
    routine: ['Napi rutin: etess, nézd meg a lakókat és a hőmérőt. Hetente: vízcsere és mérés (NO3, KH). A tünetekből következtess a vízre.', 'Daily: feed, look at the residents and the thermometer. Weekly: a water change and tests (NO3, KH). Read the water from the symptoms.'],
    alsoAdvice: ['További tippek', 'More tips'], missingTest: ['Nincs teszted.', 'No tests.'], missingFood: ['Nincs haltáp.', 'No fish food.'], missingSalt: ['Nincs elég sód a vízcseréhez.', 'Not enough salt for a water change.'],
    toShopShort: ['Bolt →', 'Shop →'], goShop: ['🛒 {name}', '🛒 {name}'], lookShop: ['🛒 Nézd meg a boltban', '🛒 See the shop'], filter2: ['{n} találat', '{n} results'],
    useIt: ['Használat: {name}', 'Use {name}'], fillIt: ['Feltöltés sós vízzel', 'Fill with saltwater'], sockIt: ['Zoknicsere', 'Change the sock'], measureQtCu: ['Réz mérése a karanténban', 'Measure copper in quarantine'],
    copperQt: ['Réz a karanténba', 'Copper into quarantine'], filtration: ['Szűrés', 'Filtration'],
    // symptoms per animal group
    'sym.nh3.fish': ['bágyadt, gyorsan lélegzik', 'lethargic, breathing fast'], 'sym.nh3.coral': ['zárt polipok, összehúzódik', 'polyps closed, shrinking'], 'sym.nh3.invert': ['bágyadt, rejtőzik', 'lethargic, hiding'],
    'sym.sal.fish': ['nyugtalan, gyorsan lélegzik', 'restless, breathing fast'], 'sym.sal.coral': ['zárt polipok', 'polyps closed'], 'sym.sal.invert': ['rejtőzik, alig eszik', 'hiding, barely eating'],
    'sym.salSwing': ['megviselte a hirtelen sóváltozás', 'stressed by a sudden salinity change'],
    'sym.tempHigh.fish': ['szapora légzés', 'fast breathing'], 'sym.tempHigh.coral': ['kifehéredik', 'bleaching'], 'sym.tempHigh.invert': ['bágyadt, rejtőzik', 'lethargic, hiding'],
    'sym.ph.coral': ['színvesztés, zárt polipok', 'losing colour, polyps closed'], 'sym.ph.fish': ['bágyadt', 'lethargic'], 'sym.ph.invert': ['bágyadt', 'lethargic'],
    'sym.o2.coral': ['zárt polipok', 'polyps closed'], 'sym.o2.invert': ['a felszín felé mászik', 'climbing towards the surface'],
    'sym.no3.fish': ['fakóbb színek, kevésbé aktív', 'duller colours, less active'], 'sym.no3.invert': ['kevésbé aktív', 'less active'],
    'sym.hunger.invert': ['sokat keresgél, lassul', 'searching a lot, slowing down'], 'sym.hunger.coral': ['zsugorodik', 'shrinking'],
    'sym.cu.fish': ['bágyadt, nem eszik', 'lethargic, not eating'],
    'adv.s.salSwing': ['Hirtelen változott a sótartalom – pótold a párolgást naponta (vagy vegyél ATO-t), és lassan igazíts.', 'Salinity changed suddenly – top off daily (or get an ATO) and correct slowly.'],
    'cause.salSwing': ['Hirtelen sótartalom-változás.', 'A sudden salinity change.'],
    salUp: ['Só emelése (+1 ppt)', 'Raise salinity (+1 ppt)'], salDown: ['Só csökkentése (−1 ppt)', 'Lower salinity (−1 ppt)'],
    'ok.salUp': ['Sót adtál a vízhez – kb. +1 ppt. Naponta legfeljebb ennyit változtass!', 'You added salt – about +1 ppt. Change no more than this a day!'],
    'ok.salDown': ['Sós vizet cseréltél édesvízre – kb. −1 ppt. Naponta legfeljebb ennyit változtass!', 'You swapped saltwater for fresh water – about −1 ppt. Change no more than this a day!'],
    // cycle tracker
    cycle: ['Ciklus', 'Cycle'], cycleToday: ['Mai teendő', 'Today'],
    cycleLead: ['A baktériumok az ammóniát nitritté, a nitritet nitráttá alakítják. Amíg ez nem működik, a lakók belehalnának a saját ürülékükbe.', 'Bacteria turn ammonia into nitrite and nitrite into nitrate. Until this works, residents would be poisoned by their own waste.'],
    'cyc.1': ['Ammóniaforrás a vízben', 'Ammonia source in the water'], 'cyc.2': ['Mérhető ammónia (0,25+ ppm)', 'Measurable ammonia (0.25+ ppm)'], 'cyc.3': ['Megjelent a nitrit', 'Nitrite has appeared'],
    'cyc.4': ['Ammónia és nitrit is 0', 'Ammonia and nitrite both 0'], 'cyc.5': ['Próba: egy adag egy nap alatt eltűnik', 'Test: a dose is gone within a day'], 'cyc.6': ['Nagy vízcsere (30%+)', 'Big water change (30%+)'],
    'todo.start': ['Indítsd a ciklust: adj 1 adag ammóniát (kb. 1 ppm). Etetéssel is megy hal nélkül – akkor naponta 2× „Sok” –, de lassabb.', 'Start the cycle: add 1 dose of ammonia (about 1 ppm). Feeding an empty tank works too – twice a day, "a lot" – but it is slower.'],
    'todo.measure1': ['Mérd meg az ammóniát, hogy lásd, mennyi került a vízbe.', 'Measure ammonia to see how much is in the water.'],
    'todo.more': ['Még kevés az ammónia: adj még egy adagot (cél: 1–2 ppm), aztán mérj.', 'Not enough ammonia yet: add another dose (aim for 1–2 ppm), then measure.'],
    'todo.wait2': ['Most az ammóniabontó baktériumok szaporodnak. Léptesd a napokat, és 2 naponta mérd az NH3-at és az NO2-t. Ha az NH3 0,5 alá esik, adj még egy adagot.', 'The ammonia-eating bacteria are growing now. Advance the days and measure NH3 and NO2 every 2 days. If NH3 drops below 0.5, add another dose.'],
    'todo.wait3': ['Megjött a nitrit! A nitritbontó baktériumok lassabbak – ez a leghosszabb szakasz (1–3 hét). Tartsd az ammóniát 1 ppm körül, és 2–3 naponta mérd az NH3-at és az NO2-t.', 'Nitrite is here! The nitrite-eating bacteria are slower – this is the longest stage (1–3 weeks). Keep ammonia around 1 ppm and measure NH3 and NO2 every 2–3 days.'],
    'todo.test': ['Úgy néz ki, kész! Próba: adj 1 adag ammóniát, és holnap mérd az NH3-at. Ha 0 körül van, a baktériumok elbírják.', 'Looks done! Test: add 1 dose of ammonia and measure NH3 tomorrow. If it is around 0, the bacteria can cope.'],
    'todo.testFood': ['Úgy néz ki, kész! Próba: etess „Sok”-at, és holnap mérd az NH3-at. Ha 0 körül van, a baktériumok elbírják.', 'Looks done! Test: feed "a lot" and measure NH3 tomorrow. If it is around 0, the bacteria can cope.'],
    'todo.testWait': ['Holnap mérd az NH3-at – léptess egy napot.', 'Measure NH3 tomorrow – advance a day.'], 'todo.testMeasure': ['Mérd meg az NH3-at: eltűnt az adag?', 'Measure NH3: is the dose gone?'],
    'todo.testFail': ['Még nem bírják (NH3: {v}). Várj 2–3 napot, tartsd az ammóniát 1 ppm körül, és próbáld újra.', 'Not yet (NH3: {v}). Wait 2–3 days, keep ammonia around 1 ppm and try again.'],
    'todo.wc': ['Kész a ciklus! A felgyűlt nitrát miatt cserélj 30–50% vizet – utána jöhet a takarítócsapat (csigák, remeterákok).', 'The cycle is done! Change 30–50% of the water because of the nitrate that built up – then the clean-up crew (snails, hermit crabs) can come.'],
    cycleDone: ['A ciklus kész – jöhetnek az első lakók!', 'The cycle is done – the first residents can come!'], feedGhost: ['Etetés hal nélkül (sok)', 'Ghost feed (a lot)'],
    // missions
    nextMission: ['Következő küldetés: {name} →', 'Next mission: {name} →'], continueFree: ['Folytatás szabadon', 'Carry on freely'],
    confirmNextMission: ['Új játék indul ezzel a küldetéssel (ugyanilyen idővel és nehézséggel). A mostani akvárium elvész – előtte letöltheted a mentést a Menüben. Mehet?', 'A new game starts with this mission (same time and difficulty). The current tank will be lost – you can download the save from the Menu first. Go ahead?'],
    confirm: ['Megerősítés', 'Confirm'], yes7: ['Igen, +7 nap', 'Yes, +7 days'],
    confirmWeek: ['Nincs működő etetőautomatád: egy hétig senki nem eteti a halakat. Biztosan ugrasz 7 napot?', "You don't have a working auto feeder: nobody feeds the fish for a week. Skip 7 days anyway?"],
    // tour
    tourMenu: ['Bemutató újra', 'Show the tour again'], tourNext: ['Tovább', 'Next'], tourSkip: ['Kihagyom', 'Skip'], tourDone: ['Kész', 'Done'],
    'tour.1': ['Itt telik az idő: a „Következő nap” egy napot léptet. Mellette látod a dátumot, a pénzed, az akvárium méretét és a hőmérsékletet.', 'This is where time passes: "Next day" moves one day on. Next to it: the date, your money, the tank size and the temperature.'],
    'tour.2': ['Két nézet van: az Egyszerű lépésről lépésre vezet, a Teljes minden panelt mutat. Bármikor válthatsz.', 'There are two views: Simple guides you step by step, Full shows every panel. Switch any time.'],
    'tour.3': ['Itt látod, mi a következő teendő – a gombok egyenesen oda visznek, pl. a bolt megfelelő termékéhez.', "Here you see what's next – the buttons take you straight there, e.g. to the right product in the shop."],
    'tour.4': ['A boltban kezdőcsomagokat, felszerelést, fogyóanyagot és élőlényeket veszel.', 'In the shop you buy starter packs, equipment, supplies and livestock.'],
    'tour.5': ['A Menüben letöltheted vagy betöltheted a mentést, újrakezdhetsz, és újra megnézheted ezt a bemutatót.', 'In the Menu you can download or load your save, start over and watch this tour again.'],
    // animal profile
    profile: ['Adatlap', 'Profile'], nameIt: ['Név', 'Name'], namePh: ['Adj neki nevet…', 'Give it a name…'], named: ['Elnevezted.', 'Named.'],
    size: ['Méret', 'Size'], feeding: ['Táplálkozás', 'Feeding'], behavior: ['Viselkedés', 'Behaviour'], notesL: ['Érdekesség', 'Notes'], minTankL: ['Min. akvárium', 'Min. tank'],
    reefSafety: ['Reef safe', 'Reef safe'], 'rs.reef-safe': ['igen', 'yes'], 'rs.with-caution': ['óvatosan', 'with caution'], 'rs.not-reef-safe': ['nem', 'no'], difficultyL: ['Nehézség', 'Difficulty'],
    withYou: ['{n} napja nálad', 'with you for {n} days'], nowL: ['Most', 'Now'], cm: ['{n} cm', '{n} cm'],
    knowL: ['Tudás erről a fajról: {n}. szint', 'Knowledge of this species: level {n}'], knowPts: ['{p}/6 pont. Pontot ér minden hét, amíg él nálad ilyen faj, és a sikeres kvíz. Új játékban is megmarad.', '{p}/6 points. You get a point for every week this species lives with you and for a passed quiz. It carries over to new games.'],
    'know.1': ['1. szint: látod, mennyire jóllakott', 'Level 1: you see how well fed it is'], 'know.2': ['2. szint: látod, mi zavarja', 'Level 2: you see what bothers it'], 'know.3': ['3. szint: látod a pontos állapotát', 'Level 3: you see its exact condition'],
    fed: ['Jóllakott', 'Well fed'], hungry2: ['Éhes', 'Hungry'], thin: ['Sovány', 'Thin'], feedsLight: ['A fényből él (fotoszintetizál).', 'Lives off light (photosynthesis).'],
    bothers: ['Ami zavarja: {list}', 'Bothered by: {list}'], nothingBothers: ['Semmi nem zavarja.', 'Nothing bothers it.'], condition: ['Állapot: {n}%', 'Condition: {n}%'],
    'bk.nh3': ['ammónia', 'ammonia'], 'bk.no2': ['nitrit', 'nitrite'], 'bk.no3': ['nitrát', 'nitrate'], 'bk.po4': ['foszfát', 'phosphate'], 'bk.temp': ['hőmérséklet', 'temperature'], 'bk.sal': ['sótartalom', 'salinity'],
    'bk.ph': ['pH', 'pH'], 'bk.o2': ['oxigénhiány', 'lack of oxygen'], 'bk.cu': ['réz', 'copper'], 'bk.kh': ['KH', 'KH'], 'bk.ca': ['kalcium', 'calcium'], 'bk.mg': ['magnézium', 'magnesium'], 'bk.hunger': ['éhség', 'hunger'],
    'bk.lightLow': ['kevés fény', 'too little light'], 'bk.lightHigh': ['túl sok fény', 'too much light'], 'bk.flowLow': ['kevés áramlás', 'too little flow'], 'bk.flowHigh': ['túl erős áramlás', 'too much flow'],
    'bk.ich': ['ich', 'ich'], 'bk.velvet': ['velvet', 'velvet'], 'bk.fight': ['verekedés', 'fighting'], 'bk.small': ['kicsi akvárium', 'small tank'], 'bk.smother': ['alga', 'algae'], 'bk.aiptasia': ['aiptasia', 'aiptasia'],
    'bk.zoaPest': ['kártevők', 'pests'], 'bk.pyramid': ['piramiscsigák', 'pyramid snails'], 'bk.khSwing': ['KH-ingadozás', 'KH swings'], 'bk.salSwing': ['sóingadozás', 'salinity swings'], 'bk.org': ['szerves anyag', 'organics'],
    'bk.nipped': ['csipkedés', 'nipping'], 'bk.stung': ['csalánzás', 'stinging'],
    quizBtn: ['Kvíz (+2 pont)', 'Quiz (+2 points)'], quizLead: ['Három kérdés a fajlap alapján – kettő jó válasz kell.', 'Three questions from the species card – two correct answers are needed.'],
    quizCheck: ['Ellenőrzés', 'Check'], quizOk: ['Sikerült ({n}/3)! +2 pont.', 'Well done ({n}/3)! +2 points.'], quizFail: ['Most nem sikerült ({n}/3). Holnap újra próbálhatod – addig nézd meg a fajlapot.', "Not this time ({n}/3). Try again tomorrow – read the species card meanwhile."],
    quizToday: ['Ma már kvízeztél erről a fajról – holnap újra próbálhatod.', 'You already did the quiz for this species today – try again tomorrow.'], quizMax: ['A kvízpontokat már mind megszerezted.', 'You have all the quiz points.'],
    'q.size': ['Mekkorára nő meg legfeljebb?', 'How big does it grow at most?'], 'q.tank': ['Legalább mekkora akvárium kell neki?', 'What is the smallest tank it needs?'], 'q.reef': ['Reef safe?', 'Is it reef safe?'],
    'q.diff': ['Mennyire nehéz tartani?', 'How hard is it to keep?'], 'q.feed': ['Mit eszik?', 'What does it eat?'], back2: ['Vissza', 'Back'],
    // sky
    skyHere: ['Itt mindenki boldog: nincs ammónia, nincs ich, és mindig van kaja.', 'Everyone is happy here: no ammonia, no ich, and food is always served.']
  };

  const app = document.getElementById('app');
  const ls = (get, k, v) => { try { if (get) return localStorage.getItem(k); localStorage.setItem(k, v); return true; } catch (e) { return get ? null : false; } };
  let lang = new URLSearchParams(location.search).get('lang') || ls(true, LANG_KEY) || ((navigator.language || '').toLowerCase().startsWith('hu') ? 'hu' : 'en');
  if (lang !== 'hu') lang = 'en';
  const L = () => (lang === 'hu' ? 0 : 1);
  const t = (k, v) => {
    let s = T[k] ? T[k][L()] : k;
    if (v) Object.keys(v).forEach((x) => { s = s.split('{' + x + '}').join(v[x]); });
    return s;
  };
  const tr = (o) => (o && typeof o === 'object' ? o[lang] || o.en || o.hu || '' : o || '');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (n, d) => { const x = d == null ? String(n) : Number(n).toFixed(d); return lang === 'hu' ? x.replace('.', ',') : x; };
  const $ = (sel, root) => (root || document).querySelector(sel);

  let S = null; // game state
  let MISSIONS = [];
  let storageOk = true;
  const mission = () => (S && S.mission ? MISSIONS.find((m) => m.id === S.mission.id) : null);
  const spName = (id) => { const st = Sim.CAT.species[id]; if (!st) return id; const s = st.sp; return lang === 'hu' && s.name_hu ? s.name_hu : s.name_en; };
  const itemName = (id) => { const c = Sim.CAT; const x = c.tanks[id] || c.eq[id] || c.cons[id]; return x ? tr(x.name) : id; };

  /* ---------- saving ---------- */
  function save() { if (S) storageOk = ls(false, SAVE_KEY, JSON.stringify(S)) !== false; }
  function load() { try { const x = JSON.parse(ls(true, SAVE_KEY) || 'null'); return x && x.v === 1 && x.opts ? x : null; } catch (e) { return null; } }
  function download(name, text) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function exportSave() { if (S) download('reef-game-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify({ app: 'reef42-reefgame', v: 1, state: S }, null, 1)); }
  function importSave(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        const st = d && d.app === 'reef42-reefgame' ? d.state : null;
        if (!st || st.v !== 1 || !st.opts || !Array.isArray(st.ani)) throw new Error('bad');
        S = st; S.lastReal = Date.now(); resetScene(); save(); toast(t('loaded')); location.hash = '#/tank'; render();
      } catch (e) { toast(t('badSave')); }
    };
    r.readAsText(file);
  }

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }
  function result(r, extra) {
    if (!r) return;
    if (r.ok) {
      let m = t('ok.' + r.msg, r.x || {});
      if (r.msg === 'added' && extra === 'qt') m = t('ok.addedQt');
      if (r.msg === 'fed' && r.x && r.x.leftover > 0.4) m = t('ok.leftover');
      if (r.x && r.x.notes && r.x.notes.includes('dipped')) m += ' ' + t('ok.dipped');
      if (r.msg === 'measured') m = PNAME[r.x.p] ? PNAME[r.x.p] + ': ' + fmtVal(r.x.p, r.x.v) : fmtVal(r.x.p, r.x.v);
      toast(m);
    } else toast(t('err.' + r.err, r.x ? { g: Math.ceil((r.x.g || 0) / 100) * 100 } : {}));
  }

  /* ---------- formatting ---------- */
  function fmtVal(p, v) {
    if (p === 'sal') return num(v, 1) + ' ppt (SG ' + num(1 + v * 0.000753, 3) + ')';
    const d = { ph: 1, kh: 1, po4: 2, cu: 2, nh3: 2, no2: 2 }[p];
    return num(d != null ? Number(v).toFixed(d) : v) + (UNIT[p] ? ' ' + UNIT[p] : '');
  }
  function dateOf(day) {
    const d = new Date(S.startDate + 'T12:00:00');
    d.setDate(d.getDate() + Math.floor(day));
    return d.toLocaleDateString(lang === 'hu' ? 'hu-HU' : 'en-GB', { month: 'short', day: 'numeric' });
  }
  const clock = (day) => { const m = Math.floor((day - Math.floor(day)) * 1440); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };

  /* ---------- chrome ---------- */
  let langPicker = null;
  const route = () => { const h = location.hash.replace(/^#\/?/, '').split('/'); return { view: h[0] || 'tank', sub: h[1] || '', item: h[2] || '' }; };
  function renderChrome() {
    document.documentElement.lang = lang;
    document.title = t('app') + ' – reef42';
    if (langPicker) langPicker.update();
    const r = route();
    const tabs = S ? ['tank', 'shop', 'log', 'sky'] : [];
    $('#tabs').innerHTML = tabs.map((v) => '<a href="#/' + v + '"' + (r.view === v ? ' aria-current="page"' : '') + '>' + esc(t(v)) + (v === 'sky' && S.heaven.length ? ' <span class="n">' + S.heaven.length + '</span>' : '') + '</a>').join('');
    $('#footer').innerHTML = '<div class="inner"><span>' + esc(t('footer')) + '</span><span>' + esc(t('feedback')) + ' <a href="mailto:info.reef42@gmail.com">info.reef42@gmail.com</a></span></div>';
    $('#banner').hidden = storageOk;
    $('#banner').textContent = storageOk ? '' : t('storageFail');
    renderHud();
  }
  function render() {
    renderChrome();
    if (!S) { renderStart(); return; }
    const v = route().view;
    if (v === 'shop') renderShop();
    else if (v === 'log') renderLog();
    else if (v === 'sky') renderSky();
    else renderTank();
  }

  /* ---------- top bar (always visible during a game) ---------- */
  const hud = document.getElementById('hud');
  let hudDay = -1;
  function renderHud() {
    hud.hidden = !S;
    if (!S) { hud.innerHTML = ''; return; }
    hud.innerHTML = '<div class="hud-in"><span class="stat day"><small id="hDate"></small><b id="hDay"></b></span>' +
      '<span class="stat"><small>' + esc(t('money')) + '</small><b id="hMoney"></b></span>' +
      '<span class="stat"><small id="hTankL"></small><b id="hTank"></b></span>' +
      '<span class="stat" id="hTempS"><small>' + esc(t('thermo')) + '</small><b id="hTemp"></b></span>' +
      '<span class="ctl" id="hCtl"></span><button class="btn menubtn" data-act="menu" aria-haspopup="dialog" aria-label="' + esc(t('menu')) + '">☰ <span>' + esc(t('menu')) + '</span></button></div>';
    for (const k in panelCache) if (k[0] === 'h') delete panelCache[k];
    hudDay = Math.floor(S.day);
    updateHud();
  }
  function updateHud() {
    if (!S || hud.hidden || !$('#hDay')) return;
    const d = Math.floor(S.day);
    const tm = S.opts.time;
    $('#hDate').textContent = dateOf(S.day) + (tm !== 'turn' ? ' ' + clock(S.day) : '');
    const dayEl = $('#hDay');
    dayEl.textContent = t('day', { n: d + 1 });
    if (d !== hudDay) { hudDay = d; dayEl.classList.remove('flip'); void dayEl.offsetWidth; dayEl.classList.add('flip'); }
    $('#hMoney').textContent = Math.round(S.money) + ' 🐚';
    const tk = S.tank ? Sim.CAT.tanks[S.tank.id] : null;
    $('#hTankL').textContent = tk && S.tank.filled ? t('water', { n: Math.round(S.w.level) }) : t('tankSize');
    $('#hTank').textContent = tk ? t('liters', { n: tk.gross }) : t('noTankYet');
    const filled = S.tank && S.tank.filled;
    $('#hTempS').hidden = !filled;
    if (filled) $('#hTemp').textContent = num(S.w.temp, 1) + ' °C';
    let ctl = '';
    if (tm === 'turn') ctl = '<button class="btn primary" data-act="next">' + esc(t('nextDay')) + '</button><button class="btn" data-act="week">' + esc(t('week')) + '</button>';
    else if (tm === 'fast') ctl = '<button class="btn primary" data-act="toggle">' + esc(running ? '⏸ ' + t('pause') : '▶ ' + t('play')) + '</button>' +
      [1, 5].map((x) => '<button class="chip" data-act="speed" data-v="' + x + '" aria-pressed="' + (S.speed === x) + '">' + x + '×</button>').join('');
    else ctl = '<span class="chip on">⏱ ' + esc(t('realNote')) + '</span>';
    setPanel('hCtl', ctl);
  }
  const viewMode = () => S.view || (S.opts.difficulty === 'easy' ? 'simple' : 'full');

  /* ---------- dialog (same pattern as Tank Log) ---------- */
  function modal(title, bodyHtml, actions, onOpen) {
    return new Promise((resolve) => {
      const d = document.createElement('dialog');
      d.className = 'modal';
      d.innerHTML = '<form method="dialog"><header><h2>' + esc(title) + '</h2><button type="button" class="x" aria-label="' + esc(t('close')) + '">×</button></header>' +
        '<div class="mbody">' + bodyHtml + '</div>' +
        (actions && actions.length ? '<footer>' + actions.map((a) => '<button value="' + esc(a.value) + '" class="btn' + (a.primary ? ' primary' : '') + (a.danger ? ' danger' : '') + '">' + esc(a.label) + '</button>').join('') + '</footer>' : '') +
        '</form>';
      document.body.appendChild(d);
      let res = '';
      d.addEventListener('click', (e) => {
        if (e.target === d || e.target.closest('.x')) { d.close(''); return; }
        const b = e.target.closest('button[value]');
        if (b) res = b.value;
      });
      d.addEventListener('close', () => {
        resolve({ value: d.returnValue || res || '', el: d });
        setTimeout(() => d.remove(), 0);
      });
      if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
      if (onOpen) onOpen(d, (v) => { res = v; d.close(v); });
    });
  }
  async function openMenu() {
    const m = mission();
    const body = '<p class="muted">' + esc(t('summary', { mode: m ? tr(m.name) : t('free'), time: t('time.' + S.opts.time), diff: t('diff.' + S.opts.difficulty), n: Math.floor(S.day) + 1 })) + '</p>' +
      '<div class="menu-list"><button class="btn" value="export">💾 ' + esc(t('exportSave')) + '</button>' +
      '<label class="btn filebtn">📂 ' + esc(t('importSave')) + '<input type="file" accept="application/json,.json" id="menuImport"></label>' +
      '<button class="btn" value="restart">🔄 ' + esc(t('restart')) + '</button><button class="btn danger" value="new">🆕 ' + esc(t('newGame')) + '</button>' +
      '<button class="btn" value="tour">👆 ' + esc(t('tourMenu')) + '</button><button class="btn" value="exit">🚪 ' + esc(t('exitGame')) + '</button></div>';
    const r = await modal(t('game'), body, [{ label: t('close'), value: '' }], (d, done) => {
      d.querySelector('#menuImport').addEventListener('change', (e) => { if (e.target.files[0]) { importSave(e.target.files[0]); done(''); } });
    });
    if (r.value === 'export') exportSave();
    else if (r.value === 'tour') startTour();
    else if (r.value === 'exit') { save(); location.href = '../'; }
    else if (r.value === 'restart' && confirm(t('confirmRestart'))) {
      const o = S.opts;
      S = Sim.newGame({ mode: o.mode, time: o.time, difficulty: o.difficulty });
      const ms = MISSIONS.find((x) => x.id === o.mode);
      if (ms) Sim.applySetup(S, ms);
      resetScene(); save(); location.hash = '#/tank'; render();
    } else if (r.value === 'new' && confirm(t('confirmNew'))) { S = null; ls(false, SAVE_KEY, ''); resetScene(); location.hash = '#/'; render(); }
  }

  /* ---------- start ---------- */
  function renderStart() {
    const opt = (name, val, title, text, checked) => '<label class="opt"><input type="radio" name="' + name + '" value="' + esc(val) + '"' + (checked ? ' checked' : '') + '><span><b>' + esc(title) + '</b><small>' + esc(text) + '</small></span></label>';
    app.innerHTML = '<section class="hero"><h1>' + esc(t('app')) + '</h1><p class="lead">' + esc(t('lead')) + '</p></section>' +
      '<form id="startForm" class="card start"><h2>' + esc(t('newGame')) + '</h2>' +
      '<fieldset><legend>' + esc(t('mode')) + '</legend>' + opt('mode', 'free', t('free'), t('freeText'), true) +
      '<p class="sub">' + esc(t('missions')) + '</p>' + MISSIONS.map((m) => opt('mode', m.id, tr(m.name), tr(m.intro))).join('') + '</fieldset>' +
      '<fieldset><legend>' + esc(t('time')) + '</legend>' + ['turn', 'fast', 'real'].map((x, i) => opt('time', x, t('time.' + x), t('time.' + x + 'Text'), i === 0)).join('') + '</fieldset>' +
      '<fieldset><legend>' + esc(t('difficulty')) + '</legend>' + ['easy', 'hard'].map((x, i) => opt('diff', x, t('diff.' + x), t('diff.' + x + 'Text'), i === 0)).join('') + '</fieldset>' +
      '<div class="btns"><button class="btn primary" type="submit">' + esc(t('start')) + '</button>' +
      '<label class="btn filebtn">' + esc(t('importSave')) + '<input type="file" accept="application/json,.json" id="importFile"></label></div></form>';
  }
  function startGame(f) {
    const mode = f.elements.mode.value;
    S = Sim.newGame({ mode, time: f.elements.time.value, difficulty: f.elements.diff.value });
    const m = MISSIONS.find((x) => x.id === mode);
    if (m) Sim.applySetup(S, m);
    resetScene();
    save();
    location.hash = '#/tank';
    render();
    if (!ls(true, TOUR_KEY)) setTimeout(startTour, 500);
  }

  /* ---------- time ---------- */
  let running = false;
  let lastTick = 0;
  function advance(days) {
    if (!S || (S.ev.holiday && S.ev.holiday.pending)) return;
    const d0 = Math.floor(S.day);
    const out = Sim.step(S, days);
    afterChange(out);
    if (Math.floor(S.day) > d0) dayPass(Math.floor(S.day) + 1, S.opts.time === 'turn');
    updateHud();
  }
  // Day change: a short night with the moon in turn-based mode, a small label otherwise.
  function dayPass(n, full) {
    const wrap = $('.scene-wrap');
    if (!wrap) return;
    let el = wrap.querySelector('.daypass');
    if (!el) { el = document.createElement('div'); el.className = 'daypass'; el.setAttribute('aria-hidden', 'true'); wrap.appendChild(el); }
    el.innerHTML = (full ? '<span class="moon">🌙</span><span class="sun">☀️</span>' : '') + '<b>' + esc(t('dayPass', { n })) + '</b>';
    el.className = 'daypass';
    void el.offsetWidth;
    el.className = 'daypass go' + (full ? ' full' : '');
  }
  function afterChange(out) {
    out = out || [];
    updateKnow();
    const m = mission();
    if (m) Sim.missionCheck(S, m, out);
    out.filter((e) => e.k === 'death').forEach((e) => toast(t('log.death', { name: e.x.name || spName(e.x.sp) })));
    save();
  }
  // Accelerated time runs on a timer (animation frames stop in background tabs); 1× = one day per minute.
  function fastTick() {
    const now = Date.now();
    const dt = lastTick ? Math.min(2000, now - lastTick) : 0;
    lastTick = now;
    if (S && S.opts.time === 'fast' && running && route().view === 'tank' && dt) advance(dt / 60000 * S.speed);
  }
  function loop(ts) {
    requestAnimationFrame(loop);
    animate(ts);
  }
  // Real time: catch up on load, then every 30 s.
  function realTick() {
    if (!S || S.opts.time !== 'real') return;
    const now = Date.now();
    const days = Math.min(120, (now - (S.lastReal || now)) / 864e5);
    S.lastReal = now;
    if (days > 0) advance(days);
  }

  /* ---------- tank view ---------- */
  function renderTank() {
    if (!S.tank) {
      app.innerHTML = '<div id="holiday"></div><div class="card center"><p>' + esc(t('noTank')) + '</p><a class="btn primary" href="#/shop/packs">' + esc(t('toShop')) + '</a></div><div id="next"></div>';
      refreshTank(true);
      return;
    }
    const seg = '<div class="viewbar"><span class="muted small">' + esc(t('viewLabel')) + '</span><span class="seg" role="group" aria-label="' + esc(t('viewLabel')) + '">' + ['simple', 'full'].map((v) =>
      '<button class="chip" data-act="setView" data-v="' + v + '" aria-pressed="' + (viewMode() === v) + '">' + esc(t('view.' + v)) + '</button>').join('') + '</span></div>';
    const scene = seg + '<div class="scene-wrap"><svg id="scene" viewBox="0 0 800 420" role="img" aria-label="' + esc(t('tank')) + '"></svg></div>';
    if (viewMode() === 'simple') {
      app.innerHTML = '<div id="holiday"></div>' + scene + '<div class="cols"><div class="col"><div id="next"></div><div id="cycle"></div><section class="card" id="quick"></section></div><div class="col"><div id="animals"></div></div></div>';
    } else {
      app.innerHTML = '<div id="holiday"></div>' + scene +
        '<div class="cols"><div class="col"><div id="mission"></div><div id="cycle"></div><div id="advisor"></div><section class="card" id="actions"></section><div id="animals"></div></div>' +
        '<div class="col"><div id="measures"></div><div id="equip"></div><section class="card" id="settings"></section></div></div>';
      renderActions();
      renderSettings();
    }
    sceneKey = '';
    refreshTank(true);
  }
  const panelCache = {};
  function setPanel(id, html) { const el = document.getElementById(id); if (el && panelCache[id] !== html) { panelCache[id] = html; el.innerHTML = html; } }
  function refreshTank(force) {
    if (force) Object.keys(panelCache).forEach((k) => delete panelCache[k]);
    updateHud();
    if (!S || route().view !== 'tank') return;
    setPanel('holiday', holidayHtml());
    setPanel('next', nextHtml());
    if (!S.tank) return;
    setPanel('cycle', cycleHtml());
    setPanel('quick', quickHtml());
    setPanel('mission', missionHtml());
    setPanel('advisor', advisorHtml());
    setPanel('animals', animalsHtml());
    setPanel('measures', measuresHtml());
    setPanel('equip', equipHtml());
    drawScene();
  }

  /* ---------- links to the shop and to actions ---------- */
  const shopHref = (cat, item) => '#/shop/' + cat + (item ? '/' + encodeURIComponent(item) : '');
  const shopLink = (cat, item, label) => '<a class="btn sm" href="' + shopHref(cat, item) + '">' + esc(t('goShop', { name: label || (item && !/^[cuk]:/.test(item) ? itemName(item) : t('shop.' + cat)) })) + '</a>';
  const actBtn = (a, v, label, cls) => '<button class="btn sm' + (cls ? ' ' + cls : '') + '" data-act="' + a + '"' + (v != null ? ' data-v="' + esc(v) + '"' : '') + '>' + esc(label) + '</button>';
  const hasKind = (k) => S.eq.some((e) => Sim.CAT.eq[e.id].kind === k);
  // Cheapest item of a kind that suits the tank (rated volume, or about 10× turnover for pumps).
  function suggestEq(kind) {
    const net = S.tank ? S.tank.net : 100;
    const xs = Object.values(Sim.CAT.eq).filter((x) => x.kind === kind).sort((a, b) => a.price - b.price);
    const fits = (x) => (x.rated ? x.rated >= net : x.flow ? x.flow >= net * 10 : true);
    return (xs.find(fits) || xs[xs.length - 1] || {}).id;
  }
  const saltLink = (g) => shopLink('basics', g > 4000 ? 'salt20' : 'salt4');
  const testLink = (p) => (p === 'sal' ? (hasKind('refractometer') ? actBtn('measureP', 'sal', t('measureP', { p: t('salinity') })) : shopLink('other', 'refracto'))
    : S.stock['test:' + p] > 0 ? actBtn('measureP', p, t('measureP', { p: PNAME[p] })) : shopLink('tests', 't-' + p));
  const itemLink = (item) => (S.stock[item] > 0 ? actBtn('useItem', item, t('useIt', { name: t('item.' + item) })) : shopLink(consCat(Sim.CAT.cons[item]), item));
  const wcBtn = (p) => { const g = (S.w.level || 0) * p / 100 * Sim.SAL0; return S.stock.salt >= g ? actBtn('wcP', p, t('wcQuick', { n: p })) : saltLink(g); };
  const qtPackLink = () => shopLink('packs', 'qtpack', tr(Sim.CAT.packs.qtpack ? Sim.CAT.packs.qtpack.name : '') || t('qt'));
  function adviceLinks(k) {
    const p = k.replace(/^s\./, '');
    switch (k) {
      case 'buyTank': return shopLink('packs') + shopLink('tanks');
      case 'buySalt': return saltLink(S.tank.net * Sim.SAL0 - S.stock.salt);
      case 'buyRefracto': return shopLink('other', 'refracto');
      case 'fill': return S.stock.salt >= S.tank.net * Sim.SAL0 ? actBtn('fill', null, t('fillIt')) : '';
      case 'noHeater': return shopLink('heating', suggestEq('heater'));
      case 's.temp': return shopLink('heating');
      case 'noFlow': case 's.o2': case 's.flowLow': return shopLink('flow', suggestEq('pump'));
      case 'noRock': return shopLink('rock', 'dryrock');
      case 'cycle': return itemLink('ammonia') + testLink('nh3');
      case 'notCycled': return testLink('nh3') + testLink('no2');
      case 's.nh3': case 's.no2': return testLink(p) + wcBtn(20);
      case 'topOff': return actBtn('topoff', null, t('topOff'));
      case 'sock': return actBtn('sock', null, t('sockIt'));
      case 'algae': return testLink('po4') + shopLink('invertebrate', 'u:algae-eater', t('shop.invertebrate'));
      case 'aiptasia': case 's.aiptasia': return itemLink('aiptasiax') + shopLink('invertebrate', 'u:aiptasia-eater', t('shop.invertebrate'));
      case 'food': return shopLink('basics', 'food');
      case 'noLight': return shopLink('light', suggestEq('light'));
      case 's.sal': return testLink('sal') + salLinks();
      case 's.cu': return itemLink('carbon') + wcBtn(20);
      case 's.hunger': return S.stock.food > 0 ? actBtn('feed', 'normal', t('feedNow')) : shopLink('basics', 'food');
      case 's.no3': case 's.po4': case 's.kh': case 's.ca': case 's.mg': case 's.ph': return testLink(p);
      case 's.ich': case 's.velvet': return hasKind('qt') ? actBtn('moveAll', 'qt', t('allToQt')) : qtPackLink();
      case 's.zoaPest': return shopLink('additives', 'dip');
      default: return '';
    }
  }
  // Links that help with an unfinished mission goal.
  function goalLinks(g) {
    if (Sim.goalDone(S, g)) return '';
    switch (g.type) {
      case 'tank': return shopLink('packs') + shopLink('tanks');
      case 'has': return g.kinds.filter((k) => !hasKind(k)).map((k) => shopLink(KIND_CAT[k], suggestEq(k))).join('');
      case 'filled': { if (!S.tank) return ''; const need = S.tank.net * Sim.SAL0; return S.stock.salt < need ? saltLink(need - S.stock.salt) : actBtn('fill', null, t('fillIt')); }
      case 'rock': return shopLink('rock', 'liverock') + shopLink('rock', 'dryrock');
      case 'measured': return testLink(g.p);
      case 'cycled': return itemLink('ammonia') + ['nh3', 'no2', 'no3'].map(testLink).join('');
      case 'stock': {
        const f = g.filter || {};
        const sp = f.category ? Sim.CAT.list.find((x) => x.category === f.category) : null;
        const cat = f.group || (sp ? sp.group : 'fish');
        const item = f.category ? 'c:' + f.category : f.utility ? 'u:' + f.utility : f.cls ? 'k:' + [].concat(f.cls).join(',') : null;
        return shopLink(cat, item, t('shop.' + cat)) + (cat === 'fish' && !(S.stock.food > 0) ? shopLink('basics', 'food') : '');
      }
      case 'range': return testLink(g.p) + (['kh', 'ca', 'mg'].includes(g.p) && !(S.stock['add:' + g.p] > 0) ? shopLink('additives', 'add-' + g.p) : g.p === 'no3' ? wcBtn(20) : '');
      case 'qtFish': return hasKind('qt') ? actBtn('moveAll', 'qt', t('allToQt')) : qtPackLink();
      case 'copperDays': return (S.stock.copper > 0 ? actBtn('copperQt', null, t('copperQt')) : shopLink('additives', 'copper')) + (S.stock['test:cu'] > 0 ? actBtn('measureQt', 'cu', t('measureQtCu')) : shopLink('tests', 't-cu'));
      case 'noDisease': return S.ani.some((a) => a.where === 'qt') ? actBtn('moveAll', 'display', t('allToDisplay')) : '';
      case 'algaeBelow': return shopLink('invertebrate', 'u:algae-eater', t('shop.invertebrate'));
      case 'aiptasiaBelow': return itemLink('aiptasiax') + shopLink('invertebrate', 'u:aiptasia-eater', t('shop.invertebrate'));
      default: return '';
    }
  }
  function salLinks() {
    const m = Sim.lastMeas(S, 'sal');
    if (!m || !hasKind('refractometer')) return '';
    return (m.v < 34.5 ? actBtn('sal', 1, t('salUp')) : '') + (m.v > 35.5 ? actBtn('sal', -1, t('salDown')) : '');
  }
  const tracking = () => !S.ani.length && !!cycleStage();
  const adviceList = () => Sim.advice(S).filter((k) => !(k === 'cycle' && tracking()));
  const linksHtml = (h) => (h ? '<div class="links">' + h + '</div>' : '');
  const stepLinks = (st) => linksHtml([...new Set(st.goals.map(goalLinks).join('').split(/(?=<a |<button )/))].join(''));

  /* ---------- simple view ---------- */
  // A finished mission: offer the next one, or carry on; the card can be closed.
  function doneHtml(m) {
    if (S.mission.hideDone) return '';
    const nx = MISSIONS[MISSIONS.indexOf(m) + 1];
    return '<section class="card mission done"><button class="x" data-act="hideDone" aria-label="' + esc(t('close')) + '">×</button><h2>🏆 ' + esc(tr(m.name)) + '</h2><p>' + esc(t('missionDone')) + '</p>' +
      linksHtml((nx ? actBtn('nextMission', nx.id, t('nextMission', { name: tr(nx.name) }), 'primary') : '') + actBtn('hideDone', null, t('continueFree'))) + '</section>';
  }
  function nextHtml() {
    if (S.tank && viewMode() !== 'simple') return '';
    const m = mission();
    const easy = S.opts.difficulty === 'easy';
    const adv = easy ? adviceList() : [];
    let h = '';
    if (m && !S.mission.done) {
      const st = m.steps[S.mission.step];
      h += '<section class="card mission"><p class="kicker">' + esc(t('nextStep')) + ' · ' + esc(tr(m.name)) + ' · ' + esc(t('step', { n: S.mission.step + 1, m: m.steps.length })) + '</p>' +
        '<h2>' + esc(tr(st.title)) + '</h2><p>' + esc(tr(st.tip)) + '</p>' + stepLinks(st) +
        '<div class="prog" aria-hidden="true">' + m.steps.map((x, i) => '<i class="' + (i < S.mission.step ? 'ok' : i === S.mission.step ? 'cur' : '') + '"></i>').join('') + '</div></section>';
    } else {
      if (m) h += doneHtml(m);
      const k = tracking() ? null : adv.shift();
      if (!tracking()) h += '<section class="card mission"><p class="kicker">' + esc(t('nextStep')) + '</p>' +
        (k ? '<h2>' + esc(t('adv.' + k)) + '</h2>' + linksHtml(adviceLinks(k)) : '<p>' + esc(easy ? t('allGood') : t('routine')) + '</p>') + '</section>';
    }
    if (adv.length) h += '<section class="card advisor"><h2>💡 ' + esc(t('alsoAdvice')) + '</h2><ul>' + adv.slice(0, 4).map((k) => '<li>' + esc(t('adv.' + k)) + linksHtml(adviceLinks(k)) + '</li>').join('') + '</ul></section>';
    return h;
  }
  const qbtn = (a, v, icon, label, small) => '<button class="qbtn" data-act="' + a + '"' + (v != null ? ' data-v="' + esc(v) + '"' : '') + '><span class="qi" aria-hidden="true">' + icon + '</span><b>' + esc(label) + '</b>' + (small ? '<small>' + esc(small) + '</small>' : '') + '</button>';
  const missing = (txt, cat, item) => '<p class="miss">' + esc(txt) + ' <a href="' + shopHref(cat, item) + '">' + esc(t('toShopShort')) + '</a></p>';
  function agoText(m) { const n = Math.floor(S.day) - Math.floor(m.d); return n === 0 ? t('today') : t('ago', { n }); }
  const measureTile = (p, qt) => {
    const m = Sim.lastMeas(S, p, qt ? { qt: true } : null);
    const label = qt ? t('measureQtCu') : p === 'sal' ? t('salinity') : PNAME[p];
    return qbtn(qt ? 'measureQt' : 'measureP', p, '🧪', label, (m ? t('lastV', { v: fmtVal(p, m.v), ago: agoText(m) }) : t('never')) + (p === 'sal' ? '' : ' · ' + S.stock['test:' + p]));
  };
  const testsOwned = () => PARAMS.filter((p) => (p === 'sal' ? hasKind('refractometer') : S.stock['test:' + p] > 0));
  function quickHtml() {
    const head = '<h2>' + esc(t('quick')) + '</h2>';
    if (!S.tank.filled) {
      const need = S.tank.net * Sim.SAL0;
      return head + '<p>' + esc(t('empty')) + '</p>' + linksHtml((S.stock.salt >= need ? actBtn('fill', null, t('fillIt'), 'primary') : saltLink(need - S.stock.salt)) + (hasKind('refractometer') ? '' : shopLink('other', 'refracto')));
    }
    const b = [];
    const miss = [];
    const fish = S.ani.some((a) => Sim.CAT.species[a.sp].cls === 'fish');
    if (S.stock.food > 0) b.push(qbtn('feed', 'normal', '🍤', t('feedNow'), t('have', { n: S.stock.food })));
    else if (fish) miss.push(missing(t('missingFood'), 'basics', 'food'));
    if (S.stock.coralfood > 0 && S.ani.some((a) => ['nps', 'lps', 'anemone'].includes(Sim.CAT.species[a.sp].cls))) b.push(qbtn('coralFeed', null, '🪸', t('coralFeed'), t('have', { n: S.stock.coralfood })));
    const lack = S.tank.net - S.w.level;
    if (lack > S.tank.net * 0.005) b.push(qbtn('topoff', null, '🚰', t('topOff'), '+' + t('liters', { n: num(Math.round(lack * 10) / 10) })));
    const g = S.w.level * 0.1 * Sim.SAL0;
    if (S.stock.salt >= g) b.push(qbtn('wcP', 10, '💧', t('wcQuick', { n: 10 }), t('liters', { n: Math.round(S.w.level * 0.1) })));
    else miss.push(missing(t('missingSalt'), 'basics', 'salt4'));
    if (hasKind('sock') && S.day - S.media.sock > 7) b.push(qbtn('sock', null, '🧦', t('sockIt'), t('sockAge', { n: Math.floor(S.day - S.media.sock) })));
    const ms = Sim.lastMeas(S, 'sal');
    if (ms && hasKind('refractometer')) {
      if (ms.v < 34.5) b.push(qbtn('sal', 1, '🧂', t('salUp'), fmtVal('sal', ms.v)));
      if (ms.v > 35.5) b.push(qbtn('sal', -1, '🚰', t('salDown'), fmtVal('sal', ms.v)));
    }
    const tests = testsOwned();
    tests.forEach((p) => b.push(measureTile(p)));
    if (!tests.length) miss.push(missing(t('missingTest'), 'tests'));
    return head + '<div class="qgrid">' + b.join('') + '</div>' + miss.join('');
  }
  /* ---------- full view ---------- */
  function holidayHtml() {
    if (!S.ev.holiday || !S.ev.holiday.pending) return '';
    return '<section class="card alert"><h2>' + esc(t('holidayTitle')) + '</h2><p>' + esc(t('holidayText')) + '</p><div class="btns">' +
      ['feeder', 'neighbor', 'none'].map((c) => '<button class="btn" data-act="holiday" data-v="' + c + '">' + esc(t('hol.' + c)) + '</button>').join('') + '</div></section>';
  }
  function missionHtml() {
    const m = mission();
    if (!m) return '';
    if (S.mission.done) return doneHtml(m);
    const st = m.steps[S.mission.step];
    return '<section class="card mission"><p class="kicker">' + esc(t('mission')) + ' · ' + esc(tr(m.name)) + ' · ' + esc(t('step', { n: S.mission.step + 1, m: m.steps.length })) + '</p>' +
      '<h2>' + esc(tr(st.title)) + '</h2><p>' + esc(tr(st.tip)) + '</p>' + stepLinks(st) +
      '<ol class="steps">' + m.steps.map((x, i) => '<li class="' + (i < S.mission.step ? 'ok' : i === S.mission.step ? 'cur' : '') + '">' + esc(tr(x.title)) + '</li>').join('') + '</ol></section>';
  }
  function advisorHtml() {
    if (S.opts.difficulty !== 'easy') return '';
    const a = adviceList();
    return '<section class="card advisor"><h2>💡 ' + esc(t('advisor')) + '</h2>' + (a.length ? '<ul>' + a.slice(0, 5).map((k) => '<li>' + esc(t('adv.' + k)) + linksHtml(adviceLinks(k)) + '</li>').join('') + '</ul>' : '<p>' + esc(t('allGood')) + '</p>') + '</section>';
  }
  // Only what the player has: tests and supplements in stock, the sock if there is one. Measuring and using are tiles.
  const USE_ICON = { bacteria: '🦠', ammonia: '⚗️', carbon: '⬛', gfo: '🟫', aiptasiax: '💉', copper: '💊' };
  function renderActions() {
    const el = $('#actions');
    if (!el) return;
    const keep = {};
    ['wcPct', 'doseK', 'doseMl'].forEach((id) => { const x = $('#' + id); if (x) keep[id] = x.value; });
    if (!S.tank.filled) {
      const need = S.tank.net * Sim.SAL0;
      el.innerHTML = '<h2>' + esc(t('actions')) + '</h2><p>' + esc(t('empty')) + '</p>' + (S.stock.salt >= need ? '<button class="btn primary" data-act="fill">' + esc(t('fill')) + '</button>' : linksHtml(saltLink(need - S.stock.salt))) +
        (hasKind('refractometer') ? '' : linksHtml(shopLink('other', 'refracto')));
      return;
    }
    const hasQt = hasKind('qt');
    const tests = testsOwned();
    const adds = ['kh', 'ca', 'mg'].filter((k) => S.stock['add:' + k] > 0);
    const items = ['bacteria', 'ammonia', 'carbon', 'gfo', 'aiptasiax', 'copper'].filter((k) => S.stock[k] > 0);
    const miss = (txt, cat, item) => '<span class="muted small">' + esc(txt) + '</span> <a class="small" href="' + shopHref(cat, item) + '">' + esc(t('toShopShort')) + '</a>';
    const row = (lbl, inner) => '<div class="row"><span class="lbl">' + lbl + '</span>' + inner + '</div>';
    const go = (a) => '<button class="btn" data-act="' + a + '">' + esc(t('doIt')) + '</button>';
    let h = '<h2>' + esc(t('actions')) + '</h2>';
    h += row('🍤 ' + esc(t('feed')), (S.stock.food > 0 ? ['small', 'normal', 'large'].map((x) => '<button class="btn" data-act="feed" data-v="' + x + '">' + esc(t('feed.' + x)) + '</button>').join('') : miss(t('missingFood'), 'basics', 'food')) +
      (S.stock.coralfood > 0 ? '<button class="btn" data-act="coralFeed">' + esc(t('coralFeed')) + '</button>' : ''));
    h += row('💧 ' + esc(t('waterChange')), (S.stock.salt > 0 ? '<select id="wcPct">' + [5, 10, 15, 20, 25, 30, 50].map((p) => '<option value="' + p + '"' + (p === 10 ? ' selected' : '') + '>' + p + '%</option>').join('') + '</select>' + go('wc') : miss(t('missingSalt'), 'basics', 'salt4')) +
      '<button class="btn" data-act="topoff">' + esc(t('topOff')) + '</button>' +
      (hasKind('refractometer') ? '<button class="btn" data-act="sal" data-v="1">' + esc(t('salUp')) + '</button><button class="btn" data-act="sal" data-v="-1">' + esc(t('salDown')) + '</button>' : ''));
    if (adds.length) h += row('⚗️ ' + esc(t('dose')), '<select id="doseK">' + adds.map((k) => '<option value="' + k + '">' + esc(t('add.' + k)) + ' (' + Math.round(S.stock['add:' + k]) + ' ml)</option>').join('') + '</select>' +
      '<input id="doseMl" type="number" min="1" max="200" value="10" inputmode="numeric" aria-label="ml"> ml' + go('dose'));
    if (hasKind('sock')) h += row('🧦 ' + esc(t('filtration')), '<button class="btn" data-act="sock">' + esc(t('sockChange')) + '</button>');
    const mt = tests.map((p) => measureTile(p));
    if (hasQt && S.stock['test:cu'] > 0) mt.push(measureTile('cu', true));
    h += '<h3>🧪 ' + esc(t('measure')) + '</h3>' + (mt.length ? '<div class="qgrid">' + mt.join('') + '</div>' : '<p>' + miss(t('missingTest'), 'tests') + '</p>');
    if (items.length) {
      const ut = [];
      items.forEach((k) => {
        if (k === 'copper' && hasQt) ut.push(qbtn('copperQt', null, USE_ICON.copper, t('copperQt'), t('have', { n: S.stock[k] })));
        ut.push(qbtn('useItem', k, USE_ICON[k], t('item.' + k) + (k === 'copper' ? ' → ' + t('display') : ''), t('have', { n: S.stock[k] })));
      });
      h += '<h3>🧴 ' + esc(t('use')) + '</h3><div class="qgrid">' + ut.join('') + '</div>';
    }
    el.innerHTML = h;
    Object.keys(keep).forEach((id) => { const x = $('#' + id); if (x && (!x.options || [...x.options].some((o) => o.value === keep[id]))) x.value = keep[id]; });
  }
  function measuresHtml() {
    const shown = PARAMS.filter((p) => (p === 'sal' ? hasKind('refractometer') : S.stock['test:' + p] > 0) || Sim.lastMeas(S, p));
    const rows = shown.map((p) => {
      const m = Sim.lastMeas(S, p);
      return '<tr><th>' + esc(p === 'sal' ? t('salinity') : PNAME[p]) + '</th><td>' + (m ? esc(fmtVal(p, m.v)) : '<span class="muted">' + esc(t('never')) + '</span>') + '</td><td class="muted">' + (m ? esc(agoText(m)) : '') + '</td>' +
        '<td class="muted">' + (p === 'sal' ? '' : esc(t('have', { n: S.stock['test:' + p] || 0 }))) + '</td></tr>';
    }).join('');
    const qtCu = Sim.lastMeas(S, 'cu', { qt: true });
    const st = S.stock;
    const stockRows = [['salt', Math.round(st.salt / 100) / 10 + ' kg'], ['food', st.food], ['coralfood', st.coralfood], ['add.kh', Math.round(st['add:kh']) + ' ml'], ['add.ca', Math.round(st['add:ca']) + ' ml'], ['add.mg', Math.round(st['add:mg']) + ' ml'],
      ['item.bacteria', st.bacteria], ['item.ammonia', st.ammonia], ['item.carbon', st.carbon], ['item.gfo', st.gfo], ['item.copper', st.copper], ['item.aiptasiax', st.aiptasiax], ['item.dip', st.dip]]
      .filter(([, v]) => v && v !== '0 ml' && v !== '0 kg').map(([k, v]) => '<span class="pill">' + esc(k === 'salt' ? (lang === 'hu' ? 'Só' : 'Salt') : k === 'food' ? (lang === 'hu' ? 'Haltáp' : 'Fish food') : k === 'coralfood' ? (lang === 'hu' ? 'Korallkaja' : 'Coral food') : t(k)) + ': <b>' + esc(v) + '</b></span>').join('');
    return '<section class="card"><h2>🧪 ' + esc(t('measurements')) + '</h2>' + (rows ? '<table class="meas">' + rows + '</table>' : '<p class="muted">' + esc(t('missingTest')) + ' <a href="' + shopHref('tests') + '">' + esc(t('toShopShort')) + '</a></p>') +
      (qtCu ? '<p class="muted small">' + esc(t('qt')) + ' Cu: ' + esc(fmtVal('cu', qtCu.v)) + '</p>' : '') +
      '<h3>' + esc(t('stock')) + '</h3><div class="pills">' + (stockRows || '<span class="muted">–</span>') + '</div></section>';
  }
  const thumbOf = (sp) => { const im = Sim.CAT.species[sp].sp.image; return im ? im.thumb_500 || im.url : ''; };
  const aName = (a) => (a.name ? esc(a.name) + ' <span class="muted small">' + esc(spName(a.sp)) + '</span>' : esc(spName(a.sp)));
  function hungerTag(a) {
    const st = Sim.CAT.species[a.sp];
    if (!st.hunger || kLvl(a.sp) < 1) return '';
    return a.hunger > 85 ? '<span class="tag bad">' + esc(t('thin')) + '</span>' : a.hunger > 60 ? '<span class="tag hard">' + esc(t('hungry2')) + '</span>' : '';
  }
  function animalsHtml() {
    const easy = S.opts.difficulty === 'easy';
    const simple = viewMode() === 'simple';
    const list = S.ani.slice().sort((a, b) => (a.where === b.where ? 0 : a.where === 'qt' ? 1 : -1));
    if (!list.length) return '<section class="card"><h2>🐠 ' + esc(t('animals')) + '</h2><p class="muted">' + esc(t('noAnimals')) + '</p>' + (S.tank.filled ? linksHtml(shopLink('invertebrate', 'u:algae-eater', t('shop.invertebrate')) + shopLink('fish')) : '') + '</section>';
    const hasQt = hasKind('qt');
    const fish = list.filter((a) => Sim.CAT.species[a.sp].cls === 'fish');
    const bulk = hasQt && fish.length ? '<p class="acts">' + (fish.some((a) => a.where === 'display') ? '<button class="link" data-act="moveAll" data-v="qt">' + esc(t('allToQt')) + '</button> ' : '') +
      (fish.some((a) => a.where === 'qt') ? '<button class="link" data-act="moveAll" data-v="display">' + esc(t('allToDisplay')) + '</button>' : '') + '</p>' : '';
    return '<section class="card"><h2>🐠 ' + esc(t('animals')) + ' (' + list.length + ')</h2>' + bulk + '<ul class="ani">' + list.map((a) => {
      const st = Sim.CAT.species[a.sp];
      const syms = Sim.symptoms(S, a).map((k) => symText(k, a)).filter(Boolean);
      const h = Math.round(a.health / 5) * 5;
      const bar = easy || kLvl(a.sp) >= 3 ? '<span class="hbar" title="' + esc(t('health')) + ' ' + h + '%"><i style="width:' + h + '%" class="' + (h > 60 ? 'ok' : h > 30 ? 'mid' : 'low') + '"></i></span>' : '';
      const acts = [];
      if (st.cls === 'fish' && hasQt) acts.push('<button class="link" data-act="move" data-uid="' + a.uid + '" data-v="' + (a.where === 'qt' ? 'display' : 'qt') + '">' + esc(a.where === 'qt' ? t('toDisplay') : t('toQt')) + '</button>');
      if (st.category === 'zoanthids' && S.stock.dip > 0) acts.push('<button class="link" data-act="dip" data-uid="' + a.uid + '">' + esc(t('dipIt')) + '</button>');
      if (!simple) acts.push('<button class="link" data-act="rehome" data-uid="' + a.uid + '">' + esc(t('rehome')) + '</button>');
      const src = thumbOf(a.sp);
      return '<li class="ani-row">' + (src ? '<img class="athumb" src="' + esc(src) + '" alt="" loading="lazy" decoding="async">' : '<span class="athumb"></span>') + '<div class="ani-main"><div class="ani-head"><button class="aname" data-act="animal" data-uid="' + a.uid + '">' + aName(a) + '</button>' +
        (a.where === 'qt' ? ' <span class="tag">' + esc(t('qt')) + '</span>' : '') + hungerTag(a) + bar + '</div>' +
        '<p class="sym">' + esc(syms.length ? syms.join(' · ') : t('looksFine')) + '</p>' + (acts.length ? '<p class="acts">' + acts.join(' · ') + '</p>' : '') + '</div></li>';
    }).join('') + '</ul></section>';
  }
  const grpOf = (sp) => { const c = Sim.CAT.species[sp].cls; return c === 'fish' ? 'fish' : ['invert', 'anemone', 'clam'].includes(c) ? 'invert' : 'coral'; };
  function symText(k, a) {
    const w = S.w;
    if (k === 'temp') k = w.temp > 26 ? 'tempHigh' : 'tempLow';
    if (k === 'no3' && w.no3 < 1) return t('sym.no3Low');
    if (k === 'po4' && w.po4 < 0.02) return t('sym.po4Low');
    if (k === 'hunger' && a.hunger < 60) return '';
    const g = 'sym.' + k + '.' + grpOf(a.sp);
    return T[g] ? t(g) : T['sym.' + k] ? t('sym.' + k) : '';
  }
  function equipHtml() {
    const items = S.eq.map((e) => {
      const it = Sim.CAT.eq[e.id];
      const bad = e.state === 'broken';
      const btn = bad ? '<button class="link" data-act="repair" data-uid="' + e.uid + '">' + esc(t('repair', { n: Math.round(it.price * 0.4) })) + '</button>'
        : ['heater', 'ato', 'pump'].includes(it.kind) ? '<button class="link" data-act="check" data-uid="' + e.uid + '">' + esc(t('check')) + '</button>' : '';
      return '<li' + (bad ? ' class="bad"' : '') + '><span>' + esc(tr(it.name)) + (bad ? ' – <b>' + esc(t('st.broken')) + '</b>' : '') + '</span>' + btn + '</li>';
    }).join('');
    const md = [];
    if (S.rockKg) md.push(t('rock', { n: S.rockKg }));
    if (S.media.carbon > 0) md.push(t('carbonLeft', { n: Math.ceil(S.media.carbon) }));
    if (S.media.gfo > 0) md.push(t('gfoLeft', { n: Math.ceil(S.media.gfo) }));
    if (S.eq.some((x) => Sim.CAT.eq[x.id].kind === 'sock')) md.push(t('sockAge', { n: Math.max(0, Math.floor(S.day - S.media.sock)) }));
    return '<section class="card"><h2>🔧 ' + esc(t('equipment')) + '</h2>' + (items ? '<ul class="eq">' + items + '</ul>' : '<p class="muted">' + esc(t('noEq')) + '</p>') +
      (md.length ? '<p class="muted small">' + esc(md.join(' · ')) + '</p>' : '') + '</section>';
  }
  function renderSettings() {
    const el = $('#settings');
    if (!el) return;
    const doser = hasKind('doser');
    el.hidden = !(doser || hasKind('heater') || hasKind('light'));
    el.innerHTML = '<h2>⚙️ ' + esc(t('settings')) + '</h2><form id="setForm" class="setf">' +
      (hasKind('heater') ? '<label>' + esc(t('heaterSet')) + '<input name="heater" type="number" step="0.5" min="20" max="30" value="' + S.set.heater + '"></label>' : '') +
      (hasKind('light') ? '<label>' + esc(t('lightHours')) + '<input name="light" type="number" step="1" min="0" max="14" value="' + S.set.light + '"></label>' : '') +
      (doser ? ['kh', 'ca', 'mg'].map((k) => '<label>' + esc(t('doser')) + ' – ' + esc(t('add.' + k)) + '<input name="d-' + k + '" type="number" step="1" min="0" max="200" value="' + S.set.dose[k] + '"></label>').join('') : '') +
      '<button class="btn" type="submit">' + esc(t('save')) + '</button></form>';
  }

  /* ---------- cycle tracker ---------- */
  // The stages of a fishless cycle, read from the player's own measurements; reached stages are remembered in S.cyc.
  function cycleStage() {
    if (!S.tank || !S.tank.filled || S.cycleDone) return null;
    const f = S.tank.filledDay;
    const ms = (p) => S.meas.filter((m) => m.p === p && !m.qt && m.d >= f);
    const nh = ms('nh3');
    const n2 = ms('no2');
    const c = S.cyc || (S.cyc = {});
    if (c.t2 == null) { const m = nh.find((x) => x.v >= 0.25); if (m) c.t2 = m.d; }
    if (c.t2 != null && c.t3 == null) { const m = n2.find((x) => x.d >= c.t2 && x.v >= 0.25); if (m) c.t3 = m.d; }
    if (c.t3 != null && c.t4 == null) {
      const m = nh.find((x) => x.d > c.t3 && x.v <= 0.05 && n2.some((y) => y.d > c.t3 && Math.abs(y.d - x.d) <= 1 && y.v <= 0.1));
      if (m) c.t4 = m.d;
    }
    const dose = S.lastDose;
    if (c.t4 != null && c.t5 == null && dose != null && dose >= c.t4) {
      const m = nh.find((x) => x.d - dose >= 0.7 && x.d - dose <= 2.5 && x.v <= 0.25);
      if (m) c.t5 = m.d;
    }
    if (c.t5 != null && S.lastWc && S.lastWc.d >= c.t5 && S.lastWc.pct >= 0.29) {
      S.cycleDone = true;
      toast(t('cycleDone'));
      return null;
    }
    const src = dose != null && dose >= f;
    return { c, nh, n2, step: !src ? 0 : c.t2 == null ? 1 : c.t3 == null ? 2 : c.t4 == null ? 3 : c.t5 == null ? 4 : 5 };
  }
  function spark(p, arr) {
    if (!arr.length) return '';
    const W = 120; const H = 28;
    const x0 = arr[0].d; const x1 = Math.max(x0 + 1, arr[arr.length - 1].d);
    const hi = Math.max(...arr.map((m) => m.v)) || 1;
    const pts = arr.map((m) => ((m.d - x0) / (x1 - x0) * (W - 4) + 2).toFixed(1) + ',' + (H - 3 - m.v / hi * (H - 6)).toFixed(1)).join(' ');
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><polyline points="' + pts + '" fill="none" stroke="' + TEST_COL[p] + '" stroke-width="2"/></svg>';
  }
  function cycleHtml() {
    if (S.ani.length) return '';
    const cs = cycleStage();
    if (!cs) return '';
    const { c, nh, n2 } = cs;
    const lnh = nh[nh.length - 1];
    const dose = S.lastDose;
    const amm = itemLink('ammonia');
    const ghost = S.stock.food > 0 ? actBtn('feed', 'large', t('feedGhost')) : '';
    const lowNh = lnh && lnh.v < 0.5 && S.day - lnh.d < 1.5;
    let todo = '';
    let btn = '';
    switch (cs.step) {
      case 0: todo = t('todo.start'); btn = amm + ghost; break;
      case 1:
        if (!lnh || lnh.d < dose) { todo = t('todo.measure1'); btn = testLink('nh3'); } else { todo = t('todo.more'); btn = (S.doseKind === 'food' ? ghost : '') + amm + testLink('nh3'); }
        break;
      case 2: todo = t('todo.wait2'); btn = testLink('nh3') + testLink('no2') + (lowNh ? (S.doseKind === 'food' ? ghost : amm) : ''); break;
      case 3: todo = t('todo.wait3'); btn = testLink('nh3') + testLink('no2') + (lowNh ? (S.doseKind === 'food' ? ghost : amm) : ''); break;
      case 4: {
        const tested = dose != null && dose >= c.t4;
        const after = tested ? nh.filter((x) => x.d - dose >= 0.7) : [];
        if (tested && S.day - dose < 0.7) todo = t('todo.testWait');
        else if (tested && after.length && after[after.length - 1].v > 0.25) { todo = t('todo.testFail', { v: fmtVal('nh3', after[after.length - 1].v) }); btn = S.doseKind === 'food' ? ghost : amm; }
        else if (tested && S.day - dose <= 2.5) { todo = t('todo.testMeasure'); btn = testLink('nh3'); }
        else { todo = t(S.doseKind === 'food' ? 'todo.testFood' : 'todo.test'); btn = S.doseKind === 'food' ? ghost : amm; }
        break;
      }
      default: todo = t('todo.wc'); btn = wcBtn(30) + wcBtn(50);
    }
    const steps = [1, 2, 3, 4, 5, 6].map((i) => '<li class="' + (i <= cs.step ? 'ok' : i === cs.step + 1 ? 'cur' : '') + '">' + esc(t('cyc.' + i)) + '</li>').join('');
    const lines = ['nh3', 'no2', 'no3'].map((p) => {
      const arr = S.meas.filter((m) => m.p === p && !m.qt && m.d >= S.tank.filledDay);
      const l = arr[arr.length - 1];
      return '<div class="cline"><b style="color:' + TEST_COL[p] + '">' + PNAME[p] + '</b>' + spark(p, arr) + '<span class="small">' + (l ? esc(fmtVal(p, l.v)) + ' <span class="muted">' + esc(agoText(l)) + '</span>' : '<span class="muted">' + esc(t('never')) + '</span>') + '</span></div>';
    }).join('');
    return '<section class="card cycle"><p class="kicker">🦠 ' + esc(t('cycle')) + '</p><p class="small muted">' + esc(t('cycleLead')) + '</p><ol class="csteps">' + steps + '</ol>' +
      '<div class="todo"><b>' + esc(t('cycleToday')) + ':</b> ' + esc(todo) + linksHtml(btn) + '</div><div class="clines">' + lines + '</div></section>';
  }
  /* ---------- first-run tour ---------- */
  const TOUR_KEY = 'reef42-reefgame-tour';
  const TOUR = [['#hud .ctl', 'tour.1'], ['.viewbar', 'tour.2'], ['#next .mission, #mission .mission, #cycle .card, #actions', 'tour.3'], ['#tabs a[href="#/shop"]', 'tour.4'], ['.menubtn', 'tour.5']];
  let tourEl = null;
  function endTour() {
    if (!tourEl) return;
    tourEl.remove();
    tourEl = null;
    window.removeEventListener('resize', placeTour);
    window.removeEventListener('scroll', placeTour);
    ls(false, TOUR_KEY, '1');
  }
  let tourStep = 0;
  let tourSteps = [];
  function placeTour() {
    if (!tourEl) return;
    const [sel, key] = tourSteps[tourStep];
    const el = document.querySelector(sel);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const hole = tourEl.querySelector('.tour-hole');
    Object.assign(hole.style, { left: r.left - 6 + 'px', top: r.top - 6 + 'px', width: r.width + 12 + 'px', height: r.height + 12 + 'px' });
    const tip = tourEl.querySelector('.tour-tip');
    tip.querySelector('p').textContent = t(key);
    tip.querySelector('.tour-n').textContent = t('of', { a: tourStep + 1, b: tourSteps.length });
    tip.querySelector('[data-t=next]').textContent = tourStep === tourSteps.length - 1 ? t('tourDone') : t('tourNext');
    const tw = Math.min(320, window.innerWidth - 24);
    tip.style.width = tw + 'px';
    tip.style.left = Math.max(12, Math.min(window.innerWidth - tw - 12, r.left + r.width / 2 - tw / 2)) + 'px';
    const below = r.bottom + 14 + tip.offsetHeight < window.innerHeight;
    tip.style.top = (below ? r.bottom + 14 : Math.max(12, r.top - tip.offsetHeight - 14)) + 'px';
  }
  function showTour() {
    const el = document.querySelector(tourSteps[tourStep][0]);
    if (el && el.scrollIntoView) {
      const r = el.getBoundingClientRect();
      if (r.top < 80 || r.bottom > window.innerHeight - 160) el.scrollIntoView({ block: 'center' });
    }
    placeTour();
  }
  function startTour() {
    if (!S) return;
    if (route().view !== 'tank') { location.hash = '#/tank'; setTimeout(startTour, 300); return; }
    endTour();
    tourSteps = TOUR.filter(([sel]) => { const el = document.querySelector(sel); return el && el.getBoundingClientRect().height > 0; });
    if (!tourSteps.length) return;
    tourStep = 0;
    tourEl = document.createElement('div');
    tourEl.className = 'tour-layer';
    tourEl.innerHTML = '<div class="tour-hole"></div><div class="tour-tip" role="dialog" aria-modal="false"><span class="tour-n kicker"></span><p></p><div class="btns">' +
      '<button type="button" class="btn" data-t="skip">' + esc(t('tourSkip')) + '</button><button type="button" class="btn primary" data-t="next"></button></div></div>';
    document.body.appendChild(tourEl);
    tourEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-t]');
      if (!b) return;
      if (b.dataset.t === 'skip' || tourStep === tourSteps.length - 1) { endTour(); return; }
      tourStep++;
      showTour();
    });
    window.addEventListener('resize', placeTour);
    window.addEventListener('scroll', placeTour, { passive: true });
    showTour();
    tourEl.querySelector('[data-t=next]').focus();
  }

  /* ---------- knowledge, animal profile, quiz ---------- */
  // Knowledge per species, kept across games: a point per week a species lives with you (max 4), 2 per passed quiz (max 2 quizzes).
  const KNOW_KEY = 'reef42-reefgame-know';
  const KNOW = (() => { try { return JSON.parse(ls(true, KNOW_KEY) || '{}') || {}; } catch (e) { return {}; } })();
  const saveKnow = () => ls(false, KNOW_KEY, JSON.stringify(KNOW));
  const kOf = (sp) => KNOW[sp] || (KNOW[sp] = { time: 0, quiz: 0 });
  const kPts = (sp) => { const k = KNOW[sp]; return k ? Math.min(6, (k.time || 0) + (k.quiz || 0) * 2) : 0; };
  const kLvl = (sp) => { const p = kPts(sp); return p >= 6 ? 3 : p >= 4 ? 2 : p >= 2 ? 1 : 0; };
  function updateKnow() {
    if (!S) return;
    let ch = false;
    S.ani.forEach((a) => {
      const w = Math.min(4, Math.floor((S.day - a.added) / 7));
      if (w > 0 && w > (kOf(a.sp).time || 0)) { KNOW[a.sp].time = w; ch = true; }
    });
    if (ch) saveKnow();
  }
  const quizKey = () => S.created + ':' + Math.floor(S.day);
  function profileHtml(a) {
    const st = Sim.CAT.species[a.sp];
    const s = st.sp;
    const im = s.image;
    const lvl = kLvl(a.sp);
    const syms = Sim.symptoms(S, a).map((k) => symText(k, a)).filter(Boolean);
    const fact = (k, v) => (v ? '<tr><th>' + esc(t(k)) + '</th><td>' + esc(v) + '</td></tr>' : '');
    const size = s.size_cm ? (s.size_cm.min && s.size_cm.min !== s.size_cm.max ? s.size_cm.min + '–' : '') + (s.size_cm.max || s.size_cm.min) + ' cm' : '';
    const k = KNOW[a.sp] || {};
    let feed = '';
    if (lvl >= 1) feed = st.hunger ? (a.hunger > 85 ? t('thin') : a.hunger > 60 ? t('hungry2') : t('fed')) : t('feedsLight');
    const bother = Object.keys(a.st || {}).filter((x) => a.st[x] > 0.3 && T['bk.' + x]).map((x) => t('bk.' + x));
    const lines = [
      lvl >= 1 ? '✅ ' + esc(feed) : '🔒 ' + esc(t('know.1')),
      lvl >= 2 ? '✅ ' + esc(bother.length ? t('bothers', { list: bother.join(', ') }) : t('nothingBothers')) : '🔒 ' + esc(t('know.2')),
      lvl >= 3 ? '✅ ' + esc(t('condition', { n: Math.round(a.health) })) : '🔒 ' + esc(t('know.3'))
    ];
    const canQuiz = (k.quiz || 0) < 2 && k.qAt !== quizKey();
    return (im ? '<figure class="aphoto"><img src="' + esc(im.thumb_960 || im.thumb_500 || im.url) + '" alt=""><figcaption><a href="' + esc(im.page || im.url) + '" target="_blank" rel="noopener">' + esc(t('photo')) + ': ' + esc(im.author || '') + (im.license ? ', ' + esc(im.license) : '') + '</a></figcaption></figure>' : '') +
      '<p class="muted small">' + esc(spName(a.sp)) + ' · <i>' + esc(s.scientific_name) + '</i> · ' + esc(t('withYou', { n: Math.max(0, Math.floor(S.day - a.added)) })) + (a.where === 'qt' ? ' · ' + esc(t('qt')) : '') + '</p>' +
      '<div class="namerow"><label for="aName">' + esc(t('nameIt')) + '</label><input id="aName" maxlength="30" value="' + esc(a.name || '') + '" placeholder="' + esc(t('namePh')) + '"><button type="button" class="btn" data-k="rename">' + esc(t('save')) + '</button></div>' +
      '<h3>' + esc(t('nowL')) + '</h3><p>' + esc(syms.length ? syms.join(' · ') : t('looksFine')) + '</p>' +
      '<h3>' + esc(t('knowL', { n: lvl })) + '</h3><ul class="know">' + lines.map((x) => '<li>' + x + '</li>').join('') + '</ul><p class="small muted">' + esc(t('knowPts', { p: kPts(a.sp) })) + '</p>' +
      ((k.quiz || 0) >= 2 ? '<p class="small">' + esc(t('quizMax')) + '</p>' : canQuiz ? '<button type="button" class="btn primary" data-k="quiz">🎓 ' + esc(t('quizBtn')) + '</button>' : '<p class="small">' + esc(t('quizToday')) + '</p>') +
      '<h3>' + esc(t('profile')) + '</h3><table class="facts">' + fact('size', size) + fact('difficultyL', t('diff.' + s.difficulty)) + fact('minTankL', s.tank_min_l ? t('liters', { n: s.tank_min_l }) : '') +
      fact('reefSafety', s.reef_safety ? t('rs.' + s.reef_safety) : '') + fact('feeding', tr(s.feeding)) + fact('behavior', tr(s.behavior)) + fact('notesL', tr(s.notes)) + '</table>' +
      '<p><a href="../species/#/' + encodeURIComponent(a.sp) + '" target="_blank" rel="noopener">' + esc(t('speciesCard')) + ' ↗</a></p>';
  }
  const shuffle = (arr) => { const x = arr.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
  const feedHead = (s) => { const f = tr(s.feeding); return f ? f.split(/[:;.–-]/)[0].trim() : ''; };
  // Three questions from the species card; wrong answers come from other species of the same group.
  function quizFor(sp) {
    const st = Sim.CAT.species[sp];
    const s = st.sp;
    const pool = shuffle(Sim.CAT.list.filter((x) => x.group === st.group && x.id !== sp)).map((x) => x.sp);
    const qs = [];
    const far = (a, b) => Math.abs(a - b) / Math.max(a, b) > 0.3;
    const opts = (right, others) => { const o = [right]; others.forEach((v) => { if (o.length < 3 && !o.includes(v)) o.push(v); }); return o.length === 3 ? shuffle(o) : null; };
    const max = s.size_cm && s.size_cm.max;
    if (max) { const o = opts(max, pool.map((x) => x.size_cm && x.size_cm.max).filter((v) => v && far(v, max))); if (o) qs.push({ q: 'q.size', o: o.map((v) => t('cm', { n: v })), a: t('cm', { n: max }) }); }
    if (s.tank_min_l) { const o = opts(s.tank_min_l, pool.map((x) => x.tank_min_l).filter((v) => v && far(v, s.tank_min_l))); if (o) qs.push({ q: 'q.tank', o: o.map((v) => t('liters', { n: v })), a: t('liters', { n: s.tank_min_l }) }); }
    if (s.reef_safety) qs.push({ q: 'q.reef', o: ['reef-safe', 'with-caution', 'not-reef-safe'].map((v) => t('rs.' + v)), a: t('rs.' + s.reef_safety) });
    if (s.difficulty) qs.push({ q: 'q.diff', o: ['easy', 'moderate', 'difficult', 'expert'].map((v) => t('diff.' + v)), a: t('diff.' + s.difficulty) });
    const fh = feedHead(s);
    if (fh && fh.length < 60) { const o = opts(fh, pool.map(feedHead).filter((v) => v && v.length < 60 && v.toLowerCase().slice(0, 4) !== fh.toLowerCase().slice(0, 4))); if (o) qs.push({ q: 'q.feed', o, a: fh }); }
    return shuffle(qs).slice(0, 3);
  }
  function quizHtml(qs) {
    return '<p class="small muted">' + esc(t('quizLead')) + '</p>' + qs.map((q, i) => '<fieldset class="quiz"><legend>' + (i + 1) + '. ' + esc(t(q.q)) + '</legend>' +
      q.o.map((o) => '<label><input type="radio" name="q' + i + '" value="' + esc(o) + '"> ' + esc(o) + '</label>').join('') + '</fieldset>').join('') +
      '<div class="btns"><button type="button" class="btn" data-k="back">' + esc(t('back2')) + '</button><button type="button" class="btn primary" data-k="check">' + esc(t('quizCheck')) + '</button></div>';
  }
  function openAnimal(uid) {
    const a = S.ani.find((x) => x.uid === uid);
    if (!a) return;
    let qs = null;
    modal(a.name || spName(a.sp), profileHtml(a), [{ label: t('close'), value: '' }], (d) => {
      const body = d.querySelector('.mbody');
      const head = d.querySelector('header h2');
      const rename = () => {
        const v = (d.querySelector('#aName').value || '').trim().slice(0, 30);
        if (v) a.name = v; else delete a.name;
        head.textContent = a.name || spName(a.sp);
        save(); refreshTank(true); toast(t('named'));
      };
      d.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'aName') { e.preventDefault(); rename(); } });
      body.addEventListener('click', (e) => {
        const b = e.target.closest('[data-k]');
        if (!b) return;
        const k = b.dataset.k;
        if (k === 'rename') rename();
        else if (k === 'quiz') { qs = quizFor(a.sp); body.innerHTML = quizHtml(qs); body.scrollTop = 0; }
        else if (k === 'back') body.innerHTML = profileHtml(a);
        else if (k === 'check') {
          let n = 0;
          qs.forEach((q, i) => {
            const sel = body.querySelector('input[name="q' + i + '"]:checked');
            body.querySelectorAll('input[name="q' + i + '"]').forEach((inp) => { const l = inp.parentElement; if (inp.value === q.a) l.classList.add('right'); else if (inp.checked) l.classList.add('wrong'); inp.disabled = true; });
            if (sel && sel.value === q.a) n++;
          });
          const kn = kOf(a.sp);
          kn.qAt = quizKey();
          const okq = n >= 2;
          if (okq) kn.quiz = Math.min(2, (kn.quiz || 0) + 1);
          saveKnow();
          b.remove();
          body.insertAdjacentHTML('beforeend', '<p class="qres ' + (okq ? 'good' : 'bad') + '">' + esc(t(okq ? 'quizOk' : 'quizFail', { n })) + '</p>');
          refreshTank(true);
        }
      });
    });
  }

  /* ---------- scene ---------- */
  let sceneKey = '';
  const swim = {};
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
  const FISH_COL = { clownfish: ['#f47b20', '#fff'], surgeonfish: null, angelfish: null, butterflyfish: ['#f5d33b', '#222'], gobies: null, blennies: null, wrasses: null };
  const SPECIAL = { 'zebrasoma-flavescens': ['#ffd400', '#ffd400'], 'paracanthurus-hepatus': ['#2453c9', '#ffd400'], 'acanthurus-leucosternon': ['#69b7e8', '#ffffff'], 'pterapogon-kauderni': ['#c9c9c9', '#222'], 'synchiropus-splendidus': ['#2aa3b8', '#f47b20'], 'gramma-loreto': ['#8b3fc9', '#ffd400'], 'pseudochromis-fridmani': ['#7a2fc9', '#7a2fc9'], 'amphiprion-percula': ['#f26a10', '#fff'], 'premnas-biaculeatus': ['#a3122a', '#fff'] };
  let flow = { lvl: 0, wave: false };
  let snow = [];
  const sinking = [];
  let foodQuota = 0;
  let pileN = -1;
  function resetScene() {
    sceneKey = '';
    pileN = -1;
    Object.keys(swim).forEach((k) => delete swim[k]);
    sinking.length = 0;
    foodQuota = 0;
    Object.keys(crawl).forEach((k) => delete crawl[k]);
  }
  function fishColors(a) {
    if (SPECIAL[a.sp]) return SPECIAL[a.sp];
    const st = Sim.CAT.species[a.sp];
    if (FISH_COL[st.category]) return FISH_COL[st.category];
    const hue = hash(a.sp) % 360;
    return ['hsl(' + hue + ',70%,55%)', 'hsl(' + ((hue + 160) % 360) + ',70%,60%)'];
  }
  const tempCol = (v) => (v < 23.5 ? '#3b82f6' : v > 28 ? '#e5484d' : '#2fa35a');
  function drawScene() {
    const svg = document.getElementById('scene');
    if (!svg) return;
    const w = S.w;
    const filled = S.tank.filled;
    const key = [filled, S.rockKg, S.ani.map((a) => a.uid + ':' + Math.round((a.mass || 1) * 4) + ':' + Math.round(a.health / 20) + ':' + a.where + ':' + (a.inf && (a.inf.ich > 0.1 || a.inf.velvet > 0.1) ? 1 : 0)).join(','),
      Math.round(S.alg.diatom / 10), Math.round(S.alg.hair / 10), Math.round(S.alg.cyano / 10), Math.round(S.pest.aiptasia / 5), S.eq.map((e) => e.id + e.state).join(','), lang].join('|');
    if (key !== sceneKey) { sceneKey = key; pileN = -1; svg.innerHTML = sceneHtml(); }
    const env = Sim.env(S);
    const tod = S.opts.time === 'turn' ? 0.55 : S.day - Math.floor(S.day);
    const lightsOn = env.on && env.par > 0 && Math.abs(tod - 0.625) * 24 < S.set.light / 2;
    const dark = !filled ? 0 : !env.on ? 0.55 : lightsOn ? 0 : env.par > 0 ? 0.45 : 0.25;
    const set = (sel, attr, v) => { const el = svg.querySelector(sel); if (el) el.setAttribute(attr, v); };
    set('#night', 'opacity', dark);
    set('#tint', 'opacity', Math.min(0.45, w.org / 25));
    set('#haze', 'opacity', filled ? Math.min(0.35, w.nh3 * 0.3 + (S.det > 10 ? 0.1 : 0)) : 0);
    set('#glow', 'opacity', lightsOn ? 0.5 : 0);
    if (!filled) return;
    set('#level', 'y', 40 + Math.max(0, (1 - w.level / S.tank.net)) * 300);
    // flow: none / gentle / medium / strong, a wavemaker swings it back and forth
    const fx = env.on ? env.flowX : 0;
    flow = { lvl: fx <= 0 ? 0 : fx < 10 ? 1 : fx < 30 ? 2 : 3, wave: env.on && S.eq.some((e) => Sim.CAT.eq[e.id].wave && e.state === 'ok') };
    svg.setAttribute('class', 'flow-' + flow.lvl + (env.on ? '' : ' off'));
    // thermometer
    const tv = w.temp;
    const top = 170 - (Math.min(34, Math.max(18, tv)) - 18) / 16 * 100;
    set('#thBar', 'y', top.toFixed(1));
    set('#thBar', 'height', (176 - top).toFixed(1));
    set('#thBar', 'fill', tempCol(tv));
    set('#thBulb', 'fill', tempCol(tv));
    // leftover food on the sand
    const n = Math.min(60, Math.round((S.food || 0) / Math.max(1, w.level) * 300));
    if (n !== pileN) {
      pileN = n;
      const g = svg.querySelector('#pile');
      if (g) g.innerHTML = Array.from({ length: n }, (_, i) => '<ellipse cx="' + (40 + hash('p' + i) % 720) + '" cy="' + (386 + hash('pq' + i) % 18) + '" rx="2.6" ry="1.6" fill="' + (i % 3 ? '#8b5a2b' : '#a8743a') + '"/>').join('');
    }
  }
  function rockPath(x, y, wdt, hgt, seed) {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI * (i / 10);
      const r = 1 - ((hash(seed + i) % 20) / 100);
      pts.push([x + Math.cos(Math.PI - a) * wdt / 2 * r, y - Math.sin(a) * hgt * r]);
    }
    return 'M' + (x - wdt / 2) + ' ' + y + ' ' + pts.map((p) => 'L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ') + ' Z';
  }
  const sway = (key, inner) => '<g class="sway" style="animation-delay:-' + (hash(String(key)) % 40) / 10 + 's">' + inner + '</g>';
  function sceneHtml() {
    const filled = S.tank.filled;
    let crawlH = '';
    const rocks = [];
    const n = S.rockKg ? Math.min(4, 1 + Math.floor(S.rockKg / 8)) : 0;
    const size = Math.min(1.3, 0.6 + S.rockKg / (S.tank.net * 0.12) * 0.4);
    for (let i = 0; i < n; i++) rocks.push({ x: 140 + i * (520 / Math.max(1, n - 1 || 1)) + (n === 1 ? 260 : 0), w: (150 + (i % 2) * 60) * size, h: (110 + ((i + 1) % 2) * 60) * size });
    const coralline = Math.min(1, Math.max(0, (S.day - S.tank.filledDay) / 120));
    let h = '<defs><linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a8fb8"/><stop offset="1" stop-color="#0b3d63"/></linearGradient>' +
      '<linearGradient id="sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9dcc0"/><stop offset="1" stop-color="#cdbb94"/></linearGradient></defs>' +
      '<rect x="0" y="0" width="800" height="420" fill="#1b2a30"/>' +
      '<rect id="glow" x="20" y="0" width="760" height="40" fill="#fff6c8" opacity="0"/><rect x="40" y="8" width="720" height="14" rx="5" fill="#2f3a3e"/>';
    if (!filled) {
      h += '<rect x="20" y="30" width="760" height="380" fill="#24363d" stroke="#8fb6c2" stroke-width="3" stroke-dasharray="8 6"/>' +
        '<text x="400" y="220" text-anchor="middle" fill="#cfe3e8" font-size="20">' + esc(t('empty')) + '</text>';
      return h + rocks.map((r, i) => '<path d="' + rockPath(r.x, 405, r.w, r.h, 'r' + i) + '" fill="#d8d0c4"/>').join('');
    }
    h += '<rect x="20" y="30" width="760" height="380" fill="url(#water)"/><rect id="level" x="20" y="40" width="760" height="0" fill="#1b2a30"/>' +
      '<rect x="20" y="350" width="760" height="60" fill="url(#sand)"/>';
    if (S.alg.diatom > 5) h += '<rect x="20" y="350" width="760" height="60" fill="#8a5a1e" opacity="' + Math.min(0.6, S.alg.diatom / 120) + '"/>';
    for (let i = 0; i < Math.round(S.alg.cyano / 10); i++) h += '<ellipse cx="' + (60 + (hash('c' + i) % 680)) + '" cy="' + (365 + (hash('cy' + i) % 30)) + '" rx="' + (25 + hash('cr' + i) % 30) + '" ry="7" fill="#b3263a" opacity=".75"/>';
    h += '<g id="snow"></g>';
    rocks.forEach((r, i) => {
      h += '<path d="' + rockPath(r.x, 395, r.w, r.h, 'r' + i) + '" fill="' + (S.liveKg ? '#9c7f8f' : '#cfc6b8') + '"/>';
      if (coralline > 0.1) h += '<path d="' + rockPath(r.x, 395, r.w * 0.9, r.h * 0.85, 'r' + i) + '" fill="#d27aa8" opacity="' + (coralline * 0.5) + '"/>';
      for (let k = 0; k < Math.round(S.alg.hair / 8); k++) {
        const x = r.x - r.w / 2.6 + (hash('h' + i + k) % Math.round(r.w * 0.75));
        const y = 395 - r.h * 0.55 - (hash('hy' + i + k) % Math.round(r.h * 0.35));
        h += sway('h' + i + k, '<path d="M' + x + ' ' + y + ' q 6 -18 -2 -34 M' + (x + 4) + ' ' + y + ' q -8 -16 2 -28" stroke="#5aa832" stroke-width="2.5" fill="none" opacity=".85"/>');
      }
      for (let k = 0; k < Math.min(8, Math.round(S.pest.aiptasia / (5 * Math.max(1, n)))); k++) {
        const x = r.x - r.w / 3 + (hash('ap' + i + k) % Math.round(r.w * 0.6));
        const y = 395 - r.h * 0.3 - (hash('apy' + i + k) % Math.round(r.h * 0.4));
        h += '<g transform="translate(' + x + ' ' + y + ')" opacity=".9">' + sway('ap' + i + k, '<path d="M0 0 l-6 -12 M0 0 l-2 -14 M0 0 l3 -13 M0 0 l7 -10" stroke="#b9a37a" stroke-width="2"/>') + '<circle r="3" fill="#8a7550"/></g>';
      }
    });
    const spot = (a, lvl) => {
      const tops = rocks.length ? rocks : [{ x: 400, w: 600, h: 40 }];
      const r = tops[Math.floor(a.px * tops.length) % tops.length];
      const x = r.x - r.w * 0.35 + a.py * r.w * 0.7;
      const y = lvl === 'top' ? 395 - r.h * 0.95 : lvl === 'middle' ? 395 - r.h * 0.6 : 392;
      return [x, y];
    };
    S.ani.filter((a) => a.where === 'display').forEach((a) => {
      const st = Sim.CAT.species[a.sp];
      const hue = hash(a.sp) % 360;
      const pale = a.health < 40 ? 0.35 : 1;
      const sc = 0.7 + Math.min(6, a.mass || 1) * 0.22;
      if (st.group === 'coral') {
        const [x, y] = spot(a, a.place || 'middle');
        const col = 'hsl(' + hue + ',' + Math.round(70 * pale) + '%,' + (a.health < 40 ? 85 : 60) + '%)';
        let g = '';
        let soft = true;
        if (st.cls === 'sps') { soft = false; g = '<path d="M0 0 L0 -26 M0 -12 L-12 -28 M0 -16 L12 -30 M-12 -28 L-16 -38 M12 -30 L18 -40" stroke="' + col + '" stroke-width="5" stroke-linecap="round" fill="none"/>'; }
        else if (st.cls === 'lps' || st.cls === 'nps') { soft = false; g = '<ellipse cx="0" cy="-10" rx="18" ry="12" fill="' + col + '"/><circle cx="-7" cy="-14" r="3" fill="#fff" opacity=".5"/><circle cx="6" cy="-12" r="3" fill="#fff" opacity=".5"/>'; }
        else if (st.category === 'zoanthids') g = [-12, -4, 4, 12, -8, 8].map((d, i) => '<circle cx="' + d + '" cy="' + (-4 - (i > 3 ? 8 : 0)) + '" r="5" fill="' + col + '" stroke="#ffef7a" stroke-width="1.5"/>').join('');
        else if (st.category === 'mushrooms') g = '<ellipse cx="-8" cy="-6" rx="11" ry="5" fill="' + col + '"/><ellipse cx="9" cy="-10" rx="10" ry="5" fill="' + col + '"/>';
        else if (st.cls === 'macro') g = '<path d="M0 0 q -10 -20 -4 -36 M0 0 q 8 -18 6 -34 M0 0 q 0 -22 0 -40" stroke="#3fa34d" stroke-width="5" fill="none"/>';
        else g = '<path d="M0 0 L0 -18 M0 -12 q -14 -6 -16 -22 M0 -12 q 14 -6 16 -22" stroke="' + col + '" stroke-width="8" stroke-linecap="round" fill="none"/>';
        h += '<g data-uid="' + a.uid + '" transform="translate(' + x.toFixed(0) + ' ' + y.toFixed(0) + ') scale(' + sc.toFixed(2) + ')">' + (soft ? sway(a.uid, g) : g) + '</g>';
      } else if (st.group === 'invertebrate') {
        const cat = st.category;
        const col = 'hsl(' + hue + ',60%,55%)';
        if (CRAWL[cat]) crawlH += '<g data-uid="' + a.uid + '" data-c="' + cat + '"><g class="cb">' + critter(a, cat) + '</g></g>';
        else if (cat === 'snails') { const x = 40 + a.px * 720; const y = 60 + a.py * 260; h += '<g transform="translate(' + x.toFixed(0) + ' ' + y.toFixed(0) + ')"><circle r="7" fill="#7b5b3a"/><path d="M-4 0 a4 4 0 1 1 4 4" stroke="#c8a77a" fill="none" stroke-width="1.5"/></g>'; }
        else if (cat === 'hermit-crabs' || cat === 'crabs') { const x = 40 + a.px * 720; h += '<g transform="translate(' + x.toFixed(0) + ' 372)"><ellipse rx="9" ry="6" fill="' + (cat === 'crabs' ? '#3f9a4a' : '#9a6a3f') + '"/><path d="M-9 2 l-5 4 M9 2 l5 4 M-6 -4 l-4 -5 M6 -4 l4 -5" stroke="#d24" stroke-width="2"/></g>'; }
        else if (cat === 'shrimps') { const [x, y] = spot(a, 'middle'); h += '<g transform="translate(' + x.toFixed(0) + ' ' + (y - 6).toFixed(0) + ')"><path d="M-12 0 q 10 -10 22 0" stroke="#e33" stroke-width="5" fill="none"/><path d="M-12 0 q 10 -10 22 0" stroke="#fff" stroke-width="1.5" fill="none"/><path d="M10 -2 l14 -14 M10 -2 l16 -6" stroke="#fff" stroke-width="1"/></g>'; }
        else if (cat === 'starfish') { const x = 40 + a.px * 720; const y = a.py > 0.5 ? 380 : 120 + a.py * 200; h += '<g transform="translate(' + x.toFixed(0) + ' ' + y.toFixed(0) + ')"><path d="M0 -14 L4 -4 L14 -3 L6 4 L9 14 L0 8 L-9 14 L-6 4 L-14 -3 L-4 -4 Z" fill="' + (a.sp.startsWith('linckia') ? '#2f6fd6' : '#e2733b') + '"/></g>'; }
        else if (cat === 'urchins') { const [x, y] = spot(a, 'middle'); h += '<g transform="translate(' + x.toFixed(0) + ' ' + y.toFixed(0) + ')"><circle r="8" fill="#5a2f6b"/>' + [0, 45, 90, 135, 180, 225, 270, 315].map((d) => '<line x1="0" y1="0" x2="' + (Math.cos(d * Math.PI / 180) * 14).toFixed(1) + '" y2="' + (Math.sin(d * Math.PI / 180) * 14).toFixed(1) + '" stroke="#5a2f6b" stroke-width="1.5"/>').join('') + '</g>'; }
        else if (cat === 'bivalves') { const [x, y] = spot(a, 'top'); h += '<g transform="translate(' + x.toFixed(0) + ' ' + y.toFixed(0) + ') scale(' + sc.toFixed(2) + ')"><path d="M-16 0 q 16 -14 32 0 q -16 6 -32 0" fill="#2fb0c9"/><path d="M-14 -1 q 14 -8 28 0" stroke="#173" fill="none"/></g>'; }
        else if (cat === 'anemones') { const [x, y] = spot(a, 'middle'); h += '<g transform="translate(' + x.toFixed(0) + ' ' + y.toFixed(0) + ')">' + sway(a.uid, [-14, -8, -2, 4, 10, 16].map((d) => '<path d="M0 0 q ' + d + ' -14 ' + (d * 1.3).toFixed(0) + ' -24" stroke="' + col + '" stroke-width="4" stroke-linecap="round" fill="none"/>').join('')) + '</g>'; }
        else if (cat === 'sea-cucumbers') { const x = 60 + a.px * 680; h += '<ellipse cx="' + x.toFixed(0) + '" cy="380" rx="22" ry="7" fill="#3b2a25"/>'; }
        else { const [x, y] = spot(a, 'middle'); h += '<g transform="translate(' + x.toFixed(0) + ' ' + y.toFixed(0) + ')">' + sway(a.uid, '<path d="M0 0 L0 -16" stroke="#8a6" stroke-width="3"/>' + [-20, -10, 0, 10, 20].map((d) => '<path d="M0 -16 l' + d / 2 + ' -10" stroke="' + col + '" stroke-width="2"/>').join('')) + '</g>'; }
      }
    });
    h += '<g id="pile"></g><g id="crawl">' + crawlH + '</g>';
    sceneRocks = rocks;
    // equipment on the glass; pumps blow to the left
    let px = 720;
    S.eq.forEach((e) => {
      const k = Sim.CAT.eq[e.id].kind;
      if (k === 'heater') h += '<rect x="34" y="120" width="10" height="110" rx="5" fill="#b9c4c8" opacity=".85"/><rect x="36" y="200" width="6" height="26" rx="3" fill="' + (e.state === 'ok' ? '#e25b2c' : '#555') + '"/>';
      if (k === 'pump') {
        if (e.state === 'ok') h += [0, 1, 2].map((i) => '<path class="streak" d="M' + (px - 16) + ' ' + (66 + i * 5) + ' q -90 ' + (8 + i * 10) + ' -200 ' + (30 + i * 22) + '" stroke="#ffffff" stroke-width="1.5" fill="none" style="animation-delay:-' + i * 0.4 + 's"/>').join('');
        h += '<g transform="translate(' + px + ' 70)"><circle r="13" fill="#3a4448"/><circle r="6" fill="' + (e.state === 'ok' ? '#9fd3e0' : '#777') + '"/></g>';
        px -= 40;
      }
    });
    h += '<g id="thermo"><rect x="66" y="66" width="12" height="112" rx="6" fill="#eef5f7" opacity=".85"/><rect id="thBar" x="69" y="100" width="6" height="76" rx="3" fill="#2fa35a"/>' +
      '<circle id="thBulb" cx="72" cy="178" r="9" fill="#2fa35a"/></g>';
    h += '<g id="sink"></g><g id="fish"></g><rect id="tint" x="20" y="30" width="760" height="380" fill="#d4b14a" opacity="0"/><rect id="haze" x="20" y="30" width="760" height="380" fill="#f3f3f3" opacity="0"/>' +
      '<rect id="night" x="20" y="30" width="760" height="380" fill="#020b14" opacity="0"/><rect x="20" y="30" width="760" height="380" fill="none" stroke="#8fb6c2" stroke-width="3"/>';
    setTimeout(buildFish, 0);
    return h;
  }
  function buildFish() {
    const g = document.querySelector('#scene #fish');
    if (!g) return;
    const fish = S.ani.filter((a) => a.where === 'display' && Sim.CAT.species[a.sp].cls === 'fish');
    g.innerHTML = fish.map((a) => {
      const st = Sim.CAT.species[a.sp];
      const [c1, c2] = fishColors(a);
      const sc = Math.max(0.6, Math.min(2.2, ((st.sp.size_cm && st.sp.size_cm.max) || 10) / 10));
      const stripes = st.category === 'clownfish' ? '<path d="M-6 -9 v18 M4 -9 v18" stroke="' + c2 + '" stroke-width="3.5"/>' : '<path d="M8 -6 q 6 6 0 12" stroke="' + c2 + '" stroke-width="3" fill="none"/>';
      const spots = a.inf && (a.inf.ich > 0.1 || a.inf.velvet > 0.1) ? '<circle cx="-4" cy="-3" r="1.3" fill="#fff"/><circle cx="3" cy="2" r="1.3" fill="#fff"/><circle cx="-9" cy="3" r="1.2" fill="#fff"/><circle cx="7" cy="-4" r="1.2" fill="#fff"/>' : '';
      return '<g data-uid="' + a.uid + '" opacity="' + (a.health < 25 ? 0.6 : 1) + '"><g class="fb" transform="scale(' + sc.toFixed(2) + ')"><path d="M-16 0 L-26 -9 L-26 9 Z" fill="' + c1 + '"/><ellipse rx="16" ry="10" fill="' + c1 + '"/>' + stripes + spots + '<circle cx="10" cy="-3" r="2" fill="#111"/></g></g>';
    }).join('');
    fish.forEach((a) => {
      if (!swim[a.uid]) swim[a.uid] = { x: 100 + a.px * 600, y: 90 + a.py * 220, tx: 0, ty: 0, dir: 1, sp: 0.4 + (hash(a.sp) % 40) / 100 };
      newTarget(swim[a.uid], a);
    });
    // drifting particles show the water movement
    const sg = document.querySelector('#scene #snow');
    if (sg) {
      snow = Array.from({ length: 26 }, (_, i) => ({ x: 30 + Math.random() * 740, y: 45 + Math.random() * 300, k: 0.6 + Math.random() * 0.8, ph: Math.random() * 6 }));
      sg.innerHTML = snow.map((p, i) => '<circle r="' + (1 + (i % 3) * 0.5) + '" fill="#ffffff" opacity=".35"/>').join('');
      [...sg.children].forEach((el, i) => { snow[i].el = el; });
    }
    buildCrawl();
    const kg = document.querySelector('#scene #sink');
    sinking.forEach((p) => { p.el = null; });
    if (kg) kg.innerHTML = '';
    animate(performance.now(), true);
  }
  // Small critters wander slowly: crabs and cucumbers on the sand, snails on the glass, shrimps and urchins on the rock.
  // When food is in the water they all head for it.
  const CRAWL = { snails: ['glass', 0.004], 'hermit-crabs': ['sand', 0.012], crabs: ['sand', 0.02], shrimps: ['rock', 0.03], starfish: ['glass', 0.003], urchins: ['rock', 0.003], 'sea-cucumbers': ['sand', 0.003] };
  const crawl = {};
  let sceneRocks = [];
  function critter(a, cat) {
    const hue = hash(a.sp) % 360;
    const col = 'hsl(' + hue + ',60%,55%)';
    if (cat === 'snails') return '<circle r="7" fill="#7b5b3a"/><path d="M-4 0 a4 4 0 1 1 4 4" stroke="#c8a77a" fill="none" stroke-width="1.5"/>';
    if (cat === 'hermit-crabs' || cat === 'crabs') return '<ellipse rx="9" ry="6" fill="' + (cat === 'crabs' ? '#3f9a4a' : '#9a6a3f') + '"/><path d="M-9 2 l-5 4 M9 2 l5 4 M-6 -4 l-4 -5 M6 -4 l4 -5" stroke="#d24" stroke-width="2"/>';
    if (cat === 'shrimps') return '<path d="M-12 0 q 10 -10 22 0" stroke="#e33" stroke-width="5" fill="none"/><path d="M-12 0 q 10 -10 22 0" stroke="#fff" stroke-width="1.5" fill="none"/><path d="M10 -2 l14 -14 M10 -2 l16 -6" stroke="#fff" stroke-width="1"/>';
    if (cat === 'starfish') return '<path d="M0 -14 L4 -4 L14 -3 L6 4 L9 14 L0 8 L-9 14 L-6 4 L-14 -3 L-4 -4 Z" fill="' + (a.sp.startsWith('linckia') ? '#2f6fd6' : '#e2733b') + '"/>';
    if (cat === 'urchins') return '<circle r="8" fill="#5a2f6b"/>' + [0, 45, 90, 135, 180, 225, 270, 315].map((d) => '<line x1="0" y1="0" x2="' + (Math.cos(d * Math.PI / 180) * 14).toFixed(1) + '" y2="' + (Math.sin(d * Math.PI / 180) * 14).toFixed(1) + '" stroke="#5a2f6b" stroke-width="1.5"/>').join('');
    if (cat === 'sea-cucumbers') return '<ellipse rx="22" ry="7" fill="#3b2a25"/>';
    return '<circle r="6" fill="' + col + '"/>';
  }
  function crawlSpot(zone) {
    if (zone === 'sand') return [40 + Math.random() * 720, 368 + Math.random() * 16];
    if (zone === 'rock' && sceneRocks.length) {
      const r = sceneRocks[Math.floor(Math.random() * sceneRocks.length)];
      return [r.x - r.w * 0.35 + Math.random() * r.w * 0.7, 395 - r.h * (0.55 + Math.random() * 0.35)];
    }
    return [40 + Math.random() * 720, 70 + Math.random() * 280];
  }
  function buildCrawl() {
    document.querySelectorAll('#scene #crawl > [data-uid]').forEach((el) => {
      const uid = Number(el.dataset.uid);
      const a = S.ani.find((x) => x.uid === uid);
      if (!a) return;
      const [zone, sp] = CRAWL[el.dataset.c];
      if (!crawl[uid]) {
        const [x, y] = zone === 'sand' ? [40 + a.px * 720, 372] : zone === 'glass' ? [40 + a.px * 720, 70 + a.py * 270] : crawlSpot(zone);
        crawl[uid] = { x, y, tx: x, ty: y, wait: Math.random() * 4000, zone, sp, dir: 1 };
      }
      crawl[uid].el = el;
      el.setAttribute('transform', 'translate(' + crawl[uid].x.toFixed(1) + ' ' + crawl[uid].y.toFixed(1) + ')');
    });
  }
  function moveCrawl(dt, still) {
    const food = sinking.length ? sinking : null;
    Object.keys(crawl).forEach((k) => {
      const c = crawl[k];
      if (!c.el || !c.el.isConnected) return;
      if (food) {
        const p = food.reduce((b, q) => (Math.abs(q.x - c.x) < Math.abs(b.x - c.x) ? q : b));
        c.tx = p.x;
        c.ty = c.zone === 'sand' ? 372 + (c.ty > 372 ? 6 : 0) : c.zone === 'glass' ? Math.max(c.y, 330) : Math.max(p.y, c.y);
        c.wait = 0;
      } else if (c.wait > 0) { c.wait -= dt; return; }
      const dx = c.tx - c.x;
      const dy = c.ty - c.y;
      const d = Math.hypot(dx, dy);
      if (d < 3) {
        if (!food) { [c.tx, c.ty] = crawlSpot(c.zone); c.wait = 1500 + Math.random() * 6000; }
        return;
      }
      if (still) return;
      const v = c.sp * dt * (food ? 2.5 : 1);
      c.x += dx / d * Math.min(v, d);
      c.y += dy / d * Math.min(v, d);
      if (Math.abs(dx) > 1) c.dir = dx > 0 ? 1 : -1;
      c.el.setAttribute('transform', 'translate(' + c.x.toFixed(1) + ' ' + c.y.toFixed(1) + ')' + (c.zone === 'rock' ? ' scale(' + c.dir + ' 1)' : ''));
    });
  }
  function newTarget(f, a) {
    const st = Sim.CAT.species[a.sp];
    const bottom = ['gobies', 'blennies'].includes(st.category);
    const gasp = a.st && a.st.o2 > 2;
    f.tx = 60 + Math.random() * 680;
    f.ty = gasp ? 55 + Math.random() * 20 : bottom ? 320 + Math.random() * 25 : 70 + Math.random() * 240;
  }
  // Feeding: food pellets sink from the surface; the fish chase the share they actually eat, the rest lands on the sand.
  function spawnFood(size, eaten) {
    if (reduce) return;
    const n = { small: 6, normal: 12, large: 28 }[size] || 12;
    const x0 = 220 + Math.random() * 360;
    for (let i = 0; i < n; i++) sinking.push({ x: x0 + (Math.random() - 0.5) * 90, y: 42 + Math.random() * 12, v: 0.035 + Math.random() * 0.025 });
    foodQuota += Math.round(n * (eaten || 0));
  }
  let lastAnim = 0;
  function animate(ts, force) {
    const g = document.querySelector('#scene #fish');
    if (!g || !S) return;
    const dt = lastAnim ? Math.min(100, ts - lastAnim) : 16;
    lastAnim = ts;
    if (reduce && !force) return;
    const still = reduce;
    const vx = flow.lvl ? -(0.01 + flow.lvl * 0.025) * (flow.wave ? Math.sin(ts / 2400) * 1.4 : 1) : 0;
    snow.forEach((p) => {
      if (!p.el) return;
      if (!still) {
        p.x += vx * dt * p.k;
        p.y += (flow.lvl ? Math.sin(ts / 900 + p.ph) * 0.012 * flow.lvl : 0.006 * p.k) * dt;
        if (p.x < 24) p.x = 776; if (p.x > 776) p.x = 24;
        if (p.y > 345) p.y = 45; if (p.y < 42) p.y = 340;
      }
      p.el.setAttribute('cx', p.x.toFixed(1)); p.el.setAttribute('cy', p.y.toFixed(1));
    });
    const kg = document.querySelector('#scene #sink');
    for (let i = sinking.length - 1; i >= 0; i--) {
      const p = sinking[i];
      if (kg && !p.el) { p.el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse'); p.el.setAttribute('rx', '2.6'); p.el.setAttribute('ry', '1.8'); p.el.setAttribute('fill', '#a8743a'); kg.appendChild(p.el); }
      p.y += p.v * dt * (still ? 20 : 1);
      p.x += vx * dt * 0.5;
      if (p.y > 384 || p.eaten) { if (p.el) p.el.remove(); sinking.splice(i, 1); continue; }
      if (p.el) { p.el.setAttribute('cx', p.x.toFixed(1)); p.el.setAttribute('cy', p.y.toFixed(1)); }
    }
    if (!sinking.length) foodQuota = 0;
    moveCrawl(dt, still);
    S.ani.forEach((a) => {
      const f = swim[a.uid];
      const el = g.querySelector('[data-uid="' + a.uid + '"]');
      if (!f || !el) return;
      const sick = a.health < 40 ? 0.4 : 1;
      let chase = null;
      if (foodQuota > 0 && sinking.length) {
        chase = sinking.reduce((b, p) => (Math.hypot(p.x - f.x, p.y - f.y) < Math.hypot(b.x - f.x, b.y - f.y) ? p : b));
        f.tx = chase.x; f.ty = chase.y;
      }
      const dx = f.tx - f.x;
      const dy = f.ty - f.y;
      const d = Math.hypot(dx, dy);
      if (chase && d < 12) { chase.eaten = true; foodQuota--; newTarget(f, a); }
      else if (d < 6) newTarget(f, a);
      else if (!still) { const v = f.sp * sick * dt * 0.06 * (chase ? 2.2 : 1); f.x += dx / d * v; f.y += dy / d * v; if (Math.abs(dx) > 2) f.dir = dx > 0 ? 1 : -1; }
      el.setAttribute('transform', 'translate(' + f.x.toFixed(1) + ' ' + f.y.toFixed(1) + ') scale(' + f.dir + ' 1)');
    });
  }

  /* ---------- shop ---------- */
  // Small product pictures, drawn in a 64×64 box.
  const TEST_COL = { nh3: '#3fae5a', no2: '#d6487a', no3: '#e2603a', po4: '#3b7dd8', ph: '#8a5bd1', kh: '#2a9d8f', ca: '#e0b13a', mg: '#7aa53b', cu: '#3aa0c8' };
  const bottle = (col, label) => '<rect x="22" y="10" width="20" height="8" rx="2" fill="#56636a"/><rect x="16" y="18" width="32" height="38" rx="7" fill="' + col + '"/><rect x="19" y="28" width="26" height="16" rx="3" fill="#fff" opacity=".9"/>' +
    (label ? '<text x="32" y="40.5" text-anchor="middle" font-size="' + (label.length > 2 ? 9 : 11) + '" font-weight="700" fill="#1d2b30">' + label + '</text>' : '');
  const granules = (bag, dot) => '<path d="M14 18 h36 l-4 38 h-28 Z" fill="' + bag + '"/>' + [[24, 30], [32, 36], [40, 30], [28, 44], [37, 46], [32, 26]].map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="3" fill="' + dot + '"/>').join('');
  const ICONS = {
    tank: '<rect x="6" y="14" width="52" height="38" rx="2" fill="#bfe4f0" stroke="#5b8a99" stroke-width="2"/><rect x="7" y="20" width="50" height="31" fill="#2a8fb8"/><rect x="7" y="44" width="50" height="7" fill="#e3d3ae"/><path d="M14 44 q8 -12 16 0 Z" fill="#cfc6b8"/><rect x="10" y="52" width="44" height="6" fill="#56636a"/>',
    skimmer: '<rect x="22" y="8" width="20" height="10" rx="3" fill="#cfd8dc"/><rect x="20" y="18" width="24" height="34" rx="4" fill="#90a4ae"/><rect x="24" y="22" width="16" height="16" rx="2" fill="#f2efe6"/><circle cx="32" cy="12" r="3" fill="#8d6e63"/><rect x="16" y="52" width="32" height="6" rx="2" fill="#455a64"/>',
    sock: '<path d="M18 10 h28 v6 h-2 l-3 38 q-9 6 -18 0 l-3 -38 h-2 Z" fill="#f4f1ea" stroke="#9aa5a9" stroke-width="2"/><rect x="18" y="10" width="28" height="6" fill="#5b8a99"/>',
    rock: '<path d="M8 50 q2 -20 14 -24 q6 -14 18 -8 q14 2 16 18 q2 10 -2 14 Z" fill="#cfc6b8"/><path d="M20 40 q4 -6 10 -2 M36 30 q6 2 6 8" stroke="#a89f90" stroke-width="2" fill="none"/>',
    liverock: '<path d="M8 50 q2 -20 14 -24 q6 -14 18 -8 q14 2 16 18 q2 10 -2 14 Z" fill="#9c7f8f"/><path d="M14 46 q6 -10 14 -6 M34 26 q8 0 10 10" stroke="#d27aa8" stroke-width="4" fill="none"/>',
    refugium: '<rect x="8" y="22" width="48" height="30" rx="3" fill="#bfe4f0" stroke="#5b8a99" stroke-width="2"/><path d="M18 50 q-4 -14 2 -24 M24 50 q6 -12 0 -22 M38 50 q-4 -16 4 -24 M46 50 q2 -10 -2 -18" stroke="#3fa34d" stroke-width="4" fill="none"/><rect x="14" y="10" width="36" height="6" rx="3" fill="#f2c94c"/>',
    uv: '<rect x="10" y="26" width="44" height="12" rx="6" fill="#b0bec5"/><rect x="16" y="28" width="32" height="8" rx="4" fill="#9b6dff"/><path d="M14 20 l-4 -6 M32 18 v-8 M50 20 l4 -6 M14 44 l-4 6 M32 46 v8 M50 44 l4 6" stroke="#9b6dff" stroke-width="2.5"/>',
    light: '<rect x="8" y="14" width="48" height="10" rx="4" fill="#37474f"/><circle cx="18" cy="24" r="2.5" fill="#bfe9ff"/><circle cx="32" cy="24" r="2.5" fill="#bfe9ff"/><circle cx="46" cy="24" r="2.5" fill="#bfe9ff"/><path d="M14 30 l-4 18 M24 30 l-2 20 M32 30 v22 M40 30 l2 20 M50 30 l4 18" stroke="#ffe27a" stroke-width="2.5" opacity=".9"/>',
    pump: '<circle cx="32" cy="32" r="20" fill="#455a64"/><circle cx="32" cy="32" r="13" fill="#9fd3e0"/><path d="M32 32 l0 -11 q6 4 0 11 l10 5 q-6 5 -10 -5 l-9 6 q-2 -8 9 -6" fill="#455a64"/>',
    wave: '<circle cx="24" cy="32" r="16" fill="#455a64"/><circle cx="24" cy="32" r="9" fill="#9fd3e0"/><path d="M42 24 q5 -4 10 0 q5 4 10 0 M42 32 q5 -4 10 0 q5 4 10 0 M42 40 q5 -4 10 0 q5 4 10 0" stroke="#2a8fb8" stroke-width="2.5" fill="none"/>',
    heater: '<rect x="26" y="6" width="12" height="52" rx="6" fill="#cfd8dc" stroke="#90a4ae" stroke-width="2"/><rect x="29" y="30" width="6" height="24" rx="3" fill="#e25b2c"/><rect x="28" y="4" width="8" height="6" rx="2" fill="#37474f"/>',
    fan: '<circle cx="32" cy="30" r="22" fill="#eceff1" stroke="#90a4ae" stroke-width="2"/><path d="M32 30 q-4 -16 6 -16 q4 10 -6 16 q14 -6 16 4 q-10 6 -16 -4 q4 14 -6 16 q-6 -10 6 -16 q-14 4 -16 -6 q10 -4 16 6" fill="#5b8a99"/><rect x="26" y="52" width="12" height="8" fill="#90a4ae"/>',
    chiller: '<rect x="8" y="12" width="48" height="42" rx="5" fill="#e3f2fd" stroke="#64b5f6" stroke-width="2"/><path d="M32 18 v30 M19 25 l26 16 M45 25 l-26 16" stroke="#1e88e5" stroke-width="3" stroke-linecap="round"/>',
    ato: '<path d="M12 14 h22 v40 h-22 Z" fill="#bfe4f0" stroke="#5b8a99" stroke-width="2"/><rect x="13" y="30" width="20" height="23" fill="#7cc4dd"/><path d="M34 22 h12 v18" stroke="#5b8a99" stroke-width="3" fill="none"/><path d="M46 44 q-5 8 0 10 q5 -2 0 -10" fill="#2a8fb8"/>',
    doser: '<rect x="8" y="22" width="48" height="26" rx="4" fill="#37474f"/>' + [18, 32, 46].map((x) => '<circle cx="' + x + '" cy="35" r="7" fill="#90a4ae"/><path d="M' + x + ' 22 v-12" stroke="#e0b13a" stroke-width="2.5"/>').join(''),
    feeder: '<rect x="14" y="16" width="36" height="28" rx="14" fill="#cfd8dc" stroke="#78909c" stroke-width="2"/><rect x="24" y="44" width="16" height="8" fill="#78909c"/><circle cx="26" cy="56" r="2" fill="#a8743a"/><circle cx="34" cy="59" r="2" fill="#a8743a"/><circle cx="31" cy="54" r="2" fill="#a8743a"/>',
    controller: '<rect x="8" y="12" width="48" height="36" rx="5" fill="#263238"/><rect x="13" y="17" width="38" height="20" rx="2" fill="#7fe0c4"/><text x="32" y="31" text-anchor="middle" font-size="10" font-weight="700" fill="#1d2b30">25.5°</text><path d="M24 54 q8 -10 16 0" stroke="#e5484d" stroke-width="3" fill="none"/>',
    qt: '<rect x="10" y="18" width="44" height="30" rx="2" fill="#bfe4f0" stroke="#5b8a99" stroke-width="2"/><rect x="11" y="24" width="42" height="23" fill="#7cc4dd"/><rect x="29" y="27" width="6" height="16" fill="#e5484d"/><rect x="24" y="32" width="16" height="6" fill="#e5484d"/>',
    refractometer: '<rect x="8" y="27" width="40" height="10" rx="5" fill="#90a4ae" transform="rotate(-20 32 32)"/><rect x="44" y="18" width="12" height="12" rx="3" fill="#5b8a99" transform="rotate(-20 32 32)"/><circle cx="12" cy="40" r="5" fill="#37474f"/>',
    lid: '<rect x="8" y="16" width="48" height="32" rx="2" fill="none" stroke="#546e7a" stroke-width="3"/><path d="M16 16 v32 M24 16 v32 M32 16 v32 M40 16 v32 M48 16 v32 M8 24 h48 M8 32 h48 M8 40 h48" stroke="#90a4ae" stroke-width="1.5"/>',
    salt: '<path d="M14 18 q18 -8 36 0 l-3 38 h-30 Z" fill="#e3f2fd" stroke="#64b5f6" stroke-width="2"/><text x="32" y="40" text-anchor="middle" font-size="10" font-weight="700" fill="#1e88e5">NaCl</text>',
    food: '<rect x="18" y="12" width="28" height="44" rx="4" fill="#f2994a"/><rect x="18" y="12" width="28" height="8" rx="3" fill="#c46a1d"/><circle cx="27" cy="34" r="3" fill="#7a4520"/><circle cx="36" cy="40" r="3" fill="#7a4520"/><circle cx="31" cy="46" r="3" fill="#7a4520"/>',
    coralfood: bottle('#e86b9a') + '<path d="M28 42 q-2 -6 4 -8 q6 2 4 8" fill="#fff"/>',
    bacteria: bottle('#3fae5a', 'BAC'), ammonia: bottle('#b0bec5', 'NH3'), copper: bottle('#c27b3a', 'Cu'), aiptasiax: bottle('#8a5bd1', 'AIP'), dip: bottle('#2a9d8f', 'DIP'),
    carbon: granules('#78909c', '#212121'), gfo: granules('#a1887f', '#8d3b1f'),
    pack: '<rect x="8" y="22" width="48" height="34" rx="3" fill="#d7a86e"/><path d="M6 14 h52 v10 h-52 Z" fill="#e8c08a"/><rect x="28" y="14" width="8" height="42" fill="#e5484d"/><path d="M32 14 q-12 -12 -14 0 M32 14 q12 -12 14 0" stroke="#e5484d" stroke-width="3" fill="none"/>'
  };
  function iconOf(id) {
    const C = Sim.CAT;
    if (C.packs[id]) return ICONS.pack;
    if (C.tanks[id]) return ICONS.tank;
    const q = C.eq[id];
    if (q) return q.kind === 'rock' && q.live ? ICONS.liverock : q.wave ? ICONS.wave : ICONS[q.kind] || ICONS.pack;
    const c = C.cons[id];
    if (!c) return ICONS.pack;
    const [k, p] = c.item.split(':');
    if (k === 'test') return '<rect x="26" y="6" width="12" height="46" rx="6" fill="#e8f1f3" stroke="#90a4ae" stroke-width="2"/><rect x="28" y="28" width="8" height="22" rx="4" fill="' + TEST_COL[p] + '"/><text x="32" y="62" text-anchor="middle" font-size="9" font-weight="700" fill="currentColor">' + (PNAME[p] || p) + '</text>';
    if (k === 'add') return bottle('#5b8a99', PNAME[p]);
    return ICONS[c.item] || ICONS.pack;
  }
  const pic = (id) => '<svg viewBox="0 0 64 64" aria-hidden="true">' + iconOf(id) + '</svg>';
  let shopCat = '';
  let liveQ = '';
  function shopRoute() {
    const r = route();
    const ids = SHOP_CATS.map((c) => c[0]);
    const cat = ids.includes(r.sub) ? r.sub : shopCat || (!S.tank ? 'packs' : S.tank.filled ? 'fish' : 'tanks');
    shopCat = cat;
    return { cat, item: r.item ? decodeURIComponent(r.item) : '' };
  }
  function renderShop() {
    const { cat, item } = shopRoute();
    let grp = '';
    const side = SHOP_CATS.map(([c, g]) => {
      const head = g !== grp ? '<li class="sgrp">' + esc(t('grp.' + g)) + '</li>' : '';
      grp = g;
      return head + '<li><a href="' + shopHref(c) + '"' + (c === cat ? ' aria-current="page"' : '') + '>' + esc(t('shop.' + c)) + '</a></li>';
    }).join('');
    app.innerHTML = '<h1>' + esc(t('shop')) + '</h1><div class="shop"><nav class="sidecats" aria-label="' + esc(t('shop')) + '"><ul>' + side + '</ul></nav><div class="shopmain" id="shopList"></div></div>';
    renderShopList();
    const cur = $('.sidecats [aria-current]');
    if (cur && cur.scrollIntoView && window.matchMedia('(max-width: 760px)').matches) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
    if (item && !/^[cuk]:/.test(item)) {
      const el = document.getElementById('it-' + item);
      if (el) { el.classList.add('hl'); setTimeout(() => el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }), 50); }
    }
  }
  const owns = (it) => it.kind && Sim.UNIQUE.includes(it.kind) && hasKind(it.kind);
  function card(id, it, body, foot) {
    return '<li class="pcard" id="it-' + esc(id) + '"><div class="pimg">' + pic(id) + '</div><div class="pbody"><b>' + esc(tr(it.name)) + '</b>' + (it.desc ? '<p class="muted small">' + esc(tr(it.desc)) + '</p>' : '') + (body || '') + '</div>' +
      '<div class="pfoot">' + foot + '</div></li>';
  }
  function buyFoot(id, it) {
    const isTank = !!Sim.CAT.tanks[id];
    if (owns(it) || (isTank && S.tank && S.tank.id === id)) return '<span class="price">' + it.price + ' 🐚</span><span class="tag">' + esc(t('owned')) + '</span>';
    if (isTank && S.tank) return '<span class="price">' + it.price + ' 🐚</span>';
    return '<span class="price">' + it.price + ' 🐚</span><button class="btn" data-act="buy" data-id="' + esc(id) + '"' + (S.money < it.price ? ' disabled' : '') + '>' + esc(t('buy')) + '</button>';
  }
  function packCard(p) {
    const C = Sim.CAT;
    const items = Sim.packItems(S, p.id);
    const cnt = {};
    p.items.forEach((x) => { cnt[x] = (cnt[x] || 0) + 1; });
    const got = {};
    items.forEach((x) => { got[x] = (got[x] || 0) + 1; });
    const list = Object.keys(cnt).map((x) => '<li' + (got[x] ? '' : ' class="skip"') + '>' + esc((cnt[x] > 1 ? cnt[x] + '× ' : '') + itemName(x)) + '</li>').join('');
    const full = Math.round(items.reduce((a, x) => a + (C.tanks[x] || C.eq[x] || C.cons[x]).price, 0));
    const price = Sim.packPrice(S, p.id);
    const tankClash = S.tank && p.items.some((x) => C.tanks[x]);
    const foot = '<span class="price"><s class="muted">' + full + '</s> ' + price + ' 🐚</span>' + (tankClash ? '<span class="tag">' + esc(t('err.haveTank')) + '</span>'
      : '<button class="btn primary" data-act="buyPack" data-id="' + esc(p.id) + '"' + (S.money < price || !items.length ? ' disabled' : '') + '>' + esc(t('buy')) + '</button>');
    return card(p.id, p, '<p class="small"><span class="tag hard">' + esc(t('packSave', { n: Math.round((p.discount || 0) * 100) })) + '</span></p><p class="small"><b>' + esc(t('packContents')) + ':</b></p><ul class="plist">' + list + '</ul>', foot);
  }
  function renderShopList() {
    const el = $('#shopList');
    if (!el) return;
    const { cat } = shopRoute();
    const C = Sim.CAT;
    const grid = (h) => '<ul class="pgrid">' + h + '</ul>';
    if (cat === 'packs') el.innerHTML = '<p class="muted small">' + esc(t('packSkip')) + '</p>' + grid(Object.values(C.packs).map(packCard).join(''));
    else if (cat === 'tanks') el.innerHTML = grid(Object.values(C.tanks).map((x) => card(x.id, x, '<p class="small">' + esc(t('water', { n: x.net })) + '</p>', buyFoot(x.id, x))).join(''));
    else if (EQ_GROUPS[cat]) el.innerHTML = grid(Object.values(C.eq).filter((x) => EQ_GROUPS[cat].includes(x.kind)).map((x) => card(x.id, x, '', buyFoot(x.id, x))).join(''));
    else if (!LIVE.includes(cat)) {
      el.innerHTML = grid(Object.values(C.cons).filter((c) => consCat(c) === cat).map((x) => {
        const have = S.stock[x.item] || 0;
        const p = x.item.startsWith('test:') ? x.item.slice(5) : '';
        const body = (p && !x.desc ? '<p class="muted small">' + esc(t('test.' + p)) + '</p>' : '') + '<p class="small">' + esc(t('have', { n: x.item === 'salt' ? Math.round(have / 100) / 10 + ' kg' : Math.round(have) + (x.item.startsWith('add:') ? ' ml' : '') })) + '</p>';
        return card(x.id, x, body, buyFoot(x.id, x));
      }).join(''));
    } else {
      el.innerHTML = '<div class="filters" id="liveFilter"></div><ul class="pgrid live" id="liveList"></ul>';
      renderLiveList();
    }
  }
  // Live filter from a link: c:<category>, u:<utility>, k:<class,…>; anything else is a species id to highlight.
  function liveFilter() {
    const it = shopRoute().item;
    const m = /^([cuk]):(.+)$/.exec(it);
    if (!m) return null;
    const v = m[2];
    return { label: v, test: m[1] === 'c' ? (st) => st.category === v : m[1] === 'u' ? (st) => st.util.includes(v) : (st) => v.split(',').includes(st.cls) };
  }
  function renderLiveList() {
    const el = $('#liveList');
    if (!el) return;
    const cat = shopCat;
    const f = liveFilter();
    const q = norm(liveQ.trim());
    const hasQt = hasKind('qt');
    const net = S.tank ? S.tank.net : 0;
    const xs = Sim.CAT.list.filter((st) => st.group === cat && (!f || f.test(st)) && (!q || norm([st.sp.name_hu, st.sp.name_en, st.sp.scientific_name].join(' ')).includes(q)))
      .sort((a, b) => spName(a.id).localeCompare(spName(b.id), lang));
    const fl = $('#liveFilter');
    if (fl && !fl.dataset.done) {
      fl.dataset.done = 1;
      fl.innerHTML = '<input class="search" id="liveQ" type="search" placeholder="' + esc(t('search')) + '" value="' + esc(liveQ) + '">' +
        (f ? '<span class="chip on">' + esc(t('filter')) + ': ' + esc(f.label) + '</span><a class="small" href="' + shopHref(cat) + '">' + esc(t('clearFilter')) + '</a>' : '') + '<span class="muted small" id="liveN"></span>';
    }
    const n = $('#liveN');
    if (n) n.textContent = t('filter2', { n: xs.length });
    el.innerHTML = xs.map((st) => {
      const s = st.sp;
      const tags = [];
      tags.push('<span class="tag">' + esc(t('diff.' + s.difficulty)) + '</span>');
      if (st.minTank) tags.push('<span class="tag' + (net && net < st.minTank ? ' bad' : '') + '">' + esc(t('minTank', { n: st.minTank })) + '</span>');
      if (s.reef_safety === 'not-reef-safe') tags.push('<span class="tag hard">' + esc(t('notReef')) + '</span>');
      if (s.reef_safety === 'with-caution') tags.push('<span class="tag">' + esc(t('caution')) + '</span>');
      if (s.verdict && s.verdict.recommendation === 'not_recommended') tags.push('<span class="tag bad">' + esc(t('notRec')) + '</span>');
      const note = st.note ? '<p class="small warn">' + esc(tr(st.note)) + '</p>' : s.verdict ? '<p class="small warn">' + esc(tr(s.verdict.reason)) + '</p>' : '';
      let ctl = '';
      if (st.cls === 'fish' && hasQt) ctl = '<select data-to="' + st.id + '" aria-label="' + esc(t('to')) + '"><option value="qt">' + esc(t('qt')) + '</option><option value="display">' + esc(t('display')) + '</option></select>';
      if (st.group === 'coral') {
        const def = st.light === 'high' ? 'top' : st.light === 'low' ? 'bottom' : 'middle';
        ctl = '<select data-place="' + st.id + '" aria-label="' + esc(t('place')) + '">' + ['top', 'middle', 'bottom'].map((p) => '<option value="' + p + '"' + (p === def ? ' selected' : '') + '>' + esc(t('place.' + p)) + '</option>').join('') + '</select>';
      }
      const im = s.image;
      const img = im ? '<img src="' + esc(im.thumb_500 || im.url) + '" alt="" loading="lazy" decoding="async">' : pic('pack');
      const credit = im ? '<a class="credit" href="' + esc(im.page || im.url) + '" target="_blank" rel="noopener">' + esc(t('photo')) + ': ' + esc(im.author || '') + (im.license ? ', ' + esc(im.license) : '') + '</a>' : '';
      return '<li class="pcard" id="it-' + esc(st.id) + '"><div class="pimg photo">' + img + '</div><div class="pbody"><b>' + esc(spName(st.id)) + '</b> <span class="sci muted small">' + esc(s.scientific_name) + '</span><div class="tags">' + tags.join('') + '</div>' + note +
        '<a class="small" href="../species/#/' + encodeURIComponent(st.id) + '" target="_blank" rel="noopener">' + esc(t('speciesCard')) + ' ↗</a>' + credit + '</div>' +
        '<div class="pfoot"><span class="price">' + st.price + ' 🐚</span>' + ctl + '<button class="btn" data-act="buyAnimal" data-id="' + st.id + '"' + (S.money < st.price || !S.tank || !S.tank.filled ? ' disabled' : '') + '>' + esc(t('buy')) + '</button></div></li>';
    }).join('');
  }
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  // After buying a pack: a step-by-step look at what is in it.
  function packTour(items) {
    const cnt = {};
    items.forEach((x) => { cnt[x] = (cnt[x] || 0) + 1; });
    const ids = Object.keys(cnt);
    const C = Sim.CAT;
    const slide = (i) => {
      const id = ids[i];
      const it = C.tanks[id] || C.eq[id] || C.cons[id];
      const p = C.cons[id] && C.cons[id].item.startsWith('test:') ? C.cons[id].item.slice(5) : '';
      return '<div class="tour"><div class="pimg big">' + pic(id) + '</div><p class="kicker">' + esc(t('of', { a: i + 1, b: ids.length })) + '</p><h3>' + esc((cnt[id] > 1 ? cnt[id] + '× ' : '') + tr(it.name)) + '</h3>' +
        '<p>' + esc(it.desc ? tr(it.desc) : p ? t('test.' + p) : '') + '</p></div>';
    };
    let i = 0;
    modal(t('bought'), slide(0), [{ label: t('prev'), value: 'prev' }, { label: t('next'), value: 'next', primary: true }], (d, done) => {
      const body = d.querySelector('.mbody');
      const [bp, bn] = d.querySelectorAll('footer button');
      const show = () => { body.innerHTML = slide(i); bp.disabled = i === 0; bn.textContent = i === ids.length - 1 ? t('done') : t('next'); };
      show();
      d.querySelector('footer').addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        e.preventDefault();
        if (b.value === 'prev' && i > 0) i--;
        else if (b.value === 'next') { if (i === ids.length - 1) { done(''); return; } i++; }
        show();
      });
    });
  }

  /* ---------- log ---------- */
  let chartP = 'no3';
  function logText(e) {
    const x = e.x || {};
    const v = Object.assign({}, x);
    if (x.sp) v.name = x.name ? x.name + ' (' + spName(x.sp) + ')' : spName(x.sp);
    if (x.by) v.by = spName(x.by);
    if (x.id) v.name = itemName(x.id);
    let s = t('log.' + e.k, v);
    if (e.k === 'death') s += ' ' + causeText(x.cause, x);
    if (x.alarm && e.k === 'power') s += ' 🔔';
    return s;
  }
  function renderLog() {
    const easy = S.opts.difficulty === 'easy';
    const ev = S.log.filter((e) => e.lvl !== 'hidden' || easy).slice().reverse().slice(0, 150);
    app.innerHTML = '<h1>' + esc(t('log')) + '</h1>' +
      '<section class="card"><h2>' + esc(t('chart')) + '</h2><div class="chips">' + PARAMS.map((p) => '<button class="chip" data-act="chartP" data-v="' + p + '" aria-pressed="' + (chartP === p) + '">' + esc(p === 'sal' ? (lang === 'hu' ? 'Só' : 'Salinity') : PNAME[p]) + '</button>').join('') + '</div>' + chartHtml() + '</section>' +
      '<section class="card"><h2>' + esc(t('events')) + '</h2>' + (ev.length ? '<ul class="log">' + ev.map((e) => '<li class="' + e.lvl + '"><span class="d">' + esc(t('day', { n: Math.floor(e.d) + 1 })) + '</span> ' + esc(logText(e)) + '</li>').join('') + '</ul>' : '<p class="muted">' + esc(t('noEvents')) + '</p>') + '</section>';
  }
  function chartHtml() {
    const ms = S.meas.filter((m) => m.p === chartP && !m.qt);
    if (!ms.length) return '<p class="muted">' + esc(t('noMeas')) + '</p>';
    const W = 640; const H = 180; const P = 30;
    const x0 = ms[0].d; const x1 = Math.max(x0 + 1, ms[ms.length - 1].d);
    const vs = ms.map((m) => m.v); const lo = Math.min(0, ...vs); const hi = Math.max(...vs) * 1.15 || 1;
    const X = (d) => P + (d - x0) / (x1 - x0) * (W - P - 10); const Y = (v) => H - P + 10 - (v - lo) / (hi - lo) * (H - P - 10);
    const pts = ms.map((m) => X(m.d).toFixed(1) + ',' + Y(m.v).toFixed(1)).join(' ');
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(PNAME[chartP] || chartP) + '"><line x1="' + P + '" y1="' + (H - P + 10) + '" x2="' + W + '" y2="' + (H - P + 10) + '" class="ax"/>' +
      '<text x="4" y="14" class="lb">' + esc(num(Math.round(hi * 100) / 100)) + '</text><text x="4" y="' + (H - P + 10) + '" class="lb">' + esc(num(lo)) + '</text>' +
      '<polyline points="' + pts + '" class="ln"/>' + ms.map((m) => '<circle cx="' + X(m.d).toFixed(1) + '" cy="' + Y(m.v).toFixed(1) + '" r="3.5" class="pt"><title>' + esc(t('day', { n: Math.floor(m.d) + 1 }) + ': ' + fmtVal(chartP, m.v)) + '</title></circle>').join('') + '</svg>';
  }

  /* ---------- sky ---------- */
  function causeText(c, x) { return t('cause.' + (T['cause.' + c] ? c : 'unknown'), { by: x && x.by ? spName(x.by) : '' }); }
  // The sky aquarium: a bright, happy tank among the clouds where the departed float with halos.
  function heavenSvg(list) {
    const shown = list.slice(0, 30);
    let h = '<defs><linearGradient id="hvsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe8ff"/><stop offset=".6" stop-color="#e6f6ff"/><stop offset="1" stop-color="#fff3d6"/></linearGradient>' +
      '<radialGradient id="hvsun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff7c2"/><stop offset="1" stop-color="#fff7c2" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="800" height="360" fill="url(#hvsky)"/>' +
      '<g class="hv-rays" opacity=".35">' + Array.from({ length: 12 }, (_, i) => '<path d="M680 40 L' + (680 + Math.cos(i * Math.PI / 6) * 420).toFixed(0) + ' ' + (40 + Math.sin(i * Math.PI / 6) * 420).toFixed(0) + ' L' + (680 + Math.cos(i * Math.PI / 6 + 0.12) * 420).toFixed(0) + ' ' + (40 + Math.sin(i * Math.PI / 6 + 0.12) * 420).toFixed(0) + ' Z" fill="#fff7c2"/>').join('') + '</g>' +
      '<circle cx="680" cy="40" r="90" fill="url(#hvsun)"/><circle cx="680" cy="40" r="30" fill="#fff3a0"/>' +
      ['#ff9aa2', '#ffcf8a', '#fff59a', '#a8e6a1', '#9ad0ff', '#c3a6ff'].map((c, i) => '<path d="M60 360 A 280 230 0 0 1 620 360" fill="none" stroke="' + c + '" stroke-width="9" opacity=".45" transform="translate(' + (i * 9) + ' ' + (i * 9) + ') scale(' + (1 - i * 0.03).toFixed(2) + ')"/>').join('');
    const cloud = (x, y, s) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="#fff"><ellipse cx="0" cy="0" rx="46" ry="20"/><ellipse cx="-30" cy="6" rx="30" ry="16"/><ellipse cx="32" cy="6" rx="34" ry="16"/><ellipse cx="6" cy="-14" rx="26" ry="18"/></g>';
    h += '<g class="hv-drift">' + cloud(120, 70, 0.8) + cloud(430, 50, 0.6) + '</g>';
    for (let i = 0; i < 14; i++) h += '<circle class="hv-bub" cx="' + (30 + hash('b' + i) % 740) + '" cy="' + (330 + hash('by' + i) % 30) + '" r="' + (2 + i % 4) + '" fill="none" stroke="#fff" stroke-width="1.5" style="animation-delay:-' + (hash('bd' + i) % 90) / 10 + 's"/>';
    shown.forEach((hv, i) => {
      const st = Sim.CAT.species[hv.sp];
      if (!st) return;
      const x = 70 + (i * 157 + hash(hv.sp + i) % 60) % 660;
      const y = 90 + ((i * 71 + hash('y' + hv.sp + i) % 50) % 190);
      let body;
      if (st.cls === 'fish') {
        const [c1, c2] = fishColors({ sp: hv.sp });
        body = '<ellipse cx="-4" cy="-12" rx="9" ry="5" fill="#fff" opacity=".9" transform="rotate(-25 -4 -12)"/><path d="M-16 0 L-26 -9 L-26 9 Z" fill="' + c1 + '"/><ellipse rx="16" ry="10" fill="' + c1 + '"/><path d="M8 -6 q 6 6 0 12" stroke="' + c2 + '" stroke-width="3" fill="none"/><circle cx="10" cy="-3" r="2" fill="#111"/><path d="M6 4 q 3 3 6 0" stroke="#111" stroke-width="1.2" fill="none"/>';
      } else if (st.group === 'coral') {
        const col = 'hsl(' + hash(hv.sp) % 360 + ',70%,65%)';
        body = '<path d="M0 10 L0 -8 M0 0 q -10 -4 -12 -16 M0 0 q 10 -4 12 -16" stroke="' + col + '" stroke-width="6" stroke-linecap="round" fill="none"/>';
      } else body = '<g transform="scale(.9)">' + critter({ sp: hv.sp }, st.category) + '</g>';
      h += '<g transform="translate(' + x + ' ' + y + ')"><g class="hv-float" style="animation-delay:-' + (hash(hv.sp + i) % 60) / 10 + 's;animation-duration:' + (5 + hash('d' + i) % 5) + 's">' +
        '<ellipse cx="0" cy="-22" rx="12" ry="3.5" fill="none" stroke="#ffd34d" stroke-width="2.5"/>' + body + '<title>' + esc((hv.name ? hv.name + ' – ' : '') + spName(hv.sp)) + '</title></g></g>';
    });
    h += '<g>' + cloud(90, 350, 1.4) + cloud(300, 360, 1.6) + cloud(520, 352, 1.4) + cloud(730, 360, 1.5) + '</g>';
    return h;
  }
  function renderSky() {
    const list = S.heaven.slice().reverse();
    app.innerHTML = '<section class="sky"><h1>☁️ ' + esc(t('sky')) + '</h1><p class="lead">' + esc(t('skyLead')) + '</p>' +
      (list.length ? '<div class="scene-wrap heaven"><svg viewBox="0 0 800 360" role="img" aria-label="' + esc(t('skyHere')) + '">' + heavenSvg(list) + '</svg></div><p class="muted small center">' + esc(t('skyHere')) + '</p>' +
        '<ul class="grid">' + list.map((hv) => '<li class="card memo"><b>' + esc(hv.name ? hv.name + ' – ' + spName(hv.sp) : spName(hv.sp)) + '</b><p class="muted small">' + esc(t('lived', { a: Math.floor(hv.from) + 1, b: Math.floor(hv.to) + 1 })) + '</p>' +
        '<p>' + esc(causeText(hv.cause, hv.x)) + '</p><p class="small"><a href="../species/#/' + encodeURIComponent(hv.sp) + '" target="_blank" rel="noopener">' + esc(t('speciesCard')) + ' ↗</a>' +
        (FD[hv.cause] ? ' · <a href="../fishy-doctor/#/d/' + FD[hv.cause] + '" target="_blank" rel="noopener">' + esc(t('fishyDoctor')) + ' ↗</a>' : '') + '</p></li>').join('') + '</ul>' : '<p class="muted">' + esc(t('skyEmpty')) + '</p>') + '</section>';
  }
  /* ---------- events ---------- */
  function act(btn) {
    const a = btn.dataset.act;
    const v = btn.dataset.v;
    const uid = Number(btn.dataset.uid);
    let r = null;
    const blocked = S && S.ev.holiday && S.ev.holiday.pending && !['holiday', 'menu', 'setView', 'chartP'].includes(a);
    if (blocked) return;
    switch (a) {
      case 'next': advance(1); break;
      case 'week':
        if (S.ani.some((x) => Sim.CAT.species[x.sp].cls === 'fish') && !S.eq.some((e) => Sim.CAT.eq[e.id].kind === 'feeder' && e.state === 'ok')) {
          modal(t('confirm'), '<p>' + esc(t('confirmWeek')) + '</p>', [{ label: t('cancel'), value: '' }, { label: t('yes7'), value: 'ok', primary: true }])
            .then((x) => { if (x.value === 'ok') { advance(7); save(); refreshTank(true); renderActions(); } });
          return;
        }
        advance(7);
        break;
      case 'toggle': running = !running; break;
      case 'speed': S.speed = Number(v); running = true; break;
      case 'menu': openMenu(); return;
      case 'setView': S.view = v; save(); render(); return;
      case 'holiday': r = Sim.holiday(S, v); if (r.ok) { const out = Sim.step(S, 7); afterChange(out); toast(t('back')); r = null; } break;
      case 'fill': r = Sim.fillTank(S); if (r.ok) { save(); renderTank(); } break;
      case 'feed': r = Sim.feed(S, v); if (r.ok) spawnFood(v, r.x.eaten); break;
      case 'coralFeed': r = Sim.coralFeed(S); break;
      case 'measure': r = Sim.measure(S, $('#mParam').value, $('#mTarget') ? $('#mTarget').value : 'display'); break;
      case 'measureP': r = Sim.measure(S, v, 'display'); break;
      case 'measureQt': r = Sim.measure(S, v, 'qt'); break;
      case 'wc': r = Sim.waterChange(S, Number($('#wcPct').value) / 100); break;
      case 'wcP': r = Sim.waterChange(S, Number(v) / 100); break;
      case 'topoff': r = Sim.topOff(S); break;
      case 'dose': r = Sim.dose(S, $('#doseK').value, Math.max(1, Number($('#doseMl').value) || 0)); break;
      case 'use': {
        const item = $('#useItem').value;
        const target = $('#useTarget') ? $('#useTarget').value : 'display';
        if (item === 'copper' && target === 'display' && !confirm(t('confirmCopper'))) return;
        r = Sim.use(S, item, target);
        break;
      }
      case 'useItem': if (v === 'copper' && !confirm(t('confirmCopper'))) return; r = Sim.use(S, v, 'display'); break;
      case 'sal': r = Sim.adjustSal(S, Number(v)); break;
      case 'animal': openAnimal(uid); return;
      case 'hideDone': S.mission.hideDone = true; save(); refreshTank(true); return;
      case 'nextMission': {
        if (!confirm(t('confirmNextMission'))) return;
        const o = S.opts;
        const view = S.view;
        S = Sim.newGame({ mode: v, time: o.time, difficulty: o.difficulty });
        if (view) S.view = view;
        const ms = MISSIONS.find((x) => x.id === v);
        if (ms) Sim.applySetup(S, ms);
        resetScene(); save(); location.hash = '#/tank'; render();
        return;
      }
      case 'copperQt': r = Sim.use(S, 'copper', 'qt'); break;
      case 'sock': r = Sim.changeSock(S); break;
      case 'move': r = Sim.move(S, uid, v); break;
      case 'moveAll': S.ani.filter((x) => Sim.CAT.species[x.sp].cls === 'fish' && x.where !== v).forEach((x) => { r = Sim.move(S, x.uid, v); }); break;
      case 'dip': r = Sim.use(S, 'dip', uid); break;
      case 'rehome': { const an = S.ani.find((x) => x.uid === uid); if (an && confirm(t('confirmRehome', { name: spName(an.sp) }))) r = Sim.rehome(S, uid); break; }
      case 'repair': r = Sim.repair(S, uid); break;
      case 'check': {
        const e = S.eq.find((x) => x.uid === uid);
        if (e && e.state === 'stuck') { e.state = 'broken'; toast(t('log.' + (Sim.CAT.eq[e.id].kind === 'ato' ? 'atoStuck' : 'heaterStuck'))); }
        else toast(t('nothingWrong'));
        break;
      }
      case 'buy': {
        const out = [];
        r = Sim.buy(S, btn.dataset.id, out);
        if (r.ok) { afterChange(out); renderShopList(); }
        break;
      }
      case 'buyPack': {
        const out = [];
        const res = Sim.buyPack(S, btn.dataset.id, out);
        if (res.ok) { afterChange(out); renderShopList(); updateHud(); packTour(res.x.items); return; }
        r = res;
        break;
      }
      case 'buyAnimal': {
        const id = btn.dataset.id;
        const st = Sim.CAT.species[id];
        if (st.sp.verdict && st.sp.verdict.recommendation === 'not_recommended' && !confirm(t('warn.notRec'))) return;
        if (S.tank && st.minTank && S.tank.net < st.minTank && !confirm(t('warn.small', { n: st.minTank }))) return;
        const to = document.querySelector('[data-to="' + id + '"]');
        const pl = document.querySelector('[data-place="' + id + '"]');
        const where = to ? to.value : 'display';
        const out = [];
        r = Sim.buyAnimal(S, id, where, pl ? pl.value : null, out);
        if (r.ok) { afterChange(out); renderLiveList(); result(r, where); r = null; }
        break;
      }
      case 'chartP': chartP = v; renderLog(); return;
      default: return;
    }
    if (r) { result(r); afterChange([]); }
    else save();
    updateHud();
    if (route().view === 'tank') { refreshTank(true); renderActions(); if (['fill', 'buy'].includes(a)) renderSettings(); }
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled || !(app.contains(b) || hud.contains(b))) return;
    e.preventDefault();
    act(b);
  });
  app.addEventListener('submit', (e) => {
    e.preventDefault();
    if (e.target.id === 'startForm') startGame(e.target);
    if (e.target.id === 'setForm') {
      const f = e.target.elements;
      if (f.heater) S.set.heater = Math.min(30, Math.max(20, Number(f.heater.value) || 25.5));
      if (f.light) S.set.light = Math.min(14, Math.max(0, Math.round(Number(f.light.value) || 0)));
      ['kh', 'ca', 'mg'].forEach((k) => { if (f['d-' + k]) S.set.dose[k] = Math.max(0, Number(f['d-' + k].value) || 0); });
      save();
      toast(t('ok.used'));
    }
  });
  app.addEventListener('change', (e) => { if (e.target.id === 'importFile' && e.target.files[0]) importSave(e.target.files[0]); });
  app.addEventListener('input', (e) => { if (e.target.id === 'liveQ') { liveQ = e.target.value; renderLiveList(); } });
  window.addEventListener('hashchange', () => {
    const r = route();
    const inShop = r.view === 'shop' && !!$('.shop');
    render();
    if (!inShop && !r.item) window.scrollTo(0, 0);
  });
  app.addEventListener('click', (e) => {
    const g = e.target.closest('#scene [data-uid]');
    if (g) openAnimal(Number(g.dataset.uid));
  });
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') realTick(); else save(); });

  langPicker = reef42Lang.mount($('#langToggle'), { get: () => lang, set: (c) => { lang = c; ls(false, LANG_KEY, lang); sceneKey = ''; render(); } });

  const getJson = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u); return r.json(); });
  Promise.all([getJson(DATA.species), getJson(DATA.equipment), getJson(DATA.missions), getJson(DATA.overrides)]).then(([db, eq, ms, ov]) => {
    Sim.init({ species: db.species, equipment: eq, overrides: ov });
    MISSIONS = ms;
    S = load();
    realTick();
    render();
    setInterval(realTick, 30000);
    setInterval(save, 5000);
    setInterval(fastTick, 250);
    setInterval(() => { if (!S) return; if (route().view === 'tank') refreshTank(); else updateHud(); }, 1000);
    requestAnimationFrame(loop);
  }).catch(() => { app.innerHTML = '<p>' + esc(t('loadError')) + '</p>'; });
})();

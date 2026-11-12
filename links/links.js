// reef42 link list. To add a link, copy an entry.
// region: 'hu' (Hungary), 'eu' (Europe), 'intl' (international)
// cat: 'community', 'shop', 'service', 'brand' (manufacturers and labs), 'tools', 'learn'
// logo: small square image in logos/ (optional; initials are shown without it); logoZoom enlarges a logo with wide margins
// reef42: true marks reef42's own channels (listed first, in this order); an empty url shows "coming soon".
// fresh: true marks mainly freshwater shops; they are listed last.
// recommended: true shows a "Reef42 recommended" stamp; these come right after reef42's own channels.
window.REEF42_LINKS = [
  {
    name: 'reef42', url: 'https://www.facebook.com/profile.php?id=61574750432340', logo: '../favicon.svg', region: 'hu', cat: 'community', reef42: true,
    desc: { en: 'reef42 on Facebook: news about the tools and reef keeping.', hu: 'A reef42 Facebook-oldala: hírek az eszközökről és a tengeri akvarisztikáról.' },
  },
  {
    name: 'Tengeri akvarista Facebook-csoport', url: 'https://www.facebook.com/groups/1409243863399463', logo: 'logos/facebook.com.png', region: 'hu', cat: 'community', reef42: true,
    desc: { en: 'Hungarian reef keepers’ Facebook group, run by reef42.', hu: 'Magyar tengeri akvaristák Facebook-csoportja, a reef42 gondozásában.' },
  },
  {
    name: 'Tengeri akvarista Discord', url: 'https://discord.gg/k3KC28gCH4', logo: 'logos/discord.com.png', region: 'hu', cat: 'community', reef42: true,
    desc: { en: 'Hungarian reef keepers’ Discord server, run by reef42.', hu: 'Magyar tengeri akvaristák Discord-szervere, a reef42 gondozásában.' },
  },

  // Hungarian Facebook groups
  {
    name: 'Acropora Tengeri Akvarisztika', url: 'https://www.facebook.com/groups/acropora/', logo: 'logos/facebook.com.png', region: 'hu', cat: 'community', recommended: true,
    desc: { en: 'Hungarian reef keeping Facebook group.', hu: 'Magyar tengeri akvarisztikai Facebook-csoport.' },
  },
  {
    name: 'Tengeri Akvaristák Közössége', url: 'https://www.facebook.com/groups/459744474074138/', logo: 'logos/facebook.com.png', region: 'hu', cat: 'community',
    desc: { en: 'Hungarian reef keepers’ community on Facebook.', hu: 'Magyar tengeri akvaristák közössége a Facebookon.' },
  },
  {
    name: 'Tengeri Akvaristák', url: 'https://www.facebook.com/groups/427009410842414/', logo: 'logos/facebook.com.png', region: 'hu', cat: 'community',
    desc: { en: 'Facebook group of Hungarian reef keepers.', hu: 'Magyar tengeri akvaristák Facebook-csoportja.' },
  },
  {
    name: 'Tengeri Akvarisztika – Minden ami érdekes', url: 'https://www.facebook.com/groups/391369719993816/', logo: 'logos/facebook.com.png', region: 'hu', cat: 'community',
    desc: { en: 'Facebook group about everything interesting in reef keeping.', hu: 'Facebook-csoport mindenről, ami a tengeri akvarisztikában érdekes.' },
  },
  {
    name: 'Tengeri akvárium adok-veszek és fórum', url: 'https://www.facebook.com/groups/706508616157254/', logo: 'logos/facebook.com.png', region: 'hu', cat: 'community',
    desc: { en: 'Facebook group for buying and selling marine aquarium gear and livestock, with questions and answers.', hu: 'Facebook-csoport tengeri akvarisztikai adás-vételhez, kérdésekkel és válaszokkal.' },
  },
  {
    name: 'Tengeri akvarisztika adok-veszek', url: 'https://www.facebook.com/groups/tengeriakvariszta/', logo: 'logos/facebook.com.png', region: 'hu', cat: 'community',
    desc: { en: 'Facebook group for buying and selling marine livestock and equipment.', hu: 'Facebook-csoport tengeri élőlények és technika adás-vételéhez.' },
  },
  {
    name: 'Alföldi tengeri akvaristák baráti köre', url: 'https://www.facebook.com/groups/198691031669871/', logo: 'logos/facebook.com.png', region: 'hu', cat: 'community',
    desc: { en: 'Friendly Facebook group of reef keepers from the Great Hungarian Plain.', hu: 'Az Alföld tengeri akvaristáinak baráti Facebook-csoportja.' },
  },

  {
    name: 'PraxisReef', url: 'https://praxisreef.com/', logo: 'logos/praxisreef.com.png', region: 'hu', cat: 'tools', recommended: true,
    desc: { en: 'Hungarian-made reef management platform: dashboard, water chemistry analysis, coral nutrition planning and an AI assistant.', hu: 'Magyar fejlesztésű zátonyakvárium-kezelő platform: áttekintő, vízkémiai elemzés, koralltáplálás-tervezés és AI-asszisztens.' },
  },
  {
    name: 'Aquareef', url: 'https://www.aquareef.hu/', logo: 'logos/aquareef.hu.png', region: 'hu', cat: 'service',
    desc: { en: 'Marine aquarium service: help choosing the right equipment, plus technology and accessories.', hu: 'Tengeri akvarisztikai szolgáltatás: segítség a megfelelő technika kiválasztásában, technika és kiegészítők.' },
  },

  // Hungarian shops
  {
    name: 'Korallgarázs', url: 'https://www.korallgarazs.hu/', logo: 'logos/korallgarazs.hu.png', logoZoom: 1.6, region: 'hu', cat: 'shop',
    desc: { en: 'Marine specialist shop in Fót: live corals, marine fish and aquarium equipment.', hu: 'Fóti tengeri akvarisztikai szaküzlet: élő korallok, tengeri halak és akváriumtechnika.' },
  },
  {
    name: 'Acropora tengeri akvarisztika', url: 'https://acropora.hu/', logo: 'logos/acropora.hu.png', region: 'hu', cat: 'shop',
    desc: { en: 'Marine aquarium shop and webshop.', hu: 'Tengeri akvarisztikai bolt és webáruház.' },
  },
  {
    name: 'Korallosakvárium', url: 'https://korallosakvarium.hu/', logo: 'logos/korallosakvarium.hu.png', region: 'hu', cat: 'shop',
    desc: { en: 'Reef aquarium webshop: salts, supplements, equipment, tank planning.', hu: 'Tengeri akvarisztikai webáruház: sók, adalékok, technika, akváriumtervezés.' },
  },
  {
    name: 'Korallszirt akvarisztika', url: 'https://korallszirt.hu/', logo: 'logos/korallszirt.hu.png', region: 'hu', cat: 'shop',
    desc: { en: 'Aquarium shop with marine salts and reef supplies.', hu: 'Akvarisztika tengeri sókkal és zátonyakváriumos kellékekkel.' },
  },
  {
    name: 'Tropical Fish Debrecen', url: 'https://tropicalfish.hu/', logo: 'logos/tropicalfish.hu.png', region: 'hu', cat: 'shop', fresh: true,
    desc: { en: 'Mainly freshwater aquarium shop in Debrecen, with marine salts and substrates too.', hu: 'Főleg édesvízi debreceni akvarisztika, tengeri sókkal és aljzatokkal is.' },
  },
  {
    name: 'AquaFauna', url: 'https://aquafauna.hu/', logo: 'logos/aquafauna.hu.png', region: 'hu', cat: 'shop', fresh: true,
    desc: { en: 'Mainly freshwater aquarium shop, with marine filter media and supplies too.', hu: 'Főleg édesvízi akvarisztikai szaküzlet, tengeri szűrőanyagokkal és kellékekkel is.' },
  },
  {
    name: 'Tropus Szeged', url: 'https://tropus-szeged.hu/', region: 'hu', cat: 'shop',
    desc: { en: 'Aquarium shop in Szeged, with Aquaforest reef products among others.', hu: 'Szegedi akvarisztika, többek közt Aquaforest tengeri termékekkel.' },
  },
  {
    name: 'Nemo Aquaristic', url: 'https://nemoaquaristic.hu/', region: 'hu', cat: 'shop',
    desc: { en: 'Marine and garden pond specialist shop and webshop in Eger: corals, marine fish, equipment and advice.', hu: 'Egri tengeri akvarisztikai és kerti tavas szaküzlet és webáruház: korallok, tengeri halak, technika és tanácsadás.' },
  },

  // European shops
  {
    name: 'Korallenableger', url: 'https://www.korallenableger.com/', logo: 'logos/korallenableger.com.png', region: 'eu', cat: 'shop', country: 'DE',
    desc: { en: 'German reef shop: corals from their own propagation, equipment and supplies.', hu: 'Német tengeri bolt: saját szaporítású korallok, technika és kellékek.' },
  },
  {
    name: 'Mrutzek Meeresaquaristik', url: 'https://www.shop-meeresaquaristik.de/', logo: 'logos/shop-meeresaquaristik.de.png', region: 'eu', cat: 'shop', country: 'DE',
    desc: { en: 'German marine shop for over 40 years, with livestock shipping.', hu: 'Több mint 40 éves német tengeri bolt, élőállat-szállítással.' },
  },
  {
    name: 'Aquaristik Shop', url: 'https://www.aquaristikshop.com/', logo: 'logos/aquaristikshop.com.jpg', region: 'eu', cat: 'shop', country: 'DE',
    desc: { en: 'Large German aquarium webshop, freshwater and marine.', hu: 'Nagy német akvarisztikai webáruház, édes- és tengervízi termékekkel.' },
  },
  {
    name: 'RecifAtHome', url: 'https://recifathome.com/', logo: 'logos/recifathome.com.png', region: 'eu', cat: 'shop', country: 'FR',
    desc: { en: 'French reef specialist: corals, marine fish and equipment, ships across Europe.', hu: 'Francia zátonyakváriumos szakbolt: korallok, tengeri halak és technika, európai szállítással.' },
  },
  {
    name: 'Zoanthus', url: 'https://www.zoanthus.fr/', logo: 'logos/zoanthus.fr.png', region: 'eu', cat: 'shop', country: 'FR',
    desc: { en: 'French aquarium webshop with a wide marine range.', hu: 'Francia akvarisztikai webáruház széles tengeri kínálattal.' },
  },
  {
    name: 'Marine Aquatics', url: 'https://www.marine-aquatics.inshop.cz/', region: 'eu', cat: 'shop', country: 'CZ',
    desc: { en: 'Czech marine equipment retailer and wholesaler.', hu: 'Cseh tengeri akváriumtechnikai kis- és nagykereskedés.' },
  },

  // Manufacturers and labs
  {
    name: 'Tropic Marin', url: 'https://www.tropic-marin.com/', logo: 'logos/tropic-marin.com.png', region: 'eu', cat: 'brand', country: 'CH',
    desc: { en: 'Swiss maker of sea salts, supplements and filter media.', hu: 'Svájci sók, adalékok és szűrőanyagok gyártója.' },
  },
  {
    name: 'Aquaforest', url: 'https://aquaforest.eu/', logo: 'logos/aquaforest.eu.png', region: 'eu', cat: 'brand', country: 'PL',
    desc: { en: 'Polish maker of salts, supplements and filter media; ICP water tests (AF Lab).', hu: 'Lengyel só-, adalék- és szűrőanyag-gyártó; ICP-vízelemzés (AF Lab).' },
  },
  {
    name: 'Fauna Marin', url: 'https://www.faunamarin.de/', logo: 'logos/faunamarin.de.jpg', region: 'eu', cat: 'brand', country: 'DE',
    desc: { en: 'German maker of salts, supplements and coral foods, with a knowledge base.', hu: 'Német só-, adalék- és koralltáp-gyártó, tudásbázissal.' },
  },
  {
    name: 'Triton', url: 'https://triton.de/', region: 'eu', cat: 'brand', country: 'DE',
    desc: { en: 'ICP-OES seawater analysis lab and supplementation systems.', hu: 'ICP-OES tengervízelemző labor és pótlórendszerek.' },
  },
  {
    name: 'Red Sea', url: 'https://www.redseafish.com/', logo: 'logos/redseafish.com.png', region: 'intl', cat: 'brand',
    desc: { en: 'Salts, test kits, supplements and complete reef aquariums.', hu: 'Sók, tesztek, adalékok és komplett zátonyakváriumok.' },
  },

  // Tools and apps
  {
    name: 'ReefCalcs', url: 'https://reefcalcs.com/', region: 'intl', cat: 'tools',
    desc: { en: 'Reef calculators with sources: volume, salt, dosing, conversions.', hu: 'Forrásokkal ellátott kalkulátorok: térfogat, só, adagolás, átváltások.' },
  },

  // Community and knowledge
  {
    name: 'Reef2Reef', url: 'https://www.reef2reef.com/', logo: 'logos/reef2reef.com.png', region: 'intl', cat: 'community',
    desc: { en: 'The largest English reef forum, with articles by Randy Holmes-Farley and others.', hu: 'A legnagyobb angol nyelvű tengeri fórum, Randy Holmes-Farley és mások cikkeivel.' },
  },
  {
    name: 'Humble.Fish', url: 'https://humble.fish/', logo: 'logos/humble.fish.png', region: 'intl', cat: 'community',
    desc: { en: 'Reef community focused on fish health, quarantine and disease treatment.', hu: 'Halegészségre, karanténra és betegségkezelésre fókuszáló tengeri közösség.' },
  },
  {
    name: 'Reef Builders', url: 'https://reefbuilders.com/', logo: 'logos/reefbuilders.com.png', region: 'intl', cat: 'learn',
    desc: { en: 'Reef hobby news, new products, species and trade shows.', hu: 'Tengeri akvarisztikai hírek, új termékek, fajok és kiállítások.' },
  },
];

// reef42 link list. To add a link, copy an entry.
// region: 'hu' (Hungary), 'eu' (Europe), 'intl' (international)
// cat: 'community', 'shop', 'brand' (manufacturers and labs), 'tools', 'learn'
// reef42: true marks reef42's own channels; an empty url shows the entry as "coming soon".
window.REEF42_LINKS = [
  {
    name: 'Tengeri akvarista Discord', url: '', region: 'hu', cat: 'community', reef42: true,
    desc: { en: 'Hungarian reef keepers’ Discord server, run by reef42.', hu: 'Magyar tengeri akvaristák Discord-szervere, a reef42 gondozásában.' },
  },
  {
    name: 'Tengeri akvarista Facebook-csoport', url: '', region: 'hu', cat: 'community', reef42: true,
    desc: { en: 'Hungarian reef keepers’ Facebook group, run by reef42.', hu: 'Magyar tengeri akvaristák Facebook-csoportja, a reef42 gondozásában.' },
  },

  // Hungarian shops
  {
    name: 'Aquareef', url: 'https://www.aquareef.hu/', region: 'hu', cat: 'shop',
    desc: { en: 'Marine aquarium equipment, salts, supplements and filter media.', hu: 'Tengeri akváriumtechnika, sók, adalékok és szűrőanyagok.' },
  },
  {
    name: 'Korallosakvárium', url: 'https://korallosakvarium.hu/', region: 'hu', cat: 'shop',
    desc: { en: 'Reef aquarium webshop: salts, supplements, equipment, tank planning.', hu: 'Tengeri akvarisztikai webáruház: sók, adalékok, technika, akváriumtervezés.' },
  },
  {
    name: 'Korallszirt akvarisztika', url: 'https://korallszirt.hu/', region: 'hu', cat: 'shop',
    desc: { en: 'Aquarium shop with marine salts and reef supplies.', hu: 'Akvarisztika tengeri sókkal és zátonyakváriumos kellékekkel.' },
  },
  {
    name: 'Tropical Fish Debrecen', url: 'https://tropicalfish.hu/', region: 'hu', cat: 'shop',
    desc: { en: 'Aquarium shop in Debrecen with marine salts, substrates and supplies.', hu: 'Debreceni akvarisztika tengeri sókkal, aljzatokkal és kellékekkel.' },
  },
  {
    name: 'AquaFauna', url: 'https://aquafauna.hu/', region: 'hu', cat: 'shop',
    desc: { en: 'Aquarium specialist shop, marine filter media and supplies too.', hu: 'Akvarisztikai szaküzlet, tengeri szűrőanyagokkal és kellékekkel is.' },
  },
  {
    name: 'Tropus Szeged', url: 'https://tropus-szeged.hu/', region: 'hu', cat: 'shop',
    desc: { en: 'Aquarium shop in Szeged, with Aquaforest reef products among others.', hu: 'Szegedi akvarisztika, többek közt Aquaforest tengeri termékekkel.' },
  },

  // European shops
  {
    name: 'Korallenableger', url: 'https://www.korallenableger.com/', region: 'eu', cat: 'shop', country: 'DE',
    desc: { en: 'German reef shop: corals from their own propagation, equipment and supplies.', hu: 'Német tengeri bolt: saját szaporítású korallok, technika és kellékek.' },
  },
  {
    name: 'Mrutzek Meeresaquaristik', url: 'https://www.shop-meeresaquaristik.de/', region: 'eu', cat: 'shop', country: 'DE',
    desc: { en: 'German marine shop for over 40 years, with livestock shipping.', hu: 'Több mint 40 éves német tengeri bolt, élőállat-szállítással.' },
  },
  {
    name: 'Aquaristik Shop', url: 'https://www.aquaristikshop.com/', region: 'eu', cat: 'shop', country: 'DE',
    desc: { en: 'Large German aquarium webshop, freshwater and marine.', hu: 'Nagy német akvarisztikai webáruház, édes- és tengervízi termékekkel.' },
  },
  {
    name: 'RecifAtHome', url: 'https://recifathome.com/', region: 'eu', cat: 'shop', country: 'FR',
    desc: { en: 'French reef specialist: corals, marine fish and equipment, ships across Europe.', hu: 'Francia zátonyakváriumos szakbolt: korallok, tengeri halak és technika, európai szállítással.' },
  },
  {
    name: 'Zoanthus', url: 'https://www.zoanthus.fr/', region: 'eu', cat: 'shop', country: 'FR',
    desc: { en: 'French aquarium webshop with a wide marine range.', hu: 'Francia akvarisztikai webáruház széles tengeri kínálattal.' },
  },
  {
    name: 'Marine Aquatics', url: 'https://www.marine-aquatics.inshop.cz/', region: 'eu', cat: 'shop', country: 'CZ',
    desc: { en: 'Czech marine equipment retailer and wholesaler.', hu: 'Cseh tengeri akváriumtechnikai kis- és nagykereskedés.' },
  },

  // Manufacturers and labs
  {
    name: 'Tropic Marin', url: 'https://www.tropic-marin.com/', region: 'eu', cat: 'brand', country: 'CH',
    desc: { en: 'Swiss maker of sea salts, supplements and filter media.', hu: 'Svájci sók, adalékok és szűrőanyagok gyártója.' },
  },
  {
    name: 'Aquaforest', url: 'https://aquaforest.eu/', region: 'eu', cat: 'brand', country: 'PL',
    desc: { en: 'Polish maker of salts, supplements and filter media; ICP water tests (AF Lab).', hu: 'Lengyel só-, adalék- és szűrőanyag-gyártó; ICP-vízelemzés (AF Lab).' },
  },
  {
    name: 'Fauna Marin', url: 'https://www.faunamarin.de/', region: 'eu', cat: 'brand', country: 'DE',
    desc: { en: 'German maker of salts, supplements and coral foods, with a knowledge base.', hu: 'Német só-, adalék- és koralltáp-gyártó, tudásbázissal.' },
  },
  {
    name: 'Triton', url: 'https://triton.de/', region: 'eu', cat: 'brand', country: 'DE',
    desc: { en: 'ICP-OES seawater analysis lab and supplementation systems.', hu: 'ICP-OES tengervízelemző labor és pótlórendszerek.' },
  },
  {
    name: 'Red Sea', url: 'https://www.redseafish.com/', region: 'intl', cat: 'brand',
    desc: { en: 'Salts, test kits, supplements and complete reef aquariums.', hu: 'Sók, tesztek, adalékok és komplett zátonyakváriumok.' },
  },

  // Tools and apps
  {
    name: 'PraxisReef', url: 'https://praxisreef.com/', region: 'intl', cat: 'tools',
    desc: { en: 'Reef management platform: dashboard, water chemistry analysis, coral nutrition planning and an AI assistant.', hu: 'Zátonyakvárium-kezelő platform: áttekintő, vízkémiai elemzés, koralltáplálás-tervezés és AI-asszisztens.' },
  },
  {
    name: 'ReefCalcs', url: 'https://reefcalcs.com/', region: 'intl', cat: 'tools',
    desc: { en: 'Reef calculators with sources: volume, salt, dosing, conversions.', hu: 'Forrásokkal ellátott kalkulátorok: térfogat, só, adagolás, átváltások.' },
  },

  // Community and knowledge
  {
    name: 'Reef2Reef', url: 'https://www.reef2reef.com/', region: 'intl', cat: 'community',
    desc: { en: 'The largest English reef forum, with articles by Randy Holmes-Farley and others.', hu: 'A legnagyobb angol nyelvű tengeri fórum, Randy Holmes-Farley és mások cikkeivel.' },
  },
  {
    name: 'Humble.Fish', url: 'https://humble.fish/', region: 'intl', cat: 'community',
    desc: { en: 'Reef community focused on fish health, quarantine and disease treatment.', hu: 'Halegészségre, karanténra és betegségkezelésre fókuszáló tengeri közösség.' },
  },
  {
    name: 'Reef Builders', url: 'https://reefbuilders.com/', region: 'intl', cat: 'learn',
    desc: { en: 'Reef hobby news, new products, species and trade shows.', hu: 'Tengeri akvarisztikai hírek, új termékek, fajok és kiállítások.' },
  },
];

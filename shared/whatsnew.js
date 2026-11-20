// reef42 "what's new" dialog, shared by every page. Shows the release notes once per new version;
// the newest seen version id is kept in localStorage['reef42-seen-version']. First-time visitors (nothing stored yet)
// get a short welcome tour instead, which also counts as having seen the current notes.
// New release: add an entry to the top of VERSIONS (id = date, newest first).
(function () {
  var KEY = 'reef42-seen-version';
  var ROOT = new URL('../', document.currentScript.src).href;
  var VERSIONS = [
    {
      id: '2026-11-20',
      hu: [
        'Fajadatbázis: 75 helyett 265 halfaj, 14 új halcsaláddal (pl. anthiasok, damsel, hawkfish, sárkányhalak, ráják és cápák, csikóhalak, triggerfish).',
        'Reef game: az első küldetés kész kezdőcsomaggal és bemutatóval indul, az eszközök és az üres tartály fél áron eladhatók, és van 20× és 50× gyorsítás.',
        'Új eszköz: Szótár. Az oldalakon a szakszavak alá vannak húzva: fölé állva vagy rákoppintva megjelenik a jelentésük, és egy kattintással megnyitható a szótárban.',
        'Fajok: a kategória- és típuscsempéken minden betöltéskor más fajok fotói jelennek meg.',
        'Tank Log: új akvárium varázslóval (fajta, méret, indulás), és új Lakók fül: a fajadatbázisból felvett lakókkal és halterheléssel.',
        'Illik hozzád? A Tank Logba felvett akváriumod alapján minden fajnál megmutatjuk, hogy jó választás-e, és miért (méret, fajta, a tank kora, ki kit eszik, ki kivel nem fér meg).',
        'Fajok: „Fajaim” nézet az akváriumod lakóival, és egy kapcsoló a nem ajánlott fajok elrejtéséhez.',
        'Az első látogatáskor rövid bemutató segít eligazodni.',
        'Új: ez az újdonságok ablak 🙂'
      ],
      en: [
        'Species database: 265 fish species instead of 75, with 14 new fish families (e.g. anthias, damsels, hawkfish, dragonets, rays and sharks, seahorses, triggerfish).',
        'Reef game: the first mission starts with a ready-made starter pack and a tour, equipment and an empty tank can be sold for half price, and time can run 20× and 50× faster.',
        'New tool: Glossary. Reef keeping terms are underlined across the site: hover or tap one to see what it means, and open it in the glossary with one click.',
        'Species: the category and type tiles show photos of different species on every visit.',
        'Tank Log: set up a new tank with a wizard (type, size, start date), and a new Livestock tab with residents from the species database and the fish load.',
        'Does it suit you? Based on your Tank Log tank, every species shows whether it is a good choice, and why (size, tank type and age, who eats whom, who does not get along).',
        'Species: a “My species” view with your tank’s livestock, and a switch to hide species that are not recommended.',
        'First-time visitors get a short tour.',
        'New: this what’s new window 🙂'
      ]
    }
  ];
  var TEXT = {
    hu: { title: 'Újdonságok', ok: 'Rendben', close: 'Bezárás', next: 'Tovább', back: 'Vissza', start: 'Kezdjük', later: 'Később' },
    en: { title: 'What’s new', ok: 'Got it', close: 'Close', next: 'Next', back: 'Back', start: 'Let’s go', later: 'Later' }
  };
  // Welcome tour: { title, text, cta: [label, path from the site root] }
  var WELCOME = {
    hu: [
      { title: 'Üdv a reef42-n!', text: 'Ingyenes eszközök tengeri akvaristáknak: halbetegség-azonosító, vízparaméter-napló, kalkulátorok, fajadatbázis, szótár és egy virtuális akvárium a gyakorláshoz.' },
      { title: 'Vedd fel az akváriumodat', text: 'A Tank Logban add meg az akváriumod fajtáját, méretét, indulását és lakóit. Ezután a Fajoknál minden fajnál megmutatjuk, illik-e hozzá, és miért.', cta: ['Akvárium felvétele', 'tank-log/#/setup'] },
      { title: 'Ismeretlen szó?', text: 'Az aláhúzott szakszavakra állva vagy rákoppintva megjelenik a jelentésük. Az összes szót a Szótárban találod.' }
    ],
    en: [
      { title: 'Welcome to reef42!', text: 'Free tools for saltwater aquarium keepers: a fish disease guide, a water parameter log, calculators, a species database, a glossary and a virtual reef tank to practise on.' },
      { title: 'Add your tank', text: 'In Tank Log, enter your tank’s type, size, start date and livestock. The species pages then show for every species whether it suits your tank, and why.', cta: ['Add my tank', 'tank-log/#/setup'] },
      { title: 'Unfamiliar word?', text: 'Hover over or tap an underlined term to see what it means. Every term is in the Glossary.' }
    ]
  };
  var CSS =
    '.reef42-news{border:1px solid var(--border,var(--line,#262626));border-radius:var(--radius,14px);padding:0;' +
      'background:var(--surface,var(--card,#0b0b0b));color:var(--text,#fff);width:min(480px,calc(100vw - 24px));' +
      'max-height:calc(100vh - 32px);box-shadow:var(--shadow,0 8px 24px rgba(0,0,0,.35))}' +
    '.reef42-news::backdrop{background:rgba(0,0,0,.45)}' +
    '.reef42-news form{display:flex;flex-direction:column;max-height:calc(100vh - 34px);margin:0}' +
    '.reef42-news header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:14px 16px 6px}' +
    '.reef42-news h2{margin:0;font-size:1.1rem}' +
    '.reef42-news h3{margin:12px 0 4px;font-size:.85rem;font-weight:600;color:var(--muted,#8a8a8a)}' +
    '.reef42-news h3:first-child{margin-top:0}' +
    '.reef42-news ul{margin:0;padding-left:20px}' +
    '.reef42-news li{margin:0 0 6px}' +
    '.reef42-news .x{border:0;background:transparent;font-size:1.6rem;line-height:1;cursor:pointer;color:var(--muted,#8a8a8a);min-width:40px;min-height:40px}' +
    '.reef42-news .nbody{padding:6px 16px 16px;overflow-y:auto}' +
    '.reef42-news footer{display:flex;justify-content:flex-end;padding:12px 16px;border-top:1px solid var(--border,var(--line,#262626))}' +
    '.reef42-news .nok{font:inherit;font-weight:600;border:0;border-radius:999px;padding:8px 18px;cursor:pointer;text-decoration:none;' +
      'background:var(--accent,var(--text,#fff));color:var(--accent-ink,var(--bg,#000))}' +
    '.reef42-news .nsec{font:inherit;font-weight:600;border:1px solid var(--border,var(--line,#262626));border-radius:999px;padding:7px 16px;' +
      'cursor:pointer;background:transparent;color:inherit}' +
    '.reef42-news .wfoot{justify-content:space-between;align-items:center;gap:8px}' +
    '.reef42-news .wbtns{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}' +
    '.reef42-news .wstep{color:var(--muted,#8a8a8a);font-size:.85rem;font-variant-numeric:tabular-nums}' +
    '.reef42-news .nbody p{margin:0;line-height:1.55}';

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function pending() {
    var seen = lsGet(KEY);
    if (!seen) return VERSIONS.slice(0, 1);
    return VERSIONS.filter(function (v) { return v.id > seen; });
  }
  function lang() {
    var l = new URLSearchParams(location.search).get('lang') || lsGet('reef42-lang') ||
      ((navigator.language || '').toLowerCase().indexOf('hu') === 0 ? 'hu' : 'en');
    return l === 'hu' ? 'hu' : 'en';
  }
  function fmtDate(id, l) {
    var d = new Date(id + 'T12:00:00');
    return isNaN(d) ? id : d.toLocaleDateString(l === 'hu' ? 'hu-HU' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function newDialog() {
    var d = document.createElement('dialog');
    if (typeof d.showModal !== 'function') return null;
    if (!document.getElementById('reef42-news-css')) {
      var st = document.createElement('style');
      st.id = 'reef42-news-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    d.className = 'reef42-news';
    d.addEventListener('close', function () { lsSet(KEY, VERSIONS[0].id); d.remove(); });
    return d;
  }

  function welcome() {
    var l = lang(), t = TEXT[l], steps = WELCOME[l], i = 0;
    var d = newDialog();
    if (!d) return;
    d.lang = l;
    d.setAttribute('aria-labelledby', 'reef42-news-title');
    function draw() {
      var s = steps[i], last = i === steps.length - 1;
      d.innerHTML = '<form method="dialog"><header><h2 id="reef42-news-title">' + esc(s.title) + '</h2>' +
        '<button type="submit" class="x" aria-label="' + esc(t.close) + '">×</button></header>' +
        '<div class="nbody"><p>' + esc(s.text) + '</p></div><footer class="wfoot"><span class="wstep">' + (i + 1) + ' / ' + steps.length + '</span><span class="wbtns">' +
        (i ? '<button type="button" class="nsec" data-go="-1">' + esc(t.back) + '</button>' : '') +
        (s.cta
          ? '<button type="button" class="nsec" data-go="1">' + esc(t.later) + '</button><a class="nok" href="' + esc(ROOT + s.cta[1]) + '" data-cta>' + esc(s.cta[0]) + '</a>'
          : last ? '<button type="submit" class="nok">' + esc(t.start) + '</button>' : '<button type="button" class="nok" data-go="1">' + esc(t.next) + '</button>') +
        '</span></footer></form>';
      var f = d.querySelector('.nok');
      if (f) f.focus();
    }
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-go]');
      if (b) { i = Math.max(0, Math.min(steps.length - 1, i + Number(b.dataset.go))); draw(); }
      // The link may only change the hash (on Tank Log itself), so close the tour before it navigates.
      if (e.target.closest('[data-cta]')) d.close();
    });
    draw();
    document.body.appendChild(d);
    d.showModal();
  }

  function show() {
    if (!lsGet(KEY)) { welcome(); return; }
    var list = pending();
    if (!list.length) return;
    var l = lang(), t = TEXT[l];
    var d = newDialog();
    if (!d) return;
    d.lang = l;
    d.setAttribute('aria-labelledby', 'reef42-news-title');
    d.innerHTML = '<form method="dialog"><header><h2 id="reef42-news-title">' + esc(t.title) + '</h2>' +
      '<button type="submit" class="x" aria-label="' + esc(t.close) + '">×</button></header><div class="nbody">' +
      list.map(function (v) {
        return '<h3>' + esc(fmtDate(v.id, l)) + '</h3><ul>' + v[l].map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>';
      }).join('') +
      '</div><footer><button type="submit" class="nok" autofocus>' + esc(t.ok) + '</button></footer></form>';
    document.body.appendChild(d);
    d.showModal();
  }

  // Wait until the password gate is open and no other dialog (e.g. a page's own notice) is showing.
  function whenFree() {
    if (document.documentElement.classList.contains('reef42-locked')) {
      document.addEventListener('reef42-unlock', whenFree, { once: true });
      return;
    }
    var other = document.querySelector('dialog[open]');
    if (other) { other.addEventListener('close', function () { setTimeout(whenFree, 0); }, { once: true }); return; }
    show();
  }
  // Without storage the window would come back on every page load, so it is skipped.
  if (!lsSet('reef42-storage-test', '1')) return;
  try { localStorage.removeItem('reef42-storage-test'); } catch (e) {}
  if (!pending().length) return;
  if (document.readyState === 'complete') whenFree(); else window.addEventListener('load', whenFree);
})();

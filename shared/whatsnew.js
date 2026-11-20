// reef42 "what's new" dialog, shared by every page. Shows the release notes once per new version;
// the newest seen version id is kept in localStorage['reef42-seen-version'].
// New release: add an entry to the top of VERSIONS (id = date, newest first).
(function () {
  var KEY = 'reef42-seen-version';
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
        'Új: ez az újdonságok ablak 🙂'
      ],
      en: [
        'Species database: 265 fish species instead of 75, with 14 new fish families (e.g. anthias, damsels, hawkfish, dragonets, rays and sharks, seahorses, triggerfish).',
        'Reef game: the first mission starts with a ready-made starter pack and a tour, equipment and an empty tank can be sold for half price, and time can run 20× and 50× faster.',
        'New tool: Glossary. Reef keeping terms are underlined across the site: hover or tap one to see what it means, and open it in the glossary with one click.',
        'Species: the category and type tiles show photos of different species on every visit.',
        'Tank Log: set up a new tank with a wizard (type, size, start date), and a new Livestock tab with residents from the species database and the fish load.',
        'Does it suit you? Based on your Tank Log tank, every species shows whether it is a good choice, and why (size, tank type and age, who eats whom, who does not get along).',
        'New: this what’s new window 🙂'
      ]
    }
  ];
  var TEXT = {
    hu: { title: 'Újdonságok', ok: 'Rendben', close: 'Bezárás' },
    en: { title: 'What’s new', ok: 'Got it', close: 'Close' }
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
    '.reef42-news .nok{font:inherit;font-weight:600;border:0;border-radius:999px;padding:8px 18px;cursor:pointer;' +
      'background:var(--accent,var(--text,#fff));color:var(--accent-ink,var(--bg,#000))}';

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

  function show() {
    var list = pending();
    if (!list.length) return;
    var l = lang(), t = TEXT[l];
    var d = document.createElement('dialog');
    if (typeof d.showModal !== 'function') return;
    if (!document.getElementById('reef42-news-css')) {
      var st = document.createElement('style');
      st.id = 'reef42-news-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    d.className = 'reef42-news';
    d.lang = l;
    d.setAttribute('aria-labelledby', 'reef42-news-title');
    d.innerHTML = '<form method="dialog"><header><h2 id="reef42-news-title">' + esc(t.title) + '</h2>' +
      '<button type="submit" class="x" aria-label="' + esc(t.close) + '">×</button></header><div class="nbody">' +
      list.map(function (v) {
        return '<h3>' + esc(fmtDate(v.id, l)) + '</h3><ul>' + v[l].map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>';
      }).join('') +
      '</div><footer><button type="submit" class="nok" autofocus>' + esc(t.ok) + '</button></footer></form>';
    d.addEventListener('close', function () { lsSet(KEY, VERSIONS[0].id); d.remove(); });
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

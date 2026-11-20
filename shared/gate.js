// reef42 access gate: password overlay on every page while the site is under development. Not real protection.
// Load it in <head> without defer. Remove the script tags to open the site.
(function () {
  var KEY = 'reef42-gate';
  var PASS = 'copperband';
  var DISCORD = 'https://discord.gg/k3KC28gCH4';

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  if (lsGet(KEY) === '1') return;

  var TEXT = {
    hu: {
      title: 'Fejlesztés alatt',
      text: 'A reef42 még fejlesztés alatt áll. Hozzáférést a Discord-szerverünkön kérhetsz.',
      discord: 'Hozzáférés kérése a Discordon',
      label: 'Jelszó',
      submit: 'Belépés',
      wrong: 'Hibás jelszó.'
    },
    en: {
      title: 'Under development',
      text: 'reef42 is still under development. You can ask for access on our Discord server.',
      discord: 'Ask for access on Discord',
      label: 'Password',
      submit: 'Enter',
      wrong: 'Wrong password.'
    }
  };
  var lang = new URLSearchParams(location.search).get('lang') || lsGet('reef42-lang') ||
    ((navigator.language || '').toLowerCase().indexOf('hu') === 0 ? 'hu' : 'en');
  var t = TEXT[lang === 'hu' ? 'hu' : 'en'];

  var CSS =
    'html.reef42-locked,html.reef42-locked body{overflow:hidden!important}' +
    'html.reef42-locked body>*:not(#reef42-gate){visibility:hidden!important}' +
    '#reef42-gate{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;' +
      'padding:16px;background:#000;color:#fff;font:16px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;' +
      'text-align:left;letter-spacing:normal;text-transform:none}' +
    '#reef42-gate *{box-sizing:border-box}' +
    '#reef42-gate .g-box{width:100%;max-width:380px;padding:28px 24px;background:#0b0b0b;border:1px solid #262626;border-radius:14px}' +
    '#reef42-gate .g-brand{margin:0 0 18px;font-weight:800;font-size:1.1rem;letter-spacing:-.01em}' +
    '#reef42-gate h1{margin:0 0 8px;font-size:1.5rem;line-height:1.2;font-weight:700;color:#fff}' +
    '#reef42-gate p{margin:0 0 16px;color:#b5b5b5}' +
    '#reef42-gate .g-discord{display:inline-block;margin:0 0 22px;color:#fff;text-decoration:underline;text-underline-offset:3px}' +
    '#reef42-gate label{display:block;margin:0 0 6px;font-size:.9rem;color:#b5b5b5}' +
    '#reef42-gate .g-row{display:flex;gap:8px}' +
    '#reef42-gate input{flex:1;min-width:0;font:inherit;color:#fff;background:#000;border:1px solid #3a3a3a;border-radius:8px;padding:9px 12px}' +
    '#reef42-gate input:focus{outline:2px solid #fff;outline-offset:1px}' +
    '#reef42-gate button{font:inherit;font-weight:600;color:#000;background:#fff;border:0;border-radius:8px;padding:9px 16px;cursor:pointer}' +
    '#reef42-gate button:focus-visible{outline:2px solid #fff;outline-offset:2px}' +
    '#reef42-gate .g-err{min-height:1.5em;margin:8px 0 0;color:#ff7b7b;font-size:.9rem}';

  var root = document.documentElement;
  root.classList.add('reef42-locked');
  var st = document.createElement('style');
  st.id = 'reef42-gate-css';
  st.textContent = CSS;
  (document.head || root).appendChild(st);

  function build() {
    var el = document.createElement('div');
    el.id = 'reef42-gate';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'reef42-gate-title');
    el.lang = lang === 'hu' ? 'hu' : 'en';
    el.innerHTML =
      '<div class="g-box">' +
        '<p class="g-brand">reef42</p>' +
        '<h1 id="reef42-gate-title">' + t.title + '</h1>' +
        '<p>' + t.text + '</p>' +
        '<a class="g-discord" href="' + DISCORD + '" target="_blank" rel="noopener">' + t.discord + '</a>' +
        '<form novalidate>' +
          '<label for="reef42-gate-pw">' + t.label + '</label>' +
          '<div class="g-row"><input id="reef42-gate-pw" type="password" autocomplete="off" autocapitalize="off" spellcheck="false">' +
          '<button type="submit">' + t.submit + '</button></div>' +
          '<p class="g-err" role="alert"></p>' +
        '</form>' +
      '</div>';
    document.body.appendChild(el);
    var input = el.querySelector('input');
    var err = el.querySelector('.g-err');
    el.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      if (input.value.trim().toLowerCase() === PASS) {
        lsSet(KEY, '1');
        el.remove();
        st.remove();
        root.classList.remove('reef42-locked');
      } else {
        err.textContent = t.wrong;
        input.select();
      }
    });
    input.focus();
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();

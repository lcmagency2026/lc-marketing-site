(function () {
  var root = document.documentElement;
  var body = document.body;

  // Reflet chrome qui suit le défilement
  var raf = 0;
  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      var el = document.scrollingElement || root;
      var max = el.scrollHeight - el.clientHeight;
      var pos = max > 0 ? el.scrollTop / max : 0;
      root.style.setProperty('--chrome', (pos * 100).toFixed(2));
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Vidéos : forcer la lecture muette (Safari / iOS)
  function playAll() {
    var vs = document.querySelectorAll('video');
    for (var i = 0; i < vs.length; i++) {
      vs[i].muted = true;
      var p = vs[i].play();
      if (p && p.catch) p.catch(function () {});
    }
  }

  // Intro animée (une fois par visite)
  var hero = document.getElementById('accueil');
  var intro = document.getElementById('intro');
  var timers = [];
  function showHero() { if (hero) { hero.classList.remove('hero-wait'); hero.classList.add('hero-in'); } }
  function removeIntro() { if (intro && intro.parentNode) intro.parentNode.removeChild(intro); body.classList.remove('intro-lock'); }

  var reduce = false, seen = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  try { seen = sessionStorage.getItem('lc-intro') === '1'; } catch (e) {}

  if (!intro || reduce || seen) {
    removeIntro();
    showHero();
  } else {
    try { sessionStorage.setItem('lc-intro', '1'); } catch (e) {}
    timers.push(setTimeout(showHero, 3300));
    timers.push(setTimeout(removeIntro, 4000));
    var skip = document.getElementById('intro-skip');
    if (skip) skip.addEventListener('click', function () {
      timers.forEach(clearTimeout);
      intro.className = 'intro intro-skip';
      showHero();
      setTimeout(removeIntro, 500);
    });
  }


  // ---------- Consentement aux témoins (Loi 25) ----------
  // GA4 ne se charge qu'après un clic sur « Accepter ». Le choix est gardé 12 mois.
  var meta = document.querySelector('meta[name="lc-ga4"]');
  var GA = meta ? meta.getAttribute('content') : '';
  var KEY = 'lc-consent-v1', MAX_AGE = 365 * 24 * 3600 * 1000;
  var banner = document.getElementById('consent');
  var gaLoaded = false;

  function readChoice() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (c && (c.s === 'granted' || c.s === 'denied') && Date.now() - c.t < MAX_AGE) return c.s;
    } catch (e) {}
    return null;
  }
  function saveChoice(s) { try { localStorage.setItem(KEY, JSON.stringify({ s: s, t: Date.now() })); } catch (e) {} }

  function loadGA() {
    if (!GA || gaLoaded) return;
    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: 33696000 // 13 mois
    });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA);
    document.head.appendChild(s);
  }

  function clearGACookies() {
    var host = location.hostname, parts = host.split('.');
    var domains = ['', host, '.' + host];
    if (parts.length > 1) domains.push('.' + parts.slice(-2).join('.'));
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name.indexOf('_ga') === 0 || name.indexOf('_gid') === 0) {
        domains.forEach(function (d) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
        });
      }
    });
  }

  function showBanner(focus) {
    if (!banner) return;
    banner.hidden = false;
    if (focus) { var b = banner.querySelector('button'); if (b) b.focus(); }
  }
  function hideBanner() { if (banner) banner.hidden = true; }

  function choose(s) {
    var before = readChoice();
    saveChoice(s);
    hideBanner();
    if (s === 'granted') loadGA();
    else {
      clearGACookies();
      if (gaLoaded || before === 'granted') location.reload(); // arrêter GA déjà chargé
    }
  }

  if (GA && banner) {
    var current = readChoice();
    if (current === 'granted') loadGA();
    else if (current === null) {
      // Laisser l'intro se terminer avant d'afficher la bannière
      var delay = document.getElementById('intro') ? 4200 : 900;
      setTimeout(function () { showBanner(false); }, delay);
    }
    banner.addEventListener('click', function (e) {
      var t = e.target.closest('[data-consent]');
      if (t) choose(t.getAttribute('data-consent'));
    });
    document.querySelectorAll('[data-consent-open]').forEach(function (b) {
      b.addEventListener('click', function () { showBanner(true); });
    });
  }

  [50, 600, 2000, 4500].forEach(function (ms) { setTimeout(playAll, ms); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) playAll(); });
})();

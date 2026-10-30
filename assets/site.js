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

  [50, 600, 2000, 4500].forEach(function (ms) { setTimeout(playAll, ms); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) playAll(); });
})();

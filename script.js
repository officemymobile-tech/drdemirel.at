// Aktuelles-Dropdown
(function () {
  var btn = document.querySelector('.nav-aktuelles-btn');
  var panel = document.getElementById('aktuelles-panel');
  var wrap = document.querySelector('.nav-aktuelles-wrap');
  if (!btn || !panel || !wrap) return;

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = wrap.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open);
  });

  document.addEventListener('click', function (e) {
    if (!wrap.contains(e.target)) {
      wrap.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();

// Anker-Scroll: fixe Kopfzeile berücksichtigen, Überschrift sichtbar ausrichten
(function () {
  var EXTRA = 16;

  function getOffset() {
    var sticky = document.querySelector('.sticky-top');
    return (sticky ? sticky.offsetHeight : 0) + EXTRA;
  }

  function setScrollOffsetVar() {
    document.documentElement.style.setProperty('--scroll-offset', getOffset() + 'px');
  }

  function scrollToHash(hash, behavior) {
    if (!hash || hash.length < 2) return;
    var target = document.getElementById(hash.slice(1));
    if (!target) return;
    var focus = target.querySelector('h2, h1') || target;
    var top = focus.getBoundingClientRect().top + window.pageYOffset - getOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: behavior || 'smooth' });
  }

  setScrollOffsetVar();
  window.addEventListener('resize', setScrollOffsetVar, { passive: true });
  window.addEventListener('load', setScrollOffsetVar);

  if (typeof ResizeObserver !== 'undefined') {
    var sticky = document.querySelector('.sticky-top');
    if (sticky) new ResizeObserver(setScrollOffsetVar).observe(sticky);
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var hash = link.getAttribute('href');
      if (!hash || hash.length < 2) return;
      if (!document.getElementById(hash.slice(1))) return;
      e.preventDefault();
      if (history.pushState) {
        history.pushState(null, '', hash);
      } else {
        location.hash = hash;
      }
      scrollToHash(hash, 'smooth');
    });
  });

  window.addEventListener('hashchange', function () {
    scrollToHash(location.hash, 'smooth');
  });

  window.addEventListener('load', function () {
    if (location.hash) scrollToHash(location.hash, 'auto');
  });
})();

// Mobile navigation toggle
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', function () {
    var isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  nav.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function () {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

// Video-Platzhalter: Wenn data-youtube-id gesetzt ist, YouTube-iframe einblenden
(function () {
  var placeholders = document.querySelectorAll('.video-placeholder[data-youtube-id]');
  placeholders.forEach(function (el) {
    var id = (el.getAttribute('data-youtube-id') || '').trim();
    if (!id) return;
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube.com/embed/' + id + '?rel=0';
    iframe.title = 'Video';
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.allowFullscreen = true;
    el.classList.remove('video-placeholder');
    el.style.paddingBottom = '56.25%';
    el.style.height = '0';
    el.innerHTML = '';
    el.appendChild(iframe);
  });
})();

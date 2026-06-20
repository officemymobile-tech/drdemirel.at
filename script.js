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

// Anker-Scroll: fixe Kopfzeile (Wahlarzt + Nav) berücksichtigen
(function () {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  var EXTRA = 20;
  var smoothMs = 420;

  function plainUrl() {
    return location.pathname + location.search;
  }

  function getOffset() {
    var sticky = document.querySelector('.sticky-top');
    return (sticky ? sticky.getBoundingClientRect().height : 0) + EXTRA;
  }

  function getScrollTarget(section) {
    return section.querySelector('h2, h1') || section;
  }

  function scrollToId(id, behavior) {
    var section = document.getElementById(id);
    if (!section) return;
    var focus = getScrollTarget(section);
    var top = window.scrollY + focus.getBoundingClientRect().top - getOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: behavior || 'auto' });
  }

  function snapToId(id) {
    scrollToId(id, 'auto');
  }

  function setHash(id) {
    if (history.replaceState) {
      history.replaceState(null, '', '#' + id);
    } else {
      location.hash = id;
    }
  }

  function clearHash() {
    if (history.replaceState) {
      history.replaceState(null, '', plainUrl());
    }
  }

  function goToId(id, smooth) {
    if (!document.getElementById(id)) return;

    clearHash();
    snapToId(id);

    if (smooth) {
      scrollToId(id, 'smooth');
      window.setTimeout(function () {
        clearHash();
        snapToId(id);
        setHash(id);
        snapToId(id);
      }, smoothMs);
      return;
    }

    setHash(id);
    snapToId(id);
  }

  function goToHash(hash, smooth) {
    if (!hash || hash.length < 2) return;
    goToId(decodeURIComponent(hash.slice(1)), smooth);
  }

  document.addEventListener(
    'click',
    function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var hash = link.getAttribute('href');
      if (!hash || hash.length < 2) return;
      if (!document.getElementById(decodeURIComponent(hash.slice(1)))) return;
      e.preventDefault();
      goToHash(hash, true);
    },
    true
  );

  window.addEventListener('popstate', function () {
    if (location.hash) {
      goToHash(location.hash, false);
    }
  });

  function handleInitialHash() {
    if (!location.hash) return;
    goToHash(location.hash, false);
  }

  if (document.readyState === 'complete') {
    handleInitialHash();
  } else {
    window.addEventListener('load', handleInitialHash);
  }
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

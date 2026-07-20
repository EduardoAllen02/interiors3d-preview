(function () {
  'use strict';

  var mobileQuery = window.matchMedia('(max-width: 768px)');
  if (!mobileQuery.matches) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Portal arquitectónico 3D: touch + parallax de scroll ── */
  var portal = document.querySelector('.hero-mobile-portal');
  var stage = portal && portal.querySelector('.portal-stage');
  var scene = portal && portal.querySelector('.portal-scene');
  var hero = document.querySelector('#hero');

  if (portal && stage && scene && hero) {
    var targetX = -7;
    var targetY = 10;
    var currentX = targetX;
    var currentY = targetY;
    var parallaxTarget = 0;
    var parallaxCurrent = 0;
    var pointerActive = false;

    function updateFromPoint(clientX, clientY) {
      var rect = portal.getBoundingClientRect();
      var nx = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width) * 2 - 1));
      var ny = Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height) * 2 - 1));
      targetY = nx * 14;
      targetX = -ny * 9 - 4;
    }

    portal.addEventListener('pointerdown', function (event) {
      pointerActive = true;
      updateFromPoint(event.clientX, event.clientY);
      stage.classList.remove('is-pulsing');
      void stage.offsetWidth;
      stage.classList.add('is-pulsing');
    }, { passive: true });

    portal.addEventListener('pointermove', function (event) {
      if (event.pointerType === 'mouse' || pointerActive) {
        updateFromPoint(event.clientX, event.clientY);
      }
    }, { passive: true });

    function releasePortal() {
      pointerActive = false;
      targetX = -7;
      targetY = 10;
    }
    portal.addEventListener('pointerup', releasePortal, { passive: true });
    portal.addEventListener('pointercancel', releasePortal, { passive: true });
    portal.addEventListener('pointerleave', releasePortal, { passive: true });

    function updateParallax() {
      var rect = hero.getBoundingClientRect();
      var progress = Math.max(-1, Math.min(1, -rect.top / Math.max(rect.height, 1)));
      parallaxTarget = progress * 34;
    }
    window.addEventListener('scroll', updateParallax, { passive: true });
    updateParallax();

    function renderPortal() {
      currentX += (targetX - currentX) * 0.075;
      currentY += (targetY - currentY) * 0.075;
      parallaxCurrent += (parallaxTarget - parallaxCurrent) * 0.065;
      scene.style.setProperty('--portal-rx', currentX.toFixed(2) + 'deg');
      scene.style.setProperty('--portal-ry', currentY.toFixed(2) + 'deg');
      scene.style.setProperty('--portal-y', parallaxCurrent.toFixed(2) + 'px');
      requestAnimationFrame(renderPortal);
    }

    if (!reduceMotion) requestAnimationFrame(renderPortal);
  }

  /* ── Autoavance del carrusel de soluciones ── */
  var grid = document.querySelector('.sol-cards-grid');
  var cue = document.querySelector('.solutions-scroll-cue');
  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.sol-card'));
  if (cards.length < 2) return;

  var carouselVisible = false;
  var pauseUntil = 0;
  var autoTimer = null;

  function nearestCardIndex() {
    var left = grid.scrollLeft;
    var best = 0;
    var distance = Infinity;
    cards.forEach(function (card, index) {
      var delta = Math.abs(card.offsetLeft - grid.offsetLeft - left);
      if (delta < distance) {
        distance = delta;
        best = index;
      }
    });
    return best;
  }

  function targetLeft(card) {
    return Math.max(0, card.offsetLeft - grid.offsetLeft - 4);
  }

  function updateCue() {
    if (!cue) return;
    var atEnd = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 12;
    cue.classList.toggle('is-hidden', atEnd);
  }

  function advanceCards() {
    if (!carouselVisible || document.hidden || Date.now() < pauseUntil) return;
    var current = nearestCardIndex();
    var next = current + 1;
    if (next >= cards.length) next = 0;
    grid.scrollTo({ left: targetLeft(cards[next]), behavior: 'smooth' });
  }

  function startAutoScroll() {
    if (reduceMotion || autoTimer) return;
    autoTimer = window.setInterval(advanceCards, 3200);
  }

  function pauseForUser() {
    pauseUntil = Date.now() + 6500;
  }

  ['pointerdown', 'touchstart', 'wheel'].forEach(function (eventName) {
    grid.addEventListener(eventName, pauseForUser, { passive: true });
  });
  grid.addEventListener('scroll', updateCue, { passive: true });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      carouselVisible = entry.isIntersecting && entry.intersectionRatio > 0.12;
      if (carouselVisible) startAutoScroll();
    });
  }, { threshold: [0, 0.12, 0.4] });
  observer.observe(grid);
  updateCue();
}());

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

  /* ── Carrusel infinito de soluciones ──
     Desplazamiento continuo a velocidad constante y lenta (sin pausas
     ni saltos rígidos entre cards). El set de cards se duplica una vez
     para poder recortar el scroll de forma invisible y dar la vuelta
     sin fin. El botón de flecha suma un empujón de una card de ancho
     por encima del avance base, sin detenerlo. */
  var grid = document.querySelector('.sol-cards-grid');
  var cue = document.querySelector('.solutions-scroll-cue');
  if (!grid) return;

  var originalCards = Array.prototype.slice.call(grid.querySelectorAll('.sol-card'));
  if (originalCards.length < 2) return;

  originalCards.forEach(function (card) {
    var clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    grid.appendChild(clone);
  });
  var clonedCards = Array.prototype.slice.call(grid.querySelectorAll('.sol-card')).slice(originalCards.length);

  var BASE_SPEED = 22; // px/s — constante y lenta
  var carouselVisible = false;
  var dragging = false;
  var lastTs = null;
  var scrollPos = grid.scrollLeft;
  var boostRemaining = 0;
  var setWidth = 0;
  var stepWidth = 0;

  function measure() {
    setWidth = clonedCards[0].offsetLeft - originalCards[0].offsetLeft;
    stepWidth = originalCards.length > 1
      ? originalCards[1].offsetLeft - originalCards[0].offsetLeft
      : setWidth;
  }
  measure();
  window.addEventListener('resize', measure);

  function frame(ts) {
    requestAnimationFrame(frame);
    if (lastTs === null) lastTs = ts;
    var dt = Math.min(80, ts - lastTs) / 1000;
    lastTs = ts;

    if (dragging || !carouselVisible || document.hidden || reduceMotion || setWidth <= 0) {
      scrollPos = grid.scrollLeft;
      return;
    }

    var delta = BASE_SPEED * dt;
    if (boostRemaining > 0) {
      var boostStep = Math.min(boostRemaining, boostRemaining * 8 * dt + 90 * dt);
      delta += boostStep;
      boostRemaining -= boostStep;
    }

    scrollPos += delta;
    while (scrollPos >= setWidth) scrollPos -= setWidth;
    grid.scrollLeft = scrollPos;
  }
  requestAnimationFrame(frame);

  function onDragStart() {
    dragging = true;
  }
  function onDragEnd() {
    dragging = false;
    scrollPos = grid.scrollLeft;
  }
  ['pointerdown', 'touchstart'].forEach(function (eventName) {
    grid.addEventListener(eventName, onDragStart, { passive: true });
  });
  ['pointerup', 'pointercancel', 'touchend', 'touchcancel'].forEach(function (eventName) {
    grid.addEventListener(eventName, onDragEnd, { passive: true });
  });

  if (cue) {
    cue.addEventListener('click', function () {
      boostRemaining += stepWidth || grid.clientWidth * 0.8;
    });
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      carouselVisible = entry.isIntersecting && entry.intersectionRatio > 0.12;
    });
  }, { threshold: [0, 0.12, 0.4] });
  observer.observe(grid);
}());

(function () {
  'use strict';

  var mobileQuery = window.matchMedia('(max-width: 768px)');
  if (!mobileQuery.matches) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /* Pausar al primer toque y resolver el reinicio por el propio evento
     de scroll (con debounce), no por pointerup/pointercancel: en touch,
     el navegador suele cancelar el pointer en cuanto toma el gesto para
     hacer scroll nativo, así que esos eventos llegan antes de que el
     dedo termine de mover el carrusel — retomar el auto-scroll en ese
     momento provocaba el temblor (el auto-scroll peleaba contra el
     arrastre en curso). Mientras dragging=true no escribimos scrollLeft,
     así que cualquier 'scroll' real durante la pausa viene del usuario
     o de la inercia, nunca de nosotros mismos. */
  var settleTimer = null;
  function pauseAuto() {
    dragging = true;
    scheduleResume();
  }
  function scheduleResume() {
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(function () {
      dragging = false;
      scrollPos = grid.scrollLeft;
      settleTimer = null;
    }, 220);
  }
  grid.addEventListener('touchstart', pauseAuto, { passive: true });
  grid.addEventListener('pointerdown', pauseAuto, { passive: true });
  grid.addEventListener('scroll', function () {
    if (!dragging) return;
    scheduleResume();
  }, { passive: true });

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

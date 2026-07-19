/* Tecnologie page interactions: count-up stats + scroll reveal. */
(function initTechPage() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Count-up: .stat-num anima de 0 a data-target al entrar al viewport ── */
  function animateCount(el) {
    const target = parseInt(el.dataset.target, 10) || 0;
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    if (reducedMotion) {
      el.textContent = prefix + target + suffix;
      return;
    }
    const duration = 1600;
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const counted = new WeakSet();
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !counted.has(entry.target)) {
        counted.add(entry.target);
        animateCount(entry.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-num').forEach((el) => statObserver.observe(el));

  /* ── Scramble en hover: los dígitos se revuelven y se asientan ── */
  const scrambling = new WeakSet();
  function scramble(el) {
    if (reducedMotion || scrambling.has(el)) return;
    scrambling.add(el);
    const target = parseInt(el.dataset.target, 10) || 0;
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const finalText = String(target);
    const duration = 620;
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      // Los dígitos se fijan de izquierda a derecha conforme avanza t.
      const settled = Math.floor(t * (finalText.length + 1));
      let out = '';
      for (let i = 0; i < finalText.length; i += 1) {
        out += i < settled ? finalText[i] : String(Math.floor(Math.random() * 10));
      }
      el.textContent = prefix + out + suffix;
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = prefix + finalText + suffix;
        scrambling.delete(el);
      }
    }
    requestAnimationFrame(tick);
  }
  document.querySelectorAll('.stat').forEach((stat) => {
    const num = stat.querySelector('.stat-num');
    if (!num) return;
    stat.addEventListener('mouseenter', () => {
      if (counted.has(num)) scramble(num);
    });
  });

  /* ── Scroll reveal: .reveal gana .is-visible; filas escalonadas ── */
  function revealElement(el) {
    if (el.classList.contains('is-visible') || el.dataset.revealQueued) return;
    el.dataset.revealQueued = '1';
    const siblings = Array.from(el.parentElement.querySelectorAll(':scope > .reveal'));
    const index = Math.max(siblings.indexOf(el), 0);
    const delay = reducedMotion ? 0 : Math.min(index * 90, 540);
    setTimeout(() => el.classList.add('is-visible'), delay);
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      revealElement(entry.target);
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  /* Failsafe: por si el observer se pierde algún elemento (cargas lentas,
     saltos de scroll), un chequeo manual barato en scroll/resize. */
  function sweepReveals() {
    const vh = window.innerHeight;
    document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < vh - 30 && rect.bottom > 0) revealElement(el);
    });
  }
  window.addEventListener('scroll', sweepReveals, { passive: true });
  window.addEventListener('resize', sweepReveals, { passive: true });
  window.addEventListener('load', () => setTimeout(sweepReveals, 400));
})();

/* ── Mobile: feature image auto-lift on scroll ── */
document.addEventListener('DOMContentLoaded', function () {
  if (!window.matchMedia('(max-width: 768px)').matches) return;

  const featRows = document.querySelectorAll('.featx-row');

  const liftObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        featRows.forEach(function (row) {
          var img = row.querySelector('.featx-media img');
          if (img) img.classList.remove('img-lifted');
        });
        var img = entry.target.querySelector('.featx-media img');
        if (img) img.classList.add('img-lifted');
      }
    });
  }, { threshold: 0.35 });

  featRows.forEach(function (row) { liftObserver.observe(row); });
});

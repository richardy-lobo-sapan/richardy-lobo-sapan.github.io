(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── Typewriter tagline ───
     Types one phrase in, once, then settles — deliberately not a looping
     type/delete cycle. A sticky sidebar element that animates forever
     competes for attention on every scroll; a single type-in reads as a
     considered detail instead. */
  var taglineEl = document.getElementById('tagline-text');
  var taglineCursor = document.querySelector('.tagline-cursor');
  if (taglineEl) {
    var phrases = [
      'building RAG pipelines',
      'modeling credit risk',
      'fine-tuning LLMs',
      'shipping to production',
      'researching SEA NLP'
    ];
    var chosen = phrases[Math.floor(Math.random() * phrases.length)];

    if (reduceMotion) {
      /* reduced-motion keeps the original static, non-blinking cursor
         (handled by the prefers-reduced-motion rule in style.css) */
      taglineEl.textContent = chosen;
    } else {
      (function typeOnce() {
        var charIndex = 0;
        var TYPE_MS = 55;

        function tick() {
          charIndex++;
          taglineEl.textContent = chosen.slice(0, charIndex);
          if (charIndex === chosen.length) {
            if (taglineCursor) taglineCursor.classList.add('settled');
            return;
          }
          setTimeout(tick, TYPE_MS);
        }

        setTimeout(tick, 600);
      })();
    }
  }

  /* ─── Back to top ─── */
  var backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 300) backToTop.classList.add('visible');
      else backToTop.classList.remove('visible');
    }, { passive: true });

    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ─── Scroll reveal ─── */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { observer.observe(el); });
    }
  }

  /* ─── Starfield background ─── */
  var canvas = document.getElementById('starfield');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var stars = [];
    var rafId = null;
    var resizeTimer = null;
    var DENSITY = 9000; /* px^2 of viewport per star — kept sparse on purpose */
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    /* Cached each resize rather than re-read from window.innerWidth/Height
       on every animation frame (draw() runs ~60x/sec). */
    var viewW = window.innerWidth;
    var viewH = window.innerHeight;

    function seedStars() {
      var count = Math.floor((viewW * viewH) / DENSITY);
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * viewW,
          y: Math.random() * viewH,
          r: Math.random() * 1.1 + 0.2,
          baseAlpha: Math.random() * 0.5 + 0.15,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.0006 + 0.0002
        });
      }
    }

    function resize() {
      viewW = window.innerWidth;
      viewH = window.innerHeight;
      canvas.width = viewW * dpr;
      canvas.height = viewH * dpr;
      canvas.style.width = viewW + 'px';
      canvas.style.height = viewH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedStars();
    }

    function paintStatic() {
      ctx.clearRect(0, 0, viewW, viewH);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245,230,200,' + s.baseAlpha.toFixed(3) + ')';
        ctx.fill();
      }
    }

    function draw(time) {
      ctx.clearRect(0, 0, viewW, viewH);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var twinkle = Math.sin(time * s.speed + s.phase) * 0.35;
        var alpha = Math.max(0, Math.min(1, s.baseAlpha + twinkle));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245,230,200,' + alpha.toFixed(3) + ')';
        ctx.fill();
      }
      rafId = requestAnimationFrame(draw);
    }

    function start() {
      if (reduceMotion) {
        paintStatic();
        return;
      }
      if (!rafId && !document.hidden) rafId = requestAnimationFrame(draw);
    }

    function stop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else start();
    });

    /* Debounced: avoids a full star reseed on every intermediate pixel
       while the window is actively being dragged/resized. */
    window.addEventListener('resize', function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resize();
        if (reduceMotion) paintStatic();
      }, 150);
    }, { passive: true });

    resize();
    start();
  }

  /* eslint-disable no-console */
  console.log('%cHouston, we have a portfolio.', 'color:#c78a4a;font-family:monospace;');
})();

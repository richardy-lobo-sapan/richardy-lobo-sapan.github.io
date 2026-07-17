(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── Typewriter tagline ─── */
  var taglineEl = document.getElementById('tagline-text');
  if (taglineEl) {
    var phrases = [
      'building RAG pipelines',
      'modeling credit risk',
      'fine-tuning LLMs',
      'shipping to production',
      'researching SEA NLP'
    ];
    if (reduceMotion) {
      taglineEl.textContent = phrases[0];
    } else {
      (function typewriter() {
        var pIndex = 0, charIndex = 0, deleting = false;
        var TYPE_MS = 55, DELETE_MS = 30, HOLD_MS = 1400, GAP_MS = 300;

        function tick() {
          var current = phrases[pIndex];
          if (!deleting) {
            charIndex++;
            taglineEl.textContent = current.slice(0, charIndex);
            if (charIndex === current.length) {
              deleting = true;
              setTimeout(tick, HOLD_MS);
              return;
            }
            setTimeout(tick, TYPE_MS);
          } else {
            charIndex--;
            taglineEl.textContent = current.slice(0, charIndex);
            if (charIndex === 0) {
              deleting = false;
              pIndex = (pIndex + 1) % phrases.length;
              setTimeout(tick, GAP_MS);
              return;
            }
            setTimeout(tick, DELETE_MS);
          }
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
    var DENSITY = 9000; /* px^2 of viewport per star — kept sparse on purpose */
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function seedStars() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      var count = Math.floor((w * h) / DENSITY);
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.1 + 0.2,
          baseAlpha: Math.random() * 0.5 + 0.15,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.0006 + 0.0002
        });
      }
    }

    function resize() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedStars();
    }

    function paintStatic() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245,230,200,' + s.baseAlpha.toFixed(3) + ')';
        ctx.fill();
      }
    }

    function draw(time) {
      var w = window.innerWidth;
      var h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
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

    window.addEventListener('resize', function () {
      resize();
      if (reduceMotion) paintStatic();
    }, { passive: true });

    resize();
    start();
  }

  /* eslint-disable no-console */
  console.log('%cHouston, we have a portfolio.', 'color:#c78a4a;font-family:monospace;');
})();

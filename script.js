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
    var LINK_DIST = 110; /* px — stars closer than this get a faint constellation line */
    var PARALLAX = 15; /* px, scaled by a star's radius so "nearer" stars shift more */
    /* connectStars() is an O(n^2) pairwise pass, run every frame. DENSITY alone
       lets star count grow unbounded with viewport area — on a 4K/ultrawide
       display (e.g. 3840x2160) that's ~920 stars, or ~420k pair-checks/frame,
       enough to visibly drop frame rate. Cap the count so the field stays
       equally "sparse" looking on huge screens without the quadratic blowup. */
    var MAX_STARS = 260;
    /* Read once from the CSS custom property (style.css :root --star) so the
       star tint has one source of truth instead of the same triplet
       hardcoded separately in both files; falls back if the var is ever
       missing. */
    var STAR_RGB = (getComputedStyle(document.documentElement).getPropertyValue('--star') || '').trim() || '207,232,255';
    var COMET_RGB = '226,244,255'; /* brighter than the star tint on purpose — the comet is a momentary highlight */
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    /* Cached each resize rather than re-read from window.innerWidth/Height
       on every animation frame (draw() runs ~60x/sec). */
    var viewW = window.innerWidth;
    var viewH = window.innerHeight;

    var mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
    var comet = null;

    function seedStars() {
      var count = Math.min(Math.floor((viewW * viewH) / DENSITY), MAX_STARS);
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * viewW,
          y: Math.random() * viewH,
          r: Math.random() * 1.1 + 0.2,
          baseAlpha: Math.random() * 0.5 + 0.15,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.0006 + 0.0002,
          /* very slow drift, px/frame — gives the field depth without
             ever reading as scrolling or distracting from the text */
          vx: (Math.random() - 0.5) * 0.025,
          vy: (Math.random() - 0.5) * 0.018,
          /* rendered position/alpha for this frame, filled in by draw()/
             paintStatic() and reused by the constellation-line pass so
             lines land exactly on the dots (post-drift, post-parallax) */
          dx: 0, dy: 0, a: 0
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

    /* faint lines between nearby stars — sparse field (few hundred stars
       at most) keeps this pairwise pass cheap enough for 60fps */
    function connectStars() {
      for (var i = 0; i < stars.length; i++) {
        var a = stars[i];
        for (var j = i + 1; j < stars.length; j++) {
          var b = stars[j];
          var dx = b.dx - a.dx;
          if (dx > LINK_DIST || dx < -LINK_DIST) continue;
          var dy = b.dy - a.dy;
          if (dy > LINK_DIST || dy < -LINK_DIST) continue;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            var t = 1 - dist / LINK_DIST;
            var alpha = t * t * 0.16 * Math.min(a.a, b.a) * 2;
            ctx.beginPath();
            ctx.moveTo(a.dx, a.dy);
            ctx.lineTo(b.dx, b.dy);
            ctx.strokeStyle = 'rgba(' + STAR_RGB + ',' + Math.min(alpha, 0.16).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    function paintStatic() {
      ctx.clearRect(0, 0, viewW, viewH);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.dx = s.x; s.dy = s.y; s.a = s.baseAlpha;
      }
      connectStars();
      for (var j = 0; j < stars.length; j++) {
        var st = stars[j];
        ctx.beginPath();
        ctx.arc(st.dx, st.dy, st.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + STAR_RGB + ',' + st.a.toFixed(3) + ')';
        ctx.fill();
      }
    }

    /* rare (~once every 20-30s on average), brief shooting star —
       only ever runs alongside the animated field, never under
       prefers-reduced-motion */
    function maybeSpawnComet() {
      if (comet || Math.random() >= 1 / 1500) return;
      var fromLeft = Math.random() < 0.5;
      var speed = 6 + Math.random() * 4;
      comet = {
        x: fromLeft ? -60 : viewW + 60,
        y: Math.random() * viewH * 0.55,
        vx: (fromLeft ? 1 : -1) * speed,
        vy: speed * 0.5,
        len: 90 + Math.random() * 40,
        life: 0,
        maxLife: 100
      };
    }

    function drawComet() {
      if (!comet) return;
      comet.x += comet.vx;
      comet.y += comet.vy;
      comet.life++;

      var angle = Math.atan2(comet.vy, comet.vx);
      var tailX = comet.x - Math.cos(angle) * comet.len;
      var tailY = comet.y - Math.sin(angle) * comet.len;

      var grad = ctx.createLinearGradient(comet.x, comet.y, tailX, tailY);
      grad.addColorStop(0, 'rgba(' + COMET_RGB + ',0.85)');
      grad.addColorStop(1, 'rgba(' + COMET_RGB + ',0)');

      ctx.beginPath();
      ctx.moveTo(comet.x, comet.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(comet.x, comet.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + COMET_RGB + ',0.9)';
      ctx.fill();

      if (comet.life > comet.maxLife || comet.x < -150 || comet.x > viewW + 150 || comet.y > viewH + 150) {
        comet = null;
      }
    }

    function draw(time) {
      ctx.clearRect(0, 0, viewW, viewH);

      /* smoothed mouse position drives a subtle depth-parallax on the
         stars — nearer (larger) stars shift more than distant ones */
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];

        s.x += s.vx;
        s.y += s.vy;
        if (s.x < -2) s.x = viewW + 2; else if (s.x > viewW + 2) s.x = -2;
        if (s.y < -2) s.y = viewH + 2; else if (s.y > viewH + 2) s.y = -2;

        var twinkle = Math.sin(time * s.speed + s.phase) * 0.35;
        s.a = Math.max(0, Math.min(1, s.baseAlpha + twinkle));
        s.dx = s.x + mouseX * s.r * PARALLAX;
        s.dy = s.y + mouseY * s.r * PARALLAX;
      }

      connectStars();

      for (var j = 0; j < stars.length; j++) {
        var st = stars[j];
        ctx.beginPath();
        ctx.arc(st.dx, st.dy, st.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + STAR_RGB + ',' + st.a.toFixed(3) + ')';
        ctx.fill();
      }

      maybeSpawnComet();
      drawComet();

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

    if (!reduceMotion) {
      window.addEventListener('mousemove', function (e) {
        targetMouseX = e.clientX / viewW - 0.5;
        targetMouseY = e.clientY / viewH - 0.5;
      }, { passive: true });
    }

    resize();
    start();
  }

  /* eslint-disable no-console */
  console.log('%cHouston, we have a portfolio.', 'color:#38bdf8;font-family:monospace;');
})();

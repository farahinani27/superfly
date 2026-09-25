/* =========================================================================
   SUPERFLY revamp - "THE ARSENAL"

   Exposes exactly one global: window.initArsenal()
   Nothing runs on load. Call initArsenal() yourself once GSAP +
   ScrollTrigger are on the page and registered.

   Behaviour:
     >=900px, motion allowed -> .ars-stage pins, .ars-track slides
                                horizontally, each schematic draws itself
                                as its panel crosses the viewport
     <900px,  motion allowed -> no pin, panels stack, each schematic draws
                                on its own vertical trigger
     prefers-reduced-motion  -> no pin, no draw, everything rendered
   Calling it twice is safe: the previous run is reverted first.
   ========================================================================= */
(function () {
  'use strict';

  var DESKTOP_Q = '(min-width: 900px) and (prefers-reduced-motion: no-preference)';
  var STACK_Q   = '(max-width: 899px) and (prefers-reduced-motion: no-preference)';
  var REDUCED_Q = '(prefers-reduced-motion: reduce)';

  var state = null;

  function list(root, sel) {
    return Array.prototype.slice.call(root.querySelectorAll(sel));
  }

  /* Path length for the dash trick. Returns 0 for anything we cannot
     measure, and those elements are faded in instead of drawn. */
  function measure(el) {
    var len = 0;
    if (typeof el.getTotalLength === 'function') {
      try { len = el.getTotalLength(); } catch (e) { len = 0; }
    }
    if (typeof len !== 'number' || !isFinite(len) || len <= 0) return 0;
    return Math.ceil(len) + 1;
  }

  /* Split a panel's artwork into "draw these" and "fade these", once. */
  function collect(panel) {
    if (panel.__arsParts) return panel.__arsParts;

    var draw = [];
    var fade = list(panel, '.ars-fade');

    list(panel, '.ars-draw').forEach(function (el) {
      var len = measure(el);
      if (len) {
        el.__arsLen = len;
        draw.push(el);
      } else {
        fade.push(el);      /* unmeasurable: fade it in rather than lose it */
      }
    });

    panel.__arsParts = { draw: draw, fade: fade, copy: list(panel, '.ars-in') };
    return panel.__arsParts;
  }

  /* Hide the artwork ready for drawing. Runs inside a gsap context so a
     revert puts every one of these inline styles back. */
  function arm(gsap, panel) {
    var parts = collect(panel);
    parts.draw.forEach(function (el) {
      gsap.set(el, { strokeDasharray: el.__arsLen, strokeDashoffset: el.__arsLen });
    });
    gsap.set(parts.fade, { opacity: 0 });
    return parts;
  }

  /* One reveal timeline per panel. `container` is the horizontal tween when
     we are pinned, or null when the panels are stacked. */
  function reveal(gsap, panel, container) {
    var parts = arm(gsap, panel);

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: panel,
        containerAnimation: container || undefined,
        start: container ? 'left 80%' : 'top 82%',
        end:   container ? 'right 25%' : 'bottom 35%',
        toggleActions: 'play none none reverse'
      }
    });

    tl.from(parts.copy, {
      y: 28,
      autoAlpha: 0,
      duration: .65,
      ease: 'power2.out',
      stagger: .07
    }, 0);

    tl.to(parts.draw, {
      strokeDashoffset: 0,
      duration: 1.15,
      ease: 'power1.inOut',
      stagger: { each: .012, from: 'start' }
    }, .18);

    tl.to(parts.fade, {
      opacity: 1,
      duration: .5,
      ease: 'none',
      stagger: .015
    }, .55);

    return tl;
  }

  /* Everything visible, nothing animated. */
  function showAll(section) {
    list(section, '.ars-draw').forEach(function (el) {
      el.style.strokeDasharray = 'none';
      el.style.strokeDashoffset = '0';
      el.style.opacity = '';
    });
    list(section, '.ars-fade, .ars-in').forEach(function (el) {
      el.style.opacity = '';
      el.style.visibility = '';
      el.style.transform = '';
    });
  }

  function teardown() {
    if (!state) return;
    if (state.mm) state.mm.revert();
    state.imgs.forEach(function (img) {
      img.removeEventListener('load', state.onImgLoad);
      img.removeEventListener('error', state.onImgLoad);
    });
    state.section.removeAttribute('data-ars-ready');
    state = null;
  }

  function init() {
    var section = document.getElementById('arsenal');
    if (!section) return;

    teardown();

    var gsap = window.gsap;
    var ST   = window.ScrollTrigger;

    /* No GSAP? Leave a readable, fully drawn section behind. */
    if (!gsap || !ST) {
      showAll(section);
      return;
    }

    var stage   = section.querySelector('[data-ars-stage]');
    var track   = section.querySelector('[data-ars-track]');
    var panels  = list(section, '.ars-panel');
    var bar     = section.querySelector('[data-ars-bar]');
    var counter = section.querySelector('[data-ars-count]');

    if (!stage || !track || !panels.length) {
      showAll(section);
      return;
    }

    /* Late-loading imagery changes the pin distance. */
    var imgs = list(section, 'img');
    var onImgLoad = function () { ST.refresh(); };
    imgs.forEach(function (img) {
      if (!img.complete) {
        img.addEventListener('load', onImgLoad);
        img.addEventListener('error', onImgLoad);
      }
    });

    var mm = gsap.matchMedia();

    /* --------------------------------------------- pinned horizontal -- */
    mm.add(DESKTOP_Q, function () {
      var distance = function () {
        return Math.max(0, track.scrollWidth - stage.clientWidth);
      };

      /* Nothing to travel (one very wide panel, say): behave like the
         stacked case so the section is still readable. */
      if (distance() <= 0) {
        panels.forEach(function (panel) { reveal(gsap, panel, null); });
        return;
      }

      var slide = gsap.to(track, {
        x: function () { return -distance(); },
        ease: 'none',
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: function () { return '+=' + distance(); },
          pin: stage,
          pinSpacing: true,
          scrub: .6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            if (bar) gsap.set(bar, { scaleX: self.progress });
            if (counter) {
              var i = Math.round(self.progress * (panels.length - 1));
              var label = panels[i] ? panels[i].getAttribute('data-ars-panel') : null;
              if (label && counter.textContent !== label) counter.textContent = label;
            }
          }
        }
      });

      /* Panel 1 is already on screen the moment the pin engages, so a
         containerAnimation trigger for it would sit exactly on its own start
         and leave the first panel blank. Give it an ordinary vertical
         trigger instead: it draws as the stage scrolls up into view. */
      panels.forEach(function (panel, i) {
        reveal(gsap, panel, i === 0 ? null : slide);
      });

      /* Keyboard focus inside a pinned, overflow-hidden track would
         otherwise scroll the container and desync the transform. Send the
         page to that panel's scroll position instead. */
      var onFocusIn = function (e) {
        var node = e.target;
        var panel = node && node.closest ? node.closest('.ars-panel') : null;
        if (!panel) return;

        stage.scrollLeft = 0;

        var st = slide.scrollTrigger;
        var idx = panels.indexOf(panel);
        if (!st || idx < 0 || panels.length < 2) return;

        var to = st.start + (st.end - st.start) * (idx / (panels.length - 1));
        window.scrollTo(0, Math.round(to));
      };

      section.addEventListener('focusin', onFocusIn);

      return function cleanup() {
        section.removeEventListener('focusin', onFocusIn);
        stage.scrollLeft = 0;
      };
    });

    /* ------------------------------------------------ stacked, mobile -- */
    mm.add(STACK_Q, function () {
      panels.forEach(function (panel) { reveal(gsap, panel, null); });
    });

    /* ----------------------------------------------- reduced motion --- */
    mm.add(REDUCED_Q, function () {
      showAll(section);
    });

    section.setAttribute('data-ars-ready', '');

    state = {
      section: section,
      mm: mm,
      imgs: imgs,
      onImgLoad: onImgLoad
    };
  }

  window.initArsenal = init;
  window.initArsenal.destroy = teardown;
}());

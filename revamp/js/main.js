/* ═══════════════════════════════════════════════════════════════
   SUPERFLY revamp — shell, hero choreography, circuit, counters
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Read live, not snapshotted at load, so switching the OS setting mid-session
     takes effect. Every tween length goes through D() — GSAP writes inline
     styles, so the CSS prefers-reduced-motion guard in tokens.css cannot reach it. */
  const RMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => RMQ.matches;
  const D = v => RMQ.matches ? 0 : v;
  gsap.registerPlugin(ScrollTrigger);

  /* Stylised Sepang International Circuit — 15 corners, 5.543 km.
     Drawn for legibility, not survey accuracy. */
  const CIRCUIT =
    'M140.0 466.0 C170.7 478.7 245.0 486.3 300.0 494.0 C355.0 501.7 413.3 507.3 470.0 512.0 ' +
    'C526.7 516.7 588.0 520.3 640.0 522.0 C692.0 523.7 746.0 524.0 782.0 522.0 C818.0 520.0 836.0 ' +
    '518.7 856.0 510.0 C876.0 501.3 893.7 485.3 902.0 470.0 C910.3 454.7 911.0 432.7 906.0 418.0 ' +
    'C901.0 403.3 886.3 390.3 872.0 382.0 C857.7 373.7 838.3 369.7 820.0 368.0 C801.7 366.3 779.3 ' +
    '367.0 762.0 372.0 C744.7 377.0 731.0 392.7 716.0 398.0 C701.0 403.3 685.3 406.0 672.0 404.0 ' +
    'C658.7 402.0 645.0 395.3 636.0 386.0 C627.0 376.7 620.3 361.7 618.0 348.0 C615.7 334.3 616.0 ' +
    '317.3 622.0 304.0 C628.0 290.7 640.0 278.0 654.0 268.0 C668.0 258.0 687.3 248.7 706.0 244.0 ' +
    'C724.7 239.3 748.3 245.0 766.0 240.0 C783.7 235.0 803.7 226.3 812.0 214.0 C820.3 201.7 822.0 ' +
    '179.0 816.0 166.0 C810.0 153.0 791.7 141.3 776.0 136.0 C760.3 130.7 739.3 131.3 722.0 134.0 ' +
    'C704.7 136.7 687.7 144.3 672.0 152.0 C656.3 159.7 644.0 173.3 628.0 180.0 C612.0 186.7 594.0 ' +
    '191.3 576.0 192.0 C558.0 192.7 538.3 189.3 520.0 184.0 C501.7 178.7 484.7 166.3 466.0 160.0 ' +
    'C447.3 153.7 427.7 147.7 408.0 146.0 C388.3 144.3 366.7 145.0 348.0 150.0 C329.3 155.0 311.3 ' +
    '165.3 296.0 176.0 C280.7 186.7 265.7 199.7 256.0 214.0 C246.3 228.3 243.7 246.7 238.0 262.0 ' +
    'C232.3 277.3 230.0 295.3 222.0 306.0 C214.0 316.7 202.7 320.7 190.0 326.0 C177.3 331.3 158.7 ' +
    '330.3 146.0 338.0 C133.3 345.7 119.0 358.7 114.0 372.0 C109.0 385.3 111.7 402.3 116.0 418.0 ' +
    'C120.3 433.7 109.3 453.3 140.0 466.0 Z';

  /* corner markers: fraction along the path, label */
  const CORNERS = [{ t: 0.19, n: 1 }, { t: 0.56, n: 9 }, { t: 0.93, n: 15 }];

  /* ───────────────────────  helpers  ─────────────────────── */

  function splitChars(el) {
    const txt = el.textContent;
    el.textContent = '';
    return [...txt].map(c => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c === ' ' ? ' ' : c;
      el.appendChild(s);
      return s;
    });
  }

  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.dec || '0', 10);
    const o = { v: 0 };
    gsap.to(o, {
      v: target, duration: D(1.8), ease: 'power3.out',
      onUpdate: () => { el.textContent = o.v.toFixed(dec); }
    });
  }

  /* ───────────────────────  boot loader  ─────────────────────── */

  function boot() {
    const bootEl = document.getElementById('boot');
    const bar = bootEl.querySelector('.boot__bar i');
    const pct = document.getElementById('bootPct');
    const o = { v: 0 };

    return gsap.timeline()
      .to(o, {
        v: 100, duration: reduced() ? 0.01 : 1.15, ease: 'power2.inOut',
        onUpdate: () => {
          bar.style.width = o.v + '%';
          pct.textContent = String(Math.round(o.v)).padStart(2, '0');
        }
      })
      .to(bootEl, { opacity: 0, duration: 0.55, ease: 'power2.inOut' }, '+=0.1')
      .set(bootEl, { display: 'none' });
  }

  /* ───────────────────────  nav  ─────────────────────── */

  function nav() {
    const el = document.getElementById('nav');
    ScrollTrigger.create({
      start: 'top -60',
      onUpdate: s => el.classList.toggle('is-stuck', s.scroll() > 60)
    });

    const clock = document.getElementById('navClock');
    const tick = () => {
      // the brand is Malaysian — show Kuala Lumpur time
      const t = new Date().toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit'
      });
      clock.textContent = 'KUL ' + t;
    };
    tick(); setInterval(tick, 20000);
  }

  /* ───────────────────────  hero  ─────────────────────── */

  function heroCircuit() {
    const path = document.getElementById('circuitPath');
    const ghost = document.getElementById('circuitGhost');
    const dot = document.getElementById('circuitDot');
    path.setAttribute('d', CIRCUIT);
    ghost.setAttribute('d', CIRCUIT);

    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });

    const tl = gsap.timeline();
    tl.to(path, { strokeDashoffset: 0, duration: D(3.4), ease: 'power2.inOut' });

    if (!reduced()) {
      // a light running the lap, forever
      const o = { t: 0 };
      gsap.to(o, {
        t: 1, duration: 7.5, repeat: -1, ease: 'none',
        onUpdate: () => {
          const p = path.getPointAtLength(o.t * len);
          dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
        }
      });
    } else {
      const p = path.getPointAtLength(0);
      dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
    }
    return tl;
  }

  function heroTelemetry() {
    const grid = document.getElementById('telemGrid');
    const trace = document.getElementById('telemTrace');
    const fill = document.getElementById('telemFill');

    let g = '';
    for (let x = 0; x <= 1200; x += 50) g += 'M' + x + ' 0V160';
    for (let y = 40; y < 160; y += 40) g += 'M0 ' + y + 'H1200';
    grid.setAttribute('d', g);

    // suspension travel: a damped ride trace with occasional big hits
    let d = '';
    for (let i = 0; i <= 240; i++) {
      const x = i * 5;
      const y = 80
        + Math.sin(i * 0.19) * 17
        + Math.sin(i * 0.052) * 26
        + Math.sin(i * 0.61) * 6
        + (i % 47 === 0 ? -30 : 0);
      d += (i ? 'L' : 'M') + x + ' ' + y.toFixed(1);
    }
    trace.setAttribute('d', d);
    fill.setAttribute('d', d + 'L1200 160 L0 160 Z');

    const len = trace.getTotalLength();
    gsap.set(trace, { strokeDasharray: len, strokeDashoffset: len });
    return gsap.to(trace, { strokeDashoffset: 0, duration: D(2.6), ease: 'power2.out' });
  }

  function hero() {
    const tl = gsap.timeline();

    document.querySelectorAll('.hero__title [data-split]').forEach((line, i) => {
      const chars = splitChars(line);
      tl.from(chars, {
        yPercent: 118, duration: D(1.0), ease: 'power4.out', stagger: D(0.028)
      }, i * 0.09);
    });

    tl.from('.hero .sf-eyebrow', { opacity: 0, x: -18, duration: D(.7), ease: 'power3.out' }, 0)
      .from('.hero__lede', { opacity: 0, y: 22, duration: D(.8), ease: 'power3.out' }, '-=0.5')
      .from('.hero__actions .btn', { opacity: 0, y: 20, duration: D(.7), stagger: D(.08), ease: 'power3.out' }, '-=0.5')
      .from('.hero__stats div', { opacity: 0, y: 20, duration: D(.7), stagger: D(.08), ease: 'power3.out' }, '-=0.45')
      .from('.hero__product img', { opacity: 0, y: 46, scale: .94, duration: D(1.3), ease: 'power3.out' }, 0.25)
      .from('.hero__tag', { opacity: 0, x: 16, duration: D(.7), stagger: D(.12), ease: 'power3.out' }, '-=0.6')
      .add(() => document.querySelectorAll('.hero__stats dd').forEach(countUp), '-=0.6');

    // pointer parallax on the product
    if (!reduced() && matchMedia('(pointer:fine)').matches) {
      const wrap = document.getElementById('heroProduct');
      const img = wrap.querySelector('img');
      const qx = gsap.quickTo(img, 'rotationY', { duration: .9, ease: 'power3' });
      const qy = gsap.quickTo(img, 'rotationX', { duration: .9, ease: 'power3' });
      const qm = gsap.quickTo(img, 'x', { duration: .9, ease: 'power3' });
      gsap.set(img, { transformPerspective: 900 });
      addEventListener('pointermove', e => {
        const nx = (e.clientX / innerWidth) - .5, ny = (e.clientY / innerHeight) - .5;
        qx(nx * 17); qy(-ny * 11); qm(nx * 26);
      });
    }

    // hero drifts away on scroll
    if (!reduced()) {
      gsap.to('.hero__inner', {
        yPercent: -11, opacity: .25, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .5 }
      });
      gsap.to('.hero__circuit', {
        yPercent: 14, rotation: 4, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
      });
    }
    return tl;
  }

  /* ───────────────────────  sepang section  ─────────────────────── */

  function sepang() {
    const line = document.getElementById('sepLine');
    const ghost = document.getElementById('sepGhost');
    const holder = document.getElementById('sepMarksHtml');
    const notes = [...document.querySelectorAll('.sep__note')];
    line.setAttribute('d', CIRCUIT);
    ghost.setAttribute('d', CIRCUIT);

    const len = line.getTotalLength();
    gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(line, {
      strokeDashoffset: 0, duration: D(2.4), ease: 'power2.inOut',
      scrollTrigger: { trigger: '.sep__map', start: 'top 78%' }
    });

    // corner markers, positioned as a % of the 1000×620 viewBox so they track on resize
    holder.innerHTML = '';
    const marks = CORNERS.map(c => {
      const p = line.getPointAtLength(c.t * len);
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'sep__mark';
      el.style.left = (p.x / 1000 * 100) + '%';
      el.style.top = (p.y / 620 * 100) + '%';
      el.innerHTML = '<b>T' + c.n + '</b>';
      el.setAttribute('aria-label', 'Turn ' + c.n);
      holder.appendChild(el);
      return el;
    });

    function pick(i) {
      marks.forEach((m, n) => m.classList.toggle('is-on', n === i));
      notes.forEach((n, j) => n.classList.toggle('is-on', j === i));
    }
    marks.forEach((m, i) => m.addEventListener('click', () => pick(i)));
    notes.forEach((n, i) => n.addEventListener('click', () => pick(i)));
    pick(0);

    document.querySelectorAll('.sep__stats dt').forEach(el => {
      ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => countUp(el) });
    });
  }

  /* ───────────────────────  moto2  ─────────────────────── */

  function moto2() {
    if (!reduced()) {
      gsap.to('.m2__bg', {
        yPercent: 13, ease: 'none',
        scrollTrigger: { trigger: '.m2', start: 'top bottom', end: 'bottom top', scrub: .6 }
      });
      gsap.from('.m2__num', {
        yPercent: 40, opacity: 0, duration: D(1.1), stagger: D(.12), ease: 'power3.out',
        scrollTrigger: { trigger: '.m2__riders', start: 'top 82%' }
      });
    }
    gsap.from('.m2__rider', {
      opacity: 0, y: 40, duration: D(.9), stagger: D(.12), ease: 'power3.out',
      scrollTrigger: { trigger: '.m2__riders', start: 'top 82%' }
    });
    gsap.from('.m2__quote', {
      opacity: 0, x: -26, duration: D(.9), ease: 'power3.out',
      scrollTrigger: { trigger: '.m2__quote', start: 'top 86%' }
    });
  }

  /* ───────────────────────  generic reveals  ─────────────────────── */

  function reveals() {
    document.querySelectorAll('.sf-section .sf-eyebrow, .sf-section .sf-h2, .sf-section .sf-lede')
      .forEach(el => {
        gsap.from(el, {
          opacity: 0, y: 26, duration: D(.85), ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' }
        });
      });

    gsap.from('.td__stage, .td__panel', {
      opacity: 0, y: 34, duration: D(1), stagger: D(.1), ease: 'power3.out',
      scrollTrigger: { trigger: '.td__stage-wrap', start: 'top 80%' }
    });
    gsap.from('.td__ctrl', {
      opacity: 0, y: 26, duration: D(.8), stagger: D(.08), ease: 'power3.out',
      scrollTrigger: { trigger: '.td__controls', start: 'top 88%' }
    });
  }

  /* ───────────────────────  go  ─────────────────────── */

  /* pull the delegated sections into their slots before anything initialises */
  async function fillSlots() {
    const slots = [...document.querySelectorAll('[data-slot]')];
    await Promise.all(slots.map(async slot => {
      const name = slot.dataset.slot;
      try {
        const res = await fetch('partials/' + name + '.html');
        if (!res.ok) throw new Error(res.status);
        slot.outerHTML = await res.text();
      } catch (err) {
        console.warn('[superfly] section "' + name + '" not loaded:', err.message);
        slot.remove();
      }
    }));
  }

  function start() {
    nav();
    heroCircuit();
    heroTelemetry();
    boot().add(hero(), '-=0.35');

    sepang();
    moto2();
    reveals();

    // delegated sections
    if (typeof window.initArsenal === 'function') window.initArsenal();
    if (typeof window.initFitment === 'function') window.initFitment();

    // the 3D stage only boots when it is nearly on screen
    const stage = document.getElementById('teardown');
    if (stage && typeof window.initTeardown === 'function') {
      new IntersectionObserver((es, obs) => {
        if (es[0].isIntersecting) { window.initTeardown(); obs.disconnect(); ScrollTrigger.refresh(); }
      }, { rootMargin: '400px' }).observe(stage);
    }

    addEventListener('load', () => ScrollTrigger.refresh());
  }

  function go() { fillSlots().then(start); }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', go)
    : go();
})();

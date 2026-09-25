/* ============================================================
   SUPERFLY revamp — "Find your fit" fitment finder
   Exposes exactly one global: window.initFitment
   Nothing runs on load. GSAP 3.12 + ScrollTrigger are assumed
   to be loaded and registered before initFitment() is called.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- silhouette geometry, per body type ---------- */
  /* Matches the SVG authored in partials/fitment.html.
     Wheels/limbs are plain numeric attrs so they tween cleanly;
     the body outline is a 20-command path tweened via attr.d. */
  /* Wheels sit on the ground line (y 470), so axle y = 470 - tyre radius.
     tyreIn is the inner edge of the tyre carcass; rim is the wheel proper. */
  var GEO = {
    underbone: {
      wfx: 217, wfy: 376, wrx: 727, wry: 376, tyre: 94, tyreIn: 77, rim: 49,
      forkX1: 318, forkY1: 158, forkX2: 217, forkY2: 376,
      shkX1: 652, shkY1: 250, shkX2: 708, shkY2: 378,
      barX1: 244, barY1: 124, barX2: 326, barY2: 150
    },
    scooter: {
      wfx: 213, wfy: 388, wrx: 726, wry: 388, tyre: 82, tyreIn: 67, rim: 43,
      forkX1: 316, forkY1: 166, forkX2: 213, forkY2: 388,
      shkX1: 698, shkY1: 288, shkX2: 736, shkY2: 396,
      barX1: 240, barY1: 128, barX2: 324, barY2: 156
    },
    adv: {
      wfx: 235, wfy: 394, wrx: 713, wry: 394, tyre: 76, tyreIn: 62, rim: 40,
      forkX1: 330, forkY1: 158, forkX2: 235, forkY2: 394,
      shkX1: 700, shkY1: 296, shkX2: 738, shkY2: 402,
      barX1: 254, barY1: 112, barX2: 340, barY2: 142
    }
  };

  /* Rear coil-over proportions, as fractions of the shock's own length. */
  var SHOCK = { W: 8, COIL: 13, EYE: 8.5, bodyA: 0.40, bodyB: 0.96, coilA: 0.06, coilB: 0.46, turns: 9 };

  /* ---------- hotspot positions, % of the 1000x520 viewBox ---------- */
  var PIN_POS = {
    underbone: {
      rims: [21.7, 72.3], brake: [26.8, 63.5], pump: [31.2, 28.1],
      shifter: [50.0, 76.9], shock: [68.0, 60.4], body: [79.0, 33.8]
    },
    scooter: {
      rims: [21.3, 74.6], brake: [26.2, 66.5], pump: [31.0, 29.2],
      shifter: [65.0, 71.9], shock: [71.7, 65.8], body: [80.0, 40.4]
    },
    adv: {
      rims: [23.5, 75.8], brake: [28.2, 68.5], pump: [32.6, 26.5],
      shifter: [66.0, 73.1], shock: [71.9, 67.1], body: [82.4, 39.2]
    }
  };

  var SLOTS = ['rims', 'shock', 'brake', 'pump', 'shifter', 'body'];

  var PRODUCT = {
    rims:    { cat: 'Wheels',     name: 'SUPERFLY Sport Rims' },
    shock:   { cat: 'Suspension', name: 'Project RA Super Shocks' },
    brake:   { cat: 'Braking',    name: 'SUPERFLY Brake Disc + Caliper' },
    pump:    { cat: 'Braking',    name: 'RP Brake Master Pump' },
    shifter: { cat: 'Drivetrain', name: 'SUPERFLY Quickshifter' },
    body:    { cat: 'Bodywork',   name: 'SUPERFLY Bodykit' }
  };

  var ASSUMED_NOTE = 'Indicative fitment — to be confirmed against the SUPERFLY catalogue.';

  /* ---------- helpers that build fitment entries ----------
     real()    : confirmed, straight off the SUPERFLY product sheet
     assumed() : INVENTED placeholder data. Every value it produces is
                 flagged data-assumed="true" and daggered in the UI.
     none()    : no product for this bike -> dimmed, non-interactive pin */
  function real(specs, price, colours) {
    return { specs: specs, price: price || '', colours: !!colours, assumed: false };
  }
  function assumed(specs, note) {
    var s = specs.map(function (row) { return [row[0], row[1], true]; });
    return { specs: s, price: '', colours: false, assumed: true, note: note || ASSUMED_NOTE };
  }
  function none(reason) { return { inactive: true, reason: reason }; }

  var NO_RA  = 'No Project RA shock length is listed for this model.';
  var NO_QS  = 'CVT transmission — a quickshifter does not apply.';

  /* Project RA Super Shocks — VERBATIM from the SUPERFLY product sheet.
     LITTLE BOY: Honda RS150/RSX 225 mm · Yamaha FZ150/R15/MT-15 265 mm
     FAT MAN:    Yamaha Y15/LC135 203 mm · Yamaha R25 280 mm
                 SYM VF185 203 mm · Suzuki Belang/Raider/S150/R150 265 mm */
  function ra(series, length) {
    return real([
      ['Series', series, false],
      ['Shock length', length, false]
    ], 'RM358', true);
  }

  /* Per-bike invented spec values (placeholders only). */
  function kit(rimSpec, disc, cal, bore, qs, panels) {
    return {
      rims:    assumed([['Rim size', rimSpec], ['Construction', 'Forged alloy, 10-spoke']]),
      brake:   assumed([['Disc', disc], ['Caliper', cal]]),
      pump:    assumed([['Bore', bore], ['Bar clamp', '22 mm universal']]),
      shifter: qs ? assumed([['Gearbox', qs], ['Sensor', 'Strain-gauge, bi-directional']]) : none(NO_QS),
      body:    assumed([['Kit', panels], ['Finish', 'Primed, ready to paint']])
    };
  }

  function bike(id, make, model, type, shockEntry, k) {
    return {
      id: id, make: make, model: model, type: type,
      fit: {
        rims: k.rims, shock: shockEntry, brake: k.brake,
        pump: k.pump, shifter: k.shifter, body: k.body
      }
    };
  }

  var BIKES = [
    bike('y15', 'Yamaha', 'Y15ZR / Y16ZR', 'underbone',
      ra('FAT MAN', '203 mm'),
      kit('17" x 1.40 / 17" x 1.60', '245 mm floating', '4-piston radial', '14 mm radial', '5-speed, return shift', '5-piece ABS cover set')),

    bike('lc135', 'Yamaha', 'LC135', 'underbone',
      ra('FAT MAN', '203 mm'),
      kit('17" x 1.40 / 17" x 1.60', '220 mm', '2-piston', '14 mm radial', '5-speed, return shift', '5-piece ABS cover set')),

    bike('nvx', 'Yamaha', 'NVX / Aerox', 'scooter',
      none(NO_RA),
      kit('14" x 1.60 / 14" x 1.85', '230 mm', '2-piston', '16 mm radial', null, '6-piece ABS cover set')),

    bike('nmax', 'Yamaha', 'NMAX', 'scooter',
      none(NO_RA),
      kit('13" x 2.15 / 13" x 3.00', '230 mm', '2-piston', '16 mm radial', null, '6-piece ABS cover set')),

    bike('rs150', 'Honda', 'RS150 / RSX', 'underbone',
      ra('LITTLE BOY', '225 mm'),
      kit('17" x 1.40 / 17" x 1.60', '240 mm floating', '4-piston radial', '14 mm radial', '6-speed, return shift', '5-piece ABS cover set')),

    bike('ego', 'Honda', 'EGO / Beat', 'scooter',
      none(NO_RA),
      kit('14" x 1.20 / 14" x 1.40', '190 mm', '1-piston', '12.7 mm axial', null, '4-piece ABS cover set')),

    bike('adv', 'Honda', 'ADV 150/160', 'adv',
      none(NO_RA),
      kit('14" x 1.60 / 13" x 2.50', '240 mm', '2-piston', '16 mm radial', null, '7-piece ABS cover set')),

    bike('vario', 'Honda', 'Vario / Click', 'scooter',
      none(NO_RA),
      kit('14" x 1.20 / 14" x 1.40', '190 mm', '1-piston', '12.7 mm axial', null, '4-piece ABS cover set')),

    bike('belang', 'Suzuki', 'Belang / Raider', 'underbone',
      ra('FAT MAN', '265 mm'),
      kit('17" x 1.60 / 17" x 1.85', '260 mm floating', '4-piston radial', '16 mm radial', '6-speed, return shift', '5-piece ABS cover set')),

    /* The product sheet lists "SYM VF185", not VF3i. Treated as a
       probable match, therefore flagged as indicative, not fact. */
    bike('vf3i', 'SYM', 'VF3i', 'underbone',
      (function () {
        var e = assumed([['Series', 'FAT MAN'], ['Shock length', '203 mm']],
          'Matched to the "SYM VF185" entry on the product sheet — confirm the VF3i shares that 203 mm length.');
        e.price = 'RM358';
        e.colours = true;
        return e;
      }()),
      kit('17" x 1.40 / 17" x 1.60', '260 mm floating', '4-piston radial', '14 mm radial', '5-speed, return shift', '5-piece ABS cover set'))
  ];

  var TYPE_LABEL = { underbone: 'Underbone', scooter: 'Scooter', adv: 'Adventure scooter' };

  /* Structural signature of a path: numbers blanked out. Two paths can
     only be tweened by GSAP's attr plugin if these match exactly. */
  function pathSig(d) { return String(d).replace(/-?\d*\.?\d+/g, '#'); }

  /* ============================================================ */
  window.initFitment = function initFitment() {
    var root = document.getElementById('fitment');
    if (!root) { return; }

    /* --- idempotent: tear down any previous run first --- */
    if (root.__fitment && typeof root.__fitment.destroy === 'function') {
      root.__fitment.destroy();
    }

    var $ = function (sel) { return root.querySelector(sel); };
    var $$ = function (sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); };

    var el = {
      rail:     $('#fit-rail'),
      chips:    $$('.fit-chip'),
      stage:    $('#fit-stage-inner'),
      body:     $('#fit-body'),
      ghost:    $('#fit-body-ghost'),
      tyreF:    $('#fit-tyre-f'),
      tyreR:    $('#fit-tyre-r'),
      tyreFIn:  $('#fit-tyre-f-in'),
      tyreRIn:  $('#fit-tyre-r-in'),
      rimF:     $('#fit-rim-f'),
      rimR:     $('#fit-rim-r'),
      spokesF:  $('#fit-spokes-f'),
      spokesR:  $('#fit-spokes-r'),
      fork:     $('#fit-fork'),
      swingarm: $('#fit-swingarm'),
      shockRails: $('#fit-shock-rails'),
      shockCoil:  $('#fit-shock-coil'),
      shockEyeT:  $('#fit-shock-eye-t'),
      shockEyeB:  $('#fit-shock-eye-b'),
      bar:      $('#fit-bar'),
      exhaust:  $('#fit-exhaust'),
      fender:   $('#fit-fender'),
      pins:     $$('.fit-pin'),
      card:     $('#fit-card'),
      cardCat:  $('#fit-card-cat'),
      cardName: $('#fit-card-name'),
      cardSpecs:$('#fit-card-specs'),
      cardCols: $('#fit-card-colours'),
      cardPrice:$('#fit-card-price'),
      cardNote: $('#fit-card-note'),
      cardLink: $('#fit-card-link'),
      cardClose:$('#fit-card-close'),
      backdrop: $('#fit-sheet-backdrop'),
      outModel: $('#fit-readout-model'),
      outType:  $('#fit-readout-type'),
      outCount: $('#fit-readout-count'),
      dUnderbone: $('#fit-d-underbone'),
      dScooter:   $('#fit-d-scooter'),
      dAdv:       $('#fit-d-adv'),
      eUnderbone: $('#fit-e-underbone'),
      eScooter:   $('#fit-e-scooter'),
      eAdv:       $('#fit-e-adv'),
      fUnderbone: $('#fit-f-underbone'),
      fScooter:   $('#fit-f-scooter'),
      fAdv:       $('#fit-f-adv'),
      sUnderbone: $('#fit-s-underbone'),
      sScooter:   $('#fit-s-scooter'),
      sAdv:       $('#fit-s-adv')
    };

    /* bail loudly rather than half-initialising against stale markup */
    var missing = Object.keys(el).filter(function (k) {
      return !el[k] || (el[k].length === 0 && Array.isArray(el[k]));
    });
    if (missing.length) {
      if (window.console) { console.warn('[fitment] missing markup:', missing.join(', ')); }
      return;
    }

    var gsap = window.gsap;
    var hasGsap = !!gsap;
    var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var mqDesktop = window.matchMedia('(min-width: 900px)');
    var reduced = function () { return mqReduce.matches; };

    var PATH = {
      underbone: el.dUnderbone.getAttribute('d'),
      scooter:   el.dScooter.getAttribute('d'),
      adv:       el.dAdv.getAttribute('d')
    };
    var EXH = {
      underbone: el.eUnderbone.getAttribute('d'),
      scooter:   el.eScooter.getAttribute('d'),
      adv:       el.eAdv.getAttribute('d')
    };
    var FEND = {
      underbone: el.fUnderbone.getAttribute('d'),
      scooter:   el.fScooter.getAttribute('d'),
      adv:       el.fAdv.getAttribute('d')
    };
    var SWING = {
      underbone: el.sUnderbone.getAttribute('d'),
      scooter:   el.sScooter.getAttribute('d'),
      adv:       el.sAdv.getAttribute('d')
    };

    /* Can we tween `d` directly, or must we crossfade? All three tables must
       be structurally identical (same commands, same number counts). */
    function sameShape(tbl) {
      var s0 = pathSig(tbl.underbone);
      return pathSig(tbl.scooter) === s0 && pathSig(tbl.adv) === s0;
    }
    var canMorph = sameShape(PATH) && sameShape(EXH) && sameShape(FEND) && sameShape(SWING);
    if (!canMorph && window.console) {
      console.warn('[fitment] silhouette path commands differ — falling back to crossfade.');
    }

    var pinBySlot = {};
    el.pins.forEach(function (p) { pinBySlot[p.getAttribute('data-slot')] = p; });

    var dots = el.pins.map(function (p) { return p.querySelector('.fit-pin__dot'); });

    var listeners = [];
    function on(node, type, fn, opts) {
      node.addEventListener(type, fn, opts);
      listeners.push([node, type, fn, opts]);
    }

    var state = {};
    Object.keys(GEO.underbone).forEach(function (k) { state[k] = GEO.underbone[k]; });

    var current = BIKES[0];
    var openSlot = null;
    var hideTimer = null;
    var tweens = [];
    var revealST = null;

    /* ---------- draw ---------- */
    function applyGeo(s) {
      circle(el.tyreF,   s.wfx, s.wfy, s.tyre);
      circle(el.tyreFIn, s.wfx, s.wfy, s.tyreIn);
      circle(el.rimF,    s.wfx, s.wfy, s.rim);
      circle(el.tyreR,   s.wrx, s.wry, s.tyre);
      circle(el.tyreRIn, s.wrx, s.wry, s.tyreIn);
      circle(el.rimR,    s.wrx, s.wry, s.rim);
      el.spokesF.setAttribute('transform', 'translate(' + s.wfx + ',' + s.wfy + ') scale(' + (s.rim / 100) + ')');
      el.spokesR.setAttribute('transform', 'translate(' + s.wrx + ',' + s.wry + ') scale(' + (s.rim / 100) + ')');
      setLine(el.fork, s.forkX1, s.forkY1, s.forkX2, s.forkY2);
      setLine(el.bar,  s.barX1,  s.barY1,  s.barX2,  s.barY2);
      drawShock(s.shkX1, s.shkY1, s.shkX2, s.shkY2);
    }
    function circle(node, cx, cy, r) {
      node.setAttribute('cx', cx); node.setAttribute('cy', cy); node.setAttribute('r', r);
    }
    function setLine(node, x1, y1, x2, y2) {
      node.setAttribute('x1', x1); node.setAttribute('y1', y1);
      node.setAttribute('x2', x2); node.setAttribute('y2', y2);
    }

    /* Rebuild the coil-over from its two end points: damper rails, spring
       zigzag and an eye at each end. Derived every frame, so it always tracks
       the tween instead of being a fourth path family to keep matched. */
    function drawShock(x1, y1, x2, y2) {
      var dx = x2 - x1, dy = y2 - y1;
      var L = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
      var n = function (v) { return Math.round(v * 10) / 10; };
      var P = function (t, o) { return [n(x1 + ux * t + nx * o), n(y1 + uy * t + ny * o)]; };

      var a = SHOCK.bodyA * L, b = SHOCK.bodyB * L, w = SHOCK.W;
      var r1 = P(a, w), r2 = P(b, w), r3 = P(a, -w), r4 = P(b, -w);
      el.shockRails.setAttribute('d',
        'M' + r1[0] + ' ' + r1[1] + 'L' + r2[0] + ' ' + r2[1] +
        'M' + r3[0] + ' ' + r3[1] + 'L' + r4[0] + ' ' + r4[1]);

      var c0 = SHOCK.coilA * L, c1 = SHOCK.coilB * L, N = SHOCK.turns;
      var p = P(c0, 0), d = 'M' + p[0] + ' ' + p[1];
      for (var i = 1; i < N; i++) {
        p = P(c0 + (c1 - c0) * i / N, (i % 2) ? SHOCK.COIL : -SHOCK.COIL);
        d += 'L' + p[0] + ' ' + p[1];
      }
      p = P(c1, 0); d += 'L' + p[0] + ' ' + p[1];
      el.shockCoil.setAttribute('d', d);

      circle(el.shockEyeT, n(x1), n(y1), SHOCK.EYE);
      circle(el.shockEyeB, n(x2), n(y2), SHOCK.EYE);
    }

    function morphTo(type) {
      var target = PATH[type];
      var geo = GEO[type];

      if (!hasGsap || reduced()) {
        el.body.setAttribute('d', target);
        el.exhaust.setAttribute('d', EXH[type]);
        el.fender.setAttribute('d', FEND[type]);
        el.swingarm.setAttribute('d', SWING[type]);
        el.ghost.style.opacity = 0;
        el.body.style.opacity = 1;
        Object.keys(geo).forEach(function (k) { state[k] = geo[k]; });
        applyGeo(state);
        return;
      }

      if (canMorph) {
        tweens.push(gsap.to(el.body, {
          duration: 0.85, ease: 'power3.inOut', attr: { d: target }
        }));
        tweens.push(gsap.to(el.exhaust, {
          duration: 0.85, ease: 'power3.inOut', attr: { d: EXH[type] }
        }));
        tweens.push(gsap.to(el.fender, {
          duration: 0.85, ease: 'power3.inOut', attr: { d: FEND[type] }
        }));
        tweens.push(gsap.to(el.swingarm, {
          duration: 0.85, ease: 'power3.inOut', attr: { d: SWING[type] }
        }));
      } else {
        /* crossfade fallback: ghost holds the outgoing shape */
        el.ghost.setAttribute('d', el.body.getAttribute('d'));
        el.body.setAttribute('d', target);
        el.exhaust.setAttribute('d', EXH[type]);
        el.fender.setAttribute('d', FEND[type]);
        el.swingarm.setAttribute('d', SWING[type]);
        gsap.set(el.ghost, { opacity: 1 });
        gsap.set(el.body, { opacity: 0 });
        tweens.push(gsap.to(el.ghost, { duration: 0.5, opacity: 0, ease: 'power2.out' }));
        tweens.push(gsap.to(el.body,  { duration: 0.5, opacity: 1, ease: 'power2.out' }));
      }

      tweens.push(gsap.to(state, {
        duration: 0.85, ease: 'power3.inOut',
        wfx: geo.wfx, wfy: geo.wfy, wrx: geo.wrx, wry: geo.wry,
        tyre: geo.tyre, tyreIn: geo.tyreIn, rim: geo.rim,
        forkX1: geo.forkX1, forkY1: geo.forkY1, forkX2: geo.forkX2, forkY2: geo.forkY2,
        shkX1: geo.shkX1, shkY1: geo.shkY1, shkX2: geo.shkX2, shkY2: geo.shkY2,
        barX1: geo.barX1, barY1: geo.barY1, barX2: geo.barX2, barY2: geo.barY2,
        onUpdate: function () { applyGeo(state); }
      }));
    }

    /* ---------- pins ---------- */
    function renderPins(b) {
      var pos = PIN_POS[b.type];
      var live = 0;

      SLOTS.forEach(function (slot) {
        var pin = pinBySlot[slot];
        if (!pin) { return; }
        var p = pos[slot];
        pin.style.left = p[0] + '%';
        pin.style.top = p[1] + '%';

        var fit = b.fit[slot];
        /* Must be a real boolean: classList.toggle(name, undefined) TOGGLES
           rather than forcing, which silently dimmed every pin. */
        var off = !!(!fit || fit.inactive);
        pin.classList.toggle('is-inactive', off);
        pin.classList.remove('is-open');
        pin.disabled = off;
        pin.setAttribute('aria-expanded', 'false');
        pin.setAttribute('data-assumed', (!off && fit.assumed) ? 'true' : 'false');

        var label = PRODUCT[slot].name;
        pin.setAttribute('aria-label', off
          ? label + ' — not available for the ' + b.make + ' ' + b.model + '. ' + (fit && fit.reason ? fit.reason : '')
          : label + ' — fits the ' + b.make + ' ' + b.model + (fit.assumed ? '. Indicative fitment.' : ''));

        if (!off) { live++; }
      });

      el.outCount.textContent = live + (live === 1 ? ' part fits' : ' parts fit');

      if (hasGsap && !reduced()) {
        tweens.push(gsap.fromTo(dots,
          { scale: 0.2, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2.2)', stagger: 0.055, overwrite: true }
        ));
      } else if (hasGsap) {
        gsap.set(dots, { scale: 1, opacity: 1 });
      }
    }

    /* ---------- spec card ---------- */
    function buildSpecs(fit, b) {
      el.cardSpecs.textContent = '';
      var rows = [['Fits', b.make + ' ' + b.model, false]].concat(fit.specs);
      rows.forEach(function (row) {
        var wrap = document.createElement('div');
        var dt = document.createElement('dt');
        var dd = document.createElement('dd');
        dt.textContent = row[0];
        dd.textContent = row[1];
        if (row[2]) {
          dd.setAttribute('data-assumed', 'true');
          var dag = document.createElement('sup');
          dag.className = 'fit-dag';
          dag.textContent = '†';
          dd.appendChild(dag);
        }
        wrap.appendChild(dt);
        wrap.appendChild(dd);
        el.cardSpecs.appendChild(wrap);
      });
    }

    function positionCard(slot) {
      var p = PIN_POS[current.type][slot];
      el.card.classList.remove('is-anchor-left', 'is-anchor-right', 'is-below');
      if (mqDesktop.matches) {
        el.card.style.left = p[0] + '%';
        el.card.style.top = p[1] + '%';
        if (p[0] < 24) { el.card.classList.add('is-anchor-left'); }
        else if (p[0] > 76) { el.card.classList.add('is-anchor-right'); }
        if (p[1] < 42) { el.card.classList.add('is-below'); }
      } else {
        el.card.style.left = '';
        el.card.style.top = '';
      }
    }

    function openCard(slot) {
      var fit = current.fit[slot];
      if (!fit || fit.inactive) { return; }

      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }

      el.cardCat.textContent = PRODUCT[slot].cat;
      el.cardName.textContent = PRODUCT[slot].name;
      buildSpecs(fit, current);

      el.cardCols.hidden = !fit.colours;

      if (fit.price) {
        el.cardPrice.textContent = fit.price;
        el.cardPrice.classList.remove('is-unknown');
      } else {
        el.cardPrice.textContent = 'Price on request';
        el.cardPrice.classList.add('is-unknown');
      }

      if (fit.assumed) {
        el.cardNote.textContent = '† ' + (fit.note || ASSUMED_NOTE);
        el.cardNote.hidden = false;
      } else {
        el.cardNote.hidden = true;
      }

      el.cardLink.setAttribute('href', '#');
      el.cardLink.setAttribute('aria-label', 'View product: ' + PRODUCT[slot].name);

      positionCard(slot);

      el.pins.forEach(function (p) {
        var isIt = p.getAttribute('data-slot') === slot;
        p.classList.toggle('is-open', isIt);
        p.setAttribute('aria-expanded', isIt ? 'true' : 'false');
      });

      el.card.hidden = false;
      if (!mqDesktop.matches) { el.backdrop.hidden = false; }

      /* Force a synchronous reflow so the transition runs from the closed
         state. Deliberately not requestAnimationFrame: rAF is throttled in
         background tabs, which would leave the card rendered but invisible. */
      void el.card.offsetHeight;
      el.card.classList.add('is-open');
      if (!mqDesktop.matches) { el.backdrop.classList.add('is-open'); }

      openSlot = slot;
    }

    function closeCard(focusPin) {
      if (!openSlot) { return; }
      var slot = openSlot;
      openSlot = null;

      el.card.classList.remove('is-open');
      el.backdrop.classList.remove('is-open');
      el.pins.forEach(function (p) {
        p.classList.remove('is-open');
        p.setAttribute('aria-expanded', 'false');
      });

      hideTimer = setTimeout(function () {
        el.card.hidden = true;
        el.backdrop.hidden = true;
        hideTimer = null;
      }, 420);

      if (focusPin && pinBySlot[slot] && !pinBySlot[slot].disabled) {
        pinBySlot[slot].focus();
      }
    }

    /* ---------- selection ---------- */
    function selectBike(id, animate) {
      var next = null;
      for (var i = 0; i < BIKES.length; i++) {
        if (BIKES[i].id === id) { next = BIKES[i]; break; }
      }
      if (!next) { return; }

      closeCard(false);
      current = next;

      el.chips.forEach(function (c) {
        var on = c.getAttribute('data-bike') === id;
        c.setAttribute('aria-selected', on ? 'true' : 'false');
        c.setAttribute('tabindex', on ? '0' : '-1');
      });

      el.outModel.textContent = next.make + ' ' + next.model;
      el.outType.textContent = TYPE_LABEL[next.type] || next.type;

      if (animate === false) {
        var geo = GEO[next.type];
        Object.keys(geo).forEach(function (k) { state[k] = geo[k]; });
        applyGeo(state);
        el.body.setAttribute('d', PATH[next.type]);
        el.exhaust.setAttribute('d', EXH[next.type]);
        el.fender.setAttribute('d', FEND[next.type]);
        el.swingarm.setAttribute('d', SWING[next.type]);
      } else {
        morphTo(next.type);
      }

      renderPins(next);
    }

    /* ---------- events ---------- */
    el.chips.forEach(function (chip) {
      on(chip, 'click', function () { selectBike(chip.getAttribute('data-bike'), true); });
    });

    on(el.rail, 'keydown', function (e) {
      var keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
      if (keys.indexOf(e.key) === -1) { return; }
      var idx = el.chips.indexOf(document.activeElement);
      if (idx === -1) { return; }
      e.preventDefault();
      var nextIdx = idx;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { nextIdx = (idx + 1) % el.chips.length; }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { nextIdx = (idx - 1 + el.chips.length) % el.chips.length; }
      if (e.key === 'Home') { nextIdx = 0; }
      if (e.key === 'End')  { nextIdx = el.chips.length - 1; }
      var target = el.chips[nextIdx];
      target.focus();
      selectBike(target.getAttribute('data-bike'), true);
    });

    el.pins.forEach(function (pin) {
      on(pin, 'click', function () {
        var slot = pin.getAttribute('data-slot');
        if (openSlot === slot) { closeCard(false); } else { openCard(slot); }
      });
    });

    on(el.cardClose, 'click', function () { closeCard(true); });
    on(el.backdrop, 'click', function () { closeCard(false); });
    on(el.cardLink, 'click', function (e) { e.preventDefault(); });

    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && openSlot) { closeCard(true); }
    });

    var resizeRaf = null;
    on(window, 'resize', function () {
      if (resizeRaf) { return; }
      resizeRaf = window.requestAnimationFrame(function () {
        resizeRaf = null;
        if (openSlot) { positionCard(openSlot); }
      });
    });

    /* ---------- initial paint ---------- */
    selectBike(current.id, false);
    if (hasGsap && !reduced()) {
      gsap.set(dots, { scale: 1, opacity: 1, transformOrigin: '50% 50%' });
    }

    /* ---------- scroll reveal ----------
       The reveal hides content first, so it must be impossible to get stuck
       hidden. Two guards: refresh ScrollTrigger immediately (so a section that
       is already in view reveals at once), and a fail-safe timer that strips
       the inline styles if the trigger never fires for any reason. */
    var revealFailsafe = null;
    if (hasGsap && !reduced() && window.ScrollTrigger) {
      var revealTargets = [$('.fit-head'), $('.fit-rail-wrap'), $('.fit-stage')].filter(Boolean);
      var t = gsap.from(revealTargets, {
        y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1,
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: root, start: 'top 85%', once: true }
      });
      tweens.push(t);
      revealST = t.scrollTrigger || null;

      window.ScrollTrigger.refresh();

      revealFailsafe = setTimeout(function () {
        revealFailsafe = null;
        if (t && t.progress() === 0) {
          if (t.scrollTrigger) { t.scrollTrigger.kill(); revealST = null; }
          t.kill();
          gsap.set(revealTargets, { clearProps: 'transform,opacity' });
        }
      }, 2500);
    }

    /* ---------- teardown ---------- */
    root.__fitment = {
      destroy: function () {
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners.length = 0;
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        if (revealFailsafe) { clearTimeout(revealFailsafe); revealFailsafe = null; }
        if (resizeRaf) { window.cancelAnimationFrame(resizeRaf); resizeRaf = null; }
        if (revealST) { revealST.kill(); revealST = null; }
        tweens.forEach(function (tw) { if (tw && tw.kill) { tw.kill(); } });
        tweens.length = 0;
        el.card.classList.remove('is-open', 'is-anchor-left', 'is-anchor-right', 'is-below');
        el.card.hidden = true;
        el.backdrop.classList.remove('is-open');
        el.backdrop.hidden = true;
        el.pins.forEach(function (p) { p.classList.remove('is-open'); });
        root.__fitment = null;
      }
    };
  };
}());

/* ═══════════════════════════════════════════════════════════════
   TEARDOWN — Three.js product stage for the Project RA Super Shocks.

   The camera, lighting, platform, rings, floor grid and every hotspot
   anchor are genuine 3D. The product itself is a camera-facing textured
   plane (a photographic stand-in) — swapping in a scanned .glb means
   replacing buildProduct() and nothing else.
   ═══════════════════════════════════════════════════════════════ */
window.initTeardown = (function () {

  /* ── real specs, lifted from SUPERFLY's own Project RA product sheet ── */
  const DETAILS = [
    {
      id: 'chassis', label: 'CNC chassis', at: [0.44, 0.17],
      title: 'CNC-machined aluminium chassis',
      body: 'Billet aerospace aluminium, machined rather than cast. It holds its ' +
            'shape under load instead of flexing, and it sheds heat instead of storing it — ' +
            'which is what keeps damping consistent on lap fifteen.',
      specs: [['Material', '100% aerospace aluminium'], ['Process', 'CNC machined'], ['Finish', 'Anodised']]
    },
    {
      id: 'preload', label: 'Preload', at: [0.42, 0.31],
      title: 'Customisable preload spring',
      body: 'Threaded preload collar. Dial in sag for your weight, your pillion and your ' +
            'luggage without changing the spring — the same shock suits a 55 kg rider and a 95 kg one.',
      specs: [['Adjustment', 'Threaded collar'], ['Tool', 'C-spanner supplied'], ['Range', 'Full sag window']]
    },
    {
      id: 'piston', label: 'Floating piston', at: [0.56, 0.50],
      title: 'Full floating piston',
      body: 'A floating piston separates oil from gas, so the damping oil never aerates. ' +
            'No foaming means no fade — the last corner behaves like the first.',
      specs: [['Type', 'Full floating'], ['Separation', 'Oil / gas'], ['Benefit', 'Fade resistant']]
    },
    {
      id: 'spring', label: 'Coil spring', at: [0.19, 0.60],
      title: 'Chromium alloy coil spring',
      body: 'Chromium alloy, wound and heat-treated for a linear rate that holds its ' +
            'free length. It will not sack out after a season of Malaysian road surfaces.',
      specs: [['Material', 'Chromium alloy'], ['Rate', 'Linear'], ['Finish', 'Powder coated']]
    },
    {
      id: 'eye', label: 'Fish eye', at: [0.33, 0.045],
      title: 'Multi-directional eye',
      body: 'A spherical fish-eye bearing at the mount. It absorbs the small ' +
            'misalignments every swingarm has, so the shock works in one axis only — ' +
            'the one it was valved for.',
      specs: [['Type', 'Spherical / fish eye'], ['Motion', 'Multi-directional'], ['Effect', 'No bind']]
    },
    {
      id: 'rebound', label: '6-click rebound', at: [0.44, 0.82],
      title: 'Six-click rebound adjuster',
      body: 'Six detented clicks of rebound damping at the base. Click 1 lets the ' +
            'spring return fast for broken surfaces; click 6 holds it down for smooth, fast circuit work.',
      specs: [['Clicks', '6 detented'], ['Modes', '6 for ultimate control'], ['Access', 'Base adjuster']]
    }
  ];

  const CLICK_NOTES = [
    'Click 1 — loose. Fast return for broken kampung roads.',
    'Click 2 — soft. Comfort-biased on mixed surfaces.',
    'Click 3 — road. Everyday damping for daily riding.',
    'Click 4 — balanced. The setting most riders start from.',
    'Click 5 — firm. Controlled on smooth, fast roads.',
    'Click 6 — circuit. Heavily damped, no overshoot.'
  ];

  const COLOURS = {
    black: { tex: 'assets/products/shock-black.png', rim: 0xff19ab, name: 'MIDNIGHT' },
    tblue: { tex: 'assets/products/shock-tblue.png', rim: 0x29abe2, name: 'T-BLUE' },
    nardo: { tex: 'assets/products/shock-nardo.png', rim: 0x9a9ea3, name: 'NARDO' }
  };

  const RMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => RMQ.matches;   // live, so an OS change mid-session takes effect
  let started = false;

  return function initTeardown() {
    if (started) return;
    const stage = document.getElementById('tdStage');
    const canvas = document.getElementById('tdCanvas');
    if (!stage || !canvas || !window.THREE) return;
    started = true;

    /* ─────────────── scene ─────────────── */
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08080b, 0.075);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;

    /* ─────────────── lighting ─────────────── */
    scene.add(new THREE.AmbientLight(0x30303c, 1.5));

    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(4, 7, 5);
    scene.add(key);

    // rims sit ABOVE the product looking back at it — they must not wash the platter
    const rimA = new THREE.PointLight(0xff19ab, 2.4, 20, 2);
    rimA.position.set(-3.5, 2.3, -3.6);
    scene.add(rimA);

    const rimB = new THREE.PointLight(0x29abe2, 1.7, 20, 2);
    rimB.position.set(3.5, 1.9, -3.4);
    scene.add(rimB);

    /* ─────────────── platform ─────────────── */
    const world = new THREE.Group();
    scene.add(world);

    const FLOOR = -1.55;

    const platter = new THREE.Mesh(
      new THREE.CylinderGeometry(1.02, 1.12, 0.13, 6),
      new THREE.MeshStandardMaterial({ color: 0x0B0B10, metalness: 0.25, roughness: 0.94 })
    );
    platter.position.y = FLOOR;
    world.add(platter);

    const lip = new THREE.Mesh(
      new THREE.TorusGeometry(1.02, 0.014, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xff19ab, transparent: true, opacity: 0.75 })
    );
    lip.rotation.x = Math.PI / 2;
    lip.position.y = FLOOR + 0.07;
    world.add(lip);

    // two technical rings floating around the product
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x2a2a34, transparent: true, opacity: 0.85 });
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(1.52, 0.005, 6, 120), ringMat);
    ringA.rotation.x = Math.PI / 2; ringA.position.y = FLOOR + 0.5;
    world.add(ringA);

    const ringB = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.004, 6, 120),
      new THREE.MeshBasicMaterial({ color: 0xff19ab, transparent: true, opacity: 0.32 }));
    ringB.rotation.x = Math.PI / 2; ringB.position.y = FLOOR + 1.85;
    world.add(ringB);

    // radial floor grid
    const gridPts = [];
    for (let r = 0.6; r <= 5.2; r += 0.62) {
      let prev = null;
      for (let i = 0; i <= 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        const p = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
        if (prev) gridPts.push(prev, p);
        prev = p;
      }
    }
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      gridPts.push(new THREE.Vector3(Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6),
                   new THREE.Vector3(Math.cos(a) * 5.2, 0, Math.sin(a) * 5.2));
    }
    const grid = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(gridPts),
      new THREE.LineBasicMaterial({ color: 0x1c1c24, transparent: true, opacity: 0.55 })
    );
    grid.position.y = FLOOR - 0.08;
    world.add(grid);

    /* ─────────────── product (swap this for a .glb) ─────────────── */
    const product = new THREE.Group();
    product.position.y = FLOOR + 0.08;
    scene.add(product);

    const H = 3.15, W = H * (503 / 1099);
    const geo = new THREE.PlaneGeometry(W, H);
    geo.translate(0, H / 2, 0);                       // origin at the foot, so it compresses downward

    const loader = new THREE.TextureLoader();
    const mat = new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    product.add(mesh);

    function setTexture(key) {
      loader.load(COLOURS[key].tex, t => {
        t.encoding = THREE.sRGBEncoding;
        t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        if (mat.map) mat.map.dispose();
        mat.map = t; mat.needsUpdate = true;
      });
    }
    setTexture('black');

    // contact shadow
    const shadowCv = document.createElement('canvas');
    shadowCv.width = shadowCv.height = 128;
    const sx = shadowCv.getContext('2d');
    const grd = sx.createRadialGradient(64, 64, 2, 64, 64, 64);
    grd.addColorStop(0, 'rgba(0,0,0,.85)');
    grd.addColorStop(.45, 'rgba(0,0,0,.42)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    sx.fillStyle = grd; sx.fillRect(0, 0, 128, 128);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.78, 48),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(shadowCv), transparent: true, depthWrite: false
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = FLOOR + 0.075;
    scene.add(shadow);

    /* ─────────────── hotspot anchors (real 3D children of the product) ─────────────── */
    const spotsEl = document.getElementById('tdSpots');
    spotsEl.innerHTML = '';
    const anchors = DETAILS.map((d, i) => {
      const o = new THREE.Object3D();
      o.position.set((d.at[0] - 0.5) * W, (1 - d.at[1]) * H, 0.06);
      product.add(o);

      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'td__spot';
      el.innerHTML = '<b></b><i>' + d.label + '</i>';
      el.setAttribute('aria-label', d.title);
      el.addEventListener('click', () => select(i, true));
      spotsEl.appendChild(el);

      return { o, el, v: new THREE.Vector3() };
    });

    /* ─────────────── camera orbit ─────────────── */
    let az = -0.42, el = 0.16, azTarget = az, elTarget = el;
    const R = 5.6;
    let idle = 0, dragging = false, px = 0, py = 0;

    function placeCamera() {
      const ce = Math.cos(el);
      camera.position.set(Math.sin(az) * R * ce, Math.sin(el) * R + 0.35, Math.cos(az) * R * ce);
      camera.lookAt(0, 0.05, 0);
      product.rotation.y = az;                        // yaw-billboard: always faces the lens, stays upright
    }

    stage.addEventListener('pointerdown', e => {
      if (e.target.closest('.td__spot')) return;
      dragging = true; px = e.clientX; py = e.clientY; idle = 0;
      stage.classList.add('is-drag');
      stage.setPointerCapture(e.pointerId);
      document.getElementById('tdHint').classList.add('is-off');
    });
    stage.addEventListener('pointermove', e => {
      if (!dragging) return;
      azTarget -= (e.clientX - px) * 0.0072;
      elTarget = Math.max(-0.25, Math.min(0.62, elTarget + (e.clientY - py) * 0.0042));
      px = e.clientX; py = e.clientY; idle = 0;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
      stage.addEventListener(ev, () => { dragging = false; stage.classList.remove('is-drag'); }));

    /* ─────────────── detail selection ─────────────── */
    const elIdx = document.getElementById('tdIdx');
    const elTitle = document.getElementById('tdTitle');
    const elBody = document.getElementById('tdBody');
    const elSpecs = document.getElementById('tdSpecs');
    const panel = document.getElementById('tdPanel');
    let current = -1;

    function select(i, recentre) {
      if (i === current) return;
      current = i;
      const d = DETAILS[i];

      anchors.forEach((a, n) => a.el.classList.toggle('is-on', n === i));

      elIdx.textContent = String(i + 1).padStart(2, '0');
      elTitle.textContent = d.title;
      elBody.textContent = d.body;
      elSpecs.innerHTML = d.specs
        .map(s => '<li><span>' + s[0] + '</span><span>' + s[1] + '</span></li>').join('');

      if (window.gsap && !reduced()) {
        gsap.fromTo(panel.querySelectorAll('h3,p,li,.td__panel-idx'),
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: .45, stagger: .035, ease: 'power3.out', overwrite: true });
      }

      // ease the camera round so the chosen detail is not hiding behind the body
      if (recentre) {
        const want = d.at[0] < 0.35 ? -0.75 : d.at[0] > 0.5 ? 0.30 : -0.42;
        if (window.gsap && !reduced()) {
          gsap.to({ v: azTarget }, {
            v: want, duration: 1.0, ease: 'power3.inOut',
            onUpdate: function () { azTarget = this.targets()[0].v; }
          });
        } else azTarget = want;
        idle = 0;
      }
    }
    select(0, false);

    document.getElementById('tdPrev').onclick = () => select((current - 1 + DETAILS.length) % DETAILS.length, true);
    document.getElementById('tdNext').onclick = () => select((current + 1) % DETAILS.length, true);

    /* ─────────────── rebound: compression + damping curve ─────────────── */
    const curve = document.getElementById('tdCurve');
    const curveFill = document.getElementById('tdCurveFill');
    const clickOut = document.getElementById('tdClickOut');
    const clickNote = document.getElementById('tdClickNote');
    let clicks = 4;

    function damping(c) { return 0.12 + (c - 1) * 0.168; }   // ζ: 0.12 (bouncy) → 0.96 (dead)

    function drawCurve(c) {
      const z = damping(c), w = 9.2, wd = w * Math.sqrt(Math.max(0.0001, 1 - z * z));
      let d = '';
      for (let i = 0; i <= 90; i++) {
        const t = (i / 90) * 1.15;
        const y = 60 - 44 * Math.exp(-z * w * t) * Math.cos(wd * t);
        d += (i ? 'L' : 'M') + (i / 90 * 320).toFixed(1) + ' ' + y.toFixed(1);
      }
      curve.setAttribute('d', d);
      curveFill.setAttribute('d', d + 'L320 60 L0 60 Z');
    }

    function bounce(c) {
      if (reduced() || !window.gsap) return;
      const z = damping(c);
      gsap.killTweensOf(product.scale);
      gsap.timeline()
        .to(product.scale, { y: 0.9, duration: 0.16, ease: 'power2.in' })
        .to(product.scale, {
          y: 1, duration: 0.55 + z * 1.5,
          ease: z < 0.3 ? 'elastic.out(1.5, 0.22)' : z < 0.6 ? 'elastic.out(1, 0.55)' : 'power2.out'
        });
    }

    function setClicks(c) {
      clicks = c;
      document.querySelectorAll('#tdClicks button')
        .forEach(b => b.classList.toggle('is-on', +b.dataset.click === c));
      clickOut.textContent = c;
      clickNote.textContent = CLICK_NOTES[c - 1];
      drawCurve(c);
      bounce(c);
    }
    document.getElementById('tdClicks').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b) setClicks(+b.dataset.click);
    });
    setClicks(4);

    /* ─────────────── colourway ─────────────── */
    const colourOut = document.getElementById('tdColourOut');
    document.getElementById('tdColours').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      const k = b.dataset.colour;
      document.querySelectorAll('#tdColours button').forEach(x => x.classList.toggle('is-on', x === b));
      setTexture(k);
      colourOut.textContent = COLOURS[k].name;
      rimB.color.setHex(COLOURS[k].rim);
      if (window.gsap && !reduced()) {
        gsap.fromTo(mesh.scale, { x: 1.05, y: 1.05 }, { x: 1, y: 1, duration: .6, ease: 'power3.out' });
      }
    });

    /* ─────────────── resize ─────────────── */
    function resize() {
      const r = stage.getBoundingClientRect();
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
    }
    resize();
    addEventListener('resize', resize);

    /* ─────────────── frame loop ─────────────── */
    const azOut = document.getElementById('tdAzim');
    const proj = new THREE.Vector3();
    let visible = true;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0.02 })
      .observe(stage);

    function frame() {
      requestAnimationFrame(frame);
      if (!visible) return;

      if (!dragging) idle++;
      if (idle > 150 && !reduced()) azTarget += 0.0016;     // drift back to life when left alone

      az += (azTarget - az) * 0.085;
      el += (elTarget - el) * 0.085;
      placeCamera();

      ringA.rotation.z += 0.0011;
      ringB.rotation.z -= 0.0018;
      platter.rotation.y += 0.0007;

      // project each 3D anchor to the screen and move its HTML marker there
      const r = stage.getBoundingClientRect();
      anchors.forEach(a => {
        a.o.getWorldPosition(proj);
        proj.project(camera);
        a.el.style.left = ((proj.x * 0.5 + 0.5) * r.width) + 'px';
        a.el.style.top = ((-proj.y * 0.5 + 0.5) * r.height) + 'px';
        a.el.style.opacity = proj.z > 1 ? 0 : 1;
      });

      const deg = ((az * 180 / Math.PI) % 360 + 360) % 360;
      azOut.textContent = String(Math.round(deg)).padStart(3, '0') + '°';

      renderer.render(scene, camera);
    }
    frame();
  };
})();

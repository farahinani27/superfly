/* =============================================================
 * SUPERFLY — HOME INTRO (movement)
 * -------------------------------------------------------------
 * Looks: assets/css/home-intro.css.
 *
 *   0. First visit     the intro takes the place of the carbon box
 *                      (preloader.js) — only the first time the site
 *                      is opened in this tab; a refresh or coming back
 *                      to Home skips it (the small script under the
 *                      intro in functions.php takes it out, so this
 *                      file finds no intro and does nothing)
 *   1. Loading         the percent counts up with the real page
 *                      loading (never faster than MIN_TIME), the "+"
 *                      pattern fills, the status line changes with
 *                      the percent, the dots tick, the drawings play
 *   2. Reveal          the pattern pushes the logo panel away, the
 *                      bottom cards drop, the pattern fills the screen,
 *                      "READY"
 *   3. Curtain         the whole screen lifts up; the home hero starts
 *                      its entrance ("sf:preloader-done" event)
 *
 * Runs straight away (no waiting for the page), before preloader.js.
 * ============================================================= */

(function () {
	var intro = document.querySelector('.sf-intro');

	if (!intro) {
		return;
	}

	/* 0. "Reduce motion": no intro (the CSS hides it) — remove it and
	      let preloader.js handle things as usual */
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		intro.remove();
		return;
	}

	// The intro replaces the bike loading screen on this load. The bike's
	// panel is only put away (not removed): preloader.js still uses it
	// for the page change when a navbar link is clicked.
	window.sfIntroActive = true;
	var lights = document.querySelector('.sf-lights');
	if (lights) {
		lights.classList.add('is-parked');
	}


	var MIN_TIME = 2600;  // ms — the counter never reaches 100% sooner than this
	var MAX_TIME = 8000;  // ms — and never later than this, even if still loading

	var percentEl = intro.querySelector('.sf-intro__percent');
	var messageEl = intro.querySelector('.sf-intro__message');

	// The status line: each message shows from its percent upwards
	var MESSAGES = [
		{ from: 0,  text: 'Warming up the engine' },
		{ from: 30, text: 'Checking tyre pressure' },
		{ from: 60, text: 'Setting the suspension' },
		{ from: 90, text: 'Lights out' }
	];
	var messageIndex = 0;
	var dotsEls = intro.querySelectorAll('.sf-intro__dots');
	var start = performance.now();
	var loaded = document.readyState === 'complete';
	var shownValue = 0;   // what the counter shows (0 … 100)
	var revealing = false;

	window.addEventListener('load', function () { loaded = true; });


	/* 1a. Dots: . .. ... */
	var dotCount = 0;
	var dotsTimer = setInterval(function () {
		dotCount = (dotCount + 1) % 4;
		var text = new Array(dotCount + 1).join('.');
		dotsEls.forEach(function (el) { el.textContent = text; });
	}, 350);


	/* 1b. Counter + pattern. The target creeps up to 90% over MIN_TIME;
	       once the page has loaded (and MIN_TIME has passed) it goes to
	       100%. The shown value eases towards the target every frame. */
	function tick() {
		var elapsed = performance.now() - start;
		var target = Math.min(90, (elapsed / MIN_TIME) * 90);

		if ((loaded && elapsed >= MIN_TIME) || elapsed >= MAX_TIME) {
			target = 100;
		}

		shownValue += (target - shownValue) * 0.08;

		if (target === 100 && shownValue > 99.5) {
			shownValue = 100;
		}

		percentEl.textContent = Math.round(shownValue) + '%';
		updateMessage(shownValue);
		intro.style.setProperty('--sf-intro-load', (shownValue / 100).toFixed(4));

		if (shownValue >= 100) {
			reveal();
		} else {
			requestAnimationFrame(tick);
		}
	}


	/* 1c. Status line: swap to the next message once its percent is
	       reached, and replay the slide-up animation */
	function updateMessage(value) {
		var next = messageIndex;

		while (next + 1 < MESSAGES.length && value >= MESSAGES[next + 1].from) {
			next++;
		}

		if (next === messageIndex || !messageEl) {
			return;
		}

		messageIndex = next;
		messageEl.textContent = MESSAGES[next].text;
		messageEl.classList.remove('is-new');
		void messageEl.offsetWidth;   // restart the CSS animation
		messageEl.classList.add('is-new');
	}


	/* 1d. The line drawings loop (needs GSAP; without it they stay still) */
	var drawings = null;

	function playDrawings() {
		if (!window.gsap) {
			return;
		}

		var wheels = intro.querySelectorAll('.sf-intro__art--wheel .sf-intro__shape');
		var discs = intro.querySelectorAll('.sf-intro__art--disc .sf-intro__shape');

		// wheel copies fan out left/right, smaller and fainter, while spinning
		var WHEEL_X = [0, 24, 44, -24, -44];
		var WHEEL_S = [1, 0.92, 0.84, 0.92, 0.84];
		// disc copies spread out on a diagonal
		var DISC_X = [0, 22, 44, 66];
		var DISC_Y = [0, 6, 12, 18];

		drawings = gsap.timeline({ repeat: -1, repeatDelay: 0.4, defaults: { ease: 'power3.inOut' } });

		drawings
			.to(wheels, {
				x: function (i) { return WHEEL_X[i]; },
				scale: function (i) { return WHEEL_S[i]; },
				opacity: function (i) { return i === 0 ? 1 : 0.55; },
				rotation: 72,
				duration: 0.7
			}, 0)
			.to(discs, {
				x: function (i) { return DISC_X[i]; },
				y: function (i) { return DISC_Y[i]; },
				opacity: function (i) { return 1 - i * 0.18; },
				duration: 0.7
			}, 0.35)
			.to(wheels, { x: 0, scale: 1, opacity: 1, rotation: 144, duration: 0.7 }, 1.3)
			.to(discs, { x: 0, y: 0, opacity: 1, duration: 0.7 }, 1.65);
	}


	/* 2 + 3. Reveal, then the curtain */
	function reveal() {
		if (revealing) {
			return;
		}

		revealing = true;
		clearInterval(dotsTimer);

		if (!window.gsap) {
			finish();
			return;
		}

		var top = intro.querySelector('.sf-intro__row--top');
		var bottom = intro.querySelector('.sf-intro__row--bottom');
		var brand = intro.querySelector('.sf-intro__brand');
		var cards = intro.querySelectorAll('.sf-intro__label, .sf-intro__art');

		gsap.timeline({ defaults: { ease: 'power3.inOut' } })
			// the pattern pushes the logo panel away
			.to(brand, { flexBasis: '0%', paddingLeft: 0, paddingRight: 0, duration: 1.1 }, 0)
			// bottom cards drop and fade
			.to(cards, { yPercent: 80, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power3.in' }, 0.1)
			// the pattern panel fills the whole screen
			.to(top, { flexBasis: '100%', duration: 0.9 }, 0.7)
			.to(bottom, { flexBasis: '0%', duration: 0.9 }, 0.7)
			.add(function () {
				percentEl.textContent = 'READY';
				if (drawings) {
					drawings.kill();
				}
			}, 1.2)
			// curtain up
			.add(function () { markDone(); }, 1.75)
			.to(intro, { yPercent: -100, duration: 1.2, ease: 'power4.inOut', onComplete: finish }, 1.75);
	}

	function markDone() {
		window.sfPreloaderDone = true;
		document.dispatchEvent(new CustomEvent('sf:preloader-done'));
	}

	function finish() {
		if (!window.sfPreloaderDone) {
			markDone();
		}
		intro.remove();
	}


	// GSAP loads later in the page (footer); start the drawings once it's there
	if (window.gsap) {
		playDrawings();
	} else {
		document.addEventListener('DOMContentLoaded', playDrawings);
	}

	requestAnimationFrame(tick);
})();

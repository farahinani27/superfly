/* =============================================================
 * SUPERFLY — INSTALL (photo stage prototype, movement)
 * One pinned screen, scrubbed by the scroll:
 *   · the words on the left swap per step
 *   · the photo on the right crossfades, drifts and zooms
 *   · a light sweeps across on each swap
 *   · the pink pointer moves to the part the step is about
 *   · the bar under the photo fills as you go
 * ============================================================= */
(function () {
	var ig = document.querySelector('.sf-guide');

	if (!ig || !window.gsap || !window.ScrollTrigger) {
		return;
	}

	gsap.registerPlugin(ScrollTrigger);

	var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var panels = ig.querySelectorAll('.sf-guide-panel');
	var shots = ig.querySelectorAll('.sf-guide-shot');
	var dots = ig.querySelectorAll('.sf-guide-dots button');
	var count = ig.querySelector('[data-count]');
	var tag = ig.querySelector('[data-tag]');
	var point = ig.querySelector('[data-point]');
	var pointLabel = ig.querySelector('[data-point-label]');
	var metaLeft = ig.querySelector('[data-meta-left]');
	var metaBar = ig.querySelector('[data-meta-bar]');
	var clickOut = ig.querySelector('[data-click]');
	var scan = ig.querySelector('.sf-guide-scan');

	// what each step points at, and what the little tag says
	var STEPS = [
		{ tag: 'Rear wheel off the ground', label: 'Paddock stand', x: 52, y: 74 },
		{ tag: 'Upper bolt, after the lower one', label: 'Upper bolt', x: 46, y: 34 },
		{ tag: 'Top mount first, by hand', label: 'Top mount', x: 54, y: 30 },
		{ tag: 'Preload ring, one click at a time', label: 'Preload ring', x: 44, y: 46 },
		{ tag: 'Same setting on both shocks', label: 'Second shock', x: 62, y: 52 },
		{ tag: 'Back on its wheels', label: 'Rear end', x: 48, y: 62 }
	];

	var at = 0;

	function show(n) {
		if (n === at) {
			return;
		}

		var step = STEPS[n];
		at = n;

		panels.forEach(function (panel, i) { panel.classList.toggle('is-on', i === n); });
		dots.forEach(function (dot, i) { dot.classList.toggle('is-on', i === n); });
		count.textContent = ('0' + (n + 1)).slice(-2);
		metaLeft.textContent = 'Step ' + ('0' + (n + 1)).slice(-2);
		gsap.to(metaBar, { width: ((n + 1) / STEPS.length * 100) + '%', duration: 0.5, ease: 'power2.out' });

		// the photo: the new one fades up while it drifts in
		shots.forEach(function (shot, i) {
			var on = i === n;
			gsap.to(shot, { autoAlpha: on ? 1 : 0, duration: calm ? 0 : 0.6, ease: 'power2.inOut' });
			if (on && !calm) {
				gsap.fromTo(shot.querySelector('img'),
					{ scale: 1.16, xPercent: n % 2 ? 2 : -2 },
					{ scale: 1.04, xPercent: 0, duration: 2.4, ease: 'power2.out' });
			}
		});

		if (!calm) {
			gsap.fromTo(scan, { xPercent: -100 }, { xPercent: 100, duration: 0.9, ease: 'power2.inOut' });
		}

		// the tag and the pointer
		gsap.to(tag, {
			autoAlpha: 0, y: 8, duration: 0.2,
			onComplete: function () {
				tag.textContent = step.tag;
				gsap.to(tag, { autoAlpha: 1, y: 0, duration: 0.3 });
			}
		});

		pointLabel.textContent = step.label;
		gsap.to(point, { left: step.x + '%', top: step.y + '%', duration: 0.8, ease: 'power3.inOut' });
		gsap.fromTo(point, { scale: 0.85, autoAlpha: 0.2 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(2)', delay: 0.15 });
	}

	// the first one, without animating
	gsap.set(shots, { autoAlpha: 0 });
	gsap.set(shots[0], { autoAlpha: 1 });
	gsap.set(point, { left: STEPS[0].x + '%', top: STEPS[0].y + '%' });
	gsap.set(metaBar, { width: (100 / STEPS.length) + '%' });
	tag.textContent = STEPS[0].tag;
	pointLabel.textContent = STEPS[0].label;

	/* ---- opening words ---- */
	if (!calm) {
		gsap.from('.sf-guide-open__title span > *, .sf-guide-open__title em', { yPercent: 115, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.15 });
		gsap.from('.sf-guide-open__sub, .sf-guide-open .sf-guide-row', { y: 22, opacity: 0, duration: 0.8, ease: 'power2.out', stagger: 0.1, delay: 0.5 });
		gsap.to('.sf-guide-open__media img', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.sf-guide-open', start: 'top top', end: 'bottom top', scrub: true } });
	}

	/* ---- the scroll decides which step is showing ---- */
	var track = document.querySelector('.sf-guide-track');
	var clicks = { at: 1 };

	ScrollTrigger.create({
		trigger: track,
		start: 'top top',
		end: 'bottom bottom',
		onUpdate: function (self) {
			show(Math.max(0, Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length))));

			// step 4 counts the clicks up as you scroll through it
			var within = self.progress * STEPS.length - 3;
			if (within >= 0 && within <= 1) {
				clickOut.textContent = Math.max(1, Math.min(6, Math.round(1 + within * 5)));
			}
		}
	});

	/* ---- the number buttons ---- */
	dots.forEach(function (dot) {
		dot.addEventListener('click', function () {
			var span = track.offsetHeight - window.innerHeight;
			var to = track.offsetTop + span * ((+dot.dataset.go - 1) / STEPS.length + 0.04);
			window.scrollTo({ top: to, behavior: calm ? 'auto' : 'smooth' });
		});
	});

	/* ---- film + print ---- */
	ig.querySelectorAll('[data-video]').forEach(function (button) {
		button.addEventListener('click', function () {
			var modal = document.createElement('div');
			modal.className = 'sf-guide-modal';
			modal.innerHTML = '<div class="sf-guide-modal__frame"><button type="button" class="sf-guide-modal__close" aria-label="Close">&times;</button></div>';

			var frame = document.createElement('iframe');
			frame.src = 'https://www.youtube-nocookie.com/embed/' + button.dataset.video + '?autoplay=1&rel=0&modestbranding=1';
			frame.allow = 'autoplay; encrypted-media; picture-in-picture';
			frame.allowFullscreen = true;
			modal.firstChild.appendChild(frame);
			document.body.appendChild(modal);

			function shut() { modal.remove(); document.removeEventListener('keydown', key); }
			function key(event) { if (event.key === 'Escape') { shut(); } }

			modal.querySelector('.sf-guide-modal__close').addEventListener('click', shut);
			modal.addEventListener('click', function (event) { if (event.target === modal) { shut(); } });
			document.addEventListener('keydown', key);
		});
	});

	var print = ig.querySelector('[data-print]');
	if (print) {
		print.addEventListener('click', function () { window.print(); });
	}
})();

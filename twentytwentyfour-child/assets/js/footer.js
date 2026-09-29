/* =============================================================
 * SUPERFLY — FOOTER
 * Three small jobs:
 *   1. the footer settles in the first time it comes on screen
 *   2. the sign-up carries the page across and reports back
 *   3. the light follows the cursor across the word SUPERFLY
 *      (only while the pointer is actually over the word)
 *
 * The word is drawn twice in one <svg> (parts/footer.html): once in
 * near-black and once filled with a radial gradient. Only the
 * gradient's centre moves, so the letters appear to catch a light
 * rather than having a glow laid over them.
 *
 * Looks: assets/css/footer.css
 * ============================================================= */

(function () {
	var foot = document.querySelector('.sf-pf');

	if (!foot) {
		return;
	}

	var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	settle();
	light();
	signup();

	/* ---- 1. it settles in as you reach it ---- */
	function settle() {
		if (calm) {
			return;
		}

		foot.classList.add('is-ready');

		function go() {
			void foot.offsetWidth;
			foot.classList.add('is-in');
		}

		if (!('IntersectionObserver' in window)) {
			go();
			return;
		}

		var watcher = new IntersectionObserver(function (e) {
			if (e[0].isIntersecting) { go(); watcher.disconnect(); }
		}, { threshold: 0.2 });

		watcher.observe(foot);
		setTimeout(go, 6000);          // safety: never leave it hidden
	}

	/* ---- 2. the sign-up ----
	 * Two small things the static template part cannot do for itself:
	 * carry the page you were on into the form, so the redirect brings
	 * you back here, and say what happened once it has.
	 */
	function signup() {
		var form = foot.querySelector('.sf-pf__form');
		var note = foot.querySelector('[data-sf-note]');

		if (form) {
			var from = form.querySelector('[name="sf_from"]');

			if (from) { from.value = window.location.href; }
		}

		if (!note) { return; }

		var said = new URLSearchParams(window.location.search).get('sf-sub');

		var words = {
			ok:   'Thank you — you are on the list. We will be in touch.',
			dupe: 'That address is already on the list.',
			bad:  'That does not look like an email address. Please try again.',
			slow: 'That is a lot of sign-ups from one place. Please try again later.'
		};

		if (!said || !words[said]) { return; }

		note.textContent = words[said];
		note.hidden = false;

		/* take the flag back out of the address bar, so a refresh does not
		   show the message again */
		if (window.history.replaceState) {
			var url = new URL(window.location.href);
			url.searchParams.delete('sf-sub');
			window.history.replaceState({}, '', url.toString() + '');
		}
	}

	/* ---- 3. the light ----
	 * The pointer is converted into the svg's own coordinates and the
	 * gradient's centre eased toward it, so the light trails the cursor
	 * instead of snapping to it. Nothing runs until the pointer is over
	 * the footer, and the loop stops once the light has caught up.
	 */
	function light() {
		var svg  = foot.querySelector('.sf-pf__word');
		var glow = document.getElementById('sfGlow');

		if (!svg || !glow) {
			return;
		}

		if (window.matchMedia('(hover: none)').matches) {
			return;                    // no cursor: the css leaves it softly lit
		}

		/* below 640px the css stands the word on its end with a rotate(),
		   and getBoundingClientRect() then reports the TURNED box — the
		   pointer would map to the wrong place in the letters. The css
		   leaves it softly lit at that width instead. */
		if (window.matchMedia('(max-width: 640px)').matches) {
			return;
		}

		var box   = svg.viewBox.baseVal;            // 0 0 1200 300
		var to    = { x: box.width / 2, y: box.height / 2 };
		var at    = { x: to.x, y: to.y };
		var frame = 0;

		function place() {
			at.x += (to.x - at.x) * 0.14;
			at.y += (to.y - at.y) * 0.14;

			glow.setAttribute('cx', at.x.toFixed(1));
			glow.setAttribute('cy', at.y.toFixed(1));

			if (Math.abs(to.x - at.x) > 0.5 || Math.abs(to.y - at.y) > 0.5) {
				frame = window.requestAnimationFrame(place);
			} else {
				frame = 0;
			}
		}

		foot.addEventListener('pointermove', function (e) {
			var r = svg.getBoundingClientRect();

			/* the light belongs to the word, not to the whole footer: over
			   the sign-up or the link columns there is nothing to light */
			var over = e.clientX >= r.left && e.clientX <= r.right
				&& e.clientY >= r.top && e.clientY <= r.bottom;

			if (!over) {
				foot.classList.remove('is-lit');
				return;
			}

			/* preserveAspectRatio="xMidYMin slice" scales by the LARGER
			   ratio and centres the overflow sideways only, so the scale
			   and the offset are worked out rather than assuming the box
			   maps one to one */
			var scale = Math.max(r.width / box.width, r.height / box.height);
			var offX  = (r.width - box.width * scale) / 2;

			to.x = (e.clientX - r.left - offX) / scale;
			to.y = (e.clientY - r.top) / scale;

			/* coming back onto the word, start where the cursor is rather
			   than sweeping across from wherever it was left */
			if (!foot.classList.contains('is-lit')) {
				at.x = to.x;
				at.y = to.y;
				glow.setAttribute('cx', at.x.toFixed(1));
				glow.setAttribute('cy', at.y.toFixed(1));
				foot.classList.add('is-lit');
			}

			if (!frame) { frame = window.requestAnimationFrame(place); }
		});

		foot.addEventListener('pointerleave', function () {
			foot.classList.remove('is-lit');
		});
	}
})();

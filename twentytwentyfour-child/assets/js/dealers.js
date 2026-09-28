/* =============================================================
 * SUPERFLY — DEALERS & DISTRIBUTORS (movement)
 * -------------------------------------------------------------
 * Looks: assets/css/dealers.css.
 *
 *   1. Torch            the line drawings behind the section only show
 *                       inside a soft circle that follows the mouse —
 *                       nothing is drawn until someone points at it
 *   2. Pick a country   point at (or tab to, or tap) a country and it
 *                       lifts, with its number in pink
 *   3. On its own       until someone points at the list, it walks
 *                       through the countries by itself, so the
 *                       section is never still
 *   4. Scroll-in        the heading and the lines rise in the first
 *                       time the section comes on screen
 *
 * Without this file the section still reads fine — it just stays dark
 * and nothing lights up.
 * ============================================================= */

(function () {
	var section = document.querySelector('.sf-dealers');

	if (!section) {
		return;
	}

	var rows = section.querySelectorAll('.sf-dealers__row');
	var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	var STEP = 5000;      // ms each country is shown while it runs by itself
	var at = 0;
	var timer = null;
	var touched = false;  // someone has pointed at the list: stop walking

	pick(0);
	torch();
	listen();
	riseIn();
	watch();


	/* 1. The torch: the drawings only show around the mouse */
	function torch() {
		var art = section.querySelector('.sf-dealers__art');

		if (!art || calm || !window.matchMedia('(hover: hover)').matches) {
			return;   // phones and tablets: no mouse, so leave it dark
		}

		var waiting = false;
		var point = { x: 0, y: 0 };

		section.addEventListener('mousemove', function (event) {
			var box = section.getBoundingClientRect();
			point.x = event.clientX - box.left;
			point.y = event.clientY - box.top;

			if (!waiting) {                       // at most one move per frame
				waiting = true;
				requestAnimationFrame(function () {
					waiting = false;
					section.style.setProperty('--sf-dealers-x', point.x + 'px');
					section.style.setProperty('--sf-dealers-y', point.y + 'px');
				});
			}

			section.classList.add('is-lit');
		});

		section.addEventListener('mouseleave', function () {
			section.classList.remove('is-lit');
		});
	}


	/* 2. Mark one country */
	function pick(index) {
		at = (index + rows.length) % rows.length;

		rows.forEach(function (row, i) {
			row.classList.toggle('is-on', i === at);
		});

	}


	/* Pointing, tabbing or tapping picks a country (and stops the walk) */
	function listen() {
		rows.forEach(function (row, i) {
			row.addEventListener('mouseenter', function () { touched = true; stop(); pick(i); });
			row.addEventListener('focus', function () { touched = true; stop(); pick(i); });
			row.addEventListener('click', function () { touched = true; stop(); pick(i); });
		});

		section.addEventListener('mouseleave', function () {
			if (!touched) {
				start();
			}
		});
	}


	/* 2. Walk through them by itself, only while the section is on screen */
	function start() {
		if (calm || touched || timer) {
			return;
		}

		timer = setInterval(function () { pick(at + 1); }, STEP);
	}

	function stop() {
		clearInterval(timer);
		timer = null;
	}

	function watch() {
		if (!('IntersectionObserver' in window)) {
			start();
			return;
		}

		new IntersectionObserver(function (entries) {
			if (entries[0].isIntersecting) {
				start();
			} else {
				stop();
			}
		}, { threshold: 0.3 }).observe(section);
	}


	/* 3. The heading and the lines rise in, once */
	function riseIn() {
		if (calm) {
			return;
		}

		section.classList.add('is-ready');

		function go() {
			void section.offsetWidth;               // make sure the "lower, hidden" start is in place
			section.classList.add('is-in');
		}

		if (!('IntersectionObserver' in window)) {
			go();
			return;
		}

		var watcher = new IntersectionObserver(function (entries) {
			if (entries[0].isIntersecting) {
				go();
				watcher.disconnect();
			}
		}, { threshold: 0.25 });

		watcher.observe(section);
		setTimeout(go, 6000);                        // safety: never leave it hidden
	}
})();

/* =============================================================
 * SUPERFLY — SHOP BY BIKE (movement)
 * -------------------------------------------------------------
 * Looks: assets/css/shop-by-bike.css. Layout: Pages → Shop by Bike.
 *
 *   1. Tuck under the navbar   the dark section slides up behind the
 *                              floating navbar (its real height is
 *                              measured, as it changes with the screen
 *                              size and the WordPress admin bar)
 *   2. Tiles rise in           the heading and the brand tiles rise in
 *                              one after another, once the loading box
 *                              (preloader.js) has gone
 * ============================================================= */

(function () {
	var section = document.querySelector('.sf-bikes');

	if (!section) {
		return;
	}

	tuckUnderHeader(section);
	riseIn(section);


	/* 1. Tuck under the navbar — result goes into --sf-bikes-under */
	function tuckUnderHeader(el) {
		var page = el.closest('.wp-site-blocks');   // the header is the first thing inside this

		if (!page) {
			return;
		}

		function measure() {
			var style = getComputedStyle(el);
			var under = parseFloat(style.getPropertyValue('--sf-bikes-under')) || 0;
			var slidUp = parseFloat(style.marginTop) || 0;   // the margin really applied (negative when slid up)
			// where the section would start without sliding up, minus the top of the page
			var gap = el.getBoundingClientRect().top - slidUp - page.getBoundingClientRect().top;

			if (Math.abs(gap - under) > 1) {
				el.style.setProperty('--sf-bikes-under', Math.round(gap) + 'px');
			}
		}

		measure();
		window.addEventListener('load', measure);   // after the logo image has loaded
		window.addEventListener('resize', measure);
	}


	/* 2. Tiles rise in, after the loading box */
	function riseIn(el) {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return;   // everything simply shows
		}

		el.classList.add('is-ready');   // hidden, a little lower

		function go() {
			void el.offsetWidth;   // make sure the "lower, hidden" start is in place, so they glide up
			el.classList.add('is-in');
		}

		if (window.sfPreloaderDone || !document.querySelector('.sf-lights')) {
			go();
		} else {
			document.addEventListener('sf:preloader-done', go, { once: true });
		}

		setTimeout(go, 5000);   // safety: never leave the tiles hidden
	}
})();

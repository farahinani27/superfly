/* =============================================================
 * SUPERFLY — HOME HERO (interactions)
 * -------------------------------------------------------------
 * Looks: assets/css/hero.css. This file only moves things.
 *
 *   1. Loading screen     waits for the site-wide start lights
 *                         (preloader.js) to go out
 *   2. Entrance           RIDE. / RACE. / RESEARCH. race in from the
 *                         left; the text and highlights follow
 *   3. Collage parallax   the photo wall leans away from the mouse
 *   4. Highlights strip   on phones the 3 highlights scroll sideways;
 *                         this copies them once so the loop is seamless
 *   5. Tuck under navbar  measures the real navbar height so the
 *                         photos reach right up behind the glass bar
 *
 * Uses GSAP (already loaded on Superfly). Without GSAP, or with
 * "reduce motion" switched on, everything simply shows at once.
 * ============================================================= */

document.addEventListener('DOMContentLoaded', function () {
	var hero = document.querySelector('.sf-hero');

	if (!hero) {
		return; // not the home page
	}

	tuckUnderHeader(hero);

	var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof window.gsap === 'undefined';

	waitForLoadingScreen(function () {
		playEntrance(hero, calm);
	});

	if (!calm) {
		collageParallax(hero);
	}

	copyHighlights(hero);
});


/* -------------------------------------------------------------
 * 1. WAIT FOR THE LOADING SCREEN
 * The start lights now run on every page (assets/js/preloader.js);
 * on the first home visit the home intro (home-intro.js) runs instead.
 * The hero waits until they go out, then starts its entrance. If
 * there's no loading screen, it starts straight away.
 * ------------------------------------------------------------- */
function waitForLoadingScreen(done) {
	// the start lights or, on a first visit, the home intro (home-intro.js)
	if (window.sfPreloaderDone || !document.querySelector('.sf-lights, .sf-intro')) {
		done();
		return;
	}

	document.addEventListener('sf:preloader-done', done, { once: true });
}


/* -------------------------------------------------------------
 * 2. ENTRANCE
 * ------------------------------------------------------------- */
function playEntrance(hero, calm) {
	if (calm) {
		return;
	}

	gsap.timeline({ defaults: { ease: 'power4.out' } })
		.from(hero.querySelector('.sf-hero__collage'), { scale: 1.2, opacity: 0, duration: 1.6 }, 0)
		.from(hero.querySelector('.sf-hero__eyebrow'), { x: -40, opacity: 0, duration: 0.7 }, 0.1)
		// each word shoots in from the left, fast, one after another
		.from(hero.querySelectorAll('.sf-hero__word'), { xPercent: -60, opacity: 0, duration: 0.9, stagger: 0.12 }, 0.15)
		.from(hero.querySelectorAll('.sf-hero__text, .sf-hero__buttons'), { y: 24, opacity: 0, duration: 0.8, stagger: 0.1 }, 0.5)
		.from(hero.querySelectorAll('.sf-hero__highlights li, .sf-hero__scroll'), { y: 20, opacity: 0, duration: 0.7, stagger: 0.08 }, 0.8);
}


/* -------------------------------------------------------------
 * 3. COLLAGE PARALLAX — the photo wall shifts a little away
 *    from the mouse, for depth
 * ------------------------------------------------------------- */
function collageParallax(hero) {
	var collage = hero.querySelector('.sf-hero__collage');

	if (!collage) {
		return;
	}

	var moveX = gsap.quickTo(collage, 'x', { duration: 1.2, ease: 'power3.out' });
	var moveY = gsap.quickTo(collage, 'y', { duration: 1.2, ease: 'power3.out' });

	hero.addEventListener('mousemove', function (event) {
		var box = hero.getBoundingClientRect();
		moveX(((event.clientX - box.left) / box.width - 0.5) * -30);
		moveY(((event.clientY - box.top) / box.height - 0.5) * -20);
	});
}


/* -------------------------------------------------------------
 * 4. HIGHLIGHTS STRIP (phones)
 * The strip moves left by half its length, then starts again —
 * so it needs the 3 highlights twice. The copies are marked
 * `sf-hero__highlight-copy`: hidden on bigger screens (CSS) and
 * from screen readers (aria-hidden), so nothing is read twice.
 * ------------------------------------------------------------- */
function copyHighlights(hero) {
	var list = hero.querySelector('.sf-hero__highlights');

	if (!list) {
		return;
	}

	Array.prototype.slice.call(list.children).forEach(function (item) {
		var copy = item.cloneNode(true);
		copy.classList.add('sf-hero__highlight-copy');
		copy.setAttribute('aria-hidden', 'true');
		list.appendChild(copy);
	});
}


/* -------------------------------------------------------------
 * 5. TUCK UNDER THE NAVBAR
 * The hero slides up behind the floating navbar. The navbar's
 * height changes with the logo, screen size and WordPress admin
 * bar, so measure the real gap once the page has loaded (and on
 * resize) instead of guessing. Result goes into --sf-hero-under,
 * which hero.css uses for the hero's top margin and padding.
 * ------------------------------------------------------------- */
function tuckUnderHeader(hero) {
	var page = hero.closest('.wp-site-blocks'); // the header is the first thing inside this

	if (!page) {
		return;
	}

	function measure() {
		var style = getComputedStyle(hero);
		var under = parseFloat(style.getPropertyValue('--sf-hero-under')) || 0;
		var slidUp = parseFloat(style.marginTop) || 0; // the margin really applied (negative when slid up)
		// where the hero would start without sliding up, minus the top of the page
		var gap = hero.getBoundingClientRect().top - slidUp - page.getBoundingClientRect().top;

		if (Math.abs(gap - under) > 1) {
			hero.style.setProperty('--sf-hero-under', Math.round(gap) + 'px');
		}
	}

	measure();
	window.addEventListener('load', measure);   // after the logo image has loaded
	window.addEventListener('resize', measure);
}

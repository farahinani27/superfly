/* =============================================================
 * SUPERFLY — LOADING SCREEN + PAGE CHANGE (movement)
 * -------------------------------------------------------------
 * Looks: assets/css/preloader.css. The box is already covering the
 * page when this runs (functions.php puts it at the top of every
 * page).
 *
 *   1. Page ready      as soon as the page's layout is there (not
 *                      waiting for every picture to download) the panel
 *                      leaves: on Home the bike rides across and takes
 *                      it with it; everywhere else it simply fades
 *   2. (same function) the slide off
 *   3. Tell the page   fires the "sf:preloader-done" event, so the
 *                      home hero knows when to start its entrance
 *   4. Page change     click a link in the navbar: the bike rides
 *                      across pulling the box over the page (the
 *                      middle bands first, with the bike at the tip)
 *                      and is gone off the right edge; that page's
 *                      name comes up as the box lands, and the browser
 *                      opens the new page straight away — which starts
 *                      with the very same box, so it looks like one
 *                      smooth move: pull, then overlap
 *
 * No loading bar and no waiting on purpose: the box only stays as long
 * as the browser needs to open the page.
 * Uses GSAP if it's there; otherwise the box just fades / the new
 * page opens straight away. Only transforms and opacity move, so
 * nothing has to be redrawn — that's what keeps it smooth.
 * ============================================================= */

(function () {
	var cover = document.querySelector('.sf-lights');

	window.sfPreloaderDone = false;

	if (!cover) {
		// No loading screen on this page — unless the home intro took its
		// place (home-intro.js), in which case it announces the finish itself
		if (!window.sfIntroActive) {
			markDone();
		}
		return;
	}

	var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var bands = cover.querySelectorAll('.sf-lights__band');
	var label = cover.querySelector('.sf-lights__label');
	var rider = cover.querySelector('.sf-lights__rider');
	var labelText = cover.querySelector('.sf-lights__label-text');

	// "is-arriving" = we got here through a page change (set by the small
	// script under the box in functions.php). Then the box leaves at once;
	// opening a page straight away shows it a moment, so it doesn't flash.
	var arriving = cover.classList.contains('is-arriving');

	// Every page but Home: the panel is carbon and nothing else. It fades
	// rather than sliding off in bands, and no bike rides anywhere.
	var plain = cover.classList.contains('sf-lights--plain');
	var MIN_TIME = arriving ? 0 : 400;   // ms since the page started — shortest the box shows

	// The bands' slide: which ones go first, and how
	var SLIDE   = { duration: 0.8, ease: 'power3.inOut' };   // the box sliding off (2)
	var STAGGER = { each: 0.06, from: 'center' };   // middle first → an arrow shape, the bike at its tip

	var finished = false;
	var leaving = false;
	var exit = null;        // the slide off (2), while it runs

	pageChange();

	if (calm) {
		// "Reduce motion": the CSS hides the box — no animations at all
		park();
		markDone();
		return;
	}

	if (cover.classList.contains('is-parked')) {
		// The home intro is doing the loading part on this page
		// (home-intro.js); the box only waits for a page change
		return;
	}

	// 1. The page's layout is there (this fires once the other scripts,
	//    GSAP too, have run) → slide the box off
	document.addEventListener('DOMContentLoaded', function () {
		setTimeout(finish, Math.max(0, MIN_TIME - performance.now()));
	});

	// safety: in case that moment was missed
	setTimeout(finish, 4000);


	/* 1 + 2. Page ready: the name goes, the bands slide off to the right */
	function finish() {
		if (finished) {
			return;
		}
		finished = true;
		markDone();   // the page underneath starts arriving as the box leaves

		if (plain) {
			// carbon only: the panel just clears
			cover.style.transition = 'opacity 0.45s ease';
			cover.style.opacity = '0';
			setTimeout(park, 480);
			return;
		}

		if (!window.gsap) {
			cover.style.transition = 'opacity 0.3s ease';
			cover.style.opacity = '0';
			setTimeout(park, 320);
			return;
		}

		// safety: animations pause while the tab is in the background — if the
		// slide hasn't finished by then, put everything straight in place
		setTimeout(function () {
			if (!leaving && !cover.classList.contains('is-parked')) {
				exit.kill();
				park();
			}
		}, 3500);

		// Home: the bike rides in from the left, crosses the screen and takes
		// the panel with it. This used to happen on the page you were LEAVING,
		// which put the bike on pages that should only show carbon; as an
		// entrance it belongs to Home alone.
		var ride = window.innerWidth + rider.offsetWidth * 1.15;

		gsap.set(rider, { x: -ride, y: 0, yPercent: -58 });   // (yPercent: the bike's own lift, from the CSS)
		cover.classList.add('is-pulling');                    // the CSS only shows the bike while this is on

		exit = gsap.timeline({ onComplete: park })
			.to(label, { autoAlpha: 0, y: -16, duration: 0.3, ease: 'power2.in' }, 0)
			// the bike leads; the bands start away behind it, middle ones first
			.to(rider, { x: 0, duration: 1.1, ease: 'sine.inOut' }, 0)
			.to(bands, { xPercent: 101, duration: SLIDE.duration, ease: SLIDE.ease, stagger: STAGGER }, 0.42)
			.call(function () { cover.classList.remove('is-pulling'); });
	}


	/* 3. Tell the page the box is going */
	function markDone() {
		window.sfPreloaderDone = true;
		document.dispatchEvent(new CustomEvent('sf:preloader-done'));
	}


	/* Put the box away, hidden, ready for the next page change */
	function park() {
		cover.classList.remove('is-arriving', 'is-leaving', 'is-pulling');
		cover.classList.add('is-parked');
		cover.style.removeProperty('opacity');
		cover.style.removeProperty('transition');

		if (window.gsap) {
			// only what GSAP moved — the box's own style holds the bike picture
			gsap.set([bands, label, rider], { clearProps: 'transform,opacity,visibility' });
		}

		// the box was over the page: let ScrollTrigger measure again
		if (window.ScrollTrigger) {
			ScrollTrigger.refresh();
		}
	}


	/* -------------------------------------------------------------
	 * 4. PAGE CHANGE — links in the navbar
	 * ------------------------------------------------------------- */
	function pageChange() {
		// No pull on any page. The bike used to ride across the page you were
		// LEAVING whenever the next one was Home — which put the animation on
		// pages that should only ever show the carbon panel. Now the browser
		// just opens the link, and Home plays the bike on arrival.

		// Coming back with the browser's Back button can show this page
		// straight from memory — exactly as it was, box and all. Put it away.
		window.addEventListener('pageshow', function (event) {
			if (event.persisted && leaving) {
				leaving = false;
				park();
			}
		});
	}




})();

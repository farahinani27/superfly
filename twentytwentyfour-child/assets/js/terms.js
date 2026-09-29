/* =============================================================
 * SUPERFLY — TERMS & CONDITIONS
 * Looks: assets/css/terms.css
 *
 * The clause rows rise into place as they are scrolled to, the way
 * zeynapp.co.uk/what-we-do does it — the page this layout follows.
 *
 * FAIL-SAFE BY DESIGN, and this is the whole reason the reveal is
 * driven from here rather than written straight into the CSS.
 * The rows are VISIBLE by default. This script adds the
 * `is-revealing` class that hides them, and only after it has
 * checked that it can reveal them again. So if the script fails to
 * load, is blocked, or throws before that line, the page shows all
 * nine clauses exactly as it does today.
 *
 * That matters more here than on a marketing page: this is binding
 * legal text. A reveal animation that silently swallowed a clause
 * would be a contract term the customer never saw.
 *
 * Three ways out, all of which leave the text visible:
 *   - no IntersectionObserver (old browser)
 *   - prefers-reduced-motion
 *   - no rows found
 * ============================================================= */

(function () {
	var rows = document.querySelectorAll('.superfly-terms-clause');
	var grid = document.querySelector('.superfly-terms-grid');

	if (!grid || !rows.length) { return; }

	/* Old browsers: leave the page alone rather than hide text we then
	   have no way of bringing back. */
	if (!('IntersectionObserver' in window)) { return; }

	/* Someone who has asked their system for less motion gets the page
	   with no animation at all — not a faster one. Checked here rather
	   than only in the CSS so the class is never added in the first
	   place, which also skips the observer. */
	var still = window.matchMedia('(prefers-reduced-motion: reduce)');
	if (still.matches) { return; }

	/* From here the rows are hidden, so everything below must be able to
	   put them back. */
	grid.classList.add('is-revealing');

	/* Set by the observer's first callback. The safety net below keys off
	   THIS, not off how many rows have been revealed: on a tall masthead no
	   row is on screen at load, which is the normal case, and a net that
	   fired on "nothing revealed yet" would strip the animation off the page
	   a second and a half after every load. */
	var observerRan = false;

	var seen = new IntersectionObserver(function (entries) {
		observerRan = true;

		entries.forEach(function (entry) {
			if (!entry.isIntersecting) { return; }

			entry.target.classList.add('is-in');

			/* one-way: a row that has arrived stays arrived, so scrolling
			   back up does not replay the page */
			seen.unobserve(entry.target);
		});
	}, {
		/* -12% on the bottom edge: the row starts moving a little before
		   it reaches the fold, so it is settled by the time it is read,
		   rather than animating under the reader's eyes.
		   0% on the top edge, or a row scrolled to from a link lower down
		   the page would never trigger. */
		rootMargin: '0px 0px -12% 0px',
		threshold: 0
	});

	[].forEach.call(rows, function (row) { seen.observe(row); });

	/* A row already on screen at load is handled by the observer's first
	   callback, which fires on its own. No separate pass is needed.

	   The safety net: if the observer has not run AT ALL a second and a half
	   in, something is wrong with it and the rows would stay hidden. Drop the
	   class and show the lot. Cheap, and it means the binding text cannot end
	   up invisible because of a change made here later.

	   Deliberately not "nothing is revealed yet" — that is the normal state
	   of a freshly loaded page whose first clause sits below the masthead. */
	window.setTimeout(function () {
		if (!observerRan) {
			grid.classList.remove('is-revealing');
		}
	}, 1500);
})();

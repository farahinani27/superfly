/* =============================================================
 * SUPERFLY — PRIVACY POLICY
 * Looks: assets/css/privacy.css
 * ============================================================= */

/* The cards open and close on their own - they are <details>. This only
   adds the one thing markup cannot do: open or close all of them at once,
   with the button saying which it will do next. */
(function () {
	var button = document.querySelector('[data-pp-all]');
	var cards  = document.querySelectorAll('.pp-card');

	if (!button || !cards.length) { return; }

	function sync() {
		var shut = [].filter.call(cards, function (c) { return !c.open; }).length;

		button.textContent = shut ? 'Expand all' : 'Collapse all';
	}

	button.addEventListener('click', function () {
		var open = [].some.call(cards, function (c) { return !c.open; });

		[].forEach.call(cards, function (c) { c.open = open; });
		sync();
	});

	[].forEach.call(cards, function (c) { c.addEventListener('toggle', sync); });
	sync();
})();

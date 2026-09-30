/* =============================================================
 * SUPERFLY — CART DRAWER
 *
 * Opening, closing, and the three things that change a cart:
 * the + and - steppers, the quantity field, and the bin.
 *
 * This file draws NOTHING. Every change posts to the theme's own
 * route and gets back the drawer's markup, rendered by the same
 * PHP that printed it into the page in the first place
 * (superfly_cart_drawer_html in functions.php). One renderer, so
 * a row cannot look one way on load and another way after a tap.
 *
 *   GET   superfly/v1/cart-drawer          → { html, count }
 *   POST  superfly/v1/cart-drawer/item     → { html, count }
 *         { key: "<cart item key>", quantity: <n> }   0 removes
 *
 * The drawer also re-reads itself every time it opens, because
 * the page it is sitting in may have come out of a cache with a
 * stale cart in it.
 *
 * Looks: assets/css/cart-drawer.css
 * ============================================================= */

(function () {
	var root = document.querySelector('.sf-cart');

	if (!root || typeof superflyCart === 'undefined') {
		return;                       // drawer not printed, or config missing
	}

	var drawer = root.querySelector('.sf-cart__drawer');
	var body   = root.querySelector('.sf-cart__body');
	var opener = null;                // what to hand focus back to on close

	/* ---- talking to the route ---------------------------------- */

	function request(path, payload) {
		var options = {
			credentials: 'same-origin',
			headers: { 'X-WP-Nonce': superflyCart.nonce }
		};

		if (payload) {
			options.method = 'POST';
			options.headers['Content-Type'] = 'application/json';
			options.body = JSON.stringify(payload);
		}

		return fetch(superflyCart.rest + path, options).then(function (response) {
			if (!response.ok) {
				throw new Error('cart-drawer: ' + response.status);
			}

			return response.json();
		});
	}

	function paint(data) {
		if (data && typeof data.html === 'string') {
			body.innerHTML = data.html;
		}

		if (data && typeof data.count !== 'undefined') {
			setCount(data.count);
		}
	}

	/* every cart button on the page, not just the navbar one */
	function setCount(count) {
		var label = root.dataset.itemsLabel || 'items';

		document.querySelectorAll('.sf-cart-btn__count').forEach(function (bubble) {
			bubble.textContent = count > 0 ? count : '';
			bubble.hidden = count < 1;
		});

		var heading = root.querySelector('.sf-cart__count');

		if (heading) {
			heading.textContent = count;
		}

		root.querySelectorAll('.sf-cart-btn').forEach(function (button) {
			button.setAttribute('aria-label', count + ' ' + label + ' in cart');
		});
	}

	function refresh() {
		return request('cart-drawer').then(paint).catch(function () {
			/* leave whatever is on screen: a failed refresh must not
			   blank a cart the customer can still check out with */
		});
	}

	/* ---- open / close ------------------------------------------ */

	function open(from) {
		opener = from || null;
		root.classList.add('is-open');
		document.body.classList.add('sf-cart-open');
		document.body.style.overflow = 'hidden';

		/* Focus the dialog, not the close button. Screen readers still
		   announce the drawer and Esc still closes it, but no control
		   is left wearing a focus ring the moment it opens — which is
		   what the × was doing. A keyboard user tabbing in from here
		   gets the real rings back, in order. */
		drawer.focus();

		refresh();
	}

	function close() {
		root.classList.remove('is-open');
		document.body.classList.remove('sf-cart-open');
		document.body.style.overflow = '';

		if (opener && document.contains(opener)) {
			opener.focus();
		}

		opener = null;
	}

	function isOpen() {
		return root.classList.contains('is-open');
	}

	/* ---- changing the cart -------------------------------------- */

	var busy = false;

	function change(key, quantity) {
		if (busy || !key) {
			return;
		}

		busy = true;
		root.classList.add('is-busy');

		request('cart-drawer/item', { key: key, quantity: quantity })
			.then(paint)
			.catch(function () {
				return refresh();     // put the real cart back on screen
			})
			.finally(function () {
				busy = false;
				root.classList.remove('is-busy');
			});
	}

	/* ---- wiring -------------------------------------------------- */

	document.addEventListener('click', function (e) {
		var button = e.target.closest('.sf-cart-btn');

		if (button) {
			e.preventDefault();
			open(button);
			return;
		}

		if (!root.contains(e.target)) {
			return;
		}

		if (e.target.closest('.sf-cart__close, .sf-cart__overlay')) {
			e.preventDefault();
			close();
			return;
		}

		var step = e.target.closest('[data-step]');

		if (step) {
			e.preventDefault();

			var field = step.parentNode.querySelector('input');
			var next  = (parseInt(field.value, 10) || 1) + parseInt(step.dataset.step, 10);

			change(field.dataset.key, Math.max(1, next));
			return;
		}

		var bin = e.target.closest('[data-remove]');

		if (bin) {
			e.preventDefault();
			change(bin.dataset.key, 0);
		}
	});

	/* typing in the quantity field — on change, not on every keystroke */
	root.addEventListener('change', function (e) {
		if (!e.target.matches('.sf-cart__qty input')) {
			return;
		}

		change(e.target.dataset.key, Math.max(1, parseInt(e.target.value, 10) || 1));
	});

	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && isOpen()) {
			close();
		}
	});

	/* Something else added to the cart: the block add-to-cart fires its
	   own event, ShopEngine and classic AJAX buttons fire jQuery's. Both
	   only refresh the count here — the drawer opening itself over a
	   product page the customer is still reading is not wanted. */
	document.body.addEventListener('wc-blocks_added_to_cart', refresh);

	if (window.jQuery) {
		window.jQuery(document.body).on('added_to_cart removed_from_cart', refresh);
	}

	/* First fill. The page itself carries no cart — see the note in
	   functions.php about caches — so the count and the contents both
	   arrive from here, a moment after the page does. */
	refresh();
})();

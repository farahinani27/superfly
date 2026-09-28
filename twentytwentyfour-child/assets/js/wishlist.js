/* =============================================================
 * SUPERFLY — WISHLIST, REMOVING A PRODUCT
 *
 * ShopEngine's own remove button hides `closest('tr')`, which only
 * works inside its table. The grid has no table, so removal is
 * handled here — against the plugin's own REST route, so the saved
 * list stays the plugin's and nothing here has to know how it is
 * stored.
 *
 * That route TOGGLES: posting a product id that is in the list
 * removes it, posting one that is not puts it back. The buttons
 * therefore carry their own class and never ShopEngine's, or the
 * plugin's handler would fire on the same click and add the
 * product straight back.
 *
 * Looks: assets/css/wishlist.css
 * ============================================================= */

(function () {
	var grid = document.querySelector('.wl-grid');

	if (!grid || typeof shopEngineWishlist === 'undefined') {
		return;                       // not the wishlist, or the plugin is off
	}

	var url = shopEngineWishlist.resturl + 'shopengine-builder/v1/wishlist/add_to_list/';

	grid.addEventListener('click', function (e) {
		var button = e.target.closest('.wl-x');

		if (!button) {
			return;
		}

		e.preventDefault();

		var item = button.closest('.wl-item');
		var id   = button.dataset.pid;

		if (!item || !id || button.disabled) {
			return;
		}

		button.disabled = true;

		fetch(url, {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': shopEngineWishlist.rest_nonce
			},
			body: JSON.stringify({ product_id: id })
		})
			.then(function (r) { return r.json(); })
			.then(function (data) {
				if (!data || data.status !== 'success') {
					throw new Error('refused');
				}

				item.classList.add('is-going');

				/* A page holds six. Once one goes the rest shuffle up, so
				   the page is reloaded rather than patched — that also
				   keeps the count and the pager honest. */
				window.setTimeout(function () { window.location.reload(); }, 260);
			})
			.catch(function () {
				button.disabled = false;
				window.alert('Could not remove that just now. Please try again.');
			});
	});
})();

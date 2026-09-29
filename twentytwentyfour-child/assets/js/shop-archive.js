/* =============================================================
 * SUPERFLY — PRODUCT ARCHIVE: the Filters fold
 *
 * The only script on the archive. It folds the filter panel away
 * behind the "Filters" button in the bar, which is what the
 * layout in revamp/category-b.html does.
 *
 * WHY NOT WOOCOMMERCE'S OWN DRAWER: the product-filters block
 * ships an "open overlay" button and an overlay, but the plugin's
 * CSS hides that button at desktop and renders the overlay inline
 * instead. Un-hiding it would fire the plugin's own overlay on
 * top of this layout. So the button in the bar is ours (it is a
 * wp:html block in templates/archive-product.html) and it drives
 * this fold.
 *
 * THE PANEL STARTS OPEN IN THE MARKUP and is closed HERE, on
 * load. With scripts blocked the filters are simply visible and
 * usable, rather than shut behind a button that cannot work.
 *
 * Looks: assets/css/shop-archive.css
 * Enqueue: functions.php — superfly_shop_archive_assets()
 * ============================================================= */
( function () {
	'use strict';

	function ready( fn ) {
		if ( document.readyState !== 'loading' ) {
			fn();
		} else {
			document.addEventListener( 'DOMContentLoaded', fn );
		}
	}

	ready( function () {
		var toggle = document.querySelector( '.sf-shop__filters-toggle' );
		var panel  = document.querySelector( '.sf-shop__filters' );

		if ( ! toggle || ! panel ) {
			return;
		}

		// the panel has no id in the template's group block, so give it
		// the one the button's aria-controls already points at
		if ( ! panel.id ) {
			panel.id = 'sf-shop-filters';
		}

		function set( open ) {
			toggle.setAttribute( 'aria-expanded', String( open ) );
			toggle.querySelector( 'i' ).textContent = open ? '×' : '+';
			panel.hidden = ! open;
		}

		// A filter that is already applied must not be hidden — someone
		// arriving on a filtered URL has to be able to see and undo it.
		// WooCommerce puts its filters in the query string, so that is
		// what decides the starting state.
		var filtered = /[?&](filter_|min_price|max_price|rating_filter|stock_status)/.test(
			window.location.search
		);

		set( filtered );

		toggle.addEventListener( 'click', function () {
			set( toggle.getAttribute( 'aria-expanded' ) !== 'true' );
		} );
	} );
}() );

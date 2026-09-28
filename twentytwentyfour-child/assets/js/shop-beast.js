/* =============================================================
 * SUPERFLY — FITMENT ROWS
 * WooCommerce offers variations as a <select>. A rider picking a
 * rim wants to see what each fitment costs before choosing, so
 * this draws the same options as a stack of rows with prices.
 *
 * The <select> stays in the form, hidden from sight but not from
 * WooCommerce: every row click sets it and fires the change event
 * the plugin listens for, so add-to-cart, stock and price all
 * behave exactly as they do without this file.
 *
 * Looks: assets/css/shop-beast.css
 * ============================================================= */

(function () {
	var form = document.querySelector('form.variations_form');

	if (!form || typeof window.jQuery === 'undefined') {
		return;                       // simple product, or WooCommerce not loaded
	}

	var $ = window.jQuery;
	var data = form.dataset.product_variations ? JSON.parse(form.dataset.product_variations) : null;

	/* WooCommerce hands prices over as HTML — "&#82;&#77;448.00" is RM448.00.
	   Let the browser decode it rather than printing the entities. */
	function plainText(html) {
		var box = document.createElement('div');
		box.innerHTML = html || '';
		return (box.textContent || '').replace(/\s+/g, ' ').trim();
	}

	form.querySelectorAll('.variations select').forEach(function (select) {
		build(select);
	});

	/* the price for one option, read from WooCommerce's own variation data */
	function priceFor(name, value) {
		if (!data) {
			return '';
		}

		var found = data.find(function (v) {
			var picked = v.attributes['attribute_' + name];
			return picked === value || picked === '';
		});

		return found ? found.price_html : '';
	}

	function inStock(name, value) {
		if (!data) {
			return true;
		}

		var found = data.find(function (v) {
			return v.attributes['attribute_' + name] === value;
		});

		return found ? found.is_in_stock : true;
	}

	function build(select) {
		var name = select.getAttribute('name').replace('attribute_', '');
		var rows = document.createElement('div');
		rows.className = 'sb-rows';

		Array.prototype.forEach.call(select.options, function (option) {
			if (!option.value) {
				return;               // "Choose an option"
			}

			var row = document.createElement('button');
			var out = !inStock(name, option.value);

			row.type = 'button';
			row.className = 'sb-row' + (out ? ' is-out' : '');
			row.innerHTML = '<span>' + option.textContent + '</span><b>'
				+ (out ? 'Out of stock' : plainText(priceFor(name, option.value))) + '</b>';

			row.addEventListener('click', function () {
				if (out) {
					return;
				}

				rows.querySelectorAll('.sb-row').forEach(function (r) { r.classList.remove('is-on'); });
				row.classList.add('is-on');

				// hand it back to WooCommerce exactly as the dropdown would
				select.value = option.value;
				$(select).trigger('change');
			});

			rows.appendChild(row);
		});

		// the whole table goes out of sight — its label and reset link would
		// otherwise sit under the rows saying the same thing twice. The
		// <select> inside it still belongs to the form, so the cart works.
		var table = select.closest('.variations');
		if (table) {
			table.classList.add('sb-hidden');
		}

		var label = document.createElement('p');
		label.className = 'sb-label';
		label.textContent = 'Select ' + (select.dataset.attribute_name || name).replace(/^attribute_|_/g, ' ').trim();

		var anchor = form.querySelector('.variations');
		anchor.parentNode.insertBefore(label, anchor);
		anchor.parentNode.insertBefore(rows, anchor);

		// start on the first one that can actually be bought
		var first = rows.querySelector('.sb-row:not(.is-out)');
		if (first) {
			first.click();
		}
	}

	/* the price belongs on the button, like the reference site */
	var button = form.querySelector('.single_add_to_cart_button');
	var plain = button ? button.textContent.trim() : '';

	$(form).on('show_variation', function (event, variation) {
		if (!button) {
			return;
		}

		var price = plainText(variation.price_html);

		button.textContent = price ? plain + ' — ' + price : plain;
	});

	$(form).on('hide_variation', function () {
		if (button) {
			button.textContent = plain;
		}
	});
})();

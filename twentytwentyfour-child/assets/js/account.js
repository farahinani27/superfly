/* =============================================================
 * SUPERFLY — ACCOUNT DETAILS
 * WooCommerce's edit-account form, given the layout from the
 * reference: placeholders in the fields, the password fields
 * folded into a "Password & security" card, and Reset beside
 * Save on a full-width row.
 *
 * Nothing here replaces WooCommerce's form. The fields, their
 * names, the nonce and the hidden action input are the plugin's
 * own — this only rearranges and labels them, so saving keeps
 * working and a WooCommerce update cannot break the page.
 *
 * Looks: assets/css/account.css
 * ============================================================= */

(function () {
	var form = document.querySelector('.woocommerce-EditAccountForm');

	if (!form) {
		return;                       // not the account details page
	}

	/* ---- 1. placeholders (WooCommerce ships none) ---- */
	var hints = {
		account_first_name: 'Your first name',
		account_last_name: 'Your last name',
		account_display_name: 'How your name appears',
		account_email: 'you@example.com',
		password_current: 'Current password',
		password_1: 'New password',
		password_2: 'Repeat the new password'
	};

	Object.keys(hints).forEach(function (id) {
		var field = form.querySelector('#' + id);

		if (field && !field.placeholder) {
			field.placeholder = hints[id];
		}
	});

	/* ---- 2. a shorter line under the display name ---- */
	var help = form.querySelector('#account_display_name_description em');

	if (help) {
		help.textContent = 'Shown on your account and in reviews.';
	}

	/* ---- 3. the password fields become a card that folds open ---- */
	var fieldset = form.querySelector('fieldset');

	if (fieldset) {
		var fold = document.createElement('div');
		fold.className = 'sf-acc-fold';

		while (fieldset.firstChild) {
			fold.appendChild(fieldset.firstChild);
		}

		var card = document.createElement('button');
		card.type = 'button';
		card.className = 'sf-acc-card';
		card.setAttribute('aria-expanded', 'false');
		card.innerHTML =
			'<svg viewBox="0 0 24 24" aria-hidden="true">' +
			'<path d="M12 3l7 3v6c0 4.2-2.9 7.7-7 9-4.1-1.3-7-4.8-7-9V6l7-3z"/>' +
			'<path d="M12 11v3"/></svg>' +
			'<span><strong>Password &amp; security</strong>' +
			'<em>Update your password whenever you need to.</em></span>' +
			'<i aria-hidden="true">+</i>';

		fieldset.appendChild(card);
		fieldset.appendChild(fold);

		card.addEventListener('click', function () {
			var open = fold.classList.toggle('is-open');

			card.classList.toggle('is-open', open);
			card.setAttribute('aria-expanded', open ? 'true' : 'false');
			card.querySelector('i').textContent = open ? '−' : '+';
		});
	}

	/* ---- 4. Reset beside Save, on a row that spans the form ----
	 * WooCommerce keeps the save button, the nonce and a hidden action
	 * field together in one <p>. That <p> becomes the row, rather than a
	 * new element inside it — inside, it is one column of the grid wide,
	 * which leaves the buttons stranded in the middle.
	 */
	var save = form.querySelector('.woocommerce-Button');

	if (save) {
		var row = save.parentNode;
		row.classList.add('sf-acc-actions');

		var note = document.createElement('p');
		note.className = 'sf-acc-note';
		note.textContent = 'Changes are saved to your account.';

		var buttons = document.createElement('span');
		buttons.className = 'sf-acc-buttons';

		var reset = document.createElement('button');
		reset.type = 'reset';
		reset.className = 'sf-acc-reset';
		reset.textContent = 'Reset';

		row.insertBefore(note, row.firstChild);
		row.appendChild(buttons);
		buttons.appendChild(reset);
		buttons.appendChild(save);
	}
})();

/* =============================================================
 * THE ACCOUNT RAIL
 * An icon for each endpoint and a heading that says where you
 * are. Keyed on WooCommerce's own link classes, so an endpoint
 * added by a plugin still works — it simply has no icon.
 * ============================================================= */
(function () {
	var nav = document.querySelector('.woocommerce-MyAccount-navigation');
	var content = document.querySelector('.woocommerce-MyAccount-content');

	if (!nav || !content) {
		return;
	}

	var icons = {
		dashboard: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
		orders: '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
		downloads: '<path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/>',
		'edit-address': '<path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
		'edit-account': '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/>',
		wishlist: '<path d="M12 20s-7-4.3-7-9a4 4 0 017-2.6A4 4 0 0119 11c0 4.7-7 9-7 9z"/>',
		'customer-logout': '<path d="M14 4h5v16h-5"/><path d="M3 12h11"/><path d="M10 8l-4 4 4 4"/>'
	};

	nav.querySelectorAll('li').forEach(function (li) {
		var key = Object.keys(icons).find(function (name) {
			return li.classList.contains('woocommerce-MyAccount-navigation-link--' + name);
		});
		var link = li.querySelector('a');

		if (!key || !link || link.querySelector('svg')) {
			return;
		}

		link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + icons[key] + '</svg>'
			+ '<span>' + link.textContent.trim() + '</span>';
	});

	/* No heading here: the rail already says which endpoint you are on, and
	   WordPress prints the page title above. Both were showing at once. */
})();

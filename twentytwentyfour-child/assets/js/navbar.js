/* =============================================================
 * SUPERFLY — GLASS NAVBAR (interactions)
 * -------------------------------------------------------------
 * This file only measures things and switches classes on/off.
 * Every colour, size and animation lives in assets/css/navbar.css.
 *
 *   1. Sliding highlight   One pill glides to the link under the
 *                          mouse and rests on the current page.
 *   2. Spotlight           A soft light follows the mouse across the
 *                          glass bar and catches its edge.
 *   3. Mega menu           One shared panel that opens under items
 *                          with sub pages and morphs between them.
 *   4. Scroll reaction     Adds `is-scrolled` once the page is
 *                          scrolled, so CSS makes the bar more solid.
 *   5. Currency switcher   Opens the MYR ▾ dropdown on click / tap.
 *   6. Search              The search box takes over the menu's
 *                          space while open; adds a ✕ to close.
 *
 * If this file doesn't load, the navbar still works — it just falls
 * back to plain hover highlights and the normal WordPress dropdown.
 * ============================================================= */

document.addEventListener('DOMContentLoaded', function () {
	var navbar = document.querySelector('.sf-navbar');

	if (!navbar) {
		return; // header not on this page
	}

	// People who turn on "reduce motion" get the calm version
	var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	navbar.classList.add('sf-navbar--js');

	setUpSlidingHighlight(navbar);
	setUpMegaMenu(navbar);
	setUpScrollReaction(navbar);
	setUpCurrencySwitcher(navbar);
	setUpSearch(navbar);

	if (!calm) {
		setUpSpotlight(navbar);
	}
});


/* Helper: the top-level menu items (not the ones inside a dropdown) */
function getMenuItems(navbar) {
	var list = navbar.querySelector('.sf-navbar__menu .wp-block-navigation__container');

	if (!list) {
		return [];
	}

	// Items sit straight in the menu — or, when the menu is WordPress's
	// automatic "page list", one layer deeper in <ul class="wp-block-page-list">
	return Array.prototype.slice.call(
		list.querySelectorAll(':scope > li.wp-block-navigation-item, :scope > .wp-block-page-list > li.wp-block-navigation-item')
	);
}


/* Helper: a page's address in one standard form, so two links to the
   same page compare equal — no #section, no trailing slash, the
   ?query=values in a fixed order, and without extras that don't
   change which page it is (ad tracking, currency switch, preview key) */
var IGNORED_QUERY = /^(utm_.*|fbclid|gclid|wmc-currency|currency|woo-share|nocache)$/;

function pageAddress(href) {
	var url;

	try {
		url = new URL(href, window.location.href);
	} catch (error) {
		return href;
	}

	var query = Array.from(url.searchParams.entries())
		.filter(function (pair) { return pair[1] !== '' && !IGNORED_QUERY.test(pair[0]); })
		.sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; })
		.map(function (pair) { return pair[0] + '=' + pair[1]; })
		.join('&');

	return url.origin + url.pathname.replace(/\/+$/, '') + (query ? '?' + query : '');
}


/* -------------------------------------------------------------
 * 1. SLIDING HIGHLIGHT
 * ------------------------------------------------------------- */
function setUpSlidingHighlight(navbar) {
	var list = navbar.querySelector('.sf-navbar__menu .wp-block-navigation__container');
	var items = getMenuItems(navbar);

	if (!list || !items.length) {
		return;
	}

	// The pill itself — an empty <span> placed inside the menu
	var highlight = document.createElement('span');
	highlight.className = 'sf-navbar__highlight';
	highlight.setAttribute('aria-hidden', 'true');
	list.appendChild(highlight);

	navbar.classList.add('sf-navbar--sliding'); // CSS: switch off the plain per-link hover

	// Which menu item is the page you are on?
	//   0. the item you clicked to get here — two items can link to the
	//      same page (SHOP BY CATEGORIES and SHOP BY BIKE both open the
	//      Shop), so remember which one it was (see rememberClickedItem)
	//   1. the link WordPress marked with aria-current="page" — it only
	//      does that for links to a Page, not for custom links like HOME
	//      or the ?product_cat=… category links
	//   2. otherwise: the top-level link whose address matches this page
	//   3. otherwise: the item whose dropdown has a link to this page
	//      (e.g. on Wheels, SHOP BY CATEGORIES rests highlighted)
	var here = pageAddress(window.location.href);

	function itemName(item) {
		var link = item.querySelector(':scope > a[href]');
		return link ? link.textContent.trim() : '';
	}

	function leadsHere(item) {
		var link = item.querySelector(':scope > a[href]');
		return (link && pageAddress(link.href) === here) ||
			Array.prototype.some.call(item.querySelectorAll('ul a[href]'), function (sub) {
				return pageAddress(sub.href) === here;
			});
	}

	var clicked = null;
	try {
		clicked = sessionStorage.getItem('sfNavItem');
	} catch (error) {}

	// The item you've just clicked — the page is on its way. From the click
	// on, the highlight stays there (it no longer goes back to this page's
	// item), and the next page opens with the same item highlighted.
	var going = null;

	function findCurrentItem() {
		if (going) {
			return going;
		}

		var remembered = clicked && items.find(function (item) {
			return itemName(item) === clicked && leadsHere(item);
		});

		if (remembered) {
			return remembered;
		}

		var marked = items.find(function (item) {
			return item.querySelector(':scope > [aria-current="page"]');
		});

		if (marked) {
			return marked;
		}

		var sameAddress = items.find(function (item) {
			var link = item.querySelector(':scope > a[href]');
			return link && pageAddress(link.href) === here;
		});

		if (sameAddress) {
			return sameAddress;
		}

		return items.find(function (item) {
			return Array.prototype.some.call(item.querySelectorAll('ul a[href]'), function (link) {
				return pageAddress(link.href) === here;
			});
		}) || null;
	}

	function moveHighlightTo(item) {
		if (!item || !item.offsetWidth) {
			highlight.style.opacity = '0';
			return;
		}

		highlight.style.setProperty('--sf-highlight-x', item.offsetLeft + 'px');
		highlight.style.setProperty('--sf-highlight-width', item.offsetWidth + 'px');
		highlight.style.opacity = '1';
	}

	items.forEach(function (item) {
		item.addEventListener('mouseenter', function () {
			if (!going) {
				moveHighlightTo(item);
			}
		});
		item.addEventListener('focusin', function () {
			if (!going) {
				moveHighlightTo(item);
			}
		});
	});

	// Click a link that opens another page → the highlight goes to its menu
	// item straight away and stays there until the page changes
	(navbar.closest('.sf-navbar-wrap') || navbar).addEventListener('click', function (event) {
		var link = event.target.closest && event.target.closest('a[href]');

		if (going) {
			return;   // a page change is already on its way (more clicks are ignored)
		}

		if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
			(link.target && link.target !== '_self') || link.closest('.sf-navbar__currency')) {
			return;   // not a page change in this tab
		}

		var url = new URL(link.href, window.location.href);
		if (url.origin !== window.location.origin || (url.hash && pageAddress(url.href) === here)) {
			return;   // another website, or a #section on this page
		}

		var row = link.closest('.sf-mega__row');
		var item = row
			? items.find(function (candidate) { return itemName(candidate) === row.dataset.sfMenu; })
			: items.find(function (candidate) { return candidate.contains(link); });

		// the logo or an icon: the menu item that opens the same page, if any
		if (!item) {
			item = items.find(function (candidate) {
				var top = candidate.querySelector(':scope > a[href]');
				return top && pageAddress(top.href) === pageAddress(link.href);
			});
		}

		if (item) {
			going = item;
			moveHighlightTo(item);
		}
	}, true);

	// Back button showing this page from memory: back to this page's item
	window.addEventListener('pageshow', function (event) {
		if (event.persisted && going) {
			going = null;
			moveHighlightTo(findCurrentItem());
		}
	});

	// Mouse leaves the menu → back to the current page
	// (unless the mega menu is open — then it stays on that item)
	list.addEventListener('mouseleave', function () {
		if (!navbar.classList.contains('sf-mega-is-open')) {
			moveHighlightTo(findCurrentItem());
		}
	});

	// Mega menu closed → back to the current page, but only if the mouse
	// has left the menu (not when it just moved on to another link)
	navbar.addEventListener('sf-mega-closed', function () {
		if (!list.matches(':hover')) {
			moveHighlightTo(findCurrentItem());
		}
	});

	rememberClickedItem(navbar);

	// First placement: jump straight there, no sliding in from the left
	highlight.classList.add('is-instant');
	moveHighlightTo(findCurrentItem());
	requestAnimationFrame(function () {
		requestAnimationFrame(function () {
			highlight.classList.remove('is-instant');
		});
	});

	window.addEventListener('resize', function () {
		moveHighlightTo(findCurrentItem());
	});

	if (document.fonts && document.fonts.ready) {
		document.fonts.ready.then(function () {
			moveHighlightTo(findCurrentItem());
		});
	}
}


/* Which top-level item did you click? (the item itself, a link in its
   dropdown, or a row in the mega menu) — kept for the next page, so it
   can highlight the right one (see findCurrentItem, step 0) */
function rememberClickedItem(navbar) {
	var wrap = navbar.closest('.sf-navbar-wrap') || navbar;

	wrap.addEventListener('click', function (event) {
		var link = event.target.closest && event.target.closest('a[href]');
		if (!link) {
			return;
		}

		var name = '';
		var row = link.closest('.sf-mega__row');
		var item = link.closest('.sf-navbar__menu .wp-block-navigation__container > li, .sf-navbar__menu .wp-block-page-list > li');

		if (row) {
			name = row.dataset.sfMenu || '';
		} else if (item) {
			var top = item.querySelector(':scope > a[href]');
			name = top ? top.textContent.trim() : '';
		}

		try {
			if (name) {
				sessionStorage.setItem('sfNavItem', name);
			} else {
				sessionStorage.removeItem('sfNavItem');   // logo, icons: let the page decide
			}
		} catch (error) {}
	}, true);   // "capture": runs before anything else handles the click
}


/* -------------------------------------------------------------
 * 2. SPOTLIGHT
 * Tells CSS where the mouse is on the bar (--sf-spot-x / -y).
 * ------------------------------------------------------------- */
function setUpSpotlight(navbar) {
	navbar.addEventListener('mousemove', function (event) {
		var box = navbar.getBoundingClientRect();
		navbar.style.setProperty('--sf-spot-x', (event.clientX - box.left) + 'px');
		navbar.style.setProperty('--sf-spot-y', (event.clientY - box.top) + 'px');
	});
}


/* -------------------------------------------------------------
 * 3. MEGA MENU
 *
 *   HOME  [SHOP BY CATEGORIES ⌄]  SHOP BY BIKE ⌄  INSTALLATION GUIDE ⌄
 *         ┌──────────────────────────────┐
 *         │ [wheel]   Wheels           › │   ← one shared panel
 *         │ [spring]  Suspensions      › │     icon · name ·
 *         │ [disc]    Brakes           › │     (description) · arrow
 *         │ [tag]     Other            › │
 *         └──────────────────────────────┘
 *
 * Moving from one dropdown item to another doesn't close the panel —
 * it glides and resizes to the new item and slides the list across.
 *
 * Built from the normal WordPress sub menus (which CSS then hides).
 * Descriptions come from each page's Excerpt, passed in by
 * functions.php as `window.sfNavbarDescriptions`.
 * Icons are picked by the page's name — see MENU_ICONS below.
 * ------------------------------------------------------------- */
function setUpMegaMenu(navbar) {
	var CLOSE_DELAY = 180; // ms — time to move the mouse from the item down to the panel

	var wrap = navbar.parentElement;
	var items = getMenuItems(navbar);
	var parents = items.filter(function (item) {
		return item.classList.contains('has-child');
	});

	if (!parents.length || !wrap) {
		return;
	}

	var descriptions = window.sfNavbarDescriptions || {};

	// The shared panel
	var panel = document.createElement('div');
	panel.className = 'sf-mega';
	panel.inert = true; // not clickable / tabbable while closed

	var stage = document.createElement('div');
	stage.className = 'sf-mega__stage';
	panel.appendChild(stage);
	wrap.appendChild(panel);

	navbar.classList.add('sf-navbar--mega'); // CSS: hide the normal WordPress dropdowns

	// One "section" (list of rows) per dropdown item
	var sections = parents.map(function (parent) {
		var section = document.createElement('div');
		section.className = 'sf-mega__section';

		var links = parent.querySelectorAll(':scope > .wp-block-navigation__submenu-container > li > .wp-block-navigation-item__content');
		var menuName = parent.querySelector(':scope > .wp-block-navigation-item__content').textContent;

		links.forEach(function (link) {
			section.appendChild(buildRow(link, descriptions[link.href], menuName));
		});

		stage.appendChild(section);
		return { parent: parent, section: section };
	});

	var openIndex = -1;
	var closeTimer = null;

	function openSection(index) {
		clearTimeout(closeTimer);

		if (index === openIndex) {
			return;
		}

		var next = sections[index];
		var wasOpen = openIndex !== -1;
		var direction = wasOpen && index < openIndex ? -1 : 1; // slide from the right or the left

		// Lists: old one slides out one way, new one slides in from the other
		if (wasOpen) {
			var previous = sections[openIndex].section;
			previous.style.setProperty('--sf-slide', (-40 * direction) + 'px');
			previous.classList.remove('is-active');
		}

		next.section.classList.add('is-instant');
		next.section.style.setProperty('--sf-slide', wasOpen ? (40 * direction) + 'px' : '0px');
		void next.section.offsetWidth; // apply the start position before animating
		next.section.classList.remove('is-instant');
		next.section.classList.add('is-active');

		// Panel: size of the new list, centred under the item (kept inside the bar)
		var width = next.section.offsetWidth;
		var height = next.section.offsetHeight;
		var wrapBox = wrap.getBoundingClientRect();
		var barBox = navbar.getBoundingClientRect();
		var itemBox = next.parent.getBoundingClientRect();
		var left = itemBox.left + itemBox.width / 2 - width / 2 - wrapBox.left;
		var minLeft = barBox.left - wrapBox.left;
		var maxLeft = barBox.right - wrapBox.left - width;
		left = Math.max(minLeft, Math.min(maxLeft, left));

		if (!wasOpen) {
			panel.classList.add('is-instant'); // first open: appear in place, don't glide from the last spot
		}

		panel.style.setProperty('--sf-mega-width', width + 'px');
		panel.style.setProperty('--sf-mega-height', height + 'px');
		panel.style.setProperty('--sf-mega-x', left + 'px');

		if (!wasOpen) {
			void panel.offsetWidth;
			panel.classList.remove('is-instant');
		}

		panel.classList.add('is-open');
		panel.inert = false;
		navbar.classList.add('sf-mega-is-open');
		setExpanded(index);
		openIndex = index;
	}

	function close() {
		clearTimeout(closeTimer);

		if (openIndex === -1) {
			return;
		}

		sections[openIndex].section.classList.remove('is-active');
		panel.classList.remove('is-open');
		panel.inert = true;
		navbar.classList.remove('sf-mega-is-open');
		setExpanded(-1);
		openIndex = -1;
		navbar.dispatchEvent(new CustomEvent('sf-mega-closed'));
	}

	function closeSoon() {
		clearTimeout(closeTimer);
		closeTimer = setTimeout(close, CLOSE_DELAY);
	}

	// Keep the ⌄ buttons' "open / closed" state right for screen readers
	function setExpanded(openedIndex) {
		parents.forEach(function (parent, i) {
			var toggle = parent.querySelector('.wp-block-navigation__submenu-icon');
			if (toggle) {
				toggle.setAttribute('aria-expanded', i === openedIndex ? 'true' : 'false');
			}
		});
	}

	// Items with sub pages open the panel; other items close it
	items.forEach(function (item) {
		var index = parents.indexOf(item);

		if (index === -1) {
			item.addEventListener('mouseenter', close);
			return;
		}

		item.addEventListener('mouseenter', function () { openSection(index); });
		item.addEventListener('mouseleave', closeSoon);
		item.addEventListener('focusin', function () { openSection(index); });

		// Tap / click on the ⌄ arrow (touch screens, keyboards)
		var toggle = item.querySelector('.wp-block-navigation__submenu-icon');
		if (toggle) {
			toggle.addEventListener('click', function (event) {
				event.preventDefault();
				event.stopPropagation();
				if (openIndex === index) {
					close();
				} else {
					openSection(index);
				}
			});
		}
	});

	panel.addEventListener('mouseenter', function () { clearTimeout(closeTimer); });
	panel.addEventListener('mouseleave', closeSoon);

	document.addEventListener('keydown', function (event) {
		if (event.key === 'Escape') {
			close();
		}
	});

	document.addEventListener('click', function (event) {
		if (!panel.contains(event.target) && !navbar.contains(event.target)) {
			close();
		}
	});
}

/* Icons for the rows (Font Awesome 5 Free), picked by a word in the name:
     1. the row's own name   ("Wheels" → wheel)
     2. else its menu's name ("Yamaha" is under "Shop by bike" → bike)
     3. else the price tag   ("default")
   To add one: a new line with the word and a Font Awesome 5 "solid"
   icon name from fontawesome.com/v5/search (free icons only). */
var MENU_ICONS = {
	wheel:      'fa-dot-circle',
	suspension: 'fa-arrows-alt-v',
	brake:      'fa-compact-disc',
	bike:       'fa-motorcycle',
	helmet:     'fa-hard-hat',
	'default':  'fa-tag'
};

function findIconWord(text) {
	var lower = text.toLowerCase();
	return Object.keys(MENU_ICONS).find(function (key) {
		return key !== 'default' && lower.indexOf(key) !== -1;
	});
}

function pickIcon(name, menuName) {
	var word = findIconWord(name) || findIconWord(menuName || '') || 'default';
	return MENU_ICONS[word];
}

/* One row:  [icon]  name / description  ›
   menuName = the top-level item it sits under (for the icon fallback) */
function buildRow(link, description, menuName) {
	var name = link.textContent.trim();

	var row = document.createElement('a');
	row.className = 'sf-mega__row';
	row.href = link.href;
	row.dataset.sfMenu = (menuName || '').trim();   // its top-level item, for the highlight on the next page

	var icon = document.createElement('span');
	icon.className = 'sf-mega__row-icon';
	icon.setAttribute('aria-hidden', 'true');
	icon.innerHTML = '<i class="fas ' + pickIcon(name, menuName) + '"></i>';
	row.appendChild(icon);

	var text = document.createElement('span');
	text.className = 'sf-mega__row-text';

	var title = document.createElement('span');
	title.className = 'sf-mega__row-name';
	title.textContent = name;
	text.appendChild(title);

	if (description) {
		var detail = document.createElement('span');
		detail.className = 'sf-mega__row-description';
		detail.textContent = description;
		text.appendChild(detail);
	}

	row.appendChild(text);

	var arrow = document.createElement('i');
	arrow.className = 'fas fa-chevron-right sf-mega__row-arrow';
	arrow.setAttribute('aria-hidden', 'true');
	row.appendChild(arrow);

	return row;
}


/* -------------------------------------------------------------
 * 4. SCROLL REACTION
 * Once the page is scrolled a little, the bar gets `is-scrolled`
 * and CSS makes it more solid. The menu always stays visible.
 * ------------------------------------------------------------- */
function setUpScrollReaction(navbar) {
	var SCROLL_DISTANCE = 24; // pixels scrolled before the bar changes

	function update() {
		navbar.classList.toggle('is-scrolled', window.scrollY > SCROLL_DISTANCE);
	}

	window.addEventListener('scroll', update, { passive: true });
	update(); // in case the page opens already scrolled
}


/* -------------------------------------------------------------
 * 5. CURRENCY SWITCHER
 * On desktop the MYR ▾ dropdown already opens on hover (CSS).
 * This adds click / tap, for touch screens and keyboards.
 * Clicking outside or pressing Escape closes it.
 * ------------------------------------------------------------- */
function setUpCurrencySwitcher(navbar) {
	var switcher = navbar.querySelector('.sf-navbar__currency');

	if (!switcher) {
		return; // CURCY not active, or only one currency
	}

	var button = switcher.querySelector('.sf-navbar__currency-current');

	function setOpen(open) {
		switcher.classList.toggle('is-open', open);
		button.setAttribute('aria-expanded', open ? 'true' : 'false');
	}

	button.addEventListener('click', function (event) {
		event.stopPropagation();
		setOpen(!switcher.classList.contains('is-open'));
	});

	document.addEventListener('click', function (event) {
		if (!switcher.contains(event.target)) {
			setOpen(false);
		}
	});

	document.addEventListener('keydown', function (event) {
		if (event.key === 'Escape') {
			setOpen(false);
		}
	});
}


/* -------------------------------------------------------------
 * 6. SEARCH
 *   closed:  [logo]  HOME  SHOP BY …  INSTALLATION GUIDE  │ 🔍 …
 *   open:    [logo]  [ Search products…              ✕ ]  │ 🔍 …
 * WordPress's Search block opens / closes the box itself (it adds or
 * removes `wp-block-search__searchfield-hidden`). We watch for that
 * and: measure the free space, add `is-searching` to the bar (CSS
 * fades the menu out), and add a ✕. Escape or clicking elsewhere
 * closes it too.
 * ------------------------------------------------------------- */
function setUpSearch(navbar) {
	var form = navbar.querySelector('.sf-navbar__search');
	var logo = navbar.querySelector('.sf-navbar__logo');

	if (!form || !logo) {
		return;
	}

	var HIDDEN = 'wp-block-search__searchfield-hidden';
	var wrapper = form.querySelector('.wp-block-search__inside-wrapper');
	var input = form.querySelector('.wp-block-search__input');
	var searchButton = form.querySelector('.wp-block-search__button');

	// The ✕ button
	var closeButton = document.createElement('button');
	closeButton.type = 'button';
	closeButton.className = 'sf-navbar__search-close';
	closeButton.setAttribute('aria-label', 'Close search');
	closeButton.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
	wrapper.appendChild(closeButton);

	function isOpen() {
		return !form.classList.contains(HIDDEN);
	}

	// Free space: from just after the logo to just before the 🔍
	function measure() {
		var logoRight = logo.getBoundingClientRect().right;
		var searchLeft = wrapper.getBoundingClientRect().left;
		var width = Math.max(200, searchLeft - 10 - logoRight - 24);
		form.style.setProperty('--sf-search-width', width + 'px');
	}

	function close() {
		form.classList.add(HIDDEN);
		if (searchButton) {
			searchButton.setAttribute('aria-expanded', 'false');
		}
	}

	// React whenever WordPress opens or closes the box
	new MutationObserver(function () {
		if (isOpen()) {
			measure();
		}
		navbar.classList.toggle('is-searching', isOpen());
	}).observe(form, { attributes: true, attributeFilter: ['class'] });

	closeButton.addEventListener('click', function () {
		input.value = '';
		close();
	});

	document.addEventListener('keydown', function (event) {
		if (event.key === 'Escape' && isOpen()) {
			close();
		}
	});

	document.addEventListener('click', function (event) {
		if (isOpen() && !form.contains(event.target)) {
			close();
		}
	});

	window.addEventListener('resize', function () {
		if (isOpen()) {
			measure();
		}
	});
}

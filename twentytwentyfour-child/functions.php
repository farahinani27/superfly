<?php
// Twenty Twenty-Four is a block theme: its look comes from theme.json,
// so only the child's own style.css needs enqueuing (no parent-style).
add_action( 'wp_enqueue_scripts', 'superfly_child_enqueue_styles' );
function superfly_child_enqueue_styles() {
	wp_enqueue_style(
		'superfly-child-style',
		get_stylesheet_uri(),
		array(),
		filemtime( get_stylesheet_directory() . '/style.css' )
	);

	// Font Awesome 5 (Free) — the navbar's icons. Uses the copy that
	// comes with Elementor (the same file ShopEngine loads, so the
	// browser downloads it only once). Skipped if Elementor is removed.
	if ( file_exists( WP_PLUGIN_DIR . '/elementor/assets/lib/font-awesome/css/all.css' ) ) {
		wp_enqueue_style(
			'superfly-font-awesome',
			plugins_url( 'elementor/assets/lib/font-awesome/css/all.css' ),
			array(),
			null
		);
	}

	// Glass navbar — layout is parts/header.html
	wp_enqueue_style(
		'superfly-navbar',
		get_stylesheet_directory_uri() . '/assets/css/navbar.css',
		array( 'superfly-child-style' ),
		filemtime( get_stylesheet_directory() . '/assets/css/navbar.css' )
	);

	// Glass navbar interactions — sliding highlight + scroll reaction
	wp_enqueue_script(
		'superfly-navbar',
		get_stylesheet_directory_uri() . '/assets/js/navbar.js',
		array(),
		filemtime( get_stylesheet_directory() . '/assets/js/navbar.js' ),
		true
	);

	// Dropdown descriptions: the Excerpt of each sub page, keyed by the
	// page's link. navbar.js shows it as a small grey line under the link.
	$descriptions = array();

	foreach ( get_pages() as $page ) {
		if ( $page->post_parent && has_excerpt( $page ) ) {
			$descriptions[ get_permalink( $page ) ] = wp_strip_all_tags( get_the_excerpt( $page ) );
		}
	}

	wp_add_inline_script(
		'superfly-navbar',
		'window.sfNavbarDescriptions = ' . wp_json_encode( $descriptions ) . ';',
		'before'
	);
}


// Currency switcher for the navbar:  [superfly_currency]
//
//   MYR ▾        ← current currency
//   ├ MYR
//   ├ SGD        ← links to switch
//   └ USD
//
// The CURCY plugin (woo-multi-currency) does the actual switching and
// price conversion; this only draws the dropdown in the navbar style.
// Currencies + exchange rates: WooCommerce → Multi Currency.
// If CURCY is switched off, nothing is shown.
add_shortcode( 'superfly_currency', 'superfly_currency_switcher' );
function superfly_currency_switcher() {
	if ( ! class_exists( 'WOOMULTI_CURRENCY_F_Data' ) ) {
		return '';
	}

	$curcy   = WOOMULTI_CURRENCY_F_Data::get_ins();
	$current = $curcy->get_current_currency();
	$links   = $curcy->get_links(); // currency code => link that switches to it

	if ( count( $links ) < 2 ) {
		return ''; // only one currency: nothing to switch
	}

	// Built as one line on purpose: WordPress's Shortcode block adds
	// <p> / <br> tags wherever it finds line breaks.
	$arrow = '<i class="fas fa-chevron-down" aria-hidden="true"></i>';
	$html  = '<div class="sf-navbar__currency">';
	$html .= '<button type="button" class="sf-navbar__currency-current" aria-expanded="false" aria-label="Currency: ' . esc_attr( $current ) . '">' . esc_html( $current ) . $arrow . '</button>';
	$html .= '<ul class="sf-navbar__currency-list">';

	foreach ( $links as $code => $link ) {
		$is_current = ( $code === $current );
		$html      .= '<li><a href="' . esc_url( $link ) . '" rel="nofollow"' . ( $is_current ? ' class="is-current" aria-current="true"' : '' ) . '>' . esc_html( $code ) . '</a></li>';
	}

	$html .= '</ul></div>';

	return $html;
}


// Show the "Excerpt" box on pages (Pages → Edit → Excerpt), so each
// dropdown link can have a short description.
add_action( 'init', function() {
	add_post_type_support( 'page', 'excerpt' );
} );


// GSAP — all three files pinned to the same version
function superfly_gsap_scripts() {

	wp_enqueue_script(
		'gsap',
		'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js',
		array(),
		null,
		true
	);

	wp_enqueue_script(
		'scrolltrigger',
		'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js',
		array('gsap'),
		null,
		true
	);

	wp_enqueue_script(
		'splittext',
		'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/SplitText.min.js',
		array('gsap'),
		null,
		true
	);

}
add_action('wp_enqueue_scripts', 'superfly_gsap_scripts');


add_action( 'wp_enqueue_scripts', function() {
	wp_enqueue_script(
		'superfly-child-custom',
		get_stylesheet_directory_uri() . '/assets/js/custom.js',
		array( 'gsap', 'scrolltrigger', 'splittext' ),
		filemtime( get_stylesheet_directory() . '/assets/js/custom.js' ),
		true
	);
}, 20 );


// Loading screen + page change (the Superfly bike riding across) — every page.
// Click a navbar link: a big pink bike pulls a dark carbon box over the page and rides off,
// leaving the page's name in the middle; the new page opens under the box and,
// once loaded, the box slides off to the right.
//   Looks: assets/css/preloader.css · movement: assets/js/preloader.js
// Not shown inside the Elementor editor or the Customizer preview.
function superfly_show_preloader() {
	if ( is_admin() || is_customize_preview() || wp_doing_ajax() ) {
		return false;
	}

	if ( isset( $_GET['elementor-preview'] ) ) {
		return false;
	}

	if ( class_exists( '\Elementor\Plugin' ) && isset( \Elementor\Plugin::$instance->preview ) && \Elementor\Plugin::$instance->preview->is_preview_mode() ) {
		return false;
	}

	return true;
}

add_action( 'wp_enqueue_scripts', 'superfly_preloader_assets', 5 );
function superfly_preloader_assets() {
	if ( ! superfly_show_preloader() ) {
		return;
	}

	// Archivo Black — the page name on the panel (same font as the home page)
	wp_enqueue_style(
		'superfly-preloader-font',
		'https://fonts.googleapis.com/css2?family=Archivo+Black&display=block',   // block: never flash a stand-in font in the name
		array(),
		null
	);

	wp_enqueue_style(
		'superfly-preloader',
		get_stylesheet_directory_uri() . '/assets/css/preloader.css',
		array( 'superfly-preloader-font' ),
		filemtime( get_stylesheet_directory() . '/assets/css/preloader.css' )
	);

	// No dependencies on purpose, so it runs early — before GSAP has
	// downloaded. It only uses GSAP for the slides, once it's there.
	wp_enqueue_script(
		'superfly-preloader',
		get_stylesheet_directory_uri() . '/assets/js/preloader.js',
		array(),
		filemtime( get_stylesheet_directory() . '/assets/js/preloader.js' ),
		true
	);
}

// The name in the box: this page's own name, straight from WordPress. After a
// navbar click the box shows the clicked link's words instead (the small script
// below), so both pages of a page change show the same name.
function superfly_page_label() {
	if ( is_front_page() ) {
		return 'Home';
	}
	if ( function_exists( 'is_shop' ) && is_shop() ) {
		return get_the_title( wc_get_page_id( 'shop' ) ) ?: 'Shop';
	}
	if ( is_category() || is_tag() || is_tax() ) {
		return single_term_title( '', false );             // e.g. a product category: "Wheels"
	}
	if ( is_search() ) {
		return 'Search';
	}
	if ( is_404() ) {
		return 'Page not found';
	}
	if ( is_singular() ) {
		return get_the_title( get_queried_object_id() ) ?: get_bloginfo( 'name' );  // pages, products, posts
	}
	if ( is_post_type_archive() ) {
		return post_type_archive_title( '', false );
	}
	return get_bloginfo( 'name' );                            // anything else: "Superfly"
}

// The panel itself, placed straight after <body> so it shows at once
add_action( 'wp_body_open', 'superfly_preloader_markup', 1 );
function superfly_preloader_markup() {
	if ( ! superfly_show_preloader() ) {
		return;
	}
	// The bike is cut out of the site logo (Appearance → Editor → Site Logo),
	// so if the logo changes, the bike follows.
	$logo_id  = get_theme_mod( 'custom_logo' ) ?: get_option( 'site_logo' );
	$logo_url = $logo_id ? wp_get_attachment_image_url( $logo_id, 'full' ) : '';
	?>
	<?php
	// The bike only rides for Home. Every other page gets the same carbon
	// panel with nothing moving on it — it is only there to cover the
	// moment the page is opening.
	$sf_plain = is_front_page() ? '' : ' sf-lights--plain';
	?>
	<div class="sf-lights<?php echo esc_attr( $sf_plain ); ?>" aria-hidden="true" style="--sf-bike-img: url('<?php echo esc_url( $logo_url ); ?>')">
		<div class="sf-lights__bands">
			<span class="sf-lights__band"></span>
			<span class="sf-lights__band"></span>
			<span class="sf-lights__band"></span>
			<span class="sf-lights__band">
				<!-- the bike rides in front of this band, at the tip of the box -->
				<span class="sf-lights__rider">
					<span class="sf-lights__speed"></span>
					<span class="sf-lights__bike"></span>
				</span>
			</span>
			<span class="sf-lights__band"></span>
			<span class="sf-lights__band"></span>
		</div>
		<div class="sf-lights__label"><span class="sf-lights__label-text"><?php echo esc_html( superfly_page_label() ); ?></span></div>
	</div>
	<script>
	// Came here by clicking a navbar link? Show that page's name straight
	// away, so the panel looks exactly like it did on the page before.
	(function () {
		try {
			var name = sessionStorage.getItem( 'sfPageChange' );
			if ( name !== null ) {
				sessionStorage.removeItem( 'sfPageChange' );
				var panel = document.currentScript.previousElementSibling;
				panel.classList.add( 'is-arriving' );
				panel.querySelector( '.sf-lights__label-text' ).textContent = name;
			}
		} catch ( error ) {}
	})();
	</script>
	<?php
}


// Home intro (SSTR-style loading screen) — once per visit: only the first time
// the website is opened in a browser tab. Refreshing, or coming back to Home
// from another page, skips it (the carbon box shows instead, like other pages).
// Sits right after the carbon box; when it plays, home-intro.js hides the box
// and runs instead. The box stays, hidden, for the page change when a navbar
// link is clicked.
//   HTML: assets/html/home-intro.html · looks: assets/css/home-intro.css
//   movement: assets/js/home-intro.js
add_action( 'wp_enqueue_scripts', 'superfly_home_intro_assets', 4 );
function superfly_home_intro_assets() {
	if ( ! is_front_page() || ! superfly_show_preloader() ) {
		return;
	}

	wp_enqueue_style(
		'superfly-home-intro',
		get_stylesheet_directory_uri() . '/assets/css/home-intro.css',
		array(),
		filemtime( get_stylesheet_directory() . '/assets/css/home-intro.css' )
	);

	// Enqueued before preloader.js (priority 4 vs 5) so it runs first
	wp_enqueue_script(
		'superfly-home-intro',
		get_stylesheet_directory_uri() . '/assets/js/home-intro.js',
		array(),
		filemtime( get_stylesheet_directory() . '/assets/js/home-intro.js' ),
		true
	);
}

add_action( 'wp_body_open', 'superfly_home_intro_markup', 2 );
function superfly_home_intro_markup() {
	if ( ! is_front_page() || ! superfly_show_preloader() ) {
		return;
	}

	$file = get_stylesheet_directory() . '/assets/html/home-intro.html';

	if ( ! file_exists( $file ) ) {
		return;
	}

	echo file_get_contents( $file ); // our own static HTML file
	?>
	<script>
	// Once per visit: seen it already in this tab (a refresh, or back to Home
	// from another page)? Take the intro out before it's ever shown — the
	// carbon box does the loading instead. A new visit (new tab, or the
	// browser opened again) plays it again.
	(function () {
		try {
			if ( sessionStorage.getItem( 'sfIntroSeen' ) ) {
				document.querySelector( '.sf-intro' ).remove();
			} else {
				sessionStorage.setItem( 'sfIntroSeen', '1' );
			}
		} catch ( error ) {}   // private browsing etc.: just play it
	})();
	</script>
	<?php
}


// Home hero (RIDE. RACE. RESEARCH.) — home page only.
// Layout: the hero HTML lives in Pages → Home (Elementor HTML widget);
// the page frame (navbar, full-width content, footer) is the "Full Width (no title)"
// template — templates/page-full-width.html, listed in theme.json so any page can pick it.
add_action( 'wp_enqueue_scripts', 'superfly_hero_assets', 20 );
function superfly_hero_assets() {
	if ( ! is_front_page() ) {
		return;
	}

	// Hero fonts: Archivo Black (big words), Archivo (text), Chakra Petch (buttons, labels)
	wp_enqueue_style(
		'superfly-hero-fonts',
		'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;800&family=Archivo+Black&family=Chakra+Petch:wght@500;600;700&display=swap',
		array(),
		null
	);

	wp_enqueue_style(
		'superfly-hero',
		get_stylesheet_directory_uri() . '/assets/css/hero.css',
		array( 'superfly-navbar', 'superfly-hero-fonts' ),
		filemtime( get_stylesheet_directory() . '/assets/css/hero.css' )
	);

	// Start lights, entrance, collage parallax — uses GSAP (loaded above)
	wp_enqueue_script(
		'superfly-hero',
		get_stylesheet_directory_uri() . '/assets/js/hero.js',
		array( 'gsap' ),
		filemtime( get_stylesheet_directory() . '/assets/js/hero.js' ),
		true
	);

	// Section 2 — "Shop by category" (HTML in Pages → Home, Elementor widget)
	wp_enqueue_style(
		'superfly-categories',
		get_stylesheet_directory_uri() . '/assets/css/categories.css',
		array( 'superfly-hero' ),
		filemtime( get_stylesheet_directory() . '/assets/css/categories.css' )
	);

	// Scroll-in wipe + 3D tilt — uses GSAP + ScrollTrigger (loaded above)
	wp_enqueue_script(
		'superfly-categories',
		get_stylesheet_directory_uri() . '/assets/js/categories.js',
		array( 'gsap', 'scrolltrigger' ),
		filemtime( get_stylesheet_directory() . '/assets/js/categories.js' ),
		true
	);

	// Section 3 — Project RP "Livery" (HTML in Pages → Home, Elementor widget)
	wp_enqueue_style(
		'superfly-rp-livery',
		get_stylesheet_directory_uri() . '/assets/css/rp-livery.css',
		array( 'superfly-hero' ),
		filemtime( get_stylesheet_directory() . '/assets/css/rp-livery.css' )
	);

	// Pit board, title letters, film drift, sound cursor, muted film, pop-up
	wp_enqueue_script(
		'superfly-rp-livery',
		get_stylesheet_directory_uri() . '/assets/js/rp-livery.js',
		array( 'gsap', 'scrolltrigger' ),
		filemtime( get_stylesheet_directory() . '/assets/js/rp-livery.js' ),
		true
	);

	// Section 4 — Dealers & distributors (HTML in Pages → Home, Elementor widget)
	wp_enqueue_style(
		'superfly-dealers',
		get_stylesheet_directory_uri() . '/assets/css/dealers.css',
		array( 'superfly-hero' ),
		filemtime( get_stylesheet_directory() . '/assets/css/dealers.css' )
	);

	// Pick a country (or let it walk through them), photos behind, scroll-in
	wp_enqueue_script(
		'superfly-dealers',
		get_stylesheet_directory_uri() . '/assets/js/dealers.js',
		array(),
		filemtime( get_stylesheet_directory() . '/assets/js/dealers.js' ),
		true
	);
}


// The tile board — two pages use it:
//   Pages → Shop by Bike      (…/shop-by-bike)      one tile per bike brand
//   Pages → Shop by Category  (…/shop-by-category)  one tile per part category
// Layout: each page's Custom HTML block · looks: assets/css/shop-by-bike.css
// movement: assets/js/shop-by-bike.js
add_action( 'wp_enqueue_scripts', 'superfly_shop_by_bike_assets', 20 );
function superfly_shop_by_bike_assets() {
	if ( ! is_page( array( 'shop-by-bike', 'shop-by-category' ) ) ) {
		return;
	}

	// Same fonts as the home page: Archivo Black, Archivo, Chakra Petch
	wp_enqueue_style(
		'superfly-hero-fonts',
		'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;800&family=Archivo+Black&family=Chakra+Petch:wght@500;600;700&display=swap',
		array(),
		null
	);

	wp_enqueue_style(
		'superfly-shop-by-bike',
		get_stylesheet_directory_uri() . '/assets/css/shop-by-bike.css',
		array( 'superfly-navbar', 'superfly-hero-fonts' ),
		filemtime( get_stylesheet_directory() . '/assets/css/shop-by-bike.css' )
	);

	wp_enqueue_script(
		'superfly-shop-by-bike',
		get_stylesheet_directory_uri() . '/assets/js/shop-by-bike.js',
		array(),
		filemtime( get_stylesheet_directory() . '/assets/js/shop-by-bike.js' ),
		true
	);
}


// Suspensions installation guide (Pages → Suspensions Installation Guide,
// address …/suspensions-installation-guide) — one pinned screen: the words
// change on the left, the step photos crossfade on the right.
// Layout: the page's Custom HTML block · looks: assets/css/guide.css
// movement: assets/js/guide.js (needs GSAP + ScrollTrigger, already site-wide)
add_action( 'wp_enqueue_scripts', 'superfly_guide_assets', 20 );
function superfly_guide_assets() {
	if ( ! is_page( 'suspensions-installation-guide' ) ) {
		return;
	}

	// Same fonts as the home page: Archivo Black, Archivo, Chakra Petch
	wp_enqueue_style(
		'superfly-hero-fonts',
		'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;800&family=Archivo+Black&family=Chakra+Petch:wght@500;600;700&display=swap',
		array(),
		null
	);

	wp_enqueue_style(
		'superfly-guide',
		get_stylesheet_directory_uri() . '/assets/css/guide.css',
		array( 'superfly-navbar', 'superfly-hero-fonts' ),
		filemtime( get_stylesheet_directory() . '/assets/css/guide.css' )
	);

	wp_enqueue_script(
		'superfly-guide',
		get_stylesheet_directory_uri() . '/assets/js/guide.js',
		array( 'gsap', 'scrolltrigger' ),
		filemtime( get_stylesheet_directory() . '/assets/js/guide.js' ),
		true
	);
}


// Footer — layout is parts/footer.html (a block-theme template part, so it
// shows on every page). Looks: assets/css/footer.css · assets/js/footer.js
// (it only fades the footer in as you reach it).
add_action( 'wp_enqueue_scripts', 'superfly_footer_assets', 20 );
function superfly_footer_assets() {

	// the site's own fonts — the same handle the shop pages use, so this
	// loads once however many of them are on the page
	wp_enqueue_style(
		'superfly-hero-fonts',
		'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;800&family=Archivo+Black&family=Chakra+Petch:wght@500;600;700&display=swap',
		array(),
		null
	);

	// the face the footer borrows: a monospace for the field, the small
	// print, the buttons and the column headings
	wp_enqueue_style(
		'superfly-footer-fonts',
		'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap',
		array(),
		null
	);

	wp_enqueue_style(
		'superfly-footer',
		get_stylesheet_directory_uri() . '/assets/css/footer.css',
		array( 'superfly-child-style', 'superfly-hero-fonts' ),
		filemtime( get_stylesheet_directory() . '/assets/css/footer.css' )
	);

	wp_enqueue_script(
		'superfly-footer',
		get_stylesheet_directory_uri() . '/assets/js/footer.js',
		array(),
		filemtime( get_stylesheet_directory() . '/assets/js/footer.js' ),
		true
	);
}


// Breadcrumbs — the carbon rail under the navbar (assets/css/breadcrumbs.css).
// WooCommerce draws the breadcrumb itself on shop, category, product and
// search pages; this only changes the separator and the wrapper, so the
// stylesheet has something to hold on to.
add_filter( 'woocommerce_breadcrumb_defaults', 'superfly_breadcrumb_defaults' );
function superfly_breadcrumb_defaults( $args ) {
	$args['delimiter']   = '<i>&rsaquo;</i>';   // › — styled faint, not a character in the text
	$args['wrap_before'] = '<nav class="woocommerce-breadcrumb" aria-label="Breadcrumb">';
	$args['wrap_after']  = '</nav>';
	$args['home']        = __( 'Home', 'twentytwentyfour-child' );

	return $args;
}

// The trail WooCommerce builds is Home > Wheels. The shop is really
// organised the way the menu is — by category, or by bike — so put that
// page in between: Home > Shop by categories > Wheels.
// Bike brands go under "Shop by bike" instead; everything else under
// "Shop by categories".
add_filter( 'woocommerce_get_breadcrumb', 'superfly_breadcrumb_trail', 10, 2 );
function superfly_breadcrumb_trail( $crumbs, $breadcrumb ) {

	if ( is_admin() || count( $crumbs ) < 2 ) {
		return $crumbs;
	}

	$bikes = array( 'yamaha', 'honda', 'sym', 'suzuki' );
	$slug  = '';

	if ( is_product_category() ) {
		$term = get_queried_object();
		$slug = isset( $term->slug ) ? $term->slug : '';
	} elseif ( is_product() ) {
		$terms = get_the_terms( get_the_ID(), 'product_cat' );
		$slug  = ( $terms && ! is_wp_error( $terms ) ) ? $terms[0]->slug : '';
	} elseif ( ! is_shop() ) {
		return $crumbs;          // cart, checkout, account: leave them alone
	}

	if ( in_array( $slug, $bikes, true ) ) {
		$page = get_page_by_path( 'shop-by-bike' );
		$name = __( 'Shop by bike', 'twentytwentyfour-child' );
	} else {
		$page = get_page_by_path( 'shop-by-category' );
		$name = __( 'Shop by categories', 'twentytwentyfour-child' );
	}

	if ( ! $page ) {
		return $crumbs;          // the page was renamed or removed
	}

	array_splice( $crumbs, 1, 0, array( array( $name, get_permalink( $page ) ) ) );

	return $crumbs;
}

add_action( 'wp_enqueue_scripts', 'superfly_breadcrumb_assets', 20 );
function superfly_breadcrumb_assets() {
	if ( ! function_exists( 'is_woocommerce' ) || ! ( is_woocommerce() || is_cart() || is_checkout() ) ) {
		return;
	}

	wp_enqueue_style(
		'superfly-breadcrumbs',
		get_stylesheet_directory_uri() . '/assets/css/breadcrumbs.css',
		array( 'superfly-child-style' ),
		filemtime( get_stylesheet_directory() . '/assets/css/breadcrumbs.css' )
	);
}


// Shop pages — the shop, category, product, cart and checkout pages are
// WooCommerce's own markup with Twenty Twenty-Four's colours. This makes
// them dark like the rest of the site. Colour and type only.
// Looks: assets/css/woocommerce.css
add_action( 'wp_enqueue_scripts', 'superfly_shop_assets', 20 );
function superfly_shop_assets() {
	if ( ! function_exists( 'is_woocommerce' ) ) {
		return;
	}

	// Checkout is deliberately left out: it takes real orders, and a
	// restyle there is worth doing on its own, not as a side effect of
	// this one. Remove the is_checkout() line to include it.
	if ( is_checkout() ) {
		return;
	}

	if ( ! ( is_woocommerce() || is_cart() || is_account_page() ) ) {
		return;
	}

	wp_enqueue_style(
		'superfly-shop',
		get_stylesheet_directory_uri() . '/assets/css/woocommerce.css',
		array( 'superfly-child-style' ),
		filemtime( get_stylesheet_directory() . '/assets/css/woocommerce.css' )
	);
}


// Product archive — the shop and every category page: a huge centred
// category name, a one-line bar (Filters / count / sorting) with the
// filters folded behind it, then a wide three-up grid of borderless
// cards. Loads AFTER superfly-shop so it can override the bordered
// card in woocommerce.css section 9, and only on archives, so a
// mistake here cannot reach the cart or the account pages.
// Looks: assets/css/shop-archive.css
// Fold:  assets/js/shop-archive.js
// Markup: templates/archive-product.html
// Concept: revamp/category-b.html
add_action( 'wp_enqueue_scripts', 'superfly_shop_archive_assets', 22 );
function superfly_shop_archive_assets() {
	if ( ! function_exists( 'is_shop' ) ) {
		return;
	}

	// is_product_taxonomy() covers category AND tag archives; is_shop()
	// is the /shop/ page itself, which uses the same template.
	if ( ! ( is_shop() || is_product_taxonomy() ) ) {
		return;
	}

	wp_enqueue_style(
		'superfly-shop-archive',
		get_stylesheet_directory_uri() . '/assets/css/shop-archive.css',
		array( 'superfly-shop' ),
		filemtime( get_stylesheet_directory() . '/assets/css/shop-archive.css' )
	);

	// Folds the filter panel behind the "Filters" button in the bar.
	// Deferred, and the panel starts open in the markup, so with the
	// script blocked the filters are simply visible.
	wp_enqueue_script(
		'superfly-shop-archive',
		get_stylesheet_directory_uri() . '/assets/js/shop-archive.js',
		array(),
		filemtime( get_stylesheet_directory() . '/assets/js/shop-archive.js' ),
		true
	);
}


// Single product — the buy panel as a short sticky rail down the LEFT
// third (the same 470px slot the category filter rail uses), against a
// right column that scrolls: gallery, related products, description,
// reviews. Loads AFTER superfly-shop so it can override woocommerce.css
// section 5, and only on a product, so a mistake here cannot reach the
// cart or the account pages.
//
// NOTE this page is BLOCKIFIED in WooCommerce 11 — there is no
// .summary.entry-summary on it. The structure is set in
// templates/single-product.html, not in a PHP template override.
//
// Looks: assets/css/single-product.css
// Markup: templates/single-product.html
// Concept: revamp/product-b.html
add_action( 'wp_enqueue_scripts', 'superfly_single_product_assets', 22 );
function superfly_single_product_assets() {
	if ( ! function_exists( 'is_product' ) || ! is_product() ) {
		return;
	}

	wp_enqueue_style(
		'superfly-single-product',
		get_stylesheet_directory_uri() . '/assets/css/single-product.css',
		array( 'superfly-shop' ),
		filemtime( get_stylesheet_directory() . '/assets/css/single-product.css' )
	);
}

// Drop the Beast STYLESHEET on a product page, so single-product.css can
// own the controls without a specificity war between two of our own files.
//
// THE SCRIPT STAYS. shop-beast.js is what turns WooCommerce's variation
// <select> into fitment rows with a price on each, which is a feature, not
// a skin — single-product.css restyles those rows (.sb-label / .sb-rows /
// .sb-row) in the reference's language. Dequeue the script too and the
// rows vanish and a plain dropdown comes back.
//
// Priority 99 so it runs after superfly_shop_beast_assets() at 22 has
// actually enqueued the handle; dequeuing before that does nothing.
// Everywhere except a product page, the Beast styles are untouched.
add_action( 'wp_enqueue_scripts', 'superfly_single_product_drop_beast', 99 );
function superfly_single_product_drop_beast() {
	if ( ! function_exists( 'is_product' ) || ! is_product() ) {
		return;
	}

	wp_dequeue_style( 'superfly-shop-beast' );
}


// My account — design B: the links as tabs across the top, and a login
// screen with a photo beside the form instead of a form on black.
// Looks: assets/css/account.css
// Dashboard cards: woocommerce/myaccount/dashboard.php (in this theme)
add_action( 'wp_enqueue_scripts', 'superfly_account_assets', 21 );
function superfly_account_assets() {
	if ( ! function_exists( 'is_account_page' ) || ! is_account_page() ) {
		return;
	}

	wp_enqueue_style(
		'superfly-account',
		get_stylesheet_directory_uri() . '/assets/css/account.css',
		array( 'superfly-child-style' ),
		filemtime( get_stylesheet_directory() . '/assets/css/account.css' )
	);

	// the account-details form: placeholders, the password card, Reset
	wp_enqueue_script(
		'superfly-account',
		get_stylesheet_directory_uri() . '/assets/js/account.js',
		array(),
		filemtime( get_stylesheet_directory() . '/assets/js/account.js' ),
		true
	);
}

// The login screen: wrap WooCommerce's form and put a photo beside it.
// To change the picture, point this at another one in the media library.
define( 'SUPERFLY_LOGIN_PHOTO', '/wp-content/uploads/2026/09/ms0Q8yQ11676538994-4288x2848-1.jpg' );

add_action( 'woocommerce_before_customer_login_form', 'superfly_login_open' );
function superfly_login_open() {
	echo '<div class="sf-login"><div class="sf-login__form">';
}

add_action( 'woocommerce_after_customer_login_form', 'superfly_login_art' );
function superfly_login_art() {
	$photo = home_url( SUPERFLY_LOGIN_PHOTO );

	echo '</div><figure class="sf-login__art">';
	echo '<img src="' . esc_url( $photo ) . '" alt="" loading="lazy">';
	echo '<figcaption>Superfly &middot; Ride. Race. Research.</figcaption>';
	echo '</figure></div>';
}


// Product page in the Beast layout — thumbnails beside the shot, and the
// variation dropdown drawn as rows with a price on each.
// Looks: assets/css/shop-beast.css · behaviour: assets/js/shop-beast.js
add_action( 'wp_enqueue_scripts', 'superfly_shop_beast_assets', 22 );
function superfly_shop_beast_assets() {
	if ( ! function_exists( 'is_woocommerce' ) || ! is_woocommerce() ) {
		return;
	}

	wp_enqueue_style(
		'superfly-shop-beast',
		get_stylesheet_directory_uri() . '/assets/css/shop-beast.css',
		array( 'superfly-shop' ),
		filemtime( get_stylesheet_directory() . '/assets/css/shop-beast.css' )
	);

	if ( is_product() ) {
		wp_enqueue_script(
			'superfly-shop-beast',
			get_stylesheet_directory_uri() . '/assets/js/shop-beast.js',
			array( 'jquery', 'wc-add-to-cart-variation' ),
			filemtime( get_stylesheet_directory() . '/assets/js/shop-beast.js' ),
			true
		);
	}
}


// The scrollbar — a pink rail instead of the grey Windows bar with arrows.
// Site-wide, on every page. Looks: assets/css/scrollbar.css
add_action( 'wp_enqueue_scripts', 'superfly_scrollbar_assets', 5 );
function superfly_scrollbar_assets() {
	wp_enqueue_style(
		'superfly-scrollbar',
		get_stylesheet_directory_uri() . '/assets/css/scrollbar.css',
		array(),
		filemtime( get_stylesheet_directory() . '/assets/css/scrollbar.css' )
	);
}


// The greeting above the account rail — the customer's initial and name.
// It needs the logged-in user, so it cannot come from the stylesheet or
// from account.js. Looks: assets/css/account.css (.sf-acc-who)
add_action( 'woocommerce_before_account_navigation', 'superfly_account_greeting' );
function superfly_account_greeting() {
	$user = wp_get_current_user();

	if ( ! $user || ! $user->ID ) {
		return;
	}

	$name    = $user->display_name ? $user->display_name : $user->user_login;
	$initial = strtoupper( mb_substr( $name, 0, 1 ) );

	echo '<div class="sf-acc-who">';
	echo '<span class="sf-acc-initial" aria-hidden="true">' . esc_html( $initial ) . '</span>';
	echo '<span><strong>' . sprintf(
		/* translators: %s: the customer's name */
		esc_html__( 'Hi, %s', 'twentytwentyfour-child' ),
		esc_html( $name )
	) . '</strong>';
	echo '<em>' . esc_html__( 'My account', 'twentytwentyfour-child' ) . '</em></span>';
	echo '</div>';
}

// ---------------------------------------------------------------
// WISHLIST — /my-account/wishlist/
//
// ShopEngine prints a four-column table there: one empty column,
// product names squeezed into a strip so narrow they wrap a word a
// line, and no way to buy anything. This puts a grid in its place —
// six products a page, a toolbar above, a pager below — so the page
// is the same height whether a customer saved three or fifty.
//
// The plugin is NOT modified. Its screen is unhooked and this one
// put on the same action, so a ShopEngine update cannot overwrite
// the design; delete these functions and the table comes back.
//
// Looks: assets/css/wishlist.css · removing: assets/js/wishlist.js
// ---------------------------------------------------------------
define( 'SUPERFLY_WISHLIST_PER_PAGE', 6 );

add_action( 'wp', 'superfly_wishlist_takeover' );
function superfly_wishlist_takeover() {
	if ( ! class_exists( '\ShopEngine\Modules\Wishlist\Wishlist' ) ) {
		return;                         // plugin gone: leave the endpoint alone
	}

	$module = \ShopEngine\Modules\Wishlist\Wishlist::instance();

	remove_action( 'woocommerce_account_wishlist_endpoint', array( $module, 'wishlist_content' ) );
	add_action( 'woocommerce_account_wishlist_endpoint', 'superfly_wishlist_content' );
}

/**
 * Where ShopEngine keeps the saved list.
 *
 * Read from the plugin's own constant when it is there, so a rename
 * in a future version follows automatically.
 *
 * @return string The user-meta key.
 */
function superfly_wishlist_meta_key() {
	if ( class_exists( '\ShopEngine\Modules\Wishlist\Wishlist' ) ) {
		return \ShopEngine\Modules\Wishlist\Wishlist::UMK_WISHLIST;
	}

	return 'shopengine_wishlist';
}

/**
 * The saved products, as WC_Product objects.
 *
 * The list itself stays the plugin's user meta — this only reads it.
 * Anything deleted or unpublished since it was saved is dropped
 * rather than shown as a gap.
 *
 * @return WC_Product[]
 */
function superfly_wishlist_get_products() {
	$saved = get_user_meta( get_current_user_id(), superfly_wishlist_meta_key(), true );

	if ( ! is_array( $saved ) || ! $saved ) {
		return array();
	}

	$products = array();

	foreach ( $saved as $id ) {
		$product = wc_get_product( absint( $id ) );

		if ( $product && 'publish' === $product->get_status() ) {
			$products[] = $product;
		}
	}

	return $products;
}

function superfly_wishlist_content() {
	$products = superfly_wishlist_get_products();
	$total    = count( $products );

	if ( ! $total ) {
		echo '<div class="wl-empty">';
		echo '<h2>' . esc_html__( 'Nothing saved yet', 'twentytwentyfour-child' ) . '</h2>';
		echo '<p>' . esc_html__( 'Tap the heart on any product and it waits for you here.', 'twentytwentyfour-child' ) . '</p>';
		echo '<a class="wl-buy" href="' . esc_url( wc_get_page_permalink( 'shop' ) ) . '">'
			. esc_html__( 'Browse the shop', 'twentytwentyfour-child' ) . '</a>';
		echo '</div>';

		return;
	}

	$per   = max( 1, (int) SUPERFLY_WISHLIST_PER_PAGE );
	$pages = (int) ceil( $total / $per );

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- reading a page number, not acting on it
	$page  = isset( $_GET['wl-page'] ) ? absint( wp_unslash( $_GET['wl-page'] ) ) : 1;
	$page  = min( max( 1, $page ), $pages );
	$slice = array_slice( $products, ( $page - 1 ) * $per, $per );

	$base  = wc_get_endpoint_url( 'wishlist', '', wc_get_page_permalink( 'myaccount' ) );
	$nonce = wp_create_nonce( 'superfly-wishlist' );

	// ---- the toolbar ----
	echo '<div class="wl-bar">';
	echo '<p><b>' . esc_html( number_format_i18n( $total ) ) . '</b> '
		. esc_html( _n( 'saved', 'saved', $total, 'twentytwentyfour-child' ) ) . '</p>';
	echo '<span class="wl-bar__acts">';
	echo '<a class="wl-buy" href="' . esc_url( add_query_arg(
		array(
			'wl-do'    => 'addall',
			'_wpnonce' => $nonce,
		),
		$base
	) ) . '">' . esc_html__( 'Add all to cart', 'twentytwentyfour-child' ) . '</a>';
	echo '<a class="wl-ghost" href="' . esc_url( add_query_arg(
		array(
			'wl-do'    => 'clear',
			'_wpnonce' => $nonce,
		),
		$base
	) ) . '">' . esc_html__( 'Clear list', 'twentytwentyfour-child' ) . '</a>';
	echo '</span></div>';

	// ---- the grid ----
	echo '<ul class="wl-grid">';

	foreach ( $slice as $product ) {
		$id   = $product->get_id();
		$link = $product->get_permalink();

		echo '<li class="wl-item">';

		echo '<a class="wl-item__shot" href="' . esc_url( $link ) . '">'
			. wp_kses_post( $product->get_image( 'woocommerce_thumbnail' ) ) . '</a>';

		echo '<div class="wl-item__over">';
		superfly_wishlist_button( $product );
		echo '<button class="wl-x" type="button" data-pid="' . esc_attr( $id ) . '" aria-label="'
			. esc_attr__( 'Remove from wishlist', 'twentytwentyfour-child' ) . '">&times;</button>';
		echo '</div>';

		echo '<a class="wl-item__name" href="' . esc_url( $link ) . '">'
			. esc_html( $product->get_name() ) . '</a>';

		echo '<p class="wl-item__price">' . wp_kses_post( $product->get_price_html() ) . '</p>';

		if ( $product->is_in_stock() ) {
			echo '<p class="wl-stock"><i></i>' . esc_html__( 'In stock', 'twentytwentyfour-child' ) . '</p>';
		} else {
			echo '<p class="wl-stock wl-stock--off"><i></i>' . esc_html__( 'Out of stock', 'twentytwentyfour-child' ) . '</p>';
		}

		echo '</li>';
	}

	echo '</ul>';

	// ---- the pager ----
	if ( $pages > 1 ) {
		echo '<nav class="wl-pg" aria-label="' . esc_attr__( 'Wishlist pages', 'twentytwentyfour-child' ) . '">';

		for ( $i = 1; $i <= $pages; $i++ ) {
			if ( $i === $page ) {
				echo '<span class="wl-pg__b is-on" aria-current="page">' . esc_html( $i ) . '</span>';
				continue;
			}

			echo '<a href="' . esc_url( add_query_arg( 'wl-page', $i, $base ) ) . '">' . esc_html( $i ) . '</a>';
		}

		echo '<span class="wl-pg__n">' . esc_html( sprintf(
			/* translators: 1: products on this page, 2: products saved in total */
			__( 'Showing %1$d of %2$d', 'twentytwentyfour-child' ),
			count( $slice ),
			$total
		) ) . '</span>';

		echo '</nav>';
	}
}

/**
 * The buy button for one saved product.
 *
 * A variable product cannot go into the cart from here — a size or a
 * colour has to be picked first — so it gets a link to the product
 * page instead. Simple products use WooCommerce's own AJAX button,
 * so the cart count in the header updates without a page load.
 *
 * @param WC_Product $product The product.
 */
function superfly_wishlist_button( $product ) {
	if ( ! $product->is_in_stock() ) {
		echo '<span class="wl-buy wl-buy--off">' . esc_html__( 'Out of stock', 'twentytwentyfour-child' ) . '</span>';

		return;
	}

	$simple = $product->is_type( 'simple' ) && $product->is_purchasable();

	if ( ! $simple ) {
		echo '<a class="wl-buy wl-buy--opts" href="' . esc_url( $product->get_permalink() ) . '">'
			. esc_html__( 'Choose options', 'twentytwentyfour-child' ) . '</a>';

		return;
	}

	echo '<a class="wl-buy add_to_cart_button ajax_add_to_cart" rel="nofollow"'
		. ' href="' . esc_url( $product->add_to_cart_url() ) . '"'
		. ' data-quantity="1"'
		. ' data-product_id="' . esc_attr( $product->get_id() ) . '">'
		. esc_html__( 'Add to cart', 'twentytwentyfour-child' ) . '</a>';
}

/**
 * Add all to cart / Clear list.
 *
 * Both act only on the signed-in customer's own list and both need
 * the nonce printed with the toolbar. Variable products are skipped
 * by "Add all" for the same reason they have no cart button.
 */
add_action( 'template_redirect', 'superfly_wishlist_actions' );
function superfly_wishlist_actions() {
	if ( ! function_exists( 'is_account_page' ) || ! is_account_page() || ! is_user_logged_in() ) {
		return;
	}

	if ( empty( $_GET['wl-do'] ) || empty( $_GET['_wpnonce'] ) ) {
		return;
	}

	if ( ! wp_verify_nonce( sanitize_key( wp_unslash( $_GET['_wpnonce'] ) ), 'superfly-wishlist' ) ) {
		return;
	}

	$do   = sanitize_key( wp_unslash( $_GET['wl-do'] ) );
	$back = wc_get_endpoint_url( 'wishlist', '', wc_get_page_permalink( 'myaccount' ) );

	if ( 'clear' === $do ) {
		delete_user_meta( get_current_user_id(), superfly_wishlist_meta_key() );
		wc_add_notice( __( 'Your wishlist is empty again.', 'twentytwentyfour-child' ) );

		wp_safe_redirect( $back );
		exit;
	}

	if ( 'addall' !== $do ) {
		return;
	}

	$added   = 0;
	$skipped = 0;

	foreach ( superfly_wishlist_get_products() as $product ) {
		if ( ! $product->is_in_stock() || ! $product->is_purchasable() || ! $product->is_type( 'simple' ) ) {
			$skipped++;
			continue;
		}

		if ( WC()->cart->add_to_cart( $product->get_id() ) ) {
			$added++;
		}
	}

	if ( $added ) {
		wc_add_notice( sprintf(
			/* translators: %d: how many products went into the cart */
			_n( '%d product added to your cart.', '%d products added to your cart.', $added, 'twentytwentyfour-child' ),
			$added
		) );
	}

	if ( $skipped ) {
		wc_add_notice( sprintf(
			/* translators: %d: how many products need options picking first */
			_n(
				'%d product needs its options picked first — open it to choose.',
				'%d products need their options picked first — open them to choose.',
				$skipped,
				'twentytwentyfour-child'
			),
			$skipped
		), 'notice' );
	}

	wp_safe_redirect( $back );
	exit;
}


// The wishlist grid's styles, and the script that removes a product.
// Only on /my-account/wishlist/ — no other page uses either.
add_action( 'wp_enqueue_scripts', 'superfly_wishlist_assets', 23 );
function superfly_wishlist_assets() {
	if ( ! function_exists( 'is_wc_endpoint_url' ) || ! is_wc_endpoint_url( 'wishlist' ) ) {
		return;
	}

	wp_enqueue_style(
		'superfly-wishlist',
		get_stylesheet_directory_uri() . '/assets/css/wishlist.css',
		array( 'superfly-account' ),
		filemtime( get_stylesheet_directory() . '/assets/css/wishlist.css' )
	);

	// depends on ShopEngine's script for the REST url and the nonce
	wp_enqueue_script(
		'superfly-wishlist',
		get_stylesheet_directory_uri() . '/assets/js/wishlist.js',
		array( 'shopengine-wishlist' ),
		filemtime( get_stylesheet_directory() . '/assets/js/wishlist.js' ),
		true
	);
}


// ---------------------------------------------------------------
// NEWSLETTER SIGN-UP (footer)
//
// There is no mailing-list plugin on this site, so a form that only
// looked the part would take an address and drop it. This keeps the
// addresses in WordPress instead: each one becomes a private
// "Subscriber" entry in wp-admin and an email goes to the shop.
//
// It is a holding pen, not a mailing list — it cannot send a
// campaign and it has no unsubscribe link. When a provider is
// chosen (Mailchimp, Brevo, MailerLite…), point superfly_subscribe()
// at their API and export what has gathered here.
//
// Form markup: parts/footer.html · looks: assets/css/footer.css
// ---------------------------------------------------------------
add_action( 'init', 'superfly_subscriber_type' );
function superfly_subscriber_type() {
	register_post_type(
		'sf_subscriber',
		array(
			'labels'          => array(
				'name'          => __( 'Subscribers', 'twentytwentyfour-child' ),
				'singular_name' => __( 'Subscriber', 'twentytwentyfour-child' ),
				'menu_name'     => __( 'Subscribers', 'twentytwentyfour-child' ),
			),
			'public'          => false,      // never a page on the front of the site
			'show_ui'         => true,       // but visible in wp-admin
			'show_in_menu'    => true,
			'menu_icon'       => 'dashicons-email',
			'menu_position'   => 26,
			'capability_type' => 'post',
			'capabilities'    => array( 'create_posts' => 'do_not_allow' ),
			'map_meta_cap'    => true,
			'supports'        => array( 'title' ),
			'has_archive'     => false,
			'rewrite'         => false,
			'exclude_from_search' => true,
		)
	);
}

add_action( 'admin_post_nopriv_sf_subscribe', 'superfly_subscribe' );
add_action( 'admin_post_sf_subscribe', 'superfly_subscribe' );
function superfly_subscribe() {
	$back = wp_get_referer();

	if ( ! empty( $_POST['sf_from'] ) ) {
		$from = esc_url_raw( wp_unslash( $_POST['sf_from'] ) );

		// only ever return to this site
		if ( $from && wp_parse_url( $from, PHP_URL_HOST ) === wp_parse_url( home_url(), PHP_URL_HOST ) ) {
			$back = $from;
		}
	}

	if ( ! $back ) {
		$back = home_url( '/' );
	}

	// the honeypot is invisible to people; anything in it is a bot, and
	// it is sent on its way without a hint that it was spotted
	if ( ! empty( $_POST['sf_website'] ) ) {
		superfly_subscribe_back( $back, 'ok' );
	}

	$email = isset( $_POST['sf_email'] ) ? sanitize_email( wp_unslash( $_POST['sf_email'] ) ) : '';

	if ( ! $email || ! is_email( $email ) ) {
		superfly_subscribe_back( $back, 'bad' );
	}

	// a soft limit, so one machine cannot fill the list
	$key  = 'sf_sub_' . md5( isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '' );
	$hits = (int) get_transient( $key );

	if ( $hits >= 5 ) {
		superfly_subscribe_back( $back, 'slow' );
	}

	set_transient( $key, $hits + 1, HOUR_IN_SECONDS );

	// already on the list?
	$seen = get_posts(
		array(
			'post_type'      => 'sf_subscriber',
			'title'          => $email,
			'post_status'    => 'any',
			'posts_per_page' => 1,
			'fields'         => 'ids',
		)
	);

	if ( $seen ) {
		superfly_subscribe_back( $back, 'dupe' );
	}

	$id = wp_insert_post(
		array(
			'post_type'   => 'sf_subscriber',
			'post_title'  => $email,
			'post_status' => 'publish',
		),
		true
	);

	if ( is_wp_error( $id ) ) {
		superfly_subscribe_back( $back, 'bad' );
	}

	wp_mail(
		get_option( 'admin_email' ),
		__( 'Superfly — new newsletter sign-up', 'twentytwentyfour-child' ),
		sprintf(
			/* translators: 1: the email address, 2: the page it was sent from */
			__( "%1\$s signed up for the newsletter.\n\nFrom: %2\$s\n\nThe full list is under Subscribers in wp-admin.", 'twentytwentyfour-child' ),
			$email,
			$back
		)
	);

	superfly_subscribe_back( $back, 'ok' );
}

/**
 * Send them back to the page they were on, carrying the outcome.
 *
 * @param string $back  Where to return to.
 * @param string $state ok | dupe | bad | slow.
 */
function superfly_subscribe_back( $back, $state ) {
	wp_safe_redirect( add_query_arg( 'sf-sub', $state, $back ) . '#sf-subscribe' );
	exit;
}


// Privacy policy (page 3) — the policy as numbered rows that open one at
// a time. The rows are <details> elements, so they work with the script
// off; privacy.js only adds "Expand all".
// Markup: the page's own wp:html block · looks: assets/css/privacy.css
add_action( 'wp_enqueue_scripts', 'superfly_privacy_assets', 24 );
function superfly_privacy_assets() {
	if ( ! is_page( 'privacy-policy' ) ) {
		return;
	}

	// Same fonts as the rest of the site: Archivo Black, Archivo, Chakra Petch
	wp_enqueue_style(
		'superfly-hero-fonts',
		'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;800&family=Archivo+Black&family=Chakra+Petch:wght@500;600;700&display=swap',
		array(),
		null
	);

	wp_enqueue_style(
		'superfly-privacy',
		get_stylesheet_directory_uri() . '/assets/css/privacy.css',
		array( 'superfly-child-style', 'superfly-hero-fonts' ),
		filemtime( get_stylesheet_directory() . '/assets/css/privacy.css' )
	);

	wp_enqueue_script(
		'superfly-privacy',
		get_stylesheet_directory_uri() . '/assets/js/privacy.js',
		array(),
		filemtime( get_stylesheet_directory() . '/assets/js/privacy.js' ),
		true
	);
}


// Return & Refund policy (page 11) — four numbered steps saying how a return
// works, then the conditions sorted into refundable and not, then the live
// store's binding paragraph in full, then the return address. Nothing folds
// and there is no script on the page.
// Matched on the slug, like the FAQ and contact, so the page can be rebuilt.
// Markup: an ELEMENTOR HTML widget (_elementor_edit_mode is `builder` on this
// page), so post_content is NOT what renders and a REST write to `content`
// changes nothing a visitor sees. The markup is in _elementor_data, and
// Elementor caches the rendered widget — clear it with wp-cli after an edit.
// See wordpress/return-refund/README.md. The comment here said wp:html until
// 2026-09-29; it was wrong.
// Looks: assets/css/return-refund.css
//
// This page used privacy.css and privacy.js until 2026-09-29 — the two policy
// pages were one design. They are not any more: this one opens like the FAQ
// (a customer arrives here mid-problem) rather than like a legal document.
// privacy.js went with it; there is nothing left on this page to expand.
//
// The function itself was recovered from the live server on 2026-09-28: it had
// been added directly on superfly.durianbikers.com and never committed here,
// so deploying the repo copy of functions.php would have deleted it and
// unstyled the page. Keep it committed.
add_action( 'wp_enqueue_scripts', 'superfly_return_refund_assets', 24 );
function superfly_return_refund_assets() {
	if ( ! is_page( 'return-refund' ) ) {
		return;
	}

	// Same fonts as the rest of the site: Archivo Black, Archivo, Chakra Petch
	wp_enqueue_style(
		'superfly-hero-fonts',
		'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;800&family=Archivo+Black&family=Chakra+Petch:wght@500;600;700&display=swap',
		array(),
		null
	);

	wp_enqueue_style(
		'superfly-return-refund',
		get_stylesheet_directory_uri() . '/assets/css/return-refund.css',
		array( 'superfly-child-style', 'superfly-hero-fonts' ),
		filemtime( get_stylesheet_directory() . '/assets/css/return-refund.css' )
	);
}


// The body class return-refund.css hangs the carbon-weave background off.
// privacy.css used body.page-id-11 for this, which is brittle: recreate the
// page and the id changes and the background silently goes away. Same idea as
// superfly_faq_body_class, without the id.
add_filter( 'body_class', 'superfly_return_refund_body_class' );
function superfly_return_refund_body_class( $classes ) {
	if ( is_page( 'return-refund' ) ) {
		$classes[] = 'superfly-return-page';
	}

	return $classes;
}


// Terms & conditions (page 128) — the agreement as a two-column grid of
// hard-edged panels in the hero's own language. Everything is open: no
// <details>, no script, so the binding text stays searchable and printable.
// Matched on the page id, not the slug: WordPress gives the privacy page a
// `privacy-policy` body class of its own, but there is no equivalent here.
// Markup: the page's Elementor HTML widget · looks: assets/css/terms.css
add_action( 'wp_enqueue_scripts', 'superfly_terms_assets', 26 );
function superfly_terms_assets() {
	if ( ! is_page( 128 ) ) {
		return;
	}

	// Same fonts as the rest of the site: Archivo Black, Archivo, Chakra Petch
	wp_enqueue_style(
		'superfly-hero-fonts',
		'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;800&family=Archivo+Black&family=Chakra+Petch:wght@500;600;700&display=swap',
		array(),
		null
	);

	wp_enqueue_style(
		'superfly-terms',
		get_stylesheet_directory_uri() . '/assets/css/terms.css',
		array( 'superfly-child-style', 'superfly-hero-fonts' ),
		filemtime( get_stylesheet_directory() . '/assets/css/terms.css' )
	);

	// The clause rows rise into place as they are scrolled to. The script is
	// what HIDES them — they are visible without it — so a blocked or failed
	// script leaves the binding text on the page rather than swallowing it.
	// See the header of terms.js. Loaded in the footer, so it never delays
	// the text it is animating.
	wp_enqueue_script(
		'superfly-terms',
		get_stylesheet_directory_uri() . '/assets/js/terms.js',
		array(),
		filemtime( get_stylesheet_directory() . '/assets/js/terms.js' ),
		true
	);
}


// Frequently asked questions — eight questions as hard-edged panels, each
// with its number on a skewed magenta tab, matching the terms clauses. The
// answers fold: they are native <details>, so there is no script on this
// page at all.
// Matched on the slug, not the page id: unlike terms there is nothing tying
// this to a particular post, so the page can be deleted and rebuilt without
// breaking its styling.
// Markup: the page's own wp:html block, like privacy — not an Elementor
// widget, so there is no render cache to clear after an edit.
// Looks: assets/css/faq.css
add_action( 'wp_enqueue_scripts', 'superfly_faq_assets', 27 );
function superfly_faq_assets() {
	if ( ! is_page( 'faq' ) ) {
		return;
	}

	// Same fonts as the rest of the site: Archivo Black, Archivo, Chakra Petch
	wp_enqueue_style(
		'superfly-hero-fonts',
		'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;800&family=Archivo+Black&family=Chakra+Petch:wght@500;600;700&display=swap',
		array(),
		null
	);

	wp_enqueue_style(
		'superfly-faq',
		get_stylesheet_directory_uri() . '/assets/css/faq.css',
		array( 'superfly-child-style', 'superfly-hero-fonts' ),
		filemtime( get_stylesheet_directory() . '/assets/css/faq.css' )
	);
}


// The body class faq.css hangs the carbon-weave background off. WordPress
// gives the privacy page a `privacy-policy` class of its own because that
// page is designated in Settings → Privacy, and the terms page had to fall
// back to `page-id-128`; this is the same idea without the id.
add_filter( 'body_class', 'superfly_faq_body_class' );
function superfly_faq_body_class( $classes ) {
	if ( is_page( 'faq' ) ) {
		$classes[] = 'superfly-faq-page';
	}

	return $classes;
}


// Page not found — a dial with the needle past the end of the sweep.
// The template is templates/404.html in this theme, which WordPress picks
// up on its own; there is no page to create and no page builder involved.
// Looks: assets/css/404.css
add_action( 'wp_enqueue_scripts', 'superfly_not_found_assets', 25 );
function superfly_not_found_assets() {
	if ( ! is_404() ) {
		return;
	}

	// Same fonts as the rest of the site: Archivo Black, Archivo, Chakra Petch
	wp_enqueue_style(
		'superfly-hero-fonts',
		'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;800&family=Archivo+Black&family=Chakra+Petch:wght@500;600;700&display=swap',
		array(),
		null
	);

	wp_enqueue_style(
		'superfly-not-found',
		get_stylesheet_directory_uri() . '/assets/css/404.css',
		array( 'superfly-child-style', 'superfly-hero-fonts' ),
		filemtime( get_stylesheet_directory() . '/assets/css/404.css' )
	);
}

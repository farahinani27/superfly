<?php
/**
 * My Account dashboard — Superfly
 *
 * Replaces WooCommerce's paragraph of links with three cards: the last
 * order, where it ships to, and the account details. Everything shown is
 * the customer's own data; nothing is invented, and each card disappears
 * if there is nothing to put in it.
 *
 * Overrides woocommerce/templates/myaccount/dashboard.php.
 * Looks: assets/css/account.css
 *
 * @package twentytwentyfour-child
 */

defined( 'ABSPATH' ) || exit;

$sf_user     = wp_get_current_user();
$sf_customer = new WC_Customer( get_current_user_id() );

// the most recent order, if there is one
$sf_orders = wc_get_orders(
	array(
		'customer_id' => get_current_user_id(),
		'limit'       => 1,
		'orderby'     => 'date',
		'order'       => 'DESC',
	)
);
$sf_order = $sf_orders ? $sf_orders[0] : null;

$sf_shipping = $sf_customer->get_shipping_address_1() ? wc_get_account_formatted_address( 'shipping' ) : '';
?>

<p class="sf-acc__label"><?php esc_html_e( 'At a glance', 'twentytwentyfour-child' ); ?></p>

<div class="sf-acc__cards">

	<a class="sf-acc__card" href="<?php echo esc_url( wc_get_endpoint_url( 'orders' ) ); ?>">
		<h3><?php esc_html_e( 'Last order', 'twentytwentyfour-child' ); ?></h3>
		<?php if ( $sf_order ) : ?>
			<b>#<?php echo esc_html( $sf_order->get_order_number() ); ?></b>
			<p>
				<?php echo esc_html( wc_format_datetime( $sf_order->get_date_created() ) ); ?> &middot;
				<?php echo esc_html( wc_get_order_status_name( $sf_order->get_status() ) ); ?> &middot;
				<?php echo wp_kses_post( $sf_order->get_formatted_order_total() ); ?>
			</p>
		<?php else : ?>
			<p><?php esc_html_e( 'No orders yet. Everything you buy shows up here.', 'twentytwentyfour-child' ); ?></p>
		<?php endif; ?>
	</a>

	<a class="sf-acc__card" href="<?php echo esc_url( wc_get_endpoint_url( 'edit-address' ) ); ?>">
		<h3><?php esc_html_e( 'Shipping to', 'twentytwentyfour-child' ); ?></h3>
		<?php if ( $sf_shipping ) : ?>
			<p><?php echo wp_kses_post( $sf_shipping ); ?></p>
		<?php else : ?>
			<p><?php esc_html_e( 'No shipping address saved yet — add one and checkout gets quicker.', 'twentytwentyfour-child' ); ?></p>
		<?php endif; ?>
	</a>

	<a class="sf-acc__card" href="<?php echo esc_url( wc_get_endpoint_url( 'edit-account' ) ); ?>">
		<h3><?php esc_html_e( 'Account', 'twentytwentyfour-child' ); ?></h3>
		<b><?php echo esc_html( $sf_user->display_name ); ?></b>
		<p><?php echo esc_html( $sf_user->user_email ); ?></p>
	</a>

</div>

<?php
/**
 * WooCommerce fires this so other plugins can add to the dashboard —
 * leave it in place.
 *
 * @since 2.6.0
 */
do_action( 'woocommerce_account_dashboard' );

do_action( 'woocommerce_before_my_account' );
do_action( 'woocommerce_after_my_account' );

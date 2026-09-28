/* =============================================================
 * SUPERFLY — SHOP BY CATEGORY (movement)
 * -------------------------------------------------------------
 * Looks: assets/css/categories.css. This file only moves things.
 *
 *   1. Scroll in   when the section scrolls into view: the heading
 *                  rises, then the cards wipe in one by one on a
 *                  slant (like the loading screen) and their pink
 *                  stripes draw across
 *   2. 3D tilt     on computers, a card leans gently towards the
 *                  mouse while you point at it
 *
 * Uses GSAP + ScrollTrigger (already loaded on Superfly). Without
 * them, or with "reduce motion" on, everything simply shows.
 * ============================================================= */

document.addEventListener('DOMContentLoaded', function () {
	var section = document.querySelector('.sf-cats');

	if (!section || typeof window.gsap === 'undefined') {
		return;
	}

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return;
	}

	if (window.ScrollTrigger) {
		gsap.registerPlugin(ScrollTrigger);
		scrollIn(section);
	}

	if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
		tiltCards(section);
	}
});


/* -------------------------------------------------------------
 * 1. SCROLL IN
 * ------------------------------------------------------------- */
function scrollIn(section) {
	var cards = section.querySelectorAll('.sf-cat');

	gsap.timeline({
		scrollTrigger: { trigger: section, start: 'top 75%', once: true },
		defaults: { ease: 'power4.out' }
	})
		.from(section.querySelectorAll('.sf-cats__eyebrow, .sf-cats__title, .sf-cats__all'), {
			y: 30, opacity: 0, duration: 0.8, stagger: 0.08
		}, 0)
		// each card is revealed by a slanted wipe from left to right
		.fromTo(cards,
			{ clipPath: 'polygon(0% 0%, 0% 0%, -12% 100%, -12% 100%)', y: 40 },
			{ clipPath: 'polygon(0% 0%, 112% 0%, 100% 100%, -12% 100%)', y: 0, duration: 1.1, stagger: 0.14 },
			0.2)
		.from(section.querySelectorAll('.sf-cat__stripe'), {
			scaleX: 0, transformOrigin: 'left', duration: 0.9, stagger: 0.14, ease: 'power3.inOut'
		}, 0.6)
		// the clip-path is only for the entrance — remove it afterwards
		.add(function () { gsap.set(cards, { clearProps: 'clipPath' }); });
}


/* -------------------------------------------------------------
 * 2. 3D TILT
 * The banner leans up to 6° towards the mouse and eases back flat
 * when the mouse leaves. gsap.quickTo keeps it smooth.
 * ------------------------------------------------------------- */
function tiltCards(section) {
	var MAX = 6; // degrees

	section.querySelectorAll('.sf-cat__link').forEach(function (link) {
		var media = link.querySelector('.sf-cat__media');

		if (!media) {
			return;
		}

		var turnY = gsap.quickTo(media, 'rotationY', { duration: 0.6, ease: 'power3.out' });
		var turnX = gsap.quickTo(media, 'rotationX', { duration: 0.6, ease: 'power3.out' });

		link.addEventListener('mousemove', function (event) {
			var box = media.getBoundingClientRect();
			var x = (event.clientX - box.left) / box.width - 0.5;   // -0.5 … 0.5
			var y = (event.clientY - box.top) / box.height - 0.5;
			turnY(x * MAX * 2);
			turnX(-y * MAX * 2);
		});

		link.addEventListener('mouseleave', function () {
			turnY(0);
			turnX(0);
		});
	});
}

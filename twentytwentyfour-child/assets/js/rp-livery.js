/* =============================================================
 * SUPERFLY — PROJECT RP: LIVERY (movement)
 * -------------------------------------------------------------
 * Looks: assets/css/rp-livery.css.
 *
 *   1. Scroll in      the film slides in from the right, the title
 *                     letters fly in one by one
 *   1b. Pit board     one spec at a time, huge; its letters fly in,
 *                     the next one takes over every few seconds (a
 *                     pink bar under the tab counts down). Hover to
 *                     pause, click a tab to jump. Bore numbers roll up.
 *   2. Drift          the film drifts slightly slower than the page
 *   3. Sound cursor   a pink "SOUND" circle follows the mouse over
 *                     the film
 *   4. Muted film     the YouTube film plays muted + looping as the
 *                     film's picture — shown only once YouTube says
 *                     it's playing (else the cover picture stays)
 *   5. With sound     clicking the film (or "Watch with sound")
 *                     opens the full film with sound in a pop-up
 *
 * Uses GSAP + ScrollTrigger for 1–3 (already loaded on Superfly);
 * the film and the pop-up work without them.
 * ============================================================= */

document.addEventListener('DOMContentLoaded', function () {
	var section = document.querySelector('.sf-livery');

	if (!section) {
		return;
	}

	var id = section.getAttribute('data-video');
	var film = section.querySelector('.sf-livery__film');
	var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	if (!calm && window.gsap && window.ScrollTrigger) {
		gsap.registerPlugin(ScrollTrigger);
		scrollIn(section);
		drift(section);
	}

	pitBoard(section, !calm && !!window.gsap && !!window.ScrollTrigger);

	if (!calm && window.gsap && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
		soundCursor(film);
	}

	if (!calm) {
		mutedFilm(section, id);
	}

	withSound(section, id);
});


/* -------------------------------------------------------------
 * Helper: wrap every letter of an element in its own <span> so the
 * letters can move one by one. Inner elements (like the pink "/" or a
 * number that counts up) are kept whole and move as one piece.
 * ------------------------------------------------------------- */
function splitLetters(el) {
	var pieces = [];

	Array.prototype.slice.call(el.childNodes).forEach(function (node) {
		if (node.nodeType === 3) {
			var frag = document.createDocumentFragment();
			node.textContent.split('').forEach(function (ch) {
				if (ch === ' ' || ch === '\n' || ch === '\t') {
					frag.appendChild(document.createTextNode(ch === ' ' ? ' ' : ''));
					return;
				}
				var span = document.createElement('span');
				span.className = 'sf-livery__char';
				span.textContent = ch;
				frag.appendChild(span);
				pieces.push(span);
			});
			el.replaceChild(frag, node);
		} else if (node.nodeType === 1 && node.tagName !== 'BR') {
			node.classList.add('sf-livery__char');
			pieces.push(node);
		}
	});

	return pieces;
}


/* -------------------------------------------------------------
 * 1. SCROLL IN
 * ------------------------------------------------------------- */
function scrollIn(section) {
	var title = section.querySelector('.sf-livery__title');
	var letters = title ? splitLetters(title) : [];

	gsap.timeline({
		scrollTrigger: { trigger: section, start: 'top 70%', once: true },
		defaults: { ease: 'power4.out' }
	})
		.from(section.querySelector('.sf-livery__film'), { xPercent: 25, opacity: 0, duration: 1.3 }, 0)
		.from(section.querySelector('.sf-livery__eyebrow'), { y: 20, opacity: 0, duration: 0.7 }, 0.1)
		.from(letters, { yPercent: 110, xPercent: -30, opacity: 0, duration: 0.8, stagger: 0.025 }, 0.15)
		.from(section.querySelectorAll('.sf-livery__tab'), { y: 16, opacity: 0, duration: 0.6, stagger: 0.07 }, 0.5)
		.from(section.querySelector('.sf-livery__buttons'), { y: 20, opacity: 0, duration: 0.7 }, 0.8);
}


/* -------------------------------------------------------------
 * 1b. PIT BOARD — one spec at a time, changing by itself
 * ------------------------------------------------------------- */
function pitBoard(section, animate) {
	var DURATION = 3.6;   // seconds each spec stays before the next one

	var tabs = Array.prototype.slice.call(section.querySelectorAll('.sf-livery__tab'));
	var slides = Array.prototype.slice.call(section.querySelectorAll('.sf-livery__slide'));
	var board = section.querySelector('.sf-livery__board');

	if (!tabs.length || tabs.length !== slides.length) {
		return;
	}

	var current = 0;
	var timer = null;
	var inView = false;
	var hovered = false;

	// split each big value into letters once, up front
	var letters = slides.map(function (slide) {
		var big = slide.querySelector('.sf-livery__big');
		return animate && big ? splitLetters(big) : [];
	});

	function markTabs(index) {
		tabs.forEach(function (tab, i) {
			tab.classList.toggle('is-active', i === index);
			tab.setAttribute('aria-selected', i === index ? 'true' : 'false');
			// tabs already shown stay full, the ones still to come are empty
			tab.style.setProperty('--sf-livery-p', i < index ? 1 : 0);
		});
	}

	function countUp(slide) {
		slide.querySelectorAll('[data-count]').forEach(function (el) {
			var target = Number(el.getAttribute('data-count'));
			var n = { v: 0 };
			gsap.to(n, { v: target, duration: 0.9, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(n.v); } });
		});
	}

	function startTimer() {
		if (!animate) {
			return;
		}
		if (timer) {
			timer.kill();
		}
		timer = gsap.fromTo(tabs[current], { '--sf-livery-p': 0 }, {
			'--sf-livery-p': 1,
			duration: DURATION,
			ease: 'none',
			paused: !inView || hovered,
			onComplete: function () { show((current + 1) % slides.length); }
		});
	}

	function show(index) {
		if (index === current) {
			startTimer();
			return;
		}

		var from = slides[current];
		var to = slides[index];
		var fromLetters = letters[current];
		var toLetters = letters[index];
		current = index;
		markTabs(index);

		if (!animate) {
			from.hidden = true;
			to.hidden = false;
			return;
		}

		// old value flies up and out, letter by letter
		gsap.to(fromLetters, {
			yPercent: -120, opacity: 0, duration: 0.45, stagger: 0.02, ease: 'power3.in',
			onComplete: function () { from.hidden = true; }
		});
		gsap.to(from.querySelector('.sf-livery__note'), { opacity: 0, duration: 0.3 });

		// new value flies in from below, letter by letter
		to.hidden = false;
		gsap.fromTo(toLetters, { yPercent: 120, opacity: 0 }, {
			yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.035, ease: 'power4.out', delay: 0.25
		});
		gsap.fromTo(to.querySelector('.sf-livery__note'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.55 });
		countUp(to);

		startTimer();
	}

	// click a tab to jump to it
	tabs.forEach(function (tab, i) {
		tab.addEventListener('click', function () { show(i); });
	});

	if (!animate) {
		return;
	}

	// pause while the mouse is on the board
	board.addEventListener('mouseenter', function () { hovered = true; if (timer) { timer.pause(); } });
	board.addEventListener('mouseleave', function () { hovered = false; if (timer && inView) { timer.resume(); } });

	// only run while the section is on screen
	ScrollTrigger.create({
		trigger: section,
		start: 'top 70%',
		end: 'bottom top',
		onToggle: function (self) {
			inView = self.isActive;
			if (!timer) {
				startTimer();
			}
			if (inView && !hovered) {
				timer.resume();
			} else {
				timer.pause();
			}
		}
	});

	// first spec: letters fly in with the rest of the section
	markTabs(0);
	gsap.from(letters[0], {
		yPercent: 120, opacity: 0, duration: 0.8, stagger: 0.035, ease: 'power4.out',
		scrollTrigger: { trigger: section, start: 'top 70%', once: true },
		delay: 0.6,
		onStart: function () { countUp(slides[0]); }
	});
}


/* -------------------------------------------------------------
 * 2. DRIFT — the picture inside the film moves a little slower
 *    than the page while you scroll (tied to the scroll)
 * ------------------------------------------------------------- */
function drift(section) {
	var layers = section.querySelectorAll('.sf-livery__poster, .sf-livery__video');

	gsap.fromTo(layers, { y: -40 }, {
		y: 40,
		ease: 'none',
		scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true }
	});
}


/* -------------------------------------------------------------
 * 3. SOUND CURSOR — the pink circle glides after the mouse
 * ------------------------------------------------------------- */
function soundCursor(film) {
	var cursor = film.querySelector('.sf-livery__cursor');

	if (!cursor) {
		return;
	}

	var moveX = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
	var moveY = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });

	film.addEventListener('mouseenter', function (event) {
		var box = film.getBoundingClientRect();
		gsap.set(cursor, { x: event.clientX - box.left, y: event.clientY - box.top });   // start at the mouse
		film.classList.add('is-hovered');
	});

	film.addEventListener('mousemove', function (event) {
		var box = film.getBoundingClientRect();
		moveX(event.clientX - box.left);
		moveY(event.clientY - box.top);
	});

	film.addEventListener('mouseleave', function () {
		film.classList.remove('is-hovered');
	});
}


/* -------------------------------------------------------------
 * 4. MUTED FILM
 * ------------------------------------------------------------- */
function mutedFilm(section, id) {
	var holder = section.querySelector('.sf-livery__video');

	if (!holder || !id || !('IntersectionObserver' in window)) {
		return;
	}

	var observer = new IntersectionObserver(function (entries) {
		if (!entries[0].isIntersecting) {
			return;
		}

		observer.disconnect();

		var params = [
			'autoplay=1', 'mute=1', 'loop=1', 'playlist=' + encodeURIComponent(id),   // loop needs the playlist
			'controls=0', 'playsinline=1', 'modestbranding=1', 'rel=0', 'disablekb=1', 'iv_load_policy=3',
			'enablejsapi=1', 'origin=' + encodeURIComponent(window.location.origin)   // lets us hear when it plays
		].join('&');

		var iframe = document.createElement('iframe');
		iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?' + params;
		iframe.title = 'Project RP film (muted)';
		iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
		iframe.setAttribute('tabindex', '-1');
		holder.appendChild(iframe);

		iframe.addEventListener('load', function () {
			// ask the player to send us its status updates
			iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 'sf-livery', channel: 'widget' }), '*');
		});

		var revealTimer = null;

		window.addEventListener('message', function (event) {
			if (event.source !== iframe.contentWindow || typeof event.data !== 'string') {
				return;
			}

			var data;
			try {
				data = JSON.parse(event.data);
			} catch (error) {
				return;
			}

			// playerState 1 = playing. YouTube shows its own title bar for the
			// first few seconds, so keep the cover picture on top a little
			// longer and fade the film in once that has gone.
			if (!revealTimer && ((data.event === 'onStateChange' && data.info === 1) ||
				(data.event === 'infoDelivery' && data.info && data.info.playerState === 1))) {
				revealTimer = setTimeout(function () { holder.classList.add('is-playing'); }, 3500);
			}
		});
	}, { rootMargin: '400px 0px' });

	observer.observe(section);
}


/* -------------------------------------------------------------
 * 5. WITH SOUND — the full film in a pop-up (✕, Esc or click outside)
 * ------------------------------------------------------------- */
function withSound(section, id) {
	if (!id) {
		return;
	}

	function open(opener) {
		var modal = document.createElement('div');
		modal.className = 'sf-livery-modal';
		modal.setAttribute('role', 'dialog');
		modal.setAttribute('aria-modal', 'true');
		modal.setAttribute('aria-label', 'Project RP film');
		modal.innerHTML = '<button type="button" class="sf-livery-modal__close" aria-label="Close film"><i class="fas fa-times" aria-hidden="true"></i></button><div class="sf-livery-modal__frame"></div>';

		var iframe = document.createElement('iframe');
		iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&modestbranding=1';
		iframe.title = 'Project RP film';
		iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
		iframe.allowFullscreen = true;
		modal.querySelector('.sf-livery-modal__frame').appendChild(iframe);

		document.body.appendChild(modal);
		requestAnimationFrame(function () { modal.classList.add('is-open'); });

		var close = modal.querySelector('.sf-livery-modal__close');
		close.focus();

		function shut() {
			document.removeEventListener('keydown', onKey);
			modal.remove();             // removing it also stops the film
			if (opener) {
				opener.focus();
			}
		}

		function onKey(event) {
			if (event.key === 'Escape') {
				shut();
			}
		}

		close.addEventListener('click', shut);
		modal.addEventListener('click', function (event) {
			if (event.target === modal) {
				shut();
			}
		});
		document.addEventListener('keydown', onKey);
	}

	section.querySelectorAll('[data-sf-sound]').forEach(function (trigger) {
		trigger.addEventListener('click', function () { open(trigger); });
		trigger.addEventListener('keydown', function (event) {
			if ((event.key === 'Enter' || event.key === ' ') && trigger.getAttribute('role') === 'button') {
				event.preventDefault();
				open(trigger);
			}
		});
	});
}

// Superfly custom scripts — GSAP, ScrollTrigger and SplitText are loaded before this file.
document.addEventListener('DOMContentLoaded', function () {
	if (typeof gsap === 'undefined') return;

	gsap.registerPlugin(ScrollTrigger, SplitText);

	// Add your GSAP animations here
});

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function mountMotion(): () => void {
	gsap.registerPlugin(ScrollTrigger);
	const media = gsap.matchMedia();
	media.add('(prefers-reduced-motion: no-preference)', () => {
		const context = gsap.context(() => {
			gsap.utils.toArray<HTMLElement>('.reveal').forEach((element) => {
				gsap.from(element, {
					y: 20,
					opacity: 0,
					duration: 0.6,
					ease: 'power2.out',
					scrollTrigger: { trigger: element, start: 'top 94%', once: true }
				});
			});
			// A finite illustration needs no pause control and never keeps the CPU busy in the background.
			document.querySelectorAll<SVGCircleElement>('.data-packet').forEach((packet, index) => {
				const path = document.getElementById(packet.dataset.wire ?? '') as SVGPathElement | null;
				if (!path) return;
				const length = path.getTotalLength();
				const progress = { value: 0 };
				gsap.to(progress, {
					value: 1,
					duration: 2,
					delay: index * 0.4,
					repeat: 0,
					ease: 'none',
					onStart: () => {
						packet.style.opacity = '1';
					},
					onUpdate: () => {
						const point = path.getPointAtLength(progress.value * length);
						packet.setAttribute('cx', String(point.x));
						packet.setAttribute('cy', String(point.y));
					},
					onComplete: () => {
						packet.style.opacity = '0';
					}
				});
			});
			gsap.from('.art-chart-line', { strokeDashoffset: 360, duration: 2.5, ease: 'power1.inOut' });
			gsap.from('.art-bar', {
				scaleY: 0.15,
				transformOrigin: 'center bottom',
				duration: 1.2,
				stagger: 0.12,
				ease: 'power2.out'
			});
			gsap.from('.core-halo', { opacity: 0, duration: 1.5 });
			gsap.from('.output-check', { opacity: 0, duration: 0.5, delay: 2.4 });
		});
		return () => context.revert();
	});
	media.add('(min-width: 1100px) and (prefers-reduced-motion: no-preference)', () => {
		const context = gsap.context(() => {
			ScrollTrigger.create({
				trigger: '.partnership',
				start: 'top 120px',
				end: 'bottom bottom',
				pin: '.about-heading',
				pinSpacing: false
			});
			gsap.utils.toArray<HTMLElement>('.case-image').forEach((element) =>
				gsap.from(element, {
					scale: 0.96,
					scrollTrigger: { trigger: element, start: 'top bottom', end: 'top 55%', scrub: true }
				})
			);
		});
		return () => context.revert();
	});
	return () => media.revert();
}

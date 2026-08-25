import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let hasInitialized = false;

export function initPortfolioMotion() {
  if (hasInitialized || typeof window === 'undefined') return;

  const root = document.querySelector<HTMLElement>('.portfolio-page');
  if (!root) return;

  hasInitialized = true;
  gsap.registerPlugin(ScrollTrigger);

  const context = gsap.context(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealItems = root.querySelectorAll<HTMLElement>('.reveal');

    if (reduceMotion) {
      gsap.set(revealItems, { autoAlpha: 1, y: 0 });
      ScrollTrigger.refresh();
      return;
    }

    revealItems.forEach((item) => {
      gsap.from(item, {
        autoAlpha: 0,
        y: 22,
        duration: 0.62,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: item,
          start: 'top 86%',
          once: true,
        },
      });
    });

    const orb = root.querySelector<HTMLElement>('.hero-orb');
    const orbTween = orb
      ? gsap.to(orb, {
          scale: 1.08,
          opacity: 0.82,
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      : null;

    const handleVisibilityChange = () => {
      if (!orbTween) return;
      if (document.hidden) orbTween.pause();
      else orbTween.resume();
    };

    const refreshOnLoad = () => ScrollTrigger.refresh();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('load', refreshOnLoad);
    ScrollTrigger.refresh();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('load', refreshOnLoad);
      orbTween?.kill();
    };
  }, root);

  void context;
}

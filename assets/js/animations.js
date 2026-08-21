// Motion layer: viewport reveals, mission counter, and form loading state.
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('.hero > .hero-inner > div, #about .pillar, #courses .course-card, #ventures .venture, #contact .channel-card, #contact .form-wrap');
  const ladder = document.querySelector('.ladder');
  const steps = document.querySelectorAll('.step');

  const syncLadderLine = () => {
    if (!ladder || !steps.length) return;
    const lineHeight = steps[steps.length - 1].offsetTop - steps[0].offsetTop;
    ladder.style.setProperty('--ladder-line-height', `${Math.max(0, lineHeight)}px`);
  };

  syncLadderLine();
  window.addEventListener('resize', syncLadderLine);

  revealItems.forEach(item => item.setAttribute('data-reveal', ''));

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(item => item.classList.add('is-visible'));
    ladder?.classList.add('is-visible');
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, {threshold: 0.16, rootMargin: '0px 0px -40px'});

    revealItems.forEach(item => revealObserver.observe(item));

    if (ladder) {
      const ladderObserver = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          ladder.classList.add('is-visible');
          ladderObserver.disconnect();
        }
      }, {threshold: 0.2});
      ladderObserver.observe(ladder);
    }
  }

  const missionCounter = document.querySelector('.stat-2 b');
  if (missionCounter) {
    const target = 100000;
    const formatNumber = value => new Intl.NumberFormat('en-IN').format(value);
    const animateCounter = () => {
      const start = performance.now();
      const duration = reduceMotion ? 0 : 1800;
      const tick = now => {
        const progress = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        missionCounter.textContent = `${formatNumber(Math.round(target * eased))} lives`;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (reduceMotion || !('IntersectionObserver' in window)) {
      missionCounter.textContent = `${formatNumber(target)} lives`;
    } else {
      const counterObserver = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          animateCounter();
          counterObserver.disconnect();
        }
      }, {threshold: 0.8});
      counterObserver.observe(missionCounter);
    }
  }

  const form = document.getElementById('leadForm');
  const status = document.getElementById('formStatus');
  if (form && status) {
    form.addEventListener('submit', () => {
      status.classList.add('is-sending');
      window.setTimeout(() => status.classList.remove('is-sending'), 2500);
    }, {capture: true});
  }
})();

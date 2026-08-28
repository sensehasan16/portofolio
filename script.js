document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const siteName  = document.getElementById('siteName');
  const siteNav   = document.getElementById('siteNav');

  const NAV_HEIGHT   = 72;
  const LOGO_SIZE    = 22;
  const MAX_SCROLL   = 480; // lebih jauh = transisi lebih lambat & smooth
  // padding kiri saat jadi logo nav — responsif
  function getLeftPadding() {
    return window.innerWidth <= 768 ? 16 : 40;
  }

  function getGiantSize() {
    const vw = window.innerWidth;
    if (vw <= 480)  return Math.min(vw * 0.11, 60);   // phone kecil
    if (vw <= 768)  return Math.min(vw * 0.14, 100);  // phone/tablet
    return Math.min(vw * 0.185, 240);                  // desktop
  }

  // expo-out: mulai cepat, melambat mulus di akhir
  function ease(raw) {
    return raw === 0 ? 0 : 1 - Math.pow(2, -10 * raw);
  }

  let startLeft = 0;
  let startTop  = 0;
  let unitWidth = 0;
  let marqueeX  = 0;

  function getMarqueeSpeed() {
    const vw = window.innerWidth;
    if (vw <= 480) return 0.7;   // HP kecil — lebih pelan supaya nyaman
    if (vw <= 768) return 1.0;   // tablet
    return 1.2;                   // desktop
  }

  function measureCenter() {
    if (!siteName) return;
    const giantSize = getGiantSize();

    siteName.style.transition  = 'none';
    siteName.style.fontSize    = giantSize + 'px';
    siteName.style.transform   = 'translate(0px, 0px)';
    siteName.style.letterSpacing = '-0.03em';

    const items = siteName.querySelectorAll('.giant-item');
    if (items.length >= 2) {
      const rect0 = items[0].getBoundingClientRect();
      const rect1 = items[1].getBoundingClientRect();
      unitWidth = rect1.left - rect0.left;
      startLeft = (window.innerWidth - rect0.width) / 2;
      startTop  = (window.innerHeight - rect0.height) / 2;
    } else {
      const rect = siteName.getBoundingClientRect();
      unitWidth = rect.width + 60;
      startLeft = (window.innerWidth - rect.width) / 2;
      startTop  = (window.innerHeight - rect.height) / 2;
    }
  }

  const DAMPING = 0.055; // lebih rendah = lerp lebih lambat & smooth

  function lerp(a, b, t) { return a + (b - a) * t; }

  let liveX    = 0;
  let liveY    = 0;
  let liveSize = getGiantSize();
  let liveLS   = -0.03;

  function animate() {
    const scrollY = window.scrollY;
    const raw     = Math.min(1, Math.max(0, scrollY / MAX_SCROLL));
    const t       = ease(raw);

    const giantSize = getGiantSize();

    if (t < 0.99) {
      const speed = getMarqueeSpeed() * (1 - t);
      marqueeX -= speed;

      if (unitWidth > 0 && marqueeX <= -unitWidth) {
        marqueeX += unitWidth;
        liveX    += unitWidth; // snap liveX juga supaya tidak balik ke kanan
      }
    }

    const extraOpacity = Math.max(0, 1 - t * 3);
    const items = siteName.querySelectorAll('.giant-item');
    const seps  = siteName.querySelectorAll('.giant-sep');

    seps.forEach(sep => {
      sep.style.opacity = (0.4 * extraOpacity).toString();
    });
    items.forEach((item, idx) => {
      if (idx > 0) {
        item.style.opacity = extraOpacity.toString();
      }
    });

    const targetSize = giantSize + (LOGO_SIZE - giantSize) * t;
    const targetX    = lerp(marqueeX, getLeftPadding(), t);
    const targetY    = startTop  + ((NAV_HEIGHT - LOGO_SIZE) / 2 - startTop) * t;
    const targetLS   = -0.03 + 0.033 * t;

    liveX    = lerp(liveX,    targetX,    DAMPING);
    liveY    = lerp(liveY,    targetY,    DAMPING);
    liveSize = lerp(liveSize, targetSize, DAMPING);
    liveLS   = lerp(liveLS,   targetLS,   DAMPING);

    siteName.style.fontSize      = liveSize + 'px';
    siteName.style.transform     = `translate(${liveX}px, ${liveY}px)`;
    siteName.style.letterSpacing = liveLS + 'em';

    if (siteNav) {
      siteNav.classList.toggle('scrolled', scrollY > 200);
    }

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => {
    measureCenter();
    if (window.scrollY === 0) {
      marqueeX = startLeft;
      liveX    = startLeft;
    }
  });

  function start() {
    measureCenter();
    marqueeX = startLeft;
    liveX    = startLeft;
    liveY    = startTop;
    liveSize = getGiantSize();
    liveLS   = -0.03;

    if (!prefersReducedMotion) {
      animate();
    }
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start);
  } else {
    start();
  }

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.1
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal, .word-stagger').forEach(el => revealObserver.observe(el));

  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinksContainer = document.querySelector('.nav-links');
  const navLinks = document.querySelectorAll('.nav-link');

  if (mobileToggle && navLinksContainer) {
    mobileToggle.addEventListener('click', () => {
      navLinksContainer.classList.toggle('active');
      mobileToggle.classList.toggle('active');
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navLinksContainer.classList.remove('active');
        mobileToggle.classList.remove('active');
      });
    });
  }

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = contactForm.querySelector('.btn-submit');
      const originalText = submitBtn.innerText;

      submitBtn.innerText = 'SENDING...';
      submitBtn.disabled = true;

      const formData = new FormData(contactForm);

      try {
        const response = await fetch('https://formspree.io/f/myeyylyk', {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          submitBtn.innerText = 'SENT ✓';
          submitBtn.style.background = '#4CAF50';
          submitBtn.style.color = '#FFFFFF';
          contactForm.reset();
          setTimeout(() => {
            submitBtn.innerText = originalText;
            submitBtn.style.background = '';
            submitBtn.style.color = '';
            submitBtn.disabled = false;
          }, 3000);
        } else {
          throw new Error('Failed');
        }
      } catch (error) {
        submitBtn.innerText = 'FAILED - Try Again';
        submitBtn.style.background = '#e74c3c';
        submitBtn.style.color = '#FFFFFF';
        setTimeout(() => {
          submitBtn.innerText = originalText;
          submitBtn.style.background = '';
          submitBtn.style.color = '';
          submitBtn.disabled = false;
        }, 3000);
      }
    });
  }
});

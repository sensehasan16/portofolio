document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const siteName = document.getElementById('siteName');
  const siteNav = document.getElementById('siteNav');

  const NAV_HEIGHT = 72;
  const LOGO_SIZE = 22;
  const MAX_SCROLL = 480;
  function getLeftPadding() {
    return window.innerWidth <= 768 ? 16 : 40;
  }

  function getGiantSize() {
    const vw = window.innerWidth;
    if (vw <= 480) return Math.min(vw * 0.11, 60);
    if (vw <= 768) return Math.min(vw * 0.14, 100);
    return Math.min(vw * 0.185, 240);
  }

  function ease(raw) {
    return raw === 0 ? 0 : 1 - Math.pow(2, -10 * raw);
  }

  let startLeft = 0;
  let startTop = 0;
  let unitWidth = 0;
  let marqueeX = 0;

  function getMarqueeSpeed() {
    const vw = window.innerWidth;
    if (vw <= 480) return 0.7;
    if (vw <= 768) return 1.0;
    return 1.2;
  }

  function measureCenter() {
    if (!siteName) return;
    const giantSize = getGiantSize();

    siteName.style.transition = 'none';
    siteName.style.fontSize = giantSize + 'px';
    siteName.style.transform = 'translate(0px, 0px)';
    siteName.style.letterSpacing = '-0.03em';

    const items = siteName.querySelectorAll('.giant-item');
    if (items.length >= 2) {
      const rect0 = items[0].getBoundingClientRect();
      const rect1 = items[1].getBoundingClientRect();
      unitWidth = rect1.left - rect0.left;
      startLeft = (window.innerWidth - rect0.width) / 2;
      startTop = (window.innerHeight - rect0.height) / 2;
    } else {
      const rect = siteName.getBoundingClientRect();
      unitWidth = rect.width + 60;
      startLeft = (window.innerWidth - rect.width) / 2;
      startTop = (window.innerHeight - rect.height) / 2;
    }
  }

  const DAMPING = 0.055;

  function lerp(a, b, t) { return a + (b - a) * t; }

  let liveX = 0;
  let liveY = 0;
  let liveSize = getGiantSize();
  let liveLS = -0.03;

  function animate() {
    const scrollY = window.scrollY;
    const raw = Math.min(1, Math.max(0, scrollY / MAX_SCROLL));
    const t = ease(raw);

    const giantSize = getGiantSize();

    if (t < 0.99) {
      const speed = getMarqueeSpeed() * (1 - t);
      marqueeX -= speed;

      if (unitWidth > 0 && marqueeX <= -unitWidth) {
        marqueeX += unitWidth;
        liveX += unitWidth;
      }
    }

    const extraOpacity = Math.max(0, 1 - t * 3);
    const items = siteName.querySelectorAll('.giant-item');
    const seps = siteName.querySelectorAll('.giant-sep');

    seps.forEach(sep => {
      sep.style.opacity = (0.4 * extraOpacity).toString();
    });
    items.forEach((item, idx) => {
      if (idx > 0) {
        item.style.opacity = extraOpacity.toString();
      }
    });

    const targetSize = giantSize + (LOGO_SIZE - giantSize) * t;
    const targetX = lerp(marqueeX, getLeftPadding(), t);
    const targetY = startTop + ((NAV_HEIGHT - LOGO_SIZE) / 2 - startTop) * t;
    const targetLS = -0.03 + 0.033 * t;

    liveX = lerp(liveX, targetX, DAMPING);
    liveY = lerp(liveY, targetY, DAMPING);
    liveSize = lerp(liveSize, targetSize, DAMPING);
    liveLS = lerp(liveLS, targetLS, DAMPING);

    siteName.style.fontSize = liveSize + 'px';
    siteName.style.transform = `translate(${liveX}px, ${liveY}px)`;
    siteName.style.letterSpacing = liveLS + 'em';

    if (siteNav) {
      const isScrolled = scrollY > 200;
      siteNav.classList.toggle('scrolled', isScrolled);
      if (navLinksContainer && window.innerWidth > 768) {
        navLinksContainer.classList.toggle('spread', !isScrolled);
      }
    }

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => {
    measureCenter();
    if (window.scrollY === 0) {
      marqueeX = startLeft;
      liveX = startLeft;
    }
  });

  function start() {
    measureCenter();
    marqueeX = startLeft;
    liveX = startLeft;
    liveY = startTop;
    liveSize = getGiantSize();
    liveLS = -0.03;

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
  const mobileNavOverlay = document.getElementById('mobileNavOverlay');

  function openMobileNav() {
    navLinksContainer.classList.add('active');
    mobileToggle.classList.add('active');
    if (mobileNavOverlay) mobileNavOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    navLinksContainer.classList.remove('active');
    mobileToggle.classList.remove('active');
    if (mobileNavOverlay) mobileNavOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (mobileToggle && navLinksContainer) {
    mobileToggle.addEventListener('click', () => {
      if (navLinksContainer.classList.contains('active')) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        closeMobileNav();
      });
    });

    if (mobileNavOverlay) {
      mobileNavOverlay.addEventListener('click', () => {
        closeMobileNav();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinksContainer.classList.contains('active')) {
        closeMobileNav();
      }
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

  const projectImages = {
    websiteLari: [
      { src: "assets/images/website_lari 3.png", alt: "Dashboard Admin" },
      { src: "assets/images/website_lari 4.png", alt: "Form Pendaftaran" },
      { src: "assets/images/website_lari 2.png", alt: "Halaman Event" },
      { src: "assets/images/1122.png", alt: "Detail Event 1122" },
      { src: "assets/images/2211.png", alt: "Detail Event 2211" },
      { src: "assets/images/website_lari 1.png", alt: "Landing Page" }
    ],
    klinikKesehatan: [
      { src: "assets/images/kelinik_1.png", alt: "Login Portal Admin" },
      { src: "assets/images/k1.png", alt: "Dashboard Admin Klinik" },
      { src: "assets/images/k2.png", alt: "Data Dokter" },
      { src: "assets/images/k3.png", alt: "Form Tambah Dokter" },
      { src: "assets/images/k4.png", alt: "Data Pasien" },
      { src: "assets/images/k5.png", alt: "Detail Rekam Medis Pasien" },
      { src: "assets/images/k6.png", alt: "Data Pemeriksaan Pasien" },
      { src: "assets/images/k7.png", alt: "Form Tambah Pemeriksaan" },
      { src: "assets/images/k8.png", alt: "Detail & Riwayat Pemeriksaan" }
    ]
  };

  const sliderInstances = new Map();

  function initProjectSlider(containerEl, images) {
    if (!containerEl || !Array.isArray(images) || images.length === 0) return null;

    containerEl.innerHTML = '';
    const totalSlides = images.length;
    let currentIndex = 0;

    const track = document.createElement('div');
    track.className = 'slider-track';

    const slides = images.map((imgData, index) => {
      const slide = document.createElement('div');
      slide.className = 'slider-slide';
      slide.setAttribute('data-slide-index', index);

      const img = document.createElement('img');
      img.src = imgData.src;
      img.alt = imgData.alt || `Screenshot ${index + 1}`;
      img.className = 'slider-img';

      if (index > 0) {
        img.loading = 'lazy';
      }

      img.addEventListener('error', function () {
        if (!this.dataset.fallbackTried) {
          this.dataset.fallbackTried = 'true';

          if (this.src.includes('%20') || this.src.includes(' ')) {
            this.src = this.src.replace(/%20/g, '').replace(/ /g, '');
            return;
          } else if (/website_lari\d+\.png$/i.test(this.src)) {

            this.src = this.src.replace(/(website_lari)(\d+)\.png$/i, '$1 $2.png');
            return;
          }
        }

        if (!slide.querySelector('.slider-placeholder-fallback')) {
          this.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.className = 'slider-placeholder-fallback';
          fallback.innerHTML = `
            <div class="slider-placeholder-content">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <p class="slider-placeholder-title">${imgData.alt || 'Placeholder Screenshot'}</p>
              <code class="slider-placeholder-src">${imgData.src}</code>
            </div>
          `;
          slide.appendChild(fallback);
        }
      });

      const cue = document.createElement('div');
      cue.className = 'slider-scroll-cue';
      cue.innerHTML = `
        <span class="slider-scroll-cue-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
          Scroll ke bawah
        </span>
      `;

      slide.addEventListener('scroll', () => {
        if (slide.scrollTop > 25) {
          cue.classList.add('is-hidden');
        } else {
          cue.classList.remove('is-hidden');
        }
      }, { passive: true });

      slide.appendChild(img);
      slide.appendChild(cue);
      track.appendChild(slide);
      return slide;
    });

    const counter = document.createElement('div');
    counter.className = 'slider-counter';
    counter.setAttribute('aria-live', 'polite');
    counter.textContent = `1 / ${totalSlides}`;

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'slider-btn slider-btn-prev';
    prevBtn.setAttribute('aria-label', 'Foto sebelumnya');
    prevBtn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    `;

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'slider-btn slider-btn-next';
    nextBtn.setAttribute('aria-label', 'Foto berikutnya');
    nextBtn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    `;

    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'slider-dots';
    dotsContainer.setAttribute('role', 'tablist');
    dotsContainer.setAttribute('aria-label', 'Navigasi slide foto');

    const dots = images.map((imgData, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `slider-dot ${index === 0 ? 'active' : ''}`;
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Lihat ${imgData.alt || `foto ${index + 1}`}`);
      dot.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        goToSlide(index);
      });
      dotsContainer.appendChild(dot);
      return dot;
    });

    containerEl.appendChild(track);
    containerEl.appendChild(counter);
    containerEl.appendChild(prevBtn);
    containerEl.appendChild(nextBtn);
    containerEl.appendChild(dotsContainer);

    function updateUI() {
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      counter.textContent = `${currentIndex + 1} / ${totalSlides}`;
      dots.forEach((dot, idx) => {
        const isActive = idx === currentIndex;
        dot.classList.toggle('active', isActive);
        dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }

    function goToSlide(index) {

      currentIndex = (index + totalSlides) % totalSlides;
      updateUI();
    }

    function nextSlide() {
      goToSlide(currentIndex + 1);
    }

    function prevSlide() {
      goToSlide(currentIndex - 1);
    }

    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      prevSlide();
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      nextSlide();
    });

    function reset() {
      currentIndex = 0;
      updateUI();
      slides.forEach(slide => {
        slide.scrollTop = 0;
        const cue = slide.querySelector('.slider-scroll-cue');
        if (cue) cue.classList.remove('is-hidden');
      });
    }

    let touchStartX = 0;
    let touchStartY = 0;
    let isHorizontalSwipe = null;

    containerEl.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isHorizontalSwipe = null;
    }, { passive: true });

    containerEl.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 1) return;
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - touchStartX;
      const deltaY = currentY - touchStartY;

      if (isHorizontalSwipe === null) {

        if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
          isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
        }
      }

      if (isHorizontalSwipe === true) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }

    }, { passive: false });

    containerEl.addEventListener('touchend', (e) => {
      if (isHorizontalSwipe === true) {
        const touchEndX = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : touchStartX;
        const deltaX = touchEndX - touchStartX;
        const SWIPE_THRESHOLD = 40;

        if (deltaX < -SWIPE_THRESHOLD) {
          nextSlide();
        } else if (deltaX > SWIPE_THRESHOLD) {
          prevSlide();
        }
      }
      isHorizontalSwipe = null;
    }, { passive: true });

    return {
      goToSlide,
      nextSlide,
      prevSlide,
      reset,
      getCurrentIndex: () => currentIndex,
      getTotalSlides: () => totalSlides
    };
  }

  document.querySelectorAll('.project-modal-slider[data-project-slider]').forEach(sliderEl => {
    const projectKey = sliderEl.getAttribute('data-project-slider');
    const images = projectImages[projectKey];
    if (images && images.length > 0) {
      const modal = sliderEl.closest('.project-modal-backdrop');
      const modalId = modal ? modal.id : sliderEl.id;
      const instance = initProjectSlider(sliderEl, images);
      if (instance) {
        sliderInstances.set(modalId, instance);
      }
    }
  });

  const projectCards = document.querySelectorAll('.project-item[data-modal-target]');
  const modalBackdrops = document.querySelectorAll('.project-modal-backdrop');
  let activeModal = null;
  let lastActiveElement = null;

  function openModal(modalId, triggerElement) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    activeModal = modal;
    lastActiveElement = triggerElement;

    if (sliderInstances.has(modalId)) {
      sliderInstances.get(modalId).reset();
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }

  function closeModal() {
    if (!activeModal) return;

    if (sliderInstances.has(activeModal.id)) {
      sliderInstances.get(activeModal.id).reset();
    }

    activeModal.classList.remove('is-open');
    activeModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
    activeModal = null;
    lastActiveElement = null;
  }

  projectCards.forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.project-links')) {
        return;
      }
      const targetId = card.getAttribute('data-modal-target');
      if (targetId) {
        openModal(targetId, card);
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('.project-links')) {
          return;
        }
        e.preventDefault();
        const targetId = card.getAttribute('data-modal-target');
        if (targetId) {
          openModal(targetId, card);
        }
      }
    });
  });

  modalBackdrops.forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal();
      }
    });

    const closeBtn = backdrop.querySelector('.project-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        closeModal();
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!activeModal) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const slider = sliderInstances.get(activeModal.id);
      if (slider) {
        e.preventDefault();
        if (e.key === 'ArrowLeft') {
          slider.prevSlide();
        } else {
          slider.nextSlide();
        }
        return;
      }
    }

    if (e.key === 'Tab') {
      const focusables = activeModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusables.length === 0) return;
      const firstFocusable = focusables[0];
      const lastFocusable = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }
  });

  const projectTranslations = {
    id: {

      maurun_card_desc: 'Bantu orang cari & daftar event lari di seluruh Indonesia, lengkap sama dashboard admin buat ngatur event dan peserta.',
      klinik_card_desc: 'Dashboard admin buat ngatur data dokter, pasien, dan hasil pengecekan pasien.',
      sidifood_card_desc: 'Aplikasi bantu atur pola makan — user bisa pilih target kalori harian sesuai kebutuhan, misalnya buat diet gula.',

      label_my_role: 'Peran Saya',
      btn_github: 'Lihat Kode di GitHub',

      maurun_modal_desc: 'Awalnya project ini saya buat karena pengen bikin sesuatu yang beneran bisa dipakai, bukan cuma tugas biasa. Fokus utamanya di landing page — biar orang gampang nemuin dan daftar event lari yang ada di seluruh Indonesia, dari fun run sampai marathon. Di sisi admin, saya bikin dashboard yang bisa dipakai buat ngatur event dan peserta, termasuk bikin event baru dan ngelola beberapa master data (kategori event, kota, dll).',
      maurun_modal_role: [
        'bikin landing page dari nol',
        'rancang struktur database buat event, peserta, dan master data pendukung',
        'bangun dashboard admin buat kelola event & peserta',
        'integrasi Midtrans buat pembayaran pendaftaran (masih sandbox/uji coba, belum production)',
      ],

      klinik_modal_desc: 'Ini murni dashboard admin (nggak ada login pasien terpisah), dipakai buat ngatur data dokter, data pasien, dan data hasil pengecekan/pemeriksaan pasien.',
      klinik_modal_role: [
        'rancang struktur database untuk 3 modul (dokter, pasien, pemeriksaan)',
        'bangun dashboard dengan ringkasan statistik',
        'buat tabel data dokter aktif dan status pemeriksaan',
      ],

      sidifood_modal_desc: 'Aplikasi buat bantu user atur pola makan biar bisa pilih makanan yang sehat. User bisa pilih target kalori harian sesuai kebutuhan, dan disediakan beberapa preset pilihan kalori harian, misalnya buat diet gula.',
      sidifood_modal_role: [
        'desain & bangun UI aplikasi mobile dengan Flutter',
        'bangun backend API dengan PHP untuk data user dan pilihan kalori',
        'rancang alur pemilihan target kalori harian',
      ],
    },
    en: {
      maurun_card_desc: 'Helps users discover and register for running events across Indonesia, complete with an admin dashboard to manage events and participants.',
      klinik_card_desc: 'An administrative dashboard designed to manage doctor records, patient data, and clinical examination results.',
      sidifood_card_desc: 'A dietary planning app that enables users to customize daily calorie targets to support specific health needs, such as low-sugar diets.',

      label_my_role: 'My Role',
      btn_github: 'View Code on GitHub',

      maurun_modal_desc: 'I originally started building this project because I noticed how difficult it was for runners in Indonesia to find upcoming marathon and running events across scattered channels. The landing page is designed to make searching and registering for races as effortless as possible. In addition, I created a dedicated admin dashboard where organizers can publish new events, monitor participant sign-ups, and manage essential master data such as race categories and host cities.',
      maurun_modal_role: [
        'Built the entire user-facing landing page from scratch',
        'Designed the relational database structure for events, participants, and master data',
        'Engineered the admin dashboard for managing races and registered participants',
        'Integrated Midtrans payment gateway for registration checkouts (in SANDBOX / testing mode for demonstration, not yet live in production)',
      ],

      klinik_modal_desc: 'This project was developed purely as an internal administrative dashboard for clinic operators, without a separate patient-facing login portal. Its purpose is to streamline clinic operations by providing administrative staff with a centralized space to manage doctor schedules, maintain patient records, and organize clinical examination results.',
      klinik_modal_role: [
        'Designed the relational database schema across three core modules (doctors, patients, and clinical examinations)',
        'Built the admin dashboard featuring statistical overviews such as total registered patients and total examinations completed',
        'Created structured data tables displaying active doctor assignments and clinical examination statuses',
      ],

      sidifood_modal_desc: 'SiDiFood is a mobile application I created to help people take control of their eating habits and easily choose healthier meals. Users can configure a custom daily calorie target suited to their personal wellness needs, and benefit from preset calorie options designed for specific dietary goals such as sugar-conscious and diabetic-friendly diets.',
      sidifood_modal_role: [
        'Designed and built the mobile app user interface using Flutter',
        'Engineered the backend REST API with PHP for user data and calorie options',
        'Architected the daily calorie target selection flow and user preferences',
      ],
    },
  };

  function setProjectLang(lang) {
    const dict = projectTranslations[lang];
    if (!dict) return;

    document.querySelectorAll('[data-i18n-project]').forEach(el => {
      const key = el.getAttribute('data-i18n-project');
      const value = dict[key];
      if (value === undefined) return;

      if (Array.isArray(value)) {

        el.innerHTML = value.map(item => `<li>${item}</li>`).join('');
      } else {
        el.textContent = value;
      }
    });

    document.querySelectorAll('.plang-btn').forEach(btn => {
      const isActive = btn.dataset.lang === lang;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    localStorage.setItem('project-lang', lang);
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('.plang-btn');
    if (!btn) return;
    e.stopPropagation();
    const lang = btn.dataset.lang;
    if (lang) setProjectLang(lang);
  });

  const savedProjectLang = localStorage.getItem('project-lang') || 'id';
  setProjectLang(savedProjectLang);
});

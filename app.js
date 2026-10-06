/* Progressive enhancement only. All quote/contact/service links work without JS.
 * No tracking, form submission, third-party scripts or external runtime dependencies.
 */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const hero = $('#hero-video');
  const shopPlayer = $('#shop-player');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  let motionPaused = reduced.matches || saveData;
  let heroVisible = true;
  let invitationVisible = false;
  let modalActive = false;
  let galleryIndex = 0;
  let progressFrame = 0;
  let lastFocused;
  root.classList.add('js');

  // Choose the smaller video on small screens; download only when playback is needed.
  const filmSource = () => window.matchMedia('(max-width: 700px)').matches
    ? (hero.dataset.mobileSrc || hero.dataset.desktopSrc) : hero.dataset.desktopSrc;
  function loadHero() {
    if (!hero.getAttribute('src')) { hero.src = filmSource(); hero.load(); }
  }
  function syncMotionUI() {
    root.classList.toggle('motion-paused', motionPaused);
    root.classList.toggle('motion-allowed', !motionPaused);
    $$('.motion-toggle').forEach(button => {
      button.setAttribute('aria-pressed', String(motionPaused));
      button.setAttribute('aria-label', motionPaused ? 'Enable background motion' : 'Pause background motion');
      const label = $('span', button);
      if (label) label.textContent = motionPaused ? 'Enable motion' : 'Pause motion';
      else button.textContent = motionPaused ? 'Enable motion' : 'Pause motion';
      const icon = $('use', button);
      if (icon) icon.setAttribute('href', motionPaused ? '#icon-play' : '#icon-pause');
    });
  }
  function syncHero() {
    if (motionPaused || !heroVisible || document.hidden || modalActive) {
      hero.pause();
      return;
    }
    loadHero();
    hero.muted = true;
    const attempt = hero.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => {
        // Autoplay can be unavailable; leave an attractive poster and an honest control.
        if (heroVisible && !modalActive && !document.hidden) {
          motionPaused = true;
          syncMotionUI();
        }
      });
    }
  }
  function updateProgress() {
    if (hero.duration && Number.isFinite(hero.duration)) {
      $('#film-progress').style.transform = `scaleX(${Math.min(1, hero.currentTime / hero.duration)})`;
    }
    if (!hero.paused && !document.hidden && heroVisible) progressFrame = requestAnimationFrame(updateProgress);
  }
  hero.addEventListener('playing', () => {
    hero.classList.add('is-playing');
    cancelAnimationFrame(progressFrame);
    updateProgress();
  });
  hero.addEventListener('pause', () => cancelAnimationFrame(progressFrame));
  hero.addEventListener('error', () => {
    hero.classList.remove('is-playing');
    motionPaused = true;
    syncMotionUI();
  });
  $$('.motion-toggle').forEach(button => button.addEventListener('click', () => {
    motionPaused = !motionPaused;
    syncMotionUI(); syncHero();
  }));
  reduced.addEventListener('change', event => {
    motionPaused = event.matches || saveData;
    syncMotionUI(); syncHero();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) shopPlayer.pause();
    syncHero();
  });

  function syncActionBar() {
    $('.mobile-action-bar').classList.toggle('is-visible', !heroVisible && !invitationVisible && !modalActive);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      // Edge contact at 0px is still 'intersecting'; require a genuinely visible sliver.
      heroVisible = entries[0].isIntersecting && entries[0].intersectionRatio > 0.02;
      syncHero(); syncActionBar();
    }, {threshold: [0, 0.02]}).observe($('#top'));
    new IntersectionObserver(entries => {
      invitationVisible = entries[0].isIntersecting;
      if (invitationVisible) $('#quote').classList.add('arrived');
      syncActionBar();
    }, {threshold: 0.12}).observe($('#quote'));
    const reveals = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          reveals.unobserve(entry.target);
        }
      });
    }, {threshold: 0.08, rootMargin: '0px 0px -15px 0px'});
    $$('.reveal').forEach(element => reveals.observe(element));
  } else {
    $$('.reveal').forEach(element => element.classList.add('is-visible'));
  }
  let scrollScheduled = false;
  function syncHeader() {
    $('#site-header').classList.toggle('scrolled', window.scrollY > 35);
    scrollScheduled = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollScheduled) { scrollScheduled = true; requestAnimationFrame(syncHeader); }
  }, {passive: true});
  syncHeader();

  // Services use conventional, fully visible content. Only the navigation is a disclosure.
  const servicesNav = $('.nav-services');
  document.addEventListener('click', event => {
    if (servicesNav && !servicesNav.contains(event.target)) servicesNav.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && servicesNav && servicesNav.open) {
      servicesNav.open = false;
      $('summary', servicesNav).focus();
    }
  });

  // Native dialogs manage keyboard focus. Restore it explicitly for consistent browsers.
  function openDialog(dialog) {
    lastFocused = document.activeElement;
    if (dialog.open) return;
    dialog.showModal();
    modalActive = true;
    document.body.classList.add('dialog-open');
    syncHero(); syncActionBar();
    if (dialog.id === 'mobile-menu') $('.menu-toggle').setAttribute('aria-expanded', 'true');
  }
  function closeDialog(dialog) { if (dialog.open) dialog.close(); }
  $$('dialog').forEach(dialog => {
    $$('[data-close-dialog]', dialog).forEach(button => button.addEventListener('click', () => closeDialog(dialog)));
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
    });
    dialog.addEventListener('close', () => {
      modalActive = false;
      document.body.classList.remove('dialog-open');
      shopPlayer.pause();
      $('.menu-toggle').setAttribute('aria-expanded', 'false');
      syncHero(); syncActionBar();
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus({preventScroll: true});
    });
  });
  $('.menu-toggle').addEventListener('click', () => openDialog($('#mobile-menu')));
  $$('#mobile-menu a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const target = $(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    closeDialog($('#mobile-menu'));
    target.scrollIntoView({behavior: motionPaused ? 'instant' : 'smooth'});
    // Keep keyboard users in the section they selected, not back in the menu toggle.
    const focusTarget = $('h2', target) || target;
    focusTarget.setAttribute('tabindex', '-1');
    setTimeout(() => focusTarget.focus({preventScroll: true}), 50);
  }));

  function seekFilm(time) {
    const seek = () => {
      shopPlayer.currentTime = Math.min(Math.max(time, 0), Math.max(0, (shopPlayer.duration || 24) - 0.05));
      const attempt = shopPlayer.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
    };
    if (shopPlayer.readyState >= 1) seek();
    else shopPlayer.addEventListener('loadedmetadata', seek, {once: true});
  }
  $$('[data-film-start]').forEach(button => button.addEventListener('click', () => {
    openDialog($('#film-dialog'));
    if (!shopPlayer.getAttribute('src')) { shopPlayer.src = hero.currentSrc || filmSource(); shopPlayer.load(); }
    seekFilm(Number(button.dataset.filmStart));
  }));
  $$('[data-seek]').forEach(button => button.addEventListener('click', () => seekFilm(Number(button.dataset.seek))));
  shopPlayer.addEventListener('timeupdate', () => {
    const time = shopPlayer.currentTime;
    $$('[data-seek]').forEach((button, index, buttons) => {
      const start = Number(button.dataset.seek);
      const end = buttons[index + 1] ? Number(buttons[index + 1].dataset.seek) : Infinity;
      button.setAttribute('aria-current', String(time >= start && time < end));
    });
  });

  const photos = [
  {
    "src": "assets/porsche-yellow.webp",
    "alt": "Yellow Porsche in the Auto Vos studio",
    "caption": "Yellow Porsche in the Auto Vos studio."
  },
  {
    "src": "assets/porsche-silver.webp",
    "alt": "Silver Porsche in the Auto Vos studio",
    "caption": "Silver Porsche in the Auto Vos studio."
  },
  {
    "src": "assets/audi-glass.webp",
    "alt": "Blue Audi in the Auto Vos studio",
    "caption": "Blue Audi in the Auto Vos studio."
  },
  {
    "src": "assets/precision-install.webp",
    "alt": "Two technicians fitting clear film around a vehicle’s bumper",
    "caption": "Two technicians fitting clear film around a vehicle’s bumper."
  },
  {
    "src": "assets/ppf-installation.webp",
    "alt": "Paint protection film being fitted to a vehicle’s hood",
    "caption": "Paint protection film being fitted to a vehicle’s hood."
  },
  {
    "src": "assets/ceramic-application.webp",
    "alt": "Ceramic coating being applied to blue paint",
    "caption": "Ceramic coating being applied to blue paint."
  }
];
  function showPhoto(index) {
    galleryIndex = (index + photos.length) % photos.length;
    const photo = photos[galleryIndex];
    $('#gallery-image').src = photo.src;
    $('#gallery-image').alt = photo.alt;
    $('#gallery-caption').textContent = photo.caption;
    $('#gallery-count').textContent = `${String(galleryIndex + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
  }
  $$('[data-gallery]').forEach(button => button.addEventListener('click', event => {
    event.preventDefault();
    showPhoto(Number(button.dataset.gallery));
    openDialog($('#gallery-dialog'));
  }));
  $('.gallery-prev').addEventListener('click', () => showPhoto(galleryIndex - 1));
  $('.gallery-next').addEventListener('click', () => showPhoto(galleryIndex + 1));
  $('#gallery-dialog').addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(galleryIndex + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(galleryIndex - 1); }
  });
  let touchStart = null;
  $('#gallery-image').addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 ? {x:event.touches[0].clientX, y:event.touches[0].clientY} : null;
  }, {passive:true});
  $('#gallery-image').addEventListener('touchend', event => {
    if (!touchStart || !event.changedTouches[0]) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) showPhoto(galleryIndex + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, {passive:true});
  syncMotionUI();
  syncHero();
})();

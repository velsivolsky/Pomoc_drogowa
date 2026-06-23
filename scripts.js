(async function () {
  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const mobileViewport = window.matchMedia('(max-width: 720px)').matches;

  function forceMobileHeadingVisibility() {
    if (!(coarsePointer || mobileViewport)) {
      return;
    }

    document.querySelectorAll('.section-title, .hero-copy h1').forEach(function (heading) {
      heading.style.opacity = '1';
      heading.style.transform = 'none';
      heading.style.clipPath = 'none';
    });
  }

  function setTheme(theme) {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }

    if (themeToggle) {
      themeToggle.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
    }

    localStorage.setItem('theme', theme);
    window.dispatchEvent(new Event('themechange'));
  }

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || savedTheme === 'light') {
    setTheme(savedTheme);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const isDark = root.getAttribute('data-theme') === 'dark';
      setTheme(isDark ? 'light' : 'dark');
    });
  }

  const revealItems = document.querySelectorAll('.reveal');
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const pageToneTargets = document.querySelectorAll('main > section, .site-footer');
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  function setPageTone(color) {
    if (!color) {
      return;
    }

    root.style.setProperty('--page-bg', color);
    if (themeMeta) {
      themeMeta.setAttribute('content', color);
    }
  }

  function parseColor(color) {
    if (!color) {
      return null;
    }

    const normalized = color.trim();

    if (normalized.startsWith('#')) {
      let hex = normalized.slice(1);
      if (hex.length === 3) {
        hex = hex.split('').map(function (char) {
          return char + char;
        }).join('');
      }

      const value = Number.parseInt(hex, 16);
      if (Number.isNaN(value)) {
        return null;
      }

      return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255
      };
    }

    const match = normalized.match(/rgba?\(([^)]+)\)/i);
    if (!match) {
      return null;
    }

    const parts = match[1].split(',').map(function (part) {
      return Number.parseFloat(part.trim());
    });

    if (parts.length < 3 || parts.some(function (part, index) {
      return index < 3 && Number.isNaN(part);
    })) {
      return null;
    }

    return {
      r: parts[0],
      g: parts[1],
      b: parts[2]
    };
  }

  function mixColor(from, to, progress) {
    const ratio = Math.max(0, Math.min(1, progress));
    const r = Math.round(from.r + (to.r - from.r) * ratio);
    const g = Math.round(from.g + (to.g - from.g) * ratio);
    const b = Math.round(from.b + (to.b - from.b) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function setupSectionToneFlow() {
    if (!pageToneTargets.length) {
      return function () {};
    }

    function getToneStops() {
      return Array.from(pageToneTargets).map(function (section) {
        const rect = section.getBoundingClientRect();
        const tone = window.getComputedStyle(section).getPropertyValue('--section-tone').trim();
        const rgb = parseColor(tone);
        return {
          section: section,
          tone: tone,
          rgb: rgb,
          anchor: rect.top + window.scrollY + rect.height * 0.5
        };
      }).filter(function (stop) {
        return stop.rgb;
      });
    }

    function updateToneFlow() {
      const stops = getToneStops();
      if (!stops.length) {
        return;
      }

      if (stops.length === 1) {
        setPageTone(stops[0].tone);
        return;
      }

      const anchor = window.scrollY + window.innerHeight * 0.5;

      if (anchor <= stops[0].anchor) {
        setPageTone(stops[0].tone);
        return;
      }

      const lastStop = stops[stops.length - 1];
      if (anchor >= lastStop.anchor) {
        setPageTone(lastStop.tone);
        return;
      }

      for (let index = 0; index < stops.length - 1; index += 1) {
        const current = stops[index];
        const next = stops[index + 1];
        if (anchor < current.anchor || anchor > next.anchor) {
          continue;
        }

        const distance = next.anchor - current.anchor || 1;
        const progress = (anchor - current.anchor) / distance;
        setPageTone(mixColor(current.rgb, next.rgb, progress));
        return;
      }
    }

    window.addEventListener('resize', function () {
      updateToneFlow();
    }, { passive: true });

    window.addEventListener('scroll', function () {
      updateToneFlow();
    }, { passive: true });

    window.addEventListener('load', function () {
      updateToneFlow();
    });

    window.addEventListener('themechange', function () {
      updateToneFlow();
    });

    updateToneFlow();
    return updateToneFlow;
  }

  function setupActiveNavigation() {
    if (!sections.length || !navLinks.length) {
      return;
    }

    const sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          const currentId = entry.target.getAttribute('id');
          navLinks.forEach(function (link) {
            const isCurrent = link.getAttribute('href') === `#${currentId}`;
            link.classList.toggle('is-active', isCurrent);
            if (isCurrent) {
              link.setAttribute('aria-current', 'page');
            } else {
              link.removeAttribute('aria-current');
            }
          });
        });
      },
      {
        threshold: 0.45,
        rootMargin: '-10% 0px -45% 0px'
      }
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  setupActiveNavigation();
  const updateToneFlow = setupSectionToneFlow();
  forceMobileHeadingVisibility();

  if (reducedMotion) {
    revealItems.forEach(function (item) {
      item.classList.add('in-view');
    });
    return;
  }

  const SCRIPT_TIMEOUT = 9000;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === 'true') {
          resolve();
          return;
        }
        existing.addEventListener('load', function () {
          existing.dataset.loaded = 'true';
          resolve();
        });
        existing.addEventListener('error', function () {
          reject(new Error(`Failed to load script: ${src}`));
        });
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = function () {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = function () {
        reject(new Error(`Failed to load script: ${src}`));
      };
      document.head.appendChild(script);
    });
  }

  function withTimeout(promise, timeoutMs) {
    return new Promise(function (resolve, reject) {
      const timeoutId = setTimeout(function () {
        reject(new Error('Script loading timeout'));
      }, timeoutMs);

      promise
        .then(function (result) {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(function (error) {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  function setupProgressBarFallback(progressEl) {
    function updateProgress() {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      progressEl.style.transform = `scaleX(${Math.max(0, Math.min(1, progress))})`;
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  function setupFallbackReveal() {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -10% 0px'
      }
    );

    revealItems.forEach(function (item, index) {
      item.style.transitionDelay = `${Math.min(index * 0.06, 0.42)}s`;
      observer.observe(item);
    });

    // Keep headings always visible on mobile; use clip reveal only on larger screens.
    if (coarsePointer || mobileViewport) {
      forceMobileHeadingVisibility();
    } else {
      document.querySelectorAll('.hero-copy h1, .section-title').forEach(function (heading, index) {
        heading.style.opacity = '0';
        heading.style.transform = 'translateY(20px)';
        heading.style.clipPath = 'inset(0 100% 0 0)';
        heading.style.transition = 'clip-path 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.8s ease';
        heading.style.transitionDelay = `${Math.min(index * 0.08, 0.36)}s`;

        const headingObserver = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) {
                return;
              }
              heading.style.opacity = '1';
              heading.style.transform = 'translateY(0)';
              heading.style.clipPath = 'inset(0 0 0 0)';
              headingObserver.unobserve(entry.target);
            });
          },
          { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
        );

        headingObserver.observe(heading);
      });
    }

    // Lightweight parallax fallback for hero and media blocks.
    const parallaxItems = document.querySelectorAll('.hero-media, .tile-media');
    let ticking = false;
    function updateParallax() {
      const viewportHeight = window.innerHeight || 1;
      parallaxItems.forEach(function (el, idx) {
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height * 0.5;
        const ratio = (center - viewportHeight * 0.5) / viewportHeight;
        const strength = el.classList.contains('hero-media') ? 18 : 10;
        const y = -ratio * strength;
        el.style.transform = `translateY(${y.toFixed(2)}px)`;
      });
      ticking = false;
    }

    function onScrollParallax() {
      if (ticking) {
        return;
      }
      ticking = true;
      requestAnimationFrame(updateParallax);
    }

    window.addEventListener('scroll', onScrollParallax, { passive: true });
    window.addEventListener('resize', onScrollParallax);
    onScrollParallax();
  }

  // Cursor/magnetic/tilt are library-agnostic and run in both GSAP and fallback modes.
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  let cursor = null;
  if (finePointer) {
    document.body.classList.add('cursor-enhanced');
    cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);

    let targetX = window.innerWidth * 0.5;
    let targetY = window.innerHeight * 0.5;
    let currentX = targetX;
    let currentY = targetY;

    window.addEventListener('mousemove', function (event) {
      targetX = event.clientX;
      targetY = event.clientY;
    });

    function tickCursor() {
      currentX += (targetX - currentX) * 0.22;
      currentY += (targetY - currentY) * 0.22;
      cursor.style.left = `${currentX}px`;
      cursor.style.top = `${currentY}px`;
      requestAnimationFrame(tickCursor);
    }
    requestAnimationFrame(tickCursor);

    document.querySelectorAll('a, button, summary, .tile, .step, .quote').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cursor.classList.add('is-active');
      });
      el.addEventListener('mouseleave', function () {
        cursor.classList.remove('is-active');
      });
    });
  }

  document.querySelectorAll('.btn').forEach(function (button) {
    button.addEventListener('mousemove', function (event) {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width * 0.5;
      const y = event.clientY - rect.top - rect.height * 0.5;
      button.style.setProperty('--mx', `${x * 0.12}px`);
      button.style.setProperty('--my', `${y * 0.12}px`);
    });

    button.addEventListener('mouseleave', function () {
      button.style.setProperty('--mx', '0px');
      button.style.setProperty('--my', '0px');
    });
  });

  document.querySelectorAll('.tile, .step, .quote').forEach(function (card) {
    card.addEventListener('mousemove', function (event) {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * 8;
      const rotateX = (0.5 - y) * 8;
      card.style.setProperty('--tilt-x', `${rotateX}deg`);
      card.style.setProperty('--tilt-y', `${rotateY}deg`);
    });

    card.addEventListener('mouseleave', function () {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });

  // Services cards: mobile plays in viewport center; desktop keeps hover/focus behavior.
  const serviceStories = Array.from(document.querySelectorAll('[data-service-story]')).map(function (story) {
    return {
      story: story,
      video: story.querySelector('.service-story-video')
    };
  }).filter(function (entry) {
    return entry.video;
  });

  if (serviceStories.length) {
    serviceStories.forEach(function (entry) {
      entry.video.pause();
      entry.video.currentTime = 0;
    });

    if (coarsePointer || mobileViewport) {
      let activeStory = null;
      let rafId = 0;

      function playStory(entry) {
        if (activeStory && activeStory !== entry) {
          activeStory.story.classList.remove('is-playing');
          activeStory.video.pause();
        }

        activeStory = entry;
        entry.story.classList.add('is-playing');
        entry.video.play().catch(function () {
          // Ignore autoplay restrictions if the browser blocks the first play.
        });
      }

      function stopStory(entry) {
        entry.story.classList.remove('is-playing');
        entry.video.pause();
        if (activeStory === entry) {
          activeStory = null;
        }
      }

      function updateStoryPlayback() {
        const viewportHeight = window.innerHeight || 1;
        const centerStart = viewportHeight * 0.38;
        const centerEnd = viewportHeight * 0.62;
        let nextActive = null;
        let nextActiveCenterY = -Infinity;

        serviceStories.forEach(function (entry) {
          const rect = entry.story.getBoundingClientRect();
          const centerY = rect.top + rect.height * 0.5;
          const isVisible = rect.bottom > 0 && rect.top < viewportHeight;
          const reachedTop = rect.top <= 0;
          const isCentered = centerY >= centerStart && centerY <= centerEnd;

          if (!isVisible || reachedTop) {
            stopStory(entry);
            return;
          }

          if (isCentered) {
            if (centerY >= nextActiveCenterY) {
              nextActive = entry;
              nextActiveCenterY = centerY;
            }
            return;
          }

          if (!isCentered) {
            stopStory(entry);
          }
        });

        if (nextActive) {
          playStory(nextActive);
        } else if (activeStory) {
          stopStory(activeStory);
        }
      }

      function schedulePlaybackUpdate() {
        if (rafId) {
          return;
        }

        rafId = requestAnimationFrame(function () {
          rafId = 0;
          updateStoryPlayback();
        });
      }

      window.addEventListener('scroll', schedulePlaybackUpdate, { passive: true });
      window.addEventListener('resize', schedulePlaybackUpdate);
      updateStoryPlayback();
    } else {
      serviceStories.forEach(function (entry) {
        function playStoryVideo() {
          entry.story.classList.add('is-playing');
          entry.video.play().catch(function () {
            // Ignore autoplay restrictions if the browser blocks the first play.
          });
        }

        function stopStoryVideo() {
          entry.story.classList.remove('is-playing');
          entry.video.pause();
        }

        entry.story.addEventListener('mouseenter', playStoryVideo);
        entry.story.addEventListener('mouseleave', stopStoryVideo);
        entry.story.addEventListener('focusin', playStoryVideo);
        entry.story.addEventListener('focusout', stopStoryVideo);
      });
    }
  }

  const reviewsTrack = document.querySelector('.reviews-track');
  const reviewsSet = document.querySelector('.reviews-set');
  if (reviewsTrack && reviewsSet) {
    const duplicateSet = reviewsSet.cloneNode(true);
    duplicateSet.setAttribute('aria-hidden', 'true');
    reviewsTrack.appendChild(duplicateSet);

    let reviewsPaused = false;
    let reviewsOffset = 0;
    let reviewsLastTime = 0;
    let reviewsLoopWidth = 0;
    const reviewsSpeed = 14;

    function measureReviewsLoop() {
      const firstSetWidth = reviewsSet.getBoundingClientRect().width;
      const computedStyle = window.getComputedStyle(reviewsTrack);
      const gapValue = Number.parseFloat(computedStyle.columnGap || computedStyle.gap || '0') || 0;
      reviewsLoopWidth = firstSetWidth + gapValue;
    }

    function tickReviews(time) {
      if (!reviewsPaused && reviewsLoopWidth > 0) {
        if (!reviewsLastTime) {
          reviewsLastTime = time;
        }

        const delta = time - reviewsLastTime;
        reviewsLastTime = time;
        reviewsOffset -= (reviewsSpeed * delta) / 1000;

        if (Math.abs(reviewsOffset) >= reviewsLoopWidth) {
          reviewsOffset += reviewsLoopWidth;
        }

        reviewsTrack.style.transform = `translate3d(${reviewsOffset}px, 0, 0)`;
      } else {
        reviewsLastTime = time;
      }

      requestAnimationFrame(tickReviews);
    }

    function startReviews() {
      if (!reviewsLoopWidth) {
        measureReviewsLoop();
      }
      requestAnimationFrame(tickReviews);
    }

    measureReviewsLoop();
    window.addEventListener('resize', measureReviewsLoop);
    reviewsTrack.addEventListener('mouseenter', function () {
      reviewsPaused = true;
    });
    reviewsTrack.addEventListener('mouseleave', function () {
      reviewsPaused = false;
    });
    reviewsTrack.addEventListener('focusin', function () {
      reviewsPaused = true;
    });
    reviewsTrack.addEventListener('focusout', function () {
      reviewsPaused = false;
    });
    startReviews();
  }

  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress__bar';
  progress.appendChild(progressBar);
  document.body.appendChild(progress);

  try {
    await withTimeout(
      Promise.all([
        loadScript('https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/bundled/lenis.min.js'),
        loadScript('https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js'),
        loadScript('https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js')
      ]),
      SCRIPT_TIMEOUT
    );
  } catch (error) {
    setupProgressBarFallback(progressBar);
    setupFallbackReveal();
    return;
  }

  if (!window.gsap || !window.ScrollTrigger || !window.Lenis) {
    setupProgressBarFallback(progressBar);
    setupFallbackReveal();
    return;
  }

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  // Lenis: smooth, inertial scrolling while staying lightweight.
  const lenis = new window.Lenis({
    duration: 1.1,
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 0.92,
    touchMultiplier: 1.15
  });

  lenis.on('scroll', ScrollTrigger.update);
  lenis.on('scroll', updateToneFlow);

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: function (self) {
      gsap.set(progressBar, { scaleX: self.progress });
    }
  });

  // Map existing sections to requested experience zones.
  const sectionMap = {
    hero: document.querySelector('.hero'),
    about: document.querySelector('#jak-dzialamy'),
    services: document.querySelector('#uslugi'),
    gallery: document.querySelector('.trusted'),
    testimonials: document.querySelector('#opinie'),
    contact: document.querySelector('.cta')
  };

  Object.keys(sectionMap).forEach(function (key) {
    const section = sectionMap[key];
    if (section) {
      section.classList.add('fx-section');
      section.dataset.fxRole = key;
    }
  });

  // Fade-in + slide-up for reveal elements, once only.
  const revealSelector = coarsePointer || mobileViewport
    ? '.reveal:not(.section-title):not(.hero-copy h1)'
    : '.reveal';

  if (document.querySelector(revealSelector)) {
    gsap.set(revealSelector, { autoAlpha: 0, y: 34 });
    ScrollTrigger.batch(revealSelector, {
      once: true,
      start: 'top 86%',
      onEnter: function (batch) {
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power3.out'
        });
      }
    });
  }

  // Keep headings static on mobile; clip reveal remains on desktop.
  if (coarsePointer || mobileViewport) {
    forceMobileHeadingVisibility();
  } else {
    const headingTargets = document.querySelectorAll('.hero-copy h1, .section-title');
    headingTargets.forEach(function (heading) {
      gsap.fromTo(
        heading,
        { clipPath: 'inset(0 100% 0 0)', y: 22 },
        {
          clipPath: 'inset(0 0% 0 0)',
          y: 0,
          duration: 1.0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: heading,
            start: 'top 88%',
            once: true
          }
        }
      );
    });
  }

  // Stagger cards, icons and list elements.
  [
    '.services-cases .service-story',
    '.steps .step',
    '.trusted-brands .brand-mark',
    '.reviews-carousel .quote',
    '.faq-items details'
  ].forEach(function (selector) {
    const items = document.querySelectorAll(selector);
    if (!items.length) {
      return;
    }

    gsap.from(items, {
      autoAlpha: 0,
      y: 26,
      scale: 0.98,
      duration: 0.75,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: items[0].closest('section') || items[0],
        start: 'top 82%',
        once: true
      }
    });
  });

  // Parallax and scale-in on imagery.
  const mediaItems = document.querySelectorAll('.hero-media, .tile-media');
  mediaItems.forEach(function (media) {
    gsap.fromTo(
      media,
      {
        scale: 1.08,
        clipPath: 'inset(12% 0 0 0 round 10px)'
      },
      {
        scale: 1,
        clipPath: 'inset(0% 0 0 0 round 10px)',
        duration: 1.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: media,
          start: 'top 86%',
          once: true
        }
      }
    );

    gsap.to(media, {
      yPercent: -10,
      ease: 'none',
      scrollTrigger: {
        trigger: media,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.6
      }
    });
  });

  // Section transitions: subtle blur-out/blur-in choreography between blocks.
  const flowSections = document.querySelectorAll('main > section');
  flowSections.forEach(function (section) {
    gsap.fromTo(
      section,
      { filter: 'blur(4px)', autoAlpha: 0.75 },
      {
        filter: 'blur(0px)',
        autoAlpha: 1,
        duration: 0.75,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          once: true
        }
      }
    );
  });

  // Sticky impression via ScrollTrigger pinning process heading on desktop.
  const processHead = document.querySelector('.process-head');
  const processSection = document.querySelector('#jak-dzialamy');
  if (processHead && processSection && window.innerWidth > 1100) {
    ScrollTrigger.create({
      trigger: processSection,
      start: 'top top+=90',
      end: 'bottom bottom-=120',
      pin: processHead,
      pinSpacing: false
    });
  }

  // Glow pulse enhancement for CTA while it enters viewport.
  const ctaBox = document.querySelector('.cta-box');
  if (ctaBox) {
    gsap.fromTo(
      ctaBox,
      { boxShadow: '0 12px 24px rgba(239, 108, 31, 0.2)' },
      {
        boxShadow: '0 22px 46px rgba(239, 108, 31, 0.38)',
        duration: 1.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ctaBox,
          start: 'top 85%',
          once: true
        }
      }
    );
  }

  // Animated counters for stats if numeric badges/cards are present now or in future content.
  function animateCounter(el) {
    const text = el.textContent ? el.textContent.trim() : '';
    const match = text.match(/\d+[\d\s.,]*/);
    if (!match) {
      return;
    }

    const raw = match[0].replace(/\s/g, '').replace(',', '.');
    const endValue = Number(raw);
    if (Number.isNaN(endValue)) {
      return;
    }

    const decimals = raw.includes('.') ? raw.split('.')[1].length : 0;
    const value = { current: 0 };

    gsap.to(value, {
      current: endValue,
      duration: 1.6,
      ease: 'power2.out',
      onUpdate: function () {
        const formatted = value.current.toFixed(decimals);
        el.textContent = text.replace(match[0], formatted);
      },
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true
      }
    });
  }

  document.querySelectorAll('[data-counter], .stat-value, .kpi-value').forEach(animateCounter);

  // Keep ScrollTrigger synced after layout-impacting assets load.
  window.addEventListener('load', function () {
    ScrollTrigger.refresh();
  });
})();

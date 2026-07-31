(async function () {
  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function isMobile() {
    return window.innerWidth <= 720 || window.matchMedia('(pointer: coarse)').matches;
  }

  function forceMobileHeadingVisibility() {
    if (!isMobile()) {
      return;
    }

    document.querySelectorAll('.section-title, .hero-copy h1').forEach(function (heading) {
      heading.style.removeProperty('opacity');
      heading.style.removeProperty('transform');
      heading.style.removeProperty('clip-path');
    });
  }

  function setTheme(theme) {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
    }

    if (themeToggle) {
      themeToggle.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
    }

    if (window.autoSprinterPrivacy) {
      window.autoSprinterPrivacy.saveTheme(theme);
    }
    window.dispatchEvent(new Event('themechange'));
  }

  setTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const isDark = root.getAttribute('data-theme') === 'dark';
      setTheme(isDark ? 'light' : 'dark');
    });
  }

  renderVehicleSelectorForm();

  const revealItems = document.querySelectorAll('.reveal');
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const pageToneTargets = document.querySelectorAll('main > section, .site-footer');
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  const fleetCarouselModal = document.querySelector('[data-fleet-carousel-modal]');
  const fleetCarouselOpeners = Array.from(document.querySelectorAll('[data-carousel-open]'));
  const fleetCarouselCloseButtons = Array.from(document.querySelectorAll('[data-fleet-carousel-close]'));
  const fleetCarouselPrev = document.querySelector('[data-fleet-carousel-prev]');
  const fleetCarouselNext = document.querySelector('[data-fleet-carousel-next]');
  const fleetCarouselImage = document.querySelector('[data-fleet-carousel-image]');
  const fleetCarouselCaption = document.querySelector('[data-fleet-carousel-caption]');
  const fleetCarouselSlides = [
    { src: 'resources/photos/foto1.jpg', alt: 'Autolaweta Mercedes Sprinter - zdjęcie 1' },
    { src: 'resources/photos/foto2.jpg', alt: 'Autolaweta VW Crafter - zdjęcie 2' },
    { src: 'resources/photos/foto3.jpg', alt: 'Autolaweta - zdjęcie 3' },
    { src: 'resources/photos/mercedes.JPG', alt: 'Mercedes Sprinter - flota' },
    { src: 'resources/photos/vw.jpg', alt: 'VW Crafter - flota' }
  ];

  let fleetCarouselIndex = 0;
  let fleetCarouselLastFocus = null;

  function renderFleetCarouselSlide(index) {
    if (!fleetCarouselImage || !fleetCarouselSlides.length) {
      return;
    }

    fleetCarouselIndex = (index + fleetCarouselSlides.length) % fleetCarouselSlides.length;
    const slide = fleetCarouselSlides[fleetCarouselIndex];
    fleetCarouselImage.src = slide.src;
    fleetCarouselImage.alt = slide.alt;
    if (fleetCarouselCaption) {
      fleetCarouselCaption.textContent = `${fleetCarouselIndex + 1} / ${fleetCarouselSlides.length}`;
    }
  }

  function openFleetCarousel(startIndex) {
    if (!fleetCarouselModal) {
      return;
    }

    fleetCarouselLastFocus = document.activeElement;
    renderFleetCarouselSlide(startIndex || 0);
    fleetCarouselModal.classList.add('is-open');
    fleetCarouselModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (fleetCarouselCloseButtons[0]) {
      fleetCarouselCloseButtons[0].focus();
    }
  }

  function closeFleetCarousel() {
    if (!fleetCarouselModal) {
      return;
    }

    fleetCarouselModal.classList.remove('is-open');
    fleetCarouselModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (fleetCarouselLastFocus && typeof fleetCarouselLastFocus.focus === 'function') {
      fleetCarouselLastFocus.focus();
    }
  }

  if (fleetCarouselModal) {
    fleetCarouselOpeners.forEach(function (opener) {
      opener.addEventListener('click', function () {
        openFleetCarousel(0);
      });

      opener.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openFleetCarousel(0);
        }
      });
    });

    fleetCarouselCloseButtons.forEach(function (closer) {
      closer.addEventListener('click', closeFleetCarousel);
    });

    if (fleetCarouselPrev) {
      fleetCarouselPrev.addEventListener('click', function () {
        renderFleetCarouselSlide(fleetCarouselIndex - 1);
      });
    }

    if (fleetCarouselNext) {
      fleetCarouselNext.addEventListener('click', function () {
        renderFleetCarouselSlide(fleetCarouselIndex + 1);
      });
    }

    document.addEventListener('keydown', function (event) {
      if (!fleetCarouselModal.classList.contains('is-open')) {
        return;
      }

      if (event.key === 'Escape') {
        closeFleetCarousel();
        return;
      }

      if (event.key === 'ArrowLeft') {
        renderFleetCarouselSlide(fleetCarouselIndex - 1);
        return;
      }

      if (event.key === 'ArrowRight') {
        renderFleetCarouselSlide(fleetCarouselIndex + 1);
      }
    });
  }

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

  function renderVehicleSelectorForm() {
    const mount = document.querySelector('[data-selector-form-mount]');
    if (!mount) {
      return;
    }

    mount.outerHTML = `
      <form class="selector-form reveal" data-selector-form aria-busy="true">
        <fieldset class="selector-fieldset">
          <legend>Rodzaj pojazdu</legend>
          <div class="selector-segments">
            <label><input type="radio" name="vehicle" value="car" checked><span>Osobowe</span></label>
            <label><input type="radio" name="vehicle" value="suv"><span>SUV / 4×4</span></label>
            <label><input type="radio" name="vehicle" value="van"><span>Dostawcze</span></label>
          </div>
        </fieldset>

        <p class="selector-group-title">Parametry pojazdu</p>
        <div class="selector-fields selector-vehicle-fields">
          <label class="selector-field">
            <span>Masa</span>
            <span class="selector-input">
              <input type="number" name="weight" aria-label="Masa pojazdu w kilogramach" min="400" max="3500" step="10" value="1300" required inputmode="numeric">
              <small>kg</small>
            </span>
          </label>
          <label class="selector-field">
            <span>Długość</span>
            <span class="selector-input">
              <input type="number" name="length" aria-label="Długość pojazdu w metrach" min="2.5" max="8" step="0.1" value="4.3" required inputmode="decimal">
              <small>m</small>
            </span>
          </label>
          <label class="selector-field">
            <span>Szerokość</span>
            <span class="selector-input">
              <input type="number" name="width" aria-label="Szerokość pojazdu w metrach" min="1.2" max="3" step="0.05" value="1.8" required inputmode="decimal">
              <small>m</small>
            </span>
          </label>
        </div>

        <p class="selector-group-title">Plan wynajmu</p>
        <div class="selector-fields selector-trip-fields">
          <label class="selector-field">
            <span>Potrzebny czas</span>
            <span class="selector-input">
              <input type="number" name="hours" aria-label="Potrzebny czas w godzinach" min="1" max="48" step="1" value="6" required inputmode="numeric">
              <small>godz.</small>
            </span>
          </label>
          <label class="selector-field">
            <span>Trasa łącznie</span>
            <span class="selector-input">
              <input type="number" name="distance" aria-label="Planowana trasa łącznie w kilometrach" min="0" max="5000" step="10" value="100" required inputmode="numeric">
              <small>km</small>
            </span>
          </label>
        </div>

        <div class="selector-result" data-selector-result aria-live="polite">
          <p class="selector-result-label">Wstępna rekomendacja</p>
          <div class="selector-result-main">
            <strong data-selector-truck>Wczytywanie danych…</strong>
            <span data-selector-plan></span>
          </div>
          <p data-selector-note>Za chwilę pokażemy dopasowaną lawetę i wariant wynajmu.</p>
          <a class="btn btn-primary" href="tel:+48601659781">Potwierdź dostępność: 601 659 781</a>
        </div>
        <p class="selector-disclaimer">Wynik ma charakter orientacyjny. Przed rezerwacją potwierdzimy masę, wymiary, rozkład obciążenia i dostępność lawety.</p>
      </form>`;
  }

  async function setupVehicleSelector() {
    const form = document.querySelector('[data-selector-form]');
    if (!form) {
      return;
    }

    const result = form.querySelector('[data-selector-result]');
    const truckOutput = form.querySelector('[data-selector-truck]');
    const planOutput = form.querySelector('[data-selector-plan]');
    const noteOutput = form.querySelector('[data-selector-note]');
    const maxPayloadOutput = document.querySelector('[data-selector-max-payload]');
    const maxPlatformOutput = document.querySelector('[data-selector-max-platform]');
    let trailers = [];
    let plans = [];

    function formatNumber(value) {
      return value.toLocaleString('pl-PL', { maximumFractionDigits: 2 });
    }

    function formatHours(hours) {
      const lastTwoDigits = hours % 100;
      const lastDigit = hours % 10;
      if (lastTwoDigits >= 12 && lastTwoDigits <= 14) {
        return `${hours} godzin`;
      }
      if (lastDigit >= 2 && lastDigit <= 4) {
        return `${hours} godziny`;
      }
      return `${hours} godzin`;
    }

    function isValidConfiguration(data) {
      if (!data || !Array.isArray(data.trailers) || !data.trailers.length || !Array.isArray(data.plans) || !data.plans.length) {
        return false;
      }

      const trailersValid = data.trailers.every(function (trailer) {
        return typeof trailer.name === 'string'
          && typeof trailer.image === 'string'
          && trailer.image.length > 0
          && Number.isFinite(trailer.maxPayloadKg)
          && Number.isFinite(trailer.platformLengthM)
          && Number.isFinite(trailer.platformWidthM);
      });
      const plansValid = data.plans.every(function (plan) {
        return Number.isFinite(plan.hours)
          && Number.isFinite(plan.pricePln)
          && (plan.maxDistanceKm === null || Number.isFinite(plan.maxDistanceKm));
      });

      return trailersValid && plansValid;
    }

    try {
      const response = await fetch('resources/data/vehicle-selector.json', { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Configuration request failed: ${response.status}`);
      }

      const configuration = await response.json();
      if (!isValidConfiguration(configuration)) {
        throw new Error('Invalid vehicle selector configuration');
      }

      trailers = configuration.trailers.slice().sort(function (first, second) {
        return first.platformLengthM - second.platformLengthM;
      });
      plans = configuration.plans.slice().sort(function (first, second) {
        return first.hours - second.hours;
      });
    } catch (error) {
      form.setAttribute('aria-busy', 'false');
      result.dataset.state = 'error';
      delete result.dataset.trailer;
      result.style.removeProperty('--trailer-image');
      truckOutput.textContent = 'Konfigurator niedostępny';
      planOutput.textContent = '';
      noteOutput.textContent = 'Nie udało się wczytać danych. Odśwież stronę lub zadzwoń, aby dobrać lawetę.';
      console.error(error);
      return;
    }

    const maxPayload = Math.max.apply(null, trailers.map(function (trailer) {
      return trailer.maxPayloadKg;
    }));
    const maxLength = Math.max.apply(null, trailers.map(function (trailer) {
      return trailer.platformLengthM;
    }));
    const maxWidth = Math.max.apply(null, trailers.map(function (trailer) {
      return trailer.platformWidthM;
    }));
    const maxPlanHours = Math.max.apply(null, plans.map(function (plan) {
      return plan.hours;
    }));
    const planDistanceLimits = plans.map(function (plan) {
      return plan.maxDistanceKm;
    }).filter(Number.isFinite);
    const maxPlanDistance = planDistanceLimits.length ? Math.max.apply(null, planDistanceLimits) : Number.POSITIVE_INFINITY;

    if (maxPayloadOutput) {
      maxPayloadOutput.textContent = `${formatNumber(maxPayload)} kg`;
    }
    if (maxPlatformOutput) {
      maxPlatformOutput.textContent = `${formatNumber(maxLength)} × ${formatNumber(maxWidth)} m`;
    }
    form.setAttribute('aria-busy', 'false');

    function getNumber(name) {
      const field = form.elements.namedItem(name);
      return field ? Number.parseFloat(field.value) : Number.NaN;
    }

    function updateRecommendation() {
      const vehicleField = form.elements.namedItem('vehicle');
      const vehicle = vehicleField ? vehicleField.value : 'car';
      const weight = getNumber('weight');
      const length = getNumber('length');
      const width = getNumber('width');
      const hours = getNumber('hours');
      const distance = getNumber('distance');

      if ([weight, length, width, hours, distance].some(Number.isNaN)) {
        result.dataset.state = 'warning';
        delete result.dataset.trailer;
        result.style.removeProperty('--trailer-image');
        truckOutput.textContent = 'Uzupełnij parametry';
        planOutput.textContent = 'Brak rekomendacji';
        noteOutput.textContent = 'Wszystkie pola są potrzebne do wykonania wstępnego doboru.';
        return;
      }

      const fittingTrailers = trailers.filter(function (trailer) {
        return weight <= trailer.maxPayloadKg
          && length <= trailer.platformLengthM
          && width <= trailer.platformWidthM;
      });

      if (!fittingTrailers.length) {
        const exceeded = [];
        if (weight > maxPayload) exceeded.push(`masę ${formatNumber(maxPayload)} kg`);
        if (length > maxLength) exceeded.push(`długość ${formatNumber(maxLength)} m`);
        if (width > maxWidth) exceeded.push(`szerokość ${formatNumber(maxWidth)} m`);

        result.dataset.state = 'error';
    delete result.dataset.trailer;
    result.style.removeProperty('--trailer-image');
        truckOutput.textContent = 'Wymagana konsultacja';
        planOutput.textContent = 'Poza standardowym zakresem';
        noteOutput.textContent = exceeded.length
          ? `Pojazd przekracza ${exceeded.join(', ')}. Zadzwoń, aby sprawdzić możliwość transportu innym rozwiązaniem.`
          : 'Połączenie podanych parametrów nie mieści się na dostępnych lawetach. Skontaktuj się z nami, aby potwierdzić inne rozwiązanie.';
        return;
      }

      const preferredTrailer = fittingTrailers.find(function (trailer) {
        return Array.isArray(trailer.preferredVehicleTypes) && trailer.preferredVehicleTypes.includes(vehicle);
      });
      const trailer = preferredTrailer || fittingTrailers[0];
      const exceedsStandardPlan = hours > maxPlanHours || distance > maxPlanDistance;
      const selectedPlan = exceedsStandardPlan ? null : plans.find(function (plan) {
        const distanceFits = plan.maxDistanceKm === null || distance <= plan.maxDistanceKm;
        return hours <= plan.hours && distanceFits;
      });
      const planWarning = !selectedPlan;
      const plan = selectedPlan
        ? `${formatHours(selectedPlan.hours)} · ${formatNumber(selectedPlan.pricePln)} zł`
        : 'Wycena indywidualna';

      result.dataset.state = planWarning ? 'warning' : 'success';
    result.dataset.trailer = trailer.id;
      const trailerImageUrl = new URL(trailer.image, document.baseURI).href;
      result.style.setProperty('--trailer-image', `url(${JSON.stringify(trailerImageUrl)})`);
      truckOutput.textContent = trailer.name;
      planOutput.textContent = plan;
      noteOutput.textContent = planWarning
        ? `Parametry pojazdu pasują, ale czas lub dystans przekracza standardowy wariant ${formatHours(maxPlanHours)} / ${formatNumber(maxPlanDistance)} km.`
        : `Parametry mieszczą się w zakresie lawety ${trailer.name}. Ostateczny dobór potwierdzimy przed rezerwacją.`;
    }

    form.addEventListener('input', updateRecommendation);
    form.addEventListener('change', updateRecommendation);
    updateRecommendation();
  }

  function setupMobileCallVisibility() {
    const mobileCall = document.querySelector('.mobile-call');
    const hero = document.querySelector('.hero');
    if (!mobileCall || !hero) {
      return;
    }

    function updateMobileCallVisibility() {
      const heroBottom = hero.offsetTop + hero.offsetHeight;
      mobileCall.classList.toggle('is-hidden', window.scrollY < heroBottom * 0.75);
    }

    window.addEventListener('scroll', updateMobileCallVisibility, { passive: true });
    window.addEventListener('resize', updateMobileCallVisibility);
    updateMobileCallVisibility();
  }

  setupActiveNavigation();
  setupVehicleSelector();
  setupMobileCallVisibility();
  const updateToneFlow = setupSectionToneFlow();
  if (isMobile()) {
    forceMobileHeadingVisibility();
  }
  window.addEventListener('resize', function () {
    if (isMobile()) {
      forceMobileHeadingVisibility();
    }
  });

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
    if (isMobile()) {
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

    // Lightweight parallax fallback only for non-hero media to avoid exposing hero background edges.
    const parallaxItems = document.querySelectorAll('.tile-media');
    let ticking = false;
    function updateParallax() {
      const viewportHeight = window.innerHeight || 1;
      parallaxItems.forEach(function (el) {
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height * 0.5;
        const ratio = (center - viewportHeight * 0.5) / viewportHeight;
        const y = -ratio * 10;
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

    if (isMobile()) {
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
        const centerStart = viewportHeight * 0.3;
        const centerEnd = viewportHeight * 0.7;
        let nextActive = null;
        let nextActiveCenterY = -Infinity;

        serviceStories.forEach(function (entry) {
          const rect = entry.story.getBoundingClientRect();
          const centerY = rect.top + rect.height * 0.5;
          const isVisible = rect.bottom > 0 && rect.top < viewportHeight;
          const reachedTop = rect.top < 0;
          const isCentered = centerY >= centerStart && centerY <= centerEnd && isVisible;

          if (!isVisible || reachedTop) {
            stopStory(entry);
            return;
          }

          if (isCentered) {
            if (centerY >= nextActiveCenterY) {
              nextActive = entry;
              nextActiveCenterY = centerY;
            }
          } else {
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
        loadScript('resources/scripts/lenis.min.js'),
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
    about: document.querySelector('#flota'),
    services: document.querySelector('#cennik'),
    gallery: document.querySelector('.trusted'),
    testimonials: document.querySelector('#warunki'),
    contact: document.querySelector('.cta')
  };

  Object.keys(sectionMap).forEach(function (key) {
    const section = sectionMap[key];
    if (section) {
      section.classList.add('fx-section');
      section.dataset.fxRole = key;
    }
  });

  // The first viewport must never depend on a scroll event to become visible.
  const heroRevealItems = document.querySelectorAll('.hero .reveal');
  const scrollRevealItems = Array.from(revealItems).filter(function (item) {
    return item.closest('.hero') === null;
  });
  gsap.set(heroRevealItems, { autoAlpha: 1, y: 0 });
  gsap.set(scrollRevealItems, { autoAlpha: 0, y: 34 });
  ScrollTrigger.batch(scrollRevealItems, {
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

  // Keep headings static on mobile; clip reveal remains on desktop.
  if (isMobile()) {
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

  // Parallax and scale-in on non-hero imagery.
  const mediaItems = document.querySelectorAll('.tile-media');
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
  const flowSections = document.querySelectorAll('main > section:not(.hero)');
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
  const processSection = document.querySelector('#flota');
  const processSectionTallEnough = processSection && processSection.offsetHeight > 980;
  if (processHead && processSection && processSectionTallEnough && window.innerWidth > 1100) {
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

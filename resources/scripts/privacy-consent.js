(function () {
  'use strict';

  const CONSENT_KEY = 'autosprinter-privacy-consent';
  const THEME_KEY = 'autosprinter-theme';
  const CONSENT_VERSION = 1;
  const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  const root = document.documentElement;

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (error) {
      return null;
    }
  }

  function getConsent() {
    const consent = readJson(CONSENT_KEY);
    if (!consent || consent.version !== CONSENT_VERSION || Date.now() - consent.updatedAt > CONSENT_MAX_AGE) {
      return null;
    }
    return consent;
  }

  function hasConsent(category) {
    const consent = getConsent();
    return Boolean(consent && consent[category]);
  }

  function getPreferredTheme() {
    if (hasConsent('preferences')) {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  root.setAttribute('data-theme', getPreferredTheme());

  window.autoSprinterPrivacy = {
    hasConsent: hasConsent,
    saveTheme: function (theme) {
      if (hasConsent('preferences')) {
        localStorage.setItem(THEME_KEY, theme);
      }
    },
    openSettings: function () {
      document.dispatchEvent(new CustomEvent('autosprinter:open-privacy'));
    }
  };

  window.autoSprinterTrack = function (eventName, parameters) {
    if (!hasConsent('analytics')) {
      return;
    }

    const detail = Object.assign({ event: eventName, page: window.location.pathname }, parameters || {});
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(detail);
    window.dispatchEvent(new CustomEvent('autosprinter:analytics', { detail: detail }));
  };

  document.addEventListener('DOMContentLoaded', function () {
    const mapFrames = Array.from(document.querySelectorAll('iframe[data-consent-src="google-maps"]'));
    const isPrivacyPage = window.location.pathname.endsWith('/privacy.html');

    if (isPrivacyPage) {
      const indexLinks = Array.from(document.querySelectorAll('.legal-index a[href^="#"]'));
      const legalSections = Array.from(document.querySelectorAll('.legal-section[id]'));

      function updateActiveLegalSection() {
        const marker = window.innerHeight * 0.3;
        let activeSection = legalSections[0];

        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
          activeSection = legalSections[legalSections.length - 1];
        } else {
          legalSections.forEach(function (section) {
            if (section.getBoundingClientRect().top <= marker) {
              activeSection = section;
            }
          });
        }

        indexLinks.forEach(function (link) {
          const isActive = link.getAttribute('href') === '#' + activeSection.id;
          link.classList.toggle('is-active', isActive);
          if (isActive) {
            link.setAttribute('aria-current', 'true');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      }

      window.addEventListener('scroll', updateActiveLegalSection, { passive: true });
      window.addEventListener('resize', updateActiveLegalSection);
      updateActiveLegalSection();
    }
    let lastFocusedElement = null;

    const banner = document.createElement('section');
    banner.className = 'privacy-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'true');
    banner.setAttribute('aria-labelledby', 'privacy-title');
    banner.hidden = true;
    banner.innerHTML = `
      <div class="privacy-banner-inner">
        <div class="privacy-copy">
          <p class="privacy-eyebrow">Twoja prywatność</p>
          <h2 id="privacy-title">Ty decydujesz, co uruchamiamy</h2>
          <p>Używamy pamięci przeglądarki do zapisu ustawień. <br>
          Mapę Google i opcjonalne funkcje analityczne uruchamiamy tylko za Twoją zgodą. <a href="privacy.html">Polityka prywatności</a></p>
        </div>
        <div class="privacy-options" data-privacy-options hidden>
          <label class="privacy-option privacy-option-locked">
            <span><strong>Niezbędne</strong><small>Zapis decyzji i bezpieczeństwo strony</small></span>
            <input type="checkbox" checked disabled aria-label="Niezbędne, zawsze aktywne">
          </label>
          <label class="privacy-option">
            <span><strong>Preferencje</strong><small>Zapamiętanie jasnego lub ciemnego motywu</small></span>
            <input type="checkbox" data-consent-category="preferences">
          </label>
          <label class="privacy-option">
            <span><strong>Analityka</strong><small>Pomiar kliknięć i skuteczności strony</small></span>
            <input type="checkbox" data-consent-category="analytics">
          </label>
          <label class="privacy-option">
            <span><strong>Treści zewnętrzne</strong><small>Osadzona mapa Google</small></span>
            <input type="checkbox" data-consent-category="external">
          </label>
        </div>
        <div class="privacy-actions">
          <button class="privacy-button privacy-button-primary" type="button" data-consent-action="accept">Akceptuję wszystkie</button>
          <button class="privacy-button" type="button" data-consent-action="essential">Tylko niezbędne</button>
          <button class="privacy-button privacy-button-text" type="button" data-consent-action="customize">Dostosuj</button>
          <button class="privacy-button privacy-button-primary" type="button" data-consent-action="save" hidden>Zapisz wybór</button>
        </div>
      </div>`;

    const settingsButton = document.createElement('button');
    settingsButton.className = 'privacy-settings-trigger';
    settingsButton.type = 'button';
    settingsButton.textContent = 'Ustawienia prywatności';
    settingsButton.hidden = true;

    document.body.append(banner, settingsButton);

    const options = banner.querySelector('[data-privacy-options]');
    const customizeButton = banner.querySelector('[data-consent-action="customize"]');
    const saveButton = banner.querySelector('[data-consent-action="save"]');
    const categoryInputs = Array.from(banner.querySelectorAll('[data-consent-category]'));

    function setBannerOpen(isOpen, showOptions) {
      banner.hidden = !isOpen;
      settingsButton.hidden = isOpen || !getConsent();
      document.body.classList.toggle('privacy-dialog-open', isOpen);
      options.hidden = !showOptions;
      saveButton.hidden = !showOptions;
      customizeButton.hidden = showOptions;

      if (isOpen) {
        const consent = getConsent();
        categoryInputs.forEach(function (input) {
          input.checked = Boolean(consent && consent[input.dataset.consentCategory]);
        });
        banner.querySelector('button').focus();
      } else if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
    }

    function loadMap(frame) {
      if (frame.src) {
        return;
      }
      frame.src = frame.dataset.src;
      const placeholder = frame.previousElementSibling;
      if (placeholder && placeholder.classList.contains('map-consent-placeholder')) {
        placeholder.remove();
      }
      frame.hidden = false;
    }

    function renderMaps() {
      mapFrames.forEach(function (frame) {
        if (hasConsent('external')) {
          loadMap(frame);
          return;
        }

        frame.removeAttribute('src');
        frame.hidden = true;
        if (frame.previousElementSibling && frame.previousElementSibling.classList.contains('map-consent-placeholder')) {
          return;
        }

        const placeholder = document.createElement('div');
        placeholder.className = 'map-consent-placeholder';
        placeholder.innerHTML = `
          <p><strong>Mapa Google jest wyłączona</strong></p>
          <p>Załaduj ją, jeśli zgadzasz się na przekazanie danych do Google.</p>
          <div class="map-consent-actions">
            <button class="privacy-button privacy-button-primary" type="button">Załaduj mapę</button>
            <a href="https://www.google.com/maps/search/?api=1&query=Harfowa+32%2C+Gda%C5%84sk" target="_blank" rel="noopener noreferrer">Otwórz trasę w Google Maps</a>
          </div>`;
        placeholder.querySelector('button').addEventListener('click', function () {
          const current = getConsent() || {};
          saveConsent({
            preferences: Boolean(current.preferences),
            analytics: Boolean(current.analytics),
            external: true
          });
        });
        frame.before(placeholder);
      });
    }

    function saveConsent(categories) {
      const consent = {
        version: CONSENT_VERSION,
        updatedAt: Date.now(),
        preferences: Boolean(categories.preferences),
        analytics: Boolean(categories.analytics),
        external: Boolean(categories.external)
      };
      localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));

      if (consent.preferences) {
        localStorage.setItem(THEME_KEY, root.getAttribute('data-theme') || getPreferredTheme());
      } else {
        localStorage.removeItem(THEME_KEY);
      }

      renderMaps();
      setBannerOpen(false, false);
      document.dispatchEvent(new CustomEvent('autosprinter:consent-changed', { detail: consent }));
    }

    banner.addEventListener('click', function (event) {
      const action = event.target.closest('[data-consent-action]');
      if (!action) {
        return;
      }

      if (action.dataset.consentAction === 'accept') {
        saveConsent({ preferences: true, analytics: true, external: true });
      } else if (action.dataset.consentAction === 'essential') {
        saveConsent({ preferences: false, analytics: false, external: false });
      } else if (action.dataset.consentAction === 'customize') {
        options.hidden = false;
        saveButton.hidden = false;
        customizeButton.hidden = true;
        categoryInputs[0].focus();
      } else if (action.dataset.consentAction === 'save') {
        const selection = {};
        categoryInputs.forEach(function (input) {
          selection[input.dataset.consentCategory] = input.checked;
        });
        saveConsent(selection);
      }
    });

    settingsButton.addEventListener('click', function () {
      lastFocusedElement = settingsButton;
      setBannerOpen(true, true);
    });

    document.addEventListener('autosprinter:open-privacy', function () {
      lastFocusedElement = document.activeElement;
      setBannerOpen(true, true);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !banner.hidden && getConsent()) {
        setBannerOpen(false, false);
      }

      if (event.key === 'Tab' && !banner.hidden) {
        const focusable = Array.from(banner.querySelectorAll('a[href], button:not([hidden]), input:not([disabled])'))
          .filter(function (element) { return !element.closest('[hidden]'); });
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    document.addEventListener('click', function (event) {
      const link = event.target.closest('a, button');
      if (!link) {
        return;
      }
      if (link.matches('a[href^="tel:"]')) {
        window.autoSprinterTrack('phone_click', { label: link.textContent.trim() });
      } else if (link.matches('a[href="#dobor"]')) {
        window.autoSprinterTrack('selector_open', { label: link.textContent.trim() });
      } else if (link.matches('[data-consent-action]')) {
        window.autoSprinterTrack('privacy_action', { action: link.dataset.consentAction });
      }
    });

    renderMaps();
    if (getConsent()) {
      settingsButton.hidden = false;
    } else if (!isPrivacyPage) {
      setBannerOpen(true, false);
    }
  });
}());

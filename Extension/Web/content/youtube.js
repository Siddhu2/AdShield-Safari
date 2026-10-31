/**
 * AdShield - YouTube Ad Fast-Forward & Auto-Skip Engine
 * Safely fast-forwards and skips ads while ensuring normal video playback is never disturbed.
 */

(function () {
  'use strict';

  let isEnabled = true;
  let wasMutedByAdShield = false;
  let lastAdSkippedTime = 0;

  // Check initial extension settings
  try {
    chrome.storage.local.get(['adshield_enabled', 'whitelist'], (res) => {
      if (res && res.adshield_enabled === false) {
        isEnabled = false;
        return;
      }
      const host = window.location.hostname;
      if (res && Array.isArray(res.whitelist) && res.whitelist.includes(host)) {
        isEnabled = false;
        return;
      }
      startYouTubeShield();
    });
  } catch (e) {
    startYouTubeShield();
  }

  // Listen for setting changes
  try {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.adshield_enabled) {
        isEnabled = changes.adshield_enabled.newValue !== false;
      }
      if (changes.whitelist) {
        const host = window.location.hostname;
        const wl = changes.whitelist.newValue || [];
        isEnabled = !wl.includes(host);
      }
    });
  } catch (e) {}

  function reportAdBlocked() {
    try {
      chrome.runtime.sendMessage({ action: 'adBlocked', host: 'youtube.com' });
    } catch (e) {}
  }

  function startYouTubeShield() {
    stripInitialAdPlacements();
    setupPlayerAdSkipper();
    setupAntiAdblockBypass();
    setupCosmeticCleaner();
  }

  /**
   * Layer 1: Clean ytInitialPlayerResponse ad metadata on page load
   */
  function stripInitialAdPlacements() {
    const script = document.createElement('script');
    script.textContent = `(${function () {
      function cleanData(data) {
        if (!data || typeof data !== 'object') return data;
        if (data.adPlacements) delete data.adPlacements;
        if (data.playerAds) delete data.playerAds;
        if (data.adSlots) delete data.adSlots;
        return data;
      }

      let _resp = window.ytInitialPlayerResponse;
      Object.defineProperty(window, 'ytInitialPlayerResponse', {
        configurable: true,
        enumerable: true,
        get: () => _resp,
        set: (val) => {
          _resp = cleanData(val);
        }
      });

      // Native player programmatic skipAd in page context
      setInterval(() => {
        try {
          const player = document.getElementById('movie_player');
          if (player && (player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting'))) {
            if (typeof player.skipAd === 'function') {
              player.skipAd();
            }
          }
        } catch (e) {}
      }, 100);
    }.toString()})();`;

    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }

  /**
   * Layer 2: Fast-forward and auto-skip ads with synthetic pointer/mouse events and player API
   */
  function setupPlayerAdSkipper() {
    const skipSelectors = [
      // Modern YouTube skip buttons (2024-2026)
      'button.ytp-ad-skip-button-modern',
      '.ytp-ad-skip-button-modern',
      'button.ytp-skip-ad-button',
      '.ytp-skip-ad-button',
      '.ytp-ad-skip-button',
      '.ytp-ad-skip-button-container button',
      '.ytp-ad-skip-button-container',
      '.ytp-ad-skip-button-slot button',
      '.ytp-ad-skip-button-slot',
      '.ytp-ad-skip-slot button',
      '.ytp-ad-skip-slot',
      '[id^="skip-button:"] button',
      '[id^="skip-button:"]',
      'button[id^="skip-button"]',
      '.ytp-ad-skip-button-text',
      '.ytp-ad-skip-button-icon',
      // Overlay & banner dismissal
      '.ytp-ad-overlay-close-button',
      'button.ytp-ad-overlay-close-button',
      // Scoped within ad module & player overlay
      '.ytp-ad-player-overlay [aria-label*="Skip" i]',
      '.ytp-ad-module [aria-label*="Skip" i]',
      '.ytp-ad-player-overlay button',
      '.ytp-ad-module button[class*="skip" i]'
    ];

    function simulateClick(element) {
      if (!element) return false;

      const rect = element.getBoundingClientRect();
      const x = rect.left + (rect.width > 0 ? rect.width / 2 : 10);
      const y = rect.top + (rect.height > 0 ? rect.height / 2 : 10);

      const eventInit = {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
        clientX: x,
        clientY: y,
        screenX: x + (window.screenX || 0),
        screenY: y + (window.screenY || 0),
        buttons: 1,
        pressure: 0.5,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true
      };

      const clickTargets = [element];
      const innerBtn = element.querySelector('button');
      if (innerBtn && !clickTargets.includes(innerBtn)) clickTargets.unshift(innerBtn);
      const parentBtn = element.closest('button');
      if (parentBtn && !clickTargets.includes(parentBtn)) clickTargets.push(parentBtn);

      for (const target of clickTargets) {
        try {
          target.dispatchEvent(new PointerEvent('pointerover', eventInit));
          target.dispatchEvent(new PointerEvent('pointerenter', eventInit));
          target.dispatchEvent(new PointerEvent('pointerdown', eventInit));
          target.dispatchEvent(new MouseEvent('mousedown', eventInit));
          target.dispatchEvent(new PointerEvent('pointerup', eventInit));
          target.dispatchEvent(new MouseEvent('mouseup', eventInit));
          target.dispatchEvent(new MouseEvent('click', eventInit));
          if (typeof target.click === 'function') {
            target.click();
          }
        } catch (e) {
          try {
            if (typeof target.click === 'function') {
              target.click();
            }
          } catch (err) {}
        }
      }
      return true;
    }

    function autoClickSkipButtons() {
      if (!isEnabled) return false;

      const player = document.getElementById('movie_player');
      if (!player) return false;

      // Fast check: only scan if an ad container or class is present
      const adModule = player.querySelector('.ytp-ad-module');
      const hasAdClass = player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting');
      if (!adModule && !hasAdClass) return false;

      const searchRoot = adModule || player;
      let clickedAny = false;

      for (const sel of skipSelectors) {
        const elements = searchRoot.querySelectorAll(sel);
        for (const btn of elements) {
          if (!btn) continue;

          // Skip if explicitly disabled
          if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') {
            continue;
          }

          const clicked = simulateClick(btn);
          if (clicked) {
            clickedAny = true;
            const now = Date.now();
            if (now - lastAdSkippedTime > 1000) {
              lastAdSkippedTime = now;
              reportAdBlocked();
            }
          }
        }
      }

      // Also attempt native player skipAd method if exposed
      if (hasAdClass && typeof player.skipAd === 'function') {
        try {
          player.skipAd();
        } catch (e) {}
      }

      return clickedAny;
    }

    function checkAndProcessAds() {
      if (!isEnabled) return;

      const player = document.getElementById('movie_player');
      const video = document.querySelector('#movie_player video') || document.querySelector('video.html5-main-video') || document.querySelector('video');

      if (!player || !video) return;

      // STRICTURE: Only trigger fast-forward when YouTube explicitly adds ad-showing or ad-interrupting class
      const isAdActive = player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting');

      if (isAdActive) {
        // An advertisement is playing!
        const now = Date.now();
        if (now - lastAdSkippedTime > 1500) {
          lastAdSkippedTime = now;
          reportAdBlocked();
        }

        // 1. Mute ad so user hears nothing
        if (!video.muted) {
          video.muted = true;
          wasMutedByAdShield = true;
        }

        // 2. Accelerate ad to max speed
        video.playbackRate = 16.0;

        // 3. Jump to end of ad
        if (!isNaN(video.duration) && isFinite(video.duration) && video.duration > 0) {
          video.currentTime = video.duration;
        }

        // 4. Click skip button immediately
        autoClickSkipButtons();
      } else {
        // Normal video is playing! Ensure normal speed and un-mute
        if (video.playbackRate > 2.0) {
          video.playbackRate = 1.0;
        }
        if (wasMutedByAdShield) {
          video.muted = false;
          wasMutedByAdShield = false;
        }
      }
    }

    // Monitor ads at 100ms interval
    setInterval(checkAndProcessAds, 100);

    // Fast autonomous watcher specifically for skip buttons (every 50ms)
    setInterval(autoClickSkipButtons, 50);

    // Mutation observer for instant response when ad elements or skip buttons appear
    const observer = new MutationObserver(() => {
      autoClickSkipButtons();
      checkAndProcessAds();
    });

    const target = document.getElementById('movie_player') || document.body;
    if (target) {
      observer.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'disabled', 'aria-disabled'] });
    }
  }

  /**
   * Layer 3: Anti-Adblock modal dismissal
   */
  function setupAntiAdblockBypass() {
    function checkModals() {
      if (!isEnabled) return;

      const modal = document.querySelector('ytd-enforcement-message-view-model') ||
                    document.querySelector('tp-yt-paper-dialog:has(ytd-enforcement-message-view-model)');

      if (modal) {
        modal.remove();
        reportAdBlocked();

        const backdrop = document.querySelector('tp-yt-iron-overlay-backdrop');
        if (backdrop) backdrop.remove();

        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';

        const player = document.getElementById('movie_player');
        if (player && typeof player.playVideo === 'function') {
          player.playVideo();
        }
      }
    }

    setInterval(checkModals, 400);
  }

  /**
   * Layer 4: Cosmetic ad removals
   */
  function setupCosmeticCleaner() {
    function cleanBanners() {
      if (!isEnabled) return;
      const banners = document.querySelectorAll('#masthead-ad, ytd-ad-slot-renderer, ytd-banner-promo-renderer');
      for (const b of banners) {
        b.remove();
      }
    }
    setInterval(cleanBanners, 1500);
  }
})();

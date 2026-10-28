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
    }.toString()})();`;

    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }

  /**
   * Layer 2: Fast-forward and auto-skip ads only when movie_player is actively showing an ad
   */
  function setupPlayerAdSkipper() {
    function clickSkipButtons() {
      const skipSelectors = [
        '.ytp-skip-ad-button',
        '.ytp-ad-skip-button',
        '.ytp-ad-skip-button-modern',
        'button.ytp-ad-skip-button-modern',
        '.ytp-ad-skip-button-slot button',
        '.ytp-ad-overlay-close-button',
        'button[id^="skip-button"]',
        '.ytp-ad-text.ytp-ad-preview-text'
      ];

      for (const sel of skipSelectors) {
        const btn = document.querySelector(sel);
        if (btn) {
          btn.click();
          break;
        }
      }
    }

    function checkAndProcessAds() {
      if (!isEnabled) return;

      const player = document.getElementById('movie_player');
      const video = document.querySelector('#movie_player video') || document.querySelector('video.html5-main-video') || document.querySelector('video');

      if (!player || !video) return;

      // STRICTURE: Only trigger when YouTube explicitly adds ad-showing or ad-interrupting class
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
        clickSkipButtons();
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

    // Monitor at 100ms interval
    setInterval(checkAndProcessAds, 100);

    // Also observe player class changes for instant response
    const observer = new MutationObserver(() => {
      checkAndProcessAds();
    });

    const target = document.getElementById('movie_player') || document.body;
    if (target) {
      observer.observe(target, { attributes: true, attributeFilter: ['class'], subtree: false });
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

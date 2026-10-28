/**
 * AdShield - Universal Ad & Tracker Blocker
 * Handles dynamic ad element collapsing, iframe detection, and anti-adblock modal bypass on standard websites.
 */

(function () {
  'use strict';

  let isEnabled = true;
  let blockedCount = 0;
  const adDomainPatterns = [
    'doubleclick.net',
    'googlesyndication.com',
    'googleadservices.com',
    'adnxs.com',
    'criteo.com',
    'criteo.net',
    'taboola.com',
    'outbrain.com',
    'amazon-adsystem.com',
    'rubiconproject.com',
    'pubmatic.com',
    'openx.net',
    'moatads.com',
    'smartadserver.com',
    'scorecardresearch.com',
    'popads.net',
    'popcash.net',
    'propellerads.com',
    'exoclick.com'
  ];

  // Initialize
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
      startUniversalShield();
    });
  } catch (e) {
    startUniversalShield();
  }

  // Listen for storage changes
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
    blockedCount++;
    try {
      chrome.runtime.sendMessage({ action: 'adBlocked', host: window.location.hostname });
    } catch (e) {}
  }

  function startUniversalShield() {
    scanAndCollapseAds();
    setupDomObserver();
    setupAntiAntiAdblock();
  }

  function isAdIframe(iframe) {
    const src = iframe.src || iframe.dataset.src || '';
    if (!src) return false;
    for (const pattern of adDomainPatterns) {
      if (src.includes(pattern)) return true;
    }
    return false;
  }

  function scanAndCollapseAds() {
    if (!isEnabled) return;

    // 1. Scan iframes
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      if (iframe.dataset.adshieldCollapsed) continue;

      if (isAdIframe(iframe)) {
        iframe.dataset.adshieldCollapsed = 'true';
        iframe.style.setProperty('display', 'none', 'important');
        
        // Also collapse parent if it was solely a container for this ad
        const parent = iframe.parentElement;
        if (parent && parent !== document.body && parent.children.length === 1) {
          parent.style.setProperty('display', 'none', 'important');
        }
        reportAdBlocked();
      }
    }

    // 2. Collapse standard ad slots
    const adSelectors = [
      '.adsbygoogle',
      '[id^="google_ads_"]',
      '[id^="div-gpt-ad"]',
      '.trc_rbox_container',
      '.taboola-placeholder',
      '.outbrain_widget',
      '.sponsored-post'
    ];

    for (const sel of adSelectors) {
      const elements = document.querySelectorAll(sel);
      for (const el of elements) {
        if (!el.dataset.adshieldCollapsed) {
          el.dataset.adshieldCollapsed = 'true';
          el.style.setProperty('display', 'none', 'important');
          reportAdBlocked();
        }
      }
    }
  }

  function setupDomObserver() {
    let debounceTimer = null;
    const observer = new MutationObserver(() => {
      if (!isEnabled) return;
      if (debounceTimer) return;
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        scanAndCollapseAds();
      }, 150);
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        if (document.body) {
          observer.observe(document.body, { childList: true, subtree: true });
        }
      });
    }
  }

  function setupAntiAntiAdblock() {
    // Detect and close anti-adblock blocker modals that lock scrolling
    function checkModalOverlays() {
      if (!isEnabled) return;
      const modals = document.querySelectorAll('[class*="adblock-modal"], [id*="adblock-modal"], [class*="adblocker-overlay"]');
      for (const modal of modals) {
        modal.remove();
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        reportAdBlocked();
      }
    }
    setInterval(checkModalOverlays, 1000);
  }
})();

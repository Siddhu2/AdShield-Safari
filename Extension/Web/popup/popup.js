/**
 * AdShield - Popup Controller
 * Manages UI state, user toggles, whitelisting, and statistics displays.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const masterToggle = document.getElementById('masterToggle');
  const statusBadge = document.getElementById('statusBadge');
  const pageCountEl = document.getElementById('pageCount');
  const totalCountEl = document.getElementById('totalCount');
  const siteDomainEl = document.getElementById('siteDomain');
  const whitelistBtn = document.getElementById('whitelistBtn');
  const youtubeToggle = document.getElementById('youtubeToggle');
  const statusDot = document.querySelector('.status-dot');

  let currentHost = '';
  let currentTabId = null;
  let isWhitelisted = false;

  // 1. Get current active tab
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs[0]) {
      currentTabId = tabs[0].id;
      if (tabs[0].url) {
        try {
          const urlObj = new URL(tabs[0].url);
          currentHost = urlObj.hostname;
          siteDomainEl.textContent = currentHost || 'Internal Page';
        } catch (e) {
          siteDomainEl.textContent = 'Local / System';
        }
      }
    }
  } catch (e) {
    siteDomainEl.textContent = 'Safari Tab';
  }

  // 2. Load tab & global stats from background worker
  function refreshStats() {
    chrome.runtime.sendMessage({ action: 'getTabStats', tabId: currentTabId }, (res) => {
      if (!res) return;

      // Master switch
      masterToggle.checked = res.enabled;
      updateStatusDisplay(res.enabled);

      // Numbers
      pageCountEl.textContent = res.tabCount || 0;
      totalCountEl.textContent = (res.totalBlocked || 0).toLocaleString();

      // YouTube toggle
      youtubeToggle.checked = res.youtubeFastSkip;

      // Whitelist state
      const whitelist = res.whitelist || [];
      isWhitelisted = currentHost && whitelist.includes(currentHost);
      updateWhitelistButton();
    });
  }

  function updateStatusDisplay(enabled) {
    if (enabled) {
      statusBadge.textContent = 'Active';
      statusBadge.classList.remove('disabled');
      statusDot.classList.remove('inactive');
    } else {
      statusBadge.textContent = 'Paused';
      statusBadge.classList.add('disabled');
      statusDot.classList.add('inactive');
    }
  }

  function updateWhitelistButton() {
    if (!currentHost || currentHost.startsWith('Safari') || currentHost.startsWith('Local')) {
      whitelistBtn.disabled = true;
      whitelistBtn.textContent = 'N/A';
      return;
    }

    if (isWhitelisted) {
      whitelistBtn.textContent = 'Resume Blocking';
      whitelistBtn.classList.add('whitelisted');
    } else {
      whitelistBtn.textContent = 'Whitelist Site';
      whitelistBtn.classList.remove('whitelisted');
    }
  }

  // Event: Master Toggle
  masterToggle.addEventListener('change', () => {
    const enabled = masterToggle.checked;
    chrome.storage.local.set({ adshield_enabled: enabled }, () => {
      updateStatusDisplay(enabled);
      if (currentTabId) {
        chrome.tabs.reload(currentTabId);
      }
    });
  });

  // Event: Whitelist Toggle
  whitelistBtn.addEventListener('click', () => {
    if (!currentHost) return;

    chrome.storage.local.get(['whitelist'], (res) => {
      let wl = res.whitelist || [];
      if (isWhitelisted) {
        wl = wl.filter((h) => h !== currentHost);
        isWhitelisted = false;
      } else {
        if (!wl.includes(currentHost)) wl.push(currentHost);
        isWhitelisted = true;
      }

      chrome.storage.local.set({ whitelist: wl }, () => {
        updateWhitelistButton();
        if (currentTabId) {
          chrome.tabs.reload(currentTabId);
        }
      });
    });
  });

  // Event: YouTube Shield Toggle
  youtubeToggle.addEventListener('change', () => {
    chrome.storage.local.set({ youtube_fast_skip: youtubeToggle.checked });
  });

  // Initial load
  refreshStats();
});

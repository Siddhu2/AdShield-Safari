/**
 * AdShield - Background Service Worker
 * Manages statistics, extension badge updates, domain whitelisting, and state synchronization.
 */

const tabBlockedCounts = {};

// Initialize default storage on first run
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['adshield_enabled', 'total_blocked', 'whitelist', 'youtube_fast_skip'], (res) => {
    const defaults = {};
    if (res.adshield_enabled === undefined) defaults.adshield_enabled = true;
    if (res.total_blocked === undefined) defaults.total_blocked = 0;
    if (res.whitelist === undefined) defaults.whitelist = [];
    if (res.youtube_fast_skip === undefined) defaults.youtube_fast_skip = true;
    if (Object.keys(defaults).length > 0) {
      chrome.storage.local.set(defaults);
    }
  });
});

// Update badge for a specific tab
function updateBadge(tabId, count) {
  if (!tabId || tabId < 0) return;
  chrome.storage.local.get(['adshield_enabled'], (res) => {
    if (res && res.adshield_enabled === false) {
      chrome.action.setBadgeText({ tabId, text: 'OFF' });
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#9CA3AF' });
      return;
    }

    if (count > 0) {
      const text = count > 999 ? '999+' : String(count);
      chrome.action.setBadgeText({ tabId, text });
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#2563EB' });
    } else {
      chrome.action.setBadgeText({ tabId, text: '' });
    }
  });
}

// Listen for tab navigation / reload to reset tab count
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    tabBlockedCounts[tabId] = 0;
    updateBadge(tabId, 0);
  }
});

// Clean up tab count when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabBlockedCounts[tabId];
});

// Message listener from content scripts & popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'adBlocked') {
    const tabId = sender.tab ? sender.tab.id : null;
    if (tabId) {
      tabBlockedCounts[tabId] = (tabBlockedCounts[tabId] || 0) + 1;
      updateBadge(tabId, tabBlockedCounts[tabId]);
    }

    // Increment global statistics
    chrome.storage.local.get(['total_blocked', 'site_stats'], (res) => {
      const total = (res.total_blocked || 0) + 1;
      const host = message.host;
      const siteStats = res.site_stats || {};
      if (host) {
        siteStats[host] = (siteStats[host] || 0) + 1;
      }
      chrome.storage.local.set({ total_blocked: total, site_stats: siteStats });
    });
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'getTabStats') {
    const tabId = message.tabId;
    const count = tabId && tabBlockedCounts[tabId] ? tabBlockedCounts[tabId] : 0;
    chrome.storage.local.get(['total_blocked', 'adshield_enabled', 'whitelist', 'youtube_fast_skip'], (res) => {
      sendResponse({
        tabCount: count,
        totalBlocked: res.total_blocked || 0,
        enabled: res.adshield_enabled !== false,
        whitelist: res.whitelist || [],
        youtubeFastSkip: res.youtube_fast_skip !== false
      });
    });
    return true;
  }
});

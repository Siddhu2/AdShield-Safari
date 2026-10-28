# 🛡️ AdShield for Safari

A high-performance Safari Web Extension that blocks intrusive banner ads, trackers, telemetry, and **YouTube video ads** with zero flicker and instant skipping.

---

## ✨ Features

- **🚀 YouTube Video Ad Defense (4-Layer Engine)**:
  1. **Page-Context Payload Stripper**: Intercepts `window.ytInitialPlayerResponse` and `/youtubei/v1/player` to strip `adPlacements` and `playerAds` before the player even initializes.
  2. **Instant Auto-Skipper**: Mutes ads instantly, accelerates playback to 16x speed, seeks straight to completion, and triggers modern skip buttons automatically.
  3. **Anti-Adblock Modal Neutralizer**: Automatically removes the *"Ad blockers violate YouTube's Terms of Service"* modal popup dialogs, clears dimmed backdrops, restores page scrollability, and auto-resumes playback.
  4. **Zero-Flicker CSS Filtering**: Eliminates top mastheads, sponsored cards, in-feed ads, and sidebar promotions without layout shift.
- **🌐 Universal Web Ad Blocker**:
  - **Declarative Net Request (DNR) Rules**: Native network-level blocking of 120+ ad networks, trackers, and popup systems (DoubleClick, Google AdSense/Syndication, Taboola, Outbrain, Criteo, Amazon Ads, PopAds, etc.).
  - **Dynamic Cosmetic Element Collapser**: Dynamically detects and hides ad iframes, banner containers, and sponsored posts on infinite-scroll pages.
- **🖥️ Native macOS Container App**:
  - Lightweight Swift AppKit companion app (`AdShield.app`).
  - One-click shortcuts to open Safari Settings and test on YouTube.
- **🎨 Modern Safari Extension Popup**:
  - Live counter of blocked ads on the current page and all-time total.
  - Per-site whitelist toggle.
  - YouTube Shield toggle switch.
  - Dark and Light mode support adhering to Apple Human Interface Guidelines.

---

## 🚀 Quick Setup & Installation

The extension has been compiled, code-signed, and installed to `~/Applications/AdShield.app`.

### 1. Enable Developer Mode in Safari (One-time)
1. Open **Safari**.
2. Open **Settings** (press `⌘ ,` or choose **Safari > Settings** in the menu bar).
3. Click the **Advanced** tab.
4. Check **"Show features for web developers"** (or **"Show Develop menu in menu bar"**).

### 2. Allow Unsigned Extensions
1. In the macOS top menu bar, click the newly appeared **Develop** menu.
2. Select **"Allow Unsigned Extensions"** (enter your Mac password or Touch ID if prompted).
   *(This allows local, non-Mac-App-Store extensions to run).*

### 3. Turn on AdShield
1. In Safari, go to **Settings > Extensions** tab.
2. Check the box next to **AdShield**.
3. Under website permissions, choose **"Always Allow on Every Website"** so AdShield can block ads seamlessly.

---

## 🧪 Testing

1. Launch Safari and navigate to [https://www.youtube.com](https://www.youtube.com).
2. Play any video:
   - Notice that pre-roll, mid-roll, and sidebar ads are absent or skipped instantaneously.
   - Click the **AdShield icon** in your Safari toolbar to view the blocked ads counter in real-time.

---

## 🛠️ Build Commands

If you make modifications to the extension scripts, styles, or rules:

```bash
cd ~/AdShield-Safari

# Rebuild and install to ~/Applications
make install

# Or launch the container app
make open

# Test directly on YouTube
make test-youtube
```

---

## 📁 Project Structure

```text
AdShield-Safari/
├── App/                                # Native macOS Container App
│   ├── main.swift                      # AppKit companion UI
│   ├── Info.plist                      # Application configuration
│   └── Assets/                         # App icon assets
├── Extension/
│   ├── Native/                         # Safari App Extension Wrapper
│   │   ├── SafariWebExtensionHandler.swift
│   │   └── Info.plist
│   └── Web/                            # Safari Web Extension (Manifest V3)
│       ├── manifest.json               # Extension manifest
│       ├── rules/                      # Declarative Net Request blocklists
│       │   └── rules.json              # 120+ ad & tracker network domains
│       ├── background/                 # Background Service Worker
│       │   └── background.js           # Badge updates, statistics & storage
│       ├── content/                    # Content Scripts & Stylesheets
│       │   ├── youtube.js              # Advanced YouTube Ad Skipper & Modal Killer
│       │   ├── youtube.css             # YouTube cosmetic ad hider
│       │   ├── universal.js            # Universal cosmetic filter & iframe scanner
│       │   └── universal.css           # Global ad banner hiding rules
│       ├── popup/                      # Extension Toolbar Popup UI
│       │   ├── popup.html              # Apple-style popup layout
│       │   ├── popup.css               # Light/dark mode styles
│       │   └── popup.js                # Live stats and toggle logic
│       └── icons/                      # High-resolution icons (16-512px)
├── build_and_install.sh                # End-to-end compiler & packaging script
├── Makefile                            # Convenience build targets
└── README.md
```

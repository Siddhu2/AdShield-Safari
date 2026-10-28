<div align="center">

# 🛡️ AdShield for Safari

**High-Performance Ad Blocker & YouTube Video Ad Skipper for macOS Safari**

[![macOS](https://img.shields.io/badge/macOS-13.0+-black?logo=apple&style=for-the-badge)](https://apple.com/macos)
[![Safari](https://img.shields.io/badge/Safari-16.4+-blue?logo=safari&style=for-the-badge)](https://apple.com/safari)
[![Swift](https://img.shields.io/badge/Swift-5.9+-F05138?logo=swift&style=for-the-badge)](https://developer.apple.com/swift/)
[![Manifest](https://img.shields.io/badge/Manifest-V3-success?style=for-the-badge)](https://developer.apple.com/documentation/safariservices/safari_web_extensions)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

*Say goodbye to unskippable YouTube video ads, banner clutter, and intrusive tracking beacons in Safari.*

[Features](#-key-features) • [Installation](#-installation--setup) • [How It Works](#-how-it-works) • [Build From Source](#-building-from-source) • [FAQ](#-troubleshooting--faq)

</div>

---

## 🚀 Overview

**AdShield** is a modern Safari Web Extension built with Apple's Manifest V3 standard and packaged in a native Swift AppKit container. It combines native WebKit network-level filtering with an intelligent page-context script that eliminates YouTube ads before you can even see or hear them.

Unlike generic ad blockers that get detected and blocked by YouTube's anti-adblock mechanisms, AdShield neutralizes ads at the source while ensuring regular video playback remains flawless.

---

## ✨ Key Features

### 🎬 YouTube Ad Defense
- **⚡ Instant Fast-Forward Auto-Skipper**: When an ad plays, AdShield immediately mutes the ad, accelerates playback rate to 16×, seeks straight to completion, and triggers modern skip buttons programmatically in under 50ms.
- **🛡️ Anti-Adblock Modal Neutralizer**: Automatically removes YouTube's *"Ad blockers violate YouTube's Terms of Service"* modal, clears the darkened backdrop, unlocks page scrolling, and auto-resumes playback.
- **🧹 Zero-Flicker Cosmetic Cleaning**: Eliminates top mastheads, search-sponsored badges, in-feed ads, and sidebar teasers before they can render.
- **🎧 Seamless Audio**: Mutes *only* the ad; restores your actual video volume and 1.0× playback speed instantly.

### 🌐 Universal Web Ad Blocking
- **⚡ Declarative Net Request (DNR)**: Drops network connections to **120+ top ad networks and trackers** (DoubleClick, Google AdSense, Taboola, Outbrain, Criteo, Amazon Ads, PopAds, etc.) directly in Safari's engine before bytes ever reach your Mac.
- **📐 Dynamic Element Collapser**: Employs an efficient `MutationObserver` to detect and collapse empty ad wrappers and iframes on dynamic pages (Reddit, news publications, blogs).
- **🔋 Battery & Data Friendly**: Processing happens natively in WebKit without heavy JavaScript rule engines draining CPU.

### 🎨 Apple-Native Design
- **Toolbar Popup**: Clean macOS design supporting Light & Dark mode with SF Pro typography.
- **Real-Time Metrics**: View current tab blocked counts and all-time statistics.
- **One-Click Whitelist**: Allow ads on trusted creators or sites with a single toggle.
- **Native Container App**: Includes a Swift AppKit companion app (`AdShield.app`) for system registration.

---

## 🛠️ How It Works

```text
                               ┌────────────────────────────────────────────────┐
                               │             AdShield Architecture              │
                               └──────────────────────┬─────────────────────────┘
                                                      │
         ┌────────────────────────────────────────────┼────────────────────────────────────────┐
         │                                            │                                        │
         ▼                                            ▼                                        ▼
┌───────────────────────┐                  ┌───────────────────────┐                ┌──────────────────────┐
│  1. Declarative Net   │                  │  2. YouTube 4-Layer   │                │ 3. Universal Element │
│     Request (DNR)     │                  │     Defense Engine    │                │      Collapser       │
├───────────────────────┤                  ├───────────────────────┤                ├──────────────────────┤
│ Blocks 120+ ad and    │                  │ • JSON Payload Strip  │                │ • Zero-flicker CSS   │
│ tracking networks at  │                  │ • 16x Instant-Skip    │                │ • Dynamic iframe     │
│ WebKit network level  │                  │ • Anti-Adblock Killer │                │   mutation observer  │
│ before downloads occur│                  │ • Zero-flicker CSS    │                │ • White-space fix    │
└───────────────────────┘                  └───────────────────────┘                └──────────────────────┘
```

1. **Declarative Net Request Engine**: Safari's native WebKit network layer parses `rules/rules.json`. Matching tracker scripts and ad domains are dropped immediately.
2. **YouTube Video Ad Engine**: The content script monitors `#movie_player`. The instant YouTube marks an ad as active (`.ad-showing`), it speeds it up 16×, seeks to duration, clicks skip, and resets state for the actual video.
3. **Cosmetic Engine**: Injected styles hide known ad slots and banner units instantly with zero layout shift.

---

## 💻 Installation & Setup

### Prerequisites
- macOS 13.0 (Ventura) or newer
- Safari 16.4 or newer

### 1. Build and Install

Clone this repository and run the installation script:

```bash
git clone https://github.com/Siddhu2/AdShield-Safari.git
cd AdShield-Safari
make install
```

This compiles the native Swift container, packages the Web Extension, signs both bundles with App Sandbox entitlements, and installs `AdShield.app` into `/Applications/`.

---

### 2. Enable in Safari (One-Time Setup)

#### Step 1: Show Developer Features
1. Open **Safari**.
2. Open Settings by pressing **`⌘ ,`** (Command + Comma) or click **Safari > Settings** in the top menu bar.
3. Select the **Advanced** tab (the gear icon on the far right).
4. At the very bottom, check the box:  
   👉 **"Show features for web developers"** *(or "Show Develop menu in menu bar")*.

#### Step 2: Allow Unsigned Extensions
1. In your Mac's top menu bar, click **Develop**.
2. Click **"Allow Unsigned Extensions"** (confirm with Touch ID or your password).  
   *(This enables local developer extensions not distributed through the Mac App Store).*

#### Step 3: Turn on AdShield
1. In Safari Settings, switch to the **Extensions** tab.
2. In the list on the left, check the box next to **AdShield**.
3. Under permissions, select **"Always Allow on Every Website"**.

---

## 🧪 Testing

1. Open [YouTube](https://www.youtube.com) and play any video.
2. Notice pre-roll and mid-roll ads are skipped instantly without delay.
3. Click the **AdShield icon** in your Safari toolbar to see the live counter of blocked ads!

---

## 📁 Repository Structure

```text
AdShield-Safari/
├── App/                                # Native macOS Container App (Swift)
│   ├── main.swift                      # AppKit companion UI
│   ├── App.entitlements                # App Sandbox security profile
│   ├── Info.plist                      # Application bundle manifest
│   └── Assets/
│       └── AppIcon.png                 # Retina application icon
├── Extension/
│   ├── Native/                         # Native App Extension Wrapper
│   │   ├── SafariWebExtensionHandler.swift
│   │   ├── Extension.entitlements      # Sandbox & network client entitlements
│   │   └── Info.plist
│   └── Web/                            # Safari Web Extension (Manifest V3)
│       ├── manifest.json               # Extension configuration
│       ├── rules/
│       │   └── rules.json              # 120+ Declarative Net Request rules
│       ├── background/
│       │   └── background.js           # Badge counter & storage coordinator
│       ├── content/
│       │   ├── youtube.js              # YouTube ad auto-skipper & modal killer
│       │   ├── youtube.css             # YouTube cosmetic ad cleaner
│       │   ├── universal.js            # Global ad blocker & iframe scanner
│       │   └── universal.css           # Global cosmetic element hider
│       ├── popup/
│       │   ├── popup.html              # Apple-styled popup interface
│       │   ├── popup.css               # Light & dark theme styles
│       │   └── popup.js                # Live stats & whitelist controls
│       └── icons/                      # Retina toolbar & system icons (16-512px)
├── build_and_install.sh                # End-to-end automated compiler script
├── Makefile                            # Build shortcuts
├── LICENSE                             # MIT License
└── README.md
```

---

## 🛠️ Building From Source

```bash
# Clean, compile, sign, and install to /Applications
make install

# Launch the container setup window
make open

# Test directly on YouTube
make test-youtube

# Clean build artifacts
make clean
```

---

## ❓ Troubleshooting & FAQ

<details>
<summary><b>Why didn't AdShield show up in the Mac App Store?</b></summary>

AdShield is a local open-source extension installed directly on your machine, not an App Store purchase. It appears in the **left sidebar** of **Safari Settings > Extensions**, not in the App Store search results.
</details>

<details>
<summary><b>Safari shows a warning about unsigned extensions after rebooting?</b></summary>

Because macOS resets developer extension flags on full Safari quit/reboot for security, simply re-click **Develop > Allow Unsigned Extensions** from the menu bar if prompted.
</details>

<details>
<summary><b>How do I allow ads on a specific website?</b></summary>

Click the **AdShield icon** in your Safari toolbar while on that website and click **"Whitelist Site"**. AdShield will pause blocking for that domain until you re-enable it.
</details>

---

## 📄 License

This project is open-source under the [MIT License](LICENSE). Feel free to fork, customize, or contribute!

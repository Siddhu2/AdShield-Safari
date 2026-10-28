#!/usr/bin/env bash
set -e

# ==============================================================================
# AdShield for Safari - Automated Build & Installation Script
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${SCRIPT_DIR}/build"
APP_NAME="AdShield"
APP_BUNDLE="${BUILD_DIR}/${APP_NAME}.app"
EXT_BUNDLE="${APP_BUNDLE}/Contents/PlugIns/${APP_NAME} Extension.appex"
DEST_APP="/Applications/${APP_NAME}.app"

echo "=================================================="
echo "🛡️  Building AdShield for Safari"
echo "=================================================="

# 1. Clean previous build
rm -rf "${BUILD_DIR}"
mkdir -p "${APP_BUNDLE}/Contents/MacOS"
mkdir -p "${APP_BUNDLE}/Contents/Resources/Assets"
mkdir -p "${EXT_BUNDLE}/Contents/MacOS"
mkdir -p "${EXT_BUNDLE}/Contents/Resources"

# 2. Compile Native Container App
echo "📦 [1/6] Compiling Container App (AppKit)..."
swiftc -O -target arm64-apple-macos13.0 -framework AppKit \
  "${SCRIPT_DIR}/App/main.swift" \
  -o "${APP_BUNDLE}/Contents/MacOS/${APP_NAME}"

cp "${SCRIPT_DIR}/App/Info.plist" "${APP_BUNDLE}/Contents/Info.plist"
if [ -d "${SCRIPT_DIR}/App/Assets" ]; then
  cp -R "${SCRIPT_DIR}/App/Assets/"* "${APP_BUNDLE}/Contents/Resources/Assets/"
  cp "${SCRIPT_DIR}/App/Assets/AppIcon.icns" "${APP_BUNDLE}/Contents/Resources/AppIcon.icns" 2>/dev/null || true
fi

# 3. Compile Native Extension Binary
echo "🔌 [2/6] Compiling Safari Extension Handler..."
swiftc -O -target arm64-apple-macos13.0 -framework Foundation -framework SafariServices \
  "${SCRIPT_DIR}/Extension/Native/SafariWebExtensionHandler.swift" \
  -o "${EXT_BUNDLE}/Contents/MacOS/${APP_NAME} Extension"

cp "${SCRIPT_DIR}/Extension/Native/Info.plist" "${EXT_BUNDLE}/Contents/Info.plist"
cp "${SCRIPT_DIR}/App/Assets/AppIcon.icns" "${EXT_BUNDLE}/Contents/Resources/AppIcon.icns" 2>/dev/null || true

# 4. Copy Web Extension Files
echo "🌐 [3/6] Packaging Web Extension assets & rules..."
cp -R "${SCRIPT_DIR}/Extension/Web/"* "${EXT_BUNDLE}/Contents/Resources/"

# 5. Ad-hoc Code Signing with Sandbox Entitlements
echo "✍️  [4/6] Code signing App & Extension with App Sandbox..."
codesign -f -s - --entitlements "${SCRIPT_DIR}/Extension/Native/Extension.entitlements" "${EXT_BUNDLE}"
codesign -f -s - --entitlements "${SCRIPT_DIR}/App/App.entitlements" "${APP_BUNDLE}"

# 6. Install exclusively to /Applications
echo "🚀 [5/6] Installing to ${DEST_APP}..."
rm -rf "${DEST_APP}"
cp -R "${APP_BUNDLE}" "/Applications/"

# Remove intermediate build folder & old user copy to avoid duplicate apps in Spotlight/Launchpad
rm -rf "${BUILD_DIR}"
rm -rf "${HOME}/Applications/${APP_NAME}.app"

# 7. Register with LaunchServices & PlugInKit
echo "🔄 [6/6] Registering extension with macOS & Safari..."
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f -R -trusted "${DEST_APP}"
pluginkit -a "${DEST_APP}/Contents/PlugIns/${APP_NAME} Extension.appex"
pluginkit -e use -i com.siddharth.adshield.Extension
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -gc 2>/dev/null || true

echo ""
echo "=================================================="
echo "✅ AdShield Installed into /Applications Successfully!"
echo "=================================================="

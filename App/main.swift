import AppKit

class AppDelegate: NSObject, NSApplicationDelegate {
    var window: NSWindow!

    func applicationDidFinishLaunching(_ notification: Notification) {
        setupMainMenu()
        buildWindow()
        NSApp.activate(ignoringOtherApps: true)
    }

    func setupMainMenu() {
        let mainMenu = NSMenu()
        let appMenuItem = NSMenuItem()
        mainMenu.addItem(appMenuItem)
        
        let appMenu = NSMenu()
        let quitTitle = "Quit AdShield"
        let quitItem = NSMenuItem(title: quitTitle, action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appMenu.addItem(quitItem)
        appMenuItem.submenu = appMenu
        
        NSApp.mainMenu = mainMenu
    }

    func buildWindow() {
        let width: CGFloat = 520
        let height: CGFloat = 580
        let rect = NSRect(x: 0, y: 0, width: width, height: height)
        
        window = NSWindow(
            contentRect: rect,
            styleMask: [.titled, .closable, .miniaturizable],
            backing: .buffered,
            defer: false
        )
        window.center()
        window.title = "AdShield for Safari"
        window.titlebarAppearsTransparent = true
        window.isReleasedWhenClosed = false

        let contentView = NSView(frame: rect)
        contentView.wantsLayer = true
        window.contentView = contentView

        // 1. Icon & Header
        let iconView = NSImageView(frame: NSRect(x: (width - 72) / 2, y: height - 105, width: 72, height: 72))
        if let iconPath = Bundle.main.path(forResource: "AppIcon", ofType: "png", inDirectory: "Assets"),
           let img = NSImage(contentsOfFile: iconPath) {
            iconView.image = img
        } else if let fallbackImg = NSImage(contentsOfFile: "/Users/siddharth/AdShield-Safari/App/Assets/AppIcon.png") {
            iconView.image = fallbackImg
        }
        contentView.addSubview(iconView)

        let titleLabel = NSTextField(labelWithString: "AdShield for Safari")
        titleLabel.font = NSFont.systemFont(ofSize: 22, weight: .bold)
        titleLabel.alignment = .center
        titleLabel.frame = NSRect(x: 20, y: height - 145, width: width - 40, height: 28)
        contentView.addSubview(titleLabel)

        let subtitleLabel = NSTextField(labelWithString: "High-Performance Ad & YouTube Video Blocker")
        subtitleLabel.font = NSFont.systemFont(ofSize: 13, weight: .regular)
        subtitleLabel.textColor = .secondaryLabelColor
        subtitleLabel.alignment = .center
        subtitleLabel.frame = NSRect(x: 20, y: height - 170, width: width - 40, height: 20)
        contentView.addSubview(subtitleLabel)

        // 2. Status Badge Card
        let statusCard = NSBox(frame: NSRect(x: 40, y: height - 235, width: width - 80, height: 50))
        statusCard.boxType = .custom
        statusCard.cornerRadius = 10
        statusCard.borderWidth = 1
        statusCard.borderColor = NSColor.systemGreen.withAlphaComponent(0.4)
        statusCard.fillColor = NSColor.systemGreen.withAlphaComponent(0.08)

        let checkDot = NSTextField(labelWithString: "●  Extension Ready & Registered")
        checkDot.font = NSFont.systemFont(ofSize: 13, weight: .semibold)
        checkDot.textColor = NSColor.systemGreen
        checkDot.alignment = .center
        checkDot.frame = NSRect(x: 10, y: 14, width: statusCard.frame.width - 20, height: 20)
        statusCard.addSubview(checkDot)
        contentView.addSubview(statusCard)

        // 3. Instructions Box
        let box = NSBox(frame: NSRect(x: 40, y: 135, width: width - 80, height: 185))
        box.boxType = .custom
        box.cornerRadius = 12
        box.borderWidth = 1
        box.borderColor = NSColor.separatorColor
        box.fillColor = NSColor.controlBackgroundColor

        let guideTitle = NSTextField(labelWithString: "Quick Setup Guide")
        guideTitle.font = NSFont.systemFont(ofSize: 14, weight: .bold)
        guideTitle.frame = NSRect(x: 16, y: 150, width: 300, height: 20)
        box.addSubview(guideTitle)

        let steps = [
            "1. Open Safari and go to Settings (⌘ ,)",
            "2. Select the Extensions tab at the top",
            "3. Check the box next to AdShield to turn it on",
            "4. Under Safari's Develop menu, verify that",
            "   \"Allow Unsigned Extensions\" is checked."
        ]

        var currentY: CGFloat = 120
        for step in steps {
            let stepLabel = NSTextField(labelWithString: step)
            stepLabel.font = NSFont.monospacedSystemFont(ofSize: 12, weight: step.hasPrefix("   ") ? .medium : .regular)
            stepLabel.textColor = step.contains("Develop") || step.contains("AdShield") ? .labelColor : .secondaryLabelColor
            stepLabel.frame = NSRect(x: 16, y: currentY, width: width - 112, height: 18)
            box.addSubview(stepLabel)
            currentY -= 21
        }
        contentView.addSubview(box)

        // 4. Action Buttons
        let safariBtn = NSButton(frame: NSRect(x: 40, y: 75, width: (width - 95) / 2, height: 40))
        safariBtn.title = "Open Safari Settings"
        safariBtn.bezelStyle = .rounded
        safariBtn.target = self
        safariBtn.action = #selector(openSafariSettings)
        contentView.addSubview(safariBtn)

        let testBtn = NSButton(frame: NSRect(x: 40 + (width - 95) / 2 + 15, y: 75, width: (width - 95) / 2, height: 40))
        testBtn.title = "Test on YouTube"
        testBtn.bezelStyle = .rounded
        testBtn.target = self
        testBtn.action = #selector(openYouTube)
        contentView.addSubview(testBtn)

        let quitBtn = NSButton(frame: NSRect(x: (width - 120) / 2, y: 25, width: 120, height: 28))
        quitBtn.title = "Close Window"
        quitBtn.bezelStyle = .inline
        quitBtn.target = self
        quitBtn.action = #selector(closeWindow)
        contentView.addSubview(quitBtn)

        window.makeKeyAndOrderFront(nil)
    }

    @objc func openSafariSettings() {
        let script = """
        tell application "Safari" to activate
        tell application "System Events"
            tell process "Safari"
                keystroke "," using command down
            end tell
        end tell
        """
        if let appleScript = NSAppleScript(source: script) {
            var error: NSDictionary?
            appleScript.executeAndReturnError(&error)
        }
    }

    @objc func openYouTube() {
        if let url = URL(string: "https://www.youtube.com") {
            NSWorkspace.shared.open(url)
        }
    }

    @objc func closeWindow() {
        window.close()
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()

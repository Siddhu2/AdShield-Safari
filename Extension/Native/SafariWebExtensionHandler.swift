import Foundation
import SafariServices

@_silgen_name("NSExtensionMain")
func NSExtensionMain()

@objc(SafariWebExtensionHandler)
class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        guard let item = context.inputItems.first as? NSExtensionItem,
              let userInfo = item.userInfo as? [String: Any] else {
            context.completeRequest(returningItems: [], completionHandler: nil)
            return
        }

        let message = userInfo[SFExtensionMessageKey]
        let response = NSExtensionItem()
        response.userInfo = [SFExtensionMessageKey: ["status": "ok", "echo": message ?? ""]]
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}

NSExtensionMain()

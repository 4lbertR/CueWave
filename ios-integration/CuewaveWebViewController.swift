import UIKit
import WebKit
import MobileCoreServices
import UniformTypeIdentifiers

class CuewaveWebViewController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler, UIDocumentPickerDelegate {
    
    var webView: WKWebView!
    var pendingCallback: String?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Configure WKWebView with message handlers
        let contentController = WKUserContentController()
        contentController.add(self, name: "cuewaveFileHandler")
        
        let config = WKWebViewConfiguration()
        config.userContentController = contentController
        config.mediaTypesRequiringUserActionForPlayback = []
        config.allowsInlineMediaPlayback = true
        
        // Enable file access
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        
        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.navigationDelegate = self
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(webView)
        
        // Load your React app
        if let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "dist") {
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        } else {
            // For development, load from localhost
            let devURL = URL(string: "http://localhost:5173")!
            webView.load(URLRequest(url: devURL))
        }
    }
    
    // Handle messages from JavaScript
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "cuewaveFileHandler",
              let body = message.body as? [String: Any],
              let action = body["action"] as? String else { return }
        
        pendingCallback = body["callbackId"] as? String
        
        switch action {
        case "requestFileAccess":
            let type = body["type"] as? String ?? "files"
            presentDocumentPicker(type: type)
            
        case "test":
            // Test message
            if let callback = pendingCallback {
                sendToJavaScript(action: callback, data: ["status": "success", "message": "Native bridge working!"])
            }
            
        default:
            break
        }
    }
    
    // Present iOS document picker
    func presentDocumentPicker(type: String) {
        let types: [UTType]
        
        if type == "folder" {
            types = [.folder]
        } else {
            types = [.mp3, .mpeg4Audio, .wav, .aiff, .audio]
        }
        
        let documentPicker = UIDocumentPickerViewController(forOpeningContentTypes: types, asCopy: false)
        documentPicker.delegate = self
        documentPicker.allowsMultipleSelection = (type != "folder")
        
        present(documentPicker, animated: true)
    }
    
    // Document picker delegate
    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        var files: [[String: Any]] = []
        
        for url in urls {
            // Start accessing security-scoped resource
            guard url.startAccessingSecurityScopedResource() else { continue }
            defer { url.stopAccessingSecurityScopedResource() }
            
            do {
                // Get file attributes
                let attributes = try FileManager.default.attributesOfItem(atPath: url.path)
                let fileSize = attributes[.size] as? Int64 ?? 0
                
                // Read file data for web
                let data = try Data(contentsOf: url)
                let base64 = data.base64EncodedString()
                
                // Get file info
                let fileInfo: [String: Any] = [
                    "name": url.lastPathComponent,
                    "path": url.path,
                    "size": fileSize,
                    "type": getMimeType(for: url),
                    "data": base64,
                    "isDirectory": url.hasDirectoryPath
                ]
                
                files.append(fileInfo)
                
                // Save bookmark for persistent access
                if let bookmark = try? url.bookmarkData(options: .minimalBookmark, includingResourceValuesForKeys: nil, relativeTo: nil) {
                    UserDefaults.standard.set(bookmark, forKey: "bookmark_\(url.lastPathComponent)")
                }
                
            } catch {
                print("Error reading file: \(error)")
            }
        }
        
        // Send files back to JavaScript
        if let callback = pendingCallback {
            sendToJavaScript(action: callback, data: ["files": files])
        }
    }
    
    func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        if let callback = pendingCallback {
            sendToJavaScript(action: callback, data: ["status": "cancelled"])
        }
    }
    
    // Send data back to JavaScript
    func sendToJavaScript(action: String, data: [String: Any]) {
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: data)
            let jsonString = String(data: jsonData, encoding: .utf8)?.replacingOccurrences(of: "'", with: "\\'") ?? "{}"
            
            let js = "window.CuewaveNativeCallback('\(action)', '\(jsonString)');"
            webView.evaluateJavaScript(js) { result, error in
                if let error = error {
                    print("Error sending to JavaScript: \(error)")
                }
            }
        } catch {
            print("Error serializing data: \(error)")
        }
    }
    
    // Get MIME type for file
    func getMimeType(for url: URL) -> String {
        let pathExtension = url.pathExtension.lowercased()
        
        switch pathExtension {
        case "mp3": return "audio/mpeg"
        case "m4a": return "audio/mp4"
        case "aac": return "audio/aac"
        case "wav": return "audio/wav"
        case "aiff": return "audio/aiff"
        case "flac": return "audio/flac"
        default: return "application/octet-stream"
        }
    }
}
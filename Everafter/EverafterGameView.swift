import SwiftUI
import UIKit
import WebKit

/// Native offline container for the complete Everafter game.
/// The game's original HTML, JS and CSS ship inside the app bundle.
struct EverafterGameView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true

        // Fullscreen play, with room for the Dynamic Island and home indicator.
        let safeAreaCSS = """
        (function(){
            var css = '@media (max-width:760px){.shell{padding-top:calc(12px + env(safe-area-inset-top))}}';
            var style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);
        })();
        """
        configuration.userContentController.addUserScript(
            WKUserScript(source: safeAreaCSS, injectionTime: .atDocumentEnd, forMainFrameOnly: true)
        )

        let view = WKWebView(frame: .zero, configuration: configuration)
        view.isOpaque = false
        view.backgroundColor = UIColor(red: 9.0 / 255.0, green: 12.0 / 255.0, blue: 24.0 / 255.0, alpha: 1)
        view.scrollView.backgroundColor = view.backgroundColor
        view.scrollView.bounces = false
        view.scrollView.contentInsetAdjustmentBehavior = .never
        view.navigationDelegate = context.coordinator

        // XcodeGen may copy a folder reference as Game/index.html or flatten it to index.html.
        if let gameURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "Game")
            ?? Bundle.main.url(forResource: "index", withExtension: "html") {
            view.loadFileURL(gameURL, allowingReadAccessTo: gameURL.deletingLastPathComponent())
        } else {
            view.loadHTMLString(
                "<html><body style='background:#090c18;color:white;font-family:system-ui;padding:30px'>Everafter game files are missing from the app bundle.</body></html>",
                baseURL: nil
            )
        }
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKDownloadDelegate {
        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            if navigationAction.shouldPerformDownload {
                decisionHandler(.download)
                return
            }
            if let url = navigationAction.request.url,
               let scheme = url.scheme?.lowercased(),
               scheme == "http" || scheme == "https" {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        func webView(
            _ webView: WKWebView,
            navigationAction: WKNavigationAction,
            didBecome download: WKDownload
        ) {
            download.delegate = self
        }

        func webView(
            _ webView: WKWebView,
            navigationResponse: WKNavigationResponse,
            didBecome download: WKDownload
        ) {
            download.delegate = self
        }

        // Game save exports go into On My iPhone > Everafter when File Sharing is enabled.
        func download(
            _ download: WKDownload,
            decideDestinationUsing response: URLResponse,
            suggestedFilename: String,
            completionHandler: @escaping (URL?) -> Void
        ) {
            guard let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else {
                completionHandler(nil)
                return
            }
            let filename = (suggestedFilename as NSString).lastPathComponent
            let safeFilename = filename.isEmpty ? "everafter-save.json" : filename
            let candidate = directory.appendingPathComponent(safeFilename)
            if FileManager.default.fileExists(atPath: candidate.path) {
                let stem = (safeFilename as NSString).deletingPathExtension
                let ext = (safeFilename as NSString).pathExtension
                let newName = stem + "-" + String(UUID().uuidString.prefix(8)) + (ext.isEmpty ? "" : "." + ext)
                completionHandler(directory.appendingPathComponent(newName))
            } else {
                completionHandler(candidate)
            }
        }
    }
}

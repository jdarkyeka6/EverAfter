import SwiftUI

@main
struct EverafterApp: App {
    var body: some Scene {
        WindowGroup {
            EverafterGameView()
                .ignoresSafeArea()
                .preferredColorScheme(.dark)
        }
    }
}

import SwiftUI

@main
struct CueWaveApp: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                #if os(macOS)
                .frame(minWidth: 1024, idealWidth: 1280, maxWidth: .infinity,
                       minHeight: 768, idealHeight: 1024, maxHeight: .infinity)
                #endif
        }
        #if os(macOS)
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentSize)
        #endif
    }
}

// Main app state manager
class AppState: ObservableObject {
    @Published var isCompactMode = false
    @Published var sidebarOpen = false
    @Published var fadeDuration: Double = 1.0
    
    // Mixer states
    @Published var masterVolume: Double = 0.5
    @Published var deckAVolume: Double = 0.5
    @Published var deckBVolume: Double = 0.5
    @Published var muteA = false
    @Published var muteB = false
    @Published var muteMaster = false
    
    // Deck states
    @Published var deckATracks: [Track] = []
    @Published var deckBTracks: [Track] = []
    @Published var selectedTrackA: Track?
    @Published var selectedTrackB: Track?
    
    // Library states
    @Published var playlists: [Playlist] = []
    @Published var folders: [Folder] = []
    @Published var allFiles: [Track] = []
    
    // Modal states
    @Published var showFolderImportDialog = false
    @Published var showEditPlaylistModal = false
    @Published var showDuplicateModal = false
    @Published var showPlaylistDuplicateModal = false
    @Published var showPlaylistPicker = false
    @Published var showDeckSelectionDialog = false
    @Published var showMoveDialog = false
    @Published var showFileDuplicateModal = false
    
    init() {
        loadLibrary()
    }
    
    func loadLibrary() {
        // Load stored files and library on init
        // This will be implemented with file system access
    }
    
    func toggleCompactMode() {
        withAnimation(.easeInOut(duration: 0.3)) {
            isCompactMode.toggle()
        }
    }
}
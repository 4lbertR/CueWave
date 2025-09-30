import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        ZStack {
            GeometryReader { geometry in
                HStack(spacing: 0) {
                    // Main app view
                    MainAppView()
                        .frame(width: appState.isCompactMode ? geometry.size.width * 0.76 : geometry.size.width)
                        .animation(.easeInOut(duration: 0.3), value: appState.isCompactMode)
                    
                    // Mixer panel
                    if appState.isCompactMode {
                        MixerPanelView()
                            .frame(width: geometry.size.width * 0.24)
                            .transition(.move(edge: .trailing))
                    }
                }
            }
            
            // Overlay modals
            if appState.showFolderImportDialog {
                FolderImportDialog()
            }
            
            if appState.showEditPlaylistModal {
                EditPlaylistModal()
            }
            
            if appState.showDuplicateModal {
                DuplicateHandlingModal()
            }
            
            if appState.showPlaylistDuplicateModal {
                PlaylistDuplicateModal()
            }
            
            if appState.showPlaylistPicker {
                PlaylistPicker()
            }
            
            if appState.showDeckSelectionDialog {
                DeckSelectionDialog()
            }
            
            if appState.showMoveDialog {
                MoveDialog()
            }
            
            if appState.showFileDuplicateModal {
                FileDuplicateModal()
            }
        }
        .sheet(isPresented: $appState.sidebarOpen) {
            EnhancedSidebar()
        }
    }
}

struct MainAppView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color.white
                
                VStack(spacing: 0) {
                    // Header
                    HeaderView()
                        .frame(height: geometry.size.height * 0.08)
                    
                    // Deck controls and track lists
                    HStack(spacing: 0) {
                        // Deck A
                        VStack(spacing: 0) {
                            DeckControlsView(deck: .A)
                                .frame(height: geometry.size.height * 0.15)
                            
                            TrackListView(deck: .A)
                                .frame(maxHeight: .infinity)
                        }
                        .frame(width: geometry.size.width * 0.45)
                        
                        // Center controls
                        VStack {
                            Spacer()
                            CenterControlsView()
                            FadeSliderView()
                            Spacer()
                        }
                        .frame(width: geometry.size.width * 0.1)
                        
                        // Deck B
                        VStack(spacing: 0) {
                            DeckControlsView(deck: .B)
                                .frame(height: geometry.size.height * 0.15)
                            
                            TrackListView(deck: .B)
                                .frame(maxHeight: .infinity)
                        }
                        .frame(width: geometry.size.width * 0.45)
                    }
                }
                
                // Mixer toggle button
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        MixerToggleButton()
                            .padding()
                    }
                }
            }
            .aspectRatio(4/3, contentMode: .fit)
        }
    }
}

struct HeaderView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        HStack {
            Button(action: {
                appState.sidebarOpen = true
            }) {
                Text("Open file / playlist")
                    .foregroundColor(.white)
                    .padding(.horizontal, 30)
                    .padding(.vertical, 10)
                    .background(Color.gray)
                    .cornerRadius(8)
            }
            .buttonStyle(PlainButtonStyle())
            
            Spacer()
            
            Button(action: {
                print("Settings clicked")
            }) {
                Text("Settings")
                    .foregroundColor(.white)
                    .padding(.horizontal, 30)
                    .padding(.vertical, 10)
                    .background(Color.gray)
                    .cornerRadius(8)
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding(.horizontal, 20)
        .padding(.top, 10)
    }
}

enum Deck {
    case A, B
}

struct DeckControlsView: View {
    let deck: Deck
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        HStack(spacing: 15) {
            Button(action: {
                print("Fade In \(deck == .A ? "A" : "B") clicked")
            }) {
                Text("Fade In")
                    .foregroundColor(.white)
                    .frame(width: 100, height: 40)
                    .background(Color.black)
                    .cornerRadius(4)
            }
            .buttonStyle(PlainButtonStyle())
            
            Button(action: {
                print("Play \(deck == .A ? "A" : "B") clicked")
            }) {
                Image(systemName: "play.fill")
                    .foregroundColor(.white)
                    .frame(width: 50, height: 50)
                    .background(Color.black)
                    .clipShape(Circle())
            }
            .buttonStyle(PlainButtonStyle())
            
            Button(action: {
                print("Fade Out \(deck == .A ? "A" : "B") clicked")
            }) {
                Text("Fade Out")
                    .foregroundColor(.white)
                    .frame(width: 100, height: 40)
                    .background(Color.black)
                    .cornerRadius(4)
            }
            .buttonStyle(PlainButtonStyle())
            
            Button(action: {
                print("Fade to Next \(deck == .A ? "A" : "B") clicked")
            }) {
                Text("Fade to Next")
                    .foregroundColor(.white)
                    .frame(width: 100, height: 40)
                    .background(Color.black)
                    .cornerRadius(4)
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding()
    }
}

struct TrackListView: View {
    let deck: Deck
    @EnvironmentObject var appState: AppState
    
    var tracks: [Track] {
        deck == .A ? appState.deckATracks : appState.deckBTracks
    }
    
    var selectedTrack: Track? {
        deck == .A ? appState.selectedTrackA : appState.selectedTrackB
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Deck \(deck == .A ? "A" : "B") Playlist")
                .font(.headline)
                .padding(.horizontal)
                .padding(.vertical, 8)
                .background(Color.gray.opacity(0.1))
                .frame(maxWidth: .infinity, alignment: .leading)
            
            ScrollView {
                VStack(spacing: 0) {
                    ForEach(tracks) { track in
                        TrackRow(track: track, isSelected: selectedTrack?.id == track.id)
                            .onTapGesture {
                                if deck == .A {
                                    appState.selectedTrackA = track
                                } else {
                                    appState.selectedTrackB = track
                                }
                            }
                    }
                }
            }
        }
        .background(Color.gray.opacity(0.05))
        .overlay(
            RoundedRectangle(cornerRadius: 4)
                .stroke(Color.gray.opacity(0.3), lineWidth: 1)
        )
        .padding()
    }
}

struct TrackRow: View {
    let track: Track
    let isSelected: Bool
    
    var body: some View {
        HStack {
            Text(track.name)
                .lineLimit(1)
                .truncationMode(.tail)
            
            Spacer()
            
            Text(track.duration)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(isSelected ? Color.blue.opacity(0.2) : Color.clear)
        .contentShape(Rectangle())
    }
}

struct CenterControlsView: View {
    var body: some View {
        VStack(spacing: 10) {
            Button(action: {
                print("Crossfade A→B clicked")
            }) {
                Text("CROSSFADE A→B")
                    .foregroundColor(.white)
                    .frame(width: 140, height: 40)
                    .background(Color.black)
                    .cornerRadius(4)
            }
            .buttonStyle(PlainButtonStyle())
            
            Button(action: {
                print("Crossfade A←B clicked")
            }) {
                Text("CROSSFADE A←B")
                    .foregroundColor(.white)
                    .frame(width: 140, height: 40)
                    .background(Color.black)
                    .cornerRadius(4)
            }
            .buttonStyle(PlainButtonStyle())
        }
    }
}

struct FadeSliderView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        VStack {
            Text("Fade Time")
                .font(.caption)
            
            Slider(value: $appState.fadeDuration, in: 0...4, step: 0.5)
                .frame(width: 120)
            
            Text("\(appState.fadeDuration, specifier: "%.1f") sec")
                .font(.caption)
        }
        .padding()
    }
}

struct MixerToggleButton: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        Button(action: {
            appState.toggleCompactMode()
        }) {
            Image(systemName: appState.isCompactMode ? "chevron.right.2" : "chevron.left.2")
                .font(.title)
                .foregroundColor(.black)
                .frame(width: 44, height: 44)
                .background(Color.gray.opacity(0.2))
                .clipShape(Circle())
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    ContentView()
        .environmentObject(AppState())
}
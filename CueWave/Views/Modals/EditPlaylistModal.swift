import SwiftUI

struct EditPlaylistModal: View {
    @EnvironmentObject var appState: AppState
    @State private var playlistName = ""
    @State private var selectedTracks: Set<UUID> = []
    @State private var searchText = ""
    
    var filteredFiles: [Track] {
        if searchText.isEmpty {
            return appState.allFiles
        } else {
            return appState.allFiles.filter { 
                $0.name.localizedCaseInsensitiveContains(searchText) 
            }
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Edit Playlist")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Spacer()
                
                Button("Cancel") {
                    appState.showEditPlaylistModal = false
                }
                .buttonStyle(.bordered)
                
                Button("Save") {
                    savePlaylist()
                }
                .buttonStyle(.borderedProminent)
            }
            .padding()
            
            Divider()
            
            // Playlist name
            HStack {
                Text("Name:")
                TextField("Playlist name", text: $playlistName)
                    .textFieldStyle(.roundedBorder)
            }
            .padding()
            
            // Search bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)
                TextField("Search tracks...", text: $searchText)
                    .textFieldStyle(.roundedBorder)
            }
            .padding(.horizontal)
            
            // Track list
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(filteredFiles) { track in
                        TrackSelectionRow(
                            track: track,
                            isSelected: selectedTracks.contains(track.id),
                            onToggle: {
                                if selectedTracks.contains(track.id) {
                                    selectedTracks.remove(track.id)
                                } else {
                                    selectedTracks.insert(track.id)
                                }
                            }
                        )
                    }
                }
            }
            .frame(maxHeight: 400)
            
            // Footer
            HStack {
                Text("\(selectedTracks.count) tracks selected")
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Button("Select All") {
                    selectedTracks = Set(filteredFiles.map { $0.id })
                }
                
                Button("Clear All") {
                    selectedTracks.removeAll()
                }
            }
            .padding()
        }
        .frame(width: 600, height: 600)
        .background(Color(NSColor.windowBackgroundColor))
        .cornerRadius(12)
        .shadow(radius: 10)
    }
    
    func savePlaylist() {
        // Save playlist logic
        print("Saving playlist: \(playlistName) with \(selectedTracks.count) tracks")
        appState.showEditPlaylistModal = false
    }
}

struct TrackSelectionRow: View {
    let track: Track
    let isSelected: Bool
    let onToggle: () -> Void
    
    var body: some View {
        Button(action: onToggle) {
            HStack {
                Image(systemName: isSelected ? "checkmark.square.fill" : "square")
                    .foregroundColor(isSelected ? .accentColor : .secondary)
                
                Image(systemName: "music.note")
                    .foregroundColor(.blue)
                
                VStack(alignment: .leading) {
                    Text(track.name)
                        .lineLimit(1)
                    
                    Text(track.duration)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            .padding(.vertical, 4)
            .padding(.horizontal)
            .background(isSelected ? Color.accentColor.opacity(0.1) : Color.clear)
        }
        .buttonStyle(PlainButtonStyle())
    }
}
import SwiftUI

struct PlaylistPicker: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedPlaylist: Playlist?
    @State private var searchText = ""
    
    var filteredPlaylists: [Playlist] {
        if searchText.isEmpty {
            return appState.playlists
        } else {
            return appState.playlists.filter {
                $0.name.localizedCaseInsensitiveContains(searchText)
            }
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Select Playlist")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Spacer()
                
                Button("Cancel") {
                    appState.showPlaylistPicker = false
                }
                .buttonStyle(.bordered)
            }
            .padding()
            
            Divider()
            
            // Search bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)
                TextField("Search playlists...", text: $searchText)
                    .textFieldStyle(.roundedBorder)
            }
            .padding()
            
            // Playlist list
            ScrollView {
                VStack(alignment: .leading, spacing: 5) {
                    ForEach(filteredPlaylists) { playlist in
                        PlaylistPickerRow(
                            playlist: playlist,
                            isSelected: selectedPlaylist?.id == playlist.id,
                            onSelect: {
                                selectedPlaylist = playlist
                            }
                        )
                    }
                    
                    if filteredPlaylists.isEmpty {
                        Text("No playlists found")
                            .foregroundColor(.secondary)
                            .padding()
                            .frame(maxWidth: .infinity)
                    }
                }
            }
            .frame(height: 300)
            
            Divider()
            
            // Footer
            HStack {
                Button("Create New Playlist") {
                    createNewPlaylist()
                }
                .buttonStyle(.bordered)
                
                Spacer()
                
                Button("Select") {
                    selectPlaylist()
                }
                .buttonStyle(.borderedProminent)
                .disabled(selectedPlaylist == nil)
            }
            .padding()
        }
        .frame(width: 500)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 10)
    }
    
    func createNewPlaylist() {
        let newPlaylist = Playlist(name: "New Playlist \(appState.playlists.count + 1)")
        appState.playlists.append(newPlaylist)
        selectedPlaylist = newPlaylist
    }
    
    func selectPlaylist() {
        if let playlist = selectedPlaylist {
            print("Selected playlist: \(playlist.name)")
            appState.showPlaylistPicker = false
        }
    }
}

struct PlaylistPickerRow: View {
    let playlist: Playlist
    let isSelected: Bool
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            HStack {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isSelected ? .accentColor : .secondary)
                
                Image(systemName: "music.note.list")
                    .foregroundColor(.blue)
                
                VStack(alignment: .leading) {
                    Text(playlist.name)
                        .foregroundColor(.primary)
                    
                    Text("\(playlist.tracks.count) tracks")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Text(playlist.created, style: .date)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.vertical, 8)
            .padding(.horizontal)
            .background(isSelected ? Color.accentColor.opacity(0.1) : Color.clear)
            .cornerRadius(6)
        }
        .buttonStyle(PlainButtonStyle())
    }
}
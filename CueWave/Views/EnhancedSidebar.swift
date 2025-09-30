import SwiftUI
import UniformTypeIdentifiers

struct EnhancedSidebar: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) var dismiss
    @State private var selectedTab = 0
    @State private var expandedFolders: Set<UUID> = []
    @State private var selectedPlaylist: Playlist?
    @State private var selectedFolder: Folder?
    @State private var selectedFile: Track?
    @State private var showingImportOptions = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Tab selector
                Picker("", selection: $selectedTab) {
                    Text("Playlists").tag(0)
                    Text("Folders").tag(1)
                    Text("All Files").tag(2)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()
                
                // Content based on selected tab
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        switch selectedTab {
                        case 0:
                            PlaylistsView()
                        case 1:
                            FoldersView()
                        case 2:
                            AllFilesView()
                        default:
                            EmptyView()
                        }
                    }
                }
                
                Divider()
                
                // Bottom toolbar
                HStack {
                    Button(action: {
                        showingImportOptions = true
                    }) {
                        Label("Import", systemImage: "plus.circle")
                    }
                    
                    Spacer()
                    
                    Button(action: {
                        createNewPlaylist()
                    }) {
                        Label("New Playlist", systemImage: "music.note.list")
                    }
                    
                    Button(action: {
                        createNewFolder()
                    }) {
                        Label("New Folder", systemImage: "folder.badge.plus")
                    }
                }
                .padding()
            }
            .navigationTitle("Library")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .confirmationDialog("Import Options", isPresented: $showingImportOptions) {
            Button("Import Folder") {
                importFolder()
            }
            Button("Import Files") {
                importFiles()
            }
            Button("Cancel", role: .cancel) {}
        }
    }
    
    @ViewBuilder
    func PlaylistsView() -> some View {
        ForEach(appState.playlists) { playlist in
            PlaylistRow(playlist: playlist)
                .onTapGesture {
                    selectedPlaylist = playlist
                }
                .contextMenu {
                    Button("Load to Deck A") {
                        loadPlaylistToDeck(playlist, deck: .A)
                    }
                    Button("Load to Deck B") {
                        loadPlaylistToDeck(playlist, deck: .B)
                    }
                    Button("Edit") {
                        editPlaylist(playlist)
                    }
                    Button("Delete", role: .destructive) {
                        deletePlaylist(playlist)
                    }
                }
        }
        
        if appState.playlists.isEmpty {
            Text("No playlists")
                .foregroundColor(.secondary)
                .padding()
        }
    }
    
    @ViewBuilder
    func FoldersView() -> some View {
        ForEach(appState.folders) { folder in
            FolderRow(folder: folder, level: 0)
        }
        
        if appState.folders.isEmpty {
            Text("No folders")
                .foregroundColor(.secondary)
                .padding()
        }
    }
    
    @ViewBuilder
    func AllFilesView() -> some View {
        ForEach(appState.allFiles) { file in
            FileRow(file: file)
                .onTapGesture {
                    selectedFile = file
                }
                .contextMenu {
                    Button("Load to Deck A") {
                        loadFileToDeck(file, deck: .A)
                    }
                    Button("Load to Deck B") {
                        loadFileToDeck(file, deck: .B)
                    }
                    Button("Add to Playlist...") {
                        addFileToPlaylist(file)
                    }
                }
        }
        
        if appState.allFiles.isEmpty {
            Text("No files")
                .foregroundColor(.secondary)
                .padding()
        }
    }
    
    func FolderRow(folder: Folder, level: Int) -> AnyView {
        AnyView(
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Image(systemName: expandedFolders.contains(folder.id) ? "chevron.down" : "chevron.right")
                        .font(.caption)
                        .frame(width: 20)
                    
                    Image(systemName: "folder")
                    
                    Text(folder.name)
                    
                    Spacer()
                    
                    Text("\(folder.playlists.count + folder.audioFiles.count)")
                        .foregroundColor(.secondary)
                        .font(.caption)
                }
                .padding(.leading, CGFloat(level * 20))
                .padding(.vertical, 4)
                .padding(.horizontal)
                .contentShape(Rectangle())
                .onTapGesture {
                    withAnimation {
                        if expandedFolders.contains(folder.id) {
                            expandedFolders.remove(folder.id)
                        } else {
                            expandedFolders.insert(folder.id)
                        }
                    }
                }
                
                if expandedFolders.contains(folder.id) {
                    // Show playlists
                    ForEach(folder.playlists) { playlist in
                        PlaylistRow(playlist: playlist, inFolder: true, level: level + 1)
                    }
                    
                    // Show audio files
                    ForEach(folder.audioFiles) { file in
                        FileRow(file: file, level: level + 1)
                    }
                    
                    // Show subfolders
                    ForEach(folder.folders) { subfolder in
                        FolderRow(folder: subfolder, level: level + 1)
                    }
                }
            }
        )
    }
    
    // Helper functions
    func importFolder() {
        // Will be implemented with file picker
        print("Import folder")
    }
    
    func importFiles() {
        // Will be implemented with file picker
        print("Import files")
    }
    
    func createNewPlaylist() {
        let playlist = Playlist(name: "New Playlist \(appState.playlists.count + 1)")
        appState.playlists.append(playlist)
    }
    
    func createNewFolder() {
        let folder = Folder(name: "New Folder \(appState.folders.count + 1)")
        appState.folders.append(folder)
    }
    
    func loadPlaylistToDeck(_ playlist: Playlist, deck: Deck) {
        if deck == .A {
            appState.deckATracks = playlist.tracks
        } else {
            appState.deckBTracks = playlist.tracks
        }
        dismiss()
    }
    
    func loadFileToDeck(_ file: Track, deck: Deck) {
        if deck == .A {
            appState.deckATracks = [file]
        } else {
            appState.deckBTracks = [file]
        }
        dismiss()
    }
    
    func editPlaylist(_ playlist: Playlist) {
        // Open edit modal
        appState.showEditPlaylistModal = true
    }
    
    func deletePlaylist(_ playlist: Playlist) {
        appState.playlists.removeAll { $0.id == playlist.id }
    }
    
    func addFileToPlaylist(_ file: Track) {
        appState.showPlaylistPicker = true
    }
}

struct PlaylistRow: View {
    let playlist: Playlist
    var inFolder: Bool = false
    var level: Int = 0
    
    var body: some View {
        HStack {
            Image(systemName: "music.note.list")
            
            Text(playlist.name)
            
            Spacer()
            
            Text("\(playlist.tracks.count) tracks")
                .foregroundColor(.secondary)
                .font(.caption)
        }
        .padding(.leading, CGFloat((inFolder ? level : 0) * 20))
        .padding(.vertical, 4)
        .padding(.horizontal)
    }
}

struct FileRow: View {
    let file: Track
    var level: Int = 0
    
    var body: some View {
        HStack {
            Image(systemName: "music.note")
                .foregroundColor(.blue)
            
            VStack(alignment: .leading) {
                Text(file.name)
                    .lineLimit(1)
                
                HStack {
                    Text(file.duration)
                    if let location = file.location {
                        Text("• \(location)")
                    }
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding(.leading, CGFloat(level * 20))
        .padding(.vertical, 4)
        .padding(.horizontal)
    }
}

#Preview {
    EnhancedSidebar()
        .environmentObject(AppState())
}
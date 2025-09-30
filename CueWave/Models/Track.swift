import Foundation

struct Track: Identifiable, Codable, Hashable {
    let id: UUID
    var name: String
    var duration: String
    var path: String?
    var size: Int64?
    var type: String?
    var location: String?
    var file: Data? // Store file data if needed
    
    init(id: UUID = UUID(), name: String, duration: String = "0:00", path: String? = nil, size: Int64? = nil, type: String? = "audio/mpeg", location: String? = nil, file: Data? = nil) {
        self.id = id
        self.name = name
        self.duration = duration
        self.path = path
        self.size = size
        self.type = type
        self.location = location
        self.file = file
    }
    
    static func == (lhs: Track, rhs: Track) -> Bool {
        lhs.id == rhs.id
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

struct Playlist: Identifiable, Codable {
    let id: UUID
    var name: String
    var tracks: [Track]
    var created: Date
    var displayName: String?
    
    init(id: UUID = UUID(), name: String, tracks: [Track] = [], created: Date = Date(), displayName: String? = nil) {
        self.id = id
        self.name = name
        self.tracks = tracks
        self.created = created
        self.displayName = displayName
    }
}

struct Folder: Identifiable, Codable {
    let id: UUID
    var name: String
    var playlists: [Playlist]
    var folders: [Folder]
    var audioFiles: [Track]
    
    init(id: UUID = UUID(), name: String, playlists: [Playlist] = [], folders: [Folder] = [], audioFiles: [Track] = []) {
        self.id = id
        self.name = name
        self.playlists = playlists
        self.folders = folders
        self.audioFiles = audioFiles
    }
}

struct FolderStructure: Codable {
    var name: String
    var audioFiles: [Track]
    var playlists: [Playlist]
    var subfolders: [FolderStructure]
    
    init(name: String, audioFiles: [Track] = [], playlists: [Playlist] = [], subfolders: [FolderStructure] = []) {
        self.name = name
        self.audioFiles = audioFiles
        self.playlists = playlists
        self.subfolders = subfolders
    }
}
import SwiftUI

struct DuplicateHandlingModal: View {
    @EnvironmentObject var appState: AppState
    @State private var duplicateCount = 0
    @State private var playlistName = ""
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 50))
                .foregroundColor(.orange)
            
            Text("Duplicate Files Found")
                .font(.title2)
                .fontWeight(.bold)
            
            Text("\(duplicateCount) file(s) already exist in '\(playlistName)'")
                .foregroundColor(.secondary)
            
            Text("What would you like to do?")
                .font(.headline)
            
            VStack(spacing: 10) {
                Button(action: {
                    handleChoice("add")
                }) {
                    HStack {
                        Image(systemName: "plus.circle")
                        Text("Add anyway (allow duplicates)")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(8)
                }
                .buttonStyle(PlainButtonStyle())
                
                Button(action: {
                    handleChoice("skip")
                }) {
                    HStack {
                        Image(systemName: "forward.circle")
                        Text("Skip duplicates (add only new files)")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.green.opacity(0.1))
                    .cornerRadius(8)
                }
                .buttonStyle(PlainButtonStyle())
                
                Button(action: {
                    handleChoice("cancel")
                }) {
                    HStack {
                        Image(systemName: "xmark.circle")
                        Text("Cancel (don't add any files)")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(8)
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
        .padding(30)
        .frame(width: 450)
        .background(Color(NSColor.windowBackgroundColor))
        .cornerRadius(12)
        .shadow(radius: 10)
    }
    
    func handleChoice(_ choice: String) {
        print("User chose: \(choice)")
        appState.showDuplicateModal = false
    }
}

struct PlaylistDuplicateModal: View {
    @EnvironmentObject var appState: AppState
    @State private var existingName = ""
    @State private var newName = ""
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "doc.on.doc.fill")
                .font(.system(size: 50))
                .foregroundColor(.orange)
            
            Text("Playlist Already Exists")
                .font(.title2)
                .fontWeight(.bold)
            
            Text("A playlist named '\(existingName)' already exists.")
                .foregroundColor(.secondary)
            
            Text("What would you like to do?")
                .font(.headline)
            
            VStack(spacing: 10) {
                Button(action: {
                    handleChoice("numbered")
                }) {
                    HStack {
                        Image(systemName: "number.circle")
                        Text("Create with numbered name")
                        Spacer()
                        Text("'\(existingName) (2)'")
                            .foregroundColor(.secondary)
                            .font(.caption)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(8)
                }
                .buttonStyle(PlainButtonStyle())
                
                VStack(alignment: .leading) {
                    Button(action: {
                        if !newName.isEmpty {
                            handleChoice("rename")
                        }
                    }) {
                        HStack {
                            Image(systemName: "pencil.circle")
                            Text("Rename playlist")
                        }
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    TextField("Enter new name", text: $newName)
                        .textFieldStyle(.roundedBorder)
                }
                .padding()
                .background(Color.green.opacity(0.1))
                .cornerRadius(8)
                
                Button(action: {
                    handleChoice("cancel")
                }) {
                    HStack {
                        Image(systemName: "xmark.circle")
                        Text("Cancel")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(8)
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
        .padding(30)
        .frame(width: 500)
        .background(Color(NSColor.windowBackgroundColor))
        .cornerRadius(12)
        .shadow(radius: 10)
    }
    
    func handleChoice(_ choice: String) {
        print("User chose: \(choice) with name: \(newName)")
        appState.showPlaylistDuplicateModal = false
    }
}

struct FileDuplicateModal: View {
    @EnvironmentObject var appState: AppState
    @State private var duplicates: [(file: String, suggestedName: String)] = []
    @State private var renamedFiles: [String: String] = [:]
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Duplicate Files Found")
                .font(.title2)
                .fontWeight(.bold)
            
            Text("\(duplicates.count) file(s) already exist in your library")
                .foregroundColor(.secondary)
            
            ScrollView {
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(duplicates, id: \.file) { duplicate in
                        VStack(alignment: .leading) {
                            Text(duplicate.file)
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            HStack {
                                Text("Rename to:")
                                TextField(duplicate.suggestedName, text: binding(for: duplicate.file))
                                    .textFieldStyle(.roundedBorder)
                            }
                        }
                        .padding()
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(8)
                    }
                }
            }
            .frame(maxHeight: 300)
            
            HStack(spacing: 15) {
                Button("Skip Duplicates") {
                    handleChoice("skip")
                }
                .buttonStyle(.bordered)
                
                Button("Auto-Rename") {
                    handleChoice("continue")
                }
                .buttonStyle(.bordered)
                
                Button("Rename & Import") {
                    handleChoice("rename")
                }
                .buttonStyle(.borderedProminent)
                
                Button("Cancel") {
                    handleChoice("cancel")
                }
                .buttonStyle(.bordered)
            }
        }
        .padding(30)
        .frame(width: 600)
        .background(Color(NSColor.windowBackgroundColor))
        .cornerRadius(12)
        .shadow(radius: 10)
    }
    
    func binding(for file: String) -> Binding<String> {
        Binding(
            get: { renamedFiles[file] ?? "" },
            set: { renamedFiles[file] = $0 }
        )
    }
    
    func handleChoice(_ choice: String) {
        print("User chose: \(choice)")
        appState.showFileDuplicateModal = false
    }
}
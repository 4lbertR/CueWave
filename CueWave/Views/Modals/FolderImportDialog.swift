import SwiftUI

struct FolderImportDialog: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedImportMode = "all"
    @State private var folderName = ""
    @State private var hasNestedPlaylists = false
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Import Folder")
                .font(.title2)
                .fontWeight(.bold)
            
            Text("Folder: \(folderName)")
                .font(.headline)
            
            if hasNestedPlaylists {
                VStack(alignment: .leading, spacing: 10) {
                    Text("This folder contains playlists. How would you like to import them?")
                        .foregroundColor(.secondary)
                    
                    RadioButton(title: "Import all files (ignore playlist structure)", 
                               isSelected: selectedImportMode == "all") {
                        selectedImportMode = "all"
                    }
                    
                    RadioButton(title: "Preserve playlist structure", 
                               isSelected: selectedImportMode == "preserve") {
                        selectedImportMode = "preserve"
                    }
                    
                    RadioButton(title: "Import only uncategorized files", 
                               isSelected: selectedImportMode == "uncategorized") {
                        selectedImportMode = "uncategorized"
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(8)
            } else {
                Text("This folder will be imported as a new playlist.")
                    .foregroundColor(.secondary)
            }
            
            HStack(spacing: 20) {
                Button("Cancel") {
                    appState.showFolderImportDialog = false
                }
                .buttonStyle(.bordered)
                
                Button("Import") {
                    performImport()
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding(30)
        .frame(width: 500)
        .background(Color(NSColor.windowBackgroundColor))
        .cornerRadius(12)
        .shadow(radius: 10)
    }
    
    func performImport() {
        // Implement import logic
        print("Importing with mode: \(selectedImportMode)")
        appState.showFolderImportDialog = false
    }
}

struct RadioButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: isSelected ? "largecircle.fill.circle" : "circle")
                    .foregroundColor(isSelected ? .accentColor : .secondary)
                Text(title)
                    .foregroundColor(.primary)
                Spacer()
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}
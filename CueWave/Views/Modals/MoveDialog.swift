import SwiftUI

struct MoveDialog: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedDestination: String = "root"
    @State private var itemToMove: Any?
    @State private var currentLocation: String = ""
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Move Item")
                .font(.title2)
                .fontWeight(.bold)
            
            HStack {
                Image(systemName: "folder")
                    .foregroundColor(.blue)
                Text("Moving from: \(currentLocation)")
                    .foregroundColor(.secondary)
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.gray.opacity(0.1))
            .cornerRadius(8)
            
            Text("Select destination folder:")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            ScrollView {
                VStack(alignment: .leading, spacing: 5) {
                    // Root option
                    FolderOption(
                        name: "Library (Root)",
                        icon: "house",
                        isSelected: selectedDestination == "root",
                        onSelect: {
                            selectedDestination = "root"
                        }
                    )
                    
                    Divider()
                    
                    // Folder options
                    ForEach(appState.folders) { folder in
                        FolderOptionRow(
                            folder: folder,
                            selectedDestination: $selectedDestination,
                            level: 0
                        )
                    }
                }
            }
            .frame(height: 250)
            .padding()
            .background(Color.gray.opacity(0.05))
            .cornerRadius(8)
            
            HStack(spacing: 20) {
                Button("Cancel") {
                    appState.showMoveDialog = false
                }
                .buttonStyle(.bordered)
                
                Button("Move") {
                    performMove()
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
    
    func performMove() {
        print("Moving item to: \(selectedDestination)")
        appState.showMoveDialog = false
    }
}

struct FolderOption: View {
    let name: String
    let icon: String
    let isSelected: Bool
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            HStack {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isSelected ? .accentColor : .secondary)
                
                Image(systemName: icon)
                    .foregroundColor(.blue)
                
                Text(name)
                    .foregroundColor(.primary)
                
                Spacer()
            }
            .padding(.vertical, 6)
            .padding(.horizontal)
            .background(isSelected ? Color.accentColor.opacity(0.1) : Color.clear)
            .cornerRadius(6)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct FolderOptionRow: View {
    let folder: Folder
    @Binding var selectedDestination: String
    let level: Int
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button(action: {
                selectedDestination = folder.id.uuidString
            }) {
                HStack {
                    if !folder.folders.isEmpty {
                        Image(systemName: isExpanded ? "chevron.down" : "chevron.right")
                            .font(.caption)
                            .frame(width: 15)
                            .onTapGesture {
                                withAnimation {
                                    isExpanded.toggle()
                                }
                            }
                    } else {
                        Spacer()
                            .frame(width: 15)
                    }
                    
                    Image(systemName: selectedDestination == folder.id.uuidString ? "checkmark.circle.fill" : "circle")
                        .foregroundColor(selectedDestination == folder.id.uuidString ? .accentColor : .secondary)
                    
                    Image(systemName: "folder")
                        .foregroundColor(.blue)
                    
                    Text(folder.name)
                        .foregroundColor(.primary)
                    
                    Spacer()
                }
                .padding(.vertical, 6)
                .padding(.leading, CGFloat(level * 20))
                .padding(.horizontal)
                .background(selectedDestination == folder.id.uuidString ? Color.accentColor.opacity(0.1) : Color.clear)
                .cornerRadius(6)
            }
            .buttonStyle(PlainButtonStyle())
            
            if isExpanded {
                ForEach(folder.folders) { subfolder in
                    FolderOptionRow(
                        folder: subfolder,
                        selectedDestination: $selectedDestination,
                        level: level + 1
                    )
                }
            }
        }
    }
}
import SwiftUI

struct DeckSelectionDialog: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedDeck: Deck? = nil
    @State private var selectedAction = "replace"
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Select Deck")
                .font(.title2)
                .fontWeight(.bold)
            
            Text("Choose which deck to load the selected items to:")
                .foregroundColor(.secondary)
            
            HStack(spacing: 20) {
                DeckSelectionButton(
                    deck: .A,
                    isSelected: selectedDeck == .A,
                    hasContent: !appState.deckATracks.isEmpty,
                    onSelect: { selectedDeck = .A }
                )
                
                DeckSelectionButton(
                    deck: .B,
                    isSelected: selectedDeck == .B,
                    hasContent: !appState.deckBTracks.isEmpty,
                    onSelect: { selectedDeck = .B }
                )
            }
            
            if selectedDeck != nil {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Action:")
                        .font(.headline)
                    
                    RadioButton(
                        title: "Replace existing tracks",
                        isSelected: selectedAction == "replace"
                    ) {
                        selectedAction = "replace"
                    }
                    
                    RadioButton(
                        title: "Append to existing tracks",
                        isSelected: selectedAction == "append"
                    ) {
                        selectedAction = "append"
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(8)
            }
            
            HStack(spacing: 20) {
                Button("Cancel") {
                    appState.showDeckSelectionDialog = false
                }
                .buttonStyle(.bordered)
                
                Button("Load") {
                    loadToDeck()
                }
                .buttonStyle(.borderedProminent)
                .disabled(selectedDeck == nil)
            }
        }
        .padding(30)
        .frame(width: 400)
        .background(Color(NSColor.windowBackgroundColor))
        .cornerRadius(12)
        .shadow(radius: 10)
    }
    
    func loadToDeck() {
        guard let deck = selectedDeck else { return }
        
        // Perform load action
        print("Loading to deck \(deck == .A ? "A" : "B") with action: \(selectedAction)")
        appState.showDeckSelectionDialog = false
    }
}

struct DeckSelectionButton: View {
    let deck: Deck
    let isSelected: Bool
    let hasContent: Bool
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            VStack(spacing: 10) {
                Text("Deck \(deck == .A ? "A" : "B")")
                    .font(.title3)
                    .fontWeight(.semibold)
                
                Image(systemName: deck == .A ? "a.circle.fill" : "b.circle.fill")
                    .font(.system(size: 40))
                    .foregroundColor(isSelected ? .accentColor : .secondary)
                
                if hasContent {
                    Text("Has tracks")
                        .font(.caption)
                        .foregroundColor(.orange)
                } else {
                    Text("Empty")
                        .font(.caption)
                        .foregroundColor(.green)
                }
            }
            .frame(width: 120, height: 120)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.accentColor : Color.gray.opacity(0.3), lineWidth: 2)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(isSelected ? Color.accentColor.opacity(0.1) : Color.clear)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}
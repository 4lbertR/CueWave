import SwiftUI

struct MixerPanelView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        HStack(spacing: 20) {
            // Deck A Fader
            VolumeChannelView(
                label: "A",
                volume: $appState.deckAVolume,
                isMuted: $appState.muteA
            )
            
            // Deck B Fader
            VolumeChannelView(
                label: "B",
                volume: $appState.deckBVolume,
                isMuted: $appState.muteB
            )
            
            // Master Fader
            VolumeChannelView(
                label: "M",
                volume: $appState.masterVolume,
                isMuted: $appState.muteMaster
            )
        }
        .padding()
        .background(Color.black.opacity(0.9))
    }
}

struct VolumeChannelView: View {
    let label: String
    @Binding var volume: Double
    @Binding var isMuted: Bool
    
    var body: some View {
        VStack(spacing: 10) {
            Text(label)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            // Vertical slider
            GeometryReader { geometry in
                ZStack(alignment: .bottom) {
                    // Background track
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.3))
                        .frame(width: 40)
                    
                    // Fill track
                    RoundedRectangle(cornerRadius: 4)
                        .fill(isMuted ? Color.gray : Color.green)
                        .frame(width: 40, height: geometry.size.height * CGFloat(volume))
                    
                    // Custom slider
                    VerticalSlider(value: $volume)
                        .frame(width: 60, height: geometry.size.height)
                }
                .frame(maxWidth: .infinity)
            }
            .frame(height: 200)
            
            // Mute button
            Button(action: {
                isMuted.toggle()
            }) {
                Text("M")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(isMuted ? .black : .white)
                    .frame(width: 30, height: 30)
                    .background(isMuted ? Color.red : Color.gray.opacity(0.5))
                    .clipShape(Circle())
            }
            .buttonStyle(PlainButtonStyle())
        }
    }
}

struct VerticalSlider: View {
    @Binding var value: Double
    
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .bottom) {
                // Invisible rectangle for interaction
                Rectangle()
                    .fill(Color.clear)
                    .contentShape(Rectangle())
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { dragValue in
                                let height = geometry.size.height
                                let location = height - dragValue.location.y
                                let newValue = max(0, min(1, location / height))
                                value = newValue
                            }
                    )
                
                // Thumb
                Circle()
                    .fill(Color.white)
                    .frame(width: 20, height: 20)
                    .shadow(radius: 2)
                    .offset(y: -geometry.size.height * CGFloat(value) + 10)
            }
        }
    }
}

#Preview {
    MixerPanelView()
        .environmentObject(AppState())
        .frame(width: 300, height: 400)
}
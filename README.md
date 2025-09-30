# CueWave - Swift Edition

A professional DJ application built with Swift and SwiftUI for macOS and iOS.

## Features

- **Dual Deck System**: Two independent decks (A & B) for seamless mixing
- **Professional Mixer Panel**: Volume faders for each deck plus master volume control
- **Fade Controls**: Fade In, Fade Out, Fade to Next, and Crossfade capabilities
- **Library Management**: Organize your music with playlists and folders
- **File Import**: Import audio files and folders with duplicate handling
- **Playlist Editor**: Create and edit playlists with  track selection
- **Responsive Design**: Adaptive UI with compact mixer mode 

## Project Structure
 
```
CueWave/
├── CueWave/                    # Main application code
│   ├── CueWaveApp.swift       # App entry point
│   ├── Models/                # Data models
│   │   └── Track.swift        # Track, Playlist, Folder models
│   ├── Views/                 # SwiftUI views
│   │   ├── ContentView.swift # Main content view
│   │   ├── MixerPanelView.swift
│   │   ├── EnhancedSidebar.swift
│   │   └── Modals/           # Modal dialogs
│   ├── ViewModels/           # View models (if needed)
│   └── Utils/                # Utility functions
├── CueWave.xcodeproj/        # Xcode project file
└── Package.swift             # Swift Package Manager file
```

## Requirements

- macOS 14.0+ or iOS 17.0+
- Xcode 15.0+
- Swift 5.9+

## Building and Running

### Using Xcode
1. Open `CueWave.xcodeproj` in Xcode
2. Select your target device (Mac or iOS Simulator)
3. Press ⌘R to build and run

### Using Swift Package Manager
```bash
swift build
swift run
```

## Architecture

The app is built using SwiftUI and follows the MVVM pattern:

- **Models**: Core data structures (Track, Playlist, Folder)
- **Views**: SwiftUI views for UI components
- **AppState**: ObservableObject managing application state
- **Modals**: Reusable dialog components for user interactions

## Key Components

### Deck System
- Independent track lists for each deck
- Play/stop controls
- Fade controls with configurable duration

### Mixer Panel
- Vertical volume sliders for each deck
- Master volume control
- Mute buttons for each channel

### Library Browser
- Three-tab interface: Playlists, Folders, All Files
- Drag-and-drop support for loading to decks
- Context menus for quick actions

### Import System
- Folder import with playlist preservation options
- File import with duplicate detection
- Auto-rename functionality for conflicts

## Audio Playback

Note: Audio playback functionality is not yet implemented. The UI and data management systems are complete and ready for audio integration using AVFoundation or similar framework.

## License

Copyright © 2025 CueWave. All rights reserved.
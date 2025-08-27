# iOS Integration Instructions for Cuewave

## Setup in Xcode

1. **Create a new iOS app in Xcode**:
   - Choose "App" template
   - Interface: Storyboard or SwiftUI
   - Language: Swift
   - Target: iPad

2. **Add the WebView Controller**:
   - Copy `CuewaveWebViewController.swift` to your Xcode project
   - Set it as your main view controller

3. **Build the React App**:
   ```bash
   npm run build
   ```

4. **Add the built files to Xcode**:
   - Drag the entire `dist` folder from the build into Xcode
   - Choose "Create folder references" (blue folder)
   - Make sure "Copy items if needed" is checked

5. **Update Info.plist**:
   - Use the provided `Info.plist` or merge the settings
   - Key settings needed:
     - `UIBackgroundModes`: audio (for background playback)
     - `UIFileSharingEnabled`: true (for file access)
     - `LSSupportsOpeningDocumentsInPlace`: true (for document access)

## How It Works

### Web → Native Communication:
The React app sends messages via:
```javascript
window.webkit.messageHandlers.cuewaveFileHandler.postMessage({
    action: 'requestFileAccess',
    type: 'folder', // or 'files'
    callbackId: '12345'
});
```

### Native → Web Communication:
The Swift code sends data back via:
```javascript
window.CuewaveNativeCallback(callbackId, data);
```

### File Handling:
1. User taps "Import Folder" in the web app
2. Web app detects it's in WKWebView and sends message to native
3. Native code presents iOS document picker
4. User selects files/folders
5. Native code reads files and sends data back to web as base64
6. Web app stores files in IndexedDB for persistence

## Features That Work Automatically:

✅ **Folder Import**: Uses native iOS document picker
✅ **Multiple File Import**: Native multi-select
✅ **Nested Playlist Detection**: Works with folder structure
✅ **File Persistence**: IndexedDB + security-scoped bookmarks
✅ **Background Audio**: Configured in Info.plist
✅ **Cross-platform**: Same code works in Safari and native app

## Testing:

1. **In Safari on iPad**: 
   - Uses webkitdirectory HTML input
   - Falls back to multi-file selection
   
2. **In Native App**:
   - Uses native document picker
   - Better performance and integration
   - Security-scoped bookmarks for persistent access

## Note on Audio Playback:

For audio playback with AVAudioEngine (as mentioned in README), you'll need to add additional Swift code to handle the actual audio processing natively, as Web Audio API has limitations on iOS.
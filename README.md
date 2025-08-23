🎛 Cuewave – Developer Specification
1. Overall Concept

Cuewave is a two-deck audio player for iPad, optimized for live use (fitness/yoga classes, theatre tech, teachers).

Deck A & Deck B: independent audio players.

Crossfade controls: transition audio smoothly between decks.

Global fade-time control: sets fade duration for all fade actions (0.5s – 4s).

Mute controls: instant mute for Deck A, Deck B, or Master output.

Playlist management: create, edit, delete, and organize playlists/folders with imported audio files.

2. Core Features
2.1 Playback Engines

Two independent players (A & B) using AVAudioEngine / AVAudioPlayerNode.

Both can play simultaneously.

Each has its own Play, Stop, Fade In, Fade Out controls.

2.2 Fade Logic

Global fade duration: controlled by slider (0.5s to 4s, in discrete steps).

Fade In: ramp volume of deck from 0 → 1.0 over selected duration.

Fade Out: ramp volume of deck from 1.0 → 0 over selected duration.

Crossfade A→B:

Fade Out Deck A → Fade In Deck B simultaneously.

Both use global fade duration.

Crossfade B→A: opposite direction.

Crossfade to Next: when skipping track in a deck, crossfade old → new track automatically.

Fade Implementation

Linear ramp (default).

Optional later: exponential/log curves (in Pro mode).

2.3 Mute Controls

Mute A: instantly set Deck A volume = 0 (toggle restores last volume).

Mute B: instantly set Deck B volume = 0 (toggle restores last volume).

Mute Master: instantly set output = 0 for both decks (toggle restores).

2.4 Playlist & File Management

Import file / playlist: uses iPad Files app (UIDocumentPickerViewController).

Supported formats: MP3, AAC/M4A, WAV, AIFF, FLAC.

Persistence: store security-scoped bookmarks to keep access across app restarts.

Create Playlist / Folder:

User can select files from library to form a playlist.

Folders can contain playlists.

Playlist Editing:

Long-press playlist → options: Edit, Delete.

Edit = same UI as create, with tracks pre-checked.

Delete = removes playlist (files remain).

Reorganization:

Drag playlists into folders.

“Back” button appears when browsing inside a folder.

2.5 Deck Controls

For each Deck (A & B):

Track display: show filename, optionally time elapsed/remaining.

Controls: Play, Stop, Fade In, Fade Out.

Set to A / Set to B: assign a file from playlist to that deck.

2.6 Global UI Controls

Fade duration selector:

Step-based slider (0.5s, 1s, 2s, 3s, 4s).

Display current selection as text label (e.g. “1 sec”).

Crossfade buttons:

A → B and B → A.

Large buttons, show progress bar during fade.

Settings: app-level settings menu.

Import button: “Open file / playlist”.

3. UX Behaviors

Button press = immediate response (fade/crossfade starts instantly).

While fading:

Show countdown or progress overlay on button.

Disable conflicting action (e.g. don’t allow Crossfade A→B if already fading).

Mute buttons: toggle on/off state visually.

Safe stage mode (future): lock UI to prevent accidental edits mid-show.

4. Technical Notes

Audio framework: Apple AVAudioEngine with two AVAudioPlayerNodes into main mixer.

Background playback: AVAudioSessionCategoryPlayback with Background Audio capability.

Routing: support iPad speaker, headphones, USB-C → AUX, Bluetooth.

Persistence:

Save playlists, folders, fade-time setting, last used tracks.

Use CoreData or JSON storage in app sandbox.

Performance: pre-schedule audio files for gapless starts.

5. Future / Pro Features

Per-cue fade times.

Advanced fade curves (log/exp).

Recording output.

Multi-output routing.

The entire app is built in react and later nested into ipados
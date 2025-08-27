import { useState, useEffect } from 'react'
import './App.css'
import FolderImportDialog from './components/FolderImportDialog'
import DeckSelectionDialog from './components/DeckSelectionDialog'
import PlaylistSidebar from './components/PlaylistSidebar'
import playlistManager from './utils/playlistManager'
import iosFileHandler from './utils/iosFileHandler'
import capacitorFileManager from './utils/capacitorFileManager'

const fadeInAPressed = () => {
  console.log("Fade In A Clicked!");
};
const fadeOutAPressed = () => {
  console.log("Fade Out A Clicked!");
};
const playAPressed = () => {
  console.log("Play A Clicked!");
}; 
const fadeNextAPressed = () => {
  console.log("Fade Next A Clicked!"); 
};

const fadeInBPressed = () => {
  console.log("Fade In B Clicked!");
};
const fadeOutBPressed = () => {
  console.log("Fade Out B Clicked!");
};
const playBPressed = () => {
  console.log("Play B Clicked!");
};
const fadeNextBPressed = () => {
  console.log("Fade Next B Clicked!");
};

const CF_A_B_Button = () => {
  console.log("Crossfade A-B Clicked!");
};

const CF_B_A_Button = () => {
  console.log("Crossfade B-A Clicked!");
};
const HeaderSettingsPressed = () => {
  console.log("Settings Clicked!");
};

function App() {
  const [fadeDuration, setFadeDuration] = useState(1);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [folderImportDialog, setFolderImportDialog] = useState({
    isOpen: false,
    folderName: '',
    hasNestedPlaylists: false,
    folderHandle: null,
    folderStructure: null
  });
  const [playlists, setPlaylists] = useState([]);
  const [folders, setFolders] = useState([]);
  const [deckSelectionDialog, setDeckSelectionDialog] = useState({
    isOpen: false,
    pendingImport: null,
    importType: 'files'
  });
  const [selectedSidebarDeck, setSelectedSidebarDeck] = useState('A');

  // Load stored files and library on mount
  useEffect(() => {
    const loadLibrary = async () => {
      try {
        // Load from Capacitor filesystem or localStorage
        const library = await capacitorFileManager.readCuewaveFolder();
        setPlaylists(library.playlists || []);
        setFolders(library.folders || []);
        
        // Also load IndexedDB files for iOS
        if (iosFileHandler.isIOS || iosFileHandler.isIPad) {
          const storedFiles = await iosFileHandler.getAllStoredFiles();
          console.log('Loaded stored files:', storedFiles);
        }
      } catch (error) {
        console.error('Error loading library:', error);
      }
    };
    loadLibrary();
  }, []);
  
  // Mixer volume states
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [deckAVolume, setDeckAVolume] = useState(0.7);
  const [deckBVolume, setDeckBVolume] = useState(0.5);
  const [muteA, setMuteA] = useState(false);
  const [muteB, setMuteB] = useState(true);
  const [muteMaster, setMuteMaster] = useState(false);

  const [deckATracks, setDeckATracks] = useState([
    { id: 1, name: "Sample Track 1.mp3", duration: "3:45", path: "sample1.mp3" },
    { id: 2, name: "Sample Track 2.mp3", duration: "4:12", path: "sample2.mp3" },
    { id: 3, name: "Long Sample Track Name.mp3", duration: "2:58", path: "sample3.mp3" },
    { id: 4, name: "Another Track.mp3", duration: "5:23", path: "sample4.mp3" },
    { id: 5, name: "More Music.mp3", duration: "3:17", path: "sample5.mp3" },
    { id: 6, name: "Sample Track 1.mp3", duration: "3:45", path: "sample1.mp3" },
    { id: 7, name: "Sample Track 2.mp3", duration: "4:12", path: "sample2.mp3" },
    { id: 8, name: "Long Sample Track Name.mp3", duration: "2:58", path: "sample3.mp3" },
    { id: 9, name: "Another Track.mp3", duration: "5:23", path: "sample4.mp3" },
    { id: 10, name: "More Music.mp3", duration: "3:17", path: "sample5.mp3" },
    { id: 11, name: "Sample Track 1.mp3", duration: "3:45", path: "sample1.mp3" },
    { id: 12, name: "Sample Track 2.mp3", duration: "4:12", path: "sample2.mp3" },
    { id: 13, name: "Long Sample Track Name.mp3", duration: "2:58", path: "sample3.mp3" },
    { id: 14, name: "Another Track.mp3", duration: "5:23", path: "sample4.mp3" },
    { id: 15, name: "More Music.mp3", duration: "3:17", path: "sample5.mp3" },
  ]);
  
  const [deckBTracks, setDeckBTracks] = useState([
    { id: 6, name: "Deck B Track 1.mp3", duration: "4:05", path: "deckb1.mp3" },
    { id: 7, name: "Deck B Track 2.mp3", duration: "3:31", path: "deckb2.mp3" },
  ]);

  const [selectedTrackA, setSelectedTrackA] = useState(null);
  const [selectedTrackB, setSelectedTrackB] = useState(null);

  const showImportChoiceDialog = () => {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.className = 'import-choice-dialog';
      dialog.innerHTML = `
        <div class="dialog-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000;">
          <div class="dialog-content" style="background: #2a2a2a; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <h2 style="color: white; margin: 0 0 1rem 0;">Import Options</h2>
            <p style="color: #ddd; margin-bottom: 1.5rem;">What would you like to import?</p>
            <div style="display: flex; gap: 1rem;">
              <button id="import-folder" style="padding: 1rem 2rem; background: #4a9eff; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                Import Folder
              </button>
              <button id="import-files" style="padding: 1rem 2rem; background: #4a9eff; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                Import Files
              </button>
              <button id="import-cancel" style="padding: 1rem 2rem; background: #444; color: #ddd; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                Cancel
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(dialog);
      
      document.getElementById('import-folder').onclick = () => {
        document.body.removeChild(dialog);
        resolve('folder');
      };
      
      document.getElementById('import-files').onclick = () => {
        document.body.removeChild(dialog);
        resolve('files');
      };
      
      document.getElementById('import-cancel').onclick = () => {
        document.body.removeChild(dialog);
        resolve(null);
      };
    });
  };

  const handleFolderImport = async (dirHandle) => {
    try {
      const importData = await playlistManager.importFolderWithDialog(dirHandle);
      setFolderImportDialog({
        isOpen: true,
        folderName: importData.folderName,
        hasNestedPlaylists: importData.hasNestedPlaylists,
        folderHandle: importData.folderHandle,
        folderStructure: importData.folderStructure
      });
    } catch (error) {
      console.error('Error preparing folder import:', error);
      alert('Error reading folder: ' + error.message);
    }
  };

  const handleFolderImportIOS = async (folderStructure) => {
    try {
      // Check if folder has playlists
      const hasPlaylists = folderStructure.playlists.length > 0 || 
        folderStructure.subfolders?.some(f => f.playlists.length > 0);
      
      setFolderImportDialog({
        isOpen: true,
        folderName: folderStructure.name || 'Selected Folder',
        hasNestedPlaylists: hasPlaylists,
        folderHandle: null,
        folderStructure: folderStructure
      });
    } catch (error) {
      console.error('Error preparing folder import:', error);
      alert('Error reading folder: ' + error.message);
    }
  };

  const handleFolderImportConfirm = async (importMode) => {
    try {
      const { folderHandle, folderStructure } = folderImportDialog;
      
      let playlist;
      if (folderHandle) {
        // Desktop mode with File System Access API
        playlist = await playlistManager.importFolder(folderHandle, importMode);
      } else {
        // iOS mode with folderStructure
        playlist = await playlistManager.importFolderFromStructure(folderStructure, importMode);
      }
      
      console.log('Folder imported as playlist:', playlist);
      
      // Store pending import and show deck selection
      setDeckSelectionDialog({
        isOpen: true,
        pendingImport: { type: 'playlist', data: playlist },
        importType: 'playlist'
      });
    } catch (error) {
      console.error('Error importing folder:', error);
      alert('Error importing folder: ' + error.message);
    }
  };

  const handleDeckSelection = async (deck, action) => {
    const { pendingImport } = deckSelectionDialog;
    if (!pendingImport) return;

    try {
      let playlist;
      
      if (pendingImport.type === 'files') {
        // Create playlist from files
        playlist = await playlistManager.importAudioFiles(pendingImport.data);
      } else if (pendingImport.type === 'folder') {
        // This will trigger the folder import dialog
        handleFolderImportIOS(pendingImport.data);
        return;
      } else if (pendingImport.type === 'playlist') {
        playlist = pendingImport.data;
      }

      if (playlist) {
        // Save to Capacitor filesystem
        await capacitorFileManager.savePlaylist(playlist, deck);
        
        // Store files in IndexedDB for iOS
        if (iosFileHandler.isIOS || iosFileHandler.isIPad) {
          for (const track of playlist.tracks) {
            if (track.file) {
              await iosFileHandler.storeFileReference(track.file);
            }
          }
        }

        // Load to deck if selected
        if (deck) {
          const newTracks = playlist.tracks.map((track, index) => ({
            id: Date.now() + index,
            name: track.name,
            duration: track.duration || '0:00',
            path: track.path
          }));

          if (deck === 'A') {
            if (action === 'append') {
              setDeckATracks(prevTracks => [...prevTracks, ...newTracks]);
            } else {
              setDeckATracks(newTracks);
            }
          } else if (deck === 'B') {
            if (action === 'append') {
              setDeckBTracks(prevTracks => [...prevTracks, ...newTracks]);
            } else {
              setDeckBTracks(newTracks);
            }
          }
        }

        updatePlaylistsDisplay();
      }
    } catch (error) {
      console.error('Error handling deck selection:', error);
      alert('Error loading playlist: ' + error.message);
    }
  };

  const updatePlaylistsDisplay = async () => {
    // Reload library from storage
    const library = await capacitorFileManager.readCuewaveFolder();
    setPlaylists(library.playlists || []);
    setFolders(library.folders || []);
    console.log('Updated library:', library);
  };

  const handleSelectPlaylistFromSidebar = async (playlist, deck) => {
    try {
      // Load playlist tracks to selected deck
      const tracks = playlist.tracks.map((track, index) => ({
        id: Date.now() + index,
        name: track.name,
        duration: track.duration || '0:00',
        path: track.path
      }));

      if (deck === 'A') {
        setDeckATracks(tracks);
      } else if (deck === 'B') {
        setDeckBTracks(tracks);
      }
    } catch (error) {
      console.error('Error loading playlist to deck:', error);
    }
  };

  const HeaderOpenPressed = async () => {
    console.log("Open file / playlist Clicked!");
    
    try {
      // Show option dialog for file or folder selection
      const choice = await showImportChoiceDialog();
      
      if (choice === 'folder') {
        // Use iOS-compatible folder import
        const folderStructure = await iosFileHandler.importFiles('folder');
        
        // Store pending import and show deck selection
        setDeckSelectionDialog({
          isOpen: true,
          pendingImport: { type: 'folder', data: folderStructure },
          importType: 'folder'
        });
      } else if (choice === 'files') {
        // Use iOS-compatible file import
        const files = await iosFileHandler.importFiles('files');
        
        if (files && files.length > 0) {
          // Add duration to each file
          const filesWithDuration = [];
          for (const file of files) {
            const duration = await capacitorFileManager.getAudioDuration(file);
            filesWithDuration.push({ ...file, duration });
          }
          
          // Store pending import and show deck selection
          setDeckSelectionDialog({
            isOpen: true,
            pendingImport: { type: 'files', data: filesWithDuration },
            importType: 'files'
          });
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError' && error.message !== 'Selection cancelled') {
        console.error('Error opening files:', error);
        alert('Error importing files: ' + error.message);
      }
    }
  };

  return (
    <>
      <FolderImportDialog
        isOpen={folderImportDialog.isOpen}
        onClose={() => setFolderImportDialog({ ...folderImportDialog, isOpen: false })}
        onImport={handleFolderImportConfirm}
        folderName={folderImportDialog.folderName}
        hasNestedPlaylists={folderImportDialog.hasNestedPlaylists}
      />
      
      <DeckSelectionDialog
        isOpen={deckSelectionDialog.isOpen}
        onClose={() => setDeckSelectionDialog({ ...deckSelectionDialog, isOpen: false })}
        onSelectDeck={handleDeckSelection}
        currentDeckA={deckATracks.length > 0}
        currentDeckB={deckBTracks.length > 0}
        importType={deckSelectionDialog.importType}
      />
      
      <PlaylistSidebar
        playlists={playlists}
        folders={folders}
        onSelectPlaylist={handleSelectPlaylistFromSidebar}
        onRefresh={updatePlaylistsDisplay}
        selectedDeck={selectedSidebarDeck}
      />
      
      <div className={`main-content ${isCompactMode ? 'compact-mode' : ''}`}>
        <div className="cuewave-app">
    
        <button onClick={() => setIsCompactMode(!isCompactMode)} className='MixerArrow'>
          <img 
            src='src/assets/open-mixer-arrow.svg' 
            alt="Toggle mixer"
            style={{ transform: isCompactMode ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>

        <div className='HEADER'>
          <button onClick={HeaderOpenPressed} className="headerbutton headerOpen">
            Open file / playlist
          </button>
          <button onClick={HeaderSettingsPressed} className="headerbutton headerSettings">
            Settings
          </button>
        </div>

        <div className="A DECK BUTTONS">
          <button onClick={fadeInAPressed} className="fadebutton fade-in-a-button">
            Fade In
          </button>

          <button onClick={playAPressed} className="playstopbutton play-a-button">
            <img src="src/assets/play.svg" alt="" />
          </button>

          <button onClick={fadeOutAPressed} className="fadebutton fade-out-a-button">
            Fade Out
          </button>

          <button onClick={fadeNextAPressed} className="fadebutton fade-next-a-button">
            Fade to Next
          </button>
        </div>

        <div className="B DECK BUTTONS">
          <button onClick={fadeInBPressed} className="fadebutton fade-in-b-button">
            Fade In
          </button>

          <button onClick={playBPressed} className="playstopbutton play-b-button">
            <img src="src/assets/play.svg" alt="" />
           </button>

          <button onClick={fadeOutBPressed} className="fadebutton fade-out-b-button">
            Fade Out 
          </button>

          <button onClick={fadeNextBPressed} className="fadebutton fade-next-b-button">
            Fade to Next
          </button>
        </div>

        <div className="track-lists-container">
          <div className="track-list-container deck-a-tracks">
            <h3>Deck A Playlist</h3>
            <div className="track-list">
              {deckATracks.map((track) => (
                <div 
                  key={track.id} 
                  className={`track-item ${selectedTrackA?.id === track.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTrackA(track)}
                >
                  <span className="track-name">{track.name}</span> 
                  <span className="track-duration">{track.duration}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="track-list-container deck-b-tracks">
            <h3>Deck B Playlist</h3>
            <div className="track-list">
              {deckBTracks.map((track) => (
                <div  
                  key={track.id}
                  className={`track-item ${selectedTrackB?.id === track.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTrackB(track)}
                >
                  <span className="track-name">{track.name}</span>
                  <span className="track-duration">{track.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='CENTER BUTTONS'>
          <button onClick={CF_A_B_Button} className="fadebutton cf-a-b-button">
              CROSSFADE A→B
          </button>
          <button onClick={CF_B_A_Button} className="fadebutton cf-b-a-button">
              CROSSFADE A←B
          </button>
        </div>

        <div className="fade-slider-div">
          <label>Fade Time</label>
          <div className="slider-container">
            
            <div className="slider-ticks">
              {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].map((value) => (
                <div 
                  key={value}
                  className="tick-mark"
                  style={{ left: `calc(${(value / 4) * 100}% - ${(value / 4) * 2}vw + 1vw)` }}
                />
              ))}
            </div>
            
            <input 
              type="range"
              min="0"
              max="4"
              step="0.5"
              value={fadeDuration}
              onChange={(e) => setFadeDuration(e.target.value)}
              className="fade-slider"
            />
            
            <div 
              className="slider-tooltip" 
              style={{ 
                left: `calc(${(parseFloat(fadeDuration) / 4) * 100}% - ${(parseFloat(fadeDuration) / 4) * 2}vw + 1vw)`
              }}
            >
              {fadeDuration} sec
            </div>
          </div>
        </div>

      </div>

      {/* MIXER PANEL WITH NATIVE HTML RANGE SLIDERS */}
      <div className={`mixer-panel ${isCompactMode ? 'mixer-visible' : 'mixer-hidden'}`}>
        <div className="mixer-fader">
          <label className="fader-label">A</label>
          <div className="fader-container">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={deckAVolume}
              onChange={(e) => setDeckAVolume(parseFloat(e.target.value))}
              className="vertical-fader"
            />
          </div>
          <button 
            className={`mute-button ${muteA ? 'active' : ''}`}
            onClick={() => setMuteA(!muteA)}
          >
            M
          </button>
        </div>

        <div className="mixer-fader">
          <label className="fader-label">B</label>
          <div className="fader-container">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={deckBVolume}
              onChange={(e) => setDeckBVolume(parseFloat(e.target.value))}
              className="vertical-fader"
            />
          </div>
          <button 
            className={`mute-button ${muteB ? 'active' : ''}`}
            onClick={() => setMuteB(!muteB)}
          >
            M
          </button>
        </div>

        <div className="mixer-fader">
          <label className="fader-label">Master</label>
          <div className="fader-container">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="vertical-fader"
            />
          </div>
          <button 
            className={`mute-button ${muteMaster ? 'active' : ''}`}
            onClick={() => setMuteMaster(!muteMaster)}
          >
            M
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

export default App;
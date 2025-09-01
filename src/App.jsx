import { useState, useEffect, useRef } from 'react'
import './App.css'
import FolderImportDialog from './components/FolderImportDialog'
import EnhancedSidebar from './components/EnhancedSidebar'
import EditPlaylistModal from './components/EditPlaylistModal'
import DuplicateHandlingModal from './components/DuplicateHandlingModal'
import PlaylistDuplicateModal from './components/PlaylistDuplicateModal'
import FileDuplicateModal from './components/FileDuplicateModal'
import PlaylistPicker from './components/PlaylistPicker'
import DeckSelectionDialog from './components/DeckSelectionDialog'
import MoveDialog from './components/MoveDialog'
import playlistManager from './utils/playlistManager'
import iosFileHandler from './utils/iosFileHandler'
import capacitorFileManager from './utils/capacitorFileManager'

// Global functions that will be defined inside the App component
let fadeInAPressed = () => {};
let fadeOutAPressed = () => {};
let fadeNextAPressed = () => {};
let fadeInBPressed = () => {};
let fadeOutBPressed = () => {};
let fadeNextBPressed = () => {};
let CF_A_B_Button = () => {};
let CF_B_A_Button = () => {};
const HeaderSettingsPressed = () => {
  console.log("Settings Clicked!");
};

function App() {
  const [fadeDuration, setFadeDuration] = useState(1);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [folderImportDialog, setFolderImportDialog] = useState({
    isOpen: false,
    folderName: '',
    hasNestedPlaylists: false,
    folderHandle: null,
    folderStructure: null
  });
  const [playlists, setPlaylists] = useState([]);
  const [folders, setFolders] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const fileObjectsRef = useRef(new Map()); // Store file objects in memory by ID
  const [editPlaylistModal, setEditPlaylistModal] = useState({ isOpen: false, playlist: null });
  const [duplicateModal, setDuplicateModal] = useState({ isOpen: false, count: 0, playlistName: '', callback: null });
  const [playlistDuplicateModal, setPlaylistDuplicateModal] = useState({ isOpen: false, existingName: '', onChoice: null, onClose: null });
  const [playlistPicker, setPlaylistPicker] = useState({ isOpen: false, callback: null });
  const [deckSelectionDialog, setDeckSelectionDialog] = useState({ isOpen: false, files: [], callback: null });
  const [moveDialog, setMoveDialog] = useState({ isOpen: false, item: null, currentLocation: null });
  const [fileDuplicateModal, setFileDuplicateModal] = useState({ isOpen: false, duplicates: [], onChoice: null, importType: 'files' });

  // Load stored files and library on mount
  useEffect(() => {
    const loadLibrary = async () => {
      try {
        // Load from Capacitor filesystem or localStorage
        const library = await capacitorFileManager.readCuewaveFolder();
        setPlaylists(library.playlists || []);
        setFolders(library.folders || []);
        
        // Load uncategorized files
        const uncategorizedFiles = await capacitorFileManager.getUncategorizedFiles();
        
        // Collect all files from library
        const files = [...uncategorizedFiles]; // Start with uncategorized
        const collectFiles = (item, location = '') => {
          if (item.tracks) {
            item.tracks.forEach(track => {
              files.push({
                ...track,
                id: track.id || Date.now() + Math.random(),
                location: location || item.name
              });
            });
          }
          if (item.folders) {
            item.folders.forEach(folder => collectFiles(folder, folder.name));
          }
          if (item.playlists) {
            item.playlists.forEach(playlist => collectFiles(playlist, location));
          }
        };
        
        // Collect from folders and playlists
        library.folders.forEach(folder => collectFiles(folder, folder.name));
        library.playlists.forEach(playlist => collectFiles(playlist, 'root'));
        
        setAllFiles(files);
        
        // Clear decks on startup
        setDeckATracks([]);
        setDeckBTracks([]);
        
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
  
  // Mixer volume states - all start at 60% slider position (100% actual volume)
  // Slider range: 0-100, where 0-60 = 0-100% volume, 60-100 = 100-300% volume
  const [masterVolume, setMasterVolume] = useState(60);
  const [deckAVolume, setDeckAVolume] = useState(60);
  const [deckBVolume, setDeckBVolume] = useState(60);
  const [muteA, setMuteA] = useState(false);
  const [muteB, setMuteB] = useState(false);
  const [muteMaster, setMuteMaster] = useState(false);

  const [deckATracks, setDeckATracks] = useState([]);
  const [deckBTracks, setDeckBTracks] = useState([]);

  const [selectedTrackA, setSelectedTrackA] = useState(null);
  const [selectedTrackB, setSelectedTrackB] = useState(null);
  
  // Audio player refs and playing state
  const audioRefA = useRef(null);
  const audioRefB = useRef(null);
  const audioContextRef = useRef(null);
  const gainNodeA = useRef(null);
  const gainNodeB = useRef(null);
  const fadeGainNodeA = useRef(null); // Separate gain node for fades
  const fadeGainNodeB = useRef(null); // Separate gain node for fades
  const sourceNodeA = useRef(null);
  const sourceNodeB = useRef(null);
  const fadeIntervalA = useRef(null);
  const fadeIntervalB = useRef(null);
  const [isPlayingA, setIsPlayingA] = useState(false);
  const [isPlayingB, setIsPlayingB] = useState(false);
  const [currentTrackA, setCurrentTrackA] = useState(null);
  const [currentTrackB, setCurrentTrackB] = useState(null);

  // Play button handlers
  const playAPressed = async () => {
    console.log("Play A Clicked!");
    if (selectedTrackA) {
      await handlePlayPause('A');
    } else {
      console.log("No track selected in Deck A");
    }
  };

  const playBPressed = async () => {
    console.log("Play B Clicked!");
    if (selectedTrackB) {
      await handlePlayPause('B');
    } else {
      console.log("No track selected in Deck B");
    }
  };

  // Fade functions - uses separate fade gain node, not mixer sliders
  const fadeVolume = (deck, targetMultiplier, duration) => {
    return new Promise((resolve) => {
      // Cancel any existing fade
      const fadeInterval = deck === 'A' ? fadeIntervalA : fadeIntervalB;
      if (fadeInterval.current) {
        cancelAnimationFrame(fadeInterval.current);
      }
      
      const fadeGainNode = deck === 'A' ? fadeGainNodeA.current : fadeGainNodeB.current;
      if (!fadeGainNode) {
        resolve();
        return;
      }
      
      const startTime = Date.now();
      const startValue = fadeGainNode.gain.value;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        
        // Use easing function for smooth fade
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-in-out
        const currentValue = startValue + (targetMultiplier - startValue) * easedProgress;
        
        fadeGainNode.gain.value = currentValue;
        
        if (progress < 1) {
          fadeInterval.current = requestAnimationFrame(animate);
        } else {
          fadeInterval.current = null;
          resolve();
        }
      };
      
      animate();
    });
  };

  // Fade In functions
  fadeInAPressed = async () => {
    console.log("Fade In A Starting");
    if (!isPlayingA && selectedTrackA) {
      // Start with fade gain at 0
      if (fadeGainNodeA.current) {
        fadeGainNodeA.current.gain.value = 0;
      }
      await handlePlayPause('A'); // Start playing
    }
    await fadeVolume('A', 1.0, fadeDuration); // Fade to full volume
  };

  fadeInBPressed = async () => {
    console.log("Fade In B Starting");
    if (!isPlayingB && selectedTrackB) {
      // Start with fade gain at 0
      if (fadeGainNodeB.current) {
        fadeGainNodeB.current.gain.value = 0;
      }
      await handlePlayPause('B'); // Start playing
    }
    await fadeVolume('B', 1.0, fadeDuration); // Fade to full volume
  };

  // Fade Out functions
  fadeOutAPressed = async () => {
    console.log("Fade Out A Starting");
    await fadeVolume('A', 0, fadeDuration);
    // Small delay to ensure fade completes before stopping
    await new Promise(resolve => setTimeout(resolve, 50));
    if (isPlayingA) {
      await handlePlayPause('A'); // Stop playing after fade
    }
    // Small delay before resetting to avoid spike
    await new Promise(resolve => setTimeout(resolve, 100));
    // Reset fade gain for next time
    if (fadeGainNodeA.current) {
      fadeGainNodeA.current.gain.value = 1.0;
    }
  };

  fadeOutBPressed = async () => {
    console.log("Fade Out B Starting");
    await fadeVolume('B', 0, fadeDuration);
    // Small delay to ensure fade completes before stopping
    await new Promise(resolve => setTimeout(resolve, 50));
    if (isPlayingB) {
      await handlePlayPause('B'); // Stop playing after fade
    }
    // Small delay before resetting to avoid spike
    await new Promise(resolve => setTimeout(resolve, 100));
    // Reset fade gain for next time
    if (fadeGainNodeB.current) {
      fadeGainNodeB.current.gain.value = 1.0;
    }
  };

  // Fade to Next functions
  fadeNextAPressed = async () => {
    console.log("Fade to Next A Starting");
    const currentIndex = deckATracks.findIndex(track => track.id === selectedTrackA?.id);
    if (currentIndex >= 0 && currentIndex < deckATracks.length - 1) {
      const nextTrack = deckATracks[currentIndex + 1];
      
      // Start fading out current track
      const fadeOutPromise = fadeVolume('A', 0, fadeDuration);
      
      // Wait a bit into the fade before starting next track (overlap)
      await new Promise(resolve => setTimeout(resolve, fadeDuration * 500)); // Start halfway through
      
      // Stop current track
      if (isPlayingA) {
        await handlePlayPause('A');
      }
      
      // Select next track
      setSelectedTrackA(nextTrack);
      setCurrentTrackA(null); // Force reload of track
      
      // Reset fade gain to 0 for fade in
      if (fadeGainNodeA.current) {
        fadeGainNodeA.current.gain.value = 0;
      }
      
      // Start playing next track
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for track load
      await handlePlayPause('A');
      
      // Fade in the new track
      await fadeVolume('A', 1.0, fadeDuration);
      
      // Ensure fade out completed
      await fadeOutPromise;
    }
  };

  fadeNextBPressed = async () => {
    console.log("Fade to Next B Starting");
    const currentIndex = deckBTracks.findIndex(track => track.id === selectedTrackB?.id);
    if (currentIndex >= 0 && currentIndex < deckBTracks.length - 1) {
      const nextTrack = deckBTracks[currentIndex + 1];
      
      // Start fading out current track
      const fadeOutPromise = fadeVolume('B', 0, fadeDuration);
      
      // Wait a bit into the fade before starting next track (overlap)
      await new Promise(resolve => setTimeout(resolve, fadeDuration * 500)); // Start halfway through
      
      // Stop current track
      if (isPlayingB) {
        await handlePlayPause('B');
      }
      
      // Select next track
      setSelectedTrackB(nextTrack);
      setCurrentTrackB(null); // Force reload of track
      
      // Reset fade gain to 0 for fade in
      if (fadeGainNodeB.current) {
        fadeGainNodeB.current.gain.value = 0;
      }
      
      // Start playing next track
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for track load
      await handlePlayPause('B');
      
      // Fade in the new track
      await fadeVolume('B', 1.0, fadeDuration);
      
      // Ensure fade out completed
      await fadeOutPromise;
    }
  };

  // Crossfade functions
  CF_A_B_Button = async () => {
    console.log("Crossfade A-B Starting");
    // Start B if not playing
    if (!isPlayingB && selectedTrackB) {
      if (fadeGainNodeB.current) {
        fadeGainNodeB.current.gain.value = 0;
      }
      await handlePlayPause('B');
    }
    
    // Crossfade: A fades out, B fades in
    await Promise.all([
      fadeVolume('A', 0, fadeDuration),
      fadeVolume('B', 1.0, fadeDuration)
    ]);
    
    // Stop A after fade and reset its fade gain
    if (isPlayingA) {
      await handlePlayPause('A');
    }
    if (fadeGainNodeA.current) {
      fadeGainNodeA.current.gain.value = 1.0;
    }
  };

  CF_B_A_Button = async () => {
    console.log("Crossfade B-A Starting");
    // Start A if not playing
    if (!isPlayingA && selectedTrackA) {
      if (fadeGainNodeA.current) {
        fadeGainNodeA.current.gain.value = 0;
      }
      await handlePlayPause('A');
    }
    
    // Crossfade: B fades out, A fades in
    await Promise.all([
      fadeVolume('B', 0, fadeDuration),
      fadeVolume('A', 1.0, fadeDuration)
    ]);
    
    // Stop B after fade and reset its fade gain
    if (isPlayingB) {
      await handlePlayPause('B');
    }
    if (fadeGainNodeB.current) {
      fadeGainNodeB.current.gain.value = 1.0;
    }
  };

  // Initialize audio elements and Web Audio API
  useEffect(() => {
    const initAudio = () => {
      // Create or get audio context
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
      }
      
      // Initialize audio elements
      if (!audioRefA.current) {
        audioRefA.current = new Audio();
        audioRefA.current.crossOrigin = "anonymous";
        
        // Create gain nodes for deck A (mixer -> fade -> destination)
        if (!gainNodeA.current) {
          gainNodeA.current = audioContextRef.current.createGain();
          fadeGainNodeA.current = audioContextRef.current.createGain();
          fadeGainNodeA.current.gain.value = 1.0; // Start at full volume
          gainNodeA.current.connect(fadeGainNodeA.current);
          fadeGainNodeA.current.connect(audioContextRef.current.destination);
        }
      }
      
      if (!audioRefB.current) {
        audioRefB.current = new Audio();
        audioRefB.current.crossOrigin = "anonymous";
        
        // Create gain nodes for deck B (mixer -> fade -> destination)
        if (!gainNodeB.current) {
          gainNodeB.current = audioContextRef.current.createGain();
          fadeGainNodeB.current = audioContextRef.current.createGain();
          fadeGainNodeB.current.gain.value = 1.0; // Start at full volume
          gainNodeB.current.connect(fadeGainNodeB.current);
          fadeGainNodeB.current.connect(audioContextRef.current.destination);
        }
      }
    };
    
    initAudio();
  }, []);
  
  // Helper function to get volume percentage for display
  const getVolumePercentage = (sliderValue) => {
    if (sliderValue <= 60) {
      // Linear mapping for 0-60 slider to 0-100%
      return Math.round((sliderValue / 60) * 100);
    } else {
      // Exponential mapping for 60-100 slider to 100-300%
      const normalizedPosition = (sliderValue - 60) / 40; // 0 to 1
      const multiplier = 1.0 + (Math.exp(normalizedPosition * 1.5) - 1) * 2;
      return Math.round(multiplier * 100);
    }
  };

  // Update volumes when sliders change
  useEffect(() => {
    const updateVolumes = () => {
      // Convert slider position (0-100) to volume multiplier with exponential curve
      // 0-60 slider = 0-100% volume (0-1.0 multiplier)
      // 60-100 slider = 100-300% volume (1.0-3.0 multiplier)
      const getVolumeMultiplier = (sliderValue) => {
        if (sliderValue <= 60) {
          // Linear mapping for 0-60 slider to 0-1.0 volume
          return (sliderValue / 60) * 1.0;
        } else {
          // Exponential mapping for 60-100 slider to 1.0-3.0 volume
          const normalizedPosition = (sliderValue - 60) / 40; // 0 to 1
          // Use exponential curve: 1 + (e^(x*1.5) - 1) * 2
          return 1.0 + (Math.exp(normalizedPosition * 1.5) - 1) * 2;
        }
      };
      
      const masterMultiplier = getVolumeMultiplier(masterVolume);
      const deckAMultiplier = getVolumeMultiplier(deckAVolume);
      const deckBMultiplier = getVolumeMultiplier(deckBVolume);
      
      // Update gain nodes for amplification
      if (gainNodeA.current) {
        const gainA = muteA || muteMaster ? 0 : deckAMultiplier * masterMultiplier;
        gainNodeA.current.gain.value = gainA;
      }
      
      if (gainNodeB.current) {
        const gainB = muteB || muteMaster ? 0 : deckBMultiplier * masterMultiplier;
        gainNodeB.current.gain.value = gainB;
      }
    };
    
    updateVolumes();
  }, [deckAVolume, deckBVolume, masterVolume, muteA, muteB, muteMaster]);

  // Handle play/pause for decks
  const handlePlayPause = async (deck) => {
    console.log(`handlePlayPause called for deck ${deck}`);
    const audioRef = deck === 'A' ? audioRefA : audioRefB;
    const selectedTrack = deck === 'A' ? selectedTrackA : selectedTrackB;
    const currentTrack = deck === 'A' ? currentTrackA : currentTrackB;
    const setCurrentTrack = deck === 'A' ? setCurrentTrackA : setCurrentTrackB;
    const isPlaying = deck === 'A' ? isPlayingA : isPlayingB;
    const setIsPlaying = deck === 'A' ? setIsPlayingA : setIsPlayingB;
    
    console.log('Selected track:', selectedTrack);
    console.log('Audio ref:', audioRef.current);
    
    if (!audioRef.current || !selectedTrack) {
      console.log('Missing audioRef or selectedTrack');
      return;
    }
    
    try {
      // If it's a new track, load it
      if (!currentTrack || currentTrack.id !== selectedTrack.id) {
        console.log('Loading new track:', selectedTrack);
        // Get the audio URL for the track
        let audioUrl;
        
        // First check in-memory file objects
        const memoryFile = fileObjectsRef.current.get(String(selectedTrack.id)) || 
                          fileObjectsRef.current.get(selectedTrack.name);
        
        if (memoryFile && memoryFile instanceof File) {
          console.log('Using file from memory');
          audioUrl = URL.createObjectURL(memoryFile);
        } else if (selectedTrack.file && selectedTrack.file instanceof File) {
          // If we have the file object directly
          console.log('Using file object directly');
          audioUrl = URL.createObjectURL(selectedTrack.file);
        } else if (selectedTrack.url) {
          // If we have a URL
          console.log('Using URL:', selectedTrack.url);
          audioUrl = selectedTrack.url;
        } else {
          // Try to load from storage
          console.log('Loading from storage for track:', selectedTrack.name);
          const fileData = await capacitorFileManager.getFileData(selectedTrack);
          if (fileData) {
            console.log('File data loaded successfully');
            audioUrl = URL.createObjectURL(fileData);
          } else {
            console.error('Could not load audio file from storage');
            alert('Could not load audio file. Please re-import the file.');
            return;
          }
        }
        
        console.log('Setting audio URL:', audioUrl);
        audioRef.current.src = audioUrl;
        setCurrentTrack(selectedTrack);
        
        // Connect to Web Audio API for gain control
        try {
          if (audioContextRef.current) {
            // Resume audio context on user interaction (required for iOS)
            if (audioContextRef.current.state === 'suspended') {
              await audioContextRef.current.resume();
            }
            
            // Disconnect previous source if exists
            const sourceNode = deck === 'A' ? sourceNodeA : sourceNodeB;
            const gainNode = deck === 'A' ? gainNodeA : gainNodeB;
            
            if (sourceNode.current) {
              try {
                sourceNode.current.disconnect();
              } catch (e) {
                // Source might already be disconnected
              }
            }
            
            // Create new source and connect through gain node
            const newSource = audioContextRef.current.createMediaElementSource(audioRef.current);
            newSource.connect(gainNode.current);
            
            if (deck === 'A') {
              sourceNodeA.current = newSource;
            } else {
              sourceNodeB.current = newSource;
            }
          }
        } catch (e) {
          console.log('Web Audio API connection error (will use standard volume):', e);
          // Fallback to standard volume control
          audioRef.current.volume = 1.0;
        }
        
        // Set up event listeners for the new track
        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
        
        audioRef.current.onerror = (e) => {
          console.error('Audio error:', e);
          setIsPlaying(false);
        };
      }
      
      // Toggle play/pause
      if (isPlaying) {
        console.log('Pausing audio');
        await audioRef.current.pause();
        setIsPlaying(false);
      } else {
        console.log('Playing audio');
        // Reset fade gain to 1.0 when starting playback normally
        const fadeGainNode = deck === 'A' ? fadeGainNodeA.current : fadeGainNodeB.current;
        if (fadeGainNode) {
          fadeGainNode.gain.value = 1.0;
        }
        // Resume audio context if needed (for iOS)
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        await audioRef.current.play();
        setIsPlaying(true);
        console.log('Audio playing successfully');
      }
    } catch (error) {
      console.error('Error playing/pausing audio:', error);
      setIsPlaying(false);
    }
  };

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
      
      // Collect files based on import mode
      let audioFiles = [];
      const collectFiles = (structure) => {
        if (structure.audioFiles) {
          audioFiles = audioFiles.concat(structure.audioFiles);
        }
        
        // Include playlist files if importMode is 'all'
        if (importMode === 'all' && structure.playlists) {
          structure.playlists.forEach(playlist => {
            if (playlist.tracks) {
              playlist.tracks.forEach(track => {
                if (track.file) {
                  audioFiles.push({
                    name: track.name || track.file.name,
                    file: track.file
                  });
                }
              });
            }
          });
        }
        
        if (structure.subfolders) {
          structure.subfolders.forEach(subfolder => collectFiles(subfolder));
        }
      };
      
      collectFiles(folderStructure);
      
      // Remove duplicates from collected files
      const uniqueFiles = new Map();
      audioFiles.forEach(fileData => {
        const file = fileData.file || fileData;
        if (!uniqueFiles.has(file.name)) {
          uniqueFiles.set(file.name, file);
        }
      });
      audioFiles = Array.from(uniqueFiles.values());
      
      // Check for duplicates in existing files
      const existingFileNames = new Set(allFiles.map(f => f.name));
      const duplicates = [];
      const newFiles = [];
      
      for (const file of audioFiles) {
        if (existingFileNames.has(file.name)) {
          const suggestedName = generateUniqueFileName(file.name, existingFileNames);
          duplicates.push({ file, suggestedName });
        } else {
          newFiles.push(file);
        }
      }
      
      // Process files (with or without duplicates)
      const processImport = async (filesToImport) => {
        // First create playlist with placeholder durations for immediate display
        const playlistId = Date.now();
        const initialTracks = filesToImport.map((file, index) => {
          const trackId = playlistId + index + Math.random();
          // Store file object in memory for playback
          fileObjectsRef.current.set(String(trackId), file);
          fileObjectsRef.current.set(file.name, file);
          
          return {
            id: trackId,
            name: file.name,
            file: file,
            duration: 'Loading...', // Placeholder duration
            size: file.size,
            type: file.type || 'audio/mpeg'
          };
        });
        
        const playlist = {
          id: playlistId,
          name: folderStructure.name || 'Imported Folder',
          tracks: initialTracks,
          created: Date.now()
        };
        
        // Save and display immediately with placeholder durations
        await capacitorFileManager.savePlaylist(playlist);
        await updatePlaylistsDisplay();
        
        // Now calculate durations asynchronously and update
        const tracksWithDuration = [];
        for (let i = 0; i < filesToImport.length; i++) {
          const file = filesToImport[i];
          const duration = await capacitorFileManager.getAudioDuration(file);
          tracksWithDuration.push({
            ...initialTracks[i],
            duration: duration
          });
          
          // Update playlist with calculated durations periodically (every 5 files)
          if ((i + 1) % 5 === 0 || i === filesToImport.length - 1) {
            playlist.tracks = tracksWithDuration.concat(
              initialTracks.slice(tracksWithDuration.length)
            );
            await capacitorFileManager.savePlaylist(playlist);
            await updatePlaylistsDisplay();
          }
        }
      };
      
      if (duplicates.length > 0) {
        setFileDuplicateModal({
          isOpen: true,
          duplicates: duplicates,
          importType: 'allfiles',
          onChoice: async (action, renamedFiles) => {
            setFileDuplicateModal({ isOpen: false, duplicates: [], onChoice: null });
            
            if (action === 'cancel') {
              return;
            }
            
            let filesToImport = [...newFiles];
            
            if (action === 'continue') {
              for (const dup of duplicates) {
                const newFile = new File([dup.file], dup.suggestedName, { type: dup.file.type });
                filesToImport.push(newFile);
              }
            } else if (action === 'rename') {
              for (const dup of duplicates) {
                const newName = renamedFiles[dup.file.name];
                if (newName && newName !== dup.file.name) {
                  const newFile = new File([dup.file], newName, { type: dup.file.type });
                  filesToImport.push(newFile);
                }
              }
            }
            
            await processImport(filesToImport);
          }
        });
      } else {
        await processImport(newFiles);
      }
    } catch (error) {
      console.error('Error importing folder:', error);
      alert('Error importing folder: ' + error.message);
    }
  };

  const handleDirectFolderImport = async (folderStructure) => {
    try {
      // First get the files from folder structure
      let audioFiles = [];
      const collectFiles = (structure) => {
        if (structure.audioFiles) {
          audioFiles = audioFiles.concat(structure.audioFiles);
        }
        if (structure.subfolders) {
          structure.subfolders.forEach(subfolder => collectFiles(subfolder));
        }
      };
      collectFiles(folderStructure);
      
      // Check for duplicates in all files
      const existingFileNames = new Set(allFiles.map(f => f.name));
      const duplicates = [];
      const newFiles = [];
      
      for (const fileData of audioFiles) {
        const file = fileData.file || fileData;
        if (existingFileNames.has(file.name)) {
          const suggestedName = generateUniqueFileName(file.name, existingFileNames);
          duplicates.push({ file, suggestedName });
        } else {
          newFiles.push(file);
        }
      }
      
      // If duplicates found, show modal
      if (duplicates.length > 0) {
        setFileDuplicateModal({
          isOpen: true,
          duplicates: duplicates,
          importType: 'allfiles',
          onChoice: async (action, renamedFiles) => {
            setFileDuplicateModal({ isOpen: false, duplicates: [], onChoice: null });
            
            if (action === 'cancel') {
              return;
            }
            
            let filesToImport = [...newFiles];
            
            if (action === 'continue') {
              for (const dup of duplicates) {
                const newFile = new File([dup.file], dup.suggestedName, { type: dup.file.type });
                filesToImport.push(newFile);
              }
            } else if (action === 'rename') {
              for (const dup of duplicates) {
                const newName = renamedFiles[dup.file.name];
                if (newName && newName !== dup.file.name) {
                  const newFile = new File([dup.file], newName, { type: dup.file.type });
                  filesToImport.push(newFile);
                }
              }
            }
            // Skip action: filesToImport already contains only new files
            
            // Create playlist from imported files - show immediately then update durations
            const playlistId = Date.now();
            const initialTracks = filesToImport.map((file, index) => {
              const trackId = playlistId + index + Math.random();
              // Store file object in memory for playback
              fileObjectsRef.current.set(String(trackId), file);
              fileObjectsRef.current.set(file.name, file);
              
              return {
                id: trackId,
                name: file.name,
                file: file,
                duration: 'Loading...',
                size: file.size,
                type: file.type || 'audio/mpeg'
              };
            });
            
            const playlist = {
              id: playlistId,
              name: folderStructure.name || 'Imported Folder',
              tracks: initialTracks,
              created: Date.now()
            };
            
            // Save and display immediately
            await capacitorFileManager.savePlaylist(playlist);
            await updatePlaylistsDisplay();
            
            // Calculate durations asynchronously
            const tracksWithDuration = [];
            for (let i = 0; i < filesToImport.length; i++) {
              const file = filesToImport[i];
              const duration = await capacitorFileManager.getAudioDuration(file);
              tracksWithDuration.push({
                ...initialTracks[i],
                duration: duration
              });
              
              // Update periodically
              if ((i + 1) % 5 === 0 || i === filesToImport.length - 1) {
                playlist.tracks = tracksWithDuration.concat(
                  initialTracks.slice(tracksWithDuration.length)
                );
                await capacitorFileManager.savePlaylist(playlist);
                await updatePlaylistsDisplay();
              }
            }
          }
        });
      } else {
        // No duplicates, create playlist immediately then calculate durations
        const playlistId = Date.now();
        const initialTracks = newFiles.map((file, index) => {
          const trackId = playlistId + index + Math.random();
          // Store file object in memory for playback
          fileObjectsRef.current.set(String(trackId), file);
          fileObjectsRef.current.set(file.name, file);
          
          return {
            id: trackId,
            name: file.name,
            file: file,
            duration: 'Loading...',
            size: file.size,
            type: file.type || 'audio/mpeg'
          };
        });
        
        const playlist = {
          id: playlistId,
          name: folderStructure.name || 'Imported Folder',
          tracks: initialTracks,
          created: Date.now()
        };
        
        // Save and display immediately
        await capacitorFileManager.savePlaylist(playlist);
        await updatePlaylistsDisplay();
        
        // Calculate durations asynchronously
        const tracksWithDuration = [];
        for (let i = 0; i < newFiles.length; i++) {
          const file = newFiles[i];
          const duration = await capacitorFileManager.getAudioDuration(file);
          tracksWithDuration.push({
            ...initialTracks[i],
            duration: duration
          });
          
          // Update periodically
          if ((i + 1) % 5 === 0 || i === newFiles.length - 1) {
            playlist.tracks = tracksWithDuration.concat(
              initialTracks.slice(tracksWithDuration.length)
            );
            await capacitorFileManager.savePlaylist(playlist);
            await updatePlaylistsDisplay();
          }
        }
      }
    } catch (error) {
      console.error('Error importing folder:', error);
      alert('Error importing folder: ' + error.message);
    }
  };

  const handleLoadToDeck = async (files, deck, action = 'replace') => {
    // If deck is null, show deck selection dialog
    if (!deck) {
      setDeckSelectionDialog({
        isOpen: true,
        files: files,
        callback: (selectedDeck, selectedAction) => {
          if (selectedDeck) {
            handleLoadToDeck(files, selectedDeck, selectedAction || action);
          }
        }
      });
      return;
    }

    try {
      const tracks = files.map((file, index) => ({
        id: file.id || Date.now() + index,
        name: file.name,
        duration: file.duration || '0:00',
        path: file.path,
        file: file.file || file, // Keep the file object for playback
        type: file.type,
        size: file.size,
        location: file.location
      }));
      
      console.log('Loading tracks to deck:', deck, tracks);

      if (deck === 'A') {
        if (action === 'append') {
          setDeckATracks(prevTracks => [...prevTracks, ...tracks]);
        } else {
          setDeckATracks(tracks);
        }
      } else if (deck === 'B') {
        if (action === 'append') {
          setDeckBTracks(prevTracks => [...prevTracks, ...tracks]);
        } else {
          setDeckBTracks(tracks);
        }
      }
    } catch (error) {
      console.error('Error loading to deck:', error);
      alert('Error loading to deck: ' + error.message);
    }
  };

  const updatePlaylistsDisplay = async () => {
    // Reload library from storage
    const library = await capacitorFileManager.readCuewaveFolder();
    setPlaylists(library.playlists || []);
    setFolders(library.folders || []);
    
    // Get uncategorized files
    const uncategorizedFiles = await capacitorFileManager.getUncategorizedFiles();
    
    // Use a Map to deduplicate files by name
    const fileMap = new Map();
    
    // Add uncategorized files first
    uncategorizedFiles.forEach(file => {
      if (!fileMap.has(file.name)) {
        fileMap.set(file.name, {
          ...file,
          id: file.id || Date.now() + Math.random(),
          location: 'uncategorized'
        });
      }
    });
    
    // Collect files from playlists and folders without duplicating
    const collectFiles = (item, location = '') => {
      if (item.tracks) {
        item.tracks.forEach(track => {
          // Only add if not already in the map
          if (!fileMap.has(track.name)) {
            // Store file object in memory if available
            if (track.file && track.file instanceof File) {
              fileObjectsRef.current.set(String(track.id), track.file);
              fileObjectsRef.current.set(track.name, track.file);
            }
            
            fileMap.set(track.name, {
              ...track,
              id: track.id || Date.now() + Math.random(),
              location: location || item.name
            });
          }
        });
      }
      if (item.playlists) {
        item.playlists.forEach(playlist => collectFiles(playlist, item.name));
      }
      if (item.folders) {
        item.folders.forEach(folder => collectFiles(folder, item.name));
      }
    };
    
    library.playlists?.forEach(playlist => collectFiles(playlist));
    library.folders?.forEach(folder => collectFiles(folder));
    
    // Convert map to array
    const files = Array.from(fileMap.values());
    setAllFiles(files);
    console.log('Updated library:', library, 'Uncategorized:', uncategorizedFiles);
  };

  const handleSelectPlaylistFromSidebar = async (playlist, action) => {
    if (action === 'edit') {
      // Open edit modal
      setEditPlaylistModal({ isOpen: true, playlist });
    } else if (action === 'deck') {
      // Show deck selection
      setDeckSelectionDialog({
        isOpen: true,
        files: playlist.tracks || [],
        callback: (deck, loadAction) => {
          if (deck) {
            handleLoadToDeck(playlist.tracks, deck, loadAction);
          }
        }
      });
    } else if (action === 'move') {
      // Open move dialog
      const currentLocation = findPlaylistLocation(playlist);
      setMoveDialog({ 
        isOpen: true, 
        item: playlist, 
        currentLocation: currentLocation 
      });
    } else {
      setSidebarOpen(false);
    }
  };

  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      await capacitorFileManager.createFolder(folderName);
      await updatePlaylistsDisplay();
    }
  };

  const handleCreatePlaylist = async (files, playlistName) => {
    // Check if playlist with same name exists
    const existingPlaylists = await capacitorFileManager.getAllPlaylists();
    const normalizedName = playlistName.toLowerCase().trim();
    const duplicates = existingPlaylists.filter(p => 
      p.name.replace('playlist-', '').toLowerCase().trim() === normalizedName ||
      p.displayName?.toLowerCase().trim() === normalizedName
    );
    
    if (duplicates.length > 0) {
      // Show duplicate modal
      return new Promise((resolve) => {
        setPlaylistDuplicateModal({
          isOpen: true,
          existingName: playlistName,
          onChoice: async (choice, newName) => {
            if (choice === 'numbered') {
              // Find the next available number
              let num = 2;
              let numberedName = `${playlistName} (${num})`;
              while (existingPlaylists.some(p => 
                p.name.replace('playlist-', '').toLowerCase() === numberedName.toLowerCase() ||
                p.displayName?.toLowerCase() === numberedName.toLowerCase()
              )) {
                num++;
                numberedName = `${playlistName} (${num})`;
              }
              const playlist = {
                id: Date.now(),
                name: numberedName,
                tracks: files,
                created: Date.now()
              };
              await capacitorFileManager.savePlaylist(playlist);
              await updatePlaylistsDisplay();
            } else if (choice === 'rename' && newName) {
              const playlist = {
                id: Date.now(),
                name: newName,
                tracks: files,
                created: Date.now()
              };
              await capacitorFileManager.savePlaylist(playlist);
              await updatePlaylistsDisplay();
            }
            setPlaylistDuplicateModal({ isOpen: false });
            resolve();
          },
          onClose: () => {
            setPlaylistDuplicateModal({ isOpen: false });
            resolve();
          }
        });
      });
    }
    
    const playlist = {
      id: Date.now(),
      name: playlistName,
      tracks: files,
      created: Date.now()
    };
    
    await capacitorFileManager.savePlaylist(playlist);
    await updatePlaylistsDisplay();
  };

  const handleAddToPlaylist = async (files, targetPlaylist) => {
    // If no target playlist, show picker
    if (!targetPlaylist) {
      setPlaylistPicker({
        isOpen: true,
        callback: (playlist) => {
          if (playlist) {
            handleAddToPlaylist(files, playlist);
          }
        }
      });
      return;
    }

    // Check for duplicates
    const existingNames = new Set(targetPlaylist.tracks?.map(t => t.name) || []);
    const duplicates = files.filter(f => existingNames.has(f.name));
    
    if (duplicates.length > 0) {
      // Show duplicate modal with 3 options
      setDuplicateModal({
        isOpen: true,
        count: duplicates.length,
        playlistName: targetPlaylist.name.replace('playlist-', ''),
        callback: async (choice) => {
          if (choice === 'add') {
            // Add all including duplicates
            targetPlaylist.tracks = [...(targetPlaylist.tracks || []), ...files];
            await capacitorFileManager.savePlaylist(targetPlaylist);
            await updatePlaylistsDisplay();
          } else if (choice === 'skip') {
            // Add only non-duplicates
            const nonDuplicates = files.filter(f => !existingNames.has(f.name));
            if (nonDuplicates.length > 0) {
              targetPlaylist.tracks = [...(targetPlaylist.tracks || []), ...nonDuplicates];
              await capacitorFileManager.savePlaylist(targetPlaylist);
              await updatePlaylistsDisplay();
            }
          }
          // 'cancel' does nothing
        }
      });
    } else if (files.length > 0) {
      targetPlaylist.tracks = [...(targetPlaylist.tracks || []), ...files];
      await capacitorFileManager.savePlaylist(targetPlaylist);
      await updatePlaylistsDisplay();
    }
  };

  const handleRemoveFromPlaylist = async (track, playlist) => {
    // Remove track from playlist
    playlist.tracks = playlist.tracks.filter(t => t.id !== track.id);
    await capacitorFileManager.savePlaylist(playlist);
    
    // Check if track exists in any other playlist
    const allPlaylists = await capacitorFileManager.getAllPlaylists();
    const isInAnotherPlaylist = allPlaylists.some(p => 
      p.id !== playlist.id && p.tracks?.some(t => t.name === track.name)
    );
    
    // If not in any playlist, add to uncategorized
    if (!isInAnotherPlaylist && track.file) {
      await capacitorFileManager.saveUncategorizedFile({
        id: track.id || Date.now() + Math.random(),
        name: track.name,
        file: track.file,
        duration: track.duration || '0:00',
        size: track.size || 0,
        type: track.type || 'audio/mpeg',
        location: 'uncategorized'
      });
    }
    
    await updatePlaylistsDisplay();
  };

  const handleMoveItem = async (item, targetFolderId) => {
    try {
      console.log('Moving playlist:', item.name, 'to:', targetFolderId);
      // Move playlist to new location
      const success = await capacitorFileManager.movePlaylist(item.name, targetFolderId);
      if (success) {
        await updatePlaylistsDisplay();
        console.log('Move successful');
      } else {
        console.error('Move failed - no error thrown but returned false');
        alert('Failed to move playlist');
      }
    } catch (error) {
      console.error('Error moving item:', error);
      alert('Error moving item: ' + error.message);
    }
  };

  const findPlaylistLocation = (playlist) => {
    // Find which folder contains this playlist
    for (const folder of folders) {
      if (folder.playlists?.some(p => p.id === playlist.id)) {
        return folder.id;
      }
      // Check nested folders
      const checkNested = (f) => {
        for (const subFolder of f.folders || []) {
          if (subFolder.playlists?.some(p => p.id === playlist.id)) {
            return subFolder.id;
          }
          const nested = checkNested(subFolder);
          if (nested) return nested;
        }
        return null;
      };
      const nested = checkNested(folder);
      if (nested) return nested;
    }
    return 'root'; // Playlist is at root level
  };

  const handleMoveConfirm = async (item, targetLocation) => {
    await handleMoveItem(item, targetLocation);
    setMoveDialog({ isOpen: false, item: null, currentLocation: null });
  };

  const handleDeleteItem = async (item, type) => {
    if (type === 'playlist') {
      await capacitorFileManager.deletePlaylist(item.name);
    } else if (type === 'folder') {
      // Delete folder and contents
      await capacitorFileManager.deleteFolder(item.name);
    } else if (type === 'uncategorized') {
      // Delete uncategorized file
      await capacitorFileManager.deleteUncategorizedFile(item.id);
    }
    await updatePlaylistsDisplay();
  };

  const handleEditPlaylistSave = async (playlist, selectedFiles) => {
    // Update playlist with selected files only
    playlist.tracks = selectedFiles;
    await capacitorFileManager.savePlaylist(playlist);
    await updatePlaylistsDisplay();
  };

  const handleDeckSelectionFromDialog = (deck, action) => {
    const { callback, files } = deckSelectionDialog;
    if (callback) {
      callback(deck, action);
    } else if (files && deck) {
      handleLoadToDeck(files, deck, action);
    }
    setDeckSelectionDialog({ isOpen: false, files: [], callback: null });
  };

  const HeaderOpenPressed = () => {
    setSidebarOpen(true);
  };

  const generateUniqueFileName = (baseName, existingNames) => {
    // Check if name already exists
    if (!existingNames.has(baseName)) {
      return baseName;
    }
    
    // Extract base name and extension
    const lastDotIndex = baseName.lastIndexOf('.');
    const nameWithoutExt = lastDotIndex > 0 ? baseName.substring(0, lastDotIndex) : baseName;
    const extension = lastDotIndex > 0 ? baseName.substring(lastDotIndex) : '';
    
    // Try with incrementing numbers
    let counter = 1;
    let newName = `${nameWithoutExt} (${counter})${extension}`;
    
    while (existingNames.has(newName)) {
      counter++;
      newName = `${nameWithoutExt} (${counter})${extension}`;
    }
    
    return newName;
  };

  const handleImportFromSidebar = async () => {
    console.log("Import from sidebar clicked!");
    
    try {
      // Show option dialog for file or folder selection
      const choice = await showImportChoiceDialog();
      
      if (choice === 'folder') {
        // Use iOS-compatible folder import
        const folderStructure = await iosFileHandler.importFiles('folder');
        
        // Check if it has nested playlists and show dialog if needed
        const hasPlaylists = folderStructure.playlists?.length > 0 || 
          folderStructure.subfolders?.some(f => f.playlists?.length > 0);
        
        if (hasPlaylists) {
          setFolderImportDialog({
            isOpen: true,
            folderName: folderStructure.name || 'Selected Folder',
            hasNestedPlaylists: hasPlaylists,
            folderHandle: null,
            folderStructure: folderStructure
          });
        } else {
          // Direct import without dialog
          await handleDirectFolderImport(folderStructure);
        }
      } else if (choice === 'files') {
        // Use iOS-compatible file import
        const files = await iosFileHandler.importFiles('files');
        console.log('Files selected:', files);
        
        if (files && files.length > 0) {
          // Filter audio files with better checking
          const audioFiles = files.filter(file => {
            // Check MIME type first
            if (file.type && typeof file.type === 'string' && file.type.startsWith('audio/')) {
              return true;
            }
            // Check by extension as fallback
            const filename = file.name?.toLowerCase() || '';
            const audioExtensions = ['.mp3', '.m4a', '.aac', '.wav', '.aiff', '.flac', '.ogg', '.opus', '.webm'];
            return audioExtensions.some(ext => filename.endsWith(ext));
          });
          
          if (audioFiles.length > 0) {
            // Check for duplicates in all files
            const existingFileNames = new Set(allFiles.map(f => f.name));
            const duplicates = [];
            const newFiles = [];
            
            for (const file of audioFiles) {
              if (existingFileNames.has(file.name)) {
                // Generate suggested name with auto-increment
                const suggestedName = generateUniqueFileName(file.name, existingFileNames);
                duplicates.push({ file, suggestedName });
              } else {
                newFiles.push(file);
              }
            }
            
            // If duplicates found, show modal
            if (duplicates.length > 0) {
              setFileDuplicateModal({
                isOpen: true,
                duplicates: duplicates,
                importType: 'allfiles',
                onChoice: async (action, renamedFiles) => {
                  setFileDuplicateModal({ isOpen: false, duplicates: [], onChoice: null });
                  
                  if (action === 'cancel') {
                    return;
                  }
                  
                  let filesToImport = [...newFiles]; // Always import new files
                  
                  if (action === 'continue') {
                    // Import duplicates with auto-generated names
                    for (const dup of duplicates) {
                      const newFile = new File([dup.file], dup.suggestedName, { type: dup.file.type });
                      filesToImport.push(newFile);
                    }
                  } else if (action === 'rename') {
                    // Import duplicates with user-specified names
                    for (const dup of duplicates) {
                      const newName = renamedFiles[dup.file.name];
                      if (newName && newName !== dup.file.name) {
                        const newFile = new File([dup.file], newName, { type: dup.file.type });
                        filesToImport.push(newFile);
                      }
                    }
                  } else if (action === 'skip') {
                    // Only import new files, skip duplicates
                    // filesToImport already contains only new files
                  }
                  
                  // Import the files
                  await importAudioFiles(filesToImport);
                }
              });
            } else {
              // No duplicates, import directly
              await importAudioFiles(audioFiles);
            }
          } else {
            alert('No audio files selected. Please select audio files (MP3, M4A, WAV, etc.)');
          }
        } else {
          console.log('No files were selected');
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError' && error.message !== 'Selection cancelled') {
        console.error('Error opening files:', error);
        alert('Error importing files: ' + error.message);
      }
    }
  };

  const importAudioFiles = async (audioFiles) => {
    console.log(`Importing ${audioFiles.length} audio files...`);
    let successCount = 0;
    
    // Add duration to each file and save as uncategorized
    for (const file of audioFiles) {
      try {
        const duration = await capacitorFileManager.getAudioDuration(file);
        const fileId = Date.now() + Math.random();
        
        // Store file object in memory for playback
        fileObjectsRef.current.set(String(fileId), file);
        fileObjectsRef.current.set(file.name, file); // Also store by name as backup
        
        // Save each file directly as uncategorized (no playlist)
        const saved = await capacitorFileManager.saveUncategorizedFile({
          id: fileId,
          name: file.name,
          file: file,
          duration: duration,
          size: file.size,
          type: file.type || 'audio/mpeg',
          location: 'uncategorized'
        });
        if (saved) successCount++;
      } catch (err) {
        console.error(`Failed to import ${file.name}:`, err);
      }
    }
    
    await updatePlaylistsDisplay();
    console.log(`Successfully imported ${successCount} of ${audioFiles.length} files`);
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
      
      <EditPlaylistModal
        isOpen={editPlaylistModal.isOpen}
        onClose={() => setEditPlaylistModal({ isOpen: false, playlist: null })}
        onSave={handleEditPlaylistSave}
        playlist={editPlaylistModal.playlist}
        allAvailableFiles={allFiles}
      />
      
      <DuplicateHandlingModal
        isOpen={duplicateModal.isOpen}
        onClose={() => setDuplicateModal({ ...duplicateModal, isOpen: false })}
        onChoice={(choice) => {
          if (duplicateModal.callback) {
            duplicateModal.callback(choice);
          }
          setDuplicateModal({ ...duplicateModal, isOpen: false });
        }}
        duplicateCount={duplicateModal.count}
        playlistName={duplicateModal.playlistName}
      />
      
      <PlaylistDuplicateModal
        isOpen={playlistDuplicateModal.isOpen}
        onClose={playlistDuplicateModal.onClose || (() => setPlaylistDuplicateModal({ isOpen: false }))}
        existingName={playlistDuplicateModal.existingName}
        onChoice={playlistDuplicateModal.onChoice || (() => {})}
      />
      
      <PlaylistPicker
        isOpen={playlistPicker.isOpen}
        onClose={() => setPlaylistPicker({ isOpen: false, callback: null })}
        onSelect={(playlist) => {
          if (playlistPicker.callback) {
            playlistPicker.callback(playlist);
          }
          setPlaylistPicker({ isOpen: false, callback: null });
        }}
        playlists={playlists}
      />
      
      <DeckSelectionDialog
        isOpen={deckSelectionDialog.isOpen}
        onClose={() => setDeckSelectionDialog({ isOpen: false, files: [], callback: null })}
        onSelectDeck={handleDeckSelectionFromDialog}
        currentDeckA={deckATracks.length > 0}
        currentDeckB={deckBTracks.length > 0}
        importType="files"
      />
      
      <MoveDialog
        isOpen={moveDialog.isOpen}
        onClose={() => setMoveDialog({ isOpen: false, item: null, currentLocation: null })}
        onMove={handleMoveConfirm}
        item={moveDialog.item}
        folders={folders}
        currentLocation={moveDialog.currentLocation}
      />
      
      <FileDuplicateModal
        isOpen={fileDuplicateModal.isOpen}
        onClose={() => setFileDuplicateModal({ isOpen: false, duplicates: [], onChoice: null })}
        duplicates={fileDuplicateModal.duplicates}
        onChoice={fileDuplicateModal.onChoice}
        importType={fileDuplicateModal.importType}
      />
      
      <EnhancedSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        playlists={playlists}
        folders={folders}
        allFiles={allFiles}
        onSelectPlaylist={handleSelectPlaylistFromSidebar}
        onRefresh={updatePlaylistsDisplay}
        onImportClick={handleImportFromSidebar}
        onCreateFolder={handleCreateFolder}
        onCreatePlaylist={handleCreatePlaylist}
        onAddToPlaylist={handleAddToPlaylist}
        onRemoveFromPlaylist={handleRemoveFromPlaylist}
        onMoveItem={handleMoveItem}
        onLoadToDeck={handleLoadToDeck}
        onDeleteItem={handleDeleteItem}
      />
      
      <div className={isCompactMode ? 'compact-mode' : ''}>
        <div className="cuewave-app">
    
        <button onClick={() => setIsCompactMode(!isCompactMode)} className='MixerArrow'>
          <img 
            src='/assets/open-mixer-arrow.svg' 
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
            <img src={isPlayingA ? "/assets/stop.svg" : "/assets/play.svg"} alt="" />
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
            <img src={isPlayingB ? "/assets/stop.svg" : "/assets/play.svg"} alt="" />
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
              max="100"
              step="1"
              value={deckAVolume}
              onChange={(e) => setDeckAVolume(parseInt(e.target.value))}
              className="vertical-fader"
              orient="vertical"
            />
            <div className="volume-percentage">{getVolumePercentage(deckAVolume)}%</div>
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
              max="100"
              step="1"
              value={deckBVolume}
              onChange={(e) => setDeckBVolume(parseInt(e.target.value))}
              className="vertical-fader"
              orient="vertical"
            />
            <div className="volume-percentage">{getVolumePercentage(deckBVolume)}%</div>
          </div>
          <button 
            className={`mute-button ${muteB ? 'active' : ''}`}
            onClick={() => setMuteB(!muteB)}
          >
            M
          </button>
        </div>

        <div className="mixer-fader">
          <label className="fader-label">M</label>
          <div className="fader-container">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseInt(e.target.value))}
              className="vertical-fader"
              orient="vertical"
            />
            <div className="volume-percentage">{getVolumePercentage(masterVolume)}%</div>
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
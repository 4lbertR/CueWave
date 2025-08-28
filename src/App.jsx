import { useState, useEffect } from 'react'
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
  
  // Mixer volume states
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [deckAVolume, setDeckAVolume] = useState(0.7);
  const [deckBVolume, setDeckBVolume] = useState(0.5);
  const [muteA, setMuteA] = useState(false);
  const [muteB, setMuteB] = useState(true);
  const [muteMaster, setMuteMaster] = useState(false);

  const [deckATracks, setDeckATracks] = useState([]);
  const [deckBTracks, setDeckBTracks] = useState([]);

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
      
      // Save playlist to storage without deck prompt
      await capacitorFileManager.savePlaylist(playlist);
      await updatePlaylistsDisplay();
    } catch (error) {
      console.error('Error importing folder:', error);
      alert('Error importing folder: ' + error.message);
    }
  };

  const handleDirectFolderImport = async (folderStructure) => {
    try {
      const playlist = await playlistManager.importFolderFromStructure(folderStructure, 'all');
      await capacitorFileManager.savePlaylist(playlist);
      await updatePlaylistsDisplay();
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
        id: Date.now() + index,
        name: file.name,
        duration: file.duration || '0:00',
        path: file.path
      }));

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
      if (item.playlists) {
        item.playlists.forEach(playlist => collectFiles(playlist, item.name));
      }
      if (item.folders) {
        item.folders.forEach(folder => collectFiles(folder, item.name));
      }
    };
    
    library.playlists?.forEach(playlist => collectFiles(playlist));
    library.folders?.forEach(folder => collectFiles(folder));
    
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
    playlist.tracks = playlist.tracks.filter(t => t.id !== track.id);
    await capacitorFileManager.savePlaylist(playlist);
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
        // Save each file directly as uncategorized (no playlist)
        const saved = await capacitorFileManager.saveUncategorizedFile({
          id: Date.now() + Math.random(),
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
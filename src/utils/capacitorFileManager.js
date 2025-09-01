import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

class CapacitorFileManager {
  constructor() {
    this.cuewaveDir = 'cuewave';
    this.isCapacitor = this.checkCapacitor();
  }

  checkCapacitor() {
    return typeof window !== 'undefined' && window.Capacitor !== undefined;
  }

  async ensureCuewaveDirectory() {
    if (!this.isCapacitor) return false;
    
    try {
      // First check if directory exists
      try {
        await Filesystem.stat({
          path: this.cuewaveDir,
          directory: Directory.Documents
        });
        // Directory exists
        return true;
      } catch (statError) {
        // Directory doesn't exist, create it
        await Filesystem.mkdir({
          path: this.cuewaveDir,
          directory: Directory.Documents,
          recursive: true
        });
        return true;
      }
    } catch (error) {
      // Directory might already exist, which is fine
      if (error.code === 'OS-PLUG-FILE-0010') {
        return true;
      }
      console.error('Error creating cuewave directory:', error);
      return false;
    }
  }

  async getAllPlaylists() {
    const structure = await this.readCuewaveFolder();
    const allPlaylists = [...(structure.playlists || [])];
    
    // Recursively get playlists from folders
    const getPlaylistsFromFolder = (folder) => {
      if (folder.playlists) {
        allPlaylists.push(...folder.playlists);
      }
      if (folder.folders) {
        folder.folders.forEach(getPlaylistsFromFolder);
      }
    };
    
    (structure.folders || []).forEach(getPlaylistsFromFolder);
    return allPlaylists;
  }

  async readCuewaveFolder() {
    if (!this.isCapacitor) {
      // Fallback to localStorage for web
      return this.readFromLocalStorage();
    }

    try {
      await this.ensureCuewaveDirectory();
      
      const result = await Filesystem.readdir({
        path: this.cuewaveDir,
        directory: Directory.Documents
      });

      const structure = {
        folders: [],
        playlists: []
      };

      for (const file of result.files) {
        const fileName = file.name || file;
        
        // Skip the uncategorized folder - it's handled separately
        if (fileName === 'uncategorized') {
          continue;
        }
        
        if (fileName.startsWith('playlist-')) {
          // It's a playlist
          const playlistData = await this.readPlaylist(fileName);
          if (playlistData) {
            structure.playlists.push(playlistData);
          }
        } else {
          // It's a folder
          const folderData = await this.readFolder(fileName);
          if (folderData) {
            structure.folders.push(folderData);
          }
        }
      }

      return structure;
    } catch (error) {
      console.error('Error reading cuewave folder:', error);
      return { folders: [], playlists: [] };
    }
  }

  async readPlaylist(playlistName) {
    try {
      const path = `${this.cuewaveDir}/${playlistName}/metadata.json`;
      
      const result = await Filesystem.readFile({
        path: path,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });

      const metadata = JSON.parse(result.data);
      
      // Extract just the playlist directory name, without the folder path
      const playlistDirName = playlistName.split('/').pop();
      
      return {
        id: metadata.id || Date.now(),
        name: playlistDirName,
        displayName: playlistDirName.replace('playlist-', ''),
        tracks: metadata.tracks || [],
        created: metadata.created,
        modified: metadata.modified
      };
    } catch (error) {
      console.error(`Error reading playlist ${playlistName}:`, error);
      return null;
    }
  }

  async readFolder(folderName) {
    try {
      const path = `${this.cuewaveDir}/${folderName}`;
      
      const result = await Filesystem.readdir({
        path: path,
        directory: Directory.Documents
      });

      const folder = {
        id: folderName,
        name: folderName,
        folders: [],
        playlists: []
      };

      for (const file of result.files) {
        const fileName = file.name || file;
        
        if (fileName.startsWith('playlist-')) {
          const playlistData = await this.readPlaylist(`${folderName}/${fileName}`);
          if (playlistData) {
            folder.playlists.push(playlistData);
          }
        } else if (fileName !== 'metadata.json') {
          // Nested folder
          const nestedFolder = await this.readFolder(`${folderName}/${fileName}`);
          if (nestedFolder) {
            folder.folders.push(nestedFolder);
          }
        }
      }

      return folder;
    } catch (error) {
      console.error(`Error reading folder ${folderName}:`, error);
      return null;
    }
  }

  async savePlaylist(playlist, targetDeck = null) {
    // Check if the name already starts with "playlist-"
    let playlistName = playlist.name;
    if (!playlistName.startsWith('playlist-')) {
      playlistName = `playlist-${playlist.name.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
    }
    const path = `${this.cuewaveDir}/${playlistName}`;
    
    if (!this.isCapacitor) {
      return this.saveToLocalStorage(playlist, targetDeck);
    }

    try {
      await this.ensureCuewaveDirectory();
      
      // Check if directory exists and delete it if it does
      try {
        await Filesystem.stat({
          path: path,
          directory: Directory.Documents
        });
        // Directory exists, remove it first
        await Filesystem.rmdir({
          path: path,
          directory: Directory.Documents,
          recursive: true
        });
      } catch (statError) {
        // Directory doesn't exist, which is fine
      }
      
      // Create playlist directory
      await Filesystem.mkdir({
        path: path,
        directory: Directory.Documents,
        recursive: true
      });

      // Save metadata
      const metadata = {
        id: playlist.id || Date.now(),
        name: playlist.name,
        tracks: playlist.tracks.map(track => ({
          id: track.id,
          name: track.name,
          duration: track.duration,
          path: track.path,
          size: track.size
        })),
        created: playlist.created || Date.now(),
        modified: Date.now(),
        targetDeck: targetDeck
      };

      await Filesystem.writeFile({
        path: `${path}/metadata.json`,
        data: JSON.stringify(metadata, null, 2),
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });

      // Save audio files
      for (const track of playlist.tracks) {
        if (track.file && track.file instanceof File) {
          await this.saveAudioFile(track.file, path);
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving playlist:', error);
      return false;
    }
  }

  async saveAudioFile(file, playlistPath) {
    try {
      const reader = new FileReader();
      const base64Data = await new Promise((resolve, reject) => {
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await Filesystem.writeFile({
        path: `${playlistPath}/${file.name}`,
        data: base64Data,
        directory: Directory.Documents
      });

      return true;
    } catch (error) {
      console.error(`Error saving audio file ${file.name}:`, error);
      return false;
    }
  }

  async loadAudioFile(path) {
    try {
      const result = await Filesystem.readFile({
        path: `${this.cuewaveDir}/${path}`,
        directory: Directory.Documents
      });

      // Convert base64 to blob
      const byteCharacters = atob(result.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/mpeg' });
      
      return blob;
    } catch (error) {
      console.error(`Error loading audio file ${path}:`, error);
      return null;
    }
  }

  async createFolder(folderName) {
    const path = `${this.cuewaveDir}/${folderName}`;
    
    try {
      await Filesystem.mkdir({
        path: path,
        directory: Directory.Documents,
        recursive: true
      });
      
      return true;
    } catch (error) {
      console.error('Error creating folder:', error);
      return false;
    }
  }

  async deletePlaylist(playlistName) {
    const path = `${this.cuewaveDir}/${playlistName}`;
    
    try {
      await Filesystem.rmdir({
        path: path,
        directory: Directory.Documents,
        recursive: true
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting playlist:', error);
      return false;
    }
  }

  async deleteFolder(folderName) {
    const path = `${this.cuewaveDir}/${folderName}`;
    
    try {
      await Filesystem.rmdir({
        path: path,
        directory: Directory.Documents,
        recursive: true
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting folder:', error);
      return false;
    }
  }

  async renamePlaylist(oldName, newName, currentLocation = null) {
    if (!this.isCapacitor) {
      // For localStorage version
      const library = this.readFromLocalStorage();
      
      // Find and rename in root playlists
      const playlist = library.playlists?.find(p => p.name === oldName);
      if (playlist) {
        playlist.name = newName;
        playlist.displayName = newName.replace('playlist-', '');
        localStorage.setItem('cuewaveLibrary', JSON.stringify(library));
        return true;
      }
      
      // Find in folders
      const findAndRename = (folders) => {
        for (const folder of folders || []) {
          const playlistIndex = (folder.playlists || []).findIndex(p => p.name === oldName);
          if (playlistIndex >= 0) {
            folder.playlists[playlistIndex].name = newName;
            folder.playlists[playlistIndex].displayName = newName.replace('playlist-', '');
            localStorage.setItem('cuewaveLibrary', JSON.stringify(library));
            return true;
          }
          if (folder.folders && findAndRename(folder.folders)) {
            return true;
          }
        }
        return false;
      };
      
      return findAndRename(library.folders);
    }
    
    try {
      // Ensure names have proper prefix
      let oldPlaylistName = oldName;
      if (!oldPlaylistName.startsWith('playlist-')) {
        oldPlaylistName = `playlist-${oldName}`;
      }
      
      let newPlaylistName = newName;
      if (!newPlaylistName.startsWith('playlist-')) {
        newPlaylistName = `playlist-${newName.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
      }
      
      // Handle folder paths
      let oldPath, newPath;
      if (currentLocation && currentLocation !== 'root') {
        oldPath = `${this.cuewaveDir}/${currentLocation}/${oldPlaylistName}`;
        newPath = `${this.cuewaveDir}/${currentLocation}/${newPlaylistName}`;
      } else {
        oldPath = `${this.cuewaveDir}/${oldPlaylistName}`;
        newPath = `${this.cuewaveDir}/${newPlaylistName}`;
      }
      
      // Read the existing metadata
      const metadataResult = await Filesystem.readFile({
        path: `${oldPath}/metadata.json`,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });
      
      const metadata = JSON.parse(metadataResult.data);
      metadata.name = newName;
      metadata.modified = Date.now();
      
      // Create new directory with new name
      await Filesystem.mkdir({
        path: newPath,
        directory: Directory.Documents,
        recursive: true
      });
      
      // Write updated metadata to new location
      await Filesystem.writeFile({
        path: `${newPath}/metadata.json`,
        data: JSON.stringify(metadata, null, 2),
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });
      
      // Copy any audio files if they exist
      try {
        const oldDirContents = await Filesystem.readdir({
          path: oldPath,
          directory: Directory.Documents
        });
        
        for (const file of oldDirContents.files) {
          const fileName = file.name || file;
          if (fileName !== 'metadata.json') {
            await Filesystem.copy({
              from: `${oldPath}/${fileName}`,
              to: `${newPath}/${fileName}`,
              directory: Directory.Documents
            });
          }
        }
      } catch (copyError) {
        console.log('No audio files to copy or error copying:', copyError);
      }
      
      // Delete old directory
      await Filesystem.rmdir({
        path: oldPath,
        directory: Directory.Documents,
        recursive: true
      });
      
      return true;
    } catch (error) {
      console.error('Error renaming playlist:', error);
      return false;
    }
  }

  async movePlaylist(playlistName, targetLocation) {
    console.log('movePlaylist called with:', { playlistName, targetLocation, isCapacitor: this.isCapacitor });
    
    if (!this.isCapacitor) {
      // For web, just update metadata
      console.log('Using localStorage move');
      return this.movePlaylistInLocalStorage(playlistName, targetLocation);
    }

    try {
      const oldPath = `${this.cuewaveDir}/${playlistName}`;
      let newPath;
      
      if (targetLocation === 'root') {
        newPath = `${this.cuewaveDir}/${playlistName}`;
      } else {
        // Move to a folder
        newPath = `${this.cuewaveDir}/${targetLocation}/${playlistName}`;
        
        // Ensure target folder exists (ignore error if it already exists)
        try {
          await Filesystem.mkdir({
            path: `${this.cuewaveDir}/${targetLocation}`,
            directory: Directory.Documents,
            recursive: true
          });
        } catch (mkdirError) {
          // Folder might already exist, which is fine
          console.log('Target folder already exists or mkdir failed:', mkdirError.message);
        }
      }
      
      console.log('Moving from:', oldPath, 'to:', newPath);
      
      if (oldPath !== newPath) {
        // Check if destination already exists and delete it first
        try {
          await Filesystem.stat({
            path: newPath,
            directory: Directory.Documents
          });
          console.log('Destination already exists, removing it first');
          await Filesystem.rmdir({
            path: newPath,
            directory: Directory.Documents,
            recursive: true
          });
        } catch (statError) {
          // Destination doesn't exist, which is what we want
          console.log('Destination does not exist, proceeding with move');
        }
        
        // Copy to new location
        await Filesystem.copy({
          from: oldPath,
          to: newPath,
          directory: Directory.Documents
        });
        
        // Delete from old location
        await Filesystem.rmdir({
          path: oldPath,
          directory: Directory.Documents,
          recursive: true
        });
      } else {
        console.log('Source and destination are the same, no move needed');
      }
      
      return true;
    } catch (error) {
      console.error('Error moving playlist in Capacitor:', error);
      return false;
    }
  }

  movePlaylistInLocalStorage(playlistName, targetLocation) {
    try {
      console.log('movePlaylistInLocalStorage:', { playlistName, targetLocation });
      const library = this.readFromLocalStorage();
      
      // Ensure library structure
      if (!library.playlists) library.playlists = [];
      if (!library.folders) library.folders = [];
      
      console.log('Current library structure:', library);
      
      // Find the playlist to move
      let playlistToMove = null;
      let currentFolderId = null;
      
      // Check root level playlists
      const rootIndex = library.playlists.findIndex(p => p.name === playlistName);
      if (rootIndex >= 0) {
        playlistToMove = library.playlists[rootIndex];
        library.playlists.splice(rootIndex, 1);
        currentFolderId = 'root';
      }
      
      // Check in folders
      if (!playlistToMove) {
        const findInFolders = (folders, parentId = null) => {
          for (const folder of folders) {
            const playlistIndex = (folder.playlists || []).findIndex(p => p.name === playlistName);
            if (playlistIndex >= 0) {
              playlistToMove = folder.playlists[playlistIndex];
              folder.playlists.splice(playlistIndex, 1);
              currentFolderId = folder.id;
              return true;
            }
            if (folder.folders && findInFolders(folder.folders, folder.id)) {
              return true;
            }
          }
          return false;
        };
        findInFolders(library.folders || []);
      }
      
      if (!playlistToMove) {
        console.error('Playlist not found:', playlistName);
        return false;
      }
      
      console.log('Found playlist to move:', playlistToMove);
      console.log('Moving from:', currentFolderId, 'to:', targetLocation);
      
      // Add to new location
      if (targetLocation === 'root') {
        library.playlists.push(playlistToMove);
        console.log('Added to root level');
      } else {
        // Find target folder and add playlist
        const findFolder = (folders) => {
          for (const folder of folders) {
            if (folder.id === targetLocation || folder.name === targetLocation) {
              if (!folder.playlists) folder.playlists = [];
              folder.playlists.push(playlistToMove);
              console.log('Added playlist to existing folder:', folder.name);
              return true;
            }
            if (folder.folders && findFolder(folder.folders)) {
              return true;
            }
          }
          return false;
        };
        
        const foundFolder = findFolder(library.folders || []);
        console.log('Found target folder:', foundFolder);
        
        if (!foundFolder) {
          // If folder not found, create it
          console.log('Target folder not found, creating new folder:', targetLocation);
          if (!library.folders) library.folders = [];
          library.folders.push({
            id: targetLocation,
            name: targetLocation,
            playlists: [playlistToMove],
            folders: []
          });
        }
      }
      
      localStorage.setItem('cuewave_library', JSON.stringify(library));
      console.log('Updated library saved to localStorage');
      console.log('New library structure:', library);
      return true;
    } catch (error) {
      console.error('Error moving playlist in localStorage:', error);
      return false;
    }
  }

  async saveUncategorizedFile(fileData) {
    const path = `${this.cuewaveDir}/uncategorized`;
    
    if (!this.isCapacitor) {
      return this.saveUncategorizedToLocalStorage(fileData);
    }

    try {
      await this.ensureCuewaveDirectory();
      
      // Create uncategorized directory if it doesn't exist
      try {
        await Filesystem.mkdir({
          path: path,
          directory: Directory.Documents,
          recursive: true
        });
      } catch (mkdirError) {
        // Directory already exists, which is fine
        if (mkdirError.code !== 'OS-PLUG-FILE-0010') {
          console.error('Error creating uncategorized directory:', mkdirError);
          throw mkdirError;
        }
      }

      // Save file metadata
      const metadataPath = `${path}/metadata.json`;
      let existingFiles = [];
      
      try {
        const existing = await Filesystem.readFile({
          path: metadataPath,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        existingFiles = JSON.parse(existing.data).files || [];
      } catch (e) {
        // File doesn't exist yet
      }

      // Add new file to list
      existingFiles.push({
        id: fileData.id,
        name: fileData.name,
        duration: fileData.duration,
        size: fileData.size,
        type: fileData.type,
        location: 'uncategorized'
      });

      // Save updated metadata
      await Filesystem.writeFile({
        path: metadataPath,
        data: JSON.stringify({ files: existingFiles }, null, 2),
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });

      // Save the actual audio file if provided
      if (fileData.file && fileData.file instanceof File) {
        await this.saveAudioFile(fileData.file, path);
      }

      return true;
    } catch (error) {
      console.error('Error saving uncategorized file:', error);
      return false;
    }
  }

  async getUncategorizedFiles() {
    const path = `${this.cuewaveDir}/uncategorized/metadata.json`;
    
    if (!this.isCapacitor) {
      // Fallback to localStorage
      const stored = localStorage.getItem('cuewave_uncategorized') || '[]';
      return JSON.parse(stored);
    }
    
    try {
      const result = await Filesystem.readFile({
        path: path,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });
      
      const data = JSON.parse(result.data);
      return data.files || [];
    } catch (error) {
      // No uncategorized files yet
      return [];
    }
  }
  
  async deleteUncategorizedFile(fileId) {
    const path = `${this.cuewaveDir}/uncategorized/metadata.json`;
    
    if (!this.isCapacitor) {
      // Delete from localStorage
      try {
        const stored = localStorage.getItem('cuewave_uncategorized') || '[]';
        const uncategorized = JSON.parse(stored);
        const filtered = uncategorized.filter(f => f.id !== fileId);
        localStorage.setItem('cuewave_uncategorized', JSON.stringify(filtered));
        return true;
      } catch (error) {
        console.error('Error deleting from localStorage:', error);
        return false;
      }
    }
    
    try {
      // Read existing metadata
      const result = await Filesystem.readFile({
        path: path,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });
      
      const data = JSON.parse(result.data);
      const files = data.files || [];
      
      // Filter out the deleted file
      const updatedFiles = files.filter(f => f.id !== fileId);
      
      // Save updated metadata
      await Filesystem.writeFile({
        path: path,
        data: JSON.stringify({ files: updatedFiles }, null, 2),
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting uncategorized file:', error);
      return false;
    }
  }

  // LocalStorage fallback for uncategorized
  async saveUncategorizedToLocalStorage(fileData) {
    try {
      // Store metadata in localStorage
      const stored = localStorage.getItem('cuewave_uncategorized') || '[]';
      const uncategorized = JSON.parse(stored);
      
      // Create metadata without file object for localStorage
      const metadata = {
        id: fileData.id,
        name: fileData.name,
        duration: fileData.duration,
        size: fileData.size,
        type: fileData.type,
        location: fileData.location
      };
      uncategorized.push(metadata);
      localStorage.setItem('cuewave_uncategorized', JSON.stringify(uncategorized));
      
      // Store actual file in IndexedDB if we have it
      if (fileData.file && typeof indexedDB !== 'undefined') {
        try {
          const db = await this.openIndexedDB();
          const transaction = db.transaction(['files'], 'readwrite');
          const store = transaction.objectStore('files');
          
          // Convert file to base64 for storage
          const reader = new FileReader();
          reader.onloadend = () => {
            const fileRecord = {
              name: fileData.name,
              data: reader.result,
              type: fileData.type,
              size: fileData.size
            };
            store.put(fileRecord);
          };
          reader.readAsDataURL(fileData.file);
        } catch (dbError) {
          console.error('Error storing file in IndexedDB:', dbError);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error saving uncategorized to localStorage:', error);
      return false;
    }
  }

  // Fallback methods for web
  readFromLocalStorage() {
    try {
      const data = localStorage.getItem('cuewave_library');
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    return { folders: [], playlists: [] };
  }

  saveToLocalStorage(playlist, targetDeck) {
    try {
      const library = this.readFromLocalStorage();
      
      const existingIndex = library.playlists.findIndex(p => p.id === playlist.id);
      if (existingIndex >= 0) {
        library.playlists[existingIndex] = { ...playlist, targetDeck };
      } else {
        library.playlists.push({ ...playlist, targetDeck });
      }
      
      localStorage.setItem('cuewave_library', JSON.stringify(library));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  async getAudioDuration(file) {
    return new Promise((resolve) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      
      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration;
        URL.revokeObjectURL(objectUrl);
        
        // Format duration as MM:SS
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        resolve(formatted);
      });
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl);
        resolve('0:00');
      });
      
      audio.src = objectUrl;
    });
  }

  async getFileData(track) {
    try {
      // First check if track has a file object
      if (track.file && track.file instanceof File) {
        return track.file;
      }

      // Try to load from IndexedDB if available
      if (typeof indexedDB !== 'undefined') {
        const db = await this.openIndexedDB();
        const transaction = db.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        const request = store.get(track.name || track.id);
        
        return new Promise((resolve, reject) => {
          request.onsuccess = () => {
            const fileData = request.result;
            if (fileData && fileData.data) {
              // Convert base64 back to blob if needed
              if (typeof fileData.data === 'string') {
                const byteCharacters = atob(fileData.data.split(',')[1]);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: fileData.type || 'audio/mpeg' });
                resolve(blob);
              } else {
                resolve(fileData.data);
              }
            } else {
              resolve(null);
            }
          };
          request.onerror = () => {
            console.error('Error loading from IndexedDB');
            resolve(null);
          };
        });
      }

      // Try to load from Capacitor filesystem if available
      if (this.isCapacitor) {
        // Try different paths where the file might be stored
        const paths = [
          `${this.cuewaveDir}/uncategorized/${track.id}.audio`,
          `${this.cuewaveDir}/files/${track.name}`,
          `${this.cuewaveDir}/${track.location}/${track.name}`
        ];

        for (const path of paths) {
          try {
            const result = await Filesystem.readFile({
              path: path,
              directory: Directory.Documents
            });
            
            // Convert base64 to blob
            const byteCharacters = atob(result.data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            return new Blob([byteArray], { type: track.type || 'audio/mpeg' });
          } catch (err) {
            // Try next path
            continue;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting file data:', error);
      return null;
    }
  }

  async openIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CuewaveFiles', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'name' });
        }
      };
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export default new CapacitorFileManager();
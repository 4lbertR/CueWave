import { 
  scanFolderStructure, 
  collectAllAudioFiles, 
  getAudioFilesExcludingPlaylists,
  hasNestedPlaylists,
  generatePlaylistFromFiles 
} from './fileUtils';

class PlaylistManager {
  constructor() {
    this.playlists = [];
    this.folders = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('cuewave_playlists');
      if (stored) {
        const data = JSON.parse(stored);
        this.playlists = data.playlists || [];
        this.folders = data.folders || [];
      }
    } catch (error) {
      console.error('Error loading playlists from storage:', error);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('cuewave_playlists', JSON.stringify({
        playlists: this.playlists,
        folders: this.folders
      }));
    } catch (error) {
      console.error('Error saving playlists to storage:', error);
    }
  }

  async importFolder(folderHandle, importMode = 'all') {
    try {
      const folderStructure = await scanFolderStructure(folderHandle);
      
      let audioFiles;
      if (importMode === 'all') {
        audioFiles = collectAllAudioFiles(folderStructure, true);
      } else {
        audioFiles = getAudioFilesExcludingPlaylists(folderStructure);
      }

      if (audioFiles.length === 0) {
        throw new Error('No audio files found in the selected folder');
      }

      const playlist = generatePlaylistFromFiles(audioFiles, folderHandle.name);
      
      this.addPlaylist(playlist);
      
      return playlist;
    } catch (error) {
      console.error('Error importing folder:', error);
      throw error;
    }
  }

  async importFolderWithDialog(folderHandle) {
    const folderStructure = await scanFolderStructure(folderHandle);
    const hasPlaylists = hasNestedPlaylists(folderStructure);
    
    return {
      folderName: folderHandle.name,
      hasNestedPlaylists: hasPlaylists,
      folderHandle: folderHandle,
      folderStructure: folderStructure
    };
  }

  async importFolderFromStructure(folderStructure, importMode = 'all') {
    try {
      let audioFiles = [];
      
      // Collect audio files based on import mode
      const collectFiles = (structure) => {
        // Add direct audio files
        if (structure.audioFiles) {
          audioFiles = audioFiles.concat(structure.audioFiles);
        }
        
        // Process playlists if including all files
        if (importMode === 'all' && structure.playlists) {
          structure.playlists.forEach(playlist => {
            if (playlist.tracks) {
              playlist.tracks.forEach(track => {
                if (track.file) {
                  audioFiles.push({
                    name: track.name || track.file.name,
                    file: track.file,
                    size: track.file.size,
                    type: track.file.type,
                    lastModified: track.file.lastModified
                  });
                }
              });
            }
          });
        }
        
        // Process subfolders
        if (structure.subfolders) {
          structure.subfolders.forEach(subfolder => collectFiles(subfolder));
        }
      };
      
      collectFiles(folderStructure);
      
      // Remove duplicates based on file name
      const uniqueFiles = new Map();
      audioFiles.forEach(file => {
        if (!uniqueFiles.has(file.name)) {
          uniqueFiles.set(file.name, file);
        }
      });
      
      audioFiles = Array.from(uniqueFiles.values());
      
      if (audioFiles.length === 0) {
        throw new Error('No audio files found in the selected folder');
      }
      
      const playlist = generatePlaylistFromFiles(
        audioFiles, 
        folderStructure.name || 'Imported Folder'
      );
      
      this.addPlaylist(playlist);
      
      return playlist;
    } catch (error) {
      console.error('Error importing folder from structure:', error);
      throw error;
    }
  }

  addPlaylist(playlist) {
    playlist.id = Date.now();
    this.playlists.push(playlist);
    this.saveToStorage();
    return playlist;
  }

  updatePlaylist(playlistId, updates) {
    const index = this.playlists.findIndex(p => p.id === playlistId);
    if (index !== -1) {
      this.playlists[index] = { ...this.playlists[index], ...updates };
      this.saveToStorage();
      return this.playlists[index];
    }
    return null;
  }

  deletePlaylist(playlistId) {
    const index = this.playlists.findIndex(p => p.id === playlistId);
    if (index !== -1) {
      this.playlists.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  getPlaylist(playlistId) {
    return this.playlists.find(p => p.id === playlistId);
  }

  getAllPlaylists() {
    return [...this.playlists];
  }

  createFolder(folderName) {
    const folder = {
      id: Date.now(),
      name: folderName,
      playlists: []
    };
    this.folders.push(folder);
    this.saveToStorage();
    return folder;
  }

  movePlaylistToFolder(playlistId, folderId) {
    const folder = this.folders.find(f => f.id === folderId);
    if (folder) {
      if (!folder.playlists.includes(playlistId)) {
        folder.playlists.push(playlistId);
        this.saveToStorage();
        return true;
      }
    }
    return false;
  }

  removePlaylistFromFolder(playlistId, folderId) {
    const folder = this.folders.find(f => f.id === folderId);
    if (folder) {
      const index = folder.playlists.indexOf(playlistId);
      if (index !== -1) {
        folder.playlists.splice(index, 1);
        this.saveToStorage();
        return true;
      }
    }
    return false;
  }

  async importAudioFiles(files) {
    const tracks = [];
    
    for (const file of files) {
      if (file.type.startsWith('audio/')) {
        tracks.push({
          id: Date.now() + tracks.length,
          name: file.name,
          path: file.name,
          duration: '0:00',
          file: file
        });
      }
    }
    
    if (tracks.length === 0) {
      throw new Error('No valid audio files selected');
    }
    
    const playlist = {
      name: 'Imported Files',
      created: Date.now(),
      tracks: tracks
    };
    
    return this.addPlaylist(playlist);
  }
}

export default new PlaylistManager();
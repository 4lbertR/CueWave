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
      await Filesystem.mkdir({
        path: this.cuewaveDir,
        directory: Directory.Documents,
        recursive: true
      });
      return true;
    } catch (error) {
      // Directory might already exist
      return true;
    }
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
      
      return {
        id: metadata.id || Date.now(),
        name: playlistName,
        displayName: playlistName.replace('playlist-', ''),
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
    const playlistName = `playlist-${playlist.name.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
    const path = `${this.cuewaveDir}/${playlistName}`;
    
    if (!this.isCapacitor) {
      return this.saveToLocalStorage(playlist, targetDeck);
    }

    try {
      await this.ensureCuewaveDirectory();
      
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
}

export default new CapacitorFileManager();
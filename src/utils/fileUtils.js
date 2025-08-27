const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.aac', '.wav', '.aiff', '.flac'];
const PLAYLIST_EXTENSION = '.cuewave';

export const isAudioFile = (filename) => {
  const ext = filename.toLowerCase();
  return AUDIO_EXTENSIONS.some(audioExt => ext.endsWith(audioExt));
};

export const isPlaylistFile = (filename) => {
  return filename.toLowerCase().endsWith(PLAYLIST_EXTENSION);
};

export const getFileExtension = (filename) => {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.substring(lastDot).toLowerCase();
};

export const getFileName = (filepath) => {
  const parts = filepath.split('/');
  return parts[parts.length - 1];
};

export const scanFolderStructure = async (folderHandle) => {
  const structure = {
    name: folderHandle.name,
    audioFiles: [],
    playlists: [],
    subfolders: []
  };

  try {
    for await (const entry of folderHandle.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        
        if (isAudioFile(file.name)) {
          structure.audioFiles.push({
            name: file.name,
            handle: entry,
            file: file,
            size: file.size,
            lastModified: file.lastModified
          });
        } else if (isPlaylistFile(file.name)) {
          const playlistData = await readPlaylistFile(file);
          structure.playlists.push({
            name: file.name.replace(PLAYLIST_EXTENSION, ''),
            handle: entry,
            file: file,
            tracks: playlistData.tracks || []
          });
        }
      } else if (entry.kind === 'directory') {
        const subfolder = await scanFolderStructure(entry);
        structure.subfolders.push(subfolder);
      }
    }
  } catch (error) {
    console.error('Error scanning folder:', error);
  }

  return structure;
};

export const readPlaylistFile = async (file) => {
  try {
    const text = await file.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Error reading playlist file:', error);
    return { tracks: [] };
  }
};

export const collectAllAudioFiles = (folderStructure, includePlaylistContents = true) => {
  const files = new Map();
  
  const addFile = (file) => {
    if (!files.has(file.name)) {
      files.set(file.name, file);
    }
  };
  
  const traverse = (structure) => {
    structure.audioFiles.forEach(file => addFile(file));
    
    if (includePlaylistContents) {
      structure.playlists.forEach(playlist => {
        playlist.tracks.forEach(track => {
          if (track.file) {
            addFile(track.file);
          }
        });
      });
    }
    
    structure.subfolders.forEach(subfolder => traverse(subfolder));
  };
  
  traverse(folderStructure);
  return Array.from(files.values());
};

export const getAudioFilesExcludingPlaylists = (folderStructure) => {
  const playlistFiles = new Set();
  
  const collectPlaylistFiles = (structure) => {
    structure.playlists.forEach(playlist => {
      playlist.tracks.forEach(track => {
        if (track.name) {
          playlistFiles.add(track.name);
        }
      });
    });
    structure.subfolders.forEach(subfolder => collectPlaylistFiles(subfolder));
  };
  
  collectPlaylistFiles(folderStructure);
  
  const files = [];
  
  const collectNonPlaylistFiles = (structure) => {
    structure.audioFiles.forEach(file => {
      if (!playlistFiles.has(file.name)) {
        files.push(file);
      }
    });
    structure.subfolders.forEach(subfolder => collectNonPlaylistFiles(subfolder));
  };
  
  collectNonPlaylistFiles(folderStructure);
  return files;
};

export const hasNestedPlaylists = (folderStructure) => {
  const check = (structure) => {
    if (structure.playlists.length > 0) return true;
    return structure.subfolders.some(subfolder => check(subfolder));
  };
  return check(folderStructure);
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const generatePlaylistFromFiles = (files, playlistName) => {
  return {
    name: playlistName,
    created: Date.now(),
    tracks: files.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      path: file.name,
      duration: '0:00',
      file: file.file || file,
      handle: file.handle
    }))
  };
};
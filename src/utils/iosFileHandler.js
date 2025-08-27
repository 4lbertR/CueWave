// iOS/iPad compatible file handling
// This will work in Safari and WKWebView when nested in an iOS app

const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.aac', '.wav', '.aiff', '.flac'];

class IOSFileHandler {
  constructor() {
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.isIPad = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    this.nativeBridge = null;
    this.setupNativeBridge();
  }

  setupNativeBridge() {
    // Check for WKWebView message handlers (set up by the iOS app)
    if (window.webkit && window.webkit.messageHandlers) {
      this.nativeBridge = window.webkit.messageHandlers;
    }
    
    // Register global callback for native responses
    window.CuewaveNativeCallback = (action, data) => {
      this.handleNativeResponse(action, data);
    };
  }

  handleNativeResponse(action, data) {
    // Handle responses from native iOS code
    if (this.pendingCallbacks[action]) {
      this.pendingCallbacks[action](data);
      delete this.pendingCallbacks[action];
    }
  }

  pendingCallbacks = {};

  // Request file access from native iOS app
  async requestNativeFileAccess(type) {
    return new Promise((resolve, reject) => {
      if (this.nativeBridge && this.nativeBridge.cuewaveFileHandler) {
        const callbackId = Date.now().toString();
        this.pendingCallbacks[callbackId] = resolve;
        
        // Send message to native iOS code
        this.nativeBridge.cuewaveFileHandler.postMessage({
          action: 'requestFileAccess',
          type: type, // 'folder' or 'files'
          callbackId: callbackId
        });
      } else {
        reject(new Error('Native bridge not available'));
      }
    });
  }

  // Create file input for folder selection (webkitdirectory)
  createFolderInput() {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.directory = true;
    input.multiple = true;
    
    return new Promise((resolve, reject) => {
      input.onchange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
          const folderStructure = this.processWebkitDirectoryFiles(files);
          resolve(folderStructure);
        } else {
          reject(new Error('No files selected'));
        }
      };
      
      input.oncancel = () => {
        reject(new Error('Selection cancelled'));
      };
      
      input.click();
    });
  }

  // Create file input for multiple audio files
  createAudioFileInput() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = AUDIO_EXTENSIONS.join(',');
    
    return new Promise((resolve, reject) => {
      input.onchange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
          resolve(files);
        } else {
          reject(new Error('No files selected'));
        }
      };
      
      input.oncancel = () => {
        reject(new Error('Selection cancelled'));
      };
      
      input.click();
    });
  }

  // Process files from webkitdirectory input
  processWebkitDirectoryFiles(files) {
    const structure = {
      name: '',
      audioFiles: [],
      playlists: [],
      folders: new Map()
    };

    // Extract folder name from first file path
    if (files.length > 0 && files[0].webkitRelativePath) {
      const pathParts = files[0].webkitRelativePath.split('/');
      structure.name = pathParts[0];
    }

    files.forEach(file => {
      if (!file.webkitRelativePath) {
        // Fallback for files without path info
        if (this.isAudioFile(file.name)) {
          structure.audioFiles.push({
            name: file.name,
            file: file,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
          });
        }
        return;
      }

      const pathParts = file.webkitRelativePath.split('/');
      
      if (pathParts.length === 2) {
        // File is in root folder
        if (this.isAudioFile(file.name)) {
          structure.audioFiles.push({
            name: file.name,
            file: file,
            path: file.webkitRelativePath,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
          });
        } else if (file.name.endsWith('.cuewave')) {
          structure.playlists.push({
            name: file.name,
            file: file,
            path: file.webkitRelativePath
          });
        }
      } else {
        // File is in subfolder
        const subfolderPath = pathParts.slice(1, -1).join('/');
        
        if (!structure.folders.has(subfolderPath)) {
          structure.folders.set(subfolderPath, {
            name: pathParts[pathParts.length - 2],
            path: subfolderPath,
            audioFiles: [],
            playlists: []
          });
        }
        
        const folder = structure.folders.get(subfolderPath);
        
        if (this.isAudioFile(file.name)) {
          folder.audioFiles.push({
            name: file.name,
            file: file,
            path: file.webkitRelativePath,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
          });
        } else if (file.name.endsWith('.cuewave')) {
          folder.playlists.push({
            name: file.name,
            file: file,
            path: file.webkitRelativePath
          });
        }
      }
    });

    // Convert folders map to array
    structure.subfolders = Array.from(structure.folders.values());
    delete structure.folders;

    return structure;
  }

  isAudioFile(filename) {
    const ext = filename.toLowerCase();
    return AUDIO_EXTENSIONS.some(audioExt => ext.endsWith(audioExt));
  }

  // Check if running in native iOS app
  isNativeApp() {
    return this.nativeBridge !== null;
  }

  // Main entry point for importing files/folders
  async importFiles(type = 'files') {
    try {
      // First try native bridge (if in WKWebView)
      if (this.isNativeApp()) {
        try {
          const result = await this.requestNativeFileAccess(type);
          return result;
        } catch (nativeError) {
          console.log('Native bridge failed, falling back to web input');
        }
      }

      // Fallback to web file input
      if (type === 'folder') {
        return await this.createFolderInput();
      } else {
        return await this.createAudioFileInput();
      }
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  }

  // Store file references for iOS (using IndexedDB for persistence)
  async storeFileReference(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const arrayBuffer = e.target.result;
        const blob = new Blob([arrayBuffer], { type: file.type });
        
        // Store in IndexedDB for persistence
        const fileData = {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          data: blob
        };
        
        await this.saveToIndexedDB(file.name, fileData);
        resolve(fileData);
      };
      
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // IndexedDB operations for iOS persistence
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CuewaveFiles', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'name' });
        }
        if (!db.objectStoreNames.contains('playlists')) {
          db.createObjectStore('playlists', { keyPath: 'id' });
        }
      };
    });
  }

  async saveToIndexedDB(key, data) {
    const db = await this.openDB();
    const transaction = db.transaction(['files'], 'readwrite');
    const store = transaction.objectStore('files');
    return store.put({ ...data, name: key });
  }

  async loadFromIndexedDB(key) {
    const db = await this.openDB();
    const transaction = db.transaction(['files'], 'readonly');
    const store = transaction.objectStore('files');
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllStoredFiles() {
    const db = await this.openDB();
    const transaction = db.transaction(['files'], 'readonly');
    const store = transaction.objectStore('files');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export default new IOSFileHandler();
import { useState } from 'react';
import './FolderImportDialog.css';

function FolderImportDialog({ isOpen, onClose, onImport, folderName, hasNestedPlaylists }) {
  const [importMode, setImportMode] = useState('all');

  if (!isOpen) return null;

  const handleImport = () => {
    onImport(importMode);
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <h2>Import Folder as Playlist</h2>
        <p className="folder-name">Folder: {folderName}</p>
        
        {hasNestedPlaylists && (
          <>
            <p className="dialog-message">
              This folder contains other playlists. How would you like to import it?
            </p>
            <div className="import-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="importMode"
                  value="all"
                  checked={importMode === 'all'}
                  onChange={(e) => setImportMode(e.target.value)}
                />
                <span>Include all audio files (including those in nested playlists)</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="importMode"
                  value="exclude"
                  checked={importMode === 'exclude'}
                  onChange={(e) => setImportMode(e.target.value)}
                />
                <span>Exclude files already in nested playlists</span>
              </label>
            </div>
          </>
        )}
        
        {!hasNestedPlaylists && (
          <p className="dialog-message">
            Import all audio files from this folder as a playlist?
          </p>
        )}

        <div className="dialog-buttons">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="import-button" onClick={handleImport}>
            Import
          </button>
        </div>
      </div>
    </div>
  );
}

export default FolderImportDialog;
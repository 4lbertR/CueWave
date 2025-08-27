import { useState, useEffect } from 'react';
import './EditPlaylistModal.css';

function EditPlaylistModal({ 
  isOpen, 
  onClose, 
  onSave, 
  playlist, 
  allAvailableFiles 
}) {
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen && playlist) {
      // Initialize with current playlist files
      const currentFileIds = new Set(playlist.tracks?.map(t => t.id) || []);
      setSelectedFiles(currentFileIds);
      setHasChanges(false);
    }
  }, [isOpen, playlist]);

  if (!isOpen) return null;

  const toggleFile = (fileId) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
    setHasChanges(true);
  };

  const filteredFiles = allAvailableFiles.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Remove duplicates based on file name
  const uniqueFiles = [];
  const seenNames = new Set();
  filteredFiles.forEach(file => {
    if (!seenNames.has(file.name)) {
      uniqueFiles.push(file);
      seenNames.add(file.name);
    }
  });

  const handleSave = () => {
    const selectedFileObjects = allAvailableFiles.filter(f => selectedFiles.has(f.id));
    onSave(playlist, selectedFileObjects);
    onClose();
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = confirm('You have unsaved changes. Cancel without saving?');
      if (!confirmClose) {
        return;
      }
    }
    onClose();
  };

  const selectAll = () => {
    setSelectedFiles(new Set(uniqueFiles.map(f => f.id)));
    setHasChanges(true);
  };

  const selectNone = () => {
    setSelectedFiles(new Set());
    setHasChanges(true);
  };

  return (
    <>
      <div className="modal-overlay" onClick={handleClose} />
      <div className="edit-playlist-modal">
        <div className="modal-header">
          <h2>{playlist?.name || 'Edit Playlist'}</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="modal-toolbar">
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button onClick={selectAll} className="toolbar-btn">Select All</button>
          <button onClick={selectNone} className="toolbar-btn">Select None</button>
        </div>

        <div className="files-list">
          {uniqueFiles.map(file => (
            <label key={file.id} className="file-checkbox-item">
              <input
                type="checkbox"
                checked={selectedFiles.has(file.id)}
                onChange={() => toggleFile(file.id)}
              />
              <span className="file-name">{file.name}</span>
              <span className="file-duration">{file.duration || '0:00'}</span>
              <span className="file-location">{file.location || 'Library'}</span>
            </label>
          ))}
          {uniqueFiles.length === 0 && (
            <div className="no-files">No files found</div>
          )}
        </div>

        <div className="modal-footer">
          <div className="selection-info">
            {selectedFiles.size} files selected
          </div>
          <div className="modal-buttons">
            <button className="cancel-btn" onClick={handleClose}>
              Cancel
            </button>
            <button className="save-btn" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditPlaylistModal;
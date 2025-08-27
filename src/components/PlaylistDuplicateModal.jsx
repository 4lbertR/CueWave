import React, { useState } from 'react';
import './PlaylistDuplicateModal.css';

const PlaylistDuplicateModal = ({ 
  isOpen, 
  onClose, 
  existingName,
  onChoice 
}) => {
  const [customName, setCustomName] = useState('');
  
  if (!isOpen) return null;

  const handleAdd = () => {
    onChoice('add');
    onClose();
  };

  const handleRename = () => {
    if (customName.trim()) {
      onChoice('rename', customName.trim());
      onClose();
    }
  };

  const handleCancel = () => {
    onChoice('cancel');
    onClose();
  };

  const getNextNumberedName = () => {
    // This will be calculated in the parent component
    return onChoice('numbered');
  };

  return (
    <>
      <div className="modal-overlay" onClick={handleCancel} />
      <div className="playlist-duplicate-modal">
        <h2>Playlist Already Exists</h2>
        <p>A playlist named "{existingName}" already exists.</p>
        <p>What would you like to do?</p>
        
        <div className="modal-options">
          <button 
            onClick={getNextNumberedName}
            className="modal-button add-numbered"
          >
            Add with number
            <span className="button-hint">Will create "{existingName} (2)"</span>
          </button>
          
          <div className="rename-section">
            <input
              type="text"
              placeholder="Enter new name..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleRename()}
              className="rename-input"
            />
            <button 
              onClick={handleRename}
              className="modal-button rename"
              disabled={!customName.trim()}
            >
              Rename
            </button>
          </div>
          
          <button 
            onClick={handleCancel}
            className="modal-button cancel"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default PlaylistDuplicateModal;
import { useState } from 'react';
import './MoveDialog.css';

function MoveDialog({ 
  isOpen, 
  onClose, 
  onMove,
  item,
  folders,
  currentLocation 
}) {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  if (!isOpen) return null;

  const toggleExpand = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleMove = () => {
    if (selectedFolder !== null) {
      onMove(item, selectedFolder);
      onClose();
    }
  };

  const renderFolder = (folder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolder === folder.id;
    const isCurrentLocation = currentLocation === folder.id;
    
    return (
      <div key={folder.id} className="move-folder-item">
        <div 
          className={`move-folder-row ${isSelected ? 'selected' : ''} ${isCurrentLocation ? 'current-location' : ''}`}
          style={{ paddingLeft: `${level * 30 + 20}px` }}
        >
          {(folder.folders?.length > 0) && (
            <button 
              className="expand-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(folder.id);
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          <div 
            className="folder-select-area"
            onClick={() => !isCurrentLocation && setSelectedFolder(folder.id)}
          >
            <span className="folder-icon">📁</span>
            <span className="folder-name">{folder.name}</span>
            {isCurrentLocation && <span className="current-badge">Current</span>}
          </div>
        </div>
        
        {isExpanded && folder.folders && (
          <div className="subfolders">
            {folder.folders.map(subfolder => renderFolder(subfolder, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="move-dialog">
        <div className="move-header">
          <h2>Move "{item?.name}"</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="move-content">
          <p className="move-instruction">Select destination folder:</p>
          
          <div className="folder-tree">
            {/* Root level option */}
            <div 
              className={`move-folder-row root-level ${selectedFolder === 'root' ? 'selected' : ''} ${currentLocation === 'root' ? 'current-location' : ''}`}
              onClick={() => currentLocation !== 'root' && setSelectedFolder('root')}
            >
              <span className="folder-icon">🏠</span>
              <span className="folder-name">Library (Root)</span>
              {currentLocation === 'root' && <span className="current-badge">Current</span>}
            </div>
            
            {/* All folders */}
            {folders.map(folder => renderFolder(folder, 0))}
          </div>
        </div>

        <div className="move-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="move-btn" 
            onClick={handleMove}
            disabled={selectedFolder === null || selectedFolder === currentLocation}
          >
            Move Here
          </button>
        </div>
      </div>
    </>
  );
}

export default MoveDialog;
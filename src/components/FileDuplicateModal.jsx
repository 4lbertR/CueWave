import { useState } from 'react';
import './FileDuplicateModal.css';

function FileDuplicateModal({ 
  isOpen, 
  onClose, 
  duplicates, 
  onChoice,
  importType = 'files' // 'files' or 'allfiles'
}) {
  const [renameInputs, setRenameInputs] = useState({});
  const [selectedAction, setSelectedAction] = useState('continue');
  const [showRenameInputs, setShowRenameInputs] = useState(false);

  const handleContinue = () => {
    // For all files import, auto-increment names
    const renamedFiles = {};
    duplicates.forEach(dup => {
      renamedFiles[dup.file.name] = dup.suggestedName;
    });
    onChoice('continue', renamedFiles);
    onClose();
  };

  const handleRename = () => {
    if (!showRenameInputs) {
      // Initialize rename inputs with current names
      const inputs = {};
      duplicates.forEach(dup => {
        inputs[dup.file.name] = dup.file.name;
      });
      setRenameInputs(inputs);
      setShowRenameInputs(true);
      setSelectedAction('rename');
    } else {
      // Process renames
      onChoice('rename', renameInputs);
      onClose();
    }
  };

  const handleSkip = () => {
    onChoice('skip', null);
    onClose();
  };

  const handleCancel = () => {
    onChoice('cancel', null);
    onClose();
  };

  const updateRenameInput = (originalName, newName) => {
    setRenameInputs(prev => ({
      ...prev,
      [originalName]: newName
    }));
  };

  if (!isOpen || !duplicates || duplicates.length === 0) return null;

  return (
    <>
      <div className="modal-overlay" onClick={handleCancel} />
      <div className="modal-content file-duplicate-modal">
        <div className="modal-header">
          <h2>Duplicate Files Found</h2>
          <button className="close-btn" onClick={handleCancel}>×</button>
        </div>
        
        <div className="modal-body">
          <p className="duplicate-message">
            {duplicates.length} file{duplicates.length > 1 ? 's' : ''} already exist{duplicates.length === 1 ? 's' : ''} in {importType === 'allfiles' ? 'All Files' : 'the destination'}:
          </p>
          
          <div className="duplicate-list">
            {duplicates.map((dup, index) => (
              <div key={index} className="duplicate-item">
                <span className="file-icon">🎵</span>
                <div className="file-info">
                  {showRenameInputs && selectedAction === 'rename' ? (
                    <input
                      type="text"
                      className="rename-input"
                      value={renameInputs[dup.file.name] || ''}
                      onChange={(e) => updateRenameInput(dup.file.name, e.target.value)}
                      placeholder="Enter new name"
                    />
                  ) : (
                    <>
                      <span className="file-name">{dup.file.name}</span>
                      {importType === 'allfiles' && selectedAction === 'continue' && (
                        <span className="suggested-name">→ {dup.suggestedName}</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="action-description">
            {selectedAction === 'continue' && importType === 'allfiles' && (
              <p>Files will be imported with numbers added to their names.</p>
            )}
            {selectedAction === 'rename' && !showRenameInputs && (
              <p>Click Rename again to enter new names for each file.</p>
            )}
            {selectedAction === 'rename' && showRenameInputs && (
              <p>Enter new names for the duplicate files above.</p>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <div className="action-buttons">
            {importType === 'allfiles' ? (
              <>
                <button 
                  className="action-btn continue-btn"
                  onClick={handleContinue}
                  title="Import with auto-numbered names"
                >
                  Continue
                </button>
                <button 
                  className="action-btn rename-btn"
                  onClick={handleRename}
                >
                  {showRenameInputs ? 'Apply Names' : 'Rename'}
                </button>
              </>
            ) : (
              <>
                <button 
                  className="action-btn rename-btn"
                  onClick={handleRename}
                >
                  {showRenameInputs ? 'Apply Names' : 'Rename'}
                </button>
              </>
            )}
            <button 
              className="action-btn skip-btn"
              onClick={handleSkip}
              title="Skip duplicate files and import only new ones"
            >
              Skip Duplicates
            </button>
            <button 
              className="action-btn cancel-btn"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default FileDuplicateModal;
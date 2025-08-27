import './DuplicateHandlingModal.css';

function DuplicateHandlingModal({ 
  isOpen, 
  onClose, 
  onChoice,
  duplicateCount,
  playlistName 
}) {
  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={() => onChoice('cancel')} />
      <div className="duplicate-modal">
        <div className="modal-header">
          <h2>Duplicate Files Detected</h2>
        </div>

        <div className="modal-content">
          <p className="duplicate-message">
            {duplicateCount} file{duplicateCount > 1 ? 's' : ''} already exist in "{playlistName}".
          </p>
          <p className="duplicate-question">
            What would you like to do?
          </p>
        </div>

        <div className="duplicate-options">
          <button 
            className="option-btn add-duplicates"
            onClick={() => onChoice('add')}
          >
            <span className="option-icon">➕</span>
            <span className="option-text">Add Duplicates</span>
            <span className="option-desc">Add all files including duplicates</span>
          </button>

          <button 
            className="option-btn skip-duplicates"
            onClick={() => onChoice('skip')}
          >
            <span className="option-icon">⏭</span>
            <span className="option-text">Skip Duplicates</span>
            <span className="option-desc">Only add new files</span>
          </button>

          <button 
            className="option-btn cancel-operation"
            onClick={() => onChoice('cancel')}
          >
            <span className="option-icon">❌</span>
            <span className="option-text">Cancel</span>
            <span className="option-desc">Don't add any files</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default DuplicateHandlingModal;
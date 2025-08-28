import './DeckSelectionDialog.css';

function DeckSelectionDialog({ 
  isOpen, 
  onClose, 
  onSelectDeck, 
  currentDeckA, 
  currentDeckB,
  importType = 'files' 
}) {
  if (!isOpen) return null;

  const handleDeckSelect = (deck, action = 'replace') => {
    onSelectDeck(deck, action);
    onClose();
  };

  const handleSkip = () => {
    onSelectDeck(null, 'skip');
    onClose();
  };

  return (
    <div className="deck-selection-overlay" onClick={onClose}>
      <div className="deck-dialog-content" onClick={(e) => e.stopPropagation()}>
        <h2>Select Target Deck</h2>
        <p className="dialog-message">
          Where would you like to load the {importType}?
        </p>

        <div className="deck-options">
          <div className="deck-option">
            <button 
              className="deck-button deck-a"
              onClick={() => handleDeckSelect('A', 'replace')}
            >
              <span className="deck-letter">A</span>
              <span className="deck-label">Load to Deck A</span>
              {currentDeckA && (
                <span className="current-content">(Replace current)</span>
              )}
            </button>
            <button 
              className="append-button"
              onClick={() => handleDeckSelect('A', 'append')}
            >
              Append to Deck A
            </button>
          </div>

          <div className="deck-option">
            <button 
              className="deck-button deck-b"
              onClick={() => handleDeckSelect('B', 'replace')}
            >
              <span className="deck-letter">B</span>
              <span className="deck-label">Load to Deck B</span>
              {currentDeckB && (
                <span className="current-content">(Replace current)</span>
              )}
            </button>
            <button 
              className="append-button"
              onClick={() => handleDeckSelect('B', 'append')}
            >
              Append to Deck B
            </button>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="skip-button" onClick={handleSkip}>
            Save to Library Only
          </button>
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeckSelectionDialog;
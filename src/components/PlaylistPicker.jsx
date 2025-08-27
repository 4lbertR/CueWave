import { useState } from 'react';
import './PlaylistPicker.css';

function PlaylistPicker({ 
  isOpen, 
  onClose, 
  onSelect,
  playlists 
}) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredPlaylists = playlists.filter(playlist => 
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (playlist) => {
    onSelect(playlist);
    onClose();
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="playlist-picker-modal">
        <div className="modal-header">
          <h2>Select Playlist</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="picker-search">
          <input
            type="text"
            placeholder="Search playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            autoFocus
          />
        </div>

        <div className="playlists-grid">
          {filteredPlaylists.map(playlist => (
            <button
              key={playlist.id}
              className="playlist-card"
              onClick={() => handleSelect(playlist)}
            >
              <span className="playlist-icon">🎵</span>
              <span className="playlist-name">
                {playlist.name.replace('playlist-', '')}
              </span>
              <span className="playlist-count">
                {playlist.tracks?.length || 0} tracks
              </span>
            </button>
          ))}
          {filteredPlaylists.length === 0 && (
            <div className="no-playlists">
              {searchQuery ? 'No playlists found' : 'No playlists available'}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

export default PlaylistPicker;
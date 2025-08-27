import { useState, useEffect } from 'react';
import './PlaylistSidebar.css';

function PlaylistSidebar({ 
  playlists, 
  folders, 
  onSelectPlaylist, 
  onRefresh,
  selectedDeck = 'A' 
}) {
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [selectedItem, setSelectedItem] = useState(null);

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleItemClick = (item, type) => {
    setSelectedItem({ id: item.id, type });
    if (type === 'playlist') {
      onSelectPlaylist(item, selectedDeck);
    }
  };

  const formatPlaylistName = (name) => {
    // Remove 'playlist-' prefix if present
    if (name.startsWith('playlist-')) {
      return name.substring(9);
    }
    return name;
  };

  const renderPlaylist = (playlist, indent = 0) => {
    const isSelected = selectedItem?.id === playlist.id && selectedItem?.type === 'playlist';
    
    return (
      <div 
        key={playlist.id}
        className={`sidebar-item playlist-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${indent + 20}px` }}
        onClick={() => handleItemClick(playlist, 'playlist')}
      >
        <span className="item-icon">🎵</span>
        <span className="item-name">{formatPlaylistName(playlist.name)}</span>
        <span className="item-count">{playlist.tracks?.length || 0}</span>
      </div>
    );
  };

  const renderFolder = (folder, indent = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedItem?.id === folder.id && selectedItem?.type === 'folder';
    
    return (
      <div key={folder.id} className="folder-container">
        <div 
          className={`sidebar-item folder-item ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${indent}px` }}
          onClick={() => toggleFolder(folder.id)}
        >
          <span className="folder-arrow">{isExpanded ? '▼' : '▶'}</span>
          <span className="item-icon">📁</span>
          <span className="item-name">{folder.name}</span>
        </div>
        
        {isExpanded && (
          <div className="folder-contents">
            {/* Render nested folders */}
            {folder.folders?.map(subFolder => 
              renderFolder(subFolder, indent + 20)
            )}
            
            {/* Render playlists in this folder */}
            {folder.playlists?.map(playlist => 
              renderPlaylist(playlist, indent + 20)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="playlist-sidebar">
      <div className="sidebar-header">
        <h3>Library</h3>
        <button className="refresh-button" onClick={onRefresh} title="Refresh library">
          ↻
        </button>
      </div>
      
      <div className="sidebar-deck-selector">
        <span className="deck-label">Load to Deck:</span>
        <div className="deck-buttons">
          <button 
            className={`deck-select-btn ${selectedDeck === 'A' ? 'active' : ''}`}
            onClick={() => {}}
          >
            A
          </button>
          <button 
            className={`deck-select-btn ${selectedDeck === 'B' ? 'active' : ''}`}
            onClick={() => {}}
          >
            B
          </button>
        </div>
      </div>
      
      <div className="sidebar-content">
        {/* Render root level folders */}
        {folders.map(folder => renderFolder(folder, 0))}
        
        {/* Render root level playlists */}
        {playlists
          .filter(playlist => !folders.some(f => f.playlists?.some(p => p.id === playlist.id)))
          .map(playlist => renderPlaylist(playlist, 0))}
        
        {playlists.length === 0 && folders.length === 0 && (
          <div className="sidebar-empty">
            <p>No playlists or folders</p>
            <p className="hint">Import files to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlaylistSidebar;
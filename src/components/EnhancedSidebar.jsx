import { useState, useEffect } from 'react';
import './EnhancedSidebar.css';

function EnhancedSidebar({ 
  isOpen,
  onClose,
  playlists, 
  folders,
  allFiles,
  onSelectPlaylist, 
  onRefresh,
  onImportClick,
  onCreateFolder,
  onCreatePlaylist,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onMoveItem,
  onLoadToDeck,
  onDeleteItem
}) {
  const [viewMode, setViewMode] = useState('folders'); // 'folders' or 'allFiles'
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [selectedDeck, setSelectedDeck] = useState('A');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpand = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const toggleFileSelection = (fileId) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const selectAll = () => {
    const visibleFiles = getFilteredFiles();
    const newSelection = new Set(visibleFiles.map(f => f.id));
    setSelectedFiles(newSelection);
  };

  const deselectAll = () => {
    setSelectedFiles(new Set());
  };

  const handleDragStart = (e, item, type) => {
    setDraggedItem({ item, type });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetItem, targetType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem({ item: targetItem, type: targetType });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDrop = (e, targetItem, targetType) => {
    e.preventDefault();
    if (!draggedItem) return;

    if (targetType === 'folder' && draggedItem.type === 'playlist') {
      // Move playlist into folder
      onMoveItem(draggedItem.item, targetItem, 'playlist-to-folder');
    } else if (targetType === 'playlist' && draggedItem.type === 'file') {
      // Add file to playlist
      onAddToPlaylist([draggedItem.item], targetItem);
    }
    
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const formatPlaylistName = (name) => {
    if (name.startsWith('playlist-')) {
      return name.substring(9);
    }
    return name;
  };

  const formatDuration = (duration) => {
    return duration || '0:00';
  };

  const getFilteredFiles = () => {
    if (!allFiles) return [];
    
    if (!searchQuery) return allFiles;
    
    return allFiles.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleLoadSelected = (action = 'replace') => {
    const selected = Array.from(selectedFiles).map(id => 
      allFiles.find(f => f.id === id)
    ).filter(Boolean);
    
    if (selected.length > 0) {
      onLoadToDeck(selected, selectedDeck, action);
      setSelectedFiles(new Set());
    }
  };

  const handleCreatePlaylistFromSelected = () => {
    const selected = Array.from(selectedFiles).map(id => 
      allFiles.find(f => f.id === id)
    ).filter(Boolean);
    
    if (selected.length > 0) {
      const playlistName = prompt('Enter playlist name:');
      if (playlistName) {
        onCreatePlaylist(selected, playlistName);
        setSelectedFiles(new Set());
      }
    }
  };

  const handleAddSelectedToPlaylist = () => {
    const selected = Array.from(selectedFiles).map(id => 
      allFiles.find(f => f.id === id)
    ).filter(Boolean);
    
    if (selected.length > 0) {
      // Show playlist selection dialog
      const playlistOptions = playlists.map(p => p.name).join('\n');
      const targetPlaylist = prompt(`Select playlist:\n${playlistOptions}`);
      
      if (targetPlaylist) {
        const playlist = playlists.find(p => p.name === targetPlaylist);
        if (playlist) {
          onAddToPlaylist(selected, playlist);
          setSelectedFiles(new Set());
        }
      }
    }
  };

  const renderPlaylistContents = (playlist) => {
    if (!expandedItems.has(playlist.id)) return null;
    
    return (
      <div className="playlist-contents">
        {playlist.tracks?.map((track, index) => (
          <div key={track.id || index} className="track-item">
            <span className="track-number">{index + 1}</span>
            <span className="track-name">{track.name}</span>
            <span className="track-duration">{formatDuration(track.duration)}</span>
            <button 
              className="remove-track-btn"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromPlaylist(track, playlist);
              }}
              title="Remove from playlist"
            >
              ×
            </button>
          </div>
        ))}
        {(!playlist.tracks || playlist.tracks.length === 0) && (
          <div className="empty-playlist">Empty playlist</div>
        )}
      </div>
    );
  };

  const renderPlaylist = (playlist, indent = 0) => {
    const isExpanded = expandedItems.has(playlist.id);
    
    return (
      <div key={playlist.id} className="playlist-container">
        <div 
          className="sidebar-item playlist-item"
          style={{ paddingLeft: `${indent + 20}px` }}
          draggable
          onDragStart={(e) => handleDragStart(e, playlist, 'playlist')}
          onDragOver={(e) => handleDragOver(e, playlist, 'playlist')}
          onDrop={(e) => handleDrop(e, playlist, 'playlist')}
          onDragEnd={handleDragEnd}
        >
          <span 
            className="expand-arrow"
            onClick={() => toggleExpand(playlist.id)}
          >
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="item-icon">🎵</span>
          <span 
            className="item-name"
            onClick={() => onSelectPlaylist(playlist)}
          >
            {formatPlaylistName(playlist.name)}
          </span>
          <span className="item-count">{playlist.tracks?.length || 0}</span>
          <button
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete playlist "${playlist.name}"?`)) {
                onDeleteItem(playlist, 'playlist');
              }
            }}
          >
            🗑
          </button>
        </div>
        {renderPlaylistContents(playlist)}
      </div>
    );
  };

  const renderFolder = (folder, indent = 0) => {
    const isExpanded = expandedItems.has(folder.id);
    
    return (
      <div key={folder.id} className="folder-container">
        <div 
          className={`sidebar-item folder-item ${
            dragOverItem?.item?.id === folder.id ? 'drag-over' : ''
          }`}
          style={{ paddingLeft: `${indent}px` }}
          draggable
          onDragStart={(e) => handleDragStart(e, folder, 'folder')}
          onDragOver={(e) => handleDragOver(e, folder, 'folder')}
          onDrop={(e) => handleDrop(e, folder, 'folder')}
          onDragEnd={handleDragEnd}
        >
          <span 
            className="folder-arrow"
            onClick={() => toggleExpand(folder.id)}
          >
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="item-icon">📁</span>
          <span className="item-name">{folder.name}</span>
          <button
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete folder "${folder.name}" and all its contents?`)) {
                onDeleteItem(folder, 'folder');
              }
            }}
          >
            🗑
          </button>
        </div>
        
        {isExpanded && (
          <div className="folder-contents">
            {folder.folders?.map(subFolder => 
              renderFolder(subFolder, indent + 20)
            )}
            {folder.playlists?.map(playlist => 
              renderPlaylist(playlist, indent + 20)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAllFilesView = () => {
    const filteredFiles = getFilteredFiles();
    const hasSelection = selectedFiles.size > 0;
    
    return (
      <div className="all-files-view">
        <div className="files-toolbar">
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button onClick={selectAll} className="select-btn">Select All</button>
          <button onClick={deselectAll} className="select-btn">Clear</button>
        </div>
        
        {hasSelection && (
          <div className="selection-actions">
            <span>{selectedFiles.size} selected</span>
            <select 
              value={selectedDeck} 
              onChange={(e) => setSelectedDeck(e.target.value)}
              className="deck-select"
            >
              <option value="A">Deck A</option>
              <option value="B">Deck B</option>
            </select>
            <button onClick={() => handleLoadSelected('replace')}>Load</button>
            <button onClick={() => handleLoadSelected('append')}>Append</button>
            <button onClick={handleCreatePlaylistFromSelected}>Create Playlist</button>
            <button onClick={handleAddSelectedToPlaylist}>Add to Playlist</button>
          </div>
        )}
        
        <div className="files-list">
          {filteredFiles.map(file => (
            <div key={file.id} className="file-item">
              <input
                type="checkbox"
                checked={selectedFiles.has(file.id)}
                onChange={() => toggleFileSelection(file.id)}
              />
              <span className="file-name">{file.name}</span>
              <span className="file-duration">{formatDuration(file.duration)}</span>
              <span className="file-location">{file.location || 'Library'}</span>
            </div>
          ))}
          {filteredFiles.length === 0 && (
            <div className="no-files">
              {searchQuery ? 'No files found' : 'No files in library'}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="sidebar-overlay" onClick={onClose} />
      <div className="enhanced-sidebar">
        <div className="sidebar-header">
          <h2>Library</h2>
          <button className="close-sidebar-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="sidebar-controls">
          <button className="import-btn" onClick={onImportClick}>
            📁 Open file / playlist
          </button>
          <button className="create-folder-btn" onClick={onCreateFolder}>
            ➕ Create Folder
          </button>
          <button className="refresh-btn" onClick={onRefresh}>
            ↻ Refresh
          </button>
        </div>
        
        <div className="view-tabs">
          <button 
            className={`tab ${viewMode === 'folders' ? 'active' : ''}`}
            onClick={() => setViewMode('folders')}
          >
            Folders & Playlists
          </button>
          <button 
            className={`tab ${viewMode === 'allFiles' ? 'active' : ''}`}
            onClick={() => setViewMode('allFiles')}
          >
            All Files
          </button>
        </div>
        
        <div className="sidebar-content">
          {viewMode === 'folders' ? (
            <>
              {folders.map(folder => renderFolder(folder, 0))}
              {playlists
                .filter(playlist => !folders.some(f => 
                  f.playlists?.some(p => p.id === playlist.id)
                ))
                .map(playlist => renderPlaylist(playlist, 0))}
              
              {playlists.length === 0 && folders.length === 0 && (
                <div className="sidebar-empty">
                  <p>No playlists or folders</p>
                  <p className="hint">Click "Open file / playlist" to import</p>
                </div>
              )}
            </>
          ) : (
            renderAllFilesView()
          )}
        </div>
      </div>
    </>
  );
}

export default EnhancedSidebar;
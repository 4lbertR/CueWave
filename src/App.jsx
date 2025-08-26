import { useState } from 'react'
import './App.css'

const fadeInAPressed = () => {
  console.log("Fade In A Clicked!");
};
const fadeOutAPressed = () => {
  console.log("Fade Out A Clicked!");
};
const playAPressed = () => {
  console.log("Play A Clicked!");
}; 
const fadeNextAPressed = () => {
  console.log("Fade Next A Clicked!"); 
};

const fadeInBPressed = () => {
  console.log("Fade In B Clicked!");
};
const fadeOutBPressed = () => {
  console.log("Fade Out B Clicked!");
};
const playBPressed = () => {
  console.log("Play B Clicked!");
};
const fadeNextBPressed = () => {
  console.log("Fade Next B Clicked!");
};

const CF_A_B_Button = () => {
  console.log("Crossfade A-B Clicked!");
};

const CF_B_A_Button = () => {
  console.log("Crossfade B-A Clicked!");
};
const HeaderOpenPressed = () => {
  console.log("Open file / playlist Clicked!");
};

const HeaderSettingsPressed = () => {
  console.log("Settings Clicked!");
};

function App() {
  const [fadeDuration, setFadeDuration] = useState(1);
  const [isCompactMode, setIsCompactMode] = useState(false);
  
  // Mixer volume states
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [deckAVolume, setDeckAVolume] = useState(0.7);
  const [deckBVolume, setDeckBVolume] = useState(0.5);
  const [muteA, setMuteA] = useState(false);
  const [muteB, setMuteB] = useState(true);
  const [muteMaster, setMuteMaster] = useState(false);

  const [deckATracks, setDeckATracks] = useState([
    { id: 1, name: "Sample Track 1.mp3", duration: "3:45", path: "sample1.mp3" },
    { id: 2, name: "Sample Track 2.mp3", duration: "4:12", path: "sample2.mp3" },
    { id: 3, name: "Long Sample Track Name.mp3", duration: "2:58", path: "sample3.mp3" },
    { id: 4, name: "Another Track.mp3", duration: "5:23", path: "sample4.mp3" },
    { id: 5, name: "More Music.mp3", duration: "3:17", path: "sample5.mp3" },
    { id: 6, name: "Sample Track 1.mp3", duration: "3:45", path: "sample1.mp3" },
    { id: 7, name: "Sample Track 2.mp3", duration: "4:12", path: "sample2.mp3" },
    { id: 8, name: "Long Sample Track Name.mp3", duration: "2:58", path: "sample3.mp3" },
    { id: 9, name: "Another Track.mp3", duration: "5:23", path: "sample4.mp3" },
    { id: 10, name: "More Music.mp3", duration: "3:17", path: "sample5.mp3" },
    { id: 11, name: "Sample Track 1.mp3", duration: "3:45", path: "sample1.mp3" },
    { id: 12, name: "Sample Track 2.mp3", duration: "4:12", path: "sample2.mp3" },
    { id: 13, name: "Long Sample Track Name.mp3", duration: "2:58", path: "sample3.mp3" },
    { id: 14, name: "Another Track.mp3", duration: "5:23", path: "sample4.mp3" },
    { id: 15, name: "More Music.mp3", duration: "3:17", path: "sample5.mp3" },
  ]);
  
  const [deckBTracks, setDeckBTracks] = useState([
    { id: 6, name: "Deck B Track 1.mp3", duration: "4:05", path: "deckb1.mp3" },
    { id: 7, name: "Deck B Track 2.mp3", duration: "3:31", path: "deckb2.mp3" },
  ]);

  const [selectedTrackA, setSelectedTrackA] = useState(null);
  const [selectedTrackB, setSelectedTrackB] = useState(null);

  return (
    <div className={isCompactMode ? 'compact-mode' : ''}>
      <div className="cuewave-app">
    
        <button onClick={() => setIsCompactMode(!isCompactMode)} className='MixerArrow'>
          <img 
            src='src/assets/open-mixer-arrow.svg' 
            alt="Toggle mixer"
            style={{ transform: isCompactMode ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>

        <div className='HEADER'>
          <button onClick={HeaderOpenPressed} className="headerbutton headerOpen">
            Open file / playlist
          </button>
          <button onClick={HeaderSettingsPressed} className="headerbutton headerSettings">
            Settings
          </button>
        </div>

        <div className="A DECK BUTTONS">
          <button onClick={fadeInAPressed} className="fadebutton fade-in-a-button">
            Fade In
          </button>

          <button onClick={playAPressed} className="playstopbutton play-a-button">
            <img src="src/assets/play.svg" alt="" />
          </button>

          <button onClick={fadeOutAPressed} className="fadebutton fade-out-a-button">
            Fade Out
          </button>

          <button onClick={fadeNextAPressed} className="fadebutton fade-next-a-button">
            Fade to Next
          </button>
        </div>

        <div className="B DECK BUTTONS">
          <button onClick={fadeInBPressed} className="fadebutton fade-in-b-button">
            Fade In
          </button>

          <button onClick={playBPressed} className="playstopbutton play-b-button">
            <img src="src/assets/play.svg" alt="" />
           </button>

          <button onClick={fadeOutBPressed} className="fadebutton fade-out-b-button">
            Fade Out 
          </button>

          <button onClick={fadeNextBPressed} className="fadebutton fade-next-b-button">
            Fade to Next
          </button>
        </div>

        <div className="track-lists-container">
          <div className="track-list-container deck-a-tracks">
            <h3>Deck A Playlist</h3>
            <div className="track-list">
              {deckATracks.map((track) => (
                <div 
                  key={track.id} 
                  className={`track-item ${selectedTrackA?.id === track.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTrackA(track)}
                >
                  <span className="track-name">{track.name}</span> 
                  <span className="track-duration">{track.duration}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="track-list-container deck-b-tracks">
            <h3>Deck B Playlist</h3>
            <div className="track-list">
              {deckBTracks.map((track) => (
                <div  
                  key={track.id}
                  className={`track-item ${selectedTrackB?.id === track.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTrackB(track)}
                >
                  <span className="track-name">{track.name}</span>
                  <span className="track-duration">{track.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='CENTER BUTTONS'>
          <button onClick={CF_A_B_Button} className="fadebutton cf-a-b-button">
              CROSSFADE A→B
          </button>
          <button onClick={CF_B_A_Button} className="fadebutton cf-b-a-button">
              CROSSFADE A←B
          </button>
        </div>

        <div className="fade-slider-div">
          <label>Fade Time</label>
          <div className="slider-container">
            
            <div className="slider-ticks">
              {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].map((value) => (
                <div 
                  key={value}
                  className="tick-mark"
                  style={{ left: `calc(${(value / 4) * 100}% - ${(value / 4) * 2}vw + 1vw)` }}
                />
              ))}
            </div>
            
            <input 
              type="range"
              min="0"
              max="4"
              step="0.5"
              value={fadeDuration}
              onChange={(e) => setFadeDuration(e.target.value)}
              className="fade-slider"
            />
            
            <div 
              className="slider-tooltip" 
              style={{ 
                left: `calc(${(parseFloat(fadeDuration) / 4) * 100}% - ${(parseFloat(fadeDuration) / 4) * 2}vw + 1vw)`
              }}
            >
              {fadeDuration} sec
            </div>
          </div>
        </div>

      </div>

      {/* MIXER PANEL WITH NATIVE HTML RANGE SLIDERS */}
      <div className={`mixer-panel ${isCompactMode ? 'mixer-visible' : 'mixer-hidden'}`}>
        <div className="mixer-fader">
          <label className="fader-label">A</label>
          <div className="fader-container">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={deckAVolume}
              onChange={(e) => setDeckAVolume(parseFloat(e.target.value))}
              className="vertical-fader"
            />
          </div>
          <button 
            className={`mute-button ${muteA ? 'active' : ''}`}
            onClick={() => setMuteA(!muteA)}
          >
            M
          </button>
        </div>

        <div className="mixer-fader">
          <label className="fader-label">B</label>
          <div className="fader-container">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={deckBVolume}
              onChange={(e) => setDeckBVolume(parseFloat(e.target.value))}
              className="vertical-fader"
            />
          </div>
          <button 
            className={`mute-button ${muteB ? 'active' : ''}`}
            onClick={() => setMuteB(!muteB)}
          >
            M
          </button>
        </div>

        <div className="mixer-fader">
          <label className="fader-label">Master</label>
          <div className="fader-container">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="vertical-fader"
            />
          </div>
          <button 
            className={`mute-button ${muteMaster ? 'active' : ''}`}
            onClick={() => setMuteMaster(!muteMaster)}
          >
            M
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Onboarding from './components/Onboarding';
import Discover from './components/Discover';
import NowPlaying from './components/NowPlaying';
import Auth from './components/Auth';

function App() {
  const [currentScreen, setCurrentScreen] = useState('onboarding'); // onboarding, auth, discover
  const [selectedSong, setSelectedSong] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [likedSongs, setLikedSongs] = useState(() => {
    const saved = localStorage.getItem('likedSongs');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync liked songs to localStorage
  React.useEffect(() => {
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
  }, [likedSongs]);


  const handleStart = () => {
    setCurrentScreen('discover');
  };


  const handleAuthSuccess = () => {
    setCurrentScreen('discover');
  };

  const handleLogoClick = () => {
    setCurrentScreen('onboarding');
  };

  const handleSongSelect = (song, currentPlaylist = []) => {
    setSelectedSong(song);
    setPlaylist(currentPlaylist);
    const index = currentPlaylist.findIndex(s => s.id === song.id);
    setCurrentIndex(index);
  };

  const handleNext = (isShuffle = false) => {
    if (playlist.length === 0) return;
    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }
    setSelectedSong(playlist[nextIndex]);
    setCurrentIndex(nextIndex);
  };

  const handlePrev = () => {
    if (playlist.length === 0) return;
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    setSelectedSong(playlist[prevIndex]);
    setCurrentIndex(prevIndex);
  };

  const toggleLike = (song) => {
    setLikedSongs(prev => {
      const isLiked = prev.some(s => s.id === song.id);
      if (isLiked) {
        return prev.filter(s => s.id !== song.id);
      } else {
        return [...prev, song];
      }
    });
  };

  const handleBackToDiscover = () => {
    setSelectedSong(null);
  };



  return (
    <div className="app-container">
      <AnimatePresence mode="wait">
        {currentScreen === 'onboarding' && (
          <Onboarding key="onboarding" onStart={handleStart} />
        )}
        
        {/* Auth screen bypassed */}
        
        {currentScreen === 'discover' && (
          <div key="main-app" className="discover-wrapper">
            <Discover 
              onSongSelect={handleSongSelect} 
              likedSongs={likedSongs}
              toggleLike={toggleLike}
            />
          </div>
        )}

      </AnimatePresence>

      <AnimatePresence>
        {selectedSong && (
          <NowPlaying 
            key={selectedSong.id} 
            song={selectedSong} 
            onBack={handleBackToDiscover}
            onNext={handleNext}
            onPrev={handlePrev}
            likedSongs={likedSongs}
            onToggleLike={() => toggleLike(selectedSong)}
          />
        )}


      </AnimatePresence>
    </div>
  );
}

export default App;

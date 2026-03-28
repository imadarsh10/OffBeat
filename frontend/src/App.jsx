import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import localforage from 'localforage';
import Discover from './components/Discover';
import NowPlaying from './components/NowPlaying';

function App() {
  const [currentScreen] = useState('discover'); // auth, discover
  const [selectedSong, setSelectedSong] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [likedSongs, setLikedSongs] = useState(() => {
    const saved = localStorage.getItem('likedSongs');
    return saved ? JSON.parse(saved) : [];
  });
  const [downloadedSongs, setDownloadedSongs] = useState(() => {
    const saved = localStorage.getItem('downloadedSongs');
    return saved ? JSON.parse(saved) : [];
  });
  const [downloadingIds, setDownloadingIds] = useState({});

  // Sync state to localStorage
  React.useEffect(() => {
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
    localStorage.setItem('downloadedSongs', JSON.stringify(downloadedSongs));
  }, [likedSongs, downloadedSongs]);


  const handleSongSelect = async (song, currentPlaylist = []) => {
    let finalSong = song;
    if (song.isOffline) {
      try {
        const audioBlob = await localforage.getItem(`audio_${song.id}`);
        if (audioBlob) {
          finalSong = {
            ...song,
            audioSrc: URL.createObjectURL(audioBlob)
          };
        }
      } catch (err) {
        console.error("Offline playback error", err);
      }
    }
    
    setSelectedSong(finalSong);
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
    const nextSong = playlist[nextIndex];
    handleSongSelect(nextSong, playlist);
  };

  const handlePrev = () => {
    if (playlist.length === 0) return;
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    const prevSong = playlist[prevIndex];
    handleSongSelect(prevSong, playlist);
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

  const toggleDownload = async (song) => {
    const isDownloaded = downloadedSongs.some(s => s.id === song.id);
    
    if (isDownloaded) {
      setDownloadedSongs(prev => prev.filter(s => s.id !== song.id));
      await localforage.removeItem(`audio_${song.id}`);
    } else {
      if (downloadingIds[song.id]) return;
      
      setDownloadingIds(prev => ({ ...prev, [song.id]: true }));
      try {
        const response = await fetch(song.audioSrc);
        if (!response.ok) throw new Error('Download failed');
        const audioBlob = await response.blob();
        
        await localforage.setItem(`audio_${song.id}`, audioBlob);
        
        const offlineSong = {
          ...song,
          isOffline: true
        };
        
        setDownloadedSongs(prev => [...prev, offlineSong]);
      } catch (err) {
        console.error("Download Error", err);
        alert("Failed to download song. Please check your connection.");
      } finally {
        setDownloadingIds(prev => ({ ...prev, [song.id]: false }));
      }
    }
  };

  const handleBackToDiscover = () => {
    setSelectedSong(null);
  };



  return (
    <div className="app-container">
      <AnimatePresence mode="wait">
        
        {/* Auth screen bypassed */}
        
        {currentScreen === 'discover' && (
          <div key="main-app" className="discover-wrapper">
            <Discover 
              onSongSelect={handleSongSelect} 
              likedSongs={likedSongs}
              toggleLike={toggleLike}
              downloadedSongs={downloadedSongs}
              toggleDownload={toggleDownload}
              downloadingIds={downloadingIds}
            />
          </div>
        )}

      </AnimatePresence>

      <AnimatePresence>
        {selectedSong && (
          <NowPlaying 
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

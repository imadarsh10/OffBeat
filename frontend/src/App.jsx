import React, { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import localforage from 'localforage';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import Discover from './components/Discover';
import NowPlaying from './components/NowPlaying';
import { API_URL } from './config/api';
import './App.css';

const buildStreamUrl = (song) => {
  if (!song || song.isOffline) return song?.audioSrc || '';

  const audioSrc = typeof song.audioSrc === 'string' ? song.audioSrc.trim() : '';
  const hasApiUrl = typeof API_URL === 'string' && API_URL.trim().length > 0;
  const isLocalPlaybackSource = audioSrc.startsWith('blob:') || audioSrc.startsWith('data:') || (hasApiUrl && audioSrc.startsWith(API_URL));

  if (song.source === 'jiosaavn' && audioSrc.startsWith('http')) {
    return song.audioSrc;
  }

  if (isLocalPlaybackSource) {
    return song.audioSrc;
  }

  const source = song.source === 'youtube' ? 'youtube' : 'jiosaavn';
  const params = new URLSearchParams({
    id: song.id || '',
    title: song.title || '',
    artist: song.artist || '',
    source,
  });

  return `${API_URL}/api/stream?${params.toString()}`;
};

function App() {
  const [currentScreen] = useState('discover'); // auth, discover
  const [selectedSong, setSelectedSong] = useState(null);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
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
  const sharedAudioRef = useRef(null);
  const [progressTime, setProgressTime] = useState(0);
  const [progressDuration, setProgressDuration] = useState(0);

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

    if (!finalSong.isOffline) {
      finalSong = {
        ...finalSong,
        audioSrc: buildStreamUrl(finalSong),
      };
    }
    
    setSelectedSong(finalSong);
    setIsNowPlayingOpen(true);
    setPlaylist(currentPlaylist);
    const index = currentPlaylist.findIndex(s => s.id === song.id);
    setCurrentIndex(index);
    setProgressTime(0);
    setProgressDuration(0);
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
    setIsNowPlayingOpen(false);
  };

  const handleExpandPlayer = () => {
    if (selectedSong) setIsNowPlayingOpen(true);
  };

  const handleProgressUpdate = (time, dur) => {
    setProgressTime(time);
    setProgressDuration(dur);
  };

  const handleProgressSeek = (e) => {
    const bar = e.currentTarget;
    const fraction = Math.min(Math.max(e.nativeEvent.offsetX / bar.offsetWidth, 0), 1);
    if (sharedAudioRef.current && progressDuration > 0) {
      sharedAudioRef.current.currentTime = fraction * progressDuration;
    }
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

      {selectedSong && !isNowPlayingOpen && (
        <div className="mini-player" onClick={handleExpandPlayer} role="button" tabIndex={0}>
          <div
            className="mini-player-progress"
            onClick={(e) => { e.stopPropagation(); handleProgressSeek(e); }}
          >
            <div
              className="mini-player-progress-fill"
              style={{ width: progressDuration > 0 ? `${(progressTime / progressDuration) * 100}%` : '0%' }}
            />
          </div>
          <img src={selectedSong.thumbnail} alt={selectedSong.title} className={`mini-player-art ${isPlaying ? 'spinning' : ''}`} />
          <div className="mini-player-info">
            <p className="mini-player-title">{selectedSong.title}</p>
            <p className="mini-player-subtitle">{selectedSong.artist}</p>
          </div>
          <div className="mini-player-controls">
            <button
              type="button"
              className="mini-player-control-btn"
              onClick={(event) => {
                event.stopPropagation();
                handlePrev();
              }}
              aria-label="Previous song"
            >
              <SkipBack size={18} fill="currentColor" />
            </button>

            <button
              type="button"
              className="mini-player-control-btn mini-player-play-btn"
              onClick={(event) => {
                event.stopPropagation();
                if (sharedAudioRef.current) {
                  if (isPlaying) {
                    sharedAudioRef.current.pause();
                  } else {
                    sharedAudioRef.current.play();
                  }
                }
              }}
              aria-label={isPlaying ? 'Pause song' : 'Play song'}
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ transform: 'translateX(1px)' }} />}
            </button>

            <button
              type="button"
              className="mini-player-control-btn"
              onClick={(event) => {
                event.stopPropagation();
                handleNext();
              }}
              aria-label="Next song"
            >
              <SkipForward size={18} fill="currentColor" />
            </button>
          </div>
          <span className="mini-player-status">Playing</span>
        </div>
      )}

      {selectedSong && (
        <NowPlaying 
          song={selectedSong}
          isOpen={isNowPlayingOpen}
          onBack={handleBackToDiscover}
          onNext={handleNext}
          onPrev={handlePrev}
          likedSongs={likedSongs}
          onToggleLike={() => toggleLike(selectedSong)}
          onPlaybackChange={(state) => setIsPlaying(state)}
          audioRef={sharedAudioRef}
          onTimeUpdate={handleProgressUpdate}
        />
      )}
    </div>
  );
}

export default App;

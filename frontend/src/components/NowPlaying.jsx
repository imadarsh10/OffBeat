import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Share2, Play, Pause, SkipBack, SkipForward, Repeat, Volume2, VolumeX, Volume1, Volume, Heart, Disc, Shuffle } from 'lucide-react';
import { API_URL } from '../config/api';

import './NowPlaying.css';

const NowPlaying = ({ song, onBack, onNext, onPrev, likedSongs, onToggleLike }) => {


  const [isPlaying, setIsPlaying] = useState(true);
  const isLiked = likedSongs.some(s => s.id === song.id);

  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackMode, setPlaybackMode] = useState('normal'); // 'normal', 'shuffle', 'loop'
  const [volume, setVolume] = useState(0.8);
  const [prevVolume, setPrevVolume] = useState(0.8);
  const [showVolume, setShowVolume] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowVolume(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const audioRef = useRef(null);

  const lyricsContainerRef = useRef(null);

  const songSeed = useMemo(() => {
    const id = String(song.id || 'default');
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }, [song.id]);

  const seeded = (seed, index, offset) => {
    const x = Math.sin(seed * 0.001 + (index + 1) * 12.9898 + offset * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  const waveformBars = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        playingHeights: [
          seeded(songSeed, i, 1) * 40 + 5,
          seeded(songSeed, i, 2) * 40 + 5,
          seeded(songSeed, i, 3) * 40 + 5,
        ],
        idleHeight: seeded(songSeed, i, 4) * 20 + 5,
        animDuration: 0.5 + seeded(songSeed, i, 5),
      })),
    [songSeed]
  );


  // Reset state when song changes
  useEffect(() => {
    setCurrentTime(0);
    
    if (song.duration && typeof song.duration === 'string') {
      const parts = song.duration.split(':');
      let parsedSecs = 0;
      if (parts.length === 2) {
        parsedSecs = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      } else if (parts.length === 3) {
        parsedSecs = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
      }
      setDuration(parsedSecs > 0 ? parsedSecs : 0);
    } else {
      setDuration(0);
    }
    
    setIsPlaying(true);
    setLyrics('');
    setShowLyrics(false);
  }, [song.id, song.duration]);

  // Fetch lyrics when needed
  useEffect(() => {
    if (showLyrics && !lyrics) {
      const url = new URL(`${API_URL}/api/lyrics/${song.id}`);
      url.searchParams.append('title', song.title);
      url.searchParams.append('artist', song.artist);
      
      fetch(url)
        .then(res => res.json())
        .then(data => setLyrics(data.lyrics || 'No lyrics available.'))
        .catch(() => setLyrics('Failed to load lyrics.'));
    }
  }, [showLyrics, song.id, lyrics, song.title, song.artist]);


  const parseSyncedLyrics = (lyricsText) => {
    if (!lyricsText) return [];
    const lines = lyricsText.split('\n');
    const syncedLines = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    lines.forEach(line => {
      const match = timeRegex.exec(line);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const ms = parseInt(match[3]);
        const time = minutes * 60 + seconds + (ms / 1000);
        const text = line.replace(timeRegex, '').trim();
        if (text) syncedLines.push({ time, text });
      }
    });

    return syncedLines.length > 0 ? syncedLines : null;
  };

  const syncedLyrics = parseSyncedLyrics(lyrics);

  // Auto-scroll lyrics
  useEffect(() => {
    if (showLyrics && syncedLyrics && lyricsContainerRef.current) {
        const activeLine = syncedLyrics.findLast(l => l.time <= currentTime);
        if (activeLine) {
            const index = syncedLyrics.indexOf(activeLine);
            const lineElement = lyricsContainerRef.current.children[index];
            if (lineElement) {
                lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
  }, [currentTime, showLyrics, syncedLyrics]);


  // Handle playback control and song changes
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        // Ensure the source is loaded and then play
        const playAudio = async () => {
          try {
            await audioRef.current.play();
          } catch (err) {
            console.warn("Autoplay failed/prevented:", err);
            // Don't force isPlaying to false if it was just a transient fetch error
            // but if it's a permission error, we should probably reflect it
            if (err.name === 'NotAllowedError') {
              setIsPlaying(false);
            }
          }
        };
        playAudio();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, song.id]);

  // Handle time updates
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    if (playbackMode === 'loop') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      onNext(playbackMode === 'shuffle');
    }
  };

  const togglePlaybackMode = () => {
    const modes = ['normal', 'shuffle', 'loop'];
    const nextIndex = (modes.indexOf(playbackMode) + 1) % modes.length;
    setPlaybackMode(modes[nextIndex]);
  };


  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) setPrevVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const volumeAnimRef = useRef(null);

  const toggleMute = () => {
    if (volumeAnimRef.current) cancelAnimationFrame(volumeAnimRef.current);
    
    let startVol = volume;
    let targetVol = 0;
    
    if (startVol > 0) {
        setPrevVolume(startVol);
        targetVol = 0;
    } else {
        targetVol = prevVolume > 0 ? prevVolume : 0.8;
    }
    
    const duration = 400; // ms
    const startTime = performance.now();
    
    const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    
    const animateVol = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOut(progress);
        
        const currentVol = startVol + (targetVol - startVol) * eased;
        
        setVolume(currentVol);
        if (audioRef.current) audioRef.current.volume = currentVol;
        
        if (progress < 1) {
            volumeAnimRef.current = requestAnimationFrame(animateVol);
        } else {
            volumeAnimRef.current = null;
        }
    };
    
    volumeAnimRef.current = requestAnimationFrame(animateVol);
  };


  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration;
      if (audioDuration !== Infinity && !isNaN(audioDuration) && audioDuration > 0) {
        setDuration(audioDuration);
      }
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!song) return null;

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 200 }}
      className="now-playing-screen"
    >
      <div className="background-blur" style={{ backgroundImage: `url(${song.thumbnail})` }}></div>
      
      <div className="main-content">
        <header className="header">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className="glass-btn"
            >
              <div className="btn-inner">
                <ChevronLeft size={24} />
              </div>
            </motion.button>
            
            <h2>Now Playing</h2>
          
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowLyrics(!showLyrics)}
            className={`glass-btn ${showLyrics ? 'active' : ''}`}
          >
            <div className="btn-inner">
              <Disc size={20} className={showLyrics ? 'rotating' : ''} />
            </div>
          </motion.button>


        </header>

        <div className="player-body">
          <AnimatePresence mode="wait">
            {!showLyrics ? (
              <motion.div 
                key="artwork"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="art-section"
              >
                <motion.div 
                  className={`art-container ${isPlaying ? 'playing' : ''}`}
                >
                  <div className="vinyl-grooves"></div>
                  <img src={song.thumbnail} alt={song.title} />
                  <div className="center-hole"></div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                key="lyrics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="lyrics-section glass"
              >
                <div className="lyrics-content" ref={lyricsContainerRef}>
                  {syncedLyrics ? syncedLyrics.map((line, i) => {
                    const isActive = i === syncedLyrics.findLastIndex(l => l.time <= currentTime);
                    return (
                        <p key={i} className={isActive ? 'active-lyric' : 'dim-lyric'}>
                            {line.text}
                        </p>
                    );
                  }) : lyrics ? lyrics.split('\n').map((line, i) => (
                    <p key={i}>{line || <br />}</p>
                  )) : <div className="loading-lyrics">Fetching lyrics...</div>}
                </div>
              </motion.div>

            )}
          </AnimatePresence>
        </div>

        <div className="song-info-section">
            <div className="title-row">
                <div className="info">
                    <motion.h3 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        key={song.id + '-title'}
                    >
                        {song.title}
                    </motion.h3>
                    <motion.p 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        key={song.id + '-artist'}
                    >
                        {song.artist} {song.year ? `• ${song.year}` : ''}
                    </motion.p>
                    <motion.p 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="album-name"
                        key={song.id + '-album'}
                    >
                        {song.album}
                    </motion.p>
                </div>
                <motion.button 
                    whileTap={{ scale: 0.8 }}
                    onClick={onToggleLike}
                    className={`like-btn ${isLiked ? 'liked' : ''}`}
                    style={{ background: 'none', border: 'none' }}
                >

                    <Heart size={28} fill={isLiked ? "#ff8c00" : "none"} />
                </motion.button>
            </div>
        </div>

        <div className="visualizer-section">
          <div className="waveform-container">
          {waveformBars.map((bar, i) => (
                <motion.div 
                    key={i} 
                    className="wave-bar" 
                    animate={{ 
                        height: isPlaying 
                  ? bar.playingHeights
                  : bar.idleHeight
                    }}
                    transition={{ 
                        repeat: Infinity, 
                duration: bar.animDuration,
                        ease: "easeInOut"
                    }}
                    style={{ 
                        background: i < (currentTime / duration) * 60 ? '#ff8c00' : 'rgba(255,255,255,0.15)',
                        opacity: i < (currentTime / duration) * 60 ? 1 : 0.5
                    }}
                />
            ))}
          </div>
          <div className="time-labels">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="progress-bar-container">
            <input 
              type="range" 
              min="0" 
              max={duration || 0} 
              value={currentTime} 
              onChange={(e) => {
                const time = parseFloat(e.target.value);
                setCurrentTime(time);
                if (audioRef.current) audioRef.current.currentTime = time;
              }}
              className="seek-bar"
              style={{ '--progress-percent': `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>

        <div className="player-controls">
          <audio 
            ref={audioRef}
            src={song.audioSrc} 
            autoPlay
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleAudioEnded}
          />
          <div className="ctrl-group">
            <button 
                className={`ctrl-btn-small ${playbackMode !== 'normal' ? 'active' : ''}`} 
                onClick={togglePlaybackMode}
                style={{ background: 'none', border: 'none' }}
                title={`Mode: ${playbackMode}`}
            >
                {playbackMode === 'shuffle' ? <Shuffle size={20} /> : <Repeat size={20} />}
                {playbackMode === 'loop' && <span className="mode-badge">1</span>}
            </button>
          </div>


          <button 
            className="ctrl-btn-medium" 
            onClick={onPrev}
            style={{ background: 'none', border: 'none' }}
          >
            <SkipBack size={32} fill="white" />
          </button>
          
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsPlaying(!isPlaying)}
            className="play-btn-large"
            style={{ border: 'none' }}
          >
            <div className="btn-inner">
              {isPlaying ? <Pause size={36} fill="black" /> : <Play size={36} fill="black" style={{ transform: 'translateX(2px)' }} />}
            </div>
          </motion.button>
          
          <button 
            className="ctrl-btn-medium" 
            onClick={() => onNext(playbackMode === 'shuffle')}
            style={{ background: 'none', border: 'none' }}
          >

            <SkipForward size={32} fill="white" />
          </button>

          <div className="volume-control-wrapper" 
               onMouseEnter={() => setShowVolume(true)} 
               onMouseLeave={() => setShowVolume(false)}>
            <AnimatePresence>
                {showVolume && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="volume-slider-popover glass"
                    >
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.01" 
                            value={volume} 
                            onChange={handleVolumeChange}
                            className="volume-slider"
                            style={{ '--volume-percent': `${volume * 100}%` }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.button 
              className="ctrl-btn-small" 
              style={{ background: 'none', border: 'none' }}
              onClick={toggleMute}
              whileTap={{ scale: 0.8 }}
              transition={{ ease: "easeInOut", duration: 0.2 }}
            >
                {volume === 0 ? <VolumeX size={20} /> : volume < 0.5 ? <Volume1 size={20} /> : <Volume2 size={20} />}
            </motion.button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default NowPlaying;

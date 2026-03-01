import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Share2, Play, Pause, SkipBack, SkipForward, Repeat, Volume2, VolumeX, Volume1, Volume, Heart, Disc, Timer, Moon, Shuffle } from 'lucide-react';


import './NowPlaying.css';

const NowPlaying = ({ song, onBack, onNext, onPrev, likedSongs, onToggleLike }) => {


  const [isPlaying, setIsPlaying] = useState(true);
  const isLiked = likedSongs.some(s => s.id === song.id);

  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sleepTimer, setSleepTimer] = useState(null); // time in minutes
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState(null); // seconds
  const [playbackMode, setPlaybackMode] = useState('normal'); // 'normal', 'shuffle', 'loop'
  const [volume, setVolume] = useState(0.8);
  const [showVolume, setShowVolume] = useState(false);

  const audioRef = useRef(null);

  const lyricsContainerRef = useRef(null);


  // Reset state when song changes
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);
    setLyrics('');
    setShowLyrics(false);
  }, [song.id]);

  // Fetch lyrics when needed
  useEffect(() => {
    if (showLyrics && !lyrics) {
      const url = new URL(`http://localhost:5000/api/lyrics/${song.id}`);
      url.searchParams.append('title', song.title);
      url.searchParams.append('artist', song.artist);
      
      fetch(url)
        .then(res => res.json())
        .then(data => setLyrics(data.lyrics || 'No lyrics available.'))
        .catch(() => setLyrics('Failed to load lyrics.'));
    }
  }, [showLyrics, song.id, lyrics, song.title, song.artist]);

  // Handle Sleep Timer
  useEffect(() => {
    let interval;
    if (sleepTimeRemaining !== null && sleepTimeRemaining > 0 && isPlaying) {
      interval = setInterval(() => {
        setSleepTimeRemaining(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            setSleepTimer(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (sleepTimeRemaining === 0) {
      setIsPlaying(false);
      setSleepTimeRemaining(null);
      setSleepTimer(null);
    }
    return () => clearInterval(interval);
  }, [sleepTimeRemaining, isPlaying]);

  const toggleSleepTimer = () => {
    if (sleepTimer === null) {
      setSleepTimer(15);
      setSleepTimeRemaining(15 * 60);
    } else if (sleepTimer === 15) {
      setSleepTimer(30);
      setSleepTimeRemaining(30 * 60);
    } else if (sleepTimer === 30) {
      setSleepTimer(60);
      setSleepTimeRemaining(60 * 60);
    } else {
      setSleepTimer(null);
      setSleepTimeRemaining(null);
    }
  };

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


  // Sync play/pause state
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Playback error:", error);
            setIsPlaying(false);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, song]);

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
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };


  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
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
          
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={toggleSleepTimer}
            className={`glass-btn ${sleepTimer ? 'active' : ''}`}
          >
            <div className="btn-inner">
              {sleepTimeRemaining ? 
                <span className="timer-text" style={{ fontSize: '0.7rem', fontWeight: '800' }}>{Math.ceil(sleepTimeRemaining / 60)}m</span> : 
                <Moon size={20} />
              }
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
            {[...Array(60)].map((_, i) => (
                <motion.div 
                    key={i} 
                    className="wave-bar" 
                    animate={{ 
                        height: isPlaying 
                            ? [Math.random() * 40 + 5, Math.random() * 40 + 5, Math.random() * 40 + 5] 
                            : Math.random() * 20 + 5 
                    }}
                    transition={{ 
                        repeat: Infinity, 
                        duration: 0.5 + Math.random(),
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
            />
          </div>
        </div>

        <div className="player-controls">
          <audio 
            ref={audioRef}
            src={song.audioSrc} 
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
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            <button className="ctrl-btn-small" style={{ background: 'none', border: 'none' }}>
                {volume === 0 ? <VolumeX size={20} /> : volume < 0.5 ? <Volume1 size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default NowPlaying;

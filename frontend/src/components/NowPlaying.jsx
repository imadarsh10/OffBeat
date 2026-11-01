/* eslint-disable react/prop-types */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Repeat, Heart, Disc, Shuffle } from 'lucide-react';
import { API_URL } from '../config/api';

import './NowPlaying.css';

// Display-only cleanup: decode HTML entities and strip YouTube/video cruft
// so title + singer look clean. Does not touch playback / stream logic.
const decodeHtmlEntities = (value) => {
  if (typeof value !== 'string' || !value) return '';
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#38;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&#60;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#62;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&#(\d+);/g, (_, code) => {
      const n = Number.parseInt(code, 10);
      return Number.isNaN(n) ? '' : String.fromCharCode(n);
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));
};

const cleanTitle = (value) => {
  let text = decodeHtmlEntities(value).replace(/\s+/g, ' ').trim();
  if (!text) return 'Unknown Title';
  // YouTube video titles often append " | Channel / feat ..." — keep the song part.
  if (text.includes(' | ')) {
    const first = text.split(' | ')[0].trim();
    if (first.length >= 3) text = first;
  }
  // Strip "(Official Video / Audio / Lyric ...)", "[4K / HD ...]" tags.
  text = text
    // eslint-disable-next-line no-useless-escape
    .replace(/\s*[([][^()[\]]*(official\s*(music\s*)?(video|audio|lyric(s)?|visualizer)|lyric(s)?\s*video|audio\s*only|video\s*song|4k|hd|hq)[^()[\]]*[)\]]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Remove trailing dash junk like " - 4K Video Song"
  text = text.replace(/\s*-\s*(4k|hd|hq|official|full\s*(video|audio|song|hd)).*$/i, '').trim();
  return text || 'Unknown Title';
};

const cleanArtist = (value) => {
  let text = decodeHtmlEntities(value).replace(/\s+/g, ' ').trim();
  if (!text) return 'Unknown Artist';
  text = text
    .replace(/\s*-\s*Topic$/i, '')
    .replace(/\bVEVO\b/gi, '')
    .replace(/\bOfficial\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    // eslint-disable-next-line no-useless-escape
    .replace(/^[,\-–•|]+|[,\-–•|]+$/g, '')
    .trim();
  // Keep it to a readable length without cutting mid-word harshly.
  const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length > 2) text = parts.slice(0, 2).join(', ');
  if (text.length > 48) text = `${text.slice(0, 47).trim()}…`;
  return text || 'Unknown Artist';
};

const cleanAlbum = (value) => {
  const text = decodeHtmlEntities(value).replace(/\s+/g, ' ').trim();
  return text || 'Single';
};

// eslint-disable-next-line sonarjs/cognitive-complexity
const NowPlaying = ({ song, isOpen = true, onBack, onNext, onPrev, likedSongs, onToggleLike, onPlaybackChange, audioRef, onTimeUpdate }) => {


  const [isPlaying, setIsPlaying] = useState(true);
  const isLiked = likedSongs.some(s => s.id === song.id);
  const [activeAudioSrc, setActiveAudioSrc] = useState(song.audioSrc || '');
  const [hasRetriedSource, setHasRetriedSource] = useState(false);
  const [playbackError, setPlaybackError] = useState('');

  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackMode, setPlaybackMode] = useState('normal'); // 'normal', 'shuffle', 'loop'

  const lastReportedTime = useRef(-1);

  const lyricsContainerRef = useRef(null);

  const songSeed = useMemo(() => {
    const id = String(song.id || 'default');
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
      hash = Math.trunc((hash << 5) - hash + (id.codePointAt(i) || 0));
    }
    return Math.abs(hash);
  }, [song.id]);

  const plainLyricsLines = useMemo(() => {
    if (!lyrics) return [];
    const counts = new Map();
    return lyrics.split('\n').map((line) => {
      const seen = (counts.get(line) || 0) + 1;
      counts.set(line, seen);
      return {
        key: `${line || 'blank'}-${seen}`,
        text: line,
      };
    });
  }, [lyrics]);

  const buildFallbackStreamUrl = (track) => {
    const directAudioSrc = typeof track.audioSrc === 'string' ? track.audioSrc.trim() : '';
    if (track.source === 'jiosaavn' && directAudioSrc.startsWith('http')) {
      return track.audioSrc;
    }

    const source = track.source === 'youtube' ? 'youtube' : 'jiosaavn';
    const baseUrl = (typeof API_URL === 'string' && API_URL.trim().length > 0)
      ? `${API_URL}/api/stream`
      : '/api/stream';
    const url = new URL(baseUrl, window.location.origin);
    url.searchParams.set('id', track.id || '');
    url.searchParams.set('title', track.title || '');
    url.searchParams.set('artist', track.artist || '');
    url.searchParams.set('source', source);
    return url.toString();
  };

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
    setActiveAudioSrc(song.audioSrc || '');
    setHasRetriedSource(false);
    setPlaybackError('');
    
    if (song.duration && typeof song.duration === 'string') {
      const parts = song.duration.split(':');
      let parsedSecs = 0;
      if (parts.length === 2) {
        parsedSecs = Number.parseInt(parts[0], 10) * 60 + Number.parseInt(parts[1], 10);
      } else if (parts.length === 3) {
        parsedSecs = Number.parseInt(parts[0], 10) * 3600 + Number.parseInt(parts[1], 10) * 60 + Number.parseInt(parts[2], 10);
      }
      setDuration(Math.max(parsedSecs, 0));
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
        const minutes = Number.parseInt(match[1], 10);
        const seconds = Number.parseInt(match[2], 10);
        const ms = Number.parseInt(match[3], 10);
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


  // Auto-play when song or audio source changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const tryPlay = async () => {
      audio.pause();
      audio.load();
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    };

    const onReady = () => tryPlay();
    audio.addEventListener('loadeddata', onReady, { once: true });
    tryPlay();

    return () => {
      audio.removeEventListener('loadeddata', onReady);
      audio.pause();
    };
  }, [song.id, activeAudioSrc]);

  // Notify parent about playback state changes so UI (mini-player) can reflect it
  useEffect(() => {
    if (typeof onPlaybackChange === 'function') {
      try {
        onPlaybackChange(Boolean(isPlaying));
      } catch (err) {
        console.warn('onPlaybackChange handler error', err);
      }
    }
  }, [isPlaying, onPlaybackChange]);

  // Handle time updates
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      if (typeof onTimeUpdate === 'function' && Math.abs(time - lastReportedTime.current) >= 0.25) {
        lastReportedTime.current = time;
        onTimeUpdate(time, audioRef.current.duration || 0);
      }
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


  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration;
      if (audioDuration !== Infinity && !Number.isNaN(audioDuration) && audioDuration > 0) {
        setDuration(audioDuration);
        if (typeof onTimeUpdate === 'function') {
          onTimeUpdate(currentTime, audioDuration);
        }
      }
    }
  };

  const handleAudioError = () => {
    if (!song.isOffline && !hasRetriedSource) {
      const fallbackUrl = buildFallbackStreamUrl(song);
      const separator = fallbackUrl.includes('?') ? '&' : '?';
      const retryUrl = `${fallbackUrl}${separator}retry=${Date.now()}`;
      setHasRetriedSource(true);
      setActiveAudioSrc(activeAudioSrc === fallbackUrl ? retryUrl : fallbackUrl);
      setIsPlaying(true);
      return;
    }

    setPlaybackError('The audio stream could not be loaded.');
    setIsPlaying(false);
  };

  const handlePlayPauseClick = async () => {
    setPlaybackError('');

    if (!audioRef.current) {
      setIsPlaying(false);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    try {
      audioRef.current.load();
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn('Playback start failed:', err);
      setPlaybackError('Playback could not start. Please tap play again or try another track.');
      setIsPlaying(false);
    }
  };

  const formatTime = (time) => {
    if (Number.isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isAltPlaybackMode = playbackMode === 'shuffle' || playbackMode === 'loop';

  const displayTitle = cleanTitle(song?.title);
  const displayArtist = cleanArtist(song?.artist);
  const displayAlbum = cleanAlbum(song?.album);

  if (!song) return null;

  return (
    <motion.div 
      initial={false}
      animate={{ y: isOpen ? 0 : '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 200 }}
      className="now-playing-screen"
      style={{ pointerEvents: isOpen ? 'auto' : 'none', zIndex: isOpen ? 1300 : 990 }}
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
                <ChevronDown size={24} />
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
            {showLyrics ? (
              <motion.div 
                key="lyrics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="lyrics-section glass"
              >
                <div className="lyrics-content" ref={lyricsContainerRef}>
                  {syncedLyrics && syncedLyrics.length > 0 && syncedLyrics.map((line) => {
                    const isActive = line.time <= currentTime
                      && line.time === syncedLyrics.findLast((l) => l.time <= currentTime)?.time;
                    return (
                      <p key={`${line.time}-${line.text}`} className={isActive ? 'active-lyric' : 'dim-lyric'}>
                        {line.text}
                      </p>
                    );
                  })}

                  {!syncedLyrics && plainLyricsLines.length > 0 && plainLyricsLines.map((line) => (
                    <p key={line.key}>{line.text || <br />}</p>
                  ))}

                  {!syncedLyrics && plainLyricsLines.length === 0 && (
                    <div className="loading-lyrics">Fetching lyrics...</div>
                  )}
                </div>
              </motion.div>
            ) : (
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
                        className="song-title"
                        title={displayTitle}
                    >
                        {displayTitle}
                    </motion.h3>
                    <motion.p 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        key={song.id + '-artist'}
                        className="song-artist"
                        title={displayArtist}
                    >
                        {displayArtist} {song.year ? `• ${song.year}` : ''}
                    </motion.p>
                    <motion.p 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="album-name"
                        key={song.id + '-album'}
                        title={displayAlbum}
                    >
                        {displayAlbum}
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
                key={`${bar.animDuration}-${bar.idleHeight}-${bar.playingHeights.join('-')}`} 
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
                const time = Number.parseFloat(e.target.value);
                setCurrentTime(time);
                if (audioRef.current) audioRef.current.currentTime = time;
              }}
              className="seek-bar"
              style={{ '--progress-percent': `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>

        <div className="player-controls">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio 
            ref={audioRef}
            src={activeAudioSrc} 
            onPlaying={() => {
              setPlaybackError('');
              setIsPlaying(true);
            }}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleAudioEnded}
            onError={handleAudioError}
          />
          <div className="ctrl-group">
            <button 
                className={`ctrl-btn-small ${isAltPlaybackMode ? 'active' : ''}`} 
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
            onClick={handlePlayPauseClick}
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

          <motion.button 
            className={`ctrl-btn-small ${playbackMode === 'shuffle' ? 'active' : ''}`}
            style={{ background: 'none', border: 'none' }}
            onClick={() => onNext(true)}
            title="Shuffle playback"
            whileTap={{ scale: 0.8 }}
            transition={{ ease: 'easeIn', duration: 0.22 }}
          >
            <Shuffle size={20} />
          </motion.button>
        </div>

        {playbackError && (
          <div className="playback-error" role="status" aria-live="polite">
            {playbackError}
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default NowPlaying;

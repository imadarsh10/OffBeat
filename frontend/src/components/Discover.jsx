import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, MoreHorizontal, Home, Library, Disc, Music, User, TrendingUp, Clock, Heart, Download, ChevronLeft, Github, Linkedin, Youtube, ListMusic, Import, Share2 } from 'lucide-react';
import { API_URL } from '../config/api';
import ImportModal from './ImportModal';

import './Discover.css';

const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <div className={`nav-pill ${active ? 'active' : ''}`} onClick={onClick}>
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    <span>{label}</span>
  </div>
);

const SectionHeader = ({ icon: Icon, title, showSeeMore }) => (
  <div className="section-header">
    <div className="title-with-icon">
      <Icon size={24} color="#ff8c00" />
      <h2>{title}</h2>
    </div>
    {showSeeMore && <button className="see-more">Explore All</button>}
  </div>
);

// Resets a carousel to its first item without animating the whole strip
// backwards (the element has `scroll-behavior: smooth`, so the jump has to be
// forced to be instant).
const jumpCarouselToStart = (carousel) => {
  if (!carousel) return;

  if (typeof carousel.scrollTo === 'function') {
    carousel.scrollTo({ left: 0, behavior: 'instant' });
  } else {
    carousel.scrollLeft = 0;
  }

  if (carousel.scrollLeft !== 0) {
    const previousBehavior = carousel.style.scrollBehavior;
    carousel.style.scrollBehavior = 'auto';
    carousel.scrollLeft = 0;
    carousel.style.scrollBehavior = previousBehavior;
  }
};

const Discover = ({ onSongSelect, likedSongs, toggleLike, downloadedSongs, toggleDownload, downloadingIds = {} }) => {

  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [isPlaylistDetailOpen, setIsPlaylistDetailOpen] = useState(false);
  const [importedPlaylists, setImportedPlaylists] = useState(() => {
    const saved = localStorage.getItem('importedYouTubePlaylists');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchSource, setSearchSource] = useState('jiosaavn'); // 'jiosaavn' or 'youtube'
  const [activeMenuId, setActiveMenuId] = useState(null); // Track which song's menu is open
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importModalType, setImportModalType] = useState('spotify');
  const [carouselPaused, setCarouselPaused] = useState(false); // Pause carousel while user interacts
  const [isMobileView, setIsMobileView] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches);
  const [loopCopies, setLoopCopies] = useState(1); // Extra card sets rendered to keep the loop scrollable
  const [quickPickCount, setQuickPickCount] = useState(4); // Cards rendered in Quick Picks, sized to fill the row
  const quickPickStart = Math.min(quickPickCount, Math.max(0, songs.length - 10));
  const quickPickSongs = songs.slice(quickPickStart, quickPickStart + 10);
  const carouselRef = useRef(null);
  const searchInputRef = useRef(null);
  const carouselLoopResetRef = useRef(null);
  const carouselResumeRef = useRef(null);
  const quickPicksRef = useRef(null);
  const songsGridRef = useRef(null);

  const handleImportSuccess = (tracks, title) => {
    const playlist = {
      id: 'imported_' + Date.now(),
      title: title,
      artist: 'Imported Playlist',
      coverArt: tracks[0]?.thumbnail || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80',
      songs: tracks
    };
    setImportedPlaylists(prev => [playlist, ...prev]);
    setSelectedAlbum(null);
    setIsPlaylistDetailOpen(false);
    setActiveTab('library');
  };

  useEffect(() => {
    localStorage.setItem('importedYouTubePlaylists', JSON.stringify(importedPlaylists));
  }, [importedPlaylists]);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const handleChange = (event) => setIsMobileView(event.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);



  const fetchTrending = async () => {
    setLoading(true);
    setError(null);
    try {
      const [songsRes, albumsRes] = await Promise.all([
        fetch(`${API_URL}/api/trending`).then(res => {
          if (!res.ok) throw new Error('Failed to fetch trending songs');
          return res.json();
        }),
        fetch(`${API_URL}/api/albums`).then(res => {
          if (!res.ok) throw new Error('Failed to fetch albums');
          return res.json();
        })
      ]);
      setSongs(songsRes);
      setAlbums(albumsRes);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Could not connect to the music server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Faster debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmedQuery = searchQuery.trim();
      if (trimmedQuery.length >= 2) {
        setLoading(true);
        setError(null);
        try {
          console.log(`[Search] Query: "${trimmedQuery}" | Source: ${searchSource}`);
          const res = await fetch(`${API_URL}/api/search?query=${encodeURIComponent(trimmedQuery)}&source=${searchSource}`);

          if (!res.ok) {
            throw new Error(`Search failed with status ${res.status}`);
          }

          const data = await res.json();

          if (!data.songs || data.songs.length === 0) {
            setError(`No results found for "${trimmedQuery}" on ${searchSource === 'youtube' ? 'YouTube' : 'JioSaavn'}`);
          } else {
            setError(null);
          }

          setSongs(data.songs || []);
          setAlbums(data.albums || []);
          setSelectedAlbum(null); // Clear album view on new search
        } catch (err) {
          console.error('[Search Error]', err);
          setError(`Failed to search on ${searchSource === 'youtube' ? 'YouTube' : 'JioSaavn'}: ${err.message}`);
          setSongs([]);
          setAlbums([]);
        } finally {
          setLoading(false);
        }
      } else if (trimmedQuery.length === 0) {
        fetchTrending();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchSource]);


  const handleAlbumClick = async (album) => {
    // For YouTube "Featured" cards or songs in carousel, play directly
    if (album.type === 'Featured' || album.source === 'youtube' || !album.type || album.type === 'song') {
      const songToPlay = {
        ...album,
        thumbnail: album.coverArt || album.thumbnail,
        // Ensure audioSrc exists if it was hidden in album object
        audioSrc: album.audioSrc || `${API_URL}/api/stream?id=${album.id}&title=${encodeURIComponent(album.title)}&artist=${encodeURIComponent(album.artist)}`
      };
      onSongSelect(songToPlay, songs);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/albums/${album.id}`);
      if (!res.ok) throw new Error('Failed to fetch album details');
      const data = await res.json();
      setSelectedAlbum(data);
    } catch (err) {
      console.error('Album selection error:', err);
      setError('Could not load album songs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();

    // Close menus on click outside
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Measures the real step (card width + gap) from the DOM so the auto-scroll
  // stays correct on every breakpoint instead of relying on hardcoded widths.
  const measureCarousel = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel) return null;

    const card = carousel.querySelector('.trending-card');
    if (!card) return null;

    const styles = window.getComputedStyle(carousel);
    const gap = parseFloat(styles.columnGap) || parseFloat(styles.gap) || 0;
    const step = card.getBoundingClientRect().width + gap;
    if (!step) return null;

    return {
      step,
      singleSetWidth: step * albums.length,
      maxScrollLeft: carousel.scrollWidth - carousel.clientWidth
    };
  }, [albums.length]);

  const scrollCarouselByStep = useCallback(() => {
    const carousel = carouselRef.current;
    const metrics = measureCarousel();
    if (!carousel || !metrics || metrics.maxScrollLeft <= 0) return;

    const { step, singleSetWidth } = metrics;

    if (carouselLoopResetRef.current) {
      clearTimeout(carouselLoopResetRef.current);
      carouselLoopResetRef.current = null;
    }

    if (carousel.scrollLeft + step >= singleSetWidth) {
      jumpCarouselToStart(carousel);
      carouselLoopResetRef.current = setTimeout(() => {
        carouselLoopResetRef.current = null;
        carousel.scrollBy({ left: step, behavior: 'smooth' });
      }, 60);
      return;
    }

    carousel.scrollBy({ left: step, behavior: 'smooth' });
  }, [measureCarousel]);

  // Quick Picks is an auto-fill grid, so it always reserves as many columns as
  // the width allows. Render one card per column to avoid a blank right side.
  useEffect(() => {
    const updateQuickPickCount = () => {
      const grid = quickPicksRef.current;
      if (!grid) return;

      const columns = window
        .getComputedStyle(grid)
        .gridTemplateColumns.split(' ')
        .filter(Boolean).length;
      if (!columns) return;

      setQuickPickCount((current) => {
        const next = Math.min(Math.max(columns, 4), 10);
        return next === current ? current : next;
      });
    };

    updateQuickPickCount();
    window.addEventListener('resize', updateQuickPickCount);
    return () => window.removeEventListener('resize', updateQuickPickCount);
  }, [activeTab, selectedAlbum, songs.length]);

  // Wide desktop viewports can fit the whole strip without overflowing, which
  // leaves the loop with nowhere to scroll. Render enough copies to overflow.
  useEffect(() => {
    const updateLoopCopies = () => {
      const carousel = carouselRef.current;
      if (!carousel || albums.length === 0) return;

      const card = carousel.querySelector('.trending-card');
      if (!card) return;

      const styles = window.getComputedStyle(carousel);
      const gap = parseFloat(styles.columnGap) || parseFloat(styles.gap) || 0;
      const step = card.getBoundingClientRect().width + gap;
      const singleSetWidth = step * albums.length;
      if (!singleSetWidth) return;

      const needed = Math.ceil((carousel.clientWidth * 1.2) / singleSetWidth);
      setLoopCopies(Math.min(Math.max(needed, 1), 3));
    };

    updateLoopCopies();
    window.addEventListener('resize', updateLoopCopies);
    return () => window.removeEventListener('resize', updateLoopCopies);
  }, [albums.length]);

  useEffect(() => {
    if (!carouselRef.current || albums.length === 0 || carouselPaused) return;

    const interval = setInterval(scrollCarouselByStep, 4000);

    return () => {
      clearInterval(interval);
      if (carouselLoopResetRef.current) {
        clearTimeout(carouselLoopResetRef.current);
        carouselLoopResetRef.current = null;
      }
    };
  }, [albums.length, carouselPaused, scrollCarouselByStep]);

  // Stop auto-scrolling while the tab is in the background.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setCarouselPaused(true);
        return;
      }
      if (carouselResumeRef.current) {
        clearTimeout(carouselResumeRef.current);
        carouselResumeRef.current = null;
      }
      setCarouselPaused(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto-scroll only yields while the user is actively scrolling/dragging the
  // carousel, then resumes on its own.
  const handleCarouselInteract = () => {
    setCarouselPaused(true);
    if (carouselResumeRef.current) clearTimeout(carouselResumeRef.current);
    carouselResumeRef.current = setTimeout(() => {
      carouselResumeRef.current = null;
      setCarouselPaused(false);
    }, 1200);
  };

  // Desktop: vertical wheel moves horizontal strips, plus mouse-drag to scroll.
  // No arrows — pure horizontal scroll. Re-attaches when lists change.
  useEffect(() => {
    const attachHorizontalScroll = (el, onInteract) => {
      if (!el) return () => {};
      const onWheel = (e) => {
        const canScroll = el.scrollWidth > el.clientWidth + 1;
        if (!canScroll) return;
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
          if (onInteract) onInteract();
        }
      };
      el.addEventListener('wheel', onWheel, { passive: false });

      let isDown = false;
      let startX = 0;
      let startScroll = 0;
      const onPointerDown = (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        isDown = true;
        startX = e.clientX;
        startScroll = el.scrollLeft;
      };
      const onPointerMove = (e) => {
        if (!isDown) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 4) {
          el.scrollLeft = startScroll - dx;
          if (onInteract) onInteract();
        }
      };
      const endDrag = () => { isDown = false; };
      el.addEventListener('pointerdown', onPointerDown);
      el.addEventListener('pointermove', onPointerMove);
      el.addEventListener('pointerup', endDrag);
      el.addEventListener('pointercancel', endDrag);
      return () => {
        el.removeEventListener('wheel', onWheel);
        el.removeEventListener('pointerdown', onPointerDown);
        el.removeEventListener('pointermove', onPointerMove);
        el.removeEventListener('pointerup', endDrag);
        el.removeEventListener('pointercancel', endDrag);
      };
    };

    const cleanups = [
      attachHorizontalScroll(carouselRef.current, handleCarouselInteract),
      attachHorizontalScroll(quickPicksRef.current, undefined),
      attachHorizontalScroll(songsGridRef.current, undefined),
    ];
    return () => cleanups.forEach((fn) => fn && fn());
  }, [albums.length, songs.length]);

  return (
    <div className="discover-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Music size={24} color="#ff8c00" />
          <span>OffBeat</span>
        </div>

        <nav className="sidebar-nav">
          <NavItem icon={Home} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon={Search} label="Search" active={activeTab === 'search'} onClick={() => {
            setActiveTab('search');
            setTimeout(() => searchInputRef.current?.focus(), 100);
          }} />
          <NavItem
            icon={Library}
            label="Library"
            active={activeTab === 'library'}
            onClick={() => {
              setSelectedAlbum(null);
              setIsPlaylistDetailOpen(false);
              setActiveTab('library');
            }}
          />
          <NavItem icon={Heart} label="Liked Musics" active={activeTab === 'heart'} onClick={() => setActiveTab('heart')} />
          <NavItem icon={Download} label="Downloads" active={activeTab === 'downloads'} onClick={() => setActiveTab('downloads')} />
        </nav>
      </aside>

      <main className="main-viewport">
        <header className="content-header">
          {activeTab === 'search' && (
            <div className="search-container">
              <Search size={18} className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for music, artists..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab !== 'search' && e.target.value.length > 0) {
                    setActiveTab('search');
                  }
                }}
                onFocus={() => setActiveTab('search')}
              />
            </div>
          )}

          <div className="header-actions">
            {activeTab === 'search' && (
              <div className="source-selector glass">
                <button
                  className={searchSource === 'jiosaavn' ? 'active' : ''}
                  onClick={() => setSearchSource('jiosaavn')}
                >
                  JioSaavn
                </button>
                <button
                  className={searchSource === 'youtube' ? 'active' : ''}
                  onClick={() => setSearchSource('youtube')}
                >
                  YouTube
                </button>
              </div>
            )}

          </div>
        </header>

        <div className="scrollable-content">
          <div className="discover-content">
            {activeTab === 'library' && !isPlaylistDetailOpen ? (
              /* Library View with Import Options */
              <section className="library-view">
                <SectionHeader icon={Library} title="Your Music Library" />

                <div className="import-grid">
                  <motion.div
                    className="import-card glass spotify"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => { setImportModalType('spotify'); setIsImportModalOpen(true); }}
                  >
                    <div className="import-icon-circle">
                      <Share2 size={32} />
                    </div>
                    <div className="import-content">
                      <h3>Import from Spotify</h3>
                      <p>Sync your liked songs and playlists instantly</p>
                      <button className="import-action-btn">Connect Spotify</button>
                    </div>
                    <div className="brand-accent"></div>
                  </motion.div>

                  <motion.div
                    className="import-card glass youtube-music"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => { setImportModalType('youtube'); setIsImportModalOpen(true); }}
                  >
                    <div className="import-icon-circle">
                      <Youtube size={32} />
                    </div>
                    <div className="import-content">
                      <h3>Import from YouTube Music</h3>
                      <p>Convert your YT playlists into OffBeat library</p>
                      <button className="import-action-btn">Connect YouTube</button>
                    </div>
                    <div className="brand-accent"></div>
                  </motion.div>

                  <motion.div
                    className="import-card glass custom-playlist"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <div className="import-icon-circle">
                      <ListMusic size={32} />
                    </div>
                    <div className="import-content">
                      <h3>Create New Playlist</h3>
                      <p>Organize your tracks into custom collections</p>
                      <button className="import-action-btn">Create Now</button>
                    </div>
                  </motion.div>
                </div>

                {importedPlaylists.length > 0 ? (
                  <section className="imported-playlists">
                    <SectionHeader icon={ListMusic} title="Imported Playlists" />
                    <div className="imported-playlist-grid">
                      {importedPlaylists.map((playlist) => (
                        <motion.div
                          key={playlist.id}
                          className="imported-playlist-card glass"
                          whileHover={{ y: -5 }}
                          onClick={() => {
                            setSelectedAlbum(playlist);
                            setIsPlaylistDetailOpen(true);
                          }}
                        >
                          <img src={playlist.coverArt} alt={playlist.title} />
                          <div className="imported-playlist-info">
                            <h3>{playlist.title}</h3>
                            <p>{playlist.songs.length} songs</p>
                          </div>
                          <button
                            className="imported-playlist-play"
                            onClick={(event) => {
                              event.stopPropagation();
                              onSongSelect(playlist.songs[0], playlist.songs);
                            }}
                            aria-label={`Play ${playlist.title}`}
                          >
                            <Play size={18} fill="currentColor" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                ) : (
                  <div className="library-empty-notice glass">
                    <Import size={40} />
                    <h4>Start Building Your Collection</h4>
                    <p>Import playlists from other platforms or create your own to see them here.</p>
                  </div>
                )}
              </section>
            ) : activeTab === 'downloads' ? (
              /* Downloads View */
              <section className="downloads-view">
                <SectionHeader icon={Download} title="Offline Downloads" />
                <div className="songs-list-container">
                  {downloadedSongs.length > 0 ? (
                    <div className="songs-grid">
                      {downloadedSongs.map((song, i) => (
                        <div
                          key={song.id}
                          className="song-card-row"
                          onClick={() => onSongSelect(song, downloadedSongs)}
                        >
                          <div className="col-rank">{(i + 1).toString().padStart(2, '0')}</div>
                          <div className="col-title">
                            <img src={song.smallThumbnail || song.thumbnail} alt={song.title} className="song-thumb" />
                            <span>{song.title}</span>
                          </div>
                          <div className="col-artist">{song.artist}</div>
                          <div className="col-duration">{song.duration}</div>
                          <div className="col-action">
                            <div className="action-menu-wrapper" style={{ position: 'relative' }}>
                              <button
                                className={`song-action-btn ${activeMenuId === song.id ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === song.id ? null : song.id);
                                }}
                              >
                                <MoreHorizontal size={18} />
                              </button>
                              <AnimatePresence>
                                {activeMenuId === song.id && (
                                  <motion.div
                                    className="song-dropdown-menu glass"
                                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      className="dropdown-item"
                                      onClick={() => {
                                        toggleDownload(song);
                                        setActiveMenuId(null);
                                      }}
                                    >
                                      <Download size={16} color="#ff8c00" />
                                      <span>Remove Download</span>
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <Download size={48} color="rgba(255,255,255,0.1)" />
                      <p>No downloads yet.</p>
                    </div>
                  )}
                </div>
              </section>
            ) : activeTab === 'search' ? (
              /* Search View */
              <section className="search-view-container">
                {searchQuery.trim().length === 0 ? (
                  <div className="search-browse">
                    <SectionHeader icon={Search} title="Browse All" />
                    <div className="genre-grid">
                      {[
                        { name: 'Pop Hits', color: '#ff4d4d' },
                        { name: 'Lo-Fi Beats', color: '#a29bfe' },
                        { name: 'Bollywood', color: '#fdcb6e' },
                        { name: 'Hip Hop', color: '#00cec9' },
                        { name: 'Romance', color: '#e84393' },
                        { name: 'Party', color: '#6c5ce7' },
                        { name: 'Workout', color: '#ffeaa7' },
                        { name: 'Indie', color: '#fab1a0' }
                      ].map((genre, i) => (
                        <motion.div
                          key={genre.name}
                          className="genre-card glass"
                          style={{ '--genre-color': genre.color }}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          whileHover={{ y: -5, scale: 1.05 }}
                          onClick={() => setSearchQuery(genre.name)}
                        >
                          <h3>{genre.name}</h3>
                          <div className="genre-accent"></div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="search-results-focused">
                    <div className="results-header">
                      <h2>Results for "{searchQuery}"</h2>
                      <p>{songs.length + albums.length} items found</p>
                    </div>

                    {loading ? (
                      <div className="search-loading">
                        <div className="spinner"></div>
                        <p>Searching...</p>
                      </div>
                    ) : (
                      <>
                        {songs.length > 0 && (
                          <section className="results-songs">
                            <SectionHeader icon={Music} title="Songs" />
                            <div className="songs-list-container">
                              <div className="songs-grid">
                                {songs.map((song, i) => (
                                  <motion.div
                                    key={song.id}
                                    className="song-card-row"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => onSongSelect(song, songs)}
                                  >
                                    <div className="col-rank">{(i + 1).toString().padStart(2, '0')}</div>
                                    <div className="col-title">
                                      <img src={song.smallThumbnail || song.thumbnail} alt={song.title} className="song-thumb" />
                                      <div className="title-stack">
                                        <span>{song.title}</span>
                                        <small>{song.artist}</small>
                                      </div>
                                    </div>
                                    <div className="col-artist">{song.artist}</div>
                                    <div className="col-duration">{song.duration}</div>
                                    <div className="col-action">
                                      <button
                                        className={`song-action-btn ${likedSongs.some(ls => ls.id === song.id) ? 'active' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                                      >
                                        <Heart size={16} fill={likedSongs.some(ls => ls.id === song.id) ? "#ff8c00" : "none"} />
                                      </button>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          </section>
                        )}

                        {albums.length > 0 && !['Pop Hits', 'Lo-Fi Beats', 'Bollywood', 'Hip Hop', 'Romance', 'Party', 'Workout', 'Indie'].includes(searchQuery) && (
                          <section className="results-albums">
                            <SectionHeader icon={Disc} title="Albums & Artists" />
                            <div className="albums-results-grid">
                              {albums.map((album) => (
                                <motion.div
                                  key={album.id}
                                  className="album-result-card glass"
                                  whileHover={{ y: -5 }}
                                  onClick={() => handleAlbumClick(album)}
                                >
                                  <img src={album.smallCoverArt || album.coverArt} alt={album.title} />
                                  <div className="result-info">
                                    <h4>{album.title}</h4>
                                    <p>{album.artist}</p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </section>
                        )}

                        {songs.length === 0 && albums.length === 0 && !loading && (
                          <div className="no-results glass">
                            <Search size={48} opacity={0.2} />
                            <h3>No results found</h3>
                            <p>{error || "Try searching for something else or check your spelling."}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </section>
            ) : activeTab === 'heart' ? (
              /* Liked Songs View */
              <section className="liked-songs-view">
                <SectionHeader icon={Heart} title="Liked Musics" />
                <div className="songs-list-container">
                  {likedSongs.length > 0 ? (
                    <div className="songs-grid">
                      {likedSongs.map((song, i) => (
                        <motion.div
                          key={song.id}
                          className="song-card-row"
                          onClick={() => onSongSelect(song, likedSongs)}
                        >
                          <div className="col-rank">{(i + 1).toString().padStart(2, '0')}</div>
                          <div className="col-title">
                            <img src={song.smallThumbnail || song.thumbnail} alt={song.title} className="song-thumb" />
                            <span>{song.title}</span>
                          </div>
                          <div className="col-artist">{song.artist}</div>
                          <div className="col-duration">{song.duration}</div>
                          <div className="col-action">
                            <div className="action-menu-wrapper" style={{ position: 'relative' }}>
                              <button
                                className={`song-action-btn ${activeMenuId === song.id ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === song.id ? null : song.id);
                                }}
                              >
                                <MoreHorizontal size={18} />
                              </button>
                              <AnimatePresence>
                                {activeMenuId === song.id && (
                                  <motion.div
                                    className="song-dropdown-menu glass"
                                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      className="dropdown-item"
                                      onClick={() => {
                                        toggleDownload(song);
                                        setActiveMenuId(null);
                                      }}
                                    >
                                      <Download size={16} color={downloadedSongs.some(ds => ds.id === song.id) ? "#ff8c00" : "currentColor"} />
                                      <span>
                                        {downloadingIds[song.id]
                                          ? 'Downloading...'
                                          : downloadedSongs.some(ds => ds.id === song.id)
                                            ? 'Remove Download'
                                            : 'Download Song'}
                                      </span>
                                    </button>
                                    <button className="dropdown-item" onClick={() => setActiveMenuId(null)}>
                                      <Share2 size={16} />
                                      <span>Share</span>
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <Heart size={48} color="rgba(255,255,255,0.1)" />
                      <p>You haven't liked any music yet.</p>
                    </div>
                  )}
                </div>
              </section>
            ) : selectedAlbum ? (

              /* Album Detailed View */
              <section className="album-detail-view">
                <div className="album-detail-header glass">
                  <img src={selectedAlbum.coverArt} alt={selectedAlbum.title} className="detail-cover" />
                  <div className="detail-info">
                    <button className="back-btn" onClick={() => {
                      setSelectedAlbum(null);
                      setIsPlaylistDetailOpen(false);
                    }}>
                      <ChevronLeft size={16} /> Back
                    </button>
                    <span className="badge">PLAYLIST</span>
                    <h1>{selectedAlbum.title}</h1>
                    <p>{selectedAlbum.artist}</p>
                    <button className="play-all-btn" onClick={() => onSongSelect(selectedAlbum.songs[0], selectedAlbum.songs)}>

                      <Play size={20} fill="black" /> Play All
                    </button>
                  </div>
                </div>

                <div className="songs-list-container">
                  <div className="songs-header">
                    <div className="col-rank">#</div>
                    <div className="col-title">TITLE</div>
                    <div className="col-artist">ARTIST</div>
                    <div className="col-duration"><Clock size={14} /></div>
                    <div className="col-action"></div>
                  </div>
                  <div className="songs-grid">
                    {selectedAlbum.songs.map((song, i) => (
                      <motion.div
                        key={song.id}
                        className="song-card-row"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => onSongSelect(song, selectedAlbum.songs)}
                      >
                        <div className="col-rank">{(i + 1).toString().padStart(2, '0')}</div>
                        <div className="col-title">
                          <img src={song.smallThumbnail || song.thumbnail} alt={song.title} className="song-thumb" />
                          <span>{song.title}</span>
                        </div>
                        <div className="col-artist">{song.artist}</div>
                        <div className="col-duration">{song.duration}</div>
                        <div className="col-action">
                          <button
                            className={`song-action-btn ${likedSongs.some(ls => ls.id === song.id) ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                          >
                            <Heart size={16} fill={likedSongs.some(ls => ls.id === song.id) ? "#ff8c00" : "none"} />
                          </button>
                          <div className="action-menu-wrapper" style={{ position: 'relative' }}>
                            <button
                              className={`song-action-btn ${activeMenuId === song.id ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === song.id ? null : song.id);
                              }}
                            >
                              <MoreHorizontal size={18} />
                            </button>
                            <AnimatePresence>
                              {activeMenuId === song.id && (
                                <motion.div
                                  className="song-dropdown-menu glass"
                                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    className="dropdown-item"
                                    onClick={() => {
                                      toggleDownload(song);
                                      setActiveMenuId(null);
                                    }}
                                  >
                                    <Download size={16} color={downloadedSongs.some(ds => ds.id === song.id) ? "#ff8c00" : "currentColor"} />
                                    <span>
                                      {downloadingIds[song.id]
                                        ? 'Downloading...'
                                        : downloadedSongs.some(ds => ds.id === song.id)
                                          ? 'Remove Download'
                                          : 'Download Song'}
                                    </span>
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            ) : (
              <>
                {/* Trending Now Section - Auto Scrolling Carousel */}
                <section className="trending-now-section">
                  <div className="trending-header">
                    <div className="title-with-icon">
                      <TrendingUp size={24} color="#ff8c00" />
                      <h2>Explore now</h2>
                    </div>
                    <button className="see-more">See all</button>
                  </div>

                  <div
                    className="trending-carousel-wrapper"
                    role="region"
                    aria-label="Explore now carousel"
                  >
                    <div className="trending-carousel" ref={carouselRef}>
                      {albums.length > 0 ? (
                        <>
                          {[...Array(loopCopies + 1)].map((_, setIndex) => (
                            <React.Fragment key={`album-set-${setIndex}`}>
                              {albums.map((album) => (
                                <motion.div
                                  key={`album-${setIndex}-${album.id}`}
                                  className="trending-card"
                                  whileHover={{ scale: 1.05 }}
                                  onClick={() => handleAlbumClick(album)}
                                >
                                  <div className="trending-card-image">
                                    <img src={album.smallCoverArt || album.coverArt} alt={album.title} />
                                    <div className="trending-overlay">
                                      <motion.button
                                        whileHover={{ scale: 1.15 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="play-button-overlay"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAlbumClick(album);
                                        }}
                                      >
                                        <Play size={28} fill="white" color="white" />
                                      </motion.button>
                                    </div>
                                  </div>
                                  <div className="trending-card-info">
                                    <h4>{album.title}</h4>
                                    <p>{album.artist}</p>
                                  </div>
                                </motion.div>
                              ))}
                            </React.Fragment>
                          ))}
                        </>
                      ) : (
                        [...Array(4)].map((_, i) => (
                          <div key={i} className="trending-card loading-skeleton"></div>
                        ))
                      )}
                    </div>
                  </div>
                </section>

                {/* Quick Picks Section */}
                <section className="quick-picks-section">
                  <div className="quick-picks-header">
                    <div className="title-with-icon">
                      <Music size={24} color="#ff8c00" />
                      <h2>Quick Picks</h2>
                    </div>
                    <button className="see-more">See all</button>
                  </div>

                  <div className="quick-picks-grid" ref={quickPicksRef}>
                    {quickPickSongs.map((song) => (
                      <motion.div
                        key={`quick-${song.id}`}
                        className="quick-pick-card glass"
                        whileHover={{ scale: 1.02, y: -5 }}
                        onClick={() => onSongSelect(song, songs)}
                      >
                        <div className="quick-pick-image">
                          <img src={song.smallThumbnail || song.thumbnail} alt={song.title} />
                          <button
                            className="quick-play-btn"
                            aria-label={`Play ${song.title}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSongSelect(song, songs);
                            }}
                          >
                            <Play size={24} fill="white" color="white" />
                          </button>
                        </div>
                        <div className="quick-pick-info">
                          <h4>{song.title}</h4>
                          <p>{song.artist}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>

                {/* Content Split: Songs & Recent */}
                <div className="sub-content-grid">
                  <section className="top-songs-section">
                    <SectionHeader icon={Music} title={searchQuery ? 'Top Songs' : 'Popular Songs'} />

                    {loading ? (
                      <div className="loading-container">Loading...</div>
                    ) : (
                      <div className="songs-cards-grid" ref={songsGridRef}>
                        {songs.map((song, i) => (
                          <motion.div
                            key={song.id}
                            className="song-card glass"
                            initial={isMobileView ? false : { opacity: 0, y: 20 }}
                            whileInView={isMobileView ? undefined : { opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={isMobileView ? undefined : { delay: i * 0.05 }}
                            whileHover={{ scale: 1.02, y: -5 }}
                            onClick={() => onSongSelect(song, songs)}
                          >
                            <div className="song-card-image">
                              <img src={song.smallThumbnail || song.thumbnail} alt={song.title} />
                              <button
                                className="song-card-play"
                                aria-label={`Play ${song.title}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSongSelect(song, songs);
                                }}
                              >
                                <Play size={24} fill="white" color="white" />
                              </button>
                            </div>

                            <div className="song-card-info">
                              <h4>{song.title}</h4>
                              <p>{song.artist}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="recently-played">
                    <SectionHeader icon={Clock} title="Recently Released" />
                    <div className="recent-list">
                      {songs.slice(0, 3).map((song) => (
                        <motion.div
                          key={`recent-${song.id}`}
                          className="recent-card glass"
                          whileHover={{ scale: 1.02, x: 5 }}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                        >
                          <img src={song.thumbnail} alt={song.title} />
                          <div className="recent-info">
                            <h4>{song.title}</h4>
                            <p>{song.artist}</p>
                          </div>
                          <div className="recent-badge">New</div>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        defaultType={importModalType}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default Discover;

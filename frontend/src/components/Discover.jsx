import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, MoreHorizontal, Home, Library, Disc, Music, User, TrendingUp, Clock, Heart, Download, ChevronLeft, Github, Linkedin, ChevronRight, Youtube, ListMusic, Import, Share2 } from 'lucide-react';

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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Discover = ({ onSongSelect, likedSongs, toggleLike, downloadedSongs, toggleDownload, downloadingIds = {} }) => {

  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchSource, setSearchSource] = useState('jiosaavn'); // 'jiosaavn' or 'youtube'
  const [activeMenuId, setActiveMenuId] = useState(null); // Track which song's menu is open
  const carouselRef = useRef(null);
  const searchInputRef = useRef(null);



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
          const res = await fetch(`${API_URL}/api/search?query=${encodeURIComponent(trimmedQuery)}&source=${searchSource}`);
          if (!res.ok) throw new Error('Search failed');
          const data = await res.json();
          setSongs(data.songs || []);
          setAlbums(data.albums || []);
          setSelectedAlbum(null); // Clear album view on new search
        } catch (err) {
          console.error('Search error:', err);
          setError('Search failed. Using cached results.');
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

  useEffect(() => {
    if (!carouselRef.current || albums.length === 0) return;

    const interval = setInterval(() => {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      const cardWidth = 220 + 20; // Updated width (220px) + gap
      
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        // Reset to start if reached end
        carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        carouselRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    }, 5000); // Move every 5 seconds

    return () => clearInterval(interval);
  }, [albums]);

  const slide = (direction) => {
    if (!carouselRef.current) return;
    const cardWidth = 220 + 20; // Updated width
    carouselRef.current.scrollBy({ 
      left: direction === 'right' ? cardWidth : -cardWidth, 
      behavior: 'smooth' 
    });
  };

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
          <NavItem icon={Library} label="Library" active={activeTab === 'library'} onClick={() => setActiveTab('library')} />
          <NavItem icon={Heart} label="Liked Musics" active={activeTab === 'heart'} onClick={() => setActiveTab('heart')} />
          <NavItem icon={Download} label="Downloads" active={activeTab === 'downloads'} onClick={() => setActiveTab('downloads')} />
        </nav>
      </aside>

      <main className="main-viewport">
        <header className="content-header">
          {activeTab === 'home' && (
            <div className="header-brand">
              <Music size={22} color="#ff8c00" />
              <span>OffBeat</span>
            </div>
          )}
          
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
                {activeTab === 'library' ? (
                  /* Library View with Import Options */
                  <section className="library-view">
                    <SectionHeader icon={Library} title="Your Music Library" />
                    
                    <div className="import-grid">
                      <motion.div 
                        className="import-card glass spotify"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        onClick={() => alert('Spotify Import: Connect your account to sync playlists.')}
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
                        onClick={() => alert('YouTube Music Import: Paste your playlist URL to import.')}
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

                    <div className="library-empty-notice glass">
                      <Import size={40} />
                      <h4>Start Building Your Collection</h4>
                      <p>Import playlists from other platforms or create your own to see them here.</p>
                    </div>
                  </section>
                ) : activeTab === 'downloads' ? (
                  /* Downloads View */
                  <section className="downloads-view">
                    <SectionHeader icon={Download} title="Offline Downloads" />
                    <div className="songs-list-container">
                      {downloadedSongs.length > 0 ? (
                        <motion.div 
                          className="songs-grid"
                          initial="hidden"
                          animate="show"
                          variants={{
                            hidden: { opacity: 0 },
                            show: {
                              opacity: 1,
                              transition: { staggerChildren: 0.05 }
                            }
                          }}
                        >
                          {downloadedSongs.map((song, i) => (
                            <motion.div 
                              key={song.id} 
                              className="song-card-row"
                              variants={{
                                hidden: { opacity: 0, x: -10 },
                                show: { opacity: 1, x: 0 }
                              }}
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
                            </motion.div>
                          ))}
                        </motion.div>
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
                                <p>Try searching for something else or check your spelling.</p>
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
                              initial={{ opacity: 0, x: -10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: i * 0.05 }}
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
                      <button className="back-btn" onClick={() => setSelectedAlbum(null)}>
                        <ChevronLeft size={16} /> Back
                      </button>
                      <span className="badge">ALBUM / MOVIE</span>
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
                {/* Trending Carousel Section */}
                <section className="trending-hero">
                  <div style={{ position: 'relative' }}>
                    <SectionHeader icon={TrendingUp} title={searchQuery ? 'Top Results' : 'Trending Suggestion'} showSeeMore />
                    <div className="carousel-controls">
                      <button className="carousel-btn" onClick={() => slide('left')}><ChevronLeft size={20} /></button>
                      <button className="carousel-btn" onClick={() => slide('right')}><ChevronRight size={20} /></button>
                    </div>
                  </div>
                  
                  <div className="hero-carousel-wrapper">
                    <div className="hero-grid" ref={carouselRef}>
                      {albums.length > 0 ? albums.map((album, i) => (
                        <motion.div 
                          key={album.id} 
                          className="hero-card glass"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.6, delay: i * 0.1 }}
                          whileHover={{ y: -8, transition: { duration: 0.2 } }}
                          onClick={() => handleAlbumClick(album)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="hero-img-container">
                            <img src={album.smallCoverArt || album.coverArt} alt={album.title} />
                            <div className="hero-overlay">
                              <div className="hero-info">
                                <span className="badge">{album.type === 'album' ? 'Movie/Album' : 'Featured'}</span>
                                <h3>{album.title}</h3>
                                <p>{album.artist}</p>
                              </div>
                              <motion.button 
                                whileHover={{ scale: 1.1, backgroundColor: '#ff8c00' }}
                                whileTap={{ scale: 0.9 }}
                                className="hero-play-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAlbumClick(album);
                                }}
                              >
                                <Play size={24} fill="currentColor" />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      )) : (
                        [...Array(3)].map((_, i) => (
                          <div key={i} className="hero-card glass loading-skeleton"></div>
                        ))
                      )}
                    </div>
                  </div>
                </section>

                {/* Content Split: Songs & Recent */}
                <div className="sub-content-grid">
                  <section className="top-songs-section">
                    <SectionHeader icon={Music} title={searchQuery ? 'Top Songs' : 'Popular Songs'} />
                    
                    <div className="songs-list-container">
                      <div className="songs-header">
                        <div className="col-rank">#</div>
                        <div className="col-title">TITLE</div>
                        <div className="col-artist">ARTIST</div>
                        <div className="col-duration"><Clock size={14} /></div>
                        <div className="col-action"></div>
                      </div>
                      
                      {loading ? (
                        <div className="loading-container">Loading...</div>
                      ) : (
                        <div className="songs-grid">
                          {songs.map((song, i) => (
                            <motion.div 
                              key={song.id} 
                              className="song-card-row"
                              initial={{ opacity: 0, x: -10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: i * 0.1 }}
                              onClick={() => onSongSelect(song, songs)}
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
                      )}
                    </div>
                  </section>

                  <section className="recently-played">
                    <SectionHeader icon={Clock} title="Recently Released" />
                    <div className="recent-list">
                      {songs.slice(0, 3).map((song, i) => (
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
    </div>
  );
};

export default Discover;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Settings, Play, MoreHorizontal, Home, Library, Disc, Music, User, TrendingUp, Clock, Heart, Download, ChevronLeft, Github, Linkedin } from 'lucide-react';

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

const Discover = ({ onSongSelect, likedSongs, toggleLike }) => {

  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchSource, setSearchSource] = useState('jiosaavn'); // 'jiosaavn' or 'youtube'
  const [showProfileMenu, setShowProfileMenu] = useState(false);



  const fetchTrending = async () => {
    setLoading(true);
    setError(null);
    try {
      const [songsRes, albumsRes] = await Promise.all([
        fetch('http://localhost:5000/api/trending').then(res => {
          if (!res.ok) throw new Error('Failed to fetch trending songs');
          return res.json();
        }),
        fetch('http://localhost:5000/api/albums').then(res => {
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

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(`http://localhost:5000/api/search?query=${encodeURIComponent(searchQuery)}&source=${searchSource}`);
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
      } else if (searchQuery.trim().length === 0) {
        fetchTrending();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchSource]);


  const handleAlbumClick = async (album) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/albums/${album.id}`);
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
  }, []);

  return (
    <div className="discover-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Music size={24} color="#ff8c00" fill="#ff8c00" />
          <span>OffBeat</span>
        </div>
        
        <nav className="sidebar-nav">
          <NavItem icon={Home} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon={Search} label="Search" active={activeTab === 'search'} onClick={() => setActiveTab('search')} />
          <NavItem icon={Library} label="Library" active={activeTab === 'library'} onClick={() => setActiveTab('library')} />
          <NavItem icon={Heart} label="Liked Musics" active={activeTab === 'heart'} onClick={() => setActiveTab('heart')} />
          <NavItem icon={Download} label="Downloads" active={activeTab === 'downloads'} onClick={() => setActiveTab('downloads')} />
        </nav>
      </aside>

      <main className="main-viewport">
        <header className="content-header">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search for music, artists..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="header-actions">
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
            <div className="profile-wrapper">
              <div 
                className={`user-avatar-pill ${showProfileMenu ? 'active' : ''}`}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <User size={20} />
              </div>
              
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="profile-dropdown glass"
                  >
                    <div className="profile-info-header">
                      <h4>Adarsh Bangera</h4>
                      <p>Full Stack Developer</p>
                    </div>
                    <div className="dropdown-divider"></div>
                    <a href="https://www.linkedin.com/in/adarsh-bangera-284795324" target="_blank" rel="noopener noreferrer" className="dropdown-item">
                      <Linkedin size={18} />
                      <span>LinkedIn Profile</span>
                    </a>
                    <a href="https://github.com/imadarsh10" target="_blank" rel="noopener noreferrer" className="dropdown-item">
                      <Github size={18} />
                      <span>GitHub Repository</span>
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>


        </header>

        <div className="scrollable-content">
          <div className="discover-content">
                {activeTab === 'heart' ? (
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
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              onClick={() => onSongSelect(song, likedSongs)}
                            >
                              <div className="col-rank">{(i + 1).toString().padStart(2, '0')}</div>
                              <div className="col-title">
                                <img src={song.thumbnail} alt={song.title} className="song-thumb" />
                                <span>{song.title}</span>
                              </div>
                              <div className="col-artist">{song.artist}</div>
                              <div className="col-duration">{song.duration}</div>
                              <div className="col-action">
                                <button className="song-action-btn active" onClick={(e) => { e.stopPropagation(); toggleLike(song); }}><Heart size={16} fill="#ff8c00" /></button>
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
                            <img src={song.thumbnail} alt={song.title} className="song-thumb" />
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
                          </div>

                        </motion.div>
                      ))}
                    </div>
                  </div>
                </section>
            ) : (
                <>
                {/* Trending Section */}
                <section className="trending-hero">
                  <SectionHeader icon={TrendingUp} title={searchQuery ? 'Top Results' : 'Trending Released'} showSeeMore />
                  <div className="hero-grid">
                    {albums.length > 0 ? albums.map((album, i) => (
                      <motion.div 
                        key={album.id} 
                        className="hero-card glass"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: i * 0.2 }}
                        whileHover={{ y: -8, transition: { duration: 0.2 } }}
                        onClick={() => handleAlbumClick(album)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="hero-img-container">
                          <img src={album.coverArt} alt={album.title} />
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
                      <div className="hero-card glass loading-skeleton"></div>
                    )}
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
                                <img src={song.thumbnail} alt={song.title} className="song-thumb" />
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
                                <button className="song-action-btn" onClick={(e) => e.stopPropagation()}><MoreHorizontal size={18} /></button>
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

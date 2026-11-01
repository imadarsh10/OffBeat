import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, Music, Youtube, Share2, AlertCircle } from 'lucide-react';
import { API_URL } from '../config/api';
import './ImportModal.css';

const ImportModal = ({ isOpen, onClose, defaultType = 'spotify', onImportSuccess }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleImport = async (e) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import playlist');
      }

      if (data.success && data.tracks) {
        onImportSuccess(
          data.tracks,
          data.title || (url.includes('spotify') ? 'Spotify Import' : 'YouTube Import')
        );
        setUrl('');
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="modal-backdrop" onClick={onClose}>
        <motion.div 
          className="import-modal glass"
          onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
          
          <div className="modal-header">
            {defaultType === 'spotify' ? <Share2 size={28} color="#1DB954" /> : <Youtube size={28} color="#FF0000" />}
            <h2>Import from {defaultType === 'spotify' ? 'Spotify' : 'YouTube Music'}</h2>
          </div>
          
          <p className="modal-desc">
            Paste the link to your public playlist or album to import all tracks into OffBeat.
          </p>

          <form onSubmit={handleImport}>
            <div className="input-group">
              <LinkIcon size={18} className="input-icon" />
              <input 
                type="url" 
                placeholder={`https://${defaultType === 'spotify' ? 'open.spotify.com/playlist/...' : 'youtube.com/playlist?list=...'}`}
                value={url}
                onChange={e => setUrl(e.target.value)}
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              className={`submit-btn ${loading ? 'loading' : ''} ${defaultType}`}
              disabled={loading || !url}
            >
              {loading ? 'Importing...' : 'Import Playlist'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ImportModal;

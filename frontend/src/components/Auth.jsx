import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Music, Github, Chrome } from 'lucide-react';
import './Auth.css';

const Auth = ({ onHeaderClick, onAuthSuccess }) => {
  const [isLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = '/api/auth/login';
    
    try {
      const response = await fetch(`http://127.0.0.1:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        onAuthSuccess();
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      console.error("Auth Error:", err);
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error: Cannot reach the backend. Is it running on port 5000?');
      } else {
        setError('Connection failed. Check your console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <header className="site-header" onClick={onHeaderClick} style={{ cursor: 'pointer' }}>
        <div className="logo">
          <Music size={28} color="#ff8c00" />
          <span>OffBeat</span>
        </div>
      </header>

      <main className="auth-container">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="auth-card glass"
        >
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p>Enter your details to continue your journey</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <Mail size={20} className="input-icon" />
              <input 
                type="email" 
                name="email"
                placeholder="Email Address" 
                value={formData.email}
                onChange={handleChange}
                required 
              />
            </div>

            <div className="input-group">
              <Lock size={20} className="input-icon" />
              <input 
                type="password" 
                name="password"
                placeholder="Password" 
                value={formData.password}
                onChange={handleChange}
                required 
              />
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="submit-btn"
              type="submit"
              disabled={loading}
            >
              <span>{loading ? 'Processing...' : 'Sign In'}</span>
              {!loading && <ArrowRight size={20} />}
            </motion.button>
          </form>

        </motion.div>
      </main>
    </div>
  );
};

export default Auth;

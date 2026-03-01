import React from 'react';
import { motion } from 'framer-motion';
import { Home, Search, Library, User, Music } from 'lucide-react';
import './Onboarding.css';

const Onboarding = ({ onStart }) => {

  return (
    <div className="onboarding-screen">

      <header className="site-header">
        <div className="logo">
          <Music size={28} color="#ff8c00" />
          <span>OffBeat</span>
        </div>
      </header>

      <main className="main-content">
        <div className="content-wrapper">
          <div className="art-section">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="portrait-container"
            >
              {/* Image removed */}
            </motion.div>
          </div>
          
          <div className="content-section">
            <motion.h1 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Lost In The <br />
              <span>Solar Music</span> <br />
              With Us!
            </motion.h1>
            
            <motion.p 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Experience the universe's largest collection of tracks and lyrics. 
              Join millions of listeners in the glow of the Solar Nebula.
            </motion.p>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStart}
              className="cta-button"
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;

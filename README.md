# OffBeat 🎵

A modern, high-performance music streaming web and mobile application built with React, Vite, Express, and Capacitor.

Live Web App: [https://off-beat.netlify.app/](https://off-beat.netlify.app/)

---

## ✨ Features

- 🎧 **High Quality Streaming**: Fast audio streaming powered by custom backend resolvers.
- 🔥 **Trending & Quick Picks**: Discover trending tracks and curated recommendations.
- 🔍 **Universal Search**: Search millions of songs across YouTube Music and JioSaavn.
- 📱 **Cross-Platform**: Responsive Web UI and native Android app with Capacitor.
- 📥 **Offline Downloads**: Save tracks locally in browser indexed storage via LocalForage.
- 📂 **Playlist Import**: Seamlessly import playlists from Spotify and YouTube.
- 🎨 **Sleek Glassmorphic UI**: Beautiful dark mode interface with smooth Framer Motion animations.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite 7
- **Styling**: Modern CSS with Glassmorphism & Responsive Layouts
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Mobile**: Capacitor (Android)
- **Local Storage**: LocalForage

### Backend
- **Server**: Node.js & Express.js
- **Music Providers**: YouTube Music (`ytmusic-api`, `@distube/ytdl-core`), JioSaavn
- **Deployment**: Render / Netlify

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Android Build (Capacitor)
```bash
cd frontend
npm run android:sync
npm run android:open
```

---

## 📄 License
ISC License

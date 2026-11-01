# Quick Start Guide - Music Player

## Installation & Setup

### Backend Setup
```bash
cd backend
npm install
npm start
```

Server will start on `http://localhost:5000`

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend will start on `http://localhost:5173` (or similar)

## How to Use

### Search for Music
1. Click on "Search" in the sidebar
2. Type a song name or artist
3. Choose source: **YouTube** or **JioSaavn**
4. Click on a song to play

### YouTube Music Features
- ✅ Search YouTube Music catalog
- ✅ Automatic fallback to actual YouTube videos
- ✅ Falls back to JioSaavn if needed
- ✅ Highest quality audio

### JioSaavn Features
- ✅ Large Indian music catalog
- ✅ Fast searching
- ✅ Direct download links
- ✅ Album browsing

## Features

### Now Playing
- Current song display
- Play/Pause controls
- Previous/Next track
- Shuffle mode
- Progress bar with seek

### Library
- Like songs (heart icon)
- Download for offline use
- Create playlists
- View liked songs

### Discover
- Trending songs
- Album browsing
- Artist recommendations
- New releases

## API Usage (For Developers)

### Search API
```bash
# YouTube search
curl "http://localhost:5000/api/search?query=shape+of+you&source=youtube"

# JioSaavn search
curl "http://localhost:5000/api/search?query=beautiful&source=jiosaavn"
```

### Stream API
```bash
# Stream audio
curl "http://localhost:5000/api/stream?id=VIDEO_ID&source=youtube"
```

## Troubleshooting

### Music Won't Play
1. Check if backend is running: `curl http://localhost:5000/api/health`
2. Try different search source (YouTube vs JioSaavn)
3. Check browser console for errors
4. Verify internet connection

### Search Returns No Results
1. YouTube Mirror might be down - try JioSaavn source
2. Try different search term
3. Check backend logs for errors

### Slow Search
- First search initializes YouTube API (takes 2-3 seconds)
- Subsequent searches are instant (cached)
- Switch to JioSaavn for immediate results

## Documentation Files

- **API_SETUP.md** - Complete API documentation
- **YOUTUBE_MUSIC_FIX.md** - Technical details of the YouTube Music fix
- **DEPLOYMENT.md** - Deployment instructions
- **README.md** - Project overview (frontend)

## Next Steps

1. ✅ YouTube Music streaming fixed
2. ✅ API documentation complete
3. 🔄 Frontend UI improvements (in progress)
4. ⏳ Add playlist support
5. ⏳ Implement user authentication
6. ⏳ Add offline download feature

## Support

For detailed technical information:
- See **API_SETUP.md** for API endpoints
- See **YOUTUBE_MUSIC_FIX.md** for YouTube integration details
- Check **DEPLOYMENT.md** for production setup

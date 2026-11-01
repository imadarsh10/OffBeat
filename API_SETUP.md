# Music Player API Setup Guide

## Overview
The Music Player uses two primary music sources:
1. **JioSaavn API** - Indian music catalog (primary fallback)
2. **YouTube Music API** - Global music source

## Backend Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Internet connection for API access

### Installation
```bash
cd backend
npm install
```

### Environment Configuration
Create a `.env` file in the backend directory:
```env
PORT=5000
YOUTUBE_API_KEY=your_google_cloud_api_key_here
```

### Starting the Server
```bash
npm start
# or
node server.js
```

The server will start on `http://localhost:5000`.

### API Keys

| Service | Key Required | How to Get |
|---|---|---|
| JioSaavn | No | Free, uses `jiosaavn-sdk` with no auth |
| YouTube Search | Optional | YouTube Data API v3 (free, 100 searches/day) |
| YouTube Audio | No | Uses `ytdl-core` (unofficial, no key) |
| Lyrics (LRCLIB) | No | Free, no auth |

## API Endpoints

### 1. Health Check
```
GET /api/health
```
Returns: `{ "status": "ok" }`

### 2. Search Music
```
GET /api/search?query=<query>&source=<source>
```

**Parameters:**
- `query` (required): Search term
- `source` (optional): `jiosaavn` or `youtube` (defaults to jiosaavn)

**Response:**
```json
{
  "songs": [
    {
      "id": "unique_id",
      "title": "Song Title",
      "artist": "Artist Name",
      "album": "Album Name",
      "duration": "3:45",
      "thumbnail": "image_url",
      "audioSrc": "stream_url",
      "source": "youtube" | "jiosaavn"
    }
  ],
  "albums": [
    {
      "id": "album_id",
      "title": "Album Title",
      "artist": "Artist Name",
      "type": "album",
      "coverArt": "image_url"
    }
  ]
}
```

### 3. Stream Audio
```
GET /api/stream?id=<id>&title=<title>&artist=<artist>&source=<source>
```

**Parameters:**
- `id` (required): Video/Song ID
- `title` (optional): Song title (used for search fallback)
- `artist` (optional): Artist name (used for search fallback)
- `source` (optional): `youtube` or `jiosaavn`

**Behavior:**
1. Attempts to stream from the specified source
2. If YouTube ID is invalid, searches for actual YouTube video
3. Falls back to JioSaavn if YouTube fails
4. Returns audio stream as MP3

### 4. Trending Songs
```
GET /api/trending
```
Returns latest trending songs from JioSaavn.

### 5. Albums
```
GET /api/albums
```
Returns latest albums from JioSaavn.

### 6. Album Details
```
GET /api/albums/:id
```
Returns songs in a specific album.

### 7. Recommendations
```
GET /api/recommendations?artist=<artist>
```
Returns recommended songs based on artist.

### 8. Lyrics
```
GET /api/lyrics/:id?title=<title>&artist=<artist>
```
Returns song lyrics (synced or plain text).

## Audio Streaming Flow

### YouTube Music Streaming
```
User selects YouTube track
  ↓
Frontend sends: /api/stream?id=videoId&source=youtube
  ↓
Backend validates videoId format
  ↓
If valid (11 alphanumeric chars): Try ytdl download
  If fails → Search YouTube for actual video
  ↓
Stream audio or fallback to JioSaavn
```

### JioSaavn Streaming
```
User selects Saavn track
  ↓
Frontend sends: /api/stream?id=songId&source=jiosaavn
  ↓
Backend uses downloadUrl from search response
  ↓
Stream audio directly from JioSaavn
```

## Error Handling

### Graceful Fallbacks
1. **YouTube Music Stream Fails** → Search YouTube for actual video
2. **YouTube Video Not Found** → Search JioSaavn for same track
3. **JioSaavn Mirror Down** → Try next mirror in SAAVN_MIRRORS list
4. **All Sources Fail** → Return error message to user

### Logging
All errors are logged with prefixes for debugging:
- `[YT Search]` - YouTube search operations
- `[YT Stream]` - YouTube streaming attempts
- `[Stream Fallback]` - Fallback mechanism triggered
- `[Critical Stream Error]` - Fatal errors

## Performance Optimization

### Caching
- Search results cached for 1 hour
- Cache invalidated per version (v4 currently)
- Cache keys: `v4_${operation}_${query}`

### Quality Settings
- **YouTube Audio**: Highest quality (best available)
- **JioSaavn Audio**: 160-320 kbps
- **Range Requests**: Supported for seek functionality

### Data Saving
- Small thumbnails used in lists (150x150 instead of 500x500)
- High resolution only for detailed views

## Frontend Configuration

### API URL
Update `frontend/src/config/api.js`:
```javascript
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

### Search Source Switching
The frontend allows users to toggle between sources:
- Default: JioSaavn
- Alternative: YouTube Music

### Source Parameter in URLs
All audio URLs include `&source=` parameter for proper routing:
```
http://localhost:5000/api/stream?id=...&source=youtube
http://localhost:5000/api/stream?id=...&source=jiosaavn
```

## Testing

### Test YouTube Search
```bash
curl "http://localhost:5000/api/search?query=shape+of+you&source=youtube"
```

### Test JioSaavn Search
```bash
curl "http://localhost:5000/api/search?query=beautiful&source=jiosaavn"
```

### Test Audio Streaming
```bash
# YouTube
curl "http://localhost:5000/api/stream?id=xTvyyoF_LZY&title=Shape%20of%20You&source=youtube" -o audio.mp3

# JioSaavn
curl "http://localhost:5000/api/stream?id=songid&source=jiosaavn" -o audio.mp3
```

## Troubleshooting

### YouTube Music API Not Initializing
- Check internet connection
- Clear cache and restart server
- May need to update ytmusic-api package

### No Results on Search
- Check if mirrors are accessible (JioSaavn)
- Try YouTube source as alternative
- Verify API is running (check /api/health)

### Audio Stream Won't Play
- Verify videoId is valid for YouTube
- Check browser console for CORS errors
- Ensure backend is serving with correct headers
- Try fallback source

### Slow Search Results
- First search initializes YouTube API (~2-3 seconds)
- Subsequent searches use cache (instant)
- JioSaavn uses fastest mirror (auto-selected)

## Future Improvements

- [ ] Add Spotify API integration
- [ ] Implement user authentication
- [ ] Add playlist support
- [ ] Implement WebRTC for peer streaming
- [ ] Add offline download support
- [ ] Support for Apple Music

## Dependencies

### Backend
- `express` - Web framework
- `axios` - HTTP client
- `jiosaavn-sdk` - JioSaavn API client (search, albums, songs)
- `ytmusic-api` - YouTube Music API (fallback when no API key)
- `@distube/ytdl-core` - YouTube audio streaming
- `cors` - Cross-origin support
- `dotenv` - Environment variables

### Frontend
- `React` - UI framework
- `framer-motion` - Animations
- `localforage` - Local storage
- `lucide-react` - Icons

## API Rate Limiting

Currently no rate limiting implemented. For production:
- Implement per-IP rate limiting
- Add user quota management
- Monitor JioSaavn mirror usage
- Implement API key authentication

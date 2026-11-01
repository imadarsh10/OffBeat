# Project Architecture: OffBeat Music Player

This document reflects the current shipped architecture of the OffBeat Music Player.

## System Overview
OffBeat is a two-part application:
1. A React/Vite frontend that handles discovery, playback, likes, and offline downloads.
2. An Express backend that aggregates search, streaming, album, trending, and lyrics data from external music services.

The frontend is the primary UI layer. The backend is the source of truth for music metadata and audio stream URLs.

## Frontend Architecture
The frontend lives in [frontend/src/App.jsx](frontend/src/App.jsx) and is composed of a small stateful shell plus feature views.

### Core stack
1. React 19 for UI state and composition.
2. Vite for fast local development and builds.
3. Framer Motion for transitions and motion polish.
4. Lucide React for icons.
5. localforage for offline audio blob storage.
6. Capacitor for Android packaging.

### Main components
1. [App.jsx](frontend/src/App.jsx) manages selected track, playlist navigation, likes, and offline download state.
2. [Discover.jsx](frontend/src/components/Discover.jsx) is the browsing surface for search, trending content, albums, library, likes, and downloads.
3. [NowPlaying.jsx](frontend/src/components/NowPlaying.jsx) handles playback controls, progress, volume, and lyrics loading.
4. [config/api.js](frontend/src/config/api.js) resolves the backend base URL for web, localhost, and native Android builds.

### Frontend data flow
1. Discover fetches trending content from `/api/trending` when the page loads.
2. Search queries go to `/api/search?query=...&source=jiosaavn|youtube`.
3. Selecting a track passes it into App, which normalizes the stream URL and opens NowPlaying.
4. NowPlaying streams from `/api/stream` and loads lyrics from `/api/lyrics/:id`.
5. Downloads are cached in browser storage with localforage and mirrored in localStorage for the user-facing lists.

### Important frontend behavior
1. Offline playback is supported by storing audio blobs in localforage under `audio_<song.id>`.
2. The current UI is effectively a single-screen experience; auth is bypassed in the shell.
3. Liked songs and downloaded songs are persisted locally in the browser.

## Backend Architecture
The backend is a single Express server in [backend/server.js](backend/server.js).

### Core stack
1. Node.js and Express for HTTP routing.
2. axios for third-party API calls.
3. ytmusic-api for YouTube Music search.
4. @distube/ytdl-core for YouTube audio streaming.
5. cors and dotenv for runtime configuration.

### Implemented routes
1. `GET /api/health` returns a simple health check.
2. `GET /api/search` aggregates JioSaavn or YouTube Music results.
3. `GET /api/stream` returns a playable audio stream, with fallback behavior when a source fails.
4. `GET /api/trending` returns cached trending tracks.
5. `GET /api/albums` returns cached album cards.
6. `GET /api/albums/:id` returns album details and songs.
7. `GET /api/recommendations` returns recommendation results.
8. `GET /api/lyrics/:id` returns synced lyrics from LRCLIB first, then JioSaavn lyrics as fallback.
9. `POST /api/auth/register` and `POST /api/auth/login` are mocked responses, not a real auth system.

### Backend data flow
1. Search requests default to JioSaavn unless `source=youtube` is provided.
2. JioSaavn requests race across multiple mirrors with a short timeout.
3. YouTube requests initialize the YTMusic client on first use, then search SONG, VIDEO, and ALBUM results.
4. `/api/stream` attempts YouTube playback first for YouTube tracks, then falls back to JioSaavn when needed.
5. Results are cached in memory with versioned keys to reduce repeated third-party calls.

### Backend notes
1. `mongoose` is present in the dependency list, but there is no active database connection in the current server implementation.
2. The app trusts proxy headers so generated stream URLs stay correct behind hosted deployments.
3. The server listens on `0.0.0.0` so it works in local and hosted environments.

## External Services
OffBeat currently depends on these live services:
1. JioSaavn mirror APIs for catalog search, albums, trends, and fallback streams.
2. YouTube Music for search discovery.
3. YouTube video streaming via ytdl for playable audio.
4. LRCLIB for lyrics lookup.

## Current Constraints
1. Authentication is mocked.
2. There is no live MongoDB-backed user system yet.
3. The app relies on third-party source availability, so fallback behavior is important.

## High-Level Request Flow
```text
User action in Discover
	-> frontend calls backend API
	-> backend fetches or resolves stream data
	-> frontend passes selected track to NowPlaying
	-> NowPlaying plays audio and fetches lyrics as needed
```

## Performance Characteristics
1. The first YouTube request is slower because the YTMusic client initializes lazily.
2. Search and album endpoints are cached in memory.
3. Mirror timeouts are intentionally short so the UI fails over quickly.
4. Large artwork and motion effects are handled entirely in the frontend.

---
This document is intentionally aligned to the code currently in the repository, not to planned features.

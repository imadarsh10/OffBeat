const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
// Render (and many other hosts) run behind a proxy; trust it so req.protocol
// reflects X-Forwarded-Proto (prevents generating http:// URLs on https sites).
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;
const SAAVN_MIRRORS = [
  "https://saavn.me/api",
  "https://saavn.dev/api",
  "https://jiosaavn-api-vn.vercel.app/api",
  "https://jiosaavn-api-ashutosh.vercel.app/api",
  "https://jiosaavn-api-beta.vercel.app/api",
  "https://saavn.sumit.co/api"
];

const YTMusic = require("ytmusic-api");
const ytdl = require("@distube/ytdl-core");
const ytmusic = new YTMusic();
let ytInitialized = false;

async function initYT() {
  try {
    if (!ytInitialized) {
      console.log("Initializing YouTube Music API...");
      await ytmusic.initialize();
      ytInitialized = true;
      console.log("YouTube Music API initialized successfully");
    }
  } catch (error) {
    console.error("YouTube Music API initialization failed:", error.message);
    ytInitialized = false; 
    throw error;
  }
}

const MOCK_SONGS = [
  {
    id: "mock_1",
    title: "Neon Horizon 2026",
    artist: "Solaris",
    album: "Future Beats",
    year: "2026",
    duration: "3:45",
    thumbnail: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: "mock_2",
    title: "Stardust Pulse",
    artist: "Nebula",
    album: "Cosmos 2026",
    year: "2026",
    duration: "4:20",
    thumbnail: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=500&q=80",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  }
];

// Simple In-memory Cache with versioning to clear old formats
const CACHE = {};
const CACHE_TTL = 3600000; // 1 hour
const CACHE_VERSION = "v4"; 

function getFromCache(key) {
  const item = CACHE[`${CACHE_VERSION}_${key}`];
  if (item && Date.now() - item.timestamp < CACHE_TTL) return item.data;
  return null;
}

function setToCache(key, data) {
  CACHE[`${CACHE_VERSION}_${key}`] = {
    data,
    timestamp: Date.now()
  };
}

// Optimized fetchFromSaavn using racing for minimal latency
async function fetchFromSaavn(endpoint, params = {}) {
  const requestPromises = SAAVN_MIRRORS.map(async (mirror) => {
    try {
      const response = await axios.get(`${mirror}${endpoint}`, {
        params,
        timeout: 3000 // Ultra-aggressive timeout for snappier racing
      });
      // Handle both SUCCESS status and direct data responses
      if (response.data && (response.data.status === 'SUCCESS' || response.data.data || Array.isArray(response.data))) {
        return response.data;
      }
      throw new Error(`Invalid response from ${mirror}`);
    } catch (err) {
      throw err; 
    }
  });

  try {
    return await Promise.any(requestPromises);
  } catch (error) {
    console.error(`All ${SAAVN_MIRRORS.length} mirrors failed for: ${endpoint}`);
    // If all fail, return an empty structure rather than crashing
    return { data: { results: [] }, results: [] };
  }
}

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json());

// Auth Routes (Mocked for now)
app.post("/api/auth/register", (req, res) => {
  const { fullName, email } = req.body;
  res.status(201).json({ message: "User registered successfully", user: { fullName, email } });
});

app.post("/api/auth/login", (req, res) => {
  const { email } = req.body;
  res.json({ message: "Login successful", user: { fullName: email.split('@')[0], email } });
});

app.get("/", (req, res) => res.send("OffBeat API is running. Use /api/health"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Helper to transform song data with absolute resilience
const transformSong = (song) => {
  if (!song) return null;
  try {
    // Extract artist name robustly
    let artistName = "Various Artists";
    if (song.primaryArtists && typeof song.primaryArtists === 'string') {
        artistName = song.primaryArtists;
    } else if (Array.isArray(song.primaryArtists)) {
        artistName = song.primaryArtists.map(a => a.name || a.title || a).join(", ");
    } else if (song.artist) {
        artistName = song.artist;
    } else if (song.singers) {
        artistName = song.singers;
    }

    // Extract images robustly (provide both small and high res)
    let thumb = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80";
    let smallThumb = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&q=80";
    
    if (Array.isArray(song.image)) {
        const bestImg = song.image[song.image.length - 1];
        const medImg = song.image[Math.min(1, song.image.length - 1)]; // Usually 150x150
        thumb = bestImg.url || bestImg.link || thumb;
        smallThumb = medImg.url || medImg.link || thumb;
    } else if (song.image && typeof song.image === 'string') {
        thumb = song.image;
        smallThumb = song.image;
    }

    // Extract download link robustly
    let downloadLink = "";
    if (Array.isArray(song.downloadUrl)) {
        // Data saving: Use 160kbps (middle) instead of 320kbps (highest) if available
        const midIdx = Math.floor(song.downloadUrl.length / 2);
        const bestDl = song.downloadUrl[midIdx] || song.downloadUrl[0];
        downloadLink = bestDl.url || bestDl.link || "";
    } else if (song.downloadUrl && typeof song.downloadUrl === 'string') {
        downloadLink = song.downloadUrl;
    }

    return {
      id: song.id || song.songId || Math.random().toString(36).substr(2, 9),
      title: (song.name || song.title || song.song || "Unknown track").replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
      artist: artistName.replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
      album: (song.album?.name || song.album || "Single").replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
      year: song.year || "",
      duration: song.duration ? (song.duration / 60).toFixed(2).replace('.', ':') : (song.durationText || "3:45"),
      thumbnail: thumb,
      smallThumbnail: smallThumb, // Added for data saving in lists
      audioSrc: downloadLink || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      source: 'jiosaavn'
    };
  } catch (e) {
    console.error("Transform error:", e);
    return null;
  }
};

// Main Search Route
app.get("/api/search", async (req, res) => {
  const { query, source } = req.query;
  if (!query) return res.status(400).json({ error: "Query required" });

  if (source === 'youtube') {
    const cacheKey = `yt_search_${query}`;
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);

    try {
      await initYT();
      // Fetch both songs and albums for a complete UI
      const [songResults, albumResults] = await Promise.all([
        ytmusic.search(query, "SONG"),
        ytmusic.search(query, "ALBUM")
      ]);

      const host = req.get('host');
      const protocol = req.protocol;

      const songs = (songResults || []).map(song => ({
        id: song.videoId || song.id,
        title: (song.name || song.title || "Unknown").replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
        artist: (Array.isArray(song.artists) ? song.artists.map(a => a.name || a.title).join(", ") : (song.author || "Various Artists")).replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
        album: (song.album?.name || song.album || "Single").replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
        duration: song.duration ? (song.duration / 60).toFixed(2).replace('.', ':') : (song.durationText || "3:45"),
        thumbnail: song.thumbnails?.[song.thumbnails.length - 1]?.url || song.thumbnail?.url || "",
        audioSrc: `${protocol}://${host}/api/stream?id=${song.videoId || song.id}&title=${encodeURIComponent(song.name || song.title || "")}&artist=${encodeURIComponent(Array.isArray(song.artists) ? song.artists.map(a => a.name || a.title).join(", ") : (song.author || ""))}`,
        source: 'youtube'
      }));

      let albums = (albumResults || []).slice(0, 8).map(album => ({
        id: album.albumId || album.id,
        title: (album.name || album.title || "Album").replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
        artist: (Array.isArray(album.artists) ? album.artists.map(a => a.name || a.title).join(", ") : (album.author || "Various Artists")).replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
        type: 'album',
        coverArt: album.thumbnails?.[album.thumbnails.length - 1]?.url || album.thumbnail?.url || "",
        smallCoverArt: album.thumbnails?.[0]?.url || album.thumbnail?.url || ""
      }));

      // Fallback: Populate carousel with songs if no albums found
      if (albums.length === 0 && songs.length > 0) {
        albums = songs.slice(0, 5).map(song => ({
          id: song.id,
          title: song.title,
          artist: song.artist,
          type: 'Featured',
          coverArt: song.thumbnail
        }));
      }

      const response = { songs, albums };
      setToCache(cacheKey, response);
      return res.json(response);
    } catch (error) {
      console.error("YT Search Error:", error);
      return res.status(500).json({ error: "YouTube search failed" });
    }
  }

  const cacheKey = `saavn_search_${query}`;
  const cached = getFromCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const [songData, albumData] = await Promise.all([
      fetchFromSaavn("/search/songs", { query, limit: 40 }),
      fetchFromSaavn("/search/albums", { query, limit: 10 })
    ]);

    let rawSongs = songData?.data?.results || songData?.data || songData?.results || [];
    if (!Array.isArray(rawSongs) && songData?.data?.songs?.results) rawSongs = songData.data.songs.results;
    
    let songs = rawSongs.map(transformSong).filter(s => s !== null);
    
    let rawAlbums = albumData?.data?.results || albumData?.data || albumData?.results || [];
    const albums = rawAlbums.map(album => ({
      id: album.id,
      title: (album.name || album.title || "Album").replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
      artist: (album.primaryArtists || album.artist || "Various Artists").replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
      type: 'album',
      coverArt: album.image?.[album.image.length - 1]?.url || album.image?.[album.image.length - 1]?.link || ""
    }));

    const responseData = { songs, albums };
    setToCache(cacheKey, responseData);
    res.json(responseData);
  } catch (error) {
    console.error("Saavn Search Error:", error);
    res.json({ songs: MOCK_SONGS, albums: [] });
  }
});

// Streaming Route
app.get("/api/stream", async (req, res) => {
  const { id, title, artist } = req.query;
  if (!id) return res.status(400).send("ID required");

  // Important for compatibility with all browsers (Chrome/Safari)
  res.setHeader("Accept-Ranges", "bytes");

  const fallbackSaavn = async () => {
    if (!title || !artist) return false;
    try {
      console.log(`[Stream Fallback] Searching Saavn for: ${title} - ${artist}`);
      const data = await fetchFromSaavn("/search/songs", { query: `${title} ${artist}`, limit: 5 });
      const results = data?.data?.results || data?.results || [];
      const match = results[0];
      
      if (match) {
        let dlUrl = "";
        if (Array.isArray(match.downloadUrl)) {
          dlUrl = match.downloadUrl[match.downloadUrl.length - 1]?.url || match.downloadUrl[match.downloadUrl.length - 1]?.link;
        } else if (typeof match.downloadUrl === 'string') {
          dlUrl = match.downloadUrl;
        }

        if (dlUrl) {
          console.log(`[Stream Fallback] Proxying from Saavn: ${dlUrl}`);
          const headers = { ...req.headers };
          delete headers.host;
          delete headers.referer;
          
          const response = await axios.get(dlUrl, { 
            responseType: 'stream', 
            headers, 
            timeout: 5000 
          });
          
          if (response.headers['content-type']) res.setHeader('Content-Type', response.headers['content-type']);
          if (response.headers['content-length']) res.setHeader('Content-Length', response.headers['content-length']);
          if (response.headers['content-range']) res.setHeader('Content-Range', response.headers['content-range']);
          
          res.status(response.status || 200);
          response.data.pipe(res);
          return true;
        }
      }
    } catch (e) {
      console.error("[Fallback Failed]", e.message);
    }
    return false;
  };

  try {
    // Try YouTube first
    const info = await ytdl.getInfo(id).catch(async (err) => {
      console.warn(`[YT Info Failed] ${id}, trying fallback...`);
      const handled = await fallbackSaavn();
      if (!handled && !res.headersSent) res.status(500).send("Audio unavailable");
      throw new Error("Handled by fallback"); 
    });

    if (!info) return;

    const streamOptions = {
      filter: "audioonly",
      quality: "lowestaudio", // Data saving: use efficient low quality for mobile/web
      highWaterMark: 1 << 22
    };

    // Restore Range handling for browsers
    if (req.headers.range) {
      const parts = req.headers.range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : undefined;
      streamOptions.range = { start, end };
      res.status(206);
    }

    const stream = ytdl.downloadFromInfo(info, streamOptions);

    stream.on('error', async (err) => {
      console.error(`[Stream Error] ${id}:`, err.message);
      if (!res.headersSent && (err.message.includes('403') || err.message.includes('Forbidden') || err.message.includes('Status code:'))) {
        const handled = await fallbackSaavn();
        if (!handled) res.end();
      } else if (!res.headersSent) {
        res.end();
      }
    });

    res.setHeader("Content-Type", "audio/mpeg");
    stream.pipe(res);
  } catch (error) {
    if (error.message !== "Handled by fallback") {
      console.error(`[Critical Stream Error] ${id}:`, error.message);
      if (!res.headersSent) res.status(500).send("Stream failed");
    }
  }
});

app.get("/api/trending", async (req, res) => {
  const cached = getFromCache("trending_2026");
  if (cached) return res.json(cached);

  try {
    // Specifically target 2026 latest releases across multiple categories
    const [trendingHindi, globalHits, newReleases] = await Promise.all([
      fetchFromSaavn("/search/songs", { query: "2026 latest hits hindi", limit: 10 }),
      fetchFromSaavn("/search/songs", { query: "global top hits 2026", limit: 10 }),
      fetchFromSaavn("/search/songs", { query: "new releases 2026", limit: 10 })
    ]);
    
    const results = [
      ...(trendingHindi?.data?.results || trendingHindi?.results || []),
      ...(globalHits?.data?.results || globalHits?.results || []),
      ...(newReleases?.data?.results || newReleases?.results || [])
    ].map(transformSong).filter(s => s !== null);

    // Filter for 2026 where possible, or just unique results
    const uniqueResults = Array.from(new Set(results.map(s => s.id)))
      .map(id => results.find(s => s.id === id));

    const response = uniqueResults.length > 0 ? uniqueResults.slice(0, 15) : MOCK_SONGS;
    setToCache("trending_2026", response);
    res.json(response);
  } catch (e) { 
    console.error("Trending fetch error:", e);
    res.json(MOCK_SONGS); 
  }
});

app.get("/api/albums", async (req, res) => {
  const cached = getFromCache("albums_2026");
  if (cached) return res.json(cached);

  try {
    const data = await fetchFromSaavn("/search/albums", { query: "2026 latest hits", limit: 12 });
    const rawAlbums = data?.data?.results || data?.results || [];
    
    const results = rawAlbums.map(album => ({
      id: album.id,
      title: (album.name || album.title).replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
      artist: (album.primaryArtists || album.artist || "Various Artists").replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
      type: 'album',
      coverArt: album.image?.[album.image.length - 1]?.url || album.image?.[album.image.length - 1]?.link || ""
    }));

    setToCache("albums_2026", results);
    res.json(results);
  } catch (error) {
    console.error("Albums fetch error:", error);
    res.json([]);
  }
});

app.get("/api/albums/:id", async (req, res) => {
  try {
    const data = await fetchFromSaavn(`/albums`, { id: req.params.id });
    const album = data?.data || data;
    const songs = (album.songs || []).map(transformSong).filter(s => s !== null);
    res.json({
      id: album.id,
      title: (album.name || album.title).replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
      artist: (album.primaryArtists || album.artist || "Various Artists").replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
      coverArt: album.image?.[album.image.length - 1]?.url || "",
      songs
    });
  } catch (e) { res.status(404).json({ error: "Not found" }); }
});

app.get("/api/recommendations", async (req, res) => {
  const { artist } = req.query;
  const cacheKey = `recs_${artist || 'hits'}`;
  const cached = getFromCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await fetchFromSaavn("/search/songs", { query: artist || "2026 top hits" });
    const results = (data?.data?.results || data?.results || []).map(transformSong).filter(s => s !== null).slice(0, 10);
    setToCache(cacheKey, results);
    res.json(results);
  } catch (e) { res.json(MOCK_SONGS); }
});

app.get("/api/lyrics/:id", async (req, res) => {
  const { title, artist } = req.query;
  if (title && artist) {
    try {
      const resLrc = await axios.get(`https://lrclib.net/api/get`, { params: { track_name: title, artist_name: artist }, timeout: 3000 });
      if (resLrc.data) return res.json({ lyrics: resLrc.data.syncedLyrics || resLrc.data.plainLyrics, isSynced: !!resLrc.data.syncedLyrics });
    } catch (e) {}
  }
  try {
    const data = await fetchFromSaavn(`/songs/${req.params.id}/lyrics`);
    res.json({ lyrics: data?.data?.lyrics || "Lyrics not available." });
  } catch (e) { res.status(404).json({ lyrics: "No lyrics found." }); }
});

app.listen(PORT, "0.0.0.0", () => console.log(`Server on port ${PORT}`));

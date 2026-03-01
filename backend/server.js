const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const SAAVN_MIRRORS = [
  "https://saavn.sumit.co/api",
  "https://saavn.dev/api",
  "https://jiosaavn-api-vn.vercel.app/api",
  "https://jiosaavn-api-2-sumitkolhe.vercel.app/api"
];

const YTMusic = require("ytmusic-api");
const ytdl = require("@distube/ytdl-core");
const ytmusic = new YTMusic();
let ytInitialized = false;

async function initYT() {
  if (!ytInitialized) {
    await ytmusic.initialize();
    ytInitialized = true;
  }
}


// Helper to fetch from mirrors with fallback
async function fetchFromSaavn(endpoint, params = {}) {
  let lastError;
  for (const mirror of SAAVN_MIRRORS) {
    try {
      const response = await axios.get(`${mirror}${endpoint}`, {
        params,
        timeout: 8000
      });
      if (response.data) return response.data;
    } catch (error) {
      console.warn(`Mirror failed: ${mirror}${endpoint} - ${error.message}`);
      lastError = error;
    }
  }
  throw lastError || new Error("All mirrors failed");
}

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Routes
app.post("/api/auth/register", async (req, res) => {
  const { fullName, email, password } = req.body;
  res.status(201).json({ message: "User registered successfully", user: { fullName, email } });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    res.json({ message: "Login successful", user: { fullName: email.split('@')[0], email } });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Music Streaming API is running" });
});

// Mock data for fallback
const MOCK_SONGS = [
  {
    id: "mock_1",
    title: "Celestial Harmonies",
    artist: "Solaris",
    album: "Solar System",
    year: "2025",
    duration: "3:45",
    thumbnail: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: "mock_2",
    title: "Stardust Memories",
    artist: "Nebula",
    album: "Cosmos",
    year: "2024",
    duration: "4:20",
    thumbnail: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=500&q=80",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  }
];

// Helper to transform song data
const transformSong = (song) => {
  try {
    return {
      id: song.id,
      title: song.name,
      artist: song.primaryArtists,
      album: song.album?.name || "Single",
      year: song.year || "",
      duration: song.duration ? (song.duration / 60).toFixed(2).replace('.', ':') : "3:45",
      thumbnail: song.image && song.image[2] ? (song.image[2].url || song.image[2].link) : (song.image && song.image[1] ? (song.image[1].url || song.image[1].link) : "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80"),
      audioSrc: (song.downloadUrl && song.downloadUrl[4] ? (song.downloadUrl[4].url || song.downloadUrl[4].link) : (song.downloadUrl && song.downloadUrl[0] ? (song.downloadUrl[0].url || song.downloadUrl[0].link) : "")) || MOCK_SONGS[0].audioSrc
    };
  } catch (e) {
    return MOCK_SONGS[0];
  }
};

// JioSaavn Proxy Routes
app.get("/api/search", async (req, res) => {
  const { query, source } = req.query;
  if (!query) return res.status(400).json({ error: "Query parameter is required" });

  if (source === 'youtube') {
    try {
      await initYT();
      const results = await ytmusic.search(query, "SONG");
      const songs = results.map(song => ({
        id: song.videoId,
        title: song.name,
        artist: (song.artists || []).map(a => a.name).join(", ") || "Unknown Artist",
        album: song.album?.name || "Single",
        duration: song.duration ? (song.duration / 1000 / 60).toFixed(2).replace('.', ':') : "3:45",
        thumbnail: (song.thumbnails && song.thumbnails.length > 0) ? song.thumbnails[song.thumbnails.length - 1]?.url : "",
        audioSrc: `http://localhost:5000/api/stream?id=${song.videoId}`,
        source: 'youtube'
      }));

      return res.json({ songs, albums: [] });
    } catch (error) {
      console.error("YT Search failed details:", error);
      return res.status(500).json({ error: "YouTube search failed", details: error.message });
    }

  }

  try {
    // Search for both songs and albums to be helpful
    const [songData, albumData] = await Promise.all([
      fetchFromSaavn("/search/songs", { query }),
      fetchFromSaavn("/search/albums", { query })
    ]);

    const songs = (songData?.data?.results || []).map(transformSong);
    const albums = (albumData?.data?.results || []).slice(0, 3).map(album => ({
      id: album.id,
      title: album.name,
      artist: album.primaryArtists,
      type: 'album',
      coverArt: album.image && album.image[2] ? (album.image[2].url || album.image[2].link) : (album.image && album.image[1] ? (album.image[1].url || album.image[1].link) : "")
    }));

    res.json({ songs, albums });
  } catch (error) {
    console.error("Search failed, using mock data:", error.message);
    res.json({ songs: MOCK_SONGS, albums: [] });
  }
});

app.get("/api/stream", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).send("Video ID is required");

  try {
    const info = await ytdl.getInfo(id);
    const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
    
    if (!format) return res.status(404).send("No audio format found");

    res.setHeader("Content-Type", "audio/mpeg");
    ytdl(id, { format }).pipe(res);
  } catch (error) {
    console.error("Streaming error:", error.message);
    res.status(500).send("Streaming failed");
  }
});

app.get("/api/trending", async (req, res) => {
  try {
    // Fetch a mix of trending and global hits
    const [trendingData, globalData] = await Promise.all([
      fetchFromSaavn("/search/songs", { query: "trending hindi 2025" }),
      fetchFromSaavn("/search/songs", { query: "global top hits 2025" })
    ]);
    
    const trending = (trendingData?.data?.results || []).map(transformSong);
    const global = (globalData?.data?.results || []).map(transformSong);
    
    // Interleave or just concat and unique
    const results = [...trending.slice(0, 5), ...global.slice(0, 10)];
    
    if (results.length === 0) return res.json(MOCK_SONGS);
    res.json(results);
  } catch (error) {
    console.error("Trending failed, using mock data:", error.message);
    res.json(MOCK_SONGS);
  }
});


app.get("/api/albums", async (req, res) => {
  try {
    const data = await fetchFromSaavn("/search/albums", { query: "hits" });
    const results = data?.data?.results?.slice(0, 4) || [];
    if (results.length === 0) {
      return res.json([
        { id: "alb_1", title: "Global Hits", artist: "Various Artists", coverArt: MOCK_SONGS[0].thumbnail },
        { id: "alb_2", title: "Synthwave", artist: "Retro Future", coverArt: MOCK_SONGS[1].thumbnail }
      ]);
    }
    res.json(results.map(album => ({
      id: album.id,
      title: album.name,
      artist: album.primaryArtists,
      coverArt: album.image && album.image[2] ? (album.image[2].url || album.image[2].link) : (album.image && album.image[1] ? (album.image[1].url || album.image[1].link) : "")
    })));
  } catch (error) {
    console.error("Albums failed, using mock data:", error.message);
    res.json([
      { id: "alb_1", title: "Global Hits", artist: "Various Artists", coverArt: MOCK_SONGS[0].thumbnail },
      { id: "alb_2", title: "Synthwave", artist: "Retro Future", coverArt: MOCK_SONGS[1].thumbnail }
    ]);
  }
});

app.get("/api/albums/:id", async (req, res) => {
  try {
    const data = await fetchFromSaavn(`/albums`, { id: req.params.id });
    const albumDetails = data?.data;
    if (!albumDetails) return res.status(404).json({ error: "Album not found" });

    const songs = (albumDetails.songs || []).map(transformSong);
    res.json({
      id: albumDetails.id,
      title: albumDetails.name,
      artist: albumDetails.primaryArtists,
      coverArt: albumDetails.image && albumDetails.image[2] ? (albumDetails.image[2].url || albumDetails.image[2].link) : (albumDetails.image && albumDetails.image[1] ? (albumDetails.image[1].url || albumDetails.image[1].link) : ""),
      songs: songs
    });
  } catch (error) {
    console.error("Album lookup failed:", error.message);
    res.status(500).json({ error: "Failed to fetch album details" });
  }
});

app.get("/api/recommendations", async (req, res) => {
  const { artist, songId } = req.query;
  if (!artist) return res.status(400).json({ error: "Artist is required" });

  try {
    // Search for the artist to get more of their songs or similar ones
    const data = await fetchFromSaavn("/search/songs", { query: artist });
    const results = (data?.data?.results || [])
      .map(transformSong)
      .filter(s => s.id !== songId) // Avoid current song
      .slice(0, 10);
      
    res.json(results);
  } catch (error) {
    console.error("Recommendations failed:", error.message);
    res.json(MOCK_SONGS);
  }
});

app.get("/api/lyrics/:id", async (req, res) => {
  const { title, artist } = req.query;
  
  // Try LRCLIB first for better synced lyrics
  if (title && artist) {
    try {
      const lrclibRes = await axios.get(`https://lrclib.net/api/get`, {
        params: { track_name: title, artist_name: artist },
        timeout: 5000
      });
      if (lrclibRes.data) {
        return res.json({ 
          lyrics: lrclibRes.data.syncedLyrics || lrclibRes.data.plainLyrics,
          isSynced: !!lrclibRes.data.syncedLyrics 
        });
      }
    } catch (e) {
      console.warn("LRCLIB fetch failed, trying Saavn...");
    }
  }

  try {
    const data = await fetchFromSaavn(`/songs/${req.params.id}/lyrics`);
    res.json({ lyrics: data?.data?.lyrics || "Lyrics not available for this song." });
  } catch (error) {
    res.status(404).json({ lyrics: "No lyrics found." });
  }
});


app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

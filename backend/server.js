const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";

const { SearchService, AlbumService } = require("jiosaavn-sdk");
const saavnSearch = new SearchService();
const saavnAlbums = new AlbumService();

const YTMusic = require("ytmusic-api");
const ytdl = require("@distube/ytdl-core");
const ytmusic = new YTMusic();
let ytInitialized = false;

// Central decode so titles/artists never show raw &quot; / &#039; etc.
// Pure string cleanup — does not change API shape.
function decodeHtml(value) {
  if (typeof value !== "string" || !value) return "";
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#38;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&#60;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#62;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#(\d+);/g, (_, code) => {
      const n = parseInt(code, 10);
      return isNaN(n) ? "" : String.fromCharCode(n);
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

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

async function getYouTubeVideoId(title, artist) {
  try {
    const searchQuery = `${title} ${artist} audio`;
    console.log(`[YT Search] Searching for: ${searchQuery}`);
    const results = await ytmusic.search(searchQuery, "SONG");
    if (results && results.length > 0) {
      for (let result of results) {
        if (result.videoId) {
          console.log(`[YT Search] Found video: ${result.videoId} - ${result.title}`);
          return result.videoId;
        }
      }
    }
    console.warn(`[YT Search] No video found for: ${searchQuery}`);
    return null;
  } catch (error) {
    console.error(`[YT Search Error]`, error.message);
    return null;
  }
}

async function getPlayableYouTubeVideoId(title, artist) {
  try {
    const searchQuery = `${title} ${artist} audio`;
    const results = await ytmusic.search(searchQuery, "SONG");
    for (const result of results || []) {
      const candidateId = result?.videoId || result?.id;
      if (!candidateId) continue;
      try {
        const info = await ytdl.getInfo(candidateId);
        const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly', quality: 'highestaudio' });
        if (format?.url) return candidateId;
      } catch (err) {
        console.warn(`[YT Search] Candidate ${candidateId} not playable: ${err.message}`);
      }
    }
    return null;
  } catch (error) {
    console.error(`[YT Search Error]`, error.message);
    return null;
  }
}

async function searchYouTubeDataAPI(query) {
  try {
    const params = {
      part: "snippet",
      q: `${query} audio`,
      type: "video",
      videoCategoryId: "10",
      maxResults: 20,
      key: YOUTUBE_API_KEY,
    };
    const res = await axios.get("https://www.googleapis.com/youtube/v3/search", { params, timeout: 5000 });
    return (res.data.items || []).map((item) => ({
      videoId: item.id.videoId,
      name: item.snippet.title,
      title: item.snippet.title,
      artists: [{ name: item.snippet.channelTitle }],
      thumbnails: [{ url: item.snippet.thumbnails?.medium?.url || "" }],
    }));
  } catch (error) {
    console.error("[YouTube Data API] Search failed:", error.message);
    return [];
  }
}

function normalizeYouTubeArtist(song) {
  if (Array.isArray(song?.artists) && song.artists.length > 0) {
    return song.artists
      .map((a) => a?.name || a?.title)
      .filter(Boolean)
      .join(", ");
  }
  if (song?.artist?.name) return song.artist.name;
  if (typeof song?.author === "string" && song.author.trim()) return song.author.trim();
  return "";
}

function normalizeYouTubeSong(song, host, protocol) {
  const videoId = song?.videoId || song?.id || song?.browseId;
  if (!videoId) return null;
  const title = decodeHtml(song?.name || song?.title || "Unknown");
  const artist = decodeHtml(normalizeYouTubeArtist(song));
  const thumbnail = song?.thumbnails?.[song.thumbnails.length - 1]?.url || song?.thumbnail?.url || "";
  return {
    id: videoId,
    title,
    artist,
    album: decodeHtml(song?.album?.name || song?.album || "Single"),
    duration: song?.duration ? (song.duration / 60).toFixed(2).replace(".", ":") : (song?.durationText || "3:45"),
    thumbnail,
    audioSrc: `${protocol}://${host}/api/stream?id=${videoId}&title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}&source=youtube`,
    source: "youtube",
  };
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
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: "mock_2",
    title: "Stardust Pulse",
    artist: "Nebula",
    album: "Cosmos 2026",
    year: "2026",
    duration: "4:20",
    thumbnail: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=500&q=80",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
];

const CACHE = {};
const CACHE_TTL = 3600000;
const CACHE_VERSION = "v5";

function getFromCache(key) {
  const item = CACHE[`${CACHE_VERSION}_${key}`];
  if (item && Date.now() - item.timestamp < CACHE_TTL) return item.data;
  return null;
}

function setToCache(key, data) {
  CACHE[`${CACHE_VERSION}_${key}`] = { data, timestamp: Date.now() };
}

const transformSong = (song) => {
  if (!song) return null;
  try {
    let artistName = "";
    if (song.primaryArtists && typeof song.primaryArtists === "string") {
      artistName = song.primaryArtists;
    } else if (Array.isArray(song.primaryArtists)) {
      artistName = song.primaryArtists.map((a) => a.name || a.title || a).join(", ");
    } else if (song.artists?.primary && Array.isArray(song.artists.primary)) {
      artistName = song.artists.primary.map((a) => a.name || a.title || a).join(", ");
    } else if (song.artist) {
      artistName = song.artist;
    } else if (song.singers) {
      artistName = song.singers;
    }

    let thumb = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80";
    let smallThumb = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&q=80";

    if (Array.isArray(song.image)) {
      const bestImg = song.image[song.image.length - 1];
      const medImg = song.image[Math.min(1, song.image.length - 1)];
      thumb = bestImg.url || bestImg.link || thumb;
      smallThumb = medImg.url || medImg.link || thumb;
    } else if (song.image && typeof song.image === "string") {
      thumb = song.image;
      smallThumb = song.image;
    }

    let downloadLink = "";
    if (Array.isArray(song.downloadUrl)) {
      const midIdx = Math.floor(song.downloadUrl.length / 2);
      const bestDl = song.downloadUrl[midIdx] || song.downloadUrl[0];
      downloadLink = bestDl.url || bestDl.link || "";
    } else if (song.downloadUrl && typeof song.downloadUrl === "string") {
      downloadLink = song.downloadUrl;
    }

    return {
      id: song.id || song.songId || Math.random().toString(36).substr(2, 9),
      title: decodeHtml(song.name || song.title || song.song || "Unknown track"),
      artist: decodeHtml(artistName),
      album: decodeHtml(song.album?.name || song.album || "Single"),
      year: song.year || "",
      duration: song.duration ? (song.duration / 60).toFixed(2).replace(".", ":") : (song.durationText || "3:45"),
      thumbnail: thumb,
      smallThumbnail: smallThumb,
      audioSrc: downloadLink || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      source: "jiosaavn",
    };
  } catch (e) {
    console.error("Transform error:", e);
    return null;
  }
};

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json());

app.post("/api/auth/register", (req, res) => {
  const { fullName, email } = req.body;
  res.status(201).json({ message: "User registered successfully", user: { fullName, email } });
});

app.post("/api/auth/login", (req, res) => {
  const { email } = req.body;
  res.json({ message: "Login successful", user: { fullName: email.split("@")[0], email } });
});

app.get("/", (req, res) => res.send("OffBeat API is running. Use /api/health"));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.get("/api/search", async (req, res) => {
  const { query, source } = req.query;
  if (!query) return res.status(400).json({ error: "Query required" });

  if (source === "youtube") {
    const cacheKey = `yt_search_${query}`;
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);

    try {
      let songResults = [];

      if (YOUTUBE_API_KEY) {
        console.log(`[YT] Using YouTube Data API v3 for: ${query}`);
        songResults = await searchYouTubeDataAPI(query);
      } else {
        console.log(`[YT] Using ytmusic-api (no API key set) for: ${query}`);
        await initYT();
        const [songs, videos, albums] = await Promise.all([
          ytmusic.search(query, "SONG"),
          ytmusic.search(query, "VIDEO"),
          ytmusic.search(query, "ALBUM"),
        ]);
        songResults = [...(songs || []), ...(videos || [])];

        const host = req.get("host");
        const protocol = req.protocol;

        let ytAlbums = (albums || []).slice(0, 8).map((album) => ({
          id: album.albumId || album.id,
          title: decodeHtml(album.name || album.title || "Album"),
          artist: decodeHtml(Array.isArray(album.artists) ? album.artists.map((a) => a.name || a.title).join(", ") : album.author || ""),
          type: "album",
          coverArt: album.thumbnails?.[album.thumbnails.length - 1]?.url || album.thumbnail?.url || "",
          smallCoverArt: album.thumbnails?.[0]?.url || album.thumbnail?.url || "",
        }));

        const normalizedSongs = Array.from(
          new Map(
            songResults
              .map((song) => normalizeYouTubeSong(song, host, protocol))
              .filter(Boolean)
              .map((song) => [song.id, song])
          ).values()
        );

        if (ytAlbums.length === 0 && normalizedSongs.length > 0) {
          ytAlbums = normalizedSongs.slice(0, 5).map((song) => ({
            id: song.id,
            title: song.title,
            artist: song.artist,
            type: "Featured",
            coverArt: song.thumbnail,
          }));
        }

        const response = { songs: normalizedSongs, albums: ytAlbums };
        setToCache(cacheKey, response);
        return res.json(response);
      }

      const host = req.get("host");
      const protocol = req.protocol;

      const normalizedSongs = Array.from(
        new Map(
          songResults
            .map((song) => normalizeYouTubeSong(song, host, protocol))
            .filter(Boolean)
            .map((song) => [song.id, song])
        ).values()
      );

      const albums = normalizedSongs.slice(0, 5).map((song) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        type: "Featured",
        coverArt: song.thumbnail,
      }));

      const response = { songs: normalizedSongs, albums };
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
    const [songResults, albumResults] = await Promise.all([
      saavnSearch.searchSongs({ query, page: 0, limit: 40 }).catch(() => ({ results: [] })),
      saavnSearch.searchAlbums({ query, page: 0, limit: 10 }).catch(() => ({ results: [] })),
    ]);

    const songs = (songResults.results || []).map(transformSong).filter((s) => s !== null);

    const albums = (albumResults.results || []).slice(0, 8).map((album) => ({
      id: album.id,
      title: decodeHtml(album.name || "Album"),
      artist: decodeHtml(album.artists?.primary?.map((a) => a.name).join(", ") || "Various Artists"),
      type: "album",
      coverArt: album.image?.[album.image.length - 1]?.url || "",
      smallCoverArt: album.image?.[0]?.url || "",
    }));

    const responseData = { songs, albums };
    setToCache(cacheKey, responseData);
    res.json(responseData);
  } catch (error) {
    console.error("Saavn Search Error:", error);
    res.json({ songs: MOCK_SONGS, albums: [] });
  }
});

app.get("/api/stream", async (req, res) => {
  const { id, title, artist, source } = req.query;
  if (!id) return res.status(400).send("ID required");
  res.setHeader("Accept-Ranges", "bytes");

  const fallbackSaavn = async () => {
    if (!title || !artist) return false;
    try {
      console.log(`[Stream Fallback] Searching Saavn for: ${title} - ${artist}`);
      const results = await saavnSearch.searchSongs({ query: `${title} ${artist}`, page: 0, limit: 5 }).catch(() => ({ results: [] }));
      const match = (results.results || [])[0];
      if (match) {
        let dlUrl = "";
        if (Array.isArray(match.downloadUrl)) {
          dlUrl = match.downloadUrl[match.downloadUrl.length - 1]?.url || match.downloadUrl[0]?.url;
        } else if (typeof match.downloadUrl === "string") {
          dlUrl = match.downloadUrl;
        }
        if (dlUrl) {
          console.log(`[Stream Fallback] Proxying from Saavn: ${dlUrl}`);
          const headers = { ...req.headers };
          delete headers.host;
          delete headers.referer;
          const response = await axios.get(dlUrl, { responseType: "stream", headers, timeout: 5000 });
          if (response.headers["content-type"]) res.setHeader("Content-Type", response.headers["content-type"]);
          if (response.headers["content-length"]) res.setHeader("Content-Length", response.headers["content-length"]);
          if (response.headers["content-range"]) res.setHeader("Content-Range", response.headers["content-range"]);
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
    if (source === "youtube" || !source) {
      let videoId = id;

      if (!videoId.match(/^[a-zA-Z0-9_-]{11}$/)) {
        console.log(`[YT Stream] ID doesn't look like YouTube video ID, searching...`);
        if (title && artist) {
          const foundId = await getPlayableYouTubeVideoId(title, artist);
          if (foundId) {
            videoId = foundId;
          } else {
            console.warn(`[YT Stream] Could not find video for ${title} by ${artist}`);
            const handled = await fallbackSaavn();
            if (!handled && !res.headersSent) res.status(500).send("Audio unavailable");
            return;
          }
        } else {
          const handled = await fallbackSaavn();
          if (!handled && !res.headersSent) res.status(500).send("Audio unavailable");
          return;
        }
      }

      console.log(`[YT Stream] Attempting to stream: ${videoId}`);

      try {
        let info = await ytdl.getInfo(videoId).catch(async (err) => {
          console.warn(`[YT Info Failed] ${videoId}, trying with search fallback...`);
          if (title && artist) {
            const newId = await getPlayableYouTubeVideoId(title, artist);
            if (newId && newId !== videoId) {
              console.log(`[YT Stream] Found alternative video: ${newId}`);
              try {
                return await ytdl.getInfo(newId);
              } catch (e2) {
                console.error(`[YT Stream] Alternative video also failed: ${e2.message}`);
              }
            }
          }
          const handled = await fallbackSaavn();
          if (!handled && !res.headersSent) res.status(500).send("Audio unavailable");
          throw new Error("Handled by fallback");
        });

        if (!info) return;

        let selectedFormat = null;
        try {
          selectedFormat = ytdl.chooseFormat(info.formats, { filter: "audioonly", quality: "highestaudio" });
        } catch (formatError) {
          console.warn(`[YT Format Failed] ${videoId}: ${formatError.message}`);
        }

        if (!selectedFormat || !selectedFormat.url) {
          console.warn(`[YT Stream] No playable audio format for ${videoId}, trying fallback search...`);
          if (title && artist) {
            const fallbackId = await getPlayableYouTubeVideoId(title, artist);
            if (fallbackId && fallbackId !== videoId) {
              videoId = fallbackId;
              info = await ytdl.getInfo(videoId);
              selectedFormat = ytdl.chooseFormat(info.formats, { filter: "audioonly", quality: "highestaudio" });
            }
          }
        }

        if (!selectedFormat || !selectedFormat.url) {
          const handled = await fallbackSaavn();
          if (!handled && !res.headersSent) res.status(500).send("Audio unavailable");
          return;
        }

        const streamOptions = {
          filter: "audioonly",
          quality: "highestaudio",
          highWaterMark: 1 << 22,
        };

        if (req.headers.range) {
          const parts = req.headers.range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : undefined;
          streamOptions.range = { start, end };
          res.status(206);
        }

        const stream = ytdl.downloadFromInfo(info, streamOptions);
        stream.on("error", async (err) => {
          console.error(`[Stream Error] ${videoId}:`, err.message);
          if (!res.headersSent && (err.message.includes("403") || err.message.includes("Forbidden") || err.message.includes("Status code:"))) {
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
          console.error(`[Critical Stream Error] ${videoId}:`, error.message);
          if (!res.headersSent) res.status(500).send("Stream failed");
        }
      }
    } else {
      const handled = await fallbackSaavn();
      if (!handled && !res.headersSent) res.status(500).send("Audio unavailable");
    }
  } catch (error) {
    console.error(`[Stream Handler Error]:`, error.message);
    if (!res.headersSent) res.status(500).send("Stream processing failed");
  }
});

app.get("/api/trending", async (req, res) => {
  const cached = getFromCache("trending_2026");
  if (cached) return res.json(cached);

  try {
    let results = [];

    try {
      const [hindi, globalHits, newReleases] = await Promise.all([
        saavnSearch.searchSongs({ query: "2026 latest hits hindi", page: 0, limit: 10 }).catch(() => ({ results: [] })),
        saavnSearch.searchSongs({ query: "global top hits 2026", page: 0, limit: 10 }).catch(() => ({ results: [] })),
        saavnSearch.searchSongs({ query: "new releases 2026", page: 0, limit: 10 }).catch(() => ({ results: [] })),
      ]);

      const allResults = [
        ...(hindi.results || []),
        ...(globalHits.results || []),
        ...(newReleases.results || []),
      ].map(transformSong).filter((s) => s !== null);

      results = Array.from(new Set(allResults.map((s) => s.id)))
        .map((id) => allResults.find((s) => s.id === id));
    } catch (e) {
      console.error("[Trending] Search failed:", e.message);
    }

    const response = results.length > 0 ? results.slice(0, 15) : MOCK_SONGS;
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
    const data = await saavnSearch.searchAlbums({ query: "2026 latest hits", page: 0, limit: 12 }).catch(() => ({ results: [] }));
    const results = (data.results || []).map((album) => ({
      id: album.id,
      title: decodeHtml(album.name || "Album"),
      artist: decodeHtml(album.artists?.primary?.map((a) => a.name).join(", ") || "Various Artists"),
      type: "album",
      coverArt: album.image?.[album.image.length - 1]?.url || "",
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
    const album = await saavnAlbums.getAlbumById(req.params.id);
    const songs = (album.songs || []).map(transformSong).filter((s) => s !== null);
    res.json({
      id: album.id,
      title: decodeHtml(album.name || "Album"),
      artist: decodeHtml(album.artists?.primary?.map((a) => a.name).join(", ") || "Various Artists"),
      coverArt: album.image?.[album.image.length - 1]?.url || "",
      songs,
    });
  } catch (e) {
    console.error("Album detail fetch error:", e);
    res.status(404).json({ error: "Not found" });
  }
});

app.get("/api/recommendations", async (req, res) => {
  const { artist } = req.query;
  const cacheKey = `recs_${artist || "hits"}`;
  const cached = getFromCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await saavnSearch.searchSongs({ query: artist || "2026 top hits", page: 0, limit: 10 }).catch(() => ({ results: [] }));
    const results = (data.results || []).map(transformSong).filter((s) => s !== null).slice(0, 10);
    setToCache(cacheKey, results);
    res.json(results);
  } catch (e) {
    res.json(MOCK_SONGS);
  }
});

app.get("/api/lyrics/:id", async (req, res) => {
  const { title, artist } = req.query;
  if (title && artist) {
    try {
      const resLrc = await axios.get("https://lrclib.net/api/get", {
        params: { track_name: title, artist_name: artist },
        timeout: 3000,
      });
      if (resLrc.data) return res.json({ lyrics: resLrc.data.syncedLyrics || resLrc.data.plainLyrics, isSynced: !!resLrc.data.syncedLyrics });
    } catch (e) {}
  }
  try {
    const lyricsRes = await axios.get(`https://api.jiosaavn.com/api/songs/${req.params.id}/lyrics`, { timeout: 3000 });
    res.json({ lyrics: lyricsRes.data?.lyrics || "Lyrics not available." });
  } catch (e) {
    res.status(404).json({ lyrics: "No lyrics found." });
  }
});

app.post("/api/import", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL required" });

  if (url.includes("spotify")) {
    return res.status(400).json({ error: "Spotify import is not supported yet. Use a YouTube Music playlist URL instead." });
  }

  const ytMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (!ytMatch) return res.status(400).json({ error: "Invalid playlist URL. Provide a YouTube Music playlist link." });

  const playlistId = ytMatch[1];

  try {
    await initYT();
    const playlist = await ytmusic.getPlaylist(playlistId);
    const playlistVideos = playlist?.videos || playlist?.tracks || (
      typeof ytmusic.getPlaylistVideos === "function"
        ? await ytmusic.getPlaylistVideos(playlistId)
        : []
    );

    if (!playlistVideos || playlistVideos.length === 0) {
      return res.status(404).json({ error: "Playlist not found or is empty." });
    }

    const host = req.get("host");
    const protocol = req.protocol;

    const tracks = playlistVideos
      .map((song) => normalizeYouTubeSong(song, host, protocol))
      .filter(Boolean);

    if (tracks.length === 0) {
      return res.status(404).json({ error: "No importable tracks found in playlist." });
    }

    res.json({
      success: true,
      title: playlist?.title || playlist?.name || "YouTube Music Playlist",
      tracks,
    });
  } catch (error) {
    console.error("[Import Error]", error.message);
    res.status(500).json({ error: "Failed to import playlist. Make sure the playlist is public." });
  }
});

app.listen(PORT, "0.0.0.0", () => console.log(`Server on port ${PORT}`));

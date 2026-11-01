const axios = require("axios");

const BASE_URL = "https://jiosaavn-api.vercel.app";

async function test() {
  try {
    console.log("Testing song endpoint for gf9JI8lx...");
    const songRes = await axios.get(`${BASE_URL}/song`, { params: { id: "gf9JI8lx" } });
    console.log("Song Keys:", Object.keys(songRes.data));
    console.log("Media URL:", songRes.data.media_url);
    console.log("Media URLs:", JSON.stringify(songRes.data.media_urls, null, 2));

    console.log("\nTesting album endpoint for 57173845...");
    const albumRes = await axios.get(`${BASE_URL}/album`, { params: { id: "57173845" } });
    console.log("Album Keys:", Object.keys(albumRes.data));
    console.log("Album Title:", albumRes.data.title || albumRes.data.album);
    console.log("Number of songs in album:", albumRes.data.songs?.length || 0);
    if (albumRes.data.songs && albumRes.data.songs.length > 0) {
      console.log("First song in album details:", JSON.stringify(albumRes.data.songs[0], null, 2).slice(0, 500));
    }
  } catch (err) {
    console.error("Test failed:", err.message);
  }
}

test();

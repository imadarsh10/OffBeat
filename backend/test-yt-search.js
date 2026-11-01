const YTMusic = require("ytmusic-api");
const ytmusic = new YTMusic();

async function test() {
  try {
    console.log("Initializing...");
    await ytmusic.initialize();
    console.log("Searching...");
    const results = await ytmusic.search("shape of you", "SONG");
    console.log("Found:", results.length);
    if (results.length > 0) {
        console.log("First title:", results[0].name || results[0].title);
    }
  } catch (err) {
    console.error("FAILED", err.message);
  }
}
test();

const YTMusic = require('ytmusic-api');

async function test() {
  try {
    const ytmusic = new YTMusic();
    await ytmusic.initialize();

    console.log("Searching for Master the blaster...");
    const songs = await ytmusic.search("Master the blaster", "SONG");
    if (songs && songs.length > 0) {
      console.log("SONG 0:", JSON.stringify(songs[0], null, 2));
    }
  } catch (err) {
    console.error(err);
  }
}
test();

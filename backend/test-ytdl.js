const ytdl = require("@distube/ytdl-core");
const fs = require("fs");

const id = "uhyF_ALqtDA";

async function test() {
  try {
    console.log("Fetching info for", id);
    const info = await ytdl.getInfo(id);
    const formats = ytdl.filterFormats(info.formats, 'audioonly');
    console.log("Starting stream via downloadFromInfo...");
    const stream = ytdl.downloadFromInfo(info, {
      filter: "audioonly",
      quality: "highestaudio"
    });
    const file = fs.createWriteStream("test_output.mp3");
    
    stream.pipe(file);
    
    let bytes = 0;
    stream.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > 100000) { // Stop after 100KB
        console.log("Received 100KB, success!");
        stream.destroy();
        file.close();
        process.exit(0);
      }
    });

    stream.on('error', (err) => console.error("Stream error:", err.message));
  } catch (err) {
    console.error("FAILED:", err.message);
  }
}

test();

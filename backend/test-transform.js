const { SearchService } = require('jiosaavn-sdk');
const saavnSearch = new SearchService();

const transformSong = (song) => {
  if (!song) return null;
  try {
    let artistName = "Various Artists";
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

    return artistName;
  } catch (e) {
    console.error("Transform error:", e);
    return null;
  }
};

async function test() {
  try {
    const res = await saavnSearch.searchSongs({ query: 'vaathi coming', page: 0, limit: 1 });
    const song = res.results[0];
    console.log(JSON.stringify(song.artists, null, 2));
    console.log("Transformed artist:", transformSong(song));
  } catch (err) {
    console.error(err);
  }
}
test();

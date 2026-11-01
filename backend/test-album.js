const { AlbumService } = require('jiosaavn-sdk');
const saavnAlbums = new AlbumService();

async function test() {
  try {
    // Search an album to get an ID first, e.g. "Master"
    const { SearchService } = require('jiosaavn-sdk');
    const saavnSearch = new SearchService();
    const res = await saavnSearch.searchAlbums({ query: 'master', limit: 1 });
    const albumId = res.results[0].id;
    console.log("Album ID:", albumId);

    const album = await saavnAlbums.getAlbumById(albumId);
    console.log("Album Songs Primary Artists:", JSON.stringify(album.songs[0].artists, null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();

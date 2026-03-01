import { z } from 'zod';

type ThumbnailFull = z.infer<typeof ThumbnailFull>;
declare const ThumbnailFull: z.ZodObject<{
    url: z.ZodString;
    width: z.ZodNumber;
    height: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    url: string;
    width: number;
    height: number;
}, {
    url: string;
    width: number;
    height: number;
}>;
type ArtistBasic = z.infer<typeof ArtistBasic>;
declare const ArtistBasic: z.ZodObject<{
    artistId: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
}, "strict", z.ZodTypeAny, {
    artistId: string | null;
    name: string;
}, {
    artistId: string | null;
    name: string;
}>;
type AlbumBasic = z.infer<typeof AlbumBasic>;
declare const AlbumBasic: z.ZodObject<{
    albumId: z.ZodString;
    name: z.ZodString;
}, "strict", z.ZodTypeAny, {
    name: string;
    albumId: string;
}, {
    name: string;
    albumId: string;
}>;
type SongDetailed = z.infer<typeof SongDetailed>;
declare const SongDetailed: z.ZodObject<{
    type: z.ZodLiteral<"SONG">;
    videoId: z.ZodString;
    name: z.ZodString;
    artist: z.ZodObject<{
        artistId: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        artistId: string | null;
        name: string;
    }, {
        artistId: string | null;
        name: string;
    }>;
    album: z.ZodNullable<z.ZodObject<{
        albumId: z.ZodString;
        name: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        name: string;
        albumId: string;
    }, {
        name: string;
        albumId: string;
    }>>;
    duration: z.ZodNullable<z.ZodNumber>;
    thumbnails: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        url: string;
        width: number;
        height: number;
    }, {
        url: string;
        width: number;
        height: number;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    type: "SONG";
    name: string;
    videoId: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    album: {
        name: string;
        albumId: string;
    } | null;
    duration: number | null;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
}, {
    type: "SONG";
    name: string;
    videoId: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    album: {
        name: string;
        albumId: string;
    } | null;
    duration: number | null;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
}>;
type VideoDetailed = z.infer<typeof VideoDetailed>;
declare const VideoDetailed: z.ZodObject<{
    type: z.ZodLiteral<"VIDEO">;
    videoId: z.ZodString;
    name: z.ZodString;
    artist: z.ZodObject<{
        artistId: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        artistId: string | null;
        name: string;
    }, {
        artistId: string | null;
        name: string;
    }>;
    duration: z.ZodNullable<z.ZodNumber>;
    thumbnails: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        url: string;
        width: number;
        height: number;
    }, {
        url: string;
        width: number;
        height: number;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    type: "VIDEO";
    name: string;
    videoId: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    duration: number | null;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
}, {
    type: "VIDEO";
    name: string;
    videoId: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    duration: number | null;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
}>;
type ArtistDetailed = z.infer<typeof ArtistDetailed>;
declare const ArtistDetailed: z.ZodObject<{
    artistId: z.ZodString;
    name: z.ZodString;
    type: z.ZodLiteral<"ARTIST">;
    thumbnails: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        url: string;
        width: number;
        height: number;
    }, {
        url: string;
        width: number;
        height: number;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    type: "ARTIST";
    artistId: string;
    name: string;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
}, {
    type: "ARTIST";
    artistId: string;
    name: string;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
}>;
type AlbumDetailed = z.infer<typeof AlbumDetailed>;
declare const AlbumDetailed: z.ZodObject<{
    type: z.ZodLiteral<"ALBUM">;
    albumId: z.ZodString;
    playlistId: z.ZodString;
    name: z.ZodString;
    artist: z.ZodObject<{
        artistId: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        artistId: string | null;
        name: string;
    }, {
        artistId: string | null;
        name: string;
    }>;
    year: z.ZodNullable<z.ZodNumber>;
    thumbnails: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        url: string;
        width: number;
        height: number;
    }, {
        url: string;
        width: number;
        height: number;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    type: "ALBUM";
    name: string;
    albumId: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    playlistId: string;
    year: number | null;
}, {
    type: "ALBUM";
    name: string;
    albumId: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    playlistId: string;
    year: number | null;
}>;
type PlaylistDetailed = z.infer<typeof PlaylistDetailed>;
declare const PlaylistDetailed: z.ZodObject<{
    type: z.ZodLiteral<"PLAYLIST">;
    playlistId: z.ZodString;
    name: z.ZodString;
    artist: z.ZodObject<{
        artistId: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        artistId: string | null;
        name: string;
    }, {
        artistId: string | null;
        name: string;
    }>;
    thumbnails: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        url: string;
        width: number;
        height: number;
    }, {
        url: string;
        width: number;
        height: number;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    type: "PLAYLIST";
    name: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    playlistId: string;
}, {
    type: "PLAYLIST";
    name: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    playlistId: string;
}>;
type SongFull = z.infer<typeof SongFull>;
declare const SongFull: z.ZodObject<{
    type: z.ZodLiteral<"SONG">;
    videoId: z.ZodString;
    name: z.ZodString;
    artist: z.ZodObject<{
        artistId: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        artistId: string | null;
        name: string;
    }, {
        artistId: string | null;
        name: string;
    }>;
    duration: z.ZodNumber;
    thumbnails: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        url: string;
        width: number;
        height: number;
    }, {
        url: string;
        width: number;
        height: number;
    }>, "many">;
    formats: z.ZodArray<z.ZodAny, "many">;
    adaptiveFormats: z.ZodArray<z.ZodAny, "many">;
}, "strict", z.ZodTypeAny, {
    type: "SONG";
    name: string;
    videoId: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    duration: number;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    formats: any[];
    adaptiveFormats: any[];
}, {
    type: "SONG";
    name: string;
    videoId: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    duration: number;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    formats: any[];
    adaptiveFormats: any[];
}>;
type VideoFull = z.infer<typeof VideoFull>;
declare const VideoFull: z.ZodObject<{
    type: z.ZodLiteral<"VIDEO">;
    videoId: z.ZodString;
    name: z.ZodString;
    artist: z.ZodObject<{
        artistId: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        artistId: string | null;
        name: string;
    }, {
        artistId: string | null;
        name: string;
    }>;
    duration: z.ZodNumber;
    thumbnails: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        url: string;
        width: number;
        height: number;
    }, {
        url: string;
        width: number;
        height: number;
    }>, "many">;
    unlisted: z.ZodBoolean;
    familySafe: z.ZodBoolean;
    paid: z.ZodBoolean;
    tags: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    type: "VIDEO";
    name: string;
    videoId: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    duration: number;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    unlisted: boolean;
    familySafe: boolean;
    paid: boolean;
    tags: string[];
}, {
    type: "VIDEO";
    name: string;
    videoId: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    duration: number;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    unlisted: boolean;
    familySafe: boolean;
    paid: boolean;
    tags: string[];
}>;
type UpNextsDetails = z.infer<typeof UpNextsDetails>;
declare const UpNextsDetails: z.ZodObject<{
    type: z.ZodLiteral<"SONG">;
    videoId: z.ZodString;
    title: z.ZodString;
    artists: z.ZodObject<{
        artistId: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        artistId: string | null;
        name: string;
    }, {
        artistId: string | null;
        name: string;
    }>;
    duration: z.ZodNumber;
    thumbnails: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        url: string;
        width: number;
        height: number;
    }, {
        url: string;
        width: number;
        height: number;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    type: "SONG";
    videoId: string;
    duration: number;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    title: string;
    artists: {
        artistId: string | null;
        name: string;
    };
}, {
    type: "SONG";
    videoId: string;
    duration: number;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    title: string;
    artists: {
        artistId: string | null;
        name: string;
    };
}>;
type ArtistFull = z.infer<typeof ArtistFull>;
declare const ArtistFull: z.ZodObject<{
    artistId: z.ZodString;
    name: z.ZodString;
    type: z.ZodLiteral<"ARTIST">;
    thumbnails: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        url: string;
        width: number;
        height: number;
    }, {
        url: string;
        width: number;
        height: number;
    }>, "many">;
    topSongs: z.ZodArray<z.ZodObject<{
        type: z.ZodLiteral<"SONG">;
        videoId: z.ZodString;
        name: z.ZodString;
        artist: z.ZodObject<{
            artistId: z.ZodNullable<z.ZodString>;
            name: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            artistId: string | null;
            name: string;
        }, {
            artistId: string | null;
            name: string;
        }>;
        album: z.ZodNullable<z.ZodObject<{
            albumId: z.ZodString;
            name: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            name: string;
            albumId: string;
        }, {
            name: string;
            albumId: string;
        }>>;
        duration: z.ZodNullable<z.ZodNumber>;
        thumbnails: z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            url: string;
            width: number;
            height: number;
        }, {
            url: string;
            width: number;
            height: number;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        type: "SONG";
        name: string;
        videoId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        album: {
            name: string;
            albumId: string;
        } | null;
        duration: number | null;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    }, {
        type: "SONG";
        name: string;
        videoId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        album: {
            name: string;
            albumId: string;
        } | null;
        duration: number | null;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    }>, "many">;
    topAlbums: z.ZodArray<z.ZodObject<{
        type: z.ZodLiteral<"ALBUM">;
        albumId: z.ZodString;
        playlistId: z.ZodString;
        name: z.ZodString;
        artist: z.ZodObject<{
            artistId: z.ZodNullable<z.ZodString>;
            name: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            artistId: string | null;
            name: string;
        }, {
            artistId: string | null;
            name: string;
        }>;
        year: z.ZodNullable<z.ZodNumber>;
        thumbnails: z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            url: string;
            width: number;
            height: number;
        }, {
            url: string;
            width: number;
            height: number;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        type: "ALBUM";
        name: string;
        albumId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
        playlistId: string;
        year: number | null;
    }, {
        type: "ALBUM";
        name: string;
        albumId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
        playlistId: string;
        year: number | null;
    }>, "many">;
    topSingles: z.ZodArray<z.ZodObject<{
        type: z.ZodLiteral<"ALBUM">;
        albumId: z.ZodString;
        playlistId: z.ZodString;
        name: z.ZodString;
        artist: z.ZodObject<{
            artistId: z.ZodNullable<z.ZodString>;
            name: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            artistId: string | null;
            name: string;
        }, {
            artistId: string | null;
            name: string;
        }>;
        year: z.ZodNullable<z.ZodNumber>;
        thumbnails: z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            url: string;
            width: number;
            height: number;
        }, {
            url: string;
            width: number;
            height: number;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        type: "ALBUM";
        name: string;
        albumId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
        playlistId: string;
        year: number | null;
    }, {
        type: "ALBUM";
        name: string;
        albumId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
        playlistId: string;
        year: number | null;
    }>, "many">;
    topVideos: z.ZodArray<z.ZodObject<{
        type: z.ZodLiteral<"VIDEO">;
        videoId: z.ZodString;
        name: z.ZodString;
        artist: z.ZodObject<{
            artistId: z.ZodNullable<z.ZodString>;
            name: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            artistId: string | null;
            name: string;
        }, {
            artistId: string | null;
            name: string;
        }>;
        duration: z.ZodNullable<z.ZodNumber>;
        thumbnails: z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            url: string;
            width: number;
            height: number;
        }, {
            url: string;
            width: number;
            height: number;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        type: "VIDEO";
        name: string;
        videoId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        duration: number | null;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    }, {
        type: "VIDEO";
        name: string;
        videoId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        duration: number | null;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    }>, "many">;
    featuredOn: z.ZodArray<z.ZodObject<{
        type: z.ZodLiteral<"PLAYLIST">;
        playlistId: z.ZodString;
        name: z.ZodString;
        artist: z.ZodObject<{
            artistId: z.ZodNullable<z.ZodString>;
            name: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            artistId: string | null;
            name: string;
        }, {
            artistId: string | null;
            name: string;
        }>;
        thumbnails: z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            url: string;
            width: number;
            height: number;
        }, {
            url: string;
            width: number;
            height: number;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        type: "PLAYLIST";
        name: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
        playlistId: string;
    }, {
        type: "PLAYLIST";
        name: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
        playlistId: string;
    }>, "many">;
    similarArtists: z.ZodArray<z.ZodObject<{
        artistId: z.ZodString;
        name: z.ZodString;
        type: z.ZodLiteral<"ARTIST">;
        thumbnails: z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            url: string;
            width: number;
            height: number;
        }, {
            url: string;
            width: number;
            height: number;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        type: "ARTIST";
        artistId: string;
        name: string;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    }, {
        type: "ARTIST";
        artistId: string;
        name: string;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    type: "ARTIST";
    artistId: string;
    name: string;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    topSongs: {
        type: "SONG";
        name: string;
        videoId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        album: {
            name: string;
            albumId: string;
        } | null;
        duration: number | null;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    }[];
    topAlbums: {
        type: "ALBUM";
        name: string;
        albumId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
        playlistId: string;
        year: number | null;
    }[];
    topSingles: {
        type: "ALBUM";
        name: string;
        albumId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
        playlistId: string;
        year: number | null;
    }[];
    topVideos: {
        type: "VIDEO";
        name: string;
        videoId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        duration: number | null;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    }[];
    featuredOn: {
        type: "PLAYLIST";
        name: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
        playlistId: string;
    }[];
    similarArtists: {
        type: "ARTIST";
        artistId: string;
        name: string;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    }[];
}, {
    type: "ARTIST";
    artistId: string;
    name: string;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    topSongs: {
        type: "SONG";
        name: string;
        videoId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        album: {
            name: string;
            albumId: string;
        } | null;
        duration: number | null;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    }[];
    topAlbums: {
        type: "ALBUM";
        name: string;
        albumId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
        playlistId: string;
        year: number | null;
    }[];
    topSingles: {
        type: "ALBUM";
        name: string;
        albumId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
        playlistId: string;
        year: number | null;
    }[];
    topVideos: {
        type: "VIDEO";
        name: string;
        videoId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        duration: number | null;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    }[];
    featuredOn: {
        type: "PLAYLIST";
        name: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
        playlistId: string;
    }[];
    similarArtists: {
        type: "ARTIST";
        artistId: string;
        name: string;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    }[];
}>;
type AlbumFull = z.infer<typeof AlbumFull>;
declare const AlbumFull: z.ZodObject<{
    type: z.ZodLiteral<"ALBUM">;
    albumId: z.ZodString;
    playlistId: z.ZodString;
    name: z.ZodString;
    artist: z.ZodObject<{
        artistId: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        artistId: string | null;
        name: string;
    }, {
        artistId: string | null;
        name: string;
    }>;
    year: z.ZodNullable<z.ZodNumber>;
    thumbnails: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        url: string;
        width: number;
        height: number;
    }, {
        url: string;
        width: number;
        height: number;
    }>, "many">;
    songs: z.ZodArray<z.ZodObject<{
        type: z.ZodLiteral<"SONG">;
        videoId: z.ZodString;
        name: z.ZodString;
        artist: z.ZodObject<{
            artistId: z.ZodNullable<z.ZodString>;
            name: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            artistId: string | null;
            name: string;
        }, {
            artistId: string | null;
            name: string;
        }>;
        album: z.ZodNullable<z.ZodObject<{
            albumId: z.ZodString;
            name: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            name: string;
            albumId: string;
        }, {
            name: string;
            albumId: string;
        }>>;
        duration: z.ZodNullable<z.ZodNumber>;
        thumbnails: z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            url: string;
            width: number;
            height: number;
        }, {
            url: string;
            width: number;
            height: number;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        type: "SONG";
        name: string;
        videoId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        album: {
            name: string;
            albumId: string;
        } | null;
        duration: number | null;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    }, {
        type: "SONG";
        name: string;
        videoId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        album: {
            name: string;
            albumId: string;
        } | null;
        duration: number | null;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    type: "ALBUM";
    name: string;
    albumId: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    playlistId: string;
    year: number | null;
    songs: {
        type: "SONG";
        name: string;
        videoId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        album: {
            name: string;
            albumId: string;
        } | null;
        duration: number | null;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    }[];
}, {
    type: "ALBUM";
    name: string;
    albumId: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    playlistId: string;
    year: number | null;
    songs: {
        type: "SONG";
        name: string;
        videoId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        album: {
            name: string;
            albumId: string;
        } | null;
        duration: number | null;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    }[];
}>;
type PlaylistFull = z.infer<typeof PlaylistFull>;
declare const PlaylistFull: z.ZodObject<{
    type: z.ZodLiteral<"PLAYLIST">;
    playlistId: z.ZodString;
    name: z.ZodString;
    artist: z.ZodObject<{
        artistId: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        artistId: string | null;
        name: string;
    }, {
        artistId: string | null;
        name: string;
    }>;
    videoCount: z.ZodNumber;
    thumbnails: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        url: string;
        width: number;
        height: number;
    }, {
        url: string;
        width: number;
        height: number;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    type: "PLAYLIST";
    name: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    playlistId: string;
    videoCount: number;
}, {
    type: "PLAYLIST";
    name: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    playlistId: string;
    videoCount: number;
}>;
type SearchResult = z.infer<typeof SearchResult>;
declare const SearchResult: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"SONG">;
    videoId: z.ZodString;
    name: z.ZodString;
    artist: z.ZodObject<{
        artistId: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        artistId: string | null;
        name: string;
    }, {
        artistId: string | null;
        name: string;
    }>;
    album: z.ZodNullable<z.ZodObject<{
        albumId: z.ZodString;
        name: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        name: string;
        albumId: string;
    }, {
        name: string;
        albumId: string;
    }>>;
    duration: z.ZodNullable<z.ZodNumber>;
    thumbnails: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        url: string;
        width: number;
        height: number;
    }, {
        url: string;
        width: number;
        height: number;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    type: "SONG";
    name: string;
    videoId: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    album: {
        name: string;
        albumId: string;
    } | null;
    duration: number | null;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
}, {
    type: "SONG";
    name: string;
    videoId: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    album: {
        name: string;
        albumId: string;
    } | null;
    duration: number | null;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"VIDEO">;
    videoId: z.ZodString;
    name: z.ZodString;
    artist: z.ZodObject<{
        artistId: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        artistId: string | null;
        name: string;
    }, {
        artistId: string | null;
        name: string;
    }>;
    duration: z.ZodNullable<z.ZodNumber>;
    thumbnails: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        url: string;
        width: number;
        height: number;
    }, {
        url: string;
        width: number;
        height: number;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    type: "VIDEO";
    name: string;
    videoId: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    duration: number | null;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
}, {
    type: "VIDEO";
    name: string;
    videoId: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    duration: number | null;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"ALBUM">;
    albumId: z.ZodString;
    playlistId: z.ZodString;
    name: z.ZodString;
    artist: z.ZodObject<{
        artistId: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        artistId: string | null;
        name: string;
    }, {
        artistId: string | null;
        name: string;
    }>;
    year: z.ZodNullable<z.ZodNumber>;
    thumbnails: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        url: string;
        width: number;
        height: number;
    }, {
        url: string;
        width: number;
        height: number;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    type: "ALBUM";
    name: string;
    albumId: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    playlistId: string;
    year: number | null;
}, {
    type: "ALBUM";
    name: string;
    albumId: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    playlistId: string;
    year: number | null;
}>, z.ZodObject<{
    artistId: z.ZodString;
    name: z.ZodString;
    type: z.ZodLiteral<"ARTIST">;
    thumbnails: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        url: string;
        width: number;
        height: number;
    }, {
        url: string;
        width: number;
        height: number;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    type: "ARTIST";
    artistId: string;
    name: string;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
}, {
    type: "ARTIST";
    artistId: string;
    name: string;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"PLAYLIST">;
    playlistId: z.ZodString;
    name: z.ZodString;
    artist: z.ZodObject<{
        artistId: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        artistId: string | null;
        name: string;
    }, {
        artistId: string | null;
        name: string;
    }>;
    thumbnails: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        url: string;
        width: number;
        height: number;
    }, {
        url: string;
        width: number;
        height: number;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    type: "PLAYLIST";
    name: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    playlistId: string;
}, {
    type: "PLAYLIST";
    name: string;
    artist: {
        artistId: string | null;
        name: string;
    };
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    playlistId: string;
}>]>;
type HomeSection = z.infer<typeof HomeSection>;
declare const HomeSection: z.ZodObject<{
    title: z.ZodString;
    contents: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        type: z.ZodLiteral<"ALBUM">;
        albumId: z.ZodString;
        playlistId: z.ZodString;
        name: z.ZodString;
        artist: z.ZodObject<{
            artistId: z.ZodNullable<z.ZodString>;
            name: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            artistId: string | null;
            name: string;
        }, {
            artistId: string | null;
            name: string;
        }>;
        year: z.ZodNullable<z.ZodNumber>;
        thumbnails: z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            url: string;
            width: number;
            height: number;
        }, {
            url: string;
            width: number;
            height: number;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        type: "ALBUM";
        name: string;
        albumId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
        playlistId: string;
        year: number | null;
    }, {
        type: "ALBUM";
        name: string;
        albumId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
        playlistId: string;
        year: number | null;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"PLAYLIST">;
        playlistId: z.ZodString;
        name: z.ZodString;
        artist: z.ZodObject<{
            artistId: z.ZodNullable<z.ZodString>;
            name: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            artistId: string | null;
            name: string;
        }, {
            artistId: string | null;
            name: string;
        }>;
        thumbnails: z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            url: string;
            width: number;
            height: number;
        }, {
            url: string;
            width: number;
            height: number;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        type: "PLAYLIST";
        name: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
        playlistId: string;
    }, {
        type: "PLAYLIST";
        name: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
        playlistId: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"SONG">;
        videoId: z.ZodString;
        name: z.ZodString;
        artist: z.ZodObject<{
            artistId: z.ZodNullable<z.ZodString>;
            name: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            artistId: string | null;
            name: string;
        }, {
            artistId: string | null;
            name: string;
        }>;
        album: z.ZodNullable<z.ZodObject<{
            albumId: z.ZodString;
            name: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            name: string;
            albumId: string;
        }, {
            name: string;
            albumId: string;
        }>>;
        duration: z.ZodNullable<z.ZodNumber>;
        thumbnails: z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            url: string;
            width: number;
            height: number;
        }, {
            url: string;
            width: number;
            height: number;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        type: "SONG";
        name: string;
        videoId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        album: {
            name: string;
            albumId: string;
        } | null;
        duration: number | null;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    }, {
        type: "SONG";
        name: string;
        videoId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        album: {
            name: string;
            albumId: string;
        } | null;
        duration: number | null;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    }>]>, "many">;
}, "strict", z.ZodTypeAny, {
    title: string;
    contents: ({
        type: "SONG";
        name: string;
        videoId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        album: {
            name: string;
            albumId: string;
        } | null;
        duration: number | null;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    } | {
        type: "ALBUM";
        name: string;
        albumId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
        playlistId: string;
        year: number | null;
    } | {
        type: "PLAYLIST";
        name: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
        playlistId: string;
    })[];
}, {
    title: string;
    contents: ({
        type: "SONG";
        name: string;
        videoId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        album: {
            name: string;
            albumId: string;
        } | null;
        duration: number | null;
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    } | {
        type: "ALBUM";
        name: string;
        albumId: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
        playlistId: string;
        year: number | null;
    } | {
        type: "PLAYLIST";
        name: string;
        artist: {
            artistId: string | null;
            name: string;
        };
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
        playlistId: string;
    })[];
}>;

declare class YTMusic {
    private cookiejar;
    private config?;
    private client;
    /**
     * Creates an instance of YTMusic
     * Make sure to call initialize()
     */
    constructor();
    /**
     * Initializes the API
     */
    initialize(options?: {
        cookies?: string;
        GL?: string;
        HL?: string;
    }): Promise<this | undefined>;
    /**
     * Constructs a basic YouTube Music API request with all essential headers
     * and body parameters needed to make the API work
     *
     * @param endpoint Endpoint for the request
     * @param body Body
     * @param query Search params
     * @returns Raw response from YouTube Music API which needs to be parsed
     */
    private constructRequest;
    /**
     * Get a list of search suggestiong based on the query
     *
     * @param query Query string
     * @returns Search suggestions
     */
    getSearchSuggestions(query: string): Promise<string[]>;
    /**
     * Searches YouTube Music API for results
     *
     * @param query Query string
     */
    search(query: string): Promise<SearchResult[]>;
    /**
     * Searches YouTube Music API for songs
     *
     * @param query Query string
     */
    searchSongs(query: string): Promise<SongDetailed[]>;
    /**
     * Searches YouTube Music API for videos
     *
     * @param query Query string
     */
    searchVideos(query: string): Promise<VideoDetailed[]>;
    /**
     * Searches YouTube Music API for artists
     *
     * @param query Query string
     */
    searchArtists(query: string): Promise<ArtistDetailed[]>;
    /**
     * Searches YouTube Music API for albums
     *
     * @param query Query string
     */
    searchAlbums(query: string): Promise<AlbumDetailed[]>;
    /**
     * Searches YouTube Music API for playlists
     *
     * @param query Query string
     */
    searchPlaylists(query: string): Promise<PlaylistDetailed[]>;
    /**
     * Get all possible information of a Song
     *
     * @param videoId Video ID
     * @returns Song Data
     */
    getSong(videoId: string): Promise<SongFull>;
    /**
     * Get all possible information of a Up Nexts Song
     *
     * @param videoId Video ID
     * @returns Up Nexts Data
     */
    getUpNexts(videoId: string): Promise<UpNextsDetails[]>;
    /**
     * Get all possible information of a Video
     *
     * @param videoId Video ID
     * @returns Video Data
     */
    getVideo(videoId: string): Promise<VideoFull>;
    /**
     * Get lyrics of a specific Song
     *
     * @param videoId Video ID
     * @returns Lyrics
     */
    getLyrics(videoId: string): Promise<string[] | null>;
    /**
     * Get all possible information of an Artist
     *
     * @param artistId Artist ID
     * @returns Artist Data
     */
    getArtist(artistId: string): Promise<ArtistFull>;
    /**
     * Get all of Artist's Songs
     *
     * @param artistId Artist ID
     * @returns Artist's Songs
     */
    getArtistSongs(artistId: string): Promise<SongDetailed[]>;
    /**
     * Get all of Artist's Albums
     *
     * @param artistId Artist ID
     * @returns Artist's Albums
     */
    getArtistAlbums(artistId: string): Promise<AlbumDetailed[]>;
    /**
     * Get all possible information of an Album
     *
     * @param albumId Album ID
     * @returns Album Data
     */
    getAlbum(albumId: string): Promise<AlbumFull>;
    /**
     * Get all possible information of a Playlist except the tracks
     *
     * @param playlistId Playlist ID
     * @returns Playlist Data
     */
    getPlaylist(playlistId: string): Promise<PlaylistFull>;
    /**
     * Get all videos in a Playlist
     *
     * @param playlistId Playlist ID
     * @returns Playlist's Videos
     */
    getPlaylistVideos(playlistId: string): Promise<VideoDetailed[]>;
    /**
     * Get sections for the home page.
     *
     * @returns Mixed HomeSection
     */
    getHomeSections(): Promise<HomeSection[]>;
}

export { AlbumBasic, AlbumDetailed, AlbumFull, ArtistBasic, ArtistDetailed, ArtistFull, HomeSection, PlaylistDetailed, PlaylistFull, SearchResult, SongDetailed, SongFull, ThumbnailFull, VideoDetailed, VideoFull, YTMusic as default };

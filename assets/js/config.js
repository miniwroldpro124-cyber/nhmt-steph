window.PROFILE = {
  discord: {
    id: "1155329135414087700",
    pronouns: "He/Him",
    bio: "Im from Việt Nam ✦ Furina main ✦ Honkai: Star Rail",
    refreshMinutes: 5,
    fallback: {
      displayName: "NHM_Tien",
      username: "steph.py",
      avatar: "assets/img/avatar.png",
      banner: "assets/img/banner.png",
      decoration: "assets/img/decoration.png",
      clan: { tag: "HSR", badge: "assets/img/clan.png" }
    }
  },

  lanyard: true,

  tiktok: {
    handle: "@nhmtienn",
    url: "https://www.tiktok.com/@nhmtienn"
  },

  music: {
    videoId: "MjE3Yxrv5NY",
    title: "SƠN THUỶ TRÙNG MÂY (VIETZ × WI. Remix)",
    artist: "JENA, ANH RỒNG, THƯƠNG VÕ, MÂY BAE",
    volume: 35,
    autoplayOnEnter: true
  },

  // Video mở màn: 5s đầu (0-5) → chờ ở vòng 10-50s → chạm thì phát 50-55s rồi mở trang.
  // Ba clip cắt sẵn từ file gốc để không cần tua. Để open.src: "" để dùng cảnh CSS.
  introFilm: {
    open:  { src: "assets/video/cyrene-open.mp4",  poster: "assets/video/cyrene-open.jpg" },
    loop:  { src: "assets/video/cyrene-loop.mp4",  poster: "assets/video/cyrene-loop.jpg" },
    outro: { src: "assets/video/cyrene-outro.mp4", poster: "assets/video/cyrene-outro.jpg" }
  },

  counters: {
    namespace: "nhm-tien-profile"
  },

  server: {
    invite: "qBbXAeb4q",
    url: "https://discord.gg/qBbXAeb4q"
  }
};

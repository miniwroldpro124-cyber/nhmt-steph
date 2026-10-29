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

  facebook: {
    handle: "nguyen.huu.minh.tien.2025",
    url: "https://www.facebook.com/nguyen.huu.minh.tien.2025"
  },

  music: {
    videoId: "MjE3Yxrv5NY",
    title: "SƠN THUỶ TRÙNG MÂY (VIETZ × WI. Remix)",
    artist: "JENA, ANH RỒNG, THƯƠNG VÕ, MÂY BAE",
    volume: 35,
    autoplayOnEnter: true
  },

  // Video mở màn: 5s đầu (0-5) → chờ ở vòng 10-30s → chạm thì phát đoạn cuối rồi mở trang.
  // Outro làm chậm 1.74x (tốc độ 0.575, giữ cao độ tiếng) nên dài 5.10s.
  // Ba clip cắt sẵn từ file gốc để không cần tua. Để open.src: "" để dùng cảnh CSS.
  // srcMobile: bản 720p cho điện thoại / mạng tiết kiệm dữ liệu.
  // srcPortrait: bản 9:16 cho điện thoại cầm dọc, để cover không cắt mất nhân vật.
  introFilm: {
    open: {
      src: "assets/video/cyrene-open.mp4?v=18",
      srcMobile: "assets/video/cyrene-open-720.mp4?v=18",
      srcPortrait: "assets/video/cyrene-open-portrait.mp4?v=18",
      poster: "assets/video/cyrene-open.jpg?v=18",
      posterPortrait: "assets/video/cyrene-open-portrait.jpg?v=18"
    },
    loop: {
      src: "assets/video/cyrene-loop.mp4?v=18",
      srcMobile: "assets/video/cyrene-loop-720.mp4?v=18",
      srcPortrait: "assets/video/cyrene-loop-portrait.mp4?v=18",
      poster: "assets/video/cyrene-loop.jpg?v=18",
      posterPortrait: "assets/video/cyrene-loop-portrait.jpg?v=18"
    },
    outro: {
      src: "assets/video/cyrene-outro.mp4?v=18",
      srcMobile: "assets/video/cyrene-outro-720.mp4?v=18",
      srcPortrait: "assets/video/cyrene-outro-portrait.mp4?v=18",
      poster: "assets/video/cyrene-outro.jpg?v=18",
      posterPortrait: "assets/video/cyrene-outro-portrait.jpg?v=18"
    }
  },

  counters: {
    namespace: "nhm-tien-profile"
  },

  server: {
    invite: "qBbXAeb4q",
    url: "https://discord.gg/qBbXAeb4q"
  }
};

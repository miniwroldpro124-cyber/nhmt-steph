(() => {
  'use strict';

  const cfg = window.PROFILE;
  if (!cfg) return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FALLBACK = cfg.discord.fallback;

  const els = {
    intro: $('#intro'),
    enterBtn: $('#enterBtn'),
    introName: $('#introName'),
    introAvatar: $('#introAvatar'),
    introDeco: $('#introDeco'),
    displayName: $('#displayName'),
    brandWord: $('#brandWord'),
    username: $('#username'),
    bio: $('#bio'),
    avatarBtn: $('#avatarBtn'),
    avatarImg: $('#avatarImg'),
    avatarDeco: $('#avatarDeco'),
    bannerImg: $('#bannerImg'),
    bgBanner: $('#bgBanner'),
    clanChip: $('#clanChip'),
    clanBadge: $('#clanBadge'),
    clanTag: $('#clanTag'),
    statusDot: $('#statusDot'),
    statusText: $('#statusText'),
    badgeInline: $('#badgeInline'),
    badgeList: $('#badgeList'),
    activity: $('#activity'),
    activityArt: $('#activityArt'),
    activitySong: $('#activitySong'),
    activityArtist: $('#activityArtist'),
    activityProgress: $('#activityProgress'),
    tiktokLink: $('#tiktokLink'),
    facebookLink: $('#facebookLink'),
    serverLink: $('#serverLink'),
    serverMeta: $('#serverMeta'),
    contactLink: $('#contactLink'),
    viewCount: $('#viewCount'),
    starBtn: $('#starBtn'),
    starCount: $('#starCount'),
    likeBtn: $('#likeBtn'),
    likeCount: $('#likeCount'),
    music: $('#music'),
    trackArt: $('#trackArt'),
    musicState: $('#musicState'),
    playBtn: $('#playBtn'),
    musicBar: $('#musicBar'),
    musicFill: $('#musicFill'),
    timeNow: $('#timeNow'),
    timeEnd: $('#timeEnd'),
    volume: $('#volume'),
    copyUser: $('#copyUser'),
    toast: $('#toast'),
    year: $('#year')
  };

  const toast = (() => {
    let timer;
    return (msg) => {
      els.toast.textContent = msg;
      els.toast.classList.add('show');
      clearTimeout(timer);
      timer = setTimeout(() => els.toast.classList.remove('show'), 2200);
    };
  })();

  const setImg = (img, src, fallback) => {
    if (!img || !src) return;
    img.onerror = () => {
      img.onerror = null;
      if (fallback && img.getAttribute('src') !== fallback) img.src = fallback;
    };
    img.src = src;
  };

  const fmtTime = (sec) => {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  /* ---------------- config-driven bits ---------------- */

  els.bio.textContent = cfg.discord.bio;
  const pronounEl = $('.identity__meta .meta');
  if (pronounEl) pronounEl.textContent = cfg.discord.pronouns;
  if (els.tiktokLink) els.tiktokLink.href = cfg.tiktok.url;
  if (els.facebookLink && cfg.facebook?.url) els.facebookLink.href = cfg.facebook.url;
  if (els.serverLink) els.serverLink.href = cfg.server.url;
  if (els.contactLink) els.contactLink.href = `https://discord.com/users/${cfg.discord.id}`;
  const footerLink = $('.card__footer a');
  if (footerLink) footerLink.href = cfg.server.url;
  if (els.year) els.year.textContent = new Date().getFullYear();

  let initialVolume = cfg.music.volume;
  if (els.volume) {
    try {
      const savedVolume = localStorage.getItem('nhm-volume');
      if (savedVolume !== null) initialVolume = Number(savedVolume);
    } catch (_) { /* noop */ }
    els.volume.value = initialVolume;
  }

  /* ---------------- counters (abacus) ---------------- */

  const COUNTER_API = 'https://abacus.jasoncameron.dev';
  const COUNTER_NS = cfg.counters.namespace;
  const STAT_CACHE_KEY = 'nhm-stats-v1';
  const stats = { views: 0, stars: 0, likes: 0 };
  const statNums = { views: els.viewCount, stars: els.starCount, likes: els.likeCount };
  const fmtCount = (n) => Math.max(0, Math.round(Number(n) || 0)).toLocaleString('vi-VN');

  const readStore = (key) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  };
  const hasFlag = (key) => {
    try { return localStorage.getItem(key) === '1'; } catch (_) { return false; }
  };

  function setStat(key, value) {
    if (!(key in stats)) return;
    stats[key] = Math.max(0, Math.round(Number(value) || 0));
    if (statNums[key]) statNums[key].textContent = fmtCount(stats[key]);
    try { localStorage.setItem(STAT_CACHE_KEY, JSON.stringify(stats)); } catch (_) { /* noop */ }
  }

  async function fetchStat(key) {
    const res = await fetch(`${COUNTER_API}/get/${COUNTER_NS}/${key}`, { cache: 'no-store' });
    if (res.status === 404) return 0;
    if (!res.ok) throw new Error(`stats ${res.status}`);
    return (await res.json()).value;
  }
  async function bumpStat(key) {
    const res = await fetch(`${COUNTER_API}/hit/${COUNTER_NS}/${key}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`stats ${res.status}`);
    return (await res.json()).value;
  }

  const cachedStats = readStore(STAT_CACHE_KEY);
  Object.keys(stats).forEach((key) => {
    if (cachedStats && Number.isFinite(Number(cachedStats[key]))) {
      stats[key] = Math.max(0, Number(cachedStats[key]));
    }
    if (statNums[key]) statNums[key].textContent = fmtCount(stats[key]);
    fetchStat(key).then((value) => setStat(key, value)).catch(() => { /* keep cached */ });
  });

  const STAT_ACTIONS = [
    { key: 'stars', btn: els.starBtn, flag: 'nhm-starred', done: 'Bạn đã thả sao rồi ✦', thanks: 'Cảm ơn bạn đã thả sao ✦' },
    { key: 'likes', btn: els.likeBtn, flag: 'nhm-liked', done: 'Bạn đã thả tim rồi ✦', thanks: 'Cảm ơn bạn đã thả tim ✦' }
  ];

  STAT_ACTIONS.forEach(({ key, btn, flag, done, thanks }) => {
    if (!btn) return;
    const sync = () => btn.setAttribute('aria-pressed', String(hasFlag(flag)));
    sync();
    btn.addEventListener('click', async () => {
      if (hasFlag(flag)) { toast(done); return; }
      btn.disabled = true;
      try {
        setStat(key, await bumpStat(key));
        try { localStorage.setItem(flag, '1'); } catch (_) { /* noop */ }
        sync();
        btn.classList.add('is-bump');
        setTimeout(() => btn.classList.remove('is-bump'), 600);
        toast(thanks);
      } catch (_) {
        toast('Kết nối hơi chậm, thử lại nhé ✦');
      } finally {
        btn.disabled = false;
      }
    });
  });

  /* ---------------- intro ---------------- */

  let entered = false;
  let siteOpened = false;
  let filmPhase = 'idle';
  let outroTimer = null;
  let viewsBumped = false;

  const filmCfg = cfg.introFilm || {};
  const film = {
    active: Boolean(filmCfg.open?.src) && !reduceMotion,
    open: filmCfg.open || {},
    loop: filmCfg.loop || {},
    outro: filmCfg.outro || {}
  };
  const filmVideos = {};

  // Điện thoại / mạng yếu dùng bản 720p, máy tính giữ 1080p.
  const wantsLightFilm = (() => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn?.saveData) return true;
    if (conn?.effectiveType && /(^|[^4])g$/i.test(conn.effectiveType) && conn.effectiveType !== '4g') return true;
    const coarse = window.matchMedia?.('(pointer:coarse)').matches;
    const narrow = Math.min(window.innerWidth, window.innerHeight) <= 820;
    const smallScreen = Math.min(window.screen?.width || 9999, window.screen?.height || 9999) <= 900;
    const weakCpu = (navigator.hardwareConcurrency || 8) <= 4;
    return Boolean((coarse && narrow) || (coarse && smallScreen) || (narrow && weakCpu));
  })();

  // Điện thoại cầm dọc: clip 9:16 để cover không cắt mất nhân vật.
  // Máy tính / màn ngang giữ bản 16:9 (1080p hoặc 720p).
  const isPortrait = () => Boolean(window.matchMedia?.('(orientation:portrait)')?.matches);
  const wantsPortraitFilm = wantsLightFilm && isPortrait();

  const filmSrc = (part) => {
    if (wantsPortraitFilm && part?.srcPortrait) return part.srcPortrait;
    if (wantsLightFilm && part?.srcMobile) return part.srcMobile;
    return part?.src;
  };
  const filmPoster = (part) =>
    (wantsPortraitFilm && part?.posterPortrait ? part.posterPortrait : part?.poster);

  function showFilmVideo(name) {
    Object.entries(filmVideos).forEach(([key, video]) => {
      video.classList.toggle('is-active', key === name);
    });
  }

  // Tiếng luôn bật: nếu trình duyệt chặn tự phát (chưa có cú chạm) thì chỉ im lặng
  // tạm thời để hình không đứng, và bật lại ngay khi có tương tác đầu tiên.
  let soundUnlocked = false;

  function forceSound(video) {
    if (!video) return;
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => { /* vẫn bị chặn: giữ im lặng, sẽ thử lại ở cú chạm sau */ });
    }
  }

  function playFilmVideo(video) {
    if (!video) return;
    video.muted = false;
    video.volume = 1;
    const attempt = video.play();
    if (!attempt || typeof attempt.catch !== 'function') return;
    // Bị chặn tự phát có tiếng: chạy im lặng để hình không đứng,
    // rồi cú chạm đầu tiên sẽ bật tiếng lại ngay.
    attempt.catch(() => {
      video.muted = true;
      const retry = video.play();
      if (retry && typeof retry.catch === 'function') retry.catch(() => {});
    });
  }

  function pauseFilmVideos(except) {
    Object.values(filmVideos).forEach((video) => {
      if (video && video !== except) video.pause();
    });
  }

  function prepFilmVideo(name) {
    const video = filmVideos[name];
    const part = film[name];
    const src = filmSrc(part);
    if (!video || !src || video.dataset.loaded) return video;
    video.dataset.loaded = '1';
    const poster = filmPoster(part);
    if (poster) video.poster = poster;
    video.preload = 'auto';
    video.src = src;
    video.load();
    return video;
  }

  // Làm nóng decoder của clip outro trong lúc người dùng đang xem vòng lặp:
  // phát 1 khung ở chế độ muted rồi dừng, để cú chạm sau đó bật lên tức thì.
  function primeFilmVideo(video) {
    if (!video || video.dataset.primed) return;
    video.dataset.primed = '1';
    video.muted = true;
    const attempt = video.play();
    if (!attempt || typeof attempt.then !== 'function') return;
    attempt.then(() => {
      const stop = () => {
        // Người dùng đã chạm trước khi khung làm nóng kịp dừng: outro đang chạy thật,
        // không được pause/mute nó nữa, nếu không clip cuối sẽ mất tiếng.
        if (filmPhase === 'outro' || siteOpened) {
          video.muted = false;
          return;
        }
        video.pause();
        video.muted = false;
        try { video.currentTime = 0; } catch { /* best effort */ }
      };
      if (typeof video.requestVideoFrameCallback === 'function') video.requestVideoFrameCallback(stop);
      else window.setTimeout(stop, 120);
    }).catch(() => {
      video.muted = false;
      video.dataset.primed = '';
    });
  }

  function initIntroFilm() {
    if (!film.active || !els.intro) return;
    const openVid = document.getElementById('introOpen');
    const loopVid = document.getElementById('introLoop');
    const outroVid = document.getElementById('introOutro');
    if (!openVid || !loopVid || !outroVid) { film.active = false; return; }
    filmVideos.open = openVid;
    filmVideos.loop = loopVid;
    filmVideos.outro = outroVid;
    Object.values(filmVideos).forEach((video) => {
      video.addEventListener('playing', () => els.intro.classList.add('is-playing'), { passive: true });
    });
    // Nạp lần lượt: ưu tiên 5s mở màn, clip lặp và outro tải sau để không giành băng thông.
    prepFilmVideo('open');
    openVid.addEventListener('playing', () => {
      prepFilmVideo('loop');
      // Nạp player nhạc ngay từ clip mở màn (chứ không phải lúc bấm): tạo iframe YouTube
      // tốn ~700ms main thread, nếu để tới cú chạm thì khung outro đứng im = khựng.
      window.setTimeout(preloadMusic, 900);
    }, { once: true });
    loopVid.addEventListener('canplay', () => prepFilmVideo('outro'), { once: true });
    openVid.addEventListener('ended', () => {
      if (filmPhase !== 'open' || siteOpened) return;
      prepFilmVideo('loop');
      const startLoop = () => {
        if (filmPhase !== 'open' || siteOpened) return;
        filmPhase = 'loop';
        showFilmVideo('loop');
        playFilmVideo(loopVid);
        window.setTimeout(() => openVid.pause(), 320);
        // Vòng lặp đã hiện: nạp + làm nóng outro để cú chạm bật ngay.
        if (prepFilmVideo('outro')) primeFilmVideo(filmVideos.outro);
        // Nạp sẵn player nhạc trong lúc khách còn xem vòng lặp.
        preloadMusic();
      };
      if (loopVid.readyState >= 3) startLoop();
      else loopVid.addEventListener('canplay', startLoop, { once: true });
    });
    outroVid.addEventListener('ended', () => {
      if (filmPhase === 'outro') openSite();
    });
    openVid.addEventListener('error', () => {
      film.active = false;
      filmPhase = 'off';
      els.intro?.classList.remove('is-film');
      openVid.removeAttribute('src');
      openVid.load();
    }, { once: true });
    els.intro.classList.add('is-film');
    filmPhase = 'open';
    showFilmVideo('open');
    playFilmVideo(openVid);
    // Dự phòng: nếu clip mở màn không phát được (bị chặn/thiếu codec) thì vẫn nạp sẵn player nhạc.
    window.setTimeout(() => { if (!siteOpened) preloadMusic(); }, 6000);

    // Rời tab thì dừng giải mã, quay lại chạy tiếp để không bị dồn khung.
    document.addEventListener('visibilitychange', () => {
      if (siteOpened || !film.active) return;
      const current = filmVideos[filmPhase];
      if (!current) return;
      if (document.hidden) current.pause();
      // Outro cũng phải chạy tiếp: nếu để nó đứng thì khung hình treo tới lúc mở trang.
      else playFilmVideo(current);
    });

    // Xoay máy: đổi giữa bản dọc và ngang, giữ nguyên vị trí đang xem.
    window.addEventListener('orientationchange', () => {
      if (siteOpened || !film.active) return;
      const stillPortrait = isPortrait();
      if (stillPortrait === wantsPortraitFilm) return;
      location.reload();
    });
  }
  initIntroFilm();

  function burstHearts(intro) {
    if (reduceMotion) return;
    const layer = intro.querySelector('.intro__hearts');
    if (!layer) return;
    const total = 18;
    for (let i = 0; i < total; i += 1) {
      const hart = document.createElement('span');
      hart.className = 'hart';
      const angle = (-168 + (i / (total - 1)) * 156 + (Math.random() * 12 - 6)) * (Math.PI / 180);
      const dist = 110 + Math.random() * 160;
      const size = 8 + Math.random() * 11;
      const hue = Math.random() < 0.14 ? 195 + Math.random() * 20 : (Math.random() < 0.3 ? 278 + Math.random() * 22 : 322 + Math.random() * 30);
      hart.style.width = `${size}px`;
      hart.style.height = `${size}px`;
      hart.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      hart.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      hart.style.setProperty('--rot', `${Math.random() * 90 - 45}deg`);
      hart.style.setProperty('--sc', (0.7 + Math.random() * 0.9).toFixed(2));
      hart.style.setProperty('--dur', `${(1.1 + Math.random() * 0.7).toFixed(2)}s`);
      hart.style.setProperty('--delay', `${(Math.random() * 0.18).toFixed(2)}s`);
      hart.style.setProperty('--hue', hue.toFixed(0));
      hart.addEventListener('animationend', () => hart.remove(), { once: true });
      layer.appendChild(hart);
    }
  }

  function bumpView() {
    if (viewsBumped) return;
    viewsBumped = true;
    bumpStat('views').then((value) => setStat('views', value)).catch(() => { /* best effort */ });
  }

  function kickKiss() {
    if (!els.intro) return;
    els.intro.classList.add('is-kissing');
    burstHearts(els.intro);
  }

  // Đổi lớp sang video mới chỉ khi khung hình đầu đã sẵn sàng → không nháy đen, không khựng.
  function revealWhenPainted(video, reveal) {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      reveal();
    };
    if (typeof video.requestVideoFrameCallback === 'function') {
      video.requestVideoFrameCallback(go);
    } else {
      video.addEventListener('playing', go, { once: true });
    }
    // Dự phòng: trình duyệt không bắn frame callback. Chỉ bỏ qua khi clip còn trắng/đen,
    // nếu không thì chuyển cảnh sẽ hiện một khung trống = nháy đen.
    const start = performance.now();
    const fallback = () => {
      if (done) return;
      const ready = video.readyState >= 2;
      if (!ready && performance.now() - start < 1200) {
        window.requestAnimationFrame(fallback);
        return;
      }
      go();
    };
    window.setTimeout(fallback, 260);
  }

  function startFilmOutro() {
    if (!film.active || siteOpened || filmPhase === 'outro' || !filmVideos.outro) return false;
    filmPhase = 'outro';
    const outroVid = prepFilmVideo('outro');
    // Không pause vòng lặp ở đây: nếu outro chưa kịp vẽ khung đầu (máy yếu, main thread
    // đang bận), khung hình sẽ đứng im = khựng. Giữ vòng lặp chạy tới khi outro hiện.
    // Gọi play() ngay trong cú chạm: nếu chờ 'canplay' thì mất quyền user-gesture
    // và trình duyệt sẽ chặn tiếng của clip cuối.
    outroVid.muted = false;
    outroVid.volume = 1;
    if (outroVid.currentTime > 0.05) {
      try { outroVid.currentTime = 0; } catch { /* best effort */ }
    }
    playFilmVideo(outroVid);
    // Watchdog: tab bị ẩn đúng lúc chạm, hoặc play() bị từ chối, đều làm outro đứng.
    // Thử phát lại vài nhịp cho tới khi nó thật sự chạy; hết giờ thì vẫn mở trang
    // để khách không bị kẹt ở màn mở đầu.
    let outroGuardTimer = null;
    let guardTries = 0;
    const guardOutro = () => {
      if (siteOpened) return;
      if (!outroVid.paused) return;
      if (guardTries >= 24) { openSite(); return; }
      guardTries += 1;
      playFilmVideo(outroVid);
      outroGuardTimer = window.setTimeout(guardOutro, 250);
    };
    outroGuardTimer = window.setTimeout(guardOutro, 400);
    const holdLoopUntilPainted = (deadline) => {
      // Chỉ dừng vòng lặp khi outro thực sự đã chạy; nếu chưa (máy yếu, decoder còn bận)
      // thì để vòng lặp chạy tiếp, tránh khung hình đứng.
      if (siteOpened) return;
      if (outroVid.paused || outroVid.currentTime <= 0) {
        if (performance.now() < deadline) window.requestAnimationFrame(holdLoopUntilPainted);
        return;
      }
      pauseFilmVideos(outroVid);
    };
    revealWhenPainted(outroVid, () => {
      showFilmVideo('outro');
      window.requestAnimationFrame(() => holdLoopUntilPainted(performance.now() + 3000));
    });
    // Một số trình duyệt/thiết bị bỏ qua cờ muted ngay trong khung đầu của cú chạm:
    // thử bật tiếng lại vài nhịp, nếu vẫn không được thì clip chạy im lặng (hình vẫn đúng).
    [90, 240, 520].forEach((delay) => {
      window.setTimeout(() => {
        if (siteOpened || !outroVid.muted) return;
        outroVid.muted = false;
        const attempt = outroVid.play();
        if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
      }, delay);
    });
    // Trang trí dời sang khung sau để cú chạm phát video ngay, không bị DOM/heart chặn.
    requestAnimationFrame(() => {
      if (!els.intro) return;
      kickKiss();
      bumpView();
      els.intro.classList.add('is-outro');
      const label = els.enterBtn?.querySelector('.intro__enter-text');
      if (label) label.textContent = 'đang mở trang';
      if (els.enterBtn) {
        els.enterBtn.disabled = true;
        els.enterBtn.setAttribute('aria-label', 'Đang mở trang');
      }
    });
    clearTimeout(outroTimer);
    // Dự phòng khi 'ended' không bắn: chờ dài hơn thời lượng clip outro một nhịp an toàn.
    const outroMs = Number.isFinite(outroVid.duration) && outroVid.duration > 0
      ? outroVid.duration * 1000 + 1200
      : 7500;
    outroTimer = window.setTimeout(openSite, outroMs);
    return true;
  }

  function openSite(options = {}) {
    if (siteOpened) return;
    siteOpened = true;
    clearTimeout(outroTimer);
    pauseFilmVideos();
    if (filmVideos.outro) filmVideos.outro.muted = true;
    const intro = els.intro;
    const stage = $('.stage');
    if (stage) {
      stage.inert = false;
      stage.removeAttribute('inert');
    }
    if (!intro) { startMusic(); return; }

    const kissDelay = options.kissDelay && !reduceMotion ? 340 : 0;
    const outro = reduceMotion ? 160 : (options.quick || filmPhase === 'outro' ? 520 : 1500);
    window.setTimeout(() => {
      intro.classList.add('is-opening');
      window.setTimeout(() => {
        intro.classList.add('is-hidden');
        window.setTimeout(() => {
          intro.remove();
          startMusic();
        }, 520);
      }, outro);
    }, kissDelay);
    window.setTimeout(() => {
      const card = $('#card');
      if (card) {
        card.setAttribute('tabindex', '-1');
        card.focus({ preventScroll: true });
      }
    }, kissDelay + outro + 420);
  }

  function enter() {
    if (entered) return;
    entered = true;
    document.body.classList.add('entered');
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    // Outro phải nhận quyền user-gesture trước: playVideo() của iframe YouTube
    // cũng tiêu thụ activation và sẽ làm clip cuối bị chặn tiếng nếu chạy trước.
    const startedFilm = film.active && startFilmOutro();
    armMusic(true);
    if (startedFilm) return;
    kickKiss();
    bumpView();
    openSite({ kissDelay: true });
  }

  function activateIntro() {
    if (siteOpened) return;
    if (!entered) enter();
  }

  // Bất kỳ cú chạm/phím/scroll nào cũng bật tiếng cho clip đang chạy — kể cả khi khách
  // không bấm nút "enter" mà chỉ chạm vào màn hình. Trình duyệt chỉ cho bật tiếng
  // trong một tương tác thật, nên đây là chỗ duy nhất mở được khoá đó.
  function unlockSound() {
    if (soundUnlocked) return;
    soundUnlocked = true;
    const current = film.active ? filmVideos[filmPhase] : null;
    if (!current || siteOpened) return;
    if (current.muted) forceSound(current);
  }

  ['pointerdown', 'touchstart', 'keydown', 'wheel'].forEach((type) => {
    window.addEventListener(type, unlockSound, { passive: true, once: false });
  });
  document.addEventListener('scroll', unlockSound, { passive: true });

  if (els.intro) {
    // pointerdown để chạm trên điện thoại mở ngay, không chờ 300ms của click.
    if (window.PointerEvent) {
      els.intro.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        activateIntro();
      }, { passive: true });
    } else {
      els.intro.addEventListener('click', activateIntro);
    }
    document.addEventListener('keydown', (event) => {
      if (!entered && (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar')) {
        event.preventDefault();
        activateIntro();
      }
    });
  }

  /* ---------------- discord profile sync (japi.rest) ---------------- */

  const CACHE_KEY = 'nhm-discord-profile-v1';

  const avatarUrl = (d) => {
    if (!d.avatar) return d.defaultAvatarURL || FALLBACK.avatar;
    const ext = d.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${d.id}/${d.avatar}.${ext}?size=256`;
  };
  const bannerUrl = (d) => (
    d.banner ? `https://cdn.discordapp.com/banners/${d.id}/${d.banner}.png?size=1024` : null
  );
  const decorationUrl = (d) => (
    d.avatar_decoration_data?.asset
      ? `https://cdn.discordapp.com/avatar-decoration-presets/${d.avatar_decoration_data.asset}.png?size=160`
      : null
  );
  const clanOf = (d) => d.clan || d.primary_guild || null;
  const clanBadgeUrl = (clan) => (
    clan?.badge && clan?.identity_guild_id
      ? `https://cdn.discordapp.com/clan-badges/${clan.identity_guild_id}/${clan.badge}.png?size=48`
      : null
  );

  const BADGE_ICON_PATH = 'assets/img/';

  const BADGES = {
    NITRO: { label: 'Nitro', icon: 'badge-nitro.png' },
    HOUSE_BALANCE: { label: 'HypeSquad Balance', icon: 'badge-balance.png' },
    HOUSE_BRAVERY: { label: 'HypeSquad Bravery', icon: 'badge-bravery.png' },
    HOUSE_BRILLIANCE: { label: 'HypeSquad Brilliance', icon: 'badge-brilliance.png' },
    PREMIUM_EARLY_SUPPORTER: { label: 'Early Supporter', icon: 'badge-early.png' }
  };

  const FLAG_BITS = [
    [64, 'HOUSE_BRAVERY'],
    [128, 'HOUSE_BRILLIANCE'],
    [256, 'HOUSE_BALANCE'],
    [512, 'PREMIUM_EARLY_SUPPORTER']
  ];

  function flagsToArray(d) {
    if (Array.isArray(d.public_flags_array) && d.public_flags_array.length) return d.public_flags_array;
    const flags = Number(d.public_flags || 0);
    return FLAG_BITS.filter(([bit]) => flags & bit).map(([, key]) => key);
  }

  const BADGE_ORDER = ['NITRO', 'HOUSE_BRAVERY', 'HOUSE_BRILLIANCE', 'HOUSE_BALANCE', 'PREMIUM_EARLY_SUPPORTER'];

  function renderBadges(flags) {
    const unique = [...new Set((flags || []).filter((f) => BADGES[f]))]
      .sort((a, b) => BADGE_ORDER.indexOf(a) - BADGE_ORDER.indexOf(b));

    els.badgeInline.innerHTML = unique.map((key) => {
      const b = BADGES[key];
      return `<img class="badge-inline" src="${BADGE_ICON_PATH}${b.icon}" alt="${b.label}" title="${b.label}">`;
    }).join('');

    const chips = unique.map((key) => {
      const b = BADGES[key];
      return `<span class="chip" title="${b.label}"><img class="chip__badge" src="${BADGE_ICON_PATH}${b.icon}" alt="">${b.label}</span>`;
    });
    if (!chips.length) chips.push('<span class="chip chip--plain">Chưa có huy hiệu</span>');

    els.badgeList.innerHTML = chips.join('');
  }

  function applyProfile(d) {
    const name = d.global_name || d.username || FALLBACK.displayName;
    const user = d.username || FALLBACK.username;

    els.displayName.textContent = name;
    if (els.brandWord) {
      els.brandWord.textContent = name;
      els.brandWord.dataset.word = name;
    }
    els.username.textContent = `@${user}`;
    if (els.introName) els.introName.textContent = name;
    document.title = `${name} ✦ @${user}`;

    $$('[data-copy-user]').forEach((el) => { el.dataset.copy = user; });
    if (els.copyUser) els.copyUser.textContent = user;

    const avatar = avatarUrl(d);
    const banner = bannerUrl(d) || FALLBACK.banner;

    setImg(els.avatarImg, avatar, FALLBACK.avatar);
    setImg(els.introAvatar, avatar, FALLBACK.avatar);
    setImg(els.bannerImg, banner, FALLBACK.banner);

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.content = banner;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = `${name} ✦ @${user}`;

    const preload = new Image();
    preload.onload = () => document.documentElement.style.setProperty('--banner', `url("${banner}")`);
    preload.src = banner;

    const deco = decorationUrl(d);
    if (deco) {
      setImg(els.avatarDeco, deco, FALLBACK.decoration);
      setImg(els.introDeco, deco, FALLBACK.decoration);
      els.avatarDeco.style.display = '';
      els.introDeco.style.display = '';
    } else {
      els.avatarDeco.style.display = 'none';
      els.introDeco.style.display = 'none';
    }

    const clan = clanOf(d);
    if (clan?.tag) {
      els.clanChip.hidden = false;
      els.clanChip.title = `Clan ${clan.tag}`;
      els.clanTag.textContent = clan.tag;
      const badge = clanBadgeUrl(clan);
      if (badge) {
        setImg(els.clanBadge, badge, FALLBACK.clan.badge);
      } else {
        els.clanBadge.src = FALLBACK.clan.badge;
      }
    } else {
      els.clanChip.hidden = true;
    }

    renderBadges(flagsToArray(d));

    window.PROFILE_STATE = { loaded: true, name, user };
  }

  function readCache() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached?.d?.id) applyProfile(cached.d);
    } catch (_) { /* ignore corrupt cache */ }
  }

  let lastProfileFetch = 0;
  async function loadProfile() {
    try {
      const res = await fetch(`https://japi.rest/discord/v1/user/${cfg.discord.id}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`profile ${res.status}`);
      const json = await res.json();
      if (!json?.data?.id) throw new Error('profile payload');
      applyProfile(json.data);
      lastProfileFetch = Date.now();
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: json.data }));
      } catch (_) { /* storage full */ }
    } catch (_) {
      /* static assets keep the page intact */
    }
  }

  renderBadges(['NITRO', 'HOUSE_BALANCE']);
  readCache();
  loadProfile();
  setInterval(loadProfile, Math.max(1, cfg.discord.refreshMinutes) * 60_000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - lastProfileFetch > 5 * 60_000) {
      loadProfile();
      pollPresence();
    }
  });

  /* ---------------- server invite ---------------- */

  async function loadInvite() {
    try {
      const res = await fetch(`https://discord.com/api/v10/invites/${cfg.server.invite}?with_counts=true`, { cache: 'no-store' });
      if (!res.ok) throw new Error('invite');
      const data = await res.json();
      const guild = data.guild || {};
      const members = data.approximate_member_count;
      const online = data.approximate_presence_count;
      if (members) {
        els.serverMeta.textContent = `${guild.name || 'Discord'} · ${members.toLocaleString('vi-VN')} thành viên${online ? ` · ${online} online` : ''}`;
      } else if (guild.name) {
        els.serverMeta.textContent = `${guild.name} · tham gia ngay`;
      }
    } catch (_) { /* keep static subtitle */ }
  }
  loadInvite();

  /* ---------------- presence (lanyard) ---------------- */

  const STATUS = {
    online: { label: 'Đang trực tuyến', color: '#57f287' },
    idle: { label: 'Tạm vắng', color: '#faa61a' },
    dnd: { label: 'Không làm phiền', color: '#f23f43' },
    offline: { label: 'Ngoại tuyến', color: '#8b8fa8' },
    unknown: { label: 'Discord', color: '#a78bfa' }
  };

  let spotify = null;

  function setStatus(key) {
    const state = STATUS[key] || STATUS.unknown;
    els.statusDot.dataset.status = key;
    els.statusDot.style.setProperty('--s', state.color);
    els.statusDot.title = key === 'unknown'
      ? 'Bật trạng thái trực tiếp bằng cách tham gia discord.gg/lanyard'
      : `Discord · ${state.label}`;
    els.statusText.dataset.status = key;
    els.statusText.textContent = state.label;
  }

  els.activityArt.addEventListener('error', () => {
    els.activityArt.style.visibility = 'hidden';
  });

  function renderSpotify() {
    if (!spotify) {
      els.activity.hidden = true;
      return;
    }
    els.activity.hidden = false;
    els.activitySong.textContent = spotify.song || '—';
    els.activityArtist.textContent = spotify.artist || '—';
    if (spotify.album_art_url) {
      els.activityArt.src = spotify.album_art_url;
      els.activityArt.style.visibility = '';
    } else {
      els.activityArt.style.visibility = 'hidden';
    }
    tickSpotify();
  }

  function tickSpotify() {
    if (!spotify || els.activity.hidden) return;
    const start = spotify.timestamps?.start;
    const end = spotify.timestamps?.end;
    if (!start || !end) return;
    const progress = clamp((Date.now() - start) / (end - start), 0, 1);
    els.activityProgress.style.width = `${progress * 100}%`;
  }

  let presenceTimer = null;
  let presenceBusy = false;

  async function pollPresence() {
    if (presenceBusy) return;
    presenceBusy = true;
    let monitored = false;
    if (cfg.lanyard) {
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${cfg.discord.id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('not monitored');
        const payload = await res.json();
        const data = payload?.data;
        if (!data) throw new Error('presence payload');
        setStatus(data.discord_status || 'offline');
        spotify = data.listening_to_spotify && data.spotify ? data.spotify : null;
        renderSpotify();
        monitored = true;
      } catch (_) {
        setStatus('unknown');
        spotify = null;
        renderSpotify();
      }
    } else {
      setStatus('unknown');
    }
    clearTimeout(presenceTimer);
    presenceTimer = setTimeout(pollPresence, monitored ? 25_000 : 300_000);
    presenceBusy = false;
  }

  setStatus('unknown');
  pollPresence();
  setInterval(tickSpotify, 1_000);

  /* ---------------- music (youtube) ---------------- */

  const music = {
    player: null,
    ready: false,
    playing: false,
    pendingAutoplay: false,
    duration: 0
  };
  let ytApiState = 'idle';
  let musicStarted = false;

  function loadYouTubeApi() {
    if (ytApiState === 'loading' || ytApiState === 'ready') return;
    ytApiState = 'loading';
    els.musicState.textContent = 'Đang tải';
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => {
      ytApiState = 'error';
      els.musicState.textContent = 'Không tải được';
    };
    document.head.appendChild(script);
  }

  // Nạp sẵn player trong lúc khách đang xem màn mở đầu (không phát), để lúc mở trang
  // nhạc bật ngay thay vì chờ tải API + iframe vài giây.
  function preloadMusic() {
    if (musicStarted || ytApiState !== 'idle') return;
    loadYouTubeApi();
  }

  // Cú chạm mở trang cũng là cơ hội xin quyền phát nhạc: cho player chạy sẵn ở chế độ
  // muted (không đè tiếng clip outro), rồi bật tiếng + tua về 0 khi trang mở xong.
  function armMusic(gesture) {
    if (!cfg.music.autoplayOnEnter || musicStarted) return;
    music.pendingAutoplay = true;
    if (!music.ready) { loadYouTubeApi(); return; }
    if (!gesture) return;
    try {
      music.player.mute();
      music.player.playVideo();
    } catch (_) { /* best effort */ }
  }

  function startMusic() {
    if (!cfg.music.autoplayOnEnter) return;
    musicStarted = true;
    music.pendingAutoplay = false;
    if (music.ready) {
      playMusicWithSound();
      return;
    }
    music.pendingAutoplay = true;
    loadYouTubeApi();
  }

  // Bật tiếng + tua về 0 và kiểm tra lại: iframe YouTube đôi khi nhận playVideo()
  // nhưng vẫn ở trạng thái muted, khi đó bấm unmute thêm lần nữa.
  function playMusicWithSound() {
    const player = music.player;
    if (!player) return;
    try {
      player.unMute();
      player.setVolume(initialVolume);
      player.seekTo(0, true);
      player.playVideo();
    } catch (_) { return; }
    window.setTimeout(() => {
      try {
        if (player.isMuted && player.isMuted()) {
          player.unMute();
          player.setVolume(initialVolume);
        }
      } catch (_) { /* best effort */ }
    }, 600);
  }

  window.onYouTubeIframeAPIReady = () => {
    ytApiState = 'ready';
    const origin = /^https?:$/.test(location.protocol) ? location.origin : undefined;
    music.player = new window.YT.Player('ytPlayer', {
      width: 180,
      height: 100,
      videoId: cfg.music.videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        playsinline: 1,
        loop: 1,
        playlist: cfg.music.videoId,
        rel: 0,
        origin
      },
      events: {
        onReady(event) {
          music.ready = true;
          music.duration = event.target.getDuration() || 0;
          els.musicState.textContent = 'Sẵn sàng';
          event.target.setVolume(initialVolume);
          updateMusicProgress();
          // Trang đã mở xong trong lúc player còn đang tải: phát có tiếng từ đầu.
          if (musicStarted) {
            playMusicWithSound();
            return;
          }
          // Còn ở màn mở đầu: chạy nền ở chế độ muted để lúc mở trang bật tiếng là có ngay.
          if (music.pendingAutoplay) {
            try {
              event.target.mute();
              event.target.playVideo();
            } catch (_) { /* best effort */ }
          }
        },
        onStateChange(event) {
          const state = window.YT.PlayerState;
          const wasPlaying = music.playing;
          music.playing = event.data === state.PLAYING;
          els.music.classList.toggle('is-playing', music.playing);
          els.playBtn.setAttribute('aria-label', music.playing ? 'Tạm dừng' : 'Phát nhạc');
          if (music.playing) {
            music.duration = event.target.getDuration() || music.duration;
            els.musicState.textContent = musicStarted ? 'Đang phát' : 'Sẵn sàng';
            // Player chạy nền ở chế độ muted: hiện UI như đang phát nhưng giữ im lặng
            // cho tới khi màn mở đầu đóng hẳn.
            if (!musicStarted && !wasPlaying) event.target.mute();
          } else if (event.data === state.PAUSED) {
            els.musicState.textContent = 'Tạm dừng';
          } else if (event.data === state.ENDED) {
            els.musicState.textContent = 'Sẵn sàng';
          }
        }
      }
    });
  };

  els.playBtn.addEventListener('click', () => {
    if (!music.ready) {
      if (ytApiState === 'error') {
        toast('Nhạc đang lỗi, tải lại trang nhé ✦');
        return;
      }
      music.pendingAutoplay = true;
      loadYouTubeApi();
      toast('Đang tải nhạc…');
      return;
    }
    if (music.playing) music.player.pauseVideo();
    else music.player.playVideo();
  });

  function updateMusicProgress() {
    if (!music.ready) return;
    const now = music.player.getCurrentTime() || 0;
    const total = music.player.getDuration() || music.duration || 0;
    if (!total) return;
    const percent = clamp((now / total) * 100, 0, 100);
    els.musicFill.style.width = `${percent}%`;
    els.musicBar.setAttribute('aria-valuenow', String(Math.round(percent)));
    els.timeNow.textContent = fmtTime(now);
    els.timeEnd.textContent = fmtTime(total);
  }
  setInterval(updateMusicProgress, 500);

  els.musicBar.addEventListener('click', (event) => {
    if (!music.ready) return;
    const total = music.player.getDuration() || 0;
    if (!total) return;
    const rect = els.musicBar.getBoundingClientRect();
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    music.player.seekTo(ratio * total, true);
  });

  els.volume.addEventListener('input', () => {
    const value = Number(els.volume.value);
    if (music.ready) music.player.setVolume(value);
    try { localStorage.setItem('nhm-volume', String(value)); } catch (_) { /* noop */ }
  });

  els.trackArt.src = `https://i.ytimg.com/vi/${cfg.music.videoId}/hqdefault.jpg`;
  els.trackArt.onerror = () => { els.trackArt.onerror = null; els.trackArt.src = 'assets/img/yt.jpg'; };
  const ytTitle = $('#trackTitle');
  const ytArtist = $('#trackArtist');
  if (ytTitle) ytTitle.textContent = cfg.music.title;
  if (ytArtist) ytArtist.textContent = cfg.music.artist;

  /* ---------------- copy & avatar link ---------------- */

  function fallbackCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); } catch (_) { /* noop */ }
    area.remove();
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-copy]');
    if (!target) return;
    event.preventDefault();
    const text = target.getAttribute('data-copy');
    const done = () => toast(`Đã sao chép ${text} ✦`);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => { fallbackCopy(text); done(); });
    } else {
      fallbackCopy(text);
      done();
    }
  });

  els.avatarBtn.addEventListener('click', () => {
    window.open(`https://discord.com/users/${cfg.discord.id}`, '_blank', 'noopener');
  });

  /* ---------------- ambient particles ---------------- */

  function initAmbient() {
    const canvas = $('#particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, dots = [];
    let lastDraw = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const makeDot = () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + .4,
      vy: -(Math.random() * .18 + .05),
      tw: Math.random() * Math.PI * 2,
      ts: Math.random() * .015 + .004,
      hue: Math.random() < .5 ? '214,206,255' : '255,205,235'
    });

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = Array.from({ length: reduceMotion ? 0 : 32 }, makeDot);
    }

    function draw() {
      requestAnimationFrame(draw);
      if (!siteOpened || document.hidden) return;
      // Hạt trôi rất chậm: 30fps là đủ, tiết kiệm GPU cho hiệu ứng nghiêng bảng.
      const now = performance.now();
      if (now - lastDraw < 33) return;
      lastDraw = now;
      ctx.clearRect(0, 0, width, height);
      for (const dot of dots) {
        dot.y += dot.vy;
        dot.x += Math.sin(dot.y * .012) * .12;
        dot.tw += dot.ts;
        if (dot.y < -12) {
          dot.y = height + 12;
          dot.x = Math.random() * width;
        }
        const alpha = .2 + (Math.sin(dot.tw) + 1) * .18;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${dot.hue},${alpha})`;
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    window.addEventListener('resize', resize);
    resize();
    if (!reduceMotion) draw();
  }

  /* ---------------- sparkle cursor ---------------- */

  function initSparkles() {
    const canvas = $('#sparkles');
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0, height = 0, last = 0;
    const parts = [];
    let dirty = false;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('pointermove', (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      const now = performance.now();
      if (now - last < 26) return;
      last = now;
      parts.push({
        x: event.clientX,
        y: event.clientY,
        vx: (Math.random() - .5) * .8,
        vy: (Math.random() - .4) * .6,
        size: Math.random() * 4 + 2,
        life: 1,
        rot: Math.random() * Math.PI,
        hue: Math.random() < .55 ? '255,220,238' : '190,219,255'
      });
    }, { passive: true });

    function draw() {
      requestAnimationFrame(draw);
      if (!siteOpened || document.hidden) return;
      // Không có hạt thì bỏ luôn lệnh xoá canvas toàn màn hình (~2-4ms/frame).
      if (!parts.length) {
        if (dirty) {
          ctx.clearRect(0, 0, width, height);
          dirty = false;
        }
        return;
      }
      dirty = true;
      ctx.clearRect(0, 0, width, height);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += .008;
        p.life -= .022;
        if (p.life <= 0) {
          parts.splice(i, 1);
          continue;
        }
        const s = p.size * (.6 + .4 * p.life);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = `rgba(${p.hue},.9)`;
        ctx.shadowColor = `rgba(${p.hue},.9)`;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * .18, -s * .18);
        ctx.lineTo(s, 0);
        ctx.lineTo(s * .18, s * .18);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * .18, s * .18);
        ctx.lineTo(-s, 0);
        ctx.lineTo(-s * .18, -s * .18);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
    draw();
  }

  /* ---------------- card tilt theo con trỏ ---------------- */

  function initTilt() {
    if (reduceMotion) return;
    if (!window.matchMedia?.('(hover:hover) and (pointer:fine)').matches) return;
    const card = $('#card');
    const brand = $('.brand');
    if (!card) return;

    const MAX_X = 9, MAX_Y = 12;
    let enabled = false;
    let lastAt = 0;
    let px = 0, py = 0;

    // Bật sau khi cardIn xong rồi bỏ animation để transform của tilt không bị keyframes đè.
    const arm = () => window.setTimeout(() => {
      if (!siteOpened || reduceMotion) return;
      card.style.animation = 'none';
      enabled = true;
      card.classList.add('is-tilt');
      brand?.classList.add('is-tilt');
    }, 1750);

    if (siteOpened) arm();
    else {
      const waitOpen = setInterval(() => {
        if (!siteOpened) return;
        clearInterval(waitOpen);
        arm();
      }, 260);
    }

    const apply = () => {
      if (!enabled) return;
      const nx = (px / window.innerWidth) * 2 - 1;
      const ny = (py / window.innerHeight) * 2 - 1;
      const edgeX = Math.sign(nx) * Math.pow(Math.abs(nx), 1.55);
      const edgeY = Math.sign(ny) * Math.pow(Math.abs(ny), 1.55);
      card.style.setProperty('--tilt-x', `${(-edgeY * MAX_X).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${(edgeX * MAX_Y).toFixed(2)}deg`);
      if (brand) {
        brand.style.setProperty('--brand-x', `${(edgeX * -9).toFixed(1)}px`);
        brand.style.setProperty('--brand-y', `${(edgeY * -5).toFixed(1)}px`);
      }
    };

    window.addEventListener('pointermove', (event) => {
      if (!enabled || (event.pointerType && event.pointerType !== 'mouse')) return;
      px = event.clientX;
      py = event.clientY;
      card.classList.add('is-tracking');
      const now = performance.now();
      if (now - lastAt < 16) return;
      lastAt = now;
      apply();
    }, { passive: true });

    const settle = () => {
      if (!enabled) return;
      card.classList.remove('is-tracking');
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      brand?.style.setProperty('--brand-x', '0px');
      brand?.style.setProperty('--brand-y', '0px');
    };
    document.addEventListener('pointerleave', settle);
    window.addEventListener('blur', settle);
    window.addEventListener('scroll', settle, { passive: true });
  }

  initAmbient();
  initSparkles();
  initTilt();
})();

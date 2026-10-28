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

  function showFilmVideo(name) {
    Object.entries(filmVideos).forEach(([key, video]) => {
      video.classList.toggle('is-active', key === name);
    });
  }

  function playFilmVideo(video) {
    if (!video) return;
    video.muted = false;
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => {
        video.muted = true;
        const retry = video.play();
        if (retry && typeof retry.catch === 'function') retry.catch(() => {});
      });
    }
  }

  function pauseFilmVideos(except) {
    Object.values(filmVideos).forEach((video) => {
      if (video && video !== except) video.pause();
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
    Object.entries(filmVideos).forEach(([key, video]) => {
      const part = film[key];
      if (part.poster) video.poster = part.poster;
      video.src = part.src;
      video.addEventListener('playing', () => els.intro.classList.add('is-playing'), { passive: true });
    });
    openVid.addEventListener('ended', () => {
      if (filmPhase !== 'open' || siteOpened) return;
      filmPhase = 'loop';
      showFilmVideo('loop');
      playFilmVideo(loopVid);
      window.setTimeout(() => openVid.pause(), 320);
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

  function startFilmOutro() {
    if (!film.active || siteOpened || filmPhase === 'outro' || !filmVideos.outro) return false;
    filmPhase = 'outro';
    kickKiss();
    bumpView();
    els.intro.classList.add('is-outro');
    pauseFilmVideos(filmVideos.outro);
    const outroVid = filmVideos.outro;
    showFilmVideo('outro');
    try { outroVid.currentTime = 0; } catch { /* best effort */ }
    playFilmVideo(outroVid);
    const label = els.enterBtn?.querySelector('.intro__enter-text');
    if (label) label.textContent = 'đang mở trang';
    if (els.enterBtn) {
      els.enterBtn.disabled = true;
      els.enterBtn.setAttribute('aria-label', 'Đang mở trang');
    }
    clearTimeout(outroTimer);
    outroTimer = window.setTimeout(openSite, 7000);
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
    if (film.active && startFilmOutro()) return;
    kickKiss();
    bumpView();
    openSite({ kissDelay: true });
  }

  function activateIntro() {
    if (siteOpened) return;
    if (!entered) enter();
  }

  if (els.intro) {
    els.intro.addEventListener('click', activateIntro);
    document.addEventListener('keydown', (event) => {
      if (!entered && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        enter();
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

  function startMusic() {
    if (!cfg.music.autoplayOnEnter) return;
    if (music.ready) {
      music.player.setVolume(initialVolume);
      music.player.playVideo();
      return;
    }
    music.pendingAutoplay = true;
    loadYouTubeApi();
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
          if (music.pendingAutoplay && entered) {
            music.pendingAutoplay = false;
            event.target.playVideo();
          }
        },
        onStateChange(event) {
          const state = window.YT.PlayerState;
          music.playing = event.data === state.PLAYING;
          els.music.classList.toggle('is-playing', music.playing);
          els.playBtn.setAttribute('aria-label', music.playing ? 'Tạm dừng' : 'Phát nhạc');
          if (music.playing) {
            music.duration = event.target.getDuration() || music.duration;
            els.musicState.textContent = 'Đang phát';
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
      requestAnimationFrame(draw);
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
      requestAnimationFrame(draw);
    }
    draw();
  }

  initAmbient();
  initSparkles();
})();

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
    typeText: $('#typeText'),
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
    ytLink: $('#ytLink'),
    serverLink: $('#serverLink'),
    serverMeta: $('#serverMeta'),
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
  if (els.ytLink) els.ytLink.href = cfg.music.url;
  if (els.serverLink) els.serverLink.href = cfg.server.url;
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

  /* ---------------- intro ---------------- */

  const phrases = ['Im from Việt Nam', 'Furina main', 'Honkai: Star Rail', '@steph.py'];
  let entered = false;

  function typewriter() {
    if (reduceMotion || !els.typeText) {
      if (els.typeText) els.typeText.textContent = phrases[0];
      return;
    }
    let word = 0, chars = 0, deleting = false;
    const step = () => {
      if (entered) return;
      const phrase = phrases[word];
      chars += deleting ? -1 : 1;
      els.typeText.textContent = phrase.slice(0, chars);
      if (!deleting && chars === phrase.length) {
        deleting = true;
        setTimeout(step, 1700);
        return;
      }
      if (deleting && chars === 0) {
        deleting = false;
        word = (word + 1) % phrases.length;
        setTimeout(step, 320);
        return;
      }
      setTimeout(step, deleting ? 30 : 62);
    };
    step();
  }

  function enter() {
    if (entered) return;
    entered = true;
    document.body.classList.add('entered');
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    if (els.intro) {
      els.intro.classList.add('is-hidden');
      setTimeout(() => els.intro.remove(), 1000);
    }
    window.setTimeout(() => {
      const card = $('#card');
      if (card) {
        card.setAttribute('tabindex', '-1');
        card.focus({ preventScroll: true });
      }
    }, 700);
    startMusic();
  }

  if (els.intro) {
    els.intro.addEventListener('click', enter);
    document.addEventListener('keydown', (event) => {
      if (!entered && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        enter();
      }
    });
  }
  typewriter();

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

  const ICON = {
    nitro: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3.4 18.6 9 12 20.6 5.4 9 12 3.4Z"/><path d="M5.4 9h13.2M12 3.4v17.2"/></svg>',
    balance: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 3 18 13H6L12 3Z"/><path d="M5.4 14h5.2L8 20.4 5.4 14Z"/><path d="M13.4 14h5.2L16 20.4 13.4 14Z"/></svg>',
    early: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 3l2.4 5.9 6.3.5-4.8 4.1 1.5 6.1L12 16.5 6.6 19.6l1.5-6.1L3.3 9.4l6.3-.5L12 3z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3.5v3M16 3.5v3M3.5 10h17"/></svg>'
  };

  const BADGES = {
    NITRO: { label: 'Nitro', cls: 'nitro', svg: ICON.nitro },
    HOUSE_BALANCE: { label: 'HypeSquad Balance', cls: 'balance', svg: ICON.balance },
    HOUSE_BRAVERY: { label: 'HypeSquad Bravery', cls: 'bravery', svg: ICON.balance },
    HOUSE_BRILLIANCE: { label: 'HypeSquad Brilliance', cls: 'brilliance', svg: ICON.balance },
    PREMIUM_EARLY_SUPPORTER: { label: 'Early Supporter', cls: 'early', svg: ICON.early }
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

  function renderBadges(flags, created, clan) {
    const unique = [...new Set((flags || []).filter((f) => BADGES[f]))]
      .sort((a, b) => BADGE_ORDER.indexOf(a) - BADGE_ORDER.indexOf(b));

    els.badgeInline.innerHTML = unique.map((key) => {
      const b = BADGES[key];
      return `<span class="badge-inline badge-inline--${b.cls}" title="${b.label}">${b.svg}</span>`;
    }).join('');

    const chips = unique.map((key) => {
      const b = BADGES[key];
      return `<span class="chip" title="${b.label}"><span class="chip__ico chip__ico--${b.cls}">${b.svg}</span>${b.label}</span>`;
    });

    if (clan?.tag) {
      const src = clanBadgeUrl(clan) || FALLBACK.clan.badge;
      chips.push(`<span class="chip" title="Clan ${clan.tag}"><img src="${src}" alt="">${clan.tag}</span>`);
    }
    if (created) {
      const date = new Date(created);
      const label = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      chips.push(`<span class="chip chip--plain" title="Ngày tạo tài khoản Discord">${ICON.calendar}Từ ${label}</span>`);
    }
    if (!chips.length) chips.push('<span class="chip chip--plain">Discord</span>');

    els.badgeList.innerHTML = chips.join('');
    els.badgeList.querySelectorAll('img').forEach((img) => {
      img.onerror = () => { img.onerror = null; img.src = FALLBACK.clan.badge; };
    });
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

    renderBadges(flagsToArray(d), d.createdTimestamp, clan);

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

  renderBadges(['NITRO', 'HOUSE_BALANCE'], null, { tag: FALLBACK.clan.tag });
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

  function startMusic() {
    if (!cfg.music.autoplayOnEnter) return;
    if (music.ready) {
      music.player.setVolume(initialVolume);
      music.player.playVideo();
    } else {
      music.pendingAutoplay = true;
    }
  }

  window.onYouTubeIframeAPIReady = () => {
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

  const ytScript = document.createElement('script');
  ytScript.src = 'https://www.youtube.com/iframe_api';
  ytScript.onerror = () => { els.musicState.textContent = 'Không tải được'; };
  document.head.appendChild(ytScript);

  els.playBtn.addEventListener('click', () => {
    if (!music.ready) {
      toast('Nhạc đang tải, thử lại sau nhé ✦');
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

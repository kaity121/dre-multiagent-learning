/* video-player.js — one small interface over three video sources so the classroom
   engine does not care where the lecture comes from:
     • sim     — the simulated SVG lecture (default; offline, timestamps match the script)
     • file    — an uploaded file / direct URL played by a native <video>
     • youtube — a YouTube video driven through the official IFrame Player API
   Every player exposes: kind, el, ready (Promise), play, pause, seek, time,
   setRate, setVolume, setMuted, isMuted. Real players start muted because
   browsers block autoplay with sound; the learner unmutes from the controls. */
(function () {
  const App = window.App;
  const noop = () => {};

  function sim() {
    return { kind: 'sim', el: App.lecture.create(), ready: Promise.resolve(),
      play: noop, pause: noop, seek: noop, time: () => 0, duration: () => App.data.LESSON.duration, setRate: noop, setVolume: noop, setMuted: noop, isMuted: () => true };
  }

  function html5(src) {
    const v = document.createElement('video');
    v.src = src.url; v.playsInline = true; v.muted = true; v.preload = 'auto';
    v.setAttribute('aria-label', src.name || 'Video bài giảng');
    const ready = new Promise((resolve, reject) => {
      v.addEventListener('loadedmetadata', () => resolve(), { once: true });
      v.addEventListener('error', () => reject(new Error('không đọc được file video')), { once: true });
      setTimeout(() => reject(new Error('video tải quá lâu')), 10000);
    });
    return { kind: 'file', el: v, ready,
      play() { const r = v.play(); if (r && r.catch) r.catch(noop); },
      pause() { v.pause(); },
      seek(t) { try { v.currentTime = t; } catch (e) { /* metadata not loaded yet */ } },
      time: () => v.currentTime || 0,
      duration: () => (isFinite(v.duration) ? v.duration : 0),
      setRate(r) { v.playbackRate = r; },
      setVolume(x) { v.volume = x; },
      setMuted(b) { v.muted = b; },
      isMuted: () => v.muted };
  }

  let ytApi = null;
  function loadYouTubeApi() {
    if (ytApi) return ytApi;
    ytApi = new Promise((resolve, reject) => {
      if (window.YT && window.YT.Player) { resolve(window.YT); return; }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(window.YT); };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.onerror = () => reject(new Error('không tải được thư viện YouTube'));
      document.head.append(s);
      setTimeout(() => reject(new Error('YouTube không phản hồi')), 10000);
    });
    ytApi.catch(() => { ytApi = null; });
    return ytApi;
  }

  function youtube(src) {
    const wrap = document.createElement('div');
    wrap.className = 'yt-wrap';
    const slot = document.createElement('div');
    wrap.append(slot);
    let p = null;
    const call = (name, ...args) => { try { return p && p[name] ? p[name](...args) : undefined; } catch (e) { return undefined; } };
    const ready = loadYouTubeApi().then(YT => new Promise((resolve, reject) => {
      p = new YT.Player(slot, {
        videoId: src.id, width: '100%', height: '100%',
        playerVars: { controls: 0, rel: 0, modestbranding: 1, playsinline: 1, disablekb: 1, iv_load_policy: 3, mute: 1 },
        events: {
          onReady: () => { call('mute'); resolve(); },
          onError: (e) => reject(new Error('YouTube báo lỗi ' + e.data + ' (video riêng tư, bị chặn nhúng hoặc sai mã)'))
        }
      });
      setTimeout(() => reject(new Error('YouTube không phản hồi')), 12000);
    }));
    return { kind: 'youtube', el: wrap, ready,
      play() { call('playVideo'); },
      pause() { call('pauseVideo'); },
      seek(t) { call('seekTo', t, true); },
      time: () => call('getCurrentTime') || 0,
      duration: () => call('getDuration') || 0,
      setRate(r) { call('setPlaybackRate', r); },
      setVolume(x) { call('setVolume', Math.round(x * 100)); },
      setMuted(b) { call(b ? 'mute' : 'unMute'); },
      isMuted: () => { const m = call('isMuted'); return m === undefined ? true : m; } };
  }

  // Accepts youtube.com/watch?v=…, youtu.be/…, /embed/…, /shorts/…, /live/… or a bare 11-char id.
  function parseYouTube(str) {
    const s = String(str || '').trim();
    const m = s.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/);
    if (m) return m[1];
    return /^[\w-]{11}$/.test(s) ? s : null;
  }

  App.player = {
    create(src) {
      src = src || { kind: 'sim' };
      if (src.kind === 'youtube') return youtube(src);
      if (src.kind === 'file' && src.url) return html5(src);
      return sim();
    },
    sim, parseYouTube,
    label: (src) => !src || src.kind === 'sim' ? 'Video mô phỏng' : src.kind === 'youtube' ? 'YouTube' : 'File video'
  };
})();

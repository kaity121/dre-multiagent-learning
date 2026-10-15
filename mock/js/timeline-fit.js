/* timeline-fit.js — fits the lesson timeline (parts, transcript, script, replays,
   citations, moods, opening window) to the real length of the attached video.
   All times are scaled proportionally from the prepared 08:30 lesson, objects are
   mutated in place so every screen keeps its references. Instructor edits made
   while fitted are kept: each script item remembers its base (unscaled) time. */
(function () {
  const App = window.App, D = App.data;
  const base = {
    dur: D.LESSON.duration,
    opening: D.OPENING,
    parts: D.PARTS.map(p => [p.start, p.end]),
    transcript: D.TRANSCRIPT.map(l => l.t),
    moods: D.MOODS.map(m => m.t),
    remed: Object.keys(D.REMED).map(k => [k, D.REMED[k].replay.slice()]),
    cites: Object.keys(D.ANSWERS).map(k => [k, D.ANSWERS[k].cite])
  };
  let current = base.dur;
  const round = (x) => Math.round(x * 10) / 10;
  const factor = () => current / base.dur;

  function fit(duration) {
    if (!(duration > 30)) return false;
    const old = factor();
    const k = duration / base.dur;
    // remember each script item's base time before rescaling (covers instructor edits)
    App.state.script.forEach(it => { if (it._baseT == null) it._baseT = it.t / old; it.t = round(it._baseT * k); });
    D.PARTS.forEach((p, i) => { p.start = round(base.parts[i][0] * k); p.end = round(base.parts[i][1] * k); });
    D.PARTS[D.PARTS.length - 1].end = round(duration);
    D.TRANSCRIPT.forEach((l, i) => { l.t = round(base.transcript[i] * k); });
    D.MOODS.forEach((m, i) => { m.t = round(base.moods[i] * k); });
    base.remed.forEach(([key, r]) => { D.REMED[key].replay = [round(r[0] * k), round(r[1] * k)]; });
    base.cites.forEach(([key, c]) => { D.ANSWERS[key].cite = round(c * k); });
    D.OPENING = Math.max(5, Math.round(base.opening * k));
    D.LESSON.duration = round(duration);
    current = D.LESSON.duration;
    return true;
  }

  App.timeline = {
    fit,
    reset() { fit(base.dur); },
    factor,
    isFitted: () => Math.abs(current - base.dur) > 0.5,
    baseDuration: () => base.dur,
    // keep an edited script time stable across later re-fits
    rememberEdit(item) { item._baseT = item.t / factor(); }
  };
})();

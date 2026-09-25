/* Codicillus Seraphinianus — the orchestra: every sound is synthesised in the browser.
   A celesta (FM), a plucked harp (Karplus–Strong), a formant choir, a glass flute, a reed,
   bass, marimba, timpani, bells, and the foley of paper and ink. */
(function (C) {
  'use strict';
  const Au = (C.Audio = {});
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  Au.mtof = mtof;

  let rngState = 12345;
  const rnd = () => {
    rngState = (rngState * 1664525 + 1013904223) >>> 0;
    return rngState / 4294967296;
  };

  // ------------------------------------------------------------ graph
  function makeIR(ctx, secs, decay, seed) {
    rngState = seed || 777;
    const sr = ctx.sampleRate, n = Math.floor(sr * secs);
    const buf = ctx.createBuffer(2, n, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        const v = rnd() * 2 - 1;
        // the tail darkens as it decays
        lp += (v - lp) * (0.18 + 0.7 * Math.exp(-t * 2.5));
        let s = lp * Math.pow(1 - i / n, decay);
        if (t < 0.012) s *= t / 0.012;
        // a few early reflections
        if (i === Math.floor(sr * (0.013 + ch * 0.004)) || i === Math.floor(sr * (0.029 + ch * 0.006)) || i === Math.floor(sr * 0.047)) s += 0.35 * (ch ? -1 : 1);
        d[i] = s;
      }
    }
    return buf;
  }

  function makeNoise(ctx, secs) {
    rngState = 4242;
    const n = Math.floor(ctx.sampleRate * secs);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = rnd() * 2 - 1;
    return buf;
  }

  // Karplus–Strong pluck, rendered once per pitch
  function ksBuffer(ctx, midi, secs, bright) {
    const sr = ctx.sampleRate;
    const f = mtof(midi);
    const len = Math.floor(sr * secs);
    const buf = ctx.createBuffer(1, len, sr);
    const out = buf.getChannelData(0);
    const N = Math.max(2, Math.round(sr / f));
    const line = new Float32Array(N);
    rngState = 999 + midi * 17;
    let lp = 0;
    for (let i = 0; i < N; i++) {
      const v = rnd() * 2 - 1;
      lp += (v - lp) * (bright || 0.5);
      line[i] = lp;
    }
    // remove DC from the excitation
    let mean = 0;
    for (let i = 0; i < N; i++) mean += line[i];
    mean /= N;
    for (let i = 0; i < N; i++) line[i] -= mean;
    const rho = Math.pow(0.001, 1 / (f * secs * 0.9));
    let idx = 0, prev = 0;
    for (let i = 0; i < len; i++) {
      const cur = line[idx];
      const nv = rho * 0.5 * (cur + prev);
      prev = cur;
      line[idx] = nv;
      out[i] = cur;
      idx = (idx + 1) % N;
    }
    // soften the onset click
    for (let i = 0; i < 64 && i < len; i++) out[i] *= i / 64;
    return buf;
  }

  function buildGraph(ctx) {
    const G = { ctx, ks: new Map() };
    G.master = ctx.createGain();
    G.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 12;
    comp.ratio.value = 3;
    comp.attack.value = 0.008;
    comp.release.value = 0.25;
    const low = ctx.createBiquadFilter();
    low.type = 'lowshelf';
    low.frequency.value = 180;
    low.gain.value = 1.5;
    const air = ctx.createBiquadFilter();
    air.type = 'highshelf';
    air.frequency.value = 7000;
    air.gain.value = -2;
    G.mix = ctx.createGain();
    G.mix.connect(low);
    low.connect(air);
    air.connect(comp);
    // fade: a short dip that hides every seek and pause; master: the mute switch
    G.fade = ctx.createGain();
    G.fade.gain.value = 1;
    comp.connect(G.fade);
    G.fade.connect(G.master);
    G.master.connect(ctx.destination);
    G.conv = ctx.createConvolver();
    G.conv.buffer = makeIR(ctx, 3.4, 2.6, 31);
    G.revOut = ctx.createGain();
    G.revOut.gain.value = 0.9;
    G.conv.connect(G.revOut);
    G.revOut.connect(G.mix);
    // buses with fixed reverb sends
    G.bus = {};
    for (const [name, dry, wet] of [['dry', 1, 0.12], ['room', 0.9, 0.32], ['wet', 0.75, 0.62], ['far', 0.45, 0.9]]) {
      const b = ctx.createGain();
      const d = ctx.createGain();
      d.gain.value = dry;
      const w = ctx.createGain();
      w.gain.value = wet;
      b.connect(d);
      d.connect(G.mix);
      b.connect(w);
      w.connect(G.conv);
      G.bus[name] = b;
    }
    G.noise = makeNoise(ctx, 2.5);
    return G;
  }

  // ------------------------------------------------------------ helpers
  let live = new Set();
  function track(node) {
    const set = live;
    set.add(node);
    node.onended = () => set.delete(node);
    return node;
  }
  function out(G, bus, pan) {
    const ctx = G.ctx;
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (p) {
      p.pan.value = Math.max(-1, Math.min(1, pan || 0));
      p.connect(G.bus[bus || 'room']);
      return p;
    }
    return G.bus[bus || 'room'];
  }
  function osc(G, type, f, t, stop) {
    const o = G.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.start(t);
    o.stop(stop);
    return track(o);
  }
  function noiseSrc(G, t, dur, rate) {
    const s = G.ctx.createBufferSource();
    s.buffer = G.noise;
    s.loop = true;
    if (rate) s.playbackRate.value = rate;
    s.start(t, rnd() * 2);
    s.stop(t + dur);
    return track(s);
  }
  function adsr(param, t, a, peak, d, sus, rel, end) {
    param.setValueAtTime(0.0001, t);
    param.exponentialRampToValueAtTime(Math.max(0.0001, peak), t + a);
    param.exponentialRampToValueAtTime(Math.max(0.0001, peak * sus), t + a + d);
    param.setValueAtTime(Math.max(0.0001, peak * sus), end);
    param.exponentialRampToValueAtTime(0.0001, end + rel);
  }

  // ------------------------------------------------------------ instruments
  const I = (Au.inst = {});

  I.celesta = function (G, t, m, vel, pan, bus) {
    vel = Math.max(0.002, vel || 0);
    const ctx = G.ctx, f = mtof(m);
    const dec = Math.max(0.5, 2.4 - (m - 60) * 0.045);
    const dest = out(G, bus || 'wet', pan);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel * 0.42, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    g.connect(dest);
    const car = osc(G, 'sine', f, t, t + dec + 0.05);
    const mod = osc(G, 'sine', f * 3.5, t, t + 0.4);
    const mg = ctx.createGain();
    mg.gain.setValueAtTime(f * 1.4, t);
    mg.gain.exponentialRampToValueAtTime(0.5, t + 0.3);
    mod.connect(mg);
    mg.connect(car.frequency);
    car.connect(g);
    const hi = osc(G, 'sine', f * 4.01, t, t + 0.3);
    const hg = ctx.createGain();
    hg.gain.setValueAtTime(vel * 0.05, t);
    hg.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    hi.connect(hg);
    hg.connect(dest);
  };

  I.harp = function (G, t, m, vel, pan, bus, bright) {
    vel = Math.max(0.002, vel || 0);
    const key = m + ':' + (bright || 0.5);
    if (!G.ks.has(key)) G.ks.set(key, ksBuffer(G.ctx, m, m > 80 ? 1.4 : 2.6, bright || 0.5));
    const s = G.ctx.createBufferSource();
    s.buffer = G.ks.get(key);
    const g = G.ctx.createGain();
    g.gain.value = vel * 1.05;
    s.connect(g);
    g.connect(out(G, bus || 'room', pan));
    s.start(t);
    track(s);
  };

  // A formant choir: detuned saws through vowel filters. vowels: [[t, 'a'], ...]
  const VOW = {
    a: [[800, 1], [1150, 0.5], [2800, 0.22]],
    o: [[450, 1], [800, 0.35], [2830, 0.1]],
    u: [[325, 1], [700, 0.25], [2530, 0.06]],
    e: [[400, 1], [1900, 0.3], [2700, 0.18]],
    i: [[300, 1], [2200, 0.25], [3000, 0.15]],
  };
  I.choir = function (G, t, dur, notes, vel, vowels, o) {
    o = o || {};
    const ctx = G.ctx;
    const end = t + dur;
    const att = o.att || 0.9, rel = o.rel || 1.4;
    const sum = ctx.createGain();
    sum.gain.value = 0.46;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 140;
    sum.connect(hp);
    const outG = ctx.createGain();
    outG.gain.setValueAtTime(0.0001, t);
    outG.gain.exponentialRampToValueAtTime(vel, t + att);
    outG.gain.setValueAtTime(vel, Math.max(t + att, end));
    outG.gain.exponentialRampToValueAtTime(0.0001, Math.max(t + att, end) + rel);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3800;
    outG.connect(lp);
    lp.connect(out(G, o.bus || 'wet', o.pan || 0));
    const vs = vowels && vowels.length ? vowels : [[0, 'a']];
    for (let k = 0; k < 3; k++) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = k === 0 ? 5 : 8;
      const bg = ctx.createGain();
      const v0 = VOW[vs[0][1]][k];
      bp.frequency.setValueAtTime(v0[0], t);
      bg.gain.setValueAtTime(v0[1] * 2.2, t);
      for (let j = 1; j < vs.length; j++) {
        const v = VOW[vs[j][1]][k];
        bp.frequency.linearRampToValueAtTime(v[0], t + vs[j][0]);
        bg.gain.linearRampToValueAtTime(v[1] * 2.2, t + vs[j][0]);
      }
      hp.connect(bp);
      bp.connect(bg);
      bg.connect(outG);
    }
    const stop = Math.max(t + att, end) + rel + 0.1;
    for (const m of notes) {
      const f = mtof(m);
      const lfo = osc(G, 'sine', 4.6 + rnd() * 1.2, t, stop);
      const lg = ctx.createGain();
      lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(f * 0.0045, t + 1.2);
      lfo.connect(lg);
      for (const det of [-7, 6]) {
        const s = osc(G, 'sawtooth', f * Math.pow(2, det / 1200), t, stop);
        lg.connect(s.frequency);
        s.connect(sum);
      }
    }
  };

  // glass flute: pure, breathy, with a slow vibrato
  I.glass = function (G, t, m, dur, vel, pan, bus) {
    vel = Math.max(0.002, vel || 0);
    const ctx = G.ctx, f = mtof(m);
    const g = ctx.createGain();
    const end = t + dur;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel * 0.3, t + 0.09);
    g.gain.setValueAtTime(vel * 0.26, Math.max(t + 0.1, end - 0.05));
    g.gain.exponentialRampToValueAtTime(0.0001, end + 0.6);
    g.connect(out(G, bus || 'wet', pan));
    const stop = end + 0.7;
    const o1 = osc(G, 'sine', f, t, stop);
    const o2 = osc(G, 'sine', f * 2, t, stop);
    const g2 = ctx.createGain();
    g2.gain.value = 0.12;
    o2.connect(g2);
    g2.connect(g);
    const o3 = osc(G, 'triangle', f, t, stop);
    const g3 = ctx.createGain();
    g3.gain.value = 0.25;
    o3.connect(g3);
    g3.connect(g);
    const vib = osc(G, 'sine', 5.3, t, stop);
    const vg = ctx.createGain();
    vg.gain.setValueAtTime(0, t);
    vg.gain.linearRampToValueAtTime(f * 0.005, t + 0.4);
    vib.connect(vg);
    vg.connect(o1.frequency);
    vg.connect(o3.frequency);
    o1.connect(g);
    const n = noiseSrc(G, t, dur + 0.3);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f * 2;
    bp.Q.value = 3;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(vel * 0.05, t);
    ng.gain.exponentialRampToValueAtTime(vel * 0.012, t + 0.3);
    n.connect(bp);
    bp.connect(ng);
    ng.connect(g);
  };

  // a nasal reed for the alligator
  I.reed = function (G, t, m, dur, vel, pan) {
    vel = Math.max(0.002, vel || 0);
    const ctx = G.ctx, f = mtof(m);
    const s = osc(G, 'sawtooth', f, t, t + dur + 0.2);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = Math.min(1800, f * 5);
    bp.Q.value = 1.4;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    const g = ctx.createGain();
    adsr(g.gain, t, 0.02, vel * 0.5, 0.08, 0.6, 0.12, t + dur);
    s.connect(bp);
    bp.connect(lp);
    lp.connect(g);
    g.connect(out(G, 'room', pan));
  };

  I.bass = function (G, t, m, dur, vel, pluck) {
    vel = Math.max(0.002, vel || 0);
    const ctx = G.ctx, f = mtof(m);
    const g = ctx.createGain();
    if (pluck) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vel * 0.27, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(dur, 0.9));
    } else adsr(g.gain, t, 0.04, vel * 0.18, 0.4, 0.7, 0.5, t + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(pluck ? 1400 : 700, t);
    lp.frequency.exponentialRampToValueAtTime(pluck ? 260 : 320, t + 0.3);
    const stop = t + dur + 0.6;
    const o1 = osc(G, 'triangle', f, t, stop);
    const o2 = osc(G, 'sine', f, t, stop);
    o1.connect(lp);
    o2.connect(lp);
    lp.connect(g);
    g.connect(out(G, 'dry', 0));
  };

  I.drone = function (G, t, dur, notes, vel) {
    const ctx = G.ctx;
    const g = ctx.createGain();
    adsr(g.gain, t, 2.2, vel, 0.5, 1, 2.5, t + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 260;
    lp.Q.value = 2;
    const lfo = osc(G, 'sine', 0.13, t, t + dur + 3);
    const lg = ctx.createGain();
    lg.gain.value = 90;
    lfo.connect(lg);
    lg.connect(lp.frequency);
    g.connect(out(G, 'wet', 0));
    lp.connect(g);
    for (const m of notes) {
      osc(G, 'sawtooth', mtof(m) * 1.002, t, t + dur + 3).connect(lp);
      osc(G, 'sine', mtof(m), t, t + dur + 3).connect(lp);
    }
  };

  I.marimba = function (G, t, m, vel, pan, bus) {
    vel = Math.max(0.002, vel || 0);
    const ctx = G.ctx, f = mtof(m);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel * 0.45, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    g.connect(out(G, bus || 'room', pan));
    osc(G, 'sine', f, t, t + 0.55).connect(g);
    const o4 = osc(G, 'sine', f * 3.93, t, t + 0.1);
    const g4 = ctx.createGain();
    g4.gain.setValueAtTime(vel * 0.12, t);
    g4.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o4.connect(g4);
    g4.connect(out(G, bus || 'room', pan));
  };

  I.tick = function (G, t, vel, pan, hi) {
    vel = Math.max(0.002, vel || 0);
    const ctx = G.ctx;
    const n = noiseSrc(G, t, 0.03);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = hi ? 5200 : 3400;
    bp.Q.value = 4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * 0.9, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
    n.connect(bp);
    bp.connect(g);
    g.connect(out(G, 'dry', pan));
    const o = osc(G, 'sine', hi ? 2600 : 1900, t, t + 0.02);
    const og = ctx.createGain();
    og.gain.setValueAtTime(vel * 0.12, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);
    o.connect(og);
    og.connect(out(G, 'dry', pan));
  };

  I.timpani = function (G, t, m, vel) {
    vel = Math.max(0.002, vel || 0);
    const ctx = G.ctx, f = mtof(m);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    g.connect(out(G, 'wet', 0));
    const o = osc(G, 'sine', f * 1.3, t, t + 3.3);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.09);
    o.connect(g);
    const o2 = osc(G, 'sine', f * 1.51, t, t + 1.5);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(vel * 0.3, t);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o2.connect(g2);
    g2.connect(out(G, 'wet', 0));
    const n = noiseSrc(G, t, 0.25);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 350;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(vel * 0.8, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    n.connect(lp);
    lp.connect(ng);
    ng.connect(out(G, 'room', 0));
  };

  I.bell = function (G, t, m, vel, pan, dur) {
    vel = Math.max(0.002, vel || 0);
    const ctx = G.ctx, f = mtof(m);
    dur = dur || 4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel * 0.3, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(out(G, 'far', pan));
    const car = osc(G, 'sine', f, t, t + dur + 0.1);
    const mod = osc(G, 'sine', f * 1.4, t, t + dur + 0.1);
    const mg = ctx.createGain();
    mg.gain.setValueAtTime(f * 2.2, t);
    mg.gain.exponentialRampToValueAtTime(f * 0.05, t + dur * 0.8);
    mod.connect(mg);
    mg.connect(car.frequency);
    car.connect(g);
  };

  // ------------------------------------------------------------ foley
  I.swish = function (G, t, dur, vel, p0, p1) {
    vel = Math.max(0.002, vel || 0);
    const ctx = G.ctx;
    const n = noiseSrc(G, t, dur + 0.2);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(500, t);
    bp.frequency.exponentialRampToValueAtTime(2600, t + dur * 0.45);
    bp.frequency.exponentialRampToValueAtTime(700, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel * 0.5, t + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(vel * 0.2, t + dur * 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    n.connect(bp);
    bp.connect(g);
    if (p) {
      p.pan.setValueAtTime(p0, t);
      p.pan.linearRampToValueAtTime(p1, t + dur);
      g.connect(p);
      p.connect(G.bus.room);
    } else g.connect(G.bus.room);
  };
  I.thud = function (G, t, vel, f) {
    vel = Math.max(0.002, vel || 0);
    const ctx = G.ctx;
    const o = osc(G, 'sine', (f || 90) * 1.6, t, t + 0.4);
    o.frequency.exponentialRampToValueAtTime(f || 90, t + 0.06);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * 0.7, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g);
    g.connect(out(G, 'room', 0));
    const n = noiseSrc(G, t, 0.12);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(vel * 0.35, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    n.connect(lp);
    lp.connect(ng);
    ng.connect(out(G, 'room', 0));
  };
  I.drop = function (G, t, vel, pan) {
    vel = Math.max(0.002, vel || 0);
    const ctx = G.ctx;
    const o = osc(G, 'sine', 1500, t, t + 0.12);
    o.frequency.exponentialRampToValueAtTime(520, t + 0.05);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel * 0.4, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g);
    g.connect(out(G, 'wet', pan));
  };
  I.bubble = function (G, t, vel, pan, f) {
    vel = Math.max(0.002, vel || 0);
    const ctx = G.ctx;
    f = f || 500 + rnd() * 600;
    const o = osc(G, 'sine', f, t, t + 0.09);
    o.frequency.exponentialRampToValueAtTime(f * 2.1, t + 0.06);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel * 0.25, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g);
    g.connect(out(G, 'wet', pan));
  };
  I.gulp = function (G, t, vel) {
    vel = Math.max(0.002, vel || 0);
    const ctx = G.ctx;
    const o = osc(G, 'sine', 240, t, t + 0.18);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.14);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel * 0.55, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g);
    g.connect(out(G, 'room', -0.2));
    I.tick(G, t + 0.02, vel * 0.3, -0.2);
  };
  I.splash = function (G, t, vel, pan) {
    vel = Math.max(0.002, vel || 0);
    const ctx = G.ctx;
    const n = noiseSrc(G, t, 0.5);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1800, t);
    bp.frequency.exponentialRampToValueAtTime(700, t + 0.4);
    bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel * 0.35, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    n.connect(bp);
    bp.connect(g);
    g.connect(out(G, 'wet', pan));
    for (let k = 0; k < 4; k++) I.bubble(G, t + 0.05 + rnd() * 0.3, vel * 0.5, pan);
  };
  I.rattle = function (G, t, dur, vel, pan) {
    let tt = t;
    let gap = 0.03;
    while (tt < t + dur) {
      I.tick(G, tt, vel * (0.4 + rnd() * 0.6) * (1 - (tt - t) / dur * 0.6), pan + (rnd() - 0.5) * 0.2, rnd() < 0.5);
      tt += gap * (0.5 + rnd());
      gap *= 1.12;
    }
  };
  I.whoosh = function (G, t, dur, vel, f0, f1, pan) {
    vel = Math.max(0.002, vel || 0);
    const ctx = G.ctx;
    const n = noiseSrc(G, t, dur + 0.1);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.6;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel * 0.4, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(bp);
    bp.connect(g);
    g.connect(out(G, 'wet', pan || 0));
  };

  // the pen: a continuous scratch whose level follows the writing on screen
  function makeScratch(G) {
    const ctx = G.ctx;
    const n = ctx.createBufferSource();
    n.buffer = G.noise;
    n.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2600;
    const pk = ctx.createBiquadFilter();
    pk.type = 'peaking';
    pk.frequency.value = 5200;
    pk.gain.value = 7;
    pk.Q.value = 1.4;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 9500;
    const am = ctx.createGain();
    am.gain.value = 0.08;
    // the tooth of the paper: a jittery flutter so the nib catches and skips
    const fl = ctx.createBufferSource();
    const len = ctx.sampleRate * 2;
    const fb = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = fb.getChannelData(0);
    rngState = 77;
    let v = 0, target = 0;
    for (let i = 0; i < len; i++) {
      if (i % 220 === 0) target = rnd() < 0.3 ? 0 : Math.pow(rnd(), 0.6);
      v += (target - v) * 0.02;
      d[i] = v * 0.92;
    }
    fl.buffer = fb;
    fl.loop = true;
    fl.connect(am.gain);
    const lvl = ctx.createGain();
    lvl.gain.value = 0;
    n.connect(hp);
    hp.connect(pk);
    pk.connect(lp);
    lp.connect(am);
    am.connect(lvl);
    lvl.connect(out(G, 'dry', 0.1));
    n.start();
    fl.start();
    G.scratch = lvl;
    // room tone: the faint hush of a library at night
    const rt = ctx.createBufferSource();
    rt.buffer = G.noise;
    rt.loop = true;
    const rlp = ctx.createBiquadFilter();
    rlp.type = 'lowpass';
    rlp.frequency.value = 320;
    const rg = ctx.createGain();
    rg.gain.value = 0.02;
    rt.connect(rlp);
    rlp.connect(rg);
    rg.connect(G.bus.dry);
    rt.start();
  }

  // ------------------------------------------------------------ transport
  let G = null;
  let events = [];
  let evIdx = 0;
  let timer = null;
  let audioAt = 0, scoreAt = 0;
  let running = false;
  const LOOK = 0.35;

  Au.ready = () => !!(G && G.ctx && G.ctx.state === 'running');
  Au.context = () => (G ? G.ctx : null);
  Au.time = () => {
    if (!G) return 0;
    const lat = (G.ctx.outputLatency || 0) + (G.ctx.baseLatency || 0) * 0.5;
    return G.ctx.currentTime - Math.min(0.08, lat);
  };

  Au.init = function (show) {
    if (G) return G.ctx.resume();
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return Promise.reject(new Error('no audio'));
    const ctx = new AC({ latencyHint: 'playback' });
    G = buildGraph(ctx);
    makeScratch(G);
    events = C.Score.build(show);
    return ctx.resume();
  };

  function pump() {
    if (!G || !running) return;
    const now = G.ctx.currentTime;
    const horizon = now + LOOK;
    while (evIdx < events.length) {
      const e = events[evIdx];
      const at = audioAt + (e.t - scoreAt);
      if (at > horizon) break;
      if (at >= now - 0.05) {
        try { e.fn(G, Math.max(at, now)); } catch (err) { console.warn('audio event failed', err); }
      }
      evIdx++;
    }
  }

  // start playing the score from score time T; returns the audio time that corresponds to T
  Au.start = function (T) {
    if (!G) return 0;
    Au.silence();
    const ctx = G.ctx;
    audioAt = ctx.currentTime + 0.16;
    scoreAt = T;
    evIdx = 0;
    while (evIdx < events.length && events[evIdx].t < T - 0.02) evIdx++;
    G.fade.gain.setTargetAtTime(1, audioAt - 0.03, 0.012);
    running = true;
    pump();
    if (!timer) timer = setInterval(pump, 40);
    return audioAt;
  };
  // stop everything that sounds or is scheduled, behind a quick fade
  Au.silence = function () {
    running = false;
    if (!G) return;
    const now = G.ctx.currentTime;
    const old = live;
    live = new Set();
    G.fade.gain.cancelScheduledValues(now);
    G.fade.gain.setValueAtTime(G.fade.gain.value, now);
    G.fade.gain.setTargetAtTime(0, now, 0.018);
    for (const n of old) {
      try { n.stop(now + 0.12); } catch (e) { /* already stopped */ }
    }
    if (G.scratch) G.scratch.gain.setTargetAtTime(0, now, 0.02);
  };
  Au.pause = function () {
    Au.silence();
  };
  Au.setMuted = function (m) {
    if (!G) return;
    G.master.gain.setTargetAtTime(m ? 0 : 0.9, G.ctx.currentTime, 0.05);
  };
  Au.suspend = () => G && G.ctx.suspend();
  Au.resume = () => G && G.ctx.resume();

  Au.penLevel = (a) => 0.022 * Math.min(1, a * 0.3);
  // per frame: the nib follows the ink
  let lastLevel = 0;
  Au.update = function (T, show) {
    if (!G || !running) return;
    const a = show.activity(T);
    const level = Au.penLevel(a);
    if (Math.abs(level - lastLevel) > 0.002) {
      G.scratch.gain.setTargetAtTime(level, G.ctx.currentTime, 0.03);
      lastLevel = level;
    }
  };

  // Offline render of the whole score (used by the test tools, not by the page itself).
  Au.renderOffline = function (show, secs, sr) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const ctx = new OAC(2, Math.ceil((sr || 44100) * secs), sr || 44100);
    const g = buildGraph(ctx);
    makeScratch(g);
    const evs = C.Score.build(show);
    for (const e of evs) if (e.t < secs) e.fn(g, e.t + 0.05);
    // write the pen level as automation from the visual activity
    for (let t = 0; t < secs; t += 1 / 30) g.scratch.gain.setValueAtTime(Au.penLevel(show.activity(t)), t + 0.05);
    return ctx.startRendering();
  };
})((window.Codex = window.Codex || {}));

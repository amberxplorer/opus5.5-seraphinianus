/* Codicillus Seraphinianus — the score. 96 beats a minute in a lilting 12/8, thirty-six bars,
   four to a chapter. The harmony wanders from D through the flat sixth and seventh and home.
   Every event is a function of the audio clock, so picture and sound stay welded. */
(function (C) {
  'use strict';
  const S = (C.Score = {});
  const BEAT = 0.625, BAR = 2.5, TR = BEAT / 3; // a bar holds twelve triplet-eighth "slots"
  const barT = (b) => (b - 1) * BAR; // b may be fractional
  const slot = (b, k) => barT(b) + k * TR;

  const PC = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  const n = (s) => {
    const m = /^([A-G](?:#|b)?)(-?\d)$/.exec(s);
    return 12 * (+m[2] + 1) + PC[m[1]];
  };
  const ns = (s) => s.split(' ').map(n);

  const CH = {
    Dmaj9: ['D2', 'F#3 A3 C#4 E4', 'D3 A3 E4 F#4 A4 C#5 E5'],
    Bm11: ['B1', 'F#3 A3 D4 E4', 'B2 F#3 D4 E4 A4 D5 E5'],
    Gmaj7s11: ['G1', 'F#3 B3 C#4 D4', 'G2 D3 B3 C#4 F#4 B4 D5'],
    A6sus: ['A1', 'E3 F#3 A3 D4', 'A2 E3 D4 F#4 A4 D5 E5'],
    A: ['A1', 'E3 A3 C#4 E4', 'A2 E3 A3 C#4 E4 A4 C#5'],
    D: ['D2', 'F#3 A3 D4 F#4', 'D3 A3 D4 F#4 A4 D5 F#5'],
    Em7D: ['D2', 'E3 G3 B3 D4', 'D3 G3 B3 E4 G4 B4 D5'],
    Fsm7: ['F#2', 'E3 A3 C#4 F#4', 'F#2 C#3 A3 E4 F#4 A4 C#5'],
    G6: ['G2', 'E3 G3 B3 D4', 'G2 D3 B3 E4 G4 B4 D5'],
    A7sus: ['A2', 'E3 G3 A3 D4', 'A2 E3 G3 D4 E4 A4 D5'],
    A7: ['A2', 'E3 G3 C#4 E4', 'A2 E3 G3 C#4 E4 G4 C#5'],
    Bm9: ['B1', 'D3 F#3 A3 C#4', 'B2 F#3 A3 C#4 D4 F#4 C#5'],
    Gmaj7: ['G2', 'D3 F#3 B3 D4', 'G2 D3 B3 D4 F#4 B4 D5'],
    DFs: ['F#2', 'D3 A3 D4 F#4', 'F#2 D3 A3 D4 F#4 A4 D5'],
    Em7: ['E2', 'D3 G3 B3 E4', 'E2 B2 G3 D4 E4 G4 B4'],
    Asus: ['A2', 'E3 A3 D4 E4', 'A2 E3 A3 D4 E4 A4 D5'],
    Bbmaj7s11: ['Bb1', 'D3 F3 A3 E4', 'Bb2 F3 A3 D4 E4 A4 D5'],
    C69: ['C2', 'E3 A3 D4 G4', 'C3 G3 D4 E4 A4 D5 E5'],
    Em9: ['E2', 'D3 F#3 G3 B3', 'E2 B2 G3 D4 F#4 G4 B4'],
    BbC: ['C2', 'D3 F3 Bb3 D4', 'C3 F3 Bb3 D4 F4 Bb4 D5'],
    Bb7: ['Bb1', 'D3 Ab3 Bb3 F4', 'Bb2 F3 Ab3 D4 F4 Ab4 D5'],
    Bm7: ['B1', 'D3 F#3 A3 D4', 'B2 F#3 A3 D4 F#4 A4 D5'],
    Gmaj9: ['G2', 'F#3 A3 B3 D4', 'G2 D3 A3 B3 F#4 A4 D5'],
    Em: ['E2', 'E3 G3 B3 E4', 'E2 B2 G3 B3 E4 G4 B4'],
    B7: ['B1', 'D#3 A3 B3 F#4', 'B2 F#3 A3 D#4 F#4 A4 D#5'],
    G: ['G2', 'D3 G3 B3 D4', 'G2 D3 G3 B3 D4 G4 B4'],
    A13: ['A2', 'F#3 G3 C#4 E4', 'A2 E3 G3 C#4 F#4 G4 C#5'],
    Bbmaj7: ['Bb1', 'D3 F3 A3 D4', 'Bb2 F3 A3 D4 F4 A4 D5'],
    Cadd9: ['C2', 'E3 G3 D4 E4', 'C3 G3 D4 E4 G4 C5 D5'],
    Dbig: ['D2', 'D3 A3 D4 F#4 A4', 'D3 A3 D4 F#4 A4 D5 F#5'],
    Dend: ['D2', 'F#3 A3 C#4 E4 A4', 'D3 A3 C#4 E4 F#4 A4 C#5 E5'],
  };
  const chord = (name) => { const c = CH[name]; return { bass: n(c[0]), pad: ns(c[1]), arp: ns(c[2]) }; };

  // [bar (1-based, fractional allowed), chord]
  const PROG = [
    [1, 'Dmaj9'], [2, 'Bm11'], [3, 'Gmaj7s11'], [4, 'A6sus'], [4.5, 'A'],
    [5, 'D'], [6, 'Em7D'], [7, 'Fsm7'], [7.5, 'G6'], [8, 'A7sus'], [8.5, 'A7'],
    [9, 'Bm9'], [10, 'Gmaj7'], [11, 'DFs'], [11.5, 'Em7'], [12, 'Asus'], [12.5, 'A7'],
    [13, 'Bbmaj7s11'], [14, 'C69'], [15, 'Dmaj9'], [16, 'A7sus'], [16.5, 'A7'],
    [17, 'Gmaj7'], [18, 'Fsm7'], [18.5, 'Bm7'], [19, 'Em9'], [19.25, 'BbC'], [20, 'Bb7'], [20.5, 'A7'],
    [21, 'D'], [22, 'Bm7'], [23, 'Gmaj9'], [24, 'A7sus'], [24.5, 'A7'],
    [25, 'Em'], [26, 'A7'], [27, 'D'], [27.5, 'B7'], [28, 'Em'], [28.5, 'A7'],
    [29, 'G'], [30, 'A'], [31, 'Fsm7'], [31.5, 'Bm7'], [32, 'Em9'], [32.5, 'A13'],
    [33, 'Bbmaj7'], [34, 'Cadd9'], [35, 'Dbig'], [36, 'Dend'],
  ];
  const segs = PROG.map(([b, name], i) => ({ b, e: i + 1 < PROG.length ? PROG[i + 1][0] : 37.2, c: chord(name), name }));
  const chordAt = (t) => { let c = segs[0]; for (const s of segs) if (barT(s.b) <= t + 1e-6) c = s; return c; };

  // melodies: [note, slot, length in slots]
  const THEME = {
    flora: [
      [['A4', 0, 3], ['D5', 3, 3], ['F#5', 6, 2], ['E5', 8, 1], ['D5', 9, 3]],
      [['C#5', 0, 2], ['D5', 2, 1], ['E5', 3, 3], ['A4', 6, 6]],
      [['B4', 0, 3], ['D5', 3, 3], ['G5', 6, 2], ['F#5', 8, 1], ['E5', 9, 3]],
      [['D5', 0, 2], ['E5', 2, 1], ['F#5', 3, 2], ['E5', 5, 1], ['C#5', 6, 4], ['A4', 10, 2]],
    ],
    fauna: [
      [['F#5', 0, 1], ['D5', 1, 1], ['B4', 2, 1], ['C#5', 3, 1], ['D5', 4, 1], ['F#5', 5, 1], ['A5', 6, 3], ['F#5', 9, 3]],
      [['G5', 0, 1], ['D5', 1, 1], ['B4', 2, 1], ['D5', 3, 1], ['F#5', 4, 1], ['A5', 5, 1], ['B5', 6, 3], ['A5', 9, 3]],
    ],
    lovers: [
      [['B4', 0, 6], ['A4', 6, 3], ['F#4', 9, 3]],
      [['A4', 0, 3], ['C#5', 3, 3], ['D5', 6, 6]],
      [['B4', 0, 3]],
    ],
    games: [
      [['B4', 0, 1], ['E5', 1, 1], ['G5', 2, 1], ['F#5', 3, 1], ['E5', 4, 1], ['D#5', 5, 1], ['E5', 6, 3], ['B4', 9, 3]],
      [['C#5', 0, 1], ['E5', 1, 1], ['G5', 2, 1], ['F#5', 3, 1], ['E5', 4, 1], ['D5', 5, 1], ['C#5', 6, 3], ['A4', 9, 3]],
      [['D5', 0, 1], ['F#5', 1, 1], ['A5', 2, 1], ['F#5', 3, 1], ['D5', 4, 1], ['F#5', 5, 1], ['D#5', 6, 2], ['F#5', 8, 1], ['A5', 9, 3]],
      [['G5', 0, 1], ['F#5', 1, 1], ['E5', 2, 1], ['B4', 3, 1], ['E5', 4, 1], ['G5', 5, 1], ['A5', 6, 2], ['G5', 8, 1], ['E5', 9, 3]],
    ],
    city: [
      [['B4', 0, 3], ['D5', 3, 3], ['G5', 6, 2], ['F#5', 8, 1], ['E5', 9, 3]],
      [['C#5', 0, 2], ['D5', 2, 1], ['E5', 3, 3], ['A5', 6, 6]],
      [['F#5', 0, 3], ['A5', 3, 3], ['B5', 6, 2], ['A5', 8, 1], ['F#5', 9, 3]],
      [['G5', 0, 2], ['F#5', 2, 1], ['E5', 3, 3], ['C#5', 6, 3], ['E5', 9, 3]],
    ],
  };

  S.build = function (show) {
    const ev = [];
    const at = (t, fn) => { if (t >= 0) ev.push({ t, fn }); };
    const I = C.Audio.inst;
    let r = 91;
    const rnd = () => { r = (r * 16807) % 2147483647; return (r - 1) / 2147483646; };

    const melody = (startBar, bars, inst, vel, o) => {
      o = o || {};
      bars.forEach((notes, bi) => {
        for (const [nm, k, len] of notes) {
          const t = slot(startBar + bi, k);
          const m = n(nm) + (o.oct || 0) * 12;
          const d = len * TR;
          const v = vel * (k % 3 === 0 ? 1 : 0.8) * (0.92 + rnd() * 0.12);
          if (inst === 'celesta') at(t, (G, w) => I.celesta(G, w, m, v, o.pan || 0.2));
          else if (inst === 'glass') at(t, (G, w) => I.glass(G, w, m, d * 0.95, v, o.pan || -0.1));
          else if (inst === 'harp') at(t, (G, w) => I.harp(G, w, m, v, o.pan || -0.2));
          if (o.double) at(t, (G, w) => I.glass(G, w, m, d * 0.9, v * 0.55, 0.1));
        }
      });
    };
    // choir pads for a span of bars, following the harmony
    const pads = (b0, b1, vel, vowel, o) => {
      o = o || {};
      for (const s of segs) {
        if (s.e <= b0 || s.b >= b1) continue;
        const t0 = barT(Math.max(s.b, b0)), t1 = barT(Math.min(s.e, b1));
        const notes = s.c.pad.map((m) => m + (o.oct || 0) * 12);
        const vw = typeof vowel === 'string' ? [[0, vowel]] : vowel;
        at(t0, (G, w) => I.choir(G, w, t1 - t0, notes, vel, vw, { att: o.att || 0.35, rel: o.rel || 0.9, pan: o.pan || 0 }));
      }
    };
    const bassLine = (b0, b1, vel, pattern, pluck) => {
      for (let b = b0; b < b1; b++) {
        for (const k of pattern) {
          const t = slot(b, k);
          const c = chordAt(t + 0.01).c;
          at(t, (G, w) => I.bass(G, w, c.bass + 12, pluck ? 0.8 : TR * 6, vel, pluck));
        }
      }
    };
    const arps = (b0, b1, vel, o) => {
      o = o || {};
      const shape = o.shape || [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
      for (let b = b0; b < b1; b++) {
        for (let k = 0; k < 12; k++) {
          if (o.skip && o.skip.indexOf(k) >= 0) continue;
          const t = slot(b, k);
          const c = chordAt(t + 0.01).c;
          const m = c.arp[Math.min(c.arp.length - 1, shape[k % shape.length])] + (o.oct || 0) * 12;
          const v = vel * (k % 3 === 0 ? 1 : 0.7) * (0.85 + rnd() * 0.2);
          at(t + (rnd() - 0.5) * 0.012, (G, w) => I.harp(G, w, m, v, o.pan === undefined ? -0.25 : o.pan, 'room', o.bright));
        }
      }
    };
    const gliss = (t, from, to, dur, vel, inst) => {
      const scale = ns('D3 E3 F#3 A3 B3 D4 E4 F#4 A4 B4 D5 E5 F#5 A5 B5 D6 E6 F#6 A6');
      const a = scale.findIndex((m) => m >= from), b = scale.findIndex((m) => m >= to);
      const steps = Math.abs(b - a) + 1;
      for (let i = 0; i < steps; i++) {
        const m = scale[a + (b >= a ? i : -i)];
        const tt = t + (i / steps) * dur;
        if (inst === 'celesta') at(tt, (G, w) => I.celesta(G, w, m, vel, 0.3));
        else at(tt, (G, w) => I.harp(G, w, m, vel, -0.3 + i / steps * 0.6, 'wet', 0.7));
      }
    };

    // ---------------------------------------------------------- I · overture (bars 1–4)
    at(0.0, (G, w) => I.drone(G, w, 9.6, ns('D2 A2'), 0.055));
    pads(1, 5, 0.07, [[0, 'u'], [4, 'o']], { att: 1.6, rel: 1.6 });
    at(0.3, (G, w) => I.celesta(G, w, n('A5'), 0.35, 0.4));
    at(1.1, (G, w) => I.celesta(G, w, n('F#5'), 0.28, 0.4));
    at(1.8, (G, w) => I.celesta(G, w, n('E5'), 0.25, 0.4));
    // the seraph is drawn: sparkles, one wing pair at a time
    for (let k = 0; k < 3; k++) gliss(3.75 + k * 0.62, n('A4') + k * 5, n('F#5') + k * 5, 0.5, 0.18, 'celesta');
    at(5.35, (G, w) => I.bell(G, w, n('D5'), 0.35, 0, 3.5));
    arps(3, 5, 0.22, { shape: [0, 2, 4, 6, 4, 2, 1, 3, 5, 6, 5, 3] });
    at(8.1, (G, w) => I.celesta(G, w, n('D6'), 0.2, 0.5));
    at(8.55, (G, w) => I.celesta(G, w, n('E6'), 0.2, 0.5));

    // ---------------------------------------------------------- II · flora (5–8)
    pads(5, 9, 0.05, 'o');
    arps(5, 9, 0.28);
    bassLine(5, 9, 0.55, [0, 6], true);
    melody(5, THEME.flora, 'celesta', 0.55);

    // ---------------------------------------------------------- III · fauna (9–12)
    pads(9, 13, 0.045, [[0, 'o'], [5, 'a']]);
    bassLine(9, 13, 0.6, [0, 3, 6, 9], true);
    arps(9, 11, 0.22, { skip: [1, 4, 7, 10], bright: 0.75 });
    melody(9, THEME.fauna, 'celesta', 0.5);
    arps(11, 13, 0.2, { shape: [0, 2, 4, 6, 5, 3, 1, 2, 4, 6, 4, 2], oct: 1 });

    // ---------------------------------------------------------- IV–V · physics & machines (13–16)
    pads(13, 17, 0.05, 'u');
    for (let b = 13; b < 17; b++) {
      for (let k = 0; k < 12; k++) {
        const t = slot(b, k);
        const c = chordAt(t + 0.01).c;
        const idx = [0, 2, 4, 2, 1, 3, 5, 3, 2, 4, 6, 4][k];
        const m = c.arp[idx] + 12;
        const v = (k % 3 === 0 ? 0.5 : 0.34) * (b < 14 ? 0.15 + 0.85 * U01((t - barT(13)) / 2) : 1);
        at(t, (G, w) => I.marimba(G, w, m, v, 0.35));
      }
    }
    for (let b = 13; b < 17; b++) at(barT(b), (G, w) => I.bass(G, w, chordAt(barT(b) + 0.01).c.bass + 12, BAR * 0.95, 0.4, false));

    // ---------------------------------------------------------- VI · humankind (17–20)
    pads(17, 19.25, 0.06, [[0, 'a'], [3, 'o']]);
    pads(19.25, 21, 0.05, 'u', { oct: -1 });
    arps(17, 19, 0.2, { skip: [1, 2, 4, 5, 7, 8, 10, 11] });
    melody(17, THEME.lovers, 'glass', 0.6, { double: false });
    bassLine(17, 19, 0.45, [0], false);
    // the alligator: a reed that waddles
    const reedNotes = ns('C2 G2 C2 G2 C2 G2 Bb1 F2 Bb1 F2 A1 E2');
    reedNotes.forEach((m, i) => at(45.625 + i * BEAT / 2, (G, w) => I.reed(G, w, m + 12, 0.16, 0.75, -0.2)));

    // ---------------------------------------------------------- VIII · writing (21–24)
    pads(21, 25, 0.05, [[0, 'e'], [5, 'a']]);
    arps(21, 25, 0.16, { skip: [2, 5, 8, 11] });
    bassLine(21, 25, 0.5, [0, 6], true);

    // ---------------------------------------------------------- IX–X · games (25–28): a tarantella
    pads(25, 29, 0.03, 'o');
    for (let b = 25; b < 29; b++) {
      for (let beat = 0; beat < 4; beat++) {
        const t = slot(b, beat * 3);
        const c = chordAt(t + 0.01).c;
        at(t, (G, w) => I.bass(G, w, c.bass + 12, 0.4, 0.6, true));
        for (const k of [1, 2]) at(t + k * TR, (G, w) => { I.harp(G, w, c.arp[3], 0.22, 0.3, 'room', 0.8); I.harp(G, w, c.arp[4], 0.2, 0.35, 'room', 0.8); });
      }
    }
    melody(25, THEME.games, 'celesta', 0.5, { pan: 0.25 });

    // ---------------------------------------------------------- XI · architecture (29–32)
    pads(29, 33, 0.085, [[0, 'a'], [6.2, 'o']]);
    arps(29, 33, 0.3);
    bassLine(29, 33, 0.6, [0, 6], true);
    for (let b = 29; b < 33; b++) at(barT(b), (G, w) => I.bass(G, w, chordAt(barT(b) + 0.01).c.bass, BAR, 0.25, false));
    melody(29, THEME.city, 'celesta', 0.55, { double: true });

    // ---------------------------------------------------------- coda (33–36)
    pads(33, 35, 0.1, [[0, 'o'], [2.5, 'a']], { att: 1.2 });
    for (let k = 0; k < 20; k++) {
      const t = barT(33) + k * TR;
      const c = chordAt(t + 0.01).c;
      const m = c.arp[(k * 3) % c.arp.length] + 12;
      at(t, (G, w) => I.celesta(G, w, m, 0.22 + (k % 3 === 0 ? 0.1 : 0), (k % 2 ? 0.4 : -0.4)));
    }
    arps(34, 35, 0.22, { shape: [0, 1, 2, 3, 4, 5, 6, 6, 5, 4, 3, 2] });
    // the book shuts on the downbeat of bar 35
    at(barT(35), (G, w) => { I.timpani(G, w, n('D2'), 0.7); I.thud(G, w, 0.65, 70); });
    at(barT(35), (G, w) => I.choir(G, w, BAR * 0.95, chord('Dbig').pad, 0.13, [[0, 'a']], { att: 0.08, rel: 1.2 }));
    at(barT(35), (G, w) => I.bass(G, w, n('D2'), BAR, 0.45, false));
    // the words gather: rising runs that quicken
    for (let k = 0; k < 18; k++) {
      const t = 85.7 + (1 - Math.pow(1 - k / 18, 1.6)) * 1.75;
      const scale = ns('D4 E4 F#4 A4 B4 D5 E5 F#5 A5 B5 D6 E6 F#6 A6 B6 D7 E7 F#7');
      at(t, (G, w) => { I.harp(G, w, scale[k] - 12, 0.2, -0.4 + k * 0.045, 'wet', 0.7); I.celesta(G, w, scale[k], 0.16, 0.4 - k * 0.045); });
    }
    at(86.2, (G, w) => I.whoosh(G, w, 1.3, 0.5, 300, 5200, 0));
    // the title: bells and a last chord that lets go
    at(barT(36), (G, w) => { for (const [m, v, p] of [['D5', 0.3, -0.3], ['F#5', 0.26, 0.2], ['A5', 0.26, -0.1], ['D6', 0.3, 0.35]]) I.bell(G, w, n(m), v, p, 5); });
    at(barT(36), (G, w) => I.choir(G, w, 2.0, chord('Dend').pad, 0.1, [[0, 'a'], [2, 'o'], [3.2, 'u']], { att: 0.4, rel: 2.2 }));
    at(barT(36), (G, w) => I.bass(G, w, n('D2'), 2.2, 0.35, false));
    at(barT(36) + BEAT * 2, (G, w) => I.celesta(G, w, n('A5'), 0.22, 0.3));
    at(barT(36) + BEAT * 3, (G, w) => I.celesta(G, w, n('E6'), 0.18, -0.3));

    // ---------------------------------------------------------- page turns
    for (const tr of show.turns) {
      const dur = tr.t1 - tr.t0;
      if (tr.kind === 'cover') {
        at(tr.t0, (G, w) => { I.swish(G, w, dur, 0.9, 0.5, -0.6); I.bell(G, w + 0.1, n('A5'), 0.3, 0.2, 4); I.bell(G, w + 0.15, n('D6'), 0.25, -0.2, 4); });
        at(tr.t1 - 0.05, (G, w) => I.thud(G, w, 0.55, 80));
      } else if (tr.kind === 'close') {
        at(tr.t0, (G, w) => I.swish(G, w, dur, 1.0, -0.6, 0.5));
      } else {
        at(tr.t0, (G, w) => I.swish(G, w, dur, 0.75, 0.6, -0.6));
        at(tr.t1 - 0.08, (G, w) => I.thud(G, w, 0.18, 110));
        gliss(tr.t0 + 0.1, n('D4'), n('A5'), 0.55, 0.14, 'harp');
      }
    }

    // ---------------------------------------------------------- cues from the picture
    const letterNotes = ns('D4 E4 F#4 A4 B4 D5 E5 F#5 A5 B5 D6 E6 D6 B5 A5 F#5 E5 D5 B4 A4 F#4 E4 D4 A3');
    const hopNotes = ns('E5 G5 A5 B5 D6 E6 G6 A6 B6');
    const stepNotes = ns('D3 A3 F#3 A3 E3 B3 D3 A3 F#3 D4');
    for (const c of show.cues) {
      const t = c.t;
      switch (c.type) {
        case 'letter': at(t, (G, w) => I.celesta(G, w, letterNotes[c.i % letterNotes.length], 0.42, -0.3 + (c.i % 6) * 0.12)); break;
        case 'tick': at(t, (G, w) => I.tick(G, w, c.k % 4 === 0 ? 0.5 : 0.28, 0.3, c.k % 2 === 1)); break;
        case 'hop': at(t, (G, w) => I.marimba(G, w, hopNotes[c.k % hopNotes.length] - (c.pawn ? 5 : 0), 0.4, -0.4)); break;
        case 'dice': at(t, (G, w) => I.rattle(G, w, 0.6, 0.55, -0.4)); break;
        case 'gulp': at(t, (G, w) => I.gulp(G, w, 0.6)); break;
        case 'drip': for (let k = 0; k < c.n; k++) at(t + k * c.gap + c.fall, (G, w) => I.drop(G, w, 0.5, 0.2)); break;
        case 'step': at(t, (G, w) => I.harp(G, w, stepNotes[c.k % stepNotes.length], 0.45, 0.3, 'room', 0.25)); break;
        case 'uproot': at(t, (G, w) => { I.thud(G, w, 0.35, 140); I.whoosh(G, w, 0.5, 0.25, 200, 900, 0); }); break;
        case 'fish': at(t, (G, w) => { I.whoosh(G, w, 1.0, 0.45, 300, 2400, -0.2); I.choir(G, w, 2.2, chord('DFs').pad, 0.06, [[0, 'o'], [1, 'a']], { att: 0.6, rel: 1.4 }); }); gliss(t, n('D4'), n('D6'), 0.7, 0.2, 'harp'); break;
        case 'shoal': for (let k = 0; k < 22; k++) { const m = ns('B5 D6 F#6 A6 C#6 E6')[k % 6]; at(t + k * 0.13 + rnd() * 0.05, (G, w) => I.celesta(G, w, m, 0.12, rnd() * 1.4 - 0.7)); } break;
        case 'pendulum': at(t, (G, w) => { I.glass(G, w, 57, c.dur, 0.2, -0.3, 'wet'); I.glass(G, w, 64.03, c.dur, 0.16, 0.3, 'wet'); }); break;
        case 'sag': for (let k = 0; k < 8; k++) at(t + k * 0.2, (G, w) => I.glass(G, w, 76 - k, 0.24, 0.3, 0.2)); break;
        case 'wind': for (let k = 0; k < 7; k++) at(t - 0.5 + k * 0.06, (G, w) => I.tick(G, w, 0.3, 0.3, true)); break;
        case 'hatch': at(t, (G, w) => I.bell(G, w, n('A5'), 0.3, 0.2, 3)); gliss(t + 0.1, n('A4'), n('E6'), 0.5, 0.18, 'harp'); break;
        case 'moth': at(t, (G, w) => I.whoosh(G, w, 1.4, 0.4, 500, 3500, 0.2)); break;
        case 'twirl': for (let k = 0; k < 14; k++) at(t + (k / 14) * c.dur, (G, w) => I.celesta(G, w, ns('E5 G5 A5 B5 D6 E6 G6')[k % 7] + (k >= 7 ? 12 : 0) - 12, 0.2, 0.3)); break;
        case 'bleed': at(t, (G, w) => I.drop(G, w, 0.4, -0.2)); at(t + 0.5, (G, w) => I.drop(G, w, 0.3, -0.2)); break;
        case 'splash': at(t, (G, w) => I.splash(G, w, 0.4, 0.3)); break;
        case 'dusk': for (let k = 0; k < 14; k++) at(t + 0.5 + k * 0.22 + rnd() * 0.1, (G, w) => I.celesta(G, w, ns('G5 B5 D6 E6 A5 F#6')[k % 6], 0.12, rnd() * 1.2 - 0.6)); break;
        case 'lift': at(t, (G, w) => I.whoosh(G, w, 2.2, 0.35, 200, 3000, 0)); break;
        case 'croc': at(t, (G, w) => I.thud(G, w, 0.3, 60)); break;
        case 'gather': break;
        default: break;
      }
    }
    // the fish's bubbles
    const fish = show.cues.find((c) => c.type === 'fish');
    if (fish) for (let k = 0; k < 16; k++) at(fish.t + 0.3 + k * 0.28, (G, w) => I.bubble(G, w, 0.4, -0.3));

    ev.sort((a, b) => a.t - b.t);
    return ev;
  };

  function U01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
})((window.Codex = window.Codex || {}));

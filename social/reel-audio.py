"""python3 social/reel-audio.py OUTDIR [ids...]: writes OUTDIR/<id>.wav, an original synthesized track per
reel (no samples, no licence to clear), timed to what happens on screen. render-reels.mjs calls it and
muxes the track in. Needs numpy. Every track was approved by the owner on 2026-10-29: changing a spec
changes a published sound, so get the owner's OK first. No whooshes or noise sweeps (rejected)."""
import sys
import wave

import numpy as np

SR = 44100


def env(n, decay):
    return np.exp(-np.arange(n) / SR / decay)


def lowpass(x, fc, order=2):
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(np.fft.rfft(x) / np.sqrt(1 + (f / fc) ** (2 * order)), len(x))


def highpass(x, fc, order=2):
    f = np.fft.rfftfreq(len(x), 1 / SR) + 1e-9
    return np.fft.irfft(np.fft.rfft(x) / np.sqrt(1 + (fc / f) ** (2 * order)), len(x))


def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def ramp(n, a, r, dur):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.clip((dur - t) / r, 0, 1)


class Kit:
    def __init__(self, seed, kick_hz=45, heavy=1.0):
        self.rng = np.random.default_rng(seed)
        rng = self.rng
        n = int(0.45 * SR); t = np.arange(n) / SR
        freq = kick_hz + 75 * np.exp(-t / 0.035)
        body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * env(n, 0.22 * heavy)
        click = lowpass(rng.standard_normal(n), 3000) * env(n, 0.004) * 0.4
        self.kick = np.tanh(1.6 * heavy * (body + click))
        n = int(0.35 * SR); t = np.arange(n) / SR
        self.snare = 0.55 * highpass(lowpass(rng.standard_normal(n), 6000), 900) * env(n, 0.09) + 0.45 * np.sin(2 * np.pi * 185 * t) * env(n, 0.05)
        n = int(0.08 * SR)
        self.hat = highpass(rng.standard_normal(n), 7000, 3) * env(n, 0.018)
        n = int(0.06 * SR)
        self.shaker = highpass(rng.standard_normal(n), 5000, 2) * env(n, 0.03) * np.minimum(1, np.arange(n) / SR / 0.012)
        n = int(0.3 * SR)
        burst = sum(np.roll(env(n, 0.006), int(k * 0.011 * SR)) for k in range(3)) + env(n, 0.12) * 0.6
        self.clap = highpass(lowpass(rng.standard_normal(n), 5000), 1000) * burst * 0.6
        n = int(0.05 * SR)
        self.rim = highpass(rng.standard_normal(n), 2500) * env(n, 0.006) + np.sin(2 * np.pi * 1700 * np.arange(n) / SR) * env(n, 0.01) * 0.5


def keys(freqs, dur, bright=1.4):
    """Rhodes-ish: FM bell attack over a soft sine body, gentle tremolo."""
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    for f in freqs:
        idx = bright * np.exp(-t / 0.25)
        out += np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t)) * env(n, 1.6)
    out *= 1 + 0.12 * np.sin(2 * np.pi * 4.5 * t)
    return out * ramp(n, 0.008, 0.08, dur) / len(freqs)


def bell(f, dur=1.2):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t + 2.2 * np.exp(-t / 0.08) * np.sin(2 * np.pi * 3.5 * f * t))
    return x * env(n, 0.45) * ramp(n, 0.002, 0.05, dur)


def marimba(f, dur=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 4 * f * t) * env(n, 0.03)
    return x * env(n, 0.18) * ramp(n, 0.002, 0.03, dur)


def pad(freqs, dur, attack=1.2, cutoff=1800):
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    for f in freqs:
        for d in (-0.12, 0.12):
            ph = (f * 2 ** (d / 12) * t) % 1
            out += 2 * ph - 1
    out = lowpass(out / (2 * len(freqs)), cutoff)
    return out * ramp(n, attack, 0.6, dur)


def bass(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    return np.tanh(1.3 * x) * env(n, 0.6) * ramp(n, 0.005, 0.04, dur)


def whoosh(rng, dur, rise=True):
    """Filtered-noise sweep: dark to bright (rise) or bright to dark."""
    n = int(dur * SR); t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    lo, hi = lowpass(noise, 600), highpass(lowpass(noise, 9000), 2500)
    w = t / dur if rise else 1 - t / dur
    shape = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return (lo * (1 - w) + hi * w) * shape * 0.8


def thud(rng):
    n = int(0.5 * SR); t = np.arange(n) / SR
    freq = 38 + 50 * np.exp(-t / 0.03)
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * env(n, 0.18)
    knock = lowpass(rng.standard_normal(n), 900) * env(n, 0.012) * 0.7
    return np.tanh(2 * (body + knock))


def pop(f):
    n = int(0.16 * SR); t = np.arange(n) / SR
    freq = f * (1 + 0.6 * np.exp(-t / 0.012))
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * env(n, 0.05) * ramp(n, 0.001, 0.02, 0.16)


def tick(rng):
    n = int(0.03 * SR)
    return highpass(rng.standard_normal(n), 4000, 3) * env(n, 0.003) + np.sin(2 * np.pi * 3200 * np.arange(n) / SR) * env(n, 0.004) * 0.6


def riser(rng, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    sweep = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2.5 * t / dur)) / SR) * 0.25
    noise = highpass(rng.standard_normal(n), 3000) * 0.5
    return (sweep + noise) * (t / dur) ** 2.2


def impact(rng, kit):
    n = int(1.6 * SR)
    tail = highpass(lowpass(rng.standard_normal(n), 8000), 2000) * env(n, 0.5) * 0.35
    out = tail.copy()
    out[: len(kit.kick)] += kit.kick * 1.2
    return out


def place(track, sound, at, gain=1.0):
    i = int(round(at * SR))
    if i >= len(track) or i + len(sound) <= 0:
        return
    s0 = max(0, -i); i = max(0, i)
    end = min(len(track), i + len(sound) - s0)
    track[i:end] += gain * sound[s0: s0 + end - i]


PROGS = {
    'morning': [([55, 58, 62, 65], 39), ([55, 58, 62, 63], 36), ([55, 60, 63, 67], 44), ([56, 60, 62, 67], 46)],   # Ebmaj9 Cm9 Abmaj9 Bb13
    'corner': [([57, 61, 64, 66], 38), ([57, 61, 62, 66], 35), ([54, 57, 59, 62], 43), ([55, 59, 62, 66], 45)],    # Dmaj9 Bm9 Gmaj9 A13sus
    'shutter': [([58, 62, 65, 69], 43), ([58, 62, 63, 67], 39), ([55, 58, 62, 63], 36), ([54, 60, 65, 66], 38)],   # Gm9 Ebmaj9 Cm9 D7#9
    'window': [([57, 60, 64, 65], 41), ([57, 60, 62, 65], 38), ([57, 58, 62, 65], 46), ([55, 58, 60, 64], 48)],    # Fmaj7 Dm7 Bbmaj7 C7
    'ring': [([56, 60, 62, 63, 67], 44), ([55, 56, 60, 63], 41), ([53, 56, 60, 63], 37)],                          # Abmaj7#11 Fm9 Dbmaj9
    'counter': [([52, 56, 59, 63], 40), ([54, 57, 61, 64], 42), ([52, 57, 59, 61], 45), ([51, 54, 59, 61], 47)],   # Emaj7 F#m7 A6 B9sus-ish
}

# Each reel: tempo, progression, lead instrument, drum groove and when it starts, and the on-screen moments.
REELS = {
    'reel-day': dict(sec=12, bpm=100, prog='window', lead='marimba', groove='four', start=0, sweep=True,
        fx=[('bell', 10.6, .4, 77)], ticks=True,
        what='A clock-tick groove in F, 100 BPM: marimba and a ticking hi-hat while the clock runs 07:00 to 22:00. The tone starts soft, opens up around midday and mellows toward the evening, ending on one soft chime.'),
    'reel-reveal': dict(sec=8, bpm=84, prog='morning', lead='pad', groove='lofi', start=4.2,
        fx=[('riser', 1.2, .5, 3.0), ('bell', 4.2, .45, 75), ('bell', 4.45, .3, 82)],
        what='Opens on a slow pad while the cup turns into the light, a riser into the reveal, two bells on "A taste of heaven", then a gentle beat underneath.'),
    'reel-flyover': dict(sec=8, bpm=96, prog='ring', lead='pad', groove='lofi', start=5.1,
        fx=[('riser', .8, .55, 4.3), ('impact', 5.1, .5)],
        what='Rising sweep while the camera flies down from the lid to the logo, a soft impact as "Ρόδου 68" appears, then a short beat.'),
    'reel-delivery': dict(sec=8, bpm=96, prog='counter', lead='keys', groove='lofi', start=1.7,
        fx=[('whoosh', 0, .55, 1.5), ('rim', 1.7, .5)] + [('pop', 2.8 + i * .35, .55, 76 + 3 * i) for i in range(3)],
        what='A whoosh as the cup slides in, the beat starts with the headline, and three rising pops as e-food, Wolt and Box pop up.'),
}


def build(rid, spec):
    seed = sum(map(ord, rid))
    kit = Kit(seed, heavy=spec.get('heavy', 1.0))
    rng = kit.rng
    sec, bpm = spec['sec'], spec['bpm']
    n = int(sec * SR)
    step = 60 / bpm / 4
    swing = 0.14 if spec['groove'] in ('lofi', 'boombap') else 0.0
    bar = 16 * step
    origin = spec['start'] - np.ceil(spec['start'] / bar) * bar  # a downbeat lands exactly on 'start'
    st = lambda b, s: origin + (b * 16 + s + (swing if s % 2 else 0)) * step
    drums, music, low, fxt = (np.zeros(n) for _ in range(4))
    prog = PROGS[spec['prog']]
    bars = int(np.ceil(sec / bar)) + 2
    lead = spec['lead']
    for b in range(bars):
        voicing, root = prog[b % len(prog)]
        fr = [hz(m) for m in voicing]
        t0 = st(b, 0)
        if lead == 'keys':
            place(music, keys(fr, 2.2 * 4 * step), t0)
            place(music, keys(fr, 1.5 * 4 * step), st(b, 7), .6)
        elif lead == 'pad':
            place(music, pad(fr, bar + .6, attack=min(1.2, bar / 2)), t0, 1.3)
        elif lead == 'marimba':
            arp = sorted(voicing) + [sorted(voicing)[1] + 12]
            for k, s in enumerate((0, 3, 6, 8, 10, 13, 14)):
                place(music, marimba(hz(arp[k % len(arp)] + 12)), st(b, s), .55)
            place(music, pad(fr, bar, attack=.3, cutoff=1200), t0, .35)
        elif lead == 'bell':
            arp = sorted(voicing)
            for k in range(8):
                place(music, bell(hz(arp[(k * 3) % len(arp)] + 12), 1.4), t0 + k * bar / 8, .32)
            place(music, pad(fr, bar + .6, attack=.8), t0, .9)
        g = spec['groove']
        on = lambda s: st(b, s) >= spec['start'] - 1e-6
        if g != 'none':
            ks = {'lofi': ((0, 1.0), (10, .8)), 'boombap': ((0, 1.0), (7, .7), (10, .9)), 'four': ((0, .8), (4, .6), (8, .8), (12, .6))}[g]
            for s, gn in ks:
                if on(s):
                    place(drums, kit.kick, st(b, s), gn)
                    place(low, bass(hz(root), 5 * step), st(b, s), gn)
            for s in (4, 12):
                if on(s):
                    place(drums, kit.clap if g == 'four' else kit.snare, st(b, s), .8 if g != 'four' else .55)
            for s in range(0, 16, 2):
                if on(s):
                    place(drums, kit.hat, st(b, s), .28 + .12 * rng.random())
            if spec.get('shaker'):
                for s in range(16):
                    if on(s):
                        place(drums, kit.shaker, st(b, s), .18 if s % 2 else .3)
        elif lead != 'bell':
            place(low, bass(hz(root), bar * .9), t0, .35)
        if spec.get('ticks'):
            for k in range(4):
                place(fxt, tick(rng), t0 + k * 4 * step, .35)

    for e in spec['fx']:
        kind, t, gain = e[0], e[1], e[2]
        if kind == 'rim': snd = kit.rim
        elif kind == 'clap': snd = kit.clap
        elif kind == 'bell': snd = bell(hz(e[3]), 1.8)
        elif kind == 'pop': snd = pop(hz(e[3]))
        elif kind == 'thud': snd = thud(rng)
        elif kind == 'impact': snd = impact(rng, kit)
        elif kind == 'riser': snd = riser(rng, e[3]) * 1.8
        elif kind == 'whoosh': snd = whoosh(rng, e[3], rise=(len(e) < 5 or e[4] != 'down')) * 1.8
        place(fxt, snd, t, gain)

    if spec.get('sweep'):  # brightness follows the day: open in the middle, closed at the ends
        music = np.concatenate([lowpass(music[i:i + SR // 4], 900 + 3200 * np.sin(np.pi * min(1, i / n))) for i in range(0, n, SR // 4)])[:n]

    ir_n = int(0.9 * SR)
    ir = lowpass(rng.standard_normal(ir_n), 4000) * env(ir_n, 0.25)
    m = n + ir_n
    verb = np.fft.irfft(np.fft.rfft(music + 0.4 * drums + 0.3 * fxt, m) * np.fft.rfft(ir, m), m)[:n]
    verb /= np.abs(verb).max() + 1e-9
    crackle = np.zeros(n)
    if spec.get('crackle'):
        pops = rng.choice(n, int(sec * 7), replace=False)
        crackle[pops] = rng.uniform(-1, 1, len(pops))
        crackle = highpass(crackle, 1500) * .5 + lowpass(rng.standard_normal(n), 1200) * .01

    mix = .5 * drums + .4 * lowpass(music, 3000) + .07 * verb + .33 * low + .5 * fxt + .06 * crackle
    mix = np.tanh(1.15 * lowpass(mix, 10000))
    t = np.arange(n) / SR
    if spec.get('loop'):  # the reel loops: no fade-out, just de-click both ends
        mix *= np.minimum(1, t / .005) * np.minimum(1, (sec - t) / .005)
    else:
        mix *= np.minimum(1, (sec - t) / 1.0) * np.minimum(1, t / .01)
    return mix * (.89 / np.abs(mix).max())


# ─── Round 2 (2026-10-29): melodic transitions instead of noise sweeps, the owner rejected the whooshes. ──
def pluck(f, dur=1.2):
    """Nylon-ish pluck: additive harmonics, the higher ones dying faster."""
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, 13):
        if f * k > 14000: break
        out += abs(np.sin(np.pi * k * 0.18)) / k * np.sin(2 * np.pi * f * k * t) * env(n, 1.1 / (1 + 0.7 * (k - 1)))
    return out * ramp(n, 0.002, 0.05, dur)


def piano(f, dur=1.6):
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, 9):
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)
        if fk > 14000: break
        out += np.sin(2 * np.pi * fk * t) * env(n, 1.6 / k ** 0.7) / k ** 1.2
    return out * ramp(n, 0.003, 0.08, dur)


def vibes(f, dur=1.6):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 4 * f * t) * env(n, 0.06)
    return x * env(n, 0.9) * (1 + 0.25 * np.sin(2 * np.pi * 5.5 * t)) * ramp(n, 0.002, 0.08, dur)


def organ(freqs, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    out = sum(np.sin(2 * np.pi * f * t) + .5 * np.sin(4 * np.pi * f * t) + .3 * np.sin(6 * np.pi * f * t) for f in freqs)
    return out / len(freqs) * (1 + .08 * np.sin(2 * np.pi * 6 * t)) * ramp(n, .08, .15, dur) * .5


def knock(f):
    """Woody tom: a pitched hit with a short drop, no noise."""
    n = int(0.35 * SR); t = np.arange(n) / SR
    freq = f * (1 + 0.5 * np.exp(-t / 0.02))
    x = np.sin(2 * np.pi * np.cumsum(freq) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(2.7 * freq) / SR) * env(n, 0.02)
    return np.tanh(1.5 * x * env(n, 0.12))


def boom():
    n = int(0.9 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(40 + 25 * np.exp(-t / 0.05)) / SR) * env(n, 0.45) * ramp(n, 0.003, 0.1, 0.9)


INST = {'pluck': pluck, 'piano': piano, 'vibes': vibes, 'marimba': marimba, 'bell': bell}
PROGS.update({
    'acoustic': [([55, 59, 62, 67], 43), ([55, 59, 62, 64], 40), ([55, 60, 62, 64], 36), ([57, 62, 64, 66], 38)],   # G Em7 Cadd9 D6
    'bossa': [([55, 60, 64, 67], 45), ([54, 57, 60, 64], 38), ([54, 57, 59, 62], 43), ([55, 59, 62, 64], 36)],      # Am7 D9 Gmaj7 Cmaj9
    'dpop': [([57, 62, 66], 38), ([59, 62, 66], 35), ([59, 62, 67], 43), ([57, 61, 64], 45)],                      # D Bm G A
    'pizz': [([58, 62, 65], 46), ([58, 62, 67], 43), ([58, 63, 67], 39), ([57, 60, 65], 41)],                      # Bb Gm Eb F
    'turn': [([57, 61, 64], 45), ([56, 59, 64], 40), ([57, 61, 66], 42), ([57, 62, 66], 38)],                      # A E F#m D
    'soul': [([55, 59, 60, 64], 45), ([57, 60, 64, 65], 41), ([55, 59, 60, 64], 36), ([55, 59, 62, 64], 43)],      # Am9 Fmaj9 Cmaj7 G6
    'bright': [([55, 60, 64], 36), ([55, 59, 62], 43), ([57, 60, 64], 45), ([57, 60, 65], 41)],                    # C G Am F
    'loop3': [([57, 60, 64, 67], 41), ([55, 57, 60, 64], 45), ([57, 58, 62, 65], 46)],                             # Fmaj9 Am7 Bbmaj9
    'trio': [([55, 59, 62, 66], 40), ([55, 59, 61, 66], 45), ([54, 57, 61, 64], 38), ([51, 54, 57, 60], 47)],         # Em9 A13 Dmaj9 B7b9
    'sunrise': [([57, 61, 62, 66], 38), ([55, 59, 62, 66], 40), ([57, 61, 64, 66], 42), ([57, 59, 62, 66], 43)],   # Dmaj7 Em9 F#m7 Gmaj7
})
GROOVES = {  # (kicks, snare-or-rim steps and which, hats every n steps, shaker)
    'soft': dict(kick=((0, .8), (8, .6)), back=((4, 'rim', .5), (12, 'rim', .5)), hat=2, shaker=True),
    'bossa': dict(kick=((0, .7), (8, .55)), back=((0, 'rim', .4), (3, 'rim', .45), (6, 'rim', .45), (10, 'rim', .45), (13, 'rim', .45)), hat=0, shaker=True),
    'pop': dict(kick=((0, .9), (7, .5), (8, .8)), back=((4, 'clap', .6), (12, 'clap', .6)), hat=2, shaker=False),
    'soul': dict(kick=((0, 1.0), (10, .7)), back=((4, 'snare', .7), (12, 'snare', .7)), hat=2, shaker=False),
    'brush': dict(kick=((0, .5),), back=(), hat=0, shaker=True),
    'none': dict(kick=(), back=(), hat=0, shaker=False),
}

REDO = {
    'reel-bean-to-cup': dict(gain_db=-0.6, sec=12, bpm=92, prog='acoustic', groove='soft', chords='pluck', arp=('pluck', .35),
        cues=[('note', t, .5, 'vibes', m) for t, m in ((2, 67), (4, 69), (6, 71), (8, 72))] + [('run', 10.1, .45, 'vibes', (74, 79, 83), .09)],
        what='Acoustic morning in G, 92 BPM: plucked guitar, soft brushed drums and bass. Each new step (grind, espresso, crema, milk) adds a vibraphone note one step higher, like the cup being built, and "your cup" gets a three-note rise.'),
    'reel-shop': dict(sec=10, bpm=128, prog='bossa', groove='bossa', chords='pluck', arp=None,
        cues=[('note', t, .45, 'vibes', m) for t, m in ((2.5, 69), (5, 71), (7.5, 74))],
        what='Easy bossa in A minor: nylon guitar chords, rim clicks and shaker, like a neighbourhood café on a slow afternoon. A soft vibraphone note on each change of shot.'),
    'reel-team': dict(gain_db=0, sec=10, bpm=112, prog='trio', groove='soft', swing=.3, chords='vibes', arp=None, walk=True,
        cues=[('run', t - .2, .45, 'vibes', r, .14) for t, r in ((2.5, (78, 74)), (5, (81, 78)), (7.5, (83, 79)))],
        what='Jazzy café trio in D, 112 BPM swing: walking upright bass, brushed drums and vibraphone chords, like a busy morning behind the counter. A two-note vibraphone figure on each change of shot.'),
    'reel-vitrine': dict(gain_db=-0.8, sec=10, bpm=112, prog='pizz', groove='pop', chords='pluck', arp=('marimba', .45),
        cues=[('run', t, .4, 'bell', (m, m + 7), .1) for t, m in ((2, 70), (4, 72), (6, 74), (8, 75))],
        what='Bouncy, playful groove in B flat, 112 BPM: plucked guitar, marimba and claps. A two-note bell "ding" on each new pastry, a step higher each time.'),
    'reel-panels': dict(gain_db=-1.4, sec=12, bpm=120, prog='turn', groove='pop', chords='pluck', arp=('pluck', .3), loop=True,
        cues=[('run', t + .95, .35, 'pluck', (64, 66, 68), .15) for t in (2.4, 6.4)] + [('note', t, .45, 'vibes', 76) for t in (0.0, 4.0, 8.0)],
        what='Upbeat guitar pop loop in A, 120 BPM, that repeats seamlessly. A short guitar pickup as the cup turns and a vibraphone note as each side (logo, slogan, Mrs Rose) lands.'),
    'reel-faith': dict(gain_db=-1.4, sec=7, bpm=76, prog='soul', groove='soul', chords='organ', arp=('piano', .3),
        cues=[('chord', 1.2, .5, 'piano', (57, 60, 64, 67)), ('boom', 1.2, .55)],
        what='Slow soul in A minor, 76 BPM: warm organ, piano and a laid-back beat. A full piano chord with a deep low note when "Faith over fear" lands.'),
    'reel-drop': dict(gain_db=-0.8, sec=6, bpm=100, prog='bright', groove='pop', chords='piano', arp=None, start=2.0,
        cues=[('run', .05, .4, 'marimba', (84, 81, 79, 76, 72, 69), .11), ('knock', .71, .9, 110), ('knock', 1.22, .4, 130), ('knock', 1.47, .15, 150)],
        what='A falling marimba line as the cup drops, a woody knock on each bounce (big, smaller, tiny), then bright piano pop in C, 100 BPM, with "Ο καφές σου. Έτοιμος."'),
    'reel-slogan': dict(sec=10, bpm=72, prog='loop3', groove='brush', chords='pluck', arp=('pluck', .4), loop=True,
        cues=[],
        what='Calm, warm guitar loop in F, 72 BPM: picked guitar over soft shaker, no drums to speak of, repeating seamlessly while the slogan ring turns.'),
    'reel-hours': dict(gain_db=-1.9, sec=10, bpm=84, prog='sunrise', groove='none', chords='organ', arp=None,
        climb=('vibes', .4), cues=[('note', 7.6, .45, 'bell', 81)],
        what='A gentle vibraphone melody in D that climbs as the sun rises and comes back down as it sets, over a soft organ and bass, no drums. A chime when "07:00 to 22:00" appears.'),
}


def build2(rid, spec):
    kit = Kit(sum(map(ord, rid)) + 99)
    rng = kit.rng
    sec, bpm = spec['sec'], spec['bpm']
    n = int(sec * SR)
    step = 60 / bpm / 4
    bar = 16 * step
    start = spec.get('start', 0)
    origin = start - np.ceil(start / bar) * bar
    swing = spec.get('swing', .1 if spec['groove'] in ('soft', 'soul', 'brush') else 0.0)
    st = lambda b, s: origin + (b * 16 + s + (swing if s % 2 else 0)) * step
    drums, music, low, cues = (np.zeros(n) for _ in range(4))
    prog = PROGS[spec['prog']]
    g = GROOVES[spec['groove']]
    for b in range(int(np.ceil(sec / bar)) + 2):
        voicing, root = prog[b % len(prog)]
        fr = [hz(m) for m in voicing]
        t0 = st(b, 0)
        if spec['chords'] == 'pluck':  # strummed: a few ms between strings
            for hit, gn in ((0, .5), (6, .3), (10, .35)):
                for k, f in enumerate(fr): place(music, pluck(f, 1.4), st(b, hit) + k * .012, gn / len(fr) * 2)
        elif spec['chords'] == 'piano':
            for hit, gn in ((0, .6), (7, .4)):
                for f in fr: place(music, piano(f, 1.4), st(b, hit), gn / len(fr) * 2)
        elif spec['chords'] == 'organ':
            place(music, organ(fr, bar + .1), t0, .55)
        elif spec['chords'] == 'vibes':  # jazz comping: on one and the Charleston push
            for hit, gn in ((0, .5), (6, .35)):
                for f in fr: place(music, vibes(f, 1.2), st(b, hit), gn / len(fr) * 2)
        if spec.get('walk'):  # walking bass: root, third, fifth, then a half step into the next root
            nxt = prog[(b + 1) % len(prog)][1]
            for k, nm in enumerate((root, root + 4, root + 7, nxt + (1 if nxt < root + 7 else -1))):
                place(low, bass(hz(nm), 4 * step), st(b, 4 * k), .5)
        if spec.get('arp'):
            inst, gn = spec['arp']
            notes = sorted(voicing) + [sorted(voicing)[1] + 12]
            for k, s in enumerate(range(0, 16, 2)):
                place(music, INST[inst](hz(notes[(k * (2 if inst == 'piano' else 1)) % len(notes)] + 12), .9), st(b, s), gn)
        if spec.get('hook'):
            inst, gn = spec['hook']
            top = sorted(voicing)[-1] + 12
            for s, d in ((2, 0), (3, 2), (6, 4), (14, 2)):
                place(music, INST[inst](hz(top + d), .8), st(b, s), gn)
        on = lambda s: st(b, s) >= start - 1e-6
        for s, gn in g['kick']:
            if on(s):
                place(drums, kit.kick, st(b, s), gn)
                if not spec.get('walk'):
                    place(low, bass(hz(root + (7 if s == 8 and spec['groove'] == 'bossa' else 0)), 5 * step), st(b, s), gn)
        for s, kind, gn in g['back']:
            if on(s): place(drums, getattr(kit, kind), st(b, s), gn)
        if g['hat']:
            for s in range(0, 16, g['hat']):
                if on(s): place(drums, kit.hat, st(b, s), .22 + .1 * rng.random())
        if g['shaker']:
            for s in range(16):
                if on(s): place(drums, kit.shaker, st(b, s), .14 if s % 2 else .24)
        if not g['kick']:
            place(low, bass(hz(root), bar * .9), t0, .35)
    if spec.get('climb'):  # a melody that rises with the sun and comes back down
        inst, gn = spec['climb']
        scale = [62, 64, 66, 69, 71, 74, 76, 78, 81]
        beats = int(sec / (4 * step))
        for k in range(beats):
            t = k * 4 * step
            idx = int(round((len(scale) - 1) * np.sin(np.pi * t / sec)))
            place(music, INST[inst](hz(scale[idx]), 1.4), t, gn)
    for c in spec['cues']:
        kind, t, gn = c[:3]
        if kind == 'note': place(cues, INST[c[3]](hz(c[4]), 1.6), t, gn)
        elif kind == 'run':
            for k, m in enumerate(c[4]): place(cues, INST[c[3]](hz(m), 1.2), t + k * c[5], gn)
        elif kind == 'chord':
            for m in c[4]: place(cues, INST[c[3]](hz(m), 2.0), t, gn / 2)
        elif kind == 'boom': place(cues, boom(), t, gn)
        elif kind == 'knock': place(cues, knock(c[3]), t, gn)

    ir_n = int(0.9 * SR)
    ir = lowpass(rng.standard_normal(ir_n), 4000) * env(ir_n, 0.25)
    m = n + ir_n
    verb = np.fft.irfft(np.fft.rfft(music + 0.3 * drums + 0.5 * cues, m) * np.fft.rfft(ir, m), m)[:n]
    verb /= np.abs(verb).max() + 1e-9
    mix = .45 * drums + .45 * lowpass(music, 6000) + .08 * verb + .33 * low + .5 * cues
    mix = np.tanh(1.1 * lowpass(mix, 11000))
    t = np.arange(n) / SR
    if spec.get('loop'):
        mix *= np.minimum(1, t / .005) * np.minimum(1, (sec - t) / .005)
    else:
        mix *= np.minimum(1, (sec - t) / 1.0) * np.minimum(1, t / .01)
    return mix * (.89 / np.abs(mix).max()) * 10 ** (spec.get('gain_db', 0) / 20)  # level-matched to the approved four


def main(out, ids):
    for rid in ids or [*REELS, *REDO]:
        mix = build2(rid, REDO[rid]) if rid in REDO else build(rid, REELS[rid])
        with wave.open(f'{out}/{rid}.wav', 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((mix * 32767).astype('<i2').tobytes())
        print(rid, f'{len(mix) / SR:.1f}s')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2:])

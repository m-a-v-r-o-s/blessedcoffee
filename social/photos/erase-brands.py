"""Erase Mrs Rose / Goppion branding from library photos (partnerships ended Nov 2026).

Content-aware fill without ML: each region is filled with a smooth membrane (Laplace) from
the pixels around it, then given back grain sampled from its surroundings. Where a region
straddles an edge (a cup against the background), the edge line is fitted from the clean rows
above and below and each side is filled only from its own side, so the silhouette stays crisp.

Run from repo root: python3 social/photos/erase-brands.py [name ...]
Always starts from the file's pre-edit original in git (ORIG), so it can be re-run.
Regions are (polygon [(x, y), ...], edge) in original pixels; edge 'v' = fit a near-vertical
silhouette through the region, None = one surface.
"""
import io
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent
ORIG = '67496ca^'  # last commit before any brand edit
FEATHER = 8
OUTLIER = 45  # luminance distance from a surface's median that counts as foreign

def shape(cx, cy, rx, ry, ang=0, p=2, grow=1.15):
    """Superellipse outline (p=2 ellipse, 4+ rounded rect), rotated ang degrees, scaled by grow."""
    t = np.linspace(0, 2 * np.pi, 72, endpoint=False)
    c, s = np.cos(t), np.sin(t)
    x = rx * grow * np.sign(c) * np.abs(c) ** (2 / p)
    y = ry * grow * np.sign(s) * np.abs(s) ** (2 / p)
    a = np.radians(ang)
    return [(cx + xi * np.cos(a) - yi * np.sin(a), cy + xi * np.sin(a) + yi * np.cos(a)) for xi, yi in zip(x, y)]


REGIONS = {
    # paper cups with the old Mrs Rose + Goppion side panel
    'shoot/cup-pair.jpg': [
        ([(150, 815), (280, 815), (280, 1140), (150, 1140)], 'v!'),
        ([(1060, 690), (1135, 680), (1235, 1000), (1150, 1000)], 'v!'),
    ],
}
# ponytail: membrane fill only holds up on plain surfaces and clean silhouettes; the other photos keep
# blur-brands.py's blur until a real inpainting model (LaMa) is available. Never list shutter-christ(-2),
# storefront-day/-glass/-leaves or grinder-fill here: they were cropped after, ORIG would undo the crop.


def original(rel):
    data = subprocess.run(['git', 'show', f'{ORIG}:social/photos/{rel}'], capture_output=True, check=True).stdout
    return Image.open(io.BytesIO(data))


def membrane(img, unknown, domain, iters=60):
    """Fill img[unknown] smoothly from img[domain & ~unknown]; only domain pixels count as neighbours."""
    h, w = unknown.shape
    if min(h, w) > 16:
        # Coarse solve first (weighted 2x downsample), upsample as the starting guess.
        H, W = h // 2 * 2, w // 2 * 2
        wk = (domain & ~unknown)[:H, :W].astype(float)
        cw = wk.reshape(H // 2, 2, W // 2, 2).sum((1, 3))
        cv = (img[:H, :W] * wk[..., None]).reshape(H // 2, 2, W // 2, 2, 3).sum((1, 3))
        cimg = cv / np.maximum(cw, 1e-6)[..., None]
        cdom = domain[:H, :W].reshape(H // 2, 2, W // 2, 2).any((1, 3))
        cunk = cdom & (cw == 0)
        coarse = membrane(cimg, cunk, cdom, iters)
        up = np.repeat(np.repeat(coarse, 2, 0), 2, 1)
        guess = img.copy()
        guess[:H, :W][unknown[:H, :W]] = up[unknown[:H, :W]]
        img = guess
    img = img.copy()
    d = domain.astype(float)
    for _ in range(iters):
        acc = np.zeros_like(img)
        wt = np.zeros(unknown.shape)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            acc += np.roll(img * d[..., None], (dy, dx), (0, 1))
            wt += np.roll(d, (dy, dx), (0, 1))
        new = acc / np.maximum(wt, 1e-6)[..., None]
        img[unknown] = new[unknown]
    return img


def erase(im, regions, seed=0):
    rng = np.random.default_rng(seed)
    a = np.asarray(im.convert('RGB')).astype(float)
    H, W, _ = a.shape
    for poly, edge in regions:
        m = Image.new('L', (W, H), 0)
        ImageDraw.Draw(m).polygon(poly, fill=255)
        mask = np.asarray(m) > 0
        ys, xs = np.nonzero(mask)
        pad = 40
        y0, y1, x0, x1 = max(ys.min() - pad, 0), min(ys.max() + pad, H), max(xs.min() - pad, 0), min(xs.max() + pad, W)
        win, wm = a[y0:y1, x0:x1], mask[y0:y1, x0:x1]
        lum = win.mean(2)
        sides = [np.ones_like(wm)]
        if edge in ('v', 'v!'):
            # Silhouette: in each clean row, the strongest left-right luminance step. Fit x = a*y + b.
            pts = []
            g = np.abs(np.diff(lum, axis=1))
            for r in range(win.shape[0]):
                if wm[r].any():
                    continue
                c = int(np.argmax(g[r]))
                if g[r, c] > 40:
                    pts.append((r, c + 0.5))
            if len(pts) >= 10:
                pts = np.array(pts)
                k, b = np.polyfit(pts[:, 0], pts[:, 1], 1)
                resid = np.abs(pts[:, 1] - (k * pts[:, 0] + b))
                if np.median(resid) < 3 or edge == 'v!':  # a real silhouette, not scattered print lines (v! = trust it)
                    xx = np.arange(win.shape[1])[None, :]
                    line = k * np.arange(win.shape[0])[:, None] + b
                    sides = [xx < line, xx >= line]
                else:
                    print(f'  no clean edge near {poly[0]}, filling as one surface')
        # Fill a band FEATHER px wider than the region and fade it out over that band, so print and
        # texture run softly into the fill instead of stopping at a cut line.
        grow = np.asarray(Image.fromarray((wm * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * FEATHER + 1))) > 0
        ramp = np.asarray(Image.fromarray((wm * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(FEATHER / 2))).astype(float) / 255
        alpha = np.maximum(np.clip(ramp * 2, 0, 1), wm)[..., None]
        blur = np.stack([np.asarray(Image.fromarray(win[..., c].astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))).astype(float) for c in range(3)], 2)
        hp = (win - blur).mean(2)
        out = win.copy()
        for side in sides:
            unk = grow & side
            if not unk.any():
                continue
            # Boundary pixels that don't belong to this surface (a badge poking over the edge, a dark
            # print line) would bleed into the fill: leave them out of the domain.
            ref = np.median(lum[side & ~grow])
            dom = side & ((np.abs(lum - ref) < OUTLIER) | unk)
            filled = membrane(win, unk, dom)
            # Grain: gaussian, strength matched to the clean pixels on this side (robust, ignores print lines).
            std = 1.4826 * np.median(np.abs(hp[side & ~grow]))
            out[unk] = filled[unk] + rng.normal(0, std, unk.sum())[:, None]
        a[y0:y1, x0:x1] = out * alpha + win * (1 - alpha)
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))


if __name__ == '__main__':
    names = sys.argv[1:] or list(REGIONS)
    for rel in names:
        src = original(rel)
        res = erase(src, REGIONS[rel])
        path = ROOT / rel
        kw = {'quality': 92, 'subsampling': 0} if path.suffix == '.jpg' else {}
        for key in ('exif', 'icc_profile'):
            if src.info.get(key):
                kw[key] = src.info[key]
        res.save(path, **kw)
        print('erased', rel)

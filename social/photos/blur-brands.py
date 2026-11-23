"""Blur Mrs Rose / Goppion branding out of library photos (partnerships ended Nov 2026).

Run from repo root: python3 social/photos/blur-brands.py [name ...]
Edits files in place, so run each file once against its git original
(git checkout the file first to redo it). Regions are in original pixels:
(cx, cy, rx, ry, angle_deg, p), p=2 ellipse, p=4 rounded rect.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, JpegImagePlugin

ROOT = Path(__file__).resolve().parent

REGIONS = {
    # paper cups with the old Mrs Rose + Goppion side panel
    'shoot/apron-cup.jpg': [(272, 1205, 48, 82, 0, 2), (248, 1395, 52, 92, 0, 2)],
    'shoot/cup-pair.jpg': [(228, 903, 32, 72, 0, 2), (245, 1068, 36, 72, 0, 2),
                           (1100, 767, 60, 18, 69, 2), (1170, 950, 45, 20, 60, 2)],
    'shoot/staff-cup.jpg': [(535, 715, 45, 45, 0, 2), (558, 850, 52, 52, 0, 2), (680, 1290, 18, 85, 0, 2)],
    'shoot/staff-machine.jpg': [(30, 252, 38, 62, 0, 2), (309, 1067, 32, 36, 0, 2), (318, 1133, 34, 32, 0, 2)],
    'shoot/snack-cup.jpg': [(395, 1320, 115, 30, 129, 2)],
    # edge slivers of the side panel
    'shoot/cappuccino-foam.jpg': [(965, 910, 22, 62, 0, 2), (934, 1192, 14, 16, 0, 2)],
    'shoot/cup-black.jpg': [(413, 935, 14, 45, 0, 2), (455, 1253, 13, 55, 0, 2)],
    'shoot/cup-counter-2.jpg': [(396, 876, 12, 34, 0, 2), (427, 1163, 10, 18, 0, 2)],
    'shoot/cup-counter.jpg': [(456, 1135, 10, 24, 0, 2)],
    'shoot/espresso-logo-cup.jpg': [(966, 944, 12, 42, 0, 2), (941, 1207, 10, 14, 0, 2)],
    # Goppion Dolce bags and poster
    'shoot/dolce-bags.jpg': [(675, 837, 90, 95, 0, 4), (1200, 797, 78, 95, 0, 4), (688, 1045, 170, 55, 0, 4),
                             (1175, 1040, 95, 55, 0, 4), (982, 1105, 30, 270, 0, 4)],
    'shoot/dolce-hand.jpg': [(627, 890, 70, 80, 0, 4), (1128, 860, 75, 85, 0, 4), (638, 1070, 135, 48, 0, 4),
                             (1095, 1050, 105, 48, 0, 4), (905, 975, 48, 150, 0, 4)],
    'shoot/grinder-fill.jpg': [(360, 445, 88, 88, -20, 4), (196, 489, 60, 132, 0, 2),
                               (378, 693, 22, 25, 0, 2), (50, 745, 50, 40, 0, 2)],
    'shoot/grinder-pour.jpg': [(377, 515, 125, 125, 21, 6), (168, 445, 200, 55, 110, 2),
                               (222, 815, 28, 40, 0, 2), (118, 750, 30, 55, 0, 2), (455, 228, 20, 25, 0, 2)],
    'shoot/shutter-faith.jpg': [(95, 1880, 60, 85, 0, 4)],
    'shoot/shutter-faith-wide.jpg': [(318, 1408, 38, 32, 0, 2)],
    # Mrs Rose blade sign, wall plaque, tins
    'shoot/corner-wide.jpg': [(1215, 745, 52, 62, 0, 4), (1132, 935, 24, 12, 0, 2)],
    'shoot/shutter-christ.jpg': [(1918, 836, 47, 105, 0, 2)],
    'shoot/shutter-christ-2.jpg': [(1815, 833, 45, 100, 0, 2)],
    'shoot/storefront-day.jpg': [(1897, 843, 36, 105, 0, 4)],
    'shoot/storefront-glass.jpg': [(1789, 695, 16, 108, 0, 2)],
    'shoot/storefront-leaves.jpg': [(1780, 690, 40, 38, 0, 2)],
    'shoot/interior.jpg': [(1104, 540, 60, 66, 0, 4)],
    'shoot/interior-wide.jpg': [(1354, 399, 50, 52, 0, 4)],
    'shoot/staff-wide.jpg': [(1249, 105, 92, 120, 0, 4), (1360, 85, 75, 100, 0, 4)],
    'shoot/vitrine-window.jpg': [(500, 45, 240, 85, 0, 2)],
    # older phone screenshots
    'Screenshot_2026-09-20_21-34-43.png': [(407, 505, 13, 36, 0, 2)],
    'Screenshot_2026-09-20_21-35-16.png': [(808, 495, 36, 50, 0, 2), (805, 600, 38, 52, 0, 2), (790, 645, 24, 13, 0, 2)],
    'Screenshot_2026-09-20_21-36-13.png': [(608, 515, 30, 44, 0, 2), (596, 612, 34, 44, 0, 2), (582, 650, 26, 14, 0, 2)],
    'Screenshot_2026-09-20_21-36-37.png': [(346, 149, 36, 30, 0, 2)],  # grinder screen logo
    'Screenshot_2026-09-20_21-36-56.png': [(387, 722, 60, 22, 8, 2)],  # flyer footer badge
    'Screenshot_2026-09-20_21-37-01.png': [(365, 735, 54, 19, 8, 2)],
    'Screenshot_2026-09-20_21-37-08.png': [(368, 731, 54, 19, 8, 2)],
}


def blur(path, regions):
    im = Image.open(path)
    W, H = im.size
    out = np.asarray(im).astype(np.float32)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    for cx, cy, rx, ry, ang, p in regions:
        sigma = float(np.clip(0.35 * min(rx, ry), 5, 30))
        pad = int(max(rx, ry) + 3 * sigma)
        box = (max(cx - pad, 0), max(cy - pad, 0), min(cx + pad, W), min(cy + pad, H))
        soft = np.asarray(im.crop(box).filter(ImageFilter.GaussianBlur(sigma))).astype(np.float32)
        x0, y0, x1, y1 = box
        a = np.radians(ang)
        dx, dy = xx[y0:y1, x0:x1] - cx, yy[y0:y1, x0:x1] - cy
        u = (dx * np.cos(a) + dy * np.sin(a)) / rx
        v = (-dx * np.sin(a) + dy * np.cos(a)) / ry
        d = (np.abs(u) ** p + np.abs(v) ** p) ** (1 / p)
        m = np.clip((1.2 - d) / 0.35, 0, 1)  # full blur inside d<0.85, feathered to 0 at d=1.2
        m = m * m * (3 - 2 * m)
        if out.ndim == 3:
            m = m[..., None]
        out[y0:y1, x0:x1] = out[y0:y1, x0:x1] * (1 - m) + soft * m
    res = Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8), im.mode)
    if path.suffix.lower() == '.png':
        res.save(path, optimize=True)
    else:
        kw = {'quality': 92, 'subsampling': JpegImagePlugin.get_sampling(im)}
        for k in ('exif', 'icc_profile'):
            if im.info.get(k):
                kw[k] = im.info[k]
        res.save(path, **kw)


if __name__ == '__main__':
    names = sys.argv[1:] or list(REGIONS)
    for n in names:
        blur(ROOT / n, REGIONS[n])
        print('blurred', n)

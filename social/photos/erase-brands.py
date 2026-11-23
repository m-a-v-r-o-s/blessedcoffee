"""Erase Mrs Rose / Goppion branding from library photos (partnerships ended Nov 2026).

LaMa inpainting ("smart eraser"): each brand mark is masked and redrawn from its surroundings.
Needs a venv with torch + simple-lama-inpainting (the big-lama model downloads on first run):
  python3 -m venv lama && lama/bin/pip install torch torchvision pillow numpy opencv-python-headless fire
  lama/bin/pip install --no-deps simple-lama-inpainting
Run from repo root: lama/bin/python social/photos/erase-brands.py [name ...]
Always starts from the file's pre-edit original in git (ORIG), so it can be re-run.

Regions are in original pixels, either (cx, cy, rx, ry, angle_deg, p) superellipses
(p=2 ellipse, p=4 rounded rect, grown by GROW) or [(x, y), ...] polygons drawn as given.
KEEP shapes are inpainted too (so their colour can't bleed into the fill) and then restored from
the original: the red/blue plastic badge on the cups stays.
"""
import io
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, JpegImagePlugin

ROOT = Path(__file__).resolve().parent
ORIG = '67496ca^'  # last commit before any brand edit
GROW = 1.2
# Cropped after the brand edit (ORIG would undo the crop) or unused: never erase these.
SKIP = {'shoot/shutter-christ.jpg', 'shoot/shutter-christ-2.jpg', 'shoot/storefront-day.jpg',
        'shoot/storefront-glass.jpg', 'shoot/storefront-leaves.jpg', 'shoot/grinder-fill.jpg',
        'shoot/grinder-pour.jpg'}

REGIONS = {
    # paper cups with the old Mrs Rose + Goppion side panel
    'shoot/apron-cup.jpg': [(272, 1205, 48, 82, 0, 2), (248, 1395, 52, 92, 0, 2)],
    'shoot/cup-pair.jpg': [(228, 903, 32, 72, 0, 2), (245, 1068, 36, 72, 0, 2),
                           (1100, 767, 60, 18, 69, 2), (1170, 950, 45, 20, 60, 2)],
    'shoot/staff-cup.jpg': [[(500, 690), (518, 672), (552, 674), (576, 698), (582, 728), (580, 758), (558, 756),
                             (542, 744), (522, 732), (506, 726), (498, 712)],  # logo above the finger only
                            (558, 850, 52, 52, 0, 2), (680, 1290, 18, 85, 0, 2)],
    'shoot/staff-machine.jpg': [
        # cup stack top left: print only, the dark blur in front stays
        [(0, 190), (62, 190), (62, 212), (50, 212), (50, 246), (64, 250), (64, 308), (40, 308), (36, 250),
         (22, 246), (20, 210), (0, 210)],
        [(282, 1035), (340, 1035), (340, 1095), (330, 1105), (330, 1142), (350, 1142), (350, 1163), (290, 1163),
         (292, 1142), (298, 1105), (282, 1095)]],
    'shoot/snack-cup.jpg': [[(430, 1210), (470, 1215), (395, 1310), (360, 1350), (334, 1376), (290, 1376),
                             (315, 1345), (350, 1300), (405, 1235)]],  # strip along the cup edge
    # edge slivers of the side panel
    'shoot/cappuccino-foam.jpg': [(965, 910, 22, 62, 0, 2), (934, 1205, 16, 30, 0, 2)],
    'shoot/cup-black.jpg': [(410, 930, 14, 62, -9.5, 4), (450, 1242, 13, 70, 0, 4)],
    'shoot/cup-counter-2.jpg': [(396, 876, 12, 34, 0, 2), (427, 1163, 10, 18, 0, 2)],
    'shoot/cup-counter.jpg': [(456, 1135, 10, 24, 0, 2)],
    'shoot/espresso-logo-cup.jpg': [(966, 944, 12, 42, 0, 2), (937, 1225, 13, 32, 0, 2)],
    # Goppion Dolce bags and poster
    'shoot/dolce-bags.jpg': [(675, 837, 90, 95, 0, 4), (1200, 797, 78, 95, 0, 4), (688, 1045, 170, 55, 0, 4),
                             (1175, 1040, 95, 55, 0, 4), (982, 1105, 30, 270, 0, 4),
                             (690, 1112, 140, 30, 0, 4), (1140, 1112, 105, 25, 0, 4)],  # taglines
    'shoot/dolce-hand.jpg': [(627, 890, 70, 80, 0, 4), (1128, 860, 75, 85, 0, 4), (638, 1070, 135, 48, 0, 4),
                             (1095, 1050, 105, 48, 0, 4), (645, 1122, 120, 32, 0, 4), (1140, 1095, 105, 30, 0, 4),
                             [(850, 800), (965, 800), (965, 1110), (915, 1110), (905, 1100), (850, 1095)]],  # stops above the fingertip
    'shoot/shutter-faith.jpg': [(95, 1880, 60, 85, 0, 4)],
    'shoot/shutter-faith-wide.jpg': [(350, 1407, 20, 21, 0, 2)],
    # Mrs Rose blade sign (mid-frame here, so inpainted, not cropped), wall plaque, tins
    'shoot/corner-wide.jpg': [[(1160, 686), (1300, 686), (1305, 815), (1160, 815)],  # sign plus its shadow
                            (1132, 935, 24, 12, 0, 2)],
    'shoot/interior.jpg': [(1104, 540, 60, 66, 0, 4)],
    'shoot/interior-wide.jpg': [(1354, 399, 50, 52, 0, 4)],
    'shoot/staff-wide.jpg': [(1249, 105, 92, 120, 0, 4), (1360, 85, 75, 100, 0, 4)],
    'shoot/vitrine-window.jpg': [(500, 45, 240, 85, 0, 2)],
    # older phone screenshots
    'Screenshot_2026-09-20_21-34-43.png': [(407, 505, 13, 36, 0, 2)],
    'Screenshot_2026-09-20_21-35-16.png': [[(770, 462), (812, 455), (832, 458), (830, 520), (826, 600), (820, 640),
                                            (760, 645), (762, 610), (785, 600), (786, 540), (775, 525), (770, 490)]],
    'Screenshot_2026-09-20_21-36-13.png': [[(570, 462), (632, 458), (628, 560), (620, 620), (612, 650), (556, 652),
                                            (556, 615), (578, 600), (580, 565), (568, 540)]],
    'Screenshot_2026-09-20_21-36-37.png': [(346, 149, 36, 30, 0, 2)],  # grinder screen logo
    'Screenshot_2026-09-20_21-36-56.png': [(387, 722, 60, 22, 8, 2)],  # flyer footer badge
    'Screenshot_2026-09-20_21-37-01.png': [(365, 735, 54, 19, 8, 2)],
    'Screenshot_2026-09-20_21-37-08.png': [(368, 731, 54, 19, 8, 2)],
}
KEEP = {  # red/blue plastic badge next to the old panel
    'shoot/staff-machine.jpg': [[(296, 1166), (347, 1166), (347, 1199), (296, 1199)]],
    'shoot/snack-cup.jpg': [[(270, 1376), (332, 1376), (330, 1430), (262, 1430)]],
    'Screenshot_2026-09-20_21-35-16.png': [[(756, 646), (824, 646), (822, 705), (756, 705)]],
    'Screenshot_2026-09-20_21-36-13.png': [[(552, 653), (606, 653), (604, 710), (552, 710)]],
}


def outline(r):
    if not isinstance(r, tuple):
        return r
    cx, cy, rx, ry, ang, p = r
    t = np.linspace(0, 2 * np.pi, 96, endpoint=False)
    c, s = np.cos(t), np.sin(t)
    x = rx * GROW * np.sign(c) * np.abs(c) ** (2 / p)
    y = ry * GROW * np.sign(s) * np.abs(s) ** (2 / p)
    a = np.radians(ang)
    return [(cx + xi * np.cos(a) - yi * np.sin(a), cy + xi * np.sin(a) + yi * np.cos(a)) for xi, yi in zip(x, y)]


def build_mask(size, regions):
    m = Image.new('L', size, 0)
    d = ImageDraw.Draw(m)
    for r in regions:
        d.polygon(outline(r), fill=255)
    return m


def erase(im, mask, lama):
    """Inpaint each mask cluster in its own window, padded for context and scaled to LaMa's sweet spot."""
    im = im.convert('RGB')
    W, H = im.size
    m = np.asarray(mask) > 0
    n, labels = cv2.connectedComponents(cv2.dilate(m.astype(np.uint8), np.ones((121, 121), np.uint8)))
    res = im.copy()
    for k in range(1, n):
        ys, xs = np.nonzero(m & (labels == k))
        pad = int(max(96, max(np.ptp(ys), np.ptp(xs)) * 1.25))
        box = (max(xs.min() - pad, 0), max(ys.min() - pad, 0), min(xs.max() + pad, W), min(ys.max() + pad, H))
        win, wm = res.crop(box), mask.crop(box)
        s = min(1.0, 900 / max(win.size))
        small = win.resize((round(win.width * s), round(win.height * s)), Image.LANCZOS) if s < 1 else win
        sm = wm.resize(small.size, Image.NEAREST).filter(ImageFilter.MaxFilter(5))
        out = lama(small, sm).crop((0, 0, small.width, small.height))
        if s < 1:
            out = out.resize(win.size, Image.LANCZOS)
        alpha = wm.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(2))
        res.paste(Image.composite(out, win, alpha), box[:2])
    return res


def original(rel):
    data = subprocess.run(['git', 'show', f'{ORIG}:social/photos/{rel}'], capture_output=True, check=True).stdout
    return Image.open(io.BytesIO(data))


if __name__ == '__main__':
    from simple_lama_inpainting import SimpleLama

    lama = SimpleLama()
    names = sys.argv[1:] or [k for k in REGIONS if k not in SKIP]
    for rel in names:
        assert rel not in SKIP, f'{rel} is cropped or unused, see SKIP'
        src = original(rel)
        keep = KEEP.get(rel, [])
        res = erase(src, build_mask(src.size, REGIONS[rel] + keep), lama)
        if keep:
            res.paste(src.convert('RGB'), (0, 0), build_mask(src.size, keep).filter(ImageFilter.GaussianBlur(0.7)))
        path = ROOT / rel
        if path.suffix == '.png':
            res.save(path, optimize=True)
        else:  # same quantization tables as the original, so the file doesn't bloat
            kw = {'qtables': src.quantization, 'subsampling': JpegImagePlugin.get_sampling(src)}
            for key in ('exif', 'icc_profile'):
                if src.info.get(key):
                    kw[key] = src.info[key]
            res.save(path, **kw)
        print('erased', rel, flush=True)

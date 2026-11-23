# Unwraps the printer's flat 12oz die-line (dieline/12oz.jpg, a phone screenshot of their proof) into the
# rectangular label the 3D cup wraps (src/assets/cup-label.jpg): u runs once round the cup from the paper
# seam, v from the bottom fold up to the rim. Measured off the screenshot: the arcs share a centre, the
# side edges are radial at -18.28 / +18.08 deg, the cut line's top arc is r 1900 and the bottom fold r 1480.
#   python3 social/cup/dieline/unwrap.py [roll]   roll = turns to shift so the logo faces front
import sys
import numpy as np
from PIL import Image

HERE = __file__.rsplit('/', 1)[0]
CX, CY = 682.83, 2946.11
R_TOP, R_FOLD = 1894, 1485          # a few px inside the yellow cut line and the pink fold line
TH_L = np.radians(-18.28 + 0.15)    # skip the yellow side edge
TH_R = np.radians(18.08 - 0.94)     # last 7mm hide under the flap (31px at the rim)
W, H, UP = 3072, 1024, 3
roll = float(sys.argv[1]) if len(sys.argv) > 1 else 0

src = Image.open(f'{HERE}/12oz.jpg').convert('RGB')
src = np.asarray(src.resize((src.width * UP, src.height * UP), Image.LANCZOS)).astype(np.float32)
u = (np.arange(W) + 0.5) / W
v = (np.arange(H) + 0.5) / H
th = TH_L + u[None, :] * (TH_R - TH_L)
r = R_TOP - v[:, None] * (R_TOP - R_FOLD)
x = (CX + r * np.sin(th)) * UP - 0.5
y = (CY - r * np.cos(th)) * UP - 0.5
x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int)
fx, fy = (x - x0)[..., None], (y - y0)[..., None]
px = lambda yy, xx: src[yy, xx]
out = (px(y0, x0) * (1 - fx) * (1 - fy) + px(y0, x0 + 1) * fx * (1 - fy)
       + px(y0 + 1, x0) * (1 - fx) * fy + px(y0 + 1, x0 + 1) * fx * fy)
# The cut line and fold marks are proof furniture, not print: paint any yellow or pink left over white.
R, G, B = out[..., 0], out[..., 1], out[..., 2]
out[((R - B > 60) & (G > 150)) | ((R - G > 50) & (B > 100))] = 255
out = np.roll(out, round(roll * W), axis=1)
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(sys.argv[2] if len(sys.argv) > 2 else 'cup-label.jpg', quality=92)

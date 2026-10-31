import sys, glob
from PIL import Image
fs = sorted(glob.glob(sys.argv[1] + '/t_*.jpg'), key=lambda f: float(f.split('t_')[-1][:-4]))
W, H, c = 270, 480, int(sys.argv[3]) if len(sys.argv) > 3 else 7
im = Image.new('RGB', (W * c, H * ((len(fs) + c - 1) // c)), 'white')
for i, f in enumerate(fs): im.paste(Image.open(f).resize((W, H)), ((i % c) * W, (i // c) * H))
im.save(sys.argv[2])

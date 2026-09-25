# Contact sheet: python3 tools/sheet.py <dir> <out.png> [cols] [thumb_width]
import sys, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 3
tw = int(sys.argv[4]) if len(sys.argv) > 4 else 640
files = sorted(f for f in os.listdir(d) if f.endswith('.png'))
ims = [Image.open(os.path.join(d, f)).convert('RGB') for f in files]
if not ims: sys.exit('no images')
th = int(ims[0].height * tw / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * (th + 18)), (30, 30, 30))
dr = ImageDraw.Draw(sheet)
for i, (im, f) in enumerate(zip(ims, files)):
    x, y = (i % cols) * tw, (i // cols) * (th + 18)
    sheet.paste(im.resize((tw, th), Image.LANCZOS), (x, y + 18))
    dr.text((x + 4, y + 3), f, fill=(255, 220, 120))
sheet.save(out)
print(out, sheet.size)

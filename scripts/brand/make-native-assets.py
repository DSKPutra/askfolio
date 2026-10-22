# © 2026 Dea Saka Kurnia Putra. All rights reserved.
# Generates native launcher icons and splash screens (§14) from kit/brand: icon = finandex-1024.png;
# splash = #0A0F0C background, centred Finandex icon, small personal "P" mark + "by Dea Saka Kurnia Putra".
# Replaces @capacitor/assets (its sharp dependency needs a blocked install script). Run: python3 -I scripts/brand/make-native-assets.py
import glob
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.getcwd()
ICON = Image.open(os.path.join(ROOT, 'kit/brand/icons/finandex-1024.png')).convert('RGBA')
MARK = Image.open(os.path.join(ROOT, 'kit/brand/dskp-mark-on-dark.png')).convert('RGBA')
BG = (10, 15, 12, 255)
MUTED = (157, 176, 164, 255)
BYLINE = 'by Dea Saka Kurnia Putra'


def font(px):
    for path in ['/System/Library/Fonts/Avenir Next.ttc', '/System/Library/Fonts/Helvetica.ttc']:
        if os.path.exists(path):
            return ImageFont.truetype(path, px)
    return ImageFont.load_default()


def splash(w, h):
    im = Image.new('RGBA', (w, h), BG)
    s = min(w, h)
    icon = ICON.resize((int(s * 0.22),) * 2, Image.LANCZOS)
    im.alpha_composite(icon, ((w - icon.width) // 2, (h - icon.height) // 2 - int(s * 0.04)))
    mh = int(s * 0.035)
    mark = MARK.resize((int(MARK.width * mh / MARK.height), mh), Image.LANCZOS)
    f = font(int(s * 0.022))
    d = ImageDraw.Draw(im)
    tw = d.textlength(BYLINE, font=f)
    gap = int(s * 0.012)
    total = mark.width + gap + tw
    x = int((w - total) / 2)
    y = (h + icon.height) // 2 + int(s * 0.02)
    im.alpha_composite(mark, (x, y))
    d.text((x + mark.width + gap, y + mh // 2), BYLINE, font=f, fill=MUTED, anchor='lm')
    return im.convert('RGB')


def launcher(size, round_=False):
    im = ICON.resize((size, size), Image.LANCZOS)
    if round_:
        mask = Image.new('L', (size, size), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
        out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        out.paste(im, (0, 0), mask)
        return out
    return im


def foreground(size):
    # Adaptive icon: 108dp canvas, visible safe zone 66dp → icon scaled to 66/108 and centred.
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    inner = int(size * 66 / 108)
    out.alpha_composite(ICON.resize((inner, inner), Image.LANCZOS), ((size - inner) // 2, (size - inner) // 2))
    return out


res = 'android/app/src/main/res'
for p in glob.glob(f'{res}/drawable*/splash.png'):
    w, h = Image.open(p).size
    splash(w, h).save(p, optimize=True)
for p in glob.glob(f'{res}/mipmap-*/ic_launcher.png'):
    launcher(Image.open(p).size[0]).save(p, optimize=True)
for p in glob.glob(f'{res}/mipmap-*/ic_launcher_round.png'):
    launcher(Image.open(p).size[0], True).save(p, optimize=True)
for p in glob.glob(f'{res}/mipmap-*/ic_launcher_foreground.png'):
    foreground(Image.open(p).size[0]).save(p, optimize=True)
with open(f'{res}/values/ic_launcher_background.xml', 'w') as fh:
    fh.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0A0F0C</color>\n</resources>\n')

ios = 'ios/App/App/Assets.xcassets'
ICON.convert('RGB').resize((1024, 1024), Image.LANCZOS).save(f'{ios}/AppIcon.appiconset/AppIcon-512@2x.png', optimize=True)
sp = splash(2732, 2732)
for p in glob.glob(f'{ios}/Splash.imageset/splash-2732x2732*.png'):
    sp.save(p, optimize=True)
print('native icons & splash generated')

#!/usr/bin/env python3
"""Generate the placeholder cover art and the Open Graph card for the reader.

The cover at attached_assets/capital-without-usury-cover.png is a typographic
PLACEHOLDER in the NEC palette. To replace it with real cover art, overwrite
that file with the final image (same filename, ideally around 1086 x 1448 px,
3:4 portrait) and rebuild; no code change is needed. Then rerun this script
with --og-only to refresh the Open Graph card from the new cover.
"""
import argparse
import math
import pathlib

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ROOT / "attached_assets"
PUBLIC = ROOT / "artifacts/book-reader/public"

LORA = "/usr/share/fonts/truetype/google-fonts/Lora-Variable.ttf"
LORA_ITALIC = "/usr/share/fonts/truetype/google-fonts/Lora-Italic-Variable.ttf"

NAVY_TOP = (13, 15, 38)
NAVY_MID = (8, 9, 24)
NAVY_BOTTOM = (4, 5, 13)
GOLD = (214, 169, 58)
GOLD_DIM = (201, 160, 58)
IVORY = (247, 240, 223)


def font(path, size, bold=False):
    f = ImageFont.truetype(path, size)
    try:
        f.set_variation_by_axes([700 if bold else 400])
    except Exception:
        pass
    return f


def tracked(draw, xy, text, fnt, fill, tracking, anchor_center_x=None):
    """Draw letterspaced text; if anchor_center_x is set, center the run on it."""
    widths = [draw.textlength(ch, font=fnt) for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x, y = xy
    if anchor_center_x is not None:
        x = anchor_center_x - total / 2
    for ch, w in zip(text, widths):
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += w + tracking
    return total


def vertical_gradient(size, stops):
    w, h = size
    img = Image.new("RGB", size)
    px = img.load()
    n = len(stops) - 1
    for y in range(h):
        t = y / (h - 1)
        seg = min(int(t * n), n - 1)
        lt = (t * n) - seg
        c0, c1 = stops[seg], stops[seg + 1]
        row = tuple(int(c0[i] + (c1[i] - c0[i]) * lt) for i in range(3))
        for x in range(w):
            px[x, y] = row
    return img


def make_cover(path, w=1086, h=1448):
    img = vertical_gradient((w, h), [NAVY_TOP, NAVY_MID, NAVY_BOTTOM]).convert("RGB")

    # soft radial glow behind the title block
    glow = Image.new("L", (w, h), 0)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([w * 0.5 - 430, h * 0.30 - 330, w * 0.5 + 430, h * 0.30 + 330], fill=52)
    glow = glow.filter(ImageFilter.GaussianBlur(150))
    img = Image.composite(Image.new("RGB", (w, h), (54, 38, 110)), img, glow)

    d = ImageDraw.Draw(img, "RGBA")

    # subtle dot grid
    for yy in range(60, h - 40, 46):
        for xx in range(60, w - 40, 46):
            d.ellipse([xx, yy, xx + 2, yy + 2], fill=GOLD + (14,))

    # gold double frame with corner dots
    d.rectangle([30, 30, w - 30, h - 30], outline=GOLD + (110,), width=3)
    d.rectangle([46, 46, w - 46, h - 46], outline=GOLD + (45,), width=1)
    for cx, cy in [(30, 30), (w - 30, 30), (30, h - 30), (w - 30, h - 30)]:
        d.ellipse([cx - 7, cy - 7, cx + 7, cy + 7], fill=GOLD + (120,))

    cx = w / 2

    # top rule: working-manuscript tag
    tag_f = font(LORA, 30, bold=True)
    tracked(d, (0, 118), "A WORKING MANUSCRIPT", tag_f, GOLD + (150,), 14, anchor_center_x=cx)

    # starburst above the title (NEC motif): 8 rays + bright core
    sy = 360
    for ang, ln, wd, al in [
        (90, 120, 5, 210), (270, 120, 5, 210), (0, 170, 4, 190), (180, 170, 4, 190),
        (45, 78, 3, 130), (135, 78, 3, 130), (225, 78, 3, 130), (315, 78, 3, 130),
    ]:
        rad = math.radians(ang)
        x2, y2 = cx + ln * math.cos(rad), sy - ln * math.sin(rad)
        d.line([cx, sy, x2, y2], fill=(232, 200, 112, al), width=wd)
    d.ellipse([cx - 13, sy - 13, cx + 13, sy + 13], fill=(245, 232, 192, 235))
    d.ellipse([cx - 5, sy - 5, cx + 5, sy + 5], fill=(252, 248, 232, 255))

    # title
    title_f = font(LORA, 128, bold=True)
    y = 520
    for line in ["CAPITAL", "WITHOUT", "USURY"]:
        tracked(d, (0, y), line, title_f, IVORY, 26, anchor_center_x=cx)
        y += 172

    # ornamental divider
    dy = y + 40
    d.line([cx - 240, dy, cx - 26, dy], fill=GOLD + (150,), width=2)
    d.line([cx + 26, dy, cx + 240, dy], fill=GOLD + (150,), width=2)
    dm = 11
    d.polygon([(cx, dy - dm), (cx + dm, dy), (cx, dy + dm), (cx - dm, dy)], fill=GOLD + (200,))

    # subtitle
    sub_f = font(LORA_ITALIC, 47)
    d.text((cx, dy + 92), "Jewish, Christian, and Islamic Finance", font=sub_f,
           fill=(226, 197, 104, 235), anchor="mm")
    d.text((cx, dy + 162), "from Scripture to Non-Extractive Capital", font=sub_f,
           fill=(226, 197, 104, 235), anchor="mm")

    # bottom placeholder marker
    mark_f = font(LORA, 26)
    tracked(d, (0, h - 118), "PLACEHOLDER COVER", mark_f, (160, 150, 130, 130), 10,
            anchor_center_x=cx)

    img.save(path, "PNG", optimize=True)
    print(f"wrote {path} ({path.stat().st_size:,} bytes)")


def make_og(path, cover_path, w=1200, h=630):
    img = vertical_gradient((w, h), [NAVY_TOP, NAVY_BOTTOM]).convert("RGB")
    d = ImageDraw.Draw(img, "RGBA")
    d.rectangle([16, 16, w - 16, h - 16], outline=GOLD + (90,), width=2)

    cover = Image.open(cover_path).convert("RGB")
    ch = 520
    cw = int(cover.width * ch / cover.height)
    cover = cover.resize((cw, ch), Image.LANCZOS)
    img.paste(cover, (72, (h - ch) // 2))
    d.rectangle([72, (h - ch) // 2, 72 + cw, (h - ch) // 2 + ch], outline=GOLD + (140,), width=2)

    tx = 72 + cw + 64
    title_f = font(LORA, 84, bold=True)
    d.text((tx, 150), "Capital", font=title_f, fill=IVORY)
    d.text((tx, 250), "Without Usury", font=title_f, fill=IVORY)
    sub_f = font(LORA_ITALIC, 34)
    d.text((tx, 396), "Jewish, Christian, and Islamic Finance", font=sub_f, fill=(226, 197, 104))
    d.text((tx, 444), "from Scripture to Non-Extractive Capital", font=sub_f, fill=(226, 197, 104))
    tag_f = font(LORA, 25)
    d.text((tx, 520), "Read the working manuscript online", font=tag_f, fill=(200, 190, 170))

    img.convert("RGB").save(path, "JPEG", quality=88)
    print(f"wrote {path} ({path.stat().st_size:,} bytes)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--og-only", action="store_true",
                    help="only rebuild opengraph.jpg from the existing cover file")
    args = ap.parse_args()
    ASSETS.mkdir(exist_ok=True)
    cover = ASSETS / "capital-without-usury-cover.png"
    if not args.og_only:
        make_cover(cover)
    make_og(PUBLIC / "opengraph.jpg", cover)

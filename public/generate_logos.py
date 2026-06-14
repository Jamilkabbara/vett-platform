#!/usr/bin/env python3
"""
Generate VETT brand assets:
- logo.svg (source of truth)
- favicon-16.png, favicon-32.png
- logo-120.png (OAuth consent)
- apple-touch-icon.png (180x180)
- og-image.png (1200x630 social card)

Brand tokens:
- BG: #0B0C15
- Lime: #BEF264
- Logo: lime rounded square with lightning bolt (Zap icon)
"""
import os
from PIL import Image, ImageDraw, ImageFont

# Brand tokens
BG = (11, 12, 21)       # #0B0C15
LIME = (190, 242, 100)  # #BEF264
WHITE = (255, 255, 255)
GREY = (156, 163, 175)  # #9CA3AF

OUT = '/home/claude/vett-assets'
os.makedirs(OUT, exist_ok=True)

# Font paths
POPPINS_BOLD = '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf'
POPPINS_MEDIUM = '/usr/share/fonts/truetype/google-fonts/Poppins-Medium.ttf'

# ============================================================
# SVG SOURCE OF TRUTH
# ============================================================
# Lucide Zap path centered in a rounded square.
# The Lucide Zap viewBox is 24x24. We center it in a 120x120 square with
# 12px border radius (matching the in-app header style at 46px / 12px radius).

LUCIDE_ZAP_PATH = "M13 2 L3 14 H12 L11 22 L21 10 H12 L13 2 Z"

def make_svg(size=120, radius_ratio=0.10):
    """Create the VETT logo SVG at any size."""
    radius = int(size * radius_ratio)
    # Scale the 24x24 Lucide zap to fit inside the square with padding.
    # Icon takes ~55% of the square for visual balance.
    icon_size = int(size * 0.55)
    icon_offset = (size - icon_size) // 2
    scale = icon_size / 24.0

    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">
  <rect width="{size}" height="{size}" rx="{radius}" ry="{radius}" fill="#BEF264"/>
  <g transform="translate({icon_offset},{icon_offset}) scale({scale})">
    <path d="{LUCIDE_ZAP_PATH}"
          fill="#0B0C15"
          stroke="#0B0C15"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"/>
  </g>
</svg>'''
    return svg

# Write the canonical SVG at 120px — users can scale as needed
svg_src = make_svg(120)
with open(f'{OUT}/logo.svg', 'w') as f:
    f.write(svg_src)
print(f'✓ logo.svg ({len(svg_src)} bytes)')


# ============================================================
# RASTER LOGO GENERATOR
# ============================================================
def rounded_rect_mask(size, radius):
    """Create alpha mask for rounded rectangle."""
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size-1, size-1), radius=radius, fill=255)
    return mask

def zap_polygon_points(icon_size, offset_x=0, offset_y=0):
    """Return Lucide Zap path as scaled polygon points.
    Lucide Zap in 24x24: M13 2 L3 14 H12 L11 22 L21 10 H12 L13 2 Z
    """
    s = icon_size / 24.0
    pts_24 = [(13, 2), (3, 14), (12, 14), (11, 22), (21, 10), (12, 10)]
    return [(offset_x + int(x*s), offset_y + int(y*s)) for (x, y) in pts_24]

def render_logo(size, radius_ratio=0.10, icon_ratio=0.55, output_path=None, supersample=4):
    """Render the logo at a given pixel size. Supersampling for smooth edges."""
    # Render at higher resolution then downsample
    hi = size * supersample
    radius_hi = int(hi * radius_ratio)

    # Create base image with transparent background
    img = Image.new('RGBA', (hi, hi), (0, 0, 0, 0))

    # Paint the lime rounded square
    lime_layer = Image.new('RGBA', (hi, hi), (0, 0, 0, 0))
    draw = ImageDraw.Draw(lime_layer)
    draw.rounded_rectangle((0, 0, hi-1, hi-1), radius=radius_hi, fill=LIME + (255,))
    img = Image.alpha_composite(img, lime_layer)

    # Draw the Zap icon
    icon_size_hi = int(hi * icon_ratio)
    offset_hi = (hi - icon_size_hi) // 2
    pts = zap_polygon_points(icon_size_hi, offset_hi, offset_hi)

    draw = ImageDraw.Draw(img)
    draw.polygon(pts, fill=BG + (255,), outline=BG + (255,))

    # Downsample with Lanczos for smooth edges
    img = img.resize((size, size), Image.LANCZOS)

    if output_path:
        img.save(output_path, 'PNG', optimize=True)
    return img


# Generate all raster sizes
targets = [
    ('favicon-16.png', 16),
    ('favicon-32.png', 32),
    ('logo-120.png', 120),
    ('apple-touch-icon.png', 180),
]

for name, size in targets:
    path = f'{OUT}/{name}'
    render_logo(size, output_path=path)
    print(f'✓ {name} ({size}×{size})')


# ============================================================
# OG IMAGE (1200×630)
# ============================================================
# Layout:
# - Dark bg
# - Logo (~280x280) at ~120px from left, vertically centered-ish
# - VETT wordmark huge, to the right of logo
# - Tagline below wordmark, smaller, grey

OG_W, OG_H = 1200, 630

og = Image.new('RGB', (OG_W, OG_H), BG)
draw = ImageDraw.Draw(og)

# Subtle lime accent: thin line across top
draw.rectangle((0, 0, OG_W, 6), fill=LIME)

# Logo on left
logo_size = 260
logo = render_logo(logo_size)
logo_x = 110
logo_y = (OG_H - logo_size) // 2
og.paste(logo, (logo_x, logo_y), logo)

# Text block to the right of logo
text_x = logo_x + logo_size + 60  # 60px gap

# VETT wordmark
try:
    font_brand = ImageFont.truetype(POPPINS_BOLD, 180)
except OSError:
    font_brand = ImageFont.load_default()

# Measure to center vertically around the same axis as logo
brand_bbox = draw.textbbox((0, 0), "VETT", font=font_brand)
brand_w = brand_bbox[2] - brand_bbox[0]
brand_h = brand_bbox[3] - brand_bbox[1]

# Tagline
try:
    font_tagline = ImageFont.truetype(POPPINS_MEDIUM, 34)
except OSError:
    font_tagline = ImageFont.load_default()

tagline = "AI-powered market research"
tagline_bbox = draw.textbbox((0, 0), tagline, font=font_tagline)
tagline_h = tagline_bbox[3] - tagline_bbox[1]

# Gap between brand and tagline
gap = 24

# Total text block height
block_h = brand_h + gap + tagline_h

# Center the text block vertically
block_start_y = (OG_H - block_h) // 2

# Adjust: textbbox y0 is often negative-ish for top-aligned fonts; compensate
# Use anchor-based drawing for cleaner positioning
brand_y = block_start_y - brand_bbox[1]  # compensate baseline
draw.text((text_x, brand_y), "VETT", font=font_brand, fill=WHITE)

tagline_y = brand_y + brand_h + gap - tagline_bbox[1] + brand_bbox[1]
draw.text((text_x, tagline_y), tagline, font=font_tagline, fill=GREY)

# Small VETT logo + domain in bottom-right (subtle credit)
try:
    font_domain = ImageFont.truetype(POPPINS_MEDIUM, 22)
except OSError:
    font_domain = ImageFont.load_default()

draw.text((OG_W - 200, OG_H - 50), "vettit.ai", font=font_domain, fill=GREY)

og.save(f'{OUT}/og-image.png', 'PNG', optimize=True)
print(f'✓ og-image.png ({OG_W}×{OG_H})')

# List all outputs
print("\n=== Outputs ===")
for f in sorted(os.listdir(OUT)):
    path = f'{OUT}/{f}'
    size_kb = os.path.getsize(path) / 1024
    print(f'  {f} — {size_kb:.1f} KB')

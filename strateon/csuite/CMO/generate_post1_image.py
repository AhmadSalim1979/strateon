#!/usr/bin/env python3
"""Generate LinkedIn Post #1 image — The Pipeline Problem — V2"""

from PIL import Image, ImageDraw, ImageFont
import math

W, H = 1200, 628

# Colors
BG = (18, 13, 16)        # near-black #120b0d
RED = (184, 20, 20)       # accent red
RED_LIGHT = (201, 24, 24) # brighter red
WHITE = (255, 255, 255)
MUTED = (180, 170, 165)
CARD = (28, 24, 27)
GLOW = (50, 10, 10)

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# Red radial glow (upper right area)
for r in range(300, 0, -3):
    a = int(12 * (1 - r/300))
    if a > 0:
        draw.ellipse((W-r-100, -50, W+50, r+50), fill=(RED[0]+10, RED[1], RED[2]+10))

# Main card
draw.rounded_rectangle([50, 50, W-50, H-50], radius=18, fill=CARD)

# Red accent line at top
draw.rectangle([90, 50, W-90, 54], fill=RED)

def font(size, bold=False):
    try:
        path = "/usr/share/fonts/truetype/dejavu/DejaVuSans" + ("-Bold.ttf" if bold else ".ttf")
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

f_bold_56 = font(56, True)
f_bold_36 = font(36, True)
f_reg_22 = font(22)
f_reg_18 = font(18)
f_bold_18 = font(18, True)
f_small_15 = font(15)

# HEADLINE
headline_texts = ["The Pipeline Problem", "Is Not What You Think"]
y = 100
for line in headline_texts:
    bw = draw.textbbox((0,0), line, font=f_bold_56)[2]
    draw.text(((W - bw)//2, y), line, fill=WHITE, font=f_bold_56)
    y += 68

# Thin divider
draw.rectangle([100, y+5, W-100, y+7], fill=(80,70,70))

# SUBTEXT
subs = [
    "Most B2B founders assume it's a lead generation problem.",
    "It's almost always a pipeline mechanics problem."
]
y2 = y + 28
for sub in subs:
    bw = draw.textbbox((0,0), sub, font=f_reg_22)[2]
    draw.text(((W-bw)//2, y2), sub, fill=MUTED, font=f_reg_22)
    y2 += 34

# PIPELINE DIAGRAM
diag_y = y2 + 25
pipe_top = diag_y
pipe_bottom = diag_y + 18
pipe_left = 160
pipe_right = W - 160

# Pipe body
draw.rounded_rectangle([pipe_left, pipe_top, pipe_right, pipe_bottom], radius=9, fill=(60,50,55))

# Inlet funnel (left - leads entering)
funnel_left = pipe_left - 20
funnel_top = pipe_top - 55
funnel_bottom = pipe_top + 5
draw.polygon([
    (funnel_left, funnel_top),
    (funnel_left + 70, funnel_top),
    (pipe_left + 15, pipe_bottom - 13),
    (funnel_left, pipe_bottom - 13)
], fill=RED_LIGHT)

# Label: "LEADS IN"
bw = draw.textbbox((0,0), "LEADS IN", font=f_small_15)[2]
draw.text((funnel_left - 5, funnel_top - 28), "LEADS IN", fill=MUTED, font=f_small_15)

# Outlet (right - deals closed)
out_right = pipe_right + 20
out_top = pipe_top - 55
draw.polygon([
    (out_right - 70, out_top),
    (out_right, out_top),
    (out_right, pipe_top),
    (pipe_right - 15, pipe_bottom)
], fill=(60, 180, 100))  # green for closed deals

# Label: "DEALS CLOSED"
bw = draw.textbbox((0,0), "DEALS CLOSED", font=f_small_15)[2]
draw.text((out_right - bw - 5, out_top - 28), "DEALS CLOSED", fill=MUTED, font=f_small_15)

# LEAK INDICATOR (middle of pipe)
leak_x = (pipe_left + pipe_right) // 2
leak_y = pipe_bottom + 12

# Drip drops
for drop_y in range(leak_y, leak_y + 35, 10):
    size = 5 if drop_y == leak_y else 3
    draw.ellipse([leak_x-size, drop_y-size, leak_x+size, drop_y+size], fill=RED)
    # fade effect
    if size > 3:
        draw.ellipse([leak_x-size-2, drop_y-size-2, leak_x+size+2, drop_y+size+2], fill=(RED[0], RED[1], RED[2], 80))

# "THE LEAK" label
bw = draw.textbbox((0,0), "THE LEAK", font=f_bold_18)[2]
draw.text((leak_x - bw//2, leak_y + 38), "THE LEAK", fill=RED, font=f_bold_18)

# Question at bottom
q_y = diag_y + 110
question = "What's one leak you've noticed in your own pipeline?"
bw = draw.textbbox((0,0), question, font=f_reg_22)[2]
draw.text(((W-bw)//2, q_y), question, fill=WHITE, font=f_reg_22)

# Footer brand
footer_y = H - 105
draw.rectangle([100, footer_y, W-100, footer_y+1], fill=(60,55,55))
brand = "qiYADON"
bw = draw.textbbox((0,0), brand, font=f_bold_36)[2]
draw.text(((W-bw)//2, footer_y + 18), brand, fill=RED, font=f_bold_36)

img.save("/home/node/.openclaw/workspace/strateon/csuite/CMO/linkedin-post-1.png")
print(f"Saved: {img.size}")
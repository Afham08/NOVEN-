"""Bake the breathing orb's pigment flow for Expo. Requires NumPy and Pillow."""
from pathlib import Path

import numpy as np
from PIL import Image

OUTPUT = Path(__file__).resolve().parents[1] / "assets" / "meditation"
TILE = 240
GRID = 8
y, x = np.mgrid[-1.23:1.23:complex(TILE), -1.23:1.23:complex(TILE)]
radius = np.hypot(x, y)
alpha = np.clip((0.96 - radius) * (TILE - 1) / 2.46 + 0.5, 0, 1)
warm = np.array([[255,142,10], [251,79,9], [207,32,55], [126,45,140], [254,112,157]])
cool = np.array([[155,219,167], [110,202,163], [67,165,150], [68,124,160], [191,231,190]])
mid = np.array([[255,182,133], [225,145,158], [185,114,167], [123,106,177], [249,191,204]])
pigments = [(-.68,.28,.65), (-.05,.55,.60), (.39,-.32,.64), (.82,.60,.38), (-.49,-.91,.44)]


def swirl(u, v, cx, cy, strength, width):
    dx, dy = u - cx, v - cy
    turn = strength * np.exp(-(dx*dx + dy*dy) / width**2)
    return (cx + dx*np.cos(turn) - dy*np.sin(turn),
            cy + dx*np.sin(turn) + dy*np.cos(turn))


def frame(position):
    # Reserve half the tiles for the longest phase, the full hold.
    heat = np.clip(min(position * 4, (1 - position) * 4), 0, 1)
    heat = heat * heat * (3 - 2 * heat)
    phase = 2 * np.pi * position
    palette = (cool + (mid-cool)*min(2*heat, 1) + (warm-mid)*max(2*heat-1, 0))
    # Two overlapping currents fold the soft pigment patches past each other.
    u, v = swirl(x, y, -.22+.18*np.cos(phase), .12+.22*np.sin(phase),
                 heat*(1.4+1.1*np.sin(2*phase)), .78)
    u, v = swirl(u, v, .36+.14*np.sin(phase), -.18+.21*np.cos(phase),
                 -heat*(1.35+.95*np.cos(2*phase+.6)), .72)
    u += .18*heat*np.sin(3*v+phase)
    weights = np.stack([np.exp(-((u-cx)**2+(v-cy)**2)/width**2)
                        for cx, cy, width in pigments], axis=-1)
    rgb = weights @ palette / weights.sum(axis=-1, keepdims=True)
    return Image.fromarray(np.uint8(np.dstack((rgb, 255*alpha))))


for parity, name in enumerate(("inhale", "exhale")):
    sheet = Image.new("RGBA", (GRID*TILE, GRID*TILE))
    for tile in range(GRID*GRID):
        position = (2*tile + parity) / (2*GRID*GRID)
        sheet.paste(frame(position), (tile % GRID*TILE, tile // GRID*TILE))
    sheet.save(OUTPUT / f"fluid-{name}.webp", quality=89, method=4)

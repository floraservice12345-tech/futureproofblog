from pathlib import Path
from PIL import Image

root = Path(__file__).parent
frames_dir = root / "_frames"
frames = [Image.open(frames_dir / f"scene-{n}.png").convert("RGB") for n in range(1, 6)]
frames = [im.resize((540, 960), Image.Resampling.LANCZOS) for im in frames]
palette_frames = [im.quantize(colors=128, method=Image.Quantize.MEDIANCUT) for im in frames]
timeline = []
durations = []
for index, current in enumerate(palette_frames):
    following = palette_frames[(index + 1) % len(palette_frames)]
    timeline.extend([current] * 32)
    durations.extend([100] * 32)
    if index < len(palette_frames) - 1:
        rgb_a = frames[index]
        rgb_b = frames[index + 1]
        for step in range(1, 5):
            blended = Image.blend(rgb_a, rgb_b, step / 5)
            timeline.append(blended.quantize(colors=128, method=Image.Quantize.MEDIANCUT))
            durations.append(100)

out = root / "futureproof-services-promo.gif"
timeline[0].save(out, save_all=True, append_images=timeline[1:], duration=durations,
                 loop=0, optimize=True, disposal=2)
print(f"Created {out} ({out.stat().st_size:,} bytes)")

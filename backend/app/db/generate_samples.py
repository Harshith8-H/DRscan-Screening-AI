import math
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

def generate_fundus_image(
    filename: Path,
    grade: int,
    is_poor_quality: bool = False,
    size: int = 512
):
    # Base dark circular fundus canvas
    img = Image.new("RGB", (size, size), (5, 5, 10))
    draw = ImageDraw.Draw(img)

    cx, cy = size // 2, size // 2
    retina_r = int(size * 0.46)

    # 1. Base orange-red retinal pigmentation with subtle radial gradient
    Y, X = np.ogrid[:size, :size]
    dist = np.sqrt((X - cx)**2 + (Y - cy)**2)
    retina_mask = dist <= retina_r

    # Retinal background gradient (deep orange center, slightly darker rim)
    grad_norm = np.clip(dist / retina_r, 0, 1)
    r_chan = np.clip(210 - (grad_norm * 45) + np.random.normal(0, 4, (size, size)), 0, 255).astype(np.uint8)
    g_chan = np.clip(100 - (grad_norm * 35) + np.random.normal(0, 3, (size, size)), 0, 255).astype(np.uint8)
    b_chan = np.clip(35 - (grad_norm * 18) + np.random.normal(0, 2, (size, size)), 0, 255).astype(np.uint8)

    fundus_arr = np.stack([r_chan, g_chan, b_chan], axis=2)
    fundus_arr[~retina_mask] = [8, 10, 16]
    base_img = Image.fromarray(fundus_arr)

    # 2. Draw anatomical landmarks: Optic Disc & Macula
    landmark_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(landmark_layer)

    # Optic Disc: bright yellow-pink oval at nasal position
    od_x, od_y = int(cx * 0.55), int(cy * 0.95)
    od_rx, od_ry = int(size * 0.055), int(size * 0.075)
    ldraw.ellipse([od_x - od_rx, od_y - od_ry, od_x + od_rx, od_y + od_ry], fill=(255, 230, 175, 240))
    # Optic Cup: inner paler center
    ldraw.ellipse([od_x - od_rx//2, od_y - od_ry//2, od_x + od_rx//2, od_y + od_ry//2], fill=(255, 248, 220, 230))

    # Macula & Fovea: darker avascular oval at temporal center
    mac_x, mac_y = int(cx * 1.05), int(cy * 1.0)
    mac_r = int(size * 0.07)
    ldraw.ellipse([mac_x - mac_r, mac_y - mac_r, mac_x + mac_r, mac_y + mac_r], fill=(130, 40, 15, 80))
    ldraw.ellipse([mac_x - 4, mac_y - 4, mac_x + 4, mac_y + 4], fill=(70, 15, 8, 120)) # Foveal reflex

    # 3. Branching Retinal Blood Vessels originating from Optic Disc
    # Superior & Inferior Temporal/Nasal Arcades
    vessel_color = (130, 20, 15, 230)
    def draw_vascular_branch(start_pt, angles, lengths, widths):
        curr = start_pt
        for ang, length, w in zip(angles, lengths, widths):
            rad = math.radians(ang)
            nxt = (curr[0] + length * math.cos(rad), curr[1] + length * math.sin(rad))
            ldraw.line([curr, nxt], fill=vessel_color, width=w)
            curr = nxt

    # Superior temporal arcade
    draw_vascular_branch((od_x, od_y), [-75, -45, -20, 0, 15], [35, 45, 55, 60, 40], [5, 4, 3, 2, 2])
    # Inferior temporal arcade
    draw_vascular_branch((od_x, od_y), [75, 45, 20, 0, -15], [35, 45, 55, 60, 40], [5, 4, 3, 2, 2])
    # Nasal arcades
    draw_vascular_branch((od_x, od_y), [170, 155, 140], [30, 40, 35], [4, 3, 2])
    draw_vascular_branch((od_x, od_y), [-170, -155, -140], [30, 40, 35], [4, 3, 2])

    # 4. Diabetic Retinopathy Lesions according to Grade
    if grade >= 1:
        # Microaneurysms: Tiny deep-red dots
        ma_count = {1: 6, 2: 18, 3: 45, 4: 65}[grade]
        for _ in range(ma_count):
            mx = int(mac_x + random.randint(-80, 80))
            my = int(mac_y + random.randint(-70, 70))
            mr = random.randint(1, 3)
            ldraw.ellipse([mx - mr, my - mr, mx + mr, my + mr], fill=(160, 10, 10, 240))

    if grade >= 2:
        # Hard Exudates: Crisp yellow waxy deposits
        ex_count = {2: 12, 3: 35, 4: 50}[grade]
        ex_center_x, ex_center_y = int(cx * 0.9), int(cy * 1.15)
        for _ in range(ex_count):
            ex = ex_center_x + random.randint(-40, 40)
            ey = ex_center_y + random.randint(-30, 30)
            er = random.randint(2, 5)
            ldraw.ellipse([ex - er, ey - er, ex + er, ey + er], fill=(255, 245, 40, 230))

        # Blot Hemorrhages: Medium irregular crimson spots
        he_count = {2: 6, 3: 22, 4: 40}[grade]
        for _ in range(he_count):
            hx = int(cx + random.randint(-110, 110))
            hy = int(cy + random.randint(-90, 90))
            hrx, hry = random.randint(4, 9), random.randint(3, 7)
            ldraw.ellipse([hx - hrx, hy - hry, hx + hrx, hy + hry], fill=(120, 10, 15, 220))

    if grade >= 3:
        # Cotton Wool Spots: Fluffy white soft patches
        for _ in range(5):
            cwx = int(cx + random.randint(-90, 90))
            cwy = int(cy + random.randint(-80, 80))
            cwr = random.randint(9, 17)
            ldraw.ellipse([cwx - cwr, cwy - cwr, cwx + cwr, cwy + cwr], fill=(240, 245, 255, 160))

    if grade >= 4:
        # Neovascularization (NVD / NVE): Tangled abnormal fronds
        for _ in range(15):
            frx = int(od_x + random.randint(-30, 30))
            fry = int(od_y + random.randint(-30, 30))
            ldraw.line([(frx, fry), (frx + random.randint(-15, 15), fry + random.randint(-15, 15))], fill=(190, 20, 30, 240), width=2)
        # Large preretinal / vitreous hemorrhage
        ldraw.ellipse([int(cx*0.7), int(cy*0.45), int(cx*1.2), int(cy*0.75)], fill=(110, 5, 10, 235))

    # Composite layers
    landmark_layer = landmark_layer.filter(ImageFilter.GaussianBlur(radius=0.7))
    composite = Image.alpha_composite(base_img.convert("RGBA"), landmark_layer).convert("RGB")

    # If testing poor quality: apply heavy blur or extreme exposure glare
    if is_poor_quality:
        composite = composite.filter(ImageFilter.GaussianBlur(radius=8.0))
        # Add harsh flash glare artifact
        glare = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        gdraw = ImageDraw.Draw(glare)
        gdraw.ellipse([int(cx*0.8), int(cy*0.8), int(cx*1.4), int(cy*1.4)], fill=(255, 255, 255, 180))
        glare = glare.filter(ImageFilter.GaussianBlur(radius=20))
        composite = Image.alpha_composite(composite.convert("RGBA"), glare).convert("RGB")

    filename.parent.mkdir(parents=True, exist_ok=True)
    composite.save(filename, "JPEG", quality=92)
    return filename

def generate_all_samples(samples_dir: Path):
    samples = [
        ("sample_grade0_normal.jpg", 0, False),
        ("sample_grade1_mild.jpg", 1, False),
        ("sample_grade2_moderate.jpg", 2, False),
        ("sample_grade3_severe.jpg", 3, False),
        ("sample_grade4_pdr.jpg", 4, False),
        ("sample_poor_quality.jpg", 1, True),
    ]
    created = []
    for fname, grade, is_poor in samples:
        target = samples_dir / fname
        generate_fundus_image(target, grade, is_poor)
        created.append(target)
    return created

if __name__ == "__main__":
    from app.core.config import settings
    generate_all_samples(settings.SAMPLES_DIR)
    print("Generated all sample fundus images successfully.")

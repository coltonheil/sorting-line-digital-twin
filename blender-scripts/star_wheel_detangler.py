import math
import os
import sys
import bpy

sys.path.append(os.path.dirname(__file__))
from model_utils import *

OUTPUT_PATH = os.path.expanduser('~/repos/sorting-line-digital-twin/public/models/star-wheel-detangler.glb')
clear_scene()

stainless = make_principled_material('Stainless', (0.82, 0.83, 0.84), metallic=0.85, roughness=0.26, brushed=True, noise_bump=0.008)
rubber = make_principled_material('StarRubber', (0.05, 0.05, 0.05), metallic=0.0, roughness=0.85)
bearing = make_principled_material('Bearing', (0.25, 0.27, 0.29), metallic=0.35, roughness=0.6)
chain = make_principled_material('Chain', (0.17, 0.17, 0.16), metallic=0.75, roughness=0.4)

# frame
for name, loc, scale in [
    ('frame_top_left', (0, 0.92, -0.28), (0.55, 0.03, 0.03)),
    ('frame_top_right', (0, 0.92, 0.28), (0.55, 0.03, 0.03)),
    ('frame_bottom_left', (0, 0.12, -0.28), (0.55, 0.025, 0.025)),
    ('frame_bottom_right', (0, 0.12, 0.28), (0.55, 0.025, 0.025)),
    ('frame_cross_infeed', (-0.5, 0.92, 0), (0.03, 0.03, 0.28)),
    ('frame_cross_outfeed', (0.5, 0.92, 0), (0.03, 0.03, 0.28)),
]:
    add_cube(name, location=loc, scale=scale, material=stainless, bevel=0.002)

for i, pos in enumerate([(-0.5, 0.46, -0.28), (-0.5, 0.46, 0.28), (0.5, 0.46, -0.28), (0.5, 0.46, 0.28)], 1):
    add_cube(f'frame_leg_{i}', location=pos, scale=(0.03, 0.46, 0.03), material=stainless, bevel=0.002)

for i in range(8):
    x = -0.42 + i * 0.12
    add_cylinder(f'shaft_{i + 1}', location=(x, 0.58, 0), radius=0.0127, depth=0.62, rotation=(math.pi / 2, 0, 0), material=stainless, vertices=20)
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(x, 0.58, 0), rotation=(math.pi / 2, 0, 0))
    star_root = bpy.context.active_object
    star_root.name = f'star_wheel_{i + 1}'
    hub = add_cylinder(f'star_wheel_{i + 1}_hub', location=(x, 0.58, 0), radius=0.03, depth=0.055, rotation=(math.pi / 2, 0, 0), material=rubber, vertices=20)
    hub.parent = star_root
    for arm in range(5):
        ang = (arm / 5) * math.tau
        tooth = add_cube(
            f'star_wheel_{i + 1}_tooth_{arm + 1}',
            location=(x, 0.58 + math.cos(ang) * 0.055, math.sin(ang) * 0.055),
            scale=(0.018, 0.05, 0.018),
            rotation=(math.pi / 2, 0, ang),
            material=rubber,
            bevel=0.002,
        )
        tooth.parent = star_root
    for side, z in [('left', -0.34), ('right', 0.34)]:
        add_cube(f'bearing_block_{i + 1}_{side}', location=(x, 0.58, z), scale=(0.035, 0.03, 0.03), material=bearing, bevel=0.0015)
    add_torus(f'sprocket_{i + 1}', location=(x, 0.58, 0.37), major_radius=0.027, minor_radius=0.008, rotation=(0, 0, 0), material=chain)

# chain drive and motor
for i in range(7):
    add_cube(f'chain_span_{i + 1}', location=(-0.36 + i * 0.12, 0.58, 0.37), scale=(0.05, 0.01, 0.004), material=chain, bevel=0.0006)
add_cube('chain_guard', location=(0.0, 0.58, 0.43), scale=(0.56, 0.09, 0.03), material=stainless, bevel=0.001)
add_cube('motor_housing', location=(-0.62, 0.5, 0.41), scale=(0.09, 0.07, 0.06), material=bearing, bevel=0.002)
add_cylinder('motor_shaft', location=(-0.54, 0.58, 0.39), radius=0.01, depth=0.1, rotation=(0, math.pi / 2, 0), material=stainless, vertices=16)

apply_all_mesh_transforms()
export_glb(OUTPUT_PATH)
print(f'Exported {OUTPUT_PATH}')

import math
import os
import sys

sys.path.append(os.path.dirname(__file__))
from model_utils import *

OUTPUT_PATH = os.path.expanduser('~/repos/sorting-line-digital-twin/public/models/roller-singulation.glb')
clear_scene()

stainless = make_principled_material('Stainless', (0.84, 0.85, 0.86), metallic=0.92, roughness=0.16, brushed=True, noise_bump=0.008)
frame = make_principled_material('Frame', (0.73, 0.75, 0.77), metallic=0.65, roughness=0.28, brushed=True, noise_bump=0.008)
chain = make_principled_material('Chain', (0.19, 0.19, 0.18), metallic=0.8, roughness=0.38)

# frame
for name, loc, scale in [
    ('frame_left', (0, 0.32, -0.3), (0.62, 0.035, 0.025)),
    ('frame_right', (0, 0.32, 0.3), (0.62, 0.035, 0.025)),
    ('frame_base_left', (0, 0.08, -0.3), (0.62, 0.02, 0.02)),
    ('frame_base_right', (0, 0.08, 0.3), (0.62, 0.02, 0.02)),
]:
    add_cube(name, location=loc, scale=scale, material=frame, bevel=0.002)
for i, pos in enumerate([(-0.56, 0.16, -0.3), (-0.56, 0.16, 0.3), (0.56, 0.16, -0.3), (0.56, 0.16, 0.3)], 1):
    add_cube(f'frame_leg_{i}', location=pos, scale=(0.025, 0.16, 0.025), material=frame, bevel=0.0015)

roller_count = 14
for i in range(roller_count):
    t = i / (roller_count - 1)
    z = -0.28 + t * 0.56
    yaw = math.radians(-8 + t * 16)
    add_cylinder(f'roller_{i + 1}', location=(0, 0.45, z), radius=0.025, depth=1.18, rotation=(math.pi / 2, yaw, 0), material=stainless, vertices=28)
    add_cube(f'bearing_block_{i + 1}_left', location=(-0.61, 0.45, z), scale=(0.03, 0.03, 0.028), material=frame, bevel=0.001)
    add_cube(f'bearing_block_{i + 1}_right', location=(0.61, 0.45, z), scale=(0.03, 0.03, 0.028), material=frame, bevel=0.001)
    add_torus(f'sprocket_{i + 1}', location=(0.64, 0.45, z), major_radius=0.018, minor_radius=0.005, rotation=(0, math.pi / 2, 0), material=chain)

for i in range(roller_count - 1):
    z = -0.26 + i * (0.52 / (roller_count - 2))
    add_cube(f'chain_link_{i + 1}', location=(0.64, 0.45, z), scale=(0.008, 0.01, 0.035), material=chain, bevel=0.0006)

add_cube('motor_housing', location=(0.77, 0.39, 0.34), scale=(0.08, 0.06, 0.05), material=chain, bevel=0.002)
add_cylinder('motor_shaft', location=(0.69, 0.45, 0.3), radius=0.009, depth=0.08, rotation=(0, math.pi / 2, 0), material=stainless, vertices=16)

# exit guides
add_cube('guide_left', location=(0.62, 0.56, -0.12), scale=(0.18, 0.04, 0.008), rotation=(0, 0, math.radians(28)), material=frame, bevel=0.001)
add_cube('guide_center', location=(0.7, 0.56, 0.0), scale=(0.24, 0.04, 0.008), rotation=(0, 0, 0), material=frame, bevel=0.001)
add_cube('guide_right', location=(0.62, 0.56, 0.12), scale=(0.18, 0.04, 0.008), rotation=(0, 0, math.radians(-28)), material=frame, bevel=0.001)

apply_all_mesh_transforms()
export_glb(OUTPUT_PATH)
print(f'Exported {OUTPUT_PATH}')

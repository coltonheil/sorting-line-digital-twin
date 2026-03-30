import math
import os
import sys

sys.path.append(os.path.dirname(__file__))
from model_utils import *

OUTPUT_PATH = os.path.expanduser('~/repos/sorting-line-digital-twin/public/models/infeed-conveyor.glb')
clear_scene()

stainless = make_principled_material('Stainless', (0.82, 0.84, 0.85), metallic=0.86, roughness=0.24, brushed=True, noise_bump=0.008)
green_belt = make_principled_material('GreenBelt', (0.15, 0.28, 0.18), metallic=0.0, roughness=0.78)
dark = make_principled_material('Motor', (0.14, 0.14, 0.15), metallic=0.25, roughness=0.6)

add_cube('belt', location=(0, 0.18, 0), scale=(0.4, 0.04, 0.18), material=green_belt, bevel=0.002)
add_cylinder('head_roller', location=(0.37, 0.18, 0), radius=0.038, depth=0.36, rotation=(math.pi / 2, 0, 0), material=stainless, vertices=28)
add_cylinder('tail_roller', location=(-0.37, 0.18, 0), radius=0.038, depth=0.36, rotation=(math.pi / 2, 0, 0), material=stainless, vertices=28)
for side, z in [('left', -0.2), ('right', 0.2)]:
    add_cube(f'side_rail_{side}', location=(0, 0.24, z), scale=(0.42, 0.03, 0.02), material=stainless, bevel=0.0015)

for i, pos in enumerate([(-0.3, 0.18, -0.18), (-0.3, 0.18, 0.18), (0.3, 0.18, -0.18), (0.3, 0.18, 0.18)], 1):
    add_cube(f'leg_{i}', location=pos, scale=(0.025, 0.18, 0.025), material=stainless, bevel=0.001)

add_cube('motor_housing', location=(0.0, 0.06, -0.26), scale=(0.08, 0.05, 0.05), material=dark, bevel=0.002)
add_cylinder('motor_shaft', location=(0.17, 0.11, -0.18), radius=0.01, depth=0.16, rotation=(0, math.pi / 2, 0), material=stainless, vertices=16)

add_cube('transition_funnel', location=(0.55, 0.15, 0), scale=(0.18, 0.025, 0.14), rotation=(0, 0, math.radians(-12)), material=stainless, bevel=0.0015)
add_cube('funnel_wall_left', location=(0.55, 0.21, -0.12), scale=(0.16, 0.05, 0.01), rotation=(0, 0, math.radians(-12)), material=stainless, bevel=0.001)
add_cube('funnel_wall_right', location=(0.55, 0.21, 0.12), scale=(0.16, 0.05, 0.01), rotation=(0, 0, math.radians(-12)), material=stainless, bevel=0.001)

apply_all_mesh_transforms()
export_glb(OUTPUT_PATH)
print(f'Exported {OUTPUT_PATH}')

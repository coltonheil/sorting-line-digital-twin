import math
import os
import sys

sys.path.append(os.path.dirname(__file__))
from model_utils import *

OUTPUT_PATH = os.path.expanduser('~/repos/sorting-line-digital-twin/public/models/belt-elevator.glb')
clear_scene()

frame = make_principled_material('Frame', (0.23, 0.25, 0.28), metallic=0.3, roughness=0.55)
rubber = make_principled_material('Belt', (0.08, 0.09, 0.08), metallic=0.0, roughness=0.8)
steel = make_principled_material('Steel', (0.72, 0.74, 0.76), metallic=0.85, roughness=0.22, brushed=True, noise_bump=0.008)

incline = math.radians(30)
length = 2.438
belt_y = 0.9

add_cube('main_belt', location=(0, belt_y, 0), scale=(length / 2, 0.05, 0.23), rotation=(0, 0, incline), material=rubber, bevel=0.002)
for i in range(10):
    t = -1.08 + i * 0.24
    x = t * math.cos(incline)
    y = belt_y + t * math.sin(incline)
    add_cube(f'belt_cleat_{i + 1}', location=(x, y + 0.03, 0), scale=(0.03, 0.03, 0.235), rotation=(0, 0, incline), material=frame, bevel=0.001)

head_pos = (1.055, 1.51, 0)
tail_pos = (-1.055, 0.29, 0)
add_cylinder('head_drum', location=head_pos, radius=0.052, depth=0.5, rotation=(math.pi / 2, 0, 0), material=steel, vertices=32)
add_cylinder('tail_drum', location=tail_pos, radius=0.052, depth=0.5, rotation=(math.pi / 2, 0, 0), material=steel, vertices=32)

for side, z in [('left', -0.3), ('right', 0.3)]:
    add_cube(f'side_rail_{side}', location=(0, belt_y, z), scale=(length / 2, 0.06, 0.025), rotation=(0, 0, incline), material=frame, bevel=0.002)
    add_cube(f'rail_flange_{side}', location=(0, belt_y + 0.09, z), scale=(length / 2, 0.02, 0.01), rotation=(0, 0, incline), material=frame, bevel=0.001)

# support legs
leg_points = [(-0.8, 0.44, -0.28), (-0.8, 0.44, 0.28), (0.48, 1.16, -0.28), (0.48, 1.16, 0.28)]
for i, pos in enumerate(leg_points, 1):
    add_cube(f'leg_{i}', location=pos, scale=(0.03, pos[1], 0.03), material=frame, bevel=0.0015)
    add_cube(f'foot_plate_{i}', location=(pos[0], 0.01, pos[2]), scale=(0.05, 0.01, 0.05), material=frame, bevel=0.001)

for i, (x, y) in enumerate([(-0.8, 0.88), (0.48, 1.55)], 1):
    add_cube(f'cross_tie_{i}', location=(x, y, 0), scale=(0.03, 0.03, 0.3), material=frame, bevel=0.001)

# underside frame and tensioner
add_cube('underside_rail_left', location=(0, belt_y - 0.14, -0.22), scale=(length / 2, 0.02, 0.02), rotation=(0, 0, incline), material=frame, bevel=0.001)
add_cube('underside_rail_right', location=(0, belt_y - 0.14, 0.22), scale=(length / 2, 0.02, 0.02), rotation=(0, 0, incline), material=frame, bevel=0.001)
add_cube('tensioner_block_left', location=(-1.12, 0.25, -0.24), scale=(0.06, 0.035, 0.03), material=steel, bevel=0.001)
add_cube('tensioner_block_right', location=(-1.12, 0.25, 0.24), scale=(0.06, 0.035, 0.03), material=steel, bevel=0.001)
add_cylinder('tensioner_screw_left', location=(-1.2, 0.25, -0.24), radius=0.01, depth=0.12, rotation=(0, math.pi / 2, 0), material=steel, vertices=16)
add_cylinder('tensioner_screw_right', location=(-1.2, 0.25, 0.24), radius=0.01, depth=0.12, rotation=(0, math.pi / 2, 0), material=steel, vertices=16)

# motor and gearbox
add_cube('motor_housing', location=(1.22, 1.54, -0.18), scale=(0.14, 0.1, 0.08), material=frame, bevel=0.003)
add_cylinder('gearbox', location=(1.08, 1.54, -0.18), radius=0.05, depth=0.12, rotation=(0, math.pi / 2, 0), material=steel, vertices=24)
add_cylinder('drive_shaft', location=(1.02, 1.53, 0), radius=0.014, depth=0.18, rotation=(0, math.pi / 2, 0), material=steel, vertices=18)

apply_all_mesh_transforms()
export_glb(OUTPUT_PATH)
print(f'Exported {OUTPUT_PATH}')

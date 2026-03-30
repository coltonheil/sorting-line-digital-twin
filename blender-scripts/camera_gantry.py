import math
import os
import sys

sys.path.append(os.path.dirname(__file__))
from model_utils import *

OUTPUT_PATH = os.path.expanduser('~/repos/sorting-line-digital-twin/public/models/camera-gantry.glb')
clear_scene()

aluminum = make_principled_material('Aluminum', (0.79, 0.81, 0.83), metallic=0.78, roughness=0.24, brushed=True, noise_bump=0.008)
white_rubber = make_principled_material('WhiteBelt', (0.93, 0.93, 0.91), metallic=0.0, roughness=0.72)
dark = make_principled_material('DarkPlastic', (0.14, 0.15, 0.17), metallic=0.15, roughness=0.42)
light = make_principled_material('RingLight', (0.98, 0.99, 1.0), metallic=0.0, roughness=0.2, emission=(1.0, 1.0, 1.0), emission_strength=2.6)
red = make_principled_material('RedLED', (0.9, 0.1, 0.1), emission=(0.95, 0.1, 0.1), emission_strength=1.6, roughness=0.2)

# conveyor
add_cube('belt', location=(0, 0.2, 0), scale=(0.46, 0.04, 0.18), material=white_rubber, bevel=0.002)
add_cylinder('head_roller', location=(0.43, 0.2, 0), radius=0.038, depth=0.38, rotation=(math.pi / 2, 0, 0), material=aluminum, vertices=28)
add_cylinder('tail_roller', location=(-0.43, 0.2, 0), radius=0.038, depth=0.38, rotation=(math.pi / 2, 0, 0), material=aluminum, vertices=28)
for side, z in [('left', -0.2), ('right', 0.2)]:
    add_cube(f'side_rail_{side}', location=(0, 0.25, z), scale=(0.48, 0.03, 0.02), material=aluminum, bevel=0.0015)

# gantry extrusion
for i, pos in enumerate([(-0.34, 0.58, -0.2), (-0.34, 0.58, 0.2), (0.34, 0.58, -0.2), (0.34, 0.58, 0.2)], 1):
    add_cube(f'leg_{i}', location=pos, scale=(0.02, 0.58, 0.02), material=aluminum, bevel=0.001)
add_cube('crossbar_front', location=(0, 1.16, 0.2), scale=(0.38, 0.02, 0.02), material=aluminum, bevel=0.001)
add_cube('crossbar_back', location=(0, 1.16, -0.2), scale=(0.38, 0.02, 0.02), material=aluminum, bevel=0.001)
add_cube('crossbar_top', location=(0, 1.18, 0), scale=(0.38, 0.02, 0.18), material=aluminum, bevel=0.001)

# camera and light
add_cube('camera_body', location=(0, 1.0, 0), scale=(0.038, 0.05, 0.05), material=dark, bevel=0.002)
add_cylinder('camera_lens', location=(0, 0.94, 0), radius=0.022, depth=0.02, material=dark, vertices=24)
add_torus('ring_light', location=(0, 0.9, 0), major_radius=0.1, minor_radius=0.02, rotation=(math.pi / 2, 0, 0), material=light)

# sensor and controls
add_cylinder('photoeye_sensor', location=(-0.2, 0.28, 0.24), radius=0.013, depth=0.05, rotation=(0, 0, math.pi / 2), material=dark, vertices=18)
add_uv_sphere('photoeye_led', location=(-0.17, 0.28, 0.24), radius=0.005, material=red)
add_cube('junction_box', location=(0.34, 0.62, -0.24), scale=(0.04, 0.05, 0.025), material=dark, bevel=0.0015)

# cable bundle
for i in range(4):
    add_cylinder(f'cable_{i + 1}', location=(0.02 * i - 0.03, 1.08 + i * 0.03, -0.08), radius=0.004, depth=0.18, rotation=(math.pi / 4, 0, math.pi / 3), material=dark, vertices=10)

apply_all_mesh_transforms()
export_glb(OUTPUT_PATH)
print(f'Exported {OUTPUT_PATH}')

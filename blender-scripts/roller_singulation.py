import math
import os
import sys

import bpy

sys.path.append(os.path.dirname(__file__))
from model_utils import clear_scene, make_principled_material, add_cube, add_cylinder, add_torus, export_glb, apply_all_mesh_transforms

OUTPUT_PATH = os.path.expanduser('~/repos/sorting-line-digital-twin/public/models/roller-singulation.glb')

clear_scene()

LENGTH = 1.22
WIDTH = 0.67
HEIGHT = 0.91
ROLLER_COUNT = 14
ROLLER_RADIUS = 0.025
ROLLER_LENGTH = WIDTH
START_GAP = 0.013
END_GAP = 0.05

roller_mat = make_principled_material('Roller', (0.87, 0.88, 0.89), metallic=0.9, roughness=0.15, brushed=True, noise_bump=0.004)
frame_mat = make_principled_material('Frame', (0.75, 0.76, 0.78), metallic=0.78, roughness=0.3, brushed=True, noise_bump=0.01)
channel_mat = make_principled_material('Channel', (0.8, 0.82, 0.84), metallic=0.86, roughness=0.24, brushed=True, noise_bump=0.006)
chain_mat = make_principled_material('Chain', (0.16, 0.15, 0.13), metallic=0.82, roughness=0.48, noise_bump=0.01)
bearing_mat = make_principled_material('Bearing', (0.24, 0.25, 0.27), metallic=0.28, roughness=0.62, noise_bump=0.01)


def gap_for_pair(index):
    t = index / (ROLLER_COUNT - 2)
    return START_GAP + (END_GAP - START_GAP) * t


# frame rails and legs
rail_y = 0.67
base_y = 0.1
side_z = WIDTH * 0.5 + 0.035
end_x = LENGTH * 0.5
for name, loc, scale in [
    ('top_left', (0, rail_y, -side_z), (LENGTH * 0.5, 0.022, 0.018)),
    ('top_right', (0, rail_y, side_z), (LENGTH * 0.5, 0.022, 0.018)),
    ('base_left', (0, base_y, -side_z), (LENGTH * 0.5, 0.018, 0.016)),
    ('base_right', (0, base_y, side_z), (LENGTH * 0.5, 0.018, 0.016)),
    ('front_cross', (-end_x, rail_y, 0), (0.018, 0.022, WIDTH * 0.56)),
    ('rear_cross', (end_x, rail_y, 0), (0.018, 0.022, WIDTH * 0.56)),
    ('base_front_cross', (-end_x, base_y, 0), (0.018, 0.018, WIDTH * 0.56)),
    ('base_rear_cross', (end_x, base_y, 0), (0.018, 0.018, WIDTH * 0.56)),
]:
    add_cube(name, location=loc, scale=scale, material=frame_mat, bevel=0.002)

for i, loc in enumerate([
    (-end_x, HEIGHT * 0.5, -side_z),
    (-end_x, HEIGHT * 0.5, side_z),
    (end_x, HEIGHT * 0.5, -side_z),
    (end_x, HEIGHT * 0.5, side_z),
]):
    add_cube(f'leg_{i}', location=loc, scale=(0.018, HEIGHT * 0.5, 0.018), material=frame_mat, bevel=0.002)

# side lips
add_cube('side_lip_left', location=(0, rail_y + 0.045, -side_z + 0.01), scale=(LENGTH * 0.5, 0.03, 0.004), material=frame_mat, bevel=0.001)
add_cube('side_lip_right', location=(0, rail_y + 0.045, side_z - 0.01), scale=(LENGTH * 0.5, 0.03, 0.004), material=frame_mat, bevel=0.001)

# rollers laid out along x with diverging gaps
centers = []
x = -LENGTH * 0.5 + 0.09
centers.append(x)
for i in range(ROLLER_COUNT - 1):
    x += ROLLER_RADIUS * 2 + gap_for_pair(i)
    centers.append(x)

roller_y = rail_y + 0.06
drive_z = side_z + 0.06
for i, cx in enumerate(centers):
    add_cylinder(
        f'roller_{i}',
        location=(cx, roller_y, 0),
        radius=ROLLER_RADIUS,
        depth=ROLLER_LENGTH,
        rotation=(math.pi / 2, 0, 0),
        vertices=28,
        material=roller_mat,
    )
    add_cube(f'bearing_left_{i}', location=(cx, roller_y, -side_z), scale=(0.022, 0.022, 0.024), material=bearing_mat, bevel=0.001)
    add_cube(f'bearing_right_{i}', location=(cx, roller_y, side_z), scale=(0.022, 0.022, 0.024), material=bearing_mat, bevel=0.001)
    add_torus(f'sprocket_{i}', location=(cx, roller_y, drive_z), major_radius=0.016, minor_radius=0.0045, rotation=(0, math.pi / 2, 0), material=chain_mat)

for i in range(ROLLER_COUNT - 1):
    cx = (centers[i] + centers[i + 1]) * 0.5
    span = abs(centers[i + 1] - centers[i]) * 0.5
    add_cube(f'chain_span_{i}', location=(cx, roller_y, drive_z), scale=(span, 0.005, 0.004), material=chain_mat, bevel=0.0005)

add_cube('motor_body', location=(centers[-1] + 0.11, roller_y - 0.04, drive_z), scale=(0.07, 0.06, 0.05), material=bearing_mat, bevel=0.002)
add_cylinder('motor_shaft', location=(centers[-1] + 0.045, roller_y, drive_z), radius=0.008, depth=0.08, rotation=(0, math.pi / 2, 0), vertices=18, material=roller_mat)

# V channels below, visible through gaps and converging toward exit
channel_y = 0.46
for idx, (x_loc, z_loc, yaw) in enumerate([
    (0.11, -0.18, math.radians(10)),
    (0.2, 0.0, 0.0),
    (0.11, 0.18, math.radians(-10)),
]):
    left_wall = add_cube(f'channel_{idx}_left', location=(x_loc, channel_y, z_loc - 0.035), scale=(0.28, 0.008, 0.11), rotation=(math.radians(0), yaw, math.radians(27)), material=channel_mat, bevel=0.001)
    right_wall = add_cube(f'channel_{idx}_right', location=(x_loc, channel_y, z_loc + 0.035), scale=(0.28, 0.008, 0.11), rotation=(math.radians(0), yaw, math.radians(-27)), material=channel_mat, bevel=0.001)
    add_cube(f'channel_{idx}_spine', location=(x_loc + 0.01, channel_y - 0.06, z_loc), scale=(0.27, 0.006, 0.012), rotation=(0, yaw, 0), material=channel_mat, bevel=0.0008)

# guide exit collector
add_cube('collector_left', location=(0.46, 0.4, -0.12), scale=(0.17, 0.03, 0.01), rotation=(0, 0, math.radians(20)), material=channel_mat, bevel=0.001)
add_cube('collector_center', location=(0.5, 0.39, 0), scale=(0.18, 0.03, 0.01), material=channel_mat, bevel=0.001)
add_cube('collector_right', location=(0.46, 0.4, 0.12), scale=(0.17, 0.03, 0.01), rotation=(0, 0, math.radians(-20)), material=channel_mat, bevel=0.001)

apply_all_mesh_transforms()
export_glb(OUTPUT_PATH)
print(f'Exported {OUTPUT_PATH}')

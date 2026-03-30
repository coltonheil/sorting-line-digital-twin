import bpy
import math
import os
import sys

sys.path.append(os.path.dirname(__file__))
from model_utils import *

OUTPUT_PATH = os.path.expanduser('~/repos/sorting-line-digital-twin/public/models/rotary-tray-sorter.glb')

clear_scene()

stainless = make_principled_material('Stainless', (0.88, 0.89, 0.9), metallic=0.9, roughness=0.15, brushed=True, noise_bump=0.01)
white_frame = make_principled_material('WhiteFrame', (0.96, 0.97, 0.98), metallic=0.25, roughness=0.4)
aluminum = make_principled_material('Aluminum', (0.66, 0.71, 0.78), metallic=0.72, roughness=0.28, brushed=True, noise_bump=0.01)
guard = make_principled_material('Polycarbonate', (0.78, 0.9, 0.84), metallic=0.0, roughness=0.08, transmission=0.92, ior=1.49, alpha=0.28)
panel = make_principled_material('Panel', (0.74, 0.76, 0.78), metallic=0.75, roughness=0.22, brushed=True, noise_bump=0.008)
screen = make_principled_material('Screen', (0.06, 0.08, 0.1), metallic=0.0, roughness=0.15)
rubber = make_principled_material('Rubber', (0.1, 0.1, 0.11), metallic=0.0, roughness=0.8)

tray_count = 28
ring_major = 0.55
ring_minor = 0.03
carousel_y = 0.98
ring_radius_for_trays = 0.58

# Base frame
add_cube('base_plate', location=(0, 0.08, 0), scale=(0.34, 0.08, 0.34), material=white_frame, bevel=0.004)
add_cylinder('center_hub', location=(0, 0.78, 0), radius=0.102, depth=0.152, material=stainless, vertices=48, bevel=0.002)
add_cylinder('drive_shaft', location=(0, 0.48, 0), radius=0.036, depth=0.74, material=stainless, vertices=32)
add_cylinder('center_bearing', location=(0, 0.63, 0), radius=0.075, depth=0.09, material=aluminum, vertices=32)

leg_positions = [(-0.42, 0.46, -0.42), (-0.42, 0.46, 0.42), (0.42, 0.46, -0.42), (0.42, 0.46, 0.42)]
for i, pos in enumerate(leg_positions, 1):
    add_cube(f'frame_leg_{i}', location=pos, scale=(0.03, 0.46, 0.03), material=white_frame, bevel=0.003)
    add_cube(f'foot_plate_{i}', location=(pos[0], 0.01, pos[2]), scale=(0.06, 0.01, 0.06), material=white_frame, bevel=0.002)

for idx, z in enumerate((-0.42, 0.42), 1):
    add_cube(f'lower_rail_x_{idx}', location=(0, 0.24, z), scale=(0.42, 0.02, 0.02), material=white_frame, bevel=0.002)
    add_cube(f'upper_rail_x_{idx}', location=(0, 0.84, z), scale=(0.42, 0.02, 0.02), material=white_frame, bevel=0.002)
for idx, x in enumerate((-0.42, 0.42), 1):
    add_cube(f'lower_rail_z_{idx}', location=(x, 0.24, 0), scale=(0.02, 0.02, 0.42), material=white_frame, bevel=0.002)
    add_cube(f'upper_rail_z_{idx}', location=(x, 0.84, 0), scale=(0.02, 0.02, 0.42), material=white_frame, bevel=0.002)

brace_pairs = [
    ((-0.42, 0.36, -0.42), (-0.42, 0.74, 0.42)),
    ((0.42, 0.36, -0.42), (0.42, 0.74, 0.42)),
    ((-0.42, 0.36, 0.42), (-0.42, 0.74, -0.42)),
    ((0.42, 0.36, 0.42), (0.42, 0.74, -0.42)),
]
for i, (a, b) in enumerate(brace_pairs, 1):
    mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2)
    dx = b[0] - a[0]
    dy = b[1] - a[1]
    dz = b[2] - a[2]
    length = math.sqrt(dx * dx + dy * dy + dz * dz)
    rot_y = math.atan2(dx, dz)
    rot_x = math.atan2(dy, math.sqrt(dx * dx + dz * dz))
    add_cube(f'cross_brace_{i}', location=mid, scale=(0.012, length / 2, 0.012), rotation=(rot_x, rot_y, 0), material=white_frame, bevel=0.0015)

add_cube('drive_motor_housing', location=(0.0, 0.16, -0.27), scale=(0.12, 0.09, 0.08), material=rubber, bevel=0.005)
add_cylinder('motor_cap', location=(-0.14, 0.16, -0.27), radius=0.04, depth=0.08, rotation=(0, math.pi / 2, 0), material=aluminum, vertices=24)

# Rotating assembly
turntable = add_torus('turntable_mesh', location=(0, carousel_y, 0), major_radius=ring_major, minor_radius=ring_minor, rotation=(math.pi / 2, 0, 0), material=stainless)
add_cylinder('carousel_inner_ring', location=(0, carousel_y, 0), radius=0.43, depth=0.04, material=stainless, vertices=56)
add_torus('ring_top_rail', location=(0, carousel_y + 0.018, 0), major_radius=0.55, minor_radius=0.008, rotation=(math.pi / 2, 0, 0), material=stainless)
add_torus('ring_bottom_rail', location=(0, carousel_y - 0.018, 0), major_radius=0.55, minor_radius=0.008, rotation=(math.pi / 2, 0, 0), material=stainless)

# Tray prototype
tray_proto = add_cube('tray_proto', location=(0, 0, 0), scale=(0.075, 0.038, 0.045), material=stainless, bevel=0.004)
tray_left = add_cube('tray_side_left_proto', location=(0, 0.015, -0.035), scale=(0.075, 0.032, 0.0045), material=stainless, bevel=0.002)
tray_right = add_cube('tray_side_right_proto', location=(0, 0.015, 0.035), scale=(0.075, 0.032, 0.0045), material=stainless, bevel=0.002)
tray_back = add_cube('tray_back_proto', location=(-0.07, 0.018, 0), scale=(0.004, 0.028, 0.035), material=stainless, bevel=0.002)

outlet_indices = [0, 3, 7, 10, 14, 17, 21, 24]
for i in range(tray_count):
    angle = (i / tray_count) * math.tau
    x = math.cos(angle) * ring_radius_for_trays
    z = math.sin(angle) * ring_radius_for_trays
    rot_y = -angle + math.pi / 2

    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(x, carousel_y + 0.02, z), rotation=(0, rot_y, 0))
    pivot = bpy.context.active_object
    pivot.name = f'tray_pivot_{i + 1:02d}'

    tray = duplicate_linked(tray_proto, f'tray_{i + 1:02d}', location=(x + math.cos(angle) * 0.04, carousel_y + 0.02, z + math.sin(angle) * 0.04), rotation=(0, rot_y, 0))
    tray.parent = pivot
    left = duplicate_linked(tray_left, f'tray_{i + 1:02d}_side_left', location=(x + math.cos(angle) * 0.04, carousel_y + 0.035, z + math.sin(angle) * 0.04), rotation=(0, rot_y, 0))
    left.parent = pivot
    right = duplicate_linked(tray_right, f'tray_{i + 1:02d}_side_right', location=(x + math.cos(angle) * 0.04, carousel_y + 0.035, z + math.sin(angle) * 0.04), rotation=(0, rot_y, 0))
    right.parent = pivot
    back = duplicate_linked(tray_back, f'tray_{i + 1:02d}_back', location=(x + math.cos(angle) * 0.004, carousel_y + 0.038, z + math.sin(angle) * 0.004), rotation=(0, rot_y, 0))
    back.parent = pivot

    pin = add_cylinder(
        f'tray_pin_{i + 1:02d}',
        location=(x - math.cos(angle) * 0.03, carousel_y + 0.028, z - math.sin(angle) * 0.03),
        radius=0.008,
        depth=0.085,
        rotation=(math.pi / 2, 0, angle),
        vertices=18,
        material=aluminum,
    )
    pin.parent = pivot
    bracket = add_cube(
        f'tray_bracket_{i + 1:02d}',
        location=(x - math.cos(angle) * 0.015, carousel_y + 0.015, z - math.sin(angle) * 0.015),
        scale=(0.01, 0.02, 0.05),
        rotation=(0, rot_y, 0),
        material=stainless,
        bevel=0.0015,
    )
    bracket.parent = pivot

    if i in outlet_indices:
        chute_r = 0.84
        cx = math.cos(angle) * chute_r
        cz = math.sin(angle) * chute_r
        chute_rot = -angle + math.pi / 2
        add_cube(f'outlet_chute_{i + 1:02d}', location=(cx, 0.66, cz), scale=(0.2, 0.012, 0.08), rotation=(0.0, chute_rot, math.radians(45)), material=stainless, bevel=0.002)
        add_cube(f'outlet_lip_{i + 1:02d}', location=(cx, 0.69, cz), scale=(0.18, 0.006, 0.01), rotation=(0.0, chute_rot, math.radians(45)), material=stainless, bevel=0.001)
        cyl = add_cylinder(f'cylinder_body_{i + 1:02d}', location=(math.cos(angle) * 0.7, 0.86, math.sin(angle) * 0.7), radius=0.013, depth=0.1, rotation=(math.pi / 2, 0, angle), material=aluminum, vertices=18)
        rod = add_cylinder(f'cylinder_rod_{i + 1:02d}', location=(math.cos(angle) * 0.65, 0.88, math.sin(angle) * 0.65), radius=0.005, depth=0.08, rotation=(math.pi / 2, 0, angle), material=stainless, vertices=14)
        link = add_cube(f'linkage_arm_{i + 1:02d}', location=(math.cos(angle) * 0.62, 0.9, math.sin(angle) * 0.62), scale=(0.03, 0.004, 0.008), rotation=(0, rot_y, math.radians(20)), material=stainless, bevel=0.001)

# Remove prototypes from export
for proto in [tray_proto, tray_left, tray_right, tray_back]:
    bpy.data.objects.remove(proto, do_unlink=True)

# Infeed bridge
add_cube('infeed_chute', location=(-0.84, 1.03, 0), scale=(0.15, 0.012, 0.09), rotation=(0, 0, math.radians(12)), material=stainless, bevel=0.002)

# Control panel
add_cylinder('control_panel_post', location=(0.86, 0.72, -0.6), radius=0.018, depth=1.2, material=white_frame, vertices=16)
add_cube('control_panel', location=(0.86, 1.38, -0.6), scale=(0.15, 0.1, 0.075), rotation=(0, math.radians(-20), 0), material=panel, bevel=0.004)
add_cube('control_panel_screen', location=(0.915, 1.395, -0.58), scale=(0.055, 0.045, 0.006), rotation=(0, math.radians(-20), 0), material=screen, bevel=0.001)
for idx, color in enumerate(((0.2, 0.9, 0.3), (1.0, 0.82, 0.18), (0.95, 0.18, 0.18)), 1):
    lamp_mat = make_principled_material(f'Indicator{idx}', color, roughness=0.2, emission=color, emission_strength=1.0)
    add_uv_sphere(f'indicator_{idx}', location=(0.93, 1.34 + idx * 0.03, -0.66), radius=0.012, material=lamp_mat)

# Guard and standoffs
create_arc_guard('safety_guard', radius=0.72, height=0.32, thickness=0.01, start_angle_deg=-110, end_angle_deg=50, material=guard).location = (0, 1.03, 0)
for idx, ang in enumerate((-90, -40, 10, 40), 1):
    a = math.radians(ang)
    add_cylinder(f'guard_post_{idx}', location=(math.cos(a) * 0.7, 1.0, math.sin(a) * 0.7), radius=0.008, depth=0.22, material=aluminum, vertices=12)

apply_all_mesh_transforms()
export_glb(OUTPUT_PATH)
print(f'Exported {OUTPUT_PATH}')

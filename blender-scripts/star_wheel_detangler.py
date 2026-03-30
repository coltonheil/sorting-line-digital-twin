import math
import os
import sys

import bpy

sys.path.append(os.path.dirname(__file__))
from model_utils import clear_scene, make_principled_material, add_cube, add_cylinder, add_torus, export_glb, apply_all_mesh_transforms, shade_smooth

OUTPUT_PATH = os.path.expanduser('~/repos/sorting-line-digital-twin/public/models/star-wheel-detangler.glb')

clear_scene()

LENGTH = 1.07
WIDTH = 0.61
HEIGHT = 0.97
SHAFT_COUNT = 8
WHEELS_PER_SHAFT = 6
SHAFT_DIAMETER = 0.025
STAR_DIAMETER = 0.15
STAR_THICKNESS = 0.04
WHEEL_SPACING = 0.102

frame_mat = make_principled_material('Frame', (0.74, 0.76, 0.78), metallic=0.78, roughness=0.32, brushed=True, noise_bump=0.01)
shaft_mat = make_principled_material('Shaft', (0.85, 0.86, 0.87), metallic=0.95, roughness=0.17, brushed=True, noise_bump=0.006)
rubber_mat = make_principled_material('Rubber', (0.06, 0.06, 0.065), metallic=0.0, roughness=0.85, noise_bump=0.018)
bearing_mat = make_principled_material('Bearing', (0.2, 0.2, 0.22), metallic=0.25, roughness=0.7, noise_bump=0.01)
chain_mat = make_principled_material('Chain', (0.16, 0.15, 0.13), metallic=0.82, roughness=0.48, noise_bump=0.01)
motor_mat = make_principled_material('Motor', (0.23, 0.25, 0.27), metallic=0.4, roughness=0.58, noise_bump=0.01)


def deselect_all():
    bpy.ops.object.select_all(action='DESELECT')


def apply_modifier(obj, modifier_name):
    deselect_all()
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier_name)
    obj.select_set(False)


def create_open_box_frame():
    rail_y = 0.79
    lower_y = 0.15
    side_z = WIDTH * 0.5
    end_x = LENGTH * 0.5
    leg_height = HEIGHT * 0.5

    for name, loc, scale in [
        ('top_left_rail', (0, rail_y, -side_z), (LENGTH * 0.5, 0.025, 0.02)),
        ('top_right_rail', (0, rail_y, side_z), (LENGTH * 0.5, 0.025, 0.02)),
        ('bottom_left_rail', (0, lower_y, -side_z), (LENGTH * 0.5, 0.02, 0.018)),
        ('bottom_right_rail', (0, lower_y, side_z), (LENGTH * 0.5, 0.02, 0.018)),
        ('infeed_cross', (-end_x, rail_y, 0), (0.02, 0.025, WIDTH * 0.5)),
        ('outfeed_cross', (end_x, rail_y, 0), (0.02, 0.025, WIDTH * 0.5)),
        ('lower_infeed_cross', (-end_x, lower_y, 0), (0.02, 0.02, WIDTH * 0.5)),
        ('lower_outfeed_cross', (end_x, lower_y, 0), (0.02, 0.02, WIDTH * 0.5)),
    ]:
        add_cube(name, location=loc, scale=scale, material=frame_mat, bevel=0.002)

    for i, loc in enumerate([
        (-end_x, leg_height, -side_z),
        (-end_x, leg_height, side_z),
        (end_x, leg_height, -side_z),
        (end_x, leg_height, side_z),
    ]):
        add_cube(f'leg_{i}', location=loc, scale=(0.02, leg_height, 0.02), material=frame_mat, bevel=0.002)

    tray = add_cube('feed_tray', location=(-0.47, 0.72, 0), scale=(0.12, 0.012, WIDTH * 0.46), material=frame_mat, bevel=0.001)
    tray.data.materials.clear()
    tray.data.materials.append(frame_mat)



def create_star_mesh(name, location, rotation_x=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=0.025, depth=STAR_THICKNESS, location=location, rotation=(math.pi / 2, 0, 0))
    hub = bpy.context.active_object
    hub.name = name
    hub.data.materials.append(rubber_mat)

    for tooth in range(5):
        angle = tooth * (math.tau / 5)
        bpy.ops.mesh.primitive_cube_add(location=location)
        finger = bpy.context.active_object
        finger.name = f'{name}_finger_{tooth}'
        finger.scale = (0.015, 0.055, STAR_THICKNESS * 0.42)
        finger.location = (
            location[0],
            location[1] + math.cos(angle) * 0.045,
            location[2] + math.sin(angle) * 0.045,
        )
        finger.rotation_euler = (math.pi / 2, 0, angle)
        finger.data.materials.append(rubber_mat)

        tip_offset = (
            location[0],
            location[1] + math.cos(angle) * 0.073,
            location[2] + math.sin(angle) * 0.073,
        )
        bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=10, radius=0.012, location=tip_offset)
        tip = bpy.context.active_object
        tip.name = f'{name}_tip_{tooth}'
        tip.scale = (1.2, 0.9, 1.2)
        tip.data.materials.append(rubber_mat)
        shade_smooth(tip)

    objs = [obj for obj in bpy.context.scene.objects if obj.name == name or obj.name.startswith(f'{name}_')]
    deselect_all()
    for obj in objs:
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
    bpy.ops.object.join()
    star = bpy.context.active_object
    star.rotation_euler.x = rotation_x
    bevel = star.modifiers.new(name='Bevel', type='BEVEL')
    bevel.width = 0.0025
    bevel.segments = 2
    apply_modifier(star, bevel.name)
    subsurf = star.modifiers.new(name='Subsurf', type='SUBSURF')
    subsurf.levels = 1
    subsurf.render_levels = 1
    apply_modifier(star, subsurf.name)
    shade_smooth(star)
    return star



def make_chain_run(x_positions, z_pos, y_pos):
    for i, x in enumerate(x_positions):
        add_torus(f'chain_sprocket_ring_{i}', location=(x, y_pos, z_pos), major_radius=0.028, minor_radius=0.005, rotation=(0, math.pi / 2, 0), material=chain_mat)
    for i in range(len(x_positions) - 1):
        x_mid = (x_positions[i] + x_positions[i + 1]) * 0.5
        span = abs(x_positions[i + 1] - x_positions[i]) * 0.5
        add_cube(f'chain_segment_{i}', location=(x_mid, y_pos, z_pos), scale=(span, 0.006, 0.005), material=chain_mat, bevel=0.0006)


create_open_box_frame()

shaft_xs = [(-LENGTH * 0.38) + i * (LENGTH * 0.76 / (SHAFT_COUNT - 1)) for i in range(SHAFT_COUNT)]
wheel_zs = [(-WIDTH * 0.35) + i * WHEEL_SPACING for i in range(WHEELS_PER_SHAFT)]
shaft_y = 0.69

for shaft_index, x in enumerate(shaft_xs):
    add_cylinder(
        f'shaft_{shaft_index}',
        location=(x, shaft_y, 0),
        radius=SHAFT_DIAMETER * 0.5,
        depth=WIDTH + 0.08,
        rotation=(math.pi / 2, 0, 0),
        vertices=24,
        material=shaft_mat,
    )

    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(x, shaft_y, 0), rotation=(math.pi / 2, 0, 0))
    shaft_group = bpy.context.active_object
    shaft_group.name = f'shaft_group_{shaft_index}'

    shaft_phase = shaft_index * math.radians(18)
    for wheel_index, z in enumerate(wheel_zs):
        tooth_offset = wheel_index * math.radians(36) + shaft_phase
        star = create_star_mesh(f'star_{shaft_index}_{wheel_index}', (x, shaft_y, z), rotation_x=tooth_offset)
        star.parent = shaft_group

    for side_name, z_pos in [('left', -(WIDTH * 0.5 + 0.04)), ('right', WIDTH * 0.5 + 0.04)]:
        add_cube(f'bearing_{shaft_index}_{side_name}', location=(x, shaft_y, z_pos), scale=(0.035, 0.028, 0.03), material=bearing_mat, bevel=0.0015)

    drive_z = WIDTH * 0.5 + 0.075
    add_torus(f'drive_sprocket_{shaft_index}', location=(x, shaft_y, drive_z), major_radius=0.03, minor_radius=0.006, rotation=(0, math.pi / 2, 0), material=chain_mat)

make_chain_run(shaft_xs, WIDTH * 0.5 + 0.075, shaft_y)

# partial guard and motor
add_cube('chain_guard_back', location=(0.08, shaft_y + 0.06, WIDTH * 0.5 + 0.11), scale=(0.44, 0.06, 0.02), material=frame_mat, bevel=0.001)
add_cube('chain_guard_top', location=(0.08, shaft_y + 0.12, WIDTH * 0.5 + 0.07), scale=(0.44, 0.01, 0.06), material=frame_mat, bevel=0.001)
add_cube('motor_body', location=(-LENGTH * 0.5 - 0.12, 0.59, WIDTH * 0.5 + 0.09), scale=(0.09, 0.08, 0.06), material=motor_mat, bevel=0.003)
add_cylinder('motor_drive', location=(-LENGTH * 0.5 - 0.03, shaft_y, WIDTH * 0.5 + 0.09), radius=0.011, depth=0.12, rotation=(0, math.pi / 2, 0), vertices=20, material=shaft_mat)
add_cube('motor_mount', location=(-LENGTH * 0.5 - 0.09, 0.48, WIDTH * 0.5 + 0.09), scale=(0.06, 0.012, 0.05), material=frame_mat, bevel=0.001)

# visible root drop gaps / floor slats under shafts
for idx in range(4):
    add_cube(f'under_rail_{idx}', location=(-0.12 + idx * 0.22, 0.58, 0), scale=(0.07, 0.008, WIDTH * 0.42), material=frame_mat, bevel=0.0008)

# Rename shaft groups to match runtime expectations.
for shaft_index in range(SHAFT_COUNT):
    obj = bpy.data.objects[f'shaft_group_{shaft_index}']
    obj.name = f'star_wheel_shaft_{shaft_index}'

apply_all_mesh_transforms()
export_glb(OUTPUT_PATH)
print(f'Exported {OUTPUT_PATH}')

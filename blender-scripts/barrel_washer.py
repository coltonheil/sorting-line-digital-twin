import bpy
import math
import os
import sys

sys.path.append(os.path.dirname(__file__))
from model_utils import *

OUTPUT_PATH = os.path.expanduser('~/repos/sorting-line-digital-twin/public/models/barrel-washer.glb')

clear_scene()

stainless = make_principled_material('Stainless', (0.78, 0.79, 0.8), metallic=0.88, roughness=0.25, brushed=True, noise_bump=0.01)
frame_mat = make_principled_material('FrameDark', (0.2, 0.21, 0.23), metallic=0.2, roughness=0.72)
motor_mat = make_principled_material('Motor', (0.13, 0.13, 0.14), metallic=0.3, roughness=0.58)
chain_mat = make_principled_material('Chain', (0.18, 0.18, 0.17), metallic=0.75, roughness=0.42)
rubber = make_principled_material('RubberSeal', (0.05, 0.05, 0.055), metallic=0.0, roughness=0.88)
water = make_principled_material('Water', (0.55, 0.72, 0.82), metallic=0.0, roughness=0.08, transmission=0.15, alpha=0.8)

ft = 0.3048
radius = 2 * ft
length = 6 * ft
center_y = 1.28

# Drum with perforation-style material relief
bpy.ops.mesh.primitive_cylinder_add(vertices=84, radius=radius, depth=length, location=(0, center_y, 0), rotation=(0, math.pi / 2, 0))
drum = bpy.context.active_object
drum.name = 'drum_body'
solid = drum.modifiers.new(name='Solidify', type='SOLIDIFY')
solid.thickness = 0.028
bpy.context.view_layer.objects.active = drum
bpy.ops.object.modifier_apply(modifier=solid.name)

# radial ribs for more structure
for x in (-0.72, -0.24, 0.24, 0.72):
    add_torus(f'drum_rib_{str(x).replace("-", "m").replace(".", "_")}', location=(x, center_y, 0), major_radius=radius + 0.01, minor_radius=0.015, rotation=(0, math.pi / 2, 0), material=chain_mat)

# perforation bump / dark spotting
mat = bpy.data.materials.new('PerforatedSteel')
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
for node in list(nodes):
    nodes.remove(node)
out = nodes.new(type='ShaderNodeOutputMaterial')
out.location = (420, 0)
bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
bsdf.location = (100, 0)
bsdf.inputs['Base Color'].default_value = (0.76, 0.77, 0.78, 1.0)
bsdf.inputs['Metallic'].default_value = 0.9
bsdf.inputs['Roughness'].default_value = 0.24
texcoord = nodes.new(type='ShaderNodeTexCoord')
texcoord.location = (-920, 0)
mapping = nodes.new(type='ShaderNodeMapping')
mapping.location = (-720, 0)
mapping.inputs['Scale'].default_value = (12.0, 32.0, 32.0)
vor = nodes.new(type='ShaderNodeTexVoronoi')
vor.location = (-500, 40)
vor.feature = 'DISTANCE_TO_EDGE'
vor.inputs['Scale'].default_value = 26.0
ramp = nodes.new(type='ShaderNodeValToRGB')
ramp.location = (-260, 40)
ramp.color_ramp.elements[0].position = 0.08
ramp.color_ramp.elements[1].position = 0.14
bump = nodes.new(type='ShaderNodeBump')
bump.location = (-80, -120)
bump.inputs['Strength'].default_value = 0.03
mix = nodes.new(type='ShaderNodeMixRGB')
mix.location = (-80, 100)
mix.blend_type = 'MULTIPLY'
mix.inputs['Fac'].default_value = 0.2
base_rgb = nodes.new(type='ShaderNodeRGB')
base_rgb.location = (-280, 160)
base_rgb.outputs[0].default_value = (0.78, 0.79, 0.8, 1.0)
dark_rgb = nodes.new(type='ShaderNodeRGB')
dark_rgb.location = (-280, -20)
dark_rgb.outputs[0].default_value = (0.56, 0.57, 0.58, 1.0)
links.new(texcoord.outputs['Object'], mapping.inputs['Vector'])
links.new(mapping.outputs['Vector'], vor.inputs['Vector'])
links.new(vor.outputs['Distance'], ramp.inputs['Fac'])
links.new(ramp.outputs['Color'], bump.inputs['Height'])
links.new(base_rgb.outputs['Color'], mix.inputs['Color1'])
links.new(dark_rgb.outputs['Color'], mix.inputs['Color2'])
links.new(ramp.outputs['Color'], mix.inputs['Fac'])
links.new(mix.outputs['Color'], bsdf.inputs['Base Color'])
links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
drum.data.materials.append(mat)
shade_smooth(drum)

# rubber end rings
for side, x in [('left', -0.9), ('right', 0.9)]:
    add_torus(f'rubber_ring_{side}', location=(x, center_y, 0), major_radius=radius + 0.02, minor_radius=0.03, rotation=(0, math.pi / 2, 0), material=rubber)

# Frame and braces
for name, loc, scale in [
    ('frame_rail_front_top', (0, 0.72, 0.72), (1.08, 0.04, 0.04)),
    ('frame_rail_back_top', (0, 0.72, -0.72), (1.08, 0.04, 0.04)),
    ('frame_rail_front_low', (0, 0.24, 0.72), (1.08, 0.03, 0.03)),
    ('frame_rail_back_low', (0, 0.24, -0.72), (1.08, 0.03, 0.03)),
    ('frame_cross_left', (-0.96, 0.72, 0), (0.04, 0.04, 0.72)),
    ('frame_cross_right', (0.96, 0.72, 0), (0.04, 0.04, 0.72)),
]:
    add_cube(name, location=loc, scale=scale, material=frame_mat, bevel=0.002)

for i, pos in enumerate([(-0.92, 0.36, -0.64), (-0.92, 0.36, 0.64), (0.92, 0.36, -0.64), (0.92, 0.36, 0.64)], 1):
    add_cube(f'frame_leg_{i}', location=pos, scale=(0.04, 0.36, 0.04), material=frame_mat, bevel=0.002)
    add_cylinder(f'foot_pad_{i}', location=(pos[0], 0.01, pos[2]), radius=0.05, depth=0.02, material=frame_mat, vertices=16)

for i, (loc, rot) in enumerate([((-0.92, 0.42, 0), 0.72), ((0.92, 0.42, 0), -0.72)], 1):
    add_cube(f'cross_brace_{i}', location=loc, scale=(0.018, 0.018, 0.92), rotation=(rot, 0, 0), material=frame_mat, bevel=0.0015)

# Drain pan / trough
add_cube('drain_pan', location=(0, 0.19, 0), scale=(1.02, 0.04, 0.7), material=stainless, bevel=0.002)
add_cube('drain_pan_left_wall', location=(0, 0.27, -0.67), scale=(1.0, 0.05, 0.02), material=stainless, bevel=0.0015)
add_cube('drain_pan_right_wall', location=(0, 0.27, 0.67), scale=(1.0, 0.05, 0.02), material=stainless, bevel=0.0015)
add_cube('drain_pan_water', location=(0, 0.225, 0), scale=(0.95, 0.008, 0.6), material=water, bevel=0.001)

# Trough under drum
add_cube('drum_trough', location=(0.2, 0.84, 0), scale=(0.72, 0.025, 0.6), material=stainless, bevel=0.002)
add_cube('trough_lip_left', location=(0.2, 0.89, -0.57), scale=(0.7, 0.03, 0.015), material=stainless, bevel=0.001)
add_cube('trough_lip_right', location=(0.2, 0.89, 0.57), scale=(0.7, 0.03, 0.015), material=stainless, bevel=0.001)

# Improved output chute with bent lip look
add_cube('output_chute', location=(1.33, 0.92, 0), scale=(0.42, 0.022, 0.32), rotation=(0, 0, math.radians(-26)), material=stainless, bevel=0.002)
add_cube('output_chute_lip_left', location=(1.34, 1.02, -0.29), scale=(0.38, 0.06, 0.012), rotation=(0, 0, math.radians(-26)), material=stainless, bevel=0.0015)
add_cube('output_chute_lip_right', location=(1.34, 1.02, 0.29), scale=(0.38, 0.06, 0.012), rotation=(0, 0, math.radians(-26)), material=stainless, bevel=0.0015)
add_cube('output_chute_nose', location=(1.58, 0.8, 0), scale=(0.1, 0.012, 0.29), rotation=(0, 0, math.radians(-40)), material=stainless, bevel=0.001)

# Spray manifold and nozzles
add_cylinder('spray_manifold', location=(0, 2.12, 0), radius=0.032, depth=1.58, rotation=(math.pi / 2, 0, 0), material=stainless, vertices=24)
for i in range(5):
    z = -0.52 + i * 0.26
    add_cylinder(f'spray_nozzle_{i + 1}', location=(0.0, 2.02, z), radius=0.011, depth=0.18, material=stainless, vertices=14)
    add_cylinder(f'spray_tip_{i + 1}', location=(0.02, 1.93, z), radius=0.006, depth=0.05, rotation=(math.pi / 2, 0, 0), material=stainless, vertices=12)

# Motor housing with shaft and sprockets
add_cube('motor_housing', location=(-1.42, 0.48, 0.54), scale=(0.28, 0.22, 0.18), material=motor_mat, bevel=0.004)
add_cylinder('gearbox', location=(-1.15, 0.48, 0.54), radius=0.08, depth=0.32, rotation=(0, math.pi / 2, 0), material=motor_mat, vertices=24)
add_cylinder('drive_shaft', location=(-1.0, 0.88, 0.54), radius=0.016, depth=0.42, rotation=(0, math.pi / 2, 0), material=stainless, vertices=18)
add_torus('drum_sprocket', location=(-0.8, center_y, 0.54), major_radius=0.16, minor_radius=0.024, rotation=(0, math.pi / 2, 0), material=chain_mat)
add_torus('motor_sprocket', location=(-1.16, 0.48, 0.54), major_radius=0.1, minor_radius=0.02, rotation=(0, math.pi / 2, 0), material=chain_mat)
for idx, y in enumerate([0.58, 0.68, 0.78, 0.88, 0.98, 1.08]):
    add_cube(f'chain_link_{idx + 1}', location=(-0.98, y, 0.54), scale=(0.018, 0.075, 0.012), rotation=(0, 0, math.radians(86 - idx * 3)), material=chain_mat, bevel=0.0008)

apply_all_mesh_transforms()
export_glb(OUTPUT_PATH)
print(f'Exported {OUTPUT_PATH}')

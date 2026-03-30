import bpy
import math
import os
from mathutils import Vector

# Clear default scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.unit_settings.scale_length = 1.0

OUTPUT_PATH = os.path.expanduser('~/repos/sorting-line-digital-twin/public/models/barrel-washer.glb')


def apply_bevel(obj, width=0.01, segments=2):
    mod = obj.modifiers.new(name='Bevel', type='BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)


def shade_smooth(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    obj.select_set(False)


def make_principled_material(name, base_color, metallic=0.0, roughness=0.5, transmission=0.0, ior=1.45, alpha=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    for node in list(nodes):
        nodes.remove(node)

    out = nodes.new(type='ShaderNodeOutputMaterial')
    out.location = (300, 0)
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)
    bsdf.inputs['Base Color'].default_value = (*base_color, 1.0)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Transmission Weight'].default_value = transmission
    bsdf.inputs['IOR'].default_value = ior
    bsdf.inputs['Alpha'].default_value = alpha

    noise = nodes.new(type='ShaderNodeTexNoise')
    noise.location = (-700, 140)
    noise.inputs['Scale'].default_value = 38.0
    noise.inputs['Detail'].default_value = 8.0

    wave = nodes.new(type='ShaderNodeTexWave')
    wave.location = (-700, -80)
    wave.wave_type = 'BANDS'
    wave.bands_direction = 'X'
    wave.inputs['Scale'].default_value = 180.0
    wave.inputs['Distortion'].default_value = 2.0

    mix = nodes.new(type='ShaderNodeMixRGB')
    mix.location = (-420, 20)
    mix.blend_type = 'MULTIPLY'
    mix.inputs['Fac'].default_value = 0.25

    bump = nodes.new(type='ShaderNodeBump')
    bump.location = (-180, -100)
    bump.inputs['Strength'].default_value = 0.025

    links.new(noise.outputs['Fac'], mix.inputs['Color1'])
    links.new(wave.outputs['Color'], mix.inputs['Color2'])
    links.new(mix.outputs['Color'], bump.inputs['Height'])
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])

    if transmission > 0:
        mat.blend_method = 'BLEND'

    return mat


stainless = make_principled_material('StainlessSteel', (0.77, 0.78, 0.76), metallic=0.86, roughness=0.35)
frame_mat = make_principled_material('FramePaint', (0.18, 0.19, 0.21), metallic=0.18, roughness=0.72)
motor_mat = make_principled_material('MotorCast', (0.11, 0.11, 0.12), metallic=0.35, roughness=0.62)
chute_mat = make_principled_material('SheetSteel', (0.82, 0.83, 0.82), metallic=0.92, roughness=0.24)
chain_mat = make_principled_material('OilyMetal', (0.18, 0.18, 0.17), metallic=0.75, roughness=0.48)
water_mat = make_principled_material('WaterTint', (0.54, 0.72, 0.82), metallic=0.0, roughness=0.05, transmission=0.2)

# Dimensions in meters
ft = 0.3048
drum_radius = 2 * ft
drum_length = 6 * ft
frame_height = 2 * ft
frame_width = 1.45
frame_length = 2.2

# Drum shell
bpy.ops.mesh.primitive_cylinder_add(vertices=72, radius=drum_radius, depth=drum_length, location=(0, frame_height + drum_radius + 0.04, 0), rotation=(0, math.pi / 2, 0))
drum = bpy.context.active_object
drum.name = 'drum_body'
drum.data.materials.append(stainless)
solid = drum.modifiers.new(name='Solidify', type='SOLIDIFY')
solid.thickness = 0.035
wire = drum.modifiers.new(name='WireframeLook', type='WIREFRAME')
wire.thickness = 0.015
wire.use_replace = False
wire.use_even_offset = True
subd = drum.modifiers.new(name='Subd', type='SUBSURF')
subd.levels = 1
subd.render_levels = 1
for mod in [solid, wire, subd]:
    bpy.context.view_layer.objects.active = drum
    bpy.ops.object.modifier_apply(modifier=mod.name)
shade_smooth(drum)

# Support rings
for x in (-0.74, 0.74):
    bpy.ops.mesh.primitive_torus_add(major_radius=drum_radius + 0.035, minor_radius=0.03, major_segments=56, minor_segments=14, location=(x, frame_height + drum_radius + 0.04, 0), rotation=(0, math.pi / 2, 0))
    ring = bpy.context.active_object
    ring.name = f'drum_support_ring_{"left" if x < 0 else "right"}'
    ring.data.materials.append(chain_mat)
    shade_smooth(ring)

# Frame rails and legs
frame_parts = []
rail_specs = [
    ((0, frame_height + 0.12, -0.72), (frame_length, 0.08, 0.08), 'frame_rail_back'),
    ((0, frame_height + 0.12, 0.72), (frame_length, 0.08, 0.08), 'frame_rail_front'),
    ((0, 0.36, -0.72), (frame_length, 0.06, 0.06), 'frame_lower_back'),
    ((0, 0.36, 0.72), (frame_length, 0.06, 0.06), 'frame_lower_front'),
    ((-0.96, frame_height + 0.12, 0), (0.08, 0.08, 1.52), 'frame_cross_left'),
    ((0.96, frame_height + 0.12, 0), (0.08, 0.08, 1.52), 'frame_cross_right'),
]
for loc, scale, name in rail_specs:
    bpy.ops.mesh.primitive_cube_add(location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(frame_mat)
    apply_bevel(obj, 0.008, 2)
    frame_parts.append(obj)

leg_positions = [(-0.92, frame_height / 2, -0.64), (-0.92, frame_height / 2, 0.64), (0.92, frame_height / 2, -0.64), (0.92, frame_height / 2, 0.64)]
for i, pos in enumerate(leg_positions, 1):
    bpy.ops.mesh.primitive_cube_add(location=pos)
    leg = bpy.context.active_object
    leg.name = f'frame_leg_{i}'
    leg.scale = (0.05, frame_height / 2, 0.05)
    leg.data.materials.append(frame_mat)
    apply_bevel(leg, 0.008, 2)
    frame_parts.append(leg)

brace_data = [
    ((-0.92, 0.6, 0), (0.03, 0.03, 0.95), 0.7),
    ((0.92, 0.6, 0), (0.03, 0.03, 0.95), -0.7),
]
for idx, (loc, scale, rot) in enumerate(brace_data, 1):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=(rot, 0, 0))
    brace = bpy.context.active_object
    brace.name = f'cross_brace_{idx}'
    brace.scale = scale
    brace.data.materials.append(frame_mat)
    apply_bevel(brace, 0.006, 2)
    frame_parts.append(brace)

# Drain pan
bpy.ops.mesh.primitive_cube_add(location=(0, 0.24, 0))
drain = bpy.context.active_object
drain.name = 'drain_pan'
drain.scale = (1.0, 0.05, 0.72)
drain.data.materials.append(chute_mat)
apply_bevel(drain, 0.01, 2)

# Water sheen in pan
bpy.ops.mesh.primitive_cube_add(location=(0, 0.31, 0))
water = bpy.context.active_object
water.name = 'drain_water'
water.scale = (0.96, 0.01, 0.68)
water.data.materials.append(water_mat)
apply_bevel(water, 0.004, 1)

# Output chute
bpy.ops.mesh.primitive_cube_add(location=(1.32, frame_height + 0.33, 0), rotation=(0, 0, math.radians(-30)))
chute = bpy.context.active_object
chute.name = 'output_chute'
chute.scale = (0.48, 0.035, 0.36)
chute.data.materials.append(chute_mat)
apply_bevel(chute, 0.01, 2)

# Trough guide
bpy.ops.mesh.primitive_cube_add(location=(0.3, frame_height + 0.22, 0))
trough = bpy.context.active_object
trough.name = 'drum_trough'
trough.scale = (0.8, 0.05, 0.68)
trough.data.materials.append(chute_mat)
apply_bevel(trough, 0.01, 2)

# Spray manifold
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.04, depth=1.62, location=(0, frame_height + drum_radius * 2 + 0.18, 0), rotation=(math.pi / 2, 0, 0))
manifold = bpy.context.active_object
manifold.name = 'spray_manifold'
manifold.data.materials.append(stainless)
shade_smooth(manifold)

for i in range(5):
    z = -0.54 + i * 0.27
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.015, depth=0.26, location=(0.05 * math.sin(i), frame_height + drum_radius * 2 + 0.05, z))
    nozzle = bpy.context.active_object
    nozzle.name = f'spray_nozzle_{i+1}'
    nozzle.data.materials.append(stainless)
    shade_smooth(nozzle)

# Motor housing
bpy.ops.mesh.primitive_cube_add(location=(-1.42, 0.48, 0.54))
motor = bpy.context.active_object
motor.name = 'motor_housing'
motor.scale = (0.28, 0.22, 0.18)
motor.data.materials.append(motor_mat)
apply_bevel(motor, 0.02, 2)

bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.08, depth=0.34, location=(-1.13, 0.48, 0.54), rotation=(0, math.pi / 2, 0))
gearbox = bpy.context.active_object
gearbox.name = 'gearbox'
gearbox.data.materials.append(motor_mat)
shade_smooth(gearbox)

# Chain drive
bpy.ops.mesh.primitive_torus_add(major_radius=0.18, minor_radius=0.03, major_segments=32, minor_segments=12, location=(-0.96, frame_height + drum_radius + 0.04, 0.54), rotation=(0, math.pi / 2, 0))
drum_sprocket = bpy.context.active_object
drum_sprocket.name = 'drum_sprocket'
drum_sprocket.data.materials.append(chain_mat)
shade_smooth(drum_sprocket)

bpy.ops.mesh.primitive_torus_add(major_radius=0.11, minor_radius=0.024, major_segments=28, minor_segments=12, location=(-1.16, 0.48, 0.54), rotation=(0, math.pi / 2, 0))
motor_sprocket = bpy.context.active_object
motor_sprocket.name = 'motor_sprocket'
motor_sprocket.data.materials.append(chain_mat)
shade_smooth(motor_sprocket)

for idx, y in enumerate([0.62, 0.70, 0.78, 0.86, 0.94, 1.02]):
    bpy.ops.mesh.primitive_cube_add(location=(-1.06, y, 0.54), rotation=(0, 0, math.radians(90 - idx * 2)))
    link = bpy.context.active_object
    link.name = f'chain_link_{idx+1}'
    link.scale = (0.02, 0.09, 0.015)
    link.data.materials.append(chain_mat)
    apply_bevel(link, 0.003, 1)

# Feet pads
for i, (x, z) in enumerate([(-0.92, -0.64), (-0.92, 0.64), (0.92, -0.64), (0.92, 0.64)], 1):
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.06, depth=0.02, location=(x, 0.01, z))
    foot = bpy.context.active_object
    foot.name = f'foot_pad_{i}'
    foot.data.materials.append(frame_mat)
    shade_smooth(foot)

# Apply transforms
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        obj.select_set(False)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=OUTPUT_PATH, export_format='GLB', export_apply=True, export_texcoords=True, export_normals=True, export_materials='EXPORT', export_yup=True)
print(f'Exported {OUTPUT_PATH}')

import bpy
import math
import os

# Clear default scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.unit_settings.scale_length = 1.0

OUTPUT_PATH = os.path.expanduser('~/repos/sorting-line-digital-twin/public/models/rotary-tray-sorter.glb')


def shade_smooth(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    obj.select_set(False)


def apply_bevel(obj, width=0.008, segments=2):
    mod = obj.modifiers.new(name='Bevel', type='BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)


def make_material(name, base_color, metallic=0.0, roughness=0.5, transmission=0.0, ior=1.45, alpha=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    for node in list(nodes):
        nodes.remove(node)

    out = nodes.new(type='ShaderNodeOutputMaterial')
    out.location = (320, 0)
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)
    bsdf.inputs['Base Color'].default_value = (*base_color, 1.0)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Transmission Weight'].default_value = transmission
    bsdf.inputs['IOR'].default_value = ior
    bsdf.inputs['Alpha'].default_value = alpha

    noise = nodes.new(type='ShaderNodeTexNoise')
    noise.location = (-720, 90)
    noise.inputs['Scale'].default_value = 52.0
    noise.inputs['Detail'].default_value = 10.0

    bump = nodes.new(type='ShaderNodeBump')
    bump.location = (-180, -70)
    bump.inputs['Strength'].default_value = 0.02

    links.new(noise.outputs['Fac'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

    if transmission > 0:
        mat.blend_method = 'BLEND'

    return mat


stainless = make_material('FoodGradeSteel', (0.9, 0.91, 0.92), metallic=0.96, roughness=0.2)
frame_mat = make_material('PowderCoat', (0.92, 0.93, 0.94), metallic=0.2, roughness=0.5)
actuator_mat = make_material('AnodizedAluminum', (0.66, 0.70, 0.76), metallic=0.72, roughness=0.28)
guard_mat = make_material('Polycarbonate', (0.78, 0.88, 0.94), metallic=0.0, roughness=0.08, transmission=0.85, ior=1.5, alpha=0.35)
panel_mat = make_material('PanelSteel', (0.78, 0.79, 0.8), metallic=0.85, roughness=0.26)
screen_mat = make_material('ScreenDark', (0.04, 0.06, 0.08), metallic=0.15, roughness=0.08)
rubber_mat = make_material('RubberBlack', (0.08, 0.08, 0.09), metallic=0.0, roughness=0.72)

# Base
bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.95, depth=0.32, location=(0, 0.16, 0))
base = bpy.context.active_object
base.name = 'base_pedestal'
base.data.materials.append(frame_mat)
shade_smooth(base)

bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.42, depth=0.72, location=(0, 0.56, 0))
center_post = bpy.context.active_object
center_post.name = 'center_post'
center_post.data.materials.append(frame_mat)
shade_smooth(center_post)

bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.61, depth=0.08, location=(0, 0.96, 0))
turntable = bpy.context.active_object
turntable.name = 'turntable_mesh'
turntable.data.materials.append(stainless)
shade_smooth(turntable)

bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.78, depth=0.12, location=(0, 1.04, 0))
carousel = bpy.context.active_object
carousel.name = 'carousel_disc'
carousel.data.materials.append(stainless)
shade_smooth(carousel)

# Bearings and motor housing
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.2, depth=0.24, location=(0, 0.68, 0))
bearing = bpy.context.active_object
bearing.name = 'center_bearing'
bearing.data.materials.append(rubber_mat)
shade_smooth(bearing)

bpy.ops.mesh.primitive_cube_add(location=(0, 0.18, -0.62))
motor = bpy.context.active_object
motor.name = 'drive_motor_housing'
motor.scale = (0.24, 0.13, 0.16)
motor.data.materials.append(rubber_mat)
apply_bevel(motor, 0.012, 2)

tray_count = 28
tray_radius = 0.95
outlet_positions = {3, 6, 10, 13, 17, 20, 24, 27}

for i in range(tray_count):
    angle = (i / tray_count) * math.tau
    x = math.cos(angle) * tray_radius
    z = math.sin(angle) * tray_radius
    rot_y = -angle

    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(x, 1.08, z), rotation=(0, rot_y, 0))
    pivot = bpy.context.active_object
    pivot.name = f'tray_pivot_{i+1:02d}'

    bpy.ops.mesh.primitive_cube_add(location=(x + math.cos(angle) * 0.08, 1.08, z + math.sin(angle) * 0.08), rotation=(0, rot_y, 0))
    tray = bpy.context.active_object
    tray.name = f'tray_{i+1:02d}'
    tray.scale = (0.09, 0.03, 0.13)
    tray.data.materials.append(stainless)
    apply_bevel(tray, 0.006, 2)
    tray.parent = pivot

    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.012, depth=0.18, location=(x - math.cos(angle) * 0.02, 1.08, z - math.sin(angle) * 0.02), rotation=(math.pi / 2, 0, angle))
    hinge = bpy.context.active_object
    hinge.name = f'tray_hinge_{i+1:02d}'
    hinge.data.materials.append(actuator_mat)
    shade_smooth(hinge)
    hinge.parent = pivot

    if i in outlet_positions:
        chute_radius = 1.34
        chute_x = math.cos(angle) * chute_radius
        chute_z = math.sin(angle) * chute_radius
        
        bpy.ops.mesh.primitive_cube_add(location=(chute_x, 0.78, chute_z), rotation=(0.55, rot_y, 0))
        chute = bpy.context.active_object
        chute.name = f'outlet_chute_{i+1:02d}'
        chute.scale = (0.22, 0.025, 0.11)
        chute.data.materials.append(stainless)
        apply_bevel(chute, 0.006, 2)

        bpy.ops.mesh.primitive_cylinder_add(vertices=18, radius=0.03, depth=0.28, location=(math.cos(angle) * 1.12, 0.95, math.sin(angle) * 1.12), rotation=(math.pi / 2, 0, angle))
        actuator = bpy.context.active_object
        actuator.name = f'actuator_body_{i+1:02d}'
        actuator.data.materials.append(actuator_mat)
        shade_smooth(actuator)

        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.012, depth=0.16, location=(math.cos(angle) * 1.02, 1.02, math.sin(angle) * 1.02), rotation=(math.pi / 2, 0, angle))
        rod = bpy.context.active_object
        rod.name = f'actuator_rod_{i+1:02d}'
        rod.data.materials.append(stainless)
        shade_smooth(rod)

# Guard shield segments
for idx, start_deg in enumerate((20, 110, 205), 1):
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=1.18, depth=0.42, location=(0, 1.22, 0), rotation=(math.pi / 2, 0, 0), end_fill_type='NOTHING')
    shield = bpy.context.active_object
    shield.name = f'guard_segment_{idx}'
    shield.scale = (1, 1, 1)
    shield.data.materials.append(guard_mat)
    solid = shield.modifiers.new(name='Solidify', type='SOLIDIFY')
    solid.thickness = 0.012
    bpy.context.view_layer.objects.active = shield
    bpy.ops.object.modifier_apply(modifier=solid.name)
    shade_smooth(shield)
    shield.rotation_euler = (math.pi / 2, 0, math.radians(start_deg))
    
    # Cut each shield into partial arc by scaling in local X
    shield.scale = (0.62, 1.0, 1.0)
    bpy.context.view_layer.objects.active = shield
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# Infeed chute
bpy.ops.mesh.primitive_cube_add(location=(-1.25, 1.18, 0), rotation=(0.0, 0.0, math.radians(18)))
infeed = bpy.context.active_object
infeed.name = 'infeed_chute'
infeed.scale = (0.36, 0.03, 0.12)
infeed.data.materials.append(stainless)
apply_bevel(infeed, 0.006, 2)

# Control panel and post
bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.028, depth=1.25, location=(1.05, 0.7, -0.7))
panel_post = bpy.context.active_object
panel_post.name = 'control_panel_post'
panel_post.data.materials.append(frame_mat)
shade_smooth(panel_post)

bpy.ops.mesh.primitive_cube_add(location=(1.05, 1.38, -0.7), rotation=(0, math.radians(-18), 0))
panel = bpy.context.active_object
panel.name = 'control_panel'
panel.scale = (0.14, 0.12, 0.08)
panel.data.materials.append(panel_mat)
apply_bevel(panel, 0.01, 2)

bpy.ops.mesh.primitive_cube_add(location=(1.11, 1.4, -0.66), rotation=(0, math.radians(-18), 0))
screen = bpy.context.active_object
screen.name = 'control_panel_screen'
screen.scale = (0.06, 0.05, 0.01)
screen.data.materials.append(screen_mat)
apply_bevel(screen, 0.002, 1)

for idx, color in enumerate(((0.2, 0.9, 0.3), (0.95, 0.8, 0.18), (0.95, 0.18, 0.18)), 1):
    bulb_mat = make_material(f'Indicator_{idx}', color, metallic=0.0, roughness=0.15)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=9, radius=0.015, location=(1.13, 1.35 + idx * 0.035, -0.74))
    bulb = bpy.context.active_object
    bulb.name = f'indicator_light_{idx}'
    bulb.data.materials.append(bulb_mat)
    shade_smooth(bulb)

# Peripheral frame ring supports
for idx, angle in enumerate((0, math.pi / 2, math.pi, math.pi * 1.5), 1):
    bpy.ops.mesh.primitive_cube_add(location=(math.cos(angle) * 0.62, 0.58, math.sin(angle) * 0.62), rotation=(0, -angle, 0))
    support = bpy.context.active_object
    support.name = f'frame_support_{idx}'
    support.scale = (0.08, 0.34, 0.05)
    support.data.materials.append(frame_mat)
    apply_bevel(support, 0.008, 2)

# Apply transforms to meshes only
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        obj.select_set(False)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=OUTPUT_PATH, export_format='GLB', export_apply=True, export_texcoords=True, export_normals=True, export_materials='EXPORT', export_yup=True)
print(f'Exported {OUTPUT_PATH}')

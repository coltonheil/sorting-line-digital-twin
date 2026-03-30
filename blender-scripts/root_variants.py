import math
import os
import random
import sys

import bmesh
import bpy

sys.path.append(os.path.dirname(__file__))
from model_utils import clear_scene, export_glb

OUTPUT_DIR = os.path.expanduser('~/repos/sorting-line-digital-twin/public/models')

VARIANTS = [
    {
        'name': 'root-variant-1',
        'seed': 101,
        'length': 0.15,
        'base_radius': 0.017,
        'tip_radius': 0.006,
        'curve_amp': 0.012,
        'curve_phase': 0.4,
        'prongs': [
            {'anchor': 0.38, 'length': 0.055, 'angle': -0.95, 'yaw': 0.55, 'radius': 0.008},
            {'anchor': 0.66, 'length': 0.05, 'angle': 0.85, 'yaw': -0.35, 'radius': 0.007},
        ],
    },
    {
        'name': 'root-variant-2',
        'seed': 202,
        'length': 0.165,
        'base_radius': 0.019,
        'tip_radius': 0.006,
        'curve_amp': 0.016,
        'curve_phase': 1.2,
        'prongs': [
            {'anchor': 0.32, 'length': 0.06, 'angle': -1.1, 'yaw': 0.25, 'radius': 0.009},
            {'anchor': 0.58, 'length': 0.048, 'angle': 0.9, 'yaw': -0.8, 'radius': 0.007},
            {'anchor': 0.76, 'length': 0.035, 'angle': 0.55, 'yaw': 0.9, 'radius': 0.0055},
        ],
    },
    {
        'name': 'root-variant-3',
        'seed': 303,
        'length': 0.145,
        'base_radius': 0.015,
        'tip_radius': 0.0055,
        'curve_amp': 0.02,
        'curve_phase': 2.1,
        'prongs': [
            {'anchor': 0.42, 'length': 0.045, 'angle': -0.75, 'yaw': -0.6, 'radius': 0.0065},
            {'anchor': 0.63, 'length': 0.06, 'angle': 1.0, 'yaw': 0.7, 'radius': 0.0075},
            {'anchor': 0.7, 'length': 0.04, 'angle': -1.3, 'yaw': 1.5, 'radius': 0.005},
            {'anchor': 0.82, 'length': 0.028, 'angle': 0.65, 'yaw': -1.1, 'radius': 0.0045},
        ],
    },
    {
        'name': 'root-variant-4',
        'seed': 404,
        'length': 0.17,
        'base_radius': 0.018,
        'tip_radius': 0.007,
        'curve_amp': 0.01,
        'curve_phase': 3.0,
        'prongs': [
            {'anchor': 0.46, 'length': 0.07, 'angle': -0.9, 'yaw': 1.0, 'radius': 0.01},
            {'anchor': 0.54, 'length': 0.06, 'angle': 0.95, 'yaw': -0.9, 'radius': 0.009},
        ],
    },
    {
        'name': 'root-variant-5',
        'seed': 505,
        'length': 0.155,
        'base_radius': 0.02,
        'tip_radius': 0.006,
        'curve_amp': 0.014,
        'curve_phase': 4.2,
        'prongs': [
            {'anchor': 0.3, 'length': 0.045, 'angle': -0.7, 'yaw': -0.35, 'radius': 0.008},
            {'anchor': 0.52, 'length': 0.065, 'angle': 1.15, 'yaw': 0.55, 'radius': 0.0085},
            {'anchor': 0.72, 'length': 0.038, 'angle': -1.0, 'yaw': 1.2, 'radius': 0.005},
        ],
    },
]


def deselect_all():
    bpy.ops.object.select_all(action='DESELECT')


def apply_modifier(obj, name):
    bpy.context.view_layer.objects.active = obj
    deselect_all()
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=name)
    obj.select_set(False)



def make_root_material(name='GinsengRoot'):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    for node in list(nodes):
        nodes.remove(node)

    output = nodes.new(type='ShaderNodeOutputMaterial')
    output.location = (900, 0)
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.location = (620, 0)
    bsdf.inputs['Base Color'].default_value = (0.7686, 0.6588, 0.4196, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.75
    bsdf.inputs['Subsurface Weight'].default_value = 0.1
    bsdf.inputs['Subsurface Radius'].default_value = (1.0, 0.7, 0.45)

    texcoord = nodes.new(type='ShaderNodeTexCoord')
    texcoord.location = (-1050, 100)
    mapping = nodes.new(type='ShaderNodeMapping')
    mapping.location = (-860, 100)
    mapping.inputs['Scale'].default_value = (5.0, 30.0, 5.0)

    noise = nodes.new(type='ShaderNodeTexNoise')
    noise.location = (-650, 180)
    noise.inputs['Scale'].default_value = 12.0
    noise.inputs['Detail'].default_value = 9.0
    noise.inputs['Roughness'].default_value = 0.65

    wave = nodes.new(type='ShaderNodeTexWave')
    wave.location = (-650, -40)
    wave.wave_type = 'BANDS'
    wave.bands_direction = 'Y'
    wave.inputs['Scale'].default_value = 35.0
    wave.inputs['Distortion'].default_value = 3.5
    wave.inputs['Detail'].default_value = 3.0
    wave.inputs['Detail Scale'].default_value = 2.0

    mix = nodes.new(type='ShaderNodeMixRGB')
    mix.location = (-360, 50)
    mix.blend_type = 'MULTIPLY'
    mix.inputs['Fac'].default_value = 0.45

    darken = nodes.new(type='ShaderNodeBrightContrast')
    darken.location = (-120, 80)
    darken.inputs['Bright'].default_value = -0.05
    darken.inputs['Contrast'].default_value = 0.35

    bump_noise = nodes.new(type='ShaderNodeBump')
    bump_noise.location = (260, 120)
    bump_noise.inputs['Strength'].default_value = 0.12
    bump_noise.inputs['Distance'].default_value = 0.02

    bump_rings = nodes.new(type='ShaderNodeBump')
    bump_rings.location = (420, -50)
    bump_rings.inputs['Strength'].default_value = 0.05
    bump_rings.inputs['Distance'].default_value = 0.01

    color_ramp = nodes.new(type='ShaderNodeValToRGB')
    color_ramp.location = (120, -100)
    color_ramp.color_ramp.elements[0].position = 0.35
    color_ramp.color_ramp.elements[0].color = (0.25, 0.22, 0.16, 1.0)
    color_ramp.color_ramp.elements[1].position = 0.78
    color_ramp.color_ramp.elements[1].color = (0.85, 0.8, 0.62, 1.0)

    links.new(texcoord.outputs['Object'], mapping.inputs['Vector'])
    links.new(mapping.outputs['Vector'], noise.inputs['Vector'])
    links.new(mapping.outputs['Vector'], wave.inputs['Vector'])
    links.new(noise.outputs['Fac'], mix.inputs['Color1'])
    links.new(wave.outputs['Color'], mix.inputs['Color2'])
    links.new(mix.outputs['Color'], darken.inputs['Color'])
    links.new(darken.outputs['Color'], bsdf.inputs['Base Color'])
    links.new(noise.outputs['Fac'], bump_noise.inputs['Height'])
    links.new(wave.outputs['Color'], color_ramp.inputs['Fac'])
    links.new(color_ramp.outputs['Color'], bump_rings.inputs['Height'])
    links.new(bump_noise.outputs['Normal'], bump_rings.inputs['Normal'])
    links.new(bump_rings.outputs['Normal'], bsdf.inputs['Normal'])
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])

    return mat



def create_root_mesh(config, material):
    rng = random.Random(config['seed'])
    bm = bmesh.new()
    skin_layer = bm.verts.layers.skin.verify()

    points = []
    segments = 10
    length = config['length']
    for i in range(segments + 1):
        t = i / segments
        x = math.sin(t * math.pi * 1.25 + config['curve_phase']) * config['curve_amp']
        x += math.sin(t * math.pi * 2.7 + config['curve_phase'] * 0.7) * config['curve_amp'] * 0.4
        z = math.cos(t * math.pi * 0.9 + config['curve_phase']) * config['curve_amp'] * 0.55
        z += math.sin(t * math.pi * 3.2 + 0.8) * config['curve_amp'] * 0.2
        y = -length * 0.5 + t * length
        points.append((x, y, z))

    trunk_verts = []
    for i, pt in enumerate(points):
        v = bm.verts.new(pt)
        radius = config['base_radius'] * (1 - i / segments) + config['tip_radius'] * (i / segments)
        radius *= 1 + math.sin(i * 1.7 + config['curve_phase']) * 0.06
        data = v[skin_layer]
        data.radius = (radius, radius)
        trunk_verts.append(v)
        if i > 0:
            bm.edges.new((trunk_verts[i - 1], v))

    bm.verts.ensure_lookup_table()

    for prong_index, prong in enumerate(config['prongs']):
        anchor_idx = max(1, min(segments - 1, round(prong['anchor'] * segments)))
        anchor = trunk_verts[anchor_idx]
        prong_segments = 4 if prong['length'] > 0.05 else 3
        direction = (
            math.sin(prong['yaw']) * math.cos(prong['angle']),
            math.sin(abs(prong['angle'])) * 0.65 + 0.15,
            math.cos(prong['yaw']) * math.cos(prong['angle']),
        )
        previous = anchor
        start = anchor.co.copy()
        for seg in range(1, prong_segments + 1):
            frac = seg / prong_segments
            wobble = 0.006 * (1 - frac)
            point = (
                start.x + direction[0] * prong['length'] * frac + rng.uniform(-wobble, wobble),
                start.y + direction[1] * prong['length'] * frac + rng.uniform(-wobble * 0.4, wobble * 0.4),
                start.z + direction[2] * prong['length'] * frac + rng.uniform(-wobble, wobble),
            )
            v = bm.verts.new(point)
            radius = prong['radius'] * (1 - frac) + config['tip_radius'] * 0.5 * frac
            data = v[skin_layer]
            data.radius = (radius, radius)
            bm.edges.new((previous, v))
            previous = v

    mesh = bpy.data.meshes.new(config['name'])
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(config['name'], mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    deselect_all()
    obj.select_set(True)

    skin = obj.modifiers.new(name='Skin', type='SKIN')
    subsurf = obj.modifiers.new(name='Subsurf', type='SUBSURF')
    subsurf.levels = 2
    subsurf.render_levels = 2

    texture = bpy.data.textures.new(f"{config['name']}_displace", type='CLOUDS')
    texture.noise_scale = 0.03
    texture.noise_depth = 4
    displace = obj.modifiers.new(name='Displace', type='DISPLACE')
    displace.texture = texture
    displace.strength = 0.0025
    displace.mid_level = 0.45

    apply_modifier(obj, skin.name)
    apply_modifier(obj, subsurf.name)
    apply_modifier(obj, displace.name)

    decimate = obj.modifiers.new(name='Decimate', type='DECIMATE')
    decimate.ratio = 0.82
    apply_modifier(obj, decimate.name)

    bevel = obj.modifiers.new(name='Bevel', type='BEVEL')
    bevel.width = 0.0008
    bevel.segments = 1
    apply_modifier(obj, bevel.name)

    bpy.ops.object.shade_smooth()
    if material is not None:
        obj.data.materials.clear()
        obj.data.materials.append(material)

    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    obj.location = (0, 0, 0)
    bbox = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]
    min_y = min(v.y for v in bbox)
    max_y = max(v.y for v in bbox)
    center_y = (min_y + max_y) * 0.5
    obj.location.y -= center_y
    obj.location.x -= obj.location.x
    obj.location.z -= obj.location.z

    deselect_all()
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.select_set(False)
    return obj


# mathutils is only needed after Blender loads.
import mathutils

material = make_root_material()

for variant in VARIANTS:
    clear_scene()
    material = make_root_material(variant['name'] + '_mat')
    obj = create_root_mesh(variant, material)
    bpy.context.view_layer.objects.active = obj
    deselect_all()
    obj.select_set(True)
    output_path = os.path.join(OUTPUT_DIR, f"{variant['name']}.glb")
    export_glb(output_path)
    print(f'Exported {output_path} with {len(obj.data.polygons)} polys / {len(obj.data.vertices)} verts')

import bpy
import math


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.context.scene.unit_settings.system = 'METRIC'
    bpy.context.scene.unit_settings.scale_length = 1.0


def shade_smooth(obj):
    if obj.type != 'MESH':
        return
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    obj.select_set(False)


def apply_bevel(obj, width=0.002, segments=2):
    if obj.type != 'MESH':
        return
    mod = obj.modifiers.new(name='Bevel', type='BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)


def apply_solidify(obj, thickness=0.003):
    mod = obj.modifiers.new(name='Solidify', type='SOLIDIFY')
    mod.thickness = thickness
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)


def apply_all_mesh_transforms():
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
            obj.select_set(False)


def export_glb(output_path):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials='EXPORT',
        export_yup=True,
    )


def make_principled_material(
    name,
    base_color,
    metallic=0.0,
    roughness=0.5,
    transmission=0.0,
    ior=1.45,
    alpha=1.0,
    emission=None,
    emission_strength=0.0,
    brushed=False,
    noise_bump=0.0,
):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    for node in list(nodes):
        nodes.remove(node)

    out = nodes.new(type='ShaderNodeOutputMaterial')
    out.location = (380, 0)
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.location = (40, 0)
    bsdf.inputs['Base Color'].default_value = (*base_color, 1.0)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Transmission Weight'].default_value = transmission
    bsdf.inputs['IOR'].default_value = ior
    bsdf.inputs['Alpha'].default_value = alpha
    if emission is not None:
        bsdf.inputs['Emission Color'].default_value = (*emission, 1.0)
        bsdf.inputs['Emission Strength'].default_value = emission_strength

    if brushed or noise_bump > 0.0:
        texcoord = nodes.new(type='ShaderNodeTexCoord')
        texcoord.location = (-900, 40)
        mapping = nodes.new(type='ShaderNodeMapping')
        mapping.location = (-700, 40)
        mapping.inputs['Scale'].default_value = (1.0, 18.0 if brushed else 4.0, 1.0)
        noise = nodes.new(type='ShaderNodeTexNoise')
        noise.location = (-520, 80)
        noise.inputs['Scale'].default_value = 100.0 if brushed else 22.0
        noise.inputs['Detail'].default_value = 10.0
        bump = nodes.new(type='ShaderNodeBump')
        bump.location = (-180, -120)
        bump.inputs['Strength'].default_value = noise_bump if noise_bump > 0.0 else 0.015
        links.new(texcoord.outputs['Object'], mapping.inputs['Vector'])
        links.new(mapping.outputs['Vector'], noise.inputs['Vector'])
        links.new(noise.outputs['Fac'], bump.inputs['Height'])
        links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])

    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

    if transmission > 0 or alpha < 1.0:
        mat.blend_method = 'BLEND'

    return mat


def add_cube(name, location=(0, 0, 0), scale=(1, 1, 1), rotation=(0, 0, 0), material=None, bevel=0.002):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    if material is not None:
        obj.data.materials.append(material)
    if bevel and bevel > 0:
        apply_bevel(obj, bevel, 2)
    return obj


def add_cylinder(name, location=(0, 0, 0), radius=0.1, depth=1.0, rotation=(0, 0, 0), vertices=32, material=None, bevel=0.0, smooth=True):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    if material is not None:
        obj.data.materials.append(material)
    if bevel and bevel > 0:
        apply_bevel(obj, bevel, 2)
    if smooth:
        shade_smooth(obj)
    return obj


def add_torus(name, location=(0, 0, 0), major_radius=1.0, minor_radius=0.1, rotation=(0, 0, 0), material=None):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=64,
        minor_segments=20,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    if material is not None:
        obj.data.materials.append(material)
    shade_smooth(obj)
    return obj


def add_uv_sphere(name, location=(0, 0, 0), radius=0.1, material=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=radius, location=location)
    obj = bpy.context.active_object
    obj.name = name
    if material is not None:
        obj.data.materials.append(material)
    shade_smooth(obj)
    return obj


def duplicate_linked(obj, name, location=None, rotation=None):
    dup = obj.copy()
    dup.data = obj.data.copy()
    dup.name = name
    bpy.context.collection.objects.link(dup)
    if location is not None:
        dup.location = location
    if rotation is not None:
        dup.rotation_euler = rotation
    return dup


def create_arc_guard(name, radius=0.7, height=0.35, thickness=0.01, start_angle_deg=-70, end_angle_deg=70, material=None):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)

    start = math.radians(start_angle_deg)
    end = math.radians(end_angle_deg)
    steps = 28
    verts = []
    faces = []
    outer = radius
    inner = radius - thickness
    y0 = 0.0
    y1 = height
    for i in range(steps + 1):
        t = i / steps
        ang = start + (end - start) * t
        ca = math.cos(ang)
        sa = math.sin(ang)
        verts.extend([
            (outer * ca, y0, outer * sa),
            (outer * ca, y1, outer * sa),
            (inner * ca, y0, inner * sa),
            (inner * ca, y1, inner * sa),
        ])
    for i in range(steps):
        a = i * 4
        b = a + 4
        faces.extend([
            (a, b, b + 1, a + 1),
            (a + 2, a + 3, b + 3, b + 2),
            (a + 1, b + 1, b + 3, a + 3),
            (a, a + 2, b + 2, b),
        ])
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    if material is not None:
        obj.data.materials.append(material)
    shade_smooth(obj)
    return obj

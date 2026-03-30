import os
import sys

sys.path.append(os.path.dirname(__file__))
from model_utils import *

OUTPUT_PATH = os.path.expanduser('~/repos/sorting-line-digital-twin/public/models/grade-bins.glb')
clear_scene()

plastic = make_principled_material('HDPE', (0.96, 0.97, 0.98), metallic=0.0, roughness=0.5)
rubber = make_principled_material('CasterRubber', (0.06, 0.06, 0.06), metallic=0.0, roughness=0.9)
chrome = make_principled_material('Chrome', (0.82, 0.83, 0.85), metallic=0.95, roughness=0.14)

for i in range(8):
    x = (i - 3.5) * 0.72
    bpy.ops.mesh.primitive_cube_add(location=(x, 0.26, 0))
    outer = bpy.context.active_object
    outer.name = f'grade_bin_{i}'
    outer.scale = (0.23, 0.23, 0.31)
    solid = outer.modifiers.new(name='Solidify', type='SOLIDIFY')
    solid.thickness = 0.03
    bpy.context.view_layer.objects.active = outer
    bpy.ops.object.modifier_apply(modifier=solid.name)
    outer.data.materials.append(plastic)
    apply_bevel(outer, 0.01, 2)

    # handle cutout hint blocks on top edge
    add_cube(f'grade_bin_{i}_handle_left', location=(x, 0.47, -0.22), scale=(0.06, 0.025, 0.018), material=plastic, bevel=0.004)
    add_cube(f'grade_bin_{i}_handle_right', location=(x, 0.47, 0.22), scale=(0.06, 0.025, 0.018), material=plastic, bevel=0.004)

    for w, (dx, dz) in enumerate([(-0.16, -0.22), (-0.16, 0.22), (0.16, -0.22), (0.16, 0.22)], 1):
        add_cylinder(f'grade_bin_{i}_caster_stem_{w}', location=(x + dx, 0.05, dz), radius=0.012, depth=0.05, material=chrome, vertices=14)
        add_cylinder(f'grade_bin_{i}_caster_wheel_{w}', location=(x + dx, 0.02, dz), radius=0.03, depth=0.02, rotation=(1.5708, 0, 0), material=rubber, vertices=18)

apply_all_mesh_transforms()
export_glb(OUTPUT_PATH)
print(f'Exported {OUTPUT_PATH}')

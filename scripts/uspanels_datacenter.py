"""US Panels: a typical data center, outside and inside, rendered in Cycles.
blender -b -P uspanels_datacenter.py -- --view ext|int [--res 1280x720] [--samples 48] [--out file.jpg] [--cam "x,y,z:tx,ty,tz:lens"]

World: metres. X = across the hall (east +), Y = down the hall (back +, front -), Z = up.
Front wall (faces -Y) and the other hidden-fastening walls are smooth with concealed fastening; the east wall (+X) shows the
through-fastened saddle-washer system; the roof is the ribbed outer sheet; inside, the ceiling and the partition wall are the
micro-perforated acoustic liner; doors and trim are the real Blender models (doors/glb, accessories/glb).
Panel details follow the live US Panels copy only: thicknesses and perforation size here are illustrative.
"""
import bpy, bmesh, math, os, sys, random
from mathutils import Vector, Matrix, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import hps_panel as hps          # noqa: E402
import hps_install as inst       # noqa: E402

ROOT = hps.ROOT
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(n, d): return argv[argv.index(n) + 1] if n in argv else d
VIEW = arg("--view", "ext")
RX, RY = [int(v) for v in arg("--res", "1280x720").split("x")]
SAMPLES = int(arg("--samples", "48"))
OUT = arg("--out", os.path.join(ROOT, "dc_renders", VIEW + ".jpg"))
CAMARG = arg("--cam", "")
SKY_ROT = float(arg("--sunrot", "135"))      # sun from the front-right (+X, -Y): lights the fastener wall and the smooth front wall

# ---- the building ----------------------------------------------------------------
HX, HY, HH = 30.0, 18.0, 8.0       # half width (x), half depth (y), wall height
WT = 0.10                          # wall panel thickness
RT = 0.16                          # roof slab
PITCH = 1.0                        # panel cover width
GAP = 0.004
PART_Y = 12.0                     # interior partition wall (back of the racks)
AX, AD, AH = 5.5, 6.0, 4.6        # entrance building: half width, depth, height

rnd = random.Random(7)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
COL = bpy.context.collection


# ---- small helpers -----------------------------------------------------------------
def link(ob, mat=None):
    COL.objects.link(ob)
    if mat is not None:
        ob.data.materials.append(mat)
    return ob


def bm_obj(name, bm, mat=None, smooth=True, bevel=None):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    link(ob, mat)
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    if bevel:
        m = ob.modifiers.new("bevel", "BEVEL")
        m.width, m.segments, m.limit_method = bevel, 2, "ANGLE"
        m.angle_limit = math.radians(35)
    return ob


def box_bm(bm, x0, x1, y0, y1, z0, z1):
    r = bmesh.ops.create_cube(bm, size=1.0)
    cx, cy, cz = (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2
    sx, sy, sz = x1 - x0, y1 - y0, z1 - z0
    for v in r["verts"]:
        v.co = Vector((cx + v.co.x * sx, cy + v.co.y * sy, cz + v.co.z * sz))
    return r["verts"]


def box(name, x0, x1, y0, y1, z0, z1, mat, bevel=None, smooth=False):
    bm = bmesh.new()
    box_bm(bm, x0, x1, y0, y1, z0, z1)
    return bm_obj(name, bm, mat, smooth=smooth, bevel=bevel)


def mat(name, base, rough=.5, metal=0.0, coat=0.0, bump=None, spec=None):
    m = bpy.data.materials.new(name)
    nt, b = hps._principled(m)
    hps.set_in(b, "Base Color", (*base, 1))
    hps.set_in(b, "Roughness", rough)
    hps.set_in(b, "Metallic", metal)
    if coat:
        hps.set_in(b, "Coat Weight", coat)
        hps.set_in(b, "Coat Roughness", .25)
    if spec is not None:
        hps.set_in(b, "Specular IOR Level", spec)
    if bump:
        inst.noise_bump(nt, b, *bump)
    return m


def nodes_of(m):
    return m.node_tree.nodes, m.node_tree.links


def coord_axes(nt, plane):
    """Object-space coordinates picked as (u, v): plane 'xz' (wall along x), 'yz' (wall along y), 'xy' (ceiling/floor)."""
    n = nt.nodes
    tc = n.new("ShaderNodeTexCoord")
    sp = n.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sp.inputs["Vector"])
    ax = {"x": "X", "y": "Y", "z": "Z"}
    return sp.outputs[ax[plane[0]]], sp.outputs[ax[plane[1]]]


def math_node(nt, op, a=None, b=None, clamp=False):
    n = nt.nodes.new("ShaderNodeMath")
    n.operation = op
    n.use_clamp = clamp
    for i, v in enumerate((a, b)):
        if v is None:
            continue
        if isinstance(v, (int, float)):
            n.inputs[i].default_value = v
        else:
            nt.links.new(v, n.inputs[i])
    return n.outputs[0]


def mix_rgba(nt, fac=None, a=None, b=None):
    """ShaderNodeMix as a colour mixer: returns (node, result socket). Sockets are picked by type because the node carries float, vector and colour A/B."""
    n = nt.nodes.new("ShaderNodeMix")
    n.data_type = "RGBA"
    fa = [s for s in n.inputs if s.name == "A" and s.type == "RGBA"][0]
    fb = [s for s in n.inputs if s.name == "B" and s.type == "RGBA"][0]
    for sock, v in ((fa, a), (fb, b)):
        if v is None:
            continue
        if isinstance(v, tuple):
            sock.default_value = v
        else:
            nt.links.new(v, sock)
    if fac is not None:
        if isinstance(fac, (int, float)):
            n.inputs[0].default_value = fac
        else:
            nt.links.new(fac, n.inputs[0])
    return n, [s for s in n.outputs if s.type == "RGBA"][0]


def perforated(name, plane, base=(.80, .81, .80), pitch=0.028, hole=0.0075, seam_axis=0, rough=.42):
    """Micro-perforated white steel (holes drawn bigger than real so they read in a picture) with a panel seam every metre."""
    m = bpy.data.materials.new(name)
    nt, b = hps._principled(m)
    hps.set_in(b, "Roughness", rough)
    hps.set_in(b, "Metallic", 0.0)
    hps.set_in(b, "Coat Weight", .08)
    u, v = coord_axes(nt, plane)
    # hole mask
    def cellfrac(c):
        return math_node(nt, "FRACT", math_node(nt, "DIVIDE", c, pitch))
    fu, fv = cellfrac(u), cellfrac(v)
    du = math_node(nt, "SUBTRACT", fu, .5)
    dv = math_node(nt, "SUBTRACT", fv, .5)
    d2 = math_node(nt, "ADD", math_node(nt, "MULTIPLY", du, du), math_node(nt, "MULTIPLY", dv, dv))
    dist = math_node(nt, "MULTIPLY", math_node(nt, "SQRT", d2), pitch)     # metres from hole centre
    holem = math_node(nt, "LESS_THAN", dist, hole / 2)
    # seam every metre along the panel run
    sf = math_node(nt, "FRACT", math_node(nt, "DIVIDE", u, PITCH))
    seam = math_node(nt, "LESS_THAN", math_node(nt, "MULTIPLY", math_node(nt, "MINIMUM", sf, math_node(nt, "SUBTRACT", 1.0, sf)), PITCH), 0.0016)
    _, c1 = mix_rgba(nt, holem, (*base, 1), (.025, .027, .03, 1))
    _, c2 = mix_rgba(nt, seam, c1, (.35, .36, .37, 1))
    nt.links.new(c2, b.inputs["Base Color"])
    bm = nt.nodes.new("ShaderNodeBump")
    bm.inputs["Strength"].default_value = .6
    bm.inputs["Distance"].default_value = .0008
    inv = math_node(nt, "SUBTRACT", 1.0, holem)
    nt.links.new(inv, bm.inputs["Height"])
    nt.links.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def concrete(name, base, scale=2.0, joint=6.0, rough=.82):
    m = bpy.data.materials.new(name)
    nt, b = hps._principled(m)
    hps.set_in(b, "Roughness", rough)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    n1 = nt.nodes.new("ShaderNodeTexNoise"); n1.inputs["Scale"].default_value = 1.2; n1.inputs["Detail"].default_value = 6
    n2 = nt.nodes.new("ShaderNodeTexNoise"); n2.inputs["Scale"].default_value = 120; n2.inputs["Detail"].default_value = 8
    nt.links.new(tc.outputs["Object"], n1.inputs["Vector"]); nt.links.new(tc.outputs["Object"], n2.inputs["Vector"])
    _, cr = mix_rgba(nt, n1.outputs["Fac"], (*[c * .78 for c in base], 1), (*base, 1))
    # saw-cut joints
    u, v = coord_axes(nt, "xy")
    def jline(c):
        f = math_node(nt, "FRACT", math_node(nt, "DIVIDE", c, joint))
        return math_node(nt, "LESS_THAN", math_node(nt, "MULTIPLY", math_node(nt, "MINIMUM", f, math_node(nt, "SUBTRACT", 1.0, f)), joint), .012)
    jl = math_node(nt, "MAXIMUM", jline(u), jline(v))
    _, cj = mix_rgba(nt, jl, cr, (.06, .06, .06, 1))
    nt.links.new(cj, b.inputs["Base Color"])
    bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = .25; bm.inputs["Distance"].default_value = .01
    nt.links.new(n2.outputs["Fac"], bm.inputs["Height"]); nt.links.new(bm.outputs["Normal"], b.inputs["Normal"])
    rn = math_node(nt, "ADD", .55, math_node(nt, "MULTIPLY", n2.outputs["Fac"], .35))
    nt.links.new(rn, b.inputs["Roughness"])
    return m


def noisy(name, base, scale=60, var=.25, rough=.9, bump=.4):
    m = bpy.data.materials.new(name)
    nt, b = hps._principled(m)
    hps.set_in(b, "Roughness", rough)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = scale; n.inputs["Detail"].default_value = 8
    nt.links.new(tc.outputs["Object"], n.inputs["Vector"])
    _, mx = mix_rgba(nt, n.outputs["Fac"], (*[c * (1 - var) for c in base], 1), (*[min(1, c * (1 + var)) for c in base], 1))
    nt.links.new(mx, b.inputs["Base Color"])
    bp = nt.nodes.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = bump
    nt.links.new(n.outputs["Fac"], bp.inputs["Height"]); nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m


def led_rack(name):
    """Black perforated rack doors with rows of status lights (green, some blue and amber)."""
    m = bpy.data.materials.new(name)
    nt, b = hps._principled(m)
    hps.set_in(b, "Base Color", (.012, .013, .015, 1)); hps.set_in(b, "Roughness", .38); hps.set_in(b, "Metallic", .6)
    u, v = coord_axes(nt, "yz")
    U = 0.0445
    iv = math_node(nt, "FLOOR", math_node(nt, "DIVIDE", v, U))
    iu = math_node(nt, "FLOOR", math_node(nt, "DIVIDE", u, 0.6))      # which rack
    def hsh(a, bb):
        s = math_node(nt, "ADD", math_node(nt, "MULTIPLY", a, 12.9898), math_node(nt, "MULTIPLY", bb, 78.233))
        return math_node(nt, "FRACT", math_node(nt, "MULTIPLY", math_node(nt, "SINE", s), 43758.5453))
    r = hsh(iv, iu)
    # a light sits at 4 positions across each rack; one cell in each row at most
    fu = math_node(nt, "FRACT", math_node(nt, "DIVIDE", u, 0.6))
    fv = math_node(nt, "FRACT", math_node(nt, "DIVIDE", v, U))
    rowm = math_node(nt, "LESS_THAN", math_node(nt, "ABSOLUTE", math_node(nt, "SUBTRACT", fv, .5)), .09)
    def column(offset):
        pos = math_node(nt, "FRACT", math_node(nt, "ADD", math_node(nt, "MULTIPLY", hsh(iu, 3.7), 5.0), offset))
        pos = math_node(nt, "ADD", .08, math_node(nt, "MULTIPLY", pos, .84))
        return math_node(nt, "LESS_THAN", math_node(nt, "ABSOLUTE", math_node(nt, "SUBTRACT", fu, pos)), .03)
    spot = math_node(nt, "MULTIPLY", rowm, math_node(nt, "MAXIMUM", column(0.0), column(.37)))
    on = math_node(nt, "MULTIPLY", spot, math_node(nt, "GREATER_THAN", r, .42))
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = .35; ramp.color_ramp.elements[0].color = (.1, 1, .3, 1)
    ramp.color_ramp.elements[1].position = .85; ramp.color_ramp.elements[1].color = (.15, .45, 1, 1)
    e2 = ramp.color_ramp.elements.new(.95); e2.color = (1, .6, .1, 1)
    nt.links.new(r, ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Emission Color"])
    nt.links.new(math_node(nt, "MULTIPLY", on, 8.0), b.inputs["Emission Strength"])
    return m


# ---- materials -----------------------------------------------------------------------
M = {}
M["wall"] = hps.mat_steel()                        # satin RAL 9002 steel with orange peel
M["wall"].name = "Wall_steel"
for _n in M["wall"].node_tree.nodes:                  # a touch greyer than the studio colour so sunlit and shaded walls read apart
    if _n.type == "BSDF_PRINCIPLED":
        _n.inputs["Base Color"].default_value = (.60, .61, .60, 1)
M["wall_in"] = mat("Wall_inner", (.70, .71, .70), .55, 0, coat=0.05)
M["roof"] = mat("Roof_steel", (.42, .45, .48), .32, .8, coat=.2, bump=(1500, .05))
M["alu"] = mat("Aluminum", (.74, .76, .78), .28, 1.0, bump=(2000, .04))
M["dark"] = mat("Dark", (.03, .032, .035), .5, .3)
M["fence"] = mat("Fence", (.015, .016, .018), .45, .6)
M["washer"] = mat("Washer", (.52, .54, .57), .3, 1.0)
M["head"] = mat("ScrewHead", (.22, .23, .25), .35, 1.0)
M["gen"] = mat("Generator", (.80, .76, .62), .5, .1, bump=(900, .06))
M["unit"] = mat("Chiller", (.58, .60, .62), .55, .5, bump=(500, .2))
M["asphalt"] = noisy("Asphalt", (.07, .072, .075), 300, .5, .95, .6)
M["grass"] = noisy("Grass", (.10, .17, .06), 90, .55, .98, .8)
M["gravel"] = noisy("Gravel", (.34, .33, .31), 700, .6, .95, 1.2)
M["pad"] = concrete("Pad", (.24, .24, .235), joint=6.0)
M["floor"] = concrete("HallFloor", (.40, .41, .42), joint=6.0, rough=.18)
M["plinth"] = mat("Plinth", (.10, .105, .11), .5, .5, bump=(1200, .06))
M["paint"] = mat("Paint", (.85, .85, .8), .6)
M["shrub"] = noisy("Shrub", (.05, .11, .04), 14, .5, .9, 1.2)
M["stoop"] = concrete("Stoop", (.30, .30, .29), joint=3.0)
M["liner_ceil"] = perforated("Liner_ceiling", "xy")
M["liner_wallx"] = perforated("Liner_wall_x", "xz")
M["rack"] = led_rack("Rack_LED")
M["tray"] = mat("Tray", (.55, .57, .6), .4, .8)
M["rack_end"] = mat("Rack_end", (.035, .037, .04), .38, .55, bump=(900, .05))
M["emit"] = bpy.data.materials.new("Light"); nt_, b_ = hps._principled(M["emit"])
hps.set_in(b_, "Emission Color", (1, .98, .94, 1)); hps.set_in(b_, "Emission Strength", 60.0); hps.set_in(b_, "Base Color", (1, 1, 1, 1))


# ---- walls made of real panels -------------------------------------------------------
def strips(name, axis, fixed, thick, a0, a1, z0, z1, mat_out, mat_in, outward, skip=None, header=None):
    """Panels as separate beveled boxes so every seam catches light. axis 'x': wall runs along x at y = fixed.
    outward = +1 / -1: which side the outer face looks to. Returns (outer_obj, inner_obj) split by material."""
    bm = bmesh.new()
    n = int(round((a1 - a0) / PITCH))
    pw = (a1 - a0) / n
    for i in range(n):
        s0, s1 = a0 + i * pw + GAP / 2, a0 + (i + 1) * pw - GAP / 2
        if skip and not (s1 <= skip[0] or s0 >= skip[1]):
            continue
        if axis == "x":
            lo, hi = fixed - thick / 2, fixed + thick / 2
            box_bm(bm, s0, s1, lo, hi, z0, z1)
        else:
            lo, hi = fixed - thick / 2, fixed + thick / 2
            box_bm(bm, lo, hi, s0, s1, z0, z1)
    if skip and header:
        s0, s1 = skip
        if axis == "x":
            box_bm(bm, s0, s1, fixed - thick / 2, fixed + thick / 2, header, z1)
        else:
            box_bm(bm, fixed - thick / 2, fixed + thick / 2, s0, s1, header, z1)
    me_ob = bm_obj(name, bm, None, smooth=False, bevel=0.0025)
    me_ob.data.materials.append(mat_out)
    me_ob.data.materials.append(mat_in)
    # outer faces -> slot 0, inner faces -> slot 1, edges stay on slot 0
    for p in me_ob.data.polygons:
        nrm = p.normal
        d = (nrm.y if axis == "x" else nrm.x) * outward
        p.material_index = 1 if d < -0.5 else 0
    return me_ob


def saddle_washers(name, x, y0, y1, z_rows, outward=1):
    """Through-fastened saddle-washer heads on the east wall, three per panel on every girt line."""
    bm = bmesh.new()
    n = int(round((y1 - y0) / PITCH))
    pw = (y1 - y0) / n
    for i in range(n):
        yc = y0 + (i + .5) * pw
        for dy in (-.3, 0.0, .3):
            for z in z_rows:
                r1 = bmesh.ops.create_cone(bm, cap_ends=True, segments=14, radius1=.03, radius2=.03, depth=.005)
                r2 = bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=.011, radius2=.011, depth=.009)
                for verts, off in ((r1["verts"], .002), (r2["verts"], .0075)):
                    for v in verts:
                        c = v.co
                        v.co = Vector((x + outward * (off + c.z), yc + dy + c.x, z + c.y))
    return bm_obj(name, bm, M["washer"], smooth=True)


# ---- build the hall --------------------------------------------------------------------
def build_building():
    W = M["wall"]
    # exterior walls: outward faces get the satin steel, inward the plain inner steel
    strips("Wall_front", "x", -HY - WT / 2, WT, -HX, HX, 0, HH, W, M["wall_in"], -1)
    strips("Wall_back", "x", HY + WT / 2, WT, -HX, HX, 0, HH, W, M["wall_in"], +1)
    strips("Wall_west", "y", -HX - WT / 2, WT, -HY - WT, HY + WT, 0, HH, W, M["wall_in"], -1)
    east = strips("Wall_east", "y", HX + WT / 2, WT, -HY - WT, HY + WT, 0, HH, W, M["wall_in"], +1)
    saddle_washers("Saddle_washers", HX + WT, -HY - WT, HY + WT, [.45, 1.95, 3.45, 4.95, 6.0])
    # roof: ribbed sheet on a slab
    box("Roof_slab", -HX - WT, HX + WT, -HY - WT, HY + WT, HH, HH + RT * .8, M["wall_in"], smooth=False)
    bm = bmesh.new()
    x0, x1, y0, y1 = -HX - WT, HX + WT, -HY - WT, HY + WT
    z0 = HH + RT * .8
    prof = [(x0, 0.0)]
    x = x0
    while x < x1 - .26:
        prof += [(x + .06, 0.0), (x + .085, .042), (x + .165, .042), (x + .19, 0.0)]
        x += .25
    prof.append((x1, 0.0))
    vs0 = [bm.verts.new((px, y0, z0 + pz)) for px, pz in prof]
    vs1 = [bm.verts.new((px, y1, z0 + pz)) for px, pz in prof]
    for i in range(len(prof) - 1):
        bm.faces.new((vs0[i], vs0[i + 1], vs1[i + 1], vs1[i]))
    roof = bm_obj("Roof_ribbed", bm, M["roof"], smooth=False)
    # roof edge trim + corner angles
    for (xa, xb, ya, yb) in [(-HX - WT - .02, HX + WT + .02, -HY - WT - .02, -HY - WT + .02), (-HX - WT - .02, HX + WT + .02, HY + WT - .02, HY + WT + .02),
                              (-HX - WT - .02, -HX - WT + .02, -HY - WT, HY + WT), (HX + WT - .02, HX + WT + .02, -HY - WT, HY + WT)]:
        box("Roof_edge", xa, xb, ya, yb, HH - .02, HH + .30, M["alu"], bevel=.004)
    corner_angle(HX + WT, -HY - WT, 1, -1, HH + RT * .8)
    corner_angle(-HX - WT, -HY - WT, -1, -1, HH + RT * .8)
    corner_angle(HX + WT, HY + WT, 1, 1, HH + RT * .8)
    corner_angle(-HX - WT, HY + WT, -1, 1, HH + RT * .8)
    # entrance building
    strips("Annex_front", "x", -HY - WT - AD - WT / 2, WT, -AX, AX, 0, AH, W, M["wall_in"], -1, skip=(-.5, .5), header=2.16)
    strips("Annex_left", "y", -AX - WT / 2, WT, -HY - WT - AD - WT, -HY - WT, 0, AH, W, M["wall_in"], -1)
    strips("Annex_right", "y", AX + WT / 2, WT, -HY - WT - AD - WT, -HY - WT, 0, AH, W, M["wall_in"], +1)
    box("Annex_roof", -AX - WT, AX + WT, -HY - WT - AD - WT - .12, -HY - WT, AH, AH + .12, M["wall_in"])
    box("Annex_cap", -AX - WT - .06, AX + WT + .06, -HY - WT - AD - WT - .18, -HY - WT, AH + .12, AH + .2, M["roof"], bevel=.004)
    corner_angle(AX + WT, -HY - WT - AD - WT, 1, -1, AH + .12)
    corner_angle(-AX - WT, -HY - WT - AD - WT, -1, -1, AH + .12)
    door(0, -HY - WT - AD - WT / 2, 0)
    ay = -HY - WT - AD - WT            # outer face of the entrance building
    box("EntryLight", -.18, .18, ay - .09, ay, 2.55, 2.64, M["emit"])
    box("DoorCanopy", -1.6, 1.6, ay - 1.3, ay, 2.85, 2.97, M["alu"], bevel=.006)         # canopy over the door
    box("Stoop", -1.6, 1.6, ay - 1.6, ay, -.01, .12, M["stoop"], bevel=.01)
    # dark base band (plinth) round the foot of every wall
    pl = bmesh.new()
    box_bm(pl, -HX - WT - .012, HX + WT + .012, -HY - WT - .012, -HY - WT, 0, .75)
    box_bm(pl, -HX - WT - .012, HX + WT + .012, HY + WT, HY + WT + .012, 0, .75)
    box_bm(pl, -HX - WT - .012, -HX - WT, -HY - WT, HY + WT, 0, .75)
    box_bm(pl, HX + WT, HX + WT + .012, -HY - WT, HY + WT, 0, .75)
    box_bm(pl, -AX - WT - .012, -AX - WT, ay, -HY - WT, 0, .75)
    box_bm(pl, AX + WT, AX + WT + .012, ay, -HY - WT, 0, .75)
    box_bm(pl, -AX - WT, -1.6, ay - .012, ay, 0, .75); box_bm(pl, 1.6, AX + WT, ay - .012, ay, 0, .75)
    bm_obj("Plinth", pl, M["plinth"], smooth=False, bevel=.002)


def corner_angle(cx, cy, sx, sy, h):
    """Aluminum outside-corner angle, 50 x 50 mm legs, standing on the two wall faces at the corner."""
    t, L = .003, .05
    bm = bmesh.new()
    # leg across x (lies on the face at y = cy)
    x0, x1 = (cx - L, cx + t) if sx > 0 else (cx - t, cx + L)
    y0, y1 = (cy, cy + t) if sy > 0 else (cy - t, cy)
    box_bm(bm, x0, x1, y0 if sy > 0 else y0, y1, 0, h)
    # leg along y (lies on the face at x = cx)
    xx0, xx1 = (cx, cx + t) if sx > 0 else (cx - t, cx)
    yy0, yy1 = (cy - L, cy + t) if sy > 0 else (cy - t, cy + L)
    box_bm(bm, xx0, xx1, yy0, yy1, 0, h)
    return bm_obj("Corner_angle", bm, M["alu"], smooth=False, bevel=.0008)


def import_glb(relpath):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, relpath))
    return [o for o in bpy.data.objects if o not in before]


def door(x, y, z, flip=False, parent_y_face=-1):
    """The metal door model (office 3x7: leaf, frame, lever). Its front faces -Y."""
    objs = import_glb("doors/glb/office-3x7.glb")
    keep = []
    for o in objs:
        if o.name.startswith("Wall_"):
            bpy.data.objects.remove(o, do_unlink=True)
        else:
            keep.append(o)
    root = bpy.data.objects.new("DoorRoot", None)
    COL.objects.link(root)
    for o in keep:
        if o.parent is None and o.type == "EMPTY":
            o.parent = root
        elif o.parent is None:
            o.parent = root
    root.location = (x, y, z)
    if flip:
        root.rotation_euler = (0, 0, math.pi)
    for o in keep:
        if o.type == "MESH":
            for slot in o.material_slots:
                if slot.material and slot.material.name.startswith("Door_steel"):
                    m = slot.material.copy()
                    nt = m.node_tree
                    for n in nt.nodes:
                        if n.type == "BSDF_PRINCIPLED":
                            n.inputs["Base Color"].default_value = (.46, .48, .50, 1)
                            n.inputs["Roughness"].default_value = .42
                    slot.material = m
    return root


# ---- site -----------------------------------------------------------------------------------
def build_site():
    def plane(name, w, d, x, y, z, m):
        bm = bmesh.new()
        box_bm(bm, x - w / 2, x + w / 2, y - d / 2, y + d / 2, z - .02, z)
        return bm_obj(name, bm, m, smooth=False)
    plane("Grass", 1400, 1400, 0, 0, -.06, M["grass"])
    plane("Gravel", 176, 112, 0, -3, -.03, M["gravel"])
    plane("Pad", 170, 106, 0, -3, 0, M["pad"])                 # concrete yard inside the fence
    plane("Parking", 76, 20, -4, -40, .005, M["asphalt"])      # visitor parking in front of the entrance
    plane("Drive", 14, 52, 0, -75, .005, M["asphalt"])         # drive out to the road
    plane("Road", 600, 12, 0, -102, -.01, M["asphalt"])
    bl_ = bmesh.new()
    for px in range(-38, 31, 4):                                # painted bays
        box_bm(bl_, px - .06, px + .06, -49.6, -43.2, .006, .012)
    box_bm(bl_, -42, 34, -30.2, -30.1, .006, .012)
    bm_obj("ParkingLines", bl_, M["paint"], smooth=False)
    # shrubs along the front of the building and the entrance walk
    bsh = bmesh.new()
    for sx_ in list(range(-28, -7, 5)) + list(range(9, 28, 5)):
        r = bmesh.ops.create_icosphere(bsh, subdivisions=2, radius=.75)
        for v in r["verts"]:
            v.co = Vector((sx_ + v.co.x * 1.1, -HY - WT - 1.2 + v.co.y, .55 + v.co.z * .8))
    bm_obj("Shrubs", bsh, M["shrub"])
    # fence: posts and rails
    bm = bmesh.new()
    X0, X1, Y0, Y1 = -84, 84, -54, 48
    for xx in range(X0, X1 + 1, 4):
        for yy in (Y0, Y1):
            box_bm(bm, xx - .05, xx + .05, yy - .05, yy + .05, 0, 2.2)
    for yy in range(Y0 + 4, Y1, 4):
        for xx in (X0, X1):
            box_bm(bm, xx - .05, xx + .05, yy - .05, yy + .05, 0, 2.2)
    for z in (.4, 1.0, 1.6, 2.15):
        box_bm(bm, X0, X1, Y0 - .02, Y0 + .02, z, z + .04); box_bm(bm, X0, X1, Y1 - .02, Y1 + .02, z, z + .04)
        box_bm(bm, X0 - .02, X0 + .02, Y0, Y1, z, z + .04); box_bm(bm, X1 - .02, X1 + .02, Y0, Y1, z, z + .04)
    bm_obj("Fence", bm, M["fence"], smooth=False)
    # pickets (thin) along the front as a single grid is heavy; a mesh panel is faked with a fine bump on the rails
    # rooftop cooling units
    bmu = bmesh.new(); bmf = bmesh.new()
    bls = bmesh.new()
    for ux, uy in [(-21, -8), (-9, -8), (9, -8), (21, -8), (-21, 7), (-9, 7), (9, 7), (21, 7)]:
        box_bm(bmu, ux - 2.3, ux + 2.3, uy - 1.4, uy + 1.4, HH + RT + .35, HH + RT + 2.5)
        for kk in range(11):                                     # louvre slats on the long faces
            zz = HH + RT + .6 + kk * .16
            box_bm(bls, ux - 2.0, ux + 2.0, uy - 1.43, uy - 1.4, zz, zz + .07); box_bm(bls, ux - 2.0, ux + 2.0, uy + 1.4, uy + 1.43, zz, zz + .07)
        for k in (-1, 1):
            r = bmesh.ops.create_cone(bmf, cap_ends=True, segments=24, radius1=.95, radius2=.95, depth=.1)
            for v in r["verts"]:
                v.co = Vector((ux + k * 1.15 + v.co.x, uy + v.co.y, HH + RT + 2.55 + v.co.z))
        for dx in (-2.0, 2.0):
            box_bm(bmu, ux + dx - .12, ux + dx + .12, uy - 1.0, uy + 1.0, HH + RT, HH + RT + .35)
    bm_obj("RoofUnits", bmu, M["unit"], smooth=False, bevel=.01)
    bm_obj("RoofFans", bmf, M["dark"])
    bm_obj("RoofLouvres", bls, M["dark"], smooth=False)
    # generators
    bg = bmesh.new(); bl = bmesh.new()
    for gy in (-30, -18, -6, 6, 18, 30):
        box_bm(bg, HX + 14, HX + 20.5, gy - 1.3, gy + 1.3, 0.2, 2.9)
        box_bm(bg, HX + 13.8, HX + 20.7, gy - 1.5, gy + 1.5, 0, .2)
        for k in range(14):
            box_bm(bl, HX + 13.96, HX + 14.0, gy - 1.1 + k * .15, gy - .98 + k * .15, .5, 2.3)
        box_bm(bl, HX + 18.8, HX + 19.2, gy - .2, gy + .2, 2.9, 3.6)
    bm_obj("Generators", bg, M["gen"], smooth=False, bevel=.01)
    bm_obj("GeneratorLouvers", bl, M["dark"], smooth=False)
    # bollards by the entrance and a walk
    for bx in (-3.6, 3.6):
        box("Bollard", bx - .1, bx + .1, -HY - WT - AD - 2.5 - .1, -HY - WT - AD - 2.5 + .1, 0, 1.05, mat("Bollard", (.9, .75, .05), .5), bevel=.02)
    # tree line
    bt = bmesh.new()
    btr = bmesh.new()
    for i in range(110):                                        # trees: a few overlapping crowns on a trunk, set well back from the fence
        a = rnd.uniform(0, math.tau)
        rr = rnd.uniform(125, 235)
        cx, cy = math.cos(a) * rr * 1.3, math.sin(a) * rr
        if abs(cx) < 20 and cy < -90:
            continue                                            # keep the drive clear
        hgt = rnd.uniform(9, 15)
        box_bm(btr, cx - .35, cx + .35, cy - .35, cy + .35, 0, hgt * .5)
        for k in range(4):
            r = bmesh.ops.create_icosphere(bt, subdivisions=2, radius=rnd.uniform(3.8, 6.2))
            ox, oy, oz = rnd.uniform(-3, 3), rnd.uniform(-3, 3), hgt * .55 + rnd.uniform(0, hgt * .45)
            for v in r["verts"]:
                v.co = Vector((cx + ox + v.co.x, cy + oy + v.co.y, oz + v.co.z * 1.15))
    bm_obj("Trees", bt, noisy("Foliage", (.045, .095, .03), 6, .55, .9, 2.0))
    bm_obj("Trunks", btr, mat("Bark", (.07, .05, .035), .9), smooth=False)


# ---- inside -----------------------------------------------------------------------------------
def build_inside():
    plane_bm = bmesh.new()
    box_bm(plane_bm, -HX, HX, -HY, HY, -.04, .0)
    bm_obj("HallFloor", plane_bm, M["floor"], smooth=False)
    # ceiling liner (perforated) on the underside of the roof slab
    bm = bmesh.new()
    box_bm(bm, -HX, HX, -HY, HY, HH - .02, HH)
    ceil = bm_obj("Ceiling", bm, M["liner_ceil"], smooth=False)
    # racks in long rows: aisles run front to back
    br = bmesh.new()
    RW, RD, RH = .6, 1.2, 2.2
    rows_x = []
    xa = 1.55
    for k in range(7):
        # pairs of rows back to back, a hot aisle between pairs
        rows_x.append(xa + RD / 2)
        rows_x.append(xa + RD * 1.5)
        xa += 2 * RD + 2.4
    rows = [r for r in rows_x if r < HX - 2]
    n = 0
    for rx in rows:
        for side in (-1, 1):
            cx = side * rx
            y = -9.0
            while y < PART_Y - 2.5:
                box_bm(br, cx - RD / 2 + .01, cx + RD / 2 - .01, y + .005, y + RW - .005, 0.03, RH)
                y += RW
                n += 1
    racks = bm_obj("Racks", br, M["rack"], smooth=False, bevel=.004)
    racks.data.materials.append(M["rack_end"])
    for p in racks.data.polygons:                     # doors face the aisle (+/-X); the rest is plain dark metal
        p.material_index = 0 if abs(p.normal.x) > .5 else 1
    # cable trays over the rows' front aisles are left out: nothing hangs from the ceiling
    # T-bar trim on the ceiling panel seams (the real model, long way along the hall)
    for x in range(-int(HX) + 3, int(HX) - 2, 3):
        tbar(x, HH - .003)
    # interior partition wall (perforated both sides), with the door opening
    strips("Partition", "x", PART_Y, WT, -HX, HX, 0, HH, M["liner_wallx"], M["liner_wallx"], +1, skip=(0, 1), header=2.16)
    door(0.5, PART_Y, 0)
    # light fixtures: flush linear fixtures down the aisles
    bl = bmesh.new()
    for lx in [lx for lx in (-11, -5, 0, 5, 11, -17, 17, -23, 23, -28, 28) if abs(lx) < HX - 1]:
        for ly in range(-13, 11, 5):
            box_bm(bl, lx - .05, lx + .05, ly - 1.1, ly + 1.1, HH - .04, HH - .015)
    bm_obj("LightStrips", bl, M["emit"], smooth=False)
    # inside corner angles
    def in_corner(cx, cy, ix, iy):
        t, L = .003, .05
        b2 = bmesh.new()
        box_bm(b2, min(cx, cx + ix * L), max(cx, cx + ix * L), min(cy, cy + iy * t), max(cy, cy + iy * t), 0, HH)
        box_bm(b2, min(cx, cx + ix * t), max(cx, cx + ix * t), min(cy, cy + iy * L), max(cy, cy + iy * L), 0, HH)
        bm_obj("Inside_corner", b2, M["alu"], smooth=False, bevel=.0008)
    in_corner(HX, HY, -1, -1); in_corner(-HX, HY, 1, -1); in_corner(HX, -HY, -1, 1); in_corner(-HX, -HY, 1, 1)
    in_corner(HX, PART_Y - WT / 2, -1, -1); in_corner(-HX, PART_Y - WT / 2, 1, -1)
    return ceil


def tbar(x, z):
    objs = import_glb("accessories/glb/al-t.glb")
    meshes = [o for o in objs if o.type == "MESH"]
    for o in meshes:
        o.parent = None
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    bpy.context.view_layer.update()
    d = o.dimensions
    la = max(range(3), key=lambda i: d[i])          # the long axis of the bar
    print("TBAR dims", tuple(round(v, 3) for v in d), "long axis", la)
    sc3 = [1.0, 1.0, 1.0]
    sc3[la] = (2 * HY - .3) / d[la]
    o.scale = sc3
    o.rotation_mode = "XYZ"                          # imported objects come in as quaternion
    o.rotation_euler = (0, 0, math.pi / 2) if la == 0 else ((math.pi / 2, 0, 0) if la == 2 else (0, 0, 0))   # long axis along the hall (Y)
    o.location = (x, 0, 0)
    bpy.context.view_layer.update()
    top = max((o.matrix_world @ Vector(c)).z for c in o.bound_box)
    o.location.z += z - top
    for slot in o.material_slots:
        slot.material = M["alu"]
    return o


# ---- lighting / camera ------------------------------------------------------------------------
def world_outdoor():
    w = bpy.data.worlds.new("Sky")
    sc.world = w
    w.use_nodes = True
    nt = w.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    sky = nt.nodes.new("ShaderNodeTexSky")
    sky.sky_type = "MULTIPLE_SCATTERING"
    sky.sun_elevation = math.radians(float(arg("--sunel", "17")))
    sky.sun_rotation = math.radians(SKY_ROT)
    sky.air_density = 1.0
    for attr, val in (("aerosol_density", 1.2), ("dust_density", 1.2)):
        if hasattr(sky, attr):
            setattr(sky, attr, val)
    bg.inputs["Strength"].default_value = 1.0
    nt.links.new(sky.outputs["Color"], bg.inputs["Color"])
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])


def world_interior():
    w = bpy.data.worlds.new("Dim")
    sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (.6, .6, .6, 1)
    bg.inputs["Strength"].default_value = .02


def camera(loc, look, lens, f_stop=None, shift=0.0):
    cd = bpy.data.cameras.new("Cam")
    cd.lens = lens
    cd.sensor_width = 36
    cd.shift_y = shift
    cam = bpy.data.objects.new("Cam", cd)
    COL.objects.link(cam)
    cam.location = loc
    cam.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    sc.camera = cam
    return cam


def parse_cam(s):
    p, t, l = s.split(":")
    return [float(v) for v in p.split(",")], [float(v) for v in t.split(",")], float(l)


def main():
    build_building()
    if VIEW == "ext":
        build_site()
        world_outdoor()
        loc, look, lens = (42, -62, 8), (6, -12, 4.2), 27
    else:
        build_inside()
        world_interior()
        loc, look, lens = (0, -16.0, 1.7), (0, 12, 3.0), 21
    if CAMARG:
        loc, look, lens = parse_cam(CAMARG)
    cam = camera(loc, look, lens)
    if "--pano" in argv:        # 360 x 180 degree panorama (equirectangular). Centre of the picture looks along +Y, right of centre is +X, level horizon.
        cd = cam.data
        cd.type = "PANO"
        for owner in (cd, getattr(cd, "cycles", None)):
            if owner is not None and hasattr(owner, "panorama_type"):
                owner.panorama_type = "EQUIRECTANGULAR"
        for owner in (cd, getattr(cd, "cycles", None)):
            if owner is not None and hasattr(owner, "latitude_min"):
                owner.latitude_min, owner.latitude_max = -math.pi / 2, math.pi / 2
                owner.longitude_min, owner.longitude_max = -math.pi, math.pi
        cam.rotation_euler = (math.pi / 2, 0, 0)
    hps.setup_cycles(RX, RY, SAMPLES, use_gpu=False)
    sc.cycles.max_bounces = 8
    sc.cycles.sample_clamp_indirect = 6
    try:
        sc.view_settings.view_transform = arg("--vt", "AgX")
    except TypeError:
        pass
    sc.view_settings.exposure = float(arg("--exposure", "-3.8" if VIEW == "ext" else "1.0"))
    sc.render.image_settings.file_format = "JPEG"
    sc.render.image_settings.quality = 90
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    sc.render.filepath = OUT
    bpy.ops.render.render(write_still=True)
    print("DONE", OUT)


main()


"""Dump the cross-section polygons of the three new panels (same geometry as the Blender models) for the web viewer.
blender -b -P dump_profiles.py -- out.js
Coordinates: x = across the width (mm, -500..500), y = thickness (mm, 0 = middle of the panel, + = outer face)."""
import sys, os, json
import bpy
sys.argv = ['x', '--']
sys.path.insert(0, r'D:\OneDrive\Desktop\Blender HPS\scripts')
src = open(r'D:\OneDrive\Desktop\Blender HPS\scripts\uspanels_mw.py').read().replace('\nmain()\n', '\n')
ns = {'__file__': r'D:\OneDrive\Desktop\Blender HPS\scripts\uspanels_mw.py'}
exec(compile(src, 'mw', 'exec'), ns)
hps = ns['hps']
out = sys.argv_out if hasattr(sys, 'argv_out') else r'C:\Users\globu\dev\US-Panels-frontend\concept\js\panels-data.js'
R = lambda pts, dz=0.0: [[round(y, 2), round(z - dz, 2)] for y, z in pts]

T = ns['T']; HALF = ns['HALF']; SKIN = ns['SKIN']
dz = T / 2
wall = {
    'T': T,
    'skin': R(ns['sheet'](ns['wall_skin_path']()), dz),
    'liner': R(ns['sheet']([(-HALF + 6, SKIN / 2), (HALF - 2, SKIN / 2)]), dz),
    'wool': R([(-HALF + 52, SKIN), (HALF - 52, SKIN), (HALF - 52, T - 1.2), (-HALF + 52, T - 1.2)], dz),
    'foam': [R([(-HALF + 7, SKIN), (-HALF + 52, SKIN), (-HALF + 52, T - 1.2), (-HALF + 7, T - 1.2)], dz),
             R([(HALF - 52, SKIN), (HALF - 3, SKIN), (HALF - 3, T - 10.6), (HALF - 28, T - 10.6), (HALF - 38, T - 1.2), (HALF - 52, T - 1.2)], dz)],
}
for y0 in ns['RIBS']:
    r = ns['rib_pts'](y0)
    wall['foam'].append(R([(r[0][0], T - 1.2), (r[1][0], r[1][1] - 1.1), (r[2][0], r[2][1] - 1.1), (r[3][0], T - 1.2)], dz))

hs = {}
for th in (50.8, 101.6, 152.4, 203.2):
    k = th / 100.0
    hps.THICK = th; hps.GROOVE_OPEN = 3.30 * 25.4 * k; hps.TONGUE_H = 3.26 * 25.4 * k
    cl = hps.skin_centerline()
    left, right = hps.offset_sides(cl, hps.SKIN / 2)
    top = left + right[::-1]
    bot = [(y, -z) for y, z in top]
    yend, zend = right[-1]
    core = list(right)
    gb = hps.COVER / 2 - hps.GROOVE_DEPTH - hps.GASKET_T
    core += [(yend, hps.GROOVE_OPEN / 2), (gb, hps.GROOVE_OPEN / 2), (gb, -hps.GROOVE_OPEN / 2), (yend, -hps.GROOVE_OPEN / 2)]
    core += [(y, -z) for y, z in right[::-1]]
    ts = -hps.COVER / 2
    core += [(ts, -hps.TONGUE_H / 2), (ts - hps.TONGUE_LEN, -hps.TONGUE_H / 2), (ts - hps.TONGUE_LEN, hps.TONGUE_H / 2), (ts, hps.TONGUE_H / 2)]
    g = hps.GROOVE_OPEN / 2 - 0.1
    hs[str(th)] = {'T': th, 'top': R(top), 'bot': R(bot), 'core': R(core), 'gasket': R([(gb, -g), (gb + hps.GASKET_T, -g), (gb + hps.GASKET_T, g), (gb, g)])}

# profiled exterior wall panels (trapezoidal, microrib, ribbed): same build as uspanels_mw.build_prof, cross sections only
prof = {}
for key in ('trap', 'micro', 'rib'):
    prof[key] = {}
    for th in (50.8, 101.6, 152.4, 203.2):
        k = th / 100.0
        hps.THICK = th; hps.GROOVE_OPEN = 3.30 * 25.4 * k; hps.TONGUE_H = 3.26 * 25.4 * k
        orig = hps.top_outer_profile
        pp = [(y, th / 2 + h) for y, h in ns['prof_pts'](key)]
        hps.top_outer_profile = lambda pp=pp: pp
        cl_top = hps.skin_centerline()
        hps.top_outer_profile = orig
        cl_bot = hps.skin_centerline()
        lt, rt = hps.offset_sides(cl_top, hps.SKIN / 2); top = lt + rt[::-1]
        lb, rb = hps.offset_sides(cl_bot, hps.SKIN / 2); bot = [(y, -z) for y, z in (lb + rb[::-1])]
        yend, zend = rt[-1]
        gb = hps.COVER / 2 - hps.GROOVE_DEPTH - hps.GASKET_T
        core = list(rt) + [(yend, hps.GROOVE_OPEN / 2), (gb, hps.GROOVE_OPEN / 2), (gb, -hps.GROOVE_OPEN / 2), (yend, -hps.GROOVE_OPEN / 2)]
        core += [(y, -z) for y, z in rb[::-1]]
        ts = -hps.COVER / 2
        core += [(ts, -hps.TONGUE_H / 2), (ts - hps.TONGUE_LEN, -hps.TONGUE_H / 2), (ts - hps.TONGUE_LEN, hps.TONGUE_H / 2), (ts, hps.TONGUE_H / 2)]
        g = hps.GROOVE_OPEN / 2 - 0.1
        prof[key][str(th)] = {'T': th, 'top': R(top), 'bot': R(bot), 'core': R(core), 'gasket': R([(gb, -g), (gb + hps.GASKET_T, -g), (gb + hps.GASKET_T, g), (gb, g)])}

js = '/* Cross sections of the new panels, dumped from the Blender models (scripts/uspanels_mw.py, hps_panel.py). x = across the width, y = thickness, mm. */\nwindow.USPanelsData=' + json.dumps({'wall': wall, 'hs': hs, 'prof': prof}, separators=(',', ':')) + ';\n'
open(out, 'w').write(js)
print('DUMPED', out, len(js))

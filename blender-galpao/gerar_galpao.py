# -*- coding: utf-8 -*-
"""
Gerador parametrico do galpao da Edge City (Blender 5.x). Unidades: metros.
Coordenadas de entrada seguem o three.js do projeto (X, Y para cima, Z).
Conversao para o Blender: (x, y, z) -> (x, -z, y). O exportador glTF (Y para cima) devolve exatamente (x, y, z).
Etapas: run(1) texturas+materiais | run(2) geometria+luzes do Blender+salvar .blend | run(3) exportar .glb
"""
import bpy, math, os, json, struct
import numpy as np
from itertools import chain
from mathutils import Vector

OUT_DIR = r"C:\Users\andrepereira\OneDrive - WEG EQUIPAMENTOS ELETRICOS S.A\Documentos\edge city\blender-galpao"
BLEND = os.path.join(OUT_DIR, "galpao_edge_city.blend")
GLB = os.path.join(OUT_DIR, "galpao_edge_city.glb")

# ---------------- parametros (iguais aos de src/scene/hall.ts)
HX0, HX1, HZ0, HZ1, HC = -66.0, 66.0, -42.0, 56.0, 24.8
FX = [-66.0, -44.0, -22.0, 0.0, 22.0, 44.0, 66.0]
COL_H = 21.0
SIDE_Z = [-28.0, -14.0, 0.0, 14.0, 28.0, 42.0]
LAMP_X = [-55.0, -33.0, -11.0, 11.0, 33.0, 55.0]
LAMP_Z = [-30.0, -15.0, 0.0, 14.0, 28.0, 42.0]
LAMP_Y = 18.6
SKY_Z = [-30.0, -6.0, 18.0, 42.0]
SKY_W = 3.0
PLINTH, WIN0, WIN1 = 3.2, 17.45, 19.75
SLAB = 7.5


def column_positions():
    c = [(x, z) for x in FX for z in (HZ0 + 0.4, -18.0, HZ1 - 0.4)]
    c += [(HX0 + 0.4, z) for z in SIDE_Z] + [(HX1 - 0.4, z) for z in SIDE_Z]
    return c


# ---------------- iluminacao analitica (assada em cor de vertice e no piso)
LAMPS = np.array([(x, LAMP_Y, z) for x in LAMP_X for z in LAMP_Z], dtype=np.float64)
SKY = np.array([(x, HC - 0.05, z) for z in SKY_Z for x in np.arange(-60.0, 61.0, 12.0)], dtype=np.float64)


def irradiance(P, N):
    out = np.zeros(len(P))
    for src, wt in ((LAMPS, 1.0), (SKY, 0.5)):
        for l in src:
            d = l - P
            r2 = (d * d).sum(1)
            r = np.sqrt(r2) + 1e-6
            ndl = np.clip((d * N).sum(1) / r, 0.0, 1.0)
            ce = np.clip(d[:, 1] / r, 0.0, 1.0)
            out += wt * ndl * np.sqrt(ce) / (r2 + 400.0)
    return out


def calc_iref():
    xs = np.linspace(HX0, HX1, 60)
    zs = np.linspace(HZ0, HZ1, 45)
    X, Z = np.meshgrid(xs, zs)
    P = np.stack([X.ravel(), np.zeros(X.size), Z.ravel()], 1)
    N = np.zeros_like(P)
    N[:, 1] = 1.0
    return float(np.percentile(irradiance(P, N), 95))


def vertex_shade(P, N, LIT, iref):
    P = np.asarray(P, np.float64)
    N = np.asarray(N, np.float64)
    f = np.clip(irradiance(P, N) / iref, 0.0, 1.2)
    amb = 0.10 + 0.10 * np.clip(N[:, 1], 0.0, 1.0)
    s = 0.50 + 0.50 * np.clip(f * 0.85 + amb, 0.0, 1.0) ** 0.75
    return np.where(np.asarray(LIT), s, 0.92)


# ---------------- texturas procedurais (numpy)
def fft_noise(h, w, beta, seed):
    rng = np.random.default_rng(seed)
    fy = np.fft.fftfreq(h)[:, None]
    fx = np.fft.fftfreq(w)[None, :]
    f2 = fy ** 2 + fx ** 2
    f2[0, 0] = 1.0
    amp = f2 ** (-beta / 4.0)
    amp[0, 0] = 0.0
    spec = amp * (rng.standard_normal((h, w)) + 1j * rng.standard_normal((h, w)))
    a = np.fft.ifft2(spec).real
    return (a - a.mean()) / (a.std() + 1e-9)


def normals_from_height(h, k):
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5
    nx, ny, nz = -dx * k, -dy * k, np.ones_like(h)
    l = np.sqrt(nx * nx + ny * ny + nz * nz)
    return np.dstack([nx / l * 0.5 + 0.5, ny / l * 0.5 + 0.5, nz / l * 0.5 + 0.5])


def resize_lin(a, H, W):
    h, w = a.shape
    ys = np.linspace(0, h - 1, H)
    xs = np.linspace(0, w - 1, W)
    y0 = np.floor(ys).astype(int)
    y1 = np.minimum(y0 + 1, h - 1)
    fy = (ys - y0)[:, None]
    x0 = np.floor(xs).astype(int)
    x1 = np.minimum(x0 + 1, w - 1)
    fx = (xs - x0)[None, :]
    a0 = a[y0][:, x0] * (1 - fx) + a[y0][:, x1] * fx
    a1 = a[y1][:, x0] * (1 - fx) + a[y1][:, x1] * fx
    return a0 * (1 - fy) + a1 * fy


def rib_tex(n, ribs, tint, seed, horizontal=False):
    ph = ((np.arange(n) * ribs) / n) % 1.0
    prof = np.interp(ph, [0.0, 0.18, 0.30, 0.70, 0.82, 1.0], [0.0, 0.0, 1.0, 1.0, 0.0, 0.0])
    h = np.tile(prof, (n, 1))
    if horizontal:
        h = h.T
    hs = h.copy()
    for _ in range(2):
        for ax in (0, 1):
            hs = (np.roll(hs, 1, ax) + hs + np.roll(hs, -1, ax)) / 3.0
    noise = 0.6 * fft_noise(n, n, 2.2, seed) + 0.4 * fft_noise(n, n, 0.9, seed + 1)
    nm = normals_from_height(hs + 0.03 * noise, 3.0)
    shade = (0.88 + 0.12 * hs) * (1.0 + 0.035 * noise)
    alb = np.clip(np.array(tint)[None, None, :] * shade[..., None], 0, 1)
    return alb, nm


def concrete_detail(n=1024):
    h = 0.55 * fft_noise(n, n, 2.8, 5) + 0.35 * fft_noise(n, n, 1.8, 6) + 0.25 * fft_noise(n, n, 0.8, 7)
    nm = normals_from_height(h, 0.45)
    r = np.clip(0.60 + 0.09 * fft_noise(n, n, 2.2, 8) + 0.05 * fft_noise(n, n, 0.9, 9), 0.35, 0.9)
    return nm, r


def glaze_tex():
    h, w = 256, 512
    y = np.linspace(0, 1, h)[:, None, None]
    top = np.array([0.62, 0.78, 0.93])
    bot = np.array([0.90, 0.94, 0.98])
    img = np.broadcast_to(top * (1 - y) + bot * y, (h, w, 3)).copy()
    img += (fft_noise(h, w, 2.6, 9) * 0.02)[..., None]
    return np.clip(img, 0, 1)


def bake_floor(iref):
    W, H = 2048, 1536
    dx, dz = (HX1 - HX0) / W, (HZ1 - HZ0) / H
    X, Z = np.meshgrid(HX0 + (np.arange(W) + 0.5) * dx, HZ0 + (np.arange(H) + 0.5) * dz)
    base = 0.64 + 0.045 * fft_noise(H, W, 3.2, 11) + 0.022 * fft_noise(H, W, 2.0, 12) + 0.010 * fft_noise(H, W, 0.9, 13)
    ix = ((X - HX0) // SLAB).astype(int)
    iz = ((Z - HZ0) // SLAB).astype(int)
    base += np.random.default_rng(3).uniform(-0.03, 0.03, (40, 40))[iz, ix]
    joint = (((X - HX0) % SLAB) < 1.5 * dx) | (((Z - HZ0) % SLAB) < 1.5 * dz)
    base -= 0.09 * joint
    # iluminacao + oclusao em baixa resolucao
    w, h = 512, 384
    X2, Z2 = np.meshgrid(HX0 + (np.arange(w) + 0.5) * (HX1 - HX0) / w, HZ0 + (np.arange(h) + 0.5) * (HZ1 - HZ0) / h)
    P = np.stack([X2.ravel(), np.zeros(w * h), Z2.ravel()], 1)
    N = np.zeros_like(P)
    N[:, 1] = 1.0
    f = np.clip(irradiance(P, N).reshape(h, w) / iref, 0.0, 1.15)
    ao = np.ones((h, w))
    for cx, cz in column_positions():
        d = np.hypot(X2 - cx, Z2 - cz)
        ao *= 1 - 0.32 * np.exp(-np.maximum(d - 0.55, 0) / 1.1)
    dw = np.minimum.reduce([X2 - HX0, HX1 - X2, Z2 - HZ0, HZ1 - Z2])
    ao *= 1 - 0.30 * np.exp(-dw / 2.0)
    lf = resize_lin((0.66 + 0.34 * np.clip(f, 0, 1) ** 0.7) * ao, H, W)
    col = np.clip(base * lf, 0, 1)
    return np.dstack([col, col * 0.995, col * 0.985])


# ---------------- imagens e materiais
def write_png(path, arr8):
    """PNG RGB 8 bits (linha 0 do array = base da imagem, como no Blender)."""
    import zlib
    a = np.ascontiguousarray(arr8[::-1])
    h, w, _ = a.shape
    rows = np.zeros((h, w * 3 + 1), np.uint8)
    rows[:, 1:] = a.reshape(h, -1)

    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)

    png = (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
           + chunk(b"IDAT", zlib.compress(rows.tobytes(), 3)) + chunk(b"IEND", b""))
    with open(path, "wb") as f:
        f.write(png)


def make_img(name, arr, srgb):
    # imagens "geradas" perdem o buffer no Blender; por isso grava PNG em disco e recarrega do arquivo
    if arr.ndim == 2:
        arr = np.dstack([arr, arr, arr])
    d = os.path.join(OUT_DIR, "texturas")
    os.makedirs(d, exist_ok=True)
    path = os.path.join(d, name + ".png")
    write_png(path, (np.clip(arr, 0, 1) * 255 + 0.5).astype(np.uint8))
    img = bpy.data.images.load(path, check_existing=False)
    img.name = name
    img.colorspace_settings.name = "sRGB" if srgb else "Non-Color"
    img.pack()
    return img


def tex_node(nt, img, uvmap=None, extend=False):
    n = nt.nodes.new("ShaderNodeTexImage")
    n.image = img
    n.interpolation = "Linear"
    n.extension = "EXTEND" if extend else "REPEAT"
    if uvmap:
        u = nt.nodes.new("ShaderNodeUVMap")
        u.uv_map = uvmap
        nt.links.new(u.outputs["UV"], n.inputs["Vector"])
    return n


def vc_mix(nt, b):
    ca = nt.nodes.new("ShaderNodeVertexColor")
    ca.layer_name = "Col"
    mx = nt.nodes.new("ShaderNodeMix")
    mx.data_type = "RGBA"
    mx.blend_type = "MULTIPLY"
    mx.inputs[0].default_value = 1.0
    src = b.inputs["Base Color"]
    if src.is_linked:
        nt.links.new(src.links[0].from_socket, mx.inputs[6])
    else:
        mx.inputs[6].default_value = src.default_value
    nt.links.new(ca.outputs["Color"], mx.inputs[7])
    nt.links.new(mx.outputs[2], src)


def make_mat(name, base=(0.5, 0.5, 0.5), metal=0.0, rough=0.5, color_img=None, normal_img=None, nstr=1.0,
             rough_img=None, uv2=None, emit=None, estr=0.0, emit_img=None, vcol=True, color_extend=False):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.use_backface_culling = True
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (base[0], base[1], base[2], 1.0)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    if color_img:
        t = tex_node(nt, color_img, None, color_extend)
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    if normal_img:
        t = tex_node(nt, normal_img, uv2)
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nm.inputs["Strength"].default_value = nstr
        nt.links.new(t.outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    if rough_img:
        t = tex_node(nt, rough_img, uv2)
        sp = nt.nodes.new("ShaderNodeSeparateColor")
        nt.links.new(t.outputs["Color"], sp.inputs["Color"])
        nt.links.new(sp.outputs["Green"], b.inputs["Roughness"])
    if emit is not None:
        b.inputs["Emission Color"].default_value = (emit[0], emit[1], emit[2], 1.0)
        b.inputs["Emission Strength"].default_value = estr
    if emit_img:
        t = tex_node(nt, emit_img)
        nt.links.new(t.outputs["Color"], b.inputs["Emission Color"])
        b.inputs["Emission Strength"].default_value = estr
    if vcol:
        vc_mix(nt, b)
    return m


def reset():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for dat in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.lights, bpy.data.cameras, bpy.data.curves):
        for it in list(dat):
            try:
                dat.remove(it)
            except Exception:
                pass


def stage1():
    os.makedirs(OUT_DIR, exist_ok=True)
    reset()
    iref = calc_iref()
    bpy.context.scene["galpao_iref"] = iref
    I = {}
    I["floor"] = make_img("tex_piso_cor", bake_floor(iref), True)
    cn, cr = concrete_detail(1024)
    I["conc_n"] = make_img("tex_concreto_normal", cn, False)
    I["conc_r"] = make_img("tex_concreto_rugosidade", cr, False)
    a, n = rib_tex(512, 12, (0.80, 0.82, 0.84), 21)
    I["clad_c"], I["clad_n"] = make_img("tex_parede_cor", a, True), make_img("tex_parede_normal", n, False)
    a, n = rib_tex(512, 8, (0.88, 0.89, 0.90), 31)
    I["roof_c"], I["roof_n"] = make_img("tex_cobertura_cor", a, True), make_img("tex_cobertura_normal", n, False)
    a, n = rib_tex(512, 12, (0.55, 0.62, 0.68), 41, horizontal=True)
    I["slat_c"], I["slat_n"] = make_img("tex_portao_cor", a, True), make_img("tex_portao_normal", n, False)
    I["glaze"] = make_img("tex_vidro", glaze_tex(), True)

    make_mat("M_Piso", base=(0.3, 0.3, 0.3), rough=0.6, color_img=I["floor"], normal_img=I["conc_n"], nstr=0.8,
             rough_img=I["conc_r"], uv2="UVTile", vcol=False, color_extend=True)
    make_mat("M_Concreto", base=(0.30, 0.31, 0.32), rough=0.7, normal_img=I["conc_n"], rough_img=I["conc_r"], nstr=0.8)
    make_mat("M_Estrutura", base=(0.36, 0.42, 0.49), metal=0.2, rough=0.45)
    make_mat("M_Aco_Escuro", base=(0.29, 0.37, 0.46), metal=0.55, rough=0.42)
    make_mat("M_Cabecalho", base=(0.10, 0.13, 0.17), metal=0.4, rough=0.6)
    make_mat("M_Luminaria", base=(0.45, 0.47, 0.50), metal=0.5, rough=0.45)
    make_mat("M_Seguranca", base=(0.90, 0.62, 0.02), rough=0.45)
    make_mat("M_Cladding", base=(0.8, 0.8, 0.8), metal=0.3, rough=0.5, color_img=I["clad_c"], normal_img=I["clad_n"])
    make_mat("M_Cobertura", base=(0.8, 0.8, 0.8), metal=0.25, rough=0.55, color_img=I["roof_c"], normal_img=I["roof_n"])
    make_mat("M_Portao", base=(0.8, 0.8, 0.8), metal=0.4, rough=0.45, color_img=I["slat_c"], normal_img=I["slat_n"])
    make_mat("M_Vidro", base=(0.02, 0.04, 0.06), rough=0.08, emit_img=I["glaze"], estr=0.9, vcol=False)
    make_mat("M_Led", base=(1.0, 1.0, 1.0), rough=0.4, emit=(1.0, 0.97, 0.90), estr=4.0, vcol=False)
    make_mat("M_Claraboia", base=(0.8, 0.85, 0.9), rough=0.4, emit=(0.87, 0.91, 0.93), estr=1.6, vcol=False)
    return {"iref": iref, "imagens": [i.name for i in bpy.data.images], "materiais": [m.name for m in bpy.data.materials]}


# ---------------- geometria (acumuladores por material)
class Acc:
    def __init__(s, su=1.0, sv=1.0, voff=0.0):
        s.su, s.sv, s.voff = su, sv, voff
        s.P, s.N, s.UV, s.LIT, s.F = [], [], [], [], []

    def v(s, p, n, lit=True):
        a, b, c = abs(n[0]), abs(n[1]), abs(n[2])
        if b >= a and b >= c:
            u, w = p[0], p[2]
        elif a >= c:
            u, w = p[2], p[1] + s.voff
        else:
            u, w = p[0], p[1] + s.voff
        s.P.append((p[0], p[1], p[2]))
        s.N.append((n[0], n[1], n[2]))
        s.UV.append((u * s.su, w * s.sv))
        s.LIT.append(lit)
        return len(s.P) - 1

    def quad(s, p0, p1, p2, p3, n, lit=True):
        s.F.append(tuple(s.v(p, n, lit) for p in (p0, p1, p2, p3)))

    def grid(s, corner, uvec, vvec, nu, nv, n, lit=True):
        corner, uvec, vvec, n = Vector(corner), Vector(uvec), Vector(vvec), Vector(n)
        flip = uvec.cross(vvec).dot(n) < 0
        idx = []
        for j in range(nv + 1):
            idx.append([s.v(corner + uvec * (i / nu) + vvec * (j / nv), n, lit) for i in range(nu + 1)])
        for j in range(nv):
            for i in range(nu):
                a, b, c, d = idx[j][i], idx[j][i + 1], idx[j + 1][i + 1], idx[j + 1][i]
                s.F.append((a, d, c, b) if flip else (a, b, c, d))


def AX(ry=0.0):
    c, s = math.cos(ry), math.sin(ry)
    return Vector((c, 0, -s)), Vector((0, 1, 0)), Vector((s, 0, c))


def box(acc, c, ax, ay, az, hx, hy, hz, lit=True):
    c = Vector(c)
    for n, t, b, ht, hb, hn in ((ax, ay, az, hy, hz, hx), (-ax, az, ay, hz, hy, hx), (ay, az, ax, hz, hx, hy),
                                (-ay, ax, az, hx, hz, hy), (az, ax, ay, hx, hy, hz), (-az, ay, ax, hy, hx, hz)):
        m = c + n * hn
        acc.quad(m - t * ht - b * hb, m + t * ht - b * hb, m + t * ht + b * hb, m - t * ht + b * hb, n, lit)


def abox(acc, cx, cy, cz, sx, sy, sz, ry=0.0, lit=True):
    ax, ay, az = AX(ry)
    box(acc, (cx, cy, cz), ax, ay, az, sx / 2, sy / 2, sz / 2, lit)


def beam(acc, p0, p1, w, h):
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    L = d.length
    ax = d / L
    ref = Vector((0, 1, 0)) if abs(ax.y) < 0.95 else Vector((1, 0, 0))
    ay = (ref - ax * ref.dot(ax)).normalized()
    az = ax.cross(ay)
    box(acc, (p0 + p1) / 2, ax, ay, az, L / 2, h / 2, w / 2)


def cyl(acc, p0, p1, r, seg=8, caps=True):
    p0, p1 = Vector(p0), Vector(p1)
    a = (p1 - p0).normalized()
    ref = Vector((0, 1, 0)) if abs(a.y) < 0.95 else Vector((1, 0, 0))
    u = (ref - a * ref.dot(a)).normalized()
    v = a.cross(u)
    rads = [u * math.cos(2 * math.pi * k / seg) + v * math.sin(2 * math.pi * k / seg) for k in range(seg)]
    r0 = [acc.v(p0 + rd * r, rd) for rd in rads]
    r1 = [acc.v(p1 + rd * r, rd) for rd in rads]
    for k in range(seg):
        k2 = (k + 1) % seg
        acc.F.append((r0[k], r0[k2], r1[k2], r1[k]))
    if caps:
        c1 = acc.v(p1, a)
        c1r = [acc.v(p1 + rd * r, a) for rd in rads]
        c0 = acc.v(p0, -a)
        c0r = [acc.v(p0 + rd * r, -a) for rd in rads]
        for k in range(seg):
            k2 = (k + 1) % seg
            acc.F.append((c1, c1r[k], c1r[k2]))
            acc.F.append((c0, c0r[k2], c0r[k]))


def build_all(A):
    S, D, ST, CO, CL = A["struct"], A["steel_d"], A["struct"], A["conc"], A["clad"]
    # ---- pilares (perfil H, chapa de base, chumbadores, enrijecedores)
    for x, z in column_positions():
        h = COL_H
        abox(CO, x, 0.25, z, 1.1, 0.5, 1.1)
        abox(D, x, 0.52, z, 0.9, 0.04, 0.9)
        for sx in (-1, 1):
            for sz in (-1, 1):
                cyl(D, (x + sx * 0.38, 0.54, z + sz * 0.38), (x + sx * 0.38, 0.64, z + sz * 0.38), 0.035, 6, True)
        abox(S, x, 0.88, z - 0.43, 0.62, 0.7, 0.05)
        abox(S, x, 0.88, z + 0.43, 0.62, 0.7, 0.05)
        hh = h - 0.54
        abox(S, x, 0.54 + hh / 2, z - 0.34, 0.7, hh, 0.06)
        abox(S, x, 0.54 + hh / 2, z + 0.34, 0.7, hh, 0.06)
        abox(S, x, 0.54 + hh / 2, z, 0.06, hh, 0.62)
    # ---- trelicas da cobertura (banzos, montantes, diagonais, chapas de no)
    for x in FX:
        beam(S, (x, 21.0, HZ0), (x, 21.0, HZ1), 0.24, 0.24)
        beam(S, (x, 24.4, HZ0), (x, 24.4, HZ1), 0.24, 0.24)
        i = 0
        z = HZ0
        while z < HZ1 - 0.1:
            abox(S, x, 22.7, z, 0.14, 3.4, 0.14)
            z2 = z + 3.5
            if i % 2:
                beam(S, (x, 21.0, z), (x, 24.4, z2), 0.12, 0.12)
            else:
                beam(S, (x, 24.4, z), (x, 21.0, z2), 0.12, 0.12)
            abox(D, x, 21.0, z, 0.03, 0.46, 0.46)
            abox(D, x, 24.4, z, 0.03, 0.46, 0.46)
            z += 3.5
            i += 1
        abox(S, x, 22.7, HZ1, 0.14, 3.4, 0.14)
    z = HZ0
    while z <= HZ1 + 0.01:
        abox(S, 0, 24.55, z, HX1 - HX0, 0.22, 0.14)
        z += 3.5
    for zc in (HZ0 + 0.4, -18.0, HZ1 - 0.4):
        abox(S, 0, 20.65, zc, HX1 - HX0, 0.34, 0.22)
    # ---- vigas de rolamento da ponte rolante (somente a estrutura)
    for zr in (HZ0 + 1.2, -18.7):
        abox(S, 0, 15.0, zr, HX1 - HX0, 0.9, 0.42)
        abox(D, 0, 15.5, zr, HX1 - HX0, 0.1, 0.12)
        for x in FX:
            abox(S, x, 14.2, zr + (0.3 if zr > -30 else 0.0), 0.5, 0.7, 0.9)
    # ---- paredes (concreto, fechamento metalico, faixa de janelas) + longarinas internas
    def wall(x0, z0, x1, z1):
        L = math.hypot(x1 - x0, z1 - z0)
        dx, dz = (x1 - x0) / L, (z1 - z0) / L
        Dv, Nn = Vector((dx, 0, dz)), Vector((-dz, 0, dx))
        P0 = Vector((x0, 0, z0))
        ext = 0.2
        for key, y0, y1 in (("conc", 0.0, PLINTH), ("clad", PLINTH, WIN0), ("glass", WIN0, WIN1), ("clad", WIN1, HC)):
            nu = max(1, int(round(L / 6.0)))
            nv = max(1, int(round((y1 - y0) / 2.5)))
            A[key].grid(P0 + Vector((0, y0, 0)), Dv * L, Vector((0, y1 - y0, 0)), nu, nv, Nn, True)
            A[key].grid(P0 - Dv * ext - Nn * ext + Vector((0, y0, 0)), Dv * (L + 2 * ext), Vector((0, y1 - y0, 0)), 1, nv, -Nn, False)
        mid = P0 + Dv * (L / 2)
        for yy in (WIN0, WIN1):
            box(S, mid + Nn * 0.08 + Vector((0, yy, 0)), Dv, Vector((0, 1, 0)), Nn, L / 2, 0.07, 0.09)
        s = 0.0
        while s <= L + 0.01:
            box(S, P0 + Dv * s + Nn * 0.06 + Vector((0, (WIN0 + WIN1) / 2, 0)), Dv, Vector((0, 1, 0)), Nn, 0.06, 1.2, 0.06)
            s += 4.0
        for yy in (6.5, 10.5, 14.0):
            box(S, mid + Nn * 0.075 + Vector((0, yy, 0)), Dv, Vector((0, 1, 0)), Nn, L / 2, 0.11, 0.075)

    wall(HX0, HZ0, HX1, HZ0)
    wall(HX1, HZ0, HX1, HZ1)
    wall(HX1, HZ1, HX0, HZ1)
    wall(HX0, HZ1, HX0, HZ0)
    # ---- portoes industriais (fechados), batentes, cabecalho e protecoes
    def door(x, z, w, h, ang):
        nx, nz = math.sin(ang), math.cos(ang)
        abox(A["slat"], x + nx * 0.1, h / 2, z + nz * 0.1, w, h, 0.12, ang)
        for s in (-1, 1):
            abox(S, x + math.cos(ang) * s * (w / 2 + 0.18) + nx * 0.15, (h + 0.4) / 2,
                 z - math.sin(ang) * s * (w / 2 + 0.18) + nz * 0.15, 0.35, h + 0.4, 0.35, ang)
            bx = x + math.cos(ang) * s * (w / 2 + 0.9) + nx * 0.9
            bz = z - math.sin(ang) * s * (w / 2 + 0.9) + nz * 0.9
            cyl(A["safety"], (bx, 0.0, bz), (bx, 1.2, bz), 0.16, 12, True)
        abox(A["dark"], x + nx * 0.35, h + 0.45, z + nz * 0.35, w + 1.0, 0.9, 0.7, ang)

    door(-30.0, HZ0, 7.0, 6.5, 0.0)
    door(40.0, HZ0, 7.0, 6.5, 0.0)
    door(HX0, 34.0, 6.0, 6.0, math.pi / 2)
    door(-20.0, HZ1, 8.0, 7.0, math.pi)
    # ---- cobertura com claraboias
    prev = HZ0
    bands = []
    for sz in SKY_Z:
        bands.append((prev, sz - SKY_W / 2))
        prev = sz + SKY_W / 2
    bands.append((prev, HZ1))
    for z0, z1 in bands:
        A["roof"].grid((HX0, HC, z0), (HX1 - HX0, 0, 0), (0, 0, z1 - z0), 22, max(1, int(round((z1 - z0) / 6.0))), (0, -1, 0))
    A["roof"].grid((HX0, HC + 0.12, HZ0), (HX1 - HX0, 0, 0), (0, 0, HZ1 - HZ0), 1, 1, (0, 1, 0), False)
    for sz in SKY_Z:
        A["sky"].grid((HX0, HC - 0.02, sz - SKY_W / 2), (HX1 - HX0, 0, 0), (0, 0, SKY_W), 1, 1, (0, -1, 0), True)
        for e in (-1, 1):
            abox(S, 0, HC - 0.08, sz + e * SKY_W / 2, HX1 - HX0, 0.16, 0.12)
        x = HX0 + 5.5
        while x < HX1:
            abox(S, x, HC - 0.06, sz, 0.1, 0.1, SKY_W)
            x += 5.5
    # ---- luminarias industriais (LED high-bay linear)
    LB, LD = A["lamp"], A["led"]
    for x in LAMP_X:
        for z in LAMP_Z:
            abox(LB, x, LAMP_Y, z, 2.8, 0.16, 0.56)
            for s in (-1, 1):
                abox(LB, x + s * 1.45, LAMP_Y, z, 0.08, 0.2, 0.6)
                abox(LB, x, LAMP_Y - 0.07, z + s * 0.30, 2.8, 0.1, 0.03)
            abox(LB, x, LAMP_Y + 0.14, z, 0.6, 0.1, 0.3)
            LD.grid((x - 1.3, LAMP_Y - 0.085, z - 0.21), (2.6, 0, 0), (0, 0, 0.42), 1, 1, (0, -1, 0), False)
            for dxr in (-1.1, 1.1):
                cyl(D, (x + dxr, LAMP_Y + 0.08, z), (x + dxr, HC - 0.3, z), 0.015, 6, False)


BAD = {}


def check_winding(name, acc):
    V = np.array([(p[0], -p[2], p[1]) for p in acc.P])
    Nn = np.array([(n[0], -n[2], n[1]) for n in acc.N])
    f3 = np.array([f[:3] for f in acc.F])
    nrm = np.cross(V[f3[:, 1]] - V[f3[:, 0]], V[f3[:, 2]] - V[f3[:, 0]])
    BAD[name] = int((np.einsum("ij,ij->i", nrm, Nn[f3[:, 0]]) <= 0).sum())


def make_object(name, acc, mat, coll, iref, uvs=None, vcol=True):
    me = bpy.data.meshes.new(name)
    check_winding(name, acc)
    me.from_pydata([(p[0], -p[2], p[1]) for p in acc.P], [], acc.F)
    me.update()
    loops = np.fromiter(chain.from_iterable(acc.F), dtype=np.int64)
    if uvs is None:
        uvs = [("UVMap", np.array(acc.UV, dtype=np.float32))]
    for nm, arr in uvs:
        layer = me.uv_layers.new(name=nm)
        layer.data.foreach_set("uv", np.asarray(arr, dtype=np.float32)[loops].ravel())
    if vcol:
        s = vertex_shade(acc.P, acc.N, acc.LIT, iref)
        rgba = np.ones((len(s), 4), np.float32)
        rgba[:, :3] = s[:, None]
        ca = me.color_attributes.new(name="Col", type="FLOAT_COLOR", domain="POINT")
        ca.data.foreach_set("color", rgba.ravel())
        me.color_attributes.active_color = ca
    try:
        me.shade_smooth()
    except Exception:
        pass
    me.materials.append(mat)
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    return ob


def stage2():
    sc = bpy.context.scene
    iref = sc["galpao_iref"]
    A = {
        "conc": Acc(1 / 3, 1 / 3), "struct": Acc(), "steel_d": Acc(), "dark": Acc(), "lamp": Acc(), "safety": Acc(),
        "clad": Acc(1 / 2.4, 1 / 2.4), "glass": Acc(1 / 4.0, 1 / 2.3, -WIN0), "roof": Acc(1 / 2.4, 1 / 2.4),
        "slat": Acc(1 / 1.2, 1 / 1.2), "led": Acc(), "sky": Acc(),
    }
    build_all(A)
    names = {"conc": ("Galpao_Concreto", "M_Concreto"), "struct": ("Galpao_Estrutura", "M_Estrutura"),
             "steel_d": ("Galpao_Aco_Escuro", "M_Aco_Escuro"), "dark": ("Galpao_Cabecalhos", "M_Cabecalho"),
             "lamp": ("Galpao_Luminarias", "M_Luminaria"), "safety": ("Galpao_Protecoes", "M_Seguranca"),
             "clad": ("Galpao_Paredes", "M_Cladding"), "glass": ("Galpao_Janelas", "M_Vidro"),
             "roof": ("Galpao_Cobertura", "M_Cobertura"), "slat": ("Galpao_Portoes", "M_Portao"),
             "led": ("Galpao_Led", "M_Led"), "sky": ("Galpao_Claraboias", "M_Claraboia")}
    coll = bpy.data.collections.new("Galpao")
    sc.collection.children.link(coll)
    novert_vcol = ("led", "sky", "glass")
    stats = {}
    tris = 0
    for key, acc in A.items():
        if not acc.F:
            continue
        nm, mt = names[key]
        make_object(nm, acc, bpy.data.materials[mt], coll, iref, vcol=key not in novert_vcol)
        t = sum(1 if len(f) == 3 else 2 for f in acc.F)
        stats[nm] = t
        tris += t
    # piso (UV0 = mapa unico assado; UV1 = micro-relevo repetido a cada 3 m)
    fl = Acc()
    fl.grid((HX0, 0, HZ0), (HX1 - HX0, 0, 0), (0, 0, HZ1 - HZ0), 1, 1, (0, 1, 0), True)
    P = np.array(fl.P)
    uv0 = np.stack([(P[:, 0] - HX0) / (HX1 - HX0), (P[:, 2] - HZ0) / (HZ1 - HZ0)], 1)
    uv1 = np.stack([P[:, 0] / 3.0, P[:, 2] / 3.0], 1)
    make_object("Galpao_Piso", fl, bpy.data.materials["M_Piso"], coll, iref, uvs=[("UVMap", uv0), ("UVTile", uv1)], vcol=False)
    stats["Galpao_Piso"] = 2
    tris += 2
    # luzes e camera (so no Blender; nao vao para o GLB)
    lc = bpy.data.collections.new("Luzes_e_Camera_so_Blender")
    sc.collection.children.link(lc)
    for x in LAMP_X:
        for z in LAMP_Z:
            ld = bpy.data.lights.new("Luz_%d_%d" % (x, z), "AREA")
            ld.shape = "RECTANGLE"
            ld.size, ld.size_y, ld.energy = 2.6, 0.42, 6000.0
            lo = bpy.data.objects.new(ld.name, ld)
            lo.location = (x, -z, LAMP_Y - 0.12)
            lc.objects.link(lo)
    try:
        sc.eevee.light_threshold = 0.0005
    except Exception:
        pass
    cam = bpy.data.cameras.new("Cam_Interior")
    cam.lens, cam.clip_end = 18.0, 600.0
    co = bpy.data.objects.new("Cam_Interior", cam)
    co.location = Vector((-58.0, -50.0, 6.0))
    co.rotation_euler = (Vector((18.0, 8.0, 9.0)) - co.location).to_track_quat("-Z", "Y").to_euler()
    lc.objects.link(co)
    sc.camera = co
    try:
        sc.world.use_nodes = True
        bg = sc.world.node_tree.nodes["Background"]
        bg.inputs["Color"].default_value = (0.04, 0.05, 0.07, 1.0)
        bg.inputs["Strength"].default_value = 1.0
    except Exception:
        pass
    bpy.ops.wm.save_as_mainfile(filepath=BLEND, compress=True)
    return {"triangulos_total": tris, "por_objeto": stats, "faces_invertidas": dict(BAD), "blend": BLEND}


# ---------------- exportacao e inspecao do GLB
def inspect_glb(path):
    with open(path, "rb") as f:
        data = f.read()
    clen, _ = struct.unpack("<I4s", data[12:20])
    js = json.loads(data[20:20 + clen])
    prims = [p for m in js.get("meshes", []) for p in m["primitives"]]
    attrs = sorted(set(k for p in prims for k in p["attributes"]))
    tris = sum(js["accessors"][p["indices"]]["count"] // 3 for p in prims if "indices" in p)
    imgs = []
    for im in js.get("images", []):
        bv = js["bufferViews"][im["bufferView"]]["byteLength"] if "bufferView" in im else None
        imgs.append({"nome": im.get("name"), "mime": im.get("mimeType"), "bytes": bv})
    mats = []
    for m in js.get("materials", []):
        pbr = m.get("pbrMetallicRoughness", {})
        mats.append({"nome": m.get("name"), "baseColorFactor": pbr.get("baseColorFactor"),
                     "tex": sorted(k for k in pbr if k.endswith("Texture")) + [k for k in m if k.endswith("Texture")]})
    return {"bytes": len(data), "meshes": len(js.get("meshes", [])), "primitivas": len(prims), "triangulos": tris,
            "atributos": attrs, "extensoes": js.get("extensionsUsed"), "imagens": imgs, "materiais": mats}


def stage3():
    sc = bpy.context.scene
    coll = bpy.data.collections["Galpao"]
    for ob in bpy.data.objects:
        ob.select_set(False)
    for ob in coll.objects:
        ob.select_set(True)
        bpy.context.view_layer.objects.active = ob
    props = set(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
    kw = dict(filepath=GLB, export_format="GLB", use_selection=True, export_image_format="JPEG", export_jpeg_quality=88,
              export_yup=True, export_apply=True, export_cameras=False, export_lights=False, export_extras=False,
              export_draco_mesh_compression_enable=False, export_vertex_color="ACTIVE", export_texcoords=True,
              export_normals=True, export_tangents=False, export_materials="EXPORT", export_animations=False)
    used = {k: v for k, v in kw.items() if k in props}
    ignored = sorted(k for k in kw if k not in props)
    bpy.ops.export_scene.gltf(**used)
    info = inspect_glb(GLB)
    info["opcoes_ignoradas"] = ignored
    return info


def run(stage):
    return {1: stage1, 2: stage2, 3: stage3}[stage]()

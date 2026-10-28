"""
STEP -> GLB bruto (uma malha por sólido), em metros, eixo Y para cima como no CAD.

Uso: python tools/cad/step_to_glb.py <entrada.step> <saida.glb> <deflexao_mm> <slots.json>
  slots.json: {"paint": {"solids": [0, 5]}, "steel": {"default": true}, ...}
Cada sólido recebe o material (slot) da lista em que aparece; os demais vão para o slot com "default".
Os materiais no GLB são só nomes: a cena troca cada slot por um material dela (src/core/models.ts → applySlots).
"""
import json
import struct
import sys

import numpy as np
from OCP.BRep import BRep_Tool
from OCP.BRepLib import BRepLib_ToolTriangulatedShape
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.IFSelect import IFSelect_RetDone
from OCP.STEPControl import STEPControl_Reader
from OCP.TopAbs import TopAbs_FACE, TopAbs_REVERSED, TopAbs_SOLID
from OCP.TopExp import TopExp_Explorer
from OCP.TopLoc import TopLoc_Location
from OCP.TopoDS import TopoDS


def read_step(path):
    r = STEPControl_Reader()
    if r.ReadFile(path) != IFSelect_RetDone:
        sys.exit(f"Não foi possível ler {path}")
    r.TransferRoots()
    return r.OneShape()


def solid_mesh(solid):
    P, N, I, base = [], [], [], 0
    fx = TopExp_Explorer(solid, TopAbs_FACE)
    while fx.More():
        f = TopoDS.Face(fx.Current())
        loc = TopLoc_Location()
        tri = BRep_Tool.Triangulation_s(f, loc)
        if tri is not None:
            if not tri.HasNormals():
                BRepLib_ToolTriangulatedShape.ComputeNormals_s(f, tri)
            tr = loc.Transformation()
            rev = f.Orientation() == TopAbs_REVERSED
            sign = -1 if rev else 1
            n = tri.NbNodes()
            for k in range(1, n + 1):
                p = tri.Node(k).Transformed(tr)
                P.append((p.X() / 1000, p.Y() / 1000, p.Z() / 1000))
                d = tri.Normal(k).Transformed(tr)
                N.append((sign * d.X(), sign * d.Y(), sign * d.Z()))
            for t in range(1, tri.NbTriangles() + 1):
                a, b, c = tri.Triangle(t).Get()
                if rev:
                    b, c = c, b
                I.append((base + a - 1, base + b - 1, base + c - 1))
            base += n
        fx.Next()
    return np.array(P, np.float32), np.array(N, np.float32), np.array(I, np.uint32)


def write_glb(path, parts, slot_names):
    buf, views, accs, meshes, nodes = bytearray(), [], [], [], []

    def add(arr, target, comp, typ, minmax=False):
        off = len(buf)
        data = arr.tobytes()
        buf.extend(data)
        while len(buf) % 4:
            buf.append(0)
        views.append({"buffer": 0, "byteOffset": off, "byteLength": len(data), "target": target})
        acc = {"bufferView": len(views) - 1, "componentType": comp, "count": len(arr), "type": typ}
        if minmax:
            acc["min"] = arr.min(0).tolist()
            acc["max"] = arr.max(0).tolist()
        accs.append(acc)
        return len(accs) - 1

    for name, slot, (P, N, I) in parts:
        if not len(I):
            continue
        prim = {
            "attributes": {"POSITION": add(P, 34962, 5126, "VEC3", True), "NORMAL": add(N, 34962, 5126, "VEC3")},
            "indices": add(I.reshape(-1), 34963, 5125, "SCALAR"),
            "material": slot_names.index(slot),
        }
        meshes.append({"name": name, "primitives": [prim]})
        nodes.append({"name": name, "mesh": len(meshes) - 1})
    gltf = {
        "asset": {"version": "2.0", "generator": "edge-city tools/cad/step_to_glb.py"},
        "scene": 0,
        "scenes": [{"nodes": list(range(len(nodes)))}],
        "nodes": nodes,
        "meshes": meshes,
        "materials": [{"name": n} for n in slot_names],
        "accessors": accs,
        "bufferViews": views,
        "buffers": [{"byteLength": len(buf)}],
    }
    js = json.dumps(gltf).encode()
    while len(js) % 4:
        js += b" "
    with open(path, "wb") as fo:
        fo.write(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(buf)))
        fo.write(struct.pack("<II", len(js), 0x4E4F534A))
        fo.write(js)
        fo.write(struct.pack("<II", len(buf), 0x004E4942))
        fo.write(buf)


def main():
    src, out, defl, slots_json = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
    slots = json.loads(slots_json)
    default = next((k for k, v in slots.items() if v.get("default")), None)
    owner = {i: k for k, v in slots.items() for i in v.get("solids", [])}
    shape = read_step(src)
    BRepMesh_IncrementalMesh(shape, defl, False, 0.35, True)
    parts, ex, i, tris = [], TopExp_Explorer(shape, TopAbs_SOLID), 0, 0
    while ex.More():
        slot = owner.get(i, default)
        if slot is None:
            sys.exit(f"Sólido {i} sem slot e nenhum slot com \"default\"")
        P, N, I = solid_mesh(ex.Current())
        parts.append((f"solid_{i:02d}", slot, (P, N, I)))
        tris += len(I)
        i += 1
        ex.Next()
    write_glb(out, parts, list(slots.keys()))
    print(json.dumps({"solids": i, "triangles": tris}))


if __name__ == "__main__":
    main()

import {NodeIO} from '@gltf-transform/core';
import {EXTMeshoptCompression,KHRMeshQuantization,KHRMaterialsEmissiveStrength} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions([EXTMeshoptCompression,KHRMeshQuantization,KHRMaterialsEmissiveStrength]).registerDependencies({'meshopt.decoder':MeshoptDecoder});
for(const f of ['galpao-edge-city','w22-326t','w22-326t-lo']){
  const d=await io.read('src/assets/models/'+f+'.glb'); let tri=0,m=0;
  for(const me of d.getRoot().listMeshes())for(const p of me.listPrimitives()){m++;tri+=(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3}
  const tx=d.getRoot().listTextures().map(t=>t.getSize()?.join('x'));
  console.log(f,'meshes',m,'tri',Math.round(tri),'tex',tx.join(','));
}

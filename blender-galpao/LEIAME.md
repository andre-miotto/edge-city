# Galpão da Edge City (Blender e GLB para three.js)

Ambiente arquitetônico isolado, sem máquinas, robôs, pessoas ou empilhadeiras. Não foi integrado ao projeto web.

## Arquivos

| Arquivo | Uso |
|---|---|
| `galpao_edge_city.blend` | Cena editável (13 objetos, materiais, texturas empacotadas, rig de luzes e câmera para render no Blender). |
| `galpao_edge_city.glb` | Exportação direta do Blender, sem compressão (2,7 MB). |
| `galpao_edge_city_meshopt.glb` | Mesma cena com geometria comprimida (meshopt) e quantizada (1,2 MB). É o que o `models.ts` do projeto já sabe decodificar. |
| `gerar_galpao.py` | Gerador paramétrico. Todas as medidas ficam no topo do arquivo. |
| `texturas/` | PNGs procedurais usados pelos materiais. |
| `preview_interior.png` | Render de conferência feito no Blender (EEVEE), com o rig de luzes do Blender. |

## Coordenadas

O modelo usa os mesmos eixos e medidas de `src/scene/hall.ts`: Y para cima, unidades em metros, sem escala nem rotação nos nós.

- X de −66 a 66 e Z de −42 a 56 (paredes externas avançam 0,2 m para fora).
- Cobertura em Y = 24,8; pilares até Y = 21; luminárias em Y = 18,6.
- Pilares, treliças (7 eixos), luminárias (6 × 6), claraboias (4 faixas) e 4 portões nas mesmas posições do projeto.

No Blender os eixos ficam em Z para cima: (x, y, z) do three.js corresponde a (x, −z, y) no Blender.

## O que está incluído

Piso de concreto com juntas de laje de 7,5 m, paredes com base de concreto, fechamento nervurado e faixa de janelas, 33 pilares em perfil H com chumbadores, treliças com chapas de nó, terças, longarinas internas, vigas de rolamento da ponte rolante (sem a ponte), cobertura com claraboias, 36 luminárias lineares com pendurais e 4 portões fechados com batentes e protetores.

Ficam de fora, por serem conteúdo da cena e não envoltório: mezanino, tubulações, eletrocalhas, exaustores, placas e textos no piso, marcações de piso, a ponte rolante e as máquinas.

## Iluminação e desempenho

- Sem luzes dentro do GLB. As luzes de verdade continuam sendo as do `stage.ts`.
- A iluminação assada está em cor de vértice (`COLOR_0`, escurecimento por oclusão e poças de luz sob as luminárias) e no mapa de cor do piso (2048 × 1536). Ela multiplica o albedo e soma com as luzes dinâmicas do projeto. Para neutralizar, ignore o atributo `COLOR_0` (por exemplo, `material.vertexColors = false`).
- As luminárias e as claraboias são emissivas (`KHR_materials_emissive_strength`).
- 25.476 triângulos, cerca de 44 mil vértices e 13 draw calls. Texturas: 10 imagens JPEG, cerca de 36 MB de memória de GPU com mipmaps.
- O piso usa duas coordenadas de UV: `TEXCOORD_0` para o mapa assado e `TEXCOORD_1` para o micro-relevo repetido a cada 3 m. O GLTFLoader do three r186 lê isso sem ajuste.
- O piso do projeto (140 × 110 m) é maior que o galpão. Este piso cobre só o interior (132 × 98 m).

## Regenerar

No Blender (Scripting), com o arquivo aberto ou não:

    src = open(r"CAMINHO\gerar_galpao.py", encoding="utf-8").read()
    g = {}; exec(compile(src, "gerar_galpao.py", "exec"), g)
    g["run"](1)   # texturas e materiais (reinicia a cena)
    g["run"](2)   # geometria, luzes do Blender e .blend
    g["run"](3)   # exporta o .glb

Ajuste `OUT_DIR` no topo do script. Para comprimir o GLB:

    npx gltfpack -i galpao_edge_city.glb -o galpao_edge_city_meshopt.glb -cc -kn -km -vp 16 -vt 16 -vn 10

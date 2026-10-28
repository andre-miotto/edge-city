# Modelos 3D a partir de CAD (STEP → GLB)

Converte desenhos 3D oficiais da WEG (STEP) em modelos leves para a cena. Os modelos ficam em `src/assets/models/` e entram no Git. Os arquivos STEP ficam fora dele, porque têm dezenas de MB.

## Como o processo funciona

1. **Triangulação** (`step_to_glb.py`, OpenCascade): lê o STEP e gera uma malha por sólido, em metros e com y para cima. Cada sólido recebe um **slot de material** (`paint`, `steel`, `fan`…), conforme `models.json`.
2. **Otimização** (`build.mjs`, glTF Transform + meshoptimizer):
   - junta as peças por slot (uma malha por slot, poucas chamadas de desenho);
   - simplifica a malha dentro do limite de erro;
   - comprime o resultado.
   Cada modelo pode ter mais de uma versão: uma detalhada, para ver de perto, e uma leve, para muitas cópias.
3. **Na cena** (`src/core/models.ts`): `applySlots` troca cada slot por um material da cena. Assim, cor e acabamento seguem a paleta do projeto, e não o arquivo CAD.

## Comandos

```bash
pip install -r tools/cad/requirements.txt   # uma vez (Python 3.10+)
npm run cad                                 # gera todos os modelos de models.json
npm run cad -- w22-326t --preview           # um modelo + imagem das peças numeradas em tools/cad/.cache/
```

## Adicionar um equipamento

1. Baixe o STEP no catálogo da WEG e salve em `tools/cad/source/`. Anote de onde veio em `origin`.
   - No ecatalog (Drawings 2D/3D), escolha a linha, entre numa pasta de carcaça e selecione o formato **STEP**.
   - DWG e DXF são desenhos 2D e não servem.
2. Crie a entrada em `models.json`. Deixe só o slot `default` e rode `npm run cad -- <id> --preview`.
3. Veja a imagem das peças numeradas e distribua os índices dos sólidos entre os slots.
4. Ajuste `ratio` e `error` de cada saída. São metas de simplificação: a malha só é reduzida enquanto o erro fica abaixo de `error` (fração do tamanho do modelo).
5. Use o modelo na cena com `loadModels`/`applySlots` (`src/core/models.ts`). Depois confira com `npm run shots` e `npm run test:visual`.

## Cuidados

- **Uso da marca:** o CAD é disponibilizado para projeto de engenharia. Antes de mostrar o material a clientes, confirme o uso com o marketing da WEG.
- **Escala:** o modelo sai em tamanho real. Se a cena usa uma escala de vitrine, como no motor monitorado, a ampliação fica no código que posiciona o modelo.
- **Peças internas:** sólidos que nunca aparecem (rotor, rolamentos) devem ir para `dropSolids` em todas as saídas.

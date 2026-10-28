# Instruções para assistentes de IA (Claude) neste repositório

Edge City é uma demonstração 3D do WEGnology Edge Suite (WES) para clientes da WEG, feita com TypeScript, Three.js r186 e Vite 7. O código é mantido por IA. Por isso, os testes e os tipos são a revisão: nada é concluído sem eles.

Toda atualização deve **alterar os módulos existentes**. Não recrie a cena do zero nem gere um HTML monolítico novo.

## Fluxo de trabalho para cada pedido

1. Leia `docs/ARCHITECTURE.md` e localize os módulos envolvidos.
2. Para mudanças grandes, apresente um plano curto antes de editar.
3. Edite os módulos.
   - Para um setor novo: crie o arquivo em `src/areas/`, registre a etapa em `src/main.ts` e o tipo `AfterX` em `src/ctx.ts`.
   - Prefira mudanças pequenas, com um commit por assunto.
4. Rode `npm run check` (tipos, lint, testes unitários) e `npm test` (build, carga, rotas e câmera).
   - Lógica nova e pura (cálculo, rota, roteiro) ganha teste em `tests/unit/`.
5. Rode `npm run test:visual`.
   - Se o visual mudou **de propósito**, revise as capturas em `tests/output/` e as diferenças em `tests/output/diff/`. Só então rode `npm run test:visual -- --update` e explique no commit o que mudou.
   - Nunca atualize as referências para "fazer o teste passar" sem olhar as imagens.
6. Registre a mudança em `docs/CHANGELOG.md`. Se mudar a arquitetura, atualize `docs/ARCHITECTURE.md`.
7. Para publicar, use `npm run build` e envie `dist/edge-city.artifact.html`.

## Regras de conteúdo (não negociáveis)

- **Fluxo técnico:** Máquina/sensor → CLP → protocolos industriais → WES → MCP → IA externa. A IA **nunca** lê o motor ou o sensor diretamente.
- **Fonte de dados:** só o sensor **TT-01** (motor W22 monitorado) alimenta os valores do WES. Sensores, robôs, WMRs e operadores novos são **demonstrativos** e devem ser identificados assim.
- **Fidelidade ao WES:** não simule funcionalidades que o WES não tem. Os módulos mostrados são Dispositivos, Tags · UNS, Historian, Alarmes, Telas, Scripts, Relatórios, Datasets e Segurança. O nome do produto é **WES / WEGnology Edge Suite** (nunca "FrameworX").
- **Equipamentos:**
  - Os **motores W22** usam a geometria do **CAD oficial WEG** (`tools/cad/`). Os demais equipamentos (robô, CLP, centros de usinagem, WMR) são desenhos originais inspirados nas referências. Não os apresente como réplicas oficiais.
  - O WMR segue as medidas públicas do WMR-100 (750 × 530 × 430 mm); cores e módulo superior são ilustrativos.
  - Não crie nem baixe visuais de produtos WEG sem o André validar a fonte. Peça a ele o arquivo oficial.
- **Paleta:** azul-marinho `#061528`, azul WEG `#00579D`, ciano `#23C1E6` **só para fluxos de dados**, branco-azulado `#EAF3FB`, ardósia `#5F8FB8`, âmbar `#F2A33A` **só para alarmes**. Materiais industriais (aço, concreto, madeira, cobre) são livres.
  - Nas telas 2D (canvas) e no HUD, use os valores da paleta.
  - Na cena 3D, os fluxos aparecem em `0x68e2f4` e os destaques azuis em `0x77c5ff`. São os tons exibidos desde a primeira versão, mantidos na migração para o r186. Não os "corrija" para os valores da paleta sem pedido do André, porque isso muda o visual aprovado.
- **Marca WEG:** discreta e só onde faz sentido (motores, painéis, sinalização). Não invente logotipos.
- **Segurança das cenas:** pessoas nunca ficam dentro da área de um braço robótico. WMRs e pedestres respeitam as zonas de cruzamento.
- **Câmera:** não atravessa objetos. Para ir para trás da tela do WES, `ui/camRoute.ts` usa os corredores laterais.

## Convenções técnicas

- **Contexto tipado:** cada etapa recebe o contexto das anteriores (`AfterX`) e devolve `Object.assign(ctx, { ... })` com o que publica. Os tipos são deduzidos (veja `src/ctx.ts`).
  - Não leia de `ctx` algo publicado por uma etapa posterior; o compilador recusa.
  - Quando precisar reagir a algo montado depois, exponha um gancho (`hooks`) e deixe a etapa posterior preenchê-lo (exemplo: `controls.hooks`, `tour.hooks`).
- **Tipos:**
  - Não use `as any` nem `@ts-ignore` para silenciar erros. Modele o tipo ou corrija o código.
  - Tipos de domínio ficam em `logistics/types.ts` e `areas/types.ts`.
  - O projeto está na fase 1 do TypeScript (`noImplicitAny: false`). Código novo deve anotar os parâmetros mesmo assim.
- **Three.js r186:**
  - Cores hex são sRGB.
  - Texturas de canvas usam `colorSpace = THREE.SRGBColorSpace`.
  - Luzes estão em unidades físicas (veja "Cor e luz" em ARCHITECTURE).
  - Não use APIs removidas: `sRGBEncoding`, `outputEncoding`, `PCFSoftShadowMap`, `THREE.Clock` (obsoleta desde r183).
  - Addons vêm de `three/addons/...`.
- **Modelos 3D:** entram pelo pipeline `npm run cad` (`tools/cad/models.json`). Na cena, use `applySlots` para trocar os slots pelos materiais da paleta. Não carregue modelos da internet em tempo de execução.
- **Sem rede:** fontes e modelos são embutidos. O teste de carga falha se a página fizer requisições externas.
- **Estado que muda no tempo** fica em `ctx.time` (`clock`, `pt1`, `cellRun`, `fixed`), `ctx.tour.state` e `ctx.AREAS`. Não copie esses valores para variáveis soltas.
- **Animações** são funções do tempo, chamadas pelo laço único em `loop.ts` (ou por `AREAS.update` em `areas/life.ts`). Não crie outro `requestAnimationFrame`.
- **Geometria estática:** agrupe por material com `Builder` (`core/builder.ts`); use `VB` para cor por vértice e `InstancedMesh` (`areas/kit.ts → inst`) para itens repetidos.
- **Desempenho:** respeite o orçamento de `tests/smoke.mjs` (`BUDGET`). Para subir um limite, justifique em `docs/CHANGELOG.md`.
- **Colisões:** todo equipamento novo em área de circulação deve registrar um colisor (`box2(x0, x1, z0, z1)`).
- **Lógica testável:** módulos de cálculo não acessam `window` nem o DOM ao serem importados, para rodarem nos testes unitários.
- **Coordenadas:** metros; y para cima; a Linha 1 corre em +x ao longo de z = 0; o visitante começa em z positivo olhando para −z.
- **Comentários e textos de interface** em português do Brasil.
- **Ganchos de teste** ficam em `src/debug.ts` (`window.__look`, `__sim`, `__info`, `__checkCamera`…). Se mudar nomes, atualize `tests/`.

## Cuidados conhecidos

- O global `ai` existe em navegadores recentes, então o ESLint desliga esse global para não esconder a variável da tela da IA (`ctx.ai`).
- `dist/edge-city.artifact.html` é gerado por `scripts/artifact.mjs`: a página sem `<html>/<head>/<body>`, com o `<title>` no topo.
- Testes em máquina sem GPU usam SwiftShader e são lentos (minutos). Não rode duas sessões de navegador ao mesmo tempo, porque elas disputam a CPU. Encerre processos do Chromium que sobrarem.

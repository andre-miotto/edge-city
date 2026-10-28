# Arquitetura da Edge City

## Visão geral

- Página única em **TypeScript** com **Three.js r186** (WebGLRenderer), empacotada pelo **Vite 7**.
  - O build gera um só `dist/index.html`, com JS, CSS, fontes, imagens e modelos 3D embutidos.
  - Não depende de rede: abre offline.
- `index.html` contém só a marcação do HUD. A cena é montada por `src/main.ts`.
- As etapas de montagem compartilham um objeto de contexto (`ctx`). Cada etapa lê o que precisa e devolve o contexto com o que criou.
- Um único laço (`src/loop.ts`) anima tudo a partir de um relógio central.

## Contexto tipado (`src/ctx.ts`)

```ts
export function buildHall(ctx: AfterMaterials) {
  // … lê ctx.M, ctx.scene …
  return Object.assign(ctx, { HX0, HX1, door, fans /* … */ });
}
// em ctx.ts:
export type AfterHall = ReturnType<typeof buildHall>;
```

- O tipo de cada etapa é deduzido do código. Ninguém escreve à mão os mais de 100 campos do contexto.
- Uma etapa só enxerga o que as anteriores publicaram. Ler algo que só existe depois **não compila**.
- Quando um módulo precisa reagir a algo montado depois, ele expõe **ganchos** (`hooks`), preenchidos pela etapa posterior. Exemplos:
  - os controles chamam `hooks.takeOver()`, que a visita guiada preenche;
  - o clique no canvas chama `hooks.click(e)`, que o painel do WMR preenche.
- Para incluir uma etapa:
  1. crie a função no módulo;
  2. acrescente uma linha em `main.ts`, na posição certa;
  3. acrescente o tipo `AfterX` em `ctx.ts` e use-o como parâmetro da etapa seguinte.

## Ordem de montagem (`src/main.ts`) e o que cada etapa publica

| #   | Módulo                         | Função                 | Publica                                                                                                                                              |
| --- | ------------------------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | `main.ts`                      | `boot`                 | `canvas`, `imgs`, `models` (GLB carregados), `time {clock, pt1, cellRun, fixed}`                                                                     |
| 1   | `scene/stage.ts`               | `createStage`          | `renderer`, `scene`, `camera`, `maxAniso` (luzes e ambiente de reflexos)                                                                             |
| 2   | `scene/materials.ts`           | `createMaterials`      | `M`, `MP`, `MR`, `LED`, `K` (inclui `K.motor`, o motor W22 do CAD), `unitLo`, `mesh`, `colliders`, `box2`, materiais e texturas                      |
| 3   | `scene/hall.ts`                | `buildHall`            | dimensões do galpão (`HX0`, `HX1`, `HZ0`, `HZ1`, `HC`), `mk`/`rect`/`lineM`, `floorText`, `door`, `hangSign`, `fans`, `pipeM`                         |
| 4   | `equipment/monitoredMotor.ts`  | `buildMonitoredMotor`  | `C` (altura do eixo), `led`, `ttRing`, `sensorTop` (saída do cabo do TT-01)                                                                          |
| 5   | `equipment/productionLines.ts` | `buildProductionLines` | `cell1`, `cell2`, `xRoll`, `XV2`                                                                                                                     |
| 6   | `areas/workshop.ts`            | `buildWorkshop`        | — (manutenção, montagem manual, porta-paletes, usinagem, expedição)                                                                                  |
| 7   | `scene/crane.ts`               | `buildCrane`           | `crane`, `trolley`                                                                                                                                   |
| 8   | `equipment/clp.ts`             | `buildCLP`             | `clpCv`, `clpTex`                                                                                                                                    |
| 9   | `areas/kit.ts`                 | `createAreaKit`        | `AREAS` (registro: pessoas, pedestres, frota, animações, pontos de interesse) e ferramentas (`A`, `mk2`, `L`, `inst`, `binAt`, `plate`, `rect2`…) |
| 10  | `areas/stations.ts`            | `buildStations`        | `STN` (estantes de troca de caixas dos WMR)                                                                                                          |
| 11  | `areas/warehouse.ts`           | `buildWarehouse`       | —                                                                                                                                                    |
| 12  | `areas/charging.ts`            | `buildCharging`        | `chLed`                                                                                                                                              |
| 13  | `areas/lab.ts`                 | `buildLab`             | `testCoup`                                                                                                                                           |
| 14  | `areas/line3.ts`               | `buildLine3`           | `R3`                                                                                                                                                 |
| 15  | `areas/support.ts`             | `buildSupport`         | `wrapG`, `wrapCar`                                                                                                                                   |
| 16  | `areas/finish.ts`              | `finishAreas`          | — (gera instâncias, junta malhas estáticas, luzes por setor)                                                                                         |
| 17  | `people/crowd.ts`              | `buildCrowd`           | `ZONES`, `inZ`, `walkUpdate`                                                                                                                         |
| 18  | `logistics/fleet.ts`           | `buildFleet`           | `FLEET`, `wmrUpdate`, `animUpdate`                                                                                                                   |
| 19  | `areas/life.ts`                | `buildAreaLife`        | — (preenche `AREAS.update` e `AREAS.pois`)                                                                                                           |
| 20  | `data/screens3d.ts`            | `buildScreens`         | `wes`, `ai`, `as`, `chatCv`, `WW`, `WH`, `AW`, `AH`, `toW`, `wesWorld`                                                                               |
| 21  | `data/flows.ts`                | `buildFlows`           | cabos (`curveS`, `curveC`, `curveM`), pulsos, sobreposições, chips, `updateFlows`                                                                    |
| 22  | `data/conversation.ts`         | `createConversation`   | `conv`, `st`, `askNext`, `resetChat`, `setStatus`, `itemsAt`, `updateConversation`                                                                   |
| 23  | `ui/controls.ts`               | `createControls`       | `controls` (jogador, colisão, voltar ao início, `hooks`)                                                                                             |
| 24  | `ui/tour.ts`                   | `createTour`           | `tour` (visita, voos, acompanhamento de WMR, `hooks`)                                                                                                |
| 25  | `ui/wmrPanel.ts`               | `createWmrPanel`       | `wmrPanel`                                                                                                                                           |
| 26  | `ui/hud.ts`                    | `createHud`            | `hud`                                                                                                                                                |
| 27  | `loop.ts`                      | `startLoop`            | —                                                                                                                                                    |
| 28  | `debug.ts`                     | `installDebugHooks`    | ganchos `window.__*` para os testes                                                                                                                  |

Módulos sem contexto, importados diretamente:

- `core/*`: matemática, desenho 2D, `Builder`/`VB`, texturas, fontes, modelos 3D e `el()` (elementos do HUD).
- `screens/*`: arte 2D do WES, da IA e do CLP.
- `equipment/motor.ts`, `equipment/robot.ts`, `equipment/cell.ts`.
- `people/person.ts`, `logistics/wmrModel.ts` e `ui/camRoute.ts`.
- Tipos de domínio:
  - `logistics/types.ts`: WMR, rota, estação, animação de caixas;
  - `areas/types.ts`: registro `AREAS`, pedestre, zona, ponto de interesse.

Os módulos de lógica pura (`core/math`, `logistics/wmrModel`, `ui/camRoute`, `screens/chatScreen`) não acessam `window` nem o DOM ao serem importados. É isso que permite testá-los fora do navegador.

## Laço por quadro (`src/loop.ts`)

1. `tour.update` e depois `controls.update`: câmera guiada ou navegação livre.
2. Produção: `cell1.update(pt1)`, `cell2.update(clock + 5.3)`, roletes da transferência.
3. `AREAS.update`: operadores, pedestres, WMRs, caixas, ensaios, envolvedora e robô de aparafusamento. Depois `wmrPanel.update`.
4. Exaustores, ponte rolante, LED e anel do TT-01, redesenho do CLP a cada 0,15 s.
5. `updateFlows`: pulsos nos cabos e caminho do dado dentro da tela do WES.
6. `updateConversation`: chips da consulta MCP, anéis nos módulos, status e tela da IA (até 30 fps).
7. Renderização.

## Tempo

- `time.clock` move tudo, exceto a célula 01.
- `time.pt1` é o tempo de produção da célula 01 e para quando o botão "Pausar célula" está ativo.
- `?freeze=<s>` na URL para o tempo num instante fixo (`time.fixed`). Os testes visuais usam isso para comparar capturas entre versões.
- O ciclo da célula dura `CELL.T = 16 s`. O robô pega o motor entre 3,2 e 4,0 s, solta entre 9,8 e 10,5 s, e a esteira avança uma posição (3,375 m) por ciclo.
- A visita guiada calcula uma espera para chegar à célula logo antes de um ciclo começar.

## Cor e luz (convenções do Three.js r186)

- **Cores em hex são sRGB**, como aparecem na tela sob luz neutra. O Three.js converte para linear.
  - Isso vale para materiais, luzes, cores por vértice (`VB`) e cores por instância (`inst`).
  - Névoa (`scene.fog`) e fundo (`scene.background`) são exibidos exatamente com o hex dado.
- **Texturas desenhadas em canvas** (telas, placas, logotipos) recebem `colorSpace = THREE.SRGBColorSpace`.
- **Luzes em unidades físicas.**
  - Pontuais e spots usam `decay = 0` (luz de "artista", que só se apaga perto de `distance`).
  - As intensidades atuais foram convertidas do r128 para manter a mesma aparência (comentários em `scene/stage.ts` e `areas/finish.ts`).
- **Sombras:** `PCFShadowMap`. O `PCFSoftShadowMap` foi removido no r186.
- **Contagem de desempenho:** desde o r15x, `renderer.info` soma a passada de sombras. O gancho `__info()` separa a passada principal da de sombras.

## Modelos 3D de CAD (`tools/cad/`, `src/core/models.ts`)

- **Origem:**
  - STEP oficial da WEG convertido em GLB comprimido (meshopt) por `npm run cad`. Detalhes em `tools/cad/README.md`.
  - Os STEP ficam em `tools/cad/source/` (fora do Git). Os GLB ficam em `src/assets/models/` (no Git).
- **Materiais por slot:** os materiais do GLB são só nomes (`paint`, `steel`, `fan`). `applySlots` troca cada slot por um material da cena. Um slot sem correspondência gera erro na montagem.
- **Versões do W22 326T:**
  - `w22-326t.glb`: ~17 mil triângulos, 3 slots. Usada no motor monitorado (TT-01), ampliado ~5,9× para a escala de vitrine.
  - `w22-326t-lo.glb`: ~3,4 mil triângulos, sem ventilador nem parafusos. Usada nos motores das linhas, berços e bancadas (`equipment/motor.ts → motorParts`), ampliados 2,8× por unidade de tamanho e juntados às peças estáticas pelo `Builder`.
  - A versão leve vem sem normais: elas são recalculadas ao carregar, com quebra nas arestas vivas acima de 35°.
- **Carcaças nas estantes do almoxarifado:** são instâncias procedurais (`K.finG`), não o modelo CAD.

## Coordenadas (metros, y para cima)

| Elemento                    | Posição                                                                   |
| --------------------------- | ------------------------------------------------------------------------- |
| Galpão                      | x −66…66, z −42…56, cobertura a 24,8 m                                    |
| Corredor principal          | z 9…13; faixas WMR em z 12,2 (oeste) e 9,8 (leste)                        |
| Corredor central            | x 2…5 (do corredor principal até o fundo)                                 |
| Motor monitorado (TT-01)    | grupo em (−30, 0, 0); eixo a 2,3 m; ponta do eixo em x = −27,25           |
| Linha 1 / célula 01         | esteira x −26,2…−9,8 em z 0; robô em (−21,6, −4,6); alimentação em z −7,6 |
| Transferência e teste final | x −8, de z 0 a −21; recinto em x −11,5…−4,5, z −25,5…−16,5                |
| CLP                         | (−4,2, 0, 0,4)                                                            |
| Tela do WES                 | centro (21, 9,8, −8), 27,5 m de largura                                   |
| Tela da IA                  | (45,5, …, −1,5), girada −0,55 rad                                         |
| Linha 2 / célula 02         | grupo em (−66, 0, −34), girado 180°                                       |
| Almoxarifado                | x 37,6…64,6, z 14,4…54,6                                                  |
| Laboratório de ensaios      | x 8,5…34,5, z −38…−16,4                                                   |
| Linha 3                     | x 36,4…58,6, z −36,4…−13,4                                                |
| Recarga WMR                 | x 29,8…35,4, z 14,4…16,8                                                  |

## Logística (ilustrativa)

- **WMR-01:** separação A no almoxarifado → supermercado da Linha 1. Leva caixas cheias e volta com as vazias.
- **WMR-02:** saída da usinagem → entrada da Linha 3.
- **WMR-03:** fica carregando na estação de recarga.
- **Rotas:** pontos com cantos arredondados (`makePath`). Os robôs desaceleram antes das curvas e giram no lugar nas docas.
- **Cruzamentos:** `ZONES` é uma lista de zonas que um robô ou pedestre reserva antes de entrar. Os robôs também param se houver alguém no corredor à frente.
- **Troca de caixas:** as caixas deslizam entre o robô e a estante (`STN`). As vazias voltam ao almoxarifado.

## Testes e integração contínua

| Comando / teste       | O que verifica                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`   | TypeScript (modo estrito, fase 1: tipos implícitos ainda permitidos)                                     |
| `npm run lint`        | ESLint (typescript-eslint)                                                                               |
| `npm run test:unit`   | Vitest em `tests/unit/`: matemática, rotas dos WMR, rota da câmera, roteiro da IA (segundos, sem navegador) |
| `tests/smoke.mjs`     | Carrega sem erros nem requisições externas; desenha a cena dentro do orçamento (`BUDGET`)               |
| `tests/routes.mjs`    | 15 min simulados: ciclos completos, sem colisão entre WMRs, pedestres e equipamentos                     |
| `tests/camera.mjs`    | Visita, logística, voos entre áreas e acompanhamento do WMR sem atravessar objetos                       |
| `npm run test:visual` | Compara 10 capturas com tempo parado com `tests/baseline/`; diferenças em `tests/output/diff/`          |
| `npm run shots`       | Capturas de referência em `tests/output/` para revisão                                                   |

- `npm run check` reúne tipos, lint e testes unitários.
- `npm test` faz o build e roda carga, rotas e câmera.
- Os testes da cena usam Chromium com renderização por software (SwiftShader), que é lenta. As capturas levam alguns minutos.
- **CI** (`.github/workflows/ci.yml`): a cada push, roda `check`, build, testes da cena e teste visual. As capturas e o build ficam disponíveis como artefatos da execução.
- **Orçamento atual (vista inicial, passada principal):** ~650 chamadas de desenho e ~660 mil triângulos. Limites: 800 chamadas e 750 mil triângulos.

## TypeScript: próximas fases

- **Fase 1 (atual):** `strict` com `noImplicitAny: false`.
  - Os parâmetros sem anotação ainda são `any`.
  - O que já está tipado: o contexto inteiro, os tipos de domínio (WMR, rotas, pessoas, visita, conversa), `Builder`/`VB` e os modelos.
- **Fase 2:** ligar `noImplicitAny` por pasta (`core/` → `logistics/` → `ui/` → `areas/`) e anotar os parâmetros restantes.

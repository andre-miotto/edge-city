/**
 * Edge City — ponto de entrada.
 * Carrega imagens e modelos 3D e monta a cena na ordem abaixo. Cada etapa recebe o contexto compartilhado,
 * lê o que precisa e devolve o contexto com o que criou (veja src/ctx.ts e docs/ARCHITECTURE.md).
 */
import './styles/hud.css';
import wegLogoUrl from './assets/weg_white.png';
import wesIconUrl from './assets/wes_icon.png';

import { initUG } from './core/builder';
import { loadImg, el } from './core/env';
import { loadModels } from './core/models';
import { loadFonts } from './core/fonts';
import type { BaseCtx } from './ctx';
import { createStage } from './scene/stage';
import { createMaterials } from './scene/materials';
import { buildHall } from './scene/hall';
import { buildCrane } from './scene/crane';
import { buildMonitoredMotor } from './equipment/monitoredMotor';
import { buildProductionLines } from './equipment/productionLines';
import { buildCLP } from './equipment/clp';
import { buildWorkshop } from './areas/workshop';
import { createAreaKit } from './areas/kit';
import { buildStations } from './areas/stations';
import { buildWarehouse } from './areas/warehouse';
import { buildCharging } from './areas/charging';
import { buildLab } from './areas/lab';
import { buildLine3 } from './areas/line3';
import { buildSupport } from './areas/support';
import { finishAreas } from './areas/finish';
import { buildCrowd } from './people/crowd';
import { buildFleet } from './logistics/fleet';
import { buildAreaLife } from './areas/life';
import { buildScreens } from './data/screens3d';
import { buildFlows } from './data/flows';
import { createConversation } from './data/conversation';
import { createControls } from './ui/controls';
import { createTour } from './ui/tour';
import { createHud } from './ui/hud';
import { createWmrPanel } from './ui/wmrPanel';
import { bakeFloor } from './scene/floorBake';
import { bakeEnvironment } from './scene/environment';
import { startLoop } from './loop';
import { installDebugHooks } from './debug';

(el('brandIcon') as HTMLImageElement).src = wesIconUrl;

async function boot() {
  try {
    await loadFonts();
  } catch (e) {
    console.warn('Fontes embutidas não carregaram; usando as do sistema.', e);
  }
  const imgs = { weg: await loadImg(wegLogoUrl), wes: await loadImg(wesIconUrl) };
  const models = await loadModels();
  initUG();

  const base: BaseCtx = {
    canvas: el('gl') as HTMLCanvasElement,
    imgs,
    models,
    time: { clock: 0, pt1: 0, cellRun: true },
  };

  // Cada etapa recebe o contexto das anteriores e devolve o mesmo objeto com o que publicou (veja ctx.ts).
  // Para incluir uma etapa: uma linha nova aqui, na posição certa, e o tipo correspondente em ctx.ts.
  // 1. palco e materiais
  const stage = createStage(base);
  const materials = createMaterials(stage);
  // 2. galpão e equipamentos principais (demonstração do WES)
  const hall = buildHall(materials);
  const motor = buildMonitoredMotor(hall);
  const lines = buildProductionLines(motor);
  const workshop = buildWorkshop(lines);
  const crane = buildCrane(workshop);
  const clp = buildCLP(crane);
  // 3. setores ampliados, pessoas e logística (ilustrativos)
  const kit = createAreaKit(clp);
  const stations = buildStations(kit);
  const warehouse = buildWarehouse(stations);
  const charging = buildCharging(warehouse);
  const lab = buildLab(charging);
  const line3 = buildLine3(lab);
  const support = buildSupport(line3);
  const finish = finishAreas(support);
  const crowd = buildCrowd(finish);
  const fleet = buildFleet(crowd);
  const life = buildAreaLife(fleet);
  // 4. telas do WES e da IA, fluxos de dados e conversa
  const screens = buildScreens(life);
  bakeFloor(screens); // piso com sombra de contato: precisa de todos os colisores
  const flows = buildFlows(screens);
  const conversation = createConversation(flows);
  // 5. interação e laço
  const controls = createControls(conversation);
  const tour = createTour(controls);
  const panel = createWmrPanel(tour);
  const hud = createHud(panel);
  bakeEnvironment(hud); // reflexos e luz indireta a partir do galpão montado
  installDebugHooks(startLoop(hud));
  el('loading')!.classList.add('done');
}

boot().catch((e) => {
  el('loading')!.textContent = 'Não foi possível iniciar o 3D neste navegador: ' + e.message;
  console.error(e);
});

/**
 * Tipos do contexto compartilhado `ctx`.
 * Cada etapa de montagem (ordem em main.ts) recebe o contexto das etapas anteriores e devolve o mesmo objeto
 * acrescido do que publica. Os tipos são deduzidos do código: uma etapa que tenta ler algo publicado depois não compila.
 */
import type { Models } from './core/models';
import type { createStage } from './scene/stage';
import type { createMaterials } from './scene/materials';
import type { buildHall } from './scene/hall';
import type { buildMonitoredMotor } from './equipment/monitoredMotor';
import type { buildProductionLines } from './equipment/productionLines';
import type { buildWorkshop } from './areas/workshop';
import type { buildCrane } from './scene/crane';
import type { buildCLP } from './equipment/clp';
import type { createAreaKit } from './areas/kit';
import type { buildStations } from './areas/stations';
import type { buildWarehouse } from './areas/warehouse';
import type { buildCharging } from './areas/charging';
import type { buildLab } from './areas/lab';
import type { buildLine3 } from './areas/line3';
import type { buildSupport } from './areas/support';
import type { finishAreas } from './areas/finish';
import type { buildCrowd } from './people/crowd';
import type { buildFleet } from './logistics/fleet';
import type { buildAreaLife } from './areas/life';
import type { buildScreens } from './data/screens3d';
import type { buildFlows } from './data/flows';
import type { createConversation } from './data/conversation';
import type { createControls } from './ui/controls';
import type { createTour } from './ui/tour';
import type { createWmrPanel } from './ui/wmrPanel';
import type { createHud } from './ui/hud';
import type { createDrive } from './ui/drive';
import type { startLoop } from './loop';
import type { installDebugHooks } from './debug';

export interface Imgs {
  weg: HTMLImageElement | null;
  wes: HTMLImageElement | null;
}

export interface BaseCtx {
  canvas: HTMLCanvasElement;
  /** Logotipo WEG e ícone do WES (null se a imagem não carregar: a cena segue sem eles). */
  imgs: Imgs;
  models: Models;
  /** Relógio central (veja loop.ts). `fixed`: tempo parado para capturas (?freeze). */
  time: { clock: number; pt1: number; cellRun: boolean; fixed?: boolean };
}

export type AfterStage = ReturnType<typeof createStage>;
export type AfterMaterials = ReturnType<typeof createMaterials>;
export type AfterHall = ReturnType<typeof buildHall>;
export type AfterMonitoredMotor = ReturnType<typeof buildMonitoredMotor>;
export type AfterProductionLines = ReturnType<typeof buildProductionLines>;
export type AfterWorkshop = ReturnType<typeof buildWorkshop>;
export type AfterCrane = ReturnType<typeof buildCrane>;
export type AfterCLP = ReturnType<typeof buildCLP>;
export type AfterAreaKit = ReturnType<typeof createAreaKit>;
export type AfterStations = ReturnType<typeof buildStations>;
export type AfterWarehouse = ReturnType<typeof buildWarehouse>;
export type AfterCharging = ReturnType<typeof buildCharging>;
export type AfterLab = ReturnType<typeof buildLab>;
export type AfterLine3 = ReturnType<typeof buildLine3>;
export type AfterSupport = ReturnType<typeof buildSupport>;
export type AfterFinish = ReturnType<typeof finishAreas>;
export type AfterCrowd = ReturnType<typeof buildCrowd>;
export type AfterFleet = ReturnType<typeof buildFleet>;
export type AfterAreaLife = ReturnType<typeof buildAreaLife>;
export type AfterScreens = ReturnType<typeof buildScreens>;
export type AfterFlows = ReturnType<typeof buildFlows>;
export type AfterConversation = ReturnType<typeof createConversation>;
export type AfterControls = ReturnType<typeof createControls>;
export type AfterTour = ReturnType<typeof createTour>;
export type AfterWmrPanel = ReturnType<typeof createWmrPanel>;
export type AfterHud = ReturnType<typeof createHud>;
export type AfterDrive = ReturnType<typeof createDrive>;
export type AfterLoop = ReturnType<typeof startLoop>;
export type AfterDebug = ReturnType<typeof installDebugHooks>;

/** Contexto completo, depois de todas as etapas. */
export type Ctx = AfterDebug;

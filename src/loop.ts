/**
 * Laço principal: um único relógio para toda a cena.
 * - time.clock: tempo geral (fluxos de dados, IA, Linha 2, WMR, pessoas).
 * - time.pt1: tempo de produção da célula 01 (para quando a célula é pausada).
 */
import { drawCLP } from './screens/clpPanel';
import type { AfterHud } from './ctx';

export function startLoop(ctx: AfterHud) {
  const { renderer, scene, camera, canvas, controls, tour, time, imgs } = ctx;
  const { cell1, cell2, xRoll, XV2, AREAS, wmrPanel, fans, crane, trolley, HZ0, led, ttRing, clpCv, clpTex } = ctx;
  const { updateFlows, updateConversation } = ctx;
  let prev = performance.now(),
    lastClp = -1,
    frameNo = 0;
  // ?freeze=<segundos>: tempo parado num instante fixo (capturas determinísticas dos testes visuais)
  const freeze = Number(new URLSearchParams(location.search).get('freeze'));
  if (freeze > 0) {
    time.fixed = true;
    time.clock = time.pt1 = freeze;
  }

  function resize() {
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < h ? 78 : 62;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  function frame(now) {
    const dt = time.fixed ? 0 : Math.min(0.1, (now - prev) / 1000);
    prev = now;
    time.clock += dt;
    const t = time.clock;

    // câmera: visita/voo ou navegação livre
    tour.update(dt);
    controls.update(dt);
    const player = controls.player;
    camera.position.copy(player.pos);
    camera.rotation.set(player.pitch, player.yaw, 0);

    // produção (célula 01 pausável) e vida da fábrica
    if (time.cellRun) time.pt1 += dt;
    cell1.update(time.pt1, time.cellRun);
    cell2.update(t + 5.3, true);
    if (xRoll.map) xRoll.map.offset.x = -((time.pt1 * XV2) / (2 * Math.PI * 0.09)) % 1;
    AREAS.update(t, dt);
    wmrPanel.update(t);
    fans.forEach((f, i) => (f.rotation.x = t * (2.2 + i * 0.3)));
    crane.position.x = -36 + 20 * Math.sin(t * 0.045);
    trolley.position.z = (HZ0 + 1.2 - 18.7) / 2 + 5 * Math.sin(t * 0.07 + 1);

    // sensor TT-01 e CLP
    led.material.color.setHex(Math.sin(t * 5) > 0 ? 0x68e2f4 : 0x45a0d2);
    ttRing.material.opacity = 0.45 + 0.4 * Math.max(0, Math.sin(t * 5));
    ttRing.scale.setScalar(1 + 0.08 * Math.sin(t * 2.5));
    if (t - lastClp > 0.15) {
      drawCLP(clpCv, t, imgs);
      clpTex.needsUpdate = true;
      lastClp = t;
    }

    // dados: fluxo industrial contínuo e consultas da IA via MCP
    updateFlows(t);
    updateConversation(t);

    // O mapa de sombras cobre o galpão todo e é o item mais caro do quadro. As sombras dependem só da luz e dos objetos
    // (não da câmera), então atualizá-las em quadros alternados corta esse custo pela metade, sem diferença visível.
    renderer.shadowMap.needsUpdate = frameNo++ % 2 === 0;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return ctx;
}

/**
 * Laço principal: um único relógio para toda a cena.
 * - time.clock: tempo geral (fluxos de dados, IA, Linha 2, WMR, pessoas).
 * - time.pt1: tempo de produção da célula 01 (para quando a célula é pausada).
 */
import { drawCLP } from './screens/clpPanel';
import type { AfterDrive } from './ctx';

export function startLoop(ctx: AfterDrive) {
  const { renderer, scene, camera, canvas, controls, tour, time, imgs } = ctx;
  const { cell1, cell2, xRoll, XV2, AREAS, wmrPanel, fans, crane, trolley, HZ0, led, ttRing, clpCv, clpTex } = ctx;
  const { updateFlows, updateConversation, drive } = ctx;
  let prev = performance.now(),
    lastClp = -1,
    lastShadow = -Infinity;
  let frameMs = 16;
  // ms entre atualizações do mapa de sombras: ~15 Hz e, se o quadro está lento, mais espaçado (4 quadros), até 4 Hz.
  // Assim a passada de sombras (centenas de chamadas) não cai em quase todo quadro de uma GPU já no limite.
  const shadowEvery = () => Math.min(250, Math.max(66, frameMs * 4));
  // ?freeze=<segundos>: tempo parado num instante fixo (capturas determinísticas dos testes visuais)
  const freeze = Number(new URLSearchParams(location.search).get('freeze'));
  if (freeze > 0) {
    time.fixed = true;
    time.clock = time.pt1 = freeze;
  }

  function resize() {
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    if (!w || !h) return; // ainda sem layout: aspect = NaN deixaria a câmera inválida e a tela em branco
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < h ? 78 : 62;
    camera.updateProjectionMatrix();
  }
  // ResizeObserver cobre o 'resize' da janela e também o primeiro layout do canvas, que pode vir depois da carga
  new ResizeObserver(resize).observe(canvas);
  resize();

  function frame(now) {
    // O próximo quadro é pedido antes de tudo: uma exceção num quadro não pode matar o laço (tela parada, só o HUD).
    requestAnimationFrame(frame);
    // O 'now' do rAF é o início do quadro e pode ser anterior ao performance.now() da partida (primeiro quadro):
    // sem o piso em 0, o dt negativo fazia o relógio da cena andar para trás.
    const ms = Math.max(0, now - prev);
    const dt = time.fixed ? 0 : Math.min(0.1, ms / 1000);
    frameMs += (Math.min(100, ms) - frameMs) * 0.05; // média móvel do tempo de quadro
    prev = now;
    time.clock += dt;
    const t = time.clock;

    // câmera: visita/voo ou navegação livre
    tour.update(dt);
    controls.update(dt);
    drive.update(dt); // empilhadeira: dirige e, se estiver em uso, posiciona a câmera
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
    // (não da câmera) e o que se move é lento (WMR, pessoas, empilhadeira), então elas são atualizadas por tempo
    // (~15 Hz, mais espaçado se o quadro está lento) e não por quadro: o custo cai com a mesma proporção em qualquer taxa de quadros. Com o tempo parado
    // (?freeze) atualiza sempre, para as capturas dos testes.
    if (time.fixed || now - lastShadow >= shadowEvery()) {
      renderer.shadowMap.needsUpdate = true;
      lastShadow = now;
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  return ctx;
}

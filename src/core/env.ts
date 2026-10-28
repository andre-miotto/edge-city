/** Ambiente do navegador: preferência de movimento reduzido e carga de imagens. */

export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Carrega uma imagem; resolve com `null` se ela não existir (a cena continua sem o logotipo). */
export function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((r) => {
    const i = new Image();
    i.onload = () => r(i);
    i.onerror = () => r(null);
    i.src = src;
  });
}

/** Elemento do HUD pelo id. Falha logo na montagem se o index.html não tiver o elemento. */
export function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const e = document.getElementById(id);
  if (!e) throw new Error(`Elemento #${id} não existe no index.html`);
  return e as T;
}

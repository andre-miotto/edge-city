/**
 * Fontes da interface e das telas (IBM Plex, licença OFL), embutidas no build.
 * A cena não depende de rede: abre offline e os testes renderizam o mesmo texto em qualquer máquina.
 * Só o subconjunto latino (português incluído).
 */
import sans400 from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2?url';
import sans500 from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2?url';
import sans600 from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2?url';
import sans700 from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff2?url';
import mono500 from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2?url';
import mono600 from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2?url';

const FACES: [string, string, string][] = [
  ['IBM Plex Sans', sans400, '400'],
  ['IBM Plex Sans', sans500, '500'],
  ['IBM Plex Sans', sans600, '600'],
  ['IBM Plex Sans', sans700, '700'],
  ['IBM Plex Mono', mono500, '500'],
  ['IBM Plex Mono', mono600, '600'],
];

/** Registra e carrega as fontes antes de desenhar as telas (o texto dos canvas usa essas fontes). */
export async function loadFonts() {
  await Promise.all(
    FACES.map(async ([family, url, weight]) => {
      const f = new FontFace(family, `url(${url})`, { weight, style: 'normal', display: 'swap' });
      document.fonts.add(await f.load());
    }),
  );
}

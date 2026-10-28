# Histórico

## 2.0.0 — Motor de desenvolvimento novo e motor W22 oficial

- **Three.js r128 → r186, Vite 5 → 7.**
  - Cores e luzes migradas para o gerenciamento de cor e as unidades físicas atuais, mantendo a aparência. Comparação com capturas de tempo parado: luminância dentro de 1%; as diferenças ficam nas bordas de textos.
  - Sombras em `PCFShadowMap` (o `PCFSoftShadowMap` foi removido).
- **TypeScript.**
  - Todo o código foi migrado.
  - O contexto entre etapas passou a ser tipado por dedução: ler algo antes de existir não compila.
  - Tipos de domínio para WMR, rotas, pessoas, visita e conversa.
  - Fase 1 (`noImplicitAny` desligado).
- **Motor W22 do CAD oficial WEG (carcaça 326T, STEP do ecatalog).**
  - Motor monitorado: versão detalhada (~17 mil triângulos), com base redimensionada e o TT-01 assentado na carcaça real.
  - Motores das linhas, berços e bancadas: versão leve (~3,4 mil triângulos).
  - Pipeline `npm run cad` (`tools/cad/`).
- **Fontes IBM Plex embutidas:** a página não usa mais rede e abre offline.
- **Testes.**
  - Novos: unitários (Vitest), visual (comparação com `tests/baseline/`) e orçamento de desempenho no teste de carga.
  - Modo `?freeze=` para capturas determinísticas.
  - Integração contínua no GitHub Actions.
- **Custo da vista inicial:** de 717 para ~650 chamadas de desenho. Os triângulos subiram de ~546 mil para ~660 mil, por causa dos motores CAD.

## 1.0.0 — Edge City (estrutura do projeto)

- Projeto reorganizado em módulos ES (Vite + Three.js 0.128), em pastas por responsabilidade, sem mudança de comportamento.
- Build gera um arquivo único (`dist/index.html`) e a versão para artifact (`dist/edge-city.artifact.html`).
- Testes automatizados: carga, rotas dos WMR e câmera sem atravessar objetos.
- Nome do projeto: **Edge City**.

## Antes da estrutura (versões publicadas como artifact)

- **Fábrica ampliada:**
  - Novos setores: almoxarifado com porta-paletes por família, estações de troca de caixas, laboratório de ensaios, Linha 3 com aparafusamento robotizado, controle de qualidade, embalagem, estoque intermediário, CCM, utilidades e escritório.
  - Frota WMR com três robôs.
  - 15 operadores com EPI e 2 pedestres.
  - Painel do WMR, menu de áreas e visita da logística.
- **Fábrica industrial:** galpão completo, célula robotizada com robô de 6 eixos e ciclo de 16 s, linha de motores W22 em berços, inspeção, transferência, teste final, Linha 2, ponte rolante, visita guiada sincronizada e pausa da célula.
- **Showroom 3D:** motor, esteira, CLP, telas do WES e da IA, fluxos de dados e conversa via MCP.
- **Vídeos (v1 a v6.1):** animação explicativa do fluxo do dado do sensor até o WES e a IA.

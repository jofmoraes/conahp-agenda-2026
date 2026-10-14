# B18-K - Abertura / splash: mudança isolada para QA

Data: 2026-10-14 BRT. Fonte: B18-J release estável, Issue #3 comentários 6165938153 e 6166163205. Base exata commit `4423d0ed208bc65144b5997258ae9a1dd68662cc`; branch `feat/b18-flora-ux`.

## Diagnóstico

A abertura de PWA instalada acontece em duas fases distintas:
1. **Splash nativa do Chrome/Android**: renderizada pelo sistema/navegador antes do HTML, com os dados de `manifest.webmanifest` (ícone e cores). Não aceita título/subtítulo HTML personalizado. Um círculo azul pode corresponder à máscara/adaptive icon da PWA ou a ícone armazenado no lançamento. Ícones originais conferidos: PNG any/maskable 192/512 e logo CONAHP não são uma imagem vazia. Sem screenshot/inspeção do dispositivo da Flora, a identidade exata da tela reportada **não foi comprovada**.
2. **Loading interna HTML**: `#startup` já tem SVG, 'Carregando agenda', '14 e 15 de outubro · São Paulo' e spinner no B18-J. O estilo crítico inline antigo definia apenas a tela azul e o flex externo; layout da logo, título, subtítulo e indicador dependiam de `/b18.css`. Isso cria risco real de apresentação incompleta durante CSS frio ou lento. Quando o fetch é rápido, `b18.js` remove a tela no tempo natural, de modo que o usuário pode nem vê-la. **Não é falha de persistência nem deve ser corrigido com espera artificial.**

## Delta mínimo

**Somente `public/index.html`**: completar dentro do mesmo `<style>` crítico os estilos dos filhos `#startup` (disposição vertical, dimensões da logo, tipografia, divisor, indicador e reduced motion); inserir `<link rel="preload" href="/logo-conahp.svg" as="image" ...>` para priorizar a mesma logo já aprovada. Nenhum elemento/tela duplicado, nenhum JS ou delay adicionado.

**Nenhuma alteração** em `b18.js`, `b18.css`, `service-worker.js`, `manifest.webmanifest`, `schedule.json`, `schedule-utils.js`, logo SVG, quatro PNGs, `localStorage`, filtros, backup, programação, notas, interesse, prioridades, attendance, autenticação, Cloudflare ou Sheets. Navegação do SW já é network-first com fallback offline, portanto, online, o HTML novo será lido sem limpar caches; offline pode conservar a versão anterior funcional até reconexão. Nunca orientar Flora a limpar dados ou reinstalar.

**iOS:** a documentação da Apple permite `apple-touch-startup-image`, mas a compatibilidade depende de telas e orientações exatas. Sem modelos iPhone/iPad-alvo, não há cobertura confiável para imagens estáticas; nenhuma foi adicionada. Os metadados `apple-mobile-web-app-capable` e `apple-touch-icon` da B18-J permanecem.

Referências técnicas: https://web.dev/learn/pwa/web-app-manifest/ ; https://developer.chrome.com/docs/lighthouse/pwa/splash-screen ; https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html ; https://web.dev/learn/pwa/enhancements .

## QA e limites

- **PASS (Chromium DOM, 320,360,390,412,768,1280):** HTML com stylesheet não disponível e com CSS restaurado. Em ambos, layout centralizado, fundo azul, título/data visíveis, indicador, sem overflow. Com `.is-complete` a tela desaparece sem delay adicional; reduz animação sob `prefers-reduced-motion`. Arquivo local `tests/b18k_splash_qa.py` do pacote QA e verificação estática versionada `tests/b18k_startup_static.py`.
- **PASS:** `node --check public/b18.js`, integridade SHA1 de 8 assets oficiais de B18-J, manifesto/PNG e layout crítico.
- **NOT_RUN/BLOCKED_EXTERNAL:** navegador real HTTP da preview e abertura pelo ícone Android/iOS. A navegação Playwright simulada foi bloqueada por `net::ERR_BLOCKED_BY_ADMINISTRATOR` antes de servir o HTML (não é falha do app). Comportamento de cold/hot cache real no dispositivo, splash nativa Android e startup Apple ainda requerem QA do proprietário. Os modos 'cold/warm' testados são **simulações de ausência/presença de CSS**, não cache de SW real.
- **FAIL remanescente:** nenhum nos testes executados.

## Liberação/rollback

Publicar B18-K apenas como *preview* Vercel `prj_WUBhR8G0dDeyvESLAOc1jB3L5OwU`, sem alias estável. Produção mantém B18-J `dpl_HdVB9FKzCLFUnYwwuU9d7LHpkCtW`. Em eventual problema, basta manter/reassociar alias a esse deployment; não excluir localStorage nem caches da usuária. A preview tem hostname/localStorage próprio. O proprietário precisa comparar a tela HTML em navegador comum e ícone instalado, sabendo que a splash nativa anterior à primeira pintura **não é controlável pelo HTML**.

**Status: `B18_K_SPLASH_READY_FOR_OWNER_QA` significa candidata pronta para teste, não prova de splash nativa customizada.**
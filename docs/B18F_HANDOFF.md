# CONAHP B18-F - Refinamento final de UX Flora

Data: 2026-10-14 (BRT). Base: branch `feat/b18-flora-ux`, B18-E HEAD `247878e58eed6f53cd3433c6b72a67ea287c03f0`, preview B18-E `dpl_Fp596egAVphFPGpgZ5CCZn2n7EwK`. Projeto Vercel `prj_WUBhR8G0dDeyvESLAOc1jB3L5OwU`.

## Delta mínimo

- `public/b18.css`: hierarquia tipográfica responsiva (principalmente telas 320 a 412px), seleção azul-escuro / branco para abas, dias e Agenda/Lista, controles com alvo de toque ~44px, estados de interesse cinza / verde / amarelo / vermelho, hachura cinza+branco de serviços, adaptação da duração de Boas-vindas, modal flex e área de rolagem com rodapé e `env(safe-area-inset-bottom)`. Remove o fundo branco sob a logo transparente.
- `public/b18.js`: Lista com seleção exclusiva por três botões de interesse, salvamento imediato confirmado antes do rerender; ícones ✓ + `aria-pressed`; agenda e interesse independentes. Serviço sem ações em Lista/Agenda, inclusive cerimônia de abertura sem participantes. Editor de detalhes reorganizado: escolhas de interesse em 4 botões, inclusão/retirada em botão único, prioridade em botões, detalhes, comentários/perguntas, rodapé. Esconde a caixa visual de aderência estimada sem apagar fonte/temas. Preserva rascunho e reconcilia campos de rascunho antigos com alterações feitas depois na Lista, evitando sobrescrita silenciosa. `Limpar filtros` preserva dia, aba e visualização escolhidos.
- `public/index.html`: rótulo de limpeza `Limpar filtros`.
- `public/service-worker.js`: atualização **exclusivamente da versão de cache público** para `conahp-b18f-public-v1`, garantindo JS/CSS atualizados sem tocar localStorage nem dados privados. Nenhum ícone, manifest ou programação foram alterados.
- `tests/b18_reload_qa.py`: atualização dos seletores de teste substituídos por botões; `tests/b18f_browser_qa.py`: novo teste responsivo e de UX.

## QA realmente executado (Chromium local, com API de programação simulada)

- `node --check public/b18.js`: PASS.
- `python tests/b18f_browser_qa.py`: PASS 320,360,390,412,768,1280, sem overflow/pageerror. Duas sessões simultâneas lado a lado, letra mínima da grade, Boas-vindas sem clipping, hachura, serviços sem ação, seletor de interesse exclusivo e `aria-pressed`, paleta/contraste calculado >=4,5:1 nos botões não selecionados, modais e safe-area, Esc, rascunho, inclusão independente do interesse, persistência imediata, persistência de prioridade/comentários/perguntas, export e import JSON, limpar filtros sem reiniciar dia/view.
- `python tests/b18_reload_qa.py`: PASS com chave legada sintética, registro legado intacto, interesse mapeado só para UI, nova pergunta e comentários, inclusão, dia e visualização preservados após recarga.
- `python tests/b18_browser_qa.py`: PASS em seis larguras, sem erros.
- Comparação byte a byte com pacote B18-E: `schedule.json`, `schedule-utils.js`, `logo-conahp.svg`, manifest e os quatro PNGs PWA inalterados. 32 IDs oficiais únicos preservados.
- **NOT_RUN:** smoke HTTP real em hostname Vercel, uso no Android real, importação no dispositivo original da Flora e sincronização remota. Não inferir persistência remota a partir de localStorage.

## Dados e segurança

Chaves inalteradas: `conahp2026:flora:preferences:b18`, `conahp2026:public-filters:v1`, `conahp2026:b18:legacy-snapshot:v1`. Exportação/importação continuam funcionais. Não excluir/renomear registros, não alterar prioridade ou `attending` ao mudar somente o interesse. Não alterar RIW, Cloudflare, Apps Script, Google Sheets ou Vercel Blob.

## Entrega e rollback

- Branch canônica `feat/b18-flora-ux`, sem PR/merge main.
- Nova preview Vercel e ID devem constar no último comentário da Issue #3. Não promover automaticamente à URL estável.
- Produção (antes desta missão): `https://conahp-flora-2026.vercel.app` -> B17 `dpl_AU2bxMsMMbThebHSYnZ2VdbFJk57`.
- Cada hostname da preview mantém localStorage isolado. Primeiro exportar backup JSON no hostname antigo, depois importar na nova preview para conferir dados; a preview vazia não demonstra perda. Antes de promover, validar com Flora. Se falhar após promoção, reatribuir alias da produção ao deployment B17, sem limpar `localStorage`.

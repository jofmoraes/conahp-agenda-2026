# B18-H - Ajustes finais UX Flora

Data: 2026-10-14 (BRT). Base: `feat/b18-flora-ux`, B18-G HEAD `5462346126b07315b85a46b1704cb26cb2359a80`. Aplicação estática CONAHP Agenda 2026 no projeto Vercel `prj_WUBhR8G0dDeyvESLAOc1jB3L5OwU`.

## Escopo implementado

1. `Minha agenda`: contador circular independente do rótulo, posicionado junto à margem interna direita, com contagem acessível (singular/plural) atualizada pelo mesmo `render()` após salvar participações. Conta eventos oficiais com `attending=true` em ambos os dias, inclusive qualquer registro antigo de evento de serviço já salvo, para ser consistente com a aba.
2. Legenda: quatro interesses, `Gap` e `Conflito` numa linha, responsivos em seis larguras. Em 320 px, abreviaturas visuais `Não an.` e `Conf.` preservam rótulos completos em `title` e `aria-label`. `Gap` é **somente a legenda**, com `title="Evento de serviço oficial"`; todos os registros continuam `Evento de serviço`, sem renomear título, ID ou semântica.
3. Evento de serviço: fundo claro `#f8fafb`, texto `#49616e` (contraste estimado 6,23:1), borda esquerda branca de 5/6 px, contorno cinza discreto; nenhum botão ou editor técnico. Horários e posições intactos.
4. Grid: cartões paralelos de três colunas, dois colunas baixos e slots curtos ganham classe `event-compact`; ocultam `.event-track` **antes** de truncar títulos. Horário e título visíveis primeiro; `aria-label`/`title` continuam contendo título oficial completo, e clique continua a abrir modal. Conferidos os IDs c26-s005, c26-s006, c26-s007 às 12h de quarta-feira, todos em colunas lado a lado, duração igual.
5. Filtro Prioridade: grupo de seis botões `Todas`, `Essencial`, `Alta`, `Média`, `Baixa`, `Sem`, seleção exclusiva via `aria-pressed`. `Todas` mapeia para estado `priority=''` (sem filtro), enquanto `Sem` filtra as preferências cujo campo `priority` é ausente/vazio. Prioridade **da sessão** e opções do modal de detalhes não mudaram; a chave UI B17 mantém o mesmo campo `priority` string.
6. Filtro `Em relação a agora`: grupo Todos/Agora/Próximos/Encerrados, comportamento original `all/current/next/past`, `America/Sao_Paulo` e `relativeMatch()` preservados.
7. Inclusão: CTA primário escuro `+ Incluir na minha agenda` e estado incluído `✓ Retirar da minha agenda` azul-claro `#d7eaf3`/texto `#174660` (contraste ~8,14:1); igual na Lista e Detalhes, sem alterar estado de interesse, prioridade, anotações ou perguntas. No modal, alterações continuam sendo rascunho até clicar em `Salvar preferências`.
8. Loading interna existente B18-G preservada sem duplicação ou espera artificial, logo oficial, `Carregando agenda`, `14 e 15 de outubro · São Paulo`, fundo `#073b5c`, exibida durante a promessa de carregamento e dispensada ao concluir. Manifest/PWA/Splash Android **não alterados**.
9. Service worker: mudança **somente do nome da versão do cache público** para `conahp-b18h-public-v1`, mantendo localStorage intacto. Nenhum arquivo de programação, imagem, marca ou ícone modificado.

## Arquivos

- Aplicação: `public/index.html`, `public/b18.js`, `public/b18.css`, `public/service-worker.js`.
- Testes: `tests/b18h_browser_qa.py` criado; `tests/b18_browser_qa.py`, `tests/b18f_browser_qa.py`, `tests/b18g_regression_qa.py`, `tests/b18g_browser_qa.py` atualizados exclusivamente para executar controles por botões em substituição aos antigos `<select>` e rótulos da nova UX; `tests/b18_reload_qa.py` mantido.
- Documentação: `docs/B18H_HANDOFF.md` e `docs/DELIVERY.md`.
- **Imutáveis, comparados byte por byte com pacote B18-G:** `public/schedule.json` SHA-1 `0eb7a64a6d10afde2b9890969518a80024cdca03`, `public/schedule-utils.js` `603002d521d4ccb03a6830805dda56b8c83c3234`, `logo-conahp.svg` `b06b4ce8037cd67ff7bc06122931a16f49ed20b4`, os quatro ícones PNG e `manifest.webmanifest` `e8969612104f3e205b81face97f1009c6f54fd3a`. 32 sessões e IDs oficiais preservados.

## QA realmente executado

- **PASS** `node --check public/b18.js`.
- **PASS** `python tests/b18h_browser_qa.py` (Chromium DOM com `fetch` do cronograma simulado): 320, 360, 390, 412, 768, 1280 px, nenhuma rolagem horizontal/pageerror; seis indicadores em linha; badge e `aria-label` zero/um; evento serviço sem `data-open`, borda branca e contorno; c26-s005/006/007 em três colunas e `.event-track` ocultada; interesse independente da intenção de assistir; escolha exclusiva dos filtros `Todas` vs `Sem`; `Agora` mapeado a `current`; modal, prioridade, comentários/perguntas e rascunho; inclusão/retirada em Lista e modal; persistência de registros após recarga; backup exportado; splash HTML com `fetch` retardado **sem delay artificial no produto**. Ícones/manifest e programação íntegros.
- **PASS** `python tests/b18_browser_qa.py` (6 larguras), `python tests/b18_reload_qa.py` (legado bruto B17 intacto e notas/questões após reload), `python tests/b18f_browser_qa.py`, `python tests/b18g_regression_qa.py`, `python tests/b18g_browser_qa.py` (6 larguras cada, incluindo modal longo, contraste, exportação e importação de backup, filtros, conflitos e legados). Tests historicamente específicos foram atualizados para a nova marcação, não mudando comportamento testado.
- **PASS** 7 solicitações GET HTTP local por `urllib` para index/JS/CSS/schedule/manifest/logo/ícone. Isto **não equivale** a navegação HTTPS/HTTP Chromium real.
- **PASS** contraste calculado de serviço 6,23:1 e de botão de retirada 8,14:1. **FAIL**: nenhum entre os cenários executáveis.
- **NOT_RUN** abertura HTTP externa no Vercel, instalação PWA / splash Android nativa, uso no smartphone físico e migração/recuperação de dados reais do proprietário. O Chromium disponível neste runtime bloqueia navegação HTTP localhost/hostname externos (`ERR_BLOCKED_BY_ADMINISTRATOR` em B18-G), portanto QA usa DOM simulado, não promete teste remoto. Não testada sincronização entre dispositivos, que não existe no produto atual.

## Persistência e rollback

- Chaves inalteradas: `conahp2026:flora:preferences:b18`, `conahp2026:public-filters:v1`, `conahp2026:b18:legacy-snapshot:v1`; schema do backup, leitura de legados, eventos oficiais, conflitos e registros mantidos. O valor interno `Alto interesse` segue armazenado intacto, interface mostra `Interesse`.
- Cada URL preview Vercel usa origem/localStorage distinta. Fazer backup JSON da origem anterior e importar manualmente na preview nova, preservando registros conflitantes por padrão.
- Produção estável deverá continuar em B17 deployment `dpl_AU2bxMsMMbThebHSYnZ2VdbFJk57`; **não promover automaticamente**. Preview B18-G `dpl_7mmy6qaoeESWouBhZGNpZy5r4Ar8` preservada para rollback de QA. Se uma futura promoção falhar, reatribuir o alias estável ao deployment B17, sem limpar localStorage.
- Nenhum Codex, PowerShell Windows, PR, Code Review, agente paralelo, Cloudflare, Apps Script, Sheets, RIW, GSH, JFM, login, API remota ou Blob criado.

**Gate:** B18-H candidata pendente de preview Vercel READY e QA real do proprietário. Status final solicitado: `B18_H_READY_FOR_OWNER_QA`, apenas após implantação e verificação da preview.

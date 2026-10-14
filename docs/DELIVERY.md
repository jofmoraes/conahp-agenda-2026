# Estado operacional - CONAHP Agenda 2026

Atualizado em: 2026-10-09 (preparação inicial).

## Situação verificada
- Repositório: `jofmoraes/conahp-agenda-2026`, público, branch padrão `main`, criado vazio.
- Repositório RIW: `jofmoraes/riw-agenda-2026`, referência de frontend PWA, Worker, Apps Script e Google Sheets.
- Nesta etapa há apenas documentação e Issues. **Nenhum frontend, backend, planilha, login ou deployment CONAHP implementado.**
- Limites: NO_PR / NO_AUTOMATIC_CODE_REVIEW / NO_CODEX_WITHOUT_EXPLICIT_ACTIVATION. Sem mudança RIW/GSH; sem deploy não autorizado.

## Missões e dependências
- M1: fundação isolada, esquema, autenticação/autorização viável, ponta a ponta mínima. Próxima ação técnica.
- M2: paridade funcional RIW adaptada CONAHP, importação do programa, perfis, filtros, conflitos, PWA. Depende da M1.
- M3: integração, testes e publicação controlada. Depende de M2 e autorização de deploy.
- M4: complementos de expositores, pôsteres, compromissos. Pode ter **curadoria de dados independente** após modelo M1; implementação não bloqueia M1-M3.

## Gates de autorização
- Criar/publicar Cloudflare Worker ou Apps Script, modificar permissões de conta, configurar serviços, ativar custos ou gravar dados reais de usuários: exigir autorização específica.
- Antes de qualquer push que possa ligar deploy, verificar configuração de Workers Builds, GitHub Actions e outros gatilhos.
- Antes de usar Codex/Work, obter autorização explícita para a execução; execução manual de prompt pelo usuário é ativação delimitada. Nenhuma revisão automática de PR.

## Pendências reais
1. Executor verificar árvore completa e comportamentos reais do RIW, incluindo inconsistências do README antigo e código atual.
2. Arquitetura de autenticação com acesso fácil em celulares e identidade validada no servidor (não meramente seleção de perfil).
3. Novo backend/planilha isolados (precisarão de autorização de configuração em serviço externo).
4. Programação oficial conferida e normalizada, incluindo horários paralelos e atualização da fonte.
5. Juliana pode usar app desde MVP mesmo sem curadoria; LinkedIn fica para depois.
6. Expositores e pôsteres dependem de fontes oficiais confiáveis.

## Critério de auditoria
Para cada Issue exigir: SHA, mudanças implementadas, testes executados e resultados, falhas/bloqueios reais, verificação de dados e efeito de deploy. Fechamento apenas após auditoria pelo orquestrador; não marcar integração ou publicação sem verificação.

## Histórico e aprendizado
- 2026-10-09: metodologia importada seletivamente do GSH. Um orquestrador + um executor; missões completas; estado durável no GitHub; sem PR; análise de gatilhos de deploy; testes proporcionais.
- Próximo passo: ativação manual da Missão 1 após publicação das Issues.


## 2026-10-14 - B18-E GPT Web

- Projeto público Flora em Vercel confirmado: `prj_WUBhR8G0dDeyvESLAOc1jB3L5OwU`, B17 pré-existente `dpl_AU2bxMsMMbThebHSYnZ2VdbFJk57`, sem vínculo Git/CI, persistência apenas no navegador do proprietário.
- B18 implementado em `feat/b18-flora-ux`, sem merge/PR/Codex; ZIP `f1ff3cc05504b59857090fa099ac0a5b5cd953be3bac97f183c1a540bc9a44b8` armazenado no Drive conforme docs/B18_HANDOFF.md.
- Testes locais DOM Chromium seis larguras PASS, 32 sessões oficiais/110 participantes/21 conflitos PASS; pendente validação HTTPS/usuária no mesmo domínio, chave legada específica e PWA real. Nenhuma alteração em Cloudflare, Apps Script ou Sheets, backend remoto não disponível. Status: B18_CANDIDATE_READY_FOR_EXTERNAL_QA.


### B18-E - prévia Vercel corrigida, READY (2026-10-14 BRT)

- **Branch:** `feat/b18-flora-ux`, commit do ajuste mais recente `ca3c9a5c82b12e38c00492e410e6a89fb0f546fe` (aplicação + docs, sem PR e sem integração na main).
- **Deployment de prévia:** `dpl_Fp596egAVphFPGpgZ5CCZn2n7EwK`, estado Vercel `READY`, endereço https://conahp-flora-2026-3h2aok23h-joao-moraes-projects-9bc51b2e.vercel.app/ . Produção ainda B17 `dpl_AU2bxMsMMbThebHSYnZ2VdbFJk57` no alias principal. Preview anterior `dpl_DzWpGP1j6aAASLdSvHtpmr2sVQcR` foi substituída como candidata pela correção de Agenda default.
- **Readback de build:** 12 arquivos conforme fonte e hashes (JS revisado `44802fe5044a4d4abaad268e705462974d38630a`, cronograma `0eb7a64a6d10afde2b9890969518a80024cdca03`, logo `b06b4ce8037cd67ff7bc06122931a16f49ed20b4`), manifest 4 PNGs any/maskable verificado por API, SW público verificado por API.
- **QA ampliado:** `node --check public/b18.js` PASS; `tests/b18_browser_qa.py` PASS em Chromium 320/360/390/412/768/1280 sem pageerrors/overflow; `tests/b18_reload_qa.py` PASS simulando recarga com localStorage compartilhado: legado bruto intacto, edição de nota/pergunta, intenção, dia e visualização persistem; 32 sessões/110 participantes/21 conflitos e PNGs conforme original PASS.
- **Artefatos:** pacote atualizado `CONAHP_B18_UX_FLORA_READY_FOR_OWNER_QA.zip` SHA-256 `ae720f4f0b0393a1e60f521e3091b6c5fb8b23c504f97c2f6f87bef6c5f399c4` gerado e disponibilizado pelo executor; primeira candidata `CONAHP_B18_UX_FLORA_CANDIDATE.zip` SHA-256 `f1ff3cc05504b59857090fa099ac0a5b5cd953be3bac97f183c1a540bc9a44b8` preservada em Drive https://drive.google.com/file/d/1nL9FY-b5SoB1mfuakS7soK7p7ZdD1WUy/view .
- **Bloqueio verificável:** HTTP externo do preview e produção inacessível neste runtime (DNS do container e ferramenta web), por isso smoke HTTPS/UI/SW reais continuam NOT_RUN; formato completo da chave B17 não lido pelo Vercel API. Não houve migração no navegador real nem comprovação de leitura cruzada; por segurança **não promovido** ao alias principal, sem falso `B18_UX_READY`. Próximo gate: Flora exportar backup B17 e abrir preview sem alterar alias principal, validar preferências existentes/dados, então produção poderá ser promovida com rollback B17 preservado.


### B18-F, 2026-10-14 BRT (UX Flora)
- Base B18-E HEAD `247878e58eed6f53cd3433c6b72a67ea287c03f0`; alterados `public/index.html`, `public/b18.js`, `public/b18.css`, `public/service-worker.js` (somente versão de cache) e testes. `docs/B18F_HANDOFF.md` contém escopo, testes e rollback.
- Verificações Chromium simuladas: JS parse PASS; nova QA B18-F 320/360/390/412/768/1280 PASS; regressão B18 original PASS seis larguras; reload/legados PASS. Paleta com contraste >=4,5 em botões, serviço sem CTA, Boas-vindas cabe, modal safe-area e fechamento, rascunho e ausência de overwrite de decisão anterior, backup JSON PASS. 32 sessões oficiais e todos os PNG/manifest/logo mantidos BYTE-FOR-BYTE. Sem prova HTTP externa/mobile físico.
- Pacote auditável B18-F SHA-256 `5046fd41fe5ed1170dcbd08514262135cbf354495139e76c5e47084057c903f6` no Drive: https://drive.google.com/file/d/1Zguye22oOKlM1sVvVzVrzCMmn8W1rXbm/view . Preview nova e hash de commit reportados na Issue #3 após implantação. Status `B18_F_READY_FOR_OWNER_QA` significa candidata em preview, não produção liberada.
- Preservar production alias B17 `dpl_AU2bxMsMMbThebHSYnZ2VdbFJk57`. Dados localStorage específicos de domínio, portanto owner QA requer backup/exportação do endereço original. Cloudflare, RIW, Apps Script, Sheets, Blob 403 intocados.


### B18-F - preview deploy dpl_Ex3YfvoJeD7AHdnbfLU4xmcWfimq READY
- URL https://conahp-flora-2026-rohbj0dzy-joao-moraes-projects-9bc51b2e.vercel.app/ . 12 assets Vercel verificados, B17 ainda com o alias estável. Smoke HTTPS NOT_RUN por DNS externo bloqueado; validação Android real pendente.
- Revisão de modal, status, botões e serviço entregue no commit `ccd27e7cecf63a43c47837565fc1428db59cdaf9`; teste 320/360/390/412/768/1280 PASS. ZIP em https://drive.google.com/file/d/1Zguye22oOKlM1sVvVzVrzCMmn8W1rXbm/view.
- Status: B18_F_READY_FOR_OWNER_QA. Próximo gate: exportar backup da B17, avaliar preview e decidir promoção expressamente.


### B18-G - refinamento fino 2026-10-14 (BRT)
- Base B18-F `ad192ebd76f6c13e437a4a43fe603424a93a3db2`; delta de UX isolado em `feat/b18-flora-ux`, sem PR nem alteração de `main`.
- Eventos de serviço passaram a fundo neutro sem hachura; `Alto interesse` somente na exibição vira `Interesse` (valor armazenado e chaves preservados). Legenda dos estados em uma linha nos testes 320-1280 px, chips menores, dias Quarta/Quinta e tipografia aprimorada; prioridade Essencial/Alta/Média/Baixa/Sem com azul mais claro selecionado, filtros avançados como `button[aria-pressed]`, sem alteração na lógica de filtro.
- CTA de inclusão escuro `+ Incluir na minha agenda`, retirada secundária; repetição de palco/trilha removida em detalhes e cartões. Splash/loading interno azul com logo CONAHP, `manifest.background_color` alterado para azul; PWA icons/manifest `icons`, `theme_color`, agenda pública, IDs e backend intocados. Service worker somente cache de ativos públicos passa a `conahp-b18g-public-v1`.
- QA **PASS** `node --check public/b18.js`, `tests/b18_browser_qa.py`, `tests/b18_reload_qa.py`, `tests/b18g_regression_qa.py`, `tests/b18g_browser_qa.py`: seis larguras e interface, controles, persistência, formato do estado interno, priorização, loading e arquivos oficiais. **NOT_RUN/BLOCKED_EXTERNAL:** smoke HTTP local Chromium por `ERR_BLOCKED_BY_ADMINISTRATOR`, HTTP Vercel e Android físico não executados nesta etapa; sem falsas alegações de sincronização.
- Artefato auditável SHA-256 `9b9b4ad136d9295a76b4980991548001314b322c8fecccb5616e2a4bae4c9123`, Google Drive https://drive.google.com/file/d/1q35JVK1NfeK0YGgvt7IORHbjSmSzv7CV/view. `docs/B18G_HANDOFF.md` descreve o delta. Preview Vercel e identidade do deployment registrados depois da criação na Issue #3.
- Preservado deployment B17 original `dpl_AU2bxMsMMbThebHSYnZ2VdbFJk57` no alias principal. Próximo gate: proprietário avaliar preview com backup da origem real, aprovar explicitamente antes de qualquer promoção. Status `B18_G_READY_FOR_OWNER_QA` condicionado a deploy READY.


### B18-G preview Vercel READY - 2026-10-14
- Preview: https://conahp-flora-2026-2bril2m9p-joao-moraes-projects-9bc51b2e.vercel.app ; deployment `dpl_7mmy6qaoeESWouBhZGNpZy5r4Ar8` READY, 12 assets conferidos byte/hash na candidata.
- Branch commit `f0469c7c51fd5f07e8f49dee43b9f84954088652`, pacote SHA-256 `9b9b4ad136d9295a76b4980991548001314b322c8fecccb5616e2a4bae4c9123`, Drive https://drive.google.com/file/d/1q35JVK1NfeK0YGgvt7IORHbjSmSzv7CV/view.
- B17 alias principal `dpl_AU2bxMsMMbThebHSYnZ2VdbFJk57` preservado, nenhum deploy promovido. Testes locais Chromium PASS e HTTP local externo NOT_RUN por bloqueio do ambiente. Status `B18_G_READY_FOR_OWNER_QA` para avaliação da Flora.


### B18-H, 2026-10-14 BRT, preview em homologação
- Base B18-G `5462346126b07315b85a46b1704cb26cb2359a80`; UX de contador Minha agenda, legenda Gap em linha, cartões de serviço com borda clara, título acima de palco em grade 3 colunas às 12h, filtros avançados por botões com Todos distinto de Sem, botão ✓ Retirar azul-claro e loading natural B18-G preservado.
- Arquivos alterados apenas `public/index.html`, `public/b18.js`, `public/b18.css`, `public/service-worker.js` (cache público), testes de regressão, `docs/B18H_HANDOFF.md` e este ledger. Imutáveis: 32 sessões, `schedule.json`, `schedule-utils.js`, logo, manifest, quatro PNG PWA, persistência e backup.
- Chromium DOM QA 320/360/390/412/768/1280 PASS, regressão B18-E/F/G PASS, backup export/import e legacy reload PASS; HTTP GET localhost via urllib PASS (7 assets), HTTP browser Vercel/Android real NOT_RUN. Contraste evento serviço 6,23:1; botão retirada 8,14:1. Não declarar smoke externo.
- Pacote auditável SHA-256 `fa1b4fcfb48d624efd55aa45d3f8c607e8afb8bf936851320d3a110a36c492ed`, https://drive.google.com/file/d/12jlQLnrchB5mYBSK6LmPInyWFvlkLw9I/view . Após deploy, URL/ID/commit/status serão registrados na Issue #3. Nunca promover automaticamente URL estável B17 `dpl_AU2bxMsMMbThebHSYnZ2VdbFJk57`. Próximo gate é QA do proprietário na preview e migração manual por backup devido a origens distintas.


### B18-H preview READY, QA proprietário pendente
- Vercel deployment `dpl_CA7iFzunjZcFCKBjkDAk8DdzYLWm` READY, https://conahp-flora-2026-qszf63fjn-joao-moraes-projects-9bc51b2e.vercel.app/ ; 12 assets SHA1 conferidos, commit `cd017ab32f60979bffa19d8002eda346607215cc`.
- Arquivos de aplicação alterados: `public/b18.js`, `public/b18.css`, `public/index.html`, `public/service-worker.js` (cache de ativos públicos). QA Chromium seis larguras/novos filtros/reload/backup PASS, GET localhost PASS, HTTP browser real/Android NOT_RUN. Pacote https://drive.google.com/file/d/12jlQLnrchB5mYBSK6LmPInyWFvlkLw9I/view SHA256 `fa1b4fcfb48d624efd55aa45d3f8c607e8afb8bf936851320d3a110a36c492ed`.
- Alias estável permanece na B17 `dpl_AU2bxMsMMbThebHSYnZ2VdbFJk57`. Nenhuma promoção. Status `B18_H_READY_FOR_OWNER_QA`; conferir localStorage distinto por URL, exportar/importar backup.


### B18-I - Minha agenda global e salvamento imediato, 2026-10-14
- Base B18-H `a5534cc225e832e06c91bc92c125abac7cc5745a`; Minha agenda soma e mostra ambos os dias (2+1), oculta filtros da Programação e mantém escala 08-19 por dia. Autosave de interesse/attending no modal e Lista, Sem prioridade/textos apenas no botão Salvar; Gap nos serviços da Lista, Não analisado na Lista.
- QA Chromium 6 larguras, 2+1, filtros, autosave, reload/legados/backup e falha de storage PASS; regressões B18..B18-H PASS, Python HTTP local 12/12 PASS. Android físico e HTTPS externo NOT_RUN.
- ZIP SHA256 `2fc10598196b2b2ed997e1d0593ad7b6ad59addc81c6508445720859bece601c` em anexo no chat. Preview/ID registrados na Issue #3 após deploy; produção B17 inalterada. Status alvo `B18_I_READY_FOR_OWNER_QA`.


### B18-I deployment de preview confirmado
- https://conahp-flora-2026-fa340fetj-joao-moraes-projects-9bc51b2e.vercel.app/ , `dpl_FiMVS8NfSGECKbZaUEjpi5D9UByd` READY, 12 assets com hashes conferidos. Produção permanece B17 `dpl_AU2bxMsMMbThebHSYnZ2VdbFJk57`.
- QA local 6 larguras e regressões antigas PASS; Android e HTTP real NOT_RUN. Código `23cd904b7bea5049d62899bff40ae234f6e097e3`; ZIP SHA-256 `2fc10598196b2b2ed997e1d0593ad7b6ad59addc81c6508445720859bece601c`, pacote na thread GPT Web. Status `B18_I_READY_FOR_OWNER_QA`.

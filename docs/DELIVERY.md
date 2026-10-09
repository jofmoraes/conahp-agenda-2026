# Estado operacional - CONAHP Agenda 2026

Atualizado em: **2026-10-09**. **M1/M2 aceitas como entregas locais; M3 Etapa A complementada após auditoria de autenticação/UX, em READY_FOR_EXTERNAL_GATE_REAUDIT (aguardando decisão do orquestrador).**

## Repositório, branch e segurança
- Repositório público: `jofmoraes/conahp-agenda-2026`.
- Branch técnica única: `feat/m1-foundation` (consultar HEAD GitHub na Issue #3; histórico auditável). `main`: `59635a399b686192bb9b9400f2e1d315df5bac4f`, **não alterada**.
- **Nenhum PR, Code Review, Codex/Work, deploy, GitHub Action, conta externa, Google Sheets real, Cloudflare Access/Worker ativo ou Apps Script publicado.** RIW/GSH intactos. Sem credenciais/URL de Apps Script RIW/dados pessoais no código público.
- A conexão GitHub por HTTPS no container falhou por DNS. Arquivos foram lidos/versionados pelo conector GitHub; para testes Node reconstruiu-se textualmente os arquivos e conferiram-se hashes SHA-1 de blob Git com as versões da branch (Worker, frontend, utilitários, scripts e testes). Distinguir reconstrução local de `git clone`.

## M1 - Fundação (Issue #1)
- Worker JS com JWT Cloudflare Access verificado por RS256/JWKS, `iss`, `aud` como array, `iat`, `exp` e `nbf` quando fornecido; identidade obrigatoriamente verificada no servidor.
- `GET /api/health` e `/api/schedule` públicos; `/api/me`, `GET/POST /api/preferences` privados e sem cache. `backend/apps-script/Code.gs` versionado, autorização por email associado à aba `Profiles`, segredo partilhado independente e validação de entradas e gravação; nenhum serviço real implantado.
- Gate pendente da auditoria: **resolvido no nível de testes locais.** Executado em Node.js 22.16.0: `npm test` **11/11 PASS**, `npm run check` **PASS** sobre reconstrução fiel de arquivos versionados; evidência registrada na Issue #1, comentário `6073827475`. A decisão de **fechar a Issue #1** continua exclusiva do orquestrador.

## M2 - Programação e experiência (Issue #2)
- `public/schedule.json`: **32 registros da grade oficial**, 16 por dia (14-15/10/2026), **110 participações em sessões** (não pessoas únicas), 9 itens sem participantes publicados, com nomes/cargos/instituições informados ou marcados como ausentes. Fonte `https://conahp.org.br/conahp-2026/` conferida em 2026-10-09. `docs/DATA_AUDIT.md` detalha fonte, divergências oficiais e lacunas.
- IDs definitivos `c26-s001` a `c26-s032`, não derivados do horário, dia ou palco. `sourceHistory` e `verifiedAt` preservados. Futuras revisões da agenda devem atualizar registro **sem trocar ID** nem substituir preferências.
- Worker serve programação pública via `env.ASSETS` quando disponível, sem exigir Apps Script para consulta. Sheets futuro deve ter aba `Sessions` com os mesmos IDs antes de liberar gravações; exportador CSV local `scripts/export-sessions.mjs` (somente stdout; nenhum acesso a contas externas).
- Interface estática responsiva `public/app.js`: lista cronológica, grade com régua horária e colunas de simultâneas, seleção de dia, busca por título/participante/instituição/trilha, filtros por trilha, prioridade, intervalo de horário e intenção de assistir. Participantes estruturados e fonte expostos por sessão.
- Preferências isoladas por identidade autenticada: interesse, prioridade, intenção de assistir, comentários e perguntas; Juliana sem curadoria inicial (`Não analisado` por padrão), novos perfis na planilha privada sem editar frontend. Conflitos só quando **ambas** sessões simultâneas estão marcadas para assistir.
- PWA com manifest, ícone SVG e service worker que armazena **somente shell público e GET /api/schedule** previamente consultado; não intercepta nem cacheia `/api/me` ou `/api/preferences`. Gravações privadas offline não são prometidas.
- Commits de referência: `1b3206f` (grade oficial), `183f56f` (participantes), `3aa0071` (IDs estáveis), `a0eb6b5` (Worker com assets), `962eccf` e `1395f0a` (grade), `9f1697a` (filtro horário), `20a64ef` (CSV), `aaa155c` (auditoria). Todos os commits estão na mesma branch; ver histórico Git para os demais.

## Evidências e limites dos testes da M2
- **PASS Node 22.16.0:** `npm test` **22/22**, FAIL 0, após corrigir fixture de horário inconsistente em `ec16824` e adicionar filtro de janela. Testes versionados de JWT real com chaves sintéticas, API, perfis, falha de escrita, contrato Worker/static assets, validação e filtros de agenda, estabilidade de IDs, conflitos, alocação de colunas, isolamento do cache privado em service worker. `npm run check` **PASS** para cinco módulos. Arquivos locais essenciais foram conferidos com hash Git contra os blobs da branch.
- **PASS Chromium headless histórico M2:** **13/13** verificações de busca por instituição, dois dias, lista/grade, salvamento com backend simulado, reentrada de dados no estado, conflitos reais, falha de escrita visível e mobile (390px), sem deploy. A navegação Chromium para servidor localhost foi bloqueada por política do ambiente; teste substituto usa DOM real e execução do código frontend versionado em página em memória, com `fetch` simulado. Teste reproduzível versionado em `tests/browser-smoke.py` (`python tests/browser-smoke.py`, requer Python Playwright e Chromium); inclui verificação da régua horária.
- **PASS auditoria da programação pelo conector GitHub:** 32 entradas, 16+16, IDs únicos, fonte/hora válidas, 109 participações na fotografia M2 (110 após atualização M3). Os testes anteriores M2 foram feitos com metadados reconstruídos; **essa pendência foi resolvida no complemento M3** mediante cópia byte-idêntica do JSON oficial em Node (ver seção abaixo).
- **NÃO COMPROVADO:** login real Cloudflare Access, identidade em celulares, leitura/gravação real Apps Script/Sheets, modo PWA instalável no aparelho e recarga offline real sob HTTPS, autenticação/segredos em produção e ausência de vínculo externo de auto-deploy. Nenhuma destas validações pode ser declarada como PASS ou aplicativo publicado.

## Gates e próximas ações
1. Orquestrador audita a Issue #2, arquivos e testes; Issues permanecem OPEN até sua decisão. Nenhum merge na `main` sem autorização e verificação de gatilhos de publicação.
2. Gate de integração M3, **somente mediante autorização específica:** provisionar Cloudflare Access/Worker, Apps Script e planilha CONAHP isolados com Profiles/Sessions/Preferences/SourceLog; importar CSV oficial, armazenar segredos fora do repo, testar segurança de escrita e perfis reais, persistência, dispositivos/instalação/offline públicos, e validar riscos do Apps Script público.
3. Reconfirmar a programação oficial e divergências de nomes antes do congresso; manter IDs/preferências intactos em eventuais atualizações.
4. M4: exposições/pôsteres/compromissos pessoais como escopo complementar, sem dados inventados.

## Restrições permanentes
**NO_PR / NO_AUTOMATIC_CODE_REVIEW / NO_CODEX_WITHOUT_EXPLICIT_ACTIVATION.** Sem alteração no RIW ou GSH. Não publicar sem smoke test após deploy aprovado.


## M3 - Etapa A / pré-gate externo (2026-10-09)

**Situação:** implementação e revisão local de segurança realizadas. Ainda não existe autorização para Etapa B nem conclusão de validação em produção.

- Fonte oficial revalidada em 2026-10-09: Zeke Emanuel incluído como apresentador em `c26-s018` sem trocar ID; programação mantém 32 sessões, 16/dia, **110 participações**. Divergências Eduarda Jorge/Davidovic e Diogo Dias/Porto Dias permanecem sem reconciliação inferida. Registro: `docs/DATA_AUDIT.md` (commit `7dacf52`).
- **Blob JSON integral anterior** `6fa8e62d7de22cb9fbf34ca293fa2f9f1e79991e` (38.462 bytes), lido do GitHub e avaliado em runtime JS sobre código `auditSchedule` versionado, sem transformação/redação de campos: 32, 16+16, 109 participações, 21 pares, 0 erro; CSV correspondente processado em V8. **Blob integral atualizado** `9ab9fb499255d52d03a57d0130af8d25d6f61b6e` (38.921 bytes): 32, 16+16, 110, 21, 0 erro; CSV de 33 linhas/10.456 bytes.
- **Bloqueio histórico já resolvido na reauditoria:** o primeiro teste Node M3 havia usado fixture, mas agora o JSON integral de 38.921 bytes foi reconstituído localmente com hash Git idêntico ao blob `9ab9fb499255d52d03a57d0130af8d25d6f61b6e`; `npm run schedule:check` e CSV original estão **PASS** em Node real. Sem acesso HTTPS direto a GitHub no container, transporte offline via conteúdo recuperado do conector.
- **Node v22.16.0:** `npm test` **26/26 PASS**, `npm run check` **PASS**, usando arquivos de código hash-verificados; `python tests/browser-smoke.py` Chromium headless **13/13 PASS** em DOM sintético e dois tamanhos de tela. O backend Apps Script atualizado `Code.gs` (blob `be7b23f6c6f1381aca7042b9f0ef772290ccc0ad`) foi executado em V8 com Sheets/Properties/Lock/ContentService sintéticos: **8/8 PASS** (segredo, perfis, isolamento, gravação/leitura, proteção de fórmulas e validação).
- **Correções e commits:** `4fff9c0` alteração oficial; `268343c` e `241dfd8` escape de fórmulas Sheets e confirmação de gravação; `509b11f` e `4713acd` URL Apps Script restrita e redirecionamento seguro; `b25ee70` testes de redirects; `975e647` links de fonte HTTPS; `7dacf52` auditoria editorial. Conferir histórico e SHAs completos da branch.
- **Riscos auditados:** Apps Script web app público com segredo é superfície de ataque residual; aceitar/rejeitar explicitamente antes de implantar. Identidade só pelo JWT Access validado, perfis nunca fornecidos pelo browser. ContentService pode redirecionar resposta; Worker faz segundo GET somente para `script.googleusercontent.com/macros/echo` sem segredo, bloqueando redirect perigoso. Campos livres escapados para não gerar fórmulas. Cache privado não persistido pelo service worker.
- **Documentos novos:** `docs/M3_SECURITY_REVIEW.md` (matriz de riscos, limites, testes); `docs/M3_EXTERNAL_GATE_PLAN.md` (autorizações B1-B5, passos por serviço, checklist de smoke, custos, triggers de deploy, rollback).
- **Gates externos INALTERADOS:** não foram criados Cloudflare Access/Worker, Apps Script/Sheets, segredos, domínio, rota, link Git/Builds, PR, merge, deploy ou Code Review. Vínculo externo Workers Builds/webhooks continua não verificável no conector. Main e RIW/GSH intactos. Não afirmar READY_FOR_RELEASE ou RELEASED.

### Próximo gate real

O orquestrador deve reauditar a Etapa A, incluindo o hash do arquivo JSON original e os testes Node agora concluídos, e solicitar **autorizações específicas e separadas** para B1 (planilha), B2 (Apps Script), B3 (Access), B4 (Worker/HTTPS), B5 (integração/release). Ações externas só após aprovação expressa.

- Correção adicional em `b4d0df8`: a confirmação após gravação verifica também comentários/perguntas; teste com `Code.gs` real executado no runtime JS do conector com Apps Script/Sheets simulados confirma texto inerte iniciado por `=` e isolamento Flora/Juliana. **Não é prova de escrita Sheets real**.

## M3 - Reauditoria local de Access/UX (2026-10-09)

**Motivação:** auditoria [Issue #3, comentário 6074800773](https://github.com/jofmoraes/conahp-agenda-2026/issues/3#issuecomment-6074800773) solicitou login explícito e política de rotas com AUD único antes de autorizar serviços externos.

### Implementação
- Novo endpoint `GET /auth/login`: no Worker, identidade Access JWT validada (mesmo `ACCESS_AUD` do `/api/me` e `/api/preferences`), `303 Location: /` sem cache quando autorizada; `401` anônimo, `503` falha de verificação, `405` método não permitido. `wrangler.jsonc` executa Worker primeiro em `/api/*` e `/auth/login`, não nas páginas/assets.
- Frontend público apresenta botão `Entrar para salvar preferências`, que usa navegação de página inteira `window.location.assign('/auth/login')`, permitindo login interativo Access e retorno à agenda. Quando Access manda 302/303, HTML, `401` ou `403`, a UI não tenta interpretar HTML como JSON, mantém programação pública e orienta entrar/tentar outra conta. Expiração durante POST descarta preferências privadas em memória e informa **Alteração não salva**, sem falso sucesso. Falha de rede tem mensagem própria.
- **Um único Access Application self-hosted / um único AUD** com destinos de caminhos exatos `/auth/login`, `/api/me` e `/api/preferences`; agenda pública, shell, `/api/schedule`, `/api/health` fora da proteção. Definição e bloqueios de compatibilidade: `docs/M3_ACCESS_LOGIN.md`; instruções de implantação/rollback: `docs/M3_EXTERNAL_GATE_PLAN.md`. Se a conta não permitir três destinos sob um AUD, **não implantar**: pedir decisão para consolidar rotas privadas e retestar.
- `/?access=denied` é aviso visual opcional para redirecionamento de bloqueio configurado posteriormente, **nunca** sinal de autenticação.

### Evidências reproduzidas com hashes
- Node.js v22.16.0: **`npm test` PASS 36/36**, incluindo 5 novos testes da rota login, 3 de política de paths/AUD único e 2 de exportação do JSON integral, além de regressões M1/M2/M3; **`npm run check` PASS**.
- **`npm run schedule:check` PASS no JSON oficial original integral** (`public/schedule.json`, Git blob `9ab9fb499255d52d03a57d0130af8d25d6f61b6e`, 38.921 bytes). Resultado: 32 sessões (16+16), **110 participações**, 21 pares de intervalos simultâneos, zero erros. Transporte via conector GitHub + compressão textual local, reconstrução byte a byte e `git hash-object` igual ao GitHub, sem rede externa nem serviço pago.
- `npm run --silent schedule:csv > sessions.csv` **PASS**: 33 registros CSV lógicos (1 cabeçalho+32 sessões), **10 colunas por registro**, IDs `c26-s001..c26-s032`; conteúdo gerado por exportador original com hash verificado. **Importante:** sem `--silent` as mensagens do npm entram no CSV, por isso comando correto documentado.
- `python tests/browser-smoke.py`: **35/35 PASS**, Chromium headless sobre frontend versionado com respostas sintéticas de Access (`401/403/HTML/302`), botão Entrar, sessão expirada, erro de gravação, filtros, grade, viewport móvel. **A navegação real para hostname arbitrário é bloqueada pela política de rede**, então o destino de `window.location.assign('/auth/login')` foi interceptado somente no teste; isso não equivale a login Cloudflare real. Os arquivos de código do ensaio tiveram hashes `git hash-object` idênticos aos blobs GitHub.
- SHAs principais: `25f63a9` (rota login Worker), `a44db41` (roteamento assets), `3f186ff` (UX), `3656c55` (botão), `3f2a260` (CSS), `5f0df5e` (login tests), `165bac0`/`efc3968` (retorno negado/limpeza aviso), `45334b3`/`659e957` (browser smoke), `a18a3e3` (Access docs), `805b95e` (paths test), `6e6c8b9` (exportador JSON testes). Demais commits registrados na branch, sem PR.

### Próximo bloqueio externo
**Pendente autorização específica:** validar em Cloudflare real que um único Access Application admite os três caminhos e o mesmo AUD, política/identidades e retorno a página; integrar Apps Script/Sheets privados, configurar secrets fora Git, testar usuários reais e PWA HTTPS/offline; inspecionar Workers Builds, webhooks, branch policies antes de deploy/merge. **NENHUMA etapa B executada**; sem main/PR/Code Review/Codex/Work/serviços reais/alterações RIW-GSH. Issue #3 deve ficar OPEN até auditoria.

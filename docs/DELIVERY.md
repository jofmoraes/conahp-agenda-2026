# Estado operacional - CONAHP Agenda 2026

Atualizado em: **2026-10-09**. **M1 e M2: aceitas como entregas locais pelo orquestrador; M3 Etapa A: em validação pré-gate externo.**

## Repositório, branch e segurança
- Repositório público: `jofmoraes/conahp-agenda-2026`.
- Branch técnica única: `feat/m1-foundation` (SHA antes do registro final: `28e6a1e2aff15bc535b6adfc1742d83f91422989`; este documento gerará SHA adicional). `main`: `59635a399b686192bb9b9400f2e1d315df5bac4f`, **não alterada**.
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
- **PASS Chromium headless com conteúdo local em memória:** **13/13** verificações de busca por instituição, dois dias, lista/grade, salvamento com backend simulado, reentrada de dados no estado, conflitos reais, falha de escrita visível e mobile (390px), sem deploy. A navegação Chromium para servidor localhost foi bloqueada por política do ambiente; teste substituto usa DOM real e execução do código frontend versionado em página em memória, com `fetch` simulado. Teste reproduzível versionado em `tests/browser-smoke.py` (`python tests/browser-smoke.py`, requer Python Playwright e Chromium); inclui verificação da régua horária.
- **PASS auditoria da programação pelo conector GitHub:** 32 entradas, 16+16, IDs únicos, fonte/hora válidas, 109 participações na fotografia M2 (110 após atualização M3). `npm run schedule:check` e `npm run schedule:csv` foram testados em Node com reconstrução dos **metadados relevantes** dos 32 registros oficiais (não o arquivo JSON completo), confirmando 32, 16+16, 109 e 21 pares sobrepostos, CSV emitido. O `public/schedule.json` original foi auditado diretamente pelo conector, mas não havia transporte binário/rede para copiar seus 38 KB ao container.
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
- **Limitação explicitamente pendente:** container Node não dispõe dos **bytes** do JSON original: seu arquivo local permanece uma fixture de metadados (hash Git `82b64e3dc69fe651d5b32162660723b4fe77e30b`). Portanto `npm run schedule:check` e `npm run schedule:csv` executados em Node **foram sobre fixture**, enquanto o JSON real foi avaliado integralmente pelo executor JavaScript da ferramenta GitHub. Não reportar esses dois comandos como execução Node do original. Um checkout/cópia byte-idêntica deve ainda reproduzi-los no gate de auditoria ou na preparação externa autorizada; **não é questão de dados inválidos**, mas de transporte GitHub->container bloqueado por DNS.
- **Node v22.16.0:** `npm test` **26/26 PASS**, `npm run check` **PASS**, usando arquivos de código hash-verificados; `python tests/browser-smoke.py` Chromium headless **13/13 PASS** em DOM sintético e dois tamanhos de tela. O backend Apps Script original `Code.gs` (blob `c15d1c...`) foi executado em V8 com Sheets/Properties/Lock/ContentService sintéticos: **8/8 PASS** (segredo, perfis, isolamento, gravação/leitura, proteção de fórmulas e validação).
- **Correções e commits:** `4fff9c0` alteração oficial; `268343c` e `241dfd8` escape de fórmulas Sheets e confirmação de gravação; `509b11f` e `4713acd` URL Apps Script restrita e redirecionamento seguro; `b25ee70` testes de redirects; `975e647` links de fonte HTTPS; `7dacf52` auditoria editorial. Conferir histórico e SHAs completos da branch.
- **Riscos auditados:** Apps Script web app público com segredo é superfície de ataque residual; aceitar/rejeitar explicitamente antes de implantar. Identidade só pelo JWT Access validado, perfis nunca fornecidos pelo browser. ContentService pode redirecionar resposta; Worker faz segundo GET somente para `script.googleusercontent.com/macros/echo` sem segredo, bloqueando redirect perigoso. Campos livres escapados para não gerar fórmulas. Cache privado não persistido pelo service worker.
- **Documentos novos:** `docs/M3_SECURITY_REVIEW.md` (matriz de riscos, limites, testes); `docs/M3_EXTERNAL_GATE_PLAN.md` (autorizações B1-B5, passos por serviço, checklist de smoke, custos, triggers de deploy, rollback).
- **Gates externos INALTERADOS:** não foram criados Cloudflare Access/Worker, Apps Script/Sheets, segredos, domínio, rota, link Git/Builds, PR, merge, deploy ou Code Review. Vínculo externo Workers Builds/webhooks continua não verificável no conector. Main e RIW/GSH intactos. Não afirmar READY_FOR_RELEASE ou RELEASED.

### Próximo gate real

O orquestrador deve auditar a Etapa A, especialmente a evidência do JSON integral em JavaScript do conector versus a execução Node que carece dos bytes originais, decidir se exige checkout completo antes de abrir B1, e solicitar **autorizações específicas e separadas** para B1 (planilha), B2 (Apps Script), B3 (Access), B4 (Worker/HTTPS), B5 (integração/release). Ações externas só após aprovação expressa.

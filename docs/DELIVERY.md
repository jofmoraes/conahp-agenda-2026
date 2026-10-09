# Estado operacional - CONAHP Agenda 2026

Atualizado em: 2026-10-09 (M1 corrigida após CHANGES_REQUESTED; aguardando nova auditoria).

## Estado real
- Branch `main`: somente documentação inicial, **não alterada** pela Missão 1.
- Branch `feat/m1-foundation`: fundamento isolado do CONAHP com Worker/HTML/CSS/JS, Apps Script versionado, fixtures e testes; **sem deploy** e **sem conexão a serviços reais**.
- Commits da M1: `1a838c33a4199868a83940bda04fe7d07c1bdf70` (Worker, modelo de API), `d2003561fa1b7c57f6960d31940b132122fc1526` (frontend, Apps Script, PWA), `b04a07f9f39f2095730cb8986b6b1ad4b32a3d37` (testes).
- Arquivos-chave: `src/worker.js`, `public/*`, `backend/apps-script/Code.gs`, `data/schedule.synthetic.json`, `tests/worker.test.mjs`, `docs/INTEGRATION.md`, `wrangler.jsonc`.
- Material RIW examinado somente leitura: árvore, Worker, página principal, partes de app, bridge, service worker, manifest e wrangler. RIW contém backend fixo, ações dependentes de `profile` do navegador e referências a áudio/participantes RIW. O CONAHP usa implementação mínima isolada em vez de copiar esses elementos inseguros.

## Arquitetura M1
- GET `/api/health` e `/api/schedule` públicos; GET `/api/me` e GET/POST `/api/preferences` privados, com erros HTTP explícitos.
- Access JWT com validação de assinatura RS256 e claims no Worker; Apps Script valida segredo compartilhado e resolve no servidor o perfil autorizado pela identidade transmitida pelo Worker. Nenhuma troca arbitrária de perfil pelo navegador.
- Planilha futura com abas Profiles, Sessions, Preferences e SourceLog; cabeçalhos e segredo descritos em `docs/INTEGRATION.md`. Não existe planilha CONAHP criada; nenhuma conta real foi alterada.
- Dados da agenda pública no cache do service worker; preferências e `/api/me` sem cache. Fluxo frontend mínimo para busca, dias, seleção de interesse/prioridade, intenção de assistir, comentários e alerta de conflito de sessões marcadas. O programa oficial e a experiência avançada de grade ficam em M2.
- `workers_dev=false`, `preview_urls=false`. Nenhum workflow foi criado.

## Evidências de testes e limites
- **PASS 10/10**: execução do **código real do Worker** obtido do GitHub em runtime JavaScript isolado com primitivas HTTP simuladas e `identity`/`backend` injetados exclusivamente no teste: health/schedule, cache público, autenticação obrigatória, gravação Flora, isolamento Juliana, rejeição de override de perfil, gravação Juliana, preservação Flora, falha de escrita explícita sem persistir, identidade desconhecida negada.
- **PASS**: verificação de sintaxe por parser JS do Worker (transformação exclusivamente sintática de `export` para avaliar), frontend, service worker, Apps Script e arquivo de testes.
- **NÃO EXECUTADOS**: `npm test` / `npm run check` em Node real, integração Apps Script/Sheets/Cloudflare, testes móveis e instalação PWA real, na etapa anterior; na auditoria subsequente foi confirmado Node v22, porém checkout GitHub indisponível por DNS, impedindo teste da branch. Os comandos ficam disponíveis no repositório para auditoria local. Não declarar esses testes como PASS.
- **Não comprovado**: ausência de vínculos Cloudflare Workers Builds ou webhooks externos. A árvore Git não contém `.github/workflows`, mas acesso de leitura às configurações de deploy/webhooks não está disponível pelo conector. Não realizar deploy, merge ou execução de CI antes de verificar os vínculos.
- **Riscos/gates**: Apps Script público com segredo compartilhado tem risco residual; avaliar a segurança da configuração antes da exposição e configurar segredo independente forte, controle Access, verificação real de identidade e contas separadas. Resposta do Apps Script e gravação em planilha reais ainda sem validação. PWA atual sem ícones de instalação (M2).
- **Sem credenciais, URLs RIW ou identificadores pessoais inseridos no código novo.** Fixtures são sintéticas e não correspondem à programação real.

## Correções da auditoria da Issue #1 (2026-10-09)
- Auditoria do orquestrador: CHANGES_REQUESTED por `aud` em formato array; a comparação anterior de array com string rejeitava tokens válidos do Cloudflare Access.
- Commits adicionais: `8635a5c2b0489b756947cc954fd64e90ac9c6f58` (correção de `aud` e `nbf`), `12ce8e1964f6b6636775fa4ffd37fb98a3e0a0c4` (testes reais da função `verifyAccess` com RSA/JWKS sintéticos), `501f45d56ef285b9a3d212d9260ceffd5d8689bc` (contrato atualizado).
- Comportamento: `aud` deve ser array contendo igualdade exata a `ACCESS_AUD`; rejeitar outros arrays ou valor simples. `nbf` futuro ou de tipo inválido rejeitado, se presente. Assinatura RS256 validada a partir de JWKS da origem Access.
- Testes criados e versionados: `tests/access-jwt.test.mjs` cobre `verifyAccess` real, audiência, expiração, assinatura inválida, `nbf`, `iss`, `iat`, token ausente. `tests/worker.test.mjs` mantém testes da API com identidades simuladas.
- **Execução**: Node real v22.16.0 disponível no container; teste direto de WebCrypto RS256 geração/verificação PASS. Tentativa de clonar a branch para esse ambiente retornou `Could not resolve host: github.com`; assim, os comandos `npm test` e `npm run check` **não foram executados com os arquivos da branch** e não devem ser descritos como PASS. O teste criptográfico isolado não substitui a execução da suíte versionada.
- Sem alterações em `backend/apps-script/Code.gs` por este ajuste: a autorização continua no backend pelo `email` resolvido no Worker; o contrato e campos permitidos de preferências não mudaram. Nenhum ambiente externo configurado.
- Limitação: Cloudflare real, JWKS remoto, Apps Script/Sheets, instalação PWA e ausência de Workers Builds/webhooks não verificados. **M2 não iniciada.**

## Próximas missões/gates
1. Orquestrador audita SHA(s), código e testes da M1 sem PR; Issue #1 permanece OPEN até sua decisão.
2. Configuração de Cloudflare Access, Apps Script e planilha real isolados somente mediante autorização específica e verificação prévia de automação de deploy. Integração e retestes reais em M3.
3. M2 implementa agenda oficial validada, interface RIW-equivalente, ícones PWA, UX móvel e funcionalidades restantes, sem importar dados RIW nem preferências antigas.
4. M4: expositores/pôsteres/compromissos, sujeitos a validação das fontes.

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

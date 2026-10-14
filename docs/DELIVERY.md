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

# Protocolo de execução - CONAHP Agenda 2026

Leia este arquivo, README.md, docs/PRODUCT.md, docs/ARCHITECTURE.md, docs/DELIVERY.md **e a Issue ativa integralmente antes de editar código**. Confirme no comentário inicial da Issue: (1) objetivo; (2) estado real encontrado; (3) arquivos/serviços envolvidos; (4) critérios de aceite e riscos; (5) próximo gate real. Não confundir arquivo encontrado com arquivo integralmente lido.

## Equipe e comunicação
Um chat orquestrador planeja, decide prioridades e audita; um executor técnico implementa. O **GitHub é a fonte durável de estado**: toda entrega, bloqueio, mudança de escopo e resultado de testes deve ser registrada na própria Issue e refletida em docs/DELIVERY.md. O usuário não deve transportar logs ou links entre chats. Não criar novos chats/agentes sem necessidade real e aprovação.

## Autonomia e limites
- Executar missões **coerentes até o próximo gate real**: diagnosticar, implementar, testar, corrigir e retestar. Não encerrar em falhas recuperáveis nem exigir microaprovações.
- Propor simplificações, preservar stack do RIW, evitar refatorações e dependências sem ganho mensurável.
- Trabalhar em branch dedicada quando houver mudança significativa; registrar commits e testes; **NÃO abrir PR**. Integração em main apenas sob gate aprovado pelo orquestrador, depois de conferir gatilhos de deploy.
- **NO_PR / NO_AUTOMATIC_CODE_REVIEW / NO_CODEX_WITHOUT_EXPLICIT_ACTIVATION.**
- Codex e Work somente após autorização **expressa** do usuário para cada execução que consuma franquia. Não disparar Code Review, GitHub Review ou workflows relacionados.
- Nenhuma alteração no RIW ou GSH. Nenhum deploy, configuração de domínio, integração de contas, serviço pago, alteração de permissões ou ação irreversível sem autorização expressa específica.
- Não criar GitHub Actions ou ligar deployments automáticos no início. Um `git push` pode publicar se um vínculo de CI/CD estiver configurado; verificar triggers primeiro.
- Repositório público: não commitar segredos, URLs privadas, dados pessoais, respostas de API contendo preferências individuais ou planilhas privadas. Configuração sensível deve usar segredos de ambiente. Não importar diretamente a planilha do RIW.

## Segurança mínima não negociável
- Escolher um perfil não equivale a estar autorizado a gravar/ler preferências dele.
- Antes de disponibilizar dados privados: identidade verificada no servidor, vínculo permitido entre identidade e perfil, autorização de **cada leitura/gravação** e validação de entrada no backend.
- Não confiar em parâmetros como `profile`, `email` ou `userId` informados pelo navegador para determinar autorização; identidades devem vir da autenticação validada no Worker.
- Validar comunicação Worker -> Apps Script e impedir bypass direto de operações de escrita; discutir limitações da implantação pública Apps Script.
- Consulta offline deve ser limitada a dados públicos ou a dados pessoais protegidos adequadamente; não prometer autenticação offline.
- Falha de persistência deve ser visível: nunca tratar atualização não confirmada como gravada.

## Status e evidência
Issue em OPEN enquanto há implementação ou validação pendente; texto de status: PLANNED / ACTIVE / BLOCKED_EXTERNAL / READY_FOR_AUDIT / ACCEPTED.
Ao concluir, registrar: escopo implementado, SHA(s), arquivos, comandos/testes com resultados PASS/FAIL, riscos, pendências, gates e instruções mínimas de verificação. Não declarar 'publicado' sem URL e smoke test do deploy aprovado.

## Handoff
Atualizar docs/DELIVERY.md sempre que uma missão mudar estado: o que existe de fato, decisões, pendências, próxima missão e gatilhos de deploy. Evitar informação transitória ou repetição de logs extensos.

## Fontes metodológicas
GSH docs/orchestration/AGENT_MISSION_GOVERNANCE.md; EXECUTOR_PROTOCOL.md; CHAT_HANDOFF_STRATEGY.md; MINIMAL_SUFFICIENT_IMPLEMENTATION_POLICY.md. Adotar princípios, não a burocracia do projeto GSH.

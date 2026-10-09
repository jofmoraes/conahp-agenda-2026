# CONAHP 2026 - Agenda personalizada

Aplicativo PWA independente para consultar, selecionar e acompanhar a programação do CONAHP 2026 (14 e 15 de outubro, São Paulo).

**Estado atual:** planejamento e preparação técnica. Ainda não existe app funcional neste repositório.

## Objetivo
Reaproveitar o aplicativo [RIW Agenda 2026](https://github.com/jofmoraes/riw-agenda-2026), preservando a experiência de agenda, busca, favoritos/prioridades, conflitos e comentários, adaptada ao CONAHP.

## Usuárias iniciais
- Flora: perfil ativo, curadoria a importar/adaptar somente após conferir as fontes; nunca copiar preferências de outro evento como decisões atuais.
- Juliana: perfil ativo sem curadoria inicial; deve conseguir usar o app e classificar sessões desde a v0.
- Perfis adicionais: configuráveis sem hardcode por usuário.

## Documentação obrigatória
- [AGENTS.md](AGENTS.md): execução técnica, limitações, segurança e provas de conclusão.
- [docs/PRODUCT.md](docs/PRODUCT.md): requisitos e prioridades.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): stack, integração, dados e segurança.
- [docs/DELIVERY.md](docs/DELIVERY.md): estado verificado, bloqueios, decisões e handoffs.

As Issues detalham missões completas de implementação. O chat orquestrador audita entregas diretamente por commits e comentários no GitHub.

## Regras operacionais
**NO_PR / NO_AUTOMATIC_CODE_REVIEW / NO_CODEX_WITHOUT_EXPLICIT_ACTIVATION.**

- Não abrir Pull Requests nem disparar Codex Code Review.
- Não usar Codex/Work nem serviços pagos sem autorização expressa específica do usuário.
- Não publicar nem conectar Cloudflare ou Google Apps Script a este repositório sem autorização específica.
- Não copiar credenciais, IDs pessoais, tokens, dados privados ou URLs sensíveis do RIW para este repositório público.
- Não modificar o repositório RIW original nem o GSH Contratos.

## Referências
- Fonte oficial: https://conahp.org.br/2026/
- Repositório RIW: https://github.com/jofmoraes/riw-agenda-2026
- GSH Contratos (referência metodológica, **não** base de código do projeto): https://github.com/jofmoraes/llm-gsh-contratos

# CONAHP 2026 - Agenda personalizada

Aplicativo PWA independente para consultar, selecionar e acompanhar a programação do CONAHP 2026 (14 e 15 de outubro, São Paulo).

**Estado da branch técnica `feat/m1-foundation`:** implementação local M1/M2/M3 pré-gate com programação oficial estruturada, busca, lista/grade, preferências isoladas por identidade, conflitos e PWA pública. **Não publicado, não integrado à `main`, não conectado a Cloudflare Access/Apps Script/Sheets reais.** A branch `main` ainda contém a documentação inicial.

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

## Executar verificações locais

Requer Node 22 ou compatível. `npm test` executa testes automatizados sem credenciais e sem conexão externa. `npm run check` verifica sintaxe de Worker, frontend, utilitários, service worker e exportador. `npm run schedule:check` valida a fotografia da programação oficial versionada; `npm run --silent schedule:csv` imprime CSV para futura importação autorizada, sem modificar conta alguma.

Programa público: `public/schedule.json` (32 itens em 14-15/10, revisão 2026-10-09). Auditoria e divergências: [docs/DATA_AUDIT.md](docs/DATA_AUDIT.md). Contrato de identidade e planilha: [docs/INTEGRATION.md](docs/INTEGRATION.md). O repositório não inclui autenticação de teste pública nem modo que permita selecionar arbitrariamente perfis.

**Atenção:** nenhum serviço de produção foi criado; rodar a interface completa com gravação real requer autorização para configurar Cloudflare Access, Apps Script e planilha isolada. Preferências antigas do RIW nunca devem ser copiadas.

### Smoke visual opcional

Para reproduzir os testes de interface sem publicar o app: com Python, Playwright e Chromium disponíveis, execute `python tests/browser-smoke.py` na raiz. `CHROMIUM_PATH` permite definir o executável Chromium local (padrão Linux `/usr/bin/chromium`). A suíte usa HTML/JS da branch com backend e identidades sintéticas em memória, sem conexão externa. Na execução de 2026-10-09, **35/35 verificações PASS**; não substitui autenticação Cloudflare real nem teste de PWA offline em dispositivo real.

## Entrar para salvar preferências (pré-gate local M3)

A programação pública continua disponível sem autenticação. Para salvar preferências, o botão **Entrar para salvar preferências** redireciona para `/auth/login`. Depois da autenticação por uma **única aplicação Cloudflare Access** cobrindo `/auth/login`, `/api/me` e `/api/preferences` com **um AUD**, o Worker verifica JWT e retorna à página pública. Em sessão expirada, acesso negado ou login HTML/redirect, o app exibe mensagem e mantém apenas dados públicos, sem confirmar uma gravação não feita. Veja [docs/M3_ACCESS_LOGIN.md](docs/M3_ACCESS_LOGIN.md). A configuração real Cloudflare está pendente de autorização.

**Evidências locais:** Node `npm test` **36/36 PASS**, `npm run check` PASS e Chromium `python tests/browser-smoke.py` **35/35 PASS** (autenticação e respostas simuladas). O `public/schedule.json` **original e integral** foi reconstituído byte a byte com Git blob SHA correspondente, testado em Node: `npm run schedule:check` PASS (32 sessões, 110 participações) e CSV de 32 registros/10 colunas com `npm run --silent schedule:csv > sessions.csv`. Sem publicação ou validação real do Access/Google.

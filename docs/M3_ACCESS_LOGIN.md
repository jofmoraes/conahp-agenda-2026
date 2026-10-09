# M3 - Fluxo de login e desenho de uma única aplicação Access (pré-gate local)

**Estado**: código e testes sintéticos somente. Não criar nem configurar aplicação, domínio, segredos, identidades ou Worker real sem autorização específica. Sem PR/Code Review/merge/deploy.

## Escolha de arquitetura

**Uma única Cloudflare Access Application self-hosted** para o hostname HTTPS da agenda, com **três destinos (destinations) de URL pública na mesma aplicação**:
1. `https://<HOST-APROVADO>/auth/login` (entrada para navegação de topo e retorno à agenda);
2. `https://<HOST-APROVADO>/api/me` (perfil autenticado);
3. `https://<HOST-APROVADO>/api/preferences` (GET e POST de preferências).

Todos os destinos usam a **mesma Application Audience Tag (`AUD`)** e a **mesma política Allow**. A API de Cloudflare Access para self-hosted applications possui `destinations` (array de destinos `type: public`, `uri`); confirmar na interface da conta se a configuração com três caminhos exatos é aceita e interceptada antes de publicar. Caso a interface ou plano não permita múltiplos destinos **na mesma aplicação**, **bloquear integração** e obter decisão arquitetural sobre agrupar endpoints privados sob prefixo `/api/private/*` e atualizar contratos/testes. Não criar aplicações diferentes com múltiplos AUDs e depois alargar a validação do Worker de maneira implícita.

**Públicos, fora dos destinos Access:** `/`, `/index.html`, `/app.js`, `/style.css`, `/schedule-utils.js`, `/manifest.webmanifest`, `/icon.svg`, `/service-worker.js`, `/schedule.json` e `GET /api/schedule` (também `GET /api/health`). A regra precisa permitir navegação anônima e cache exclusivamente público.

**Roteamento do Worker:** `wrangler.jsonc` mantém assets com `run_worker_first: ['/api/*','/auth/login']`. Mesmo com erro de Access ou bypass da borda, `/auth/login` e as APIs privadas usam `verifyAccess` (JWT RS256, issuer, array `aud` contendo `ACCESS_AUD` exato, prazo), sem confiar em e-mail ou perfil do navegador. `/auth/login` com JWT válido responde **HTTP 303 Location: /** e `no-store`. JWT ausente/errado: 401; JWKS inacessível: 503; POST: 405. `/api/me` e preferências negam sem JWT/Profiles válidos.

## Experiência para as usuárias

1. Ao abrir a URL da agenda, a programação pública carrega independente de login. O app tenta identificar sessão via `GET /api/me` sem redirecionar o navegador.
2. Sem sessão, ou quando o Access devolve 302/303/HTML em vez de JSON, a tela oferece **Entrar para salvar preferências**, mantendo grade/lista públicas. Não mostrar erro JSON genérico.
3. Ao clicar **Entrar**, fazer **navegação de página inteira** (`window.location.assign('/auth/login')`), não `fetch` e não pop-up. A Cloudflare Access Application intercepta a URL, apresenta o login e autentica a identidade permitida.
4. Após autenticação, a requisição retorna ao endpoint `/auth/login` no Worker. JWT válido leva de volta para `/`. O JS da agenda chama novamente `/api/me` e `/api/preferences`; mostra identidade e habilita editores apenas após confirmação.
5. No Access, configurar **página de bloqueio com redirecionamento opcional a `https://<HOST-APROVADO>/?access=denied`**. Esse parâmetro é **somente indicador de UX, nunca prova de autorização**. O app apresenta acesso negado, permite tentar outra conta e preserva consulta pública. Confirmar comportamento do plano/controle para block redirects e loops no ambiente real; se URL de bloqueio não for permitida, usar página padrão Cloudflare com link de retorno à agenda.
6. Quando a sessão expira durante uma gravação, erro 401/redirect/HTML nunca produz confirmação de gravação. A UI apaga o estado privado em memória, apresenta **Alteração não salva** e novo botão Entrar. Em acesso negado (403), avisa explicitamente; diante de rede/503, anuncia erro de rede/verificação, sem afirmar que houve expiração.
7. Dados privados **não entram** em Cache Storage/service worker; aplicação offline mostra programação carregada previamente mas não promete gravação de preferências.

## Verificações na Etapa B (exigem autorização)

- Confirmar em Cloudflare Zero Trust que **existe somente uma aplicação de Access** com os 3 destinos e **um único AUD**; examinar também URLs alternativas/rotas e Worker preview. Testar com navegador anônimo e sessão expirada.
- Conferir no DevTools: abertura da página pública anônima 200, API schedule 200 JSON, `/auth/login` sem cookie abre tela Cloudflare, depois retorna 303 a `/`, APIs `/api/me` e `/api/preferences` recebem JWT Access válido e retornam JSON.
- Verificar 401/403/HTML/redirect 302 com credenciais sintéticas de homologação, e separação real das identidades autorizadas sem exposição do JWT em logs.
- Conferir que URLs `/?access=denied` não autentiquem ninguém e que negados sempre permaneçam sem editores e sem dados privados.
- Confirmar que configuração `workers_dev:false`, `preview_urls:false` e destinos Access fecham rotas de produção relevantes, sem ativar Workers Builds/PR/merge.
- Se autenticação Google/OTP, cookies SameSite ou redirecionamento nos dispositivos móveis exigirem variação, registrar ajustes e testar em iOS/Android antes de release.

**Referências oficiais (consultadas em 2026-10-09):**
- https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/
- https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/applications/
- https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/

O comportamento de configurações no Cloudflare Dashboard continua **não verificado sem conta/ambiente autorizado**. A definição não garante antecipadamente que a UI/plano permitam os três destinos, por isso é critério de bloqueio da Etapa B.

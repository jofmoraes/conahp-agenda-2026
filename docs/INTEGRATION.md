# Contrato M1 e integração pendente

## Identidade e autorização
O Worker verifica assinatura RS256 do JWT `Cf-Access-Jwt-Assertion` contra as chaves de `https://<team-domain>/cdn-cgi/access/certs`, além de `iss`, `aud`, `exp`, `iat` e `nbf` (quando presente). `aud` deve ser array de strings contendo exatamente o valor configurado em `ACCESS_AUD`, sem aceitar coincidências parciais, audiência como string ou somente outro aplicativo. **Não basta selecionar nome no navegador.** Usar políticas Cloudflare Access com identidades permitidas; configurar secrets `ACCESS_AUD`, `ACCESS_TEAM_DOMAIN`, `APPS_SCRIPT_URL`, `APPS_SCRIPT_SECRET` no ambiente autorizado. Nunca os incluir no Git. O backend Apps Script valida segredo em toda ação, resolve email autenticado em Profiles e ignora perfis do navegador. A URL pública do Apps Script pode ser chamada, mas não deve autorizar acesso sem segredo. O segredo não deve aparecer em logs ou dados da planilha. O endpoint de certificados exige acesso externo; não foi testado com conta real.

## API
- GET /api/health: `{ok:true,data:{version,status}}`, sem autenticação.
- GET /api/schedule: `{ok:true,data:{updatedAt,sessions}}`; dados públicos, cache até 5 min, PWA usa cache offline se já consultados.
- GET /api/me: `{ok:true,data:{id,label}}`, exige Access válido e associação em Profiles.
- GET /api/preferences: `{ok:true,data:{profile,items}}`, exige mesmo acesso.
- POST /api/preferences: JSON `{sessionId,interest?,priority?,attending?,comment?,questions?}`, edição somente do perfil resolvido no servidor; retorno do registro persistido. `attending` significa intenção confirmada, não simples interesse. Erros HTTP com `{ok:false,error:{code,message}}`; sucesso não é exibido antes da confirmação.

## Planilha futura (não criada)
Abas com cabeçalhos exatos, linha 1:
- Profiles: `profileId,email,label,active` (adicionar Flora e Juliana somente em ambiente privado autorizado; novas identidades por linha sem código).
- Sessions: `id,day,start,end,title,track,stage,source,verified` (IDs permanentes, dados verificados de fonte oficial; data ISO AAAA-MM-DD, horas HH:MM).
- Preferences: `profileId,sessionId,interest,priority,attending,comment,questions,updatedAt` (chave lógica composta profileId+sessionId).
- SourceLog: `sessionId,source,verifiedAt,note` (origem e atualização, etapa M2).

Script Properties: `CONAHP_SHARED_SECRET` igual a `APPS_SCRIPT_SECRET`; `CONAHP_SPREADSHEET_ID` da nova planilha independente. Versão do Code.gs no Git é canônica. Deploy do Apps Script com acesso público exige avaliação/aceite explícito do risco residual e segredo forte, independente do RIW. Cloudflare Access, Apps Script e planilha não configurados nesta missão.

## Decisões
Reutilizar conceitos/stack do RIW, não suas URLs/JSONP/seleção livre de perfil; frontend M1 intencionalmente mínimo. Nenhum ícone PWA real, polimento de grade ou programa oficial: pendências M2. Testes de verdade em dispositivos, acesso por celular e segurança em produção dependem de gate de integração M3.

## Evidência de validação de JWT sintético (M1)
- `tests/access-jwt.test.mjs` invoca a implementação **real** `verifyAccess` com tokens RS256 sintéticos assinados por chave RSA de teste, JWKS de teste, relógio local e `fetch` simulado. Casos: audiência exata em array (inclusive array com múltiplas audiências), array de outra audiência, string `aud` incorreta, expiração, assinatura inválida, `nbf` futuro/passado/inválido, emissor errado, `iat` futuro e token ausente.
- `tests/worker.test.mjs` mantém testes da API e perfis com identidade injetada somente em testes. Isso não equivale a validar o Access real.
- Validação de criptografia real, Cloudflare Access/Apps Script reais e deployment continuam fora deste gate, sujeitos a autorização específica. Configuração de `ACCESS_TEAM_DOMAIN` requer URL HTTPS da equipe, sem caminho adicional.

## M2 - programação oficial sem dependência privada na consulta
- A versão pública canônica é `public/schedule.json`, com IDs estáveis `c26-s001` a `c26-s032`, origem, data de conferência e participantes estruturados. `GET /api/schedule` serve esse arquivo por `env.ASSETS` quando disponível; essa rota permanece pública e pode ser colocada em cache. O fallback via backend somente é utilizado em testes/ambiente sem `ASSETS`.
- O Apps Script continua utilizando a aba `Sessions` para **validar as escritas**: se a sessão escolhida não existir na planilha isolada, retornará erro 404. Portanto a carga do CSV gerado a partir do mesmo JSON oficial é condição obrigatória antes de permitir gravação real. Não sincronizar automaticamente perfis/pedidos e não utilizar a planilha do RIW.
- O exportador `node scripts/export-sessions.mjs --check` verifica a fotografia oficial e `node scripts/export-sessions.mjs` imprime um CSV com os cabeçalhos da aba `Sessions`, incluindo `speakers` opcional. Não grava dados em serviços e não requer tokens.
- A coluna `speakers` pode ser incluída após `verified`. O Code.gs utiliza os nove primeiros campos fixos e ignora campos extras na validação de preferência; não é necessário mudar a identidade do usuário no backend.
- Quando um título, horário ou palco for corrigido, atualizar a entrada com o mesmo `id`. Manter decisões separadas por `profileId + sessionId`; nunca apagar histórico de preferências por mudança do programa.
- A fotografia das fontes, contagem e divergências editoriais consta em `docs/DATA_AUDIT.md`. O ícone atual do PWA é SVG; testes de instalabilidade em dispositivos reais ainda são gate de integração.

## M3 Etapa A - Contrato endurecido (2026-10-09)
- `src/worker.js`: `APPS_SCRIPT_URL` precisa ser exatamente `https://script.google.com/macros/s/<id>/exec` sem query, fragmento ou usuário/senha embutidos. Para ContentService, o Worker realiza POST com `redirect:'manual'`; apenas 301/302/303 apontando para `https://script.googleusercontent.com/macros/echo` são aceitos, realizando **novo GET sem segredo nem corpo**. 307/308 e outros hosts rejeitados, erro visível. Este comportamento está testado com `fetch` simulado e deve ser revalidado contra Apps Script implantado antes do release.
- `backend/apps-script/Code.gs`: comentários e perguntas com prefixos semelhantes a fórmulas são escritos com apóstrofo de escape para evitar execução na planilha; `interest`, `priority` e `attending` alterados precisam ser confirmados na leitura pós-gravação. Conferir o comportamento específico de `getValues()` com apóstrofos em planilha real.
- `public/app.js`: links de fontes somente com esquema HTTPS; não inserir HTML arbitrário de fonte ou comentários. Perfis são resolvidos do JWT verificado no Worker e mapeados pela aba privada `Profiles`, nunca por `profileId` fornecido pelo cliente.
- A programação pública recebeu Zeke Emanuel em `c26-s018` na revisão de 2026-10-09, preservando os 32 IDs. Fonte canônica permanece `public/schedule.json`; é obrigatório importar os 32 IDs para a planilha **antes de testar escrita real**.
- Configuração, riscos, gates individuais, passos no painel, custos, publicação e rollback: `docs/M3_EXTERNAL_GATE_PLAN.md`; auditoria de segurança e limites de testes: `docs/M3_SECURITY_REVIEW.md`.

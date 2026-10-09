# Contrato M1 e integração pendente

## Identidade e autorização
O Worker verifica assinatura RS256 do JWT `Cf-Access-Jwt-Assertion` contra as chaves de `https://<team-domain>/cdn-cgi/access/certs`, além de `iss`, `aud`, `exp`, `iat`. **Não basta selecionar nome no navegador.** Usar políticas Cloudflare Access com identidades permitidas; configurar secrets `ACCESS_AUD`, `ACCESS_TEAM_DOMAIN`, `APPS_SCRIPT_URL`, `APPS_SCRIPT_SECRET` no ambiente autorizado. Nunca os incluir no Git. O backend Apps Script valida segredo em toda ação, resolve email autenticado em Profiles e ignora perfis do navegador. A URL pública do Apps Script pode ser chamada, mas não deve autorizar acesso sem segredo. O segredo não deve aparecer em logs ou dados da planilha. O endpoint de certificados exige acesso externo; não foi testado com conta real.

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

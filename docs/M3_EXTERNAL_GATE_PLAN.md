# M3 - Plano de integração e publicação controlada (Etapa B NÃO autorizada)

Estado: **planejamento**, 2026-10-09. **B0 READ-ONLY concluído** (inventário e indisponibilidades em `docs/M3_B0_PREFLIGHT.md`); B1-B5 permanecem sem autorização. Esta documentação não autoriza criar contas, serviços, planilhas, regras, domínios, segredos, deploy, merge, gastos ou compartilhamento com Flora/Juliana. Aprovações devem ser específicas, registradas na Issue #3. NO_PR / NO_AUTOMATIC_CODE_REVIEW / NO_CODEX_WITHOUT_EXPLICIT_ACTIVATION.

## Gate 0 - Segurança e gatilhos ANTES de qualquer operação externa

- [ ] Aprovação explícita do usuário/orquestrador para **cada lote**: (B1) planilha Google separada; (B2) Apps Script; (B3) Cloudflare Access + identidade; (B4) Worker/rota HTTPS; (B5) integração/merge e distribuição.
- [ ] Inspecionar GitHub > repositório > **Actions**, **Settings > Webhooks**, **Settings > Environments** e branch rules; conferir que não existe workflow automatizado acoplado a pushes. O Git tree local não tem `.github/workflows`, mas isso **não prova** ausência de webhooks.
- [ ] Conferir Cloudflare Dashboard > **Workers & Pages > Worker > Settings > Builds / Git integration / Triggers / Deployments**; examinar qualquer associação com repositório/branch e gatilhos em pushes. **Não vincular** GitHub ou ativar builds automáticos sem aprovação. Um simples push para branch ligada pode publicar; desabilitar o gatilho ANTES de integrar.
- [ ] Identificar conta Cloudflare existente, tipo de zona e domínio, sem reutilizar endpoints ou configurações privadas do RIW. Confirmar custo do plano selecionado e limites efetivos antes de habilitar. Se custos ou plano pago forem necessários, interromper e pedir aprovação adicional.
- [ ] Revisar desenho de exposição pública do Apps Script: Web App normalmente acessível publicamente; segredo compartilhado valida chamadas, mas não torna o endpoint privado. **Decisão explícita de risco residual** antes de abrir implantação. Se usuário rejeitar a exposição, arquitetar alternativa server-side isolada mediante nova decisão, não contornar autorização.

## B1 - Google Sheets isolado (aprovação independente)

- [ ] Criar arquivo privado independente, sem copiar planilha RIW; manter permissões mínimas, acesso apenas a responsáveis. Não usar dados de produção inicialmente.
- [ ] Criar abas e cabeçalhos exatamente como `docs/INTEGRATION.md`:
  - Profiles: `profileId,email,label,active`
  - Sessions: `id,day,start,end,title,track,stage,source,verified,speakers` (última coluna opcional)
  - Preferences: `profileId,sessionId,interest,priority,attending,comment,questions,updatedAt`
  - SourceLog: `sessionId,source,verifiedAt,note`
- [ ] Rodar novamente `npm run schedule:check` no JSON completo; comparar IDs `c26-s001..c26-s032`, 16 registros por dia e 110 participações após atualização; exportar `npm run --silent schedule:csv > sessions.csv`. Verificar UTF-8, fórmulas CSV e escapes antes de importar à aba Sessions. Não mudar IDs. Ativar `plain text` nas colunas de IDs.
- [ ] Criar inicialmente apenas **perfis sintéticos privados** (nomes/e-mails de teste, nunca subir ao Git público). Depois, sob autorização, cadastrar identidades reais Flora e Juliana, individualmente: e-mail Access validado + perfilId independente; Juliana sem curadoria (`Não analisado`).
- [ ] Conferir inexistência de dados pessoais no CSV/SourceLog e backup/versionamento da programação. Planilha private, não publicar link.


## B2a - Preparação permitida, sem Web App (2026-10-09)

**B1 aprovada pelo orquestrador, B2a autorizada especificamente pelo usuário.** A planilha B1 permanece privada e intacta. O conector Google atual não permite criar projetos Apps Script nem editar Script Properties; portanto o executor não criou projeto, não gerou segredo e não concedeu OAuth. Guia da **única intervenção manual mínima**: [M3_B2A_APPS_SCRIPT_PREPARATION.md](M3_B2A_APPS_SCRIPT_PREPARATION.md).

O escopo B2a **autoriza preparar somente um projeto Apps Script standalone e salvar o código auditado, além das duas propriedades privadas** `CONAHP_SPREADSHEET_ID` (ID somente na interface privada) e `CONAHP_SHARED_SECRET` (segredo forte gerado e guardado em cofre privado, nunca em resposta/chat/log). O projeto deve permanecer **não implantado, não compartilhado e sem execução do Web App**. A ausência de conexão Apps Script é um bloqueio manual, não uma autorização para configurar backend alternativo ou serviço pago.

**B2b** é novo gate, distinto: risco explícito de um Web App acessível publicamente e segredo compartilhado a ser aceito/rejeitado pelo usuário; confirmação de permissões, OAuth, política de acesso, redirect e teste de bloqueio antes de **qualquer** publicação. **B3/B4/B5 não autorizadas.**

## B2b - Publicação Google Apps Script (aprovação independente e posterior)

- [ ] **Somente após confirmação manual de B2a**: conferir projeto Apps Script standalone privado, um único projeto, código `backend/apps-script/Code.gs` na revisão canônica e ausência de deployment; nunca criar outro projeto por engano.
- [ ] Confirmar somente a **presença** das Script Properties `CONAHP_SPREADSHEET_ID` e `CONAHP_SHARED_SECRET`, em ambiente privado, sem copiar valores para documentação, captura, histórico ou issue. Não usar segredos RIW; verificar propriedade/escopos do projeto e acesso mínimo à planilha antes de implantar.
- [ ] Revisar o modelo **executar como proprietário** e se o Web App precisará permitir acesso a qualquer pessoa. Se necessário, obter aceite explícito de acesso externo ao endpoint, documentando que uma pessoa com URL consegue chamá-lo mas operações devem responder FORBIDDEN sem segredo; não presumir isolamento por obscuridade da URL.
- [ ] **Implantar > Nova implantação > App da Web** somente após autorização. Testar POST inválido/inexistente, secret incorreto, perfil não cadastrado, sessão desconhecida, mutação não autorizada e falha de escrita; exigir erro e ausência de efeito. Validar se redirecionamentos ContentService chegam apenas a `script.googleusercontent.com/macros/echo` via GET sem segredo.
- [ ] Guardar ID/version do deployment e URL privada de destino somente no secret Cloudflare; não colar em repositório público.

## B3 - Cloudflare Access e identidade (aprovação independente)

- [ ] Cloudflare Zero Trust > **Access controls > Applications > Add an application**: criar **uma única aplicação Access self-hosted com uma única audiência (AUD)** e destinos protegidos `/auth/login`, `/api/me` e `/api/preferences`, sob o mesmo hostname e política Allow. Não criar duas aplicações com AUDs diferentes. Confirmar no painel/API que o plano permite os 3 destinos exatos sob uma aplicação; caso não permita, **interromper e aprovar mudança para prefixo privado único**, ajustando Worker e testes antes da implantação. Seguir `docs/M3_ACCESS_LOGIN.md`. **Não proteger `/`, arquivos estáticos, `/api/schedule` nem `/api/health`**, preservando agenda pública e cache offline.
- [ ] Configurar método de login de baixo atrito (ex.: OTP por e-mail se compatível com plano e dispositivos), permitir **somente e-mails autorizados** e evitar seleção manual de perfil como autenticação. Testar deny por identidade não autorizada e e-mails falsos.
- [ ] Copiar Application Audience Tag (AUD) e team domain HTTPS no painel. Como segredos/configs Cloudflare Worker (nunca no Git): `ACCESS_AUD`, `ACCESS_TEAM_DOMAIN`, `APPS_SCRIPT_URL`, `APPS_SCRIPT_SECRET`. Usar exatamente o AUD da aplicação; emitir JWT `aud` array e verificar assinatura RS256/JWKS, `iss`, `iat`, `exp`, `nbf`.
- [ ] **Cookie Path Attribute DESABILITADO**: mesma aplicação precisa entregar `CF_Authorization` a `/auth/login`, `/api/me` e `/api/preferences`. Conferir Path/Domain/Secure/SameSite e cookie global vs cookie de aplicativo no navegador após login; configuração errada de cookie/loop = **STOP**. Consultar `docs/M3_B0_PREFLIGHT.md`.
- [ ] Testar navegação de topo no botão **Entrar** para `/auth/login`, retorno 303 ao shell público e mensagens 401/403/HTML/302 após expiração ou bloqueio. Se houver redirecionamento de bloqueio configurável, retornar opcionalmente para `/?access=denied`; esse parâmetro é apenas informação visual e jamais autoriza alguém.
- [ ] Garantir roteamento Access realmente injete `Cf-Access-Jwt-Assertion` validado pelo Worker em requests privados, tanto em desktop quanto em celular; header forjado nunca deve autorizar requisição.
- [ ] Em caso de mais de um perfil por e-mail, **rever contrato**, não criar múltiplos perfis sob uma identidade por atalho.

## B4 - Worker estático e HTTPS (aprovação independente)

- [ ] Conferir `wrangler.jsonc` `workers_dev=false`, `preview_urls=false`. Para testes externos, escolher rota em domínio autorizado, HTTPS e isolamento do projeto. Obter aprovação de domínio/rota e de eventual custo antes de publicar.
- [ ] Implantar **somente** commit/versão auditada na rota de homologação autorizada, **sem conectar GitHub para auto-deploy**. Registrar ID da versão, data, URL e recurso afetado em Issue #3 **sem URLs sensíveis**. Exigir sucesso de `GET /api/health` e agenda pública; caso contrário rollback.
- [ ] Validar HTTPS, cache-control: `GET /api/schedule` público cacheável; `/api/me`, `/api/preferences` sem cache. Não armazenar segredos em `public/*`. Testar CORS, CSRF simples, cabeçalho `Cf-Access-Jwt-Assertion` e erro de backend.
- [ ] Testar com 2 identidades autorizadas somente após inclusão de perfis reais consentida. Se não houver, restringir testes às identidades sintéticas; **não afirmar fluxo real validado**.

## B5 - Matriz obrigatória de smoke/integridade (com evidências privadas sem dados)

| Teste | Cenário | Critério |
|---|---|---|
| Público | 14/10 e 15/10, 32 sessões, fontes/participantes | listagem/grade/filtros funcionais |
| Auth | anônimo e identidade não cadastrada | agenda pública visível; botão Entrar abre Access; APIs privadas 401/403 e nenhum dado exposto |
| Auth | token incorreto/expirado/AUD errado, header forjado | negado sem fallback; erro amigável, CTA Entrar; nenhuma gravação confirmada |
| Identidade | Flora salva sessão X, Juliana consulta X | Juliana não lê/grava valores da Flora |
| Persistência | salvar, recarregar e reler por cada identidade | valores exatamente recuperados |
| Validação | body `profileId`, `email`, `userId` forjados | 400 ou ignorados; nenhuma elevação |
| Falhas | desligar backend/induzir gravação falha em homologação | erro visível; nada tratado como gravado |
| Sheets | comentários `=...`, `+...` e múltiplas linhas | armazenados como texto inerte |
| Horários | 3 trilhas simultâneas e sessões adjacentes | somente intenção confirmada gera conflito |
| Cache | offline depois de visitar agenda | shell e agenda pública previamente carregados visíveis |
| Privacidade | offline e cache inspeccionado no DevTools | nenhuma resposta `/api/me` ou `/api/preferences` cacheada |
| Dispositivo | Android/iPhone suportado, instalação PWA HTTPS | navegação, tipografia, toque e atualização sem erros |
| Origem | URL Apps Script maliciosa/302 externo/307 | segredo nunca retransmitido |
| Release | versão candidata e rollback | recuperação verificável e sem perda de preferências |

**Critérios de interrupção:** qualquer acesso cruzado, segredo exposto, falha silenciosa de escrita, redirecionamento inseguro, contagem da programação divergente ou regra de deploy automática não compreendida = **NO_RELEASE**, voltar à branch auditável.

## B6 - Release, rollback, handoff (autorizações separadas)

- [ ] Aprovar explicitamente a integração na `main` **após** inventário de triggers, testes e backup; não criar PR e não ativar GitHub Code Review. Se o merge acionar deploy, operação exige autorização de publicação no mesmo gate.
- [ ] Antes de liberar URL, registrar SHA, versão do Worker, URL pública autorizada, versão Apps Script, backup privado da planilha e matriz PASS real. Entregar acesso a Flora/Juliana só após autorização de compartilhamento.
- [ ] Rollback do Worker: restaurar versão anterior pelo Cloudflare Deployments, **sem tocar preferências Sheets**. Apps Script: reverter deployment para versão anterior auditada e validar endpoints. Dados: restaurar backup privado apenas sob autorização específica e após preservar novas decisões dos usuários; não substituir arquivos de preferências indiscriminadamente.
- [ ] Verificação pós rollback: health, agenda, autenticação e leitura isolada; documentar qualquer erro ou perda. Evitar reverter programação para IDs incompatíveis com decisões já salvas.
- [ ] Status `READY_FOR_RELEASE` somente se integração/segurança testadas; `RELEASED` somente após URL HTTPS válida e smoke real positivo. A Etapa A usa exclusivamente `READY_FOR_EXTERNAL_GATE`.

## Custos / risco de franquia (informação, não ativação)

Cloudflare Zero Trust atualmente anuncia plano Free para equipes de até 50 usuários; Workers Free anuncia 100.000 requests/dia e limite de CPU de 10ms/request. Não é garantia de elegibilidade, desempenho da verificação RS256 ou gratuidade da configuração final; **verificar limites e plano antes de ativar**. Google Apps Script/Sheets possui quotas distintas por tipo de conta. Não assinar plano pago nem contratar suporte sem autorização explícita. Nenhum Codex/Work foi acionado.

Fontes: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/ ; https://developers.cloudflare.com/workers/platform/limits/ ; https://www.cloudflare.com/plans/zero-trust-services/ ; https://developers.google.com/apps-script/guides/services/quotas

## Resultado do pré-gate local de 2026-10-09
- A verificação dos arquivos originais foi reproduzida com hashes Git idênticos no Node 22.16.0: `npm test` **36/36 PASS**; `npm run check` **PASS**; `npm run schedule:check` **PASS** (32 sessões, 16+16, 110 participações); `npm run --silent schedule:csv > sessions.csv` gerou 33 registros CSV lógicos (cabeçalho+32), 10 colunas. Usar `--silent` evita banners do npm dentro do CSV.
- `python tests/browser-smoke.py`: **35/35 PASS** com Chromium e respostas Access sintéticas. Navegação real para hostname do Access foi bloqueada no navegador de testes; o botão teve seu destino interceptado sinteticamente, não houve acesso real.
- O plano detalhado de paths, retorno pós-login e AUD único está em `docs/M3_ACCESS_LOGIN.md`. A etapa B continua dependente de autorizações específicas para cada serviço e de testes reais antes de `RELEASED`.

# M3 - Plano de integração e publicação controlada (Etapa B NÃO autorizada)

Estado: **planejamento**, 2026-10-09. Esta documentação não autoriza criar contas, serviços, planilhas, regras, domínios, segredos, deploy, merge, gastos ou compartilhamento com Flora/Juliana. Aprovações devem ser específicas, registradas na Issue #3. NO_PR / NO_AUTOMATIC_CODE_REVIEW / NO_CODEX_WITHOUT_EXPLICIT_ACTIVATION.

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
- [ ] Rodar novamente `npm run schedule:check` no JSON completo; comparar IDs `c26-s001..c26-s032`, 16 registros por dia e 110 participações após atualização; exportar `npm run schedule:csv > sessions.csv`. Verificar UTF-8, fórmulas CSV e escapes antes de importar à aba Sessions. Não mudar IDs. Ativar `plain text` nas colunas de IDs.
- [ ] Criar inicialmente apenas **perfis sintéticos privados** (nomes/e-mails de teste, nunca subir ao Git público). Depois, sob autorização, cadastrar identidades reais Flora e Juliana, individualmente: e-mail Access validado + perfilId independente; Juliana sem curadoria (`Não analisado`).
- [ ] Conferir inexistência de dados pessoais no CSV/SourceLog e backup/versionamento da programação. Planilha private, não publicar link.

## B2 - Google Apps Script (aprovação independente)

- [ ] No Google Drive, **Novo > Mais > Google Apps Script** (ou editor da planilha autorizado), criar projeto CONAHP separado, copiar exclusivamente `backend/apps-script/Code.gs` da SHA auditada e registrar versão.
- [ ] **Configurações do projeto > Propriedades do script**: criar `CONAHP_SPREADSHEET_ID` (ID privado da nova planilha) e `CONAHP_SHARED_SECRET` (segredo forte novo). **Nunca registrar valores** em GitHub/Issue, frontend, screenshot ou log; não usar secrets RIW. Verificar acesso mínimo da conta de implantação à planilha.
- [ ] Revisar o modelo **executar como proprietário** e se o Web App precisará permitir acesso a qualquer pessoa. Se necessário, obter aceite explícito de acesso externo ao endpoint, documentando que uma pessoa com URL consegue chamá-lo mas operações devem responder FORBIDDEN sem segredo; não presumir isolamento por obscuridade da URL.
- [ ] **Implantar > Nova implantação > App da Web** somente após autorização. Testar POST inválido/inexistente, secret incorreto, perfil não cadastrado, sessão desconhecida, mutação não autorizada e falha de escrita; exigir erro e ausência de efeito. Validar se redirecionamentos ContentService chegam apenas a `script.googleusercontent.com/macros/echo` via GET sem segredo.
- [ ] Guardar ID/version do deployment e URL privada de destino somente no secret Cloudflare; não colar em repositório público.

## B3 - Cloudflare Access e identidade (aprovação independente)

- [ ] Cloudflare Zero Trust > **Access controls > Applications > Add an application**; proteger seletivamente caminhos `/api/me` e `/api/preferences` (e quaisquer rotas privadas futuras). **NÃO colocar /api/schedule e shell público atrás de uma política privada**, se offline/consulta pública forem necessários.
- [ ] Configurar método de login de baixo atrito (ex.: OTP por e-mail se compatível com plano e dispositivos), permitir **somente e-mails autorizados** e evitar seleção manual de perfil como autenticação. Testar deny por identidade não autorizada e e-mails falsos.
- [ ] Copiar Application Audience Tag (AUD) e team domain HTTPS no painel. Como segredos/configs Cloudflare Worker (nunca no Git): `ACCESS_AUD`, `ACCESS_TEAM_DOMAIN`, `APPS_SCRIPT_URL`, `APPS_SCRIPT_SECRET`. Usar exatamente o AUD da aplicação; emitir JWT `aud` array e verificar assinatura RS256/JWKS, `iss`, `iat`, `exp`, `nbf`.
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
| Auth | anônimo e identidade não cadastrada | 401/403; nenhuma preferência exposta |
| Auth | token incorreto/expirado/AUD errado, header forjado | negado sem fallback |
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

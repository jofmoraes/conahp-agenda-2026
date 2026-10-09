# M3 B0 - Inventário read-only e gate de autorização B1

Data: 2026-10-09. **B0 executado sem criar/alterar configurações de GitHub, Cloudflare, Google, serviços ou dados reais.** A revisão local M3 anterior foi aceita pelo orquestrador na Issue #3. Este documento separa fatos verificados por APIs read-only, capacidades de produto documentadas e controles ainda impossíveis de verificar. **Não autoriza B1-B5.**

## 1. GitHub - verificações realizadas

Repositório `jofmoraes/conahp-agenda-2026`, público, branch-padrão `main`, acesso do conector com permissões de administração (não utilizado para configurar ou alterar controles).

| Controle | Evidência obtida | Consequência |
|---|---|---|
| Branch técnica | `feat/m1-foundation`: `33f3c09096a4e2ffa3704d63827272ec82087b44` antes do commit documental B0 | Todos os commits de documentação permanecem nesta branch |
| `main` | `59635a399b686192bb9b9400f2e1d315df5bac4f` | Não houve merge |
| GitHub Actions na árvore | Não existe `.github/workflows/*` na árvore recursiva da branch técnica | **Não prova** ausência de sistemas externos |
| GitHub Actions runs | API retorna `total_count: 0` | Nenhuma execução registrada no endpoint consultado |
| Status/check-runs no HEAD técnico | Statuses `[]`, check-runs `total_count:0` | Nenhum job/status observado no commit consultado |
| Repository rulesets | API retorna `[]` | Nenhum ruleset retornado |
| Branches | Lista contém `main` e `feat/m1-foundation`, ambas `protected: false` | Não há proteção declarada pela consulta resumida; evitar qualquer push/merge não autorizado |
| Configuração de PR | `allow_auto_merge: false` | Não garante ausência de revisões/deploys acionados por outros eventos |

**Indisponíveis neste conector:** `Settings > Webhooks` (endpoint não permitido), `Settings > Environments` (não permitido), conteúdo de `Actions > Workflows` (endpoint não permitido), proteções detalhadas das branches (HTTP 403 do token), deployments e Pages (endpoint não permitido). **Não inferir ausência de webhooks, automações, environments, regras avançadas, integrações GitHub App ou Pages.**

**Checklist manual read-only ANTES de qualquer push com potencial deploy, integração ou criação de serviço:** GitHub > Settings > Webhooks (URLs e eventos, sem revelar segredos); Settings > Environments; Settings > Branches / Rules / Rulesets; Actions (workflows habilitados); Settings > Pages; Settings > Integrations / Installed GitHub Apps. No Cloudflare > Workers & Pages > Worker existente, olhar Builds, Git integrations, Deploy Hooks, Triggers, Domains & Routes, Deployments e branch associada. Registrar apenas `existe/não existe/não verificado`, sem copiar URLs sensíveis. **Se houver vínculo que publica em push, STOP** antes de qualquer integração.

## 2. Cloudflare - arquitetura preparada, não inspecionada na conta

**Sustentado pela documentação pública da Cloudflare**, não por configuração verificada: Access Application do tipo self-hosted admite uma lista de `destinations` públicos com URI/path e **um Audience Tag (`aud`) na aplicação**. Desenho canônico mantido:
- Protegidos dentro da **mesma aplicação e AUD**: `/auth/login`, `/api/me`, `/api/preferences` (todos os métodos aplicáveis).
- Públicos fora da aplicação: `/`, arquivos de frontend e PWA, `GET /api/schedule`, `GET /api/health`. O Worker continua validando JWT RS256/JWKS, `iss`, `aud`, `iat`, `exp`, `nbf`, mesmo após o Access proteger a borda.
- **Cookie Path Attribute: DESABILITADO**. O `CF_Authorization` deve valer para o domínio, não ficar limitado a `/auth/login`. Validar no navegador real cookie de aplicação, domínio/Path, SameSite/Secure/expiração, cookies de sessão global no team domain, login, 303 para `/`, chamadas subsequentes aos dois endpoints privados e comportamento no celular.
- **Nunca** criar aplicações distintas para cada path sem redesenho e teste de AUD. Se a interface/conta não suportar três destinos na mesma aplicação, **STOP** e propor prefixo privado único com novo gate de código.
- A URL de bloqueio `/?access=denied` é apenas UX; nunca é autorização.

**Hospedagem:** `wrangler.jsonc` mantém `workers_dev:false`, `preview_urls:false` e não define rota/custom domain. Logo, **não existe endereço público de deploy definido na configuração versionada**. Para Custom Domain é necessária zona Cloudflare ativa e hostname disponível; decidir conta, zona, domínio e DNS somente depois de consultar o painel e obter aprovação. Alternativa `workers.dev` exigiria mudança deliberada da configuração e revalidação de suporte Access/paths/cookies, não assumir equivalência. Não reutilizar zona/endpoint RIW por conveniência.

**Somente no painel autenticado, read-only:** conta e plano disponível; zona e domínio elegível; Worker CONAHP já existente ou não; Workers Builds/integração Git/deploy hooks; rotas vinculadas; Zero Trust > Access > Applications (possíveis colisões de paths/host); método de login/IdP/OTP, limites, política de sessão, configuração Cookie Path Attribute, alternativas de block redirect; expectativa de cobrança. **Nenhum desses estados da conta foi verificado em B0**.

Fontes técnicas:
- https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/applications/
- https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/
- https://developers.cloudflare.com/workers/configuration/routing/
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- https://developers.cloudflare.com/workers/platform/limits/

## 3. B1 - planilha independente preparada, NÃO criada

**Fonte única:** `public/schedule.json`, Git blob `9ab9fb499255d52d03a57d0130af8d25d6f61b6e` (**38.921 bytes**), com 32 sessões oficiais (16 em cada dia), 110 participações, IDs `c26-s001` a `c26-s032`. Gate local da auditoria: `npm run schedule:check` e exportação original Node **PASS**, resultados aceitos pelo orquestrador. Antes de executar B1, comparar blob e reconfirmar grade oficial; **não trocar IDs** se os horários/títulos mudarem.

Preparação de abas (linha 1 exata; Sheets deve ser privado e **independente de RIW/GSH**):

| Aba | Cabeçalho | Inicialização B1 |
|---|---|---|
| `Sessions` | `id,day,start,end,title,track,stage,source,verified,speakers` | importar 32 registros; IDs como texto, horário HH:MM e datas ISO sem ajuste de timezone |
| `Profiles` | `profileId,email,label,active` | somente 2 identidades **sintéticas/inativas** para estrutura; sem endereço pessoal real |
| `Preferences` | `profileId,sessionId,interest,priority,attending,comment,questions,updatedAt` | apenas cabeçalho, sem curadoria/invenção de decisão |
| `SourceLog` | `sessionId,source,verifiedAt,note` | registrar origem pública e conferência, sem PII nem perfis |

Exemplo de perfis **fictícios**, apenas referência para operação B1 (não são contas autorizadas pelo Access):

```csv
profileId,email,label,active
synthetic-a,synthetic-a@example.invalid,Teste A,FALSE
synthetic-b,synthetic-b@example.invalid,Teste B,FALSE
```

O Code.gs exige `active=true` e igualdade com e-mail verificado vindo do Worker; os dois placeholders são **inativos** e não devem ser confundidos com logins aptos à validação integrada. Para testes reais futuros, ativar somente identidades explicitamente autorizadas, com e-mail efetivamente verificado pelo Access (novo gate). Não criar/perpetuar dados de Flora ou Juliana sem autorização.

Operação futura, **somente após aprovação B1**: confirmar revisão da fonte, executar `npm run schedule:check`, `npm run --silent schedule:csv > sessions.csv` (com `--silent` para não corromper CSV), verificar 10 colunas / 33 registros lógicos, conferir UTF-8, códigos de fórmula, privacidade, permissões de compartilhamento e importar exclusivamente na nova planilha. Não publicar planilha nem conteúdo de Profiles/Preferences em Git. Fazer backup privado da fonte antes das próximas etapas.

## 4. B2 - decisão de risco Apps Script público para aceite explícito

**Fato do código:** o futuro Web App recebe POSTs do Worker e confia no segredo compartilhado `CONAHP_SHARED_SECRET` (Script Properties) para permitir operações. O usuário final é indicado pelo Worker (e-mail derivado do JWT); o Apps Script não possui prova criptográfica própria por usuário final. Caso alguém obtenha o segredo, pode enviar e-mails forjados e **ler/escrever preferências de qualquer perfil**. Implantação como proprietário + acesso anônimo ao Web App amplia essa superfície. A URL difícil de adivinhar **não é controle de segurança**. O app teria acesso à planilha privada com as permissões da conta de implantação.

**Decisão a apresentar ao usuário, antes de B2:**
- **Aceitar o risco residual**, com planilha isolada, privilégio mínimo da conta proprietária, segredo aleatório forte distinto do RIW, armazenamento exclusivo em Script Properties/secret do Worker, rotação em caso de incidente, logs sem PII/segredos, validação de payload, limites/quotas e testes de bloqueio direto do Web App.
- **Não aceitar**: bloquear B2; projetar alternativa de backend que preserve autenticação/autorização sem Web App publicamente invocável ou com mecanismo de autenticação adequado, submeter arquitetura/custos/autorização novos. Não ampliar silenciosamente a permissão nem usar segredo já existente.

**Nenhum aceite foi dado neste B0.** Referências: https://developers.google.com/apps-script/guides/web e https://developers.google.com/apps-script/manifest/web-app-api-executable .

## 5. Gates operacionais mínimos B1-B5 (autorizações independentes)

| Lote | Operação exata que necessita permissão | Efeito externo / risco | STOP antes de avançar |
|---|---|---|---|
| **B1** | Criar Google Sheet **novo e privado**; criar 4 abas; importar 32 sessões oficiais/SourceLog e 2 perfis fictícios inativos; conceder somente acesso mínimo à conta responsável | Novo recurso persistente no Drive, possível quota; compartilhar inadvertidamente expõe dados | Conta/Drive indevidos, sessão/ID divergente, acesso público, gatilho desconhecido |
| **B2** | Criar Apps Script **independente**; definir 2 Script Properties novas (ID Sheet e segredo), autorizar escopos e **publicar Web App** com identidade/acesso definidos | Concessão OAuth, endpoint alcançável por terceiros, segredo sujeito a vazamento, execuções sob conta proprietária | Risco sem aceite, permissão excessiva, retorno/redirect inseguro, segredo exposto |
| **B3** | Escolher conta/IdP/hostname; criar **UMA Access Application e AUD** para 3 paths; cadastrar/policiar identidades autorizadas; configurar cookie e política | Pode bloquear o app público por erro de path, causar loops e impedir login; limites do plano | Cookie Path ligado, paths públicos privados, AUDs múltiplos, falta de suporte a destinos, custos sem aprovação |
| **B4** | Criar Worker CONAHP/rota HTTPS; instalar segredos novos; configurar ligação estática e **deploy manual** de SHA auditado, sem CI | Publicação de código e DNS/rota, potencial cobrança por tráfego, possível gatilho externo | Builds/webhooks desconhecidos, URL/rota não aprovada, falha de login ou smoke, secrets públicos |
| **B5** | Testar autenticação/isolamento/persistência/offline/mobile real; aprovar separadamente eventual merge `main`, liberação de URL e acesso aos participantes | Acesso de terceiros e uso real, operações de merge/push potencialmente acionam deploy | Qualquer vazamento, acesso cruzado, falso sucesso de gravação, PWA privado cacheado, sem backup/rollback |

**Custos:** Workers Free divulgado com 100 mil requisições/dia e limite de CPU de 10 ms por execução; Cloudflare Access possui opções Free/Paid; contas Cloudflare/Google e quotas efetivas **não inspecionadas**. Domínio novo ou migração DNS pode ter custo/operação de alto impacto. Reconfirmar preço e quota **na conta escolhida**, sem criar cobrança/pagamento. Com alternativas de arquitetura ou plano pago, exigir autorização adicional.

**Rollback planejado (não executado):** manter SHA e versões Worker/Apps Script anotados; voltar para versão implantada anterior com autorização e smoke; não apagar/reescrever preferências; restringir/remover acesso somente em incidente e com trilha de decisão. Se a publicação for a primeira, rollback pode exigir desativar rota/Web App, medida externa a autorizar.

## 6. Resultado do B0

**READY_FOR_B1_AUTHORIZATION (somente pedido de autorização):** inventário GitHub read-only concluído dentro das APIs disponíveis; compatibilidade do desenho Access com documentação pública confirmada; **configuração real de conta, domínio/cookies e gatilhos Cloudflare seguem NÃO VERIFICADOS**. B1 está preparada para criar apenas Sheet isolado com 32 sessões + perfis sintéticos inativos. **Não iniciar B1 sem aceite explícito do usuário.** B2 exige aceite específico de risco; B3-B5 têm autorizações independentes. Issue #3 permanece OPEN. Sem testes locais repetidos desnecessariamente, PR, Code Review, Codex/Work, merge, deploy, gasto ou alterações RIW/GSH.

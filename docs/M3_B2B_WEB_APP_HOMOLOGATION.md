# M3 B2b - Publicação inicial Apps Script (gate manual, 2026-10-09)

**Autorização:** Issue #3 comentário `6091209447`, abrangente B2b-B5; B2b em execução, B3 não iniciado. O risco de endpoint Web App público com segredo foi aceito pelo usuário. **Publicação efetiva NÃO REALIZADA pelo executor**: conector Apps Script ausente e conector Opera Browser é apenas leitura/navegação, sem ação de click, formulário ou deployment. O painel do projeto CONAHP único existente foi examinado: **Manage deployments: No active deployment; No archived deployments; This project has not been deployed yet**. Nenhum outro projeto será criado.

## Pré-checks realizados

- Código de referência canônico: `backend/apps-script/Code.gs`, blob `be7b23f6c6f1381aca7042b9f0ef772290ccc0ad`. Usuário declarou salvamento no projeto Apps Script durante B2a; conector atual **não prova identidade byte a byte do editor** nem leitura/valores de Script Properties. Antes de clicar Deploy, comparar o editor à versão canônica e inspecionar apenas **nomes** `CONAHP_SPREADSHEET_ID`, `CONAHP_SHARED_SECRET`, sem expor valores.
- A planilha B1 foi conferida novamente por leitura: privada `shared=false`, permissões apenas `user/owner`, `Preferences` com **zero linhas de dados**, 2 perfis `example.invalid` **inativos**. Nenhuma célula alterada.
- O Apps Script opera com `SpreadsheetApp.openById()`, `PropertiesService.getScriptProperties()`, `LockService` e `ContentService`. Requer autorização Google do responsável para acesso à planilha, somente com escopos apropriados; verificar painel de permissões antes de aceitar. A implantação como proprietário permite ao script acessar a planilha privada sem compartilhar o arquivo com terceiros.
- Endpoint acessível externamente **não é proteção suficiente**. Toda operação exige `CONAHP_SHARED_SECRET`; quem obtiver esse valor poderá forjar email no backend. **Nunca usar segredo em links, URL query, browser DevTools, GitHub ou Issue.**

## Operação manual mínima para publicar UMA versão

No [editor Google Apps Script](https://script.google.com/home/), abrir o projeto já existente **CONAHP 2026 - Backend**. **Não criar outro projeto.**

1. Conferir `Code.gs` salvo e equivalente ao blob auditado; `Configurações do projeto > Propriedades do script` apresenta **somente os nomes esperados** com valores privados. Conferir conta proprietária da planilha e ausência de compartilhamento extra. Se não corresponder, **STOP**.
2. No topo, **Implantar > Nova implantação**. No seletor de tipo (engrenagem), selecionar **App da Web**.
3. Descrição: `CONAHP B2b - homologação inicial`. **Executar como: Eu (proprietário)**. **Quem pode acessar: Qualquer pessoa** (somente quando indispensável para permitir chamadas server-to-server do Worker sem cookie Google; negar no código quando não houver segredo). Esse acesso é o risco residual aceito; se conta/política não permitir ou exigir pagamento, **STOP** e registrar restrição. Não escolher execução como visitante.
4. Clicar **Implantar** uma única vez. Se houver pedido de autorização OAuth, ler escopos e confirmar apenas os necessários ao próprio Apps Script/planilha. Em caso de aplicativo não verificado ou escopos inesperados, **STOP** e submeter ao orquestrador, não contornar aviso de segurança.
5. Após publicar, em **Implantar > Gerenciar implantações**, confirmar **exatamente 1 deployment ativo** do tipo App da Web, descrição e versão registrada; não implantar novamente se houve sucesso. Guardar `/exec`, deployment ID e dados de versão **somente em local privado** (nunca issue/branch).
6. **Não iniciar B3**; Worker Cloudflare, Access, domain e perfis reais continuam intocados.

## Smoke B2b com mínimo risco (pós-publicação, por ambiente privado autorizado)

- **GET /exec** sem corpo: `doGet` retorna JSON lógico `ok:false`, `METHOD_NOT_ALLOWED`. O HTTP pode ser 200 por decisão do ContentService; conferir **corpo JSON** e origem/redirecionamento, não apenas HTTP.
- **POST sem segredo**: `{action:"me",email:"unknown@example.invalid"}` deve retornar `ok:false`, `FORBIDDEN`, sem leitura nem escrita.
- **POST segredo inválido, e-mail sintético**: novamente `FORBIDDEN`. Não utilizar o segredo real em comandos exibidos, screenshots ou terminal gravado.
- **POST segredo válido armazenado em ambiente privado, identidade fictícia desconhecida**: `FORBIDDEN`; repetir para os dois perfis sintéticos inativos `example.invalid`: `FORBIDDEN` sempre. Esse teste acessa a planilha, mas não grava preferências.
- **POST com segredo válido e `action:"schedule"`**: JSON `ok:true`, 32 registros e IDs correspondentes. Este é teste de leitura, sem preferências ou PII. Se a API não responder adequadamente, **STOP**.
- Verificar `ContentService` 301/302/303 para `script.googleusercontent.com/macros/echo` e resposta JSON, com **GET no redirect e sem enviar segredo novamente**. Redirecionamentos inesperados, 307/308 ou destino estranho exigem correção antes da integração Worker, sem relaxar validação.
- Reabrir planilha `Preferences` em modo leitura e conferir **zero linhas de dados**; `Profiles` permanece com dois perfis inativos; planilha continua privada.
- **Não realizar POST de escrita com perfil ativado**: ativação requer teste controlado e política Access futura. Não afirmar validação completa de escrita/autorização sem perfil de homologação ativo explicitamente autorizado.

**Observação de execução:** as ferramentas atuais **não podem efetuar esses testes HTTP autenticados nem acionar a interface**; nenhum teste real de bloqueio/redirecionamento foi executado por este executor. Os testes sintéticos anteriores não contam como PASS do Web App publicado. Não marcar `B2B_PUBLISHED` ou `RELEASED` antes de publicação e smoke real comprovados.

## Rollback e STOP

- Se uma implantação inicial falhar em autorização, resposta JSON, redirecionamento, isolamento ou segurança: **não publicar URL, não iniciar B3**, revisar script sem expor segredos.
- Na primeira publicação, rollback pode significar **arquivar/desativar a implantação** em `Gerenciar implantações`, confirmar que `/exec` não executa e preservar planilha/segredo para análise privada. Em versões futuras, reverter versão da implantação existente após autorização e smoke de regressão; nunca apagar preferências automaticamente.
- Risco residual de impersonação com segredo compartilhado continua aceito para homologação **com controles compensatórios**, não prova de inviolabilidade.

**Resultado deste turno:** `B2B_READY_FOR_AUDIT` **com bloqueio manual e sem implantação efetiva**; aguardando passo humano e evidências não sensíveis. Issue #3 permanece OPEN. Nenhum projeto duplicado, Cloudflare, PR/Code Review, Codex/Work, main, RIW/GSH alterado.

# M3 B2a - Preparação privada do Google Apps Script, SEM publicação

Data de revisão: 2026-10-09. **Autorização específica B2a recebida.** A execução foi limitada à leitura da planilha B1, conferência do código canônico, testes sintéticos e preparação de um procedimento manual. O conector Google Drive/Sheets disponível **não oferece criar Apps Script nem gerenciar Script Properties**: nenhuma operação compatível com projetos `script.google.com` foi encontrada. **Nenhum projeto Apps Script foi criado, nenhum segredo real foi gerado ou armazenado, nenhuma configuração de produção foi executada.** Este estado exige intervenção humana e auditoria; não é B2b autorizada.

## 1. Fonte única e isolamento

- Código canônico: `backend/apps-script/Code.gs` da branch `feat/m1-foundation`, **blob Git `be7b23f6c6f1381aca7042b9f0ef772290ccc0ad`**. Não copiar Code.gs, parâmetros, URLs, planilhas ou segredos RIW/GSH.
- Planilha B1 **já criada, privada e auditada**, cujo link/ID deve permanecer **somente no ambiente privado** do usuário. Não reproduzir esses valores em GitHub, Issues, logs ou respostas públicas.
- A implementação é **standalone** (não precisa ser vinculada por container): `SpreadsheetApp.openById()` recupera a planilha pela Script Property `CONAHP_SPREADSHEET_ID`. O acesso é da identidade autorizada a executar o projeto, sem alterar o arquivo Sheets ou seus compartilhamentos.
- Este é o **único projeto** a ser criado quando a intervenção manual for feita; não criar projetos de teste adicionais e não publicar uma implantação.

## 2. Compatibilidade verificada por leitura da planilha real, sem modificações

| Aba | Cabeçalho existente / esperado | Linhas de dados B1 | Condição |
|---|---|---:|---|
| `Profiles` | `profileId,email,label,active` | 2 | Domínio fictício reservado, `active=false`; **nenhum login autorizado** |
| `Sessions` | `id,day,start,end,title,track,stage,source,verified,speakers` | 32 | IDs `c26-s001` a `c26-s032`; Code.gs usa `id`, demais campos públicos e ignora a coluna opcional `speakers` na API de retorno |
| `Preferences` | `profileId,sessionId,interest,priority,attending,comment,questions,updatedAt` | 0 | Cabeçalho exato na linha 1; nenhuma curadoria criada |
| `SourceLog` | `sessionId,source,verifiedAt,note` | 32 | IDs alinhados com Sessions; usada na auditoria editorial, não consumida diretamente por Code.gs |

- Metadados Drive após leitura B2a: `shared=false`, somente uma permissão do tipo `user/owner` retornada. Não houve compartilhamento nem mutação de valores/células.
- O Code.gs compara `String(active).toLowerCase() === 'true'`. Os dois registros sintéticos permanecem `false`, e portanto `me` e preferências **devem ser negados**, mesmo em teste local.
- O Code.gs chama `SpreadsheetApp.openById`, `PropertiesService.getScriptProperties`, `ContentService` e `LockService`. Sem `CONAHP_SPREADSHEET_ID` e `CONAHP_SHARED_SECRET` configurados, **não considerar backend pronto**.
- Validação no V8 local: **11/11 verificações PASS** executando o Code.gs integral do GitHub com substitutos inteiramente sintéticos de APIs Apps Script/Sheets: compilação, ausência/erro de segredo, perfis inativos, leitura de agenda sintética, ausência de gravação real, sessão inexistente, override de perfil, confirmação de gravação simulada, texto com prefixo de fórmula inerte e isolamento da gravação em memória. **Não houve execução de Apps Script real** nem testes contra a planilha B1.

## 3. Menor intervenção manual necessária (sem publicação)

**Pré-condição:** acessar a conta Google **proprietária** da planilha CONAHP B1, sem criar nova conta, sem associar RIW/GSH.

1. Abrir **https://script.google.com/home/projects/create** na conta proprietária. Criar **um** projeto standalone com nome, por exemplo, `CONAHP Agenda 2026 - Backend B2a (privado)`. Se o sistema já tiver criado este projeto, **não duplicar**: abrir o existente.
2. No editor, abrir `Code.gs`, apagar apenas a função modelo do **novo projeto** e colar **integralmente** a versão canônica de `backend/apps-script/Code.gs` da branch técnica, na revisão blob indicada. **Salvar**, conferir a presença de `doPost`, `doGet`, `profileFor` e `safeSheetText`. Não editar código de nenhum outro projeto.
3. Abrir a planilha CONAHP B1 **no Drive privado** e copiar o ID exclusivamente da barra de endereço para uso local; não enviá-lo ao chat, GitHub, Issues ou documentos públicos.
4. No Apps Script do novo projeto, clicar em **Configurações do projeto (engrenagem) > Propriedades do script > Adicionar propriedade**. Incluir exatamente `CONAHP_SPREADSHEET_ID` com o ID privado da planilha B1.
5. Gerar **um segredo exclusivo forte** por um gerenciador de senhas/gerador criptograficamente seguro (ideal: 32 bytes aleatórios ou mais, representados por 43+ caracteres base64url; não reutilizar nem derivar senhas pessoais). Cadastrar como `CONAHP_SHARED_SECRET` em **Script Properties** e armazenar cópia somente em cofre privado de senhas destinado ao CONAHP. **Não produzir, colar ou registrar o valor em chat, captura de tela, planilha, repositório público, Issues ou console/log**. Se não houver um cofre/gerador confiável, deixar a propriedade **pendente** e não improvisar um segredo fraco. O segredo precisará corresponder posteriormente à secret `APPS_SCRIPT_SECRET` do Worker, exclusivamente após autorização B4.
6. Em **Configurações do projeto**, confirmar que o projeto não está compartilhado com terceiros e que não há deployment. A página **Implantar > Gerenciar implantações** deve não conter Web App publicado para este projeto. **Não clicar em “Nova implantação”**, não configurar `Anyone`, não copiar URL de `/exec`, não conceder acesso público.
7. Validar **somente salvamento do código, presença das duas propriedades por seus nomes (sem divulgar os valores), conta proprietária correta e ausência de implantação**. Não executar `doPost` ou `doGet` via HTTP nem testar permissões públicas nesta etapa. Se o editor solicitar OAuth para abrir/rodar recursos, evitar autorizar escopos adicionais neste B2a e registrar a pendência para gate posterior.
8. Registrar a conclusão manual **somente no contexto privado**, com informação `projeto único criado; código salvo; duas propriedades presentes; nenhum deployment; nenhum compartilhamento`. **Não enviar scriptId, spreadsheetId, URLs privadas ou segredo à Issue pública.** A auditoria B2a poderá então conferir o projeto pela interface autorizada.

**Intervenção mínima real:** uma única sessão de editor Apps Script na conta proprietária, com salvamento do `Code.gs` e configuração privada de 2 propriedades. A conexão disponível não pode executar nem confirmar os passos 1–8 automaticamente.

## 4. B2b (Web App) - explicitamente NÃO autorizada

Antes de qualquer implantação futura, obter **nova autorização B2b e aceite específico do risco residual**:

- Decidir `execute as` (conta proprietária) e quem pode acessar o Web App. Um endpoint potencialmente público, mesmo exigindo `CONAHP_SHARED_SECRET`, **não é privado por obscuridade da URL**. Vazamento do segredo permite forjar `email` e acessar/gravar dados de qualquer perfil ativo; planejar segredo único, rotação, uso de menor privilégio, ausência de segredos/PII em logs e plano de incidente. Se risco não for aceito, **STOP** e propor backend alternativo com autenticação própria.
- Conferir escopos OAuth, propriedade de planilha/conta e erros de permissões; testar segredo ausente/incorreto, identidade desconhecida, perfis sintéticos inativos, sessão inexistente, `profileId` forjado, falhas de gravação e leitura pós-escrita. **Não ativar os perfis fictícios** para simular identidades reais; autorização de perfis reais é gate separado.
- No Apps Script `ContentService`, uma resposta JSON de erro pode conter campo `status` sem HTTP status real 4xx (o serviço Google decide status/redirecionamentos). **Testar tanto HTTP efetivo quanto `ok:false` do payload**; jamais tratar `status:403` no JSON como proteção de perímetro.
- Verificar redirecionamentos de respostas para `script.googleusercontent.com/macros/echo`. O Worker somente admite 301/302/303 para o host exato e faz GET sem encaminhar segredo. Se o Google retornar comportamento diferente, **parar e revisar contrato**; não liberar hosts arbitrários nem seguir POST 307/308 com segredo.
- Testar persistência real com identidades aprovadas, erros de escrita visíveis, isolamento de perfis, limites/quotas e rollback por nova versão/implantação. Reverter a implantação não apaga nem restaura automaticamente as preferências da planilha; backup e restauração são gates próprios.
- **Nunca criar deploy, habilitar “Anyone” ou liberar URL/exec durante B2a**. B3 Access, B4 Worker e B5 integração real continuam gates independentes.

## 5. Estado da B2a e evidências para orquestrador

- **Código + esquema + riscos + procedimento privado preparados e auditáveis, sem alteração na planilha.**
- **Projeto Apps Script real: NÃO CRIADO** pelo executor, devido à ausência da capacidade de Apps Script no conector instalado. **Script Properties reais e segredo real: NÃO CONFIGURADOS**. Este é um bloqueio de interação externa verificável, não um teste passado.
- Próximo passo manual é mínimo e não exige serviço pago. Ao ser concluído e verificado na interface privada, o orquestrador pode marcar projeto preparado; **B2b continua sem autorização**.
- Status de encaminhamento para auditoria: `B2A_READY_FOR_AUDIT` **COM PENDÊNCIA MANUAL EXPLÍCITA**. Não confundir com `B2A_FULLY_CONFIGURED`, `READY_FOR_RELEASE` ou `RELEASED`.

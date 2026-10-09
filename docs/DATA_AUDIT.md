# Auditoria dos dados públicos CONAHP 2026 - M2

Fonte primária: https://conahp.org.br/conahp-2026/ (redirecionamento de https://conahp.org.br/2026/). Conferência editorial: **2026-10-09**. A página oficial ressalva que a programação está sujeita a atualizações.

## Contagem e cobertura
- **32 itens** de programação: **16 em 14/10** e **16 em 15/10**, incluindo pausas, abertura e almoço, tal como publicados na grade consultada.
- **109 participações** atribuídas a itens (não 109 pessoas distintas). **9 itens** sem nomes de participantes, principalmente atividades gerais e intervalos. Não preencher lacunas por inferência.
- Trilhas/palcos da fonte: Plenária; Compromissos setoriais; Tecnologia e inteligência em saúde; Financiamento e sustentabilidade; Pessoas, trabalho e liderança; Legitimidade social e impacto; Intervalo/Área comum. As trilhas do segundo dia diferem das do primeiro.
- Blocos simultâneos de três sessões por horário; conflitos calculados por intervalos reais, somente quando o perfil marca intenção de assistir.
- Cada item em `public/schedule.json` tem `id` imutável, `day`, `start`, `end`, `title`, `track`, `stage`, `source`, `verifiedAt`, `participants` e `sourceHistory`. Identidades `c26-s001` a `c26-s032` são atribuídas uma vez e devem permanecer iguais se o programa mudar.
- Papéis e instituições foram transcritos/normalizados do texto publicado. Quando a função ou a instituição não aparece expressamente, indicar `não informado` ou `não informada`; não criar informações.

## Inconsistências/lacunas editoriais ainda abertas
- Na grade do case Pix, a palestrante aparece como **Eduarda Jorge**; no catálogo de palestrantes em destaque aparece **Eduarda Davidovic**. Preservado na sessão o nome da grade, aguardando confirmação oficial da equivalência.
- Na grade de 14/10 a participação aparece como **Diogo Dias**; no catálogo de palestrantes figura **Diogo Porto Dias**. Não deduzir equivalência.
- A função de Gabriel Dalla Costa na grade se refere à Comissão Científica do Conahp 2025, ao passo que outra seção da página menciona 2026. Não deduzir qual é a versão correta sem confirmação.
- A programação apresenta instituições/cargos de alguns participantes de maneira resumida ou divergente entre seções; os dados normalizados não substituem o texto oficial. O app mostra fonte para consulta.
- Não foram identificados canais de áudio oficiais; nenhum foi incluído. Expositores e trabalhos da Sessão Pôster pertencem à missão complementar, não à programação central M2.
- **Não existe sincronização automática** com a fonte. A importação foi pontual; revisar oficialmente antes do congresso, comparar IDs e anotar alterações sem sobrescrever preferências.

## Validações e integração
- Auditoria programática via conector GitHub: 32 entradas, 16 por dia, 32 IDs únicos, 109 participações, fonte e data informadas em todos os registros; nenhum horário inválido identificado na primeira conferência.
- Comando versionado: `node scripts/export-sessions.mjs --check` valida estrutura/contagem; sem `--check`, emite CSV no terminal, **sem criar, ler ou modificar Google Sheets**.
- Para integração futura autorizada: usar o CSV na aba `Sessions` da planilha CONAHP isolada; os mesmos IDs devem existir antes da primeira gravação real de preferência, pois o Apps Script recusa IDs ausentes. Criar `Profiles` para as identidades autorizadas apenas em ambiente privado, nunca no GitHub público.
- Testes locais com fixtures não comprovam autenticação Cloudflare Access nem persistência real no Sheets; esses testes pertencem ao gate M3.

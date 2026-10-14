# B18-E - UX Flora: candidata e publicação

Base B15 Drive SHA256 `73ea4a26d50431729559f968853c1bf1ca47ee6ba8464c5f21196f0a7d217332`, B17 Vercel `dpl_AU2bxMsMMbThebHSYnZ2VdbFJk57`.

Candidata B18 ZIP SHA256 `f1ff3cc05504b59857090fa099ac0a5b5cd953be3bac97f183c1a540bc9a44b8` arquivada no Drive: https://drive.google.com/file/d/1nL9FY-b5SoB1mfuakS7soK7p7ZdD1WUy/view

## O que mudou

Somente duas abas Programação/Minha agenda, inclusão manual independente de interesse, Agenda/Lista, dias 14 e 15, grade temporal responsiva com eventos paralelos lado a lado, cores de 4 estados, filtro avançado + relativo ao fuso de São Paulo, modais de detalhes/edição com rascunho preservado, backup export/import, serviços neutros, ícones reais PNG/maskable e manifest/SW público. Aderência temática estimada para Flora exclusivamente a partir de títulos/trilhas, com confiança e justificativa, sem gravar prioridade, inclusão ou decisão automaticamente. **Agenda oficial `schedule.json` e `schedule-utils.js` idênticos aos publicados em B17.**

## Compatibilidade localStorage

Chave B18: `conahp2026:flora:preferences:b18`; UI mantém a chave B17 `conahp2026:public-filters:v1`. Varredura em chaves locais CONAHP e snapshot `conahp2026:b18:legacy-snapshot:v1`, sem remover chave/registro legado. Estados antigos `Interesse=>Talvez`, `Quero ir=>Alto interesse` somente na exibição, raw preservado; *attending* não inferido. Export e import sem substituição padrão.

**Risco residual:** a chave exata e todos os formatos de preferências do adaptador B17 não foram lidos integralmente pelo conector Vercel. Backup B17 antes de qualquer promoção e teste da Flora em navegador real no mesmo domínio são necessários para homologar compatibilidade. Rollback: deployment B17 preservado. Sem sincronização entre dispositivos.

## QA

`node --check public/b18.js`: PASS. Chromium DOM simulado (sem HTTP real) larguras 320, 360, 390, 412, 768, 1280: PASS sem overflow/pageerror, lanes, formulário, legado, rascunho, backup, modais/ESC, tabs/filtros. Auditoria 32 sessões, 110 participantes, 21 pares, PNG 192/512 e maskable: PASS. Smoke HTTPS, reload no domínio e instalação real PWA: ainda pendentes de validação externa. Não usar o status B18_UX_READY até esse gate.

## Futuro servidor

Vercel Blob 403 sem alteração de permissão, não repetir. Sheets via API do servidor Vercel, segredos apenas em ambiente, autorização por gravação/leitura e testes entre dispositivos, depende de autorização específica. Nenhuma alteração no RIW, Sheets, Cloudflare ou Apps Script.


## Correção e regressão B18-E

Na primeira abertura B18 deve usar **Agenda** mesmo quando o B17 antigo persistia `view=list` automaticamente por padrão. A preferência explícita nova usa `b18ViewChoice` dentro da chave UI existente; após o usuário escolher Lista ou Agenda, a escolha se mantém em reload. Teste de recarga sintética em Chromium confirmou que `Interesse` antigo permanece intocado no armazenamento original, mapeamento visual `Talvez` não vira escolha automática, comentários/perguntas/intenção persistem na chave B18 e dia/visualização mantêm a última escolha. Não equivale à verificação com os dados B17 reais da Flora.


### Atenção: origem da prévia

A prévia Vercel usa **hostname diferente** do alias de produção. `localStorage` é isolado por origem: abrir preview NÃO recupera automaticamente os registros que Flora já tem no domínio `conahp-flora-2026.vercel.app`. Para conferir o conteúdo com segurança, exportar backup na B17 no domínio atual e importar o JSON na prévia B18 (sem marcar sobrescrita por padrão). Mesmo esse teste não comprova migração automática das chaves da B17, que exige primeiro uso no mesmo hostname de produção depois de backup. Não afirmar perda de dados se a prévia começa com Minha agenda vazia; o armazenamento é outro.

Implantação de prévia corrigida (readback Vercel READY e 12 hashes corretos): `dpl_Fp596egAVphFPGpgZ5CCZn2n7EwK`, https://conahp-flora-2026-3h2aok23h-joao-moraes-projects-9bc51b2e.vercel.app . API Vercel confirmou que o alias principal ainda aponta para B17 `dpl_AU2bxMsMMbThebHSYnZ2VdbFJk57`.

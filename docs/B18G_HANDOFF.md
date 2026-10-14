# B18-G - Refinamento fino UX Flora

Data: 2026-10-14 (BRT). Branch `feat/b18-flora-ux`, baseada no HEAD B18-F `ad192ebd76f6c13e437a4a43fe603424a93a3db2`.

## Mudanças deliberadamente limitadas

- `public/b18.css`: serviços com fundo neutro, sem hachura; legenda de quatro estados em uma só linha a partir de 320 px nos testes; chips de interesse e prioridade mais baixos; prioridade selecionada com azul intermediário; dias e abas com fontes mais legíveis; CTA principal de inclusão azul-escuro e retirada secundária; chips dos filtros avançados; carregamento com fundo azul, logo oficial e indicador discreto; app volta ao fundo claro quando carregado.
- `public/b18.js`: rótulo visual `Alto interesse` -> `Interesse`, **valor persistido inalterado**; dias Quarta/Quinta; prioridade Essencial, Alta, Média, Baixa, Sem; no modal e lista, remove repetição de `stage`/`track` quando representam a mesma trilha; filtros `attendFilter`/`conflictFilter` passam a `button[aria-pressed]` preservando `st.attend`/`st.conflict`; CTA `+ Incluir na minha agenda`; controle da camada de loading no `init()`.
- `public/index.html`: rótulos curtos e legenda compacta, filtros com botões, elemento de carregamento com a logo oficial e estilo crítico de fundo azul.
- `public/manifest.webmanifest`: **somente** `background_color` de `#f3f7f8` para `#073b5c` (splash Android). `theme_color`, todos os ícones e configurações PWA preservados.
- `public/service-worker.js`: cache **somente público** incrementado para `conahp-b18g-public-v1`, sem mexer em `localStorage`.

## Identidade do dado e segurança

- O valor interno `Alto interesse` **continua literalmente igual** no `STATES` e na carga útil exportada/importada. `LEGACY` de `Interesse` para `Talvez` continua para preservar a semântica de classificação antiga. Apenas `interestLabel` apresenta `Interesse` para `Alto interesse` internamente. Nenhuma migração em massa ou reclassificação automática.
- Chaves: `conahp2026:flora:preferences:b18`, `conahp2026:public-filters:v1`, `conahp2026:b18:legacy-snapshot:v1` inalteradas. Não mexer em dados de Flora, backup, sincronização ou backend.
- Nenhuma alteração nos arquivos `schedule.json`, `schedule-utils.js`, `logo-conahp.svg` e quatro PNGs PWA. 32 sessões oficiais e IDs intactos. Não tocar RIW, Cloudflare, Apps Script, Google Sheets ou Vercel Blob.

## QA local (sem navegador de Flora)

- `node --check public/b18.js`: PASS.
- `python tests/b18_browser_qa.py`: PASS seis larguras 320, 360, 390, 412, 768, 1280 px.
- `python tests/b18_reload_qa.py`: PASS preferências legadas, notas, perguntas, inclusão e escolha de vista após recarga sintética.
- `python tests/b18g_regression_qa.py`: PASS mesmas seis larguras e fluxo comportamental B18-F, agora verificando **serviço sem hachuras**.
- `python tests/b18g_browser_qa.py`: PASS seis larguras; legenda de quatro estados em linha única, novo CTA, paleta neutra de serviço sem ações, estados `aria-pressed`, filtro por chips, ordem de prioridade, normalização do local/trilha, carregamento e transição do fundo, persistência sem alterar enum e integridade binária de programação/ícones.
- **NOT_RUN / BLOCKED_EXTERNAL:** `python tests/b18g_http_qa.py`: tentativa local falha antes de acessar o app, Chromium retorna `ERR_BLOCKED_BY_ADMINISTRATOR` para `127.0.0.1`, restrição do ambiente. Preview HTTP pública e Android físico também não verificáveis deste runtime. Não interpretar como falha de código nem alegar PASS. QA real pelo proprietário necessário.
- **FAIL remanescente:** nenhum entre os testes automatizados executáveis. Não declarar validação da splash nativa Android físico: depende de instalação/PWA e comportamento do sistema.

## Publicação, origem e rollback

- Publicar **somente preview Vercel** no projeto `prj_WUBhR8G0dDeyvESLAOc1jB3L5OwU`; não promover a alias `https://conahp-flora-2026.vercel.app`.
- Após deploy, registrar URL, deployment ID, hashes, status READY e leitura dos arquivos na Issue #3.
- A preview tem origem distinta, portanto não lê localStorage da URL anterior. Para comparar registros, exportar JSON da origem antiga e importar na nova preview, sem sobrescrever conflitos até conferir.
- Produção estável B17 `dpl_AU2bxMsMMbThebHSYnZ2VdbFJk57` permanece como rollback sem apagar chaves do navegador. B18-F preview `dpl_Ex3YfvoJeD7AHdnbfLU4xmcWfimq` também preservada.

**Status alvo: `B18_G_READY_FOR_OWNER_QA` (preview READY, homologação pelo proprietário ainda pendente).**


## Preview implantada - verificação Vercel API (B18-G)

- Preview exclusiva: https://conahp-flora-2026-2bril2m9p-joao-moraes-projects-9bc51b2e.vercel.app/
- Deployment: `dpl_7mmy6qaoeESWouBhZGNpZy5r4Ar8`, projeto `prj_WUBhR8G0dDeyvESLAOc1jB3L5OwU`, Vercel `READY`; API listou 12 arquivos corretos.
- Commit funcional B18-G: `f0469c7c51fd5f07e8f49dee43b9f84954088652`. Branch `feat/b18-flora-ux`, `main` inalterada.
- Comparação SHA1 de arquivos publicados, idênticos à candidata testada: `b18.js=ce2f5339774af7fa03e625bc0bd6c56e10d45405`, `b18.css=e794fec61ce89c471e300230179144c962cbe65f`, `index.html=159a23c5f5b239f124a7e9b4d3a250f29cfe6588`, `manifest.webmanifest=e8969612104f3e205b81face97f1009c6f54fd3a`, `service-worker.js=611e3c131fff3d668b5f4668f4b0eba4699add10`. Agenda `0eb7a64a6d10afde2b9890969518a80024cdca03`, logo `b06b4ce8037cd67ff7bc06122931a16f49ed20b4` e quatro PNGs idênticos à B18-F.
- `get_alias(conahp-flora-2026.vercel.app)` confirmou B17 `dpl_AU2bxMsMMbThebHSYnZ2VdbFJk57` ainda na URL de produção. Preview B18-F e o rollback B17 permanecem intactos.
- Pacote de auditoria: https://drive.google.com/file/d/1q35JVK1NfeK0YGgvt7IORHbjSmSzv7CV/view ; SHA-256 `9b9b4ad136d9295a76b4980991548001314b322c8fecccb5616e2a4bae4c9123` (20 arquivos, 12 assets, testes, docs e hashes).
- Smoke HTTP real do hostname Vercel e uso Android físico **NOT_RUN**; `localhost` também bloqueado (`ERR_BLOCKED_BY_ADMINISTRATOR`). Testes Chromium DOM foram executados em seis larguras e passaram. A implementação não cria sincronização remota.

**Entrega:** `B18_G_READY_FOR_OWNER_QA`, sem promoção à URL estável. Para testar dados já salvos em outra origem, fazer primeiro backup JSON na URL antiga e importar manualmente na nova preview. Promoção futura somente após QA e autorização explícita, rollback pelo deployment B17 acima sem apagar `localStorage`.

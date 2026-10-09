# Arquitetura v0 - CONAHP

## Estratégia
Preservar a stack do RIW: frontend estático (HTML/CSS/JS) como PWA no Cloudflare Workers Static Assets; Worker JavaScript com endpoints `/api/*`; backend Google Apps Script; persistência em Google Sheets. Sem React/D1/R2 ou mudanças de framework sem justificativa concreta.

### Referência RIW validada
- https://github.com/jofmoraes/riw-agenda-2026/blob/main/README.md
- https://github.com/jofmoraes/riw-agenda-2026/blob/main/src/worker.js
- https://github.com/jofmoraes/riw-agenda-2026/blob/main/wrangler.jsonc
O RIW usa Worker como proxy JSON para Apps Script, mas há configurações/URLs específicas; **não copiá-las**. O RIW README menciona JSONP legado; verificar o código atual para detectar inconsistências e usar uma única API confiável.

## Organização alvo (orientativa, não exigir refatoração sem necessidade)
```
public/                # html, css, js, ícones, manifest, service-worker
src/worker.js          # autenticação/autorização, API e arquivos estáticos
backend/apps-script/   # versão auditável do Code.gs
data/                  # programação pública validada e scripts de importação, se úteis
tests/                 # smoke, contratos API, perfis, persistência, conflitos
docs/                  # produto, arquitetura e estado
wrangler.jsonc         # configuração Cloudflare sem segredos
```

## Contratos mínimos de API (proposta a confirmar na Missão 1)
- `GET /api/health` -> `{ok:true, version}`, sem vazar backend.
- `GET /api/schedule` -> agenda pública com IDs estáveis e timestamp de atualização.
- `GET /api/me` -> perfil vinculado a identidade verificada e permissões; sem confiar no profile indicado pelo cliente.
- `GET /api/preferences` -> preferências do perfil autenticado.
- `POST /api/preferences` -> atualização autorizada de classificação/comentários, idempotência/versão conforme necessário.
- Erros `{ok:false, error:{code,message}}` + status HTTP apropriado; sem sucesso falso. Esquema exato e compatibilidade com Apps Script a definir e testar na primeira missão.

## Segurança
1. Verificar modelo de login de baixo atrito, preferencialmente Cloudflare Access *se* compatível com uso em celulares e plano, antes de decidir sua adoção definitiva.
2. Autenticação e autorização **no servidor** por perfil e operação. Leitura pública do cronograma separada de preferências privadas. Proibir elevação de permissões por nome de perfil no request.
3. Blindar API Apps Script contra chamadas diretas não autorizadas; se Apps Script público não permitir isolamento seguro de escrita, adotar alternativa proporcional, documentada e aprovada.
4. Segredos Cloudflare, credenciais e identificadores particulares nunca no GitHub público nem no frontend. Checar logs para vazamentos.
5. CORS, cache e offline: somente agenda pública pré-carregada; não cachear dados privados em service worker como se fossem públicos.

## Integração e publicação
- Fonte canônica de `Code.gs` versionada no GitHub, implantação em Apps Script somente mediante autorização e com identificação da versão.
- Nenhum vínculo de auto-deploy antes do gate; inspecionar workflows, Workers Builds e regras da branch antes de push/merge.
- Diferenciar: teste local -> teste de integração -> deploy autorizado -> verificação do ambiente real.
- Não abrir PRs. Usar branch de desenvolvimento, commits, evidências, auditoria e integração autorizada (sem criar Code Review).
- Testes mínimos: API health/erro; autorização cruzada Flora/Juliana; leitura/gravação e falha simulada; conflitos; interface mobile; PWA offline público.

## Lições GSH adotadas seletivamente
- docs/STACK_GUARDRAILS.md: stack existente prevalece.
- frontend_app/canonical/README.md e http.mjs: adaptadores/contratos, erros explícitos e validação.
- docs/review/REMOTE_REVIEW_CONSOLE_ARCHITECTURE.md: backend decide acesso e persistência; não importar arquitetura privada D1/R2.
- docs/orchestration/MINIMAL_SUFFICIENT_IMPLEMENTATION_POLICY.md: não criar infraestrutura que não atende requisito atual.

# B18-J — Minha agenda por dia + envio para Flora

Base: B18-I HEAD `fda0c35471928639dc047c219af6c2dc1af59476`, branch `feat/b18-flora-ux`. Data: 2026-10-14.

Decisão do proprietário: retornar Minha agenda ao recorte de Quarta/Quinta e aplicar todos os filtros da Programação, mantendo total geral no badge. O resumo mostra a quantidade no dia e o total para evitar confusão sem alterar a semântica do badge.

Mesmas seleções de dia, busca, interesse, filtros avançados e visualização disponíveis nas duas abas. Somente em Minha agenda, o botão Backup passa a Limpar filtros: branco sem filtro e azul médio quando algum filtro (incluindo busca/interesse) estiver ativo. Limpeza não altera dia, aba ou visualização. Backup segue acessível na Programação. Minha agenda sempre exige attending=true e mostra só o dia selecionado. Mantém grade 08–19 B18-I e salvamento imediato.

Compatibilidade iPhone: metadados apple-mobile-web-app-capable/status e apple-touch-icon apontando ao ícone oficial existente; manifest continua display=standalone, ícones originais inalterados. SW de assets públicos versionado como conahp-b18j-public-v1.

Preservação: mesmo PREF_KEY, UI_KEY, SNAPSHOT_KEY; sem remoção nem reset de dados, programação oficial, notas, perguntas, prioridade, conflitos, backup e PWA intactos.

QA esperado: 2 Quarta+1 Quinta -> badge 3 global, Minha agenda Quarta 2 e Quinta 1 sem filtros; aplicar filtro no mine reduz visualização e colore Limpar filtros; limpar remove somente filtros; Programa mantém Backup; teste Lista/Agenda, persistência/reload, mobile 320–412; mesmas 32 sessões e 12 assets. Publicação Vercel mediante autorização expressa já dada no chat orquestrador; registrar deployment, alias, readback, rollback e status de testes efetivamente executados.

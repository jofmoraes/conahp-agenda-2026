# Produto - Agenda CONAHP 2026

## Escopo e objetivo
Aplicativo PWA independente para organizar a participação de Flora e Juliana no CONAHP 2026, no Transamerica Expo Center, São Paulo, em 14 e 15/10/2026. O RIW Agenda 2026 é a referência funcional de experiência, **não** a base de dados.

## Capacidades indispensáveis (MVP)
1. Programação oficial estruturada: data, hora, sessão, trilha/eixo, local/palco, descrição, participantes, funções e instituições, fonte e data de verificação.
2. Visões lista cronológica e grade/agenda; navegação por dia e comparação de simultâneas.
3. Pesquisa e filtros por tema, trilha, horário, participante, instituição e prioridade, conforme campos disponíveis.
4. Perfis Flora e Juliana independentes, Juliana inicialmente com tudo 'Não analisado'. Cadastro de novos perfis sem editar código.
5. Preferências individuais: interesse/prioridade, intenção de assistir, comentários e perguntas; gravação e leitura comprovadas.
6. Detecção de sobreposições (CONAHP possui trilhas simultâneas). Distinguir interesse potencial de decisão/participação efetiva.
7. PWA instalável e consulta offline **da programação pública previamente carregada**, sem promessas de gravação offline automática.
8. Comunicação de falhas e proteção das preferências privadas; identidades autorizadas por perfil.
9. Remoção de referências fixas ao RIW e dos canais de áudio, salvo confirmação oficial de necessidade.

## Complementares, não bloqueiam o MVP
- Expositores com classificação e comentários; distinguir expositores verificados de patrocinadores.
- Sessão Pôster e trabalhos aprovados, somente dados verificáveis/publicáveis.
- Compromissos pessoais e visitas a estandes, incluindo conflitos.
- Comparação opcional de agendas autorizadas entre participantes.
- Atualização controlada da programação com detecção de alterações de sessão e preservação dos IDs.
- Curadoria inicial da Juliana após análise posterior do LinkedIn, mediante orientação do usuário.

## Dados e curadoria
- Usar fontes oficiais e registrar origem, data e lacunas; não inventar palestrantes, horários, estandes ou canais de áudio.
- Não usar dados do RIW como programação CONAHP.
- Flora: aproveitar conhecimento de interesse da experiência RIW apenas se corroborado pelas informações disponíveis/decisão do usuário; não copiar preferências antigas.
- Juliana: perfil habilitado sem exigir LinkedIn ou curadoria.
- Atualizações de programação não devem sobrescrever decisões; sessão com identidade estável, campos mutáveis e histórico simples de origem/atualização.
- O material oficial pode mudar, e a lista de expositores/estandes pode estar incompleta.

## Aceite funcional do MVP
- Dois perfis conseguem consultar a agenda; autenticação efetiva impede acesso cruzado não autorizado.
- Cada perfil classifica a mesma sessão independentemente; após recarga os valores persistem; erro de gravação é apresentado.
- Grade representa simultâneas, alerta conflitos reais e não gera falso conflito para simples 'interessante'.
- Busca e filtros funcionam nos dois dias; experiência em tela pequena e instalação PWA validadas.
- Programação é rastreável à fonte e possui validação de amostras/contagem; há indicação de itens não verificados.
- Produção e dados de usuários só entram após gate de autorização e testes.

## Fora de escopo inicial
Áudio de canais; livestream; scraping automático agressivo; migração de framework; pagamentos; mapas completos de estandes sem fonte; autenticação empresarial complexa; dashboards e telemetria avançados.

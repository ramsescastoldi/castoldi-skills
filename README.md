# castoldi-skills

Coleção de skills do Ramsés Castoldi para Claude (Cowork / Claude Code): conteúdo
do Instagram @eusouramses, operação da rede de postos / Lumen Posto Club e
metodologia de desenvolvimento. Cada diretório na raiz é uma skill (`SKILL.md` +
auxiliares) — **não mover para subpastas**: a sincronização com a conta usa o
nome do diretório.

## Mapa rápido — o que dizer para ativar cada skill

| Você quer… | Diga | Skill |
|---|---|---|
| Post viral do dia (arte preta V3 + legenda) | "texto de hoje", "post de hoje", "gera post" | `posts-virais-empresariais-v3` |
| Post editorial split-screen | "post divisao" | `divisao-post` |
| Carrossel editorial (atos) | "carrossel" ou "carrossel divisao" | `divisao-carrossel` |
| Carrossel foto-no-topo (decisões, sábado) | "carrossel v2" | `carrossel-empresarial-v2` |
| Capa de reels editorial | "capa de reels", "reels divisao" | `divisao-reels` |
| Card tweet falso para capa de reels | "card de reels", "card tweet" | `card-reels-ramses` |
| Post-manchete de notícia | "post ninja", "modelo ninja" | `texto-post-ninja` |
| Analisar um perfil do Instagram | "analisa o perfil @X" | `analise-instagram` |
| Dashboard sob demanda (emails → consolidado) | "dashboard" ou "dashboard de vendas" | `dashboard-vendas` |
| Dashboard publicado no Netlify | "dashboard **online**" | `dashboard-online-lumen` |
| Newsletter Posto em Dia | "gerar a newsletter", "Posto em Dia" | `lumen-newsletter` |
| Análise de escala vs vendas por hora | "analisar escala", "dimensionamento" | `posto-escala-analyzer` |
| Consultar a fórmula viral antiga (só texto) | "post v1", "modelo antigo" | `posts-virais-empresariais` (legada) |

## Skills próprias

### Conteúdo Instagram (@eusouramses)

| Skill | Entrega |
|---|---|
| `posts-virais-empresariais-v3` | Arte PNG no template preto V3 + legenda 1100 chars + funil de 4 stories |
| `divisao-post` / `divisao-carrossel` / `divisao-reels` | Modelo visual DIVISÃO (off-white + tinta + 1 palavra em ouro); post único, carrossel e capa de reels |
| `carrossel-empresarial-v2` | Carrossel foto-no-topo com decisões numeradas + CTA Clube Empresa Blindada |
| `card-reels-ramses` | Card 1080x1920 estilo tweet falso em 3 fundos |
| `texto-post-ninja` | Post-manchete (foto de notícia + bloco preto) |
| `posts-virais-empresariais` | **Legada (v1)** — manual da fórmula viral, só texto; superada pela v3 |
| `analise-instagram` | Diagnóstico estratégico de perfil (requer Claude in Chrome) |

### Negócio — postos / Lumen Posto Club

| Skill | Entrega |
|---|---|
| `dashboard-vendas` | Consolida relatórios .xlsx de margem por filial → dashboard React + Excel |
| `dashboard-online-lumen` | Mantém o index.html do dashboard publicado no Netlify (API Apps Script) |
| `lumen-newsletter` | Newsletter semanal "Posto em Dia" em 2 PDFs (Mobile + A4) |
| `posto-escala-analyzer` | Escala vs vendas/hora, custos pela CCT SINPOSPETRO-MT, escala otimizada |

## Skills de terceiros

### Superpowers ([obra/superpowers](https://github.com/obra/superpowers), MIT — `LICENSE-superpowers`)

Metodologia de desenvolvimento de software para agentes: `brainstorming`,
`writing-plans`, `executing-plans`, `test-driven-development`,
`systematic-debugging`, `requesting-code-review`, `receiving-code-review`,
`verification-before-completion`, `finishing-a-development-branch`,
`using-git-worktrees`, `dispatching-parallel-agents`,
`subagent-driven-development`, `writing-skills`, `using-superpowers`.

### Ponytail ([DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail), MIT — `LICENSE-ponytail`)

Código mínimo ("o melhor código é o que você nunca escreveu"): `ponytail`,
`ponytail-review`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`,
`ponytail-help`.

### Utilitárias da Anthropic

Documentos e arquivos (`docx`, `pdf`, `pptx`, `xlsx`), visual
(`canvas-design`, `algorithmic-art`, `theme-factory`, `web-artifacts-builder`,
`brand-guidelines`), escrita (`doc-coauthoring`, `internal-comms`),
desenvolvimento (`mcp-builder`, `skill-creator`), rotina (`morning`,
`schedule`, `learn`, `consolidate-memory`, `setup-cowork`).

## Regras de desambiguação (evitar disparo cruzado)

- **"carrossel" sozinho** → DIVISÃO. Para o modelo 2, dizer "carrossel v2".
- **"post" sozinho** → DIVISÃO. Para o viral preto, "post de hoje"/"gera post" (v3).
- **"dashboard" sozinho** → `dashboard-vendas`. Para o Netlify, dizer "online".
- **"capa de reels"** → DIVISÃO. Para o tweet falso, dizer "card".
- **"criar skill"** → `skill-creator` (com evals). `writing-skills` é a
  metodologia superpowers, usada dentro de fluxos de dev.
- **"newsletter" sozinho** → `lumen-newsletter` (Posto em Dia); `internal-comms`
  é só para comunicação interna corporativa genérica.

## Fora do padrão

- `analise-margem-site/` — **não é skill** (sem SKILL.md): código da landing
  page de análise de margem do Lumen hospedada no Netlify. Pendente decisão de
  mover para um repositório de site.
- As 3 skills DIVISÃO carregam cópias próprias de `divisao_engine.py` + fontes
  (manutenção em triplicata) — unificação pendente.

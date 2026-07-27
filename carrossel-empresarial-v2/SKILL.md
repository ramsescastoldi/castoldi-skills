---
name: carrossel-empresarial-v2
description: 'Gera o CARROSSEL EMPRESARIAL V2 para o Instagram @eusouramses (Ramses Castoldi, mentoria empresarial 1:1 alto ticket). Use SEMPRE que o usuário disser "carrossel v2", "carrossel modelo 2", "carrossel nr 2", "carrossel das decisões", "carrossel com foto no topo", "carrossel sábado", ou pedir um carrossel mais tranquilo/reflexivo no formato foto-no-topo + texto-embaixo. Layout 1080x1350: CAPA (foto + headline grande) + N slides de decisões NUMERADAS ("DECISÃO 1", "DECISÃO 2"...) cada um com foto real no topo (~560px) e texto embaixo em fundo off-white #f8f5ed, com 1 palavra colorida por slide (vermelho urgência / dourado autoridade) + último slide CTA Clube Empresa Blindada (fundo preto). FONTE: Arimo Bold (Helvetica-like, a mesma do modelo ninja). SEMPRE pedir as fotos ao usuário (1 por slide) e apresentar rascunho dos textos ANTES de renderizar. Entrega os PNGs + legenda em code block + funil de 4 stories + 3 frases-print + horário ideal.'
---

# Skill: carrossel-empresarial-v2

Carrossel empresarial no formato **foto no topo + texto embaixo**, tom reflexivo
("McKinsey de sábado"), para o @eusouramses (Ramses Castoldi — mentoria 1:1,
filosofia liberal). É o "modelo 2" de carrossel: visual editorial, calmo, com
fotos premium de lifestyle/negócios e tipografia Helvetica-like.

## QUANDO ATIVAR

- "carrossel v2" / "carrossel modelo 2" / "carrossel nr 2"
- "carrossel das decisões" / "carrossel com foto no topo"
- "carrossel sábado" / pedido de carrossel mais tranquilo e editorial

## PASSO OBRIGATÓRIO ANTES DE RENDERIZAR (REGRA RÍGIDA)

1. **Apresentar o RASCUNHO dos textos** de todos os slides (capa, cada decisão,
   CTA) e esperar aprovação explícita ("Aprovo / Ajusta / Refaz").
2. **Pedir as FOTOS ao usuário** — uma por slide (capa + N decisões). Sem as
   fotos, não renderizar. Sugerir prompts de geração no estilo:
   *cinematic editorial photo, warm natural light, off-white and beige palette,
   minimalist, shallow depth of field, premium, no text.*

## LAYOUT (FIXO) — 1080x1350, 2x retina

- **Fonte:** Arimo Bold (`assets/Arimo-Bold.ttf`), Helvetica-like. Mesma do ninja.
- **Fundo dos slides:** off-white `#f8f5ed`. Texto tinta `#1a1a1a`.
- **Palavra colorida:** vermelho `#c0392b` (urgência) ou dourado `#b8893a` (autoridade).
- **CAPA:** foto no topo (~600px) + kicker dourado ("SÁBADO · ESTRATÉGIA") +
  headline grande (~92px) com 1 palavra colorida + rodapé "@eusouramses / arraste →".
  NUNCA usar a palavra "CARROSSEL" como etiqueta na capa (parece amador).
- **SLIDES DE DECISÃO:** foto no topo (~560px) + rótulo dourado "DECISÃO N" +
  texto (~62px) com 1 palavra colorida + rodapé "@eusouramses / ESTRATÉGIA".
  Cada decisão começa com seu número de ordem.
- **SLIDE FINAL (CTA):** fundo preto `#0f0f0f`, texto claro, caixa dourada com
  "CLUBE EMPRESA BLINDADA" + link blindada.lumenclubpainel.com.br.

## ESTRUTURA DA SEQUÊNCIA

`CAPA` → `DECISÃO 1` → `DECISÃO 2` → ... → `DECISÃO N` → `CTA`
(no caso clássico: capa + 7 decisões + CTA = 9 slides.)

## COMO GERAR

```bash
cd /tmp && cp -r <skill_dir> ./carrossel-v2 && cd carrossel-v2
pip install playwright pillow --break-system-packages -q
playwright install chromium
# Editar scripts/config_exemplo.json com fotos, números, textos e CTA:
python scripts/gerar_carrossel.py \
  --config scripts/config_exemplo.json \
  --saida-dir /mnt/user-data/outputs
```

O `config.json` controla tudo: capa (foto, kicker, titulo), lista `decisoes`
(num, foto, pos, texto) e `cta` (topo, linha, clube, link). HTML inline nos
textos: `<br>` para quebra, `<span class="red">...</span>` ou
`<span class="gold">...</span>` para a palavra colorida, `<b>` para reforço.
O script já corta a marca d'água do canto inferior das fotos (~9% da base).

Depois apresentar os PNGs com `present_files`.

## ENTREGÁVEIS

1. **PNGs** `carrossel_slide_01.png` ... em /mnt/user-data/outputs.
2. **Legenda** começando com "@eusouramses", em **code block markdown**
   (copy-paste limpo). Estrutura: headline → tese contracorrente → lista das
   decisões → Bastiat/Hayek/Schumpeter quando couber → pergunta de engajamento →
   CTA Clube Empresa Blindada + 🔗 link.
3. **Funil de 4 stories** (1h teaser, 4h enquete, 8h resultado+tese, 20h CTA).
4. **3 frases-print** (frases soltas fortes do carrossel).
5. **Horário ideal** de postagem.

## REGRAS DE CONTEÚDO

- Atacar CULTURAS e narrativas dominantes, nunca pessoas ou grupos sociais.
- Fórmula viral: tese contracorrente + definição cortante + palavra colorida.
- Voz Ramses: liberal, direta, sem romantismo, alto ticket.
- Tom do modelo 2: mais calmo e reflexivo que os posts polêmicos do dia a dia.

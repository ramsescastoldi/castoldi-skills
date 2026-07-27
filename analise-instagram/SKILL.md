---
name: analise-instagram
description: Analisa um perfil do Instagram via Google Chrome e entrega um diagnóstico estratégico de marca, identidade visual e conteúdo — voltado ao nicho de empresário/dono de posto (mas serve para qualquer perfil). Use SEMPRE que o usuário disser "faça uma análise do perfil X", "analise o perfil X do Instagram", "/analise-instagram X", "estuda o @X", "o que funciona no @X", "benchmark do @X", "analisa esse Instagram", ou pedir para comparar um perfil com o @eusouramses. Entrega relatório estruturado (posicionamento, identidade visual, formatos, o que viraliza, oportunidades) e, se pedido, comparativo com o @eusouramses.
---

# Skill: analise-instagram — Diagnóstico estratégico de perfil

Replica a metodologia usada no estudo que originou o sistema visual DIVISÃO. Abre o perfil no Chrome, lê os sinais e devolve um diagnóstico acionável.

## ATALHO
Ativa quando o usuário disser: **"faça uma análise do perfil X"**, "analise o perfil X do Instagram", "/analise-instagram X", "estuda o @X", "benchmark do @X", "o que funciona no @X".

## FERRAMENTAS
Usa **Claude in Chrome** (`mcp__Claude_in_Chrome__*`). Se a extensão não estiver conectada, peça ao usuário para conectar. Não use scraping por HTTP/curl.

## PROCESSO PASSO A PASSO
1. **Identificar o @handle.** Se vier "perfil X" sem @, confirmar o handle exato.
2. **Abrir** `https://www.instagram.com/<handle>/` (`tabs_context_mcp` → `navigate`). Esperar 3–4s.
3. **Capturar o topo** (`screenshot`): nome, bio, nº de seguidores/posts, link, **destaques** (capas e nomes).
4. **Capturar a grade** (rolar e screenshot): identificar os FORMATOS dominantes (reels talking-head, carrossel, foto, card de texto, "tweet falso", recorte de imprensa) e o padrão visual (cores, fundo claro/escuro, tipografia, uso de foto real vs arte).
5. **(Se possível) abrir 2–3 posts/reels de topo** para ler contagem de views/curtidas e o tipo de gancho que performa.
6. **Sintetizar** no framework abaixo. Não inventar números — se não viu, diga "não verificado".

> Dica: a grade do Instagram às vezes congela o screenshot. Se travar, navegue de novo para o perfil e capture só o topo + primeira fileira da grade — já basta para o diagnóstico visual.

## FRAMEWORK DE ANÁLISE (estrutura do relatório)
1. **Identidade & posicionamento** — quem é, promessa da bio, público, escala (seguidores/posts), oferta/link.
2. **Identidade visual** — paleta (claro/escuro, cor dominante, cor de destaque), tipografia (serifa/sans/mono), uso de foto real vs template, coesão dos destaques.
3. **Formatos & cadência** — mix reels/carrossel/foto/card de texto; o que aparece mais.
4. **O que funciona / viraliza** — padrões de gancho, temas recorrentes, sinais de alcance (views quando visíveis), formato campeão.
5. **O que afunda / lacunas** — ruídos visuais, falta de sistema, temas que não engajam.
6. **Oportunidades** — 3 a 5 movimentos acionáveis para o objetivo do usuário.
7. **(Opcional) Comparativo com @eusouramses** — onde ele já ganha, onde pode roubar elementos.

## BENCHMARK DO NICHO (conhecimento de referência já levantado)
- **@eusouramses (próprio, 123 mil):** reels talking-head + card "tweet falso" + post cinematográfico P&B ("ESTRATÉGIA"). Fórmula viral: tese contracorrente + negação em cadeia + 1 palavra de cor + "Simples." (94K–119K views). Temas: imposto, funcionário×sócio, CLT, liderança, margem de posto.
- **Joel Jota (6,4M):** escuro premium + dourado + foto cinematográfica.
- **Tallis Gomes (2,1M):** estética de imprensa/jornal (citar mídia) + retratos de luxo.
- **Alfredo Soares (1,4M):** destaques pretos coesos + foto real crua.
- **G4 / g4.business (3M):** navy + dourado + serifa editorial, séries "Episódio".
- **Carlos Busch (608K):** preto cinematográfico + rótulo fixo em caixa-alta.
- **Geração de Valor / Flávio Augusto (5M):** talking-head cru + legenda bold.
- **Padrão vencedor do nicho:** fundo escuro, dourado = autoridade, foto real cinematográfica, tipografia bold, sistema fixo de rótulo, ar de "dossiê".
- **Lacuna estratégica:** o nicho é quase todo PRETO → território claro/editorial está livre (base do modelo DIVISÃO).

## ENTREGÁVEL
Relatório em **markdown** (chat ou arquivo `.md` via present_files se o usuário quiser guardar). Direto, sem encher linguiça. Se a análise embasar criação de conteúdo, oferecer ao final: "Quero transformar isso em post/carrossel/reels no modelo DIVISÃO?"

## REGRAS
- Só relate o que observou; marque suposições.
- Foque no que é **acionável** para empresário/dono de posto, salvo se o usuário pedir outro ângulo.
- Não copie a arte de ninguém — extraia princípios, não pixels.

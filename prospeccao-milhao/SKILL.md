---
name: prospeccao-milhao
description: Regras de conduta e correções do sistema de prospecção via Instagram DM "Prospecção do Milhão" (projeto buscandomilhao, rodando no Mac mini do Ramsés). Use SEMPRE que o usuário disser "prospecção do milhão", "buscando milhão", "ajustar a prospecção", "o lead não respondeu", "arruma o follow-up da DM", mandar print de uma DM de prospecção do Instagram, ou pedir revisão das mensagens automáticas enviadas a donos de posto. Cobre: o que conta como resposta do lead, follow-up de quem visualizou e não respondeu, interação sem resposta (reação, story, share), guard-rails de redação e os ajustes técnicos a aplicar no código do buscandomilhao.
---

# Skill: prospeccao-milhao — Regras do sistema de prospecção via Instagram

O sistema (baseado no PROMPT.md do repositório público `soumatheusgomes/buscandomilhao`)
roda localmente no Mac mini do Ramsés: descobre donos de posto no Instagram, envia a
1ª DM pelo Chrome real, recebe respostas pelo webhook da Meta e conversa pela API
oficial. Esta skill registra as regras de conduta das mensagens e as correções
obrigatórias — nasceu de um erro real em produção.

## O CASO QUE ORIGINOU ESTA SKILL (2026-09-04, lead @robertojamesrj)

1. Terça 12:24 — 1ª DM enviada pelo navegador (abertura personalizada para dono de posto). ✅
2. O lead **visualizou** ("Seen Tuesday") e **não respondeu nada**.
3. A thread tinha interações antigas do lead (shares/posts de abril, exibidos como
   "Message unavailable" / "Post unavailable") anteriores à 1ª DM.
4. Mesmo sem resposta, o sistema enviou às 11:49: *"Oi! Que legal saber da novidade!
   Agora, só pra entender melhor: você é dono(a) de um posto de combustível?"* ❌

Três erros na mesma mensagem:
- **Pressupôs uma fala que não existe** ("que legal saber da novidade" responde a algo
  que o lead nunca disse). Uma interação antiga ou um evento de visualização/reação
  foi classificado como resposta nova.
- **Refez a qualificação que a abertura já assumiu** (a 1ª DM já tratava o lead como
  dono de posto; perguntar "você é dono(a) de um posto?" na sequência queima a
  personalização).
- **"dono(a)" genérico** entrega que é automação. A redação nunca usa flexão
  parentética; escreve como o Ramsés escreveria no celular.

## REGRA 1 — O que conta como RESPOSTA do lead

Só transiciona `contacted → replied` (e só libera o motor de conversa) um evento
inbound que satisfaça **todas** as condições:

- `timestamp` **posterior** ao envio da 1ª DM (`browser_contact_sent_at`);
- tipo `message` com conteúdo de conversa real: texto, áudio, ou anexo enviado
  ativamente pelo lead **dentro da DM**;
- autor = o lead (nunca echo de mensagem própria).

**NUNCA contam como resposta** (não mudam o pipeline, não geram mensagem do motor):
- confirmação de leitura / "Seen";
- reação ou like em mensagem;
- mensagens, shares, story replies ou posts **anteriores** à 1ª DM (histórico antigo
  da thread, incluindo itens "unavailable"/apagados);
- visualização de story, follow, ou qualquer interação fora da DM.

## REGRA 2 — Interação sem resposta é estado próprio

Visualizou, reagiu ou interagiu sem escrever → estado `engaged_no_reply`
(interagiu, não respondeu). O canal continua `waiting_inbound_reply`. Esse sinal
serve só para **priorizar/antecipar o follow-up de não-resposta** — nunca para
disparar o fluxo de resposta.

## REGRA 3 — Follow-up de quem não respondeu

A mensagem de follow-up para quem não respondeu:
- **nunca pressupõe fala do lead** (proibido "que legal", "obrigado pela resposta",
  "sobre o que você falou");
- referencia a 1ª mensagem com leveza e **agrega valor novo** (um dado concreto,
  uma observação específica do posto/perfil dele), em vez de cobrar resposta;
- CTA leve, uma pergunta só;
- máximo de 2 follow-ups; sem resposta, encerra com classe e agenda re-abordagem
  distante (30+ dias), salvo opt-out.

Exemplo de tom (adaptar ao perfil, nunca colar literal):
> "Roberto, vi que tu respira posto — te mandei aquela mensagem porque trabalho
> exatamente com margem de pista. Um dado rápido: [dado verificado]. Se fizer
> sentido, te conto em 2 minutos como aplico isso."

## REGRA 4 — Guard-rails de redação (todas as mensagens)

Antes de enviar qualquer mensagem gerada, validar:
1. Existe inbound novo que justifique o template de "resposta"? Se não, usar o
   template de follow-up.
2. A mensagem **não afirma nem agradece nada que o lead não disse** (checar contra o
   histórico real da conversa).
3. Não repete qualificação já assumida pela abertura; se precisar confirmar que é o
   dono/decisor, formular de forma natural ("o posto é teu ou tu toca a operação?").
4. Sem "dono(a)", "amigo(a)", flexão parentética ou texto com cara de campanha.
5. Só afirmações de `VERIFIED_CLAIMS`.

## AJUSTES TÉCNICOS NO buscandomilhao (aplicar no Mac mini)

No repositório local (`soumatheusgomes/buscandomilhao` com a implementação):

1. **Webhook (`src/integrations/instagram`)** — filtrar eventos antes de casar com o
   lead: descartar `read`/`seen`, `reaction`, `message_echo` e qualquer mensagem com
   `timestamp <= browser_contact_sent_at`. Registrar o evento descartado na timeline
   do lead como interação (para a Regra 2), sem transição de pipeline.
2. **Transição de estado (`src/features/conversations`)** — guard na transição
   `contacted → replied`: exigir mensagem inbound nova e válida (Regra 1). Interação
   sem resposta seta `engaged_no_reply`.
3. **Motor de conversação (`src/integrations/openai`)** — o prompt de resposta só é
   usado quando há inbound novo no contexto; caso contrário, prompt de follow-up
   (Regra 3). Adicionar validação pós-geração: a mensagem não pode referenciar fala
   inexistente do lead (Regra 4.2).
4. **Testes** — casos novos: (a) evento de leitura/reação chega pelo webhook → estado
   permanece `waiting_inbound_reply`, nenhuma mensagem sai; (b) mensagem antiga
   (timestamp anterior à 1ª DM) → não conta como resposta; (c) inbound novo de texto
   → transição correta para `replied` e handoff pra API.
5. **Auditoria** — logar no CRM qual evento disparou cada mensagem enviada
   (`triggered_by_event_id`), para todo envio ser explicável.

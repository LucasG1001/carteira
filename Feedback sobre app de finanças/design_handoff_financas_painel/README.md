# Handoff: Painel de Finanças Pessoais — redesign (Nocturne)

## Overview

Redesenho da tela principal de um app de controle de gastos pessoais e de uma nova tela
de compromissos futuros. O app original mostrava apenas o total gasto no mês e um donut de
duas categorias; o usuário relatou que era "bonito mas não sei o que fazer com a informação".

O redesenho responde quatro perguntas concretas:

1. Estou dentro ou fora da meta deste mês?
2. Quanto disso foi escolha minha e quanto já estava travado em parcelas?
3. Para onde o dinheiro está indo (por subcategoria, descrição ou origem)?
4. Quanto do meu futuro já está comprometido em parcelas?

Não existe conceito de renda no produto (o app só conhece gastos). Toda a análise é feita
contra uma **meta mensal de gasto** (`META = 583.33`), não contra receita. Não introduza renda.

## About the Design Files

Os arquivos em `design/` são **referências de design feitas em HTML** — protótipos que
mostram aparência e comportamento pretendidos, **não** código de produção para copiar.

A tarefa é **recriar este design no codebase existente**, usando os padrões, a biblioteca de
componentes e o gerenciamento de estado que o projeto já adota (React, Vue, Svelte, etc.).
Não porte o HTML nem o runtime do protótipo. Em particular:

- `design/Financas.dc.html` usa um runtime de prototipagem próprio (`<x-dc>`, `<sc-for>`,
  `<sc-if>`, `{{ holes }}`, classe `Component extends DCLogic` com `renderVals()`) e
  `design/support.js`. **Nada disso deve ir para produção.** Leia-o como especificação:
  `<sc-for list="{{ x }}">` é um `map`, `<sc-if value="{{ y }}">` é uma renderização
  condicional, e `renderVals()` é o corpo de cálculo do componente.
- Todos os estilos estão inline no protótipo por exigência da ferramenta de prototipagem.
  No codebase, use a convenção local (CSS Modules, Tailwind, styled-components, etc.).
- Os dados são mockados dentro de `renderVals()`. Substitua pela fonte de dados real
  mantendo a **forma** descrita em "Modelo de dados".

## Fidelity

**High-fidelity.** Cores, tipografia, espaçamentos, raios, sombras e todas as interações
são finais. Recrie fielmente. Os valores exatos estão em "Design Tokens"; onde o protótipo
usa `var(--token)`, use o token equivalente do codebase (ou adote a folha em
`design/nocturne-styles.css`).

O design system é o **Nocturne** (dark, azul-acinzentado, acento blurple `#9184d9`,
Inter, raios de 8px, densidade 0.7×). O guia completo está em `design/nocturne-readme.md`
e a folha de tokens em `design/nocturne-styles.css`. Regras que importam aqui:

- Ações primárias são **outline** (borda de acento sobre transparente), nunca preenchidas.
- O acento aparece como linha, marca e brilho — **nunca** como preenchimento de área grande.
- Contraste vem das rampas tonais, não de saturação. Nada de preto ou branco puros.
- Foco de teclado: `outline: 2px solid var(--color-accent); outline-offset: 2px`.
- Ícones: **Phosphor** (`@phosphor-icons/web`, peso regular).

## Layout global

- Fundo `--color-bg`; texto `--color-text`; fonte base `--font-body` a **14px**.
- Contêiner central: `max-width: 1320px; margin: 0 auto; padding: 28px 32px`.
- Empilhamento vertical dos blocos: `display: flex; flex-direction: column; gap: 28px`.
- Desktop-first (o usuário usa desktop). Sem breakpoints mobile definidos neste handoff.
- Cada card: fundo `--color-surface`, `border-radius: var(--radius-lg)` (14px),
  `box-shadow: var(--shadow-sm)`, padding `24px 26px`.
- Kicker de card (título pequeno): `font-size: 11px; letter-spacing: 0.09em;
  text-transform: uppercase; color: var(--color-neutral-500)`.
- Todos os números monetários usam `font-variant-numeric: tabular-nums` e formato pt-BR
  (`R$ 1.402,10` — ponto de milhar, vírgula decimal, 2 casas fixas).

### Header (sticky)

`position: sticky; top: 0; z-index: 20`, fundo
`color-mix(in srgb, var(--color-bg) 92%, transparent)` com `backdrop-filter: blur(12px)`
e `border-bottom: 1px solid var(--color-neutral-900)`. Interior: `padding: 14px 32px`,
flex, `gap: 28px`, mesmo `max-width: 1320px`.

Da esquerda para a direita:

1. **Abas** "Painel" e "Futuro" (`gap: 4px`). Cada aba é um botão:
   `font-size: 13px; padding: 7px 14px; border-radius: var(--radius-md)`.
   - Ativa: borda `color-mix(in srgb, var(--color-accent) 45%, transparent)`,
     fundo `color-mix(in srgb, var(--color-accent) 14%, transparent)`,
     texto `--color-accent-200`.
   - Inativa: borda e fundo transparentes, texto `--color-neutral-400`.
2. Espaçador flexível.
3. **Seletor de mês** (`gap: 8px`): botão `‹` (`ph-caret-left`), bloco central
   (`min-width: 132px; text-align: center`) com o mês em 13px `--color-text` e um
   subtítulo em 11px `--color-neutral-500`, botão `›` (`ph-caret-right`).
   Setas: 28×28px, `border-radius: var(--radius-md)`, borda `--color-neutral-800`,
   fundo transparente, ícone 14px `--color-neutral-300`; desabilitada → `opacity: 0.45`
   e `cursor: default`. Quando o mês exibido não é o atual, aparece um botão ghost "hoje".
4. **`+ Lançar`** — botão primário (outline de acento), `font-size: 13px; padding: 8px 16px`.

Subtítulo do mês: `dia 11 de 31` no mês atual, `fechado · N dias` no passado,
`projetado · N dias` no futuro. Limites de navegação: `-2` (jun/2026) a `+6` (fev/2027).

---

## Screens / Views

### 1. Painel (aba default)

#### 1.1 Card "O mês até aqui" — primário

Grid superior de duas colunas: `grid-template-columns: 1.45fr 1fr; gap: 20px`.
Este card ocupa a coluna larga; padding `24px 26px 22px`, `gap: 18px`.

Conteúdo, de cima para baixo:

- Linha de topo: kicker à esquerda (o texto muda com o mês: "O mês até aqui" /
  "Mês fechado" / "Já travado neste mês"); à direita, `meta R$ 583,33` em 12px
  `--color-neutral-500`.
- **Total do mês**: 44px, weight 600, `letter-spacing: -0.02em; line-height: 1`.
  Ao lado, alinhado pela base, o delta em 13px: `+R$ 356,37 acima da meta` em
  `var(--color-warn)`, ou `R$ X abaixo da meta` em `--color-accent-300`.
- **Barra de meta**: trilha 10px, `border-radius: 6px`, fundo `--color-neutral-900`,
  `overflow: visible`. Preenchimento com gradiente
  `linear-gradient(90deg, var(--color-accent-700), var(--color-accent-500))`, largura
  `min(100%, total / max(total, meta) × 100%)`. Marca vertical de 2px em
  `left: meta / max(total, meta) × 100%`, estendendo 5px acima e abaixo da trilha
  (`top: -5px; bottom: -5px`), cor `--color-warn` quando estourou, `--color-neutral-500`
  quando não.
- Abaixo da barra, alinhado à direita, 12px: `61% acima do planejado` (ou
  `X% abaixo do planejado`), na cor de alerta ou neutra conforme o caso.
  Cálculo: `(total − meta) / meta × 100`, arredondado.
- Divisor: `height: 1px; background: var(--color-neutral-900)`.
- **Comparações**, grid de 2 colunas, `gap: 24px`. Cada item: rótulo 12px
  `--color-neutral-500`; abaixo, na **mesma linha** (flex, `align-items: baseline`,
  `gap: 8px`, `flex-wrap: wrap`), o valor em 19px weight 600 `white-space: nowrap` e a
  variação em 12px.
  - Item 1: mês anterior — nome do mês capitalizado, seu total, e `↓ 33%` / `↑ N%`
    comparando o mês atual com ele. Sem histórico disponível → valor `—`,
    texto "sem histórico".
  - Item 2: `Média dos 12 meses` — `R$ 874,62` e a variação do mês atual contra ela.
  - Cor da variação: `--color-accent-300` quando o mês gastou **menos ou igual**
    (bom), `--color-warn` quando gastou mais.

#### 1.2 Card "Fixo x variável · <mês>" — coluna estreita

- Kicker com o nome do mês.
- **Barra de proporção**: `display: flex; height: 12px; border-radius: 6px;
  overflow: hidden; gap: 2px`. Segmento fixo `--color-neutral-700`, segmento variável
  `--color-accent-500`, larguras em % do total do mês.
- Duas entradas (`gap: 14px`), cada uma com: quadrado de 8×8px `border-radius: 2px` na
  cor do segmento; nome em 13px; valor em 15px weight 600 alinhado à direita; e, abaixo,
  nota em 12px `--color-neutral-500`:
  - `Fixo / parcelado` → `84% do mês · 3 compromissos ativos`
  - `Variável` → `16% do mês · 1 lançamento seu`
- Divisor de 1px.
- Duas linhas de média (label `--color-neutral-400` à esquerda, valor à direita):
  `Média fixa · 12 meses` = R$ 548,10 e `Média variável · 12 meses` = R$ 326,52.

#### 1.3 Card "Para onde o dinheiro vai" — com agrupamento selecionável

Segundo grid de duas colunas: `grid-template-columns: 1fr 1fr; gap: 20px`. Este card fica
na primeira coluna; `display: flex; flex-direction: column; gap: 18px`.

- Cabeçalho: kicker à esquerda e, à direita, um **select** (`class="input"`,
  `font-size: 12px; padding: 6px 30px 6px 10px`) com três opções:
  `por subcategoria` (default), `por descrição`, `por origem`.
- Subtítulo em 13px `--color-neutral-400`:
  `agosto · R$ 939,70 em 4 lançamentos · toque para filtrar a lista`.
- Lista de grupos (`gap: 16px`), **ordenada por valor decrescente**. Cada grupo é
  clicável (`cursor: pointer`) e contém:
  - linha com o nome à esquerda; à direita, `%` do mês em `--color-neutral-400` e o valor
    em weight 500 (`gap: 12px`, `flex-shrink: 0`);
  - barra de 6px, trilha `--color-neutral-900`, preenchimento proporcional ao **maior**
    grupo (`valor / maxGrupo × 100%`) — o primeiro grupo usa `--color-accent-500`, os
    demais `--color-accent-700`;
  - nota em 12px `--color-neutral-500`: contagem de lançamentos + sufixo
    `· tudo travado` (todos fixos), `· escolha sua` (nenhum fixo) ou `· N travado` (misto).
- Estado vazio: `Nenhum gasto neste mês.`
- **Clicar num grupo filtra a tabela de lançamentos** (ver 1.5): agrupado por origem →
  marca aquela origem no filtro de Origem; por subcategoria → marca a subcategoria; por
  descrição → preenche a busca com o texto. Em todos os casos, os outros filtros são limpos.

#### 1.4 Card "Ritmo mês a mês" — coluna estreita

- Cabeçalho com kicker e legenda (`gap: 16px`, 12px `--color-neutral-500`): quadrado
  `--color-accent-500` = "realizado", quadrado `--color-neutral-700` = "travado".
- Gráfico de 7 colunas: `display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px;
  align-items: end; min-height: 180px; position: relative`.
- Linha de meta: `position: absolute; left/right: 0; bottom: 46px;
  border-top: 1px dashed var(--color-neutral-700)`.
- Cada coluna, de baixo para cima: rótulo do mês (11px `--color-neutral-500`), barra, e o
  valor arredondado acima dela (11px `--color-neutral-400`). Barra: largura 100%,
  `border-radius: 3px 3px 0 0`, altura `valor / 1402.10 × 150px`. Meses realizados usam
  `linear-gradient(180deg, var(--color-accent-500), var(--color-accent-700))`; meses
  futuros (só travado) `--color-neutral-800`. O mês selecionado recebe
  `outline: 1px solid var(--color-accent-400); outline-offset: 2px`.
- Rodapé: `linha tracejada = meta de R$ 583,33/mês` (12px `--color-neutral-500`).
- Série: jun 661,96 · jul 1.402,10 · ago 939,70 · set 789,70 · out 789,70 · nov 364,72 ·
  dez 364,72 (os três primeiros realizados).

#### 1.5 Card "Lançamentos" — tabela com busca, filtros e edição

Card **sem** `overflow: hidden` (o painel de filtros é `position: absolute` dentro dele e
seria cortado; as linhas da tabela não têm fundo próprio, então os cantos arredondados do
card continuam corretos).

**Toolbar** (`padding: 18px 26px; gap: 14px; flex-wrap: wrap;
border-bottom: 1px solid var(--color-neutral-900)`):

1. Kicker "Lançamentos".
2. **Busca**: `class="input"`, `flex: 1; min-width: 180px; max-width: 280px;
   font-size: 13px; padding: 7px 12px`, placeholder `Buscar descrição…`.
   Filtra por descrição **ou** subcategoria, case-insensitive.
3. **Botão "Filtros"** dentro de um wrapper `position: relative`:
   ícone `ph-funnel` 15px + rótulo, `padding: 7px 13px;
   border-radius: var(--radius-md)`. Sem filtro: borda `--color-neutral-800`, fundo
   transparente, texto `--color-neutral-200`. Com filtro: borda `--color-accent-600`,
   fundo `--color-accent-900`, texto `--color-accent-200`, mais um **badge** com a
   contagem (`min-width: 17px; height: 17px; padding: 0 5px; border-radius: 999px;
   background: var(--color-accent-600); color: var(--color-accent-100); font-size: 11px`).
4. Espaçador flexível.
5. **Resumo** à direita, 13px `--color-neutral-400`: `4 lançamentos · R$ 939,70`
   (singular quando 1), refletindo os filtros ativos.

**Painel de filtros** (abre ao clicar em "Filtros"):
`position: absolute; top: calc(100% + 8px); left: 0; z-index: 30; width: max-content;
max-width: 520px`, fundo `--color-surface`, borda `1px solid var(--color-neutral-800)`,
`border-radius: var(--radius-lg)`, `box-shadow: var(--shadow-lg)`,
`padding: 18px 20px 20px; gap: 18px`.

- Topo: botão de texto **"Limpar tudo"** à esquerda (13px; `--color-accent-300` quando há
  filtro, `--color-neutral-500` quando não) e um botão ghost com `ph-x` à direita.
- Três grupos, cada um com kicker e uma grade `repeat(3, 1fr)` com `gap: 10px`:
  - **Tipo** — opções fixas: `Fixo / parcelado`, `Variável`.
  - **Origem** — derivada dos lançamentos do mês (ex.: `Débito`, `Cartão`).
  - **Subcategoria** — derivada dos lançamentos do mês.
- Cada opção é um botão-checkbox: `display: flex; align-items: center; gap: 9px;
  padding: 9px 12px; border-radius: var(--radius-md); font-size: 13px; text-align: left`.
  Marcado → borda `--color-accent-600`, fundo `--color-accent-900`, texto
  `--color-accent-200`; desmarcado → borda `--color-neutral-800`, fundo transparente,
  texto `--color-neutral-200`. A caixinha tem 14×14px, `border-radius: 3px`; marcada
  recebe fundo `--color-accent-600`, borda `--color-accent-500` e o ícone `ph-check`
  a 9px em `--color-accent-100`. O rótulo trunca com ellipsis.
- **Seleção múltipla** dentro de cada grupo; grupos se combinam por **E**. Grupo vazio
  não restringe nada.

**Tabela** (`class="table"`, `width: 100%; border-collapse: collapse`):

- Cabeçalho: 11px, `letter-spacing: 0.07em`, uppercase, `--color-neutral-500`,
  weight 500. Colunas: Descrição · Data · Subcategoria · Origem · Parcela · Valor
  (alinhado à direita) · coluna de ações sem rótulo.
- Linhas: `border-top: 1px solid var(--color-neutral-900)`, células `padding: 14px 12px`
  (26px nas extremidades).
- Célula Descrição: nome em weight 500 + **tag** a 10px de distância
  (`font-size: 11px; padding: 2px 8px; border-radius: 999px`):
  `travado` → fundo `--color-neutral-900`, texto `--color-neutral-400`;
  `escolha sua` → fundo `--color-accent-900`, texto `--color-accent-300`.
- Ações: botões ghost 12px `editar` e `excluir` (este em `--color-warn`), `nowrap`.
- Estado vazio: `<td colspan="7">` com `Nenhum lançamento com esse filtro.`
  centralizado, `padding: 32px 26px`, 13px `--color-neutral-500`.

### 2. Futuro (segunda aba)

- Cabeçalho da tela: título em 26px weight 500 `letter-spacing: -0.02em`
  (`Você já gastou R$ 2.348,64 do seu futuro`) e subtítulo 14px `--color-neutral-400`.
  À direita, botão secundário `Simular uma compra` (abre o mesmo drawer de lançamento).
- **Card de compromissos** (`padding: 26px`, `gap: 22px`): para cada parcelamento —
  nome em 15px weight 500 + descritor em 12px `--color-neutral-500`; à direita
  `restam R$ X em Nx de R$ Y`; abaixo, uma **grade de 9 células**
  (`repeat(9, 1fr); gap: 5px`, células de 26px, `border-radius: 3px`): pagas
  `--color-neutral-800`, futuras `--color-accent-600`, além do total transparentes;
  e uma linha de rodapé com mês inicial e final em 12px.
  Dados: Azul Seguros 3/7 · R$ 344,82 (jun/26–dez/26); Revisão 2/4 · R$ 424,98
  (jul/26–out/26); Investidor10 3/9 · R$ 19,90 (jun/26–fev/27).
- **Três cards de resumo** (`repeat(3, 1fr); gap: 20px`, padding `22px 24px`): kicker,
  valor em 26px weight 600, e uma frase em 13px `--color-neutral-400`.
  - `Mês mais pesado` → set/26 · R$ 789,70 travados, 135% da meta.
  - `Primeiro mês livre` → mar/27.
  - `Se parar de parcelar hoje` → R$ 391,44/mês.
- A aba Painel tem um link `ver detalhe →` no card de meses futuros que navega para cá.

Card "O que já está travado nos próximos meses" (na aba Painel): grade
`repeat(6, 1fr); gap: 14px; align-items: end`, uma coluna por mês com valor em 18px
weight 600, barra de 6px (`valor / meta`, `--color-warn-strong` quando acima da meta,
`--color-accent-600` quando abaixo) e rodapé com mês e `%` da meta. Abaixo, divisor e
`Total já comprometido R$ 2.348,64` + a leitura em 13px.

### 3. Drawer "Novo lançamento"

Aberto por `+ Lançar`, por `Simular uma compra` ou por `editar` numa linha da tabela.

- Backdrop: `position: fixed; inset: 0; z-index: 40`,
  `background: color-mix(in srgb, var(--color-bg) 66%, transparent)`,
  conteúdo alinhado à direita. Clicar no backdrop fecha; clique interno não propaga.
- Painel: 420px de largura, altura total, fundo `--color-surface`,
  `box-shadow: var(--shadow-lg)`, `padding: 28px`, `gap: 22px`, `overflow-y: auto`.
- Topo: título 16px weight 500 + botão ghost `ph-x`.
- **Atalhos** ("Repetir um gasto seu"): chips com `font-size: 12px; padding: 6px 12px;
  border-radius: 999px`; selecionado → borda `--color-accent-600`, fundo
  `--color-accent-900`, texto `--color-accent-200`. Opções: Gasolina R$ 150,
  Mercado R$ 240, Almoço R$ 38, Farmácia R$ 62, Uber R$ 24. Selecionar preenche
  descrição, valor e `1x`.
- Divisor de 1px.
- Campos (`class="field"` + `class="input"`, labels 12px `--color-neutral-400`):
  Descrição em linha cheia; Valor e Parcelas numa grade de 2 colunas (`gap: 12px`).
- **Bloco "Impacto"**: fundo `--color-bg`, `border-radius: var(--radius-md)`,
  `padding: 18px`, kicker + frase em 14px `--color-neutral-200`, recalculada ao digitar:
  - valor 0 → "Escolha um valor para ver o que isso faz com a sua meta dos próximos meses."
  - parcelado → quanto trava por mês e como isso muda o mês seguinte.
  - à vista → como o mês atual fecharia e o % da meta.
- Rodapé: botão primário `btn-block` "Salvar lançamento".

---

## Interactions & Behavior

| Ação | Resultado |
| --- | --- |
| Aba Painel / Futuro | Alterna a view; sem transição |
| Seta ‹ / › | `monthOffset ± 1`, limitado a `[-2, +6]`; **todos** os cards recalculam |
| Botão "hoje" | `monthOffset = 0`; só visível fora do mês atual |
| Select de agrupamento | Reagrupa "Para onde o dinheiro vai" (subcategoria / descrição / origem) |
| Clique num grupo | Aplica o filtro correspondente na tabela e limpa os outros |
| Digitar na busca | Filtra por descrição ou subcategoria, ao vivo |
| Botão "Filtros" | Abre/fecha o painel; badge mostra a contagem de filtros ativos |
| Checkbox de filtro | Alterna aquele valor no seu grupo (múltipla escolha) |
| "Limpar tudo" | Zera os três grupos **e** a busca |
| `editar` | Abre o drawer preenchido com aquele lançamento |
| `excluir` | Remove a linha (por id) e recalcula todos os totais do mês |
| `+ Lançar` / `Simular uma compra` | Abre o drawer vazio |
| Backdrop / `ph-x` | Fecha o drawer |

**Estados obrigatórios**: hover tintado em todo elemento interativo; estado pressionado um
passo além da base do acento (`--color-accent-400` neste fundo escuro);
`:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px }`;
desabilitado a 45% de opacidade. Sem defaults do browser.

Excluir é imediato, sem confirmação nem undo no protótipo — **decida com o usuário** se
produção precisa de confirmação. "Salvar lançamento" apenas fecha o drawer no protótipo;
implemente a persistência real.

## State Management

Estado local do componente no protótipo:

| Chave | Tipo | Default | Papel |
| --- | --- | --- | --- |
| `tab` | `'painel' \| 'futuro'` | `'painel'` | Aba ativa |
| `monthOffset` | número | `0` | Mês exibido, relativo a ago/2026; faixa `[-2, +6]` |
| `groupBy` | `'sub' \| 'desc' \| 'origem'` | `'sub'` | Agrupamento do breakdown |
| `query` | string | `''` | Busca da tabela |
| `fTipo` | string[] | `[]` | Filtro de tipo (vazio = sem restrição) |
| `fOrigem` | string[] | `[]` | Filtro de origem |
| `fSub` | string[] | `[]` | Filtro de subcategoria |
| `filtersOpen` | booleano | `false` | Painel de filtros aberto |
| `removed` | string[] | `[]` | Ids excluídos |
| `addOpen` | booleano | `false` | Drawer aberto |
| `desc`, `valor`, `parcelas` | string | `''` | Rascunho do lançamento |
| `quickIdx` | número | `-1` | Atalho selecionado |

Tudo o mais é **derivado** — nada disso deve virar estado: total do mês, fixo, variável,
por origem, breakdown agrupado, comparações, projeções, série do gráfico e contagem de
filtros. Em produção, o mês, o agrupamento e os filtros são bons candidatos a viver na URL
(query params) para que a view seja compartilhável.

## Modelo de dados

O protótipo deriva os lançamentos de um mês a partir de duas fontes; espelhe a **forma**:

```
Lançamento {
  id: string
  desc: string          // "Gasolina"
  sub: string           // subcategoria: "Transporte"
  origem: string        // "Cartão" | "Débito" | "Dinheiro"
  v: number             // valor da parcela do mês, não o total da compra
  fixo: boolean         // true = parcela/recorrência travada
  data: string          // "11/08" (à vista) ou data da compra (parcelado)
  parcela: string       // "à vista" | "2 de 4"
}
```

Compromissos parcelados (`fixo: true`) são gerados por mês a partir de: valor da parcela,
mês da primeira parcela e número total de parcelas — a parcela aparece em todo mês dentro
da janela `[início, início + n)`, com o rótulo `(mês − início + 1) de n`. Gastos à vista
(`fixo: false`) pertencem apenas ao seu próprio mês.

Constantes: `META = 583.33` (meta mensal), média 12 meses `874.62`, média fixa `548.10`,
média variável `326.52`, teto do gráfico `1402.10`. Elas são mock — ligue às reais.

## Design Tokens

Fonte da verdade: `design/nocturne-styles.css`.

**Cores**

| Token | Hex | Uso aqui |
| --- | --- | --- |
| `--color-bg` | `#161826` | Fundo da página, fundo do bloco "Impacto" |
| `--color-surface` | `#232532` | Todos os cards, drawer, painel de filtros |
| `--color-text` | `#e9e9ed` | Texto padrão |
| `--color-accent` | `#9184d9` | Base do acento, anel de foco |
| `--color-accent-100` | `#f5f4ff` | Ícone/texto sobre fundo de acento |
| `--color-accent-200` | `#e7e5fe` | Texto de chip/aba/filtro ativo |
| `--color-accent-300` | `#d2cefd` | Links, delta positivo |
| `--color-accent-400` | `#b5abfc` | Outline do mês selecionado, estado pressionado |
| `--color-accent-500` | `#968ae0` | Maior grupo, segmento variável, fim do gradiente |
| `--color-accent-600` | `#796cbf` | Barras futuras, borda ativa, badge, caixinha marcada |
| `--color-accent-700` | `#5d5294` | Demais grupos, início do gradiente |
| `--color-accent-900` | `#2b2741` | Fundos tintados (tag, chip, filtro ativo) |
| `--color-neutral-200` | `#e4e7f5` | Texto do bloco "Impacto", labels de filtro |
| `--color-neutral-300` | `#cfd3e5` | Ícones das setas de mês, chips inativos |
| `--color-neutral-400` | `#b2b6ca` | Labels secundários, resumo da tabela, células |
| `--color-neutral-500` | `#9397ab` | Kickers, notas, rodapés |
| `--color-neutral-700` | `#595d6c` | Segmento fixo, linha tracejada da meta |
| `--color-neutral-800` | `#3f424d` | Bordas, células pagas, barras futuras |
| `--color-neutral-900` | `#292b31` | Trilhas de barra, divisores, bordas de linha |

**Cores locais** (não fazem parte do Nocturne — declaradas no `:root` do protótipo porque
o sistema é mono e não tem papel de alerta; se o codebase já tiver um token de erro/alerta,
use o dele):

```css
--color-warn:        oklch(0.68 0.13 12);  /* delta negativo, excluir, acima da meta */
--color-warn-strong: oklch(0.60 0.14 12);  /* barra de mês futuro acima da meta */
```

**Tipografia** — Inter (`--font-heading` / `--font-body`), pesos 400/500/600.
Escala usada: 11px (kicker, rótulo de barra, badge) · 12px (notas, deltas, select) ·
13px (corpo denso, tabela, chips) · 14px (base, texto do impacto) · 15px (nome de
compromisso) · 18–19px (valor de mês futuro, comparações) · 24–26px (títulos de tela e
cards de resumo) · 34px (valor secundário) · 44px (total do mês).
`letter-spacing: -0.02em` nos números grandes; `0.07–0.09em` + uppercase nos kickers.

**Espaçamento** — o protótipo usa px diretos: `gap` 4/6/8/10/12/14/16/18/20/24/28,
padding de card `24px 26px`, toolbar `18px 26px`, células `14px 12px` (26px nas pontas).
A escala do sistema é `--space-1: 2.8px` · `2: 5.6` · `3: 8.4` · `4: 11.2` · `6: 16.8` ·
`8: 22.4` (densidade 0.7×) — mapeie para a escala do codebase.

**Raios** — `--radius-sm: 4px` · `--radius-md: 8px` (botões, campos, células de filtro) ·
`--radius-lg: 14px` (cards, drawer, painel). Pílulas: `999px`. Barras: 4–6px.

**Sombras** — `--shadow-sm: 0 0 0 1px #3f424d` (cards) ·
`--shadow-lg: 0 0 0 1px #9397ab, 0 16px 40px rgba(0,0,0,0.65)` (drawer, painel de filtros).
Não empilhe sombras: no fundo escuro, elevação é borda + escurecimento ambiente.

## Screenshots

Em `screenshots/` (capturadas a ~914px de largura, então o grid de duas colunas aparece
mais estreito do que no alvo de 1320px — trate as **medidas do README** como fonte da
verdade, não os pixels da imagem):

- `01-painel.png` — topo da aba Painel: header, "O mês até aqui", "Fixo x variável".
- `02-filtros-abertos.png` — card Lançamentos com o painel de filtros aberto
  (Tipo / Origem / Subcategoria, "Limpar tudo" e ×).
- `03-futuro.png` — aba Futuro: título, "Simular uma compra" e a grade de parcelas
  dos três compromissos.
- `04-drawer-lancamento.png` — drawer "Novo lançamento" com atalhos, campos e o
  bloco "Impacto".

## Assets

- **Fonte**: Inter, pesos 400/500/600 (Google Fonts no protótipo — use o self-host do
  codebase se existir).
- **Ícones**: Phosphor regular (`@phosphor-icons/web@2.1.1`). Usados: `ph-funnel`,
  `ph-x`, `ph-check`, `ph-caret-left`, `ph-caret-right`.
- Sem imagens, ilustrações ou logotipos.

## Files

Em `design/`:

- `Financas.dc.html` — o protótipo completo (template + lógica). Referência de layout,
  cálculo e interação. **Não** é código de produção.
- `nocturne-styles.css` — a folha de tokens e componentes do Nocturne (fonte da verdade
  para cores, tipografia, espaçamento, raios, sombras, `.btn`, `.card`, `.input`,
  `.field`, `.table`).
- `nocturne-readme.md` — o guia do design system (direção, do's & don'ts).
- `support.js` — runtime da ferramenta de prototipagem. Incluído apenas para o HTML abrir
  no navegador. **Ignore-o completamente na implementação.**

Para ver o design: abra `design/Financas.dc.html` num navegador. Os caminhos do CSS do
Nocturne dentro do arquivo apontam para `_ds/nocturne-.../styles.css`; ajuste para
`./nocturne-styles.css` se for abrir o arquivo isolado.

## Fora de escopo / decisões pendentes

Levantado durante o design e **não** implementado — confirme com o usuário antes de agir:

- Não há renda no produto. Toda análise é contra a meta de gasto.
- Se `META = 583.33` é escolha do usuário ou cálculo do app segue indefinido.
- Sem versão mobile (o usuário trabalha em desktop).
- Sem orçamento por categoria, sem lista de vencimentos, sem insights automáticos —
  recomendados, porém não desenhados.
- Excluir não tem confirmação nem undo.

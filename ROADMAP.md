### Investimentos

- **Agenda de Proventos** — aba com histórico de proventos recebidos (cards 12m, barra mensal, donut por ativo, tabela com filtro mês/ano). Endpoint `GET /portfolio/dividends`.
- **Evolução do Patrimônio** — na Carteira, gráfico de barras com o **aporte acumulado** (compras − vendas) mês a mês. Endpoint `GET /portfolio/evolution`. _(sem cotação histórica; ver observação abaixo)_
- **Cadastro manual melhorado** — combobox de ticker (busca nos já cadastrados), preço unitário e "Outros custos" (taxas) com máscara de moeda (taxas entram no preço médio), e "Valor total" automático.
- **Aba Lançamentos** — lista todas as transações com filtro **Todos/B3/Manual** e filtro mês/ano (default ano atual); manuais editáveis/excluíveis (B3 só leitura). Endpoints `GET/PUT/DELETE /portfolio/transactions`.
- **Merge da B3 na importação** — ao importar, substitui as transações existentes dos **tickers do arquivo** dentro do intervalo de datas (reimportar não duplica; B3 sobrepõe manual; manuais-só como cripto ficam protegidos).
- **Declaração de Imposto de Renda** — aba que monta a declaração por ativo (ficha/grupo/código, custo, discriminação pronta), marca "declarado" (persistido), e exporta CSV.
- **Donut com filtro** — Alocação por Tipo com dropdown que detalha os tickers de um tipo.

### Gastos

- **Filtros de período no header** — `MonthYearPicker` (navegação de ano + meses + "Ano inteiro"), com **bolinha verde** nos meses que têm lançamento.
- **Reformulação** — visão focada em gastos (removida receita), cards (Despesa do Mês, Gasto Total, Fixos vs Variáveis), donut categoria→subcategoria, tabela mensal.

### Geral

- Header unificado e fixo (sticky) por seção; cabeçalhos das tabelas fixos ao rolar; 1ª coluna fixa; arrastar para rolar no desktop; donuts com legenda lateral (valor + %).

---

## ⏳ Pendente

### Investimentos

- **Metas de Alocação por Tipo** — definir % alvo por tipo, mostrar desvio e quanto aportar para rebalancear.
- **Preço-teto / tese por ativo** — anotar preço-teto (ex. Bazin) e uma tese por ticker; sinalizar "abaixo do teto".

### Gastos

- **Painel de assinaturas/recorrentes** — lista dos lançamentos recorrentes com o custo fixo mensal total.
- **Agenda de parcelas futuras** — o que já está comprometido nos próximos meses (compras parceladas).
- **Comparativo com o mês anterior por categoria** — destacar as maiores variações vs mês passado.

---

## Observações / possíveis melhorias

- **Evolução do Patrimônio a valor de mercado**: hoje mostra aporte acumulado (só transações). Para mostrar valorização real seria preciso **backfill de cotações históricas** (yfinance `interval=1mo`) — o sync atual só guarda os últimos dias.
- **Ideias não priorizadas**: Yield on Cost por ativo; comparação com benchmark (CDI/IBOV); orçamento por subcategoria; backup/restauração (export/import JSON); PWA.

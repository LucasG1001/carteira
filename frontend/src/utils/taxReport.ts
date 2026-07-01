import type { BackendAssetSummary } from '../services/api';

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatQty(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 8 });
}

export interface TaxItem {
  ticker: string;
  name: string | null;
  quantidade: number;
  custoMedio: number;
  custoTotal: number;
  codigo: string;
  discriminacao: string;
}

export interface TaxSection {
  tipo: string;
  titulo: string;
  ficha: string;
  grupo: string;
  total: number;
  nota?: string;
  itens: TaxItem[];
}

export interface IncomeRow {
  label: string;
  ficha: string;
  codigo: string;
  total: number;
  nota?: string;
}

export interface TaxReport {
  sections: TaxSection[];
  incomes: IncomeRow[];
}

const FICHA_BENS = 'Bens e Direitos';
const STABLECOINS = ['USDT', 'USDC', 'BUSD', 'DAI', 'USDP', 'TUSD'];

function nameSuffix(name: string | null): string {
  return name ? ` (${name})` : '';
}

function criptoCodigo(ticker: string): string {
  const upper = ticker.toUpperCase();
  if (upper === 'BTC') return '01 – Bitcoin';
  if (STABLECOINS.includes(upper)) return '03 – Stablecoins';
  return '02 – Outras criptomoedas (altcoins)';
}

interface TaxRule {
  titulo: string;
  grupo: string;
  codigo: (asset: BackendAssetSummary) => string;
  discriminacao: (asset: BackendAssetSummary) => string;
  nota?: string;
}

const TAX_RULES: Record<string, TaxRule> = {
  Acao: {
    titulo: 'Ações',
    grupo: '03 – Participações Societárias',
    codigo: () => '01 – Ações (inclusive as listadas em bolsa)',
    discriminacao: (a) =>
      `${formatQty(a.total_quantity)} ações de ${a.ticker}${nameSuffix(a.name)}, adquiridas ao custo médio de ${formatBRL(a.average_price)}, totalizando ${formatBRL(a.total_invested)}. CNPJ da empresa: [preencher]. Corretora: [preencher].`,
  },
  FII: {
    titulo: 'Fundos Imobiliários (FII)',
    grupo: '07 – Fundos',
    codigo: () => '03 – Fundos de Investimento Imobiliário (FII)',
    discriminacao: (a) =>
      `${formatQty(a.total_quantity)} cotas do fundo imobiliário ${a.ticker}${nameSuffix(a.name)}, custo médio de ${formatBRL(a.average_price)}, custo total de ${formatBRL(a.total_invested)}. CNPJ do fundo: [preencher]. Administradora/Corretora: [preencher].`,
  },
  ETF: {
    titulo: 'ETFs',
    grupo: '07 – Fundos',
    codigo: () => '09 – Fundo de Índice de Mercado (ETF)',
    discriminacao: (a) =>
      `${formatQty(a.total_quantity)} cotas do ETF ${a.ticker}${nameSuffix(a.name)}, custo médio de ${formatBRL(a.average_price)}, custo total de ${formatBRL(a.total_invested)}. CNPJ da administradora: [preencher]. Corretora: [preencher].`,
  },
  'Renda Fixa': {
    titulo: 'Renda Fixa',
    grupo: '04 – Aplicações e Investimentos',
    codigo: () => '02 – Títulos públicos e privados sujeitos à tributação (Tesouro Direto, CDB, etc.)',
    discriminacao: (a) =>
      `${a.ticker}${nameSuffix(a.name)}, valor aplicado de ${formatBRL(a.total_invested)}. Instituição: [preencher].`,
  },
  Cripto: {
    titulo: 'Criptoativos',
    grupo: '08 – Criptoativos',
    codigo: (a) => criptoCodigo(a.ticker),
    discriminacao: (a) =>
      `${formatQty(a.total_quantity)} unidades de ${a.ticker}, custo total de aquisição de ${formatBRL(a.total_invested)}. Custódia/Exchange: [preencher].`,
    nota: 'Declare apenas se o custo de aquisição por tipo de criptoativo for igual ou superior a R$ 5.000,00.',
  },
  Outros: {
    titulo: 'Outros',
    grupo: '99 – Outros bens e direitos',
    codigo: () => '99 – Outros',
    discriminacao: (a) => `${a.ticker}${nameSuffix(a.name)}, valor de ${formatBRL(a.total_invested)}. [detalhar].`,
  },
};

const SECTION_ORDER = ['Acao', 'FII', 'ETF', 'Renda Fixa', 'Cripto', 'Outros'];

function ruleFor(assetType: string): { key: string; rule: TaxRule } {
  if (TAX_RULES[assetType]) return { key: assetType, rule: TAX_RULES[assetType] };
  return { key: 'Outros', rule: TAX_RULES.Outros };
}

export function buildTaxReport(assets: BackendAssetSummary[]): TaxReport {
  const grouped: Record<string, BackendAssetSummary[]> = {};
  for (const asset of assets) {
    const { key } = ruleFor(asset.asset_type);
    (grouped[key] = grouped[key] || []).push(asset);
  }

  const sections: TaxSection[] = SECTION_ORDER.filter((key) => grouped[key]?.length).map((key) => {
    const rule = TAX_RULES[key];
    const itens = grouped[key]
      .slice()
      .sort((a, b) => b.total_invested - a.total_invested)
      .map((asset) => ({
        ticker: asset.ticker,
        name: asset.name,
        quantidade: asset.total_quantity,
        custoMedio: asset.average_price,
        custoTotal: asset.total_invested,
        codigo: rule.codigo(asset),
        discriminacao: rule.discriminacao(asset),
      }));
    return {
      tipo: key,
      titulo: rule.titulo,
      ficha: FICHA_BENS,
      grupo: rule.grupo,
      total: itens.reduce((sum, item) => sum + item.custoTotal, 0),
      nota: rule.nota,
      itens,
    };
  });

  const sumDividends = (key: string) =>
    (grouped[key] || []).reduce((sum, asset) => sum + asset.total_dividends, 0);

  const incomes: IncomeRow[] = [];
  const dividendosAcoes = sumDividends('Acao');
  if (dividendosAcoes > 0) {
    incomes.push({
      label: 'Dividendos de ações',
      ficha: 'Rendimentos Isentos e Não Tributáveis',
      codigo: '09 – Lucros e dividendos recebidos',
      total: dividendosAcoes,
      nota: 'Juros sobre capital próprio (JCP), se houver, vão em Rendimentos Sujeitos à Tributação Exclusiva/Definitiva, código 10 — verifique seus informes.',
    });
  }
  const rendimentosFII = sumDividends('FII');
  if (rendimentosFII > 0) {
    incomes.push({
      label: 'Rendimentos de FII',
      ficha: 'Rendimentos Isentos e Não Tributáveis',
      codigo: '26 – Outros (rendimentos de FII)',
      total: rendimentosFII,
    });
  }

  return { sections, incomes };
}

function csvCell(value: string): string {
  const cell = value ?? '';
  if (cell.includes('"') || cell.includes(';') || cell.includes('\n')) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

export function toCsv(report: TaxReport): string {
  const rows: string[][] = [];
  rows.push(['Ficha', 'Grupo', 'Código', 'Ativo', 'Nome', 'Tipo', 'Quantidade', 'Custo médio', 'Situação (custo total)', 'Discriminação']);
  for (const section of report.sections) {
    for (const item of section.itens) {
      rows.push([
        section.ficha,
        section.grupo,
        item.codigo,
        item.ticker,
        item.name ?? '',
        section.titulo,
        formatQty(item.quantidade),
        formatBRL(item.custoMedio),
        formatBRL(item.custoTotal),
        item.discriminacao,
      ]);
    }
  }
  if (report.incomes.length) {
    rows.push([]);
    rows.push(['Rendimentos']);
    rows.push(['Ficha', 'Código', 'Descrição', 'Valor']);
    for (const income of report.incomes) {
      rows.push([income.ficha, income.codigo, income.label, formatBRL(income.total)]);
    }
  }
  return rows.map((row) => row.map(csvCell).join(';')).join('\r\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

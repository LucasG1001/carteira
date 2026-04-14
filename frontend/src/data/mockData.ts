// ===== TIPOS =====
export interface Ativo {
  ticker: string;
  nome: string;
  tipo: 'Ação' | 'FII' | 'ETF' | 'Cripto' | 'Renda Fixa';
  setor: string;
  quantidade: number;
  precoMedio: number;
  precoAtual: number;
  dividendoYield: number;
  ultimoDividendo: number;
  variacao24h: number;
  variacao30d: number;
  logoUrl?: string;
}

export interface HistoricoPatrimonio {
  mes: string;
  valor: number;
}

export interface DividendoMensal {
  mes: string;
  valor: number;
}

export interface AlocacaoSetor {
  setor: string;
  valor: number;
  percentual: number;
  cor: string;
}

export interface AlocacaoTipo {
  tipo: string;
  valor: number;
  percentual: number;
  cor: string;
}

// ===== ATIVOS MOCADOS =====
export const ativos: Ativo[] = [
  // Ações
  {
    ticker: 'PETR4',
    nome: 'Petrobras PN',
    tipo: 'Ação',
    setor: 'Petróleo e Gás',
    quantidade: 200,
    precoMedio: 28.50,
    precoAtual: 36.78,
    dividendoYield: 12.5,
    ultimoDividendo: 1.42,
    variacao24h: 1.25,
    variacao30d: 5.8,
  },
  {
    ticker: 'VALE3',
    nome: 'Vale ON',
    tipo: 'Ação',
    setor: 'Mineração',
    quantidade: 150,
    precoMedio: 62.30,
    precoAtual: 58.92,
    dividendoYield: 8.2,
    ultimoDividendo: 2.10,
    variacao24h: -0.87,
    variacao30d: -3.2,
  },
  {
    ticker: 'ITUB4',
    nome: 'Itaú Unibanco PN',
    tipo: 'Ação',
    setor: 'Bancos',
    quantidade: 300,
    precoMedio: 25.80,
    precoAtual: 32.15,
    dividendoYield: 5.8,
    ultimoDividendo: 0.48,
    variacao24h: 0.45,
    variacao30d: 2.1,
  },
  {
    ticker: 'BBAS3',
    nome: 'Banco do Brasil ON',
    tipo: 'Ação',
    setor: 'Bancos',
    quantidade: 250,
    precoMedio: 38.20,
    precoAtual: 54.30,
    dividendoYield: 9.1,
    ultimoDividendo: 0.95,
    variacao24h: 0.78,
    variacao30d: 4.5,
  },
  {
    ticker: 'WEGE3',
    nome: 'WEG ON',
    tipo: 'Ação',
    setor: 'Bens Industriais',
    quantidade: 100,
    precoMedio: 32.50,
    precoAtual: 41.20,
    dividendoYield: 1.4,
    ultimoDividendo: 0.12,
    variacao24h: 0.32,
    variacao30d: 6.2,
  },
  {
    ticker: 'ABEV3',
    nome: 'Ambev ON',
    tipo: 'Ação',
    setor: 'Bebidas',
    quantidade: 400,
    precoMedio: 12.80,
    precoAtual: 13.45,
    dividendoYield: 4.9,
    ultimoDividendo: 0.18,
    variacao24h: -0.15,
    variacao30d: -1.2,
  },
  {
    ticker: 'RENT3',
    nome: 'Localiza ON',
    tipo: 'Ação',
    setor: 'Aluguel de Carros',
    quantidade: 80,
    precoMedio: 55.00,
    precoAtual: 48.90,
    dividendoYield: 2.1,
    ultimoDividendo: 0.28,
    variacao24h: -1.10,
    variacao30d: -4.8,
  },
  // FIIs
  {
    ticker: 'HGLG11',
    nome: 'CSHG Logística FII',
    tipo: 'FII',
    setor: 'Logística',
    quantidade: 50,
    precoMedio: 158.00,
    precoAtual: 162.50,
    dividendoYield: 8.9,
    ultimoDividendo: 1.20,
    variacao24h: 0.22,
    variacao30d: 1.8,
  },
  {
    ticker: 'XPML11',
    nome: 'XP Malls FII',
    tipo: 'FII',
    setor: 'Shopping Centers',
    quantidade: 40,
    precoMedio: 95.00,
    precoAtual: 101.30,
    dividendoYield: 7.5,
    ultimoDividendo: 0.63,
    variacao24h: 0.10,
    variacao30d: 2.5,
  },
  {
    ticker: 'MXRF11',
    nome: 'Maxi Renda FII',
    tipo: 'FII',
    setor: 'Recebíveis',
    quantidade: 200,
    precoMedio: 10.20,
    precoAtual: 10.58,
    dividendoYield: 11.2,
    ultimoDividendo: 0.10,
    variacao24h: -0.05,
    variacao30d: 0.8,
  },
  {
    ticker: 'KNRI11',
    nome: 'Kinea Renda Imob FII',
    tipo: 'FII',
    setor: 'Híbrido',
    quantidade: 30,
    precoMedio: 132.00,
    precoAtual: 128.40,
    dividendoYield: 7.8,
    ultimoDividendo: 0.84,
    variacao24h: -0.35,
    variacao30d: -1.5,
  },
  {
    ticker: 'VISC11',
    nome: 'Vinci Shopping Centers FII',
    tipo: 'FII',
    setor: 'Shopping Centers',
    quantidade: 60,
    precoMedio: 108.50,
    precoAtual: 115.20,
    dividendoYield: 8.4,
    ultimoDividendo: 0.80,
    variacao24h: 0.38,
    variacao30d: 3.2,
  },
  // ETFs
  {
    ticker: 'IVVB11',
    nome: 'iShares S&P 500 BDR',
    tipo: 'ETF',
    setor: 'Internacional',
    quantidade: 100,
    precoMedio: 280.00,
    precoAtual: 312.50,
    dividendoYield: 0,
    ultimoDividendo: 0,
    variacao24h: 0.95,
    variacao30d: 4.2,
  },
  // Cripto
  {
    ticker: 'BTC',
    nome: 'Bitcoin',
    tipo: 'Cripto',
    setor: 'Criptomoedas',
    quantidade: 0.025,
    precoMedio: 280000,
    precoAtual: 345000,
    dividendoYield: 0,
    ultimoDividendo: 0,
    variacao24h: 2.35,
    variacao30d: 12.5,
  },
  {
    ticker: 'ETH',
    nome: 'Ethereum',
    tipo: 'Cripto',
    setor: 'Criptomoedas',
    quantidade: 0.5,
    precoMedio: 11500,
    precoAtual: 13200,
    dividendoYield: 0,
    ultimoDividendo: 0,
    variacao24h: 1.80,
    variacao30d: 8.7,
  },
  // Renda Fixa
  {
    ticker: 'CDB-INTER',
    nome: 'CDB Inter 120% CDI',
    tipo: 'Renda Fixa',
    setor: 'Pós-fixado',
    quantidade: 1,
    precoMedio: 15000,
    precoAtual: 16350,
    dividendoYield: 0,
    ultimoDividendo: 0,
    variacao24h: 0.04,
    variacao30d: 1.1,
  },
  {
    ticker: 'TESOURO-SELIC',
    nome: 'Tesouro Selic 2029',
    tipo: 'Renda Fixa',
    setor: 'Pós-fixado',
    quantidade: 1,
    precoMedio: 14200,
    precoAtual: 15480,
    dividendoYield: 0,
    ultimoDividendo: 0,
    variacao24h: 0.03,
    variacao30d: 1.05,
  },
  {
    ticker: 'LCI-NUBANK',
    nome: 'LCI Nubank 95% CDI',
    tipo: 'Renda Fixa',
    setor: 'Pós-fixado',
    quantidade: 1,
    precoMedio: 10000,
    precoAtual: 10720,
    dividendoYield: 0,
    ultimoDividendo: 0,
    variacao24h: 0.03,
    variacao30d: 0.95,
  },
];

// ===== HISTÓRICO DE PATRIMÔNIO =====
export const historicoPatrimonio: HistoricoPatrimonio[] = [
  { mes: 'Jan/25', valor: 85200 },
  { mes: 'Fev/25', valor: 88750 },
  { mes: 'Mar/25', valor: 87100 },
  { mes: 'Abr/25', valor: 91300 },
  { mes: 'Mai/25', valor: 94800 },
  { mes: 'Jun/25', valor: 93200 },
  { mes: 'Jul/25', valor: 97500 },
  { mes: 'Ago/25', valor: 101200 },
  { mes: 'Set/25', valor: 99800 },
  { mes: 'Out/25', valor: 105600 },
  { mes: 'Nov/25', valor: 108900 },
  { mes: 'Dez/25', valor: 112400 },
  { mes: 'Jan/26', valor: 115800 },
  { mes: 'Fev/26', valor: 118200 },
  { mes: 'Mar/26', valor: 121500 },
  { mes: 'Abr/26', valor: 125340 },
];

// ===== DIVIDENDOS MENSAIS =====
export const dividendosMensais: DividendoMensal[] = [
  { mes: 'Jan/25', valor: 420 },
  { mes: 'Fev/25', valor: 380 },
  { mes: 'Mar/25', valor: 510 },
  { mes: 'Abr/25', valor: 450 },
  { mes: 'Mai/25', valor: 620 },
  { mes: 'Jun/25', valor: 390 },
  { mes: 'Jul/25', valor: 480 },
  { mes: 'Ago/25', valor: 710 },
  { mes: 'Set/25', valor: 530 },
  { mes: 'Out/25', valor: 580 },
  { mes: 'Nov/25', valor: 860 },
  { mes: 'Dez/25', valor: 920 },
  { mes: 'Jan/26', valor: 485 },
  { mes: 'Fev/26', valor: 410 },
  { mes: 'Mar/26', valor: 560 },
  { mes: 'Abr/26', valor: 635 },
];

// ===== CÁLCULOS DERIVADOS =====
export function calcularPatrimonioTotal(): number {
  return ativos.reduce((total, ativo) => {
    return total + ativo.precoAtual * ativo.quantidade;
  }, 0);
}

export function calcularCustoTotal(): number {
  return ativos.reduce((total, ativo) => {
    return total + ativo.precoMedio * ativo.quantidade;
  }, 0);
}

export function calcularLucroTotal(): number {
  return calcularPatrimonioTotal() - calcularCustoTotal();
}

export function calcularRentabilidade(): number {
  const custo = calcularCustoTotal();
  if (custo === 0) return 0;
  return ((calcularPatrimonioTotal() - custo) / custo) * 100;
}

export function calcularDividendosTotais(): number {
  return dividendosMensais.reduce((total, d) => total + d.valor, 0);
}

export function calcularDividendoMedio(): number {
  return calcularDividendosTotais() / dividendosMensais.length;
}

export function calcularAlocacaoPorTipo(): AlocacaoTipo[] {
  const cores: Record<string, string> = {
    'Ação': '#6366f1',
    'FII': '#22d3ee',
    'ETF': '#f59e0b',
    'Cripto': '#f97316',
    'Renda Fixa': '#10b981',
  };

  const mapa: Record<string, number> = {};
  const patrimonioTotal = calcularPatrimonioTotal();

  ativos.forEach((ativo) => {
    const valor = ativo.precoAtual * ativo.quantidade;
    mapa[ativo.tipo] = (mapa[ativo.tipo] || 0) + valor;
  });

  return Object.entries(mapa).map(([tipo, valor]) => ({
    tipo,
    valor,
    percentual: (valor / patrimonioTotal) * 100,
    cor: cores[tipo] || '#94a3b8',
  }));
}

export function calcularAlocacaoPorSetor(): AlocacaoSetor[] {
  const cores = [
    '#6366f1', '#22d3ee', '#f59e0b', '#f97316', '#10b981',
    '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444', '#84cc16',
    '#a855f7', '#06b6d4',
  ];

  const mapa: Record<string, number> = {};
  const patrimonioTotal = calcularPatrimonioTotal();

  ativos.forEach((ativo) => {
    const valor = ativo.precoAtual * ativo.quantidade;
    mapa[ativo.setor] = (mapa[ativo.setor] || 0) + valor;
  });

  return Object.entries(mapa)
    .map(([setor, valor], i) => ({
      setor,
      valor,
      percentual: (valor / patrimonioTotal) * 100,
      cor: cores[i % cores.length],
    }))
    .sort((a, b) => b.valor - a.valor);
}

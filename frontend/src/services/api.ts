const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

export type BackendAssetSummary = {
  ticker: string;
  name: string | null;
  sector: string | null;
  asset_type: string;
  total_quantity: number;
  average_price: number;
  total_invested: number;
  total_dividends: number;
  price_date: string | null;
  price_updated_at: string | null;
  current_price: number;
  current_value: number;
  variation_value: number;
  variation_percent: number;
  profitability_value: number;
  profitability_percent: number;
};

export type BackendPortfolioSummary = {
  user_id: string;
  assets: BackendAssetSummary[];
  general_total_invested: number;
  general_total_dividends: number;
  general_current_value: number;
  general_variation_value: number;
  general_variation_percent: number;
  general_profitability_value: number;
  general_profitability_percent: number;
  monthly_dividends: { month: string; value: number }[];
};

export type BackendUploadResponse = {
  id: number;
  filename: string;
  created_at: string;
};

export type ManualAssetPayload = {
  ticker: string;
  operation_type: 'Compra' | 'Venda';
  date: string;
  quantity: number;
  unit_price: number;
  other_costs?: number;
};

export type ManualAssetResponse = {
  id: number;
  ticker: string;
  operation_type: string;
  entry_side: string;
  date: string;
  quantity: number;
  unit_price: number;
  operation_value: number;
};

async function request(url: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, options);

  if (!response.ok) {
    try {
      const errorData = await response.json();
      console.error('API Error Response:', errorData);
      const base = errorData.detail || errorData.message || 'Unknown error';
      let fields = '';
      if (Array.isArray(errorData.details)) {
        fields = errorData.details
          .map((d: { loc?: (string | number)[]; msg?: string }) => {
            const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : undefined;
            return field ? `${field}: ${d.msg ?? ''}`.trim() : d.msg;
          })
          .filter(Boolean)
          .join('; ');
      }
      throw new Error(`API error: ${response.status} - ${base}${fields ? ` (${fields})` : ''}`);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('API error')) throw e;
      throw new Error(`API error: ${response.status}`);
    }
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export type BackendDividend = {
  ticker: string;
  asset_type: string;
  date: string;
  type: string;
  value: number;
};

export async function getPortfolioSummary(): Promise<BackendPortfolioSummary> {
  return request('/portfolio/');
}

export async function getDividends(): Promise<BackendDividend[]> {
  return request('/portfolio/dividends');
}

export type BackendEvolutionPoint = {
  month: string;
  invested: number;
};

export async function getEvolution(): Promise<BackendEvolutionPoint[]> {
  return request('/portfolio/evolution');
}

export type BackendTransaction = {
  id: number;
  ticker: string;
  operation_type: string;
  entry_side: string | null;
  date: string;
  quantity: number;
  unit_price: number | null;
  operation_value: number | null;
  other_costs: number;
  source: 'b3' | 'manual';
};

export type TransactionUpdatePayload = {
  operation_type: 'Compra' | 'Venda';
  date: string;
  quantity: number;
  unit_price: number;
  other_costs: number;
};

export async function getTransactions(): Promise<BackendTransaction[]> {
  return request('/portfolio/transactions');
}

export async function updateTransaction(id: number, payload: TransactionUpdatePayload): Promise<BackendTransaction> {
  return request(`/portfolio/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteTransaction(id: number): Promise<void> {
  await request(`/portfolio/transactions/${id}`, { method: 'DELETE' });
}

export async function uploadPortfolioFile(file: File): Promise<BackendUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return request('/upload/', {
    method: 'POST',
    body: formData,
  });
}

export async function createManualAsset(payload: ManualAssetPayload): Promise<ManualAssetResponse> {
  return request('/portfolio/manual', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export type ExpenseEntryType = 'expense' | 'income';
export type RecurrenceType = 'monthly' | 'weekly' | 'yearly';

export type BackendExpenseEntry = {
  id: number;
  user_id: string;
  type: ExpenseEntryType;
  amount: number;
  category: string;
  subcategory: string | null;
  date: string;
  description: string | null;
  payment_method: string | null;
  installments: number;
  is_recurring: boolean;
  recurrence: string | null;
  place: string | null;
  address: string | null;
  notes: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
};

export type BackendExpenseSummary = {
  user_id: string;
  entries: BackendExpenseEntry[];
  current_month: string;
  month_income: number;
  month_expense: number;
  month_balance: number;
  avg_monthly_expense: number;
  avg_monthly_income: number;
  monthly: { month: string; income: number; expense: number; balance: number }[];
  by_category: { category: string; total: number }[];
  by_subcategory: { category: string; total: number }[];
  month_by_category: { category: string; total: number }[];
  budgets: BudgetItem[];
};

export type BudgetItem = {
  category: string;
  amount: number;
};

export type ExpenseCreatePayload = {
  type: ExpenseEntryType;
  amount: number;
  category: string;
  subcategory?: string | null;
  date: string;
  description?: string | null;
  payment_method?: string | null;
  installments?: number;
  is_recurring?: boolean;
  recurrence?: RecurrenceType | null;
  place?: string | null;
  address?: string | null;
  notes?: string | null;
  tags?: string | null;
};

export async function getExpensesSummary(): Promise<BackendExpenseSummary> {
  return request('/expenses/');
}

export async function createExpense(payload: ExpenseCreatePayload): Promise<BackendExpenseEntry> {
  return request('/expenses/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function updateExpense(
  id: number,
  payload: Partial<ExpenseCreatePayload>,
): Promise<BackendExpenseEntry> {
  return request(`/expenses/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteExpense(id: number): Promise<null> {
  return request(`/expenses/${id}`, { method: 'DELETE' });
}

export async function setBudget(category: string, amount: number): Promise<BudgetItem> {
  return request('/expenses/budgets', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ category, amount }),
  });
}

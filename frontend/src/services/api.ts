import keycloak from './keycloak';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export type BackendAssetSummary = {
  ticker: string;
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
  dividend_yield_percent: number;
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
  general_dividend_yield_percent: number;
};

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  if (keycloak.isTokenExpired()) {
    try {
      await keycloak.updateToken(30);
    } catch (err) {
      console.error('Failed to refresh token', err);
      keycloak.login();
      throw new Error('Token expired and cannot be refreshed');
    }
  }

  const headers = new Headers(options.headers || {});
  if (keycloak.token) {
    headers.set('Authorization', `Bearer ${keycloak.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      console.error('API Error Response:', errorData);
      throw new Error(`API error: ${response.status} - ${errorData.detail || 'Unknown error'}`);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('API error')) throw e;
      throw new Error(`API error: ${response.status}`);
    }
  }

  return response.json();
}

export async function getPortfolioSummary(): Promise<BackendPortfolioSummary> {
  return fetchWithAuth('/portfolio/');
}

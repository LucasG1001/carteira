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
      throw new Error(`API error: ${response.status} - ${errorData.detail || errorData.message || 'Unknown error'}`);
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

export async function getPortfolioSummary(): Promise<BackendPortfolioSummary> {
  return fetchWithAuth('/portfolio/');
}

export async function uploadPortfolioFile(file: File): Promise<BackendUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return fetchWithAuth('/upload/', {
    method: 'POST',
    body: formData,
  });
}

export async function createManualAsset(payload: ManualAssetPayload): Promise<ManualAssetResponse> {
  return fetchWithAuth('/portfolio/manual', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

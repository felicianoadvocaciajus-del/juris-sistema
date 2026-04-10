import api from './api';
import {
  mockDashboard,
  mockClients,
  mockMatters,
  mockConversations,
  mockInstallments,
  mockPublications,
  mockDeadlines,
  mockTemplates,
} from './mock-data';

// Busca da API. Só usa mock se API estiver completamente offline.
async function fetchOrMock<T>(url: string, mockData: T): Promise<T> {
  try {
    const res = await api.get(url);
    return res.data;
  } catch (err: any) {
    // Se for erro de auth (401/403), não usar mock — deixa o interceptor redirecionar
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      throw err;
    }
    // Se o backend retornou resposta (4xx/5xx), não usar mock
    if (err?.response) {
      console.error(`[API] Erro ${err.response.status} para ${url}:`, err.response.data);
      // Retorna array vazio em vez de mock para não confundir
      if (Array.isArray(mockData)) return [] as unknown as T;
      if (typeof mockData === 'object' && mockData !== null && 'data' in (mockData as any)) {
        return { data: [], total: 0 } as unknown as T;
      }
      throw err;
    }
    // Só usa mock se API estiver completamente offline (network error)
    console.warn(`[Mock] API offline para ${url}, usando dados de demonstracao`);
    return mockData;
  }
}

export async function getDashboard() {
  return fetchOrMock('/dashboard/summary', mockDashboard);
}

export async function getClients(params?: Record<string, string>) {
  const allParams = { limit: '500', ...params };
  const query = '?' + new URLSearchParams(allParams).toString();
  return fetchOrMock(`/persons${query}`, { data: mockClients, total: mockClients.length });
}

export async function getClient(id: string) {
  const client = mockClients.find(c => c.id === id);
  return fetchOrMock(`/persons/${id}`, client || mockClients[0]);
}

export async function getMatters(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchOrMock(`/matters${query}`, { data: mockMatters, total: mockMatters.length });
}

export async function getMatter(id: string) {
  const matter = mockMatters.find(m => m.id === id);
  return fetchOrMock(`/matters/${id}`, matter || mockMatters[0]);
}

export async function getConversations() {
  return fetchOrMock('/conversations', { data: mockConversations, total: mockConversations.length });
}

export async function getInstallments(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchOrMock(`/finance/installments${query}`, { data: mockInstallments, total: mockInstallments.length });
}

export async function getPublications() {
  return fetchOrMock('/publications', { data: mockPublications, total: mockPublications.length });
}

export async function getDeadlines() {
  return fetchOrMock('/deadlines?limit=500', { data: mockDeadlines, total: mockDeadlines.length });
}

export async function getTemplates() {
  return fetchOrMock('/templates', { data: mockTemplates, total: mockTemplates.length });
}

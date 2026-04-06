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

// Tenta buscar da API. Se falhar, usa dados mock.
// Remover os fallbacks quando o backend estiver rodando.
async function fetchOrMock<T>(url: string, mockData: T): Promise<T> {
  try {
    const res = await api.get(url);
    return res.data;
  } catch {
    console.warn(`[Mock] API indisponivel para ${url}, usando dados de demonstracao`);
    return mockData;
  }
}

export async function getDashboard() {
  return fetchOrMock('/dashboard/summary', mockDashboard);
}

export async function getClients(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
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
  return fetchOrMock('/deadlines', { data: mockDeadlines, total: mockDeadlines.length });
}

export async function getTemplates() {
  return fetchOrMock('/templates', { data: mockTemplates, total: mockTemplates.length });
}

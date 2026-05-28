import http from './http';

export interface SearchResult {
  type: 'project' | 'contact' | 'contract' | 'service' | 'task';
  id: string;
  title: string;
  subtitle: string;
  status: string;
  link: string;
}

export interface SearchResponse {
  items: SearchResult[];
}

export const searchApi = {
  search: (q: string, limit = 5) =>
    http.get<SearchResponse>('/search', { params: { q, limit } }),
};

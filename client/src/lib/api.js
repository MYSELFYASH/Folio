import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('folio_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function setAuthToken(token) {
  if (token) localStorage.setItem('folio_token', token);
  else localStorage.removeItem('folio_token');
}

export const authApi = {
  register: (body) => api.post('/auth/register', body),
  login: (body) => api.post('/auth/login', body),
  updateProfile: (body) => api.patch('/auth/profile', body),
};

export const booksApi = {
  search: (q) => api.get('/books/search', { params: { q } }),
  create: (body) => api.post('/books', body),
  get: (id) => api.get(`/books/${id}`),
};

export const userBooksApi = {
  list: (params) => api.get('/user-books', { params }),
  add: (body) => api.post('/user-books', body),
  patch: (id, body) => api.patch(`/user-books/${id}`, body),
  remove: (id) => api.delete(`/user-books/${id}`),
  detail: (userBookId) => api.get(`/user-books/${userBookId}/detail`),
};

export const sessionsApi = {
  create: (body) => api.post('/sessions', body),
  listForBook: (userBookId) => api.get(`/sessions/book/${userBookId}`),
  remove: (sessionId) => api.delete(`/sessions/${sessionId}`),
};

export const statsApi = {
  summary: () => api.get('/stats/summary'),
  booksPerMonth: () => api.get('/stats/books-per-month'),
  genreBreakdown: () => api.get('/stats/genre-breakdown'),
  readingStreak: () => api.get('/stats/reading-streak'),
  activity: () => api.get('/stats/activity'),
  topRated: () => api.get('/stats/top-rated'),
  pagesThisYear: () => api.get('/stats/pages-this-year'),
  recentSessions: () => api.get('/stats/recent-sessions'),
};

export const goalsApi = {
  list: () => api.get('/goals'),
  create: (body) => api.post('/goals', body),
  patch: (id, body) => api.patch(`/goals/${id}`, body),
};

export const listsApi = {
  list: () => api.get('/lists'),
  get: (id) => api.get(`/lists/${id}`),
  create: (body) => api.post('/lists', body),
  patch: (id, body) => api.patch(`/lists/${id}`, body),
  remove: (id) => api.delete(`/lists/${id}`),
  addItem: (listId, body) => api.post(`/lists/${listId}/items`, body),
  removeItem: (listId, bookId) => api.delete(`/lists/${listId}/items/${bookId}`),
};

export const highlightsApi = {
  list: (userBookId) => api.get(`/highlights/${userBookId}`),
  create: (body) => api.post('/highlights', body),
  remove: (highlightId) => api.delete(`/highlights/note/${highlightId}`),
};

export default api;

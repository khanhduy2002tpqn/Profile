const API_BASE_URL = '/api';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function removeToken() {
  localStorage.removeItem('token');
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

export function setCurrentUser(user: any) {
  localStorage.setItem('user', JSON.stringify(user));
}

export function removeCurrentUser() {
  localStorage.removeItem('user');
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function request(path: string, options: RequestOptions = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let url = `${API_BASE_URL}${path}`;

  // Add query parameters if provided
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, val.toString());
      }
    });
    const query = searchParams.toString();
    if (query) {
      url += `?${query}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeToken();
    removeCurrentUser();
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/cms') && window.location.pathname !== '/cms/login') {
      window.location.href = '/cms/login';
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function apiGet(path: string, params?: Record<string, any>) {
  return request(path, { method: 'GET', params });
}

export async function apiPost(path: string, body?: any, params?: Record<string, any>) {
  const headers = new Headers();
  let requestBody = body;

  if (body && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(body);
  }

  return request(path, {
    method: 'POST',
    headers,
    body: requestBody,
    params,
  });
}

export async function apiPut(path: string, body?: any, params?: Record<string, any>) {
  const headers = new Headers();
  let requestBody = body;

  if (body && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(body);
  }

  return request(path, {
    method: 'PUT',
    headers,
    body: requestBody,
    params,
  });
}

export async function apiDelete(path: string, params?: Record<string, any>) {
  return request(path, { method: 'DELETE', params });
}

export function getUploadUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

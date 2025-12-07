export const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}
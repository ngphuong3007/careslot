export const API_BASE =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export async function apiRequest(path, options = {}) {
  // Lấy token từ localStorage
  const token = localStorage.getItem('token');

  // Ghép headers: Content-Type + headers truyền vào
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Nếu có token và caller chưa tự set Authorization thì tự gắn
  if (token && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Nếu path là URL đầy đủ (http...) thì dùng luôn, còn lại thì ghép với API_BASE
  const url = path.startsWith('http')
    ? path
    : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // throw để .catch ở component xử lý (hiển thị lỗi, redirect, ...)
    const text = await response.text().catch(() => '');
    throw new Error(`Request failed: ${response.status} ${text}`);
  }

  // Trả luôn JSON
  return response.json();
}
// Shared utilities
const API = '/api';

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function apiForm(path, formData) {
  const res = await fetch(API + path, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function formatKES(n) {
  return 'KES ' + Number(n).toLocaleString();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function getCurrentUser() {
  try { return (await api('/auth/me')).user; }
  catch { return null; }
}

async function renderNav() {
  const user = await getCurrentUser();
  const nav = document.getElementById('nav-links');
  if (!nav) return user;

  if (user) {
    nav.innerHTML = `
      <a href="/dashboard">Dashboard</a>
      ${user.role === 'admin' ? '<a href="/admin">Admin</a>' : ''}
      <span style="color:var(--muted)">Hi, ${escapeHtml(user.name.split(' ')[0])}</span>
      <button class="btn btn-outline" id="logout-btn">Logout</button>
    `;
    document.getElementById('logout-btn').addEventListener('click', async () => {
      await api('/auth/logout', { method: 'POST' });
      location.href = '/';
    });
  } else {
    nav.innerHTML = `
      <a href="/">Browse</a>
      <a href="/login">Login</a>
      <a href="/register" class="btn btn-primary">Sign Up</a>
    `;
  }
  return user;
}

document.addEventListener('DOMContentLoaded', renderNav);

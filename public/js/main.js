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

async function apiForm(path, formData, method = 'POST') {
  const res = await fetch(API + path, {
    method,
    credentials: 'include',
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const formatKES = (n) => 'KES ' + Number(n || 0).toLocaleString();

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function getCurrentUser() {
  try { return (await api('/auth/me')).user; } catch { return null; }
}

async function renderNav() {
  const user = await getCurrentUser();
  const nav = document.getElementById('nav-links');
  if (!nav) return user;

  if (user) {
    let extra = '';
    if (user.role === 'admin') extra = '<a href="/admin">Admin</a>';
    else if (user.role === 'creator') extra = '<a href="/creator/dashboard">Creator Hub</a>';
    else extra = '<a href="/dashboard">My Purchases</a>';

    nav.innerHTML = `
      <a href="/">Browse</a>
      ${extra}
      <span style="color:var(--muted)">Hi, ${escapeHtml(user.name.split(' ')[0])}</span>
      <button class="btn btn-outline btn-sm" id="logout-btn">Logout</button>
    `;
    document.getElementById('logout-btn').addEventListener('click', async () => {
      await api('/auth/logout', { method: 'POST' });
      location.href = '/';
    });
  } else {
    nav.innerHTML = `
      <a href="/">Browse</a>
      <a href="/creator-register">Become a Creator</a>
      <a href="/login">Login</a>
      <a href="/register" class="btn btn-primary btn-sm">Sign Up</a>
    `;
  }
  return user;
}

document.addEventListener('DOMContentLoaded', renderNav);

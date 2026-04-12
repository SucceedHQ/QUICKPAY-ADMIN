const API_URL = import.meta.env.VITE_ADMIN_API_URL || '/.netlify/functions/admin-proxy';

function getSecret() {
  return sessionStorage.getItem('adminToken') || import.meta.env.VITE_ADMIN_SECRET || '';
}

export async function adminCall(action: string, payload: any = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'admin-secret': getSecret()
    },
    body: JSON.stringify({ action, payload })
  });
  
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
       sessionStorage.removeItem('adminToken');
       if (action !== 'login') {
         window.location.href = '/';
       }
    }
    throw new Error(data.error || 'API Error');
  }
  return data;
}

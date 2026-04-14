const API_URL = import.meta.env.VITE_ADMIN_API_URL || '/.netlify/functions/admin-proxy';

function getSecret() {
  return sessionStorage.getItem('adminToken') || import.meta.env.VITE_ADMIN_SECRET || '';
}

export async function adminCall(action: string, payload: any = {}) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'admin-secret': getSecret()
      },
      body: JSON.stringify({ action, payload }),
      // Optional: signal timeout or controller if needed
    });
    
    const contentType = res.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      throw new Error(`Server returned non-JSON response: ${text.slice(0, 100)}...`);
    }

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
  } catch (err: any) {
    throw new Error(err.message || 'Network error connecting to Admin API');
  }
}

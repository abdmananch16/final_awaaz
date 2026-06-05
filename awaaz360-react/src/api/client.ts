// In production (Vercel), VITE_API_URL should be set to the Render backend URL
// In dev, Vite proxies /api to localhost:3001
const API_BASE = import.meta.env.VITE_API_URL || '/api';

/** Resolve evidence URLs — if relative, prepend the API base for cross-domain support */
export function resolveUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Relative URL like /uploads/file.jpg — derive base from API_BASE
  const base = API_BASE.replace(/\/api\/?$/, '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

async function fetchJSON(url: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  /** Upload evidence files (images/PDFs) */
  uploadEvidence: async (files: File[]): Promise<{ files: Array<{name:string;original:string;size:number;mimetype:string;url:string}> }> => {
    const formData = new FormData();
    files.forEach(f => formData.append('evidence', f));
    const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /** Get evidence for a specific complaint */
  getEvidence: async (id: string): Promise<{ evidence: Array<{name:string;original:string;size:number;mimetype:string;url:string}> }> => {
    return fetchJSON(`/complaints/${id}/evidence`);
  },

  getStats: () => fetchJSON('/stats'),
  
  getComplaints: (query?: string, status?: string) => 
    fetchJSON(`/complaints?query=${encodeURIComponent(query || '')}&status=${encodeURIComponent(status || 'All')}`),
  
  getComplaint: (id: string) => fetchJSON(`/complaints/${id}`),
  
  createComplaint: (data: { name: string; phone?: string; category: string; description: string; location?: string; evidence?: Array<{name:string;original:string;size:number;mimetype:string;url:string}>; geoLocation?: { lat: number; lng: number } }) =>
    fetchJSON('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  
  updateComplaintStatus: (id: string, status: string) =>
    fetchJSON(`/complaints/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  
  deleteComplaint: (id: string) =>
    fetchJSON(`/complaints/${id}`, { method: 'DELETE' }),
  
  exportComplaintsPDF: async (query?: string, status?: string) => {
    const res = await fetch(`${API_BASE}/complaints/export/pdf?query=${encodeURIComponent(query || '')}&status=${encodeURIComponent(status || 'All')}`);
    if (!res.ok) throw new Error('PDF export failed');
    return res.blob();
  },
  
  getDonors: (bloodGroup?: string, area?: string) =>
    fetchJSON(`/donors?bloodGroup=${encodeURIComponent(bloodGroup || 'All')}&area=${encodeURIComponent(area || '')}`),
  
  createDonor: (data: { name: string; phone?: string; bloodGroup: string; area?: string }) =>
    fetchJSON('/donors', { method: 'POST', body: JSON.stringify(data) }),
  
  deleteDonor: (id: number) => fetchJSON(`/donors/${id}`, { method: 'DELETE' }),
  
  getFuelPrices: () => fetchJSON('/fuel-prices'),
  
  getWeather: () => fetchJSON('/weather'),
  
  getPrayerTimes: () => fetchJSON('/prayer-times'),
  
  getNews: () => fetchJSON('/news'),
  
  chat: (data: { query: string; fuelPrices?: any[]; fuelUpdated?: string; weatherData?: any; prayerData?: any; fuelSource?: string }) =>
    fetchJSON('/chat', { method: 'POST', body: JSON.stringify(data) }),
  
  getLostFoundItems: (type?: string, query?: string) =>
    fetchJSON(`/lost-found?type=${encodeURIComponent(type || 'All')}&query=${encodeURIComponent(query || '')}`),

  getLostFoundItem: (id: string) => fetchJSON(`/lost-found/${id}`),

  createLostFoundItem: (data: { type: string; itemType: string; title: string; description?: string; name: string; phone?: string; location?: string }) =>
    fetchJSON('/lost-found', { method: 'POST', body: JSON.stringify(data) }),

  resolveLostFoundItem: (id: string) =>
    fetchJSON(`/lost-found/${id}/resolve`, { method: 'PUT' }),

  deleteLostFoundItem: (id: string) =>
    fetchJSON(`/lost-found/${id}`, { method: 'DELETE' }),

  verifyComplaint: (id: string) =>
    fetchJSON(`/verify/${id}`, { method: 'POST' }),

  unverifyComplaint: (id: string) =>
    fetchJSON(`/verify/${id}`, { method: 'DELETE' }),

  getVerificationStatus: (id: string): Promise<{ count: number; verified: boolean }> =>
    fetchJSON(`/verify/${id}`),

  getAllVerificationCounts: (): Promise<Record<string, number>> =>
    fetchJSON('/verifications'),

  getConfig: () => fetchJSON('/config'),
};

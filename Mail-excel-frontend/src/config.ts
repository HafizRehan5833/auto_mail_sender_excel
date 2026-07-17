const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://mail-through-excel.vercel.app';

export const API_BASE = rawApiBaseUrl.replace(/\/$/, '');
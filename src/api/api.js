// src/api/api.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export default API_BASE;
export const USE_ABSOLUTE = (import.meta.env.VITE_USE_ABSOLUTE_URL === 'true');

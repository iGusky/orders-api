import axios from 'axios';

// Instancia única de axios. Solo la usan los módulos de src/services/api.
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

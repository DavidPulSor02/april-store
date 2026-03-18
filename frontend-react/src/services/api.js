import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const Api = {
  _token: () => localStorage.getItem('april_token'),

  _instance: axios.create({
    baseURL: API_BASE,
  }),

  async _req(method, path, data = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this._token();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await this._instance.request({
        method,
        url: path,
        data,
        headers,
      });
      return response.data.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Error desconocido';
      throw { status: error.response?.status, message: msg };
    }
  },

  get:    (path)       => Api._req('GET',    path),
  post:   (path, data) => Api._req('POST',   path, data),
  put:    (path, data) => Api._req('PUT',    path, data),
  patch:  (path, data) => Api._req('PATCH',  path, data),
  delete: (path)       => Api._req('DELETE', path),

  // Auth
  login:  (email, password) => Api.post('/auth/login', { email, password }),
  me:     ()                => Api.get('/auth/me'),

  // ConfigAdmin
  resetDb: () => Api.post('/admin/reset-db', {}),
};

export const getToken = () => Api._token();

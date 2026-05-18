// =============================================================================
// Fichier      : src/http/client.js
// Description  : Client HTTP basé sur axios, préconfiguré pour GetMiPay.
// =============================================================================

import axios from 'axios';
import { ApiError } from '../utils/errors.js';

export default class HttpClient {
  constructor(config) {
    if (!config) {
      throw new Error('HttpClient requires a config instance');
    }

    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'x-sdk-version': '1.0.0',
      },
    });
  }

  async post(path, payload = {}, headers = {}) {
    try {
      const response = await this.client.post(path, payload, { headers });
      return response.data;
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  async get(path, headers = {}) {
    try {
      const response = await this.client.get(path, { headers });
      return response.data;
    } catch (error) {
      throw this._normalizeError(error);
    }
  }

  _normalizeError(error) {
    // Erreur HTTP (réponse serveur)
    if (error?.response) {
      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        error.message;

      return new ApiError(message, error.response.status);
    }

    // Erreur réseau / timeout
    return new ApiError(error?.message || 'Network error', 0);
  }
}
// =============================================================================
// Fichier      : src/http/client.js
// Description  : Client HTTP du SDK GetMiPay.
//                Encapsule axios pour communiquer avec l'API REST.
//                Gère les codes de réponse HTTP et lève des erreurs normalisées.
// =============================================================================

const axios = require('axios');
const { ApiError } = require('../utils/errors');

class HttpClient {
  /**
   * Crée une instance du client HTTP configurée à partir de la config SDK.
   *
   * @param {import('../config')} config - Instance de configuration du SDK.
   */
  constructor(config) {
    // Créer une instance axios pré-configurée avec l'URL de base et le timeout
    this.client = axios.create({
      baseURL : config.baseUrl,  // URL de base (sandbox ou production)
      timeout : config.timeout,  // Timeout en ms (30000 par défaut)
    });
  }

  /**
   * Effectue une requête HTTP POST.
   *
   * @param {string} path    - Chemin de l'endpoint (ex: '/payments/payin').
   * @param {Object} payload - Corps JSON de la requête.
   * @param {Object} headers - Headers HTTP authentifiés (signature incluse).
   * @returns {Promise<Object>} Les données de la réponse API.
   * @throws {ApiError} En cas d'erreur HTTP ou réseau.
   */
  async post(path, payload, headers) {
    try {
      const response = await this.client.post(path, payload, { headers });
      return response.data; // Retourner uniquement le corps JSON de la réponse
    } catch (error) {
      // Normaliser l'erreur avant de la propager
      this._handleError(error);
    }
  }

  /**
   * Effectue une requête HTTP GET.
   *
   * @param {string} path    - Chemin de l'endpoint (ex: '/payments/{ref}/status').
   * @param {Object} headers - Headers HTTP authentifiés (signature incluse).
   * @returns {Promise<Object>} Les données de la réponse API.
   * @throws {ApiError} En cas d'erreur HTTP ou réseau.
   */
  async get(path, headers) {
    try {
      const response = await this.client.get(path, { headers });
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * Transforme une erreur axios en ApiError normalisée.
   * Extrait le message et le code HTTP de la réponse si disponible.
   *
   * @param {Error} error - L'erreur brute levée par axios.
   * @throws {ApiError}
   * @private
   */
  _handleError(error) {
    if (error.response) {
      // L'API a répondu avec un code d'erreur HTTP (4xx, 5xx)
      const status  = error.response.status;
      const message = error.response.data?.message || error.message;
      throw new ApiError(message, status);
    } else if (error.request) {
      // La requête a été envoyée mais aucune réponse reçue (timeout, réseau)
      throw new ApiError('No response received from API. Check your network.', 0);
    } else {
      // Erreur de configuration avant l'envoi de la requête
      throw new ApiError(error.message, 0);
    }
  }
}

module.exports = HttpClient;
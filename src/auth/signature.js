// =============================================================================
// Fichier      : src/auth/signature.js
// Description  : Génération de signature HMAC-SHA256 pour l'authentification
//                des requêtes vers l'API GetMiPay.
//                Chaque requête est signée avec : méthode + chemin + timestamp + corps.
// =============================================================================

const crypto = require('crypto');

class Signature {
  /**
   * Génère la signature HMAC-SHA256 à partir des éléments de la requête.
   *
   * La chaîne signée est construite comme suit :
   *   METHOD\nPATH\nTIMESTAMP\nBODY
   * Exemple : "POST\n/payments/payin\n1700000000\n{\"amount\":5000,...}"
   *
   * @param {string} apiKey    - La clé secrète API utilisée pour signer.
   * @param {string} method    - Méthode HTTP ('GET', 'POST', etc.).
   * @param {string} path      - Chemin de l'endpoint (ex: '/payments/payin').
   * @param {string} timestamp - Timestamp Unix en secondes (chaîne de caractères).
   * @param {string} [body=''] - Corps de la requête JSON sérialisé (vide pour GET).
   * @returns {string}           Signature hexadécimale HMAC-SHA256.
   */
  static generate(apiKey, method, path, timestamp, body = '') {
    // Construction de la chaîne à signer (séparateurs \n pour la clarté)
    const stringToSign = `${method}\n${path}\n${timestamp}\n${body}`;

    // Génération HMAC-SHA256 et retour en hexadécimal
    return crypto
      .createHmac('sha256', apiKey)
      .update(stringToSign)
      .digest('hex');
  }

  /**
   * Construit l'objet complet des headers HTTP authentifiés pour une requête.
   * Génère un nouveau timestamp à chaque appel pour garantir la fraîcheur.
   *
   * @param {string} apiKey  - La clé secrète API.
   * @param {string} method  - Méthode HTTP ('GET', 'POST', etc.).
   * @param {string} path    - Chemin de l'endpoint.
   * @param {Object} [body={}] - Corps de la requête (objet JS, sérialisé en interne).
   * @returns {Object} Headers HTTP prêts à être envoyés avec la requête.
   */
  static getHeaders(apiKey, method, path, body = {}) {
    // Timestamp Unix courant en secondes (utilisé dans la signature et le header)
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Sérialiser le corps seulement s'il contient des données (GET n'a pas de body)
    const bodyStr = Object.keys(body).length ? JSON.stringify(body) : '';

    // Générer la signature HMAC avec tous les éléments de la requête
    const signature = this.generate(apiKey, method, path, timestamp, bodyStr);

    return {
      'x-api-key'      : apiKey,       // Identifiant de la clé API
      'x-timestamp'    : timestamp,    // Timestamp pour prévenir les attaques par rejeu
      'x-signature'    : signature,    // Signature HMAC-SHA256 calculée
      'Content-Type'   : 'application/json',
      'x-sdk-version'  : '1.0.0',      // Version du SDK (pour le support et le suivi)
      'x-sdk-language' : 'javascript'  // Langage du SDK (utile pour les analytics API)
    };
  }
}

module.exports = Signature;
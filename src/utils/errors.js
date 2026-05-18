// =============================================================================
// Fichier      : src/utils/errors.js
// Description  : Classes d'erreurs personnalisées du SDK GetMiPay.
//                Permettent de distinguer les erreurs de validation (côté client)
//                des erreurs API (côté serveur) lors du catch dans le code utilisateur.
// =============================================================================

/**
 * Erreur levée quand les paramètres fournis par l'utilisateur sont invalides.
 * Ex : champ obligatoire manquant, format incorrect.
 * Correspond à une erreur côté CLIENT (avant tout envoi réseau).
 */
class ValidationError extends Error {
  /**
   * @param {string} message - Description précise du champ ou de la règle violée.
   */
  constructor(message) {
    super(message);
    this.name = 'ValidationError'; // Nom lisible dans les logs et stack traces
    this.type = 'validation';      // Type utile pour un switch/case dans le code appelant
  }
}

/**
 * Erreur levée quand l'API GetMiPay retourne une réponse d'erreur HTTP
 * ou lorsqu'une erreur réseau survient.
 * Correspond à une erreur côté SERVEUR ou infrastructure.
 */
class ApiError extends Error {
  /**
   * @param {string} message    - Message d'erreur retourné par l'API ou le réseau.
   * @param {number} statusCode - Code HTTP de la réponse (ex: 401, 422, 500).
   *                              0 si aucune réponse n'a été reçue (timeout / réseau).
   */
  constructor(message, statusCode) {
    super(message);
    this.name       = 'ApiError';    // Nom lisible dans les logs
    this.type       = 'api';         // Type pour distinguer des ValidationError
    this.statusCode = statusCode;    // Code HTTP pour adapter la gestion d'erreur
  }
}

module.exports = { ValidationError, ApiError };
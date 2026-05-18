// =============================================================================
// Fichier      : src/utils/errors.js
// Description  : Classes d'erreurs personnalisées du SDK GetMiPay.
//                Permettent de distinguer les erreurs de validation (côté client)
//                des erreurs API (côté serveur) dans les blocs catch.
// =============================================================================

/**
 * Erreur levée quand les paramètres fournis par le développeur sont invalides.
 * Se produit AVANT tout appel réseau (validation locale).
 *
 * @example
 * try { await sdk.payments.payin({}) }
 * catch (e) { if (e instanceof ValidationError) { ... } }
 */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.type = 'validation';
  }
}

/**
 * Erreur levée quand l'API GetMiPay retourne une réponse HTTP d'erreur (4xx, 5xx)
 * ou quand une erreur réseau survient.
 *
 * @example
 * try { await sdk.payments.payin(params) }
 * catch (e) { if (e instanceof ApiError) { console.log(e.statusCode) } }
 */
export class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name       = 'ApiError';
    this.type       = 'api';
    this.statusCode = statusCode;
  }
}
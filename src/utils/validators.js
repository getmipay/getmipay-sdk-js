// =============================================================================
// Fichier      : src/utils/validators.js
// Description  : Fonctions de validation des paramètres d'entrée du SDK.
//                Centralisées ici pour rester réutilisables dans tous les services.
// =============================================================================

// ✅ CORRECTION : "require('./errors')" remplacé par import ESM
import { ValidationError } from './errors.js';

/**
 * Valide les paramètres obligatoires d'un PayIn.
 * Lève une ValidationError si un champ requis est absent ou invalide.
 *
 * @param {Object} params - Paramètres passés à payments.payin().
 * @throws {ValidationError}
 */
export function validatePayinParams(params) {
  // Vérification des champs obligatoires
  const required = ['amount', 'currency', 'wallet', 'callback_url'];
  for (const field of required) {
    if (!params[field]) {
      throw new ValidationError(`Missing required field: "${field}"`);
    }
  }

  // Le montant doit être un nombre positif
  if (typeof params.amount !== 'number' || params.amount <= 0) {
    throw new ValidationError('"amount" must be a positive number');
  }

  // La devise doit être une chaîne de 3 lettres majuscules (ex: XOF, EUR, USD)
  if (!/^[A-Z]{3}$/.test(params.currency)) {
    throw new ValidationError('"currency" must be a 3-letter uppercase ISO code (e.g. XOF)');
  }

  // L'URL de callback doit être une URL valide
  try {
    new URL(params.callback_url);
  } catch {
    throw new ValidationError('"callback_url" must be a valid URL');
  }
}

// ✅ CORRECTION : "module.exports = { validatePayinParams }" supprimé
//                L'export nommé "export function" ci-dessus suffit
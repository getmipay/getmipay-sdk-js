// =============================================================================
// Fichier      : src/services/Payments.js
// Description  : Service gérant toutes les opérations liées aux paiements.
//                C'est le point d'entrée principal pour le développeur :
//                  - payments.payin()     → initier un paiement entrant
//                  - payments.getStatus() → vérifier le statut d'un paiement
// =============================================================================

import HttpClient from '../http/client.js';
import Signature  from '../auth/signature.js';
import Payment    from '../models/Payment.js';
import Response   from '../models/Response.js';
import { ValidationError, ApiError } from '../utils/errors.js';
import { validatePayinParams }       from '../utils/validators.js';

class Payments {
  /**
   * Initialise le service Payments avec la configuration SDK.
   * Le client HTTP est instancié ici et réutilisé pour toutes les requêtes.
   *
   * @param {import('../config.js').default} config - Instance de configuration du SDK.
   */
  constructor(config) {
    this.config = config;
    this.http   = new HttpClient(config); // Client HTTP axios configuré
  }

  // ---------------------------------------------------------------------------
  // MÉTHODE : payin
  // ---------------------------------------------------------------------------

  /**
   * Initie un paiement entrant (PayIn) via l'API GetMiPay.
   *
   * Étapes internes :
   *   1. Validation des paramètres obligatoires
   *   2. Construction du payload via le modèle Payment
   *   3. Génération des headers signés (HMAC-SHA256)
   *   4. Envoi de la requête POST à /payments/payin
   *   5. Retour de la réponse normalisée via le modèle Response
   *
   * @param {Object} params
   * @param {number} params.amount           - Montant du paiement.
   * @param {string} params.currency         - Code devise ISO (ex: 'XOF').
   * @param {string} params.wallet           - Numéro de portefeuille mobile money.
   * @param {string} [params.customer_name]  - Nom du client.
   * @param {string} [params.customer_email] - Email du client.
   * @param {string} [params.description]    - Description libre du paiement.
   * @param {string} params.callback_url     - URL de webhook pour la notification.
   *
   * @returns {Promise<Response>} Réponse normalisée contenant référence et statut.
   * @throws {ValidationError}   Si un champ obligatoire est manquant ou invalide.
   * @throws {ApiError}          Si l'API retourne une erreur HTTP.
   */
  async payin(params) {
    // Étape 1 : Valider les paramètres avant tout appel réseau
    validatePayinParams(params);

    // Étape 2 : Construire le payload structuré via le modèle Payment
    const payment = new Payment(params);
    const payload = payment.toJSON(); // Objet JSON propre à envoyer à l'API

    // Étape 3 : Définir le chemin et la méthode HTTP
    const path   = '/payments/payin';
    const method = 'POST';

    // Générer les headers d'authentification signés pour cette requête
    const headers = Signature.getHeaders(this.config.apiKey, method, path, payload);

    try {
      // Étape 4 : Envoyer la requête POST
      const data = await this.http.post(path, payload, headers);

      // Étape 5 : Retourner la réponse encapsulée dans le modèle Response
      return new Response(data);
    } catch (error) {
      // Relancer uniquement les ApiError (les ValidationError ne passent pas ici)
      throw new ApiError(error.message, error.statusCode || 0);
    }
  }

  // ---------------------------------------------------------------------------
  // MÉTHODE : getStatus
  // ---------------------------------------------------------------------------

  /**
   * Récupère le statut actuel d'un paiement via sa référence unique.
   * Utile pour un polling manuel ou après réception d'un webhook.
   *
   * @param {string} reference - Référence du paiement (ex: 'GMP-123456').
   * @returns {Promise<Response>} Réponse normalisée avec le statut à jour.
   * @throws {ValidationError}   Si la référence est absente.
   * @throws {ApiError}          Si l'API retourne une erreur HTTP.
   */
  async getStatus(reference) {
    // Valider que la référence est fournie
    if (!reference) {
      throw new ValidationError('Payment reference is required to get status.');
    }

    const path   = `/payments/${reference}/status`;
    const method = 'GET';

    // Headers signés (pas de body pour un GET)
    const headers = Signature.getHeaders(this.config.apiKey, method, path);

    try {
      const data = await this.http.get(path, headers);
      return new Response(data);
    } catch (error) {
      throw new ApiError(error.message, error.statusCode || 0);
    }
  }
}

export default Payments;
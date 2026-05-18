// =============================================================================
// Fichier      : src/models/Response.js
// Description  : Modèle représentant une réponse standard retournée par l'API.
//                Encapsule les champs communs à toutes les réponses GetMiPay
//                pour offrir une interface cohérente au développeur.
// =============================================================================

class Response {
  /**
   * Crée une instance Response à partir du corps JSON brut retourné par l'API.
   *
   * @param {Object} data
   * @param {string} data.reference  - Référence unique du paiement (ex: 'GMP-123456').
   * @param {string} data.status     - Statut du paiement ('pending', 'success', 'failed').
   * @param {number} data.amount     - Montant du paiement.
   * @param {string} data.currency   - Code devise ISO 4217.
   * @param {string} data.created_at - Date/heure de création au format ISO 8601.
   */
  constructor(data) {
    this.reference  = data.reference;
    this.status     = data.status;
    this.amount     = data.amount;
    this.currency   = data.currency;
    this.created_at = data.created_at;

    // Conserver les éventuels champs supplémentaires retournés par l'API
    // (flexibilité lors des évolutions de l'API sans casser le SDK)
    this.raw = data;
  }

  /**
   * Vérifie si le paiement est dans un état terminal de succès.
   * @returns {boolean}
   */
  isSuccess() {
    return this.status === 'success';
  }

  /**
   * Vérifie si le paiement est encore en attente de traitement.
   * @returns {boolean}
   */
  isPending() {
    return this.status === 'pending';
  }

  /**
   * Vérifie si le paiement a échoué.
   * @returns {boolean}
   */
  isFailed() {
    return this.status === 'failed';
  }
}

// ✅ CORRECTION : "module.exports = Response" remplacé par export ESM
export default Response;
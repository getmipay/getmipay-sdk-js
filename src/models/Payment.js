// =============================================================================
// Fichier      : src/models/Payment.js
// Description  : Modèle représentant un paiement dans le SDK GetMiPay.
//                Utilisé pour structurer les paramètres avant envoi à l'API,
//                en garantissant un format cohérent et des valeurs par défaut.
// =============================================================================

class Payment {
  /**
   * Crée une instance Payment à partir des paramètres bruts du développeur.
   * Applique les valeurs par défaut pour les champs optionnels.
   *
   * @param {Object} params
   * @param {number} params.amount           - Montant du paiement (ex: 5000).
   * @param {string} params.currency         - Code devise ISO 4217 (ex: 'XOF').
   * @param {string} params.wallet           - Numéro de portefeuille mobile money.
   * @param {string} [params.customer_name]  - Nom du client (optionnel).
   * @param {string} [params.customer_email] - Email du client (optionnel).
   * @param {string} [params.description]    - Description du paiement (optionnel).
   * @param {string} params.callback_url     - URL de webhook pour la notification.
   */
  constructor(params) {
    this.amount         = params.amount;
    this.currency       = params.currency;
    this.wallet         = params.wallet;
    this.customer_name  = params.customer_name  || ''; // Défaut : chaîne vide
    this.customer_email = params.customer_email || ''; // Défaut : chaîne vide
    this.description    = params.description    || ''; // Défaut : chaîne vide
    this.callback_url   = params.callback_url;
  }

  /**
   * Sérialise le paiement en objet JSON pur, prêt à être envoyé à l'API.
   * @returns {Object} Représentation JSON du paiement.
   */
  toJSON() {
    return {
      amount         : this.amount,
      currency       : this.currency,
      wallet         : this.wallet,
      customer_name  : this.customer_name,
      customer_email : this.customer_email,
      description    : this.description,
      callback_url   : this.callback_url,
    };
  }
}

// ✅ CORRECTION : "module.exports = Payment" remplacé par export ESM
export default Payment;
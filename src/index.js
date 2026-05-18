// =============================================================================
// Fichier      : src/index.js
// Description  : Point d'entrée principal du SDK GetMiPay.
//                Expose la classe GetMiPay qui regroupe tous les services
//                disponibles (payments, cards, etc.) sous une interface unifiée.
//
// Usage :
//   const { GetMiPay } = require('@getmipay/sdk');
//   const mipay = new GetMiPay({ apiKey: 'gmp_sk_...', environment: 'sandbox' });
//   const result = await mipay.payments.payin({ ... });
// =============================================================================

const Config   = require('./config');
const Payments = require('./services/Payments');

class GetMiPay {
  /**
   * Crée une instance du SDK GetMiPay et initialise tous les services.
   * La configuration est validée immédiatement au constructeur pour
   * signaler toute erreur de setup dès l'initialisation.
   *
   * @param {Object} options
   * @param {string} options.apiKey                  - Clé API GetMiPay (obligatoire).
   * @param {'sandbox'|'production'} [options.environment='sandbox'] - Environnement.
   * @param {number} [options.timeout=30000]         - Timeout HTTP en ms.
   *
   * @throws {Error} Si la clé API est absente ou l'environnement invalide.
   */
  constructor(options = {}) {
    // Instancier et valider la configuration
    this.config = new Config(options);
    this.config.validate(); // Lève une erreur immédiatement si config invalide

    // Initialiser le service Payments, accessible via mipay.payments
    this.payments = new Payments(this.config);

    // Note : d'autres services (cards, payouts) seront ajoutés ici
    // this.cards = new Cards(this.config);
  }
}

// Export CommonJS (require) — compatibilité Node.js
module.exports = { GetMiPay };

// Export default pour compatibilité ES Module (import)
module.exports.default = GetMiPay;
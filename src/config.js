// =============================================================================
// Fichier      : src/config.js
// Description  : Configuration centrale du SDK GetMiPay.
//                Gère les options d'initialisation, les valeurs par défaut,
//                et la validation des paramètres obligatoires.
// =============================================================================

export default class Config {
  /**
   * Initialise la configuration du SDK.
   *
   * @param {Object} [options={}]
   * @param {string} [options.apiKey]       - Clé API GetMiPay (priorité sur la variable d'env).
   * @param {string} [options.environment]  - 'sandbox' (défaut) ou 'production'.
   * @param {number} [options.timeout]      - Timeout HTTP en ms (défaut : 30000).
   */
  constructor(options = {}) {
    this.apiKey      = options.apiKey      || process.env.GMP_API_KEY;
    this.environment = options.environment || 'sandbox';
    this.timeout     = options.timeout     || 30000;

this.baseUrl = this.environment === 'production'
  ? 'https://getmipay.com/api/v1'
  : 'https://sandbox.getmipay.com/api/v1';

    this.version = '1.0.0';
  }

  /**
   * Valide que la configuration est correcte avant toute utilisation du SDK.
   * @throws {Error} Si la clé API est absente ou si l'environnement est invalide.
   */
  validate() {
    if (!this.apiKey) {
      throw new Error(
        'API key is required. Set GMP_API_KEY or pass apiKey in config.'
      );
    }

    if (!['sandbox', 'production'].includes(this.environment)) {
      throw new Error('Environment must be "sandbox" or "production"');
    }
  }
}
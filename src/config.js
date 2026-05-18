// =============================================================================
// Fichier      : src/config.js
// Description  : Gestionnaire de configuration du SDK GetMiPay.
//                Gère la clé API, l'environnement (sandbox/production),
//                le timeout et construit l'URL de base correspondante.
// =============================================================================

class Config {
  /**
   * Crée une instance de configuration.
   *
   * @param {Object} options              - Options de configuration.
   * @param {string} options.apiKey       - Clé API GetMiPay (obligatoire).
   * @param {string} [options.environment='sandbox'] - 'sandbox' ou 'production'.
   * @param {number} [options.timeout=30000]         - Timeout HTTP en millisecondes.
   */
  constructor(options = {}) {
    // Clé API : priorité à l'option passée, sinon variable d'environnement
    this.apiKey = options.apiKey || process.env.GMP_API_KEY;

    // Environnement d'exécution (sandbox par défaut pour éviter tout risque)
    this.environment = options.environment || 'sandbox';

    // Timeout des requêtes HTTP (30 secondes par défaut)
    this.timeout = options.timeout || 30000;

    // URL de base déterminée selon l'environnement
    this.baseUrl = this.environment === 'production'
      ? 'https://api.getmipay.com/v1'       // URL de production réelle
      : 'https://sandbox.getmipay.com/v1';  // URL sandbox pour les tests

    // Version du SDK (injectée dans les headers pour le suivi)
    this.version = '1.0.0';
  }

  /**
   * Valide la configuration avant toute requête.
   * Lève une erreur si la clé API est absente ou si l'environnement est invalide.
   *
   * @throws {Error} Si la clé API est manquante ou l'environnement incorrect.
   */
  validate() {
    // La clé API est obligatoire pour authentifier les requêtes
    if (!this.apiKey) {
      throw new Error(
        'API key is required. Set GMP_API_KEY or pass apiKey in config.'
      );
    }

    // Seuls deux environnements sont supportés
    if (!['sandbox', 'production'].includes(this.environment)) {
      throw new Error('Environment must be "sandbox" or "production"');
    }
  }
}

module.exports = Config;
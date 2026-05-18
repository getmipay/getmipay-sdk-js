// =============================================================================
// Fichier      : types/index.d.ts
// Description  : Définitions TypeScript du SDK GetMiPay.
//                Permet une autocomplétion et une vérification de types complètes
//                dans les projets TypeScript ou VS Code (via IntelliSense).
// =============================================================================

declare module '@getmipay/sdk' {

  // ---------------------------------------------------------------------------
  // Interfaces de configuration
  // ---------------------------------------------------------------------------

  /** Options passées au constructeur GetMiPay. */
  interface ConfigOptions {
    /** Clé API GetMiPay (obligatoire). Format : 'gmp_sk_...' */
    apiKey: string;
    /** Environnement d'exécution. Défaut : 'sandbox'. */
    environment?: 'sandbox' | 'production';
    /** Timeout des requêtes HTTP en millisecondes. Défaut : 30000. */
    timeout?: number;
  }

  // ---------------------------------------------------------------------------
  // Interfaces des paramètres de paiement
  // ---------------------------------------------------------------------------

  /** Paramètres d'un paiement entrant (PayIn). */
  interface PayInParams {
    /** Montant du paiement (entier ou décimal selon la devise). */
    amount: number;
    /** Code devise ISO 4217 (ex: 'XOF', 'EUR', 'USD'). */
    currency: string;
    /** Numéro du portefeuille mobile money (ex: '+2250700000000'). */
    wallet: string;
    /** Nom complet du client (optionnel). */
    customer_name?: string;
    /** Adresse email du client (optionnel). */
    customer_email?: string;
    /** Description libre du paiement (optionnel). */
    description?: string;
    /** URL de webhook appelée par GetMiPay après traitement du paiement. */
    callback_url: string;
  }

  // ---------------------------------------------------------------------------
  // Interface de réponse
  // ---------------------------------------------------------------------------

  /** Structure de la réponse retournée par l'API GetMiPay. */
  interface PaymentResponse {
    /** Référence unique du paiement (ex: 'GMP-123456'). */
    reference: string;
    /** Statut courant : 'pending' | 'success' | 'failed'. */
    status: string;
    /** Montant du paiement. */
    amount: number;
    /** Code devise ISO 4217. */
    currency: string;
    /** Date/heure de création au format ISO 8601. */
    created_at: string;
    /** Données brutes complètes retournées par l'API. */
    raw: Record<string, unknown>;
    /** Retourne true si le statut est 'success'. */
    isSuccess(): boolean;
    /** Retourne true si le statut est 'pending'. */
    isPending(): boolean;
    /** Retourne true si le statut est 'failed'. */
    isFailed(): boolean;
  }

  // ---------------------------------------------------------------------------
  // Classe principale du SDK
  // ---------------------------------------------------------------------------

  class GetMiPay {
    /**
     * Crée une instance du SDK GetMiPay.
     * @param options - Options de configuration (apiKey obligatoire).
     */
    constructor(options: ConfigOptions);

    /** Service de gestion des paiements. */
    payments: {
      /**
       * Initie un paiement entrant (PayIn).
       * @param params - Paramètres du paiement.
       * @returns Promesse résolue avec la réponse de l'API.
       */
      payin(params: PayInParams): Promise<PaymentResponse>;

      /**
       * Récupère le statut d'un paiement existant.
       * @param reference - Référence unique du paiement.
       * @returns Promesse résolue avec le statut à jour.
       */
      getStatus(reference: string): Promise<PaymentResponse>;
    };
  }

  export { GetMiPay, ConfigOptions, PayInParams, PaymentResponse };
}
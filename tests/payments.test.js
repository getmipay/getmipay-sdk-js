// =============================================================================
// Fichier      : tests/payments.test.js
// Description  : Tests unitaires pour le service Payments.
//                Le client HTTP est mocké pour éviter tout appel réseau réel.
//                Vérifie : validation, construction du payload, gestion d'erreurs.
// =============================================================================

// Mock axios pour intercepter tous les appels HTTP
jest.mock('axios');
const axios = require('axios');

const { GetMiPay }      = require('../src/index');
const { ValidationError, ApiError } = require('../src/utils/errors');

// ---------------------------------------------------------------------------
// Setup : configuration SDK de test
// ---------------------------------------------------------------------------

// Réponse simulée renvoyée par l'API sandbox
const MOCK_PAYIN_RESPONSE = {
  reference  : 'GMP-TEST-001',
  status     : 'pending',
  amount     : 5000,
  currency   : 'XOF',
  created_at : '2024-01-01T00:00:00Z',
};

// Paramètres valides réutilisés dans les tests
const VALID_PARAMS = {
  amount        : 5000,
  currency      : 'XOF',
  wallet        : '+2250700000000',
  customer_name : 'Test User',
  customer_email: 'test@example.com',
  description   : 'Test payment',
  callback_url  : 'https://yourapp.com/webhook',
};

describe('Payments Service', () => {
  let mipay;

  // Avant chaque test : créer une instance SDK fraîche et configurer le mock axios
  beforeEach(() => {
    jest.clearAllMocks();

    // Simuler axios.create() → retourner un objet avec .post() et .get() mockés
    axios.create.mockReturnValue({
      post: jest.fn().mockResolvedValue({ data: MOCK_PAYIN_RESPONSE }),
      get : jest.fn().mockResolvedValue({ data: MOCK_PAYIN_RESPONSE }),
    });

    mipay = new GetMiPay({
      apiKey      : 'gmp_sk_test_abc123',
      environment : 'sandbox',
    });
  });

  // ---------------------------------------------------------------------------
  // Tests de payin()
  // ---------------------------------------------------------------------------

  describe('payin()', () => {

    it('doit initier un paiement avec des paramètres valides', async () => {
      const response = await mipay.payments.payin(VALID_PARAMS);

      // Vérifier que la réponse contient les champs attendus
      expect(response.reference).toBe('GMP-TEST-001');
      expect(response.status).toBe('pending');
      expect(response.amount).toBe(5000);
      expect(response.currency).toBe('XOF');
    });

    it('doit retourner un objet Response avec les méthodes utilitaires', async () => {
      const response = await mipay.payments.payin(VALID_PARAMS);

      expect(typeof response.isPending).toBe('function');
      expect(typeof response.isSuccess).toBe('function');
      expect(typeof response.isFailed).toBe('function');
      expect(response.isPending()).toBe(true);
    });

    it('doit lever ValidationError si "amount" est absent', async () => {
      const params = { ...VALID_PARAMS };
      delete params.amount;

      await expect(mipay.payments.payin(params))
        .rejects.toThrow(ValidationError);
    });

    it('doit lever ValidationError si "currency" est absent', async () => {
      await expect(mipay.payments.payin({ ...VALID_PARAMS, currency: undefined }))
        .rejects.toThrow(ValidationError);
    });

    it('doit lever ValidationError si "wallet" est absent', async () => {
      await expect(mipay.payments.payin({ ...VALID_PARAMS, wallet: undefined }))
        .rejects.toThrow(ValidationError);
    });

    it('doit lever ValidationError si "callback_url" est absent', async () => {
      await expect(mipay.payments.payin({ ...VALID_PARAMS, callback_url: undefined }))
        .rejects.toThrow(ValidationError);
    });

    it('doit lever ValidationError si "amount" est négatif', async () => {
      await expect(mipay.payments.payin({ ...VALID_PARAMS, amount: -100 }))
        .rejects.toThrow(ValidationError);
    });

    it('doit lever ValidationError si "currency" n\'est pas un code ISO valide', async () => {
      await expect(mipay.payments.payin({ ...VALID_PARAMS, currency: 'euro' }))
        .rejects.toThrow(ValidationError);
    });

    it('doit lever ValidationError si "callback_url" est une URL invalide', async () => {
      await expect(mipay.payments.payin({ ...VALID_PARAMS, callback_url: 'not-a-url' }))
        .rejects.toThrow(ValidationError);
    });

    it('doit fonctionner sans les champs optionnels', async () => {
      const minimalParams = {
        amount       : 5000,
        currency     : 'XOF',
        wallet       : '+2250700000000',
        callback_url : 'https://yourapp.com/webhook',
      };
      const response = await mipay.payments.payin(minimalParams);
      expect(response.reference).toBe('GMP-TEST-001');
    });
  });

  // ---------------------------------------------------------------------------
  // Tests de getStatus()
  // ---------------------------------------------------------------------------

  describe('getStatus()', () => {

    it('doit retourner le statut d\'un paiement existant', async () => {
      const response = await mipay.payments.getStatus('GMP-TEST-001');
      expect(response.reference).toBe('GMP-TEST-001');
      expect(response.status).toBe('pending');
    });

    it('doit lever ValidationError si la référence est absente', async () => {
      await expect(mipay.payments.getStatus(''))
        .rejects.toThrow(ValidationError);
    });

    it('doit lever ValidationError si la référence est undefined', async () => {
      await expect(mipay.payments.getStatus(undefined))
        .rejects.toThrow(ValidationError);
    });
  });

  // ---------------------------------------------------------------------------
  // Tests de configuration
  // ---------------------------------------------------------------------------

  describe('Configuration', () => {

    it('doit lever une erreur si la clé API est absente', () => {
      expect(() => new GetMiPay({ environment: 'sandbox' }))
        .toThrow('API key is required');
    });

    it('doit lever une erreur si l\'environnement est invalide', () => {
      expect(() => new GetMiPay({ apiKey: 'gmp_sk_test', environment: 'staging' }))
        .toThrow('Environment must be');
    });
  });
});
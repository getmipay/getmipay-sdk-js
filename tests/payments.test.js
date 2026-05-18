// =============================================================================
// Fichier      : tests/payments.test.js
// Description  : Tests du service Payments du SDK GetMiPay.
//
// ✅ CORRECTIONS ESM :
//   - "jest.mock('axios')" → "jest.unstable_mockModule('axios', ...)" (ESM natif)
//   - Les imports dynamiques DOIVENT être après le mock (ordre impératif en ESM)
//   - "import { create } from 'axios'" supprimé (axios est entièrement mocké)
// =============================================================================
import { jest } from '@jest/globals';


jest.unstable_mockModule('axios', () => {
  const mockAxiosInstance = {
    post: jest.fn(),
    get: jest.fn(),
  };

  return {
    default: {
      create: jest.fn(() => mockAxiosInstance),
    },
  };
});

// import après mock
const { default: HttpClient } = await import('../src/http/client.js');

describe('HttpClient', () => {
  test('should create client', () => {
    const config = {
      baseUrl: 'https://api.test.com',
      timeout: 5000,
    };

    const client = new HttpClient(config);

    expect(client).toBeDefined();
  });
});
// Étape 1 : Déclarer le mock AVANT tout import dynamique (règle ESM stricte)
jest.unstable_mockModule('axios', () => {
  const mockAxiosInstance = {
    post: jest.fn(),
    get:  jest.fn(),
  };
  return {
    default: {
      create: jest.fn(() => mockAxiosInstance),
    },
  };
});

// Étape 2 : Importer les modules APRÈS le mock (imports dynamiques obligatoires en ESM)
const { default: axios }      = await import('axios');
const { GetMiPay }            = await import('../src/index.js');
const { ValidationError }     = await import('../src/utils/errors.js');

// ---------------------------------------------------------------------------
// Données de test
// ---------------------------------------------------------------------------

const MOCK_PAYIN_RESPONSE = {
  reference  : 'GMP-TEST-001',
  status     : 'pending',
  amount     : 500,
  currency   : 'XAF',
  created_at : '2024-01-01T00:00:00Z',
};

const VALID_PARAMS = {
  amount         : 500,
  currency       : 'XAF',
  wallet         : '652083096',
  customer_name  : 'Test User',
  customer_email : 'test@example.com',
  description    : 'Test payment',
  callback_url   : 'https://yourapp.com/webhook',
};

// ---------------------------------------------------------------------------
// Suite de tests
// ---------------------------------------------------------------------------

describe('Payments Service', () => {
  let mipay;
  let mockAxiosInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Récupérer l'instance mockée retournée par axios.create()
    mockAxiosInstance = axios.create();

    // Configurer les réponses par défaut
    mockAxiosInstance.post.mockResolvedValue({ data: MOCK_PAYIN_RESPONSE });
    mockAxiosInstance.get.mockResolvedValue({ data: MOCK_PAYIN_RESPONSE });

    mipay = new GetMiPay({
      apiKey      : process.env.GMP_API_KEY,
      environment : 'production',
    });
  });

  // -------------------------------------------------------------------------
  // payin — cas de succès
  // -------------------------------------------------------------------------

  test('payin() retourne la référence correcte en cas de succès', async () => {
    const response = await mipay.payments.payin(VALID_PARAMS);
    expect(response.reference).toBe('GMP-TEST-001');
  });

  test('payin() retourne le bon statut', async () => {
    const response = await mipay.payments.payin(VALID_PARAMS);
    expect(response.status).toBe('pending');
    expect(response.isPending()).toBe(true);
    expect(response.isSuccess()).toBe(false);
  });

  test('payin() appelle axios.post avec le bon chemin', async () => {
    await mipay.payments.payin(VALID_PARAMS);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      '/payments/payin',
      expect.objectContaining({ amount: 500, currency: 'XAF' }),
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  // -------------------------------------------------------------------------
  // payin — erreurs de validation
  // -------------------------------------------------------------------------

  test('payin() lève ValidationError si amount manquant', async () => {
    const params = { ...VALID_PARAMS };
    delete params.amount;
    await expect(mipay.payments.payin(params)).rejects.toThrow(ValidationError);
  });

  test('payin() lève ValidationError si currency manquante', async () => {
    const params = { ...VALID_PARAMS };
    delete params.currency;
    await expect(mipay.payments.payin(params)).rejects.toThrow(ValidationError);
  });

  test('payin() lève ValidationError si wallet manquant', async () => {
    const params = { ...VALID_PARAMS };
    delete params.wallet;
    await expect(mipay.payments.payin(params)).rejects.toThrow(ValidationError);
  });

  test('payin() lève ValidationError si callback_url manquante', async () => {
    const params = { ...VALID_PARAMS };
    delete params.callback_url;
    await expect(mipay.payments.payin(params)).rejects.toThrow(ValidationError);
  });

  test('payin() lève ValidationError si amount est négatif', async () => {
    await expect(
      mipay.payments.payin({ ...VALID_PARAMS, amount: -100 })
    ).rejects.toThrow(ValidationError);
  });

  test('payin() lève ValidationError si currency invalide', async () => {
    await expect(
      mipay.payments.payin({ ...VALID_PARAMS, currency: 'xaf' }) // minuscules
    ).rejects.toThrow(ValidationError);
  });

  // -------------------------------------------------------------------------
  // getStatus
  // -------------------------------------------------------------------------

  test('getStatus() retourne la réponse correcte', async () => {
    const response = await mipay.payments.getStatus('GMP-TEST-001');
    expect(response.reference).toBe('GMP-TEST-001');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      '/payments/GMP-TEST-001/status',
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  test('getStatus() lève ValidationError si référence absente', async () => {
    await expect(mipay.payments.getStatus('')).rejects.toThrow(ValidationError);
  });
});
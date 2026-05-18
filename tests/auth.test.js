// =============================================================================
// Fichier      : tests/auth.test.js
// Description  : Tests unitaires pour le module de signature HMAC-SHA256.
//                Vérifie que les signatures sont correctement générées
//                et que les headers sont complets et cohérents.
// =============================================================================

import Signature from '../src/auth/signature.js';
import crypto from 'crypto';

describe('Signature', () => {

  // Données fixes utilisées dans tous les tests
  const API_KEY   = process.env.GMP_API_KEY;
  const METHOD    = 'POST';
  const PATH      = '/payments/payin';
  const TIMESTAMP = '1700000000';
  const BODY      = '{"amount":5000,"currency":"XOF"}';

  // ---------------------------------------------------------------------------
  // Tests de generate()
  // ---------------------------------------------------------------------------

  describe('generate()', () => {

    it('doit retourner une chaîne hexadécimale non vide', () => {
      const sig = Signature.generate(API_KEY, METHOD, PATH, TIMESTAMP, BODY);
      // La signature HMAC-SHA256 fait toujours 64 caractères hexadécimaux
      expect(sig).toMatch(/^[a-f0-9]{64}$/);
    });

    it('doit produire la même signature pour les mêmes entrées (déterministe)', () => {
      const sig1 = Signature.generate(API_KEY, METHOD, PATH, TIMESTAMP, BODY);
      const sig2 = Signature.generate(API_KEY, METHOD, PATH, TIMESTAMP, BODY);
      expect(sig1).toBe(sig2);
    });

    it('doit produire des signatures différentes si le timestamp change', () => {
      const sig1 = Signature.generate(API_KEY, METHOD, PATH, '1700000000', BODY);
      const sig2 = Signature.generate(API_KEY, METHOD, PATH, '1700000001', BODY);
      expect(sig1).not.toBe(sig2);
    });

    it('doit produire des signatures différentes si la clé API change', () => {
      const sig1 = Signature.generate('key_A', METHOD, PATH, TIMESTAMP, BODY);
      const sig2 = Signature.generate('key_B', METHOD, PATH, TIMESTAMP, BODY);
      expect(sig1).not.toBe(sig2);
    });

    it('doit accepter un body vide (requêtes GET)', () => {
      const sig = Signature.generate(API_KEY, 'GET', '/payments/ref/status', TIMESTAMP, '');
      expect(sig).toMatch(/^[a-f0-9]{64}$/);
    });

    it('doit correspondre à un calcul HMAC-SHA256 manuel', () => {
      // Recalcul manuel pour vérifier l'algorithme
      const stringToSign = `${METHOD}\n${PATH}\n${TIMESTAMP}\n${BODY}`;
      const expected = crypto
        .createHmac('sha256', API_KEY)
        .update(stringToSign)
        .digest('hex');

      const result = Signature.generate(API_KEY, METHOD, PATH, TIMESTAMP, BODY);
      expect(result).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // Tests de getHeaders()
  // ---------------------------------------------------------------------------

  describe('getHeaders()', () => {

    it('doit retourner tous les headers requis', () => {
      const headers = Signature.getHeaders(API_KEY, METHOD, PATH, { amount: 5000 });

      expect(headers).toHaveProperty('x-api-key');
      expect(headers).toHaveProperty('x-timestamp');
      expect(headers).toHaveProperty('x-signature');
      expect(headers).toHaveProperty('Content-Type', 'application/json');
      expect(headers).toHaveProperty('x-sdk-version', '1.0.0');
      expect(headers).toHaveProperty('x-sdk-language', 'javascript');
    });

    it('doit inclure la clé API dans le header x-api-key', () => {
      const headers = Signature.getHeaders(API_KEY, METHOD, PATH, {});
      expect(headers['x-api-key']).toBe(API_KEY);
    });

    it('doit générer un timestamp numérique récent (Unix secondes)', () => {
      const before  = Math.floor(Date.now() / 1000);
      const headers = Signature.getHeaders(API_KEY, METHOD, PATH, {});
      const after   = Math.floor(Date.now() / 1000);

      const ts = parseInt(headers['x-timestamp'], 10);
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });

    it('doit générer une signature hex valide dans x-signature', () => {
      const headers = Signature.getHeaders(API_KEY, METHOD, PATH, { amount: 5000 });
      expect(headers['x-signature']).toMatch(/^[a-f0-9]{64}$/);
    });

    it('doit gérer un body vide pour les requêtes GET', () => {
      // Appel sans body (GET)
      const headers = Signature.getHeaders(API_KEY, 'GET', '/payments/ref/status');
      expect(headers['x-signature']).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
# @getmipay/sdk — SDK JavaScript/Node.js officiel

SDK officiel GetMiPay pour Node.js. Intégrez les paiements mobile money en quelques lignes.

---

## Installation

```bash
npm install @getmipay/sdk
```

---

## Démarrage rapide

```javascript
const { GetMiPay } = require('@getmipay/sdk');

const mipay = new GetMiPay({
  apiKey     : 'gmp_sk_test_xxxxxxxxxxxx',
  environment: 'sandbox', // 'production' pour la mise en production
});

const payment = await mipay.payments.payin({
  amount        : 5000,
  currency      : 'XOF',
  wallet        : '+2250700000000',
  service       : 1, // MTN=1, Orange=2
  customer_name : 'Jean Dupont',
  callback_url  : 'https://yourapp.com/webhook',
});

console.log(payment.reference); // 'GMP-123456'
console.log(payment.status);    // 'pending'
```

---

## Configuration

| Option        | Type     | Défaut      | Description                          |
|---------------|----------|-------------|--------------------------------------|
| `apiKey`      | `string` | —           | **Obligatoire.** Clé API GetMiPay.   |
| `environment` | `string` | `'sandbox'` | `'sandbox'` ou `'production'`.       |
| `timeout`     | `number` | `30000`     | Timeout HTTP en millisecondes.       |

Variable d'environnement alternative : `GMP_API_KEY`.

---

## API Reference

### `payments.payin(params)`

| Paramètre        | Type     | Requis | Description                    |
|------------------|----------|--------|--------------------------------|
| `amount`         | `number` | ✅     | Montant du paiement.           |
| `currency`       | `string` | ✅     | Code ISO 4217 (ex: `XOF`).    |
| `wallet`         | `string` | ✅     | Numéro mobile money.           |
| `service`        | `number|string` | ✅ | Service mobile money : `1`/`MTN`, `2`/`Orange`. |
| `callback_url`   | `string` | ✅     | URL de webhook.                |
| `customer_name`  | `string` | —      | Nom du client.                 |
| `customer_email` | `string` | —      | Email du client.               |
| `description`    | `string` | —      | Description libre.             |

### `payments.getStatus(params)`

Récupère le statut direct d'un paiement.

---

Exemple de vérification de statut direct :

```javascript
const status = await mipay.payments.getStatus({
  order_id : 'MPAYIN_ABC123DEF456',
  pay_id   : 'MLS690d472dd7ee7B',
  service  : 1, // MTN=1, Orange=2
});
```

## Gestion des erreurs

```javascript
try {
  const payment = await mipay.payments.payin({ ... });
} catch (error) {
  if (error.name === 'ValidationError') {
    console.error('Paramètre invalide :', error.message);
  } else if (error.name === 'ApiError') {
    console.error('Erreur API :', error.message, '— HTTP', error.statusCode);
  }
}
```

---

## Lancer les tests

```bash
npm test
```

---

## License

MIT — GetMiPay

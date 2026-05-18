// =============================================================================
// Fichier      : examples/webhook-handler.js
// Description  : Exemple de serveur Express pour recevoir les notifications
//                webhook envoyées par GetMiPay après traitement d'un paiement.
//                GetMiPay appelle votre callback_url avec le statut final.
//
// Exécution :
//   npm install express  (si non installé)
//   node examples/webhook-handler.js
// =============================================================================

const http = require('http');

// ---------------------------------------------------------------------------
// Serveur HTTP minimal (sans Express pour éviter une dépendance supplémentaire)
// ---------------------------------------------------------------------------
const server = http.createServer((req, res) => {

  // Accepter uniquement les requêtes POST sur /webhook
  if (req.method === 'POST' && req.url === '/webhook') {

    let body = '';

    // Lire le corps de la requête en streaming
    req.on('data', chunk => {
      body += chunk.toString();
    });

    // Traitement une fois le corps complet reçu
    req.on('end', () => {
      try {
        // Parser le JSON envoyé par GetMiPay
        const payload = JSON.parse(body);

        console.log('\n📩 Webhook reçu de GetMiPay :');
        console.log('-------------------------------');
        console.log('Référence :', payload.reference);
        console.log('Statut    :', payload.status);
        console.log('Montant   :', payload.amount, payload.currency);
        console.log('-------------------------------\n');

        // Traitement selon le statut du paiement
        switch (payload.status) {
          case 'success':
            console.log('✅ Paiement réussi → activer le service pour le client.');
            // TODO : Mettre à jour votre base de données, envoyer un email, etc.
            break;

          case 'failed':
            console.log('❌ Paiement échoué → notifier le client et proposer une relance.');
            // TODO : Marquer la commande comme échouée, notifier le client.
            break;

          case 'pending':
            console.log('⏳ Paiement toujours en attente.');
            break;

          default:
            console.log('⚠️  Statut inconnu :', payload.status);
        }

        // Répondre 200 OK à GetMiPay pour confirmer la réception
        // IMPORTANT : Toujours répondre 200, sinon GetMiPay réessaie le webhook.
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true }));

      } catch (err) {
        // Corps JSON invalide
        console.error('❌ Erreur parsing webhook :', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });

  } else {
    // Route non gérée
    res.writeHead(404);
    res.end('Not found');
  }
});

// Démarrer le serveur sur le port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Webhook handler démarré sur http://localhost:${PORT}/webhook`);
  console.log('   En attente de notifications GetMiPay...\n');
});
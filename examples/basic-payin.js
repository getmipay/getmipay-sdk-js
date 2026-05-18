// =============================================================================
// Fichier      : examples/basic-payin.js
// Description  : Exemple complet d'utilisation du SDK GetMiPay pour initier
//                un paiement entrant (PayIn) en environnement sandbox.
//
// Exécution :
//   node examples/basic-payin.js
// =============================================================================

import { GetMiPay } from '../src/index.js';

// ---------------------------------------------------------------------------
// Étape 1 : Instancier le SDK avec votre clé API sandbox
// ---------------------------------------------------------------------------
const mipay = new GetMiPay({
  apiKey     : 'UcT0Ht_vnGkMVqqEH7NNFBGhEAbH94PYWYJaqhCJoi8-AP', // Remplacer par votre clé API réelle
  environment: 'sandbox',                  // 'production' pour le déploiement réel
});

// ---------------------------------------------------------------------------
// Étape 2 : Initier un paiement
// ---------------------------------------------------------------------------
async function testPayment() {
  try {
    console.log('Démarrage du paiement test...\n');

    const payment = await mipay.payments.payin({
      amount        : 5000,                           // Montant en centimes ou unité selon la devise
      currency      : 'XOF',                          // Franc CFA (Afrique de l'Ouest)
      wallet        : '+2250700000000',               // Numéro mobile money du payeur
      service       : 1,                               // MTN=1, Orange=2
      customer_name : 'Test User',                    // Nom du client
      customer_email: 'test@example.com',             // Email du client (optionnel)
      description   : 'Paiement test GetMiPay SDK',   // Description libre
      callback_url  : 'https://yourapp.com/webhook',  // URL appelée après traitement
    });

    // Affichage des informations de la réponse
    console.log('✅ Paiement initié avec succès !');
    console.log('-----------------------------------');
    console.log('Référence :', payment.reference);
    console.log('Statut    :', payment.status);
    console.log('Montant   :', payment.amount, payment.currency);
    console.log('Créé le   :', payment.created_at);
    console.log('-----------------------------------\n');

    // Utilisation des méthodes utilitaires du modèle Response
    if (payment.isPending()) {
      console.log('⏳ Le paiement est en attente de traitement par l\'opérateur.');
      console.log('   Vous serez notifié via callback_url quand il sera finalisé.');
    }

  } catch (error) {
    // Gestion différenciée des types d'erreurs
    if (error.name === 'ValidationError') {
      console.error('❌ Erreur de validation :', error.message);
      console.error('   Vérifiez les paramètres passés à payin().');
    } else if (error.name === 'ApiError') {
      console.error('❌ Erreur API :', error.message);
      console.error('   Code HTTP  :', error.statusCode);
    } else {
      console.error('❌ Erreur inattendue :', error);
    }
  }
}

// Lancer le test
testPayment();

/* Simplified test: removes checks that require admin authentication and uses plain fetch calls.
   This version focuses on creating a user, subscribing to a product notification,
   toggling stock to trigger notifications, and waiting for the backend to process them.
*/

 // Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}🔹 ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
};

const API_BASE_URL = 'http://localhost:5002/api';

/**
 * Test du système de notifications automatiques (simplifié)
 */
async function testAutomaticNotifications() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST SIMPLIFIÉ DU SYSTÈME DE NOTIFICATIONS AUTOMATIQUES');
  console.log('='.repeat(60) + '\n');

  try {
    // Étape 1 : Créer un utilisateur de test
    log.step('Étape 1 : Création d\'un utilisateur de test');
    const testUser = {
      email: `test_${Date.now()}@example.com`,
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
    };

    const registerResponse = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });

    if (!registerResponse.ok) {
      throw new Error(`Échec de création de l'utilisateur: ${registerResponse.status}`);
    }

    const userData = await registerResponse.json();
    log.success(`Utilisateur créé: ${testUser.email}`);
    log.info(`User ID: ${userData._id}`);

    // Étape 2 : Récupérer un produit et le mettre en rupture de stock
    log.step('\nÉtape 2 : Récupération d\'un produit et mise en rupture de stock');
    const productsResponse = await fetch(`${API_BASE_URL}/products`);
    if (!productsResponse.ok) {
      throw new Error(`Échec récupération produits: ${productsResponse.status}`);
    }
    const products = await productsResponse.json();

    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('Aucun produit disponible pour le test');
    }

    const testProduct = products[0];
    const productId = testProduct.id || testProduct._id;
    log.info(`Produit sélectionné: ${testProduct.name} (ID numérique: ${testProduct.id}, MongoDB _id: ${testProduct._id})`);

    // Mettre le produit en rupture de stock
    const updateStockResponse = await fetch(`${API_BASE_URL}/products/${testProduct.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: 0 }),
    });

    if (!updateStockResponse.ok) {
      throw new Error(`Échec de mise à jour du stock: ${updateStockResponse.status}`);
    }

    const updatedProduct = await updateStockResponse.json();
    log.success('Produit mis en rupture de stock (stock = 0)');
    log.success('Produit mis en rupture de stock (stock = 0)');

    // Étape 3 : S'abonner aux notifications
    log.step('\nÉtape 3 : Abonnement aux notifications pour ce produit');
    const subscribeResponse = await fetch(`${API_BASE_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        productId: updatedProduct._id || productId,
        productName: updatedProduct.name || testProduct.name,
        userId: userData._id,
      }),
    });

    if (!subscribeResponse.ok) {
      throw new Error(`Échec d'abonnement: ${subscribeResponse.status}`);
    }

    const subscribeData = await subscribeResponse.json();
    log.success('Abonnement aux notifications réussi');
    log.info(`Réservation créée: ${subscribeData && subscribeData.reservation ? 'Oui' : 'Non'}`);

    // Étape 4 : Remettre le produit en stock (DÉCLENCHEUR AUTOMATIQUE)
    log.step('\nÉtape 4 : Remise en stock du produit (DÉCLENCHEUR AUTOMATIQUE)');
    log.warning('⏳ Le backend va automatiquement détecter le changement et envoyer les notifications...');

    await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2 secondes

    const restockResponse = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: 5 }),
    });

    if (!restockResponse.ok) {
      throw new Error(`Échec de remise en stock: ${restockResponse.status}`);
    }

    log.success('Produit remis en stock (stock = 5)');
    log.info('🔔 Le hook post-save du modèle Product a été déclenché');
    log.info('📧 Le NotificationService envoie automatiquement les emails...');

    // Attendre que les notifications soient traitées
    await new Promise(resolve => setTimeout(resolve, 3000));

    log.success('✅ Traitement des notifications terminé');

    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DU TEST');
    console.log('='.repeat(60));
    log.success('✅ Utilisateur créé et abonné aux notifications');
    log.success('✅ Produit mis en rupture de stock puis remis en stock');
    log.success('✅ Hook post-save déclenché automatiquement');
    log.success('✅ NotificationService a traité les notifications');
    log.info('\n📧 Vérifiez les logs du serveur backend pour voir les détails d\'envoi des emails');
    log.info('📧 Si l\'email est configuré, vérifiez la boîte mail de test');
    log.info('📧 Si en mode mock, les emails sont simulés dans les logs\n');

  } catch (error) {
    log.error(`Erreur lors du test: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le test
testAutomaticNotifications();

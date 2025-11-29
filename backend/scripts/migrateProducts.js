
import admin from 'firebase-admin';
import serviceAccount from '../serviceAccountKey.json' assert { type: 'json' };

// Initialize the Firebase Admin SDK with the explicit Project ID
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'projet-wafi-dev',
});

const db = admin.firestore();
const productsCollection = db.collection('products');

const migrateProducts = async () => {
  // Dynamically import the products data
  const { PRODUCTS } = await import('../constants/products.js');

  console.log('Starting product migration...');

  if (!PRODUCTS || PRODUCTS.length === 0) {
    console.error('No products found in PRODUCTS constant. Aborting.');
    return;
  }

  // Use a batch write for efficiency
  const batch = db.batch();

  for (const product of PRODUCTS) {
    // Use the product's existing 'id' as the document ID in Firestore
    const docRef = productsCollection.doc(String(product.id));
    batch.set(docRef, product);
  }

  try {
    await batch.commit();
    console.log(`✅ Successfully migrated ${PRODUCTS.length} products to Firestore.`);
  } catch (error) {
    console.error('❌ Error committing batch migration:', error);
  }

  console.log('Product migration finished.');
};

migrateProducts().catch(error => {
  console.error("Migration script failed:", error);
});

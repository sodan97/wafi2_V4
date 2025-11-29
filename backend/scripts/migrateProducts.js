
import admin from 'firebase-admin';
import { createRequire } from 'module';

// Import the service account key
import serviceAccount from '../serviceAccountKey.json' assert { type: 'json' };

// Use createRequire to import the CJS module (products.js) into an ES module
const require = createRequire(import.meta.url);
const { PRODUCTS } = require('../constants/products.js');

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const productsCollection = db.collection('products');

const migrateProducts = async () => {
  console.log('Starting product migration...');

  if (!PRODUCTS || PRODUCTS.length === 0) {
    console.error('No products found in PRODUCTS constant. Aborting.');
    return;
  }

  for (const product of PRODUCTS) {
    try {
      // Use the product's existing 'id' as the document ID in Firestore
      const docRef = productsCollection.doc(String(product.id));
      await docRef.set(product);
      console.log(`Successfully migrated product with ID: ${product.id}`);
    } catch (error) {
      console.error(`Error migrating product with ID: ${product.id}`, error);
    }
  }

  console.log('Product migration finished.');
};

migrateProducts();


import admin from 'firebase-admin';
import mongoose from 'mongoose';
import serviceAccount from '../serviceAccountKey.json' assert { type: 'json' };
import Product from '../models/Product.js'; // Import the Mongoose Product model

// --- MongoDB Configuration ---
const MONGO_URI = 'mongodb://localhost:27017/belleza'; // Assurez-vous que cette URI est correcte

// --- Firebase Initialization ---
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
const productsCollection = db.collection('products');

/**
 * This script migrates products from a MongoDB database to Firestore.
 * 1. Connects to MongoDB.
 * 2. Fetches all products using the Mongoose model.
 * 3. Adds each product to the Firestore 'products' collection.
 */
const migrateProducts = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Successfully connected to MongoDB.');

    // 2. Fetch all products from MongoDB
    const allProducts = await Product.find({});
    console.log(`Found ${allProducts.length} products in MongoDB.`);

    if (allProducts.length === 0) {
      console.log('No products to migrate.');
      return;
    }

    // 3. Write products to Firestore
    console.log('Starting migration to Firestore...');
    for (const product of allProducts) {
      // Mongoose adds _id and __v, we create a clean object
      const productData = {
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        stock: product.stock,
        imageUrl: product.imageUrl,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
      await productsCollection.add(productData);
      console.log(`Migrated product: ${product.name}`);
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // 4. Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

migrateProducts();

import dotenv from 'dotenv';
dotenv.config(); // Load environment variables first

import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';

// --- Firebase Initialization ---
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin SDK initialized successfully.');
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    admin.app(); 
  } else {
    console.error('❌ Firebase Admin SDK initialization failed:', error);
    process.exit(1);
  }
}

const db = admin.firestore();
const app = express();

// --- Middleware ---

// Temporarily allow all origins for debugging CORS issues
app.use(cors());

app.use(express.json());
app.use((req, res, next) => {
  req.db = db;
  next();
});

// --- API Routes ---
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes); 

// --- Server Initialization ---
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

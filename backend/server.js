
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import admin from 'firebase-admin';

// Import routes
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

// Import Firebase service account key
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

// --- Firebase Initialization ---
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin SDK initialized successfully.');
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed:', error);
  process.exit(1);
}

const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 5002;

// --- Middleware ---
app.use(helmet());
app.use(cors());
app.use(express.json());

// Middleware to attach the db instance to each request
app.use((req, res, next) => {
  req.db = db;
  next();
});

// --- API Routes ---
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// --- Server Startup ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('Firestore is now the primary database.');
});

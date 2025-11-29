import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { initializeDatabase } from './utils/initializeDatabase.js';

const app = express();
const PORT = process.env.PORT || 5002;
const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔍 Environment check:');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('EMAIL_HOST exists:', !!process.env.EMAIL_HOST);

// Configuration des options de connexion MongoDB
const mongoOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
};

// Fonction pour se connecter à MongoDB
async function connectToMongoDB() {
  try {
    console.log('🚀 Démarrage de la connexion MongoDB...');
    await mongoose.connect(MONGODB_URI, mongoOptions);
    console.log('✅ MongoDB connected successfully!');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    throw error;
  }
}

// Démarrage du serveur
async function startServer() {
  try {
    // Connexion à MongoDB
    await connectToMongoDB();
    
    // Initialiser la base de données
    await initializeDatabase();
    
    // Configuration Express
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    
    // Routes API - Sans les routes de notification pour l'instant
    app.use('/api/users', userRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/reservations', reservationRoutes);
    app.use('/api/orders', orderRoutes);
    
    // Route de test simple
    app.get('/', (req, res) => {
      res.json({ 
        message: 'Backend is running! Email functionality will be added soon.', 
        mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString(),
        features: {
          emailService: !!process.env.EMAIL_HOST,
          notifications: 'Coming soon',
          welcomeEmails: 'Coming soon',
          stockNotifications: 'Coming soon'
        }
      });
    });
    
    // Démarrage du serveur HTTP
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📧 Email service: ${process.env.EMAIL_HOST ? 'Configured ✅' : 'Not configured ❌'}`);
      console.log(`⚠️  Note: Email routes temporarily disabled due to route conflict`);
      console.log(`🧪 Test: curl http://localhost:${PORT}/`);
    });
    
  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur:', error.message);
    process.exit(1);
  }
}

// Démarrer le serveur
startServer();
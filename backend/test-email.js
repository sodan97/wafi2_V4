import 'dotenv/config';
import emailService from './services/emailService.js';

async function testEmail() {
  console.log('🧪 Test du service d\'email...');
  
  try {
    // Test de connexion
    console.log('1. Test de connexion...');
    await emailService.testConnection();
    
    // Test d'envoi d'email de bienvenue
    console.log('2. Test d\'email de bienvenue...');
    const testEmail = 'contact@wafi.sn'; // Utilisons l'email configuré
    
    await emailService.sendWelcomeEmail(testEmail, 'Test', 'User');
    
    console.log('✅ Tous les tests d\'email ont réussi !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test d\'email:', error.message);
  }
  
  process.exit(0);
}

testEmail();
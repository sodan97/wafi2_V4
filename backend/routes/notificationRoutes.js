import express from 'express';
import emailService from '../services/emailService.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Reservation from '../models/Reservation.js';

const router = express.Router();

// POST /api/notifications/subscribe - Permettre à un utilisateur de s'abonner aux notifications pour un produit
router.post('/subscribe', async (req, res) => {
  console.log('POST /api/notifications/subscribe route hit');

  const { email, productId, productName, userId } = req.body;

  if (!email || !productId || !productName || !userId) {
    return res.status(400).json({
      message: 'Missing required fields: email, productId, productName, userId'
    });
  }

  try {
    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Vérifier si une réservation existe déjà pour cet utilisateur et ce produit
    const existingReservation = await Reservation.findOne({
      userId: userId,
      productId: productId
    });

    let reservation = existingReservation;
    let reservationCreated = false;

    if (!existingReservation) {
      // Créer une nouvelle réservation
      const newReservation = new Reservation({
        userId: userId,
        productId: productId,
        date: new Date()
      });
      reservation = await newReservation.save();
      reservationCreated = true;
      console.log(`✅ Reservation created for user ${userId} and product ${productId}`);
    } else {
      console.log(`ℹ️ Reservation already exists for user ${userId} and product ${productId}`);
    }

    // Envoyer un email de confirmation immédiatement
    try {
      const subject = `Notification activée - ${productName}`;
      const htmlContent = `
        <h2>Notification activée avec succès !</h2>
        <p>Bonjour <strong>${user.firstName}</strong>,</p>
        <p>Vous serez automatiquement notifié par email dès que le produit "<strong>${productName}</strong>" sera de nouveau en stock.</p>
        <p>Merci de votre confiance !</p>
        <hr>
        <p><em>L'équipe Waafi</em></p>
      `;

      await emailService.sendEmail(email, subject, htmlContent);
      console.log(`✅ Notification confirmation sent to ${email}`);

      res.json({
        message: 'Successfully subscribed to product notifications',
        emailSent: true,
        reservation: reservation,
        reservationCreated: reservationCreated
      });

    } catch (emailError) {
      console.error(`❌ Failed to send confirmation email to ${email}:`, emailError);

      // Retourner le résultat avec information sur l'erreur email
      res.json({
        message: 'Subscription recorded but email failed',
        emailSent: false,
        emailError: emailError.message,
        reservation: reservation,
        reservationCreated: reservationCreated
      });
    }

  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    res.status(500).json({
      message: 'Server error while subscribing to notifications',
      error: error.message
    });
  }
});

// POST /api/notifications/stock-available
router.post('/stock-available', async (req, res) => {
  console.log('POST /api/notifications/stock-available route hit');

  const { productId, productName, userIds } = req.body;

  if (!productId || !productName || !userIds || !Array.isArray(userIds)) {
    return res.status(400).json({
      message: 'Missing required fields: productId, productName, userIds'
    });
  }

  try {
    const emailPromises = [];

    // Get user details for each userId
    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);
        if (user) {
          console.log(`Sending stock notification to user: ${user.email}`);

          // Add email sending promise (non-blocking)
          emailPromises.push(
            emailService.sendStockNotificationEmail(
              user.email,
              user.firstName,
              productName,
              productId
            ).catch(error => {
              console.error(`Failed to send stock notification to ${user.email}:`, error);
              return { error, userId, email: user.email };
            })
          );
        }
      } catch (userError) {
        console.error(`Error fetching user ${userId}:`, userError);
      }
    }

    // Wait for all emails to be sent (or fail)
    const results = await Promise.allSettled(emailPromises);

    const successful = results.filter(r => r.status === 'fulfilled' && !r.value?.error).length;
    const failed = results.length - successful;

    console.log(`Stock notification emails: ${successful} sent, ${failed} failed`);

    res.json({
      message: 'Stock notification process completed',
      successful,
      failed,
      total: results.length
    });

  } catch (error) {
    console.error('Error sending stock notifications:', error);
    res.status(500).json({ message: 'Server error while sending notifications' });
  }
});

// POST /api/notifications/test-simple
router.post('/test-simple', async (req, res) => {
  console.log('POST /api/notifications/test-simple route hit');

  try {
    // Test simple avec un email fixe
    await emailService.sendEmail(
      'test@example.com',
      'Test Notification Waafi',
      '<h1>Test Email</h1><p>Si vous recevez ce message, la configuration email fonctionne.</p>',
      'Test Email - Si vous recevez ce message, la configuration email fonctionne.'
    );

    res.json({
      message: 'Test email sent successfully',
      note: 'Check your email configuration in .env file'
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      message: 'Failed to send test email',
      error: error.message,
      note: 'Please check your EMAIL_* environment variables in backend/.env'
    });
  }
});

// POST /api/notifications/test-email
router.post('/test-email', async (req, res) => {
  console.log('POST /api/notifications/test-email route hit');

  const { email, type = 'welcome' } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    let result;

    if (type === 'welcome') {
      result = await emailService.sendWelcomeEmail(email, 'Test', 'User');
    } else if (type === 'stock') {
      result = await emailService.sendStockNotificationEmail(email, 'Test', 'Produit Test', 1);
    } else {
      return res.status(400).json({ message: 'Invalid email type. Use "welcome" or "stock"' });
    }

    res.json({
      message: 'Test email sent successfully',
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

// GET /api/notifications/test-connection
router.get('/test-connection', async (req, res) => {
  console.log('GET /api/notifications/test-connection route hit');
  
  try {
    await emailService.testConnection();
    res.json({ message: 'Email service connection successful' });
  } catch (error) {
    console.error('Email service connection test failed:', error);
    res.status(500).json({ 
      message: 'Email service connection failed',
      error: error.message 
    });
  }
});

export default router;
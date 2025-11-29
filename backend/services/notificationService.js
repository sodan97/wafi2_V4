import emailService from './emailService.js';
import User from '../models/User.js';
import Reservation from '../models/Reservation.js';
import Notification from '../models/Notification.js';

class NotificationService {
  /**
   * Envoie des notifications (in-app + email) lorsqu'un produit revient en stock
   * @param {Object} product - Le produit qui revient en stock
   * @param {Number} product._id - L'ID MongoDB du produit
   * @param {Number} product.id - L'ID numérique du produit
   * @param {String} product.name - Le nom du produit
   */
  async notifyStockAvailable(product) {
    try {
      console.log(`🔔 [NotificationService] Product "${product.name}" is back in stock. Checking for reservations...`);

      // Récupérer toutes les réservations pour ce produit
      const reservations = await Reservation.find({ productId: product._id });

      if (reservations.length === 0) {
        console.log(`ℹ️  [NotificationService] No reservations found for product ${product.name}`);
        return {
          success: true,
          notificationsSent: 0,
          emailsSent: 0,
          message: 'No users to notify'
        };
      }

      console.log(`📋 [NotificationService] Found ${reservations.length} reservation(s) for product ${product.name}`);

      let notificationsCreated = 0;
      let emailsSent = 0;
      let emailsFailed = 0;

      // Pour chaque réservation, créer une notification et envoyer un email
      for (const reservation of reservations) {
        try {
          // Récupérer les informations de l'utilisateur
          const user = await User.findById(reservation.userId);
          
          if (!user) {
            console.warn(`⚠️  [NotificationService] User ${reservation.userId} not found, skipping...`);
            continue;
          }

          // 1. Créer une notification in-app
          try {
            const notification = new Notification({
              userId: user._id,
              productId: product._id,
              message: `Bonne nouvelle ! Le produit "${product.name}" que vous attendiez est de nouveau en stock.`,
              read: false,
              date: new Date()
            });
            await notification.save();
            notificationsCreated++;
            console.log(`✅ [NotificationService] In-app notification created for user ${user.email}`);
          } catch (notifError) {
            console.error(`❌ [NotificationService] Failed to create in-app notification for user ${user.email}:`, notifError);
          }

          // 2. Envoyer un email
          try {
            await emailService.sendStockNotificationEmail(
              user.email,
              user.firstName,
              product.name,
              product.id
            );
            emailsSent++;
            console.log(`✅ [NotificationService] Email sent to ${user.email}`);
          } catch (emailError) {
            emailsFailed++;
            console.error(`❌ [NotificationService] Failed to send email to ${user.email}:`, emailError.message);
          }

        } catch (userError) {
          console.error(`❌ [NotificationService] Error processing reservation for user ${reservation.userId}:`, userError);
        }
      }

      // 3. Nettoyer les réservations pour ce produit (elles ont été traitées)
      try {
        const deleteResult = await Reservation.deleteMany({ productId: product._id });
        console.log(`🗑️  [NotificationService] Deleted ${deleteResult.deletedCount} reservation(s) for product ${product.name}`);
      } catch (deleteError) {
        console.error(`❌ [NotificationService] Failed to delete reservations:`, deleteError);
      }

      const summary = {
        success: true,
        notificationsSent: notificationsCreated,
        emailsSent: emailsSent,
        emailsFailed: emailsFailed,
        totalReservations: reservations.length,
        message: `Notifications sent: ${notificationsCreated}, Emails sent: ${emailsSent}, Emails failed: ${emailsFailed}`
      };

      console.log(`📊 [NotificationService] Summary for product "${product.name}":`, summary);
      return summary;

    } catch (error) {
      console.error(`❌ [NotificationService] Error in notifyStockAvailable:`, error);
      return {
        success: false,
        error: error.message,
        notificationsSent: 0,
        emailsSent: 0
      };
    }
  }
}

export default new NotificationService();

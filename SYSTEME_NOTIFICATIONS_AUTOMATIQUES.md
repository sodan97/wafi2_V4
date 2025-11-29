# 🔔 Système de Notifications Automatiques par Email

## 📋 Vue d'ensemble

Le système de notifications par email a été **entièrement automatisé côté backend**. Lorsqu'un produit en rupture de stock (stock = 0) revient en stock (stock > 0), le backend envoie automatiquement :

1. ✅ **Notifications in-app** à tous les utilisateurs abonnés
2. ✅ **Emails de notification** à tous les utilisateurs abonnés
3. ✅ **Nettoyage automatique** des réservations traitées

---

## 🏗️ Architecture

### **Backend (Automatique)**

```
┌─────────────────────────────────────────────────────────────┐
│                  FLUX AUTOMATIQUE BACKEND                    │
└─────────────────────────────────────────────────────────────┘

1. Admin met à jour le stock d'un produit (0 → 5)
   Frontend → PUT /api/products/:id { stock: 5 }
                           ↓
2. Backend reçoit la requête
   Route: productRoutes.js → PUT /:id
                           ↓
3. Mongoose sauvegarde le produit
   product.save()
                           ↓
4. Hook pre-save capture l'ancien stock
   productSchema.pre('save') → this._originalStock = 0
                           ↓
5. Hook post-save détecte le changement
   productSchema.post('save')
   if (oldStock === 0 && newStock > 0)
                           ↓
6. NotificationService est appelé automatiquement
   notificationService.notifyStockAvailable(product)
                           ↓
7. Service récupère les réservations
   Reservation.find({ productId })
                           ↓
8. Pour chaque réservation :
   a) Créer notification in-app → Notification.save()
   b) Envoyer email → emailService.sendStockNotificationEmail()
   c) Nettoyer réservation → Reservation.deleteMany()
                           ↓
9. Utilisateurs reçoivent leurs notifications 📧
```

### **Fichiers Modifiés**

#### 1. **`backend/services/notificationService.js`** (NOUVEAU)
Service centralisé qui gère :
- Récupération des réservations
- Création des notifications in-app
- Envoi des emails
- Nettoyage des réservations

#### 2. **`backend/models/Product.js`** (MODIFIÉ)
Ajout de hooks Mongoose :
- **pre-save** : Capture l'ancien stock avant modification
- **post-save** : Détecte les changements de stock et déclenche les notifications

#### 3. **`context/ProductContext.tsx`** (SIMPLIFIÉ)
Suppression de toute la logique de notifications :
- ❌ Supprimé : `sendStockNotificationEmails()`
- ❌ Supprimé : Appels à `addNotification()`
- ❌ Supprimé : Appels à `removeReservationsForProduct()`
- ✅ Le frontend fait simplement la requête PUT, le backend gère le reste

---

## 🚀 Utilisation

### **Pour l'Admin**

Rien ne change ! Mettez à jour le stock comme d'habitude :

```typescript
// Dans l'interface admin
updateProductStock(productId, newStock);
// ou
updateProduct(productId, { stock: newStock });
```

Le backend détecte automatiquement si le stock passe de 0 à >0 et envoie les notifications.

### **Pour l'Utilisateur**

1. Visite un produit en rupture de stock
2. Clique sur "Me notifier quand disponible"
3. Reçoit un email de confirmation
4. Quand le produit revient en stock → Reçoit automatiquement :
   - Une notification in-app
   - Un email de notification

---

## 📧 Configuration Email

Pour que les emails soient réellement envoyés (pas en mode mock) :

```env
# backend/.env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_application
EMAIL_FROM_NAME=Wafi Shop
```

Voir `backend/EMAIL_CONFIGURATION.md` pour plus de détails.

---

## 🔍 Logs et Débogage

Le système génère des logs détaillés :

```bash
# Quand un produit revient en stock
🔔 [Product Model] Stock restored for product "Produit X" (0 → 5)
🔔 [NotificationService] Product "Produit X" is back in stock. Checking for reservations...
📋 [NotificationService] Found 3 reservation(s) for product Produit X
✅ [NotificationService] In-app notification created for user user1@example.com
✅ [NotificationService] Email sent to user1@example.com
✅ [NotificationService] In-app notification created for user user2@example.com
✅ [NotificationService] Email sent to user2@example.com
🗑️  [NotificationService] Deleted 3 reservation(s) for product Produit X
📊 [NotificationService] Summary: Notifications sent: 3, Emails sent: 3, Emails failed: 0
```

---

## ✅ Avantages de cette Architecture

1. **Séparation des responsabilités** : Le frontend ne gère plus la logique métier
2. **Fiabilité** : Les notifications sont envoyées même si le frontend plante
3. **Performance** : Traitement asynchrone, ne bloque pas la réponse HTTP
4. **Maintenabilité** : Toute la logique est centralisée dans le backend
5. **Évolutivité** : Facile d'ajouter d'autres types de notifications
6. **Robustesse** : Gestion d'erreurs complète, continue même si un email échoue

---

## 🧪 Tests

### Test Manuel

1. Créer un compte utilisateur
2. S'abonner aux notifications d'un produit en rupture de stock
3. En tant qu'admin, mettre à jour le stock du produit (0 → 5)
4. Vérifier :
   - ✅ Notification in-app reçue
   - ✅ Email reçu
   - ✅ Réservation supprimée

### Test avec Mode Mock

Si l'email n'est pas configuré, le système fonctionne en mode mock :

```bash
⚠️  Email configuration incomplete. Using mock mode.
📧 [MOCK EMAIL] Email would be sent:
   To: user@example.com
   Subject: 📦 Bonne nouvelle ! "Produit X" est de nouveau en stock
```

---

## 🔄 Améliorations Futures Possibles

1. **File d'attente** : Utiliser Bull ou RabbitMQ pour gérer de gros volumes
2. **Historique d'emails** : Enregistrer les emails envoyés dans MongoDB
3. **Retry logic** : Réessayer automatiquement en cas d'échec d'envoi
4. **Templates personnalisables** : Permettre aux admins de modifier les templates d'emails
5. **Notifications push** : Ajouter des notifications push mobiles
6. **Statistiques** : Dashboard avec taux d'ouverture, clics, etc.

---

## 📝 Notes Importantes

- ⚠️ Les réservations sont **automatiquement supprimées** après l'envoi des notifications
- ⚠️ Si un email échoue, le système continue avec les autres utilisateurs
- ⚠️ Les notifications in-app sont créées même si l'email échoue
- ✅ Le système fonctionne en mode mock si l'email n'est pas configuré
- ✅ Tous les logs sont préfixés pour faciliter le débogage

---

## 🆘 Dépannage

### Les emails ne sont pas envoyés

1. Vérifier la configuration dans `backend/.env`
2. Vérifier les logs du serveur pour voir si le mode mock est activé
3. Tester la connexion email : `POST /api/notifications/test-connection`

### Les notifications in-app ne s'affichent pas

1. Vérifier que l'utilisateur est bien connecté
2. Vérifier les logs backend pour voir si les notifications sont créées
3. Rafraîchir la page ou recharger les notifications

### Les réservations ne sont pas supprimées

1. Vérifier les logs backend pour voir si le hook post-save est déclenché
2. Vérifier que le stock passe bien de 0 à >0 (pas de 1 à 5)
3. Vérifier la connexion MongoDB

---

**Date de mise à jour** : ${new Date().toLocaleDateString('fr-FR')}
**Version** : 2.0 (Backend automatique)

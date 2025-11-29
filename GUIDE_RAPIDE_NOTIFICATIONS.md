# 🚀 Guide Rapide - Système de Notifications Automatiques

## Pour les Utilisateurs

### Comment s'abonner aux notifications ?

1. **Trouvez un produit en rupture de stock**
   - Parcourez le catalogue de produits
   - Repérez les produits marqués "Rupture de stock"

2. **Cliquez sur "Me notifier quand disponible"**
   - Un bouton apparaît sur les produits en rupture de stock
   - Cliquez dessus pour vous abonner

3. **Recevez une confirmation**
   - Un email de confirmation vous est envoyé immédiatement
   - Vous verrez aussi une notification dans l'application

4. **Attendez la notification**
   - Dès que le produit revient en stock, vous recevez :
     - 📧 Un email automatique
     - 🔔 Une notification dans l'application

5. **Achetez le produit**
   - Cliquez sur le lien dans l'email ou la notification
   - Ajoutez le produit à votre panier
   - Finalisez votre achat

### Que se passe-t-il après ?

- ✅ Votre abonnement est automatiquement supprimé après la notification
- ✅ Vous ne recevrez qu'une seule notification par produit
- ✅ Vous pouvez vous abonner à plusieurs produits en même temps

---

## Pour les Administrateurs

### Comment gérer les stocks ?

1. **Connectez-vous à l'interface admin**
   - Utilisez vos identifiants administrateur

2. **Accédez à la gestion des produits**
   - Cliquez sur "Produits" dans le menu

3. **Modifiez le stock d'un produit**
   - Trouvez le produit à mettre à jour
   - Changez la quantité en stock
   - Cliquez sur "Enregistrer"

4. **Le système fait le reste automatiquement**
   - Si le stock passe de 0 à > 0 :
     - 🔔 Le système détecte le changement
     - 📧 Les emails sont envoyés automatiquement
     - 🗑️ Les abonnements sont nettoyés

### Vérifier que les notifications sont envoyées

1. **Consultez les logs du serveur**
   - Ouvrez le terminal du serveur backend
   - Cherchez les messages :
     ```
     🔔 Stock change detected for product X: 0 → 5
     📧 Processing stock notifications for product: X
     ✅ Notification sent to user@example.com
     ```

2. **Vérifiez les emails**
   - Si configuré en mode production, vérifiez la boîte mail
   - Si en mode mock, les emails sont simulés dans les logs

3. **Vérifiez les notifications in-app**
   - Connectez-vous avec un compte utilisateur
   - Cliquez sur l'icône de notifications
   - Vous devriez voir les nouvelles notifications

---

## Pour les Développeurs

### Démarrage Rapide

```bash
# 1. Installer les dépendances
cd backend
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 3. Démarrer le serveur
npm run dev

# 4. Tester le système
node test-automatic-notifications.js
```

### Structure du Code

```
backend/
├── models/
│   └── Product.js              # Hooks pre-save et post-save
├── services/
│   ├── emailService.js         # Service d'envoi d'emails
│   └── notificationService.js  # Service de notifications
└── routes/
    └── notificationRoutes.js   # Routes API
```

### API Endpoints

#### S'abonner aux notifications
```http
POST /api/notifications/subscribe
Content-Type: application/json

{
  "email": "user@example.com",
  "productId": "68ab73b227d099f29b46b624",
  "productName": "Écharpe en Soie",
  "userId": "68f51d2e5cde9b496280272c"
}
```

**Réponse** :
```json
{
  "message": "Successfully subscribed to product notifications",
  "emailSent": true,
  "reservation": { ... },
  "reservationCreated": true
}
```

#### Récupérer les notifications
```http
GET /api/notifications?userId=68f51d2e5cde9b496280272c
```

**Réponse** :
```json
[
  {
    "_id": "...",
    "userId": "68f51d2e5cde9b496280272c",
    "message": "Le produit 'Écharpe en Soie' est de nouveau en stock !",
    "type": "stock_available",
    "productId": "68ab73b227d099f29b46b624",
    "read": false,
    "date": "2025-01-15T10:30:00.000Z"
  }
]
```

### Personnaliser les Templates d'Email

**Fichier** : `backend/services/emailService.js`

```javascript
async sendStockNotificationEmail(email, firstName, productName, productId) {
  const subject = `${productName} est de nouveau en stock ! 🎉`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e11d48;">Bonne nouvelle ! 🎉</h2>
      <p>Bonjour <strong>${firstName}</strong>,</p>
      <p>Le produit "<strong>${productName}</strong>" que vous attendiez est de nouveau en stock !</p>
      <!-- Personnalisez ici -->
    </div>
  `;
  
  return this.sendEmail(email, subject, htmlContent);
}
```

### Ajouter des Logs Personnalisés

```javascript
// Dans backend/services/notificationService.js
console.log(`📧 Sending notification to ${user.email}`);
console.log(`✅ Email sent successfully`);
console.log(`🗑️ Reservation deleted`);
```

### Tester Localement

```bash
# Lancer le serveur backend
cd backend
npm run dev

# Dans un autre terminal, lancer le test
cd backend
node test-automatic-notifications.js
```

---

## Configuration Email

### Mode Production (Emails Réels)

**Fichier** : `backend/.env`

```env
# Configuration SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-app
EMAIL_FROM=votre-email@gmail.com
```

### Mode Mock (Développement)

Si les variables d'environnement ne sont pas configurées, le système fonctionne en mode mock :
- Les emails ne sont pas réellement envoyés
- Les logs affichent le contenu des emails
- Parfait pour le développement

---

## Dépannage

### Problème : Les emails ne sont pas envoyés

**Solution** :
1. Vérifiez la configuration dans `.env`
2. Vérifiez les logs du serveur : `❌ Error sending email`
3. Testez avec un script simple :
   ```bash
   cd backend
   node -e "require('./services/emailService.js').default.sendEmail('test@example.com', 'Test', 'Test')"
   ```

### Problème : Les notifications ne sont pas déclenchées

**Solution** :
1. Vérifiez que le stock passe bien de 0 à > 0
2. Vérifiez les logs : `🔔 Stock change detected`
3. Vérifiez que le hook post-save est bien exécuté

### Problème : Notifications dupliquées

**Solution** :
1. Vérifiez qu'il n'y a pas de réservations dupliquées
2. Ajoutez un index unique sur `(userId, productId)` :
   ```javascript
   reservationSchema.index({ userId: 1, productId: 1 }, { unique: true });
   ```

---

## Support

Pour toute question ou problème :

1. **Consultez la documentation complète** : `IMPLEMENTATION_COMPLETE.md`
2. **Vérifiez les logs du serveur** : Terminal backend
3. **Testez avec le script** : `node test-automatic-notifications.js`
4. **Contactez l'équipe de développement**

---

**Bon développement ! 🚀**

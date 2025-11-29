# 🔔 Guide de Test : Notifications de Stock

## Comment tester les notifications de retour en stock

### Étape 1 : Préparer un produit en rupture de stock

1. Connectez-vous en tant qu'**admin**
2. Allez dans le **panneau d'administration**
3. Trouvez un produit et **modifiez son stock à 0**
4. Sauvegardez

### Étape 2 : S'abonner aux notifications (en tant que client)

1. **Déconnectez-vous** du compte admin
2. **Connectez-vous** avec un compte client (ou créez-en un)
3. Allez sur la page du produit en rupture de stock
4. Cliquez sur **"Me notifier quand disponible"**
5. Choisissez **"Notifier par email"**
6. Vous devriez recevoir un message de confirmation

### Étape 3 : Restaurer le stock (en tant qu'admin)

1. **Reconnectez-vous** en tant qu'admin
2. Allez dans le **panneau d'administration**
3. Trouvez le même produit
4. **Modifiez le stock** en mettant une valeur **supérieure à 0** (par exemple : 10)
5. **Sauvegardez**

### Étape 4 : Vérifier les notifications

**Notification dans l'application :**
1. Reconnectez-vous avec le compte client
2. Cliquez sur l'**icône de cloche** 🔔 dans le header
3. Vous devriez voir une notification : *"Bonne nouvelle ! Le produit [nom] que vous attendiez est de nouveau en stock."*

**Notification par email :**
1. Vérifiez votre boîte email (et les spams)
2. Vous devriez recevoir un email avec :
   - Le titre : "📦 Bonne nouvelle ! [nom du produit] est de nouveau en stock"
   - Un bouton **"Commander maintenant"** qui redirige vers le produit

---

## 🔍 Dépannage

### Problème : Pas de notification reçue

**Vérifiez dans les logs du backend :**
```
🔔 Stock restored for product: [nom du produit]
📧 Sending notifications to X users
```

Si vous voyez :
```
ℹ️ No reservations found for product [id]
```

Cela signifie que l'abonnement n'a pas été enregistré. Vérifiez :
1. Que vous avez bien cliqué sur "Notifier par email"
2. Que vous étiez connecté lors de l'abonnement
3. Les logs du backend lors de l'abonnement

### Problème : Email non reçu

**Si l'email n'est pas configuré :**
- Les notifications dans l'application fonctionneront quand même
- Les emails seront simulés dans les logs (mode "mock")
- Suivez le guide `backend/EMAIL_CONFIGURATION.md` pour configurer l'email

**Si l'email est configuré :**
- Vérifiez vos **spams/courrier indésirable**
- Vérifiez les logs du backend pour voir si l'email a été envoyé
- Vérifiez que `FRONTEND_URL` est configuré dans `.env`

---

## 📝 Notes techniques

### Comment ça fonctionne ?

1. **Abonnement** : Quand un utilisateur clique sur "Notifier par email", une **Reservation** est créée dans la base de données MongoDB
2. **Détection** : Quand un admin modifie le stock d'un produit de 0 à > 0, le système détecte le changement
3. **Notification** : Le système :
   - Récupère toutes les réservations pour ce produit
   - Envoie une notification dans l'application à chaque utilisateur
   - Envoie un email à chaque utilisateur (si configuré)
   - Supprime les réservations (pour ne pas notifier plusieurs fois)

### Collections MongoDB utilisées

- **Reservation** : Stocke les abonnements aux notifications
  - `userId` : ID de l'utilisateur
  - `productId` : ID du produit
  - `date` : Date de l'abonnement

- **Notification** : Stocke les notifications dans l'application
  - `userId` : ID de l'utilisateur
  - `productId` : ID du produit
  - `message` : Message de la notification
  - `read` : Statut de lecture

---

## ✅ Checklist de test

- [ ] Produit mis en rupture de stock (stock = 0)
- [ ] Abonnement aux notifications effectué
- [ ] Confirmation d'abonnement reçue (message ou email)
- [ ] Stock restauré (stock > 0)
- [ ] Notification dans l'application reçue (icône 🔔)
- [ ] Email de notification reçu (si email configuré)
- [ ] Lien dans l'email fonctionne et redirige vers le produit
- [ ] Pas de notification en double après plusieurs modifications de stock

---

**Bon test ! 🎉**

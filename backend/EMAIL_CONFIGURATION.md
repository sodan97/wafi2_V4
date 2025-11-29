# Configuration des Notifications Email

## 📧 Pourquoi configurer l'email ?

Les notifications par email permettent d'informer automatiquement vos clients lorsqu'un produit en rupture de stock est à nouveau disponible.

**Sans configuration email :** L'application fonctionne en mode "mock" - les notifications sont simulées dans les logs du serveur mais ne sont pas réellement envoyées.

**Avec configuration email :** Les clients reçoivent de vrais emails de notification.

---

## 🚀 Configuration Rapide (Gmail)

### Étape 1 : Créer un mot de passe d'application Gmail

1. Allez sur votre compte Google : https://myaccount.google.com/
2. Cliquez sur **Sécurité** dans le menu de gauche
3. Activez la **Validation en deux étapes** (si ce n'est pas déjà fait)
4. Recherchez **Mots de passe des applications**
5. Sélectionnez **Autre (nom personnalisé)** et entrez "Wafi Shop"
6. Cliquez sur **Générer**
7. **Copiez le mot de passe** généré (16 caractères)

### Étape 2 : Configurer le fichier .env

1. Dans le dossier `backend/`, copiez `.env.example` vers `.env`
2. Modifiez les valeurs suivantes :

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=le_mot_de_passe_application_copie
EMAIL_FROM_NAME=Wafi Shop
```

### Étape 3 : Redémarrer le serveur

```bash
cd backend
npm run dev
```

Vous devriez voir dans les logs :
```
✅ Email service initialized successfully
```

---

## 📮 Configuration pour d'autres services

### Outlook / Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=votre_email@outlook.com
EMAIL_PASS=votre_mot_de_passe
EMAIL_FROM_NAME=Wafi Shop
```

### Yahoo Mail

```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=votre_email@yahoo.com
EMAIL_PASS=votre_mot_de_passe_application
EMAIL_FROM_NAME=Wafi Shop
```

### Service SMTP personnalisé

```env
EMAIL_HOST=smtp.votre-service.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=votre_email@votre-service.com
EMAIL_PASS=votre_mot_de_passe
EMAIL_FROM_NAME=Wafi Shop
```

---

## 🧪 Tester la configuration

Une fois configuré, testez l'envoi d'email :

1. Lancez le backend
2. Créez un compte utilisateur
3. Essayez de vous abonner aux notifications d'un produit en rupture de stock
4. Vérifiez votre boîte email

---

## ⚠️ Dépannage

### Erreur : "Invalid login"
- Vérifiez que vous utilisez un **mot de passe d'application** (pas votre mot de passe normal)
- Pour Gmail, assurez-vous que la validation en deux étapes est activée

### Erreur : "Connection timeout"
- Vérifiez votre connexion internet
- Essayez de changer le port (587 ou 465)
- Si vous utilisez 465, changez `EMAIL_SECURE=true`

### Les emails ne sont pas reçus
- Vérifiez vos **spams/courrier indésirable**
- Vérifiez que `EMAIL_USER` est correct
- Consultez les logs du serveur pour voir les erreurs

### Mode "mock" activé
Si vous voyez dans les logs :
```
⚠️  Email configuration incomplete. Using mock mode.
```

Cela signifie que les variables d'environnement ne sont pas configurées. Vérifiez votre fichier `.env`.

---

## 🔒 Sécurité

**IMPORTANT :**
- ❌ Ne commitez JAMAIS le fichier `.env` dans Git
- ✅ Le fichier `.env` est déjà dans `.gitignore`
- ✅ Partagez uniquement `.env.example` (sans les vraies valeurs)
- ✅ Utilisez des mots de passe d'application (pas vos mots de passe principaux)

---

## 📝 Notes

- Le mode "mock" permet de développer sans configuration email
- Les notifications sont quand même enregistrées en base de données
- Vous pouvez configurer l'email plus tard sans perdre les abonnements

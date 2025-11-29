# 🔍 GUIDE DE DÉPANNAGE - BOUTONS FAVORIS INVISIBLES

## ❌ Problème : Les cœurs de favoris ne s'affichent pas

### 🔎 Causes Possibles

#### **1. Vous n'êtes pas connecté**
Le bouton favori n'apparaît que pour les utilisateurs **connectés**.

**Solution :**
- Connectez-vous avec un compte **client** (pas admin)
- Le bouton cœur devrait apparaître en haut à gauche de chaque image de produit

---

#### **2. Vous êtes connecté en tant qu'administrateur**
Le bouton favori n'apparaît **pas** pour les administrateurs.

**Solution :**
- Déconnectez-vous
- Connectez-vous avec un compte **client**
- Ou créez un nouveau compte client

---

#### **3. Erreur JavaScript dans le navigateur**
Une erreur dans le code empêche le bouton de s'afficher.

**Solution :**
1. Ouvrez la console du navigateur (F12)
2. Allez dans l'onglet **Console**
3. Vérifiez s'il y a des erreurs en rouge
4. Partagez les erreurs pour diagnostic

---

## ✅ Comment Vérifier que Tout Fonctionne

### **Étape 1 : Vérifier les serveurs**

#### **Backend (Terminal 4)**
```bash
cd backend
node server.js
```

Vous devriez voir :
```
📝 Adding favorite routes...
🚀 Server running on http://localhost:5002
```

#### **Frontend (Terminal 3)**
```bash
npm run dev
```

Vous devriez voir :
```
VITE ready in XXX ms
Local: http://localhost:5173/
```

---

### **Étape 2 : Se connecter avec un compte client**

1. Ouvrez http://localhost:5173 dans votre navigateur
2. Cliquez sur **"Se connecter"**
3. Utilisez un compte **client** (pas admin)
   - Si vous n'avez pas de compte client, créez-en un
4. Vérifiez que vous êtes bien connecté (votre nom apparaît dans le header)

---

### **Étape 3 : Vérifier l'affichage des cœurs**

1. Sur la page d'accueil, regardez les cartes de produits
2. **Vous devriez voir** :
   - Un cœur blanc 🤍 en haut à gauche de chaque image de produit
   - Le cœur est dans un cercle blanc avec une ombre

**Si vous ne voyez PAS les cœurs :**
- Vérifiez que vous êtes connecté en tant que **client** (pas admin)
- Ouvrez la console du navigateur (F12) et vérifiez les erreurs
- Rafraîchissez la page (Ctrl+R ou Cmd+R)

---

### **Étape 4 : Tester l'ajout aux favoris**

1. Cliquez sur un cœur blanc 🤍
2. **Le cœur devrait** :
   - Devenir rouge ❤️ immédiatement
   - Rester rouge (ne pas redevenir blanc)
3. Le compteur dans le header devrait s'incrémenter

---

### **Étape 5 : Vérifier la page des favoris**

1. Cliquez sur **"Favoris"** dans le menu (ou sur l'icône ❤️ dans le header)
2. **Vous devriez voir** :
   - Le produit que vous avez ajouté
   - Le compteur de favoris
   - Les cartes de produits avec leurs cœurs rouges

---

## 🐛 Débogage Avancé

### **Vérifier le code du ProductCard**

Le bouton favori est conditionné par cette ligne (ligne 91 de ProductCard.tsx) :
```typescript
{currentUser && currentUser.role !== 'admin' && (
  <button onClick={handleToggleFavorite} ...>
    <span>{isProductFavorite ? '❤️' : '🤍'}</span>
  </button>
)}
```

**Cela signifie que le bouton n'apparaît QUE si :**
- ✅ `currentUser` existe (vous êtes connecté)
- ✅ `currentUser.role !== 'admin'` (vous n'êtes pas admin)

---

### **Vérifier dans la console du navigateur**

1. Ouvrez la console (F12)
2. Tapez :
   ```javascript
   localStorage.getItem('authToken')
   ```
3. Si vous voyez `null`, vous n'êtes pas connecté
4. Si vous voyez un token, vous êtes connecté

---

### **Vérifier le rôle de l'utilisateur**

1. Dans la console, tapez :
   ```javascript
   JSON.parse(localStorage.getItem('currentUser'))
   ```
2. Vérifiez le champ `role`
3. Si `role: 'admin'`, les cœurs ne s'afficheront pas
4. Si `role: 'client'`, les cœurs devraient s'afficher

---

## 🔧 Solutions Rapides

### **Solution 1 : Créer un compte client**

1. Déconnectez-vous (si connecté)
2. Cliquez sur **"S'inscrire"**
3. Créez un nouveau compte avec :
   - Nom : Test Client
   - Email : client@test.com
   - Mot de passe : test123
   - Téléphone : 0123456789
4. Connectez-vous avec ce compte
5. Les cœurs devraient apparaître

---

### **Solution 2 : Vider le cache et rafraîchir**

1. Ouvrez les outils de développement (F12)
2. Faites un clic droit sur le bouton de rafraîchissement
3. Sélectionnez **"Vider le cache et actualiser"**
4. Reconnectez-vous

---

### **Solution 3 : Vérifier les erreurs réseau**

1. Ouvrez les outils de développement (F12)
2. Allez dans l'onglet **Network** (Réseau)
3. Rafraîchissez la page
4. Vérifiez s'il y a des requêtes en rouge (erreur)
5. Si oui, cliquez dessus pour voir les détails

---

## 📸 À Quoi Ça Devrait Ressembler

### **Carte de produit avec cœur blanc (non favori)**
```
┌─────────────────────────┐
│ 🤍                      │  ← Cœur blanc en haut à gauche
│                         │
│      IMAGE PRODUIT      │
│                         │
│                         │
└─────────────────────────┘
│ Nom du produit          │
│ Description...          │
│ 5000 FCFA    [Ajouter] │
└─────────────────────────┘
```

### **Carte de produit avec cœur rouge (favori)**
```
┌─────────────────────────┐
│ ❤️                      │  ← Cœur rouge en haut à gauche
│                         │
│      IMAGE PRODUIT      │
│                         │
│                         │
└─────────────────────────┘
│ Nom du produit          │
│ Description...          │
│ 5000 FCFA    [Ajouter] │
└─────────────────────────┘
```

---

## 🆘 Si Rien Ne Fonctionne

1. **Partagez une capture d'écran** de la page d'accueil
2. **Partagez les erreurs** de la console du navigateur (F12 → Console)
3. **Vérifiez** que vous êtes bien connecté en tant que **client**
4. **Vérifiez** que les deux serveurs (backend et frontend) sont en cours d'exécution

---

**Bon dépannage ! 🔧**

# 🚀 Guide de déploiement GESTNOTES sur Vercel + Supabase

## 📋 Prérequis

- ✅ Un compte Vercel (gratuit)
- ✅ Un projet Supabase créé
- ✅ Votre code sur GitHub (recommandé) ou en local

---

## 🎯 ÉTAPE 1 : Configurer Supabase

### 1.1 Créer le schéma de base de données

1. Allez sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Ouvrez votre projet : `nbedcrbxitgjgmyagjxu`
3. Cliquez sur **SQL Editor** dans le menu de gauche
4. Ouvrez le fichier `schema.sql` de votre projet
5. Copiez tout le contenu et collez-le dans l'éditeur SQL
6. Cliquez sur **Run** pour créer toutes les tables

### 1.2 Récupérer la connection string

1. Dans votre projet Supabase, allez dans **Settings** ⚙️
2. Cliquez sur **Database**
3. Cherchez la section **"Connection string"**
4. Sélectionnez l'onglet **"Transaction"** (PAS Session)
5. Vous verrez quelque chose comme :
   ```
   postgresql://postgres.nbedcrbxitgjgmyagjxu:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
6. **IMPORTANT** : Remplacez `[YOUR-PASSWORD]` par votre mot de passe de base de données

**Si vous ne connaissez pas votre mot de passe :**
- Dans la même page (Settings → Database)
- Cliquez sur **"Reset database password"**
- Créez un nouveau mot de passe **ET NOTEZ-LE**
- Utilisez ce mot de passe dans la connection string

---

## 🎯 ÉTAPE 2 : Préparer le projet

### 2.1 Vérifier les fichiers

Assurez-vous d'avoir ces fichiers dans votre projet :

- ✅ `vercel.json` (déjà créé)
- ✅ `database.js` (déjà modifié pour Supabase)
- ✅ `server.js`
- ✅ `package.json`

### 2.2 Créer un fichier `.gitignore`

Si vous n'en avez pas, créez un fichier `.gitignore` avec :

```
node_modules/
.env
.env.local
.vercel
*.log
```

---

## 🎯 ÉTAPE 3 : Déployer sur Vercel

### Option A : Déploiement via GitHub (Recommandé)

1. **Poussez votre code sur GitHub**
   ```bash
   git add .
   git commit -m "Prêt pour déploiement Vercel"
   git push origin main
   ```

2. **Connectez Vercel à GitHub**
   - Allez sur [vercel.com](https://vercel.com)
   - Cliquez sur **"Add New..."** → **"Project"**
   - Sélectionnez **"Import Git Repository"**
   - Choisissez votre dépôt GitHub `GESTNOTES`
   - Cliquez sur **"Import"**

3. **Configurez le projet**
   - Framework Preset : **Other**
   - Root Directory : `.` (par défaut)
   - Build Command : (laissez vide)
   - Output Directory : (laissez vide)
   - Install Command : `npm install`

4. **Ajoutez les variables d'environnement**
   
   Cliquez sur **"Environment Variables"** et ajoutez :

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | `postgresql://postgres.nbedcrbxitgjgmyagjxu:[VOTRE-MOT-DE-PASSE]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres` |
   | `JWT_SECRET` | `GESTNOTES_SECRET_2025_aBcDeF123456XyZ` (ou votre propre clé) |
   | `NODE_ENV` | `production` |

5. **Déployez**
   - Cliquez sur **"Deploy"**
   - Attendez 1-2 minutes

### Option B : Déploiement via Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Suivez les instructions à l'écran
# Ajoutez les variables d'environnement quand demandé
```

---

## 🎯 ÉTAPE 4 : Configurer les variables d'environnement

Si vous avez déjà déployé sans ajouter les variables, ou si vous voulez les modifier :

1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Cliquez sur votre projet **GESTNOTES**
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez les variables suivantes :

### Variables obligatoires :

#### `DATABASE_URL`
```
postgresql://postgres.nbedcrbxitgjgmyagjxu:[VOTRE-MOT-DE-PASSE]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```
**⚠️ Remplacez `[VOTRE-MOT-DE-PASSE]` par votre vrai mot de passe !**

#### `JWT_SECRET`
```
GESTNOTES_SECRET_2025_aBcDeF123456XyZ
```
Ou générez une clé sur [randomkeygen.com](https://randomkeygen.com)

#### `NODE_ENV`
```
production
```

5. Cliquez sur **"Save"**
6. **Redéployez** : Allez dans l'onglet **Deployments** → Cliquez sur les trois points → **Redeploy**

---

## 🎯 ÉTAPE 5 : Tester le déploiement

1. Une fois déployé, Vercel vous donnera une URL (exemple : `https://gestnotes.vercel.app`)
2. Testez les pages principales :
   - `https://votre-url.vercel.app/auth-fixed.html`
   - `https://votre-url.vercel.app/enseignant/index.html`
   - `https://votre-url.vercel.app/Etudiant/index.html`

3. Testez l'API :
   ```bash
   curl https://votre-url.vercel.app/api/classes
   ```

---

## 🛠️ Dépannage

### Erreur : "Cannot connect to database"

**Solution :**
1. Vérifiez que `DATABASE_URL` est bien configurée dans Vercel
2. Vérifiez que vous avez bien remplacé `[YOUR-PASSWORD]` par votre mot de passe
3. Testez la connection string localement :
   ```bash
   psql "postgresql://postgres.nbedcrbxitgjgmyagjxu:[VOTRE-MOT-DE-PASSE]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
   ```

### Erreur : "JWT must be provided"

**Solution :**
1. Vérifiez que `JWT_SECRET` est bien configurée dans Vercel
2. Redéployez après avoir ajouté la variable

### Erreur : "Module not found"

**Solution :**
1. Assurez-vous que `package.json` contient toutes les dépendances
2. Dans Vercel, allez dans Settings → General → Node.js Version : **18.x**
3. Redéployez

### Les pages statiques ne chargent pas

**Solution :**
1. Vérifiez que le dossier `public/` est bien dans votre dépôt
2. Vérifiez que `vercel.json` est configuré correctement

---

## ✅ Checklist finale

Avant de considérer le déploiement terminé :

- [ ] Base de données créée dans Supabase
- [ ] Toutes les tables créées (via `schema.sql`)
- [ ] Variables d'environnement ajoutées dans Vercel
- [ ] `DATABASE_URL` avec le bon mot de passe
- [ ] `JWT_SECRET` configuré
- [ ] `NODE_ENV=production`
- [ ] Application déployée avec succès
- [ ] Pages d'authentification accessibles
- [ ] API répond correctement
- [ ] Connexion à la base de données fonctionne

---

## 📞 Support

En cas de problème :
1. Vérifiez les logs dans Vercel : **Deployments** → Cliquez sur votre déploiement → **Runtime Logs**
2. Vérifiez les logs de Supabase : **Logs** → **Postgres Logs**

---

## 🎉 C'est fait !

Votre application GESTNOTES est maintenant déployée sur :
- **Frontend** : Vercel (serveur Node.js + fichiers statiques)
- **Backend** : Vercel (API Express)
- **Base de données** : Supabase (PostgreSQL)

URL de votre application : `https://votre-projet.vercel.app`

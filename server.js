// ====================================================================
// SERVEUR GESTNOTES - VERSION PARFAITE ET CORRIGÉE
// ====================================================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
console.log('🔄 Démarrage du serveur GestNotes...');

// ==================== MIDDLEWARES ====================
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Log toutes les requêtes pour debug
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.path}`);
    next();
});

// ==================== FICHIERS STATIQUES ====================
app.use(express.static(path.join(__dirname, 'public')));

// ==================== IMPORT DES ROUTES ====================
let apiRoutes, evaluationsRoutes, etudiantRoutes, inscriptionRoutes, adminAuthRoutes;

// Charger avec gestion d'erreurs
try {
    apiRoutes = require('./routes/api');
    console.log('✅ Routes API chargées');
} catch (e) {
    console.error('❌ Erreur chargement routes/api.js:', e.message);
}

try {
    evaluationsRoutes = require('./routes/evaluations-routes');
    console.log('✅ Routes Évaluations chargées');
} catch (e) {
    console.error('❌ Erreur chargement routes/evaluations-routes.js:', e.message);
}

try {
    etudiantRoutes = require('./routes/etudiant-routes');
    console.log('✅ Routes Étudiants chargées');
} catch (e) {
    console.error('❌ Erreur chargement routes/etudiant-routes.js:', e.message);
}

try {
    inscriptionRoutes = require('./routes/inscription-routes');
    console.log('✅ Routes Inscriptions chargées');
} catch (e) {
    console.error('❌ Erreur chargement routes/inscription-routes.js:', e.message);
}

try {
    adminAuthRoutes = require('./routes/admin-auth-routes');
    console.log('✅ Routes Auth Admin chargées');
} catch (e) {
    console.error('❌ Erreur chargement routes/admin-auth-routes.js:', e.message);
}

// ==================== MONTER LES ROUTES ====================
if (apiRoutes) app.use('/api', apiRoutes);
if (evaluationsRoutes) app.use('/api', evaluationsRoutes);
if (etudiantRoutes) app.use('/api/etudiants', etudiantRoutes);
if (inscriptionRoutes) app.use('/api/inscriptions', inscriptionRoutes);
if (adminAuthRoutes) app.use('/api/auth/admin', adminAuthRoutes);

// ==================== AUTHENTIFICATION ENSEIGNANT ====================
app.post('/api/auth/enseignant/register', async (req, res) => {
    try {
        const { nom, prenom, tel, email, password, matricule } = req.body;
        console.log('📥 Inscription enseignant:', { nom, prenom, email });

        if (!nom || !prenom || !email || !password) {
            return res.status(400).json({ error: 'Tous les champs sont requis' });
        }

        const existant = await db.query('SELECT * FROM enseignant WHERE email_ens = $1', [email]);
        if (existant.rows.length > 0) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }

        const mat = matricule || `ENS${Date.now()}`;
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.query(
            'INSERT INTO enseignant (matricule_ens, nom_ens, prenom_ens, tel_ens, email_ens, password_ens) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [mat, nom, prenom, tel || null, email, hashedPassword]
        );

        const { password_ens, ...enseignantSafe } = result.rows[0];
        res.status(201).json({ message: 'Inscription réussie', user: enseignantSafe });
    } catch (error) {
        console.error('❌ Erreur inscription enseignant:', error);
        res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
});

app.post('/api/auth/enseignant/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔐 Connexion enseignant:', email);

        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        const result = await db.query('SELECT * FROM enseignant WHERE email_ens = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        const enseignant = result.rows[0];
        const validPassword = await bcrypt.compare(password, enseignant.password_ens);
        if (!validPassword) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        res.json({
            message: 'Connexion réussie',
            matricule: enseignant.matricule_ens,
            nom: enseignant.nom_ens,
            prenom: enseignant.prenom_ens,
            email: enseignant.email_ens,
            role: 'enseignant'
        });
    } catch (error) {
        console.error('❌ Erreur connexion enseignant:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==================== AUTHENTIFICATION ÉTUDIANT ====================
app.post('/api/auth/etudiant/register', async (req, res) => {
    try {
        const { nom, prenom, email, password, matricule } = req.body;
        console.log('📥 Inscription étudiant:', { nom, prenom, email });

        if (!nom || !prenom || !email || !password) {
            return res.status(400).json({ error: 'Tous les champs sont requis' });
        }

        const existant = await db.query('SELECT * FROM etudiant WHERE email_et = $1', [email]);
        if (existant.rows.length > 0) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }

        const mat = matricule || `ETU${Date.now()}`;
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.query(
            'INSERT INTO etudiant (matricule_et, nom_et, prenom_et, email_et, password_et) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [mat, nom, prenom, email, hashedPassword]
        );

        const { password_et, ...etudiantSafe } = result.rows[0];
        res.status(201).json({ message: 'Inscription réussie', user: etudiantSafe });
    } catch (error) {
        console.error('❌ Erreur inscription étudiant:', error);
        res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
});

app.post('/api/auth/etudiant/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔐 Connexion étudiant:', email);

        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        const result = await db.query('SELECT * FROM etudiant WHERE email_et = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        const etudiant = result.rows[0];
        const validPassword = await bcrypt.compare(password, etudiant.password_et);
        if (!validPassword) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        res.json({
            message: 'Connexion réussie',
            matricule: etudiant.matricule_et,
            nom: etudiant.nom_et,
            prenom: etudiant.prenom_et,
            email: etudiant.email_et,
            role: 'etudiant'
        });
    } catch (error) {
        console.error('❌ Erreur connexion étudiant:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==================== GESTION DES ERREURS ====================
app.use((err, req, res, next) => {
    console.error('❌ Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', message: err.message });
});

// Dans votre fichier server.js ou routes.js

// Route pour les enseignants
app.post('/api/enseignants', async (req, res) => {
    try {
        const { matricule_ens, nom_ens, prenom_ens, email_ens, password_ens } = req.body;
        
        // Hasher le mot de passe (le matricule)
        const hashedPassword = await bcrypt.hash(password_ens || matricule_ens, 10);
        
        const result = await pool.query(
            `INSERT INTO enseignant (matricule_ens, nom_ens, prenom_ens, email_ens, password_ens) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING matricule_ens, nom_ens, prenom_ens, email_ens`,
            [matricule_ens, nom_ens, prenom_ens, email_ens, hashedPassword]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Route de connexion pour enseignant
app.post('/api/auth/enseignant/login', async (req, res) => {
    try {
        const { email_ens, password_ens } = req.body;
        
        const result = await pool.query(
            'SELECT * FROM enseignant WHERE email_ens = $1',
            [email_ens]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        
        const enseignant = result.rows[0];
        const validPassword = await bcrypt.compare(password_ens, enseignant.password_ens);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        
        // Retourner les données sans le mot de passe
        const { password_ens: _, ...enseignantData } = enseignant;
        res.json(enseignantData);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== DÉMARRAGE DU SERVEUR ====================
console.log('🔄 Tentative de connexion à la base de données...');

db.query('SELECT NOW()')
    .then(() => {
        console.log('✅ Connexion PostgreSQL réussie');
        app.listen(PORT, () => {
            console.log('\n' + '='.repeat(60));
            console.log('🚀 SERVEUR GESTNOTES DÉMARRÉ AVEC SUCCÈS');
            console.log('='.repeat(60));
            console.log(`📡 URL: http://localhost:${PORT}`);
            console.log(`📁 Public: ${path.join(__dirname, 'public')}`);
            console.log(`💾 Database: ${process.env.DB_NAME || 'BDevaluation'}`);
            console.log('\n📋 ROUTES DISPONIBLES:');
            console.log('   🔐 POST /api/auth/enseignant/login');
            console.log('   🔐 POST /api/auth/enseignant/register');
            console.log('   🔐 POST /api/auth/etudiant/login');
            console.log('   🔐 POST /api/auth/etudiant/register');
            console.log('   🔐 POST /api/auth/admin/login');
            if (apiRoutes) {
                console.log('   📚 GET  /api/classes');
                console.log('   📖 GET  /api/matieres');
                console.log('   📅 GET  /api/periodes');
            }
            if (evaluationsRoutes) {
                console.log('   📊 GET  /api/evaluations');
                console.log('   📊 POST /api/evaluations');
                console.log('   📍 GET  /api/inscriptions/classe/:code_cl');
            }
            if (etudiantRoutes) {
                console.log('   👨‍🎓 GET  /api/etudiants');
                console.log('   👨‍🎓 POST /api/etudiants');
                console.log('   👨‍🎓 GET  /api/etudiants/:matricule');
            }
            if (inscriptionRoutes) {
                console.log('   📝 GET  /api/inscriptions');
                console.log('   📝 POST /api/inscriptions');
            }
            console.log('\n💡 TESTER:');
            console.log(`   http://localhost:${PORT}/auth-fixed.html`);
            console.log('='.repeat(60) + '\n');
        });
    })
    .catch((err) => {
        console.error('\n' + '='.repeat(60));
        console.error('❌ ÉCHEC CONNEXION BASE DE DONNÉES');
        console.error('='.repeat(60));
        console.error('Erreur:', err.message);
        console.error('\n💡 VÉRIFICATIONS:');
        console.error('   1. PostgreSQL est démarré ?');
        console.error('   2. Base "BDevaluation" existe ?');
        console.error('   3. Fichier .env correct ?');
        console.error('   4. Mot de passe correct ?\n');
        console.error('🔧 COMMANDES:');
        console.error('   psql -U postgres');
        console.error('   CREATE DATABASE BDevaluation;');
        console.error('   \\i schema.sql\n');
        process.exit(1);
    });

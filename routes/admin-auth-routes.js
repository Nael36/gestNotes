const express = require('express');
const router = express.Router();
const db = require('../database');

// POST - Connexion admin
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('🔐 Tentative connexion admin:', email);
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Email et mot de passe requis' 
            });
        }
        
        // Vérifier dans la table admin
        try {
            const adminCheck = await db.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'admin'
                )
            `);
            
            if (adminCheck.rows[0].exists) {
                const adminResult = await db.query(
                    'SELECT * FROM admin WHERE email_admin = $1',
                    [email]
                );
                
                if (adminResult.rows.length > 0) {
                    const admin = adminResult.rows[0];
                    const bcrypt = require('bcrypt');
                    const isValid = await bcrypt.compare(password, admin.password_admin);
                    
                    if (isValid) {
                        console.log('✅ Admin trouvé dans la base:', admin.email_admin);
                        
                        // RETOURNER "admin" AU LIEU DE "user"
                        return res.json({
                            success: true,
                            message: 'Connexion admin réussie',
                            admin: {  // <-- CHANGEMENT ICI
                                id: admin.id_admin,
                                email: admin.email_admin,
                                nom: admin.nom_admin || 'Admin',
                                prenom: admin.prenom_admin || 'System',
                                role: 'admin',
                                created_at: admin.created_at
                            }
                        });
                    }
                }
            }
        } catch (adminError) {
            console.log('ℹ️ Table admin non accessible:', adminError.message);
        }
        
        // Fallback pour admin@iua.ci
        if (email === 'admin@iua.ci' && password === 'admin123') {
            const admin = {
                id: 1,
                email: email,
                nom: 'Administrateur',
                prenom: 'Système',
                role: 'admin',
                created_at: new Date()
            };
            
            console.log('✅ Connexion admin de secours réussie');
            
            return res.json({
                success: true,
                message: 'Connexion admin réussie',
                admin: admin  // <-- CHANGEMENT ICI AUSSI
            });
        }
        
        console.log('❌ Identifiants incorrects pour:', email);
        return res.status(401).json({ 
            success: false,
            error: 'Email ou mot de passe incorrect' 
        });
        
    } catch (error) {
        console.error('❌ Erreur connexion:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erreur serveur' 
        });
    }
});

// POST - Déconnexion
router.post('/logout', (req, res) => {
    // Ici vous détruiriez la session ou le token JWT
    res.json({ message: 'Déconnexion réussie' });
});

// GET - Vérifier session
router.get('/check', (req, res) => {
    // Vérifier si l'utilisateur est connecté
    // À implémenter avec les sessions ou JWT
    res.json({ authenticated: false, user: null });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');

// ==================== CRUD ÉTUDIANTS ====================

// GET - Liste de tous les étudiants
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT matricule_et, nom_et, prenom_et, email_et, photo_et FROM etudiant ORDER BY nom_et, prenom_et'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Erreur GET étudiants:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET - Récupérer un étudiant par matricule
router.get('/:matricule', async (req, res) => {
    try {
        const { matricule } = req.params;
        
        console.log('🔍 Recherche étudiant:', matricule);
        
        const result = await db.query(
            'SELECT matricule_et, nom_et, prenom_et, email_et, photo_et FROM etudiant WHERE matricule_et = $1',
            [matricule]
        );
        
        if (result.rows.length === 0) {
            console.log('❌ Étudiant non trouvé:', matricule);
            return res.status(404).json({ error: 'Étudiant non trouvé', matricule });
        }
        
        console.log('✅ Étudiant trouvé:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ Erreur recherche étudiant:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

// POST - Créer un nouvel étudiant
router.post('/', async (req, res) => {
    try {
        const { matricule_et, nom_et, prenom_et, email_et, photo_et, password_et } = req.body;
        
        console.log('📥 Création étudiant:', { matricule_et, nom_et, prenom_et, email_et });
        
        // Validation des champs obligatoires
        if (!matricule_et || !nom_et || !prenom_et || !email_et) {
            return res.status(400).json({ 
                error: 'Champs obligatoires manquants',
                required: ['matricule_et', 'nom_et', 'prenom_et', 'email_et'],
                received: { matricule_et, nom_et, prenom_et, email_et }
            });
        }
        
        // Vérifier si l'email existe déjà
        const emailCheck = await db.query(
            'SELECT * FROM etudiant WHERE email_et = $1',
            [email_et]
        );
        
        if (emailCheck.rows.length > 0) {
            return res.status(409).json({ error: 'Cet email est déjà utilisé' });
        }
        
        // Vérifier si le matricule existe déjà
        const matriculeCheck = await db.query(
            'SELECT * FROM etudiant WHERE matricule_et = $1',
            [matricule_et]
        );
        
        if (matriculeCheck.rows.length > 0) {
            return res.status(409).json({ error: 'Ce matricule existe déjà' });
        }
        
        // Mot de passe par défaut si non fourni
        const defaultPassword = password_et || 'etudiant123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        // Insérer l'étudiant
        const result = await db.query(
            `INSERT INTO etudiant (matricule_et, nom_et, prenom_et, email_et, photo_et, password_et)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING matricule_et, nom_et, prenom_et, email_et, photo_et`,
            [matricule_et, nom_et, prenom_et, email_et, photo_et || null, hashedPassword]
        );
        
        console.log('✅ Étudiant créé:', result.rows[0].matricule_et);
        
        res.status(201).json({
            message: 'Étudiant créé avec succès',
            etudiant: result.rows[0],
            defaultPassword: !password_et ? 'etudiant123' : undefined
        });
    } catch (error) {
        console.error('❌ Erreur création étudiant:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

// PUT - Mettre à jour un étudiant
router.put('/:matricule', async (req, res) => {
    try {
        const { matricule } = req.params;
        const { nom_et, prenom_et, email_et, photo_et, new_password } = req.body;
        
        console.log('📝 Mise à jour étudiant:', matricule);
        
        // Vérifier si l'étudiant existe
        const check = await db.query(
            'SELECT * FROM etudiant WHERE matricule_et = $1',
            [matricule]
        );
        
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Étudiant non trouvé' });
        }
        
        // Préparer les données de mise à jour
        const updates = {};
        if (nom_et) updates.nom_et = nom_et;
        if (prenom_et) updates.prenom_et = prenom_et;
        if (email_et) updates.email_et = email_et;
        if (photo_et !== undefined) updates.photo_et = photo_et;
        
        // Mettre à jour le mot de passe si fourni
        if (new_password) {
            updates.password_et = await bcrypt.hash(new_password, 10);
        }
        
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
        }
        
        // Construire la requête SQL dynamiquement
        const setClause = Object.keys(updates)
            .map((key, index) => `${key} = $${index + 1}`)
            .join(', ');
        
        const values = Object.values(updates);
        values.push(matricule);
        
        const result = await db.query(
            `UPDATE etudiant 
             SET ${setClause}
             WHERE matricule_et = $${values.length}
             RETURNING matricule_et, nom_et, prenom_et, email_et, photo_et`,
            values
        );
        
        console.log('✅ Étudiant mis à jour');
        
        res.json({
            message: 'Étudiant mis à jour avec succès',
            etudiant: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Erreur mise à jour étudiant:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

// DELETE - Supprimer un étudiant
router.delete('/:matricule', async (req, res) => {
    try {
        const { matricule } = req.params;
        
        console.log('🗑️ Suppression étudiant:', matricule);
        
        const result = await db.query(
            'DELETE FROM etudiant WHERE matricule_et = $1 RETURNING matricule_et',
            [matricule]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Étudiant non trouvé' });
        }
        
        console.log('✅ Étudiant supprimé');
        
        res.json({ 
            message: 'Étudiant supprimé avec succès',
            matricule: result.rows[0].matricule_et
        });
    } catch (error) {
        console.error('❌ Erreur suppression étudiant:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

module.exports = router;

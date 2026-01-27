const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');

// ==================== ROUTE DE BASE ====================
router.get('/', (req, res) => {
    res.json({
        message: 'API GestNotes - Bienvenue!',
        version: '2.0.0',
        status: 'Opérationnel'
    });
});

// ==================== PÉRIODES ====================
router.get('/periodes', async (req, res) => {
    try {
        const periodes = await db.getPeriodes();
        res.json(periodes);
    } catch (error) {
        console.error('❌ Erreur GET /periodes:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/periodes/:code', async (req, res) => {
    try {
        const periode = await db.getPeriodeByCode(req.params.code);
        if (!periode) {
            return res.status(404).json({ error: 'Période non trouvée' });
        }
        res.json(periode);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/periodes', async (req, res) => {
    try {
        const { code_per, libelle_per, debut_per, fin_per } = req.body;
        const nouvelle = await db.createPeriode(code_per, libelle_per, debut_per, fin_per);
        res.status(201).json(nouvelle);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/periodes/:code', async (req, res) => {
    try {
        const { libelle_per, debut_per, fin_per } = req.body;
        const periode = await db.updatePeriode(req.params.code, libelle_per, debut_per, fin_per);
        if (!periode) {
            return res.status(404).json({ error: 'Période non trouvée' });
        }
        res.json(periode);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/periodes/:code', async (req, res) => {
    try {
        await db.deletePeriode(req.params.code);
        res.json({ message: 'Période supprimée' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== CLASSES ====================
router.get('/classes', async (req, res) => {
    try {
        const classes = await db.getClasses();
        res.json(classes);
    } catch (error) {
        console.error('❌ Erreur GET /classes:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/classes/:code', async (req, res) => {
    try {
        const classe = await db.getClasseByCode(req.params.code);
        if (!classe) {
            return res.status(404).json({ error: 'Classe non trouvée' });
        }
        res.json(classe);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/classes', async (req, res) => {
    try {
        const { code_cl, libelle_cl } = req.body;
        const nouvelle = await db.createClasse(code_cl, libelle_cl);
        res.status(201).json(nouvelle);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/classes/:code', async (req, res) => {
    try {
        const { libelle_cl } = req.body;
        const classe = await db.updateClasse(req.params.code, libelle_cl);
        if (!classe) {
            return res.status(404).json({ error: 'Classe non trouvée' });
        }
        res.json(classe);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/classes/:code', async (req, res) => {
    try {
        await db.deleteClasse(req.params.code);
        res.json({ message: 'Classe supprimée' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== MATIÈRES ====================
// Route pour récupérer TOUTES les matières
router.get('/matieres', async (req, res) => {
    try {
        console.log('📥 Requête GET /api/matieres reçue');
        const matieres = await db.getMatieres();
        console.log(`✅ ${matieres.length} matières trouvées`);
        res.json(matieres);
    } catch (error) {
        console.error('❌ Erreur GET /matieres:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route pour récupérer une matière par son code
router.get('/matieres/:code', async (req, res) => {
    try {
        const matiere = await db.getMatiereByCode(req.params.code);
        if (!matiere) {
            return res.status(404).json({ error: 'Matière non trouvée' });
        }
        res.json(matiere);
    } catch (error) {
        console.error('❌ Erreur GET /matieres/:code:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route pour récupérer les matières par classe
router.get('/matieres/classe/:code_cl', async (req, res) => {
    try {
        const matieres = await db.getMatieresByClasse(req.params.code_cl);
        res.json(matieres);
    } catch (error) {
        console.error('❌ Erreur GET /matieres/classe:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route pour créer une nouvelle matière
router.post('/matieres', async (req, res) => {
    try {
        const { code_mat, libelle_mat, nb_credit, code_cl } = req.body;
        console.log('📥 Création matière reçue:', { code_mat, libelle_mat, nb_credit, code_cl });
        
        // Validation des données
        if (!code_mat || !libelle_mat || !nb_credit || !code_cl) {
            return res.status(400).json({ 
                error: 'Tous les champs sont requis: code_mat, libelle_mat, nb_credit, code_cl',
                received: { code_mat, libelle_mat, nb_credit, code_cl }
            });
        }
        
        const nouvelle = await db.createMatiere(code_mat, libelle_mat, nb_credit, code_cl);
        res.status(201).json(nouvelle);
    } catch (error) {
        console.error('❌ Erreur POST /matieres:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Route pour mettre à jour une matière
router.put('/matieres/:code', async (req, res) => {
    try {
        const { libelle_mat, nb_credit, code_cl } = req.body;
        
        // Validation
        if (!libelle_mat || !nb_credit || !code_cl) {
            return res.status(400).json({ 
                error: 'Tous les champs sont requis: libelle_mat, nb_credit, code_cl',
                received: { libelle_mat, nb_credit, code_cl }
            });
        }
        
        const matiere = await db.updateMatiere(req.params.code, libelle_mat, nb_credit, code_cl);
        if (!matiere) {
            return res.status(404).json({ error: 'Matière non trouvée' });
        }
        res.json(matiere);
    } catch (error) {
        console.error('❌ Erreur PUT /matieres:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Route pour supprimer une matière
router.delete('/matieres/:code', async (req, res) => {
    try {
        await db.deleteMatiere(req.params.code);
        res.json({ message: 'Matière supprimée' });
    } catch (error) {
        console.error('❌ Erreur DELETE /matieres:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==================== ÉTUDIANTS ====================
router.get('/etudiants', async (req, res) => {
    try {
        console.log('📥 Requête GET /api/etudiants reçue');
        const result = await db.query('SELECT * FROM etudiant ORDER BY nom_et, prenom_et');
        console.log(`✅ ${result.rows.length} étudiants trouvés`);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Erreur GET /etudiants:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/etudiants/:matricule', async (req, res) => {
    try {
        const matricule = req.params.matricule;
        console.log('🔍 Recherche étudiant:', matricule);
        
        // ERREUR CORRIGÉE ICI : on recherche l'étudiant par son matricule !
        const result = await db.query('SELECT * FROM etudiant WHERE matricule_et = $1', [matricule]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Étudiant non trouvé' });
        }
        
        // Récupérer aussi l'inscription de l'étudiant
        const inscription = await db.query(
            'SELECT * FROM inscription WHERE matricule_et = $1',
            [matricule]
        );
        
        const etudiant = result.rows[0];
        if (inscription.rows.length > 0) {
            etudiant.code_cl = inscription.rows[0].code_cl;
        }
        
        res.json(etudiant);
    } catch (error) {
        console.error('❌ Erreur GET /etudiants/:matricule:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/etudiants', async (req, res) => {
    try {
        const { matricule_et, nom_et, prenom_et, email_et, password_et, photo_et } = req.body;
        
        console.log('📥 Création étudiant:', { matricule_et, nom_et, prenom_et, email_et });
        
        // Validation
        if (!matricule_et || !nom_et || !prenom_et || !email_et) {
            return res.status(400).json({ error: 'Champs requis manquants' });
        }
        
        const hashedPassword = await bcrypt.hash(password_et || matricule_et, 10);
        
        const result = await db.query(
            `INSERT INTO etudiant 
             (matricule_et, nom_et, prenom_et, email_et, password_et, photo_et, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) 
             RETURNING matricule_et, nom_et, prenom_et, email_et, photo_et, created_at`,
            [matricule_et, nom_et, prenom_et, email_et, hashedPassword, photo_et || null]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('❌ Erreur POST /etudiants:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/etudiants/:matricule', async (req, res) => {
    try {
        const matricule = req.params.matricule;
        const { nom_et, prenom_et, email_et, photo_et } = req.body;
        
        console.log('📝 Mise à jour étudiant:', matricule);
        
        const result = await db.query(
            `UPDATE etudiant 
             SET nom_et = $1, prenom_et = $2, email_et = $3, photo_et = $4
             WHERE matricule_et = $5 
             RETURNING matricule_et, nom_et, prenom_et, email_et, photo_et`,
            [nom_et, prenom_et, email_et, photo_et || null, matricule]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Étudiant non trouvé' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ Erreur PUT /etudiants/:matricule:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/etudiants/:matricule', async (req, res) => {
    try {
        const matricule = req.params.matricule;
        console.log('🗑️ Suppression étudiant:', matricule);
        
        // Supprimer d'abord les inscriptions
        await db.query('DELETE FROM inscription WHERE matricule_et = $1', [matricule]);
        
        // Supprimer l'étudiant
        const result = await db.query('DELETE FROM etudiant WHERE matricule_et = $1 RETURNING matricule_et', [matricule]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Étudiant non trouvé' });
        }
        
        res.json({ message: 'Étudiant supprimé avec succès' });
    } catch (error) {
        console.error('❌ Erreur DELETE /etudiants/:matricule:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== INSCRIPTIONS ====================
router.get('/inscriptions', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM inscription ORDER BY num_ins DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Erreur GET /inscriptions:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/inscriptions/details', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT i.*, e.nom_et, e.prenom_et, e.email_et, c.libelle_cl
            FROM inscription i
            JOIN etudiant e ON i.matricule_et = e.matricule_et
            JOIN classe c ON i.code_cl = c.code_cl
            ORDER BY i.num_ins DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Erreur GET /inscriptions/details:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/inscriptions/etudiant/:matricule', async (req, res) => {
    try {
        const matricule = req.params.matricule;
        const result = await db.query(
            'SELECT * FROM inscription WHERE matricule_et = $1',
            [matricule]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Erreur GET /inscriptions/etudiant/:matricule:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/inscriptions', async (req, res) => {
    try {
        const { matricule_et, code_cl, annee_academique } = req.body;
        console.log('📥 Création inscription:', { matricule_et, code_cl });
        
        // Vérifier si l'étudiant existe
        const etudiant = await db.query('SELECT * FROM etudiant WHERE matricule_et = $1', [matricule_et]);
        if (etudiant.rows.length === 0) {
            return res.status(404).json({ error: 'Étudiant non trouvé' });
        }
        
        // Vérifier si la classe existe
        const classe = await db.query('SELECT * FROM classe WHERE code_cl = $1', [code_cl]);
        if (classe.rows.length === 0) {
            return res.status(404).json({ error: 'Classe non trouvée' });
        }
        
        // Vérifier si l'inscription existe déjà pour cette année
        const existe = await db.query(
            'SELECT * FROM inscription WHERE matricule_et = $1 AND code_cl = $2 AND annee_academique = $3',
            [matricule_et, code_cl, annee_academique || '2025-2026']
        );
        
        if (existe.rows.length > 0) {
            return res.status(409).json({ error: 'L\'étudiant est déjà inscrit dans cette classe pour cette année' });
        }
        
        const result = await db.query(
            `INSERT INTO inscription 
             (matricule_et, code_cl, annee_academique) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [matricule_et, code_cl, annee_academique || '2025-2026']
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('❌ Erreur POST /inscriptions:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/inscriptions/:num_ins', async (req, res) => {
    try {
        const num_ins = req.params.num_ins;
        const { code_cl } = req.body;
        console.log('📝 Mise à jour inscription:', num_ins);
        
        const result = await db.query(
            `UPDATE inscription 
             SET code_cl = $1
             WHERE num_ins = $2 
             RETURNING *`,
            [code_cl, num_ins]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inscription non trouvée' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ Erreur PUT /inscriptions/:num_ins:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
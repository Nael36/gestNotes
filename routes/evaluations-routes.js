const express = require('express');
const router = express.Router();
const db = require('../database');

// ==================== ROUTES ÉVALUATIONS ====================

// GET - Récupérer toutes les évaluations
router.get('/evaluations', async (req, res) => {
    try {
        const { code_mat, code_per, matricule_ens } = req.query;
        
        let query = `
            SELECT 
                e.*,
                et.nom_et,
                et.prenom_et,
                m.libelle_mat,
                p.libelle_per
            FROM evaluation e
            JOIN inscription i ON e.num_ins = i.num_ins
            JOIN etudiant et ON i.matricule_et = et.matricule_et
            JOIN matiere m ON e.code_mat = m.code_mat
            JOIN periode p ON e.code_per = p.code_per
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        if (code_mat) {
            query += ` AND e.code_mat = $${paramIndex++}`;
            params.push(code_mat);
        }
        
        if (code_per) {
            query += ` AND e.code_per = $${paramIndex++}`;
            params.push(code_per);
        }
        
        if (matricule_ens) {
            query += ` AND e.matricule_ens = $${paramIndex++}`;
            params.push(matricule_ens);
        }
        
        query += ` ORDER BY et.nom_et, et.prenom_et`;
        
        const result = await db.query(query, params);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Erreur récupération évaluations:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST - Créer une évaluation (attribuer une note)
router.post('/evaluations', async (req, res) => {
    try {
        const { matricule_ens, code_mat, num_ins, code_per, date_eval, note } = req.body;
        
        console.log('📝 Création évaluation reçue:', { 
            matricule_ens, 
            code_mat, 
            num_ins, 
            code_per, 
            note,
            date_eval // On log mais on ne l'utilise pas
        });
        
        // Validation
        if (!matricule_ens || !code_mat || !num_ins || !code_per) {
            return res.status(400).json({ 
                error: 'Tous les champs sont requis',
                missing: {
                    matricule_ens: !matricule_ens,
                    code_mat: !code_mat,
                    num_ins: !num_ins,
                    code_per: !code_per
                }
            });
        }
        
        // Vérifier que la note est valide si elle est fournie
        if (note !== undefined && note !== null) {
            const noteNum = parseFloat(note);
            if (isNaN(noteNum)) {
                return res.status(400).json({ error: 'La note doit être un nombre' });
            }
            if (noteNum < 0 || noteNum > 20) {
                return res.status(400).json({ error: 'La note doit être entre 0 et 20' });
            }
        }
        
        // Vérifier si une évaluation existe déjà
        const existingCheck = await db.query(
            `SELECT * FROM evaluation 
            WHERE matricule_ens = $1 AND code_mat = $2 AND num_ins = $3 AND code_per = $4`,
            [matricule_ens, code_mat, num_ins, code_per]
        );
        
        if (existingCheck.rows.length > 0) {
            // Mettre à jour l'évaluation existante
            const result = await db.query(
                `UPDATE evaluation 
                SET note = $1
                WHERE id_eval = $2
                RETURNING *`,
                [note, existingCheck.rows[0].id_eval]
            );
            
            console.log('✅ Évaluation mise à jour:', result.rows[0].id_eval);
            return res.json(result.rows[0]);
        }
        
        // Créer l'évaluation - CORRECTION: NE PAS inclure date_eval !
        const result = await db.query(
            `INSERT INTO evaluation (matricule_ens, code_mat, num_ins, code_per, note)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                matricule_ens, 
                code_mat, 
                num_ins, 
                code_per, 
                note
            ]
        );
        
        console.log('✅ Évaluation créée:', result.rows[0].id_eval);
        res.status(201).json(result.rows[0]);
        
    } catch (error) {
        console.error('❌ Erreur création évaluation:', error.message);
        console.error('❌ Code erreur:', error.code);
        console.error('❌ Requête reçue:', req.body);
        
        // Message d'erreur spécifique pour date_eval
        if (error.message.includes('date_eval')) {
            return res.status(400).json({ 
                error: 'Erreur de structure de base de données',
                details: 'La colonne date_eval n\'existe pas dans la table evaluation',
                solution: 'Supprimez le champ date_eval des données envoyées',
                received: req.body
            });
        }
        
        res.status(500).json({ 
            error: 'Erreur serveur', 
            details: error.message,
            received: req.body 
        });
    }
});

// PUT - Mettre à jour une évaluation
router.put('/evaluations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;
        
        if (note === undefined) {
            return res.status(400).json({ error: 'La note est requise' });
        }
        
        const noteNum = parseFloat(note);
        if (isNaN(noteNum)) {
            return res.status(400).json({ error: 'La note doit être un nombre' });
        }
        
        if (noteNum < 0 || noteNum > 20) {
            return res.status(400).json({ error: 'La note doit être entre 0 et 20' });
        }
        
        const result = await db.query(
            `UPDATE evaluation 
            SET note = $1
            WHERE id_eval = $2
            RETURNING *`,
            [note, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Évaluation non trouvée' });
        }
        
        console.log('✅ Évaluation mise à jour:', id);
        res.json(result.rows[0]);
        
    } catch (error) {
        console.error('❌ Erreur mise à jour évaluation:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET - Récupérer les évaluations par enseignant, matière et période
router.get('/evaluations/enseignant/:matricule_ens/matiere/:code_matiere/periode/:code_periode', async (req, res) => {
    try {
        const { matricule_ens, code_matiere, code_periode } = req.params;
        
        console.log('🔍 Recherche évaluations:', { matricule_ens, code_matiere, code_periode });
        
        const result = await db.query(`
            SELECT 
                e.id_eval,
                e.num_ins,
                e.note,
                i.matricule_et,
                et.nom_et,
                et.prenom_et
            FROM evaluation e
            JOIN inscription i ON e.num_ins = i.num_ins
            JOIN etudiant et ON i.matricule_et = et.matricule_et
            WHERE e.matricule_ens = $1 
            AND e.code_mat = $2 
            AND e.code_per = $3
            ORDER BY et.nom_et, et.prenom_et
        `, [matricule_ens, code_matiere, code_periode]);
        
        console.log('✅ Évaluations trouvées:', result.rows.length);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Erreur recherche évaluations:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

// DELETE - Supprimer une évaluation
router.delete('/evaluations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(
            'DELETE FROM evaluation WHERE id_eval = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Évaluation non trouvée' });
        }
        
        console.log('✅ Évaluation supprimée');
        res.json({ message: 'Évaluation supprimée avec succès' });
        
    } catch (error) {
        console.error('❌ Erreur suppression évaluation:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
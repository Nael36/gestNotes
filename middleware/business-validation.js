// middleware/business-validation.js
const db = require('../database');

// ==================== VALIDATION INSCRIPTION ====================
const validateInscriptionUnique = async (req, res, next) => {
    try {
        const { matricule_et, annee_academique } = req.body;
        
        // Vérifier si l'étudiant est déjà inscrit cette année académique
        const existing = await db.query(
            'SELECT * FROM inscription WHERE matricule_et = $1 AND annee_academique = $2',
            [matricule_et, annee_academique || '2024-2025']
        );
        
        if (existing.rows.length > 0) {
            return res.status(409).json({ 
                error: 'Cet étudiant est déjà inscrit cette année académique',
                code: 'INSCRIPTION_EXISTS',
                existing_inscription: existing.rows[0]
            });
        }
        
        next();
    } catch (error) {
        console.error('❌ Erreur validation inscription:', error);
        res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
    }
};

// ==================== VALIDATION ENSEIGNEMENT ====================
const validateEnseignementAuth = async (req, res, next) => {
    try {
        const { matricule_ens, code_mat, code_cl, annee_academique } = req.body;
        
        // Vérifier que l'enseignant existe
        const enseignantCheck = await db.query(
            'SELECT * FROM enseignant WHERE matricule_ens = $1',
            [matricule_ens]
        );
        
        if (enseignantCheck.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Enseignant non trouvé',
                code: 'ENSEIGNANT_NOT_FOUND'
            });
        }
        
        // Vérifier que la matière existe
        const matiereCheck = await db.query(
            'SELECT * FROM matiere WHERE code_mat = $1',
            [code_mat]
        );
        
        if (matiereCheck.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Matière non trouvée',
                code: 'MATIERE_NOT_FOUND'
            });
        }
        
        // Vérifier que la classe existe
        const classeCheck = await db.query(
            'SELECT * FROM classe WHERE code_cl = $1',
            [code_cl]
        );
        
        if (classeCheck.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Classe non trouvée',
                code: 'CLASSE_NOT_FOUND'
            });
        }
        
        // Vérifier que la matière appartient bien à cette classe
        if (matiereCheck.rows[0].code_cl !== code_cl) {
            return res.status(400).json({ 
                error: 'Cette matière n\'appartient pas à cette classe',
                code: 'MATIERE_CLASSE_MISMATCH'
            });
        }
        
        // Vérifier si l'enseignement existe déjà
        const existing = await db.query(
            'SELECT * FROM enseignement WHERE matricule_ens = $1 AND code_mat = $2 AND code_cl = $3 AND annee_academique = $4',
            [matricule_ens, code_mat, code_cl, annee_academique || '2024-2025']
        );
        
        if (existing.rows.length > 0) {
            return res.status(409).json({ 
                error: 'Cet enseignement existe déjà',
                code: 'ENSEIGNEMENT_EXISTS'
            });
        }
        
        next();
    } catch (error) {
        console.error('❌ Erreur validation enseignement:', error);
        res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
    }
};

// ==================== VALIDATION ÉVALUATION ====================
const validateEvaluationAuth = async (req, res, next) => {
    try {
        const { id_ens, matricule_et, code_per, type_eval } = req.body;
        
        // Vérifier que l'enseignement existe
        const enseignementCheck = await db.query(
            'SELECT * FROM enseignement WHERE id_ens = $1',
            [id_ens]
        );
        
        if (enseignementCheck.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Enseignement non trouvé',
                code: 'ENSEIGNEMENT_NOT_FOUND'
            });
        }
        
        // Vérifier que l'étudiant existe
        const etudiantCheck = await db.query(
            'SELECT * FROM etudiant WHERE matricule_et = $1',
            [matricule_et]
        );
        
        if (etudiantCheck.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Étudiant non trouvé',
                code: 'ETUDIANT_NOT_FOUND'
            });
        }
        
        // Vérifier que la période existe
        const periodeCheck = await db.query(
            'SELECT * FROM periode WHERE code_per = $1',
            [code_per]
        );
        
        if (periodeCheck.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Période non trouvée',
                code: 'PERIODE_NOT_FOUND'
            });
        }
        
        // Vérifier que l'étudiant est bien inscrit dans la classe de l'enseignement
        const inscriptionCheck = await db.query(
            'SELECT * FROM inscription WHERE matricule_et = $1 AND code_cl = $2 AND annee_academique = $3',
            [matricule_et, enseignementCheck.rows[0].code_cl, enseignementCheck.rows[0].annee_academique]
        );
        
        if (inscriptionCheck.rows.length === 0) {
            return res.status(400).json({ 
                error: 'L\'étudiant n\'est pas inscrit dans cette classe',
                code: 'ETUDIANT_NOT_INSCRITED'
            });
        }
        
        // Vérifier si l'évaluation existe déjà
        const existing = await db.query(
            'SELECT * FROM evaluation WHERE id_ens = $1 AND matricule_et = $2 AND code_per = $3 AND type_eval = $4',
            [id_ens, matricule_et, code_per, type_eval]
        );
        
        if (existing.rows.length > 0) {
            return res.status(409).json({ 
                error: 'Ce type d\'évaluation existe déjà pour cet étudiant',
                code: 'EVALUATION_EXISTS'
            });
        }
        
        // Ajouter les informations vérifiées à la requête pour usage ultérieur
        req.enseignement = enseignementCheck.rows[0];
        req.etudiant = etudiantCheck.rows[0];
        req.periode = periodeCheck.rows[0];
        req.inscription = inscriptionCheck.rows[0];
        
        next();
    } catch (error) {
        console.error('❌ Erreur validation évaluation:', error);
        res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
    }
};

// ==================== VALIDATION AUTORISATION ENSEIGNANT ====================
const validateEnseignantAuthorization = (req, res, next) => {
    return (req, res, next) => {
        // Si l'utilisateur est un admin, il a tous les droits
        if (req.user.role === 'admin') {
            return next();
        }
        
        // Si l'utilisateur est un enseignant, vérifier qu'il est autorisé
        if (req.user.role === 'enseignant') {
            const { matricule_ens } = req.body;
            const { matricule_ens: paramEns } = req.params;
            const enseignementId = req.body.id_ens;
            
            // Vérifier si l'enseignant essaie d'agir sur ses propres données
            if (matricule_ens && matricule_ens !== req.user.id) {
                return res.status(403).json({ 
                    error: 'Vous n\'êtes pas autorisé à agir sur cet enseignant',
                    code: 'UNAUTHORIZED_ENSEIGNANT'
                });
            }
            
            if (paramEns && paramEns !== req.user.id) {
                return res.status(403).json({ 
                    error: 'Vous n\'êtes pas autorisé à accéder à ces données',
                    code: 'UNAUTHORIZED_ACCESS'
                });
            }
        }
        
        next();
    };
};

// ==================== VALIDATION ACCÈS ÉTUDIANT ====================
const validateEtudiantAccess = (req, res, next) => {
    return (req, res, next) => {
        const { matricule } = req.params;
        const { matricule_et } = req.body;
        
        // Si l'utilisateur est admin ou enseignant, accès autorisé
        if (['admin', 'enseignant'].includes(req.user.role)) {
            return next();
        }
        
        // Si l'utilisateur est un étudiant, vérifier qu'il accède à ses propres données
        if (req.user.role === 'etudiant') {
            if (matricule && matricule !== req.user.id) {
                return res.status(403).json({ 
                    error: 'Vous n\'êtes pas autorisé à accéder à ces données',
                    code: 'UNAUTHORIZED_ETUDIANT_ACCESS'
                });
            }
            
            if (matricule_et && matricule_et !== req.user.id) {
                return res.status(403).json({ 
                    error: 'Vous n\'êtes pas autorisé à agir sur cet étudiant',
                    code: 'UNAUTHORIZED_ETUDIANT_ACTION'
                });
            }
        }
        
        next();
    };
};

// ==================== VALIDATION NOTES ====================
const validateNote = (req, res, next) => {
    const { note } = req.body;
    
    if (note !== undefined && (note < 0 || note > 20)) {
        return res.status(400).json({ 
            error: 'La note doit être comprise entre 0 et 20',
            code: 'INVALID_NOTE_RANGE',
            min: 0,
            max: 20
        });
    }
    
    next();
};

// ==================== VALIDATION TYPE ÉVALUATION ====================
const validateTypeEvaluation = (req, res, next) => {
    const { type_eval } = req.body;
    
    const typesValid = ['CC', 'EXAMEN', 'TP', 'PROJET', 'ORAL'];
    
    if (type_eval && !typesValid.includes(type_eval)) {
        return res.status(400).json({ 
            error: 'Type d\'évaluation invalide',
            code: 'INVALID_EVALUATION_TYPE',
            valid_types: typesValid
        });
    }
    
    next();
};

// ==================== VALIDATION COEFFICIENT ====================
const validateCoefficient = (req, res, next) => {
    const { coefficient } = req.body;
    
    if (coefficient !== undefined && (coefficient <= 0 || coefficient > 5)) {
        return res.status(400).json({ 
            error: 'Le coefficient doit être compris entre 0.01 et 5',
            code: 'INVALID_COEFFICIENT',
            min: 0.01,
            max: 5
        });
    }
    
    next();
};

module.exports = {
    validateInscriptionUnique,
    validateEnseignementAuth,
    validateEvaluationAuth,
    validateEnseignantAuthorization,
    validateEtudiantAccess,
    validateNote,
    validateTypeEvaluation,
    validateCoefficient
};

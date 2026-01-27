// middleware/validation.js
const validator = require('validator');

// ==================== VALIDATION EMAIL ====================
const validateEmail = (email) => {
    return validator.isEmail(email);
};

// ==================== VALIDATION MOT DE PASSE ====================
const validatePassword = (password) => {
    // Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

// ==================== VALIDATION CHAMPS OBLIGATOIRES ====================
const validateRequiredFields = (fields, data) => {
    const missing = [];
    for (const field of fields) {
        if (!data[field] || data[field].trim() === '') {
            missing.push(field);
        }
    }
    return missing;
};

// ==================== VALIDATION MATRICULE ====================
const validateMatricule = (matricule) => {
    // Format: Lettres + chiffres, min 3 caractères
    const matriculeRegex = /^[A-Za-z0-9]{3,}$/;
    return matriculeRegex.test(matricule);
};

// ==================== VALIDATION TÉLÉPHONE ====================
const validatePhone = (phone) => {
    // Accepte les formats internationaux
    if (!phone) return true; // Optionnel
    return validator.isMobilePhone(phone, 'any', { strictMode: false });
};

// ==================== MIDDLEWARE VALIDATION INSCRIPTION ====================
const validateRegistration = (req, res, next) => {
    const { nom, prenom, email, password, matricule } = req.body;
    
    // Vérifier champs obligatoires
    const requiredFields = ['nom', 'prenom', 'email', 'password', 'matricule'];
    const missing = validateRequiredFields(requiredFields, req.body);
    
    if (missing.length > 0) {
        return res.status(400).json({
            error: 'Champs obligatoires manquants',
            missing: missing,
            code: 'MISSING_FIELDS'
        });
    }
    
    // Valider email
    if (!validateEmail(email)) {
        return res.status(400).json({
            error: 'Format d\'email invalide',
            field: 'email',
            code: 'INVALID_EMAIL'
        });
    }
    
    // Valider mot de passe
    if (!validatePassword(password)) {
        return res.status(400).json({
            error: 'Le mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 minuscule et 1 chiffre',
            field: 'password',
            code: 'INVALID_PASSWORD'
        });
    }
    
    // Valider matricule
    if (!validateMatricule(matricule)) {
        return res.status(400).json({
            error: 'Format de matricule invalide (min 3 caractères alphanumériques)',
            field: 'matricule',
            code: 'INVALID_MATRICULE'
        });
    }
    
    // Valider téléphone si fourni
    if (req.body.tel && !validatePhone(req.body.tel)) {
        return res.status(400).json({
            error: 'Format de téléphone invalide',
            field: 'tel',
            code: 'INVALID_PHONE'
        });
    }
    
    // Nettoyer les données
    req.body.nom = validator.escape(nom.trim());
    req.body.prenom = validator.escape(prenom.trim());
    req.body.email = email.toLowerCase().trim();
    req.body.matricule = matricule.toUpperCase().trim();
    if (req.body.tel) {
        req.body.tel = req.body.tel.trim();
    }
    
    next();
};

// ==================== MIDDLEWARE VALIDATION CONNEXION ====================
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            error: 'Email et mot de passe requis',
            code: 'MISSING_CREDENTIALS'
        });
    }
    
    if (!validateEmail(email)) {
        return res.status(400).json({
            error: 'Format d\'email invalide',
            field: 'email',
            code: 'INVALID_EMAIL'
        });
    }
    
    req.body.email = email.toLowerCase().trim();
    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    validateEmail,
    validatePassword,
    validateMatricule,
    validatePhone
};

// middleware/security.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// ==================== HELMET CONFIGURATION ====================
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
});

// ==================== RATE LIMITING CONFIGURATION ====================
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            error: message,
            code: 'RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            console.warn(`⚠️ Rate limit exceeded for IP: ${req.ip}`);
            res.status(429).json({
                error: message,
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    });
};

// ==================== RATE LIMITERS SPÉCIFIQUES ====================
// Limite générale pour toutes les requêtes
const generalLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    1000, // 1000 requêtes par IP
    'Trop de requêtes, veuillez réessayer plus tard'
);

// Limite stricte pour l'authentification
const authLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // 5 tentatives de connexion par IP
    'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes'
);

// Limite pour les inscriptions
const registrationLimiter = createRateLimit(
    60 * 60 * 1000, // 1 heure
    3, // 3 inscriptions par IP
    'Trop de tentatives d\'inscription, veuillez réessayer dans 1 heure'
);

// Limite pour les opérations CRUD
const crudLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    50, // 50 opérations par IP
    'Trop d\'opérations, veuillez ralentir votre rythme'
);

// ==================== NETTOYAGE DES DONNÉES ====================
const sanitizeInput = (req, res, next) => {
    // Supprimer les champs potentiellement dangereux
    delete req.body.password_confirm;
    delete req.body._method;
    delete req.body._csrf;
    
    // Logger les requêtes suspectes
    if (req.body && Object.keys(req.body).length > 50) {
        console.warn(`⚠️ Suspicious large payload from IP: ${req.ip}`);
    }
    
    next();
};

// ==================== VALIDATION ORIGINE ====================
const validateOrigin = (req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = process.env.CORS_ORIGIN ? 
        process.env.CORS_ORIGIN.split(',') : 
        ['http://localhost:3000', 'http://localhost:5000'];
    
    // En développement, être plus permissif
    if (process.env.NODE_ENV === 'development') {
        return next();
    }
    
    if (origin && allowedOrigins.includes(origin)) {
        return next();
    }
    
    if (!origin) {
        return next(); // Permettre les requêtes sans origine (ex: Postman)
    }
    
    console.warn(`⚠️ Blocked request from unauthorized origin: ${origin}`);
    res.status(403).json({
        error: 'Origine non autorisée',
        code: 'UNAUTHORIZED_ORIGIN'
    });
};

module.exports = {
    helmetConfig,
    generalLimiter,
    authLimiter,
    registrationLimiter,
    crudLimiter,
    sanitizeInput,
    validateOrigin
};

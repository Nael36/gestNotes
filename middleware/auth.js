// ====================================================================
// MIDDLEWARE D'AUTHENTIFICATION - Gestion des tokens JWT et des rôles
// ====================================================================
// 
// Ce middleware gère l'authentification des utilisateurs dans l'application GestNotes.
// Il utilise des tokens JWT (JSON Web Tokens) pour maintenir une session sécurisée
// entre le frontend et le backend.
//
// FONCTIONNALITÉS:
// 1. Vérification de la validité des tokens JWT
// 2. Gestion des rôles (admin, enseignant, étudiant)
// 3. Protection des routes selon les permissions
// 4. Génération et validation des tokens
//
// UTILISATION:
// - Ajouter `authenticateToken` comme middleware sur les routes protégées
// - Ajouter `requireRole(['admin', 'enseignant'])` pour restreindre l'accès
// - Utiliser `generateToken` pour créer des tokens après connexion/inscription
//
// EXEMPLE:
// app.get('/api/evaluations', authenticateToken, requireRole(['enseignant']), (req, res) => {
//     // Seul un enseignant connecté peut accéder à cette route
// });
// ====================================================================

const jwt = require('jsonwebtoken'); // Bibliothèque pour créer et vérifier les tokens JWT

// ==================== AUTHENTIFICATION MIDDLEWARE ====================
/**
 * Middleware d'authentification JWT
 * 
 * Vérifie la présence et la validité d'un token JWT dans les en-têtes de requête.
 * Si le token est valide, ajoute les informations de l'utilisateur à l'objet req.
 * 
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Fonction suivante du middleware Express
 * 
 * @returns {void} - Envoie une réponse d'erreur si le token est invalide
 */
const authenticateToken = (req, res, next) => {
    // Extraire le token de l'en-tête Authorization
    // Format attendu: "Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    // Vérifier si le token est présent
    if (!token) {
        return res.status(401).json({ 
            error: 'Token d\'authentification manquant',
            code: 'TOKEN_MISSING',
            message: 'Veuillez fournir un token d\'authentification'
        });
    }
    
    // Vérifier la validité du token avec la clé secrète
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('❌ Erreur vérification token:', err.message);
            return res.status(403).json({ 
                error: 'Token invalide ou expiré',
                code: 'TOKEN_INVALID',
                message: 'Votre session a expiré, veuillez vous reconnecter'
            });
        }
        
        // Ajouter les informations de l'utilisateur à la requête
        // pour utilisation dans les routes suivantes
        req.user = user;
        next(); // Passer à la suite
    });
};

// ==================== RÔLE BASED MIDDLEWARE ====================
/**
 * Middleware de gestion des rôles et permissions
 * 
 * Vérifie si l'utilisateur connecté a les rôles requis pour accéder à une route.
 * Doit être utilisé APRÈS le middleware authenticateToken.
 * 
 * @param {Array} roles - Tableau des rôles autorisés (ex: ['admin', 'enseignant'])
 * @returns {Function} - Middleware Express
 * 
 * @example
 * // Seuls les admins et enseignants peuvent accéder
 * app.get('/api/evaluations', authenticateToken, requireRole(['admin', 'enseignant']), (req, res) => {
 *     // ...
 * });
 */
const requireRole = (roles) => {
    return (req, res, next) => {
        // Vérifier si l'utilisateur est authentifié
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Utilisateur non authentifié',
                code: 'USER_NOT_AUTHENTICATED',
                message: 'Veuillez vous connecter pour accéder à cette ressource'
            });
        }
        
        // Vérifier si l'utilisateur a le rôle requis
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Droits insuffisants',
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'Vous n\'avez pas les permissions nécessaires',
                required: roles, // Rôles requis pour cette route
                current: req.user.role // Rôle actuel de l'utilisateur
            });
        }
        
        // L'utilisateur a les permissions requises
        next(); // Passer à la route suivante
    };
};

// ==================== GÉNÉRATION TOKEN ====================
/**
 * Génère un token JWT pour l'authentification
 * 
 * Crée un token JWT contenant les informations de l'utilisateur
 * avec une durée d'expiration configurable.
 * 
 * @param {Object} payload - Données à inclure dans le token (id, email, role, etc.)
 * @returns {String} - Token JWT signé
 * 
 * @example
 * const token = generateToken({
 *     id: user.id,
 *     email: user.email,
 *     role: user.role
 * });
 */
const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h', // Durée de validité (24h par défaut)
        issuer: 'gestnotes-app', // Émetteur du token
        audience: 'gestnotes-users' // Audience du token
    });
};

// ==================== VALIDATION TOKEN ====================
/**
 * Vérifie la validité d'un token JWT sans l'appliquer comme middleware
 * 
 * Utile pour valider un token dans des contextes où le middleware n'est pas approprié.
 * 
 * @param {String} token - Token JWT à vérifier
 * @returns {Object|null} - Payload décodé si valide, null sinon
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        console.error('❌ Token invalide:', error.message);
        return null;
    }
};

// Export des fonctions pour utilisation dans d'autres fichiers
module.exports = {
    authenticateToken,    // Middleware pour protéger les routes
    requireRole,        // Middleware pour vérifier les rôles
    generateToken,       // Fonction pour créer des tokens
    verifyToken         // Fonction pour vérifier les tokens
};

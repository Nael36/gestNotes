// config.js - À placer dans /Admin/js/config.js
const APP_CONFIG = {
    baseUrl: 'http://localhost:5000',
    apiUrl: 'http://localhost:5000/api',
    
    // Chemins relatifs
    getAuthPage: function() {
        const currentPath = window.location.pathname;
        if (currentPath.includes('/Admin/')) {
            return '../auth-fixed.html';
        }
        return 'auth-fixed.html';
    },
    
    getInscriptionsPage: function() {
        const currentPath = window.location.pathname;
        if (currentPath === '/auth-fixed.html' || currentPath.includes('auth-fixed.html')) {
            return 'Admin/inscriptions.html';
        }
        return 'inscriptions.html';
    }
};
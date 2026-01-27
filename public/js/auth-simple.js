// auth-simple.js - Version finale corrigée
window.auth = (function() {
    const API_URL = 'http://localhost:5000/api';
    
    return {
        // Vérifier si l'utilisateur est connecté
        isAuthenticated: function() {
            const user = localStorage.getItem('user');
            const admin = localStorage.getItem('admin');
            return user !== null || admin !== null;
        },

        // Obtenir les données utilisateur
        get user() {
            // Essayer d'abord 'admin', puis 'user'
            let adminStr = localStorage.getItem('admin');
            if (adminStr && adminStr !== "null" && adminStr !== "undefined") {
                try {
                    const adminData = JSON.parse(adminStr);
                    return {
                        ...adminData,
                        role: 'admin',
                        id: adminData.id_admin || 1,
                        nom: adminData.nom_admin || 'Admin',
                        prenom: adminData.prenom_admin || 'System',
                        email: adminData.email_admin
                    };
                } catch {}
            }
            
            // Sinon essayer 'user'
            const userStr = localStorage.getItem('user');
            if (!userStr || userStr === "null" || userStr === "undefined") return null;
            
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        },

        // Déconnexion
        logout: function() {
            localStorage.removeItem('user');
            localStorage.removeItem('admin');
            localStorage.removeItem('token');
            window.location.href = '../auth-fixed.html';
        },

        // Redirection selon le rôle
        redirectByRole: function() {
            const user = this.user;
            console.log('🔀 Redirection pour utilisateur:', user);
            
            if (!user) {
                this.logout();
                return;
            }
            
            switch(user.role) {
                case 'admin':
                    window.location.href = 'Admin/inscriptions.html';
                    break;
                case 'enseignant':
                    window.location.href = 'enseignant/index.html';
                    break;
                case 'etudiant':
                    window.location.href = 'etudiant/notes.html';
                    break;
                default:
                    this.logout();
            }
        },

        // Connexion API
        login: async function(email, password, role) {
            try {
                let endpoint;
                let bodyData;
                
                // Déterminer l'endpoint et le body selon le rôle
                switch(role) {
                    case 'admin':
                        endpoint = '/auth/admin/login';
                        bodyData = { email_admin: email, password_admin: password };
                        break;
                    case 'enseignant':
                        endpoint = '/auth/enseignant/login';
                        bodyData = { email_ens: email, password_ens: password };
                        break;
                    case 'etudiant':
                        endpoint = '/auth/etudiant/login';
                        bodyData = { email_et: email, password_et: password };
                        break;
                    default:
                        throw new Error('Rôle invalide');
                }

                const response = await fetch(`${API_URL}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(bodyData)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || data.error || 'Erreur de connexion');
                }

                // Stocker les données utilisateur selon le rôle
                let userData = {};
                switch(role) {
                    case 'admin':
                        userData = {
                            id_admin: data.id_admin || 1,
                            nom_admin: data.nom_admin || 'Admin',
                            prenom_admin: data.prenom_admin || 'Système',
                            email_admin: data.email_admin || email,
                            role: 'admin'
                        };
                        // Pour admin, stocker aussi dans 'admin'
                        localStorage.setItem('admin', JSON.stringify(userData));
                        localStorage.setItem('user', JSON.stringify({
                            ...userData,
                            id: userData.id_admin,
                            nom: userData.nom_admin,
                            prenom: userData.prenom_admin,
                            email: userData.email_admin,
                            matricule: `ADM${userData.id_admin.toString().padStart(3, '0')}`
                        }));
                        break;
                    case 'enseignant':
                        userData = {
                            id: data.matricule_ens || data.id,
                            nom: data.nom_ens || data.nom,
                            prenom: data.prenom_ens || data.prenom,
                            email: data.email_ens || data.email,
                            role: 'enseignant',
                            matricule: data.matricule_ens || data.matricule,
                            telephone: data.tel_ens || data.telephone
                        };
                        localStorage.setItem('user', JSON.stringify(userData));
                        break;
                    case 'etudiant':
                        userData = {
                            id: data.matricule_et || data.id,
                            nom: data.nom_et || data.nom,
                            prenom: data.prenom_et || data.prenom,
                            email: data.email_et || data.email,
                            role: 'etudiant',
                            matricule: data.matricule_et || data.matricule,
                            photo: data.photo_et || data.photo
                        };
                        localStorage.setItem('user', JSON.stringify(userData));
                        break;
                }

                // Stocker le token si disponible
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }

                return { success: true, user: userData };
            } catch (error) {
                console.error('Erreur de connexion:', error);
                return { 
                    success: false, 
                    message: error.message || 'Erreur lors de la connexion' 
                };
            }
        },

        // Fonction pour simuler la connexion (mode développement)
        mockLogin: function(email, password, role) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    // Vérifier les identifiants de test
                    if (email === 'admin@iua.ci' && password === 'admin123') {
                        const adminData = {
                            id_admin: 1,
                            nom_admin: 'Admin',
                            prenom_admin: 'Système',
                            email_admin: 'admin@iua.ci',
                            role: 'admin'
                        };
                        localStorage.setItem('admin', JSON.stringify(adminData));
                        localStorage.setItem('user', JSON.stringify({
                            id: 1,
                            nom: 'Admin',
                            prenom: 'Système',
                            email: 'admin@iua.ci',
                            role: 'admin',
                            matricule: 'ADM001'
                        }));
                        resolve({ 
                            success: true, 
                            user: adminData 
                        });
                    } 
                    else if (email === 'enseignant@iua.ci' && password === 'ens123') {
                        const userData = {
                            id: 'PROF001',
                            nom: 'Diallo',
                            prenom: 'Mamadou',
                            email: 'enseignant@iua.ci',
                            role: 'enseignant',
                            matricule: 'PROF001',
                            telephone: '0700000000'
                        };
                        localStorage.setItem('user', JSON.stringify(userData));
                        resolve({ success: true, user: userData });
                    }
                    else if (email === 'etudiant@iua.ci' && password === 'etu123') {
                        const userData = {
                            id: '23INF00101',
                            nom: 'Étudiant',
                            prenom: 'Test',
                            email: 'etudiant@iua.ci',
                            role: 'etudiant',
                            matricule: '23INF00101',
                            photo: null
                        };
                        localStorage.setItem('user', JSON.stringify(userData));
                        resolve({ success: true, user: userData });
                    }
                    else {
                        resolve({ 
                            success: false, 
                            message: 'Email ou mot de passe incorrect' 
                        });
                    }
                }, 1000);
            });
        }
    };
})();
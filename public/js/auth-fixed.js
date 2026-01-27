// =====================================================
// AUTHENTIFICATION UNIFIÉE - Version Fusionnée
// Compatible avec le deuxième HTML (tabs login/register)
// =====================================================

const API_URL = 'http://localhost:5000/api';

// ==================== ÉTAT GLOBAL ====================
let selectedRole = 'enseignant'; // 'enseignant', 'etudiant' ou 'admin'
let currentTab = 'login'; // 'login' ou 'register'

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Authentification initialisée');
    
    // Vérifier session existante
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user && user.role) {
        console.log('✅ Session existante:', user.role);
        redirigerVersTableauDeBord(user.role);
        return;
    }
    
    // Initialiser les événements
    initEvents();
    
    // Focus sur le premier champ
    setTimeout(() => {
        const firstInput = document.getElementById('email');
        if (firstInput) firstInput.focus();
    }, 100);
});

// ==================== ÉVÉNEMENTS ====================
function initEvents() {
    // Récupérer les éléments
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Vérifier que les éléments existent
    if (!loginTab || !registerTab || !loginForm) {
        console.error('❌ Éléments HTML non trouvés');
        return;
    }
    
    // Événements pour les tabs
    loginTab.addEventListener('click', () => switchTab('login'));
    registerTab.addEventListener('click', () => switchTab('register'));
    
    // Événements pour les formulaires
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleLogin(e, selectedRole);
    });
    
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleRegister(e, selectedRole);
        });
    }
    
    // Gestion des rôles pour la connexion
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.role-btn').forEach(b => {
                b.classList.remove('bg-primary', 'text-white', 'border-primary');
                b.classList.add('border-gray-200');
            });
            this.classList.add('bg-primary', 'text-white', 'border-primary');
            this.classList.remove('border-gray-200');
            selectedRole = this.dataset.role;
            console.log('Rôle connexion sélectionné:', selectedRole);
        });
    });
    
    // Gestion des rôles pour l'inscription
    document.querySelectorAll('.register-role-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.register-role-btn').forEach(b => {
                b.classList.remove('bg-primary', 'text-white', 'border-primary');
                b.classList.add('border-gray-200');
            });
            this.classList.add('bg-primary', 'text-white', 'border-primary');
            this.classList.remove('border-gray-200');
            selectedRole = this.dataset.role;
            console.log('Rôle inscription sélectionné:', selectedRole);
        });
    });
    
    // Toggle password pour login
    const togglePasswordLogin = document.getElementById('toggle-password');
    if (togglePasswordLogin) {
        togglePasswordLogin.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const icon = this.querySelector('i');
            togglePasswordVisibility(passwordInput, icon);
        });
    }
    
    // Toggle password pour register
    const togglePasswordRegister = document.getElementById('toggle-password-register');
    if (togglePasswordRegister) {
        togglePasswordRegister.addEventListener('click', function() {
            const passwordInput = registerForm?.querySelector('#password');
            const icon = this.querySelector('i');
            if (passwordInput) togglePasswordVisibility(passwordInput, icon);
        });
    }
    
    // Sélectionner par défaut
    document.querySelector('.role-btn')?.click();
    document.querySelector('.register-role-btn')?.click();
    
    console.log('✅ Événements initialisés avec succès');
}

// ==================== FONCTIONS UTILITAIRES ====================
function togglePasswordVisibility(input, icon) {
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function showError(message) {
    const formError = document.getElementById('form-error');
    const formSuccess = document.getElementById('form-success');
    
    if (!formError) {
        afficherNotification(message, 'error');
        return;
    }
    
    formError.className = 'p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-3';
    formError.innerHTML = `
        <i class="fas fa-exclamation-circle text-red-500 mt-1"></i>
        <div class="flex-1">
            <strong class="font-medium">Erreur</strong>
            <div class="text-sm mt-1">${message}</div>
        </div>
        <button type="button" onclick="this.parentElement.classList.add('hidden')" class="text-red-500 hover:text-red-700">
            <i class="fas fa-times"></i>
        </button>
    `;
    formError.classList.remove('hidden');
    if (formSuccess) formSuccess.classList.add('hidden');
}

function showSuccess(message) {
    const formError = document.getElementById('form-error');
    const formSuccess = document.getElementById('form-success');
    
    if (!formSuccess) {
        afficherNotification(message, 'success');
        return;
    }
    
    formSuccess.className = 'p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-start gap-3';
    formSuccess.innerHTML = `
        <i class="fas fa-check-circle text-green-500 mt-1"></i>
        <div class="flex-1">
            <strong class="font-medium">Succès</strong>
            <div class="text-sm mt-1">${message}</div>
        </div>
        <button type="button" onclick="this.parentElement.classList.add('hidden')" class="text-green-500 hover:text-green-700">
            <i class="fas fa-times"></i>
        </button>
    `;
    formSuccess.classList.remove('hidden');
    if (formError) formError.classList.add('hidden');
}

function switchTab(tab) {
    currentTab = tab;
    
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const formError = document.getElementById('form-error');
    const formSuccess = document.getElementById('form-success');
    
    if (tab === 'login') {
        loginTab.classList.add('bg-white', 'text-primary', 'shadow-sm');
        loginTab.classList.remove('text-gray-600');
        registerTab.classList.remove('bg-white', 'text-primary', 'shadow-sm');
        registerTab.classList.add('text-gray-600');
        
        loginForm.classList.remove('hidden');
        if (registerForm) registerForm.classList.add('hidden');
    } else {
        registerTab.classList.add('bg-white', 'text-primary', 'shadow-sm');
        registerTab.classList.remove('text-gray-600');
        loginTab.classList.remove('bg-white', 'text-primary', 'shadow-sm');
        loginTab.classList.add('text-gray-600');
        
        if (registerForm) registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
    
    // Cacher les messages
    if (formError) formError.classList.add('hidden');
    if (formSuccess) formSuccess.classList.add('hidden');
}

// ==================== CONNEXION ====================
async function handleLogin(e, role) {
    e.preventDefault();
    
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    
    // Validation basique
    if (!email || !password) {
        showError('Veuillez remplir tous les champs');
        return;
    }
    
    try {
        // Afficher un indicateur de chargement
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Connexion...';
        submitBtn.disabled = true;
        
        console.log('🔐 Tentative de connexion:', role, email);
        
        // Configuration de l'endpoint API
        let endpoint = '';
        if (role === 'admin') {
            endpoint = `${API_URL}/auth/admin/login`;
        } else if (role === 'enseignant') {
            endpoint = `${API_URL}/auth/enseignant/login`;
        } else {
            endpoint = `${API_URL}/auth/etudiant/login`;
        }
        
        // Si l'API n'est pas disponible, utiliser la simulation
        let userData;
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
                throw new Error('Identifiants incorrects');
            }
            
            const data = await response.json();
            
            // Format des données de l'API
            userData = {
                ...data,
                role: role
            };
            
        } catch (apiError) {
            console.log('API non disponible, simulation activée');
            
            // Simulation de connexion pour le développement
            if ((email === 'admin@gestnotes.com' && password === 'Admin123') ||
                (email === 'enseignant@gestnotes.com' && password === 'Enseignant123') ||
                (email === 'etudiant@gestnotes.com' && password === 'Etudiant123')) {
                
                if (email === 'admin@gestnotes.com') {
                    userData = {
                        id: 1,
                        nom: 'Admin',
                        prenom: 'Système',
                        email: email,
                        role: 'admin',
                        matricule: 'ADM001'
                    };
                } else if (email === 'enseignant@gestnotes.com') {
                    userData = {
                        id: 2,
                        nom: 'Professeur',
                        prenom: 'Dupont',
                        email: email,
                        role: 'enseignant',
                        matricule: 'ENS001'
                    };
                } else {
                    userData = {
                        id: 3,
                        nom: 'Étudiant',
                        prenom: 'Martin',
                        email: email,
                        role: 'etudiant',
                        matricule: 'ETU001'
                    };
                }
            } else {
                throw new Error('Email ou mot de passe incorrect');
            }
        }
        
        // Sauvegarder session
        localStorage.setItem('user', JSON.stringify(userData));
        
        if (role === 'admin') {
            localStorage.setItem('admin', JSON.stringify({
                id_admin: userData.id || 1,
                nom_admin: userData.nom || 'Admin',
                prenom_admin: userData.prenom || 'System',
                email_admin: userData.email || email,
                role: 'admin'
            }));
        }
        
        showSuccess('Connexion réussie ! Redirection en cours...');
        
        // Rediriger après 1 seconde
        setTimeout(() => {
            redirigerVersTableauDeBord(role);
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erreur connexion:', error);
        showError(error.message);
        
        // Réactiver le bouton
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Se connecter';
        submitBtn.disabled = false;
    }
}

// ==================== INSCRIPTION ====================
async function handleRegister(e, role) {
    e.preventDefault();
    
    const nom = document.getElementById('nom')?.value.trim();
    const prenom = document.getElementById('prenom')?.value.trim();
    const matricule = document.getElementById('matricule')?.value.trim();
    const tel = document.getElementById('tel')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    
    // Validation basique
    if (!nom || !prenom || !matricule || !email || !password) {
        showError('Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    // Validation du mot de passe
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
        showError('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre');
        return;
    }
    
    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Veuillez entrer une adresse email valide');
        return;
    }
    
    // Validation spécifique pour IUA
    if (email && !email.endsWith('@iua.ci')) {
        showError('L\'email doit se terminer par @iua.ci');
        return;
    }
    
    // Validation du matricule selon le rôle
    if (role === 'enseignant' && !matricule.startsWith('ENS')) {
        showError('Le matricule enseignant doit commencer par "ENS"');
        return;
    }
    if (role === 'etudiant' && !matricule.startsWith('ETU')) {
        showError('Le matricule étudiant doit commencer par "ETU"');
        return;
    }
    
    try {
        // Afficher un indicateur de chargement
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Inscription...';
        submitBtn.disabled = true;
        
        console.log('📝 Tentative d\'inscription:', role, email);
        
        // Données utilisateur
        const userData = {
            nom: nom,
            prenom: prenom,
            matricule: matricule,
            tel: tel || '',
            email: email,
            password: password,
            role: role
        };
        
        // Configuration de l'endpoint API
        let endpoint = '';
        if (role === 'enseignant') {
            endpoint = `${API_URL}/auth/enseignant/register`;
        } else if (role === 'etudiant') {
            endpoint = `${API_URL}/auth/etudiant/register`;
        } else {
            showError('Les admins ne peuvent pas s\'inscrire');
            return;
        }
        
        // Si l'API est disponible
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur d\'inscription');
            }
            
            const data = await response.json();
            console.log('✅ Inscription API réussie:', data);
            
            showSuccess('Inscription réussie ! Vous pouvez vous connecter.');
            
            // Passer en mode connexion
            setTimeout(() => {
                switchTab('login');
            }, 2000);
            
        } catch (apiError) {
            console.log('API non disponible, simulation activée');
            
            // Simulation pour le développement
            const simulatedUser = {
                id: Date.now(),
                nom: nom,
                prenom: prenom,
                matricule: matricule,
                telephone: tel || '',
                email: email,
                role: role,
                dateInscription: new Date().toISOString()
            };
            
            localStorage.setItem('user', JSON.stringify(simulatedUser));
            
            showSuccess('Inscription simulée réussie ! Vous êtes maintenant connecté.');
            
            // Rediriger après succès
            setTimeout(() => {
                redirigerVersTableauDeBord(role);
            }, 2000);
        }
        
    } catch (error) {
        console.error('❌ Erreur inscription:', error);
        showError(error.message);
        
        // Réactiver le bouton
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>S\'inscrire';
        submitBtn.disabled = false;
    }
}

// ==================== REDIRECTION ====================
function redirigerVersTableauDeBord(role) {
    console.log('🔀 Redirection vers:', role);
    
    let url = '';
    if (role === 'admin') {
        url = 'Admin/dashboard.html';
    } else if (role === 'enseignant') {
        url = 'enseignant/index.html';
    } else if (role === 'etudiant') {
        url = 'etudiant/notes.html';
    }
    
    if (url) {
        console.log('📍 URL de redirection:', url);
        window.location.href = url;
    } else {
        console.error('❌ URL de redirection non définie pour le rôle:', role);
    }
}

// ==================== NOTIFICATION ====================
function afficherNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // Créer notification
    const notif = document.createElement('div');
    notif.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white z-50 animate-fade-in`;
    
    if (type === 'success') {
        notif.className += ' bg-green-500';
        notif.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
    } else if (type === 'error') {
        notif.className += ' bg-red-500';
        notif.innerHTML = `<i class="fas fa-times-circle mr-2"></i>${message}`;
    } else {
        notif.className += ' bg-blue-500';
        notif.innerHTML = `<i class="fas fa-info-circle mr-2"></i>${message}`;
    }
    
    document.body.appendChild(notif);
    
    // Supprimer après 4 secondes
    setTimeout(() => {
        notif.remove();
    }, 4000);
}

// ==================== EXPORT POUR HTML ====================
// Exposer les fonctions nécessaires pour les onclick dans HTML
window.togglePassword = function(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling?.querySelector('i');
    if (input && icon) {
        togglePasswordVisibility(input, icon);
    }
};

window.showError = showError;
window.showSuccess = showSuccess;
window.switchTab = switchTab;

console.log('✅ Script d\'authentification fusionné chargé');
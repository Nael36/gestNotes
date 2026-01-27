// ==================== CONFIGURATION ====================
const API_URL = 'http://localhost:5000/api';

// État global de l'application
const state = {
    periodes: [],
    classes: [],
    matieres: [],
    loading: false,
    matieresParClasse: {}
};

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation de l\'application...');
    afficherSpinner(true);

    // Vérifier si l'utilisateur est connecté
    verifierConnexion();
    
    await chargerDonnees();
    afficherStatistiques();
    afficherClasses();
    afficherNomUtilisateur(); // Afficher le nom depuis localStorage

    afficherSpinner(false);
});

// ==================== VÉRIFICATION CONNEXION ====================
function verifierConnexion() {
    const user = localStorage.getItem('user');
    if (!user) {
        // Pas d'utilisateur connecté, rediriger vers auth
        window.location.href = '../auth-fixed.html';
    }
}

// ==================== FONCTION DE CHARGEMENT ====================
async function chargerDonnees() {
    try {
        state.loading = true;

        const [periodesRes, classesRes, matieresRes] = await Promise.all([
            fetch(`${API_URL}/periodes`),
            fetch(`${API_URL}/classes`),
            fetch(`${API_URL}/matieres`)
        ]);

        if (!periodesRes.ok || !classesRes.ok || !matieresRes.ok) {
            throw new Error('Erreur lors du chargement des données depuis le serveur');
        }

        state.periodes = await periodesRes.json();
        state.classes = await classesRes.json();
        state.matieres = await matieresRes.json();

        // Pré-calcul des matières par classe
        state.matieresParClasse = {};
        state.matieres.forEach(m => {
            if (!state.matieresParClasse[m.code_cl]) state.matieresParClasse[m.code_cl] = [];
            state.matieresParClasse[m.code_cl].push(m);
        });

        console.log('✅ Données chargées:', {
            periodes: state.periodes.length,
            classes: state.classes.length,
            matieres: state.matieres.length
        });

    } catch (error) {
        console.error('❌ Erreur chargement:', error);
        afficherNotification('Erreur de connexion au serveur', 'error');
    } finally {
        state.loading = false;
    }
}

// ==================== AFFICHER NOM UTILISATEUR ====================
function afficherNomUtilisateur() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const usernameSpan = document.getElementById('navbar-username');
        
        if (user && usernameSpan) {
            usernameSpan.textContent = `${user.prenom} ${user.nom}`;
        } else if (!user) {
            window.location.href = '../auth-fixed.html';
        }
    } catch (err) {
        console.error('Erreur récupération nom utilisateur:', err.message);
        const usernameSpan = document.getElementById('navbar-username');
        if (usernameSpan) {
            usernameSpan.textContent = 'Utilisateur';
        }
    }
}

// ==================== AFFICHAGE STATISTIQUES ====================
function afficherStatistiques() {
    const countPeriodes = document.getElementById('count-periodes');
    if (countPeriodes) animerCompteur(countPeriodes, state.periodes.length);

    const countMatieres = document.getElementById('count-matieres');
    if (countMatieres) animerCompteur(countMatieres, state.matieres.length);
}

function animerCompteur(element, target) {
    let current = 0;
    const step = () => {
        current += Math.max(1, target / 60);
        if (current >= target) {
            element.textContent = target;
        } else {
            element.textContent = Math.floor(current);
            requestAnimationFrame(step);
        }
    };
    requestAnimationFrame(step);
}

// ==================== AFFICHAGE DES CLASSES ====================
function afficherClasses() {
    const grid = document.getElementById('classes-grid');
    if (!grid) return;

    if (state.classes.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-inbox text-6xl text-slate-300 mb-4"></i>
                <p class="text-slate-600 text-lg">Aucune classe disponible</p>
                <p class="text-slate-400 text-sm mt-2">Les classes seront affichées ici</p>
            </div>
        `;
        return;
    }

    const couleurs = {
        'L1': { gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-100', text: 'text-blue-700', border: 'blue-500' },
        'L2': { gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-100', text: 'text-purple-700', border: 'purple-500' },
        'L3': { gradient: 'from-pink-500 to-pink-600', bg: 'bg-pink-100', text: 'text-pink-700', border: 'pink-500' },
    };

    grid.innerHTML = '';
    state.classes.forEach(classe => {
        const niveau = classe.code_cl.substring(0, 2);
        const couleur = couleurs[niveau] || couleurs['L1'];

        const matieres = state.matieresParClasse[classe.code_cl] || [];
        const nbMatieres = matieres.length;
        const totalCredits = matieres.reduce((sum, m) => sum + (m.nb_credit || 0), 0);
        const nbEtudiants = Math.floor(Math.random() * 50) + 30;

        const div = document.createElement('div');
        div.className = `group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-t-4 border-${couleur.border}`;
        div.innerHTML = `
            <div class="p-6">
                <div class="flex items-start justify-between mb-4">
                    <div class="w-14 h-14 bg-gradient-to-br ${couleur.gradient} rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <span class="text-white font-bold text-xl">${niveau}</span>
                    </div>
                    <span class="${couleur.bg} ${couleur.text} text-xs font-bold px-3 py-1 rounded-full">
                        ${nbMatieres} matière${nbMatieres > 1 ? 's' : ''}
                    </span>
                </div>
                <h3 class="text-xl font-bold text-slate-800 mb-2 group-hover:text-primary transition">
                    ${classe.libelle_cl}
                </h3>
                <div class="space-y-2 mb-4">
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-slate-600 flex items-center gap-2">
                            <i class="fas fa-book"></i> Matières
                        </span>
                        <span class="font-bold text-slate-800">${nbMatieres}</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-slate-600 flex items-center gap-2">
                            <i class="fas fa-star"></i> Crédits
                        </span>
                        <span class="font-bold text-slate-800">${totalCredits}</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-slate-600 flex items-center gap-2">
                            <i class="fas fa-user-graduate"></i> Étudiants
                        </span>
                        <span class="font-bold text-slate-800">${nbEtudiants}</span>
                    </div>
                </div>
                <div class="flex gap-2">
                    <a href="matieres.html?classe=${classe.code_cl}" class="flex-1 px-4 py-2 bg-gradient-to-r ${couleur.gradient} text-white rounded-lg hover:opacity-90 transition text-center text-sm font-medium">
                        Voir les matières
                    </a>
                </div>
            </div>
        `;
        grid.appendChild(div);
    });
}

// ==================== UTILITAIRES ====================
function afficherNotification(message, type = 'info') {
    const anciennes = document.querySelectorAll('.notification-toast');
    anciennes.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = 'notification-toast fixed top-4 right-4 z-50 animate-slide-in';
    
    const couleurs = { success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-orange-500', info: 'bg-blue-500' };
    const icones = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };

    notification.innerHTML = `
        <div class="${couleurs[type]} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px]">
            <i class="fas ${icones[type]} text-2xl"></i>
            <span class="flex-1">${message}</span>
            <button onclick="this.closest('.notification-toast').remove()" class="text-white hover:text-gray-200 transition">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slide-out 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function formaterDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function afficherSpinner(show) {
    let spinner = document.getElementById('global-spinner');
    if (!spinner) {
        spinner = document.createElement('div');
        spinner.id = 'global-spinner';
        spinner.className = 'fixed inset-0 bg-white/70 z-50 flex items-center justify-center';
        spinner.innerHTML = `<i class="fas fa-spinner fa-spin text-6xl text-primary"></i>`;
        document.body.appendChild(spinner);
    }
    spinner.style.display = show ? 'flex' : 'none';
}

// ==================== DÉCONNEXION ====================
function ouvrirModalDeconnexion() {
    // Récupérer les infos de l'utilisateur
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Créer et afficher la modale
    const modalHTML = `
        <div id="logout-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in">
                <!-- En-tête -->
                <div class="p-6 border-b border-slate-200">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                            <i class="fas fa-sign-out-alt text-white text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-slate-800">Confirmation de déconnexion</h3>
                            <p class="text-slate-600 text-sm mt-1">GestNotes - Espace Enseignant</p>
                        </div>
                    </div>
                </div>

                <!-- Corps -->
                <div class="p-6">
                    <div class="flex items-center gap-4 mb-6 p-4 bg-red-50 rounded-xl">
                        <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                        <div>
                            <p class="font-medium text-red-800">Vous êtes sur le point de vous déconnecter</p>
                            <p class="text-red-600 text-sm mt-1">Vous devrez vous reconnecter pour accéder à nouveau à l'application.</p>
                        </div>
                    </div>

                    <!-- Profil utilisateur -->
                    ${user ? `
                    <div class="p-4 bg-slate-50 rounded-xl mb-6">
                        <p class="text-sm text-slate-600 mb-2">Vous êtes connecté en tant que :</p>
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                                <i class="fas fa-user text-white"></i>
                            </div>
                            <div>
                                <p class="font-semibold text-slate-800">${user.prenom} ${user.nom}</p>
                                <p class="text-xs text-slate-500">${user.email || 'Enseignant'}</p>
                            </div>
                        </div>
                    </div>
                    ` : ''}

                    <!-- Boutons -->
                    <div class="flex gap-3">
                        <button onclick="fermerModalDeconnexion()" 
                                class="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition">
                            Annuler
                        </button>
                        <button onclick="effectuerDeconnexion()" 
                                class="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:shadow-lg transition">
                            <i class="fas fa-sign-out-alt mr-2"></i>Se déconnecter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Ajouter la modale au body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function fermerModalDeconnexion() {
    const modal = document.getElementById('logout-modal');
    if (modal) {
        modal.remove();
    }
}

function effectuerDeconnexion() {
    localStorage.removeItem('user');
    fermerModalDeconnexion();
    // IMPORTANT: Corrige le chemin vers auth-fixed.html
    // Si index.html est dans /public/enseignant/ et auth-fixed.html dans /public/
    window.location.href = '../auth-fixed.html';
}

function deconnexion() {
    ouvrirModalDeconnexion();
}

// ==================== EXPORT ====================
window.appState = state;
window.afficherNotification = afficherNotification;
window.formaterDate = formaterDate;
window.deconnexion = deconnexion;
window.ouvrirModalDeconnexion = ouvrirModalDeconnexion;
window.fermerModalDeconnexion = fermerModalDeconnexion;
window.effectuerDeconnexion = effectuerDeconnexion;
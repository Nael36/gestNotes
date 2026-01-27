// ==================== ÉTUDIANT INDEX.JS ====================
// Dashboard principal étudiant

const API_URL = 'http://localhost:5000/api';

// ==================== VÉRIFICATION AUTHENTIFICATION ====================
function verifierAuth() {
    const user = localStorage.getItem('user');
    
    if (!user || user === 'undefined') {
        console.log('🔐 Pas de session, redirection');
        window.location.href = '/auth-fixed.html';
        return null;
    }
    
    try {
        const userData = JSON.parse(user);
        if (userData.role !== 'etudiant') {
            console.log('❌ Rôle incorrect:', userData.role);
            localStorage.removeItem('user');
            window.location.href = '/auth-fixed.html';
            return null;
        }
        return userData;
    } catch (e) {
        console.error('❌ Erreur parsing user:', e);
        localStorage.removeItem('user');
        window.location.href = '/auth-fixed.html';
        return null;
    }
}

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard étudiant chargé');
    
    const user = verifierAuth();
    if (!user) return;
    
    // Afficher infos utilisateur
    afficherInfosUtilisateur(user);
    
    // Charger statistiques
    await chargerStatistiques(user.matricule);
});

// ==================== AFFICHER INFOS UTILISATEUR ====================
function afficherInfosUtilisateur(user) {
    // Nom dans navbar
    const usernameEl = document.getElementById('navbar-username');
    if (usernameEl) {
        usernameEl.textContent = `${user.prenom} ${user.nom}`;
    }
    
    // Nom dans header
    const headerNameEl = document.getElementById('header-name');
    if (headerNameEl) {
        headerNameEl.textContent = `${user.prenom} ${user.nom}`;
    }
    
    // Matricule
    const matriculeEl = document.getElementById('header-matricule');
    if (matriculeEl) {
        matriculeEl.textContent = user.matricule;
    }
    
    console.log('✅ Infos utilisateur affichées');
}

// ==================== CHARGER STATISTIQUES ====================
async function chargerStatistiques(matricule) {
    try {
        console.log('📊 Chargement statistiques pour:', matricule);
        
        // Récupérer les notes de l'étudiant
        const response = await fetch(`${API_URL}/evaluations?matricule_et=${matricule}`);
        
        if (!response.ok) {
            throw new Error('Erreur chargement notes');
        }
        
        const notes = await response.json();
        console.log('📝 Notes récupérées:', notes.length);
        
        // Calculer statistiques
        const stats = {
            nombreMatieres: new Set(notes.map(n => n.code_mat)).size,
            nombreNotes: notes.length,
            moyenne: 0,
            reussite: 0
        };
        
        if (notes.length > 0) {
            const somme = notes.reduce((acc, n) => acc + (parseFloat(n.note) || 0), 0);
            stats.moyenne = (somme / notes.length).toFixed(2);
            stats.reussite = notes.filter(n => parseFloat(n.note) >= 10).length;
        }
        
        // Afficher statistiques
        afficherStatistiques(stats);
        
        // Afficher dernières notes
        afficherDernieresNotes(notes.slice(0, 5));
        
    } catch (error) {
        console.error('❌ Erreur stats:', error);
        afficherNotification('Erreur chargement statistiques', 'error');
    }
}

// ==================== AFFICHER STATISTIQUES ====================
function afficherStatistiques(stats) {
    // Nombre de matières
    const matieresEl = document.getElementById('stat-matieres');
    if (matieresEl) {
        matieresEl.textContent = stats.nombreMatieres;
    }
    
    // Nombre de notes
    const notesEl = document.getElementById('stat-notes');
    if (notesEl) {
        notesEl.textContent = stats.nombreNotes;
    }
    
    // Moyenne générale
    const moyenneEl = document.getElementById('stat-moyenne');
    if (moyenneEl) {
        moyenneEl.textContent = stats.moyenne;
        
        // Couleur selon moyenne
        if (stats.moyenne >= 14) {
            moyenneEl.className = 'text-4xl font-bold text-green-600';
        } else if (stats.moyenne >= 10) {
            moyenneEl.className = 'text-4xl font-bold text-blue-600';
        } else {
            moyenneEl.className = 'text-4xl font-bold text-red-600';
        }
    }
    
    // Taux de réussite
    const reussiteEl = document.getElementById('stat-reussite');
    if (reussiteEl && stats.nombreNotes > 0) {
        const taux = ((stats.reussite / stats.nombreNotes) * 100).toFixed(0);
        reussiteEl.textContent = `${taux}%`;
    }
    
    console.log('✅ Statistiques affichées');
}

// ==================== AFFICHER DERNIÈRES NOTES ====================
function afficherDernieresNotes(notes) {
    const container = document.getElementById('dernieres-notes');
    if (!container) return;
    
    if (notes.length === 0) {
        container.innerHTML = '<p class="text-slate-500 text-center py-4">Aucune note disponible</p>';
        return;
    }
    
    const html = notes.map(note => `
        <div class="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
            <div>
                <p class="font-semibold text-slate-800">${note.libelle_mat || note.code_mat}</p>
                <p class="text-sm text-slate-500">${note.libelle_per || note.code_per}</p>
            </div>
            <div class="text-right">
                <p class="text-2xl font-bold ${getColorClass(note.note)}">${parseFloat(note.note).toFixed(2)}</p>
                <p class="text-xs text-slate-500">/20</p>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// ==================== OBTENIR CLASSE COULEUR ====================
function getColorClass(note) {
    const n = parseFloat(note);
    if (n >= 14) return 'text-green-600';
    if (n >= 10) return 'text-blue-600';
    return 'text-red-600';
}

// ==================== DÉCONNEXION ====================
function deconnexion() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        localStorage.removeItem('user');
        localStorage.removeItem('admin');
        window.location.href = '/auth-fixed.html';
    }
}

// ==================== NOTIFICATION ====================
function afficherNotification(message, type = 'info') {
    const notif = document.createElement('div');
    notif.className = 'fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white z-50';
    
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
    setTimeout(() => notif.remove(), 4000);
}

console.log('✅ index.js étudiant chargé');

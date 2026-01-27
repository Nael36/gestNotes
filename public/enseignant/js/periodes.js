// ================== CONFIGURATION ==================
const API_URL = 'http://localhost:5000/api';
let periodeEdit = null;

// ================== INITIALISATION ==================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Page Périodes chargée');
    await chargerPeriodes();
    afficherNomUtilisateur();
    initialiserEvenements();
});

function initialiserEvenements() {
    // Fermer le modal en cliquant sur le fond
    document.getElementById('modal-periode').addEventListener('click', (e) => {
        if (e.target.id === 'modal-periode') {
            fermerModal();
        }
    });
    
    // Recherche
    document.getElementById('search-input')?.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#tableau-periodes tr');
        
        rows.forEach(row => {
            if (row.id === 'loading-row') return;
            
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

// ================== CHARGEMENT ==================
async function chargerPeriodes() {
    try {
        afficherChargement(true);
        const res = await fetch(`${API_URL}/periodes`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const periodes = await res.json();
        console.log('Périodes chargées:', periodes);
        afficherPeriodes(periodes);
    } catch (err) {
        console.error('Erreur chargement périodes:', err);
        afficherNotification('Impossible de charger les périodes', 'error');
    } finally {
        afficherChargement(false);
    }
}

// ================== AFFICHAGE ==================
function afficherPeriodes(periodes) {
    const tbody = document.getElementById('tableau-periodes');
    if (!tbody) return;

    if (periodes.length === 0) {
        tbody.innerHTML = `
        <tr>
            <td colspan="5" class="px-6 py-16 text-center">
                <div class="flex flex-col items-center gap-4">
                    <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-calendar-plus text-4xl text-blue-500"></i>
                    </div>
                    <p class="text-xl font-bold text-slate-700">Aucune période</p>
                    <button onclick="ouvrirModal()" 
                            class="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:shadow-xl flex items-center gap-2">
                        <i class="fas fa-plus-circle"></i> Ajouter une période
                    </button>
                </div>
            </td>
        </tr>`;
        return;
    }

    tbody.innerHTML = periodes.map((periode, i) => {
        // Calculer le nombre de jours restants
        const fin = new Date(periode.fin_per);
        const aujourdhui = new Date();
        const joursRestants = Math.ceil((fin - aujourdhui) / (1000 * 60 * 60 * 24));
        
        let statutClass = '';
        let statutIcon = '';
        let statutText = '';
        
        if (joursRestants < 0) {
            statutClass = 'bg-red-100 text-red-700';
            statutIcon = 'fa-times-circle';
            statutText = 'Terminée';
        } else if (joursRestants < 7) {
            statutClass = 'bg-orange-100 text-orange-700';
            statutIcon = 'fa-exclamation-circle';
            statutText = 'Bientôt fini';
        } else {
            statutClass = 'bg-green-100 text-green-700';
            statutIcon = 'fa-check-circle';
            statutText = 'En cours';
        }

        return `
        <tr class="hover:bg-slate-50 transition-colors animate-fade-in" style="animation-delay:${i*0.05}s">
            <td class="px-6 py-4">
                <span class="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-bold text-sm">
                    <i class="fas fa-hashtag"></i> ${periode.code_per}
                </span>
            </td>
            <td class="px-6 py-4 font-bold text-slate-800 text-lg">${periode.libelle_per}</td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                    <i class="fas fa-calendar-day"></i> ${formaterDate(periode.debut_per)}
                </span>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                    <i class="fas fa-calendar-day"></i> ${formaterDate(periode.fin_per)}
                </span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                    <span class="${statutClass} inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mr-2">
                        <i class="fas ${statutIcon}"></i> ${statutText}
                    </span>
                    <button onclick="editerPeriode('${periode.code_per}')" 
                            class="p-2 w-10 h-10 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition transform hover:scale-110" 
                            title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="ouvrirModalSuppressionPeriode('${periode.code_per}', '${periode.libelle_per.replace(/'/g, "\\'").replace(/"/g, '\\"')}')" 
                            class="p-2 w-10 h-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition transform hover:scale-110" 
                            title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function formaterDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR');
}

function afficherChargement(show = true) {
    const tbody = document.getElementById('tableau-periodes');
    if (!tbody) return;
    
    if (show) {
        tbody.innerHTML = `
        <tr id="loading-row">
            <td colspan="5" class="px-6 py-12 text-center">
                <i class="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
                <p class="text-slate-600 text-lg">Chargement des périodes...</p>
            </td>
        </tr>`;
    }
}

// ================== MODALES PÉRIODES ==================
function ouvrirModal(periode = null) {
    periodeEdit = periode;
    const modal = document.getElementById('modal-periode');
    const titre = document.getElementById('modal-titre');
    
    // Remplir les champs si édition
    if (periode) {
        document.getElementById('code').value = periode.code_per || '';
        document.getElementById('libelle').value = periode.libelle_per || '';
        document.getElementById('debut').value = formaterDatePourInput(periode.debut_per);
        document.getElementById('fin').value = formaterDatePourInput(periode.fin_per);
        document.getElementById('code').readOnly = true;
        document.getElementById('code').classList.add('bg-slate-100');
        titre.innerHTML = '<i class="fas fa-edit text-blue-500"></i> Modifier la période';
    } else {
        // Nouvelle période
        document.getElementById('code').value = '';
        document.getElementById('libelle').value = '';
        
        // Dates par défaut (aujourd'hui et dans 3 mois)
        const aujourdhui = new Date().toISOString().split('T')[0];
        const dans3Mois = new Date();
        dans3Mois.setMonth(dans3Mois.getMonth() + 3);
        const fin = dans3Mois.toISOString().split('T')[0];
        
        document.getElementById('debut').value = aujourdhui;
        document.getElementById('fin').value = fin;
        document.getElementById('code').readOnly = false;
        document.getElementById('code').classList.remove('bg-slate-100');
        titre.innerHTML = '<i class="fas fa-calendar-plus text-blue-500"></i> Nouvelle période';
    }
    
    modal.classList.remove('hidden');
    setTimeout(() => document.getElementById(periode ? 'libelle' : 'code').focus(), 100);
}

function formaterDatePourInput(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
}

function fermerModal() {
    document.getElementById('modal-periode').classList.add('hidden');
    periodeEdit = null;
}

function ouvrirModalSuppressionPeriode(code, libelle) {
    document.getElementById('matiere-a-supprimer-code').value = code;
    document.getElementById('matiere-a-supprimer-libelle').textContent = libelle;
    document.getElementById('modal-suppression').classList.remove('hidden');
}

function fermerModalSuppressionPeriode() {
    document.getElementById('modal-suppression').classList.add('hidden');
}

function initialiserEvenements() {
    // Fermer le modal principal en cliquant sur le fond
    document.getElementById('modal-periode').addEventListener('click', (e) => {
        if (e.target.id === 'modal-periode') {
            fermerModal();
        }
    });
    
    // Fermer le modal de suppression en cliquant sur le fond
    document.getElementById('modal-suppression').addEventListener('click', (e) => {
        if (e.target.id === 'modal-suppression') {
            fermerModalSuppressionPeriode();
        }
    });
    
    // Recherche
    document.getElementById('search-input')?.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#tableau-periodes tr');
        
        rows.forEach(row => {
            if (row.id === 'loading-row') return;
            
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}
// ================== CRUD PÉRIODES ==================
async function sauvegarderPeriode() {
    const code = document.getElementById('code').value.trim();
    const libelle = document.getElementById('libelle').value.trim();
    const debut = document.getElementById('debut').value;
    const fin = document.getElementById('fin').value;
    
    // Validation
    if (!code || !libelle || !debut || !fin) {
        afficherNotification('Tous les champs sont obligatoires', 'error');
        return;
    }
    
    if (new Date(fin) <= new Date(debut)) {
        afficherNotification('La date de fin doit être après la date de début', 'error');
        return;
    }
    
    const data = {
        code_per: code,
        libelle_per: libelle,
        debut_per: debut,
        fin_per: fin
    };
    
    const method = periodeEdit ? 'PUT' : 'POST';
    const url = periodeEdit ? `${API_URL}/periodes/${periodeEdit.code_per}` : `${API_URL}/periodes`;
    
    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        afficherNotification(periodeEdit ? 'Période modifiée' : 'Période créée', 'success');
        fermerModal();
        periodeEdit = null;
        await chargerPeriodes();
    } catch (err) {
        console.error(err);
        afficherNotification(`Erreur: ${err.message}`, 'error');
    }
}

async function editerPeriode(code) {
    try {
        const res = await fetch(`${API_URL}/periodes/${code}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const periode = await res.json();
        ouvrirModal(periode);
    } catch (err) {
        console.error(err);
        afficherNotification('Impossible de charger la période', 'error');
    }
}

async function supprimerPeriode() {
    const code = document.getElementById('matiere-a-supprimer-code').value;
    
    try {
        const res = await fetch(`${API_URL}/periodes/${code}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        afficherNotification('Période supprimée', 'success');
        fermerModalSuppressionPeriode();
        await chargerPeriodes();
    } catch (err) {
        console.error(err);
        afficherNotification(`Erreur: ${err.message}`, 'error');
    }
}

// ================== NOTIFICATIONS ==================
function afficherNotification(msg, type = 'info') {
    const notif = document.createElement('div');
    const colors = {
        'success': 'bg-green-500',
        'error': 'bg-red-500',
        'warning': 'bg-orange-500',
        'info': 'bg-blue-500'
    };
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    
    notif.className = `fixed top-4 right-4 z-50 animate-slide-in`;
    notif.innerHTML = `
    <div class="${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[320px]">
        <i class="fas ${icons[type]} text-2xl"></i>
        <span class="flex-1 font-medium">${msg}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200 transition">
            <i class="fas fa-times"></i>
        </button>
    </div>`;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        if (notif.parentElement) {
            notif.style.animation = 'slide-out 0.3s ease forwards';
            setTimeout(() => notif.remove(), 300);
        }
    }, 5000);
}

// ================== UTILITAIRE ==================
function afficherNomUtilisateur() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const usernameSpan = document.getElementById('navbar-username');
        if (user && usernameSpan) {
            usernameSpan.textContent = `${user.prenom} ${user.nom}`;
        }
    } catch (err) {
        console.error('Erreur:', err.message);
    }
}

// ================== GESTION ÉVÉNEMENTS ==================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (!document.getElementById('modal-periode').classList.contains('hidden')) {
            fermerModal();
        }
        if (!document.getElementById('modal-suppression').classList.contains('hidden')) {
            fermerModalSuppressionPeriode();
        }
    }
});

// Fonction déconnexion
function deconnexion() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        localStorage.removeItem('user');
        window.location.href = 'auth-fixed.html';
    }
}
window.deconnexion = deconnexion;
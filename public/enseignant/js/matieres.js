// ==================== CONFIGURATION ====================
const API_URL = 'http://localhost:5000/api';
let classeActuelle = null;
let matiereEdit = null; 
let matieres = [];

const classes = {
    'L1_GI': 'Licence 1 Génie Informatique',
    'L2_GI': 'Licence 2 Génie Informatique',
    'L3_GI': 'Licence 3 Génie Informatique',
    'L1_MIAGE': 'Licence 1 MIAGE',
    'L2_MIAGE': 'Licence 2 MIAGE',
    'L3_MIAGE': 'Licence 3 MIAGE'
};

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation module Matières...');
    initialiserAnimations();
    afficherNomUtilisateur();

    const urlParams = new URLSearchParams(window.location.search);
    const classeParam = urlParams.get('classe');
    if (classeParam) {
        const select = document.getElementById('select-classe');
        if (select) {
            select.value = classeParam;
            await changerClasse();
        }
    }
});

// ==================== CHARGEMENT ====================
async function changerClasse() {
    const select = document.getElementById('select-classe');
    if (!select) return;

    classeActuelle = select.value;
    const btnNouveau = document.getElementById('btn-nouveau');

    if (classeActuelle) {
        if (btnNouveau) btnNouveau.disabled = false;
        await chargerMatieres();

        const nomClasse = classes[classeActuelle] || select.options[select.selectedIndex].text;
        const titreDoc = document.getElementById('titre-classe');
        if (titreDoc) {
            titreDoc.innerHTML = `<i class="fas fa-book text-green-500"></i> Matières de ${nomClasse}`;
        }
    } else {
        if (btnNouveau) btnNouveau.disabled = true;
        document.getElementById('titre-classe').textContent = 'Sélectionnez une classe pour voir les matières';
        viderTableau();
        cacherStats();
    }
}

async function chargerMatieres() {
    if (!classeActuelle) return;

    try {
        console.log('📥 Chargement des matières pour', classeActuelle);
        afficherChargement(true);
        
        const response = await fetch(`${API_URL}/matieres/classe/${classeActuelle}`);
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        
        matieres = await response.json();
        console.log('✅ Matières chargées:', matieres.length);
        
        afficherMatieres(matieres);
        afficherStats(matieres);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        afficherNotification('Impossible de charger les matières', 'error');
    }
}

// ==================== AFFICHAGE ====================
function afficherMatieres(data) {
    console.log('🎨 Affichage de', data.length, 'matières');
    const tbody = document.getElementById('tableau-matieres');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-16 text-center">
                    <div class="flex flex-col items-center gap-4">
                        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-book-medical text-4xl text-green-500"></i>
                        </div>
                        <p class="text-xl font-bold text-slate-700">Aucune matière enregistrée</p>
                        <button onclick="ouvrirModal()" class="px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:shadow-lg transition">
                            Ajouter la première matière
                        </button>
                    </div>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = data.map((m, index) => {
        const creditClass = m.nb_credit >= 5 ? 'bg-red-100 text-red-700' : 
                            m.nb_credit >= 3 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';
        const libelleSafe = m.libelle_mat.replace(/'/g, "\\'").replace(/"/g, '\\"');

        return `
            <tr class="hover:bg-slate-50 transition-colors animate-fade-in" style="animation-delay: ${index*0.05}s">
                <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg font-bold text-xs">
                        <i class="fas fa-code"></i> ${m.code_mat}
                    </span>
                </td>
                <td class="px-6 py-4"><span class="font-bold text-slate-800">${m.libelle_mat}</span></td>
                <td class="px-6 py-4">
                    <span class="${creditClass} px-3 py-1 rounded-full text-xs font-bold">
                        ${m.nb_credit} crédit${m.nb_credit > 1 ? 's' : ''}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex gap-2">
                        <button onclick="editerMatiere('${m.code_mat}')" class="p-2 bg-blue-100 text-blue-600 rounded-lg hover:scale-110 transition"><i class="fas fa-edit"></i></button>
                        <button onclick="ouvrirModalSuppression('${m.code_mat}', '${libelleSafe}')" class="p-2 bg-red-100 text-red-600 rounded-lg hover:scale-110 transition"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>`;
    }).join('');
    
    console.log('✅ Tableau rempli avec', data.length, 'lignes');
}

// ==================== CRUD ====================
async function sauvegarderMatiere() {
    const codeMat = document.getElementById('code-matiere').value.trim();
    const libelle = document.getElementById('libelle-matiere').value.trim();
    const nbCredit = parseInt(document.getElementById('credit-matiere').value, 10);

    if (!codeMat || !libelle || isNaN(nbCredit) || nbCredit < 1 || nbCredit > 10) {
        return afficherNotification('Vérifiez les champs (crédits entre 1-10)', 'error');
    }

    const data = {
        code_mat: codeMat,
        libelle_mat: libelle,
        nb_credit: nbCredit,
        code_cl: classeActuelle
    };

    const method = matiereEdit ? 'PUT' : 'POST';
    const url = matiereEdit ? `${API_URL}/matieres/${matiereEdit.code_mat}` : `${API_URL}/matieres`;

    try {
        console.log('💾 Sauvegarde matière:', data);
        
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const resData = await res.json();

        if (!res.ok) {
            throw new Error(resData.error || resData.details || `HTTP ${res.status}`);
        }

        console.log('✅ Matière sauvegardée');
        afficherNotification(matiereEdit ? 'Matière modifiée !' : 'Matière créée !', 'success');
        
        fermerModal();
        matiereEdit = null;
        
        // RECHARGER LES MATIÈRES
        await chargerMatieres();

    } catch (err) {
        console.error('❌ Erreur:', err);
        afficherNotification(`Erreur: ${err.message}`, 'error');
    }
}

async function editerMatiere(code) {
    try {
        const response = await fetch(`${API_URL}/matieres/${code}`);
        if (!response.ok) throw new Error('Erreur récupération matière');
        const matiere = await response.json();
        ouvrirModal(matiere);
    } catch (error) {
        afficherNotification(error.message, 'error');
    }
}

async function supprimerMatiere() {
    const code = document.getElementById('matiere-a-supprimer-code').value;
    try {
        const response = await fetch(`${API_URL}/matieres/${code}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erreur lors de la suppression');
        afficherNotification('Matière supprimée !', 'success');
        fermerModalSuppression();
        await chargerMatieres();
    } catch (error) {
        afficherNotification(error.message, 'error');
    }
}

// ==================== MODALES ====================
function ouvrirModal(matiere = null) {
    if (!classeActuelle) {
        afficherNotification('Sélectionnez d\'abord une classe', 'warning');
        return;
    }

    matiereEdit = matiere;
    const modal = document.getElementById('modal-matiere');
    const inputCode = document.getElementById('code-matiere');

    document.getElementById('classe-matiere').value = classeActuelle;
    document.getElementById('classe-matiere-display').textContent = classes[classeActuelle] || classeActuelle;

    if (matiere) {
        document.getElementById('modal-titre-matiere').innerHTML = '<i class="fas fa-edit text-green-500"></i> Modifier';
        inputCode.value = matiere.code_mat;
        inputCode.readOnly = true;
        inputCode.classList.add('bg-slate-100');
        document.getElementById('libelle-matiere').value = matiere.libelle_mat;
        document.getElementById('credit-matiere').value = matiere.nb_credit;
    } else {
        document.getElementById('modal-titre-matiere').innerHTML = '<i class="fas fa-plus text-green-500"></i> Nouvelle Matière';
        inputCode.value = '';
        inputCode.readOnly = false;
        inputCode.classList.remove('bg-slate-100');
        document.getElementById('libelle-matiere').value = '';
        document.getElementById('credit-matiere').value = '';
    }

    modal.classList.remove('hidden');
}

function fermerModal() {
    document.getElementById('modal-matiere').classList.add('hidden');
    matiereEdit = null;
}

function ouvrirModalSuppression(code, libelle) {
    document.getElementById('matiere-a-supprimer-code').value = code;
    document.getElementById('matiere-a-supprimer-libelle').textContent = libelle;
    document.getElementById('modal-suppression').classList.remove('hidden');
}

function fermerModalSuppression() {
    document.getElementById('modal-suppression').classList.add('hidden');
}

// ==================== UTILITAIRES ====================
function afficherChargement(afficher) {
    const tbody = document.getElementById('tableau-matieres');
    if (!tbody) return;
    
    if (afficher) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-12"><i class="fas fa-spinner fa-spin text-3xl text-green-500"></i></td></tr>`;
    }
    // NE PAS VIDER si afficher=false car afficherMatieres() va remplir le tableau
}

function viderTableau() {
    const tbody = document.getElementById('tableau-matieres');
    if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="text-center py-12 text-slate-400">Aucune sélection</td></tr>`;
}

function afficherNotification(message, type = 'info') {
    const container = document.createElement('div');
    container.className = 'fixed top-4 right-4 z-[100] animate-slide-in';
    const couleurs = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        warning: 'bg-orange-600',
        info: 'bg-blue-600'
    };
    const icones = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    container.innerHTML = `
        <div class="${couleurs[type]} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <i class="fas ${icones[type]}"></i>
            <span>${message}</span>
        </div>`;
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 3000);
}

function afficherStats(data) {
    const statsDiv = document.getElementById('stats-classe');
    if (!statsDiv) return;
    statsDiv.classList.remove('hidden');
    const totalCredits = data.reduce((sum, m) => sum + m.nb_credit, 0);
    const moyenne = data.length > 0 ? (totalCredits / data.length).toFixed(1) : 0;
    
    animerCompteur('count-matieres', data.length);
    animerCompteur('count-credits', totalCredits);
    
    const moyenneEl = document.getElementById('moyenne-credits');
    if (moyenneEl) moyenneEl.textContent = moyenne;
}

function animerCompteur(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    let current = 0;
    const increment = Math.max(1, Math.floor(target / 30));
    const interval = setInterval(() => {
        current += increment;
        if (current >= target) {
            el.textContent = target;
            clearInterval(interval);
        } else {
            el.textContent = current;
        }
    }, 30);
}

function initialiserAnimations() {
    if (document.getElementById('app-animations')) return;
    const style = document.createElement('style');
    style.id = 'app-animations';
    style.textContent = `
        @keyframes fade-in { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slide-in { from { transform:translateX(100%); } to { transform:translateX(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease forwards; }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
    `;
    document.head.appendChild(style);
}

function cacherStats() {
    const s = document.getElementById('stats-classe');
    if (s) s.classList.add('hidden');
}

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

function deconnexion() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        localStorage.removeItem('user');
        window.location.href = 'auth-fixed.html';
    }
}
window.deconnexion = deconnexion;

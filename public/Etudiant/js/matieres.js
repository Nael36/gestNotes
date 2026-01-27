// MATIERES.JS
const API_URL = 'http://localhost:5000/api';

function verifierAuth() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = '/auth-fixed.html';
        return null;
    }
    return JSON.parse(user);
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = verifierAuth();
    if (!user) return;
    
    document.getElementById('navbar-username').textContent = `${user.prenom} ${user.nom}`;
    await chargerMatieres(user.code_cl || 'L1_GI');
});

async function chargerMatieres(code_cl) {
    try {
        const response = await fetch(`${API_URL}/matieres?code_cl=${code_cl}`);
        const matieres = await response.json();
        afficherMatieres(matieres);
    } catch (error) {
        console.error('Erreur:', error);
    }
}

function afficherMatieres(matieres) {
    const container = document.getElementById('matieres-container');
    if (!container || matieres.length === 0) return;
    
    container.innerHTML = matieres.map(m => `
        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <h3 class="text-xl font-bold text-slate-800 mb-2">${m.libelle_mat}</h3>
            <p class="text-slate-600">Code: ${m.code_mat}</p>
            <p class="text-slate-600">Crédits: ${m.nb_credit}</p>
        </div>
    `).join('');
}

function deconnexion() {
    localStorage.clear();
    window.location.href = '/auth-fixed.html';
}

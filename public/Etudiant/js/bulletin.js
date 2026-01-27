// BULLETIN.JS
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
    
    document.getElementById('etudiant-nom').textContent = `${user.prenom} ${user.nom}`;
    document.getElementById('etudiant-matricule').textContent = user.matricule;
    document.getElementById('etudiant-email').textContent = user.email;
    
    await chargerBulletin(user.matricule);
});

async function chargerBulletin(matricule) {
    try {
        const response = await fetch(`${API_URL}/evaluations?matricule_et=${matricule}`);
        const notes = await response.json();
        
        afficherBulletin(notes);
        calculerMoyenne(notes);
    } catch (error) {
        console.error('Erreur:', error);
    }
}

function afficherBulletin(notes) {
    const tbody = document.getElementById('bulletin-tbody');
    if (!tbody || notes.length === 0) return;
    
    tbody.innerHTML = notes.map(n => `
        <tr>
            <td class="px-4 py-3">${n.libelle_mat}</td>
            <td class="px-4 py-3 text-center">${n.nb_credit}</td>
            <td class="px-4 py-3 text-center font-bold">${parseFloat(n.note).toFixed(2)}</td>
            <td class="px-4 py-3">${n.libelle_per}</td>
        </tr>
    `).join('');
}

function calculerMoyenne(notes) {
    if (notes.length === 0) return;
    const moy = (notes.reduce((a, n) => a + parseFloat(n.note), 0) / notes.length).toFixed(2);
    document.getElementById('moyenne-generale').textContent = moy;
    document.getElementById('appreciation').textContent = moy >= 14 ? 'Très bien' : moy >= 12 ? 'Bien' : moy >= 10 ? 'Assez bien' : 'Insuffisant';
}

function imprimerBulletin() {
    window.print();
}

function deconnexion() {
    localStorage.clear();
    window.location.href = '/auth-fixed.html';
}

// NOTES.JS - Consultation notes étudiant
const API_URL = 'http://localhost:5000/api';

function verifierAuth() {
    const user = localStorage.getItem('user');
    if (!user || user === 'undefined') {
        window.location.href = '/auth-fixed.html';
        return null;
    }
    try {
        const userData = JSON.parse(user);
        if (userData.role !== 'etudiant') {
            window.location.href = '/auth-fixed.html';
            return null;
        }
        return userData;
    } catch (e) {
        window.location.href = '/auth-fixed.html';
        return null;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = verifierAuth();
    if (!user) return;
    
    document.getElementById('navbar-username').textContent = `${user.prenom} ${user.nom}`;
    await chargerNotes(user.matricule);
});

async function chargerNotes(matricule) {
    try {
        const response = await fetch(`${API_URL}/evaluations?matricule_et=${matricule}`);
        if (!response.ok) throw new Error('Erreur chargement notes');
        
        const notes = await response.json();
        afficherNotes(notes);
        calculerMoyenne(notes);
    } catch (error) {
        console.error('Erreur:', error);
        afficherNotification('Erreur chargement notes', 'error');
    }
}

function afficherNotes(notes) {
    const tbody = document.getElementById('notes-tbody');
    if (!tbody) return;
    
    if (notes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-slate-500">Aucune note disponible</td></tr>';
        return;
    }
    
    tbody.innerHTML = notes.map(note => `
        <tr class="hover:bg-slate-50">
            <td class="px-6 py-4">${note.libelle_mat || note.code_mat}</td>
            <td class="px-6 py-4 text-center">${note.nb_credit || '-'}</td>
            <td class="px-6 py-4 text-center font-bold ${getColorClass(note.note)}">${parseFloat(note.note).toFixed(2)}</td>
            <td class="px-6 py-4">${note.libelle_per || note.code_per}</td>
            <td class="px-6 py-4">${note.nom_ens || '-'} ${note.prenom_ens || ''}</td>
            <td class="px-6 py-4 text-sm text-slate-500">${formatDate(note.date_eval)}</td>
        </tr>
    `).join('');
}

function calculerMoyenne(notes) {
    if (notes.length === 0) return;
    
    const somme = notes.reduce((acc, n) => acc + parseFloat(n.note), 0);
    const moyenne = (somme / notes.length).toFixed(2);
    
    const moyenneEl = document.getElementById('moyenne-generale');
    if (moyenneEl) {
        moyenneEl.textContent = moyenne;
        moyenneEl.className = `text-3xl font-bold ${getColorClass(moyenne)}`;
    }
}

function getColorClass(note) {
    const n = parseFloat(note);
    if (n >= 14) return 'text-green-600';
    if (n >= 10) return 'text-blue-600';
    return 'text-red-600';
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('fr-FR');
}

function deconnexion() {
    localStorage.clear();
    window.location.href = '/auth-fixed.html';
}

function afficherNotification(msg, type) {
    const notif = document.createElement('div');
    notif.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white z-50 bg-${type === 'error' ? 'red' : 'green'}-500`;
    notif.textContent = msg;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 4000);
}

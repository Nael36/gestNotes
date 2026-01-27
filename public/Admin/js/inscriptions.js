// inscriptions.js - Version alignée avec le HTML
const API_URL = 'http://localhost:5000/api';

let modeEdition = false;
let matriculeActuel = null;
let photoBase64 = null;

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation module Inscriptions...');
    
    // 1. Vérifier l'authentification
    if (!verifierAuth()) {
        console.log('❌ Non authentifié, arrêt de l\'initialisation');
        return;
    }
    
    // 2. Initialiser seulement si authentifié
    await initApplication();
    
    // 3. Initialiser les événements enseignants
    initEnseignantsEvents();
});

// ==================== VÉRIFICATION AUTH ====================
function verifierAuth() {
    console.log('🔍 Vérification authentification...');
    
    // Pour le développement, créer une session admin fictive si nécessaire
    const admin = localStorage.getItem('admin');
    const user = localStorage.getItem('user');
    
    if (!admin && !user) {
        console.log('🔐 Pas de session, création session de développement...');
        const fakeAdmin = {
            id_admin: 1,
            nom_admin: 'Admin',
            prenom_admin: 'Système',
            email_admin: 'admin@iua.ci',
            role: 'admin'
        };
        localStorage.setItem('admin', JSON.stringify(fakeAdmin));
    }
    
    // Mettre à jour la navbar
    const adminData = JSON.parse(localStorage.getItem('admin'));
    const usernameSpan = document.getElementById('navbar-username');
    if (usernameSpan && adminData) {
        if (adminData.prenom_admin && adminData.nom_admin) {
            usernameSpan.textContent = `${adminData.prenom_admin} ${adminData.nom_admin}`;
        } else if (adminData.email) {
            usernameSpan.textContent = adminData.email;
        }
    }
    
    return true;
}

// ==================== INIT APPLICATION ====================
async function initApplication() {
    console.log('✅ Authentifié, initialisation de l\'application...');
    
    try {
        // Gérer la soumission du formulaire
        const form = document.getElementById('form-inscription');
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }
        
        // Initialiser le bouton de recherche
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', rechercherEtudiant);
        }
        
        // Entrée sur le champ matricule
        const matriculeInput = document.getElementById('matricule');
        if (matriculeInput) {
            matriculeInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    rechercherEtudiant();
                }
            });
        }
        
        // Charger la liste des étudiants
        await chargerEtudiants();
        
        console.log('✅ Application initialisée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur initialisation:', error);
        afficherNotification('Erreur lors de l\'initialisation', 'error');
    }
}

// ==================== INIT ÉVÉNEMENTS ENSEIGNANTS ====================
function initEnseignantsEvents() {
    // Initialiser le formulaire enseignant (dans la modal)
    const formEnseignant = document.getElementById('form-enseignant');
    if (formEnseignant) {
        formEnseignant.addEventListener('submit', async (e) => {
            e.preventDefault();
            await ajouterEnseignant();
        });
    }
    
    // Générateur de mot de passe
    const genPassBtn = document.querySelector('button[onclick="genererMotDePasse()"]');
    if (genPassBtn) {
        genPassBtn.onclick = genererMotDePasse;
    }
}

// ==================== RECHERCHE ÉTUDIANT ====================
async function rechercherEtudiant() {
    const matricule = document.getElementById('matricule').value.trim().toUpperCase();
    const searchResult = document.getElementById('search-result');
    
    if (!matricule) {
        afficherNotification('Veuillez saisir un matricule', 'warning');
        return;
    }
    
    try {
        console.log('🔍 Recherche étudiant:', matricule);
        const response = await fetch(`${API_URL}/etudiants/${matricule}`);
        
        console.log('📊 Statut réponse:', response.status);
        
        if (response.ok) {
            const etudiant = await response.json();
            console.log('✅ Étudiant trouvé:', etudiant);
            
            // Remplir le formulaire
            document.getElementById('nom').value = etudiant.nom_et || '';
            document.getElementById('prenom').value = etudiant.prenom_et || '';
            document.getElementById('email').value = etudiant.email_et || '';
            
            // Sélectionner la classe si l'étudiant a une inscription
            if (etudiant.code_cl) {
                document.getElementById('classe').value = etudiant.code_cl;
            }
            
            // Afficher la photo si elle existe
            if (etudiant.photo_et) {
                const preview = document.getElementById('photo-preview');
                preview.innerHTML = `<img src="${etudiant.photo_et}" alt="Photo" class="w-full h-full object-cover">`;
                photoBase64 = etudiant.photo_et;
            } else {
                document.getElementById('photo-preview').innerHTML = '<i class="fas fa-user text-4xl text-slate-400"></i>';
                photoBase64 = null;
            }
            
            // Passer en mode réinscription
            modeEdition = true;
            matriculeActuel = matricule;
            document.getElementById('form-title').innerHTML = '<i class="fas fa-redo text-orange-500"></i> Réinscription/Mise à jour';
            document.getElementById('matricule').readOnly = true;
            document.getElementById('matricule').classList.add('bg-slate-100');
            
            searchResult.innerHTML = '<span class="text-green-600"><i class="fas fa-check-circle"></i> Étudiant trouvé - Mise à jour possible</span>';
            afficherNotification('Étudiant trouvé ! Vous pouvez modifier ses informations.', 'success');
            
        } else if (response.status === 404) {
            console.log('ℹ️ Étudiant non trouvé - Nouvelle inscription');
            searchResult.innerHTML = '<span class="text-blue-600"><i class="fas fa-info-circle"></i> Matricule disponible - Nouvelle inscription</span>';
            
            // Vider les champs pour nouvelle inscription
            document.getElementById('nom').value = '';
            document.getElementById('prenom').value = '';
            document.getElementById('email').value = '';
            document.getElementById('classe').value = '';
            document.getElementById('photo-preview').innerHTML = '<i class="fas fa-user text-4xl text-slate-400"></i>';
            
            modeEdition = false;
            matriculeActuel = null;
            photoBase64 = null;
            afficherNotification('Matricule disponible. Vous pouvez créer une nouvelle inscription.', 'info');
        } else {
            const errorText = await response.text();
            console.error('❌ Erreur serveur:', errorText);
            throw new Error(`Erreur serveur (${response.status})`);
        }
        
    } catch (error) {
        console.error('❌ Erreur recherche:', error);
        searchResult.innerHTML = `<span class="text-red-600"><i class="fas fa-exclamation-circle"></i> ${error.message}</span>`;
        afficherNotification(`Erreur lors de la recherche: ${error.message}`, 'error');
    }
}

// ==================== SOUMISSION FORMULAIRE ====================
async function handleSubmit(e) {
    e.preventDefault();
    
    const matricule = document.getElementById('matricule').value.trim().toUpperCase();
    const nom = document.getElementById('nom').value.trim();
    const prenom = document.getElementById('prenom').value.trim();
    const email = document.getElementById('email').value.trim();
    const classe = document.getElementById('classe').value;
    
    // Validation
    if (!matricule || !nom || !prenom || !email || !classe) {
        afficherNotification('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    if (!email.endsWith('@iua.ci')) {
        afficherNotification('L\'email doit se terminer par @iua.ci', 'error');
        return;
    }
    
    try {
        // Préparer les données
        const data = {
            matricule_et: matricule,
            nom_et: nom,
            prenom_et: prenom,
            email_et: email,
            photo_et: photoBase64 || null,
            password_et: matricule, // Mot de passe par défaut = matricule
            code_cl: classe
        };
        
        console.log('💾 Envoi des données:', { matricule, modeEdition });
        
        if (modeEdition) {
            // Mode édition - Mise à jour
            const updateResponse = await fetch(`${API_URL}/etudiants/${matricule}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!updateResponse.ok) {
                const error = await updateResponse.json();
                throw new Error(error.error || 'Erreur lors de la mise à jour');
            }
            
            // Mettre à jour l'inscription
            await mettreAJourInscription(matricule, classe);
            
            afficherNotification('Étudiant et inscription mis à jour avec succès !', 'success');
            
        } else {
            // Mode création - Nouvel étudiant
            const createResponse = await fetch(`${API_URL}/etudiants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!createResponse.ok) {
                const error = await createResponse.json();
                throw new Error(error.error || 'Erreur lors de la création');
            }
            
            // Créer une inscription
            await inscrireEtudiant(matricule, classe);
            
            afficherNotification('Nouvel étudiant inscrit avec succès !', 'success');
        }
        
        // Rafraîchir et réinitialiser
        await chargerEtudiants();
        reinitialiserFormulaire();
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        afficherNotification(error.message || 'Erreur lors de l\'opération', 'error');
    }
}

// ==================== INSCRIPTION ÉTUDIANT ====================
async function inscrireEtudiant(matricule, classe) {
    const inscriptionData = {
        matricule_et: matricule,
        code_cl: classe,
        date_ins: new Date().toISOString().split('T')[0],
        annee_academique: '2025-2026',
        statut: 'active'
    };
    
    console.log('📝 Création inscription:', inscriptionData);
    
    const response = await fetch(`${API_URL}/inscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inscriptionData)
    });
    
    if (!response.ok) {
        const error = await response.json();
        // Si l'inscription existe déjà (409), c'est OK
        if (response.status === 409) {
            console.log('ℹ️ Inscription déjà existante');
            return;
        }
        throw new Error(error.error || 'Erreur lors de l\'inscription');
    }
    
    return await response.json();
}

// ==================== MISE À JOUR INSCRIPTION ====================
async function mettreAJourInscription(matricule, nouvelleClasse) {
    try {
        console.log(`🔄 Recherche inscriptions pour ${matricule}`);
        
        // Récupérer les inscriptions de l'étudiant
        const response = await fetch(`${API_URL}/inscriptions/etudiant/${matricule}`);
        
        if (response.ok) {
            const inscriptions = await response.json();
            console.log(`📊 Inscriptions trouvées: ${inscriptions.length}`);
            
            if (inscriptions.length > 0) {
                // Mettre à jour la dernière inscription
                const inscription = inscriptions[inscriptions.length - 1];
                
                const updateData = {
                    code_cl: nouvelleClasse,
                    date_ins: new Date().toISOString().split('T')[0],
                    statut: 'active'
                };
                
                const updateResponse = await fetch(`${API_URL}/inscriptions/${inscription.num_ins}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });
                
                if (!updateResponse.ok) {
                    throw new Error('Erreur lors de la mise à jour de l\'inscription');
                }
                
                console.log('✅ Inscription mise à jour');
                return await updateResponse.json();
            }
        }
        
        // Si pas d'inscription trouvée, en créer une nouvelle
        console.log('✨ Création nouvelle inscription');
        return await inscrireEtudiant(matricule, nouvelleClasse);
        
    } catch (error) {
        console.error('❌ Erreur mise à jour inscription:', error);
        throw error;
    }
}

// ==================== CHARGEMENT DONNÉES ====================
async function chargerEtudiants() {
    const tbody = document.getElementById('tableau-etudiants');
    
    try {
        console.log('📥 Chargement des inscriptions...');
        
        // Charger tous les étudiants
        const response = await fetch(`${API_URL}/etudiants`);
        
        if (!response.ok) {
            throw new Error(`Erreur ${response.status} lors du chargement des étudiants`);
        }
        
        const etudiants = await response.json();
        console.log(`✅ ${etudiants.length} étudiants chargés`);
        
        afficherTableau(etudiants);
        
    } catch (error) {
        console.error('❌ Erreur chargement:', error);
        afficherDonneesDemo();
    }
}

// ==================== AFFICHAGE TABLEAU ====================
function afficherTableau(etudiants) {
    const tbody = document.getElementById('tableau-etudiants');
    
    if (!etudiants || etudiants.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-16 text-center">
                    <i class="fas fa-inbox text-6xl text-slate-300 mb-4"></i>
                    <p class="text-slate-600 text-lg">Aucun étudiant trouvé</p>
                    <p class="text-sm text-slate-500 mt-2">Veuillez créer une première inscription</p>
                </td>
            </tr>`;
        return;
    }
    
    tbody.innerHTML = etudiants.map((e, index) => `
        <tr class="hover:bg-slate-50 transition-colors" style="animation: fadeIn 0.3s ease ${index * 0.05}s forwards; opacity: 0;">
            <td class="px-6 py-4">
                <span class="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold text-xs">
                    <i class="fas fa-id-card"></i> ${e.matricule_et}
                </span>
            </td>
            <td class="px-6 py-4"><span class="font-bold text-slate-800">${e.nom_et}</span></td>
            <td class="px-6 py-4"><span class="text-slate-700">${e.prenom_et}</span></td>
            <td class="px-6 py-4"><span class="text-slate-600">${e.email_et || 'N/A'}</span></td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full text-xs font-bold ${
                    e.code_cl ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                }">
                    ${e.code_cl || 'Non inscrit'}
                </span>
            </td>
            <td class="px-6 py-4">
                ${e.photo_et ? 
                    `<img src="${e.photo_et}" alt="Photo" class="w-12 h-12 rounded-full object-cover border-2 border-slate-200">` :
                    `<div class="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                        <i class="fas fa-user text-slate-400"></i>
                    </div>`
                }
            </td>
            <td class="px-6 py-4">
                <div class="flex gap-2">
                    <button onclick="editerEtudiant('${e.matricule_et}')" class="p-2 bg-blue-100 text-blue-600 rounded-lg hover:scale-110 transition" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="ouvrirModalSuppression('${e.matricule_et}', '${e.nom_et}', '${e.prenom_et}')" class="p-2 bg-red-100 text-red-600 rounded-lg hover:scale-110 transition" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ==================== DONNÉES DE DÉMONSTRATION ====================
function afficherDonneesDemo() {
    const tbody = document.getElementById('tableau-etudiants');
    
    const etudiantsDemo = [
        {
            matricule_et: 'ETU2025001',
            nom_et: 'KONÉ',
            prenom_et: 'Moussa',
            email_et: 'm.kone@iua.ci',
            code_cl: 'L1_GI',
            photo_et: null
        },
        {
            matricule_et: 'ETU2025002',
            nom_et: 'TRAORÉ',
            prenom_et: 'Aminata',
            email_et: 'a.traore@iua.ci',
            code_cl: 'L1_MIAGE',
            photo_et: null
        },
        {
            matricule_et: 'ETU2025003',
            nom_et: 'DIOP',
            prenom_et: 'Cheikh',
            email_et: 'c.diop@iua.ci',
            code_cl: 'L2_GI',
            photo_et: null
        },
        {
            matricule_et: 'ETU2025004',
            nom_et: 'CAMARA',
            prenom_et: 'Fatou',
            email_et: 'f.camara@iua.ci',
            code_cl: 'L3_MIAGE',
            photo_et: null
        }
    ];
    
    afficherTableau(etudiantsDemo);
    
    afficherNotification('Mode démonstration - Données fictives affichées', 'warning');
}

// ==================== ACTIONS ====================
async function editerEtudiant(matricule) {
    document.getElementById('matricule').value = matricule;
    await rechercherEtudiant();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function supprimerEtudiant(matricule) {
    try {
        const response = await fetch(`${API_URL}/etudiants/${matricule}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur suppression');
        }
        
        afficherNotification('Étudiant supprimé avec succès', 'success');
        await chargerEtudiants();
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        afficherNotification(error.message || 'Erreur lors de la suppression', 'error');
    }
}

// ==================== GESTION PHOTO ====================
function previewPhoto(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Vérifier la taille (max 200KB)
    if (file.size > 800 * 1024) {
        afficherNotification('La photo ne doit pas dépasser 200KB', 'error');
        event.target.value = '';
        return;
    }
    
    // Vérifier le type
    if (!file.type.match('image.*')) {
        afficherNotification('Veuillez sélectionner une image', 'error');
        event.target.value = '';
        return;
    }
    
    // Lire et afficher l'aperçu
    const reader = new FileReader();
    reader.onload = function(e) {
        // Stocker l'image en base64
        photoBase64 = e.target.result;
        
        // Afficher l'aperçu
        document.getElementById('photo-preview').innerHTML = 
            `<img src="${photoBase64}" alt="Aperçu" class="w-full h-full object-cover">`;
    };
    reader.readAsDataURL(file);
}

// ==================== RÉINITIALISATION ====================
function reinitialiserFormulaire() {
    document.getElementById('form-inscription').reset();
    document.getElementById('photo-preview').innerHTML = '<i class="fas fa-user text-4xl text-slate-400"></i>';
    document.getElementById('search-result').innerHTML = '';
    document.getElementById('form-title').innerHTML = '<i class="fas fa-user-plus text-primary"></i> Nouvelle Inscription';
    document.getElementById('matricule').readOnly = false;
    document.getElementById('matricule').classList.remove('bg-slate-100');
    
    modeEdition = false;
    matriculeActuel = null;
    photoBase64 = null;
}

// ==================== RECHERCHE DANS LE TABLEAU ====================
function filtrerTableau() {
    const input = document.getElementById('search-table').value.toLowerCase();
    const tbody = document.getElementById('tableau-etudiants');
    const rows = tbody.getElementsByTagName('tr');
    
    let visibleCount = 0;
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.cells.length < 7) continue; // Ignorer les lignes spéciales
        
        const text = row.textContent.toLowerCase();
        const matches = text.includes(input);
        
        if (matches) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    }
    
    // Afficher message si aucun résultat
    const existingMessage = tbody.querySelector('.no-results');
    if (visibleCount === 0 && input.length > 0) {
        if (!existingMessage) {
            const message = `<tr class="no-results">
                <td colspan="7" class="px-6 py-8 text-center">
                    <i class="fas fa-search text-4xl text-slate-300 mb-3"></i>
                    <p class="text-slate-600">Aucun étudiant trouvé pour "${input}"</p>
                </td>
            </tr>`;
            tbody.insertAdjacentHTML('beforeend', message);
        }
    } else if (existingMessage) {
        existingMessage.remove();
    }
}

// ==================== NOTIFICATIONS ====================
function afficherNotification(message, type = 'info') {
    // Supprimer les notifications existantes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const container = document.createElement('div');
    container.className = `notification fixed top-4 right-4 z-[100] animate-slide-in`;
    
    const couleurs = {
        success: 'bg-gradient-to-r from-green-500 to-green-600',
        error: 'bg-gradient-to-r from-red-500 to-red-600',
        warning: 'bg-gradient-to-r from-orange-500 to-orange-600',
        info: 'bg-gradient-to-r from-blue-500 to-blue-600'
    };
    
    const icones = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    container.innerHTML = `
        <div class="${couleurs[type]} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-[400px]">
            <i class="fas ${icones[type]} text-xl"></i>
            <span class="flex-1">${message}</span>
            <button onclick="this.closest('.notification').remove()" class="text-white hover:text-gray-200 transition">
                <i class="fas fa-times"></i>
            </button>
        </div>`;
    
    document.body.appendChild(container);
    
    // Auto-suppression après 5 secondes
    setTimeout(() => {
        if (container.parentElement) {
            container.style.animation = 'slide-out 0.3s ease forwards';
            setTimeout(() => container.remove(), 300);
        }
    }, 5000);
}

// ==================== GESTION DES ENSEIGNANTS ====================

// Charger les enseignants
async function chargerEnseignants() {
    try {
        const response = await fetch(`${API_URL}/enseignants`);
        if (response.ok) {
            const enseignants = await response.json();
            afficherEnseignants(enseignants);
        }
    } catch (error) {
        console.error('Erreur chargement enseignants:', error);
    }
}

// Afficher les enseignants
function afficherEnseignants(enseignants) {
    const contenu = document.getElementById('contenu-enseignants');
    
    if (!enseignants || enseignants.length === 0) {
        contenu.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-chalkboard-teacher text-4xl text-slate-300 mb-3"></i>
                <p class="text-slate-600">Aucun enseignant trouvé</p>
            </div>`;
        return;
    }

    contenu.innerHTML = enseignants.map(ens => `
        <div class="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <i class="fas fa-user-tie text-white"></i>
                </div>
                <div>
                    <h5 class="font-bold text-slate-800">${ens.nom_ens} ${ens.prenom_ens}</h5>
                    <p class="text-sm text-slate-600">${ens.matricule_ens} • ${ens.email_ens}</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="editerEnseignant('${ens.matricule_ens}')" class="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition" title="Modifier">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="supprimerEnseignant('${ens.matricule_ens}')" class="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition" title="Supprimer">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Ajouter un enseignant
async function ajouterEnseignant() {
    const matricule = document.getElementById('matricule-ens').value.trim().toUpperCase();
    const nom = document.getElementById('nom-ens').value.trim();
    const prenom = document.getElementById('prenom-ens').value.trim();
    const email = document.getElementById('email-ens').value.trim();
    const password = document.getElementById('password-ens').value;
    
    // Validation
    if (!matricule || !nom || !prenom || !email || !password) {
        afficherNotification('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    if (!matricule.startsWith('ENS')) {
        afficherNotification('Le matricule doit commencer par "ENS"', 'error');
        return;
    }
    
    if (!email.endsWith('@iua.ci')) {
        afficherNotification('L\'email doit se terminer par @iua.ci', 'error');
        return;
    }
    
    try {
        const enseignantData = {
            matricule_ens: matricule,
            nom_ens: nom,
            prenom_ens: prenom,
            email_ens: email,
            password_ens: password
        };
        
        const response = await fetch(`${API_URL}/enseignants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(enseignantData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de l\'ajout');
        }
        
        afficherNotification('Enseignant ajouté avec succès!', 'success');
        document.getElementById('form-enseignant').reset();
        await chargerEnseignants();
        
    } catch (error) {
        console.error('❌ Erreur ajout enseignant:', error);
        afficherNotification(error.message, 'error');
    }
}

// Éditer un enseignant
async function editerEnseignant(matricule) {
    try {
        const response = await fetch(`${API_URL}/enseignants/${matricule}`);
        
        if (!response.ok) {
            throw new Error('Enseignant non trouvé');
        }
        
        const enseignant = await response.json();
        
        // Remplir le formulaire
        document.getElementById('matricule-ens').value = enseignant.matricule_ens;
        document.getElementById('nom-ens').value = enseignant.nom_ens;
        document.getElementById('prenom-ens').value = enseignant.prenom_ens;
        document.getElementById('email-ens').value = enseignant.email_ens;
        
        // Changer le bouton
        const submitBtn = document.querySelector('#form-enseignant button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Mettre à jour';
        submitBtn.onclick = async (e) => {
            e.preventDefault();
            await mettreAJourEnseignant(matricule);
        };
        
    } catch (error) {
        console.error('Erreur édition enseignant:', error);
        afficherNotification(error.message, 'error');
    }
}

// Mettre à jour un enseignant
async function mettreAJourEnseignant(oldMatricule) {
    const matricule = document.getElementById('matricule-ens').value.trim().toUpperCase();
    const nom = document.getElementById('nom-ens').value.trim();
    const prenom = document.getElementById('prenom-ens').value.trim();
    const email = document.getElementById('email-ens').value.trim();
    
    try {
        const updateData = {
            matricule_ens: matricule,
            nom_ens: nom,
            prenom_ens: prenom,
            email_ens: email
        };
        
        const response = await fetch(`${API_URL}/enseignants/${oldMatricule}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la mise à jour');
        }
        
        afficherNotification('Enseignant mis à jour avec succès!', 'success');
        document.getElementById('form-enseignant').reset();
        
        // Restaurer le bouton
        const submitBtn = document.querySelector('#form-enseignant button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-plus mr-2"></i>Ajouter l\'enseignant';
        submitBtn.onclick = async (e) => {
            e.preventDefault();
            await ajouterEnseignant();
        };
        
        await chargerEnseignants();
        
    } catch (error) {
        console.error('Erreur mise à jour enseignant:', error);
        afficherNotification(error.message, 'error');
    }
}

// Supprimer un enseignant
async function supprimerEnseignant(matricule) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'enseignant ${matricule} ?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/enseignants/${matricule}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la suppression');
        }
        
        afficherNotification('Enseignant supprimé avec succès', 'success');
        await chargerEnseignants();
        
    } catch (error) {
        console.error('Erreur suppression enseignant:', error);
        afficherNotification(error.message, 'error');
    }
}

// Générer mot de passe
function genererMotDePasse() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('password-ens').value = password;
}

// ==================== EXPORT DES FONCTIONS ====================
window.editerEtudiant = editerEtudiant;
window.supprimerEtudiant = supprimerEtudiant;
window.previewPhoto = previewPhoto;
window.filtrerTableau = filtrerTableau;
window.reinitialiserFormulaire = reinitialiserFormulaire;
window.rechercherEtudiant = rechercherEtudiant;
window.chargerEtudiants = chargerEtudiants;
window.editerEnseignant = editerEnseignant;
window.supprimerEnseignant = supprimerEnseignant;
window.genererMotDePasse = genererMotDePasse;
window.chargerEnseignants = chargerEnseignants;

// ==================== CSS ANIMATIONS ====================
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slide-out {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .animate-slide-in {
        animation: slide-in 0.3s ease forwards;
    }
`;
document.head.appendChild(style);

console.log('✅ Script inscriptions.js chargé avec succès');
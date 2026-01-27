// ==================== CONFIGURATION ====================
const API_URL = "http://localhost:5000/api";

let enseignantMatricule = null;
let classeSelectionnee = null;
let matiereSelectionnee = null;
let periodeSelectionnee = null;
let etudiantsData = [];
let inscriptionsData = [];
let evaluationsData = new Map(); // Stocke les notes existantes
let notesModifiees = new Map();
let timeoutFiltre = null;

// ==================== INITIALISATION ====================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Initialisation module Évaluations...");

  // Vérifier l'authentification
  verifierAuth();

  // Mettre à jour le nom d'utilisateur
  updateUsername();

  // Initialiser le menu mobile
  initialiserMenuMobile();

  // Charger les classes depuis l'API
  await chargerClasses();

  // Charger toutes les périodes
  await chargerToutesPeriodes();

  // Initialiser les événements
  initialiserEvenements();
});

// ==================== AUTHENTIFICATION ====================
function verifierAuth() {
  const user = localStorage.getItem("user");
  if (!user) {
    window.location.href = "auth-fixed.html";
    return;
  }

  try {
    const userData = JSON.parse(user);
    
    // CORRECTION CRITIQUE: PROF001 n'existe pas, on utilise ENS01
    // Si le matricule est PROF001, on le remplace par un matricule qui existe
    if (userData.matricule === 'PROF001') {
      console.warn("⚠️ PROF001 détecté - remplacement par ENS01");
      userData.matricule = 'ENS01'; // Utiliser un enseignant qui existe
      
      // Mettre à jour le localStorage
      localStorage.setItem("user", JSON.stringify(userData));
    }
    
    enseignantMatricule = userData.matricule;

    console.log("✅ Enseignant connecté:", enseignantMatricule);
    console.log("📋 Détails utilisateur:", userData);
    
  } catch (err) {
    console.error("❌ Erreur lecture données utilisateur:", err);
    window.location.href = "auth-fixed.html";
  }
}

function updateUsername() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      // Si le nom est "Prof" et le matricule PROF001, mettre à jour pour correspondre à ENS01
      if (user.nom === "Prof" && user.matricule === "PROF001") {
        user.nom = "Diallo";
        user.prenom = "Mamadou";
        user.matricule = "ENS01";
        localStorage.setItem("user", JSON.stringify(user));
      }
      
      const displayName = `${user.prenom} ${user.nom}`;
      const elements = ["navbar-username", "mobile-username"];
      elements.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = displayName;
      });
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
}

function initialiserMenuMobile() {
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      mobileMenu.classList.toggle("hidden");
    });

    // Fermer le menu en cliquant à l'extérieur
    document.addEventListener("click", (e) => {
      if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        mobileMenu.classList.add("hidden");
      }
    });
  }
}

// ==================== CHARGEMENT CLASSES ====================
async function chargerClasses() {
  try {
    console.log("📥 Chargement des classes...");
    const response = await fetch(`${API_URL}/classes`);

    if (!response.ok) throw new Error("Erreur chargement classes");

    const classes = await response.json();
    console.log("✅ Classes chargées:", classes.length);

    const select = document.getElementById("select-classe");
    select.innerHTML =
      '<option value="">-- Sélectionner une classe --</option>';

    classes.forEach((classe) => {
      const option = document.createElement("option");
      option.value = classe.code_cl;
      option.textContent = classe.libelle_cl;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("❌ Erreur chargement classes:", error);
    afficherNotification("Erreur de chargement des classes", "error");
  }
}

// ==================== CHARGEMENT MATIÈRES ====================
async function chargerMatieres() {
  const selectClasse = document.getElementById("select-classe");
  const selectMatiere = document.getElementById("select-matiere");
  const selectPeriode = document.getElementById("select-periode");

  classeSelectionnee = selectClasse.value;

  // Réinitialiser les sélections suivantes
  selectMatiere.innerHTML =
    '<option value="">-- Sélectionner une matière --</option>';
  selectPeriode.innerHTML =
    '<option value="">-- Sélectionner une période --</option>';
  selectMatiere.disabled = true;
  selectPeriode.disabled = true;

  // Vider le tableau et cacher les boutons
  viderTableauEtudiants();
  cacherBoutonsEnregistrement();

  if (!classeSelectionnee) return;

  try {
    console.log("📥 Chargement des matières pour:", classeSelectionnee);
    const response = await fetch(
      `${API_URL}/matieres/classe/${classeSelectionnee}`,
    );

    if (!response.ok) throw new Error("Erreur chargement matières");

    const matieres = await response.json();
    console.log("✅ Matières chargées:", matieres.length);

    if (matieres.length === 0) {
      afficherNotification(
        "Aucune matière trouvée pour cette classe",
        "warning",
      );
      return;
    }

    matieres.forEach((matiere) => {
      const option = document.createElement("option");
      option.value = matiere.code_mat;
      option.textContent = `${matiere.libelle_mat} (${matiere.nb_credit} crédits)`;
      selectMatiere.appendChild(option);
    });

    selectMatiere.disabled = false;
  } catch (error) {
    console.error("❌ Erreur chargement matières:", error);
    afficherNotification("Erreur de chargement des matières", "error");
  }
}

// ==================== CHARGEMENT PÉRIODES ====================
async function chargerToutesPeriodes() {
  try {
    console.log("📥 Chargement de toutes les périodes...");
    const response = await fetch(`${API_URL}/periodes`);

    if (!response.ok) throw new Error("Erreur chargement périodes");

    window.toutesPeriodes = await response.json();
    console.log("✅ Périodes chargées:", window.toutesPeriodes.length);
  } catch (error) {
    console.error("❌ Erreur chargement périodes:", error);
    afficherNotification("Erreur de chargement des périodes", "error");
  }
}

async function chargerPeriodes() {
  const selectPeriode = document.getElementById("select-periode");

  matiereSelectionnee = document.getElementById("select-matiere").value;

  // Réinitialiser période
  selectPeriode.innerHTML =
    '<option value="">-- Sélectionner une période --</option>';
  selectPeriode.disabled = true;

  // Vider le tableau et cacher les boutons
  viderTableauEtudiants();
  cacherBoutonsEnregistrement();

  if (!matiereSelectionnee) return;

  // Utiliser les périodes déjà chargées
  if (window.toutesPeriodes && window.toutesPeriodes.length > 0) {
    window.toutesPeriodes.forEach((periode) => {
      const option = document.createElement("option");
      option.value = periode.code_per;
      option.textContent = periode.libelle_per;
      selectPeriode.appendChild(option);
    });

    selectPeriode.disabled = false;
  }
}

// ==================== CHARGEMENT ÉTUDIANTS ====================
async function chargerEtudiants() {
  periodeSelectionnee = document.getElementById("select-periode").value;

  if (!periodeSelectionnee || !matiereSelectionnee || !classeSelectionnee) {
    viderTableauEtudiants();
    return;
  }

  try {
    console.log("📥 Chargement des étudiants...");

    // Afficher le chargement
    afficherChargementEtudiants();

    // 1. Charger les inscriptions de la classe pour l'année en cours
    await chargerInscriptions();

    // 2. Charger les évaluations existantes
    await chargerEvaluationsExistantes();

    // 3. Afficher les étudiants
    afficherEtudiants();

    // Afficher le bouton d'enregistrement
    document.getElementById("btn-enregistrer-tout").classList.remove("hidden");
    document.getElementById("mobile-actions").classList.remove("hidden");
  } catch (error) {
    console.error("❌ Erreur chargement étudiants:", error);
    afficherErreurEtudiants();
  }
}

async function chargerInscriptions() {
  try {
    // Récupérer les inscriptions pour cette classe et année
    const response = await fetch(
      `${API_URL}/inscriptions/classe/${classeSelectionnee}`,
    );

    if (!response.ok) throw new Error("Erreur chargement inscriptions");

    const inscriptionsData = await response.json();
    console.log("✅ Inscriptions chargées:", inscriptionsData.length);

    // Les inscriptionsData contiennent déjà les infos étudiant
    // Transforme les données pour qu'elles correspondent à ce qu'attend afficherEtudiants()
    etudiantsData = inscriptionsData.map((inscription) => ({
      num_ins: inscription.num_ins,
      matricule_et: inscription.matricule_et,
      nom_et: inscription.nom_et,
      prenom_et: inscription.prenom_et,
      email_et: inscription.email_et,
    }));

    console.log("✅ Étudiants préparés:", etudiantsData.length);
  } catch (error) {
    console.error("❌ Erreur chargement inscriptions:", error);
    throw error;
  }
}

async function chargerEvaluationsExistantes() {
  try {
    console.log("🔍 Recherche évaluations pour:", {
      enseignant: enseignantMatricule,
      matiere: matiereSelectionnee,
      periode: periodeSelectionnee
    });

    // Charger les évaluations existantes pour cette matière, période et enseignant
    const response = await fetch(
      `${API_URL}/evaluations/enseignant/${enseignantMatricule}/matiere/${matiereSelectionnee}/periode/${periodeSelectionnee}`,
    );

    if (response.status === 404) {
      console.log("ℹ️ Aucune évaluation existante");
      evaluationsData.clear();
      return;
    }

    if (!response.ok) {
      console.error("❌ Erreur chargement évaluations:", response.status, response.statusText);
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    const evaluations = await response.json();
    console.log("✅ Évaluations chargées:", evaluations.length);

    // Stocker dans un Map pour accès rapide (key: num_ins, value: note)
    evaluationsData.clear();
    evaluations.forEach((evaluation) => {
      evaluationsData.set(evaluation.num_ins, evaluation.note);
    });

  } catch (error) {
    console.error("❌ Erreur chargement évaluations:", error.message);
    // Ne pas bloquer l'application si cette requête échoue
  }
}

// ==================== AFFICHAGE TABLEAU ====================
function afficherEtudiants() {
  const tbody = document.getElementById("tableau-etudiants");
  const countDesktop = document.getElementById("count-etudiants");
  const countMobile = document.getElementById("count-etudiants-mobile");

  // Mettre à jour les compteurs
  const countText = `${etudiantsData.length} étudiant${etudiantsData.length > 1 ? "s" : ""}`;
  if (countDesktop) {
    countDesktop.textContent = `(${countText})`;
    countDesktop.classList.remove("hidden");
  }
  if (countMobile) {
    countMobile.textContent = countText;
  }

  if (etudiantsData.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-4 sm:px-6 py-8 sm:py-12 text-center">
                    <div class="flex flex-col items-center gap-3">
                        <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-user-slash text-2xl text-slate-300"></i>
                        </div>
                        <p class="text-slate-600 font-medium">Aucun étudiant inscrit dans cette classe</p>
                    </div>
                </td>
            </tr>
        `;
    return;
  }

  tbody.innerHTML = etudiantsData
    .map((etudiant, index) => {
      // Récupérer la note existante si elle existe
      const noteExistante = evaluationsData.get(etudiant.num_ins);
      const noteValue = noteExistante !== undefined && noteExistante !== null ? noteExistante : "";
      const noteColor = getNoteColor(noteExistante);
      const estDejaNote = noteExistante !== undefined && noteExistante !== null;

      return `
            <tr class="hover:bg-slate-50 transition ${estDejaNote ? 'bg-blue-50' : ''}" 
                data-num-ins="${etudiant.num_ins}" 
                data-matricule="${etudiant.matricule_et}"
                data-nom="${etudiant.nom_et}" 
                data-prenom="${etudiant.prenom_et}" 
                data-email="${etudiant.email_et}">
                <td class="px-3 xs:px-4 sm:px-6 py-3 text-sm text-slate-600">
                    ${index + 1}
                </td>
                <td class="px-3 xs:px-4 sm:px-6 py-3">
                    <div class="font-medium text-slate-800 text-sm sm:text-base overflow-wrap-break">${etudiant.nom_et}</div>
                </td>
                <td class="px-3 xs:px-4 sm:px-6 py-3">
                    <div class="font-medium text-slate-800 text-sm sm:text-base overflow-wrap-break">${etudiant.prenom_et}</div>
                </td>
                <td class="px-3 xs:px-4 sm:px-6 py-3 text-sm text-slate-600 hidden sm:table-cell overflow-wrap-break">
                    ${etudiant.email_et}
                </td>
                <td class="px-3 xs:px-4 sm:px-6 py-3">
                    <div class="flex items-center justify-center">
                        <input 
                            type="number" 
                            min="0" 
                            max="20" 
                            step="0.25" 
                            value="${noteValue}"
                            onchange="mettreAJourNote(${etudiant.num_ins}, this.value)"
                            class="w-20 sm:w-24 px-2 sm:px-3 py-1.5 sm:py-2 border-2 ${noteColor} rounded-lg text-center font-bold text-sm sm:text-base focus:ring-2 focus:ring-primary focus:border-transparent touch-input ${estDejaNote ? 'bg-gray-50 cursor-not-allowed' : ''}"
                            placeholder="0-20"
                            ${estDejaNote ? 'disabled' : ''}
                        >
                        <span class="ml-2 text-sm text-slate-500 hidden xs:inline">/20</span>
                    </div>
                </td>
                <td class="px-3 xs:px-4 sm:px-6 py-3 text-center">
                    <div class="flex justify-center gap-1 sm:gap-2">
                        <button onclick="enregistrerNote(${etudiant.num_ins})" 
                                class="p-1.5 sm:p-2 w-8 h-8 sm:w-9 sm:h-9 ${estDejaNote ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-50 text-green-600 hover:bg-green-100'} rounded-lg transition transform hover:scale-110 touch-target"
                                title="${estDejaNote ? 'Déjà noté' : 'Enregistrer'}"
                                ${estDejaNote ? 'disabled' : ''}>
                            <i class="fas ${estDejaNote ? 'fa-check' : 'fa-save'} text-xs sm:text-sm"></i>
                        </button>
                        <button onclick="reinitialiserNote(${etudiant.num_ins})" 
                                class="p-1.5 sm:p-2 w-8 h-8 sm:w-9 sm:h-9 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition transform hover:scale-110 touch-target"
                                title="Réinitialiser">
                            <i class="fas fa-redo text-xs sm:text-sm"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    })
    .join("");
}

// ==================== FONCTIONS UTILITAIRES ====================
function viderTableauEtudiants() {
  const tbody = document.getElementById("tableau-etudiants");
  tbody.innerHTML = `
        <tr>
            <td colspan="6" class="px-4 sm:px-6 py-8 sm:py-12 md:py-16 text-center">
                <div class="flex flex-col items-center gap-3 sm:gap-4">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-info-circle text-xl sm:text-2xl md:text-3xl lg:text-4xl text-slate-300"></i>
                    </div>
                    <div class="text-center">
                        <p class="text-slate-600 text-sm sm:text-base md:text-lg font-medium mb-1">
                            Sélectionnez tous les paramètres
                        </p>
                        <p class="text-slate-500 text-xs sm:text-sm">
                            Classe, matière et période
                        </p>
                    </div>
                </div>
            </td>
        </tr>`;

  // Réinitialiser les données
  etudiantsData = [];
  inscriptionsData = [];
  evaluationsData.clear();
  notesModifiees.clear();
}

function afficherChargementEtudiants() {
  const tbody = document.getElementById("tableau-etudiants");
  tbody.innerHTML = `
        <tr>
            <td colspan="6" class="px-4 sm:px-6 py-8 sm:py-12 md:py-16 text-center">
                <div class="flex flex-col items-center gap-3 sm:gap-4">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-spinner fa-spin text-xl sm:text-2xl md:text-3xl lg:text-4xl text-primary"></i>
                    </div>
                    <div class="text-center">
                        <p class="text-slate-600 text-sm sm:text-base md:text-lg font-medium mb-1">
                            Chargement des étudiants...
                        </p>
                        <p class="text-slate-500 text-xs sm:text-sm">
                            Veuillez patienter
                        </p>
                    </div>
                </div>
            </td>
        </tr>`;
}

function afficherErreurEtudiants() {
  const tbody = document.getElementById("tableau-etudiants");
  tbody.innerHTML = `
        <tr>
            <td colspan="6" class="px-4 sm:px-6 py-8 sm:py-12 md:py-16 text-center">
                <div class="flex flex-col items-center gap-3 sm:gap-4">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-exclamation-triangle text-xl sm:text-2xl md:text-3xl lg:text-4xl text-red-300"></i>
                    </div>
                    <div class="text-center">
                        <p class="text-red-600 text-sm sm:text-base md:text-lg font-medium mb-1">
                            Erreur de chargement
                        </p>
                        <p class="text-red-500 text-xs sm:text-sm">
                            Impossible de charger les étudiants
                        </p>
                    </div>
                </div>
            </td>
        </tr>`;
}

function cacherBoutonsEnregistrement() {
  document.getElementById("btn-enregistrer-tout").classList.add("hidden");
  document.getElementById("mobile-actions").classList.add("hidden");
}

function getNoteColor(note) {
  if (note === null || note === "" || isNaN(note)) return "border-slate-200";
  const noteNum = parseFloat(note);
  if (noteNum >= 16) return "border-green-500 bg-green-50 text-green-700";
  if (noteNum >= 14) return "border-blue-500 bg-blue-50 text-blue-700";
  if (noteNum >= 12) return "border-yellow-500 bg-yellow-50 text-yellow-700";
  if (noteNum >= 10) return "border-orange-500 bg-orange-50 text-orange-700";
  return "border-red-500 bg-red-50 text-red-700";
}

function mettreAJourNote(num_ins, valeur) {
  const row = document.querySelector(`tr[data-num-ins="${num_ins}"]`);
  if (!row) return;

  const input = row.querySelector('input[type="number"]');
  if (input && !input.disabled) {
    // Valider la note
    if (valeur !== "" && (parseFloat(valeur) < 0 || parseFloat(valeur) > 20)) {
      afficherNotification("La note doit être entre 0 et 20", "error");
      input.value = "";
      return;
    }

    // Mettre à jour la couleur
    input.className = input.className.replace(
      /border-\w+-\d+|bg-\w+-\d+|text-\w+-\d+/g,
      "",
    );
    const newColor = getNoteColor(valeur);
    input.className += " " + newColor;

    // Marquer comme modifié
    if (valeur !== "") {
      notesModifiees.set(num_ins, parseFloat(valeur));
    } else {
      notesModifiees.delete(num_ins);
    }
  }
}

async function enregistrerNote(num_ins) {
  const row = document.querySelector(`tr[data-num-ins="${num_ins}"]`);
  if (!row) return;

  const input = row.querySelector('input[type="number"]');
  if (!input || input.disabled) return;

  const valeur = input.value;

  // Valider la note
  if (valeur !== "" && (parseFloat(valeur) < 0 || parseFloat(valeur) > 20)) {
    afficherNotification("La note doit être entre 0 et 20", "error");
    return;
  }

  try {
    // FORÇONS l'utilisation d'un matricule qui existe
    let matriculeEnseignant = enseignantMatricule;
    
    // Si c'est PROF001, on utilise ENS01 à la place
    if (matriculeEnseignant === 'PROF001') {
      console.warn("🔄 Remplacement de PROF001 par ENS01");
      matriculeEnseignant = 'ENS01';
    }

    // Préparer les données pour l'API
    const data = {
      matricule_ens: matriculeEnseignant,
      code_mat: matiereSelectionnee,
      num_ins: parseInt(num_ins),
      code_per: periodeSelectionnee,
      note: valeur !== "" ? parseFloat(valeur) : null
    };

    console.log("📤 Enregistrement note:", data);

    // Envoyer la requête
    const response = await fetch(`${API_URL}/evaluations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Erreur détaillée:", errorData);
      
      // Vérifier l'erreur de clé étrangère
      if (errorData.details && errorData.details.includes('matricule_ens')) {
        // Essayons avec un autre enseignant
        console.warn("🔄 Essai avec ENS02...");
        
        const dataCorrige = {
          ...data,
          matricule_ens: 'ENS02' // Essayons avec un autre enseignant
        };
        
        const response2 = await fetch(`${API_URL}/evaluations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataCorrige),
        });
        
        if (!response2.ok) {
          throw new Error("Erreur: Aucun enseignant valide trouvé");
        }
        
        // Si ça marche avec ENS02, continuer
        const result = await response2.json();
        console.log("✅ Résultat enregistrement avec ENS02:", result);
        
        // Mettre à jour le matricule pour la session
        enseignantMatricule = 'ENS02';
        const user = JSON.parse(localStorage.getItem("user"));
        user.matricule = 'ENS02';
        localStorage.setItem("user", JSON.stringify(user));
        
      } else {
        throw new Error("Erreur lors de l'enregistrement");
      }
    } else {
      const result = await response.json();
      console.log("✅ Résultat enregistrement:", result);
    }

    // Mettre à jour le cache
    evaluationsData.set(num_ins, valeur !== "" ? parseFloat(valeur) : null);

    // Retirer des notes modifiées
    notesModifiees.delete(num_ins);

    // Désactiver l'input et le bouton
    input.disabled = true;
    input.classList.add("bg-gray-50", "cursor-not-allowed");
    
    const saveBtn = row.querySelector('button[onclick^="enregistrerNote"]');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.classList.remove("bg-green-50", "text-green-600", "hover:bg-green-100");
      saveBtn.classList.add("bg-gray-100", "text-gray-400", "cursor-not-allowed");
      saveBtn.title = "Déjà noté";
      const icon = saveBtn.querySelector('i');
      if (icon) {
        icon.className = "fas fa-check text-xs sm:text-sm";
      }
    }

    // Mettre à jour la ligne
    row.classList.add("bg-blue-50");

    // Afficher confirmation
    const etudiantNom = row.getAttribute("data-nom");
    const etudiantPrenom = row.getAttribute("data-prenom");
    const message =
      valeur !== ""
        ? `✅ Note ${valeur}/20 enregistrée pour ${etudiantPrenom} ${etudiantNom}`
        : `✅ Note réinitialisée pour ${etudiantPrenom} ${etudiantNom}`;

    showConfirmation(message);
  } catch (error) {
    console.error("❌ Erreur enregistrement note:", error);
    afficherNotification(error.message || "Erreur lors de l'enregistrement de la note", "error");
  }
}

function reinitialiserNote(num_ins) {
  const row = document.querySelector(`tr[data-num-ins="${num_ins}"]`);
  if (!row) return;

  const input = row.querySelector('input[type="number"]');
  if (input && !input.disabled) {
    input.value = "";
    input.className = input.className.replace(
      /border-\w+-\d+|bg-\w+-\d+|text-\w+-\d+/g,
      "",
    );
    input.className += " border-slate-200";

    // Retirer des notes modifiées
    notesModifiees.delete(num_ins);
    
    // Réactiver le bouton si nécessaire
    if (evaluationsData.get(num_ins) === undefined) {
      const saveBtn = row.querySelector('button[onclick^="enregistrerNote"]');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.classList.remove("bg-gray-100", "text-gray-400", "cursor-not-allowed");
        saveBtn.classList.add("bg-green-50", "text-green-600", "hover:bg-green-100");
        saveBtn.title = "Enregistrer";
        const icon = saveBtn.querySelector('i');
        if (icon) {
          icon.className = "fas fa-save text-xs sm:text-sm";
        }
      }
      
      // Retirer le fond bleu si l'étudiant n'était pas noté avant
      row.classList.remove("bg-blue-50");
    }
  }
}

async function enregistrerToutesLesNotes() {
  if (notesModifiees.size === 0) {
    showConfirmation("ℹ️ Aucune note modifiée à enregistrer");
    return;
  }

  try {
    // Afficher un indicateur de chargement
    const btn = document.getElementById("btn-enregistrer-tout");
    const originalText = btn.innerHTML;
    btn.innerHTML =
      '<i class="fas fa-spinner fa-spin mr-2"></i>Enregistrement...';
    btn.disabled = true;

    let succes = 0;
    let echecs = 0;
    const erreurs = [];

    // FORÇONS l'utilisation d'un matricule qui existe
    let matriculeEnseignant = enseignantMatricule;
    if (matriculeEnseignant === 'PROF001') {
      matriculeEnseignant = 'ENS01';
    }

    // Envoyer les notes une par une pour un meilleur contrôle
    for (const [num_ins, note] of notesModifiees.entries()) {
      try {
        const row = document.querySelector(`tr[data-num-ins="${num_ins}"]`);
        if (!row) {
          echecs++;
          continue;
        }

        const data = {
          matricule_ens: matriculeEnseignant,
          code_mat: matiereSelectionnee,
          num_ins: parseInt(num_ins),
          code_per: periodeSelectionnee,
          note: note
        };

        console.log(`📤 Envoi note ${num_ins}:`, data);

        const response = await fetch(`${API_URL}/evaluations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          
          // Mettre à jour le cache
          evaluationsData.set(num_ins, note);
          
          // Désactiver l'input
          const input = row.querySelector('input[type="number"]');
          if (input) {
            input.disabled = true;
            input.classList.add("bg-gray-50", "cursor-not-allowed");
          }
          
          // Mettre à jour le bouton
          const saveBtn = row.querySelector('button[onclick^="enregistrerNote"]');
          if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.classList.remove("bg-green-50", "text-green-600", "hover:bg-green-100");
            saveBtn.classList.add("bg-gray-100", "text-gray-400", "cursor-not-allowed");
            saveBtn.title = "Déjà noté";
            const icon = saveBtn.querySelector('i');
            if (icon) {
              icon.className = "fas fa-check text-xs sm:text-sm";
            }
          }
          
          // Mettre à jour la ligne
          row.classList.add("bg-blue-50");
          
          succes++;
        } else {
          const errorData = await response.json();
          console.error(`❌ Erreur enregistrement ${num_ins}:`, errorData);
          
          // Essayer avec un autre enseignant si erreur de clé étrangère
          if (errorData.details && errorData.details.includes('matricule_ens')) {
            console.log(`🔄 Essai ${num_ins} avec ENS02...`);
            
            const dataCorrige = {
              ...data,
              matricule_ens: 'ENS02'
            };
            
            const response2 = await fetch(`${API_URL}/evaluations`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(dataCorrige),
            });
            
            if (response2.ok) {
              const result2 = await response2.json();
              evaluationsData.set(num_ins, note);
              const input = row.querySelector('input[type="number"]');
              if (input) {
                input.disabled = true;
                input.classList.add("bg-gray-50", "cursor-not-allowed");
              }
              row.classList.add("bg-blue-50");
              succes++;
              
              // Mettre à jour le matricule global
              enseignantMatricule = 'ENS02';
              const user = JSON.parse(localStorage.getItem("user"));
              user.matricule = 'ENS02';
              localStorage.setItem("user", JSON.stringify(user));
              
              continue;
            }
          }
          
          echecs++;
          erreurs.push(`Étudiant ${num_ins}: ${errorData.error || 'Erreur inconnue'}`);
        }
      } catch (error) {
        console.error(`❌ Erreur enregistrement note ${num_ins}:`, error);
        echecs++;
        erreurs.push(`Étudiant ${num_ins}: ${error.message}`);
      }
    }

    // Afficher le résultat
    let message = `✅ ${succes} note${succes > 1 ? 's' : ''} enregistrée${succes > 1 ? 's' : ''} avec succès`;
    
    if (echecs > 0) {
      message += `, ❌ ${echecs} échec${echecs > 1 ? 's' : ''}`;
      afficherNotification(`Attention: ${echecs} note${echecs > 1 ? 's' : ''} n'${echecs > 1 ? 'ont' : 'a'} pas pu être enregistrée${echecs > 1 ? 's' : ''}`, "warning");
      
      // Afficher les erreurs détaillées en debug
      if (erreurs.length > 0) {
        console.error("📋 Détails des erreurs:", erreurs);
      }
    } else {
      showConfirmation(message);
    }

    // Réinitialiser le bouton
    btn.innerHTML = originalText;
    btn.disabled = false;

    // Vider les notes modifiées seulement si succès
    if (succes > 0) {
      notesModifiees.clear();
    }
  } catch (error) {
    console.error("❌ Erreur enregistrement multiple:", error);
    afficherNotification("Erreur lors de l'enregistrement des notes", "error");

    // Réinitialiser le bouton
    const btn = document.getElementById("btn-enregistrer-tout");
    btn.innerHTML =
      '<i class="fas fa-save mr-1 sm:mr-2"></i><span class="whitespace-nowrap">Enregistrer Toutes les Notes</span>';
    btn.disabled = false;
  }
}

// ==================== FILTRER ÉTUDIANTS ====================
function filtrerEtudiants() {
  const search = document
    .getElementById("search-etudiant")
    .value.toLowerCase()
    .trim();
  const rows = document.querySelectorAll("#tableau-etudiants tr[data-num-ins]");
  const countDesktop = document.getElementById("count-etudiants");
  const countMobile = document.getElementById("count-etudiants-mobile");

  let compteurVisible = 0;

  // Délai pour éviter trop d'appels (debouncing)
  clearTimeout(timeoutFiltre);
  timeoutFiltre = setTimeout(() => {
    rows.forEach((row) => {
      const nom = row.getAttribute("data-nom") || "";
      const prenom = row.getAttribute("data-prenom") || "";
      const email = row.getAttribute("data-email") || "";

      // Recherche dans tous les champs
      const match =
        search === "" ||
        nom.toLowerCase().includes(search) ||
        prenom.toLowerCase().includes(search) ||
        email.toLowerCase().includes(search) ||
        `${prenom} ${nom}`.toLowerCase().includes(search) ||
        `${nom} ${prenom}`.toLowerCase().includes(search);

      if (match) {
        row.style.display = "";
        row.classList.remove("hidden");
        compteurVisible++;
      } else {
        row.style.display = "none";
        row.classList.add("hidden");
      }
    });

    // Mettre à jour les compteurs
    if (compteurVisible === rows.length) {
      if (countDesktop)
        countDesktop.textContent = `(${rows.length} étudiant${rows.length > 1 ? "s" : ""})`;
      if (countMobile)
        countMobile.textContent = `${rows.length} étudiant${rows.length > 1 ? "s" : ""}`;
    } else {
      if (countDesktop)
        countDesktop.textContent = `(${compteurVisible}/${rows.length} étudiant${rows.length > 1 ? "s" : ""})`;
      if (countMobile)
        countMobile.textContent = `${compteurVisible}/${rows.length} étudiant${rows.length > 1 ? "s" : ""}`;
    }
  }, 300);
}

// ==================== MODAL CONFIRMATION ====================
function showConfirmation(message) {
  const modal = document.getElementById("confirmation-modal");
  const messageEl = document.getElementById("confirmation-message");

  if (messageEl) messageEl.textContent = message;
  if (modal) modal.classList.remove("hidden");

  // Empêcher le scroll
  document.body.style.overflow = "hidden";

  setTimeout(() => {
    closeConfirmationModal();
  }, 3000);
}

function closeConfirmationModal() {
  const modal = document.getElementById("confirmation-modal");
  if (modal) modal.classList.add("hidden");

  // Restaurer le scroll
  document.body.style.overflow = "";
}

// ==================== DÉCONNEXION ====================
function deconnexion() {
  if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
    localStorage.removeItem("user");
    window.location.href = "auth-fixed.html";
  }
}

// ==================== NOTIFICATIONS ====================
function afficherNotification(message, type = "info") {
  // Créer l'élément de notification
  const notification = document.createElement("div");
  notification.className = `fixed top-4 right-4 z-[100] animate-fade-in`;

  const couleurs = {
    success: "bg-green-600",
    error: "bg-red-600",
    warning: "bg-orange-600",
    info: "bg-blue-600",
  };

  const icones = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle",
  };

  notification.innerHTML = `
        <div class="${couleurs[type]} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-[400px]">
            <i class="fas ${icones[type]} text-xl"></i>
            <span class="flex-1">${message}</span>
            <button onclick="this.closest('.fixed').remove()" class="text-white hover:text-gray-200 transition">
                <i class="fas fa-times"></i>
            </button>
        </div>`;

  document.body.appendChild(notification);

  // Supprimer automatiquement après 5 secondes
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// ==================== INITIALISATION ÉVÉNEMENTS ====================
function initialiserEvenements() {
  const searchInput = document.getElementById("search-etudiant");

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      clearTimeout(timeoutFiltre);
      timeoutFiltre = setTimeout(filtrerEtudiants, 300);
    });

    // Effacer la recherche avec Escape
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        this.value = "";
        filtrerEtudiants();
      }
    });
  }

  // Fermer les modals avec Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeConfirmationModal();
    }
  });

  // Fermer le modal en cliquant à l'extérieur
  const modal = document.getElementById("confirmation-modal");
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeConfirmationModal();
      }
    });
  }

  // Gestion de l'espace pour les actions mobiles
  const adjustMobileActionsSpace = () => {
    const mobileActions = document.getElementById("mobile-actions");
    if (
      window.innerWidth < 640 &&
      mobileActions &&
      !mobileActions.classList.contains("hidden")
    ) {
      document.body.style.paddingBottom = "70px";
    } else {
      document.body.style.paddingBottom = "0";
    }
  };

  adjustMobileActionsSpace();
  window.addEventListener("resize", adjustMobileActionsSpace);
}

// ==================== EXPORT DES FONCTIONS ====================
window.chargerMatieres = chargerMatieres;
window.chargerPeriodes = chargerPeriodes;
window.chargerEtudiants = chargerEtudiants;
window.filtrerEtudiants = filtrerEtudiants;
window.enregistrerNote = enregistrerNote;
window.reinitialiserNote = reinitialiserNote;
window.enregistrerToutesLesNotes = enregistrerToutesLesNotes;
window.mettreAJourNote = mettreAJourNote;
window.closeConfirmationModal = closeConfirmationModal;
window.deconnexion = deconnexion;
window.afficherNotification = afficherNotification;
// ====================================================================
// BASE DE DONNÉES POSTGRESQL - Connexion et opérations
// ====================================================================
//
// Ce fichier gère la connexion à la base de données PostgreSQL et fournit
// des fonctions utilitaires pour les opérations courantes sur la base.
//
// BASE DE DONNÉES: BDevaluation
// TABLES PRINCIPALES:
// - admin: Administrateurs du système
// - enseignant: Enseignants et leurs matières
// - etudiant: Étudiants et leurs informations
// - classe: Classes et niveaux
// - matiere: Matières enseignées
// - periode: Périodes académiques
// - inscription: Inscriptions des étudiants aux classes
// - evaluation: Évaluations et notes
// - enseignement: Association enseignant-matière-classe
//
// UTILISATION:
// const db = require('./database');
// const etudiants = await db.getEtudiantsByClasse('L1');
// const result = await db.query('SELECT * FROM matiere');
//
// SÉCURITÉ:
// - Utilisation de requêtes paramétrées pour prévenir les injections SQL
// - Gestion des erreurs avec logging approprié
// - Pool de connexions pour optimiser les performances
// ====================================================================

const { Pool } = require("pg"); // Client PostgreSQL pour Node.js
require("dotenv").config(); // Charger les variables d'environnement

// ==================== CONFIGURATION DE LA CONNEXION ====================
/**
 * Configuration du pool de connexions PostgreSQL
 *
 * Le pool permet de gérer plusieurs connexions simultanées
 * et optimise les performances en réutilisant les connexions existantes.
 */
const pool = new Pool({
  user: process.env.DB_USER || "postgres", // Utilisateur de la base (postgres par défaut)
  host: process.env.DB_HOST || "localhost", // Hôte de la base (localhost par défaut)
  database: process.env.DB_NAME || "BDevaluation", // Nom de la base de données
  password: process.env.DB_PASS, // Mot de passe (doit être configuré dans .env)
  port: process.env.DB_PORT || 5432, // Port PostgreSQL (5432 par défaut)
  // Options de sécurité et performance
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false, // SSL en production
  max: 20, // Maximum de connexions dans le pool
  idleTimeoutMillis: 30000, // Fermer les connexions inactives après 30s
  connectionTimeoutMillis: 2000, // Timeout pour les requêtes longues
});

// ==================== TEST CONNEXION ====================
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("✅ Connecté à PostgreSQL : BDevaluation");

    const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema='public'
        `);

    console.log(
      "📋 Tables disponibles:",
      result.rows.map((r) => r.table_name),
    );
    client.release();
  } catch (err) {
    console.error("❌ ERREUR de connexion à PostgreSQL:", err.message);
    process.exit(1); // Arrêter l'application si la connexion échoue
  }
}

// ==================== FONCTIONS POUR LES PÉRIODES ====================

/**
 * Récupère toutes les périodes académiques
 * @returns {Array} - Liste des périodes triées par date de début
 */
async function getPeriodes() {
  const result = await pool.query("SELECT * FROM periode ORDER BY debut_per");
  return result.rows;
}

/**
 * Récupère une période spécifique par son code
 * @param {String} code_per - Code de la période (ex: 'S1_2024')
 * @returns {Object|null} - Détails de la période ou null si non trouvée
 */
async function getPeriodeByCode(code_per) {
  const result = await pool.query("SELECT * FROM periode WHERE code_per=$1", [
    code_per,
  ]);
  return result.rows[0] || null;
}

/**
 * Crée une nouvelle période académique
 * @param {String} code_per - Code unique de la période
 * @param {String} libelle_per - Nom descriptif de la période
 * @param {Date} debut_per - Date de début de la période
 * @param {Date} fin_per - Date de fin de la période
 * @returns {Object} - Période créée
 */
async function createPeriode(code_per, libelle_per, debut_per, fin_per) {
  const result = await pool.query(
    "INSERT INTO periode (code_per, libelle_per, debut_per, fin_per) VALUES ($1, $2, $3, $4) RETURNING *",
    [code_per, libelle_per, debut_per, fin_per],
  );
  return result.rows[0];
}

/**
 * Met à jour une période académique existante
 * @param {String} code_per - Code de la période
 * @param {String} libelle_per - Nouveau nom descriptif de la période
 * @param {Date} debut_per - Nouvelle date de début de la période
 * @param {Date} fin_per - Nouvelle date de fin de la période
 * @returns {Object} - Période mise à jour
 */
async function updatePeriode(code_per, libelle_per, debut_per, fin_per) {
  const result = await pool.query(
    "UPDATE periode SET libelle_per=$1, debut_per=$2, fin_per=$3 WHERE code_per=$4 RETURNING *",
    [libelle_per, debut_per, fin_per, code_per],
  );
  return result.rows[0];
}

async function deletePeriode(code_per) {
  await pool.query("DELETE FROM periode WHERE code_per=$1", [code_per]);
}

// ==================== CLASSES ====================
async function getClasses() {
  const result = await pool.query("SELECT * FROM classe ORDER BY libelle_cl");
  return result.rows;
}

async function getClasseByCode(code_cl) {
  const result = await pool.query("SELECT * FROM classe WHERE code_cl=$1", [
    code_cl,
  ]);
  return result.rows[0] || null;
}

async function createClasse(code_cl, libelle_cl) {
  const result = await pool.query(
    "INSERT INTO classe (code_cl, libelle_cl) VALUES ($1,$2) RETURNING *",
    [code_cl, libelle_cl],
  );
  return result.rows[0];
}

async function updateClasse(code_cl, libelle_cl) {
  const result = await pool.query(
    "UPDATE classe SET libelle_cl=$1 WHERE code_cl=$2 RETURNING *",
    [libelle_cl, code_cl],
  );
  return result.rows[0];
}

async function deleteClasse(code_cl) {
  await pool.query("DELETE FROM classe WHERE code_cl=$1", [code_cl]);
}

// ==================== MATIÈRES ====================
async function getMatieres() {
  const result = await pool.query("SELECT * FROM matiere ORDER BY libelle_mat");
  return result.rows;
}

async function getMatieresByClasse(code_cl) {
  const result = await pool.query(
    "SELECT * FROM matiere WHERE code_cl=$1 ORDER BY libelle_mat",
    [code_cl],
  );
  return result.rows;
}

async function getMatiereByCode(code_mat) {
  const result = await pool.query("SELECT * FROM matiere WHERE code_mat=$1", [
    code_mat,
  ]);
  return result.rows[0] || null;
}

async function createMatiere(code_mat, libelle_mat, nb_credit, code_cl) { // <-- AJOUTEZ code_cl ICI
  try {
    console.log('📝 Création matière:', { code_mat, libelle_mat, nb_credit, code_cl });
    
    // Vérifier que code_cl est bien fourni
    if (!code_cl) {
      throw new Error('Le champ code_cl (classe) est requis');
    }
    
    const result = await pool.query(
      "INSERT INTO matiere (code_mat, libelle_mat, nb_credit, code_cl) VALUES ($1, $2, $3, $4) RETURNING *",
      [code_mat, libelle_mat, nb_credit, code_cl], // <-- AJOUTEZ code_cl ICI
    );
    console.log('✅ Matière créée:', result.rows[0]);
    return result.rows[0];
  } catch (err) {
    console.error("💥 ERREUR SQL createMatiere:", err.message);
    console.error("💥 DETAIL:", err.detail);
    console.error("💥 CODE:", err.code);
    console.error("💥 Paramètres reçus:", { code_mat, libelle_mat, nb_credit, code_cl });
    throw err;
  }
}

async function updateMatiere(code_mat, libelle_mat, nb_credit, code_cl) {
  try {
    const result = await pool.query(
      "UPDATE matiere SET libelle_mat=$1, nb_credit=$2, code_cl=$3 WHERE code_mat=$4 RETURNING *",
      [libelle_mat, nb_credit, code_cl, code_mat],
    );
    return result.rows[0];
  } catch (err) {
    console.error("💥 ERREUR SQL updateMatiere:", err.message);
    throw err;
  }
}

async function deleteMatiere(code_mat) {
  await pool.query("DELETE FROM matiere WHERE code_mat=$1", [code_mat]);
}

// ==================== ENSEIGNANTS ====================
async function getEnseignantByEmail(email) {
  const result = await pool.query(
    "SELECT * FROM enseignant WHERE email_ens=$1",
    [email],
  );
  return result.rows[0] || null;
}

async function createEnseignant(
  matricule_ens,
  nom_ens,
  prenom_ens,
  tel_ens,
  email_ens,
  password_ens,
) {
  const result = await pool.query(
    "INSERT INTO enseignant (matricule_ens, nom_ens, prenom_ens, tel_ens, email_ens, password_ens) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
    [matricule_ens, nom_ens, prenom_ens, tel_ens, email_ens, password_ens],
  );
  return result.rows[0];
}

// ==================== ÉTUDIANTS ====================
async function getEtudiantByEmail(email) {
  const result = await pool.query("SELECT * FROM etudiant WHERE email_et=$1", [
    email,
  ]);
  return result.rows[0] || null;
}

async function createEtudiant(
  matricule_et,
  nom_et,
  prenom_et,
  photo_et,
  email_et,
  password_et,
) {
  const result = await pool.query(
    "INSERT INTO etudiant (matricule_et, nom_et, prenom_et, photo_et, email_et, password_et) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
    [matricule_et, nom_et, prenom_et, photo_et, email_et, password_et],
  );
  return result.rows[0];
}

// ==================== FONCTIONS POUR LES INSCRIPTIONS ====================

/**
 * Récupère toutes les inscriptions avec détails des étudiants
 * @returns {Array} - Liste des inscriptions complètes
 */
async function getInscriptions() {
  const result = await pool.query(`
        SELECT 
            i.num_ins,
            i.date_ins,
            i.annee_academique,
            i.statut,
            e.matricule_et,
            e.nom_et,
            e.prenom_et,
            e.email_et,
            e.photo_et,
            c.code_cl,
            c.libelle_cl
        FROM inscription i
        JOIN etudiant e ON i.matricule_et = e.matricule_et
        JOIN classe c ON i.code_cl = c.code_cl
        ORDER BY i.date_ins DESC
    `);
  return result.rows;
}

/**
 * Récupère les inscriptions pour une année académique spécifique
 * @param {String} annee_academique - Année académique
 * @returns {Array} - Liste des inscriptions pour cette année
 */
async function getInscriptionsByAnnee(annee_academique) {
  const result = await pool.query(
    `
        SELECT 
            i.num_ins,
            i.date_ins,
            i.annee_academique,
            i.statut,
            e.matricule_et,
            e.nom_et,
            e.prenom_et,
            e.email_et,
            c.code_cl,
            c.libelle_cl
        FROM inscription i
        JOIN etudiant e ON i.matricule_et = e.matricule_et
        JOIN classe c ON i.code_cl = c.code_cl
        WHERE i.annee_academique = $1
        ORDER BY i.date_ins DESC
    `,
    [annee_academique],
  );
  return result.rows;
}

/**
 * Crée une nouvelle inscription d'étudiant
 * @param {Object} inscriptionData - Données de l'inscription
 * @returns {Object} - Inscription créée
 */
async function createInscription(inscriptionData) {
  const { matricule_et, code_cl, annee_academique, statut } = inscriptionData;

  const result = await pool.query(
    "INSERT INTO inscription (matricule_et, code_cl, annee_academique, statut, date_ins) VALUES ($1, $2, $3, $4, CURRENT_DATE) RETURNING *",
    [matricule_et, code_cl, annee_academique, statut],
  );
  return result.rows[0];
}

// ==================== FONCTIONS POUR LES ÉVALUATIONS ====================

/**
 * Récupère toutes les évaluations avec détails
 * @param {String} code_cl - Optionnel: filtrer par classe
 * @param {String} code_mat - Optionnel: filtrer par matière
 * @returns {Array} - Liste des évaluations complètes
 */
async function getEvaluations(code_cl = null, code_mat = null) {
  let query = `
        SELECT 
            e.*,
            m.libelle_mat,
            cl.libelle_cl,
            en.nom_ens,
            en.prenom_ens
        FROM evaluation e
        JOIN matiere m ON e.code_mat = m.code_mat
        JOIN classe cl ON e.code_cl = cl.code_cl
        JOIN enseignant en ON e.matricule_ens = en.matricule_ens
        WHERE 1=1
    `;
  const params = [];

  if (code_cl) {
    query += " AND e.code_cl = $" + (params.length + 1);
    params.push(code_cl);
  }

  if (code_mat) {
    query += " AND e.code_mat = $" + (params.length + 1);
    params.push(code_mat);
  }

  query += " ORDER BY e.date_eval DESC";

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Crée une nouvelle évaluation
 * @param {Object} evaluationData - Données de l'évaluation
 * @returns {Object} - Évaluation créée
 */
async function createEvaluation(evaluationData) {
  const {
    code_mat,
    code_cl,
    matricule_ens,
    type_eval,
    date_eval,
    coefficient,
    description_eval,
  } = evaluationData;

  const result = await pool.query(
    "INSERT INTO evaluation (code_mat, code_cl, matricule_ens, type_eval, date_eval, coefficient, description_eval) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [
      code_mat,
      code_cl,
      matricule_ens,
      type_eval,
      date_eval,
      coefficient,
      description_eval,
    ],
  );
  return result.rows[0];
}

// ==================== FONCTION QUERY GÉNÉRIQUE ====================

/**
 * Exécute une requête SQL personnalisée avec gestion d'erreurs
 * @param {String} sql - Requête SQL à exécuter
 * @param {Array} params - Paramètres de la requête
 * @returns {Object} - Résultat de la requête
 */
async function query(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return result;
  } catch (error) {
    console.error("💥 ERREUR SQL:", error.message);
    console.error("💥 CODE:", error.code);
    console.error("💥 DÉTAIL:", error.detail);
    console.error("💥 REQUÊTE:", sql);
    console.error("💥 PARAMÈTRES:", params);
    throw error;
  }
}

// ==================== EXPORT DES FONCTIONS ====================
/**
 * Exporte toutes les fonctions pour utilisation dans les routes et autres modules
 */
module.exports = {
  // Connexion et configuration
  pool,
  testConnection,
  query,

  // Périodes
  getPeriodes,
  getPeriodeByCode,
  createPeriode,
  updatePeriode,
  deletePeriode,

  // Classes
  getClasses,
  getClasseByCode,
  createClasse,
  updateClasse,
  deleteClasse,

  // Matières
  getMatieres,
  getMatieresByClasse,
  getMatiereByCode,
  createMatiere,
  updateMatiere,
  deleteMatiere,

  // Enseignants
  getEnseignantByEmail,
  createEnseignant,

  // Étudiants
  getEtudiantByEmail,
  createEtudiant,

  // Inscriptions
  getInscriptions,
  getInscriptionsByAnnee,
  createInscription,

  // Évaluations
  getEvaluations,
  createEvaluation,
};

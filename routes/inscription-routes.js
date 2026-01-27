const express = require("express");
const router = express.Router();
const db = require("../database");

// ==================== ROUTES INSCRIPTIONS ====================

// GET - Récupérer toutes les inscriptions (route de base)
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
            SELECT 
                i.num_ins,
                i.matricule_et,
                i.code_cl,
                i.annee_academique,
                c.libelle_cl
            FROM inscription i
            JOIN classe c ON i.code_cl = c.code_cl
            ORDER BY i.num_ins DESC
        `);

    res.json(result.rows);
  } catch (error) {
    console.error("Erreur récupération inscriptions:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET - Récupérer toutes les inscriptions avec détails
router.get("/details", async (req, res) => {
  try {
    const result = await db.query(`
            SELECT 
                i.num_ins,
                i.annee_academique,
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
            ORDER BY i.num_ins DESC
        `);

    res.json(result.rows);
  } catch (error) {
    console.error("Erreur récupération inscriptions:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET - Récupérer les inscriptions d'un étudiant
router.get("/etudiant/:matricule", async (req, res) => {
  try {
    const { matricule } = req.params;
    const result = await db.query(
      `
            SELECT 
                i.*,
                c.libelle_cl
            FROM inscription i
            JOIN classe c ON i.code_cl = c.code_cl
            WHERE i.matricule_et = $1
            ORDER BY i.num_ins DESC
        `,
      [matricule]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Erreur récupération inscriptions étudiant:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET - Inscriptions actives seulement
router.get("/actives", async (req, res) => {
  try {
    const result = await db.query(`
            SELECT 
                i.num_ins,
                i.annee_academique,
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
            ORDER BY i.num_ins DESC
        `);

    res.json(result.rows);
  } catch (error) {
    console.error("Erreur récupération inscriptions actives:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET - Récupérer toutes les inscriptions par année académique
router.get("/annee/:annee", async (req, res) => {
  try {
    const { annee } = req.params;
    const result = await db.query(
      `
            SELECT 
                i.num_ins,
                i.annee_academique,
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
            ORDER BY i.num_ins DESC
        `,
      [annee]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Erreur récupération inscriptions par année:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET - Récupérer les inscriptions d'une classe spécifique
router.get("/classe/:code_cl", async (req, res) => {
  try {
    const { code_cl } = req.params;
    const result = await db.query(
      `
            SELECT 
                i.num_ins,
                i.matricule_et,
                e.nom_et,
                e.prenom_et,
                e.email_et,
                e.photo_et,
                c.code_cl,
                c.libelle_cl
            FROM inscription i
            JOIN etudiant e ON i.matricule_et = e.matricule_et
            JOIN classe c ON i.code_cl = c.code_cl
            WHERE i.code_cl = $1
            ORDER BY e.nom_et, e.prenom_et
        `,
      [code_cl]
    );

    console.log('✅ Inscriptions trouvées pour la classe', code_cl, ':', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Erreur récupération inscriptions classe:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// GET - Récupérer une inscription par ID
router.get("/:num_ins", async (req, res) => {
  try {
    const { num_ins } = req.params;
    const result = await db.query(
      `
            SELECT 
                i.*,
                e.nom_et,
                e.prenom_et,
                e.email_et,
                e.photo_et,
                c.libelle_cl
            FROM inscription i
            JOIN etudiant e ON i.matricule_et = e.matricule_et
            JOIN classe c ON i.code_cl = c.code_cl
            WHERE i.num_ins = $1
        `,
      [num_ins]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Inscription non trouvée" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erreur recherche inscription:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST - Créer une inscription
router.post("/", async (req, res) => {
  try {
    const { matricule_et, code_cl, annee_academique } = req.body;

    // Validation
    if (!matricule_et || !code_cl) {
      return res.status(400).json({ error: "Matricule et classe requis" });
    }

    // Vérifier si l'étudiant existe
    const etudiantCheck = await db.query(
      "SELECT * FROM etudiant WHERE matricule_et = $1",
      [matricule_et]
    );

    if (etudiantCheck.rows.length === 0) {
      return res.status(404).json({ error: "Étudiant non trouvé" });
    }

    // Vérifier si la classe existe
    const classeCheck = await db.query(
      "SELECT * FROM classe WHERE code_cl = $1",
      [code_cl]
    );

    if (classeCheck.rows.length === 0) {
      return res.status(404).json({ error: "Classe non trouvée" });
    }

    // Vérifier si l'inscription existe déjà pour cette année
    const inscriptionCheck = await db.query(
      "SELECT * FROM inscription WHERE matricule_et = $1 AND code_cl = $2 AND annee_academique = $3",
      [matricule_et, code_cl, annee_academique || "2025-2026"]
    );

    if (inscriptionCheck.rows.length > 0) {
      return res.status(409).json({ 
        error: "Inscription déjà existante",
        type: "existant",
        inscription: inscriptionCheck.rows[0]
      });
    }

    // Créer nouvelle inscription
    const result = await db.query(
      `INSERT INTO inscription (matricule_et, code_cl, annee_academique)
             VALUES ($1, $2, $3)
             RETURNING *`,
      [
        matricule_et,
        code_cl,
        annee_academique || "2025-2026"
      ]
    );

    res.status(201).json({
      message: "Inscription créée",
      inscription: result.rows[0],
      type: "nouvelle",
    });
  } catch (error) {
    console.error("Erreur création inscription:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// PUT - Mettre à jour une inscription
router.put("/:num_ins", async (req, res) => {
  try {
    const { num_ins } = req.params;
    const { code_cl, annee_academique } = req.body;

    // Vérifier si l'inscription existe
    const check = await db.query(
      "SELECT * FROM inscription WHERE num_ins = $1",
      [num_ins]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Inscription non trouvée" });
    }

    const result = await db.query(
      `UPDATE inscription 
             SET code_cl = $1, annee_academique = $2
             WHERE num_ins = $3
             RETURNING *`,
      [
        code_cl || check.rows[0].code_cl,
        annee_academique || check.rows[0].annee_academique,
        num_ins
      ]
    );

    res.json({
      message: "Inscription mise à jour",
      inscription: result.rows[0]
    });
  } catch (error) {
    console.error("Erreur mise à jour inscription:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE - Supprimer une inscription
router.delete("/:num_ins", async (req, res) => {
  try {
    const { num_ins } = req.params;

    const result = await db.query(
      "DELETE FROM inscription WHERE num_ins = $1 RETURNING *",
      [num_ins]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Inscription non trouvée" });
    }

    res.json({ 
      message: "Inscription supprimée avec succès",
      inscription: result.rows[0]
    });
  } catch (error) {
    console.error("Erreur suppression inscription:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ==================== ROUTES STATISTIQUES ====================

// GET - Statistiques globales des inscriptions
router.get("/stats/global", async (req, res) => {
  try {
    const stats = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM inscription) as total_inscriptions,
                (SELECT COUNT(DISTINCT matricule_et) FROM inscription) as etudiants_inscrits,
                (SELECT COUNT(DISTINCT code_cl) FROM inscription) as classes_avec_inscriptions,
                (SELECT COUNT(*) FROM etudiant) as total_etudiants
        `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error("Erreur statistiques:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET - Statistiques par classe
router.get("/stats/classes", async (req, res) => {
  try {
    const stats = await db.query(`
            SELECT 
                c.code_cl,
                c.libelle_cl,
                COUNT(DISTINCT i.matricule_et) as nb_etudiants,
                ROUND(COUNT(DISTINCT i.matricule_et) * 100.0 / NULLIF((SELECT COUNT(DISTINCT matricule_et) FROM inscription), 0), 2) as pourcentage
            FROM classe c
            LEFT JOIN inscription i ON c.code_cl = i.code_cl
            GROUP BY c.code_cl, c.libelle_cl
            ORDER BY nb_etudiants DESC
        `);

    res.json(stats.rows);
  } catch (error) {
    console.error("Erreur statistiques classes:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET - Statistiques par année académique
router.get("/stats/annees", async (req, res) => {
  try {
    const stats = await db.query(`
            SELECT 
                annee_academique,
                COUNT(*) as nb_inscriptions,
                ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM inscription), 0), 2) as pourcentage
            FROM inscription
            GROUP BY annee_academique
            ORDER BY annee_academique DESC
        `);

    res.json(stats.rows);
  } catch (error) {
    console.error("Erreur statistiques années:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET - Dernières inscriptions (pour dashboard)
router.get("/stats/dernieres", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await db.query(`
            SELECT 
                i.num_ins,
                i.annee_academique,
                e.matricule_et,
                e.nom_et,
                e.prenom_et,
                e.email_et,
                c.code_cl,
                c.libelle_cl
            FROM inscription i
            JOIN etudiant e ON i.matricule_et = e.matricule_et
            JOIN classe c ON i.code_cl = c.code_cl
            ORDER BY i.num_ins DESC
            LIMIT $1
        `, [limit]);

    res.json(result.rows);
  } catch (error) {
    console.error("Erreur dernières inscriptions:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET - Vérifier si un étudiant est déjà inscrit dans une classe
router.get("/verifier/:matricule/:code_cl", async (req, res) => {
  try {
    const { matricule, code_cl } = req.params;
    
    const result = await db.query(
      `SELECT * FROM inscription 
       WHERE matricule_et = $1 AND code_cl = $2
       AND annee_academique = '2025-2026'`,
      [matricule, code_cl]
    );

    res.json({
      est_inscrit: result.rows.length > 0,
      inscription: result.rows[0] || null
    });
  } catch (error) {
    console.error("Erreur vérification inscription:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST - Inscription en masse (pour import)
router.post("/import", async (req, res) => {
  try {
    const { inscriptions } = req.body;

    if (!inscriptions || !Array.isArray(inscriptions)) {
      return res.status(400).json({ error: "Liste d'inscriptions requise" });
    }

    const results = [];
    const erreurs = [];

    for (const ins of inscriptions) {
      try {
        // Vérifier l'étudiant
        const etudiantCheck = await db.query(
          "SELECT * FROM etudiant WHERE matricule_et = $1",
          [ins.matricule_et]
        );

        if (etudiantCheck.rows.length === 0) {
          erreurs.push({
            matricule: ins.matricule_et,
            error: "Étudiant non trouvé"
          });
          continue;
        }

        // Vérifier la classe
        const classeCheck = await db.query(
          "SELECT * FROM classe WHERE code_cl = $1",
          [ins.code_cl]
        );

        if (classeCheck.rows.length === 0) {
          erreurs.push({
            matricule: ins.matricule_et,
            error: "Classe non trouvée"
          });
          continue;
        }

        // Vérifier si inscription existe déjà
        const existing = await db.query(
          "SELECT * FROM inscription WHERE matricule_et = $1 AND code_cl = $2 AND annee_academique = $3",
          [ins.matricule_et, ins.code_cl, ins.annee_academique || "2025-2026"]
        );

        if (existing.rows.length > 0) {
          erreurs.push({
            matricule: ins.matricule_et,
            error: "Inscription déjà existante"
          });
          continue;
        } else {
          // Créer nouvelle
          const insert = await db.query(
            `INSERT INTO inscription (matricule_et, code_cl, annee_academique)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [
              ins.matricule_et,
              ins.code_cl,
              ins.annee_academique || "2025-2026"
            ]
          );
          results.push({
            type: "creation",
            inscription: insert.rows[0]
          });
        }
      } catch (error) {
        erreurs.push({
          matricule: ins.matricule_et,
          error: error.message
        });
      }
    }

    res.json({
      message: `${results.length} inscriptions traitées, ${erreurs.length} erreurs`,
      succes: results.length,
      erreurs: erreurs.length,
      details: {
        traitees: results,
        erreurs: erreurs
      }
    });
  } catch (error) {
    console.error("Erreur import inscriptions:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

module.exports = router;
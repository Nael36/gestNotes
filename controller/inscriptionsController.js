const db = require("../database");

// GET - Récupérer les inscriptions d'une classe spécifique
const getInscriptionsByClasse = async (req, res) => {
  try {
    const { code_cl } = req.params;
    
    console.log(`🔍 Recherche inscriptions pour la classe: ${code_cl}`);
    
    // Test de connexion DB
    const testDB = await db.query('SELECT 1 as test');
    console.log('✅ Connexion DB OK');
    
    // Vérifier si la classe existe
    const classeExists = await db.query(
      'SELECT * FROM classe WHERE code_cl = $1',
      [code_cl]
    );
    
    if (classeExists.rows.length === 0) {
      console.log(`❌ Classe ${code_cl} non trouvée`);
      return res.status(404).json({ error: "Classe non trouvée" });
    }
    
    console.log(`✅ Classe ${code_cl} trouvée: ${classeExists.rows[0].libelle_cl}`);
    
    // Compter les étudiants dans la table etudiant
    const countEtudiants = await db.query('SELECT COUNT(*) FROM etudiant');
    console.log(`📊 Total étudiants en DB: ${countEtudiants.rows[0].count}`);
    
    // Compter les inscriptions
    const countInscriptions = await db.query('SELECT COUNT(*) FROM inscription');
    console.log(`📊 Total inscriptions en DB: ${countInscriptions.rows[0].count}`);
    
    // Requête principale
    const query = `
      SELECT 
        i.num_ins,
        i.annee_academique,
        e.matricule_et,
        e.nom_et,
        e.prenom_et,
        e.email_et
      FROM inscription i
      JOIN etudiant e ON i.matricule_et = e.matricule_et
      WHERE i.code_cl = $1
      ORDER BY e.nom_et, e.prenom_et
    `;
    
    console.log(`📝 Exécution requête: ${query}`);
    
    const result = await db.query(query, [code_cl]);
    
    console.log(`✅ ${result.rows.length} inscriptions trouvées pour ${code_cl}`);
    
    if (result.rows.length > 0) {
      console.log('📋 Exemple de données retournées:');
      console.log(result.rows[0]);
    }
    
    res.json(result.rows);
    
  } catch (error) {
    console.error("❌ Erreur récupération inscriptions classe:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ 
      error: "Erreur serveur",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = { getInscriptionsByClasse };
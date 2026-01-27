// password-matricule.js
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'gestnotes',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'votre_mot_de_passe'
});

async function syncAllPasswords() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Synchronisation des mots de passe...');
        
        // Étudiants
        console.log('📚 Synchronisation des étudiants...');
        const etudiants = await client.query('SELECT matricule_et FROM etudiant');
        
        for (const etudiant of etudiants.rows) {
            const matricule = etudiant.matricule_et;
            const hashedPassword = await bcrypt.hash(matricule, 10);
            
            await client.query(
                'UPDATE etudiant SET password_et = $1 WHERE matricule_et = $2',
                [hashedPassword, matricule]
            );
            
            console.log(`   ✅ ${matricule}`);
        }
        
        // Enseignants
        console.log('👨‍🏫 Synchronisation des enseignants...');
        const enseignants = await client.query('SELECT matricule_ens FROM enseignant');
        
        for (const enseignant of enseignants.rows) {
            const matricule = enseignant.matricule_ens;
            const hashedPassword = await bcrypt.hash(matricule, 10);
            
            await client.query(
                'UPDATE enseignant SET password_ens = $1 WHERE matricule_ens = $2',
                [hashedPassword, matricule]
            );
            
            console.log(`   ✅ ${matricule}`);
        }
        
        console.log('🎉 Synchronisation terminée !');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    syncAllPasswords();
}

module.exports = { syncAllPasswords };
// ==========================================
// SCRIPT DE HASHAGE DES MOTS DE PASSE
// Convertit tous les matricules en passwords hashés
// ==========================================

const bcrypt = require('bcrypt');
const db = require('./database');

async function hasherMotsDePasse() {
    console.log('🔐 Démarrage hashage des mots de passe...\n');
    
    try {
        // 1. ENSEIGNANTS - Password = Matricule
        console.log('👨‍🏫 Hashage enseignants...');
        const enseignants = await db.query('SELECT matricule_ens FROM enseignant');
        
        for (const ens of enseignants.rows) {
            const hash = await bcrypt.hash(ens.matricule_ens, 10);
            await db.query(
                'UPDATE enseignant SET password_ens = $1 WHERE matricule_ens = $2',
                [hash, ens.matricule_ens]
            );
            console.log(`  ✅ ${ens.matricule_ens} → hashé`);
        }
        
        // 2. ÉTUDIANTS - Password = Matricule
        console.log('\n👨‍🎓 Hashage étudiants...');
        const etudiants = await db.query('SELECT matricule_et FROM etudiant');
        
        for (const etu of etudiants.rows) {
            const hash = await bcrypt.hash(etu.matricule_et, 10);
            await db.query(
                'UPDATE etudiant SET password_et = $1 WHERE matricule_et = $2',
                [hash, etu.matricule_et]
            );
            console.log(`  ✅ ${etu.matricule_et} → hashé`);
        }
        
        // 3. ADMIN - Password = admin123
        console.log('\n👑 Hashage admin...');
        const hashAdmin = await bcrypt.hash('admin123', 10);
        await db.query(
            'UPDATE admin SET password_admin = $1 WHERE email_admin = $2',
            [hashAdmin, 'admin@iua.ci']
        );
        console.log('  ✅ admin@iua.ci → admin123 hashé');
        
        console.log('\n🎉 TOUS LES MOTS DE PASSE ONT ÉTÉ HASHÉS !');
        console.log('\n📋 Récapitulatif:');
        console.log(`  - Enseignants: ${enseignants.rows.length}`);
        console.log(`  - Étudiants: ${etudiants.rows.length}`);
        console.log(`  - Admin: 1`);
        console.log('\n✅ Vous pouvez maintenant vous connecter !');
        
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
        process.exit(1);
    }
}

hasherMotsDePasse();

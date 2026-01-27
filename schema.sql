-- ========================================
-- BASE GESTNOTES - VERSION FINALE COMPLETE
-- PostgreSQL / pgAdmin avec bcrypt réel
-- ========================================

-- Extension pour bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- SUPPRESSION DES TABLES
-- =========================
DROP TABLE IF EXISTS evaluation CASCADE;
DROP TABLE IF EXISTS inscription CASCADE;
DROP TABLE IF EXISTS matiere CASCADE;
DROP TABLE IF EXISTS periode CASCADE;
DROP TABLE IF EXISTS classe CASCADE;
DROP TABLE IF EXISTS etudiant CASCADE;
DROP TABLE IF EXISTS enseignant CASCADE;
DROP TABLE IF EXISTS admin CASCADE;

-- =========================
-- TABLE ADMIN
-- =========================
CREATE TABLE admin (
    id_admin SERIAL PRIMARY KEY,
    nom_admin VARCHAR(50) NOT NULL,
    prenom_admin VARCHAR(50) NOT NULL,
    email_admin VARCHAR(100) UNIQUE NOT NULL,
    password_admin TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABLE ENSEIGNANT
-- =========================
CREATE TABLE enseignant (
    matricule_ens VARCHAR(20) PRIMARY KEY,
    nom_ens VARCHAR(50) NOT NULL,
    prenom_ens VARCHAR(50) NOT NULL,
    email_ens VARCHAR(100) UNIQUE NOT NULL,
    password_ens TEXT NOT NULL
);

-- =========================
-- TABLE ETUDIANT
-- =========================
CREATE TABLE etudiant (
    matricule_et VARCHAR(20) PRIMARY KEY,
    nom_et VARCHAR(50) NOT NULL,
    prenom_et VARCHAR(50) NOT NULL,
    email_et VARCHAR(100) UNIQUE NOT NULL,
    password_et TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABLE CLASSE
-- =========================
CREATE TABLE classe (
    code_cl VARCHAR(20) PRIMARY KEY,
    libelle_cl VARCHAR(100) NOT NULL
);

-- =========================
-- TABLE PERIODE
-- =========================
CREATE TABLE periode (
    code_per VARCHAR(20) PRIMARY KEY,
    libelle_per VARCHAR(100),
    debut_per DATE,
    fin_per DATE
);

-- =========================
-- TABLE MATIERE
-- =========================
CREATE TABLE matiere (
    code_mat VARCHAR(20) PRIMARY KEY,
    libelle_mat VARCHAR(100),
    nb_credit INT CHECK (nb_credit BETWEEN 1 AND 10),
    code_cl VARCHAR(20),
    FOREIGN KEY (code_cl) REFERENCES classe(code_cl)
);

-- =========================
-- TABLE INSCRIPTION
-- =========================
CREATE TABLE inscription (
    num_ins SERIAL PRIMARY KEY,
    matricule_et VARCHAR(20),
    code_cl VARCHAR(20),
    annee_academique VARCHAR(20) DEFAULT '2025-2026',
    FOREIGN KEY (matricule_et) REFERENCES etudiant(matricule_et),
    FOREIGN KEY (code_cl) REFERENCES classe(code_cl),
    UNIQUE (matricule_et, code_cl, annee_academique)
);

-- =========================
-- TABLE EVALUATION
-- =========================
CREATE TABLE evaluation (
    id_eval SERIAL PRIMARY KEY,
    matricule_ens VARCHAR(20),
    code_mat VARCHAR(20),
    num_ins INT,
    code_per VARCHAR(20),
    note NUMERIC(4,2) CHECK (note BETWEEN 0 AND 20),
    FOREIGN KEY (matricule_ens) REFERENCES enseignant(matricule_ens),
    FOREIGN KEY (code_mat) REFERENCES matiere(code_mat),
    FOREIGN KEY (num_ins) REFERENCES inscription(num_ins),
    FOREIGN KEY (code_per) REFERENCES periode(code_per)
);

-- =========================
-- DONNEES INITIALES
-- =========================

-- Admin
INSERT INTO admin VALUES
(DEFAULT,'Admin','Systeme','admin@iua.ci', crypt('admin123', gen_salt('bf')));

-- Classes
INSERT INTO classe VALUES
('L1GI','Licence 1 Génie Informatique'),
('L2GI','Licence 2 Génie Informatique'),
('L3GI','Licence 3 Génie Informatique'),
('L1MIAGE','Licence 1 MIAGE'),
('L2MIAGE','Licence 2 MIAGE'),
('L3MIAGE','Licence 3 MIAGE');

-- =========================
-- ENSEIGNANTS (mot de passe = matricule)
-- =========================
INSERT INTO enseignant VALUES
('ENS01','Diallo','Mamadou','mamadou.diallo@iua.ci', crypt('ENS01', gen_salt('bf'))),
('ENS02','Traore','Aminata','aminata.traore@iua.ci', crypt('ENS02', gen_salt('bf'))),
('ENS03','Kone','Jean-Paul','jeanpaul.kone@iua.ci', crypt('ENS03', gen_salt('bf')));

-- =========================
-- ETUDIANTS (5 par classe)
-- =========================
INSERT INTO etudiant VALUES
-- L1GI
('L1GI01','Kouassi','Jean','jean.l1gi@iua.ci',crypt('L1GI01',gen_salt('bf'))),
('L1GI02','Yao','Marie','marie.l1gi@iua.ci',crypt('L1GI02',gen_salt('bf'))),
('L1GI03','Konan','Paul','paul.l1gi@iua.ci',crypt('L1GI03',gen_salt('bf'))),
('L1GI04','Traore','Awa','awa.l1gi@iua.ci',crypt('L1GI04',gen_salt('bf'))),
('L1GI05','Diallo','Moussa','moussa.l1gi@iua.ci',crypt('L1GI05',gen_salt('bf'))),

-- L2GI
('L2GI01','Kone','Ibrahim','ibrahim.l2gi@iua.ci',crypt('L2GI01',gen_salt('bf'))),
('L2GI02','Yao','Esther','esther.l2gi@iua.ci',crypt('L2GI02',gen_salt('bf'))),
('L2GI03','Konan','Luc','luc.l2gi@iua.ci',crypt('L2GI03',gen_salt('bf'))),
('L2GI04','Coulibaly','Aminata','aminata.l2gi@iua.ci',crypt('L2GI04',gen_salt('bf'))),
('L2GI05','Traore','Seydou','seydou.l2gi@iua.ci',crypt('L2GI05',gen_salt('bf'))),

-- L3GI
('L3GI01','Bamba','Kevin','kevin.l3gi@iua.ci',crypt('L3GI01',gen_salt('bf'))),
('L3GI02','Yao','Sandra','sandra.l3gi@iua.ci',crypt('L3GI02',gen_salt('bf'))),
('L3GI03','Kouame','Joel','joel.l3gi@iua.ci',crypt('L3GI03',gen_salt('bf'))),
('L3GI04','Diallo','Fatou','fatou.l3gi@iua.ci',crypt('L3GI04',gen_salt('bf'))),
('L3GI05','Kone','Ismael','ismael.l3gi@iua.ci',crypt('L3GI05',gen_salt('bf'))),

-- L1MIAGE
('L1MIAGE01','Assi','Patrick','patrick.l1miage@iua.ci',crypt('L1MIAGE01',gen_salt('bf'))),
('L1MIAGE02','Yao','Claire','claire.l1miage@iua.ci',crypt('L1MIAGE02',gen_salt('bf'))),
('L1MIAGE03','Kone','Marc','marc.l1miage@iua.ci',crypt('L1MIAGE03',gen_salt('bf'))),
('L1MIAGE04','Traore','Salimata','salimata.l1miage@iua.ci',crypt('L1MIAGE04',gen_salt('bf'))),
('L1MIAGE05','Diallo','Oumar','oumar.l1miage@iua.ci',crypt('L1MIAGE05',gen_salt('bf'))),

-- L2MIAGE
('L2MIAGE01','Kouame','Eric','eric.l2miage@iua.ci',crypt('L2MIAGE01',gen_salt('bf'))),
('L2MIAGE02','Bamba','Nadine','nadine.l2miage@iua.ci',crypt('L2MIAGE02',gen_salt('bf'))),
('L2MIAGE03','Kone','Patrick','patrick.l2miage@iua.ci',crypt('L2MIAGE03',gen_salt('bf'))),
('L2MIAGE04','Yao','Sylvie','sylvie.l2miage@iua.ci',crypt('L2MIAGE04',gen_salt('bf'))),
('L2MIAGE05','Traore','Issa','issa.l2miage@iua.ci',crypt('L2MIAGE05',gen_salt('bf'))),

-- L3MIAGE
('L3MIAGE01','Diallo','Abdou','abdou.l3miage@iua.ci',crypt('L3MIAGE01',gen_salt('bf'))),
('L3MIAGE02','Kone','Aline','aline.l3miage@iua.ci',crypt('L3MIAGE02',gen_salt('bf'))),
('L3MIAGE03','Yao','Brice','brice.l3miage@iua.ci',crypt('L3MIAGE03',gen_salt('bf'))),
('L3MIAGE04','Traore','Mariam','mariam.l3miage@iua.ci',crypt('L3MIAGE04',gen_salt('bf'))),
('L3MIAGE05','Kouassi','Serge','serge.l3miage@iua.ci',crypt('L3MIAGE05',gen_salt('bf')));

-- =========================
-- INSCRIPTIONS AUTOMATIQUES (chaque étudiant dans sa classe)
-- =========================
INSERT INTO inscription (matricule_et, code_cl)
SELECT matricule_et, substring(matricule_et from 1 for length(matricule_et)-2)
FROM etudiant;

-- =========================
-- VERIFICATION DU NOMBRE D'ETUDIANTS PAR CLASSE
-- =========================
SELECT code_cl, COUNT(*) AS nb_etudiants
FROM inscription
GROUP BY code_cl
ORDER BY code_cl;

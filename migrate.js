const mysql = require('mysql2');

/**
 * CONFIGURATION DE LA CONNEXION À AIVEN MYSQL
 * On utilise les identifiants fournis par le tableau de bord Aiven.
 * Le paramètre SSL est obligatoire pour sécuriser la connexion distante.
 */
const db = mysql.createConnection({
    host: 'mysql-c9ed28a-fiderana498-4ed0.j.aivencloud.com',
    port: 19806,
    user: 'avnadmin',
    password: 'AVNS__UuUqiHFJlW6mLpZyVR',
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false } // Nécessaire pour les connexions Cloud (Aiven)
});

/**
 * REQUÊTE SQL POUR CRÉER LA TABLE DES MESSAGES
 * id : Identifiant unique auto-incrémenté
 * room_id : Le nom du salon (ex: salon_general)
 * expediteur : Nom ou ID de la personne qui envoie
 * contenu_chiffre : Le message crypté en AES
 * date_envoi : Date et heure automatique de l'enregistrement
 */
const sql = `
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    expediteur VARCHAR(255) NOT NULL,
    contenu_chiffre TEXT NOT NULL,
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

// Tentative de connexion à la base de données
db.connect((err) => {
    if (err) {
        console.error("❌ Échec de la connexion à la base de données : ", err.message);
        return;
    }
    console.log("✅ Connexion établie avec succès à Aiven MySQL...");
    
    // Exécution de la création de la table
    db.query(sql, (err, result) => {
        if (err) {
            console.error("❌ Erreur lors de la création de la table : ", err.message);
        } else {
            console.log("🚀 Succès : La table 'messages' est prête à l'emploi sur Aiven !");
        }
        
        // Fermeture de la connexion après l'opération
        db.end();
        console.log("🔌 Connexion fermée proprement.");
    });
});
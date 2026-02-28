const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'mysql-c9ed28a-fiderana498-4ed0.j.aivencloud.com',
    port: 19806,
    user: 'avnadmin',
    password: 'AVNS__UuUqiHFJlW6mLpZyVR',
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
});

db.connect((err) => {
    if (err) throw err;
    console.log("✅ Connecté pour la migration");

    // Fafana ny taloha mba hadio
    db.query("DROP TABLE IF EXISTS messages", () => {
        // Foronina ny vaovao mampiasa 'room'
        const sql = `
        CREATE TABLE messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            room VARCHAR(255) NOT NULL,
            expediteur VARCHAR(255) NOT NULL,
            contenu_chiffre TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        db.query(sql, (err) => {
            if (err) console.log("Erreur:", err.message);
            else console.log("🚀 Table 'messages' MODERNE efa vonona!");
            db.end();
        });
    });
});
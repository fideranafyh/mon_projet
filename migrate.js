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
    // Fafana ny taloha mba hananana table madio sy mifanaraka tsara
    db.query("DROP TABLE IF EXISTS messages", () => {
        const sql = `
        CREATE TABLE messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            room_id VARCHAR(255) NOT NULL,
            expediteur VARCHAR(255) NOT NULL,
            contenu_chiffre TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        db.query(sql, (err) => {
            if (err) console.log(err);
            else console.log("✅ Database MADIO sy VONONA (Table 'messages' créée) !");
            db.end();
        });
    });
});
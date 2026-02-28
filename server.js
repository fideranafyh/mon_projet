// --- SERVER CHAT SIMPLE ET SÉCURISÉ ---
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;

// CONNEXION MYSQL AIVEN
const db = mysql.createConnection({
    host: 'mysql-c9ed28a-fiderana498-4ed0.j.aivencloud.com',
    port: 19806,
    user: 'avnadmin',
    password: 'AVNS__UuUqiHFJlW6mLpZyVR',
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
});

db.connect((err) => {
    if (err) console.log("Erreur SQL:", err.message);
    else console.log("✅ Connecté à la base de données");
});

io.on('connection', (socket) => {
    // Rejoindre un salon
    socket.on('join-room', (roomName) => {
        socket.join(roomName);
        // Charger l'historique (On utilise 'room' comme nom de colonne)
        const sql = "SELECT * FROM messages WHERE room = ? ORDER BY id ASC";
        db.query(sql, [roomName], (err, results) => {
            if (!err) socket.emit('load-history', results);
        });
    });

    // Envoyer un message
    socket.on('chat-message', (data) => {
        const sql = "INSERT INTO messages (room, expediteur, contenu_chiffre) VALUES (?, ?, ?)";
        db.query(sql, [data.room, data.sender, data.msg], (err) => {
            if (err) console.log("Erreur Insert:", err);
            socket.to(data.room).emit('receive-message', data);
        });
    });

    socket.on('disconnect', () => { console.log('Déconnexion'); });
});

server.listen(PORT, () => console.log(`Serveur sur port ${PORT}`));
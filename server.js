// Message pour confirmer le lancement du script dans la console
console.log("Démarrage du serveur de chat sécurisé...");

// --- 1. IMPORTATION DES MODULES ---
const express = require('express'); // Framework web pour Node.js
const http = require('http'); // Module pour créer le serveur HTTP
const { Server } = require('socket.io'); // Bibliothèque pour la communication en temps réel
const mysql = require('mysql2'); // Pilote pour se connecter à MySQL (Aiven)
const cors = require('cors'); // Autorise les connexions provenant d'autres domaines (CORS)

const app = express();
app.use(cors()); // Activation du middleware CORS pour la sécurité

const server = http.createServer(app);

// Configuration de Socket.io pour accepter toutes les origines
const io = new Server(server, { 
    cors: { origin: "*" } 
});

// --- 2. CONFIGURATION DU PORT ---
const PORT = process.env.PORT || 3000;

// --- 3. CONNEXION À LA BASE DE DONNÉES (AIVEN CLOUD) ---
const db = mysql.createConnection({
    host: 'mysql-c9ed28a-fiderana498-4ed0.j.aivencloud.com',
    port: 19806,
    user: 'avnadmin',
    password: 'AVNS__UuUqiHFJlW6mLpZyVR',
    database: 'defaultdb',
    ssl: {
        rejectUnauthorized: false // Requis pour les connexions sécurisées SSL sur Aiven
    }
});

// Tentative de connexion à MySQL
db.connect((err) => {
    if (err) {
        console.error("❌ ERREUR DE CONNEXION MYSQL : " + err.message);
    } else {
        console.log("✅ CONNECTÉ À LA BASE DE DONNÉES AIVEN AVEC SUCCÈS !");
    }
});

// --- 4. LOGIQUE DE COMMUNICATION (SOCKET.IO) ---
io.on('connection', (socket) => {
    console.log('Un nouvel utilisateur vient de se connecter');

    // Événement : L'utilisateur rejoint un salon spécifique
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`Utilisateur a rejoint le salon : ${roomId}`);

        // Récupération de l'historique depuis MySQL
        const sql = "SELECT * FROM messages WHERE room_id = ? ORDER BY id ASC";
        db.query(sql, [roomId], (err, results) => {
            if (!err) {
                socket.emit('load-history', results);
            } else {
                console.error("Erreur lors du chargement de l'historique :", err);
            }
        });
    });

    // Événement : L'utilisateur envoie un message
    socket.on('chat-message', (data) => {
        // Sauvegarde dans la base de données
        const sqlInsert = "INSERT INTO messages (room_id, expediteur, contenu_chiffre) VALUES (?, ?, ?)";
        db.query(sqlInsert, [data.room, data.sender, data.msg], (err) => {
            if (err) {
                console.error("Erreur d'insertion SQL : ", err);
            }
            // Diffusion aux autres membres du salon
            socket.to(data.room).emit('receive-message', data);
        });
    });

    // --- NOUVEAUTÉ : Événement pour EFFACER TOUT l'historique d'un salon ---
    socket.on('clear-history', (roomId) => {
        const sqlDelete = "DELETE FROM messages WHERE room_id = ?";
        db.query(sqlDelete, [roomId], (err, result) => {
            if (err) {
                console.error("Erreur lors de la suppression SQL :", err);
            } else {
                console.log(`Historique du salon ${roomId} effacé par un utilisateur.`);
                // Informer TOUS les utilisateurs du salon que l'historique est vide
                io.to(roomId).emit('history-cleared');
            }
        });
    });

    // Événement : L'utilisateur est en train d'écrire
    socket.on('typing', (data) => {
        socket.to(data.room).emit('is-typing', data);
    });

    // Événement : Déconnexion
    socket.on('disconnect', () => {
        console.log('Un utilisateur s\'est déconnecté');
    });
});

// --- 5. LANCEMENT DU SERVEUR ---
server.listen(PORT, () => {
    console.log(`🚀 SERVEUR DÉMARRÉ SUR LE PORT : ${PORT}`);
});
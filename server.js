// Affichage d'un message au démarrage pour vérifier que le script se lance
console.log("Démarrage du script en cours...");

// --- IMPORTATION DES MODULES ---
const express = require('express'); // Framework web pour Node.js
const http = require('http'); // Module natif pour créer le serveur HTTP
const { Server } = require('socket.io'); // Bibliothèque pour la communication temps réel
const mysql = require('mysql2'); // Pilote pour se connecter à la base de données MySQL
const cors = require('cors'); // Middleware pour autoriser les connexions depuis un autre domaine (Navigateur)

const app = express();
app.use(cors()); // Activation du CORS

const server = http.createServer(app); // Création du serveur HTTP à partir d'Express

// Configuration de Socket.io avec les options CORS
const io = new Server(server, { 
    cors: { origin: "*" } // Autorise toutes les origines (pratique pour le test et le déploiement)
});

// --- CONFIGURATION DU PORT ---
// On utilise le port fourni par l'hébergeur (Render) OU le port 3000 par défaut en local
const PORT = process.env.PORT || 3000;

// --- CONNEXION À LA BASE DE DONNÉES MYSQL ---
// On utilise des variables d'environnement pour plus de sécurité lors du déploiement
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chat_prive',
    port: process.env.DB_PORT || 3306
});

// Tentative de connexion à MySQL
db.connect((err) => {
    if (err) {
        console.error("❌ ERREUR CONNEXION MYSQL : " + err.message);
    } else {
        console.log("✅ CONNECTÉ À MYSQL AVEC SUCCÈS !");
    }
});

// --- LOGIQUE DE COMMUNICATION (SOCKET.IO) ---
io.on('connection', (socket) => {
    console.log('Un utilisateur vient de se connecter');

    // Événement : rejoindre un salon (Room) spécifique
    socket.on('join-room', (roomId) => {
        socket.join(roomId); // L'utilisateur rejoint le canal nommé par roomId
        console.log(`L'utilisateur a rejoint le salon : ${roomId}`);

        // Récupération de l'historique des messages pour ce salon précis
        const sql = "SELECT * FROM messages WHERE room_id = ? ORDER BY date_envoi ASC";
        db.query(sql, [roomId], (err, results) => {
            if (!err) {
                // On renvoie l'historique uniquement à l'utilisateur qui vient de se connecter
                socket.emit('load-history', results);
            } else {
                console.error("Erreur lors du chargement de l'historique :", err);
            }
        });
    });

    // Événement : envoi d'un nouveau message
    socket.on('chat-message', (data) => {
        // 1. Sauvegarde du message crypté (AES) reçu du client dans MySQL
        const sqlInsert = "INSERT INTO messages (room_id, expediteur, contenu_chiffre) VALUES (?, ?, ?)";
        db.query(sqlInsert, [data.room, data.sender, data.msg], (err) => {
            if (err) {
                console.error("Erreur d'insertion en base de données : ", err);
            }
            
            // 2. Diffusion du message aux autres membres présents dans le même salon
            socket.to(data.room).emit('receive-message', data);
        });
    });

    // Événement : indicateur de frappe (Typing indicator)
    socket.on('typing', (data) => {
        // On informe les autres membres que "data.sender" est en train d'écrire
        socket.to(data.room).emit('is-typing', data);
    });

    // Événement : déconnexion
    socket.on('disconnect', () => {
        console.log('Un utilisateur s\'est déconnecté');
    });
});

// --- DÉMARRAGE DU SERVEUR ---
server.listen(PORT, () => {
    console.log(`🚀 SERVEUR DÉMARRÉ SUR LE PORT : ${PORT}`);
    console.log(`Prêt à recevoir des connexions sur http://localhost:${PORT}`);
});
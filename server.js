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

// Configuration de Socket.io pour accepter toutes les origines (indispensable pour le déploiement)
const io = new Server(server, { 
    cors: { origin: "*" } 
});

// --- 2. CONFIGURATION DU PORT ---
// On utilise le port dynamique fourni par Render (process.env.PORT)
// Si on teste en local, on utilise le port 3000 par défaut.
const PORT = process.env.PORT || 3000;

// --- 3. CONNEXION À LA BASE DE DONNÉES (AIVEN CLOUD) ---
// Remplacez les valeurs ci-dessous par vos informations Aiven si elles sont différentes
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

// Tentative de connexion à MySQL sur le Cloud
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

    // Événement : L'utilisateur rejoint un salon spécifique (via le lien ?room=...)
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`Utilisateur a rejoint le salon : ${roomId}`);

        // On récupère l'historique des messages pour ce salon précis depuis MySQL
        const sql = "SELECT * FROM messages WHERE room_id = ? ORDER BY date_envoi ASC";
        db.query(sql, [roomId], (err, results) => {
            if (!err) {
                // On envoie l'historique uniquement à l'utilisateur qui vient de se connecter
                socket.emit('load-history', results);
            } else {
                console.error("Erreur lors du chargement de l'historique :", err);
            }
        });
    });

    // Événement : L'utilisateur envoie un message
    socket.on('chat-message', (data) => {
        // 1. Sauvegarde du message (chiffré côté client) dans la base de données Cloud
        const sqlInsert = "INSERT INTO messages (room_id, expediteur, contenu_chiffre) VALUES (?, ?, ?)";
        db.query(sqlInsert, [data.room, data.sender, data.msg], (err) => {
            if (err) {
                console.error("Erreur d'insertion SQL : ", err);
            }
            
            // 2. Diffusion du message en temps réel aux autres personnes du même salon
            socket.to(data.room).emit('receive-message', data);
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
    console.log(`Lien local pour test : http://localhost:${PORT}`);
});
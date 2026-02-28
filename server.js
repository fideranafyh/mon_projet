// --- GESTION DES CONNEXIONS SOCKET.IO ---

io.on('connection', (socket) => {
    console.log('Un utilisateur est connecté');

    // 1. REJOINDRE UN SALON (ROOM)
    socket.on('join-room', (roomName) => {
        socket.join(roomName);
        console.log(`Utilisateur a rejoint le salon : ${roomName}`);
        
        // Tentative de récupération de l'historique via 'room_id'
        const sql = "SELECT * FROM messages WHERE room_id = ? ORDER BY id ASC";
        
        db.query(sql, [roomName], (err, results) => {
            if (err) {
                // Si 'room_id' n'existe pas dans la base, on essaie avec la colonne 'room'
                console.log("Tentative avec colonne 'room'...");
                const sqlFallback = "SELECT * FROM messages WHERE room = ? ORDER BY id ASC";
                
                db.query(sqlFallback, [roomName], (e, res) => {
                    if (!e) {
                        // Envoi de l'historique au client qui vient de se connecter
                        socket.emit('load-history', res);
                    } else {
                        console.log("Erreur SQL critique :", e.message);
                    }
                });
            } else {
                // Envoi de l'historique si la première requête a réussi
                socket.emit('load-history', results);
            }
        });
    });

    // 2. ENVOYER ET ENREGISTRER UN MESSAGE
    socket.on('chat-message', (data) => {
        // Préparation de l'insertion (on essaie d'abord room_id)
        const sql = "INSERT INTO messages (room_id, expediteur, contenu_chiffre) VALUES (?, ?, ?)";
        
        db.query(sql, [data.room, data.sender, data.msg], (err) => {
            if (err) {
                console.log("Erreur insertion (room_id), essai avec 'room'...");
                // Si échec, on tente d'insérer dans la colonne 'room'
                const sqlFallback = "INSERT INTO messages (room, expediteur, contenu_chiffre) VALUES (?, ?, ?)";
                db.query(sqlFallback, [data.room, data.sender, data.msg], (errFallback) => {
                    if (errFallback) console.log("Erreur SQL finale :", errFallback.message);
                });
            }
            
            // Envoyer le message en temps réel aux autres personnes dans le salon
            socket.to(data.room).emit('receive-message', data);
        });
    });

    // 3. DÉCONNEXION
    socket.on('disconnect', () => { 
        console.log('Un utilisateur s\'est déconnecté'); 
    });
});
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const db = mysql.createConnection({
    host: 'mysql-c9ed28a-fiderana498-4ed0.j.aivencloud.com',
    port: 19806,
    user: 'avnadmin',
    password: 'AVNS__UuUqiHFJlW6mLpZyVR',
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
});

io.on('connection', (socket) => {
    socket.on('join-room', (roomName) => {
        socket.join(roomName);
        const sql = "SELECT * FROM messages WHERE room_id = ? ORDER BY id ASC";
        db.query(sql, [roomName], (err, results) => {
            if (!err) socket.emit('load-history', results);
        });
    });

    socket.on('chat-message', (data) => {
        const sql = "INSERT INTO messages (room_id, expediteur, contenu_chiffre) VALUES (?, ?, ?)";
        db.query(sql, [data.room, data.sender, data.msg], (err) => {
            if (!err) socket.to(data.room).emit('receive-message', data);
        });
    });
});

server.listen(process.env.PORT || 3000, () => console.log("Serveur OK"));
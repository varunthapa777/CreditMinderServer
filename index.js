// server.js
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(cors());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});
let status;
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        status = 'Error connecting to the database';
        return;
    }
    console.log('Connected to the MySQL database.');
});

app.get('/', (req, res) => {
    res.sendFile('index.html');
});

// Create a new record
app.post('/addRecord', (req, res) => {
    const { userId, name, amount, settled, due_date } = req.body;
    const sql = 'INSERT INTO records (user_id, name, amount, settled, due_date) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [userId, name, amount, settled, due_date], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.send('Record added...');
    });
});

// Get all records
app.get('/getRecords', (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).send('User ID is required');
    }

    const sql = 'SELECT * FROM records WHERE user_id = ? ORDER BY created_at DESC';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (results.length === 0) {
            return res.status(401).send('Invalid email or password' + email);
        }
        const user = results[0];
        const isPasswordValid = password === user.password;
        if (!isPasswordValid) {
            return res.status(401).send('Invalid email or password');
        }
        res.json({ message: 'Login successful', userId: user.id, userName: user.name });
    });
});

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    db.query(sql, [name, email, password], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.send('User registered...');
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
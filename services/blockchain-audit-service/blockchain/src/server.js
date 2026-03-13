const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const auditController = require('./auditController');
const blockchainClient = require('./blockchainClient');

const app = express();
const PORT = process.env.PORT || 8004;

app.use(express.json());

// Initialize SQLite Database
const dbPath = path.resolve(__dirname, '../audit_events.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS events (
            event_id TEXT PRIMARY KEY,
            patient_id TEXT,
            hospital_id TEXT,
            timestamp TEXT,
            blockchain_hash TEXT,
            tx_hash TEXT,
            full_event_json TEXT
        )`);
    }
});

// Make db available to routes
app.locals.db = db;

// Initialize Blockchain connection
blockchainClient.initBlockchain();

// Routes
app.post('/audit/log', auditController.logEvent);
app.get('/audit/verify/:event_id', auditController.verifyEvent);
app.get('/audit/events', auditController.getEvents);

app.listen(PORT, () => {
    console.log(`Blockchain Audit Service running on port ${PORT}`);
});

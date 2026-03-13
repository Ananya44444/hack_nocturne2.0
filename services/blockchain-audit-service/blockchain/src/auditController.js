const hashService = require('./hashService');
const blockchainClient = require('./blockchainClient');

async function logEvent(req, res) {
    const { event_id, patient_id, hospital_id, timestamp } = req.body;
    
    // Basic validation based on schema fields needed for hashing
    if (!event_id || !patient_id || !hospital_id || !timestamp) {
        return res.status(400).json({ error: "Missing required fields for hash generation: event_id, patient_id, hospital_id, timestamp" });
    }

    try {
        // Compute Hash
        const blockchain_hash = hashService.computeHash(event_id, patient_id, hospital_id, timestamp);
        
        // Write to Blockchain
        const tx_hash = await blockchainClient.logToBlockchain(event_id, blockchain_hash);
        
        // Store Locally
        const full_event_json = JSON.stringify(req.body);
        const db = req.app.locals.db;
        
        db.run(
            `INSERT INTO events (event_id, patient_id, hospital_id, timestamp, blockchain_hash, tx_hash, full_event_json) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [event_id, patient_id, hospital_id, timestamp, blockchain_hash, tx_hash, full_event_json],
            function(err) {
                if (err) {
                    console.error("Database error:", err.message);
                    return res.status(500).json({ error: "Failed to store event locally" });
                }
                
                res.status(201).json({
                    message: "Event logged successfully",
                    event_id,
                    blockchain_hash,
                    tx_hash
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function verifyEvent(req, res) {
    const { event_id } = req.params;
    const db = req.app.locals.db;
    
    db.get(`SELECT * FROM events WHERE event_id = ?`, [event_id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (!row) {
            return res.status(404).json({ error: "Event not found" });
        }
        
        // Recompute hash
        const computed_hash = hashService.computeHash(row.event_id, row.patient_id, row.hospital_id, row.timestamp);
        
        const isValid = computed_hash === row.blockchain_hash;
        
        res.status(200).json({
            event_id: row.event_id,
            tx_hash: row.tx_hash,
            stored_hash: row.blockchain_hash,
            computed_hash: computed_hash,
            is_valid: isValid,
            event_data: JSON.parse(row.full_event_json)
        });
    });
}

function getEvents(req, res) {
    const db = req.app.locals.db;
    
    db.all(`SELECT event_id, patient_id, hospital_id, timestamp, tx_hash FROM events ORDER BY timestamp DESC`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        res.status(200).json(rows);
    });
}

module.exports = {
    logEvent,
    verifyEvent,
    getEvents
};

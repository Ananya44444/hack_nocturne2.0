const crypto = require('crypto');

function computeHash(event_id, patient_id, hospital_id, timestamp) {
    const data = `${event_id}${patient_id}${hospital_id}${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex');
}

module.exports = {
    computeHash
};

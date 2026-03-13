// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AuditLogger
 * @dev Stores SHA-256 hashes of audit events mapped to their unique event_ids to ensure immutability.
 */
contract AuditLogger {
    // Maps event_id -> SHA256 Hash
    mapping(string => string) private auditLogs;

    // Event emitted when a new log is added
    event LogAdded(string indexed eventId, string eventHash);

    /**
     * @dev Stores an event hash for a specific event ID.
     * @param event_id Unique identifier for the audit event
     * @param event_hash Computed SHA-256 hash of the event data
     */
    function logEvent(string memory event_id, string memory event_hash) public returns (bytes32) {
        // Prevent overwriting an existing event ID
        require(bytes(auditLogs[event_id]).length == 0, "Event ID already exists");
        
        auditLogs[event_id] = event_hash;
        
        emit LogAdded(event_id, event_hash);
        
        // Return a hashed confirmation
        return keccak256(abi.encodePacked(event_id, event_hash));
    }

    /**
     * @dev Verifies if a given hash matches the stored hash for that event ID.
     * @param event_id Unique identifier for the audit event
     * @param hash The hash to verify against the stored value
     */
    function verifyEvent(string memory event_id, string memory hash) public view returns (bool) {
        require(bytes(auditLogs[event_id]).length > 0, "Event ID not found");
        
        string memory storedHash = auditLogs[event_id];
        
        // Compare the strings by hashing them
        return keccak256(abi.encodePacked(storedHash)) == keccak256(abi.encodePacked(hash));
    }
}

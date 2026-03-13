const { ethers } = require('ethers');
require('dotenv').config();

const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
const contractAddress = process.env.SMART_CONTRACT_ADDRESS;

// ABI for the smart contract
const abi = [
    "function logEvent(string memory event_id, string memory event_hash) public returns (bytes32)"
];

let provider;
let wallet;
let contract;

function initBlockchain() {
    if (!contractAddress) {
        console.warn("SMART_CONTRACT_ADDRESS is not set. Blockchain integration may not work or will fail if called.");
    }
    
    provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // For local MVP testing, using a default Hardhat private key (Account #0)
    // IN PRODUCTION: Use proper secure key management
    const privateKey = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    wallet = new ethers.Wallet(privateKey, provider);
    
    contract = contractAddress ? new ethers.Contract(contractAddress, abi, wallet) : null;
}

async function logToBlockchain(eventId, eventHash) {
    try {
        if (!contract) {
            initBlockchain();
            if (!contract) {
                console.warn("No smart contract address provided. Simulating blockchain transaction for MVP.");
                return "0x" + require('crypto').randomBytes(32).toString('hex');
            }
        }
        
        const tx = await contract.logEvent(eventId, `0x${eventHash}`);
        const receipt = await tx.wait();
        return receipt.hash;
    } catch (error) {
        console.error("Blockchain error:", error);
        throw new Error("Failed to write to blockchain");
    }
}

module.exports = {
    initBlockchain,
    logToBlockchain
};

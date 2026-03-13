import json
import os
from web3 import Web3
from web3.middleware import SignAndSendRawMiddlewareBuilder
from eth_account import Account
import logging

from .config import (
    BLOCKCHAIN_RPC_URL,
    SMART_CONTRACT_ADDRESS,
    CONTRACT_ABI_PATH,
    WALLET_PRIVATE_KEY,
    CHAIN_ID
)

logger = logging.getLogger(__name__)

class BlockchainClient:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(BLOCKCHAIN_RPC_URL))
        self.contract = None
        self.account = None
        
        self._initialize()

    def _initialize(self):
        if not self.w3.is_connected():
            logger.warning(f"Could not connect to Web3 provider at {BLOCKCHAIN_RPC_URL}")
            return
            
        try:
            # Set up account for signing
            self.account = Account.from_key(WALLET_PRIVATE_KEY)
            self.w3.middleware_onion.inject(SignAndSendRawMiddlewareBuilder.build(self.account), layer=0)
            self.w3.eth.default_account = self.account.address
            logger.info(f"Initialized Web3 account: {self.account.address}")
            
            if SMART_CONTRACT_ADDRESS:
                # Load ABI
                # To be resilient during initial MVP testing without a compiled ABI file,
                # we define an inline fallback ABI.
                try:
                    with open(CONTRACT_ABI_PATH, 'r') as f:
                        contract_json = json.load(f)
                        abi = contract_json.get('abi', contract_json)
                except FileNotFoundError:
                    logger.warning(f"ABI file not found at {CONTRACT_ABI_PATH}, using fallback ABI.")
                    abi = [
                        {
                            "inputs": [
                                {"internalType": "string", "name": "event_id", "type": "string"},
                                {"internalType": "string", "name": "event_hash", "type": "string"}
                            ],
                            "name": "logEvent",
                            "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
                            "stateMutability": "nonpayable",
                            "type": "function"
                        },
                        {
                            "inputs": [
                                {"internalType": "string", "name": "event_id", "type": "string"},
                                {"internalType": "string", "name": "hash", "type": "string"}
                            ],
                            "name": "verifyEvent",
                            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                            "stateMutability": "view",
                            "type": "function"
                        }
                    ]
                
                self.contract = self.w3.eth.contract(address=SMART_CONTRACT_ADDRESS, abi=abi)
                logger.info("Smart contract initialized successfully.")
            else:
                logger.warning("SMART_CONTRACT_ADDRESS not provided.")
                
        except Exception as e:
            logger.error(f"Error initializing Blockchain client: {e}")

    def is_connected(self) -> bool:
        return self.w3.is_connected()

    def log_event(self, event_id: str, event_hash: str) -> str:
        """
        Calls logEvent(event_id, event_hash) on the smart contract.
        Returns the transaction hash.
        """
        if not self.contract:
            logger.warning("Simulating blockchain tx (Smart contract not connected)")
            return "0xsimulated" + os.urandom(16).hex()
            
        # Ensure '0x' prefix for hash storage depending on exactly what the contract expects.
        # But instructions said string. We pass the hex string directly.
        try:
            tx = self.contract.functions.logEvent(event_id, event_hash).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 2000000, 
                'gasPrice': self.w3.eth.gas_price,
                'chainId': CHAIN_ID
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=WALLET_PRIVATE_KEY)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            return receipt.transactionHash.hex()
            
        except Exception as e:
            logger.error(f"Error executing logEvent: {e}")
            raise

    def verify_event(self, event_id: str, event_hash: str) -> bool:
        """
        Calls verifyEvent(event_id, hash) on the smart contract.
        """
        if not self.contract:
            # MVP simulation when contract isn't deployed yet
            return True
        try:
            return self.contract.functions.verifyEvent(event_id, event_hash).call()
        except Exception as e:
            logger.error(f"Error executing verifyEvent: {e}")
            raise

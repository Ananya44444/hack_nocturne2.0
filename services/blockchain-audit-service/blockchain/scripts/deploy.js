const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying AuditLogger contract...");

  const AuditLogger = await hre.ethers.getContractFactory("AuditLogger");
  const auditLogger = await AuditLogger.deploy();

  await auditLogger.waitForDeployment();
  const address = await auditLogger.getAddress();

  console.log("AuditLogger deployed to:", address);

  // Write the contract address to the Python backend's .env file
  const envPath = path.resolve(__dirname, "../../.env");
  
  let envContent = "";
  if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update or append SMART_CONTRACT_ADDRESS
  if (envContent.includes('SMART_CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(/SMART_CONTRACT_ADDRESS=.*/g, `SMART_CONTRACT_ADDRESS=${address}`);
  } else {
      envContent += `\nSMART_CONTRACT_ADDRESS=${address}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`Updated ../../.env with SMART_CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


const sql = require("mssql");
require("dotenv").config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false
  },
  authentication: {
    type: "azure-active-directory-default",
    options: {}
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
};

async function connectDB() {
  try {
    await sql.connect(config);
    console.log("✅ Azure SQL Database Connected Successfully");
  
  } catch (error) {
    console.error("❌ Azure Database Connection Failed:");
    console.dir(error, { depth: 6 });
    console.error("Error name:", error?.name);
    console.error("Error message:", JSON.stringify(error?.message));
    console.error("Error stack:", error?.stack);
    throw error;
  }

}

module.exports = {
  sql,
  config,
  connectDB
};

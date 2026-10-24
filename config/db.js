const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function connectDB() {
  try {
    await sql.connect(config);
    console.log("✅ SQL Server Connected Successfully");
  } catch (error) {
    console.error("❌ Database Connection Failed:");
    console.error(error.message);
  }
}

module.exports = {
  sql,
  config,
  connectDB
};
// const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration
const db = new Pool({
    connectionString: process.env.POSTGRES_URL ,
});

module.exports = db;
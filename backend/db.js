const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Railway MySQL thường yêu cầu SSL
  ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false 
    } : false
});

pool.getConnection((err, conn) => {
  if (err) {
    console.error('[MySQL] connect error:', err.code, err.message);
  } else {
    conn.release();
    console.log('[MySQL] pool ready');
  }
});

module.exports = pool.promise();
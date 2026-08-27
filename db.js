require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mysql = require('mysql2');

const db = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'asistencia_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Error conectando a MySQL:', err.message);
        return;
    }
    console.log(`Conectado exitosamente a la base de datos MySQL (${process.env.DB_NAME || 'asistencia_db'}).`);
    connection.release();
});

module.exports = db;

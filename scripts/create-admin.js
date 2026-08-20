// Crea (o actualiza) el usuario administrador inicial a partir de las
// variables ADMIN_NOMBRE / ADMIN_CORREO / ADMIN_PASSWORD del .env.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const db = require('../db');

const nombre = process.env.ADMIN_NOMBRE || 'Administrador';
const correo = process.env.ADMIN_CORREO;
const password = process.env.ADMIN_PASSWORD;

if (!correo || !password) {
    console.error('Define ADMIN_CORREO y ADMIN_PASSWORD en tu .env antes de ejecutar este script.');
    process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
    const sql = `INSERT INTO usuarios (nombre, correo, password, rol, estado)
                 VALUES (?, ?, ?, 'admin', 'Activo')
                 ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), password = VALUES(password), rol = 'admin'`;
    db.query(sql, [nombre, correo, hash], (err) => {
        if (err) {
            console.error('Error creando el administrador:', err.message);
            process.exit(1);
        }
        console.log(`Administrador listo: ${correo}`);
        process.exit(0);
    });
});

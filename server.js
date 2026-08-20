// ============================================================
// SISTEMA DE REGISTRO DE ASISTENCIA — Servidor Backend
// ============================================================

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const db = require('./db');
const { esAtraso, esSalidaAnticipada, validarUsuario } = require('./lib/asistencia');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('Falta JWT_SECRET en las variables de entorno (.env). El servidor no puede arrancar de forma segura.');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.redirect('/html/index.html');
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' }
});

/* ==========================================================
   AUTENTICACIÓN
   ========================================================== */
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No autorizado. Inicia sesión.' });

    jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (err) return res.status(401).json({ error: 'Sesión inválida o expirada. Inicia sesión de nuevo.' });
        req.user = payload;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (req.user?.rol !== 'admin') return res.status(403).json({ error: 'No tienes permisos de administrador.' });
    next();
}

function signUser(user) {
    return jwt.sign(
        { id: user.id, rol: user.rol, nombre: user.nombre, correo: user.correo },
        JWT_SECRET,
        { expiresIn: '8h' }
    );
}

// mysql2 puede entregar errores de conexión sin "message" (p. ej. si el
// servidor de MySQL no está disponible), así que siempre dejamos algo
// legible para el cliente y el detalle real en la consola del servidor.
function errorDB(res, err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Error de conexión con la base de datos.' });
}

// CA-01: los usuarios entran con correo y contraseña.
app.post('/api/login', authLimiter, (req, res) => {
    const { correo, password } = req.body;
    if (!correo || !password) return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });

    const sql = 'SELECT id, nombre, correo, password, rol, estado FROM usuarios WHERE correo = ?';
    db.query(sql, [correo], async (err, results) => {
        if (err) return errorDB(res, err);
        if (results.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas.' });

        const row = results[0];
        if (row.estado === 'Inactivo') return res.status(403).json({ error: 'Usuario inactivo. Contacta al administrador.' });

        const ok = await bcrypt.compare(password, row.password);
        if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas.' });

        const user = { id: row.id, rol: row.rol, nombre: row.nombre, correo: row.correo };
        res.json({ ...user, token: signUser(user) });
    });
});

app.get('/api/me', verifyToken, (req, res) => {
    res.json(req.user);
});

/* ==========================================================
   CA-01: MARCAR ENTRADA / SALIDA
   ========================================================== */
app.post('/api/asistencia/marcar', verifyToken, (req, res) => {
    const { accion } = req.body;
    if (accion !== 'entrada' && accion !== 'salida') {
        return res.status(400).json({ error: 'La acción debe ser "entrada" o "salida".' });
    }

    const ahora = new Date();
    const fecha = ahora.toISOString().slice(0, 10);
    const hora = ahora.toTimeString().slice(0, 8);

    db.query('SELECT * FROM asistencias WHERE usuario_id = ? AND fecha = ?', [req.user.id, fecha], (err, results) => {
        if (err) return errorDB(res, err);
        const registro = results[0];

        if (accion === 'entrada') {
            if (registro && registro.hora_entrada) {
                return res.status(400).json({ error: 'Ya registraste tu entrada hoy.' });
            }
            const sql = registro
                ? 'UPDATE asistencias SET hora_entrada = ? WHERE id = ?'
                : 'INSERT INTO asistencias (usuario_id, fecha, hora_entrada) VALUES (?, ?, ?)';
            const params = registro ? [hora, registro.id] : [req.user.id, fecha, hora];
            db.query(sql, params, (err) => {
                if (err) return errorDB(res, err);
                res.json({ mensaje: 'Entrada registrada.', fecha, hora, atraso: esAtraso(hora) });
            });
            return;
        }

        if (!registro || !registro.hora_entrada) {
            return res.status(400).json({ error: 'Debes registrar tu entrada antes de marcar la salida.' });
        }
        if (registro.hora_salida) {
            return res.status(400).json({ error: 'Ya registraste tu salida hoy.' });
        }
        db.query('UPDATE asistencias SET hora_salida = ? WHERE id = ?', [hora, registro.id], (err) => {
            if (err) return errorDB(res, err);
            res.json({ mensaje: 'Salida registrada.', fecha, hora, salidaAnticipada: esSalidaAnticipada(hora) });
        });
    });
});

app.get('/api/asistencia/me', verifyToken, (req, res) => {
    const sql = 'SELECT fecha, hora_entrada, hora_salida FROM asistencias WHERE usuario_id = ? ORDER BY fecha DESC LIMIT 30';
    db.query(sql, [req.user.id], (err, results) => {
        if (err) return errorDB(res, err);
        res.json(results);
    });
});

/* ==========================================================
   GU-01 / GU-02 / GU-03: GESTIÓN DE USUARIOS (solo admin)
   ========================================================== */
app.get('/api/usuarios', verifyToken, requireAdmin, (req, res) => {
    db.query('SELECT id, nombre, correo, rol, estado, creado_en FROM usuarios ORDER BY id', (err, results) => {
        if (err) return errorDB(res, err);
        res.json(results);
    });
});

app.post('/api/usuarios', verifyToken, requireAdmin, async (req, res) => {
    const { nombre, correo, password, rol, estado } = req.body;
    const errores = validarUsuario({ nombre, correo, password });
    if (errores.length) return res.status(400).json({ error: errores.join(' ') });

    try {
        const hash = await bcrypt.hash(password, 10);
        const rolFinal = rol === 'admin' ? 'admin' : 'empleado';
        const estadoFinal = estado === 'Inactivo' ? 'Inactivo' : 'Activo';
        const sql = 'INSERT INTO usuarios (nombre, correo, password, rol, estado) VALUES (?, ?, ?, ?, ?)';
        db.query(sql, [nombre, correo, hash, rolFinal, estadoFinal], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'El correo ya está registrado.' });
                return errorDB(res, err);
            }
            res.status(201).json({ id: result.insertId, nombre, correo, rol: rolFinal, estado: estadoFinal });
        });
    } catch (err) {
        errorDB(res, err);
    }
});

app.put('/api/usuarios/:id', verifyToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { nombre, correo, password, rol, estado } = req.body;
    const errores = validarUsuario({ nombre, correo, password });
    if (errores.length) return res.status(400).json({ error: errores.join(' ') });

    const rolFinal = rol === 'admin' ? 'admin' : 'empleado';
    const estadoFinal = estado === 'Inactivo' ? 'Inactivo' : 'Activo';

    try {
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            db.query('UPDATE usuarios SET nombre=?, correo=?, rol=?, estado=?, password=? WHERE id=?',
                [nombre, correo, rolFinal, estadoFinal, hash, id], (err) => {
                    if (err) return errorDB(res, err);
                    res.json({ mensaje: 'Usuario actualizado.' });
                });
        } else {
            db.query('UPDATE usuarios SET nombre=?, correo=?, rol=?, estado=? WHERE id=?',
                [nombre, correo, rolFinal, estadoFinal, id], (err) => {
                    if (err) return errorDB(res, err);
                    res.json({ mensaje: 'Usuario actualizado.' });
                });
        }
    } catch (err) {
        errorDB(res, err);
    }
});

app.delete('/api/usuarios/:id', verifyToken, requireAdmin, (req, res) => {
    db.query('DELETE FROM usuarios WHERE id = ?', [req.params.id], (err) => {
        if (err) return errorDB(res, err);
        res.json({ mensaje: 'Usuario eliminado.' });
    });
});

/* ==========================================================
   RE-01 / RE-02 / RE-03: REPORTES (solo admin)
   ========================================================== */
app.get('/api/reportes/atrasos', verifyToken, requireAdmin, (req, res) => {
    const sql = `SELECT u.id AS usuario_id, u.nombre, a.fecha, a.hora_entrada
                 FROM asistencias a JOIN usuarios u ON u.id = a.usuario_id
                 WHERE a.hora_entrada > '09:30:00'
                 ORDER BY a.fecha DESC`;
    db.query(sql, (err, results) => {
        if (err) return errorDB(res, err);
        res.json(results);
    });
});

app.get('/api/reportes/salidas-anticipadas', verifyToken, requireAdmin, (req, res) => {
    const sql = `SELECT u.id AS usuario_id, u.nombre, a.fecha, a.hora_salida
                 FROM asistencias a JOIN usuarios u ON u.id = a.usuario_id
                 WHERE a.hora_salida IS NOT NULL AND a.hora_salida < '17:30:00'
                 ORDER BY a.fecha DESC`;
    db.query(sql, (err, results) => {
        if (err) return errorDB(res, err);
        res.json(results);
    });
});

app.get('/api/reportes/inasistencias', verifyToken, requireAdmin, (req, res) => {
    const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);
    const sql = `SELECT u.id AS usuario_id, u.nombre
                 FROM usuarios u
                 WHERE u.rol = 'empleado' AND u.estado = 'Activo'
                 AND u.id NOT IN (
                     SELECT usuario_id FROM asistencias
                     WHERE fecha = ? AND hora_entrada IS NOT NULL AND hora_salida IS NOT NULL
                 )
                 ORDER BY u.nombre`;
    db.query(sql, [fecha], (err, results) => {
        if (err) return errorDB(res, err);
        res.json({ fecha, empleados: results });
    });
});

/* ==========================================================
   AP-01: API REST pública de empleados
   ========================================================== */
app.get('/api/empleados', (req, res) => {
    const estado = req.query.estado;
    let sql = "SELECT id, nombre, correo, estado FROM usuarios WHERE rol = 'empleado'";
    const params = [];
    if (estado === 'Activo' || estado === 'Inactivo') {
        sql += ' AND estado = ?';
        params.push(estado);
    }
    db.query(sql, params, (err, results) => {
        if (err) return errorDB(res, err);
        res.json(results);
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto: ${PORT}`);
});

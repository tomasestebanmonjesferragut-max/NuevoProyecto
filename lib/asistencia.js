// Reglas de negocio puras (sin base de datos) para poder probarlas por separado.

const HORA_LIMITE_ENTRADA = '09:30:00';
const HORA_LIMITE_SALIDA = '17:30:00';

function esAtraso(horaEntrada) {
    return horaEntrada > HORA_LIMITE_ENTRADA;
}

function esSalidaAnticipada(horaSalida) {
    return horaSalida < HORA_LIMITE_SALIDA;
}

function validarUsuario({ nombre, correo, password }) {
    const errores = [];
    if (!nombre || !nombre.trim()) errores.push('El nombre es obligatorio.');
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) errores.push('El correo no es válido.');
    if (password !== undefined && password.length < 6) errores.push('La contraseña debe tener al menos 6 caracteres.');
    return errores;
}

module.exports = { HORA_LIMITE_ENTRADA, HORA_LIMITE_SALIDA, esAtraso, esSalidaAnticipada, validarUsuario };

const test = require('node:test');
const assert = require('node:assert/strict');
const { esAtraso, esSalidaAnticipada, validarUsuario } = require('../lib/asistencia');

test('esAtraso: entrada después de las 09:30 se marca como atraso', () => {
    assert.equal(esAtraso('09:31:00'), true);
});

test('esAtraso: entrada a las 09:30 en punto no se marca como atraso', () => {
    assert.equal(esAtraso('09:30:00'), false);
});

test('esAtraso: entrada antes de las 09:30 no se marca como atraso', () => {
    assert.equal(esAtraso('08:59:00'), false);
});

test('esSalidaAnticipada: salida antes de las 17:30 se marca como anticipada', () => {
    assert.equal(esSalidaAnticipada('17:00:00'), true);
});

test('esSalidaAnticipada: salida a las 17:30 en punto no es anticipada', () => {
    assert.equal(esSalidaAnticipada('17:30:00'), false);
});

test('validarUsuario: rechaza correo inválido', () => {
    const errores = validarUsuario({ nombre: 'Ana', correo: 'no-es-un-correo', password: '123456' });
    assert.ok(errores.length > 0);
});

test('validarUsuario: rechaza contraseña muy corta', () => {
    const errores = validarUsuario({ nombre: 'Ana', correo: 'ana@empresa.cl', password: '123' });
    assert.ok(errores.length > 0);
});

test('validarUsuario: acepta datos válidos', () => {
    const errores = validarUsuario({ nombre: 'Ana', correo: 'ana@empresa.cl', password: '123456' });
    assert.deepEqual(errores, []);
});

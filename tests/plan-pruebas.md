# Plan de pruebas unitarias

Requisito relacionado entre paréntesis. Pruebas ejecutables en `unit.test.js` (`npm test`).

| # | Caso de prueba | Entrada | Resultado esperado |
|---|---|---|---|
| 1 | Entrada después de las 09:30 (RE-01) | `esAtraso('09:31:00')` | `true` |
| 2 | Entrada justo a las 09:30 (RE-01) | `esAtraso('09:30:00')` | `false` |
| 3 | Entrada antes de las 09:30 (RE-01) | `esAtraso('08:59:00')` | `false` |
| 4 | Salida antes de las 17:30 (RE-02) | `esSalidaAnticipada('17:00:00')` | `true` |
| 5 | Salida justo a las 17:30 (RE-02) | `esSalidaAnticipada('17:30:00')` | `false` |
| 6 | Correo inválido al crear/editar usuario (GU-01/GU-02) | `validarUsuario({ correo: 'no-es-un-correo', ... })` | Lista de errores no vacía |
| 7 | Contraseña muy corta (GU-01/GU-02) | `validarUsuario({ password: '123', ... })` | Lista de errores no vacía |
| 8 | Usuario con datos válidos (GU-01/GU-02) | `validarUsuario({ nombre, correo, password: '123456' })` | Lista de errores vacía |

## Pruebas manuales (requieren servidor + base de datos)

| # | Caso de prueba | Pasos | Resultado esperado |
|---|---|---|---|
| 9 | Login correcto (CA-01) | Ingresar correo/contraseña válidos | Redirige según el rol del usuario |
| 10 | Login incorrecto (CA-01) | Ingresar contraseña errónea | Mensaje "Credenciales incorrectas" |
| 11 | Marcar entrada dos veces el mismo día (CA-01) | Marcar entrada, volver a marcar entrada | Mensaje "Ya registraste tu entrada hoy" |
| 12 | Marcar salida sin entrada (CA-01) | Marcar salida sin haber marcado entrada | Mensaje de error, no se guarda registro |
| 13 | Crear usuario (GU-01) | Completar formulario y guardar | El usuario aparece en la tabla |
| 14 | Eliminar usuario (GU-03) | Presionar "Eliminar" y confirmar | El usuario desaparece de la tabla |
| 15 | API pública de empleados (AP-01) | `GET /api/empleados?estado=Activo` | Devuelve solo empleados activos, sin exponer la contraseña |

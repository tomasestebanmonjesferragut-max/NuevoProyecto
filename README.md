# Sistema de Registro de Asistencia (MVP)

Aplicación web para que una empresa gestione la entrada y salida de sus
trabajadores: los empleados marcan su asistencia y el administrador gestiona
usuarios y revisa reportes de atrasos, salidas anticipadas e inasistencias.

## Requerimientos cubiertos

- **CA-01** — Login con correo/contraseña y marcado de entrada/salida.
- **RE-01 / RE-02 / RE-03** — Reportes de atrasos, salidas anticipadas e inasistencias.
- **GU-01 / GU-02 / GU-03** — Crear, modificar y eliminar usuarios.
- **AP-01** — API REST pública `GET /api/empleados?estado=Activo|Inactivo` para plataformas externas.

## Instalación

```bash
npm install
```

1. Crea la base de datos ejecutando `data/database.sql` en tu MySQL local.
2. Copia `.env.example` a `.env` y completa tus credenciales de MySQL y un `JWT_SECRET`.
3. Crea el usuario administrador inicial (usa `ADMIN_CORREO`/`ADMIN_PASSWORD` del `.env`):

```bash
npm run create-admin
```

4. Inicia el servidor:

```bash
npm start
```

5. Abre `http://localhost:3000`.

## Pruebas

```bash
npm test
```

Ver [tests/plan-pruebas.md](tests/plan-pruebas.md) para el detalle de casos cubiertos.

## Estructura

```
server.js          Rutas de la API (Express)
db.js               Conexión a MySQL
lib/asistencia.js   Reglas de negocio puras (atrasos, salidas, validaciones)
data/database.sql   Script de creación de la base de datos
scripts/            Script para crear el usuario administrador
public/             Frontend (HTML/CSS/JS sin frameworks)
tests/              Pruebas unitarias y plan de pruebas
```

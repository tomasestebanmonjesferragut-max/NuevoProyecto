-- Script de creación de base de datos: Sistema de Registro de Asistencia
-- Caso: empresa de 25 trabajadores (compra y venta de productos químicos)

CREATE DATABASE IF NOT EXISTS asistencia_db;
USE asistencia_db;

-- CA-01 / GU-01 / GU-02 / GU-03: usuarios que ingresan al sistema y son
-- administrados por el rol admin.
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'empleado') NOT NULL DEFAULT 'empleado',
    estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CA-01: un registro por usuario y día, con hora de entrada y salida.
-- RE-01 / RE-02 / RE-03: base para los reportes de atrasos, salidas
-- anticipadas e inasistencias.
CREATE TABLE IF NOT EXISTS asistencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora_entrada TIME NULL,
    hora_salida TIME NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unico_usuario_fecha (usuario_id, fecha)
);

-- Drop tables if they exist
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS solicitudes CASCADE;
DROP TABLE IF EXISTS notificaciones CASCADE;

-- Create usuarios table
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    departamento VARCHAR(255),
    rol VARCHAR(50) NOT NULL DEFAULT 'user',
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create solicitudes table
CREATE TABLE solicitudes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    tipo VARCHAR(50) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    fecha_inicio DATE,
    fecha_fin DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create notificaciones table
CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create admin user
INSERT INTO usuarios (nombre, email, password, rol, activo)
VALUES ('Admin', 'admin@example.com', 'admin123', 'admin', true);

-- Create normal user
INSERT INTO usuarios (nombre, email, password, departamento, rol, activo)
VALUES ('Usuario Normal', 'usuario@ejemplo.com', 'usuario123', 'Ventas', 'user', true);

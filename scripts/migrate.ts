import { query } from "../lib/db"

async function migrate() {
  try {
    // Crear tabla de usuarios
    await query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        departamento VARCHAR(50),
        rol VARCHAR(20) NOT NULL DEFAULT 'user',
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log("Tabla usuarios creada o ya existente")

    // Crear tabla de solicitudes
    await query(`
      CREATE TABLE IF NOT EXISTS solicitudes (
        id SERIAL PRIMARY KEY,
        numero_expediente VARCHAR(20) UNIQUE NOT NULL,
        usuario_id INTEGER REFERENCES usuarios(id),
        tipo VARCHAR(50) NOT NULL,
        motivo TEXT,
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE NOT NULL,
        estado VARCHAR(20) DEFAULT 'pendiente',
        comentarios TEXT,
        fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log("Tabla solicitudes creada o ya existente")

    // Crear tabla de notificaciones
    await query(`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        titulo VARCHAR(100) NOT NULL,
        mensaje TEXT NOT NULL,
        leida BOOLEAN DEFAULT FALSE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log("Tabla notificaciones creada o ya existente")

    // Crear función para generar número de expediente
    await query(`
      CREATE OR REPLACE FUNCTION generar_numero_expediente()
      RETURNS TRIGGER AS $$
      DECLARE
        anio TEXT;
        ultimo_numero INTEGER;
        nuevo_expediente TEXT;
      BEGIN
        anio := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
        
        -- Obtener el último número de expediente para este año
        SELECT COALESCE(MAX(CAST(SUBSTRING(numero_expediente FROM 9) AS INTEGER)), 0)
        INTO ultimo_numero
        FROM solicitudes
        WHERE numero_expediente LIKE 'EXP-' || anio || '-%';
        
        -- Generar el nuevo número de expediente
        nuevo_expediente := 'EXP-' || anio || '-' || LPAD((ultimo_numero + 1)::TEXT, 3, '0');
        
        -- Asignar el nuevo número de expediente
        NEW.numero_expediente := nuevo_expediente;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)
    console.log("Función generar_numero_expediente creada o actualizada")

    // Crear trigger para asignar número de expediente
    await query(`
      DROP TRIGGER IF EXISTS asignar_numero_expediente ON solicitudes;
      CREATE TRIGGER asignar_numero_expediente
      BEFORE INSERT ON solicitudes
      FOR EACH ROW
      EXECUTE FUNCTION generar_numero_expediente();
    `)
    console.log("Trigger asignar_numero_expediente creado o actualizado")

    // Insertar usuarios de prueba si no existen
    const adminExists = await query("SELECT * FROM usuarios WHERE email = $1", ["admin@ejemplo.com"])
    if (adminExists.rowCount === 0) {
      // En una aplicación real, hashearías la contraseña con bcrypt
      await query("INSERT INTO usuarios (nombre, email, password, departamento, rol) VALUES ($1, $2, $3, $4, $5)", [
        "Administrador",
        "admin@ejemplo.com",
        "admin123",
        "IT",
        "admin",
      ])
      console.log("Usuario administrador creado")
    }

    const userExists = await query("SELECT * FROM usuarios WHERE email = $1", ["usuario@ejemplo.com"])
    if (userExists.rowCount === 0) {
      await query("INSERT INTO usuarios (nombre, email, password, departamento, rol) VALUES ($1, $2, $3, $4, $5)", [
        "Usuario Normal",
        "usuario@ejemplo.com",
        "usuario123",
        "Ventas",
        "user",
      ])
      console.log("Usuario normal creado")
    }

    console.log("Migración completada con éxito")
  } catch (error) {
    console.error("Error durante la migración:", error)
  }
}

migrate()

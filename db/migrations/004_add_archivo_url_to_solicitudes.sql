-- Agregar columna archivo_url a la tabla solicitudes
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS archivo_url TEXT;

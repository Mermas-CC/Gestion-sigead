-- SQL script to update the solicitudes table structure
-- This script is idempotent and can be run multiple times safely

-- Verify if columns exist and add them if not
DO $$
BEGIN
    -- Add celular if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'solicitudes' AND column_name = 'celular') THEN
        ALTER TABLE solicitudes ADD COLUMN celular VARCHAR(20);
    END IF;

    -- Add correo if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'solicitudes' AND column_name = 'correo') THEN
        ALTER TABLE solicitudes ADD COLUMN correo VARCHAR(255);
    END IF;

    -- Add cargo if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'solicitudes' AND column_name = 'cargo') THEN
        ALTER TABLE solicitudes ADD COLUMN cargo VARCHAR(255);
    END IF;

    -- Add institucion if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'solicitudes' AND column_name = 'institucion') THEN
        ALTER TABLE solicitudes ADD COLUMN institucion VARCHAR(255);
    END IF;

    -- Add goce_remuneraciones if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'solicitudes' AND column_name = 'goce_remuneraciones') THEN
        ALTER TABLE solicitudes ADD COLUMN goce_remuneraciones BOOLEAN DEFAULT false;
    END IF;

    -- Add comentarios if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'solicitudes' AND column_name = 'comentarios') THEN
        ALTER TABLE solicitudes ADD COLUMN comentarios TEXT;
    END IF;

    -- Add numero_expediente if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'solicitudes' AND column_name = 'numero_expediente') THEN
        ALTER TABLE solicitudes ADD COLUMN numero_expediente VARCHAR(50);
    END IF;
END$$;

-- Update any null values with defaults before adding NOT NULL constraints
UPDATE solicitudes SET celular = '' WHERE celular IS NULL;
UPDATE solicitudes SET correo = '' WHERE correo IS NULL;
UPDATE solicitudes SET cargo = '' WHERE cargo IS NULL;
UPDATE solicitudes SET institucion = '' WHERE institucion IS NULL;
UPDATE solicitudes SET goce_remuneraciones = false WHERE goce_remuneraciones IS NULL;
UPDATE solicitudes SET numero_expediente = CONCAT('EXP-LEGACY-', id) WHERE numero_expediente IS NULL;

-- Ensure required fields are not null
ALTER TABLE solicitudes
    ALTER COLUMN celular SET NOT NULL,
    ALTER COLUMN correo SET NOT NULL,
    ALTER COLUMN cargo SET NOT NULL,
    ALTER COLUMN institucion SET NOT NULL,
    ALTER COLUMN goce_remuneraciones SET NOT NULL,
    ALTER COLUMN numero_expediente SET NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON solicitudes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solicitudes_expediente ON solicitudes(numero_expediente);
CREATE INDEX IF NOT EXISTS idx_solicitudes_usuario ON solicitudes(usuario_id);


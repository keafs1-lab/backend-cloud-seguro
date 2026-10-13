-- Execute uma vez no banco PostgreSQL existente, antes de iniciar a versão nova.
-- A tabela padrão criada pelo Sequelize para o modelo Usuario é "Usuarios".
ALTER TABLE "Usuarios"
  ADD COLUMN IF NOT EXISTS "role" VARCHAR(20) NOT NULL DEFAULT 'user';

-- Restrição para aceitar somente funções conhecidas.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_role_check'
  ) THEN
    ALTER TABLE "Usuarios"
      ADD CONSTRAINT usuarios_role_check CHECK ("role" IN ('user', 'admin'));
  END IF;
END $$;

-- IMPORTANTE: promova manualmente uma conta confiável a administrador após cadastrar-se.
-- Substitua o e-mail pelo seu e execute apenas após conferir o registro:
-- UPDATE "Usuarios" SET "role" = 'admin' WHERE "email" = 'seu-email@example.com';

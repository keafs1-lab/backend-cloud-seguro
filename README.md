# backend-cloud

API REST de usuários usando Node.js, Express, Sequelize e PostgreSQL, com proteções básicas de segurança.

## Requisitos

- Node.js 20 ou superior
- PostgreSQL acessível pela aplicação
- Uma URL de conexão guardada em variável de ambiente

## Configuração local

1. Instale as dependências:

   ```bash
   npm install


3. Configure `DATABASE_URL` para seu PostgreSQL. SSL e validação do certificado são ativados por padrão. Só use `DATABASE_SSL=false` em um banco local isolado. Não desative a validação do certificado em produção.

5. Inicie a API:

   ```bash
   npm start
   ```

A aplicação não cria tabelas automaticamente. Gerencie o schema com migrations controladas.
2. Instale as dependências e inicie o frontend:

   ```bash
   npm --prefix frontend install
   npm --prefix frontend run dev
   ```
O token expira em 15 minutos por padrão. Faça login novamente quando expirar. Não há refresh token nesta versão.
Não existe endpoint público para alterar `role`; isso evita que um usuário se promova a administrador.

## Proteções incluídas

- Hash de senhas com bcrypt (12 rounds), aplicado por hooks do modelo ao criar ou alterar a senha.
- JWT assinado com HS256 e segredo externo ao código.
- Autenticação e autorização por função e propriedade do registro.
- Validação de entradas com Zod e rejeição de campos inesperados.
- Respostas de erro genéricas e logging sem retornar mensagens internas do banco ao cliente.
- Helmet, limite de tamanho de JSON, CORS por lista de origens e rate limiting geral/de login.
- SSL PostgreSQL e validação do certificado ativados por padrão.
- `x-powered-by` desativado e dependências declaradas no `package.json`.

## Limitações e próximos passos

Estas proteções não substituem uma auditoria ou teste de segurança. Para produção, configure HTTPS no provedor, monitore dependências (`npm audit`), backups, logs e alertas. Considere MFA para administradores, rotação/revogação de tokens, testes automatizados, política de senhas e proteção contra abuso distribuído. O limitador em memória não compartilha contadores entre múltiplas instâncias/serverless; use um armazenamento compartilhado (por exemplo Redis) quando necessário.

Se a aplicação já armazenou senhas em texto puro, a migration não as transforma automaticamente em hashes. Não mantenha essas senhas em produção: force redefinição de senha ou execute um processo de migração cuidadosamente planejado. Não tente aplicar bcrypt duas vezes a hashes existentes.

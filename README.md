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
   ```

2. Copie `.env.example` para `.env` e edite os valores. Gere o segredo JWT com:

   ```bash
   openssl rand -base64 48
   ```

   Coloque o resultado em `JWT_SECRET`. Nunca envie o `.env` para o Git.

3. Configure `DATABASE_URL` para seu PostgreSQL. SSL e validação do certificado são ativados por padrão. Só use `DATABASE_SSL=false` em um banco local isolado. Não desative a validação do certificado em produção.

4. Para um banco existente, execute `migrations/001_add_role.sql` uma única vez. Faça backup antes de qualquer alteração de banco. Se a tabela tiver outro nome ou estrutura, adapte a migration após verificar o schema.

5. Inicie a API:

   ```bash
   npm start
   ```

6. Confira a sintaxe:

   ```bash
   npm run check
   ```

A aplicação não cria tabelas automaticamente. Gerencie o schema com migrations controladas.

## Frontend

O frontend React/Vite fica na pasta `frontend/` e pode ser executado ou publicado separadamente da API.

1. Defina `VITE_API_URL` em `frontend/.env.local` com a URL pública da API, sem barra no final:

   ```env
   VITE_API_URL=https://seu-backend.vercel.app
   ```

2. Instale as dependências e inicie o frontend:

   ```bash
   npm --prefix frontend install
   npm --prefix frontend run dev
   ```

3. Para publicar o frontend em um projeto Vercel separado, importe o mesmo repositório e defina `frontend` como Root Directory. Configure a variável `VITE_API_URL` nas variáveis de ambiente desse projeto e faça o deploy. O `frontend/vercel.json` encaminha rotas do app para o ponto de entrada da SPA.

4. No projeto Vercel da API, adicione o domínio publicado do frontend em `CORS_ORIGINS`. Essa variável aceita várias origens separadas por vírgula. Faça novo deploy da API após alterar a variável.

O token é mantido em `sessionStorage` somente na aba atual e removido ao sair. O frontend não oferece criação de administradores: novos cadastros seguem a regra da API e recebem o papel `user`.


Envie o token retornado no login em requisições protegidas:

```http
Authorization: Bearer SEU_TOKEN
```

O token expira em 15 minutos por padrão. Faça login novamente quando expirar. Não há refresh token nesta versão.

## Criar o primeiro administrador

1. Cadastre uma conta pela rota `POST /usuarios`.
2. Execute a migration de `role`.
3. No PostgreSQL, promova manualmente essa conta, substituindo o e-mail:

   ```sql
   UPDATE "Usuarios"
   SET "role" = 'admin'
   WHERE "email" = 'seu-email@example.com';
   ```

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

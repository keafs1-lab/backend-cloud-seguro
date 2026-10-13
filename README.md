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

## Rotas

| Método | Caminho | Acesso | Descrição |
|---|---|---|---|
| GET | `/` | Público | Verifica se o processo HTTP responde |
| GET | `/health` | Público | Verifica a conexão com o banco sem expor detalhes internos |
| POST | `/usuarios` | Público | Cadastra conta comum; senha com pelo menos 12 caracteres |
| POST | `/auth/login` | Público, com limite de tentativas | Valida credenciais e retorna JWT |
| GET | `/usuarios` | Administrador | Lista usuários sem incluir senhas |
| GET | `/usuarios/:id` | Próprio usuário ou administrador | Consulta um usuário |
| PUT | `/usuarios/:id` | Próprio usuário ou administrador | Altera nome, e-mail ou senha próprios; admin pode alterar qualquer conta |
| DELETE | `/usuarios/:id` | Administrador | Exclui um usuário |

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

## Exemplo de cadastro

`POST /usuarios` com `Content-Type: application/json`:

```json
{
  "nome": "Pessoa Exemplo",
  "email": "pessoa@example.com",
  "senha": "UmaSenhaForteCom12+"
}
```

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

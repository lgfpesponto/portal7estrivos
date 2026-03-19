

## Plano: Verificação por Código no Primeiro Login (Email ou SMS)

### Resumo

Após criar a conta, o usuário não entra automaticamente. No primeiro login, ele escolhe receber um código de verificação por **email** ou **SMS**. Digitando o código correto, a conta é verificada e ele entra. Nos logins seguintes, entra normalmente.

### Mudanças no Banco de Dados

1. **Adicionar coluna `verificado`** na tabela `profiles` (boolean, default `false`)
2. **Marcar usuários existentes como verificados** (UPDATE para `true` em todos os perfis atuais)
3. **Criar tabela `verification_codes`**:
   - `id` (uuid, PK)
   - `user_id` (uuid, FK para auth.users)
   - `code` (text, 6 dígitos)
   - `type` (text: 'email' ou 'sms')
   - `destination` (text: email ou telefone)
   - `expires_at` (timestamptz)
   - `created_at` (timestamptz)
   - RLS: usuários autenticados leem/inserem apenas os próprios códigos
4. **Habilitar auto-confirm** no Auth (para que os emails fictícios `@7estrivos.app` não bloqueiem o cadastro)

### Edge Functions

**`send-verification-code`** — Gera código de 6 dígitos, salva na tabela `verification_codes`, e envia:
- **Por email**: Usa a API do Lovable AI para montar o email e envia via infraestrutura de email do projeto (precisa configurar domínio de email)
- **Por SMS**: Usa o conector Twilio para enviar SMS ao telefone cadastrado

**`verify-code`** — Recebe `user_id` e `code`, valida contra a tabela, e se correto marca `profiles.verificado = true`

### Configuração Necessária

- **Para SMS**: Conectar o Twilio ao projeto (conector disponível)
- **Para Email**: Configurar domínio de email no projeto

### Frontend

1. **`src/pages/VerifyCodePage.tsx`** — Nova página com:
   - Dois botões: "Receber por Email" e "Receber por SMS"
   - Mostra email/telefone parcialmente mascarado (ex: `j***@email.com`, `(**) *****-1234`)
   - Input de 6 dígitos para digitar o código
   - Botão "Verificar" e "Reenviar código"

2. **`src/contexts/AuthContext.tsx`**:
   - No `login()`: após autenticar com sucesso, verificar se `profile.verificado === false`
   - Se não verificado, redirecionar para `/verificar` em vez de `/`
   - Adicionar `verificado` ao estado do usuário
   - Não carregar orders nem permitir navegação até verificar

3. **`src/App.tsx`**:
   - Adicionar rota `/verificar` → `VerifyCodePage`

4. **`src/pages/RegisterPage.tsx`**:
   - Após cadastro, redirecionar para `/login` com mensagem "Conta criada! Faça login para verificar."

### Fluxo Completo

```text
Cadastro → Login → Verificado? 
  ├─ SIM → Entra normalmente
  └─ NÃO → Tela de verificação
              ├─ Escolhe Email ou SMS
              ├─ Recebe código de 6 dígitos
              ├─ Digita o código
              └─ Verificado! → Entra no app
```

### Arquivos alterados/criados

| Arquivo | Ação |
|---|---|
| Migration SQL | Adicionar `verificado` em profiles + tabela `verification_codes` |
| Auth config | Habilitar auto-confirm email |
| `supabase/functions/send-verification-code/index.ts` | Nova edge function |
| `supabase/functions/verify-code/index.ts` | Nova edge function |
| `src/pages/VerifyCodePage.tsx` | Nova página de verificação |
| `src/contexts/AuthContext.tsx` | Checar verificação no login |
| `src/pages/RegisterPage.tsx` | Redirecionar para login após cadastro |
| `src/App.tsx` | Adicionar rota `/verificar` |

### Dependências externas

- **Twilio**: Precisa conectar para envio de SMS
- **Domínio de email**: Precisa configurar para envio de email


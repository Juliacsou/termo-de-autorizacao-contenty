# Contenty · Autorizações de Uso de Imagem

MVP v1.0 para criar projetos de gravação, compartilhar links com os participantes, coletar dados e assinaturas manuscritas em dispositivos móveis, preencher o **PDF original entregue pela Igreja** e exportar documentos individuais ou todos os PDFs em um ZIP.

## 1. O que está nesta versão

- **Painel privado:** login de 1 administrador, projetos, datas soltas ou períodos, edição, arquivamento, exclusão.
- **Links públicos:** `#/assinar/UUID`, sem login de participantes e sem expiração automática.
- **Assinatura:** formulário em três passos, leitura do termo original, aceite explícito, assinatura pelo dedo ou mouse.
- **Menores:** formulário do participante mais dados do responsável; somente o responsável legal assina.
- **Documentos:** preenchimento do PDF original com `pdf-lib`, download individual e ZIP completo (`JSZip`), sem armazenar PDFs gerados individualmente.
- **Gestão:** busca por participantes, filtro adultos/menores, CSV e notificações no painel (atualização a cada 20 segundos).
- **Segurança:** RLS bloqueia consultas anônimas, bucket de assinaturas privado, operações de participação e exclusão via Supabase Edge Functions.

### Arquivos relevantes

```text
src/App.jsx                              Telas e fluxos
src/style.css                            Estilização responsiva
src/pdf.js                               Gerador dos PDFs
src/supabase.js                          Cliente Supabase e funções
public/modelo-autorizacao.pdf            PDF da Igreja entregue à Contenty
supabase/migrations/001_inicial.sql      PRIMEIRO SQL para executar
supabase/migrations/002_admin_exemplo.sql SEGUNDO SQL após cadastrar o usuário
supabase/functions/public-autorizacao/index.ts   Operação pública de assinatura
supabase/functions/admin-autorizacao/index.ts    Exclusões administrativas protegidas
supabase/config.toml                     JWT desligado no gateway, autorizado dentro das funções
.github/workflows/deploy.yml             Publicação automatizada no GitHub Pages
.env.local                               URL e chave publicável recebidas (não versionar)
```

## 2. Criar as tabelas (Supabase)

1. Abra: https://supabase.com/dashboard/project/fslcdbmjwnhxmbjabnhs/sql/new
2. Cole o conteúdo de **`supabase/migrations/001_inicial.sql`**.
3. Clique **Run**. O script cria tabelas, gatilhos de notificação, RLS e bucket privado de assinaturas.
4. Em **Authentication → Users**, crie manualmente a conta do único administrador (**Add user**).
5. Execute o **`supabase/migrations/002_admin_exemplo.sql`** após trocar `SEU_EMAIL_AQUI@EXEMPLO.COM` pelo e-mail cadastrado.
6. Confira que a consulta final retornou exatamente **1 usuário**. O site não possui tela pública de cadastro de administradores.
7. Em **Authentication → Providers → Email**, desabilite novos cadastros públicos, caso esteja disponível como configuração de signup. Não desabilite login por e-mail/senha.

**Não compartilhe com terceiros** senha do usuário, senha do banco, chave `sb_secret_...` ou chave de serviço privilegiada.

## 3. Publicar as duas Edge Functions (obrigatório para coletar e excluir assinaturas)

### Opção A — Terminal com Supabase CLI (recomendada)

Instale Node.js 22 (ou uma versão recente compatível com Vite). Na pasta do projeto:

```bash
npx supabase login
npx supabase link --project-ref fslcdbmjwnhxmbjabnhs
npx supabase functions deploy public-autorizacao --no-verify-jwt
npx supabase functions deploy admin-autorizacao --no-verify-jwt
```

A configuração `verify_jwt = false` está no `supabase/config.toml`. **Ela não torna as exclusões públicas:** a função `admin-autorizacao` valida o JWT do usuário e sua presença na tabela `admin_users`; a função pública só permite leitura do projeto pelo token e criação de autorizações validadas.

### Opção B — Supabase Dashboard

1. Acesse **Edge Functions** no projeto Supabase.
2. Crie a função `public-autorizacao` e use o código em `supabase/functions/public-autorizacao/index.ts`.
3. Crie a função `admin-autorizacao` com o código em `supabase/functions/admin-autorizacao/index.ts`.
4. Desative a **verificação JWT legada / Verify JWT** **para ambas**. As funções implementam suas próprias regras de autenticação.
5. Faça o deploy e confirme que ambas aparecem como ativas.

> As Edge Functions utilizam as credenciais secretas **fornecidas automaticamente pelo ambiente de funções do Supabase** (SDK `@supabase/server`). Jamais coloque uma chave secreta no frontend.

## 4. Rodar no computador

Requisitos: Node.js 20.19+ (preferencialmente 22), npm.

```bash
npm install
npm run dev
```

Abra o endereço exibido no terminal (normalmente `http://localhost:5173/`). O arquivo `.env.local` já contém a URL e a chave **publicável** fornecidas para este projeto. O arquivo está no `.gitignore`.

Não será possível entrar antes de executar os dois SQLs e criar o usuário no Supabase. Não será possível salvar assinaturas antes do deploy de `public-autorizacao`.

## 5. Sequência de teste funcional

1. Faça login como administrador.
2. Crie projeto com nome, local e uma data; crie outro projeto com dois dias distintos.
3. Copie o link de um projeto e abra em uma janela anônima do navegador.
4. Preencha os dados de um participante adulto, leia o PDF, aceite, assine e envie.
5. Faça o mesmo como menor de idade, preenchendo o responsável e assinando como responsável.
6. Retorne ao painel, confirme as notificações e visualize a lista de participantes.
7. Baixe um PDF individual e confira posicionamento e legibilidade de todos os campos.
8. Baixe o ZIP e o CSV; confira nome e quantidade de arquivos.
9. Teste arquivar/desarquivar, editar o projeto e sua exclusão. Lembre-se que exclusões são irreversíveis.
10. Repita assinatura num celular real (Android e iOS, se possível).

## 6. Publicar no GitHub Pages

A estrutura já inclui um workflow para publicar ao enviar commits para a branch `main`.

1. Envie os arquivos do ZIP para a **raiz** do repositório GitHub vazio (incluindo `.github`). **Não envie** `node_modules` ou `.env.local`.
2. Em **Settings → Secrets and variables → Actions → Variables**, crie:
   - `VITE_SUPABASE_URL` = `https://fslcdbmjwnhxmbjabnhs.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = a chave `sb_publishable_...` informada ao projeto.
   - `VITE_BASE_PATH` = **não crie** enquanto usar a URL `usuario.github.io/repositorio/`. Quando passar a publicar no domínio personalizado, configure `/`.
3. Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**.
4. Faça push na branch `main`, acompanhe a aba **Actions** e abra a URL exibida no deployment.
5. No Supabase **Authentication → URL Configuration**, defina o **Site URL** e as **Redirect URLs** autorizadas, incluindo a URL pública do GitHub Pages e posteriormente o domínio personalizado. Para recuperação de senha local, adicione também `http://localhost:5173/**`.
6. Quando configurar o domínio, registre-o em **Settings → Pages → Custom domain**, ajuste o DNS no provedor e defina `VITE_BASE_PATH=/`. Verifique HTTPS no GitHub Pages.

## 7. Segurança, limitações e próximos ajustes

- **Não confundir chave publicável com chave secreta.** A chave `sb_publishable` pode aparecer no frontend porque RLS e funções protegidas controlam os dados; isso não autoriza expor chave secreta.
- **Assinaturas são arquivos PNG privados.** PDFs são gerados quando o administrador solicita download, usando sempre a versão original embutida no projeto. Se você alterar o modelo futuramente, preserve a versão anterior.
- **Os arquivos em Storage não têm backup automático próprio nesta entrega.** Estabeleça uma rotina de exportação e backup antes de usar em gravações reais; não dependa apenas do plano gratuito.
- **Exclusão é definitiva:** ao excluir um participante ou projeto pelo painel, as funções também tentam remover as assinaturas do Storage. Não use exclusões SQL diretas se quiser manter a limpeza automática.
- **Público sem login:** o formulário aceita links compartilháveis. Há validação de campos, honeypot e proteção contra cliques duplicados, mas esta versão não implementa rate limiting avançado ou CAPTCHA. Avalie essas proteções antes de circulação pública ampla para prevenir abuso e consumo inesperado de recursos.
- **Não há verificação de identidade.** A assinatura manuscrita capturada é eletrônica simples, não uma assinatura digital certificada.
- **As políticas de retenção e exclusão de dados precisam ser estabelecidas pela Contenty**, conforme a finalidade e as regras aplicáveis de proteção de dados pessoais, incluindo documentos de menores.
- **A geração de grandes ZIPs ocorre no navegador do administrador.** Teste inicialmente com 100 participantes e avalie migrar para geração no servidor se o volume crescer bastante.
- **O campo “Nome do fotógrafo” permanece vazio** e a assinatura dos menores fica na seção dos responsáveis, como definido.

## 8. Estado da verificação

- Conferida sintaxe JavaScript/JSX/TypeScript dos arquivos principais com o parser TypeScript.
- Validado visualmente o alinhamento proposto no PDF original por renderização de teste com dados fictícios.
- **Não foi possível executar `npm install`, fazer o build ou efetuar testes de integração com o projeto Supabase neste ambiente**, pois o acesso ao registro de pacotes não respondeu. O deploy e o primeiro teste integrado devem ser feitos no computador com acesso à internet.

**Versão 1.0 — 28 de outubro de 2026.**

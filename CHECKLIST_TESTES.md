# Checklist de homologação — Contenty v1.0

## Infraestrutura
- [ ] Migração `001_inicial.sql` executada
- [ ] Usuário criado em Authentication > Users
- [ ] Administrador autorizado com `002_admin_exemplo.sql`
- [ ] Funções `public-autorizacao` e `admin-autorizacao` publicadas
- [ ] JWT legado desligado nas duas funções
- [ ] Site URL e Redirect URLs configuradas no Supabase

## Admin
- [ ] Login com e-mail e senha
- [ ] Usuário não autorizado não consegue acessar o painel
- [ ] Criar/editar projeto com datas isoladas
- [ ] Criar/editar projeto com período de datas
- [ ] Copiar link público
- [ ] Arquivar/desarquivar projeto sem desativar link
- [ ] Excluir projeto com confirmação e limpar assinaturas

## Participante
- [ ] Abrir link em aba anônima
- [ ] Dados obrigatórios validados
- [ ] Adulto assina pelo dedo
- [ ] Menor informa responsável e exige assinatura deste
- [ ] Aceite explícito obrigatório
- [ ] Envio bloqueado quando assinatura vazia
- [ ] Confirmação de assinatura após gravar

## PDF
- [ ] Nome, telefone e endereço no lugar correto
- [ ] Assinatura do adulto no campo Outorgante
- [ ] Assinatura do responsável no campo Autorização dos pais
- [ ] Data correta nos espaços aplicáveis
- [ ] Nome do fotógrafo em branco
- [ ] O texto original do termo não é modificado
- [ ] Download individual abre corretamente
- [ ] Exportação ZIP contém um PDF por assinatura
- [ ] Exportação CSV abre no Excel sem corrupção de acentos

## Segurança e compatibilidade
- [ ] Dados de terceiros não são acessíveis por link público
- [ ] Storage não permite download anônimo
- [ ] Excluir participante remove o arquivo da assinatura
- [ ] Interface e assinatura testadas em Android
- [ ] Interface e assinatura testadas em iPhone/iPad
- [ ] ZIP testado com 100 ou mais assinaturas
- [ ] Backup definido antes do uso real

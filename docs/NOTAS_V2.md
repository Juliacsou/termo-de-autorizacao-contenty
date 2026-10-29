# Contenty — Autorização de Uso de Imagem v2.0

## Mudanças

- Substituição do logotipo provisório por imagens oficiais da Contenty, incluindo variantes vermelha e branca.
- Adoção do vermelho #E60202, preto e branco, com superfícies neutras.
- Uso de Poppins e Montserrat nas interfaces, conforme identidade enviada.
- Correções responsivas para telas estreitas em formulários, assinatura, mensagem de sucesso, navegação, filtros, cards, exportações e rodapé.
- Tela administrativa com sidebar escura e acento vermelho.

## Compatibilidade

- Migrações SQL: **não há novas migrações**.
- Edge Functions: **sem alterações**. Não é necessário novo deploy se já estão funcionando.
- PDFs: modelo original fornecido pela Igreja preservado.
- Banco e dados existentes: preservados; a V2 utiliza o mesmo Supabase.

## Verificação executada

- CSS analisado sem erros de parse.
- Prévia estrutural de layout verificada por Chromium em 320, 360, 375, 390, 430, 768 e 1440 px, sem transbordamento horizontal.
- Tela de confirmação verificada em 320, 360, 375 e 430 px, sem transbordamento horizontal.
- Teste de build completo não foi executado neste ambiente: o acesso ao registro npm está indisponível. Faça `npm.cmd install` e `npm.cmd run dev` no computador para validação funcional integrada.

## Testes recomendados

1. Abrir login no computador e no celular.
2. Entrar no painel existente e conferir projetos e participantes.
3. Abrir um link público existente.
4. Preencher formulário e assinar num celular, confirmando que não há rolagem horizontal.
5. Verificar a tela de confirmação.
6. Baixar um PDF de teste e conferir seu preenchimento.
7. Verificar o painel em computador, filtros e downloads.

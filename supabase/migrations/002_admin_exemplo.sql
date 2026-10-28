-- Execute SOMENTE DEPOIS de criar a conta em Authentication > Users > Add user.
-- Substitua o e-mail abaixo pelo e-mail real do administrador.
insert into public.admin_users (user_id)
select id from auth.users where lower(email)=lower('SEU_EMAIL_AQUI@EXEMPLO.COM')
on conflict (user_id) do nothing;
-- Deve retornar 1 linha:
select a.user_id,u.email from public.admin_users a join auth.users u on u.id=a.user_id;

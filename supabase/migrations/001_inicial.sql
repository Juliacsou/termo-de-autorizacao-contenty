-- CONTenty / Autorizações de Uso de Imagem - Migração v1
-- Execute uma única vez no Supabase > SQL Editor > New query > Run.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
-- O sistema terá exclusivamente uma conta administrativa.
create unique index if not exists admin_users_single_user on public.admin_users ((true));

create or replace function public.is_contenty_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admin_users where user_id = (select auth.uid())); $$;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  public_token uuid not null unique default gen_random_uuid(),
  name text not null check(char_length(trim(name)) between 2 and 120),
  location text not null default '',
  dates jsonb not null default '[]'::jsonb check(jsonb_typeof(dates)='array'),
  instructions text not null default '',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  full_name text not null,
  phone text not null,
  address text not null,
  is_minor boolean not null default false,
  guardian_name text,
  guardian_phone text,
  guardian_address text,
  signature_path text not null,
  consent_statement text not null,
  template_version text not null default 'igreja-original-v1',
  project_snapshot jsonb not null,
  signed_at timestamptz not null default now(),
  constraint minor_guardian_required check(not is_minor or (
    nullif(trim(coalesce(guardian_name,'')),'') is not null and
    nullif(trim(coalesce(guardian_phone,'')),'') is not null and
    nullif(trim(coalesce(guardian_address,'')),'') is not null
  ))
);
create index if not exists participants_project_signed on public.participants(project_id,signed_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  participant_name text not null,
  project_name text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_unread on public.notifications(read,created_at desc);

create or replace function public.touch_project() returns trigger
language plpgsql set search_path = '' as $$begin new.updated_at=now();return new;end;$$;
drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at before update on public.projects
for each row execute function public.touch_project();

create or replace function public.notify_signature() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.notifications(project_id,participant_id,participant_name,project_name)
 select new.project_id,new.id,new.full_name,p.name from public.projects p where p.id=new.project_id;
 return new;
end;$$;
drop trigger if exists participants_notif on public.participants;
create trigger participants_notif after insert on public.participants
for each row execute function public.notify_signature();

alter table public.admin_users enable row level security;
alter table public.projects enable row level security;
alter table public.participants enable row level security;
alter table public.notifications enable row level security;

-- O frontend só enxerga dados após login de um administrador cadastrado.
create policy "admin pode ver a propria identidade" on public.admin_users
for select to authenticated using(user_id=(select auth.uid()));
create policy "admin gerencia projetos" on public.projects
for all to authenticated using(public.is_contenty_admin()) with check(public.is_contenty_admin());
create policy "admin consulta participantes" on public.participants
for select to authenticated using(public.is_contenty_admin());
-- Exclusões passam exclusivamente pela Edge Function (limpeza do Storage).
create policy "admin consulta notificacoes" on public.notifications
for select to authenticated using(public.is_contenty_admin());
create policy "admin marca notificacoes" on public.notifications
for update to authenticated using(public.is_contenty_admin()) with check(public.is_contenty_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('assinaturas','assinaturas',false,400000,array['image/png'])
on conflict(id) do update set public=false,file_size_limit=400000,allowed_mime_types=array['image/png'];
create policy "somente admin le assinaturas" on storage.objects
for select to authenticated using(bucket_id='assinaturas' and public.is_contenty_admin());

revoke all on function public.is_contenty_admin() from public;
grant execute on function public.is_contenty_admin() to authenticated,service_role;
-- A Edge Function utiliza a chave secreta do ambiente Supabase para gravação.
-- Não criar políticas de INSERT público nas tabelas ou no Storage.

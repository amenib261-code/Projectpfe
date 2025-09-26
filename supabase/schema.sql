-- Enable required extensions
create extension if not exists pgcrypto;

-- Users table (existing schema)
-- Note: This table already exists in your database with the following structure:
-- CREATE TABLE public.Users (
--   fullname character varying NOT NULL,
--   email character varying NOT NULL UNIQUE,
--   number bigint NOT NULL,
--   class text,
--   branch text,
--   id uuid NOT NULL UNIQUE,
--   CONSTRAINT Users_pkey PRIMARY KEY (id)
-- );

-- Add indexes for better performance if they don't exist
create index if not exists idx_users_email on public."Users"(lower(email));
create index if not exists idx_users_class on public."Users"(class);

-- Teachers table
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  subject text,
  experience_years integer,
  qualification text,
  created_at timestamptz not null default now()
);

create index if not exists idx_teachers_created_at on public.teachers(created_at desc);
create unique index if not exists uq_teachers_email on public.teachers(lower(email));

-- Sessions table
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text,
  class_level text,
  teacher_id uuid references public.teachers(id) on delete set null,
  session_date timestamptz not null,
  duration_minutes integer default 60,
  location text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_date on public.sessions(session_date desc);
create index if not exists idx_sessions_class on public.sessions(class_level);



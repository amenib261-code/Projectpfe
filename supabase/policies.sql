-- Enable Row Level Security
alter table public."Users" enable row level security;
alter table public.teachers enable row level security;
alter table public.sessions enable row level security;

-- Allow read-only for authenticated users
create policy if not exists users_select_auth on public."Users"
  for select using (auth.role() = 'authenticated');

create policy if not exists teachers_select_auth on public.teachers
  for select using (auth.role() = 'authenticated');

create policy if not exists sessions_select_auth on public.sessions
  for select using (auth.role() = 'authenticated');

-- Allow insert by service role only (handled by server)
create policy if not exists users_insert_service on public."Users"
  for insert with check (auth.role() = 'service_role');

create policy if not exists teachers_insert_service on public.teachers
  for insert with check (auth.role() = 'service_role');

create policy if not exists sessions_insert_service on public.sessions
  for insert with check (auth.role() = 'service_role');

-- Optional: allow users to see their own row if linked via id
create policy if not exists users_select_own on public."Users"
  for select using (id = auth.uid());



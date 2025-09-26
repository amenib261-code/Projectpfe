-- Example seed data (safe to run multiple times)
insert into public.teachers (id, full_name, email, phone, subject, experience_years, qualification)
values
  (gen_random_uuid(), 'John Smith', 'john.smith@example.com', '555-1234', 'Mathematics', 8, 'MSc Education')
on conflict do nothing;

insert into public."Users" (id, fullname, email, number, class, branch)
values
  (gen_random_uuid(), 'Ali Ben Salah', 'ali@example.com', 50111222, '2eme', 'informatique'),
  (gen_random_uuid(), 'Imen Trabelsi', 'imen@example.com', 50999888, '3eme', 'sciences')
on conflict do nothing;

insert into public.sessions (id, title, class_level, session_date, duration_minutes, location, notes)
values
  (gen_random_uuid(), 'Algebra Basics', '2eme', now() + interval '1 day', 90, 'Room A', 'Introduction to variables'),
  (gen_random_uuid(), 'Programming 101', '3eme', now() + interval '2 days', 120, 'Room B', 'Python fundamentals')
on conflict do nothing;



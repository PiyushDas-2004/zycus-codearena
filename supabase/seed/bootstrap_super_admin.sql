-- ════════════════════════════════════════════════════════════════════════════
-- Run ONCE, after the migrations and seed.sql, in Supabase Dashboard → SQL Editor.
-- Replace the email and name with the first Super Admin's Zycus account. Every other staff
-- member is then added from the admin portal (Admin → Users).
-- ════════════════════════════════════════════════════════════════════════════
insert into public.staff_users (email, full_name, role)
values (lower('firstname.lastname@zycus.com'), 'First Super Admin', 'super_admin')
on conflict (email) do update set role = 'super_admin', is_active = true;

-- Optional: if Zycus uses additional email domains, list them here (subdomains such as
-- corpteam.zycus.com are already accepted while allow_email_subdomains = true).
-- update public.app_settings set allowed_email_domains = array['zycus.com'];

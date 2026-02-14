-- Backfill missing profiles for existing users (Privy DID -> profiles.auth_id)
insert into public.profiles (auth_id)
select u.privy_did
from public.users u
left join public.profiles p on p.auth_id = u.privy_did
where p.id is null;

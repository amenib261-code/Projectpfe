Apply Supabase schema, policies, and seeds

1) Open Supabase SQL editor and run these files in order:
   - schema.sql
   - policies.sql
   - seed.sql (optional)

2) Ensure RLS is enabled and policies are active.

3) For local dev with service role backend:
   - Set SUPABASE_URL and SUPABASE_SERVICE_ROLE in server .env
   - Start backend: npm run start



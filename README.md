Setup backend API (service role key kept server-side)

1) Create .env file in project root or server/ with:

SUPABASE_URL=https://lzlqxwwhjveyfhgopdph.supabase.co
SUPABASE_SERVICE_ROLE=YOUR_SERVICE_ROLE_KEY
PORT=3001

2) Install deps and run:

PS> npm install
PS> npm run start

The API will be available at http://localhost:3001



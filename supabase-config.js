const SUPABASE_URL = "https://nidtqbyzqghmcbjdskps.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_BHmRkMj-jQSdHnZjtyFcaQ_CayynnvQ";

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

console.log("SUPABASE CONNECTED - KLM MINGGUAN");

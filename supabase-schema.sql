-- In Supabase: Projekt öffnen -> "SQL Editor" -> "New query" -> dies einfügen -> "Run"

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  entry_date date not null default current_date,
  raw_transcript text,
  cleaned_text text not null
);

-- Row Level Security bleibt aktiviert; der Zugriff läuft ausschließlich über
-- den Service-Role-Key auf dem Server (Next.js API-Routen), nie direkt vom Browser.
alter table entries enable row level security;

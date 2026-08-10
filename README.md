# Yapiary – Prototyp

Sprachmemo aufnehmen oder importieren → automatische Transkription → Bereinigung (Füllwörter raus, dein Ton bleibt) → als Tagebucheintrag speichern.

Läuft als Web-App, auf dem iPhone über Safari "Zum Home-Bildschirm hinzufügen" wie eine App nutzbar.

## Was drin ist (v1 – bewusst minimal)

- Memo aufnehmen (Mikrofon im Browser) ODER bestehende Audiodatei importieren
- Transkription über OpenAI Whisper
- Bereinigung über Claude (Anthropic) – entfernt nur Füllwörter/Wiederholungen, schreibt nicht um
- Eintrag mit Datum speichern (Supabase-Datenbank)
- Liste aller Einträge auf der Startseite

Bewusst NICHT drin (kommt später): Fotos, Ort/Wetter, Stimmungs-Ratings, Frage-des-Tages, gespeicherte Original-Audiodatei.

## 1. Lokal einrichten

```bash
npm install
cp .env.local.example .env.local
```

Trage in `.env.local` deine vier Werte ein:

- `ANTHROPIC_API_KEY` – von console.anthropic.com
- `OPENAI_API_KEY` – von platform.openai.com
- `SUPABASE_URL` – aus Supabase: Project Settings → API → "Project URL"
- `SUPABASE_SERVICE_ROLE_KEY` – aus Supabase: Project Settings → API → "service_role" Key (NICHT der "anon" Key – der service_role Key ist geheim, niemals im Browser/Client verwenden, nur hier auf dem Server)

Dann in Supabase (SQL Editor → New query) den Inhalt von `supabase-schema.sql` einfügen und ausführen – legt die Tabelle `entries` an.

Lokal starten:

```bash
npm run dev
```

Öffne http://localhost:3000

## 2. Auf Vercel deployen (damit es dauerhaft online ist)

1. Neues Repository auf GitHub erstellen (z. B. "yapiary"), leer lassen.
2. In diesem Projektordner:
   ```bash
   git remote add origin https://github.com/DEIN-USERNAME/yapiary.git
   git branch -M main
   git push -u origin main
   ```
3. Auf vercel.com: "Add New Project" → das GitHub-Repo auswählen → Import.
4. Bei "Environment Variables" die vier Werte aus `.env.local` eintragen (gleiche Namen: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
5. Deploy klicken. Nach ein bis zwei Minuten ist die App unter einer `*.vercel.app`-URL erreichbar.

## 3. Auf dem iPhone nutzen

1. Die Vercel-URL in Safari öffnen.
2. Teilen-Symbol → "Zum Home-Bildschirm".
3. Ab jetzt wie eine App startbar, ohne Browser-Leiste.

## Wichtige Einschränkungen dieses Prototyps

- Kein Login/Auth: jeder mit der URL kann die App öffnen und Einträge sehen/anlegen. Für den persönlichen Test okay, für "richtige" Nutzung mit Freund:innen oder für die Öffentlichkeit müsste vorher eine Anmeldung ergänzt werden.
- Rohe Audiodatei wird nicht dauerhaft gespeichert, nur der Text.
- Jede Transkription/Bereinigung kostet ein paar Cent (Whisper + Claude API). Bei täglicher persönlicher Nutzung vernachlässigbar.
- Whisper-Transkription läuft aktuell ohne festgelegte Sprache – bei stark gemischtem Deutsch/Englisch kann das variieren.

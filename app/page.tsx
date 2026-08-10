import Link from "next/link";
import { getSupabaseServerClient, DiaryEntry } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function fetchEntries(): Promise<{ entries: DiaryEntry[]; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { entries: data ?? [] };
  } catch (err) {
    console.error(err);
    return {
      entries: [],
      error: err instanceof Error ? err.message : "Unbekannter Fehler",
    };
  }
}

function formatDate(iso: string) {
  const date = new Date(iso + "T00:00:00");
  return date.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function HomePage() {
  const { entries, error } = await fetchEntries();

  return (
    <main className="min-h-screen max-w-xl mx-auto px-5 py-8 pb-28">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Yapiary</h1>
        <p className="text-sm text-neutral-500">Deine gesprochenen Tagebucheinträge</p>
      </header>

      {error && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 mb-6">
          Einträge konnten nicht geladen werden: {error}
          <br />
          Prüfe, ob SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY korrekt gesetzt sind.
        </div>
      )}

      {!error && entries.length === 0 && (
        <div className="text-center text-neutral-500 mt-20">
          <p className="text-lg">Noch keine Einträge.</p>
          <p className="text-sm mt-1">Nimm dein erstes Memo auf.</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {entries.map((entry) => (
          <article
            key={entry.id}
            className="rounded-2xl border border-neutral-200 p-4"
          >
            <p className="text-xs uppercase tracking-wide text-neutral-400 mb-2">
              {formatDate(entry.entry_date)}
            </p>
            <p className="whitespace-pre-wrap leading-relaxed">
              {entry.cleaned_text}
            </p>
          </article>
        ))}
      </div>

      <Link
        href="/new"
        className="fixed bottom-6 right-6 rounded-full bg-black text-white w-16 h-16 flex items-center justify-center text-2xl shadow-lg active:scale-95 transition"
        aria-label="Neuer Eintrag"
      >
        +
      </Link>
    </main>
  );
}

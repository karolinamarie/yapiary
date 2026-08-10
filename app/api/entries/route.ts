import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ entries: data ?? [] });
  } catch (err) {
    console.error("List entries error:", err);
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const body = await req.json();

    const cleanedText: string | undefined = body.cleanedText;
    const rawTranscript: string | undefined = body.rawTranscript;
    const entryDate: string =
      body.entryDate ?? new Date().toISOString().slice(0, 10);

    if (!cleanedText || !cleanedText.trim()) {
      return NextResponse.json(
        { error: "cleanedText fehlt oder ist leer." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("entries")
      .insert({
        entry_date: entryDate,
        raw_transcript: rawTranscript ?? null,
        cleaned_text: cleanedText,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ entry: data }, { status: 201 });
  } catch (err) {
    console.error("Create entry error:", err);
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

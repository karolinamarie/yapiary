import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const CLEANUP_PROMPT = `Du bekommst gleich die rohe, automatisch erstellte Transkription eines gesprochenen Tagebucheintrags (ein Sprachmemo).

Deine einzige Aufgabe: entferne NUR
- Füllwörter (ähm, äh, halt, sozusagen, irgendwie, weißt du, you know, like, um, uh)
- offensichtliche Wiederholungen (wenn ein Wort/Satzteil direkt doppelt gesagt wurde)
- Selbstkorrekturen, bei denen die Person sich mitten im Satz verbessert hat (behalte nur die finale Version)
- Transkriptionsfehler / Verschreiber, die klar Fehler der Spracherkennung sind

Was du NICHT tun darfst:
- keine Wörter durch andere ersetzen (kein Umformulieren, kein "schöner machen")
- keine Sätze umstellen oder zusammenfassen
- keinen Inhalt hinzufügen, der nicht gesagt wurde
- keinen anderen Ton oder Stil erzeugen als die Person selbst hatte
- keine Anführungszeichen, Erklärungen oder Kommentare hinzufügen

Die Person soll ihren eigenen Tagebucheintrag später lesen und das Gefühl haben: "genau so hab ich das gesagt", nur ohne das ganze Räuspern und Stottern.

Gib NUR den bereinigten Text zurück, nichts anderes. Wenn der Originaltext leer oder unverständlich ist, gib ihn unverändert zurück.

Rohe Transkription:
"""
{{RAW_TRANSCRIPT}}
"""`;

export async function POST(req: NextRequest) {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!openaiKey || !anthropicKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY oder ANTHROPIC_API_KEY fehlt auf dem Server." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("audio");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Kein Audio empfangen." }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: openaiKey });
    const anthropic = new Anthropic({ apiKey: anthropicKey });

    // 1. Speech-to-text via Whisper
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });

    const rawTranscript = transcription.text?.trim() ?? "";

    if (!rawTranscript) {
      return NextResponse.json(
        { error: "Transkription war leer. War die Aufnahme zu kurz oder leise?" },
        { status: 422 }
      );
    }

    // 2. Cleanup pass with Claude, preserving voice/tone exactly
    const cleanupResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: CLEANUP_PROMPT.replace("{{RAW_TRANSCRIPT}}", rawTranscript),
        },
      ],
    });

    const cleanedText = cleanupResponse.content
      .filter((block) => block.type === "text")
      .map((block) => ("text" in block ? block.text : ""))
      .join("\n")
      .trim();

    return NextResponse.json({
      rawTranscript,
      cleanedText: cleanedText || rawTranscript,
    });
  } catch (err) {
    console.error("Transcribe error:", err);
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

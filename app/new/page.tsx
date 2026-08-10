"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "idle" | "recording" | "processing" | "review" | "error";

function pickRecordingMimeType(): { mimeType: string; extension: string } {
  const candidates: Array<{ mimeType: string; extension: string }> = [
    { mimeType: "audio/mp4", extension: "m4a" },
    { mimeType: "audio/webm;codecs=opus", extension: "webm" },
    { mimeType: "audio/webm", extension: "webm" },
    { mimeType: "audio/ogg", extension: "ogg" },
  ];

  for (const candidate of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported(candidate.mimeType)
    ) {
      return candidate;
    }
  }
  return { mimeType: "", extension: "webm" };
}

export default function NewEntryPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [rawTranscript, setRawTranscript] = useState("");
  const [cleanedText, setCleanedText] = useState("");
  const [entryDate, setEntryDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [saving, setSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const extensionRef = useRef<string>("webm");

  async function startRecording() {
    setErrorMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const { mimeType, extension } = pickRecordingMimeType();
      extensionRef.current = extension;

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        void processAudio(blob, extensionRef.current);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setStep("recording");
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "Mikrofon-Zugriff nicht möglich. Hast du die Berechtigung erteilt?"
      );
      setStep("error");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  async function handleFileImport(file: File) {
    const extension = file.name.split(".").pop() || "m4a";
    await processAudio(file, extension);
  }

  async function processAudio(blob: Blob, extension: string) {
    setStep("processing");
    setErrorMessage("");
    try {
      const formData = new FormData();
      formData.append("audio", blob, `memo.${extension}`);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Transkription fehlgeschlagen.");
      }

      setRawTranscript(data.rawTranscript);
      setCleanedText(data.cleanedText);
      setStep("review");
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : "Unbekannter Fehler bei der Verarbeitung."
      );
      setStep("error");
    }
  }

  async function saveEntry() {
    setSaving(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cleanedText,
          rawTranscript,
          entryDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Speichern fehlgeschlagen.");
      }

      router.push("/");
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : "Unbekannter Fehler beim Speichern."
      );
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen max-w-xl mx-auto px-5 py-8 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm text-neutral-500">
          ← Zurück
        </Link>
        <h1 className="text-lg font-semibold">Neuer Eintrag</h1>
        <span className="w-12" />
      </header>

      {step === "idle" && (
        <div className="flex flex-col gap-4 mt-8">
          <button
            onClick={startRecording}
            className="rounded-2xl bg-black text-white py-6 text-lg font-medium active:scale-95 transition"
          >
            🎙️ Memo aufnehmen
          </button>

          <label className="rounded-2xl border border-neutral-300 py-6 text-lg font-medium text-center cursor-pointer active:scale-95 transition">
            📁 Bestehendes Memo importieren
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileImport(file);
              }}
            />
          </label>
        </div>
      )}

      {step === "recording" && (
        <div className="flex flex-col items-center gap-6 mt-12">
          <div className="w-24 h-24 rounded-full bg-red-500 animate-pulse" />
          <p className="text-neutral-600">Nimmt auf…</p>
          <button
            onClick={stopRecording}
            className="rounded-2xl bg-black text-white px-8 py-4 text-lg font-medium"
          >
            ⏹️ Stopp
          </button>
        </div>
      )}

      {step === "processing" && (
        <div className="flex flex-col items-center gap-4 mt-16">
          <div className="w-10 h-10 border-4 border-neutral-300 border-t-black rounded-full animate-spin" />
          <p className="text-neutral-600">
            Wird transkribiert und bereinigt …
          </p>
        </div>
      )}

      {step === "review" && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-500">Datum</span>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="border rounded-lg px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-500">
              Dein Eintrag (bereinigt, kannst du noch anpassen)
            </span>
            <textarea
              value={cleanedText}
              onChange={(e) => setCleanedText(e.target.value)}
              rows={10}
              className="border rounded-lg px-3 py-2 leading-relaxed"
            />
          </label>

          <details className="text-sm text-neutral-500">
            <summary className="cursor-pointer">Rohe Transkription anzeigen</summary>
            <p className="mt-2 whitespace-pre-wrap">{rawTranscript}</p>
          </details>

          <button
            onClick={saveEntry}
            disabled={saving}
            className="rounded-2xl bg-black text-white py-4 text-lg font-medium disabled:opacity-50"
          >
            {saving ? "Speichert …" : "Eintrag speichern"}
          </button>
        </div>
      )}

      {step === "error" && (
        <div className="flex flex-col gap-4 mt-8">
          <p className="text-red-600">{errorMessage}</p>
          <button
            onClick={() => setStep("idle")}
            className="rounded-2xl border border-neutral-300 py-3 text-lg"
          >
            Nochmal versuchen
          </button>
        </div>
      )}
    </main>
  );
}

"use client";
import { useState } from "react";

type Result = { score: number; level: string; flags: string[] };

function analyze(text: string): Result {
  const lower = text.toLowerCase();
  const flags: string[] = [];
  let score = 0;

  const has = (words: string[]) => words.some((w) => lower.includes(w));

  if (has(["urgent", "immediately", "act now", "last chance", "within 24 hours", "expires today"])) {
    flags.push("Creates urgency or pressure");
    score += 25;
  }
  if (has(["winner", "prize", "lottery", "free gift", "cash reward", "refund"])) {
    flags.push("Promises money or prizes");
    score += 25;
  }
  if (has(["verify your account", "account blocked", "account suspended", "kyc", "update your details"])) {
    flags.push("Threatens your account");
    score += 25;
  }
  if (has(["otp", "password", "pin", "cvv", "card number"])) {
    flags.push("Asks for sensitive information");
    score += 30;
  }
  if (/https?:\/\/|www\./.test(lower)) {
    flags.push("Contains a link");
    score += 10;
  }
  if (/(bit\.ly|tinyurl|cutt\.ly|goo\.gl)/.test(lower)) {
    flags.push("Uses a shortened link that hides the real site");
    score += 20;
  }

  score = Math.min(score, 100);
  const level = score >= 60 ? "Likely Scam" : score >= 30 ? "Suspicious" : "Looks Safe";
  return { score, level, flags };
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  function handleCheck() {
    setResult(analyze(message));
  }

  const color =
    result && result.score >= 60
      ? "text-red-600"
      : result && result.score >= 30
      ? "text-orange-500"
      : "text-green-600";

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold">ScamShield</h1>
        <p className="mt-2 text-gray-600">Paste a suspicious message to check it.</p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Paste SMS, email or link here..."
          className="mt-4 h-40 w-full rounded-lg border bg-white p-3"
        />

        <button
          onClick={handleCheck}
          className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white"
        >
          Check
        </button>

        {result && (
          <div className="mt-6 rounded-lg border bg-white p-4">
            <p className={"text-2xl font-bold " + color}>
              {result.level} ({result.score}/100)
            </p>
            {result.flags.length > 0 && (
              <ul className="mt-3 list-disc pl-5">
                {result.flags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
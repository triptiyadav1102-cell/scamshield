"use client";
import { useState } from "react";

type Result = { score: number; level: string; flags: string[] };
type AI = { verdict: string; confidence: number; reasons: string[]; advice: string };

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
  if (has(["verify your account", "account blocked", "account suspended", "account is on hold", "on hold", "will be closed", "will be blocked", "kyc", "update your details"])) {
    flags.push("Threatens your account");
    score += 25;
  }
  if (has(["otp", "password", "otp pin", "cvv", "card number"])) {
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
    if (/http:\/\//.test(lower)) {
    flags.push("Uses an insecure http link");
    score += 15;
  }
  if (/\b(sbi|hdfc|icici|axis bank|paytm|upi)\b/.test(lower) && /https?:\/\//.test(lower)) {
    flags.push("Mentions a bank or payment app with a link");
    score += 20;
  }
  score = Math.min(score, 100);
  const level = score >= 60 ? "Likely Scam" : score >= 30 ? "Suspicious" : "Looks Safe";
  return { score, level, flags };
}

const EXAMPLES = [
  { label: "Bank KYC scam", text: "Dear customer, your SBI account is on hold. Complete your KYC today at http://sbi-kyc-verify.in or it will be closed." },
  { label: "Prize scam", text: "Congratulations! You are the winner of a cash reward of Rs 50,000. Claim now within 24 hours: bit.ly/claim-prize" },
  { label: "Normal message", text: "Hi, are we meeting at 5 near the library?" },
];

export default function Home() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [ai, setAi] = useState<AI | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheck() {
    if (!message.trim()) return;
    setResult(analyze(message));
    setAi(null);
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error("AI check failed");
      setAi(data);
    } catch {
      setError("AI check unavailable. Showing rule-based result only.");
    }
    setLoading(false);
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
        <div className="mt-3 flex flex-wrap gap-2">
  {EXAMPLES.map((ex) => (
    <button
      key={ex.label}
      onClick={() => setMessage(ex.text)}
      className="rounded-full border bg-white px-3 py-1 text-sm text-gray-700"
    >
      {ex.label}
    </button>
  ))}
</div>
        <button
          onClick={handleCheck}
          className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white"
        >
          Check
        </button>

        {result && (
          <div className="mt-6 rounded-lg border bg-white p-4">
            <p className="text-sm font-semibold text-gray-500">Rule-based check</p>
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

        {loading && <p className="mt-4 text-gray-600">AI is analyzing...</p>}
        {error && <p className="mt-4 text-orange-600">{error}</p>}

        {ai && (
          <div className="mt-4 rounded-lg border bg-white p-4">
            <p className="text-sm font-semibold text-gray-500">AI analysis</p>
            <p className="text-2xl font-bold">
              {ai.verdict} ({ai.confidence}% sure)
            </p>
            <ul className="mt-3 list-disc pl-5">
              {ai.reasons?.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="mt-3 rounded bg-blue-50 p-3">{ai.advice}</p>
          </div>
        )}
      </div>
    </main>
  );
}

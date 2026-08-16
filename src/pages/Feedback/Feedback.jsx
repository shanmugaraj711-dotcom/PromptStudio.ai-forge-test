import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { auth } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import PublicHeader from "../../components/layout/PublicHeader";

export default function Feedback() {
  const { user, loading } = useAuth();
  const [type, setType] = useState("feedback");
  const [rating, setRating] = useState("5");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/login?next=/feedback" replace />;

  const submit = async (event) => {
    event.preventDefault();
    if (message.trim().length < 5) {
      setStatus("Please add a little more detail so we can act on it.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, rating: Number(rating), message: message.trim(), page: window.location.pathname }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "Could not send feedback.");
      setMessage("");
      setStatus("Thanks — your feedback has been received.");
    } catch (error) {
      setStatus(error.message || "Could not send feedback.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <PublicHeader />
      <section className="mx-auto max-w-2xl px-5 py-10 sm:px-6 sm:py-14">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-300">Feedback</p>
          <h1 className="mt-2 text-4xl font-black">Tell us what to improve.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">A quick rating, a bug, an idea, or a payment issue helps us make PromptStudio better.</p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-200">Type<select value={type} onChange={(e) => setType(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-medium text-white outline-none focus:border-indigo-500"><option value="feedback">General feedback</option><option value="bug">Bug report</option><option value="idea">Feature idea</option><option value="payment">Payment issue</option></select></label>
            <label className="text-sm font-bold text-slate-200">Rating<select value={rating} onChange={(e) => setRating(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-medium text-white outline-none focus:border-indigo-500"><option value="5">★★★★★ Excellent</option><option value="4">★★★★ Great</option><option value="3">★★★ Okay</option><option value="2">★★ Needs work</option><option value="1">★ Poor</option></select></label>
          </div>
          <label className="block text-sm font-bold text-slate-200">Your message<textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="What happened or what should we improve?" className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm font-medium text-white outline-none placeholder:text-slate-600 focus:border-indigo-500" /></label>
          {status && <p className="rounded-xl bg-indigo-500/10 p-3 text-sm text-indigo-200">{status}</p>}
          <button disabled={saving} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold hover:bg-indigo-500 disabled:opacity-50">{saving ? "Sending…" : "Send Feedback"}</button>
          <p className="text-xs leading-5 text-slate-500">For payment issues, share the payment date and amount only. Never send card numbers, CVV, OTPs, passwords, or API secrets.</p>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
          <Link to="/" className="hover:text-white">⌂ Home</Link>
          <Link to="/help" className="hover:text-white">Help</Link>
          <Link to="/contact" className="hover:text-white">Contact</Link>
          <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("promptstudio:open-support"))} className="hover:text-white">Open Support Chat</button>
        </div>
      </section>
    </main>
  );
}

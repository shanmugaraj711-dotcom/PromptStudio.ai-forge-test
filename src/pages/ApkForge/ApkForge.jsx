import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createApkForgeBrief, payForApkForge } from "../../services/apkForge";

const inspectFile = async (file) => {
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer());
  const signature = head.length === 2 ? String.fromCharCode(head[0], head[1]) : "";
  const executable = signature === "MZ" || /\.(exe|dll|msi|com|scr|bin)$/i.test(file.name);
  return { name: file.name, size: file.size, mimeType: file.type || "unknown", signature, detectedType: executable ? "executable_or_binary" : "reference" };
};

const tools = [
  { label: "New build", detail: "Start from a product brief", action: "create" },
  { label: "My builds", detail: "Track work in review", action: "builds" },
  { label: "Prompt builder", detail: "Shape your product idea", action: "builder" },
  { label: "Reference coding", detail: "Turn code into context", action: "coding" },
];

function ForgeMark() {
  return <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><span className="h-4 w-4 rounded-[5px] border-[3px] border-white" /></span>;
}

export default function ApkForge() {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [references, setReferences] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const addFiles = async (event) => {
    setReferences(await Promise.all(Array.from(event.target.files || []).slice(0, 8).map(inspectFile)));
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const idToken = await user.getIdToken();
      const request = await createApkForgeBrief({ description, websiteUrl, idToken, references });
      setResult(request);
      await payForApkForge({ user, forgeRequestId: request.forgeRequestId, idToken, description: "PromptStudio AI — APK Forge build", onSuccess: (payment) => setResult((current) => ({ ...current, ...payment })) });
    } catch (cause) {
      setError(cause.message || "Forge could not start checkout.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#f7f9fc] text-slate-950">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3"><ForgeMark /><div><p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600">PromptStudio</p><h1 className="text-2xl font-black tracking-tight sm:text-3xl">APK Forge</h1></div></div>
          <Link to="/apk-forge/my-builds" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700">My builds</Link>
        </div>

        <section className="mb-7 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.45)] sm:p-8">
          <div className="max-w-2xl"><p className="mb-3 text-sm font-extrabold text-blue-600">A focused workspace for your next app</p><h2 className="text-balance text-3xl font-black tracking-[-0.04em] sm:text-5xl">From product idea to Android build.</h2><p className="mt-4 max-w-xl text-base leading-7 text-slate-500">Give us the context, references, and behavior that matter. Our build team turns it into a reviewed Android experience.</p></div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{tools.map((tool) => <Link key={tool.action} to={tool.action === "create" ? "#brief" : tool.action === "builds" ? "/apk-forge/my-builds" : tool.action === "builder" ? "/builder" : "/reference-coding"} className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md ${tool.action === "create" ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50/70"}`}><div className="mb-5 flex items-center justify-between"><span className={`grid h-9 w-9 place-items-center rounded-lg text-sm font-black ${tool.action === "create" ? "bg-blue-600 text-white" : "bg-white text-slate-700"}`}>{tool.action === "create" ? "+" : "↗"}</span><span className="text-slate-300 transition group-hover:text-blue-500">→</span></div><p className="font-extrabold">{tool.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{tool.detail}</p></Link>)}</div>
        </section>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]" id="brief">
          <form onSubmit={submit} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-7 flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">New request</p><h3 className="mt-2 text-2xl font-black tracking-tight">Tell us what to build</h3></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700">Human reviewed</span></div>
            <label className="text-sm font-extrabold text-slate-800" htmlFor="forge-description">Product brief</label><textarea id="forge-description" value={description} onChange={(event) => setDescription(event.target.value)} required maxLength={12000} rows={8} className="mt-3 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" placeholder="Describe the app, its users, key screens, and the behavior that must work." />
            <div className="mt-5 grid gap-5 sm:grid-cols-2"><div><label className="text-sm font-extrabold text-slate-800" htmlFor="forge-website">Existing website</label><input id="forge-website" type="url" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://example.com" className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" /></div><div><label className="text-sm font-extrabold text-slate-800" htmlFor="forge-files">Reference files</label><input id="forge-files" type="file" multiple onChange={addFiles} className="mt-3 block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-white file:px-2 file:py-1.5 file:font-bold" /></div></div>
            {references.length > 0 && <p className="mt-3 text-xs font-semibold text-slate-500">{references.length} reference file{references.length === 1 ? "" : "s"} attached.</p>}
            {error && <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700" role="alert">{error}</p>}
            {result && <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">Request created. Continue through secure checkout to send it to review.</p>}
            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-400">Your brief is kept private and only shared with the build team.</p><button type="submit" disabled={busy} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Preparing checkout..." : "Review and pay"}</button></div>
          </form>

          <aside className="space-y-5"><div className="rounded-[24px] border border-slate-200 bg-slate-950 p-6 text-white"><p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">What happens next</p><div className="mt-6 space-y-5">{["We review your product brief", "You confirm the secure payment", "A build specialist scopes the work", "Your Android build enters production"].map((step, index) => <div key={step} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-black">{index + 1}</span><p className="pt-0.5 text-sm font-semibold leading-5 text-slate-200">{step}</p></div>)}</div></div><div className="rounded-[24px] border border-slate-200 bg-white p-6"><p className="font-extrabold">A better brief makes a better build.</p><p className="mt-2 text-sm leading-6 text-slate-500">Include your target users, must-have screens, sign-in needs, and anything that should feel exactly like the original product.</p><Link to="/help" className="mt-4 inline-flex text-sm font-extrabold text-blue-600 hover:text-blue-700">Read the brief guide →</Link></div></aside>
        </div>
      </div>
    </main>
  );
}

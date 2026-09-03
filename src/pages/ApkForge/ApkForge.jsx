import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { createApkForgeBrief } from "../../services/apkForge";

const inspectFile = async (file) => {
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer());
  const signature = head.length === 2 ? String.fromCharCode(head[0], head[1]) : "";
  const lower = file.name.toLowerCase();
  const executable = signature === "MZ" || /\.(exe|dll|msi|com|scr|bin)$/.test(lower);
  return {
    name: file.name,
    size: file.size,
    mimeType: file.type || "unknown",
    signature,
    detectedType: executable ? "executable_or_binary" : "reference",
  };
};

export default function ApkForge() {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [references, setReferences] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const addFiles = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, 8);
    const inspected = await Promise.all(files.map(inspectFile));
    setReferences(inspected);
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const idToken = await user.getIdToken();
      const payload = await createApkForgeBrief({ description, idToken, references });
      setResult(payload);
    } catch (cause) {
      setError(cause.message || "Forge could not prepare the build brief.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">APK Forge</span>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Turn your existing product into an Android build plan.</h1>
          <p className="mt-3 max-w-3xl text-slate-600">Describe what you want, add screenshots or reference files, and Forge converts the evidence into a build-ready Android implementation brief.</p>
        </div>

        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <label className="text-sm font-bold text-slate-800" htmlFor="forge-description">What should the app do?</label>
            <textarea id="forge-description" value={description} onChange={(event) => setDescription(event.target.value)} required maxLength={12000} rows={12} className="mt-3 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" placeholder="Example: Recreate my desktop app as a modern Android app. Keep the login, dashboard, search and export workflow, but improve the mobile UX." />

            <label className="mt-6 block text-sm font-bold text-slate-800" htmlFor="forge-files">Reference files</label>
            <input id="forge-files" type="file" multiple onChange={addFiles} className="mt-3 block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm" />
            <p className="mt-2 text-xs text-slate-500">Up to 8 references, 25 MB each. Forge inspects file metadata and signatures; executable content is never executed.</p>

            {references.length > 0 && (
              <div className="mt-4 space-y-2">
                {references.map((file) => (
                  <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
                    <span className="truncate font-semibold">{file.name}</span>
                    <span className={file.detectedType === "executable_or_binary" ? "font-bold text-amber-700" : "text-slate-500"}>{file.detectedType}</span>
                  </div>
                ))}
              </div>
            )}

            {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div>}

            <button type="submit" disabled={busy || !description.trim()} className="mt-6 w-full rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? "Preparing Forge brief…" : "Prepare Android build brief →"}
            </button>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-black">Forge pipeline</h2>
            <div className="mt-5 space-y-4">
              {[
                ["01", "Understand", "Combine your description with visible reference evidence."],
                ["02", "Normalize", "Detect renamed executables and keep untrusted binaries inert."],
                ["03", "Plan", "Define Android screens, navigation, behavior and acceptance criteria."],
                ["04", "Build handoff", "Prepare a specification for an isolated Android build runner."],
              ].map(([number, title, text]) => (
                <div key={number} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-xs font-black text-indigo-700 shadow-sm">{number}</span>
                  <div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div>
                </div>
              ))}
            </div>
          </aside>
        </form>

        {result?.forge && (
          <section className="mt-6 rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Forge ready</p><h2 className="mt-1 text-xl font-black">Android implementation handoff</h2></div>
              {result.forge.warnings?.length > 0 && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Safety warning included</span>}
            </div>
            <pre className="mt-5 max-h-[32rem] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">{JSON.stringify(result.forge, null, 2)}</pre>
          </section>
        )}
      </div>
    </main>
  );
}

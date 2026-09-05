import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const statusCopy = {
  PAYMENT_REQUIRED: "Payment required",
  PAYMENT_PENDING: "Payment processing",
  PENDING_REVIEW: "Waiting for review",
  APPROVED: "Approved",
  BUILDING: "Building APK",
  VERIFYING: "Verifying APK",
  READY: "Ready to download",
  BUILD_FAILED: "Build failed",
  REJECTED: "Rejected",
};

const formatDate = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const formatAmount = (amount, currency) => amount == null ? "" : `${currency === "INR" ? "₹" : `${currency} `}${Number(amount).toLocaleString("en-IN")}`;

export default function ApkForgeBuilds() {
  const { user } = useAuth();
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/apk-forge-history", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to load your Forge builds.");
      setBuilds(Array.isArray(data.builds) ? data.builds : []);
    } catch (cause) {
      console.error("Unable to load Forge builds", cause);
      setError(cause.message || "Unable to load your Forge builds.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const download = async (forgeRequestId) => {
    if (!user) return;
    setDownloading(forgeRequestId);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/apk-forge-download?forgeRequestId=${encodeURIComponent(forgeRequestId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) throw new Error(data.message || "Unable to prepare your APK download.");
      window.location.assign(data.url);
    } catch (cause) {
      console.error("Forge APK download failed", cause);
      setError(cause.message || "Unable to download the APK.");
    } finally {
      setDownloading("");
    }
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">APK Forge</span>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">My Builds</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Your Forge requests and ready-to-download Android builds, all tied to your account.</p>
          </div>
          <button type="button" onClick={load} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50">{loading ? "Refreshing…" : "Refresh"}</button>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">{error}</div>}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm"><p className="font-semibold text-slate-600">Loading your builds…</p></div>
        ) : builds.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-2xl">📦</div><h2 className="mt-4 text-xl font-black">No Forge builds yet</h2><p className="mt-2 text-sm text-slate-500">Your paid APK Forge requests will appear here.</p></div>
        ) : (
          <div className="space-y-4">
            {builds.map((build) => {
              const ready = build.status === "READY" && build.apkReady;
              return (
                <article key={build.forgeRequestId} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${ready ? "bg-emerald-100 text-emerald-700" : build.status === "BUILD_FAILED" ? "bg-red-100 text-red-700" : "bg-indigo-50 text-indigo-700"}`}>{statusCopy[build.status] || build.status}</span>
                        {build.amountInr != null && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{formatAmount(build.amountInr, build.currency)}</span>}
                      </div>
                      <h2 className="mt-3 text-lg font-black">{build.appName || "PromptStudio AI"}</h2>
                      <p className="mt-1 text-xs text-slate-500">Created {formatDate(build.createdAt)}</p>
                      <p className="mt-1 truncate font-mono text-xs text-slate-400">{build.forgeRequestId}</p>
                    </div>
                    <div className="shrink-0">
                      {ready ? (
                        <button type="button" onClick={() => download(build.forgeRequestId)} disabled={downloading === build.forgeRequestId} className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">{downloading === build.forgeRequestId ? "Preparing…" : "Download APK ↓"}</button>
                      ) : (
                        <span className="inline-flex rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500">{build.status === "BUILDING" || build.status === "VERIFYING" ? "Build in progress" : "Not ready yet"}</span>
                      )}
                    </div>
                  </div>
                  {build.buildFinishedAt && <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">Last build activity: {formatDate(build.buildFinishedAt)}</div>}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

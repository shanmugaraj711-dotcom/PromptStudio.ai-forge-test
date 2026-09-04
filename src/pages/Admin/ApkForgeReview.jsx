import { useCallback, useEffect, useState } from "react";

const statusStyles = {
  PENDING_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  EXPIRED: "bg-slate-100 text-slate-600 border-slate-200",
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = value?._seconds ? new Date(value._seconds * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

const formatBytes = (value) => {
  const bytes = Number(value || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ApkForgeReview({ api }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [reason, setReason] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const body = await api("/api/apk-forge-review");
      setRequests(body.requests || []);
    } catch (cause) {
      setError(cause.message || "Could not load APK Forge review queue.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const decide = async (request, decision) => {
    if (decision === "REJECT" && !window.confirm("Reject this Forge request and queue its full payment refund?")) return;
    if (decision === "APPROVE" && !window.confirm("Approve this request for an isolated Android build?")) return;
    setWorkingId(request.id);
    setError("");
    setMessage("");
    try {
      const body = await api("/api/apk-forge-review", {
        method: "POST",
        body: JSON.stringify({ forgeRequestId: request.id, decision, reason: reason[request.id] || "" }),
      });
      setMessage(decision === "APPROVE" ? `${request.id} approved for build.` : `${request.id} rejected; refund queued.`);
      setRequests((current) => current.filter((item) => item.id !== request.id));
      if (body.status === "REJECTED") setReason((current) => ({ ...current, [request.id]: "" }));
    } catch (cause) {
      setError(cause.message || "Review action failed. The request was not changed if the server rejected the transition.");
    } finally {
      setWorkingId("");
    }
  };

  return <section className="mt-6 space-y-5">
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">APK Forge · Founder Review</p>
          <h2 className="mt-2 text-2xl font-black">Paid requests waiting for approval</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Approve only requests that are safe and buildable. Approval moves the request into the isolated build pipeline; rejection queues the automatic full refund worker.</p>
        </div>
        <button onClick={load} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-800 hover:bg-slate-50 disabled:opacity-50">{loading ? "Refreshing…" : "Refresh queue"}</button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-amber-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-amber-700">Awaiting review</p><p className="mt-1 text-2xl font-black text-amber-900">{requests.length}</p></div>
        <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Review SLA</p><p className="mt-1 text-2xl font-black text-slate-900">72h</p></div>
        <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Refund on reject</p><p className="mt-1 text-2xl font-black text-emerald-900">100%</p></div>
      </div>
    </div>

    {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">{error}</div>}
    {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{message}</div>}

    {!loading && requests.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="text-lg font-black text-slate-900">Review queue is clear</p><p className="mt-2 text-sm text-slate-500">New paid Forge requests will appear here automatically.</p></div>}

    <div className="space-y-5">
      {requests.map((request) => <article key={request.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-black ${statusStyles[request.status] || statusStyles.PENDING_REVIEW}`}>{request.status || "PENDING_REVIEW"}</span><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">₹{Number(request.amountInr || 0).toLocaleString("en-IN")}</span></div>
              <h3 className="mt-3 break-all font-mono text-sm font-black text-slate-900">{request.id}</h3>
              <p className="mt-1 text-xs text-slate-500">Created {formatDate(request.createdAt)} · Paid {formatDate(request.paidAt)} · User {String(request.uid || "—").slice(0, 16)}…</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs sm:flex">
              <div className="rounded-xl bg-slate-50 px-3 py-2"><p className="font-bold text-slate-400">Platform</p><p className="mt-1 font-black text-slate-800">{request.platform || "android"}</p></div>
              <div className="rounded-xl bg-slate-50 px-3 py-2"><p className="font-bold text-slate-400">Output</p><p className="mt-1 font-black text-slate-800">{request.outputFormat || "APK"}</p></div>
            </div>
          </div>
        </div>
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_.85fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Customer brief</p>
            <div className="mt-2 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{request.description || request.brief || "No description supplied."}</div>
            {request.websiteUrl && <p className="mt-3 break-all text-xs font-semibold text-slate-500">Website origin: <span className="font-mono text-slate-700">{request.websiteUrl}</span></p>}
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Reference evidence</p>
            <div className="mt-2 space-y-2">
              {(request.references || []).length === 0 && <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No reference files.</div>}
              {(request.references || []).map((file, index) => <div key={`${file.name || "reference"}-${index}`} className="rounded-2xl border border-slate-200 p-3"><div className="flex items-start justify-between gap-3"><span className="min-w-0 break-all text-sm font-bold text-slate-800">{file.name || `Reference ${index + 1}`}</span><span className="shrink-0 text-xs font-semibold text-slate-500">{formatBytes(file.size)}</span></div><p className="mt-1 text-xs text-slate-500">{file.detectedType || file.mimeType || "reference"}{file.signature ? ` · signature ${file.signature}` : ""}</p></div>)}
            </div>
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800"><strong>Safety:</strong> executable/binary references are static evidence only. They must never be executed during review or build.</div>
          </div>
        </div>
        <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6">
          <label className="text-xs font-black uppercase tracking-wide text-slate-500" htmlFor={`reason-${request.id}`}>Review note / rejection reason</label>
          <textarea id={`reason-${request.id}`} value={reason[request.id] || ""} onChange={(event) => setReason((current) => ({ ...current, [request.id]: event.target.value.slice(0, 1000) }))} rows={2} maxLength={1000} placeholder="Optional for approval; recommended for rejection." className="mt-2 w-full resize-y rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" />
          <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={() => decide(request, "REJECT")} disabled={workingId === request.id} className="rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-black text-red-700 hover:bg-red-50 disabled:opacity-50">{workingId === request.id ? "Processing…" : "Reject + full refund"}</button><button onClick={() => decide(request, "APPROVE")} disabled={workingId === request.id} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50">{workingId === request.id ? "Processing…" : "Approve for isolated build"}</button></div>
        </div>
      </article>)}
    </div>
  </section>;
}

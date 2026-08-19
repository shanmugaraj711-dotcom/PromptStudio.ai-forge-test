import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function Referral() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await user?.getIdToken();
        const res = await fetch("/api/referral", { headers: { Authorization: `Bearer ${token}` } });
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || "Could not load referral rewards.");
        if (active) setData(body);
      } catch (e) { if (active) setError(e.message || "Could not load referral rewards."); }
      finally { if (active) setBusy(false); }
    })();
    return () => { active = false; };
  }, [user]);

  const link = data?.code ? `${window.location.origin}/signup?ref=${encodeURIComponent(data.code)}` : "";
  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  };

  if (busy) return <div className="rounded-3xl border border-gray-800 bg-gray-900 p-8 text-sm text-gray-300">Loading your referral rewards…</div>;
  if (error) return <div className="rounded-3xl border border-red-500/30 bg-red-950/30 p-6 text-sm text-red-200">{error}</div>;

  return <section className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/70 via-gray-900 to-violet-950/60 p-6 shadow-2xl sm:p-8">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-300">Referral rewards</p><h2 className="mt-2 text-2xl font-black text-white">Invite a creator. Earn bonus credits.</h2><p className="mt-2 text-sm leading-6 text-gray-300">Share your personal link. When a new user signs up through it, the configured reward is credited automatically to both accounts.</p></div>
      <div className="grid grid-cols-2 gap-3 text-center"><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-bold uppercase text-gray-400">You earn</p><p className="mt-1 text-2xl font-black text-white">{data?.enabled ? `${data?.referrals?.length ? "" : ""}${5}` : "—"}</p><p className="text-[10px] text-gray-400">credits*</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-bold uppercase text-gray-400">Friends earn</p><p className="mt-1 text-2xl font-black text-white">{data?.enabled ? 5 : "—"}</p><p className="text-[10px] text-gray-400">credits*</p></div></div>
    </div>
    {data?.enabled ? <><div className="mt-6 flex flex-col gap-2 sm:flex-row"><input readOnly value={link} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-gray-200 outline-none" /><button onClick={copy} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-500">{copied ? "Copied ✓" : "Copy invite link"}</button></div><p className="mt-3 text-[11px] text-gray-500">* Rewards are controlled by the PromptStudio founder and may change. One reward is granted per referred account.</p><div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-300"><strong className="text-white">Successful referrals:</strong> {data?.referrals?.length || 0}</div></> : <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-100">Referral rewards are temporarily unavailable.</div>}
  </section>;
}

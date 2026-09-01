import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createQuotaState } from "../../constants/quota";
import { fetchRuntimeProductConfig } from "../../services/runtimeProductConfig";
import AccountHeader from "../../components/layout/AccountHeader";

export const Dashboard = () => {
  const { user, userProfile, plan, promptsToday, lastPromptDate } = useAuth();
  const [productConfig, setProductConfig] = useState(null);

  useEffect(() => {
    let active = true;
    fetchRuntimeProductConfig(user)
      .then((config) => { if (active) setProductConfig(config); })
      .catch((error) => console.error("Unable to load runtime product config", error));
    return () => { active = false; };
  }, [user]);

  const displayName = userProfile?.name || user?.displayName || "Creator";
  const userEmail = userProfile?.email || user?.email || "N/A";
  const photoURL = userProfile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4F46E5&color=fff`;
  const credits = Math.max(Number(userProfile?.credits || 0), 0);
  const isPro = plan === "pro";
  const quota = createQuotaState(
    { plan, promptsToday, lastPromptDate, imageAnalysesToday: userProfile?.imageAnalysesToday, lastImageAnalysisDate: userProfile?.lastImageAnalysisDate, imageAnalysesThisMonth: userProfile?.imageAnalysesThisMonth, lastImageAnalysisMonth: userProfile?.lastImageAnalysisMonth },
    new Date(),
    productConfig
  );

  const referenceCoding = productConfig?.creditCosts?.referenceCoding || { creditCost: 5, maxReferences: 8, maxImages: 4 };
  const quotaPercent = Math.min(100, (quota.remaining / Math.max(1, quota.dailyLimit)) * 100);

  return (
    <div className="min-h-[calc(100vh-4.75rem)] overflow-x-hidden bg-gray-950 text-gray-100">
      <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-blue-900/60 bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950/70 p-6 shadow-2xl sm:p-9">
          <div className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-700/50 bg-blue-950/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-300">✨ Your PromptStudio workspace</div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Welcome, {displayName}! 👋</h1>
              <p className="mt-2 text-sm text-gray-400">Your creative workspace is ready. See your limits, credits and next best action below.</p>
            </div>
            <Link to="/builder" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-500">🪄 Create New Prompt</Link>
          </div>
        </section>

        <section className="mt-7" aria-labelledby="workspace-overview">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-400">Workspace overview</p><h2 id="workspace-overview" className="mt-1 text-xl font-extrabold text-white">Your usage at a glance</h2></div>
            <Link to="/account#plans" className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-blue-500/50 bg-gradient-to-r from-blue-950/90 via-indigo-950/80 to-blue-900/60 px-5 py-3.5 shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-blue-900/40 sm:w-auto sm:min-w-[230px]">
              <span><span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-blue-300">Plan & credits</span><span className="mt-0.5 block text-sm font-black text-white">{isPro ? "Pro" : "Free"} · {credits} credits</span></span>
              <span className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-md">Manage Plan →</span>
            </Link>
          </div>

          <AccountHeader displayName={displayName} email={userEmail} photoURL={photoURL} plan={plan} quota={quota} credits={credits} isPro={isPro} className="border-blue-900/40 shadow-blue-950/20" />

          <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
            <Link to="/builder" className="group min-w-0 rounded-2xl border border-gray-800 bg-gray-900 p-5 transition hover:-translate-y-0.5 hover:border-blue-600/60 hover:bg-gray-900/90">
              <p className="text-lg">✨</p><h3 className="mt-3 font-black text-white">Build a Prompt</h3><p className="mt-1 text-xs leading-5 text-gray-400">Turn an idea into a ready-to-use prompt with your preferred AI.</p><span className="mt-4 inline-block text-xs font-bold text-blue-400 group-hover:text-blue-300">Open Builder →</span>
            </Link>
            <Link to="/reference-coding" className="group min-w-0 rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-950/50 via-gray-900 to-indigo-950/50 p-5 transition hover:-translate-y-0.5 hover:border-teal-400/60">
              <div className="flex items-center justify-between gap-2"><p className="text-lg">💻</p><span className="rounded-full border border-teal-500/30 bg-teal-950/60 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-teal-300">{referenceCoding.creditCost} credits</span></div>
              <h3 className="mt-3 font-black text-white">Reference → Code Prompt</h3><p className="mt-1 text-xs leading-5 text-gray-400">Show AI your existing UI or files and get a coding-ready implementation prompt.</p><span className="mt-4 inline-block text-xs font-bold text-teal-300 group-hover:text-teal-200">Open Reference Coding →</span>
            </Link>
            <Link to="/history" className="group min-w-0 rounded-2xl border border-gray-800 bg-gray-900 p-5 transition hover:-translate-y-0.5 hover:border-indigo-600/60">
              <p className="text-lg">🕘</p><h3 className="mt-3 font-black text-white">Prompt History</h3><p className="mt-1 text-xs leading-5 text-gray-400">Review prompts you have already created and quickly reuse your work.</p><span className="mt-4 inline-block text-xs font-bold text-indigo-400 group-hover:text-indigo-300">View History →</span>
            </Link>
          </div>
        </section>

        <section className="mt-6 grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="min-w-0 rounded-2xl border border-gray-800 bg-gray-900 p-6 lg:col-span-3">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-400">Today</p><h2 className="mt-1 text-lg font-black text-white">Prompt usage</h2></div><span className="text-sm font-black text-white">{quota.remaining} left</span></div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-800"><div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${quotaPercent}%` }} /></div>
            <div className="mt-3 flex justify-between text-xs text-gray-400"><span>{quota.dailyLimit - quota.remaining} used</span><span>{quota.dailyLimit} daily limit</span></div>
            {!isPro && quota.remaining === 0 && <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4"><p className="text-sm font-bold text-amber-100">Today's free prompts are used.</p><p className="mt-1 text-xs text-amber-200/70">Upgrade to Pro or use credits to keep creating.</p><Link to="/account#plans" className="mt-3 inline-flex rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">See options →</Link></div>}
          </div>

          <div className="min-w-0 rounded-2xl border border-teal-500/25 bg-gradient-to-br from-gray-900 to-teal-950/40 p-6 lg:col-span-2">
            <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-300">Reference Coding</p><h2 className="mt-1 text-lg font-black text-white">Built for existing products</h2></div><span className="text-2xl">💻</span></div>
            <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-[10px] uppercase tracking-wider text-gray-500">Per generation</p><p className="mt-1 text-lg font-black text-white">{referenceCoding.creditCost} credits</p></div><div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-[10px] uppercase tracking-wider text-gray-500">References</p><p className="mt-1 text-lg font-black text-white">Up to {referenceCoding.maxReferences}</p></div></div>
            <p className="mt-4 text-xs leading-5 text-gray-400">Use screenshots, source files or an existing application reference. Your purchased credits never expire.</p>
            <Link to="/account#plans" className="mt-4 inline-flex text-xs font-bold text-teal-300 hover:text-teal-200">See credit packs & pricing →</Link>
          </div>
        </section>
      </main>
    </div>
  );
};
export default Dashboard;

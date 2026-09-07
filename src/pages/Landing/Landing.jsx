import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createQuotaState } from "../../constants/quota";

function AppIcon({ small = false }) {
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20 ${small ? "h-9 w-9" : "h-12 w-12"}`} aria-hidden="true">
      <span className="absolute h-5 w-5 rotate-45 rounded-[5px] border-[3px] border-white" />
      <span className="absolute h-2.5 w-2.5 rounded-[3px] bg-white" />
    </span>
  );
}

function UsageCard({ quota, plan }) {
  const used = quota.dailyLimit - quota.remaining;
  const progress = quota.dailyLimit ? Math.min((used / quota.dailyLimit) * 100, 100) : 0;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Usage and upgrade status">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Daily usage</p><p className="mt-1 text-sm font-extrabold text-slate-900">{quota.remaining} prompts left</p></div>
        <Link to="/account#plans" className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-blue-700">{plan === "pro" ? "Manage plan" : "Upgrade"}</Link>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} /></div>
      <p className="mt-2 text-xs text-slate-500">{used} of {quota.dailyLimit} used today · Resets tomorrow</p>
    </section>
  );
}

function ForgeHome() {
  const { userProfile, plan, promptsToday, lastPromptDate } = useAuth();
  const quota = createQuotaState({ plan, promptsToday, lastPromptDate });
  const firstName = userProfile?.displayName?.split(" ")[0] || "there";
  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 pb-24 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-3" aria-label="PromptStudio AI home"><AppIcon small /><span className="text-base font-black tracking-[-0.03em]">PromptStudio <span className="text-blue-600">AI</span></span></Link>
          <Link to="/account" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100" aria-label="Open menu"><span className="flex w-5 flex-col gap-1"><span className="h-0.5 w-full rounded bg-current" /><span className="h-0.5 w-3/4 self-end rounded bg-current" /><span className="h-0.5 w-full rounded bg-current" /></span></Link>
        </div>
      </header>
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-8">
        <div><p className="text-sm font-semibold text-slate-500">Welcome back, {firstName}</p><h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">What are you creating today?</h1></div>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/builder?mode=image" className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600" aria-hidden="true"><span className="h-5 w-5 rounded-md border-2 border-current" /></span><p className="mt-4 text-sm font-extrabold">Image <span className="text-slate-400">→</span> Prompt</p><p className="mt-1 text-xs leading-5 text-slate-500">Turn visuals into a precise prompt</p></Link>
          <Link to="/reference-coding" className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700" aria-hidden="true"><span className="font-mono text-lg font-bold">&lt;/&gt;</span></span><p className="mt-4 text-sm font-extrabold">Reference <span className="text-slate-400">→</span> Code</p><p className="mt-1 text-xs leading-5 text-slate-500">Build context from your files</p></Link>
        </div>
        <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black">Recent</h2><Link to="/history" className="text-xs font-bold text-blue-600">View history</Link></div><div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-7 text-center"><p className="text-sm font-bold text-slate-700">Your recent work will appear here</p><p className="mt-1 text-xs text-slate-500">Start with one of the tools above.</p></div></section>
        <UsageCard quota={quota} plan={plan} />
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur" aria-label="Bottom navigation"><div className="mx-auto grid h-16 max-w-2xl grid-cols-4 px-3"><Link to="/" className="flex flex-col items-center justify-center gap-1 text-blue-600"><span className="text-lg font-bold" aria-hidden="true">⌂</span><span className="text-[11px] font-extrabold">Home</span></Link><Link to="/builder" className="flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-blue-600"><span className="text-xl leading-none" aria-hidden="true">+</span><span className="text-[11px] font-bold">Create</span></Link><Link to="/history" className="flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-blue-600"><span className="text-base font-bold" aria-hidden="true">◷</span><span className="text-[11px] font-bold">History</span></Link><Link to="/account" className="flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-blue-600"><span className="text-base font-bold" aria-hidden="true">○</span><span className="text-[11px] font-bold">Account</span></Link></div></nav>
    </main>
  );
}

function Landing() {
  return <ForgeHome />;
}

export default Landing;

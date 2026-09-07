import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createQuotaState } from "../../constants/quota";

function AppIcon({ small = false }) {
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-[14px] bg-blue-600 shadow-lg shadow-blue-600/25 ${small ? "h-10 w-10" : "h-14 w-14"}`} aria-hidden="true">
      <span className="absolute h-5 w-5 rotate-45 rounded-[5px] border-[3px] border-white" />
      <span className="absolute h-2.5 w-2.5 rounded-[3px] bg-white" />
    </span>
  );
}

function ToolCard({ to, eyebrow, title, description, tone = "blue", mark }) {
  return (
    <Link to={to} className="group flex min-h-[174px] flex-col justify-between rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.55)] transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_18px_40px_-22px_rgba(37,99,235,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
      <div className="flex items-start justify-between gap-3"><span className={`grid h-11 w-11 place-items-center rounded-2xl text-sm font-black ${tone === "blue" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-700"}`} aria-hidden="true">{mark}</span><span className="text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" aria-hidden="true">↗</span></div>
      <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{eyebrow}</p><h2 className="mt-1 text-base font-black tracking-[-0.02em] text-slate-950">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>
    </Link>
  );
}

function UsageCard({ quota, plan }) {
  const used = quota.dailyLimit - quota.remaining;
  const progress = quota.dailyLimit ? Math.min((used / quota.dailyLimit) * 100, 100) : 0;
  return <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.55)]" aria-label="Usage and upgrade status"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Your workspace</p><p className="mt-1 text-sm font-black text-slate-950">{quota.remaining} prompts remaining</p></div><Link to="/account#plans" className="rounded-xl bg-blue-600 px-3.5 py-2.5 text-xs font-black text-white transition hover:bg-blue-700">{plan === "pro" ? "Manage plan" : "Upgrade"}</Link></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-xs text-slate-500">{used} of {quota.dailyLimit} used today · Resets tomorrow</p></section>;
}

function ForgeHome() {
  const { userProfile, plan, promptsToday, lastPromptDate } = useAuth();
  const quota = createQuotaState({ plan, promptsToday, lastPromptDate });
  const firstName = userProfile?.displayName?.split(" ")[0] || "there";
  return <main className="min-h-screen overflow-x-hidden bg-slate-50 pb-24 text-slate-950"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-[72px] max-w-5xl items-center justify-between px-5 sm:px-8"><Link to="/" className="flex items-center gap-3" aria-label="PromptStudio AI home"><AppIcon small /><span className="text-lg font-black tracking-[-0.04em]">PromptStudio <span className="text-blue-600">AI</span></span></Link><Link to="/account" className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950" aria-label="Open account"><span className="flex w-5 flex-col gap-1"><span className="h-0.5 w-full rounded bg-current" /><span className="h-0.5 w-3/4 self-end rounded bg-current" /><span className="h-0.5 w-full rounded bg-current" /></span></Link></div></header><div className="mx-auto flex max-w-5xl flex-col gap-8 px-5 py-10 sm:px-8 sm:py-14"><section className="max-w-2xl"><p className="text-sm font-bold text-blue-600">Welcome back, {firstName}</p><h1 className="mt-3 text-4xl font-black leading-[1.05] tracking-[-0.06em] text-slate-950 sm:text-5xl">Turn your ideas into something real.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">A focused workspace for transforming inspiration into polished prompts and production-ready apps.</p></section><section><div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Start creating</p><h2 className="mt-1 text-xl font-black tracking-[-0.03em]">Choose your craft</h2></div></div><div className="grid gap-3 sm:grid-cols-2"><ToolCard to="/builder?mode=image" eyebrow="Visual thinking" title="Image to Prompt" description="Turn a visual reference into a precise, usable prompt." mark="▧" /><ToolCard to="/reference-coding" eyebrow="Build faster" title="Reference to Code" description="Give your files context and shape them into working code." tone="slate" mark="&lt;/&gt;" /></div></section><section><div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Your workspace</p><h2 className="mt-1 text-xl font-black tracking-[-0.03em]">Recent work</h2></div><Link to="/history" className="text-xs font-black text-blue-600 hover:text-blue-700">View history ↗</Link></div><div className="rounded-[22px] border border-dashed border-slate-300 bg-white px-5 py-9 text-center"><p className="text-sm font-black text-slate-700">Your creative trail starts here.</p><p className="mt-1 text-xs text-slate-500">Choose a tool above to make your first piece.</p></div></section><UsageCard quota={quota} plan={plan} /></div><nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur" aria-label="Bottom navigation"><div className="mx-auto grid h-[72px] max-w-5xl grid-cols-4 px-3"><Link to="/" className="flex flex-col items-center justify-center gap-1 text-blue-600"><span className="text-lg font-bold" aria-hidden="true">⌂</span><span className="text-[11px] font-black">Home</span></Link><Link to="/builder" className="flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-blue-600"><span className="text-xl leading-none" aria-hidden="true">+</span><span className="text-[11px] font-bold">Create</span></Link><Link to="/history" className="flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-blue-600"><span className="text-base font-bold" aria-hidden="true">◷</span><span className="text-[11px] font-bold">History</span></Link><Link to="/account" className="flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-blue-600"><span className="text-base font-bold" aria-hidden="true">○</span><span className="text-[11px] font-bold">Account</span></Link></div></nav></main>;
}

function Landing() {
  return <ForgeHome />;
}

export default Landing;

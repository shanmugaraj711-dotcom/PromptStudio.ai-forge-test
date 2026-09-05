import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { createQuotaState } from "../../constants/quota";
import { useAuth } from "../../context/AuthContext";
import { fetchRuntimeProductConfig } from "../../services/runtimeProductConfig";

const baseNavItems = [
  { to: "/dashboard", label: "⌂ Dashboard" },
  { to: "/builder", label: "🪄 Builder" },
  { to: "/history", label: "📜 History", feature: "promptHistory" },
  { to: "/apk-forge/my-builds", label: "📦 My Builds" },
  { to: "/account", label: "⚙️ Account" },
  { to: "/transactions", label: "💳 Transactions" },
  { to: "/referral", label: "🎁 Refer & Earn" },
  { to: "/help", label: "❓ Help" },
];

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const { user, plan, promptsToday, lastPromptDate, logout } = useAuth();
  const [productConfig, setProductConfig] = useState(null);
  const quota = createQuotaState({ plan, promptsToday, lastPromptDate }, new Date(), productConfig);
  const quotaLabel = quota.remaining === null ? "∞ left" : `${quota.remaining}/${quota.dailyLimit} left`;
  const navItems = baseNavItems.filter((item) => !item.feature || productConfig?.features?.[item.feature]?.enabled !== false);

  useEffect(() => {
    let active = true;
    fetchRuntimeProductConfig(user)
      .then((config) => { if (active) setProductConfig(config); })
      .catch((error) => console.error("Unable to load runtime product config", error));
    return () => { active = false; };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[4.5rem] max-w-7xl items-center gap-3 px-3 sm:gap-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="group flex shrink-0 items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-50" aria-label="PromptStudio AI dashboard">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-base text-white shadow-md shadow-blue-600/20">⌂</span>
            <div>
              <div className="text-lg font-black tracking-[-0.04em] text-slate-950 sm:text-2xl">PromptStudio <span className="text-blue-600 transition group-hover:text-blue-400">AI</span></div>
              <div className="mt-0.5 hidden text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:block">Creative Intelligence</div>
            </div>
          </Link>
          <div className="hidden h-8 w-px bg-slate-200 xl:block" />
          <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary navigation">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `relative shrink-0 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 ${isActive ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>
                {item.label}
              </NavLink>
            ))}
            <Link to="/contact" className="shrink-0 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950">Contact</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => navigate("/account#plans")} className="group rounded-full border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-2 text-xs font-extrabold text-blue-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md sm:px-4 sm:text-sm" title="View your plan and usage" aria-label={`View usage: ${quotaLabel}`}>
              <span className="mr-1">⚡</span>{quotaLabel}
            </button>
            <button type="button" onClick={handleLogout} className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 xl:inline-flex">Logout</button>
          </div>
        </div>
        <div className="border-t border-slate-100 xl:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-3 py-2.5 touch-pan-x sm:px-6">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition ${isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                {item.label}
              </NavLink>
            ))}
            <Link to="/contact" className="shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Contact</Link>
            <button type="button" onClick={handleLogout} className="shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900">Logout</button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

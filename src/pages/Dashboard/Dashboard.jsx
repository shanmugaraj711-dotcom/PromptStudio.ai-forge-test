import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createQuotaState } from "../../constants/quota";

export const Dashboard = () => {
  const { user, userProfile, logout, plan, promptsToday, lastPromptDate } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const displayName = userProfile?.name || user?.displayName || "Creator";
  const userEmail = userProfile?.email || user?.email || "N/A";
  const currentPlan = plan;
  const quota = createQuotaState({ plan, promptsToday, lastPromptDate });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/dashboard" className="text-xl font-extrabold tracking-tight text-indigo-400">
            PromptStudio AI
          </Link>
          <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-950/80 border border-indigo-800 rounded-full">
            {currentPlan} Plan
          </span>
        </div>

        <nav className="flex items-center space-x-4">
          <Link
            to="/account"
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Account
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-400 hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome, {displayName}! 👋
              </h1>
              <p className="mt-1 text-sm text-gray-400 font-mono">
                {userEmail}
              </p>
            </div>
            <Link
              to="/builder"
              className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
            >
              + Create New Prompt
            </Link>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Plan Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Current Plan
              </span>
              <span className="p-2 bg-indigo-950/60 text-indigo-400 rounded-lg text-lg">
                💳
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-extrabold capitalize text-white">
                {currentPlan}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {currentPlan === "free" ? "Limited daily usage" : "Unlimited access unlocked"}
              </p>
            </div>
          </div>

          {/* Usage Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Today's Prompt Usage
              </span>
              <span className="p-2 bg-indigo-950/60 text-indigo-400 rounded-lg text-lg">
                ⚡
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-extrabold text-white">
                {quota.remaining === null
                  ? "Unlimited prompts"
                  : `${quota.remaining} / ${quota.dailyLimit} remaining`}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {quota.remaining === 0
                  ? "Daily free limit reached"
                  : "Resets daily at midnight UTC"}
              </p>
            </div>
          </div>

          {/* Quick Status Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl flex flex-col justify-between sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                System Status
              </span>
              <span className="p-2 bg-green-950/60 text-green-400 rounded-lg text-lg">
                🟢
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-extrabold text-white">
                Engine Active
              </div>
              <p className="mt-1 text-xs text-gray-400">
                All AI prompt optimization models operational
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-200">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Action 1: Generate Prompt */}
            <Link
              to="/builder"
              className="group bg-gray-900 border border-gray-800 hover:border-indigo-500/60 rounded-xl p-6 shadow-xl transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800 flex items-center justify-center text-indigo-400 font-bold mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  🪄
                </div>
                <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  Generate Prompt
                </h3>
                <p className="mt-1 text-xs text-gray-400">
                  Build and refine AI prompts with structural optimization.
                </p>
              </div>
              <span className="mt-4 text-xs font-semibold text-indigo-400 flex items-center">
                Launch Builder &rarr;
              </span>
            </Link>

            {/* Action 2: History */}
            <Link
              to="/history"
              className="group bg-gray-900 border border-gray-800 hover:border-indigo-500/60 rounded-xl p-6 shadow-xl transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800 flex items-center justify-center text-indigo-400 font-bold mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  📜
                </div>
                <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  History
                </h3>
                <p className="mt-1 text-xs text-gray-400">
                  View and manage your previously generated prompt templates.
                </p>
              </div>
              <span className="mt-4 text-xs font-semibold text-indigo-400 flex items-center">
                View history &rarr;
              </span>
            </Link>

            {/* Action 3: Account */}
            <Link
              to="/account"
              className="group bg-gray-900 border border-gray-800 hover:border-indigo-500/60 rounded-xl p-6 shadow-xl transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800 flex items-center justify-center text-indigo-400 font-bold mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  ⚙️
                </div>
                <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  Account Settings
                </h3>
                <p className="mt-1 text-xs text-gray-400">
                  Manage your personal profile, plan settings, and security.
                </p>
              </div>
              <span className="mt-4 text-xs font-semibold text-indigo-400 flex items-center">
                View Account &rarr;
              </span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;


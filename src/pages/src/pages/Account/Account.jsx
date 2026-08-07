import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const Account = () => {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = async () => {
    setError("");
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      setError("Failed to log out. Please try again.");
      setIsLoggingOut(false);
    }
  };

  const displayName = userProfile?.name || user?.displayName || "User";
  const email = userProfile?.email || user?.email || "N/A";
  const photoURL =
    userProfile?.photoURL ||
    user?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName
    )}&background=4F46E5&color=fff`;

  const currentPlan = userProfile?.plan || "free";
  const promptsToday = userProfile?.promptsToday ?? 0;

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const memberSince = formatDate(userProfile?.createdAt);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-indigo-400">
            Account Settings
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Manage your PromptStudio AI profile, subscription, and usage.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-950/80 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-center space-x-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Main Profile Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8">
          {/* User Details Header */}
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-gray-800">
            <img
              src={photoURL}
              alt={displayName}
              className="w-20 h-20 rounded-full border-2 border-indigo-500/80 object-cover shadow-lg"
            />
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-white">{displayName}</h2>
              <p className="text-sm font-mono text-gray-400 mt-1">{email}</p>
            </div>
          </div>

          {/* Account Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Plan Details */}
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Current Plan
              </span>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-bold text-white capitalize">
                  {currentPlan}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 uppercase">
                  Active
                </span>
              </div>
            </div>

            {/* Prompt Usage Details */}
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Today's Usage
              </span>
              <div className="mt-2">
                <span className="text-lg font-bold text-white">
                  {promptsToday} {currentPlan === "free" ? "/ 5" : "Prompts"}
                </span>
              </div>
            </div>

            {/* Membership Date */}
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Member Since
              </span>
              <div className="mt-2">
                <span className="text-sm font-semibold text-gray-200">
                  {memberSince}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 space-y-4 border-t border-gray-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Upgrade Button */}
              <div className="relative w-full sm:w-auto flex-1">
                <button
                  type="button"
                  disabled
                  className="w-full flex items-center justify-center space-x-2 px-5 py-3 border border-indigo-500/30 rounded-xl font-semibold text-indigo-300/50 bg-indigo-950/20 cursor-not-allowed opacity-75"
                >
                  <span>Upgrade to Pro</span>
                  <span className="bg-indigo-900/60 text-indigo-300 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border border-indigo-700/50">
                    Coming Soon
                  </span>
                </button>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full sm:w-auto px-6 py-3 border border-red-500/30 rounded-xl font-semibold text-red-400 bg-red-950/20 hover:bg-red-900/40 hover:border-red-500/60 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 transition-colors"
              >
                {isLoggingOut ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Logging out...</span>
                  </div>
                ) : (
                  "Logout"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;

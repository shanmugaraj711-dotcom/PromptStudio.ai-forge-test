import React from 'react';

/**
 * Reusable AccountHeader component for displaying user profile, plan details, 
 * and credit balances consistently across the dashboard and account pages.
 */
export const AccountHeader = ({
  displayName,
  email,
  photoURL,
  plan,
  quota,
  credits,
  isPro,
  className = ""
}) => {
  return (
    <div className={`rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-2xl sm:p-8 ${className}`}>
      <div className="flex flex-col items-center gap-4 border-b border-gray-800 pb-7 sm:flex-row sm:gap-6">
        <img 
          src={photoURL} 
          alt={displayName} 
          className="h-20 w-20 rounded-full border-2 border-indigo-500/80 object-cover shadow-lg" 
        />
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold text-white">{displayName}</h2>
          <p className="mt-1 text-sm font-mono text-gray-400">{email}</p>
        </div>
      </div>
      
      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Plan Block */}
        <div className="rounded-2xl border border-indigo-700/40 bg-indigo-950/30 p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Current Plan</span>
          <div className="mt-2 text-2xl font-black capitalize text-white">{plan}</div>
          <p className="mt-1 text-xs text-gray-400">
            {isPro
              ? `${quota.dailyLimit} prompts daily · ${quota.monthlyImageLimit ?? 0} image prompts monthly`
              : `${quota.dailyLimit} prompts daily · ${quota.dailyImageLimit ?? 0} image prompt daily`}
          </p>
        </div>

        {/* Quota Block */}
        <div className="rounded-2xl border border-gray-700/60 bg-gray-800/40 p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Today's Usage</span>
          <div className="mt-2 text-2xl font-black text-white">{quota.remaining} / {quota.dailyLimit}</div>
          <p className="mt-1 text-xs text-gray-400">prompts remaining</p>
        </div>

        {/* Credits Block */}
        <div className="rounded-2xl border border-gray-700/60 bg-gray-800/40 p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Purchased Credits</span>
          <div className="mt-2 text-2xl font-black text-white">{credits}</div>
          <p className="mt-1 text-xs text-gray-400">Never expire · 2 text / 5 image credits</p>
        </div>
      </div>
    </div>
  );
};

export default AccountHeader;

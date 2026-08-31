export default function CreditBadge({ quota, credits }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
      <span>{quota?.remaining ?? 0} prompts left</span>
      <span className="text-slate-300">·</span>
      <span>{credits} credits</span>
    </div>
  );
}

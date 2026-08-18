import { Link } from "react-router-dom";

export default function Refund() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-300">PromptStudio AI</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Refund & Cancellation Policy</h1>
        <p className="mt-3 text-sm text-slate-400">Last updated: August 18, 2026</p>
        <div className="mt-10 space-y-8 text-sm leading-7 text-slate-300">
          <section><h2 className="text-lg font-black text-white">1. Digital credits</h2><p className="mt-2">PromptStudio AI credit packs are digital services. The amount, credits, and price are shown before you confirm a purchase.</p></section>
          <section><h2 className="text-lg font-black text-white">2. Failed or incomplete payments</h2><p className="mt-2">If a payment is successfully charged but credits are not delivered, contact support with the payment date and amount. We will verify the transaction and either deliver the eligible credits or resolve the payment issue.</p></section>
          <section><h2 className="text-lg font-black text-white">3. Duplicate or erroneous charges</h2><p className="mt-2">If you believe you were charged more than once for the same purchase or charged in error, contact support promptly. We will investigate the transaction records and, where appropriate, arrange a refund through the payment provider.</p></section>
          <section><h2 className="text-lg font-black text-white">4. Refund requests</h2><p className="mt-2">Refund requests are reviewed case by case, taking into account transaction status, whether credits were used, duplicate or technical errors, and applicable consumer requirements. Credits already consumed may not be refundable except where required by applicable law or where the charge was erroneous.</p></section>
          <section><h2 className="text-lg font-black text-white">5. How to contact us</h2><p className="mt-2">Use PromptStudio AI support and include the purchase date and amount. Do not send card numbers, CVV, OTPs, passwords, or API secrets.</p></section>
        </div>
        <Link to="/" className="mt-10 inline-flex text-sm font-bold text-indigo-300 hover:text-white">Back to Home</Link>
      </section>
    </main>
  );
}

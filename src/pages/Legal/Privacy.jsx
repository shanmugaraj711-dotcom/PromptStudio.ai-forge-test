import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-300">PromptStudio AI</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-400">Last updated: August 18, 2026</p>
        <div className="mt-10 space-y-8 text-sm leading-7 text-slate-300">
          <section><h2 className="text-lg font-black text-white">1. Information we handle</h2><p className="mt-2">We may process account information such as your email address, authentication identifiers, usage and credit information, transaction references, prompts you choose to save, and support messages you submit.</p></section>
          <section><h2 className="text-lg font-black text-white">2. How we use information</h2><p className="mt-2">We use information to provide and secure PromptStudio AI, authenticate accounts, calculate usage and credits, process purchases, maintain transaction records, respond to support requests, prevent abuse, and improve the service.</p></section>
          <section><h2 className="text-lg font-black text-white">3. Payments</h2><p className="mt-2">Payments are processed by our payment provider. PromptStudio AI does not ask you to send card numbers, CVV, OTPs, or payment passwords through support chat. We retain appropriate transaction references needed to deliver credits, reconcile purchases, and handle support.</p></section>
          <section><h2 className="text-lg font-black text-white">4. AI and third-party services</h2><p className="mt-2">PromptStudio AI may use third-party infrastructure and AI providers to deliver requested features. We send information needed to perform the requested operation and apply reasonable safeguards to service credentials.</p></section>
          <section><h2 className="text-lg font-black text-white">5. Retention and security</h2><p className="mt-2">We retain information for as long as reasonably necessary for account operation, transactions, support, security, and applicable obligations. No online service can guarantee absolute security, but we use access controls and server-side protections appropriate to the service.</p></section>
          <section><h2 className="text-lg font-black text-white">6. Your choices</h2><p className="mt-2">You may contact us through the Help/Contact channels for account or privacy questions. We may need to verify account ownership before making account-related changes.</p></section>
          <section><h2 className="text-lg font-black text-white">7. Policy updates</h2><p className="mt-2">We may update this policy as our service or requirements change. The latest version will be published on this page.</p></section>
        </div>
        <Link to="/" className="mt-10 inline-flex text-sm font-bold text-indigo-300 hover:text-white">Back to Home</Link>
      </section>
    </main>
  );
}

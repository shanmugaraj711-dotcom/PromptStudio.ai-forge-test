import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-300">PromptStudio AI</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Terms of Service</h1>
        <p className="mt-3 text-sm text-slate-400">Last updated: August 18, 2026</p>
        <div className="mt-10 space-y-8 text-sm leading-7 text-slate-300">
          <section><h2 className="text-lg font-black text-white">1. Service</h2><p className="mt-2">PromptStudio AI provides AI-assisted prompt creation, image-to-prompt tools, prompt history, and related productivity features. Features and limits may change as the service evolves.</p></section>
          <section><h2 className="text-lg font-black text-white">2. Accounts</h2><p className="mt-2">You are responsible for keeping your account credentials secure and for activity performed through your account. Do not share passwords, payment credentials, OTPs, or API secrets with us through support.</p></section>
          <section><h2 className="text-lg font-black text-white">3. Credits and paid features</h2><p className="mt-2">Paid credit packs and other paid features are shown before purchase. Credits are associated with your PromptStudio account and are not transferable. We may apply reasonable usage, fraud-prevention, or abuse limits to protect the service.</p></section>
          <section><h2 className="text-lg font-black text-white">4. Acceptable use</h2><p className="mt-2">Do not use PromptStudio AI for unlawful activity, abuse, fraud, attempts to bypass access controls, or activity that disrupts the service or harms other users.</p></section>
          <section><h2 className="text-lg font-black text-white">5. AI-generated output</h2><p className="mt-2">AI output can be inaccurate or incomplete. You are responsible for reviewing generated prompts and deciding how and where to use them.</p></section>
          <section><h2 className="text-lg font-black text-white">6. Suspension</h2><p className="mt-2">We may suspend or restrict accounts that violate these terms, abuse the service, or create security or payment risk.</p></section>
          <section><h2 className="text-lg font-black text-white">7. Changes</h2><p className="mt-2">We may update these terms when the service or applicable requirements change. Continued use after an update means you accept the updated terms.</p></section>
          <section><h2 className="text-lg font-black text-white">8. Contact</h2><p className="mt-2">For account, payment, or service questions, use the PromptStudio AI Help/Contact channels. Never send card numbers, CVV, OTPs, passwords, or API secrets.</p></section>
        </div>
        <Link to="/" className="mt-10 inline-flex text-sm font-bold text-indigo-300 hover:text-white">Back to Home</Link>
      </section>
    </main>
  );
}

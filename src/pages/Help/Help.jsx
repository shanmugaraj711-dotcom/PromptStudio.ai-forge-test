import { useState } from "react";
import { Link } from "react-router-dom";

const faqs = [
  { q: "What does PromptStudio AI do?", a: "PromptStudio AI turns rough ideas and reference images into clearer, structured prompts that are easier to use with AI tools." },
  { q: "How does Image → Prompt work?", a: "Choose the image option, add a reference image, choose your target style or AI model, and generate. Free accounts receive 1 image analysis per day." },
  { q: "What is included in the Free plan?", a: "Free accounts receive 3 prompt generations per day and 1 reference-image analysis per day, plus access to the core prompt builder." },
  { q: "How do credits work?", a: "Credits are pay-as-you-go. Standard generations use 2 credits and reference-image analysis uses 5 credits. Purchased credits do not expire." },
  { q: "What does Pro include?", a: "Pro currently includes up to 25 prompt generations per day and 20 image analyses per month, plus premium workflow features." },
  { q: "Can I use prompts with different AI tools?", a: "Yes. Select the category or target AI workflow and PromptStudio can show examples and recommended tools for that use case." },
  { q: "Where can I find my previous prompts?", a: "Use History from the top navigation after signing in. Saved and reusable prompt features may depend on your plan." },
  { q: "I paid but my credits or plan did not update. What should I do?", a: "Wait a moment and refresh once. Payments are verified server-side. If the account still looks unchanged, open chat support or send feedback with your payment details (never send your card number or secret codes)." },
];

export default function Help() {
  const [open, setOpen] = useState(0);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-300">PromptStudio AI Help</p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">How can we help?</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400">Start with a quick answer below. Still stuck? Open support chat and send us the question directly.</p>
        </div>

        <div className="mt-10 space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = open === index;
            return (
              <article key={faq.q} className="rounded-2xl border border-slate-800 bg-slate-900">
                <button type="button" onClick={() => setOpen(isOpen ? -1 : index)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                  <span className="text-sm font-bold text-slate-100">{faq.q}</span>
                  <span className="shrink-0 text-indigo-300">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && <div className="border-t border-slate-800 px-5 py-4 text-sm leading-7 text-slate-400">{faq.a}</div>}
              </article>
            );
          })}
        </div>

        <section className="mt-10 rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-6 text-center">
          <h2 className="text-xl font-black">Need a human answer?</h2>
          <p className="mt-2 text-sm text-slate-300">Open the support button and send us the details. We will receive the message in the PromptStudio support inbox.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("promptstudio:open-support"))} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold hover:bg-indigo-500">Open Support Chat</button>
            <Link to="/feedback" className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-slate-900">Send Feedback</Link>
          </div>
        </section>

        <div className="mt-8 text-center text-sm text-slate-500"><Link to="/about" className="hover:text-white">About PromptStudio AI</Link> · <Link to="/" className="hover:text-white">Home</Link></div>
      </section>
    </main>
  );
}

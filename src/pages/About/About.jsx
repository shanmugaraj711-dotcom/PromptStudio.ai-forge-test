import { Link } from "react-router-dom";

const pillars = [
  { icon: "🖼️", title: "Image → Prompt", text: "Turn a reference image into a structured prompt that is easier to reuse across AI creation tools." },
  { icon: "✍️", title: "Better prompts", text: "Transform rough ideas into clearer, more useful prompts for writing, coding, research, and creative work." },
  { icon: "🧭", title: "AI discovery", text: "Get category-aware examples and recommended AI tools so you know where a prompt fits best." },
];

export default function About() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-300">About PromptStudio AI</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Make your ideas easier for AI to understand.</h1>
          <p className="mt-6 text-base leading-8 text-slate-300 sm:text-lg">
            PromptStudio AI is a focused prompt workspace built for creators, developers and everyday AI users. We help people move from a rough idea or reference image to a clearer, reusable prompt without making the process complicated.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/builder" className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-500">Try the Builder</Link>
            <Link to="/help" className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-slate-900">Visit Help Center</Link>
          </div>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <div className="text-2xl">{pillar.icon}</div>
              <h2 className="mt-4 text-xl font-black">{pillar.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{pillar.text}</p>
            </article>
          ))}
        </div>

        <section className="mt-16 rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300">Why we built it</p>
          <h2 className="mt-3 text-2xl font-black sm:text-3xl">AI tools are powerful. Getting the input right should be easier.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            PromptStudio is designed around that gap: improve the prompt, understand the target AI tool, and keep the result useful enough to reuse later. We are starting with prompt optimization and image intelligence, then expanding carefully based on what users actually need.
          </p>
        </section>

        <div className="mt-12 flex flex-wrap gap-5 border-t border-slate-800 pt-8 text-sm text-slate-400">
          <Link to="/help" className="hover:text-white">Help & FAQ</Link>
          <Link to="/feedback" className="hover:text-white">Send feedback</Link>
          <Link to="/" className="hover:text-white">Home</Link>
        </div>
      </section>
    </main>
  );
}

import { Link } from "react-router-dom";
import PublicHeader from "../../components/layout/PublicHeader";

const pillars = [
  { icon: "🖼️", title: "Image → Prompt", text: "Turn a reference image into a structured prompt you can reuse across AI creation tools." },
  { icon: "✍️", title: "Better prompts", text: "Turn rough ideas into clearer prompts for writing, coding, research, and creative work." },
  { icon: "🧭", title: "AI discovery", text: "See useful examples and recommended AI tools for the category you choose." },
];

export default function About() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <PublicHeader />
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-300">About PromptStudio AI</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Your idea in. A better AI prompt out.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">PromptStudio AI is a focused workspace for creators, developers, and everyday AI users. Our standout feature is Image → Prompt: start from a reference image or rough idea and turn it into a clearer, reusable prompt.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/login" className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold hover:bg-indigo-500">Start creating</Link>
            <Link to="/help" className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-slate-900">See how it works</Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="text-2xl">{pillar.icon}</div>
              <h2 className="mt-3 text-lg font-black">{pillar.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{pillar.text}</p>
            </article>
          ))}
        </div>

        <section className="mx-auto mt-8 max-w-4xl rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-6 text-center">
          <p className="text-sm leading-6 text-slate-300">We are building PromptStudio around one simple goal: make the input you give AI clearer, faster, and more useful without adding unnecessary complexity.</p>
        </section>

        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
          <Link to="/" className="hover:text-white">⌂ Home</Link>
          <Link to="/help" className="hover:text-white">Help</Link>
          <Link to="/contact" className="hover:text-white">Contact</Link>
          <Link to="/feedback" className="hover:text-white">Feedback</Link>
        </div>
      </section>
    </main>
  );
}

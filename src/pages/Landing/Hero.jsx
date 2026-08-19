import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';

function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_90%_15%,rgba(124,58,237,0.10),transparent_28%)]" />

      <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-16 sm:pb-20 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              One workspace. Two easy ways to start.
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Start with what you already have.
              <span className="mt-2 block bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                An image or an idea.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              PromptStudio turns reference images, rough ideas, coding tasks, SQL questions and everyday requests into clearer prompts for the AI you choose.
            </p>

            <div className="mt-8 flex flex-wrap gap-2 text-sm font-medium text-slate-600">
              <span className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">🖼️ Image → Prompt</span>
              <span className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">💻 Coding & SQL</span>
              <span className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">✨ Creative prompts</span>
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/image-to-prompt">
                <Button variant="primary" size="lg">🖼️ Image → Prompt</Button>
              </Link>
              <Link to="/builder">
                <Button variant="secondary" size="lg">✍️ Build a Prompt</Button>
              </Link>
              <a href="#how-it-works" className="sm:w-full lg:w-auto">
                <Button variant="secondary" size="md">▶ See how it works</Button>
              </a>
            </div>

            <p className="mt-4 text-xs font-medium text-slate-400">
              Choose your path. Same PromptStudio account, credits and history.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-blue-100/70 via-white to-violet-100/70 blur-2xl" />

            <div className="relative grid gap-4 sm:grid-cols-2">
              <Link
                to="/image-to-prompt"
                className="group rounded-[1.75rem] border border-blue-100 bg-white p-5 shadow-[0_24px_70px_-35px_rgba(37,99,235,0.55)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_30px_80px_-35px_rgba(37,99,235,0.65)]"
              >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-700 p-4">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/70">
                    <span>Reference</span>
                    <span className="rounded-full bg-white/15 px-2 py-1 text-white">AI</span>
                  </div>
                  <div className="mt-4 flex h-36 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                    <div className="relative h-24 w-24 rotate-[-4deg] rounded-2xl bg-gradient-to-br from-amber-200 via-orange-300 to-rose-400 shadow-2xl">
                      <div className="absolute left-5 top-5 h-8 w-14 rounded-full bg-white/60 blur-sm" />
                      <div className="absolute bottom-4 right-4 h-7 w-7 rounded-full bg-white/30" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-white">
                    <span>Image</span><span className="text-white/50">→</span><span>Prompt</span>
                  </div>
                </div>
                <h2 className="mt-5 text-xl font-bold text-slate-950">Have a reference image?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Turn the visual into a detailed, usable AI prompt.</p>
                <span className="mt-4 inline-flex text-sm font-bold text-blue-600">Try Image → Prompt <span className="ml-1 transition group-hover:translate-x-1">→</span></span>
              </Link>

              <Link
                to="/builder"
                className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_30px_80px_-38px_rgba(15,23,42,0.45)]"
              >
                <div className="overflow-hidden rounded-2xl bg-slate-950 p-4">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                    <span className="h-2 w-2 rounded-full bg-amber-300" />
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="ml-auto text-[10px] font-bold text-white/40">PROMPT BUILDER</span>
                  </div>
                  <div className="mt-4 space-y-2 font-mono text-[10px] leading-5">
                    <p className="text-violet-300">goal<span className="text-white/40">:</span> "Build a SQL query"</p>
                    <p className="text-sky-300">context<span className="text-white/40">:</span> "sales table, monthly totals"</p>
                    <p className="text-emerald-300">output<span className="text-white/40">:</span> "clean SQL + explanation"</p>
                    <p className="pt-2 text-white/40">_ refined prompt ready</p>
                  </div>
                </div>
                <h2 className="mt-5 text-xl font-bold text-slate-950">Starting with an idea?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Build prompts for coding, SQL, writing, research and everyday AI work.</p>
                <span className="mt-4 inline-flex text-sm font-bold text-slate-800">Open Prompt Builder <span className="ml-1 transition group-hover:translate-x-1">→</span></span>
              </Link>
            </div>

            <div className="mx-auto mt-4 flex max-w-md items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-xs font-semibold text-slate-500 shadow-lg shadow-slate-200/40 backdrop-blur">
              <span>ChatGPT</span><span className="text-slate-300">•</span><span>Claude</span><span className="text-slate-300">•</span><span>Gemini</span><span className="text-slate-300">•</span><span>More AI</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;

import { getAICatalog } from '../../config/aiCatalog';

function AIDiscoveryPanel({ category, aiModel, onToolSelect, onExample }) {
  const catalog = getAICatalog(category);

  return (
    <div className="mt-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/40 to-violet-50/60 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black text-slate-900">✨ Recommended AI tools for {catalog.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{catalog.subtitle}</p>
        </div>
        <span className="w-fit rounded-full bg-white px-3 py-1 text-[11px] font-bold text-indigo-700 shadow-sm">Explore by category</span>
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
        {catalog.tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => onToolSelect?.({ modelId: tool.modelId })}
            className={`min-w-[230px] snap-start rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md sm:min-w-0 ${aiModel === tool.modelId ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-200 bg-white'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-900">{tool.name}</span>
              {tool.badge && <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-black text-white">{tool.badge}</span>}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{tool.reason}</p>
          </button>
        ))}
      </div>

      <div className="mt-5 border-t border-indigo-100 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-sm font-black text-slate-900">💡 Try an example</p><p className="mt-1 text-xs text-slate-500">Examples fill the prompt only — your selected AI stays unchanged.</p></div>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          {catalog.examples.map((example) => (
            <button
              key={example.title}
              type="button"
              onClick={() => onExample?.(example)}
              className="min-w-[235px] snap-start rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md md:min-w-0"
            >
              <p className="text-xs font-black text-indigo-700">{example.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{example.description}</p>
              <span className="mt-3 inline-flex rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-bold text-slate-700">Use example →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AIDiscoveryPanel;

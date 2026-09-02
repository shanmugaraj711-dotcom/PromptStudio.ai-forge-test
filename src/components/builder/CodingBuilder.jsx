import React, { useRef, useState } from 'react';

const MAX_REFERENCES = 8;
const MAX_IMAGES = 4;

const quickPills = [
  { label: 'Recreate a UI', template: 'Recreate this layout with pixel-exact styling, retaining CSS tokens and grid behavior: ' },
  { label: 'Improve UX', template: 'Keep the existing product purpose but simplify navigation and user flows: ' },
  { label: 'Add a Feature', template: 'Use the existing UI as context and define the safest implementation path: ' },
];

export default function CodingBuilder({
  idea,
  setIdea,
  images,
  referenceFiles,
  handleFiles,
  removeImage,
  removeFile,
  isPreparing,
  isGenerating,
  error,
  message
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const totalReferences = images.length + referenceFiles.length;

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-2">What do you want to build?</h2>
        <textarea
          rows={4}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          disabled={isGenerating || isPreparing}
          placeholder="Example: This is our existing dashboard. Improve the UX, keep the business logic intact, make mobile navigation easier, and add a search tab without changing the current visual identity."
          className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-slate-900 placeholder:text-slate-400 transition resize-none"
        />
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {quickPills.map((pill) => (
            <button
              key={pill.label}
              type="button"
              onClick={() => setIdea(pill.template)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition"
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-200" />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900">Reference workspace</h2>
          <span className="text-[11px] text-slate-500 font-mono">{totalReferences}/{MAX_REFERENCES} references</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            {images.map((image, index) => (
              <div key={`${image.name}-${index}`} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="truncate text-slate-700">🖼️ {image.name}</span>
                <button type="button" onClick={() => removeImage(index)} className="text-slate-400 hover:text-red-500">×</button>
              </div>
            ))}
            {referenceFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="truncate text-slate-700">{file.kind === 'executable' ? '🛡️' : '📄'} {file.name}</span>
                <button type="button" onClick={() => removeFile(index)} className="text-slate-400 hover:text-red-500">×</button>
              </div>
            ))}
            {totalReferences === 0 && (
              <div className="h-[95px] flex items-center justify-center border border-dashed border-slate-300 rounded-xl text-slate-400 text-xs">
                No files staged
              </div>
            )}
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition ${isDragging ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/50'}`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,.txt,.md,.json,.html,.css,.js,.jsx,.ts,.tsx,.pdf,.doc,.docx,.exe,.msi,.app,.bin"
              onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
              className="hidden"
            />
            <span className="text-xs font-bold text-slate-700">{isPreparing ? 'Inspecting…' : 'Drop screenshots or code'}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Images ≤ 3MB · Files ≤ 5MB</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
        <h3 className="text-sm font-bold text-blue-900 mb-3">What PromptStudio gives your coding AI</h3>
        <div className="space-y-3.5 text-xs">
          {[
            ['Visual facts', 'Layout, hierarchy, spacing, typography, states and interaction clues.'],
            ['Intent', 'What you actually want changed — without inventing hidden requirements.'],
            ['Implementation', 'Components, responsive behavior, constraints and acceptance criteria.'],
          ].map(([title, body]) => (
            <div key={title} className="p-2.5 bg-white rounded-xl border border-blue-100/50 shadow-sm">
              <span className="font-semibold text-slate-900 block">{title}</span>
              <span className="text-slate-600 text-[11px] leading-relaxed">{body}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

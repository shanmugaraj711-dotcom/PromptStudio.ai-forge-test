import React from 'react';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import AIDiscoveryPanel from './AIDiscoveryPanel';
import { CATEGORIES } from '../../constants/categories';

export default function StandardBuilder({
  category,
  setCategory,
  aiModel,
  handleToolSelect,
  handleExample,
  idea,
  setIdea,
  error,
  isGenerating,
  isPreparingImage,
  workflowActive
}) {
  return (
    <>
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
        <p className="text-sm font-black text-indigo-900">1. What are you creating?</p>
        <p className="mt-1 text-xs text-indigo-700">Pick a category to see the right AI tools and real examples for that kind of work.</p>
        <div className="mt-4">
          <Select
            id="category"
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={CATEGORIES.filter((c) => c.id !== 'image' && c.id !== 'coding')}
            disabled={isGenerating || isPreparingImage || workflowActive}
          />
        </div>
      </div>

      <AIDiscoveryPanel
        category={category}
        aiModel={aiModel}
        onToolSelect={handleToolSelect}
        onExample={handleExample}
      />

      <div className="mt-5">
        <TextArea
          id="idea"
          label="Your idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="What do you want AI to create? You can also attach a reference image below."
          rows={6}
          error={error}
          disabled={isGenerating || isPreparingImage}
        />
      </div>
    </>
  );
}

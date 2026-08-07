import SectionHeading from '../../components/common/SectionHeading';
import TextArea from '../../components/ui/TextArea';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import ResultCard from '../Result/ResultCard';
import { usePromptBuilder } from '../../hooks/usePromptBuilder';
import { AI_MODELS } from '../../constants/aiModels';
import { CATEGORIES } from '../../constants/categories';

function PromptBuilder() {
  const {
    idea,
    setIdea,
    aiModel,
    setAiModel,
    category,
    setCategory,
    generatedPrompt,
    error,
    generate,
  } = usePromptBuilder();

  return (
    <section id="prompt-builder" className="bg-gray-50/60 py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="Try it now"
          title="Build your prompt"
          subtitle="Describe your idea and let PromptStudio do the rest."
        />

        <div className="mt-14 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm sm:p-10">
          <TextArea
            id="idea"
            label="Your idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="What do you want AI to create?"
            rows={6}
            error={error}
          />

          <div className="mt-6 rounded-xl bg-blue-50 p-4 border border-blue-100">
            <p className="text-sm font-semibold text-blue-700">💡 Prompt Tip</p>
            <p className="mt-2 text-sm text-gray-700">
              Mention your audience, preferred tone and expected output for even better AI
              results.
            </p>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <Select
              id="aiModel"
              label="AI Model"
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              options={AI_MODELS}
            />
            <Select
              id="category"
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={CATEGORIES}
            />
          </div>

          <div className="mt-8">
            <Button variant="primary" size="lg" onClick={generate} className="w-full sm:w-auto">
              Generate Better Prompt
            </Button>
          </div>
        </div>

        {generatedPrompt && (
          <div className="mt-10">
            <ResultCard prompt={generatedPrompt} />
          </div>
        )}
      </div>
    </section>
  );
}

export default PromptBuilder;

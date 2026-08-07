import { useState } from 'react';
import TextArea from '../../components/ui/TextArea';
import Button from '../../components/ui/Button';
import { copyToClipboard } from '../../utils/copyToClipboard';

function ResultCard({ prompt }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(prompt);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-md sm:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-gray-900">Generated Prompt</h3>
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {copied ? 'Copied!' : 'Copy Prompt'}
        </Button>
      </div>

      <div className="mt-6">
        <TextArea id="generatedPrompt" value={prompt} readOnly rows={12} />
      </div>
    </div>
  );
}

export default ResultCard;

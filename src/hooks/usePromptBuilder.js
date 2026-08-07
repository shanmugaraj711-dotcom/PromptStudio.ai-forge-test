import { useState, useCallback } from 'react';
import { generatePrompt } from '../services/promptGenerator';

export function usePromptBuilder() {
  const [idea, setIdea] = useState('');
  const [aiModel, setAiModel] = useState('chatgpt');
  const [category, setCategory] = useState('writing');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [error, setError] = useState('');

  const generate = useCallback(() => {
    if (!idea.trim()) {
      setError('Please describe what you want AI to create.');
      setGeneratedPrompt('');
      return;
    }
    setError('');
    const prompt = generatePrompt({ idea, aiModel, category });
    setGeneratedPrompt(prompt);
  }, [idea, aiModel, category]);

  const reset = useCallback(() => {
    setIdea('');
    setGeneratedPrompt('');
    setError('');
  }, []);

  return {
    idea,
    setIdea,
    aiModel,
    setAiModel,
    category,
    setCategory,
    generatedPrompt,
    error,
    generate,
    reset,
  };
}

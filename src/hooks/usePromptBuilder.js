import { useState, useCallback } from "react";
import { generatePrompt } from "../services/promptGenerator";
import { useAuth } from "../context/AuthContext";
import { savePrompt } from "../services/promptHistoryService";

export function usePromptBuilder() {
  const { user } = useAuth();

  const [idea, setIdea] = useState("");
  const [aiModel, setAiModel] = useState("chatgpt");
  const [category, setCategory] = useState("writing");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [error, setError] = useState("");

  const generate = useCallback(async () => {
    if (!idea.trim()) {
      setError("Please describe what you want AI to create.");
      setGeneratedPrompt("");
      return;
    }

    if (!user) {
      setError("You must be logged in to generate and save prompts.");
      return;
    }

    setError("");

    try {
      const prompt = generatePrompt({ idea, aiModel, category });
      setGeneratedPrompt(prompt);

      await savePrompt(user.uid, {
        prompt,
        aiModel,
        category,
      });
    } catch (err) {
      console.error("Failed to generate or save prompt:", err);
      setError("Unable to save your prompt. Please try again.");
    }
  }, [idea, aiModel, category, user]);

  const reset = useCallback(() => {
    setIdea("");
    setGeneratedPrompt("");
    setError("");
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

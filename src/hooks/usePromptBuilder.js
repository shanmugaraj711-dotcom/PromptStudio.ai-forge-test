import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getPromptHistory,
  savePrompt,
  deletePrompt
} from "../services/promptHistoryService";

export const usePromptHistory = () => {
  const { user } = useAuth();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const prompts = await getPromptHistory(user.uid);
      setHistory(prompts);
    } catch (err) {
      console.error("Failed to load prompt history:", err);
      setError("Unable to load prompt history.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const addPrompt = async (promptData) => {
    if (!user) {
      throw new Error("You must be logged in.");
    }

    try {
      const id = await savePrompt(user.uid, promptData);

      await loadHistory();

      return id;
    } catch (err) {
      console.error("Failed to save prompt:", err);
      throw err;
    }
  };

  const removePrompt = async (promptId) => {
    if (!user) {
      throw new Error("You must be logged in.");
    }

    try {
      await deletePrompt(user.uid, promptId);

      setHistory((current) =>
        current.filter((item) => item.id !== promptId)
      );
    } catch (err) {
      console.error("Failed to delete prompt:", err);
      throw err;
    }
  };

  return {
    history,
    loading,
    error,
    addPrompt,
    removePrompt,
    refreshHistory: loadHistory
  };
};

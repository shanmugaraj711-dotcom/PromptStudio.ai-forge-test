import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  subscribeToPromptHistory,
  deletePrompt,
} from "../services/promptHistoryService";

export const usePromptHistory = () => {
  const { user } = useAuth();
  const userId = user?.uid || null;
  const [history, setHistory] = useState([]);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return undefined;

    const unsubscribe = subscribeToPromptHistory(
      userId,
      (prompts) => {
        setHistory(prompts);
        setLoadedUserId(userId);
        setError("");
      },
      (err) => {
        console.error("Unable to load prompt history:", err);
        setError("Unable to load prompt history. Please try again shortly.");
        setLoadedUserId(userId);
      }
    );

    return unsubscribe;
  }, [userId]);

  const removePrompt = useCallback(async (id) => {
    if (!userId || !id) return;

    try {
      await deletePrompt(userId, id);
    } catch (err) {
      console.error("Unable to delete prompt history item:", err);
      throw err;
    }
  }, [userId]);

  const hasCurrentHistory = loadedUserId === userId;

  return {
    history: hasCurrentHistory ? history : [],
    loading: Boolean(userId) && !hasCurrentHistory,
    error: hasCurrentHistory ? error : "",
    removePrompt,
  };
};

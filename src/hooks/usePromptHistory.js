import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getPromptHistory, deletePrompt } from "../services/promptHistoryService";

export const usePromptHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    if (!user?.uid) {
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getPromptHistory(user.uid);
      setHistory(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to load prompt history.");
    } finally {
      setLoading(false);
    }
  };

  const removePrompt = async (id) => {
    if (!user?.uid || !id) return;

    try {
      await deletePrompt(user.uid, id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.uid]);

  return { history, loading, error, removePrompt };
};

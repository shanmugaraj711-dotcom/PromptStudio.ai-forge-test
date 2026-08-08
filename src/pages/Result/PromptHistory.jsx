import React from "react";
import { usePromptHistory } from "../../hooks/usePromptHistory";

export default function PromptHistory() {
  const {
    history,
    loading,
    error,
    removePrompt
  } = usePromptHistory();

  const handleDelete = async (id) => {
    try {
      await removePrompt(id);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading your prompt history...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Prompt History
          </h1>

          <p className="mt-2 text-gray-500">
            Your previously generated prompts.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-600">
            {error}
          </div>
        )}

        {history.length === 0 ? (
          <div className="rounded-xl border p-8 text-center">
            <h2 className="text-xl font-semibold">
              No prompts yet
            </h2>

            <p className="mt-2 text-gray-500">
              Your generated prompts will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                        {item.aiModel || "Gemini"}
                      </span>

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {item.category || "General"}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {item.prompt}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: null,
  onChange: null,
  onError: null,
  unsubscribe: vi.fn(),
  subscribeToPromptHistory: vi.fn(),
  deletePrompt: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mocks.auth,
}));

vi.mock("../services/promptHistoryService", () => ({
  subscribeToPromptHistory: mocks.subscribeToPromptHistory,
  deletePrompt: mocks.deletePrompt,
}));

import { usePromptHistory } from "./usePromptHistory";

describe("usePromptHistory", () => {
  beforeEach(() => {
    mocks.auth = { user: { uid: "user-1" } };
    mocks.unsubscribe.mockReset();
    mocks.deletePrompt.mockReset().mockResolvedValue();
    mocks.subscribeToPromptHistory.mockReset().mockImplementation((_uid, onChange, onError) => {
      mocks.onChange = onChange;
      mocks.onError = onError;
      return mocks.unsubscribe;
    });
  });

  it("keeps realtime history available across listener updates and deletes", async () => {
    const { result, unmount } = renderHook(() => usePromptHistory());

    expect(mocks.subscribeToPromptHistory).toHaveBeenCalledWith(
      "user-1",
      expect.any(Function),
      expect.any(Function)
    );

    act(() => {
      mocks.onChange([
        { id: "latest", prompt: "Newest prompt" },
        { id: "older", prompt: "Older prompt" },
      ]);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.history.map((item) => item.id)).toEqual(["latest", "older"]);

    await act(async () => {
      await result.current.removePrompt("latest");
    });
    expect(mocks.deletePrompt).toHaveBeenCalledWith("user-1", "latest");

    unmount();
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(1);
  });
});

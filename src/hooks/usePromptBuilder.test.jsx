import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: null,
  generatePrompt: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mocks.auth,
}));

vi.mock("../services/promptGenerator", () => ({
  generatePrompt: mocks.generatePrompt,
}));

import { usePromptBuilder } from "./usePromptBuilder";

const quota = {
  plan: "free",
  promptsToday: 1,
  lastPromptDate: new Date().toISOString().slice(0, 10),
  quotaVersion: 1,
  dailyLimit: 3,
  remaining: 2,
};

describe("usePromptBuilder", () => {
  beforeEach(() => {
    mocks.generatePrompt.mockReset();
    mocks.auth = {
      user: {
        uid: "user-1",
        getIdToken: vi.fn().mockResolvedValue("id-token"),
      },
      updateQuotaState: vi.fn(),
    };
  });

  it("uses the successful server response for the visible prompt and quota", async () => {
    mocks.generatePrompt.mockResolvedValue({
      prompt: "A server-generated prompt",
      quota,
    });
    const { result } = renderHook(() => usePromptBuilder());

    act(() => {
      result.current.setIdea("Write a thoughtful launch announcement");
    });
    await act(async () => {
      await result.current.generate();
    });

    expect(result.current.generatedPrompt).toBe("A server-generated prompt");
    expect(mocks.auth.updateQuotaState).toHaveBeenCalledWith(quota);
    expect(mocks.generatePrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        idea: "Write a thoughtful launch announcement",
        aiModel: "chatgpt",
        category: "writing",
        idToken: "id-token",
      })
    );
  });

  it("prevents duplicate submissions while a generation is in flight", async () => {
    let resolveGeneration;
    mocks.generatePrompt.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGeneration = resolve;
        })
    );
    const { result } = renderHook(() => usePromptBuilder());
    act(() => {
      result.current.setIdea("Create a product brief");
    });

    let firstAttempt;
    let secondAttempt;
    act(() => {
      firstAttempt = result.current.generate();
      secondAttempt = result.current.generate();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isGenerating).toBe(true);
    expect(mocks.generatePrompt).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveGeneration({ prompt: "Generated", quota });
      await Promise.all([firstAttempt, secondAttempt]);
    });

    expect(result.current.isGenerating).toBe(false);
  });

  it("adopts the server's restored quota when generation fails", async () => {
    const restoredQuota = { ...quota, promptsToday: 0, remaining: 3, quotaVersion: 2 };
    const error = Object.assign(new Error("The AI service could not generate a prompt."), {
      quota: restoredQuota,
    });
    mocks.generatePrompt.mockRejectedValue(error);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => usePromptBuilder());
    act(() => {
      result.current.setIdea("Create a campaign concept");
    });

    await act(async () => {
      await result.current.generate();
    });

    expect(result.current.error).toBe("The AI service could not generate a prompt.");
    expect(mocks.auth.updateQuotaState).toHaveBeenCalledWith(restoredQuota);
  });
});

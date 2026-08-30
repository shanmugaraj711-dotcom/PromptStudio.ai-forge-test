import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { getUtcDateKey } from "../../constants/quota";

const mocks = vi.hoisted(() => ({
  auth: null,
  generatePrompt: vi.fn(),
  fetchRuntimeProductConfig: vi.fn(),
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => mocks.auth,
}));

vi.mock("../../services/promptGenerator", () => ({
  generatePrompt: mocks.generatePrompt,
}));

vi.mock("../../services/runtimeProductConfig", () => ({
  fetchRuntimeProductConfig: mocks.fetchRuntimeProductConfig,
}));

import PromptBuilder from "./PromptBuilder";

describe("PromptBuilder", () => {
  beforeEach(() => {
    mocks.generatePrompt.mockReset();
    mocks.generatePrompt.mockResolvedValue({
      prompt: "A polished prompt returned by the API",
      historyId: "history-1",
      perspectives: [
        { id: "faithful", label: "Faithful Recreation", prompt: "Recreate the requested result faithfully." },
        { id: "production", label: "Professional Production", prompt: "Create a production-ready version of the requested result." },
        { id: "creative", label: "Creative Variation", prompt: "Explore a creative variation while preserving the core intent." },
      ],
      intelligence: {
        intent: "Create a polished onboarding email",
        outputType: "writing",
        assumptions: [],
        missing: [],
        recommendations: [],
      },
      quota: {
        plan: "free",
        promptsToday: 1,
        lastPromptDate: getUtcDateKey(),
        quotaVersion: 1,
        dailyLimit: 3,
        remaining: 2,
      },
      creditsRemaining: 10,
      creditCost: 0,
    });
    mocks.fetchRuntimeProductConfig.mockReset();
    mocks.fetchRuntimeProductConfig.mockResolvedValue({
      plans: {
        free: { dailyPromptLimit: 3 },
      },
      creditCosts: {
        standardGeneration: 2,
        referenceImageAnalysis: 5,
      },
    });
    mocks.auth = {
      user: {
        uid: "user-1",
        getIdToken: vi.fn().mockResolvedValue("id-token"),
      },
      plan: "free",
      promptsToday: 0,
      lastPromptDate: getUtcDateKey(),
      updateQuotaState: vi.fn(),
    };
    window.history.pushState({}, "", "/builder");
  });

  it("renders the generated result below the builder without navigating away", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/builder"]}>
        <PromptBuilder />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Your idea"), "Plan a friendly onboarding email");
    await user.click(screen.getByRole("button", { name: "Generate Better Prompt" }));

    expect(await screen.findByText("Generated prompt")).toBeInTheDocument();
    expect(screen.getByDisplayValue("A polished prompt returned by the API")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/builder");
    expect(screen.getByText("3 / 3 prompts remaining today")).toBeInTheDocument();
  });
});

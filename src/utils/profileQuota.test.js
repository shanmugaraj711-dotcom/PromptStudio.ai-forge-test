import { describe, expect, it } from "vitest";
import { createQuotaState, getUtcDateKey } from "../constants/quota";
import {
  isQuotaAtLeastAsNew,
  mergeProfileWithQuota,
  quotaFromProfile,
} from "./profileQuota";

describe("profile quota synchronization", () => {
  it("keeps a newer API quota when an older Firestore snapshot arrives", () => {
    const today = getUtcDateKey();
    const authoritativeQuota = createQuotaState({
      plan: "free",
      promptsToday: 1,
      lastPromptDate: today,
      quotaVersion: 4,
    });
    const staleProfile = {
      name: "Ada",
      plan: "free",
      promptsToday: 0,
      lastPromptDate: today,
      quotaVersion: 3,
    };

    expect(isQuotaAtLeastAsNew(quotaFromProfile(staleProfile), authoritativeQuota)).toBe(false);
    expect(mergeProfileWithQuota(staleProfile, authoritativeQuota)).toMatchObject({
      name: "Ada",
      promptsToday: 1,
      quotaVersion: 4,
    });
  });
});

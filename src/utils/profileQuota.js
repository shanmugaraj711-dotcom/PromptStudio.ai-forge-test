import { createQuotaState } from "../constants/quota";

export const quotaFromProfile = (profile) => createQuotaState(profile || {});

export const mergeProfileWithQuota = (profile, quota) => ({
  ...(profile || {}),
  plan: quota.plan,
  promptsToday: quota.promptsToday,
  lastPromptDate: quota.lastPromptDate,
  quotaVersion: quota.quotaVersion,
});

export const isQuotaAtLeastAsNew = (candidate, knownQuota) =>
  candidate.quotaVersion >= knownQuota.quotaVersion;

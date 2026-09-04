const REPO = "shanmugaraj711-dotcom/PromptStudio.ai";
const BUILD_WORKFLOW = "apk-forge-build.yml";
const BRANCH = "forge/apk-forge";
const API = "https://api.github.com";

const token = () => String(process.env.FORGE_GITHUB_TOKEN || "").trim();

const githubRequest = async (path, options = {}) => {
  const auth = token();
  if (!auth) {
    const error = new Error("GitHub Forge automation is not configured.");
    error.status = 503;
    error.code = "forge_github_not_configured";
    throw error;
  }
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${auth}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!response.ok) {
    const error = new Error(body?.message || `GitHub request failed (${response.status}).`);
    error.status = response.status >= 500 ? 502 : response.status;
    error.code = "forge_github_request_failed";
    throw error;
  }
  return body;
};

export const dispatchForgeBuild = async ({ forgeRequestId, buildId, appName, forgeWebOrigin, packageId, versionName, versionCode }) => {
  const inputs = {
    forge_request_id: String(forgeRequestId || ""),
    build_id: String(buildId || ""),
    app_name: String(appName || "PromptStudio AI"),
    forge_web_origin: String(forgeWebOrigin || ""),
    package_id: String(packageId || "in.promptstudio.ai"),
    version_name: String(versionName || "0.1.0"),
    version_code: String(versionCode || "1"),
  };
  if (!inputs.forge_request_id || !inputs.build_id || !inputs.forge_web_origin) {
    const error = new Error("Forge workflow dispatch inputs are incomplete.");
    error.status = 500;
    error.code = "forge_dispatch_invalid_inputs";
    throw error;
  }

  await githubRequest(`/repos/${REPO}/actions/workflows/${encodeURIComponent(BUILD_WORKFLOW)}/dispatches`, {
    method: "POST",
    body: JSON.stringify({ ref: BRANCH, inputs }),
    headers: { "Content-Type": "application/json" },
  });
  return { accepted: true, workflow: BUILD_WORKFLOW, branch: BRANCH, buildId };
};

export const listForgeBuildRuns = async ({ forgeRequestId, buildId }) => {
  const query = new URLSearchParams({ event: "workflow_dispatch", branch: BRANCH, per_page: "30" });
  const data = await githubRequest(`/repos/${REPO}/actions/runs?${query.toString()}`);
  const runs = Array.isArray(data?.workflow_runs) ? data.workflow_runs : [];
  return runs.filter((run) => {
    if (run?.path !== `.github/workflows/${BUILD_WORKFLOW}`) return false;
    const name = String(run?.name || "");
    return (forgeRequestId && name.includes(String(forgeRequestId))) || (buildId && name.includes(String(buildId)));
  });
};

export const listForgeArtifacts = async (runId) => {
  const data = await githubRequest(`/repos/${REPO}/actions/runs/${encodeURIComponent(runId)}/artifacts?per_page=100`);
  return Array.isArray(data?.artifacts) ? data.artifacts : [];
};

export const getForgeArtifact = async (artifactId) => githubRequest(`/repos/${REPO}/actions/artifacts/${encodeURIComponent(artifactId)}`);

export const getForgeBuildWorkflow = () => ({ workflow: BUILD_WORKFLOW, branch: BRANCH });

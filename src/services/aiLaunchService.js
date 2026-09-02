import { copyToClipboard } from '../utils/copyToClipboard';

export const AI_LAUNCH_TARGETS = Object.freeze([
  { id: 'cursor', label: 'Cursor', url: 'https://cursor.com' },
  { id: 'claude-code', label: 'Claude Code', url: 'https://claude.ai/new' },
  { id: 'chatgpt', label: 'ChatGPT', url: 'https://chatgpt.com/' },
  { id: 'gemini', label: 'Gemini', url: 'https://gemini.google.com/app' },
  { id: 'copilot', label: 'GitHub Copilot', url: 'https://github.com/features/copilot' },
  { id: 'lovable', label: 'Lovable', url: 'https://lovable.dev' },
  { id: 'replit', label: 'Replit', url: 'https://replit.com' },
  { id: 'v0', label: 'v0', url: 'https://v0.dev' },
  { id: 'windsurf', label: 'Windsurf', url: 'https://windsurf.com' },
  { id: 'bolt', label: 'Bolt.new', url: 'https://bolt.new' },
  { id: 'cline', label: 'Cline', url: 'https://cline.bot' },
  { id: 'grok', label: 'Grok', url: 'https://grok.com/' },
]);

export async function launchPromptInAI(prompt, targetId) {
  if (!prompt || !targetId) {
    return { success: false, reason: 'missing_prompt_or_target' };
  }

  const target = AI_LAUNCH_TARGETS.find((item) => item.id === targetId);
  if (!target) {
    return { success: false, reason: 'unknown_target' };
  }

  const copied = await copyToClipboard(prompt);
  if (!copied) {
    return { success: false, reason: 'clipboard_failed' };
  }

  const popup = window.open(target.url, '_blank', 'noopener,noreferrer');
  if (!popup) {
    return { success: false, reason: 'popup_blocked' };
  }

  return { success: true, target: target.id };
}

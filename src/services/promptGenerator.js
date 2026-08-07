const MODEL_LABELS = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  grok: 'Grok',
};

const CATEGORY_ROLE = {
  writing: 'professional writer and editor',
  coding: 'senior software engineer',
  image: 'expert AI image prompt designer',
  marketing: 'senior marketing strategist',
  business: 'experienced business consultant',
};

/**
 * Generates a structured, professional prompt from a simple user idea.
 * Sections: Role, Objective, Context, Requirements, Output Format, Quality Check.
 */
export function generatePrompt({ idea, aiModel, category }) {
  const modelLabel = MODEL_LABELS[aiModel] || 'AI Assistant';
  const role = CATEGORY_ROLE[category] || 'expert';

  return `# ROLE
Act as a world-class ${role} using ${modelLabel}.

# OBJECTIVE
${idea}

# CONTEXT
The user wants the highest possible quality output.
Think step-by-step before answering.

# REQUIREMENTS
- Be accurate.
- Be practical.
- Avoid generic answers.
- Use professional formatting.
- Ask for clarification only if absolutely required.

# OUTPUT FORMAT
Return the final answer using headings, bullet points and examples where useful.

# QUALITY CHECK
Before responding, verify that your answer fully satisfies the objective.`;
}

# PromptStudio Image → Prompt Plugin Contract

## Goal
Make PromptStudio's differentiator available from an external creator workflow without rebuilding the PromptStudio application.

## v1 action
**Analyze Image**

Input:
- reference image
- optional user instruction
- target AI model
- category
- request id / idempotency key

Output:
- primary prompt
- exactly three perspectives
- intent
- output type
- assumptions
- missing information
- recommendations

## Rules
- Plugin never receives Firebase Admin credentials.
- Plugin never writes directly to Firestore.
- Plugin never manages credits locally.
- Plugin never verifies payments locally.
- Plugin must surface server error codes safely.
- Plugin requests must be authenticated and rate-limited.

## UX
Keep the plugin focused:
1. Select/attach image.
2. Choose target AI if needed.
3. Generate.
4. Copy prompt.
5. Open/create in the user's preferred AI tool.

Do not initially reproduce the entire PromptStudio dashboard inside the plugin.

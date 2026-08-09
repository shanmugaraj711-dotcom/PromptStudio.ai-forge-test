# PromptStudio AI

Get better results from any AI.

PromptStudio AI transforms simple ideas into professional, structured prompts optimized for ChatGPT, Claude, Gemini, and Grok.

## Tech Stack

- React 18, Vite, and Tailwind CSS
- React Router DOM
- Firebase Authentication and Firestore
- Vercel serverless generation API using the official Gemini SDK
- JavaScript (no TypeScript)

## Getting Started

```bash
npm install
npm run dev
```

Open the local URL printed in your terminal (usually http://localhost:5173).

For the complete generation flow locally, use `vercel dev` after configuring the server environment variables below. The Vite development server serves the client only, while Vercel serves both the SPA and `/api/generate-prompt`.

## Build and Test

```bash
npm test
npm run build
npm run lint
```

## Production Configuration

The browser uses the existing `VITE_FIREBASE_*` configuration variables. Keep the following values server-only in Vercel (never prefix them with `VITE_`):

```text
GEMINI_API_KEY
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
GEMINI_MODEL               # optional; defaults to gemini-2.5-flash
```

Deploy [firestore.rules](firestore.rules) to the Firebase project before enabling generation in production. The Vercel routing configuration preserves `/api/*` and falls back to the React SPA for direct links, refreshes, trailing slashes, and query strings.

## Project Structure

```text
api/                       trusted Vercel generation endpoint
src/
  components/              shared UI, layout, and route guard components
  constants/               models, categories, pricing, and shared quota policy
  context/                 Firebase auth/profile/quota synchronization
  hooks/                   builder state and realtime prompt-history hooks
  pages/                   landing, auth, dashboard, builder, result, and account views
  services/                browser API and Firestore history services
  test/                    shared test setup
  utils/                   clipboard and quota synchronization helpers
firestore.rules            owner-only Firestore security rules
vercel.json                API-safe SPA routing
```

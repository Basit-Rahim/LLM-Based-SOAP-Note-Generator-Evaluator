## Implementation Overview

This project is a Next.js app that generates and evaluates SOAP notes from clinical transcripts.

- **Frontend (App Router)**
  - `app/page.tsx` – Upload transcript, choose model, and start SOAP note generation.
  - `app/results/page.tsx` – Shows uploaded transcript and generated SOAP note side by side, lets you upload a reference SOAP note, and triggers evaluation.
  - `app/analysis/page.tsx` – Displays evaluation analysis with a radar chart (ROUGE‑1, BLEU‑1, combined score), model details, token counts (input/output), and the three texts: generated SOAP, reference SOAP, and transcript.
  - State is persisted across pages using `localStorage` keys such as `soap_transcript`, `soap_reference`, `soap_results`, and `soap_metrics`.

- **Generation API**
  - `app/api/generate/route.ts` (POST `/api/generate`).
  - Accepts a JSON payload with `transcript` and selected `model` (OpenAI or Gemini).
  - Builds a structured prompt that asks the model to produce a complete SOAP note in four sections (**S – Subjective**, **O – Objective**, **A – Assessment**, **P – Plan`).
  - Calls either:
    - **Gemini** via `https://generativelanguage.googleapis.com/v1/models/{model}:generateContent`, using `GOOGLE_API_KEY`, or
    - **OpenAI Chat Completions** via `https://api.openai.com/v1/chat/completions`, using `OPENAI_API_KEY`.
  - Returns `{ message, modelUsed }`, where `message` is the generated SOAP note (with `**...**` used for bold headings).

- **Evaluation API**
  - `app/api/evaluate/route.ts` (POST `/api/evaluate`).
  - Accepts a JSON payload with `reference` (reference SOAP note) and `candidates` (generated notes).
  - Uses simple tokenization to compute:
    - **ROUGE‑1** (overlap‑based F1 score),
    - **BLEU‑1** (unigram precision with brevity penalty),
    - **Combined** score = average of ROUGE‑1 and BLEU‑1.
  - Also computes and returns per‑candidate token counts:
    - `tokenInfo.referenceTokens` (input tokens),
    - `tokenInfo.candidateTokens` (output tokens).
  - Response shape: `{ metrics: [{ id, label, rouge1, bleu1, combined, tokenInfo }] }`.

- **Downloadable Results**
  - The analysis page can export a JSON file summarizing the run: timestamps, model/provider, transcript, reference SOAP, generated SOAP, evaluation scores, and token information.

## Running on Vercel

This app is designed to run as a standard Next.js App Router project on Vercel.

1. **Environment variables**
   - Configure these in your Vercel project settings (Dashboard → Project → Settings → Environment Variables):
     - `OPENAI_API_KEY` – for OpenAI models (if you want OpenAI generation).
     - `GOOGLE_API_KEY` – for Gemini models (if you want Gemini generation).

2. **Deploying**
   - Push this repository to GitHub, GitLab, or Bitbucket.
   - In Vercel, create a new project and import this repository.
   - Vercel will detect **Next.js** automatically and use the default build settings:
     - **Build command**: `npm run build`
     - **Install command**: `npm install`
     - **Output**: Next.js app (no manual output path configuration needed).

3. **Runtime behavior on Vercel**
   - API routes `app/api/generate/route.ts` and `app/api/evaluate/route.ts` run as Vercel Serverless Functions.
   - Frontend pages (`/`, `/results`, `/analysis`) are served as Next.js routes and use the same logic as in local development.
   - As long as the environment variables are set correctly, the deployed app on Vercel will be able to generate SOAP notes, evaluate them, and show/download the analysis without additional configuration.


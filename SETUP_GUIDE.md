# 🚀 Ask4i (RAG-4i) — Zero-Dependency Self-Hosting & Setup Guide

This guide walks you through setting up, configuring, and running your own **100% isolated, self-contained** instance of Ask4i without using or depending on any of the author's resources, infrastructure, or API keys.

---

## 🔒 Zero Shared Resources Guarantee

- **Completely Independent:** When you clone this repository, you point it to your own Supabase project, your own vector embeddings account, and your own LLM provider.
- **No Incurred Costs to Others:** All requests, database storage, embeddings, and LLM inference run exclusively on your own accounts and credentials.
- **Zero Committed Secrets:** The codebase contains 0 hardcoded API keys, tokens, or credentials.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed locally:
1. **[Git](https://git-scm.com/)**
2. **[Node.js](https://nodejs.org/)** (v18.17+ or v20+) and `npm`
3. **[Deno](https://deno.land/)** (v1.40+) — required for edge function tests and local execution
4. **[Supabase CLI](https://supabase.com/docs/guides/cli)**:
   ```bash
   # macOS / Linux (Homebrew)
   brew install supabase/tap/supabase

   # Windows (Scoop or NPM)
   npm install -g supabase
   ```

---

## 🛠️ Step 1: Create Your Free Supabase Project

Ask4i runs on Supabase (PostgreSQL with `pgvector`, Auth, Storage, and Edge Functions).

1. Go to **[database.new](https://database.new)** (or log in to [supabase.com](https://supabase.com)) and create a new project.
2. Choose your preferred region and database password.
3. Once provisioned, navigate to **Project Settings → API** and copy:
   - **Project URL** (e.g. `https://xyzcompany.supabase.co`)
   - **Project Reference ID** (e.g. `xyzcompany`)
   - **Project API Keys → `anon` `public` key**

---

## 📦 Step 2: Push Database Schema & Migrations

All 14 database migrations are located in `supabase/migrations/`. These create the tables (`tenants`, `memberships`, `documents`, `chunks`, `conversations`, `messages`), enable `pgvector`, apply Row Level Security (RLS) policies, and install data integrity triggers.

1. Authenticate the Supabase CLI:
   ```bash
   supabase login
   ```
2. Link the repository to your new Supabase project:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
3. Push all database migrations:
   ```bash
   supabase db push
   ```
4. **Verify Storage Bucket:**
   In your Supabase Dashboard, go to **Storage → Buckets**. Ensure the bucket `company-documents` exists and is marked **Private** (if not created automatically by migrations, click "New Bucket", name it `company-documents`, and toggle off "Public").

---

## 🔑 Step 3: Obtain Embedding & LLM API Keys

Ask4i separates embeddings generation from answering to achieve zero-GPU serverless operation at minimal cost.

### 1. Vector Embeddings (Jina AI or Voyage AI)
- **Jina AI (Recommended for quick start):**
  - Go to **[jina.ai](https://jina.ai)** and sign up for a free API key (includes 1,000,000 free tokens).
  - Key format: `jina_xxxxxxxxxxxxxxxxxxxxxxxx`
- **Voyage AI (Alternative):**
  - Go to **[dash.voyageai.com](https://dash.voyageai.com)** and create an API key (`voyage-4` 1024-dimension vectors).

### 2. LLM Inference (AWS Bedrock Mantle / Anthropic)
- Ask4i's answering pipeline connects server-side via `MANTLE_API_KEY` and `ANSWER_MODEL_ID`.
- Obtain an API key and model ID from your inference gateway or Amazon Bedrock / Mantle provider:
  - Example Model ID: `anthropic.claude-3-5-sonnet-20241022-v2:0`

---

## 🔐 Step 4: Configure Supabase Edge Function Secrets

Edge Functions never expose private provider keys to the browser. Instead, secrets are stored in your project's secure server-side vault.

1. Generate a secure random string for the background cron worker:
   ```bash
   # On Linux/macOS/Git Bash:
   openssl rand -hex 32
   # Or on Windows PowerShell:
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
   ```

2. Set the secrets on your linked Supabase project using the CLI:
   ```bash
   supabase secrets set \
     WORKER_CRON_KEY="<your-generated-cron-key>" \
     JINA_API_KEY="<your-jina-api-key>" \
     MANTLE_API_KEY="<your-llm-api-key>" \
     ANSWER_MODEL_ID="anthropic.claude-3-5-sonnet-20241022-v2:0" \
     PROVIDER_KILL_SWITCH="false" \
     CORRECTNESS_CHECKER_ENABLED="false"
   ```

*(Note: `SUPABASE_URL` and `SUPABASE_ANON_KEY` are automatically provided by the Supabase Edge runtime).*

---

## 🚀 Step 5: Deploy the Edge Functions

Deploy the 6 core serverless functions to your Supabase project:

```bash
supabase functions deploy ask --no-verify-jwt
supabase functions deploy query-chunks --no-verify-jwt
supabase functions deploy ingest-pdf --no-verify-jwt
supabase functions deploy embed-worker --no-verify-jwt
supabase functions deploy storage-cleanup --no-verify-jwt
supabase functions deploy edit-message --no-verify-jwt
```

> **Why `--no-verify-jwt`?** As designed in Ask4i's defense-in-depth architecture, JWT validation and caller tenancy membership are verified explicitly inside function code (`auth.getUser()` and PostgreSQL RLS queries) rather than failing invisibly at the gateway level.

---

## 👤 Step 6: Create Your Admin User & Workspace Tenant

Ask4i is strictly multi-tenant with fail-closed RLS. An authenticated user must be a member of a tenant to query documents.

1. In your Supabase Dashboard, go to **Authentication → Users** and click **Add User** (Create user with an email and password, e.g. `admin@mycompany.com`).
2. Go to **SQL Editor** in the Supabase Dashboard and run the following bootstrap script (replace `admin@mycompany.com` with your user's email):

```sql
-- 1. Create your initial organization workspace tenant
INSERT INTO public.tenants (id, name)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'My Enterprise Workspace')
ON CONFLICT (id) DO NOTHING;

-- 2. Link your user account as owner/admin of this tenant
INSERT INTO public.memberships (tenant_id, user_id, role)
SELECT 
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
  id, 
  'owner'
FROM auth.users
WHERE email = 'admin@mycompany.com'
ON CONFLICT (tenant_id, user_id) DO NOTHING;
```

---

## 💻 Step 7: Configure & Launch the Web Frontend

The frontend is a Next.js 14 application located in the `web/` directory.

1. Navigate to the `web/` folder:
   ```bash
   cd web
   ```
2. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
3. Open `web/.env.local` and enter your public Supabase credentials:
   ```ini
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...<your-public-anon-key>
   ```
4. Install dependencies and start the local development server:
   ```bash
   npm install
   npm run dev
   ```
5. Open **[http://localhost:3000](http://localhost:3000)** in your browser!
   - Sign in with your created email and password.
   - Navigate to `/ask` to access your workspace.

---

## ✅ Step 8: Verify End-to-End Pipeline

To confirm your instance is 100% functional without errors:
1. **Upload a PDF:** In the workspace sidebar, click **Upload Document** and upload any sample PDF.
2. **Inspect Ingestion:** The `ingest-pdf` function will parse pages and extract text chunks. `embed-worker` will embed the chunks into `pgvector`.
3. **Ask a Question:** Ask a specific question answered by the PDF. Observe:
   - Real-time semantic retrieval via `query-chunks` with RRF fusion.
   - `verifyEvidence` gate passing.
   - Grounded LLM synthesis with citations (`[S1]`, `[S2]`).
4. **Test Honest Refusal:** Ask an unanswerable question. Notice the engine outputs an honest refusal with zero hallucinations.

---

## 🛡️ Security & Operational Checklist

| Item | Action | Status |
| :--- | :--- | :---: |
| **No secrets in frontend** | `web/.env.local` contains only public URL and anon key | ✅ |
| **Edge Vault encrypted** | Private API keys (`MANTLE_API_KEY`, `JINA_API_KEY`) only in Supabase Secrets | ✅ |
| **Storage Private** | `company-documents` bucket has public access disabled | ✅ |
| **RLS Active** | All tables require membership authorization | ✅ |
| **Kill Switch** | Emergency spend shutoff available via `supabase secrets set PROVIDER_KILL_SWITCH=true` | ✅ |

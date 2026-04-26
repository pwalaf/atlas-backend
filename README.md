# Atlas Backend — Node + Express + Prisma + Neon (Render-ready)

A self-contained REST API that mirrors the Atlas Admin contract used by the
Replit app. Drop this folder into its own Git repo and deploy it on
[Render](https://render.com) with a [Neon](https://neon.tech) Postgres database.

---

## Endpoints

Base path: `/api`

| Resource     | Endpoints                                                        |
| ------------ | ---------------------------------------------------------------- |
| Health       | `GET /healthz`                                                   |
| Students     | `GET POST /students` · `PUT DELETE /students/:id`                |
| Sessions     | `GET POST /sessions` · `PUT DELETE /sessions/:id`                |
| Transactions | `GET POST /transactions` · `PUT DELETE /transactions/:id`        |
| Goals        | `GET PUT /goals` (singleton)                                     |
| FX rates     | `GET PUT /fx` · `DELETE /fx/:currency`                           |
| Products     | `GET POST /products` · `PUT DELETE /products/:id`                |
| Finance      | `GET /finance/{overview,timeseries,by-source,projection}`        |
| Schema       | `GET /schema/:resource` (students, sessions, transactions, products) |

The JSON shapes are identical to the Drizzle/Express service in
`artifacts/api-server`. The Replit admin panel works against this backend
without any code change — set `setBaseUrl("https://your-backend.onrender.com")`
in the admin's `main.tsx` to point at this server.

---

## Deploy on Render with Neon (5 steps)

### 1. Create a Neon database

1. Sign up at <https://neon.tech>.
2. Create a new project (e.g. `atlas`).
3. In the project dashboard, open **Connection Details**.
4. Copy the **pooled** connection string. It looks like:
   `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/atlas?sslmode=require`

### 2. Push this folder to a Git repo

```bash
cd deploy/render-backend
git init
git add .
git commit -m "Initial commit"
git remote add origin git@github.com:<you>/atlas-backend.git
git push -u origin main
```

### 3. Create the service on Render

- Go to <https://dashboard.render.com>, click **New → Blueprint**, select your repo.
- Render reads `render.yaml` and proposes a service named **atlas-backend**.
- Click **Apply**.

### 4. Add the environment variables

In the Render service **Environment** tab, set:

| Key            | Value                                                          |
| -------------- | -------------------------------------------------------------- |
| `DATABASE_URL` | The Neon pooled connection string from step 1                  |
| `CORS_ORIGIN`  | Your admin URL, e.g. `https://your-admin.replit.app` (or `*`)  |

Save → Render redeploys automatically.

### 5. Seed the FX rates and goals (one-off)

In the Render service **Shell** tab, run:

```bash
npx tsx prisma/seed.ts
```

Done. Hit `https://<your-service>.onrender.com/api/healthz` to verify.

---

## Local development

```bash
cp .env.example .env
# edit .env with your Neon DATABASE_URL
npm install
npm run prisma:push   # create/update tables in Neon
npm run prisma:seed   # insert FX rates and default goals
npm run dev           # http://localhost:3000
```

---

## Pointing the Replit admin at this backend

In `artifacts/admin/src/main.tsx`, before `createRoot`:

```ts
import { setBaseUrl } from "@workspace/api-client-react";
setBaseUrl("https://atlas-backend.onrender.com");
```

The offline-first sync layer in the admin will work transparently against
this remote backend — pending mutations are queued in `localStorage` and
replayed when the browser reconnects.

---

## Notes

- Neon free tier sleeps after inactivity; the first request after a cold
  start can take a few seconds. Render's free plan does the same. The admin's
  offline cache makes both invisible to the user.
- Prisma generates the client during `npm install` (via `postinstall`) and
  again at build time, so the deploy works without a manual codegen step.
- The schema is intentionally identical (column names + types) to the Drizzle
  model so you can switch transports without a data migration.
